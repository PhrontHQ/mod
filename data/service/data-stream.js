// Note: Montage's promises are used even if ECMAScript 6 promises are available.
var DataProvider = require("./data-provider").DataProvider,
    ObjectDescriptor = require("../../core/meta/object-descriptor").ObjectDescriptor,
    DataQuery = require("../model/data-query").DataQuery,
    Promise = require("../../core/promise").Promise,
    deprecate = require("../../core/deprecate"),
    parse = require("../../core/frb/parse"),
    Scope = require("../../core/frb/scope"),
    compile = require("../../core/frb/compile-evaluator"),
    DataOperation = require("./data-operation").DataOperation,
    DataStream;

/**
 * A [DataProvider]{@link DataProvider} whose data is received sequentially.
 * A DataStream is also a [promise]{@linkcode external:Promise} which is
 * fulfilled when all the data it expects has been received.
 *
 * Objects receiving data from a stream will use its
 * [data]{@link DataStream#data} property to access that data. Alternatively
 * they can use its [then()]{@link DataStream#then} method to get that data or
 * to handle errors, or its [catch()]{@link DataStream#catch} method to handle
 * errors.
 *
 * Objects feeding data to a stream will use its
 * [addData()]{@link DataStream#addData} method to add that data and its
 * [dataDone()]{@link DataStream#dataDone} method to indicate that all available
 * data has been added or its [dataError()]{@link DataStream#dataError} method
 * to indicate an error occurred.
 *
 * Objects can either receive data from a stream or add data to it, but not
 * both. Additionally, only one object can ever add data to a particular
 * stream. Typically that object will be a [Service]{@link DataService}.
 *
 * Each stream is also a [promise]{@linkcode external:Promise} that becomes
 * fulfilled when all the data expected for it is first received and
 * [dataDone()]{@link DataStream#dataDone} is called, or rejected when an
 * error is first encountered and [dataError()]{@link DataStream#dataError}
 * is called. Each such promise is fulfilled or rejected only once and will
 * not be fulfilled or rejected again if the stream's data changes or if an
 * error is encountered subsequently for any reason.
 *
 * @class
 * @extends DataProvider
 *
 */
