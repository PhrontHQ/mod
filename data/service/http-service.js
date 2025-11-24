const { identity } = require("../../core/collections/shim-function");

const RawDataService = require("./raw-data-service").RawDataService,
    AuthenticationPolicy = require("./authentication-policy").AuthenticationPolicy,
    //FIXME: user-identity needs to move to data/model/authentication
    UserIdentity = require("../model/app/user-identity").UserIdentity,
    DataQuery = require("../model/data-query").DataQuery,
    Criteria = require("../../core/criteria").Criteria,
    Enumeration = require("../model/enumeration").Enumeration,
    Map = require("core/collections/map"),
    Montage = require("core/core").Montage,
    parse = require("core/frb/parse"),
    compile = require("core/frb/compile-evaluator"),
    evaluate = require("core/frb/evaluate"),
    Scope = require("core/frb/scope"),
    Promise = require("core/promise").Promise,
    Deque = require("core/collections/deque"),
    RawEmbeddedValueToObjectConverter = require("../converter/raw-embedded-value-to-object-converter").RawEmbeddedValueToObjectConverter,
    RawEmbeddedHierarchyValueToObjectConverter = require("../converter/raw-embedded-hierarchy-value-to-object-converter").RawEmbeddedHierarchyValueToObjectConverter,
    DataOperation = require("./data-operation").DataOperation;


var HttpError = exports.HttpError = Montage.specialize({

    constructor: {
        value: function HttpError() {
            this.stack = (new Error()).stack;
        }
    },

    isAuthorizationError: {
        get: function () {
            return this._isAuthorizationError || (this.statusCode === 401 || this.statusCode === 403);
        },
        set: function (value) {
            this._isAuthorizationError = value;
        }
    },

    message: {
        get: function () {
            if (!this._message) {
                this._message = "Status " + this.statusCode + " received for url: " + this.url;
            }
            return this._message;
        }
    },

    name: {
        value: "HttpError"
    },

    url: {
        value: undefined
    },

    statusCode: {
        value: undefined
    }

}, {

    withMessage: {
        value: function (message) {
            var error = new this();
            error._message = message;
            return error;
        }
    },


    withRequestAndURL: {
        value: function (request, url) {
            var error = new this();
            error.statusCode = request.status;
            error.url = url;
            return error;
        }
    }

});

/**
 * Superclass for services communicating using HTTP, usually REST services.
 *
 * @class
 */
/*
 * TODO: Restore @extends when parent class has been cleaned up to not provide
 * so many unnecessary properties and methods.
 *
 * @extends RawDataService
 */
