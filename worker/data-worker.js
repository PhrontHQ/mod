const   Worker = require("./worker").Worker,
        Identity = require("../data/model/identity").Identity,
        IdentityDescriptor = require("../data/model/identity.mjson").montageObject,
        DataOrdering = require("data/model/data-ordering").DataOrdering,
        DESCENDING = DataOrdering.DESCENDING,    
        AuthorizationPolicy = require("../data/service/authorization-policy").AuthorizationPolicy,
        DataOperation = require("../data/service/data-operation").DataOperation,
        OperationCoordinator = require("../data/service/operation-coordinator").OperationCoordinator,
        Deserializer = require("../core/serialization/deserializer/montage-deserializer").MontageDeserializer,
        MontageSerializer = require("../core/serialization/serializer/montage-serializer").MontageSerializer,
        Range = require("../core/range").Range,
        // Montage = (require)("mod/core/core").Montage,
        currentEnvironment = require("../core/environment").currentEnvironment,
        WebSocketSession = require("../data/model/app/web-socket-session").WebSocketSession,
        WebSocketSessionObjectDescriptor = require("../data/model/app/web-socket-session.mjson").montageObject,
        WebSocketSessionConnection = require("../data/model/app/web-socket-session-connection").WebSocketSessionConnection,
        WebSocketSessionConnectionObjectDescriptor = require("../data/model/app/web-socket-session-connection.mjson").montageObject,
        util = require('util');

const successfullResponse = {
    statusCode: 200,
    body: 'Success'
};
const successfullConnectResponse = {
    statusCode: 200,
    body: 'Connected'
};

const failedResponse = (statusCode, error) => ({
        statusCode,
        body: error
    });


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * A Worker is any object that can handle messages from a serverless function
 * to implement custom businsess logic
 *
 * @class DataWorker
 * @extends Worker
 */
