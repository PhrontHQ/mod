const { identity } = require("../../core/collections/shim-function");

const RawDataService = require("./raw-data-service").RawDataService,
    AuthenticationPolicy = require("./authentication-policy").AuthenticationPolicy,
    Identity = require("../model/identity").Identity,
    DataQuery = require("../model/data-query").DataQuery,
    Criteria = require("../../core/criteria").Criteria,
    Enumeration = require("../model/enumeration").Enumeration,
    Map = require("../../core/collections/map"),
    Montage = require("../../core/core").Montage,
    parse = require("../../core/frb/parse"),
    compile = require("../../core/frb/compile-evaluator"),
    evaluate = require("../../core/frb/evaluate"),
    Scope = require("../../core/frb/scope"),
    Promise = require("../../core/promise").Promise;


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


    /**
     * Fetch an identity using an identityQuery expected to be set on the data service
     *
     * @type {Promise<Identity>}
     */
    fetchIdentity() {


        // console.warn("fetchIdentity() this.currentEnvironment is ", this.currentEnvironment);
        // console.warn("fetchIdentity() this.hasOwnProperty('_connection') is ", this.hasOwnProperty('_connection'));
        // console.warn("fetchIdentity() Object.getOwnPropertyDescriptor(this, 'connection') is ", Object.getOwnPropertyDescriptor(this, 'connection'));


        if(!this.identityQuery) {
            throw "Can't perform fetchIdentity() because this.identityQuery isn't available";
        }

        return this.mainService.fetchData(this.identityQuery)
        .then(result => {
            if(result.length === 1) {
                /*
                    It's a bit tricky to assume that here. An alternative would be to actually fetch an Identity,
                    and equip SecretManager data services with the ability to handle Identity, and give them a mapping
                    to how the raw data is stored in the secret. Let's get this working and clean it up later. 
                */
                let applicationIdentifier = result[0].value.applicationIdentifier,
                    applicationCredentials =  result[0].value.applicationCredentials;

                if(applicationIdentifier && applicationCredentials) {
                    let identity = new Identity();

                    identity.applicationIdentifier = applicationIdentifier;
                    identity.applicationCredentials = applicationCredentials;

                    this.identity = identity; 
                    return this.identity;                          
                } else {
                    throw ("Unnable to ceate an idendity from fetched secret: "+ result);
                }
            } else {
                throw ("Unnable to find a secret matching query " + this.identityQuery);

            }
        })
        .catch(error => {
            console.warn("fetchIdentity failed:", error);
            return null;
        })


    }



    handleReadOperation(readOperation) {

        /*
            Until we solve more efficiently (lazily) how RawDataServices listen for and receive data operations, we have to check wether we're the one to deal with this:
        */
        if(!this.handlesType(readOperation.target)) { 
            return;
        }
        
        var objectDescriptor = readOperation.target,
            mapping = objectDescriptor && this.mappingForObjectDescriptor(objectDescriptor),
            authenticationPromise, 
            responseOperation,
            readOperationCompletionPromiseResolvers,
            readOperationCompletionPromise, readOperationCompletionPromiseResolve, readOperationCompletionPromiseReject;


        if(this.promisesReadOperationCompletion) {
            readOperationCompletionPromiseResolvers = Promise.withResolvers();
            readOperationCompletionPromise = readOperationCompletionPromiseResolvers.promise;
            readOperationCompletionPromiseResolve = readOperationCompletionPromiseResolvers.resolve;
            readOperationCompletionPromiseReject = readOperationCompletionPromiseResolvers.reject;
        } else {
            readOperationCompletionPromise = readOperationCompletionPromiseResolve = readOperationCompletionPromiseReject = undefined;
        }

        if(this.authenticationPolicy && this.authenticationPolicy === AuthenticationPolicy.UP_FRONT) {
            let identityPromise;

            if(!this.identity) {
                identityPromise = this.fetchIdentity();
            } else {
                identityPromise = Promise.resolve(this.identity);
            }

            /*
                if we don't have a token or if it's expired (this.accessToken.remainingValidityDuration is negative), 
                or about to (under 2000ms / 2s left on its validity) 

                then we re-authenticate
            */
        //    if(this.accessToken) {
        //         console.debug("this.accessToken.remainingValidityDuration is "+ this.accessToken.remainingValidityDuration +" ms");
        //    }
            if(!this.accessToken || this.accessToken.remainingValidityDuration < 2000) {

                if(this.accessToken) {

                    console.debug(this.name+" renewing access token that is about to expire: "+this.accessToken.remainingValidityDuration+"ms left")

                    //Clear the cache
                    this.mainService.unregisterReadOnlyDataObject(this.accessToken);
                    this.unregisterAccessTokenForIdentity(this.identity);

                }
                // console.debug("this.identity: ",this.identity);
                authenticationPromise = identityPromise.then((result) => {
                    let identityCriteria = new Criteria().initWithExpression("identity == $", this.identity),
                        tokenDataQuery = DataQuery.withTypeAndCriteria(this.accessTokenDescriptor, identityCriteria),
                        tokenQueryDataStream;
        
                    tokenDataQuery.identity = this.identity;
                    tokenQueryDataStream = this.mainService.fetchData(tokenDataQuery);
            
                    return tokenQueryDataStream.then((result) => {
                        if(result && result.length === 1) {
                            let accessToken = result[0];
                            this.registerAccessTokenForIdentity(accessToken, this.identity);

                            return accessToken;
                        } else {
                            return null;
                        }
                    });

                })
                .catch(error => {
                    let responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, error, null);
                    console.error(error);
                    return responseOperation;
                });

            } else {
                authenticationPromise = Promise.resolve(this.accessToken);
            }
        } else {
            authenticationPromise = Promise.resolve();
        }

        authenticationPromise.then((accessToken) => {

            //if(accessToken?.accessToken) console.debug("accessToken: ",accessToken.accessToken);
            // mapping = objectDescriptor && this.mappingForType(objectDescriptor),
            var fetchRequests = [],
            i, iRequest;

            if(typeof mapping.mapDataOperationToFetchRequests === "function") {
                mapping.mapDataOperationToFetchRequests(readOperation, fetchRequests);
            }
            else {
                let error = new Error(this.name+": No Mapping for "+ readOperation.target.name+ " lacks mapDataOperationToFetchRequests(readOperation, fetchRequests) method");
                responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, error, null);
                responseOperation.target.dispatchEvent(responseOperation);

                //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
                responseOperation.propagationPromise.then(() => {
                    readOperationCompletionPromiseResolve?.(responseOperation);
                });
                
            }
            
            if(fetchRequests.length > 0) {

                for(i=0; (iRequest = fetchRequests[i]); i++) {
                    console.debug(iRequest.url);
                    // console.debug("iRequest headers: ",iRequest.headers);
                    // console.debug("iRequest body: ",iRequest.body);
                    // .finally((value) => {
                    //     console.debug("finally objectDescriptor.dispatchEvent("+responseOperation+");");
                    //     objectDescriptor.dispatchEvent(responseOperation);
                    // })
                    this._fetchReadOperationRequest(readOperation, iRequest, mapping, readOperationCompletionPromiseResolve);
                }              
            } else {
                let criteriaParameters = readOperation?.criteria?.parameters,
                    qualifiedProperties = readOperation?.criteria?.qualifiedProperties,
                    rawDataPrimaryKeyProperties = mapping.rawDataPrimaryKeyProperties,
                    rawData = [];

                if(readOperation.data.readExpressions && readOperation.data.readExpressions.length > 0 && qualifiedProperties?.length == 1) {
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
                    responseOperation.target.dispatchEvent(responseOperation);

                    //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
                    responseOperation.propagationPromise.then(() => {
                        readOperationCompletionPromiseResolve?.(responseOperation);
                    });

                } else {
                    let error = new Error("No Mapping found "+ readOperation.target.name+ " "+readOperation.data.readExpressions);
                
                    console.once.error(error.message);
                    if(readOperation.clientId) {
                        error.stack = null;
                    }
                    responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, error, null);
                    responseOperation.target.dispatchEvent(responseOperation);

                    //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
                    responseOperation.propagationPromise.then(() => {
                        readOperationCompletionPromiseResolve?.(responseOperation);
                    });
                    
                }

            }


        })
        .catch((error) => {
            responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, error, null);
            console.error(error);
            responseOperation.target.dispatchEvent(responseOperation);

            //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
            responseOperation.propagationPromise.then(() => {
                readOperationCompletionPromiseResolve?.(responseOperation);
            });
            
        });
        
        return readOperationCompletionPromise;
    }

    _fetchReadOperationRequest(readOperation, iRequest, mapping, readOperationCompletionPromiseResolve) {
        fetch(iRequest)
        .then((response) => {
            if (response.status === 200) {
                console.debug("200: "+response.url);

                //console.log("Cache-Control: " + response.headers.get('Cache-Control') || response.headers.get('cache-control'));
                if(response.headers.get('content-type').includes("json")) {
                    return response.json();
                } else {
                    return response.text();
                }
            } else if( response.status === 401) {
                console.debug("401: "+response.url);
                // console.log("Token has expired?",response);
                throw new Error("Token has expired");
            } else if( response.status === 404) {
                /*
                    This is the case where the API is all path and therefore in case nothing is found, the response is logically a 404
                */
                if((new URL(response.url)).search === "") {
                    return null;
                } else {
                    console.log(`No ${readOperation.target.name} Data found for criteria ${readOperation.criteria.expression} with parameters ${JSON.stringify(readOperation.criteria.parameters)} at ${response.url}`);
                    throw new Error(`No ${readOperation.target.name} Data found for criteria ${readOperation.criteria.expression} with parameters ${JSON.stringify(readOperation.criteria.parameters)} at ${response.url}`);    
                }
            }
            else {
                return response.text()
                .then((responseContent) => {
                    if(responseContent === "") {
                        console.log(response);
                    }
                    throw new Error("Request failed with error: " + responseContent);
                });
            }
        })
        .then((responseContent) => {
            //console.debug(iRequest.url+": ",JSON.stringify(responseContent));

            let rawData = [];
            mapping.mapFetchResponseToRawData(responseContent, rawData);
            //console.debug("rawData: ",rawData);
            let responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, null, rawData);
            console.debug("then responseOperation.target.dispatchEvent("+responseOperation+");");
            responseOperation.target.dispatchEvent(responseOperation);

            //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
            responseOperation.propagationPromise.then(() => {
                readOperationCompletionPromiseResolve?.(responseOperation);
            });

            //return responseOperation;
        })
        .catch((error) => {
            console.log(this.name+" Fetch Request:", iRequest+", error: ", error);
            let responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, error, null);
            console.error(error);
            console.debug("catch responseOperation.target.dispatchEvent("+responseOperation+");");
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
        value: {"Content-Type": "application/x-www-form-urlencoded"}
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
            var self, selector, prerequisites, stream;
            // Create and cache a new fetch promise if necessary.
            if (!this._getCachedFetchPromise(object, propertyName)) {
                // Parse arguments.
                if (arguments.length >= 4) {
                    selector = DataQuery.withTypeAndCriteria(type, arguments[arguments.length - 1]);//RDW unclear if there's any special change required here for formal Criteria

                } else {
                    selector = DataQuery.withTypeAndCriteria(type);
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
                    stream = self.rootService.fetchData(selector);
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
                        if(iValue = parsed.headers[key]) {
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
            parsed = {url: arguments[0]};
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
            return encodeURIComponent(string).replace(/ /g, "+").replace(/[!'()*]/g, function(c) {
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