var HttpService = exports.HttpService = class HttpService extends RawDataService {/** @lends DataService */
    constructor() {
        super();
    }

    deserializeSelf(deserializer) {

        super.deserializeSelf(deserializer);

        let value = deserializer.getProperty("requestResponseFallbackModuleId");
        if (value) {
            this.requestResponseFallbackModuleId = value;
        }
    }

    handleReadOperation(readOperation) {
        let readOperationCompletionPromise;

        /*
            This is to temporarily prevents a RawDataService to attempt to handle a readOperation that comes
            from a query coming from a mapping's converter that will have a very RawData-specific criteria that
            doesn't mean anything to any other RawDataService even if they can provide data for that type as well.

            We either need to have the converter fetchData via its own service directly, and not via mainService.
            Or automate in SynchronizationDataService the fetch of each origin data service's origin data snapshot for the current
            object and property being fetched and get them to handle a read in their own language/model/data shape.
            
            That logic is in SynchronizationDataService and has been disabled, it need to be brought back and baked 
        */
        // if(readOperation.criteria?.name === "rawDataPrimaryKeyCriteria" && readOperation.hints?.rawDataService && readOperation.hints.rawDataService !== this) {
        //     return;
        // }

        // if((readOperation.criteria?.name.contains("ForeignValueToObjectConverter")) && readOperation.hints?.rawDataService && readOperation.hints.rawDataService !== this) {
        //     return;
        // }
       

        /*
            This gives a chance to the delegate to do something async by returning a Promise from rawDataServiceWillHandleReadOperation(readOperation).
            When that promise resolves, then we check if readOperation.defaultPrevented, if yes, the we don't handle it, otherwise we proceed.

            Wonky, WIP: needs to work without a delegate actually implementing it.
            And a RawDataService shouldn't know about all that boilerplate

            Note: If there was a default delegate shared that would implement rawDataServiceWillHandleReadOperation by returning Promise.resolve(readOperation)
            it might be simpler, but probably a bit less efficient

        */
        readOperationCompletionPromise = this.callDelegateMethod("rawDataServiceWillHandleReadOperation", this, readOperation);
        if (readOperationCompletionPromise) {
            readOperationCompletionPromise = readOperationCompletionPromise.then((readOperation) => {
                if (!readOperation.defaultPrevented) {
                    let resultPromise = this._handleReadOperation(readOperation);
                    if (this.promisesReadCompletionOperation) {
                        return resultPromise
                    }
                }
            });
        } else {
            let resultPromise = this._handleReadOperation(readOperation);
            if (this.promisesReadCompletionOperation) {
                readOperationCompletionPromise = resultPromise;
            }
        }

        //If we've been asked to return a promise for the read Completion Operation, we do so. Again, this is fragile. IT HAS TO MOVE UP TO RAW DATA SERVICE
        //WE CAN'T RELY ON INDIVIDUAL DATA SERVICE IMPLEMENTORS TO KNOW ABOUT THAT...
        if (this.promisesReadCompletionOperation) {
            return readOperationCompletionPromise;
        }

    }
    _handleReadOperation(readOperation) {
        // if(readOperation.target.name === "Workstation" && readOperation.data.readExpressions[0] === "parent") {
        //console.log("\t"+this.identifier+" handle readOperation id " + readOperation.id + " for "+readOperation.target.name+ (readOperation?.data?.readExpressions? (" "+readOperation?.data?.readExpressions) : "") + " like "+ readOperation.criteria);
        // }

        /*
            Until we solve more efficiently (lazily) how RawDataServices listen for and receive data operations, we have to check wether we're the one to deal with this:
        */
        if (!this.handlesType(readOperation.target)) {
            return;
        }

        var objectDescriptor = readOperation.target,
            mapping = objectDescriptor && this.mappingForObjectDescriptor(objectDescriptor),
            accessTokenPromise,
            responseOperation,
            readOperationCompletionPromiseResolvers,
            readOperationCompletionPromise, readOperationCompletionPromiseResolve, readOperationCompletionPromiseReject,
            readOperationAccessToken;


        if (this.promisesReadCompletionOperation) {
            readOperationCompletionPromiseResolvers = Promise.withResolvers();
            readOperationCompletionPromise = readOperationCompletionPromiseResolvers.promise;
            readOperationCompletionPromiseResolve = readOperationCompletionPromiseResolvers.resolve;
            readOperationCompletionPromiseReject = readOperationCompletionPromiseResolvers.reject;
        } else {
            readOperationCompletionPromise = readOperationCompletionPromiseResolve = readOperationCompletionPromiseReject = undefined;
        }

        if (this.authenticationPolicy && this.authenticationPolicy === AuthenticationPolicy.UP_FRONT) {
            let identityPromise;

            /*
                An HTTP Service typically needs an identity to get some kind of access token.
                If it's meant to use a user's identity, an HTTP Service shouldn't have a UserIdentity assigned sen it, nor an 
                identity query.
                
                It's more likey for a data service being executed in a Worker to have it's own client identity
            */

            /*
                Wether one was assigned straight or already obtained via fetchIdentity()
            */
            if (this.identity || this.identityQuery) {
                identityPromise = this.identityPromise;
            } else if (readOperation.identity) {
                identityPromise = Promise.resolve(readOperation.identity);
            } else if (this.application.identity) {
                identityPromise = Promise.resolve(this.application.identity);
            } else {
                /*
                    Workareound: readOperation.identity is undefine right now, so we're defaulting to application.identity
                    BUT #TODO: a user-mod / end-mod can evenually have multiple user identities from different identity providers
                    So we'll need to redesign for that. A RawDataService will need to figure out, which one of those user identities
                    the one it should use.

                    Knowing about a RawDataService's organization behind it should help match it 
                    to one of the existing identities's provider / oranization, if it's the same, but some API can accept
                    identities from multiple providers, so we need to add to RawDataService the knowledge of 
                    what kind of identities it can accept / work with:

                    - a criteria or a list of criteria to evaluate on identities, such that if the evaluation returns true
                    the identity can be used by the raw data service

                */
                let userIdentityQuery = DataQuery.withTypeAndCriteria(UserIdentity);


                identityPromise = this.mainService.fetchData(userIdentityQuery);

                //identityPromise = Promise.resolve(readOperation.identity || this.application.identity);
            }



            /*
                if we don't have a token or if it's expired (this.accessToken.remainingValidityDuration is negative), 
                or about to (under 2000ms / 2s left on its validity) 

                then we re-authenticate
            */
            //    if(this.accessToken) {
            //         console.debug("this.accessToken.remainingValidityDuration is "+ this.accessToken.remainingValidityDuration +" ms");
            //    }

            /*
                TODO CLEANUP: for backend service, the identity is related to the service/backend itself
                and we typically read it from a secret manager.

                With that identity / credentials, we typically get an access token, but it shouldn't be stored
                on the RawDataService itself, instead we need to use 
                    registerAccessTokenForIdentity/accessTokenForIdentity/unregisterAccessTokenForIdentity
                to get it back as we work on operations

                That way we don't have a difference between those 2 use cases, they are one and the same 
                For Backward compatibility, we should look
            */



            // console.debug("this.identity: ",this.identity);
            accessTokenPromise = identityPromise.then((resolvedIdentity) => {


                //Now that we have a resolvedIdentity, we can check if we have a registered accesss token
                let registeredAccessToken = this.accessTokenForIdentity(resolvedIdentity);

                if (!registeredAccessToken || registeredAccessToken.remainingValidityDuration < 2000) {

                    if (registeredAccessToken) {
                        console.debug("\t" + this.name + " renewing access token that is about to expire: " + registeredAccessToken.remainingValidityDuration + "ms left")

                        //Clear the cache
                        this.mainService.unregisterReadOnlyDataObject(registeredAccessToken);
                        this.unregisterAccessTokenForIdentity(resolvedIdentity);
                    }
                }

                return resolvedIdentity.objectDescriptor.propertyDescriptorNamed("accessTokens").valueDescriptor
                    .then((resolvedAccessTokenDescriptor) => {

                        let accessTokenDescriptor = resolvedAccessTokenDescriptor ? resolvedAccessTokenDescriptor : this.accessTokenDescriptor;

                        if (!registeredAccessToken && !accessTokenDescriptor) {

                            throw "DataService " + this.identifier + " can't get an access token to handle readOperation " + readOperation

                        } else {

                            /*
                                In the case where the identity is cached locally, and the access token is too. 
    
                            */

                            let identityCriteria = new Criteria().initWithExpression("identity == $", resolvedIdentity),
                                tokenDataQuery = DataQuery.withTypeAndCriteria(accessTokenDescriptor, identityCriteria),
                                tokenQueryDataStream;

                            tokenDataQuery.identity = resolvedIdentity;
                            tokenQueryDataStream = this.mainService.fetchData(tokenDataQuery);

                            return tokenQueryDataStream.then((result) => {
                                if (result && result.length === 1) {
                                    let accessToken = result[0];
                                    this.registerAccessTokenForIdentity(accessToken, resolvedIdentity);

                                    //Now set them both on the operation:
                                    readOperation.identity = resolvedIdentity;
                                    readOperation.accessToken = accessToken;

                                    return accessToken;
                                } else {
                                    return null;
                                }
                            });
                        }

                    });

            })
                .catch(error => {
                    let responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, error, null);
                    console.error("Identity promise failed with error", error);
                    return responseOperation;
                });

        } else {
            accessTokenPromise = Promise.resolve();
        }

        accessTokenPromise.then((accessToken) => {

            //if(accessToken?.accessToken) console.debug("accessToken: ",accessToken.accessToken);
            // mapping = objectDescriptor && this.mappingForType(objectDescriptor),
            var fetchRequests = [],
                readOperations = [];

            /*
                As dataOperation move up the model, meaning criteria's expression are expected to be object level, while keeping the option to 
                perform data mapping client side, when possible, we need to check if it's done or not.

                One common case is a read operation for an object's property, can also be a relationship to another type.
                We're first adding this. This kind of operation where the read expression is a relationship to another type 
                typically needs to become a read operation to that other type, in most cases.

                Also, 
            */

            this.mapDataOperationToRawDataOperations(readOperation, readOperations)
                .then(() => {
                    for (let i = 0, iReadOperation; (iReadOperation = readOperations[i]); i++) {

                        if (iReadOperation.type === DataOperation.Type.ReadCompletedOperation) {
                            console.log("\t" + this.identifier + " handleReadOperation dispatch mapped ReadCompletedOperation " + iReadOperation.id, " for " + iReadOperation.referrer.target.name + " like " + iReadOperation.referrer.criteria);

                            iReadOperation.target.dispatchEvent(iReadOperation);

                            iReadOperation.propagationPromise.then(() => {
                                readOperationCompletionPromiseResolve?.(iReadOperation);
                            });

                        } else {

                            let iMapping = this.mappingForObjectDescriptor(iReadOperation.target);
                            if (typeof iMapping.mapDataOperationToFetchRequests === "function") {
                                iMapping.mapDataOperationToFetchRequests(iReadOperation, fetchRequests);

                                if (fetchRequests.length > 0) {

                                    for (let i = 0, iRequest; (iRequest = fetchRequests[i]); i++) {
                                        console.debug(iRequest.url);
                                        // console.debug("iRequest headers: ",iRequest.headers);
                                        // console.debug("iRequest body: ",iRequest.body);
                                        // .finally((value) => {
                                        //     console.debug("finally objectDescriptor.dispatchEvent("+responseOperation+");");
                                        //     objectDescriptor.dispatchEvent(responseOperation);
                                        // })
                                        this._fetchReadOperationRequest(iReadOperation, iRequest, readOperationCompletionPromiseResolve);
                                    }
                                } else {
                                    let criteriaParameters = readOperation?.criteria?.parameters,
                                        qualifiedProperties = readOperation?.criteria?.qualifiedProperties,
                                        rawDataPrimaryKeyProperties = mapping.rawDataPrimaryKeyProperties,
                                        rawData = [];

                                    if (readOperation.data.readExpressions && readOperation.data.readExpressions.length > 0 && qualifiedProperties?.length == 1) {
                                        /*
                                            The test obove is for a query initiated by mod's data-triggers to resolve values of one object at a time and that qualifiedProperties only is the primary key.
                                            So far mod supports a single primary key, that can be an object.
                    
                                            We should more carefully use the syntax to match the property to it's value
                                        */
                                        // let readExpressions = readOperation.data.readExpressions,
                                        //         rawDataObject = {};

                                        //     rawData.push(rawDataObject);
                                        // //Set the primary key:
                                        // rawDataObject[qualifiedProperties[0]] = criteriaParameters;

                                        // console.once.warn("No Mapping found for readOperation on "+ readOperation.target.name+ " for "+ readExpressions);

                                        // //console.warn("No Mapping found for readOperation on "+ readOperation.target.name+ " for "+ readExpressions+" and criteria: ",readOperation.criteria);
                                        // for(let i = 0, countI = readExpressions.length, iReadExpression, iPropertyDescriptor; (i < countI); i++ ) {
                                        //     iReadExpression = readExpressions[i]
                                        //     iPropertyDescriptor = objectDescriptor.propertyDescriptorNamed(iReadExpression);
                                        //     rawDataObject[iReadExpression] = iPropertyDescriptor.defaultValue || iPropertyDescriptor.defaultFalsyValue;
                                        // }

                                        responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, null, rawData);
                                        console.log("\t" + this.identifier + " handleReadOperation dispatch A responseOperation " + responseOperation.id, " for " + responseOperation.referrer.target.name + " like " + responseOperation.referrer.criteria);

                                        responseOperation.target.dispatchEvent(responseOperation);

                                        //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
                                        responseOperation.propagationPromise.then(() => {
                                            readOperationCompletionPromiseResolve?.(responseOperation);
                                        });

                                    } else {
                                        let error = new Error("No Mapping found " + readOperation.target.name + " " + readOperation.data.readExpressions);

                                        console.once.error(error.message);
                                        if (readOperation.clientId) {
                                            error.stack = null;
                                        }
                                        // responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, error, null);
                                        //Send an empty response instead
                                        responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, null, []);
                                        console.log("\t" + this.identifier + " handleReadOperation dispatch B responseOperation " + responseOperation.id, " for " + responseOperation.referrer.target.name + " like " + responseOperation.referrer.criteria);

                                        responseOperation.target.dispatchEvent(responseOperation);

                                        //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
                                        responseOperation.propagationPromise.then(() => {
                                            readOperationCompletionPromiseResolve?.(responseOperation);
                                        });

                                    }

                                }

                            }
                            else {

                                console.warn(this.name + ": No Rule found to map a read operation for " + iReadOperation.target.name + " to a fetchRequest");
                                readOperationCompletionPromiseResolve();
                                /*
                                    Benoit 11/13/2025 commented it as this is it an error: some RawDataService can map raw data to objects that may be nested in 
                                    a read for another type, but don't actually have an API to get it on its own. 
    
                                    We need to eventually need to introduce that semantic more clearly, but the recent mapping from operation to fetchRequests is 
                                    a step in that direction.
                                */
                                // let error = new Error(this.name+": No Mapping for "+ iReadOperation.target.name+ " lacks mapDataOperationToFetchRequests(readOperation, fetchRequests) method");
                                // responseOperation = this.responseOperationForReadOperation(iReadOperation.referrer ? iReadOperation.referrer : iReadOperation, error, null);
                                // console.log("\t"+this.identifier+" handleReadOperation dispatch C responseOperation " + responseOperation.id, " for "+responseOperation.referrer.target.name+ " like "+ responseOperation.referrer.criteria);

                                // responseOperation.target.dispatchEvent(responseOperation);

                                // //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
                                // responseOperation.propagationPromise.then(() => {
                                //     readOperationCompletionPromiseResolve?.(responseOperation);
                                // });

                            }
                        }

                    }

                });

        })
            .catch((error) => {
                responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, error, null);
                console.error(error);
                console.log("\t" + this.identifier + " handleReadOperation ERROR dispatch D responseOperation " + responseOperation.id, " for " + responseOperation.referrer.target.name + " like " + responseOperation.referrer.criteria);
                responseOperation.target.dispatchEvent(responseOperation);

                //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
                responseOperation.propagationPromise.then(() => {
                    readOperationCompletionPromiseResolve?.(responseOperation);
                });

            });

        return readOperationCompletionPromise;
    }

    /**
     * Gives the opportunity to turn dataOperation into multiple ones if needed by a service's practical constraints.
     * If a result is cached, rawDataOperations can receive Read[Completed|Failed]Operations as well
     *
     * @param {DataOperation} dataOperation - The dataOperation to evaluate.
     * @param {Array<DataOperation>} rawDataOperations - An array to collect the resulting data operations needed
     * @returns {Promise<rawDataOperations>} A promise that resolves with the rawDataOperations passed in, as a convenience
     */
    mapDataOperationToRawDataOperations(dataOperation, rawDataOperations) {

        /*
            As dataOperation move up the model, expected to be object level, while keeping the option to 
            perform data mapping client side, when possible, we need to check.

            One common case is a read operation for an objet's property, can also be a relationship to another type.
            We're first adding this. 
        */
        let readExpressions = dataOperation.data?.readExpressions,
            readExpressionsCount = readExpressions?.length || 0;

        if (dataOperation?.criteria?.name === "rawDataPrimaryKeyCriteria" && readExpressions?.length > 0) {
            var objectDescriptor = dataOperation.target,
                mapping = this.mappingForType(objectDescriptor),
                rawDataPrimaryKeys = mapping.rawDataPrimaryKeys,
                primaryKeyPropertyDescriptors = mapping.primaryKeyPropertyDescriptors,
                criteria = dataOperation.criteria,
                readExpressionPromises;

            /*
                We'd need a way to struture how to inform what readExpression a RawDataService can combine.
                For a database data service, one raw data operation / query can retrieve all columns at once
                But for an HTTP Service, there aren't any "rules", it depends... Performance-wise it would be better
                to have that sorted out at the end of looping on readExpressions.
                It might be better done in FetchResourceDataMapping
            */

            for (let i = 0, countI = readExpressionsCount, iExpression; (i < countI); i++) {

                iExpression = readExpressions[i];

                let iObjectRule = mapping.objectMappingRuleForPropertyName(iExpression),
                    iObjectRuleConverter = iObjectRule && iObjectRule.converter,

                    iPropertyDescriptor = objectDescriptor.propertyDescriptorNamed(iExpression),
                    iValueDescriptorReference = iObjectRule && iObjectRule.propertyDescriptor._valueDescriptorReference,
                    iValueDescriptorReferenceMapping = iValueDescriptorReference && this.mappingForType(iValueDescriptorReference);

                //If it's a relationship to another type, we're going to need to build a different DataOperation
                if (iValueDescriptorReference && iValueDescriptorReference !== objectDescriptor) {

                    let iReadOperation = new DataOperation();
                    iReadOperation.clientId = dataOperation.clientId;
                    //We need this to keep the link with the original when commplete the read 
                    iReadOperation.referrer = dataOperation;
                    iReadOperation.type = DataOperation.Type.ReadOperation;
                    iReadOperation.target = iValueDescriptorReference;
                    iReadOperation.data = dataOperation.data;


                    let originDataSnapshot = dataOperation.hints?.originDataSnapshot?.[this.identifier],
                        iRawDataMappingRules = mapping.rawDataMappingRulesForObjectProperty(iExpression),
                        iRawDataMappingRulesIterator = iRawDataMappingRules && iRawDataMappingRules.values(),
                        iRawDataMappingRule;


                    /*
                        If instead of passing just the originDataSnapshot in hints, we could pass all snapshots,
                        including from what we consider the "primary" destination. Each RawDataService will look 
                        up their own thing.
                    */
                    //Loop on potential matches
                    while ((iRawDataMappingRule = iRawDataMappingRulesIterator.next().value)) {

                        let iTargetPath = iRawDataMappingRule.targetPath,
                            iRawDataMappingRuleConverter = iRawDataMappingRule.reverter,
                            iRawDataMappingRuleConverterForeignDescriptorMapping = iRawDataMappingRuleConverter && iRawDataMappingRuleConverter.foreignDescriptorMatchingRawProperty && iRawDataMappingRuleConverter.foreignDescriptorMatchingRawProperty(iTargetPath);

                        if (iRawDataMappingRuleConverterForeignDescriptorMapping) {
                            //Test
                            iValueDescriptorReference = iRawDataMappingRuleConverterForeignDescriptorMapping.type;
                            iValueDescriptorReferenceMapping = iValueDescriptorReference && this.mappingForType(iValueDescriptorReference);
                        }

                        if (readExpressionsCount === 1) {
                            let mappingScope = mapping._scope.nest(dataOperation),
                                originDataSnapshot = dataOperation.hints?.originDataSnapshot?.[this.identifier];

                            /*
                                FIXME: not all aspects of RawForeignValueToObjectConverter's query creation have migrated to a more
                                object-level representation.

                                We could try to use dataOperation.criteria parameters, if it's a to-many,
                                than it might work, but that's a bit reaching
                            */
                            if (originDataSnapshot) {
                                mappingScope = mappingScope.nest(originDataSnapshot);


                                if ((iRawDataMappingRule.reverter instanceof RawEmbeddedValueToObjectConverter) || (iRawDataMappingRule.reverter instanceof RawEmbeddedHierarchyValueToObjectConverter)) {
                                    // if( (iRawDataMappingRule.reverter instanceof RawEmbeddedValueToObjectConverter)) {

                                    let originValue = iObjectRule.evaluate(mappingScope);
                                    if (!Promise.is(originValue)) {
                                        let responseOperation = this.responseOperationForReadOperation(dataOperation.referrer ? dataOperation.referrer : dataOperation, null, originValue, false /*isNotLast*/, iValueDescriptorReference/*responseOperationTarget*/);
                                        rawDataOperations.push(responseOperation);
                                    } else {
                                        (readExpressionPromises || (readExpressionPromises = [])).push(originValue);
                                        originValue.then((resolvedOriginValue) => {
                                            console.debug("iObjectRule: ", iObjectRule);
                                            console.debug("originDataSnapshot: ", originDataSnapshot);
                                            console.debug("dataOperation: ", dataOperation);
                                            let responseOperation = this.responseOperationForReadOperation(dataOperation.referrer ? dataOperation.referrer : dataOperation, null, resolvedOriginValue, false /*isNotLast*/, iValueDescriptorReference/*responseOperationTarget*/);
                                            rawDataOperations.push(responseOperation);
                                        });
                                    }

                                } else {
                                    iReadOperation.criteria = iRawDataMappingRule.reverter.convertCriteriaForValue(iObjectRule.expression(mappingScope));
                                    //iReadOperation.criteria = iRawDataMappingRuleConverter.convertCriteriaForValue(criteria.parameters.id);
                                    rawDataOperations.push(iReadOperation);
                                }
                            } else {
                                console.log("can't fetch further");
                            }

                        } else {
                            throw "HTTPService mapDataOperationToRawDataOperations() is not implememnted yer to handle more than one expression"
                        }

                    }
                } else if (!rawDataOperations.has(dataOperation)) {
                    rawDataOperations.push(dataOperation);
                }

            }

            if (readExpressionPromises && readExpressionPromises.length) {
                return (readExpressionPromises.length === 1
                    ? readExpressionPromises[0]
                    : Promise.all(readExpressionPromises))
                    .then((resolvedValue) => {
                        return rawDataOperations;
                    })
            } else {
                return Promise.resolve(rawDataOperations);
            }



        } else {
            return Promise.resolve(rawDataOperations.push(dataOperation));
        }
    }

    __requestResponseFallback
    __requestResponseFallbackPromise

    get _requestResponseFallback() {
        if (this.requestResponseFallbackModuleId && !this.__requestResponseFallbackPromise) {

            return ( this.__requestResponseFallbackPromise || (this.__requestResponseFallbackPromise = global.require.async(this.requestResponseFallbackModuleId)
                .then((requestResponseFallback) => {
                    if (!requestResponseFallback) {
                        throw new Error("requestResponseFallback not found at " + this.requestResponseFallbackModuleId);
                    }

                    return requestResponseFallback;
                })
                .catch((error) => {
                    console.error("Error loading requestResponseFallback data at "+this.requestResponseFallbackModuleId+": ", error);
                    throw error;
                })));

        } else {
            return (this.__requestResponseFallbackPromise || (this.__requestResponseFallbackPromise = Promise.resolveNull));
        }
    }

    fallbackForResponseIfNeeded(response) {
        if (response.status === 200) {
            console.debug("200: " + response.url);
            return response;
        } else {

            return this._requestResponseFallback
                .then((requestResponseFallback) => {
                    //First implementation, lookup the url, later smarter mapping rules:
                    let requestResponseFallbackBody = requestResponseFallback?.[response.url];

                    if (requestResponseFallbackBody) {

                        if (!(requestResponseFallbackBody instanceof Response)) {

                            // Response constructor (https://developer.mozilla.org/en-US/docs/Web/API/Response/Response) 
                            // expects the first argument, the body to be many possible types, but an Object isn't one of them.
                            // So if requestResponseFallbackBody isn't a string we JSON.stringify it 
                            if(requestResponseFallbackBody instanceof Object) {
                                requestResponseFallbackBody = JSON.stringify(requestResponseFallbackBody);
                            }
                            //We replace it by a response object
                            const fallbackResponse = new Response(requestResponseFallbackBody, {
                                headers: response.headers,
                                status: 200,
                                statusText: "(cache)"
                            });

                            //Now cache the result Response for further use
                            requestResponseFallback[response.url] = fallbackResponse;
                            requestResponseFallbackBody = fallbackResponse;
                        }
                        return requestResponseFallbackBody;

                    } else {
                        return response;
                    }

                });
        }
    }

    _fetchReadOperationRequest(readOperation, iRequest, readOperationCompletionPromiseResolve) {

        fetch(iRequest)
            .then((response) => {
                return this.fallbackForResponseIfNeeded(response);
            })
            .then((response) => {

                if (response.status === 200 || response.statusText === "(cache)" ) {
                    console.debug("200: " + response.url);

                    //console.log("Cache-Control: " + response.headers.get('Cache-Control') || response.headers.get('cache-control'));
                    if (response.headers.get('content-type').includes("json")) {
                        return response.json();
                    } else {
                        return response.text();
                    }
                } else {

                    if (response.status === 401) {
                        console.debug("401: " + response.url);
                        // console.log("Token has expired?",response);
                        throw new Error("Token has expired");
                    } else if (response.status === 403) {
                        console.debug("403: Authorization Request Denied" + response.url);
                        // console.log("Token has expired?",response);
                        throw new Error("Authorization Request Denied");
                    } else if (response.status === 404) {
                        /*
                            This is the case where the API is all path and therefore in case nothing is found, the response is logically a 404
                        */
                        if ((new URL(response.url)).search === "") {
                            return null;
                        } else {
                            console.log("\t" + `No ${readOperation.target.name} Data found for criteria ${readOperation.criteria.expression} with parameters ${JSON.stringify(readOperation.criteria.parameters)} at ${response.url}`);
                            throw new Error("\t" + `No ${readOperation.target.name} Data found for criteria ${readOperation.criteria.expression} with parameters ${JSON.stringify(readOperation.criteria.parameters)} at ${response.url}`);
                        }
                    }
                    else {
                        return response.text()
                            .then((responseContent) => {
                                if (responseContent === "") {
                                    console.log(response);
                                }
                                throw new Error("Request failed with error: " + responseContent);
                            });
                    }
                }
            })
            .then((responseContent) => {
                //console.debug(iRequest.url+": ",JSON.stringify(responseContent));
                let mapping = this.mappingForObjectDescriptor(readOperation.target);
                let rawData = [];

                mapping.mapFetchResponseToRawData(responseContent, rawData);
                //console.debug("rawData: ",rawData);
                let responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, null, rawData, false /*isNotLast*/, readOperation.target/*responseOperationTarget*/);
                console.log("\t" + this.identifier + " handleReadOperation dispatch " + responseOperation.type + " id " + responseOperation.id + " for read referrer id " + responseOperation.referrer.id + " for " + responseOperation.referrer.target.name + " like " + responseOperation.referrer.criteria);

                responseOperation.target.dispatchEvent(responseOperation);

                //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
                responseOperation.propagationPromise.then(() => {
                    readOperationCompletionPromiseResolve?.(responseOperation);
                });

                //return responseOperation;
            })
            .catch((error) => {
                console.log(this.name + " Fetch Request:", iRequest + ", error: ", error);
                let responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, error, null);
                console.error(error);
                console.log(this.identifier + " handleReadOperation dispatch ERROR responseOperation " + responseOperation.id, " for " + responseOperation.referrer.target.name + " like " + responseOperation.referrer.criteria);

                responseOperation.target.dispatchEvent(responseOperation);

                //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
                responseOperation.propagationPromise.then(() => {
                    readOperationCompletionPromiseResolve?.(responseOperation);
                });

                //return responseOperation;
            })

    }

}