exports.DataWorker = Worker.specialize( /** @lends DataWorker.prototype */{
    constructor: {
        value: function DataWorker() {
            this.super();

            this._serializer = new MontageSerializer().initWithRequire(this.require);

        }
    },
    operationCoordinator: {
        value: undefined
    },

    _deserializer: {
        value: undefined
    },
    deserializer: {
        get: function() {
            return this._deserializer || (this._deserializer = new Deserializer());
        }
    },

    _mainService: {
        value: undefined
    },
    /*
        In the context of a worker this is expected to be triggered only once
    */
    mainService: {
        get: function() {
            return this._mainService;
        },
        set: function(value) {

            if(value && this._mainService !== value) {

                this._mainService = value;

                // if(!value.handlesType(IdentityDescriptor)) {
                //     value.types.push(IdentityDescriptor);
                // }
                // if(!value.handlesType(WebSocketSessionObjectDescriptor)) {
                //     value.types.push(WebSocketSessionObjectDescriptor);
                // }
                // if(!value.handlesType(WebSocketSessionConnectionObjectDescriptor)) {
                //     value.types.push(WebSocketSessionConnectionObjectDescriptor);
                // }

                if(!this.operationCoordinator) {
                    this.operationCoordinator = new OperationCoordinator(this);
                }

                this._mainService.addEventListener(DataOperation.Type.AuthorizeConnectionFailedOperation,this,false);
                this._mainService.addEventListener(DataOperation.Type.AuthorizeConnectionCompletedOperation,this,false);
            }

        }
    },

    /**
     * Parse HTTP accept-language header of the user browser.
     *
     * @param {string} acceptLanguageHeader The string of accept-language header
     * @return {Array} Array of language-quality pairs
     */
    parsedAcceptLanguageHeader: {
        value: function(acceptLanguageHeader, languageOnly) {
            var pairs = acceptLanguageHeader.split(','),
                result = [];

            for (var i=0, countI = pairs.length, pair; (i<countI); i++) {
                pair = pairs[i].split(';');
                if (pair.length == 1) {
                    languageOnly
                        ? result.push( pair[0] )
                        : result.push( [pair[0], '1'] );
                }
                else {
                    languageOnly
                        ? result.push( pair[0] )
                        : result.push( [pair[0], pair[1].split('=')[1] ] );
                }
            }
            return result;
        }
    },

    /**
     * Only the event from connect has headers informations
     *
     * Shouldn't we move that on the DataOperation itself as context instead?
     *
     * @class DataWorker
     * @extends Worker
     */
    setEnvironmentFromEvent: {
        value: function(event, context) {
            var stage = event.requestContext.stage,
                eventHeaders = event.headers,
                acceptLanguage = (eventHeaders && (eventHeaders["Accept-Language"]|| eventHeaders["accept-language"])),
                eventHeaderUserIp = (eventHeaders && eventHeaders["x-forwarded-for"]?.split(",")[0].trim()),
                userAgent = (eventHeaders && (eventHeaders["User-Agent"] || eventHeaders["user-agent"])) || event.requestContext.identity.userAgent,
                userIp = event.requestContext.identity.sourceIp;

                /*
                    "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
                    or
                    'Accept-Language: en;q=0.8,es;q=0.6,fr;q=0.4'

                    TODO
                    multiValueHeaders["Accept-Language"] is  [ 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7' ]

                    so we can save some parsing there.
                */
                languages = acceptLanguage ? this.parsedAcceptLanguageHeader(acceptLanguage,true) : null;

            //console.log("userAgent: ",userAgent);

            if(eventHeaderUserIp && eventHeaderUserIp !== userIp) {
                console.warn("eventHeaderUserIp is "+eventHeaderUserIp+" and userIp is "+userIp);
            }

            currentEnvironment.stage = stage;
            currentEnvironment.userAgent = userAgent;
            if(languages) {
                currentEnvironment.languages = languages;
            }
            currentEnvironment.userAgentIPAddress = userIp;
            currentEnvironment.clientId = event.requestContext.connectionId;
            currentEnvironment.gatewayRequestId = context.awsRequestId;
            currentEnvironment.lambdaRequestId = event.requestContext.requestId;

            //WIP
            //currentEnvironment.session = event.requestContext.requestId;
            //console.log("setEnvironmentFromEvent: ",event, context);


            //console.log(currentEnvironment.gatewayRequestId+ ": currentEnvironment: ",currentEnvironment);

            // if(stage === "mod") {
            //     console.log("setEnvironmentFromEvent: ",event, context);
            // }

            // console.warn("environment set from Event: ", currentEnvironment);


        }
    },

    handleAuthorize: {
        value: async function(event, context, callback) {

            // await sleep(6000)

            // console.log("event: ", event);
            // console.log("event?.queryStringParameters: ", event?.queryStringParameters);
            // console.log("event?.queryStringParameters?.session: ", event?.queryStringParameters?.session);

            var isModStage = event.requestContext.stage === "mod",
                base64EncodedSerializedSession = event.queryStringParameters?.session,
                serializedSession,
                sessionPromise, authorizeConnectionOperation,
                self = this;

            // if(isModStage) {
            //     console.log("handleAuthorize: event:", event, " context:", context, "callback: ", callback);
            // }


            if(base64EncodedSerializedSession) {
                serializedSession = Buffer.from(base64EncodedSerializedSession, 'base64').toString();
                this.deserializer.init(serializedSession, this.require, /*objectRequires*/undefined, /*module*/undefined, /*isSync*/false);
                try {
                    sessionPromise = this.deserializer.deserializeObject();
                } catch (error) {
                    /*
                        If there's a serializedSession and we can't deserialize it, we're the ones triggering the fail.
                    */
                    console.error("Error: ",error, " Deserializing ",serializedSession);

                    return Promise.resolve(this.responseForEventAuthorization(event, null, false, /*responseContext*/error));

                }

            } else {
                sessionPromise = Promise.resolve(null);
            }

            return sessionPromise.then(function(session) {

                console.log("DataWorker handleAuthorize with session:",session);
                var identity = session?.identity,
                    identityObjectDescriptor,
                    webSocketSessionObjectDescriptor;

                if(!identity) {
                    /*
                        Without any info what to do? If it's a storefront kind of app, anonymous users should always connect, if it's about something more personal, we may want to refuse. MainService has AuthorizationPolicy and should be configured for that, so ideally we don't want to make that decision here. if it's onConnect, and we got nothing, we refuse connection.

                        So we use an Anonymous identity singleton
                    */
                    console.log("DataWorker handleAuthorize with no identity. mainService.authorizationPolicy is ",self.mainService.authorizationPolicy);

                    if(self.mainService.authorizationPolicy === AuthorizationPolicy.OnConnect) {
                        var authorizeConnectionFailedOperation = new DataOperation();

                        authorizeConnectionFailedOperation.id = event.requestContext.requestId;
                        authorizeConnectionFailedOperation.type = DataOperation.Type.AuthorizeConnectionFailedOperation;
                        authorizeConnectionFailedOperation.timeStamp = event.requestContext.connectedAt;
                        authorizeConnectionFailedOperation.target = identityObjectDescriptor;
                        authorizeConnectionFailedOperation.data = new Error("No identity found in session");
                        /*
                            The following 2 lines are in OperationCoordinator as well, when it deserialize client-sent operations. We create connectOperation here as it's not sent by teh client, but by the Gateway itself
                        */
                            authorizeConnectionFailedOperation.context = event;
                        //Set the clientId (in API already)
                        authorizeConnectionFailedOperation.clientId = event.requestContext.connectionId;

                        return self.responseForEventAuthorization(event, serializedSession, false, authorizeConnectionFailedOperation);
                    } else {
                        identity = Identity.AnonymousIdentity;
                        identityObjectDescriptor = IdentityDescriptor;
                        webSocketSessionObjectDescriptor = WebSocketSessionObjectDescriptor;
                    }

                } else {
                    identityObjectDescriptor = self.mainService.objectDescriptorForObject(identity);
                    webSocketSessionObjectDescriptor = self.mainService.objectDescriptorForObject(session);
                }


                authorizeConnectionOperation = new DataOperation();

                authorizeConnectionOperation.id = event.requestContext.requestId;
                authorizeConnectionOperation.type = DataOperation.Type.AuthorizeConnectionOperation;
                authorizeConnectionOperation.timeStamp = event.requestContext.connectedAt;
                authorizeConnectionOperation.target = identityObjectDescriptor;
                //authorizeConnectionOperation.target = webSocketSessionObjectDescriptor;
                authorizeConnectionOperation.data = identity;
                authorizeConnectionOperation.identity = identity;
                /*
                    The following 2 lines are in OperationCoordinator as well, when it deserialize client-sent operations. We create connectOperation here as it's not sent by teh client, but by the Gateway itself
                */
                authorizeConnectionOperation.context = event;
                //Set the clientId (in API already)
                authorizeConnectionOperation.clientId = event.requestContext.connectionId;

                self.setEnvironmentFromEvent(event, context);


                let authorizeConnectionOperationPromise;

                if(self.mainService.authorizationPolicy === AuthorizationPolicy.None) {
                    /*
                        There are no AuthorizationPolicies, so we authorize the connection
                    */
                    var authorizeConnectionCompletedOperation = new DataOperation();
                    authorizeConnectionCompletedOperation.type = DataOperation.Type.AuthorizeConnectionCompletedOperation;
                    authorizeConnectionCompletedOperation.referrerId = authorizeConnectionOperation.id;
                    authorizeConnectionCompletedOperation.identity = authorizeConnectionOperation.identity;
                    authorizeConnectionCompletedOperation.target = authorizeConnectionOperation.target;
                    authorizeConnectionCompletedOperation.context = authorizeConnectionOperation.context;
                    authorizeConnectionCompletedOperation.clientId = authorizeConnectionOperation.clientId;
                    authorizeConnectionOperation.data = authorizeConnectionOperation.data;

                    authorizeConnectionOperationPromise = Promise.resolve(authorizeConnectionCompletedOperation);
                } else {
                    /*
                        Only the event from connect has headers informations, the only moment when we can get accept-language
                        So we need to catch it and store it as we create the connection in the DB.

                        We'll have to start being able to create full-fledge DO for that. If we move saveChanges to DataService,
                        we should be able to use the main service directly? Then the operations created should just be dispatched locally,
                        by whom?

                        That's what shpould probably happen client side as well, where the opertions are dispatched locally and the caught by an object that just push them on the WebSocket.
                    */
                        authorizeConnectionOperationPromise = new Promise(function(resolve, reject) {

                        self.handleAuthorizePromiseResolve = resolve;
                        self.handleAuthorizePromiseReject = reject;


                        return self.operationCoordinator.handleOperation(authorizeConnectionOperation, event, context, callback, this.apiGateway);
                    })
                }

                return authorizeConnectionOperationPromise.then((authorizeConnectionCompletedOperation) => {
                    /*
                        Identity may have been modified by the authorization logic, so we need to re-serialize
                    */
                        var serializedAuthorizedIdentity = self._serializer.serializeObject(authorizeConnectionCompletedOperation.data);

                    /*
                        start a session
                    */
                    return self.startSessionForOperation(session, authorizeConnectionOperation)
                    .then((webSocketSession) => {

                        var context = {
                            session: webSocketSession?.snapshot
                        };

                        return self.responseForEventAuthorization(event, serializedAuthorizedIdentity, true, context);
                    });

                }).catch((errorOperation) => {
                    var serializedAuthorizedIdentity = self._serializer.serializeObject(identity);

                    console.error("handleAuthorize() failed because error: ",errorOperation.data);
                    return self.responseForEventAuthorization(event, serializedAuthorizedIdentity, false, errorOperation);

                    // callback(failedResponse(500, JSON.stringify(err)))
                });


            });


        }
    },

    handleAuthorizeConnectionCompletedOperation: {
        value: function(authorizeConnectionCompletedOperation) {
            this.handleAuthorizePromiseResolve(authorizeConnectionCompletedOperation);
        }
    },
    handleAuthorizeConnectionFailedOperation: {
        value: function(authorizeConnectionFailedOperation) {
            this.handleAuthorizePromiseReject(authorizeConnectionFailedOperation);
        }
    },

    /**
     * Deserialized an identity from the event.requestContext.authorizer.principalId property, but if it's not there,
     * we would fecth the identity from the database using connectionId
     *
     * @param {object} event The event sent by the API Gateway
     * @return {Promise<Identity>} a Promise of the identity
     */
    authorizerIdentityFromEvent: {
        value: function(event, dataOperation) {

            //console.log("authorizerIdentityFromEvent:", event, dataOperation);

            this.deserializer.init(event.requestContext.authorizer.principalId, this.require, /*objectRequires*/undefined, /*module*/undefined, /*isSync*/false);
            try {
                return this.deserializer.deserializeObject();
            } catch (error) {
                /*
                    If there's a serializedSession and we can't deserialize it, we're the ones triggering the fail.
                */
                console.error("Error: ",error, " Deserializing ",event.requestContext.authorizer.principalId);
                return Promise.reject(error);
            }
        }
    },

    handleConnect: {
        value: async function(event, context, callback) {
            var self = this,
                connectOperation = new DataOperation(),
            serializedIdentity = event.requestContext.authorizer.principalId;

            connectOperation.id = event.requestContext.requestId;
            connectOperation.type = DataOperation.Type.ConnectOperation;
            connectOperation.timeStamp = event.requestContext.connectedAt;
            connectOperation.target = this;

            /*
                The following 2 lines are in OperationCoordinator as well, when it deserialize client-sent operations. We create connectOperation here as it's not sent by teh client, but by the Gateway itself
            */
            connectOperation.context = event;
            //Set the clientId (in API already)
            connectOperation.clientId = event.requestContext.connectionId;

            this.setEnvironmentFromEvent(event, context);

            /*
                Only the event from connect has headers informations, the only moment when we can get accept-language
                So we need to catch it and store it as we create the connection in the DB.

                We'll have to start being able to create full-fledge DO for that. If we move saveChanges to DataService,
                we should be able to use the main service directly? Then the operations created should just be dispatched locally,
                by whom?

                That's what shpould probably happen client side as well, where the opertions are dispatched locally and the caught by an object that just push them on the WebSocket.
            */

            return this.authorizerIdentityFromEvent(event, connectOperation)
            .then(function(identity) {
                connectOperation.identity = identity;
                return self.operationCoordinator.handleOperation(connectOperation, event, context, callback, self.apiGateway);
            })
           .then(() => {
            //    console.log("DataWorker -handleConnect: operationCoordinator.handleOperation() done");
               return successfullConnectResponse;
            //    callback(null, {
            //        statusCode: 200,
            //        body: 'Connected.'
            //    });
           }).catch((err) => {
                console.log(err)
                //callback(failedResponse(500, JSON.stringify(err)))
                return failedResponse(500, JSON.stringify(err));
           });

        }
    },

    startSessionForOperation: {
        value: function(webSocketSession, operation) {
            /*  
                We should set the operation.data to be the WebSocketSession we received from the client, itywhich has the identy property
                NOT the identity directly

                
            */
            const identity = operation.data;
            //All we need from original event should be in operation

            /*
                If we keep the design WebSocketSession ->> WebSocketSessionConnection, which design intention was to model a client-side session:
                Just because a backend WebSocket closes with a timeout, doesn't mean the session is over on the client side, as we seamlessly reconnect,
                and when we do, we send the same WebSocketSession data object, created client-side, that we started with.
                
                For this, we shouldn't need to verify that the WebSocketSession exists in the DB, we should be able to do a "merge", if it doesn't exists it creates it
                otherwise it updates it.
            */
            /*
                If there's no webSocketSession, we create one
            */
            if(!webSocketSession) {
                webSocketSession = new WebSocketSession();
                // webSocketSession = this.mainService.createDataObject(WebSocketSession);
                webSocketSession.identity = identity;
            }

            /*
                Set the start time of the session from operation.timeStamp, which is event.requestContext.connectedAt in AWS
                The start should be set by the client that initiates the connection, if missing, we set it:
            */
           let connections = webSocketSession.connections;
           if(!connections?.length) {
                let webSocketSessionConnection = new WebSocketSessionConnection();
                //let webSocketSessionConnection = this.mainService.createDataObject(WebSocketSessionConnection);
                /*
                    operation.clientId is AWS's event.requestContext.requestId.
                    It should be unique.
                */
                webSocketSessionConnection.serverConnectionId = operation.clientId;
                webSocketSessionConnection.existenceTimeRange = new Range(Date.date, null);

                //(webSocketSession.connections || (webSocketSession.connections = []).push(new Range(new Date(operation.timeStamp), null)));
                (webSocketSession.connections || (webSocketSession.connections = []).push(webSocketSessionConnection));
           } else {
                //Update the most recent, so sort by existenceTimeRange.start first to be sure we edit the right one
                webSocketSession.connections.sort((a, b) => {
                    if (a.existenceTimeRange.start <  b.existenceTimeRange.start) {
                        return -1;
                    } else if (a.existenceTimeRange.start > b.existenceTimeRange.start) {
                        return 1;
                    }
                    // a must be equal to b
                    return 0;
                    
                })
                webSocketSession.connections[webSocketSession.connections.length-1].serverConnectionId = operation.clientId;

           }

            /*
                We should get this from the identity's applicationIdentifier.
                which should be the instance of the application in the DB the session should be linked to:

                When we "publish" an app for an organization, this id should make it through the app's static assets somehow?

                If we use the technique to get the values of the joins of a query, maybe we could get the origanization's app corresponding to however the query was authorized?

            */
            webSocketSession.applicationIdentifier = identity.applicationIdentifier;
            //webSocketSession.app = identity.applicationIdentifier;

            // return Promise.resolve(webSocketSession);
            /*  
                The webSocketSession may exists if a client app reconnects after some inactivity that could have prompted the server to close the connection
            */

                
            this.mainService.mergeDataObject(webSocketSession);

            return this.mainService.saveChanges()
            .then((result) => {
                return webSocketSession;
            })
            .catch((error) => {
                return Promise.reject(error);
            })

        }

    },

    messageToDataOperationConverter: {
        value: undefined
    },

    tryToConvertMessageToDataOperation: {
        value: function(message) {
            if(this.messageToDataOperationConverter) {
                let conversionResult, deserializedOperationPromise;

                conversionResult = this.messageToDataOperationConverter.convert(message);
                deserializedOperationPromise = Promise.is(conversionResult) 
                    ? conversionResult
                    : Promise.resolve(conversionResult);
                return deserializedOperationPromise;
            } else {
                console.error("No deserialization for Unknown message:",message);
                return Promise.reject("Unknown message: ",message);    
            }
        }
    },

    handleMessage: {
        value: function(event, context, callback) {
            var isModStage = event.requestContext.stage === "mod";

            // if(isModStage) {
            //     console.log("handleMessage: event:", event, " context:", context, "callback: ", callback);
            // }

            /*
                Add a check if the message isn't coming from the socket, the only other is through the handleCommitTransaction lambda.

                We must only accept things if there's an included conectionId that matches a known connection.

                But is that enough or should we also re-include the identity?
                It doesn't look like

                https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ApiGatewayManagementApi.html#getConnection-property

                returns the context where our serialized identity is stored.
            */

            this.setEnvironmentFromEvent(event, context);

            var message = event.body,
                conversionResult,
            deserializedOperationPromise,
            objectRequires,
            module,
            isSync = false,
            self = this;


            //console.log("message: ",message);
            this.deserializer.init(message, this.require, objectRequires, module, isSync);
            try {
                var deserializedOperationPromise = this.deserializer.deserializeObject();
            } catch (ex) {
                deserializedOperationPromise = this.tryToConvertMessageToDataOperation(message);
            }
        
            deserializedOperationPromise.catch((error) => {
                return this.tryToConvertMessageToDataOperation(message);
            })
            .then((deserializedOperation) => {
                if(Array.isArray(deserializedOperation)) {
                    console.log("message contains "+deserializedOperation.length+" operations");
                    for(var i=0, countI = deserializedOperation.length, promises = new Array(deserializedOperation.length); (i<countI); i++) {
                        promises[i] = (this.handleOperation(deserializedOperation[i], event, context, callback));
                    }
                    return Promise.all(promises);
                } else {
                    // console.log("message contains 1 operations");
                    return this.handleOperation(deserializedOperation, event, context, callback);
                }    
            })
            .catch((error) => {
                if(this.delegate) {
                    let responsePromise = this.delegate.respondsToWorkerFailureToHandleMessageWithError(this, message, error);
                    if(responsePromise) {
                        responsePromise.then((responseMessage) => {

                            if(typeof responseMessage !== "string") {
                                responseMessage = JSON.stringify(responseMessage);
                            }
                            
                            return this.apiGateway.postToConnection({
                                ConnectionId: event.requestContext.connectionId,
                                Data: responseMessage
                            });
                                
                        })
                    }
                } else {
                    console.error("No deserialization for ",serializedOperation);
                    return Promise.reject("Unknown message: ",serializedOperation);    
                }
            });

        }
    },

    handleOperation: {
            value: function(deserializedOperation, event, context, callback) {

            //console.debug("DataWorker received: ",deserializedOperation);

            if(deserializedOperation && !deserializedOperation.target && deserializedOperation.dataDescriptor) {
                deserializedOperation.target = this.mainService.objectDescriptorWithModuleId(deserializedOperation.dataDescriptor);
            }

            //Add connection (custom) info the operation:
            // deserializedOperation.connection = gatewayClient;

            /*
                Sets the whole AWS API Gateway event as the dataOperations's context.

                Reading the stage for example -
                aDataOperation.context.requestContext.stage

                Can help a DataService address the right resource/database for that stage
            */
            deserializedOperation.context = event;

            /*
                Set the clientId (in API already), if it's there. If we come here from an http post sidekick,
                there won't be one and we'll use the one sent by the client.
            */
            if(event.requestContext && event.requestContext.connectionId) {
                deserializedOperation.clientId = event.requestContext.connectionId;
            }

            //this.operationCoordinator.handleMessage(event, context, callback, this.apiGateway)
            return this.authorizerIdentityFromEvent(event, deserializedOperation)
            .then(function(identity) {
                var connectionPromise;

                if(!identity) {
                    throw new Error("Could not find an identity");
                }

                deserializedOperation.identity = identity;

                if(event.httpMethod && event.httpMethod === "POST") {
                    //Get the clientId from the dataOperation:
                    var clientId = deserializedOperation.clientId;

                    if(!clientId) {
                        throw new Error("HTTP Post: Could not find a clientId");
                    }

                    connectionPromise = new Promise(function(resolve, reject) {

                        var params = {
                                ConnectionId: clientId
                            };

                        self.apiGateway.getConnection(params, function(err, data) {
                            if (err) {
                                // an error occurred
                                console.log(err, err.stack);
                                reject(err);
                            }
                            else {
                                /*
                                    data (Object) — the de-serialized data returned from the request. Set to null if a request error occurs. The data object has the following properties:
                                    ConnectedAt — (Date)
                                    The time in ISO 8601 format for when the connection was established.

                                    Identity — (map)
                                    SourceIp — required — (String)
                                    The source IP address of the TCP connection making the request to API Gateway.

                                    UserAgent — required — (String)
                                    The User Agent of the API caller.

                                    LastActiveAt — (Date)
                                    The time in ISO 8601 format for when the connection was last active.
                                */
                                // successful response, we found a connection. We set it on the environment
                                currentEnvironment.clientId = deserializedOperation.clientId;
                                console.log("valid connection found using operation's clientId "+clientId+": ",data);

                                resolve(clientId);
                            }
                        });

                    });
                } else {
                    if(!currentEnvironment.clientId) {
                        throw new Error("Could not find an comnectionId in currentEnvironment.clientId");
                    }
                    connectionPromise = Promise.resolve(currentEnvironment.clientId);
                }

                return connectionPromise;
            })
            .then((clientId) => {
                /*
                    If we come from http, we're not going to have it from the gateway,
                    But we expect the client to have it
                */
                // if(!currentEnvironment.clientId) {
                //     currentEnvironment.clientId = deserializedOperation.clientId;
                // }
                return this.operationCoordinator.handleOperation(deserializedOperation, event, context, callback, this.apiGateway);
            })
            .then(() => {
                //console.log("successfullResponse:",successfullResponse);

                //callback(null, successfullResponse)
                return successfullResponse;
            })
            .catch((err) => {
                console.error("Error: ",err, " for event: ",event);
                /*
                    JSON.stringify() doesn't handle circular references, util.inspect() does
                */
                //callback(failedResponse(500, util.inspect(err)))
                return failedResponse(500, util.inspect(err));
            });

        }
    },
    handleDisconnect: {
        value: function(event, context, callback) {
            var self = this,
                disconnectOperation = new DataOperation(),
            serializedIdentity = event.requestContext.authorizer.principalId;

            disconnectOperation.id = event.requestContext.requestId;
            disconnectOperation.type = DataOperation.Type.DisconnectOperation;
            disconnectOperation.timeStamp = event.requestContext.requestTimeEpoch;
            disconnectOperation.target = this;

            /*
                The following 2 lines are in OperationCoordinator as well, when it deserialize client-sent operations. We createdisdisconnectOperation connectOperation here as it's not sent by teh client, but by the Gateway itself
            */
            disconnectOperation.context = event;
            //Set the clientId (in API already)
            disconnectOperation.clientId = event.requestContext.connectionId;

            this.setEnvironmentFromEvent(event, context);

            return this.endSessionForDisconnectOperation(disconnectOperation);

        }
    },
    endSessionForDisconnectOperation: {
        value: function(disconnectOperation) {
            const identity = disconnectOperation.identity;

            /*
                We should have the sessionId from the cached value like the identity.
            */

            //All we need from original event should be in connectOperation

            // var webSocketSession = this.mainService.createDataObject(WebSocketSession);

            /*
                connectOperation.clientId is AWS's event.requestContext.requestId.

                It should be unique.
            */
            // webSocketSession.connectionId = disconnectOperation.clientId;
            /*
                Set the end time of the session from connectOperation.timeStamp, which is event.requestContext.connectedAt in AWS
            */
            // webSocketSession.existenceTimeRange.end = new Date(disconnectOperation.timeStamp);
            return Promise.resolve(null);
        }

    },



});