DataStream = exports.DataStream = DataProvider.specialize(/** @lends DataStream.prototype */ {

    /***************************************************************************
     * Basic properties
     */

    /**
     * The query defining the data returned in this stream.
     *
     * @type {DataQuery}
     */
    _query: {
        value: undefined
    },
    query: {
        get: function () {
            return this._query;
        },
        set: function (value) {
            this._query = value;

            //This will enable a better undertanding of what type of data is coming
            //for objects using UserInterfaceDescriptors like the CascadingList
            if(value && value.type) {
                Object.defineProperty(this.data,"objectDescriptor", {
                    value: value.type,
                    enumerable: false,
                    configurable: true
                });
                // this.data.objectDescriptor = value.type;
            }
        }
    },

    /**
     * The selector defining the data returned in this stream.
     *
     * @type {DataQuery}
     */
    selector: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.query;
        }, "selector", "query"),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this.query = value;
        }, "selector", "query")
    },
    /***************************************************************************
     * DataProvider behavior
     */

    /**
     * The objects that have been added to the stream, as defined in this class'
     * [DataProvider]{@link DataProvider} superclass. This array is created
     * lazilly the first time it is needed and then not allowed to change,
     * though its contents can and typically will change.
     *
     * @type {Array}
     */
    data: {
        get: function() {
            if (!this._data) {
                this._data = [];
            }
            return this._data;
        }
    },

    /**
     * Request specific data, as defined in this class'
     * [DataProvider]{@link DataProvider} superclass. Calling this method has
     * no effect as data will come in the order in which it is added to the
     * stream and this order cannot be changed.
     *
     * TODO: this method should be used to fulfill undefined spots in an array
     * or an iterative batch.
     *
     * @method
     * @argument {int} start  - See [superclass]{@link DataProvider#requestData}.
     * @argument {int} length - See [superclass]{@link DataProvider#requestData}.
     */
    requestData: {
        value: function (start, length) {
            // Don't do anything.
            return this;
        }
    },

    /***************************************************************************
     * Promise behavior
     */

    _resolve: {
        value: function (value) {
            if (!this.__promise) {
                this.__promise = Promise.resolve(value);
            }
        }
    },

    _reject: {
        value: function (reason) {
            // Defers the creation of the rejection promise by setting __promise
            // to a function that will create the appropriate promise when it
            // is needed. This way if the promise is not needed it won't be
            // created. This avoids the "unhandled rejection" error that
            // Montage's Promises logs for promises that are rejected but whose rejection
            // is not handled.
            if (!this.__promise) {
                this.__promise = function () {return Promise.reject(reason);};
            }
        }
    },

    _promise: {
        get: function () {
            var self = this;
            if (typeof this.__promise === "function") {
                this.__promise = this.__promise();
            } else if (!this.__promise) {
                this.__promise = new Promise(function(resolve, reject) {
                    self._resolve = resolve;
                    self._reject = reject;
                });
            }
            return this.__promise;
        }
    },

    /**
     * Method of the [Promise]{@linkcode external:Promise} class used to
     * kick off additional processing when all the data expected by this
     * stream has been received or when an error has been encountered.
     *
     * @method
     * @argument {OnFulfilled} onFulfilled - Called when the stream's
     *                                       [dataDone()]{@link DataStream#dataDone}
     *                                       method is called, usually after all
     *                                       the data expected for the stream
     *                                       has been sent to it. Because a
     *                                       stream's selector can change after
     *                                       that, or changes in the service
     *                                       data can occur for other reasons,
     *                                       it is possible for a stream's
     *                                       [data]{@link DataStream#data} array
     *                                       contents to change after this
     *                                       callback is called. If that happens
     *                                       this callback will not be called
     *                                       again. This callback therefore only
     *                                       provides an indication of when the
     *                                       first set of data expected by a
     *                                       stream is received. The value
     *                                       passed in to this callback is the
     *                                       stream's {@link DataStream#data}.
     * @argument {OnRejected} [onRejected] - Called when the stream's
     *                                       [dataError()]{@link DataStream#dataError}
     *                                       method is called, usually after
     *                                       an error is encountered while
     *                                       fetching data for the stream.
     *                                       The value passed in to this
     *                                       callback will be the `reason`
     *                                       received by the stream's
     *                                       [dataError()]{@link DataStream#dataError}
     *                                       method. Because
     *                                       [catch()]{@link DataStream#catch}
     *                                       also handles the case where
     *                                       exceptions are encountered
     *                                       in the `onFulfilled`
     *                                       callback, this argument is
     *                                       usually not provided and
     *                                       [catch()]{@link DataStream#catch}
     *                                       is usually used instead to specify
     *                                       the `onRejected` callback.
     */
    then: {
        value: function (onFulfilled, onRejected) {
            return this._promise.then(onFulfilled, onRejected);
        }
    },
    
    finally: {
        value: function (onFinally) {
            return this._promise.finally(onFinally);
        }
    },


    thenForEach: {
        value: function (onFulfilled, onRejected) {
            this._dataBatchPromises = [];
            this.query._doesBatchResults = true;
            this._forEachFulilledBatch = onFulfilled;
            //return this._promise.then(onFulfilled, onRejected);
            return this._promise;

            // var self = this;
            // if (typeof this.__forEachPromise === "function") {
            //     this.__forEachPromise= this.__forEachPromise();
            // } else if (!this.__forEachPromise) {
            //     this.__forEachPromise = new Promise(function(resolve, reject) {
            //         self._forEachPromiseResolve = resolve;
            //         self._forEachPromiseReject = reject;
            //     });
            // }

            // this._thenForEachFulfilled = onFulfilled;
            // this._thenForEachRejected = onRejected;


            // return this.__promise;

            // return this._forEachPromise.then(onFulfilled, onRejected);
        }
    },


    /**
     * Method of the [Promise]{@linkcode external:Promise} class used to
     * kick off additional processing when an error has been encountered.
     *
     * @method
     * @argument {OnRejected} onRejected   - Called when the stream's
     *                                       [dataError()]{@link DataStream#dataError}
     *                                       method is called, usually after
     *                                       an error is encountered while
     *                                       fetching data for the stream.
     *                                       The value passed in to this
     *                                       callback will be the `reason`
     *                                       received by the stream's
     *                                       [dataError()]{@link DataStream#dataError}
     *                                       method.
     */
    catch: {
        value: function (onRejected) {
            return this._promise.catch(onRejected);
        }
    },

    /***************************************************************************
     * Feeding the stream
     */

    /**
     * Add some object to the stream's [data]{@link DataStream#data} array.
     *
     * @method
     * @argument {Array} objects - An array of objects to add to the stream's
     *                             data. If this array is empty, `null`, or
     *                             `undefined`, no objects are added.
     */
    addData: {
        value: function (objects) {
            var data = objects;

            if (this.dataExpression && objects) {
                //#PERFORMANCE
                //We shpuldn't be creating a Scope every time, but reusing one
                //and set its value
                data = this._compiledDataExpression(new Scope(objects));
            }


            if (data && Array.isArray(data)) {
                this.data.push.apply(this.data, data);
            } else if (data) {
                this.data.push(data);
            }
        }
    },

    /**
     * To be called when all the data expected by this stream has been added
     * to its [data]{@link DataStream#data} array. After this is called
     * all subsequent calls to [dataDone()]{@link DataStream#dataDone}
     * or [dataError()]{@link DataStream#dataError} will be ignored.
     *
     * @method
     */
    dataDone: {
        value: function () {
            this._resolve(this.data);
            delete this._resolve;
            delete this._reject;
        }
    },

    //Experimental with Shopify first, _hasNextPage is Shopify specific
    //It is set on the stream by the RawDataServie before calling batchDataDone on the stream
    hasPendingData: {
        get: function() {
            return this.hasOwnProperty("_hasNextPage") && this._hasNextPage;
        }
    },

    _batchCount: {
        value: 0
    },

    _dataBatchPromises: {
        value: 0
    },

    /**
     * To be called when a batch of data expected by this stream has been added
     * to its [data]{@link DataStream#data} array.
     *
     * TODO: an argument should be passed to dataBatchDone, and it should be a ReadUpdated operation
     * That operation should have properties like the stream, the results, the batch size, the batch number
     * (3rd one since the beginning if we don't know the full size, which could change at any time), etc...
     * That read operation would then be passed to thenForEach(function(readUpdatedOperation){...}).then(...)
     *
     * @method
     */
    dataBatchDone: {
        value: function (readUpdatedOperation) {
            var batchCallResult;
            this._batchCount++;

            //This is probably should come from lower layers, the RawDataService in the Worker, but until then:
            if(!readUpdatedOperation) {
                var readUpdatedOperation = new DataOperation();
                readUpdatedOperation.type = DataOperation.Type.ReadUpdatedOperation;
                readUpdatedOperation.objectDescriptor = readUpdatedOperation.dataType = this.query.type;
                readUpdatedOperation.cursor = this._cursor;
                readUpdatedOperation.batchSize = this.query.batchSize;
                readUpdatedOperation.batchCount = this._batchCount;
                //FIXME, when we get a readUpdatedOperation from bellow, it should have the
                //batch in it and we shouldn't have to slice the full array here
                readUpdatedOperation.data = this.data.slice(this._lastBatchIndex);
            }

            //Kick starts the request for the next batch:
            if(this.hasPendingData) {
                var readUpdateOperation = new DataOperation();
                readUpdateOperation.type = DataOperation.Type.ReadUpdateOperation;
                readUpdateOperation.objectDescriptor = readUpdateOperation.dataType = this.query.type;
                readUpdateOperation.cursor = this._cursor;
                readUpdateOperation.batchSize = this.query.batchSize;


                //When we have a first read operation that corresponds to the query, we need to set it as the referrer:
                //readUpdateOperation.referrer = this.readOperation
                readUpdateOperation.referrer = this;
                DataStream.DataService.mainService.readData(readUpdateOperation, this);
            }

            //Deliver the current batch
            batchCallResult = this._forEachFulilledBatch(readUpdatedOperation);
            if(Promise.is(batchCallResult)) {
                this._dataBatchPromises.push(batchCallResult);
            }

            if(!this.hasPendingData) {
                if(this._dataBatchPromises.length) {
                    var self = this;
                    Promise.all(this._dataBatchPromises)
                    .then(function(success) {
                        self.dataDone();
                    },function(error) {
                        self.dataError(error);
                    } );
                }
                else {
                    this.dataDone();
                }
            }
        }
    },

    /**
     * To be called when a problem is encountered while trying to
     * fetch data for this stream. After this is called all subsequent
     * calls to [dataError()]{@link DataStream#dataError} or
     * [dataDone()]{@link DataStream#dataDone} will be ignored.
     *
     * @method
     * @argument {Object} [reason] - An object, usually an {@link Error},
     *                               indicating what caused the problem.
     *                               This will be passed in to any
     *                               {@link external:onRejected}
     *                               callback specified in
     *                               [then()]{@link DataStream#then} or
     *                               [catch()]{@link DataStream#catch} calls
     *                               to the stream.
     */
    dataError: {
        value: function (reason) {
            this._reject(reason);
            delete this._reject;
            delete this._resolve;
        }
    },

    _compiledDataExpression: {
        get: function () {
            return this.__compiledDataExpression || (this.__compiledDataExpression = compile(this._dataExpressionSyntax));
        }
    },

    _dataExpressionSyntax: {
        get: function () {
            return this.__dataExpressionSyntax || (this.__dataExpressionSyntax = parse(this.dataExpression));
        }
    },

    dataExpression: {
        value: undefined
    },

    evaluateDataExpression: {
        value: function(value) {
            return this._compiledDataExpression(value);
        }
    },

    /**
     * The time at which data was received by the DataStream
     *
     * @type {Date}
     */
    dataReceptionTime: {
        value: undefined
    },

    /**
     * The maximum amount of time a DataStream's data will be considered fresh.
     * This should take precedence over an ObjectDescriptor's maxAge which should
     * take precedence over a DataService's dataMaxAge global default value.
     *
     * @type {Number}
     */
    _dataMaxAge: {
        value: undefined
    },
    dataMaxAge: {
        get: function() {
            //The third default should be the service's dataMaxAge, but:
            //DataService.[mainService||rootService].dataServiceForDataStream(this) should work
            //but is maintained on a per DataService basis and there's no cascading lookup.
            //#FixMe So we need to fix this as a DataStream doesn't know which service created it.
            return this._dataMaxAge || this.query.type.maxAge;
        },
        set: function(value) {
            this._dataMaxAge = value;
        }
    }


}, /** @lends DataStream */ {

    withTypeOrSelector: {
        // value: deprecate.deprecateMethod(scope, deprecatedFunction, name, alternative, once)
        value: deprecate.deprecateMethod(exports.DataStream, function (typeOrSelector) {
            return this.withTypeOrQuery(typeOrSelector);
        }, "withTypeOrSelector", "withTypeOrQuery", true)
    },

    withTypeOrQuery: {
        value: function (typeOrQuery) {
            var type = typeOrQuery instanceof ObjectDescriptor && typeOrQuery,
                query = type && DataQuery.withTypeAndCriteria(type) || typeOrQuery,
                stream = new this();
            stream.query = query;
            return stream;
        }
    }

});