// var HttpService = exports.HttpService = RawDataService.specialize(/** @lends HttpService.prototype */ {
HttpService.addClassProperties({

    /***************************************************************************
     * Constants
     */

    /**
     * The Content-Type header corresponding to
     * [application/x-www-form-urlencoded]{@link https://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.1},
     * the default format of form data.
     *
     * @type {Object<string, string>}
     */
    FORM_URL_ENCODED: {
        value: { "Content-Type": "application/x-www-form-urlencoded" }
    },

    /**
     * @type {Object<string, string>}
     * @deprecated in favor of
     *             [FORM_URL_ENCODED]{@link HttpService#FORM_URL_ENCODED}.
     */
    FORM_URL_ENCODED_CONTENT_TYPE_HEADER: {
        get: function () {
            console.warn("HttpService.FORM_URL_ENCODED_CONTENT_TYPE_HEADER is deprecated - use HttpService.FORM_URL_ENCODED instead");
            return this.FORM_URL_ENCODED;
        }
    },


    /***************************************************************************
     * Authorization
     */

    setHeadersForQuery: {
        value: function (headers, query) {
            var authorization = query && query.authorization && query.authorization[0],
                evaluate, scope;

            if (authorization && authorization.headerValueExpression && this.authorizationHeaderName) {
                scope = new Scope(authorization);
                evaluate = compile(parse(authorization.headerValueExpression));
                headers[this.authorizationHeaderName] = evaluate(scope);
            } else if (query && this.authorizationHeaderName && this.authorizationHeaderValueExpression) {
                scope = new Scope(query);
                evaluate = compile(parse(this.authorizationHeaderValueExpression));
                headers[this.authorizationHeaderName] = evaluate(scope);
            } else if (this.authorizationHeaderName && this.authorizationHeaderValue) {
                headers[this.authorizationHeaderName] = this.authorizationHeaderValue;
            }
        }
    },

    /**
     * @type {string}
     * @description Name of header to be passed to all requests along with authorizationHeaderValue
     *
     */
    authorizationHeaderName: {
        value: "Authorization"
    },

    /**
     * @type {string}
     * @description Value of header with name authorizationHeaderName to include with all requests from this service
     *
     */
    authorizationHeaderValue: {
        value: undefined
    },

    /**
     * @type {string}
     * @description FRB Expression defining the authorizationHeaderValue when evaluated against a DataQuery
     *              passed to this service.
     *
     */
    authorizationHeaderValueExpression: {
        value: undefined
    },

    /***************************************************************************
     * Getting property data
     */

    fetchHttpObjectProperty: {
        value: function (type, object, propertyName, prerequisitePropertyNames, criteria) {
            var self, query, prerequisites, stream;
            // Create and cache a new fetch promise if necessary.
            if (!this._getCachedFetchPromise(object, propertyName)) {
                // Parse arguments.
                if (arguments.length >= 4) {
                    query = DataQuery.withTypeAndCriteria(type, arguments[arguments.length - 1]);//RDW unclear if there's any special change required here for formal Criteria

                } else {
                    query = DataQuery.withTypeAndCriteria(type);
                }
                if (arguments.length < 5 || !prerequisitePropertyNames) {
                    prerequisites = [];
                } else if (!Array.isArray(prerequisitePropertyNames)) {
                    prerequisites = Array.prototype.slice.call(arguments, 3, -1);
                } else {
                    prerequisites = prerequisitePropertyNames;
                }
                // Create and cache a new fetch promise
                self = this;
                this._setCachedFetchPromise(object, propertyName, this.nullPromise.then(function () {
                    // First get prerequisite data if necessary...
                    return self.rootService.getObjectProperties(object, prerequisites);
                }).then(function () {
                    // Then fetch the requested data...
                    stream = self.rootService.fetchData(query);
                    return stream;
                }).then(function () {
                    // Then wait until the next event loop to ensure only one
                    // fetch is dispatched per event loop (caching ensures all
                    // subsequent requests for the same fetch promise within the
                    // same event loop will return the same promise)...
                    return self.eventLoopPromise;
                }).then(function () {
                    // Then removes the promise from the cache so subsequent
                    // requests for this fetch promise generate new fetches.
                    self._setCachedFetchPromise(object, propertyName, null);
                    return stream.data;
                }));
            }
            // Return the created or cached fetch promise.
            return this._getCachedFetchPromise(object, propertyName);
        }
    },

    /**
     * @private
     * @method
     */
    _getCachedFetchPromise: {
        value: function (object, propertyName) {
            this._cachedFetchPromises = this._cachedFetchPromises || {};
            this._cachedFetchPromises[propertyName] = this._cachedFetchPromises[propertyName] || new Map();
            return this._cachedFetchPromises[propertyName].get(object);
        }
    },

    /**
     * @private
     * @method
     */
    _setCachedFetchPromise: {
        value: function (object, propertyName, promise) {
            this._cachedFetchPromises = this._cachedFetchPromises || {};
            this._cachedFetchPromises[propertyName] = this._cachedFetchPromises[propertyName] || new Map();
            this._cachedFetchPromises[propertyName].set(object, promise);
        }
    },

    /***************************************************************************
     * Getting raw data
     */

    /**
     * Fetches raw data from an HTTP REST endpoint.
     *
     * @method
     * @argument {String} url                        - The URL of the endpoint.
     * @argument {Object<string, string>}
     *           [headers={}]                        - HTTP header names and
     *                                                 values. Optional except
     *                                                 if a body or types are to
     *                                                 be specified. Pass in an
     *                                                 empty, null, or undefined
     *                                                 header to specify a body
     *                                                 or types but no header.
     * @argument [body]                              - The body to send with the
     *                                                 XMLHttpRequest. Optional
     *                                                 except if types are to be
     *                                                 specified. Pass in a null
     *                                                 or undefined body to
     *                                                 specify types but no
     *                                                 body.
     * @argument {Array<HttpService.DataType>}
     *           [types=[HttpService.DataType.JSON]] - The possible types of
     *                                                 the data expected in
     *                                                 responses. These will
     *                                                 be used to parse the
     *                                                 response data. Currently
     *                                                 only the first type is
     *                                                 taken into account. The
     *                                                 types can be specified as
     *                                                 an array or as a sequence
     *                                                 of
     *                                                 [DataType]{@link HttpService.DataType}
     *                                                 arguments.
     * @argument {boolean} [sendCredentials=true]    - Determines whether
     *                                                 credentials are sent with
     *                                                 the request.
     * @returns {external:Promise} - A promise settled when the fetch is
     * complete. On success the promise will be fulfilled with the data returned
     * from the fetch, parsed according to the specified or detaul types. On
     * error the promise will be rejected with the error.
     */

    _fetchHttpRawDataWithParsedArguments: {
        value: function (parsed) {
            var self = this,
                error, request;

            if (!parsed) {
                error = new Error("Invalid arguments to fetchHttpRawData()");
            } else if (!parsed.url) {
                error = new Error("No URL provided to fetchHttpRawData()");
            }

            return new Promise(function (resolve, reject) {
                var i, keys, key, iValue,
                    startTime = new Date().getTime();

                // Report errors or fetch the requested raw data.
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    request = new XMLHttpRequest();
                    request.onreadystatechange = function () {
                        if (request.readyState === 4) {
                            resolve(request);
                            // console.log("Completed request for (", parsed.url, ") in (", ((new Date().getTime() - startTime)), ") ms");
                        }
                    };
                    request.onerror = function (event) {
                        error = HttpError.withRequestAndURL(request, parsed.url);
                        reject(error);
                    };
                    request.open(parsed.body ? "POST" : "GET", parsed.url, true);

                    self.setHeadersForQuery(parsed.headers, parsed.query, parsed.url);

                    keys = Object.keys(parsed.headers);
                    for (i = 0; (key = keys[i]); ++i) {
                        if (iValue = parsed.headers[key]) {
                            request.setRequestHeader(key, iValue);
                        }
                    }
                    request.withCredentials = parsed.credentials;
                    request.send(parsed.body);
                }
            }).then(function () {
                // The response status can be 0 initially even for successful
                // requests, so defer the processing of this response until the
                // next event loop to give the status time to be set correctly.
                return self.eventLoopPromise;
            }).then(function () {
                // Log a warning for error status responses.
                // TODO: Reject the promise for error statuses.
                if (self._isRequestUnauthorized(request) && typeof self.authorize === "function") {
                    return self.authorize().then(function () {
                        return self._fetchHttpRawDataWithParsedArguments(parsed);
                    });
                } else if (!error && (request.status >= 300 || request.status === 0)) {
                    // error = new Error("Status " + request.status + " received for REST URL " + parsed.url);
                    // console.warn(error);
                    throw HttpError.withRequestAndURL(request, parsed.url);
                }
                // Return null for errors or return the results of parsing the
                // request response according to the specified types.
                // TODO: Support multiple alternate types.

                return parsed.types[0].parseResponse(request, parsed.url);
            });
        }
    },



    fetchHttpRawData: {
        value: function (url, headers, body, types, query, sendCredentials) {
            var parsed = this._parseFetchHttpRawDataArguments.apply(this, arguments);

            // Create and return a promise for the fetch results.
            return this._fetchHttpRawDataWithParsedArguments(parsed);

        }
    },

    /**
     * @private
     * @method
     */
    _parseFetchHttpRawDataArguments: {
        value: function (/* url [, headers [, body [, types]]][, sendCredentials] */) {
            var parsed, last, i, n;
            // Parse the url argument, setting the "last" argument index to -1
            // if the URL is invalid.
            parsed = { url: arguments[0] };
            last = typeof parsed.url === "string" ? arguments.length - 1 : -1;
            if (last < 0) {
                console.warn(new Error("Invalid URL for fetchHttpRawData()"));
            }
            // Parse the sendCredentials argument, which must be the last
            // argument if it is provided, and set the "last" argument index to
            // point just past the last non-sendCredentials argument.
            parsed.credentials = last < 1 || arguments[last];
            if (parsed.credentials instanceof Boolean) {
                parsed.credentials = parsed.credentials.valueOf();
            } else if (typeof parsed.credentials !== "boolean") {
                parsed.credentials = true;
                last += 1;
            }
            // Parse the headers argument, which cannot be a boolean.
            var headers = last > 1 && arguments[1] || {};
            parsed.headers = {};
            if (typeof headers === "object") {
                Object.assign(parsed.headers, headers);
            }
            if (this._isBoolean(headers)) {
                console.warn(new Error("Invalid headers for fetchHttpRawData()"));
                last = -1;
            }
            // Parse the body argument, which cannot be a boolean.
            if (last > 2 && arguments[2]) {
                parsed.body = arguments[2];
                if (this._isBoolean(parsed.body)) {
                    console.warn(new Error("Invalid body for fetchHttpRawData()"));
                    last = -1;
                }
            }

            // Parse the types, which can be provided as an array or as a
            // sequence of DataType arguments.
            if (last === 4 && Array.isArray(arguments[3])) {
                parsed.types = arguments[3];
            } else if (last < 4 || !(arguments[3] instanceof exports.HttpService.DataType)) {
                parsed.types = [exports.HttpService.DataType.JSON];
            } else {
                i = 3;
                n = last;
                while (i < n && arguments[i] instanceof exports.HttpService.DataType) {
                    ++i;
                }
                parsed.types = Array.prototype.slice.call(arguments, 3, i);
                if (i < n) {
                    console.warn(new Error("Invalid types for fetchHttpRawData()"));
                    last = -1;
                }
            }


            if (last === 5 && arguments[4] instanceof DataQuery) {
                parsed.query = arguments[4];
            } else if (last === 4 && arguments[3] instanceof DataQuery) {
                parsed.query = arguments[3];
            }
            // Return the parsed arguments.
            return last >= 0 ? parsed : undefined;
        }
    },

    /**
     * @private
     * @method
     */
    _isBoolean: {
        value: function (value) {
            return typeof value === "boolean" || value instanceof Boolean;
        }
    },

    /***************************************************************************
     * Authorization
     */

    _authRegexp: {
        value: new RegExp(/error=\"([^&]*)\"/)
    },

    _isRequestUnauthorized: {
        value: function (request) {
            return request.status === 401 || (typeof this.didAuthorizationFail === "function" && this.didAuthorizationFail(request));
        }
    },

    /***************************************************************************
     * Utilities
     */

    formUrlEncode: {
        value: function (string) {
            return encodeURIComponent(string).replace(/ /g, "+").replace(/[!'()*]/g, function (c) {
                return '%' + c.charCodeAt(0).toString(16);
            });
        }
    }

}, /** @lends HttpService */ {

    /***************************************************************************
     * Types
     */

    /**
     * @class
     */
    DataType: {
        get: Enumeration.getterFor("_DataType", /** @lends HttpService.DataType */ {

            /**
             * @type {DataType}
             */
            BINARY: [{
                // TO DO.
            }],

            /**
             * @type {DataType}
             */
            JSON: [{
                parseResponse: {
                    value: function (request, url) {
                        var text = request && request.responseText,
                            data = null;
                        if (text) {
                            try {
                                data = JSON.parse(text);
                            } catch (error) {
                                console.warn(new Error("Can't parse JSON received from " + url));
                            }
                        } else if (request && request.status !== 204) {
                            console.warn(new Error("No JSON response received from " + url));
                        }
                        return data;
                    }
                }
            }],

            /**
             * @type {DataType}
             */
            JSONP: [{
                parseResponse: {
                    value: function (request, url) {
                        var text = request && request.responseText,
                            start = text && text.indexOf("(") + 1,
                            end = text && Math.max(text.lastIndexOf(")"), 0),
                            data = null;
                        if (start && end) {
                            try {
                                data = text && JSON.parse(text.slice(start, end));
                            } catch (error) {
                                console.warn(new Error("Can't parse JSONP received from " + url));
                                console.warn("Response text:", text);
                            }
                        } else if (text) {
                            console.warn(new Error("Can't parse JSONP received from " + url));
                            console.warn("Response text:", text);
                        } else if (request && request.status !== 204) {
                            console.warn(new Error("No JSONP response received from " + url));
                        }
                        return data;
                    }
                }
            }],

            /**
             * @type {DataType}
             */
            TEXT: [{
                parseResponse: {
                    value: function (request, url) {
                        var text = request && request.responseText;
                        if (!text && request && request.status !== 204) {
                            console.warn(new Error("No text response received from " + url));
                        }
                        return text;
                    }
                }
            }],

            /**
             * @type {DataType}
             */
            XML: [{
                // TO DO.
            }]

        })
    }

});
