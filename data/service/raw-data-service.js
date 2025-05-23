var DataService = require("./data-service").DataService,
    compile = require("../../core/frb/compile-evaluator"),
    DataMapping = require("./data-mapping").DataMapping,
    DataIdentifier = require("../model/data-identifier").DataIdentifier,
    Deserializer = require("../../core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    Map = require("../../core/collections/map"),
    //Montage = (require) ("../../core/core").Montage,
    parse = require("../../core/frb/parse"),
    Scope = require("../../core/frb/scope"),
    deprecate = require("../../core/deprecate"),
    compile = require("../../core/frb/compile-evaluator"),
    DataOrdering = require("../model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("../../core/frb/evaluate"),
    RawForeignValueToObjectConverter = require("../converter/raw-foreign-value-to-object-converter").RawForeignValueToObjectConverter,
    DataOperation = require("./data-operation").DataOperation,
    DataOperationType = require("./data-operation").DataOperationType,
    Promise = require("../../core/promise").Promise,
    SyntaxInOrderIterator = require("../../core/frb/syntax-iterator").SyntaxInOrderIterator,
    RawEmbeddedValueToObjectConverter = require("../converter/raw-embedded-value-to-object-converter").RawEmbeddedValueToObjectConverter,
    ReadEvent = require("../model/read-event").ReadEvent,
    TransactionDescriptor = require("../model/transaction.mjson").montageObject,
    TransactionEvent = require("../model/transaction-event").TransactionEvent,
    uuid = require("../../core/uuid"),
    syntaxProperties = require("../../core/frb/syntax-properties"),
    //DataEvent = (require)("../model/data-event").DataEvent,
    DataQuery = require("../model/data-query").DataQuery;

require("../../core/collections/shim-object");

/**
 * Provides data objects of certain types and manages changes to them based on
 * "raw" data obtained from or sent to one or more other services, typically
 * REST or other network services. Raw data services can therefore be considered
 * proxies for these REST or other services.
 *
 * Raw data services are usually the children of a
 * [data service]{@link DataService} that often is the application's
 * [main data service]{@link DataService.mainService}. All calls to raw data
 * services that have parent services must be routed through those parents.
 *
 * Raw data service subclasses that implement their own constructor should call
 * this class' constructor at the beginning of their constructor implementation
 * with code like the following:
 *
 *     RawDataService.call(this);
 *
 * @class
 * @extends DataService
 */
const RawDataService = exports.RawDataService = class RawDataService extends DataService {/** @lends RawDataService */

    constructor() {
        super();

        this._typeIdentifierMap = new Map();
        this._descriptorToRawDataTypeMappings = new Map();

        if (this.supportsDataOperation) {
            this.addEventListener(DataOperation.Type.ReadUpdateOperation, this, false);
            this.addEventListener(DataOperation.Type.ReadFailedOperation, this, false);
            this.addEventListener(DataOperation.Type.ReadCompletedOperation, this, false);

            if (this.supportsTransaction) {
                this.addEventListener(DataOperationType.createTransactionOperation, this, false);
                this.addEventListener(DataOperationType.createTransactionCompletedOperation, this, false);
                this.addEventListener(DataOperationType.createTransactionFailedOperation, this, false);
                this.addEventListener(DataOperation.Type.BatchCompletedOperation, this, false);
                this.addEventListener(DataOperation.Type.BatchFailedOperation, this, false);
                this.addEventListener(DataOperation.Type.TransactionUpdatedOperation, this, false);
                this.addEventListener(DataOperation.Type.CommitTransactionProgressOperation, this, false);
                this.addEventListener(DataOperation.Type.CommitTransactionFailedOperation, this, false);
                this.addEventListener(DataOperation.Type.CommitTransactionCompletedOperation, this, false);
                this.addEventListener(DataOperation.Type.RollbackTransactionFailedOperation, this, false);
                this.addEventListener(DataOperation.Type.RollbackTransactionCompletedOperation, this, false);
            }

            this._pendingDataOperationById = new Map();
            this._rawContextByTransaction = new WeakMap();
        }
    }


    handleReadOperation(readOperation) {
        
    }
 
}

// exports.RawDataService = DataService.specialize(/** @lends RawDataService.prototype */ {

//     /***************************************************************************
//      * Initializing
//      */

//     constructor: {
//         value: function RawDataService() {
//             this.super();
//             this._typeIdentifierMap = new Map();
//             this._descriptorToRawDataTypeMappings = new Map();

//             if (this.supportsDataOperation) {
//                 this.addEventListener(DataOperation.Type.ReadUpdateOperation, this, false);
//                 this.addEventListener(DataOperation.Type.ReadFailedOperation, this, false);
//                 this.addEventListener(DataOperation.Type.ReadCompletedOperation, this, false);

//                 if (this.supportsTransaction) {
//                     this.addEventListener(DataOperationType.createTransactionOperation, this, false);
//                     this.addEventListener(DataOperationType.createTransactionCompletedOperation, this, false);
//                     this.addEventListener(DataOperationType.createTransactionFailedOperation, this, false);
//                     this.addEventListener(DataOperation.Type.BatchCompletedOperation, this, false);
//                     this.addEventListener(DataOperation.Type.BatchFailedOperation, this, false);
//                     this.addEventListener(DataOperation.Type.TransactionUpdatedOperation, this, false);
//                     this.addEventListener(DataOperation.Type.CommitTransactionProgressOperation, this, false);
//                     this.addEventListener(DataOperation.Type.CommitTransactionFailedOperation, this, false);
//                     this.addEventListener(DataOperation.Type.CommitTransactionCompletedOperation, this, false);
//                     this.addEventListener(DataOperation.Type.RollbackTransactionFailedOperation, this, false);
//                     this.addEventListener(DataOperation.Type.RollbackTransactionCompletedOperation, this, false);
//                 }

//                 this._pendingDataOperationById = new Map();
//                 this._rawContextByTransaction = new WeakMap();
//             }
//         }
//     },
RawDataService.addClassProperties({

    addMainServiceEventListeners: {
        value: function () {

            if (this.canSaveData) {
                this.mainService.addEventListener(TransactionEvent.transactionCreate, this, false);
            }

            if (this.supportsDataOperation) {
                this.addEventListener(ReadEvent.read, this, false);
                /*
                    DataOperations on their way out:
                */

                this.addEventListener(DataOperation.Type.ReadOperation, this, false);
                this.addEventListener(DataOperation.Type.CreateOperation, this, false);
                this.addEventListener(DataOperation.Type.UpdateOperation, this, false);
                this.addEventListener(DataOperation.Type.MergeOperation, this, false);
                this.addEventListener(DataOperation.Type.DeleteOperation, this, false);
                this.addEventListener(DataOperation.Type.PerformTransactionOperation,this, false);
                this.addEventListener(DataOperation.Type.CreateTransactionOperation, this, false);
                this.addEventListener(DataOperation.Type.AppendTransactionOperation, this, false);
                this.addEventListener(DataOperation.Type.CommitTransactionOperation, this, false);
                this.addEventListener(DataOperation.Type.RollbackTransactionOperation, this, false);

                this.mainService.addEventListener(DataOperation.Type.AppendTransactionCompletedOperation, this, false);
                this.mainService.addEventListener(DataOperation.Type.AppendTransactionFailedOperation, this, false);


            }
        }
    },


    /**
     * @deprecated
     */
    initWithModel: {
        value: function (model) {
            var self = this;
            return require.async(model).then(function (descriptor) {
                var deserializer = new Deserializer().init(JSON.stringify(descriptor), require);
                return deserializer.deserializeObject();
            }).then(function (model) {
                self.model = model;
                return self;
            });
        }
    },

    /***************************************************************************
     * Serialization
     * 
     * TODO: serializeSelf is missing
     */

    deserializeSelf: {
        value: function (deserializer) {
            this.super(deserializer);
            var value = deserializer.getProperty("rawDataTypeMappings");
            this._registerRawDataTypeMappings(value || []);

            value = deserializer.getProperty("connectionDescriptor");
            if (value) {
                this.connectionDescriptor = value;
            }

            /*
                setting connectionIdentifier will set the current connection
                based on connectionDescriptor.

                TODO: this should then be named: currentConnectionIdentifier

                I can still be overriden by the direct setting of connection bellow
            */
            value = deserializer.getProperty("connectionIdentifier");
            if (value) {
                console.log(this.name+" deserializeSelf: connectionIdentifier is ",value);
                this.connectionIdentifier = value;
            }

            value = deserializer.getProperty("connection");
            if (value) {
                console.log(this.name+" deserializeSelf: connection is ",value);

                this.connection = value;
            }

            value = deserializer.getProperty("promisesReadOperationCompletion");
            if (value) {
                this.promisesReadOperationCompletion = value;
            }

            

        }
    },


    /*
     * The ConnectionDescriptor object where possible connections will be found
     *
     * @type {ConnectionDescriptor}
     */
    _connectionDescriptor: {
        value: undefined
    },
    connectionDescriptor: {
        get: function () {
            return this._connectionDescriptor;
        },
        set: function (value) {
            if (value !== this._connectionDescriptor) {
                this._connectionDescriptor = value;

                //Reset potentually cached values
                this._connection = null;
                this._registeredConnectionsByIdentifier = null;
                this.registerConnections(value);
            }
        }
    },
    /**
     * Description...
     *
     * @method
     * @argument {Array} [connectionDescription] - The different known connections to the database
     *
     */
    _registeredConnectionsByIdentifier: {
        value: undefined
    },
    registerConnections: {
        value: function (connectionDescriptor) {

            this._registeredConnectionsByIdentifier = connectionDescriptor;

            for (var i = 0, connections = Object.keys(connectionDescriptor), countI = connections.length, iConnectionIdentifier, iConnection; (i < countI); i++) {
                iConnectionIdentifier = connections[i];
                iConnection = connectionDescriptor[iConnectionIdentifier];

                Object.defineProperty(iConnection, "identifier", {
                    value: iConnectionIdentifier,
                    enumerable: false,
                    configurable: true,
                    writable: true
                });

                //this._registeredConnectionsByIdentifier.set(iConnectionIdentifier,iConnection);
            }
        }
    },

    connectionForIdentifier: {
        value: function (connectionIdentifier) {
            return this._registeredConnectionsByIdentifier?.[connectionIdentifier];
            //return this._registeredConnectionsByIdentifier.get(connectionIdentifier);
        }
    },

    connectionWithKeyValue: {
        value: function (connectionKey, conectionValue) {
            for (var i = 0, connections = Object.keys(connectionDescriptor), countI = connections.length, iConnection; (i < countI); i++) {
                iConnection = connectionDescriptor[connections[i]];
                if (iConnection[connectionKey] === conectionValue) {
                    return iConnection;
                }
            }
            return null;
        }
    },
    /*
     * The current DataConnection object used to connect to data source
     *
     * @type {DataConnection}
     */
    _connectionIdentifier: {
        value: undefined
    },

    connectionIdentifier: {
        get: function () {
            return this._connectionIdentifier;
        },
        set: function (value) {
            console.log(this.name+" connectionIdentifier setter('"+value+"')");

            if (value !== this._connectionIdentifier) {
                this._connectionIdentifier = value;
                this.connection = this.connectionForIdentifier(value);
            }
        }
    },

    /*
     * The current DataConnection object used to connect to data source
     *
     * @type {DataConnection}
     */
    _connection: {
        value: undefined
    },

    connection: {
        get: function() {
            // console.log(">>>>>> "+ this.name+" connection getter: this._connection is ",this._connection);

            if(!this._connection) {

                /*
                    Adding a bit of logic since apparently an RDS Proxy must be in the same VPC as the database and although the database can be publicly accessible, the proxy can’t be.

                    So in working locally we need to address the database cluster directly.

                    -> https://www.stackovercloud.com/2020/06/30/amazon-rds-proxy-now-generally-available/
                */

                // console.log(this.name+" connection getter: this.connectionIdentifer is ",this.connectionIdentifer);
                // console.log(this.name+" connection getter: this.currentEnvironment is ",this.currentEnvironment);
                // console.log(this.name+" connection getter: this.currentEnvironment.isGCP is ",this.currentEnvironment.isGCP);
                // console.log(this.name+" connection getter: this.currentEnvironment.isCloud is ",this.currentEnvironment.isCloud);
                // console.log(this.name+" connection getter: this.currentEnvironment.stage is ",this.currentEnvironment.stage);

                //If we have an connectionIdentifer, we go for it, otherwise we go for a stage-based logic
                if(this.connectionIdentifer) {
                    this.connection = this.connectionForIdentifier(this.connectionIdentifer);
                }
                else if(!this.currentEnvironment.isCloud) {
                    let connection = this.connectionForIdentifier(`local-${this.currentEnvironment.stage}`);

                    //If we can't find a local specific one, we'll look for the one for this.currentEnvironment.stage
                    if(!connection) {
                        connection = this.connectionForIdentifier(this.currentEnvironment.stage);
                    }
                    this.connection = connection;
                    
                } else {
                    this.connection = this.connectionForIdentifier(this.currentEnvironment.stage);
                }

                if(!this._connection) {
                    throw "RawDataService "+ (this.name || this.identifier) + "could not find a connection for "+this.currentEnvironment.stage+" environment";
                }

            }
            return this._connection;
        },
        set: function(value) {

            if(value !== this._connection) {
                this._connection = value;
            }
        }

    },

    /*
     * The current Connection's Token's ObjectDescriptor used to build 
     * the DataQuery with identity's to get an accessToken
     * 
     * @type {DataConnection}
     */

    accessTokenDescriptor: {
        get: function () {
            return this.connection.accessTokenDescriptor;
        }
    },
    
    

    _rawClientPromises: {
        value: undefined
    },

    rawClientPromises: {
        get: function () {

            if (!this._rawClientPromises) {
                this._rawClientPromises = [];
            }
            return this._rawClientPromises;
        }
    },

    _rawClientPromise: {
        value: undefined
    },

    rawClientPromise: {
        get: function () {
            if (!this._rawClientPromise) {
                this._rawClientPromise = Promise.all(this.rawClientPromises).then(() => { 
                    return this.rawClient;
                });
            }
            return this._rawClientPromise;
        }
    },

    /**
     * This property holds the rawClient typically used by client libraries provided by cloud vendor.
     * Those libraries abstract the intricacies of authentication and avoid to use REST API directly.
     * If advanced optimizaion were neded beyond those offered by such libraries, it's always possible
     * to drop down a layer and attempt to do better.
     *     *
     * @property {Object}
     */
    _rawClient: {
        value: undefined
    },
    rawClient: {
        get: function () {
            return this._rawClient;
        },
        set: function (value) {
            if(value !== this._rawClient) {
                this._rawClient = value;
            }
        },
    },



    /***************************************************************************
     * Data Object Properties
     */

    _propertyDescriptorForObjectAndName: {
        value: function (object, propertyName) {
            var objectDescriptor = this.objectDescriptorForObject(object);
            return objectDescriptor && objectDescriptor.propertyDescriptorForName(propertyName);
        }
    },

    //Benoit: 2/25/2020 Doesn't seem to be used anywhere.
    // _objectDescriptorForObject: {
    //     value: function (object) {
    //         var types = this.types,
    //             objectInfo = Montage.getInfoForObject(object),
    //             moduleId = objectInfo.moduleId,
    //             objectName = objectInfo.objectName,
    //             module, exportName, objectDescriptor, i, n;
    //         for (i = 0, n = types.length; i < n && !objectDescriptor; i += 1) {
    //             module = types[i].module;
    //             exportName = module && types[i].exportName;
    //             if (module && moduleId === module.id && objectName === exportName) {
    //                 objectDescriptor = types[i];
    //             }
    //         }
    //         return objectDescriptor;
    //     }
    // },

    _mapObjectPropertyValue: {
        value: function (object, propertyDescriptor, value) {
            var propertyName = propertyDescriptor.name;
            if (propertyDescriptor.cardinality === Infinity) {
                this.spliceWithArray(object[propertyName], value);
            } else {
                object[propertyName] = value[0];
            }

            if (propertyDescriptor.inversePropertyName && value && value[0]) {
                var inverseBlueprint = this._propertyDescriptorForObjectAndName(value[0], propertyDescriptor.inversePropertyName);
                if (inverseBlueprint && inverseBlueprint.cardinality === 1) {
                    value.forEach(function (inverseObject) {
                        inverseObject[propertyDescriptor.inversePropertyName] = object;
                    });
                }
            }
            return value;
        }
    },

    _objectDescriptorTypeForValueDescriptor: {
        value: function (valueDescriptor) {
            return valueDescriptor.then(function (objectDescriptor) {
                return objectDescriptor.module.require.async(objectDescriptor.module.id);
            });
        }
    },

    /***************************************************************************
     * Fetching Data
     */

    fetchRawData: {
        value: function (stream) {
            this.rawDataDone(stream);
        }
    },


    fetchRawObjectProperty: {
        value: function (object, propertyName) {

            console.warn("\t~~~ "+this.identifier+" fetchRawObjectProperty: "+object.dataIdentifier+", property: "+propertyName);

            var self = this,
                objectDescriptor = this.objectDescriptorForObject(object),
                propertyDescriptor = objectDescriptor.propertyDescriptorNamed(propertyName),
                isObjectCreated = this.isObjectCreated(object);

            if(isObjectCreated) {
                return Promise.resolve(null);
            } else {

                //TODO: leverage this as used in the foreign key value converter to find the object locally first
                //return service.objectWithDescriptorMatchingRawDataPrimaryKeyCriteria(typeToFetch, criteria);


                var propertyNameQuery = DataQuery.withTypeAndCriteria(objectDescriptor, self.rawCriteriaForObject(object, objectDescriptor)),
                    objectSnpashot = this.snapshotForObject(object);

                propertyNameQuery.criteria.name = "rawDataPrimaryKeyCriteria";

                /*
                    Analyze if we have a local mapping and see what aspect of the snapshot we need to send:
                */
               let mapping = this.mappingForType(objectDescriptor),
                    rule = mapping.objectMappingRuleForPropertyName(propertyName);

                if(!rule) {
                    console.warn("objectDescriptor '"+objectDescriptor.name+"': No Object Mapping Rule Found For Property Named '"+propertyName);
                    return Promise.resolveNull;
                }
                
                let requirements = rule.requirements,
                    hintSnapshot;

                if(objectSnpashot && requirements?.length > 0 && !requirements.equals(mapping.rawDataPrimaryKeys)) {
                    hintSnapshot = (propertyNameQuery.hints = {snapshot:{}}).snapshot;
                    for(let i=0, countI = requirements.length; (i<countI); i++) {
                        hintSnapshot[requirements[i]] = objectSnpashot[requirements[i]];
                    }


                }


                /*
                    FIXME: Context, as we're fetching an object property, in a situation where the app's rely on some
                    origin data services, the data from those services may not be imported yet. In which case, the worker
                    will need info to do so, and origin-related data info is stored in the originDataSnapshot property.

                    If we happen to have that client-side, we can send it as part of the attempt to acquire that object's property value 
                    from an origin service. If we don't the SynchronizationDataService (or any other analoguous logic) will have to fetch it from the DB
                    using the criteria here that specify the object, to support obtaining that data from origin services.
                    
                    We pass that as a hint through DataQuery's hints property.
                */
                if(objectSnpashot?.hasOwnProperty("originDataSnapshot")) {
                    (propertyNameQuery.hints || (propertyNameQuery.hints = {})).originDataSnapshot = objectSnpashot.originDataSnapshot;
                }

                propertyNameQuery.criteria.name = "rawDataPrimaryKeyCriteria";
                propertyNameQuery.readExpressions = [propertyName];

                //console.log(objectDescriptor.name+": fetchObjectProperty "+ " -"+propertyName);

                return DataService.mainService.fetchData(propertyNameQuery)
                .then(function(fetchResult) {
                    // console.debug("object === fetchResult[0]", object === fetchResult[0]);
                    if(Array.isArray(fetchResult)) {
                        if(fetchResult[0] !== object) {
                            if(propertyDescriptor.cardinality === 1) {
                                return fetchResult[0] || null;
                            } else {
                                return fetchResult;
                            }    
                        }
                    } else {
                    /*
                        Bug fix fetchResult should always be an arry resolving from fetchData(), but in case there's been an exception,
                        keeping 
                    */
                        console.warn("Investigate: propertyNameQuery DataService.fetchData.then() did not resolve to an array...",propertyNameQuery);
                        return fetchResult[propertyName];
                    }
                });
            }
        }
    },


    _og_fetchRawObjectProperty: {
        value: function (object, propertyName) {
            var self = this,
                objectDescriptor = this.objectDescriptorForObject(object),
                mapping = objectDescriptor && self.mappingForType(objectDescriptor),
                propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName),
                valueDescriptor = propertyDescriptor && propertyDescriptor.valueDescriptor,
                isObjectCreated = this.isObjectCreated(object);


            // //debug
            // if(isObjectCreated) {
            //     console.debug("!!!!!! ObjectCreated - "+objectDescriptor.name+".fetchRawObjectProperty("+propertyName+")");
            // }

            // if(propertyName === "originId") {
            //     debugger;
            // }

            if (!mapping) {
                return this.nullPromise;
            }

            //console.log(objectDescriptor.name+": fetchObject:",object, "property:"+ " -"+propertyName);

            if (!Promise.is(valueDescriptor)) {
                valueDescriptor = Promise.resolve(valueDescriptor);
            }

            return valueDescriptor.then(function (valueDescriptor) {
                var objectRule = mapping && mapping.objectMappingRuleForPropertyName(propertyName),
                    snapshot = self.snapshotForObject(object),
                    objectRuleConverter = objectRule && objectRule.converter;


                // if(!snapshot) {
                //     throw "Can't fetchObjectProperty: type: "+valueDescriptor.name+" propertyName: "+propertyName+" - doesn't have a snapshot";
                // }

                /*
                    If we have what we need in the snapshot, we go for it.
                */
                if(snapshot && snapshot.hasOwnProperty(propertyName) && object[propertyName] === undefined) {
                    return mapping.mapRawDataToObjectProperty(snapshot, object, propertyName, undefined);
                }
                /*
                    if we can get the value from the type's storage itself:
                    or
                    we don't have the foreign key necessary or it

                    -- !!! embedded values don't have their own snapshots --
                */
                else if (
                    (!valueDescriptor && !objectRuleConverter) ||
                    (valueDescriptor && !objectRuleConverter) /*for Date for example*/ ||
                    (valueDescriptor && objectRuleConverter && objectRuleConverter instanceof RawEmbeddedValueToObjectConverter) || (snapshot && !objectRule.hasRawDataRequiredValues(snapshot))
                ) {

                    if(isObjectCreated) {
                        return Promise.resolve(null);
                    } else {

                        var propertyNameQuery = DataQuery.withTypeAndCriteria(objectDescriptor, self.rawCriteriaForObject(object, objectDescriptor));

                        propertyNameQuery.readExpressions = [propertyName];

                        /*
                            This is an addition to help the SynchronizationDataService get involved in the propagation of an operation:
                            A RawDataService typically can't understand the raw format of another, so it helps avoid such read operation
                            to reach a RawDataService for which it would be a waste of time to handle the operation as-is.
                        */
                        propertyNameQuery.hints = {rawDataService: self};

                        //console.log(objectDescriptor.name+": fetchObjectProperty "+ " -"+propertyName);

                        return DataService.mainService.fetchData(propertyNameQuery)
                        .then(function(object) {
                            if(Array.isArray(object)) {
                                return object;
                            } else {
                            /*
                                Bug fix object should always be an arry resolving from fetchData(), but in case there's been an exception,
                                keeping 
                            */
                                console.warn("Investigarte: propertyNameQuery DataService.fetchData.then() did not resolve to an array...",propertyNameQuery);
                                return object[propertyName];
                            }
                        });
                    }

                    /*
                        Original from PhrontClient who was overriding fetchData
                    */
                    //return self.fetchData(propertyNameQuery);

                } else {
                    return self._fetchObjectPropertyWithPropertyDescriptor(object, propertyName, propertyDescriptor, isObjectCreated);
                }
            });
        }
    },


    /**
     * Called through MainService when consumer has indicated that he has lost interest in the passed DataStream.
     * This will allow the RawDataService feeding the stream to take appropriate measures.
     *
     * @method
     * @argument {DataStream} [dataStream] - The DataStream to cancel
     * @argument {Object} [reason] - An object indicating the reason to cancel.
     *
     */
    cancelRawDataStream: {
        value: function (dataStream, reason) {
        }
    },
    /***************************************************************************
     * Saving Data
     */

    _isAsync: {
        value: function (object) {
            return object && object.then && typeof object.then === "function";
        }
    },

    /***************************************************************************
     * Saving Data
     */

    /**
     * Event handler method invoked by the framework if a RawDataService's types are
     * part of a transaction and if a RawDataService supports transactions.
     *
     * @method
     * @argument {DataOperation} createTransactionOperation .
     */

    // handleCreateTransactionOperation: {
    //     value: function (createTransactionOperation) {

    //     }
    // },



    /**
     * Subclasses should override this method to delete a data object when that
     * object's raw data wouldn't be useful to perform the deletion.
     *
     * The default implementation maps the data object to raw data and calls
     * [deleteRawData()]{@link RawDataService#deleteRawData} with the data
     * object passed in as the `context` argument of that method.
     *
     * @method
     * @argument {Object} object   - The object to delete.
     * @returns {external:Promise} - A promise fulfilled when the object has
     * been deleted. The promise's fulfillment value is not significant and will
     * usually be `null`.
     */
    deleteDataObject: {
        value: function (object) {
            var self = this,
                record = {},
                mapResult = this._mapObjectToRawData(object, record),
                result;

            if (this._isAsync(mapResult)) {
                result = mapResult.then(function () {
                    return self.deleteRawData(record, object);
                });
            } else {
                result = this.deleteRawData(record, object);
            }

            return result;
        }
    },

    /**
     * Subclasses should override this method to delete a data object when that
     * object's raw data would be useful to perform the deletion.
     *
     * @method
     * @argument {Object} record   - An object whose properties hold the raw
     *                               data of the object to delete.
     * @argument {?} context       - An arbitrary value sent by
     *                               [deleteDataObject()]{@link RawDataService#deleteDataObject}.
     *                               By default this is the object to delete.
     * @returns {external:Promise} - A promise fulfilled when the object's data
     * has been deleted. The promise's fulfillment value is not significant and
     * will usually be `null`.
     */
    deleteRawData: {
        value: function (record, context) {
            // Subclasses must override this.
            return this.nullPromise;
        }
    },

    /**
     *
     * Resets the object to its last known state.
     *
     * @method
     * @argument {Object} object   - The object to reset.
     * @returns {external:Promise} - A promise fulfilled when the object has
     * been reset to its last known state.
     *
     */
    resetDataObject: {
        value: function (object) {
            var snapshot = this.snapshotForObject(object),
                result = this.mapRawDataToObject(snapshot, object);
            return result || Promise.resolve(object);
        }
    },

    /**
     * Subclasses should override this method to save a data object when that
     * object's raw data would be useful to perform the save.
     *
     * @method
     * @argument {Object} record   - An object whose properties hold the raw
     *                               data of the object to save.
     * @argument {?} context       - An arbitrary value sent by
     *                               [saveDataObject()]{@link RawDataService#saveDataObject}.
     *                               By default this is the object to save.
     * @returns {external:Promise} - A promise fulfilled when the object's data
     * has been saved. The promise's fulfillment value is not significant and
     * will usually be `null`.
     */
    saveRawData: {
        value: function (record, context) {
            // Subclasses must override this.
            return this.nullPromise;
        }
    },

    /***************************************************************************
     * Offline
     */

    /*
     * Returns the [root service's offline status]{@link DataService#isOffline}.
     *
     * @type {boolean}
     */
    isOffline: {
        get: function () {
            return this === this.rootService ?
                this.superForGet("isOffline")() :
                this.rootService.isOffline;
        }
    },

    /**
     * Called with all the data passed to
     * [addRawData()]{@link RawDataService#addRawData} to allow storing of that
     * data for offline use.
     *
     * The default implementation does nothing. This is appropriate for
     * subclasses that do not support offline operation or which operate the
     * same way when offline as when online.
     *
     * Other subclasses may override this method to store data fetched when
     * online so [fetchData]{@link RawDataSource#fetchData} can use that data
     * when offline.
     *
     * @method
     * @argument {Object} records  - An array of objects whose properties' values
     *                               hold the raw data.
     * @argument {?DataQuery} selector
     *                             - Describes how the raw data was selected.
     * @argument {?} context       - The value that was passed in to the
     *                               [rawDataDone()]{@link RawDataService#rawDataDone}
     *                               call that invoked this method.
     * @returns {external:Promise} - A promise fulfilled when the raw data has
     * been saved. The promise's fulfillment value is not significant and will
     * usually be `null`.
     */
    writeOfflineData: {
        value: function (records, selector, context) {
            // Subclasses should override this to do something useful.
            return this.nullPromise;
        }
    },

    /***************************************************************************
     * Collecting Raw Data
     */

    /**
     * To be called by [fetchData()]{@link RawDataService#fetchData} or
     * [fetchRawData()]{@link RawDataService#fetchRawData} when raw data records
     * are received. This method should never be called outside of those
     * methods.
     *
     * This method creates and registers the data objects that
     * will represent the raw records with repeated calls to
     * [getDataObject()]{@link DataService#getDataObject}, maps
     * the raw data to those objects with repeated calls to
     * [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject},
     * and then adds those objects to the specified stream.
     *
     * Subclasses should not override this method and instead override their
     * [getDataObject()]{@link DataService#getDataObject} method, their
     * [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject} method,
     * their [mapping]{@link RawDataService#mapping}'s
     * [mapRawDataToObject()]{@link RawDataMapping#mapRawDataToObject} method,
     * or several of these.
     *
     * @method
     * @argument {DataStream} stream
     *                           - The stream to which the data objects created
     *                             from the raw data should be added.
     * @argument {Array} records - An array of objects whose properties'
     *                             values hold the raw data. This array
     *                             will be modified by this method.
     * @argument {?} context     - An arbitrary value that will be passed to
     *                             [getDataObject()]{@link RawDataService#getDataObject}
     *                             and
     *                             [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject}
     *                             if it is provided.
     */
    addRawData: {
        value: function (stream, records, context) {
            var offline, i, n,
                streamSelectorType = stream.query.type,
                iRecord;
            // Record fetched raw data for offline use if appropriate.
            offline = records && !this.isOffline && this._streamRawData.get(stream);
            if (offline) {
                offline.push.apply(offline, records);
            } else if (records && !this.isOffline) {
                //Do we really need to make a shallow copy of the array for bookeeping?
                //this._streamRawData.set(stream, records.slice());
                this._streamRawData.set(stream, records);
            }
            // Convert the raw data to appropriate data objects. The conversion
            // will be done in place to avoid creating any unnecessary array.
            for (i = 0, n = records && records.length; i < n; i++) {
                /*jshint -W083*/
                // Turning off jshint's function within loop warning because the
                // only "outer scoped variable" we're accessing here is stream,
                // which is a constant reference and won't cause unexpected
                // behavior due to iteration.
                // if (streamSelectorType.name && streamSelectorType.name.toUpperCase().indexOf("BSP") !== -1) {
                //     console.debug("set a breakpoint here");
                // }
                this.addOneRawData(stream, records[i], context, streamSelectorType);
                /*jshint +W083*/
            }
        }
    },

    /**
     * When we fetch to complete an object, we know client side for which object it is,
     * so the backend may not have to send it back and save data.
     * So here we check if rawData has primaryKey entries. If it doesn't, we try to find it
     * in the query criteria. We can't rely on just looking up the parameters as we're
     * sometine alias the criteria parameters when we combine them. Only the property value
     * in the expression is reliable.
     */

    _addRawDataPrimaryKeyValuesIfNeeded: {
        value: function (rawData, type, query) {
            var mapping = this.mappingForObjectDescriptor(type),
                rawDataPrimaryKeys = mapping.rawDataPrimaryKeys,
                i, countI, iKey,
                iterator, parentSyntax, currentSyntax, propertyName, propertyValue, firstArgSyntax, secondArgSyntax,
                criteriaParameters,
                criteriaSyntax,
                syntaxPropertyByName;

            for (i = 0, countI = rawDataPrimaryKeys ? rawDataPrimaryKeys.length : 0; (i < countI); i++) {
                if (rawData && !rawData.hasOwnProperty(rawDataPrimaryKeys[i])) {
                    //Needs to find among the equals syntax the one that matches the current key.
                    iterator = new SyntaxInOrderIterator(query.criteria.syntax, "equals");
                    criteriaParameters = query.criteria.parameters;
                    while ((currentSyntax = iterator.next("equals").value)) {
                        firstArgSyntax = currentSyntax.args[0];
                        secondArgSyntax = currentSyntax.args[1];

                        if (firstArgSyntax.type === "property" && firstArgSyntax.args[0].type === "value") {
                            propertyName = firstArgSyntax.args[1].value;
                            if (secondArgSyntax.type === "parameters") {
                                propertyValue = criteriaParameters;
                            } else {
                                propertyValue = criteriaParameters[secondArgSyntax.args[1].value];
                            }
                        } else {
                            propertyName = secondArgSyntax.args[1].value;
                            propertyValue = criteriaParameters[firstArgSyntax.args[1].value];
                        }

                        if (rawDataPrimaryKeys.indexOf(propertyName) !== -1) {
                            rawData[propertyName] = propertyValue;
                        }
                    }
                }
            }
        }
    },

    /**
     * Called by [addRawData()]{@link RawDataService#addRawData} to add an object
     * for the passed record to the stream. This method both takes care of doing
     * mapRawDataToObject and add the object to the stream.
     *
     * @method
     * @argument {DataStream} stream
     *                           - The stream to which the data objects created
     *                             from the raw data should be added.
     * @argument {Object} rawData - An anonymnous object whose properties'
     *                             values hold the raw data. This array
     *                             will be modified by this method.
     * @argument {?} context     - An arbitrary value that will be passed to
     *                             [getDataObject()]{@link RawDataService#getDataObject}
     *                             and
     *                             [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject}
     *                             if it is provided.
     *
     * @returns {Promise<MappedObject>} - A promise resolving to the mapped object.
     *
     */

    addOneRawData: {
        value: function (stream, rawData, context) {


            if(!rawData) {
                console.warn("stream received null rawData in result from operatinon ", context);
                return;
            }

            var type,
                streamQueryType = this._descriptorForParentAndRawData(stream.query.type, rawData),
                readExpressions = stream.query.readExpressions,
                dataIdentifier,
                object,
                //object = this.rootService.objectForDataIdentifier(dataIdentifier),
                isUpdateToExistingObject = false,
                result;

            //Shall we add a check for having readExpressions as well?
            if(context instanceof DataOperation && context.target !== streamQueryType) {
                type = context.target;
            } 
            else {
                type = streamQueryType;
            }

            mapping = this.mappingForType(type);
            /*
                Now, that type could be stored in a collection / object store /endoint that 
                 hosts multiple subtypes of type. So rawData could be one of those.

                We now have on ExpressionDataMapping a rawDataTypeIdentificationCriteriaForDataOperation()

                We need to find which rawDataTypeIdentificationCriteria evaluation returns true for rawData
                We'll need to find a way to optimize down to a single lookup if we can
            */
            if(mapping.needsRawDataTypeIdentificationCriteria) {
                type = mapping.objectTypeForRawData(rawData);
            }

         
            
                
            if(readExpressions && readExpressions.length > 0 && rawData === null) {
                //We need to find the object matching stream.query.criteria
                object = this.objectWithDescriptorMatchingRawDataPrimaryKeyCriteria(type,stream.query.criteria);
                dataIdentifier = this.dataIdentifierForObject(object);

                /*
                    if we have an object, we have a snapshot. We might be able to create a rawData that contains readExpressions' matching raw property set to null 
                */
                if(object) {

                    for(let iReadExpression of readExpressions) {
                        let iRule = mapping.objectMappingRuleForPropertyName(iReadExpression);

                        //If iRule'sourcePath isn't a literal value like null 
                        if(iRule && iRule.sourcePathSyntax.type !== "literal" && iRule.sourcePathSyntax.value !== null) {
                            (rawData || (rawData = {}))[iRule.sourcePath] = null;
                        }
                    }

                }

            } else {


                this._addRawDataPrimaryKeyValuesIfNeeded(rawData, type, stream.query);

                dataIdentifier = this.dataIdentifierForTypeRawData(type, rawData, context),
                //console.log("addOneRawData "+dataIdentifier);
                // if(!object) {
                object = this.objectForTypeRawData(type, rawData, dataIdentifier, context);
                // }
                // else {
                //     isUpdateToExistingObject = true;
                // }
            }


            //If we're already have a snapshot, we've already fetched and
            //instanciated an object for that identifier previously.
            if (this.hasSnapshotForDataIdentifier(dataIdentifier)) {
                isUpdateToExistingObject = true;
            }

            /*
                If rawData is null, we have no rawData-level property to work with and store in the snapshot
            */
            if(rawData) {
                //Record the snapshot before we map.
                this.recordSnapshot(object.dataIdentifier, rawData);
            }


            result = this.mapRawDataToObject(rawData, object, context, readExpressions);

            if (this._isAsync(result)) {
                result = result.then( (resultValue) => {
                    // console.log(object.dataIdentifier.objectDescriptor.name +" addOneRawData id:"+rawData.id+"  MAPPING PROMISE RESOLVED -> stream.addData(object)");

                    /*
                        Attempt to put in place something when an object is first fetched.
                        This would only tell the object itself, but we want to enable expernal 
                    */
                    // if(!isUpdateToExistingObject) {
                    //     object.awakeFromFetch?.();
                    // }
                    stream.addData(object);

                    if(!isUpdateToExistingObject && object.isReadOnly) {
                        this.mainService.registerReadOnlyDataObject(object);
                    }

                    return object;
                });
            } else {
                // if(!isUpdateToExistingObject) {
                //     object.awakeFromFetch?.();
                // }
                stream.addData(object);

                if(!isUpdateToExistingObject && object.isReadOnly) {
                    this.mainService.registerReadOnlyDataObject(object);
                }

                result = Promise.resolve(object);
            }

            this._addMapDataPromiseForStream(result, stream);


            //TODO: #warning
            //This method should evolve to use resolveObjectForTypeRawData instead,
            //however resolveObjectForTypeRawData's promises resolves to object
            //only after it's been mapped, so this delegate call should only be called then
            //and not too early as it is now. Not sure if that may create a backward compatibility issue
            if (object) {
                this.callDelegateMethod("rawDataServiceDidAddOneRawData", this, stream, rawData, object);
            }
            return result;
        }
    },

    _addMapDataPromiseForStream: {
        value: function (promise, stream) {
            if (!this._streamMapDataPromises.has(stream)) {
                this._streamMapDataPromises.set(stream, [promise]);
            } else {
                this._streamMapDataPromises.get(stream).push(promise);
            }
        }
    },

    _streamMapDataPromises: {
        get: function () {
            if (!this.__streamMapDataPromises) {
                this.__streamMapDataPromises = new Map();
            }
            return this.__streamMapDataPromises;
        }
    },

    /**
     * Called by [addRawData()]{@link RawDataService#addRawData} to add an object
     * for the passed record to the stream. This method both takes care of doing
     * mapRawDataToObject and add the object to the stream.
     *
     * @method
     * @argument {ObjectDescriptor} type
     *                           - The type of the data object matching rawData.
     * @argument {Object} rawData - An anonymnous object whose properties'
     *                             values hold the raw data.
     * @argument {?} context     - An arbitrary value that will be passed to
     *                             [getDataObject()]{@link RawDataService#getDataObject}
     *                             and
     *                             [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject}
     *                             if it is provided.
     *
     * @returns {Promise<MappedObject>} - A promise resolving to the mapped object.
     *
     */

    resolveObjectForTypeRawData: {
        value: function (type, rawData, context) {
            var dataIdentifier = this.dataIdentifierForTypeRawData(type, rawData),
                //Retrieves an existing object is responsible data service is uniquing, or creates one
                object, result;


            //Retrieves an existing object is responsible data service is uniquing, or creates one
            object = this.getDataObject(type, rawData, dataIdentifier, context);

            //Record snapshot before mapping
            this.recordSnapshot(dataIdentifier, rawData);

            /*
                getDataObject() ends up on the mainService and guarantee uniquing 
                But the rawDataService needs to register that object with it's own native dataIdentifier
                which could be different when an object can come from different sources with different raw data shapes
            */
            // this.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);

            result = this.mapRawDataToObject(rawData, object, context);

            // //Record snapshot when done mapping
            // this.recordSnapshot(dataIdentifier, rawData);

            if (Promise.is(result)) {
                return result.then(function () {
                    return object;
                });
            } else {
                return Promise.resolve(object);
            }
        }
    },


    objectForTypeRawData: {
        value: function (type, rawData, dataIdentifier, context) {
            // var dataIdentifier = this.dataIdentifierForTypeRawData(type,rawData);

            // return this.rootService.objectForDataIdentifier(dataIdentifier) ||
            //         this.getDataObject(type, rawData, dataIdentifier, context);


            var object = this.rootService.objectForDataIdentifier(dataIdentifier);

            //Consolidation, recording snapshot even if we already had an object
            //Record snapshot before we may create an object
            //Benoit: commenting out, done twice when fetching now
            //this.recordSnapshot(dataIdentifier, rawData);

            if (!object) {
                //iDataIdentifier argument should be all we need later on
                return this.getDataObject(type, rawData, dataIdentifier, context);
            }
            return object;

        }
    },

    _typeIdentifierMap: {
        value: undefined
    },

    /**
     * Called by [DataService createDataObject()]{@link DataService#createDataObject} to allow
     * RawDataService to provide a primary key on the client side as soon as an object is created.
     * Especially useful for uuid based primary keys that can be generated eithe client or server side.
     * Which is done by default. Subclasses can override for different kind of primary keys, or per-type primary keys.
     *
     * @method
     * @argument {DataStream} stream
     *                           - The stream to which the data objects created
     *                             from the raw data should be added.
     * @argument {Object} rawData - An anonymnous object whose properties'
     *                             values hold the raw data. This array
     *                             will be modified by this method.
     * @argument {?} context     - An arbitrary value that will be passed to
     *                             [getDataObject()]{@link RawDataService#getDataObject}
     *                             and
     *                             [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject}
     *                             if it is provided.
     *
     * @returns {Promise<MappedObject>} - A promise resolving to the mapped object.
     *
     */

    primaryKeyForNewObjectWithObjectDescriptor: {
        value: function (type) {
            return uuid.generate( Date.now(), /* isFull, to include hyphens*/ true);
        }
    },

        
    dataIdentifierForNewObjectWithObjectDescriptor: {
        value: function (objectDescriptor) {
            var primaryKey = this.primaryKeyForNewObjectWithObjectDescriptor(objectDescriptor);

            if (primaryKey) {
                return this.dataIdentifierForTypePrimaryKey(objectDescriptor, primaryKey);
            }
            return undefined;
        }
    },


    primaryKeyForTypeRawData: {
        value: function (type, rawData, dataOperation) {
            var mapping = this.mappingForType(type),
                rawDataPrimaryKeys = mapping ? mapping.rawDataPrimaryKeyCompiledExpressions : null,
                scope = dataOperation?.scope.nest(rawData) || new Scope(rawData),
                rawDataPrimaryKeysValues,
                dataIdentifier, dataIdentifierMap, primaryKey;

            if (rawDataPrimaryKeys && rawDataPrimaryKeys.length) {
                rawDataPrimaryKeysValues = rawDataPrimaryKeysValues || [];

                for (var i = 0, expression, expressionValue; (expression = rawDataPrimaryKeys[i]); i++) {
                    expressionValue = expression(scope);
                    if(typeof expressionValue === "object") {
                        expressionValue = JSON.stringify(expressionValue);
                    }
                    rawDataPrimaryKeysValues[i] = expressionValue;
                }
                if (rawDataPrimaryKeysValues) {
                    primaryKey = rawDataPrimaryKeysValues.length === 1 
                        ? rawDataPrimaryKeysValues[0]
                        : rawDataPrimaryKeysValues.join("/");
                    // dataIdentifier = dataIdentifierMap.get(primaryKey);
                }

                return primaryKey;
            }
            return undefined;
        }
    },

    /*
        Not called anymore, registerDataIdentifierForTypePrimaryKey() is called directly now by other methods
    */
    registerDataIdentifierForTypeRawData: {
        value: function (dataIdentifier, type, rawData) {
            var primaryKey = this.primaryKeyForTypeRawData(type, rawData);

            this.registerDataIdentifierForTypePrimaryKey(dataIdentifier, type, primaryKey);
        }
    },

    //This should belong on the
    //Gives us an indirection layer to deal with backward compatibility.
    dataIdentifierForTypeRawData: {
        value: function (type, rawData, dataOperation) {
            var primaryKey = this.primaryKeyForTypeRawData(type, rawData, dataOperation);

            if (primaryKey) {
                return this.dataIdentifierForTypePrimaryKey(type, primaryKey);
            } else {
                var mapping = this.mappingForType(type);
                if(mapping && mapping.rawDataPrimaryKeyCompiledExpressions) {
                throw "-dataIdentifierForTypeRawData(): Primary key missing for type '"+type.name+", rawData "+JSON.stringify(rawData);
                }
            }
        }
    },

    /**
     * In most cases a RawDataService will register a dataIdentifier created during
     * the mapping process, but in some cases where an object created by the upper
     * layers fitst, this can be used direcly to reconcilate things.
     *
     * @method
     * @argument {DataIdentifier} dataIdentifier - The dataIdentifier representing the type's rawData.
     * @argument {ObjectDescriptor} type - the type of the raw data.
     * @argument {?} primaryKey     - An arbitrary value that that is the primary key
     *
     *
     *
     * @returns {Promise<MappedObject>} - A promise resolving to the mapped object.
     *
     */
    registerDataIdentifierForTypePrimaryKey: {
        value: function (dataIdentifier, type, primaryKey) {
            var dataIdentifierMap = this._typeIdentifierMap.get(type);

            if (!dataIdentifierMap) {
                this._typeIdentifierMap.set(type, (dataIdentifierMap = new Map()));
            }

            dataIdentifierMap.set(primaryKey, dataIdentifier);
        }
    },

    dataIdentifierForTypePrimaryKey: {
        value: function (type, primaryKey) {
            var dataIdentifierMap = this._typeIdentifierMap.get(type),
                dataIdentifier;

            dataIdentifier = dataIdentifierMap
                ? dataIdentifierMap.get(primaryKey)
                : null;

            if (!dataIdentifier) {
                var typeName = type.typeName /*DataDescriptor*/ || type.name;
                //This should be done by ObjectDescriptor/blueprint using primaryProperties
                //and extract the corresponsing values from rawData
                //For now we know here that MileZero objects have an "id" attribute.
                dataIdentifier = new DataIdentifier();
                dataIdentifier.objectDescriptor = type;
                dataIdentifier.dataService = this;
                dataIdentifier.typeName = type.name;
                //dataIdentifier._identifier = dataIdentifier.primaryKey = primaryKey;
                dataIdentifier.primaryKey = primaryKey;

                // dataIdentifierMap.set(primaryKey,dataIdentifier);
                this.registerDataIdentifierForTypePrimaryKey(dataIdentifier, type, primaryKey);
            }
            return dataIdentifier;
        }

    },

    __snapshot: {
        value: null
    },

    _snapshot: {
        get: function () {
            return this.__snapshot || (this.__snapshot = new Map());
        }
    },


    /**
     * Records the snapshot of the values of record known for a DataIdentifier
     *
     * @private
     * @argument  {DataIdentifier} dataIdentifier
     * @argument  {Object} rawData
     * @argument  {Boolean} isFromUpate                 - expected to be true when a transaction is completed and a value is recorded 
     *                                                  in the snapshot as the confirmed value of record
     * 
     * @returns {Object}                                - An object containing the recorded snapshot if any:
     *                                                      - Will be null if rawData has no change from the current snapshot
     *                                                      - Will be rawData if there wasn't a known snapshot
     *                                                      - an object containig the subset of data that is different from the known snapshot 
     */
    recordSnapshot: {
        value: function (dataIdentifier, rawData, isFromUpdate) {
            if (!dataIdentifier) {
                return null;
            }

            var snapshot = this._snapshot.get(dataIdentifier);
            if (!snapshot) {
                this._snapshot.set(dataIdentifier, rawData);
                return rawData
            }
            else {
                var rawDataKeys = Object.keys(rawData),
                    i, countI, iUpdatedRawDataValue, iCurrentRawDataValue, iDiffValues, iRemovedValues,
                    iHasAddedValues, iHasRemovedValues,
                    j, countJ, jDiffValue, jDiffValueIndex,
                    canRemoveRawDataKey;

                for (i = 0, countI = rawDataKeys.length; (i < countI); i++) {

                    iUpdatedRawDataValue = rawData[rawDataKeys[i]];
                    if (isFromUpdate && iUpdatedRawDataValue && ((iHasAddedValues = iUpdatedRawDataValue.hasOwnProperty("addedValues")) || (iHasRemovedValues = iUpdatedRawDataValue.hasOwnProperty("removedValues")))) {
                        
                        canRemoveRawDataKey = true;
                        iCurrentRawDataValue = snapshot[rawDataKeys[i]];

                        if (iHasAddedValues) {
                            iDiffValues = iUpdatedRawDataValue.addedValues;

                            if (iCurrentRawDataValue) {
                                if (Array.isArray(iCurrentRawDataValue)) {
                                    for (j = 0, countJ = iDiffValues.length; (j < countJ); j++) {
                                        jDiffValue = iDiffValues[j];
                                        /*
                                            We shouldn't have to worry about the value already being in iCurrentRawDataValue, but we're going to safe and check
                                        */
                                        if (iCurrentRawDataValue.indexOf(jDiffValue) === -1) {
                                            iCurrentRawDataValue.push(jDiffValue);
                                            canRemoveRawDataKey = false;
                                        }
                                    }
                                } else {
                                    console.warn("recordSnapshot when one exists: snapshot for '" + rawDataKeys[i] + "' is not an Array but addedValues is:", iDiffValues);
                                    /* there's a current value that is not an array.. Which is weird... */
                                    snapshot[rawDataKeys[i]] = iDiffValues;
                                    canRemoveRawDataKey = false;
                                }
                            } else {
                                //console.warn("recordSnapshot from Update: No entry in snapshot for '" + rawDataKeys[i] + "' but addedValues:", iDiffValues);
                                /*
                                    We could reconstruct from the object value, but we should really not be here.
                                */
                                snapshot[rawDataKeys[i]] = iDiffValues;
                                canRemoveRawDataKey = false;
                            }
                        }

                        if (iHasRemovedValues) {
                            iDiffValues = iUpdatedRawDataValue.removedValues;

                            /* 
                                WARNING
                                iCurrentRawDataValue was cached early in the loop and there's a use-case where 
                                iCurrentRawDataValue would not be equal to rawData[rawDataKeys[i]] because
                                it might have changed in the block above, which is when there was no value at all.

                                So the only use case where not refreshing it would be if somehow the data service
                                received a value in .addedValues array that is also in the .removedValues, which would 
                                be strange
                            */

                            if (iCurrentRawDataValue) {
                                if (Array.isArray(iCurrentRawDataValue)) {
                                    for (j = 0, countJ = iDiffValues.length; (j < countJ); j++) {
                                        jDiffValue = iDiffValues[j];
                                        /*
                                            We shouldn't have to worry about the value alredy being in iCurrentRawDataValue, but we're going to safe and check
                                        */
                                        if ((jDiffValueIndex = iCurrentRawDataValue.indexOf(jDiffValue)) !== -1) {
                                            iCurrentRawDataValue.splice(jDiffValueIndex, 1);
                                            canRemoveRawDataKey = false;
                                        }
                                    }
                                } else {
                                    console.warn("recordSnapshot from Update: snapshot for '" + awDataKeys[i] + "' is not an Array but removedValues:", iDiffValues);
                                    console.error("removedValues but no entry in snapshot for ")
                                    //snapshot[rawDataKeys[i]] = iDiffValues;
                                }
                            } else {
                                console.warn("recordSnapshot from Update: No entry in snapshot for '" + awDataKeys[i] + "' but removedValues:", iDiffValues);
                            }
                        }

                        if(canRemoveRawDataKey) {
                            delete rawData[rawDataKeys[i]];
                        }

                    } 
                    /* if the value in rawData is different, we move it on the snapshot */
                    else if(snapshot[rawDataKeys[i]] !== iUpdatedRawDataValue) {
                        snapshot[rawDataKeys[i]] = iUpdatedRawDataValue;
                    } 
                    /* 
                        otherwise there's nothing to do, so let's take it out from rawData 
                        unless it's the primary key...
                    */
                    else if(rawData[rawDataKeys[i]] !== dataIdentifier.primaryKey) {
                        delete rawData[rawDataKeys[i]];
                    }
                }

                return rawData;
            }
        }
    },

    /**
     * Removes the snapshot of the values of record for the DataIdentifier argument
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
    removeSnapshot: {
        value: function (dataIdentifier) {
            this._snapshot.delete(dataIdentifier);
        }
    },

    /**
     * Returns the snapshot associated with the DataIdentifier argument if available
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
    snapshotForDataIdentifier: {
        value: function (dataIdentifier) {
            return this._snapshot.get(dataIdentifier);
        }
    },

    /**
     * Returns wether a snapshot is associated with the DataIdentifier argument
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
    hasSnapshotForDataIdentifier: {
        value: function (dataIdentifier) {
            return this._snapshot.has(dataIdentifier);
        }
    },

    /**
     * Returns the snapshot associated with the object argument if available
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
    snapshotForObject: {
        value: function (object) {
            return this.snapshotForDataIdentifier(this.dataIdentifierForObject(object));
        }
    },

    /**
     * Returns wether a snapshot is associated with the object argument
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
    hasSnapshotForObject: {
        value: function (object) {
            return this.hasSnapshotForDataIdentifier(this.dataIdentifierForObject(object));
        }
    },

    /**
     * Returns true as default so data are sorted according to a query's
     * orderings. Subclasses can override this if they cam delegate sorting
     * to another system, like a database for example, or an API, entirely,
     * or selectively, using the aDataStream passed as an argument, wbich can
     * help conditionally decide what to do based on the query's objectDescriptor
     * or the query's orderings themselves.
     *
     * @public
     * @argument {DataStream} dataStream
     */

    shouldSortDataStream: {
        value: function (dataStream) {
            return true;
        }
    },

    sortDataStream: {
        value: function (dataStream) {
            var query = dataStream.query,
                orderings = query.orderings;

            if (orderings) {
                var expression = "",
                    data = dataStream.data;

                //Build combined expression
                for (var i = 0, iDataOrdering, iExpression; (iDataOrdering = orderings[i]); i++) {
                    iExpression = iDataOrdering.expression;

                    if (expression.length) {
                        expression += ".";
                    }

                    expression += "sorted{";
                    expression += iExpression;
                    expression += "}";

                    if (iDataOrdering.order === DESCENDING) {
                        expression += ".reversed()";
                    }
                }
                results = evaluate(expression, data);

                //Now change the data array
                Array.prototype.splice.apply(data, [0, data.length].concat(results));
            }

        }
    },

    /**
     * To be called once for each [fetchData()]{@link RawDataService#fetchData}
     * or [fetchRawData()]{@link RawDataService#fetchRawData} call received to
     * indicate that all the raw data meant for the specified stream has been
     * added to that stream.
     *
     * Subclasses should not override this method.
     *
     * @method
     * @argument {DataStream} stream - The stream to which the data objects
     *                                 corresponding to the raw data have been
     *                                 added.
     * @argument {?} context         - An arbitrary value that will be passed to
     *                                 [writeOfflineData()]{@link RawDataService#writeOfflineData}
     *                                 if it is provided.
     */
    rawDataDone: {
        value: function (stream, context) {
            var self = this,
                dataToPersist = this._streamRawData.get(stream),
                mappingPromises = this._streamMapDataPromises.get(stream),
                dataReadyPromise = mappingPromises
                    ? mappingPromises.length === 1
                        ? mappingPromises[0]
                        : Promise.all(mappingPromises)
                    : this.nullPromise;

            if (mappingPromises) {
                this._streamMapDataPromises.delete(stream);
            }

            if (dataToPersist) {
                this._streamRawData.delete(stream);
            }

            //console.log("rawDataDone for "+stream.query.type.name);

            dataReadyPromise.then(function (results) {
                // console.log("dataReadyPromise for "+stream.query.type.name);
                return dataToPersist ? self.writeOfflineData(dataToPersist, stream.query, context) : null;
            }).then(function () {
                // console.log("stream.dataDone() for "+stream.query.type.name);
                if (stream.query?.orderings && self.shouldSortDataStream(stream)) {
                    self.sortDataStream(stream);
                }
                stream.dataDone();
                return null;
            }).catch(function (e) {
                console.error(e, stream);
            });

        }
    },

    rawDataError: {
        value: function (stream, error) {
            var self = this,
                dataToPersist = this._streamRawData.get(stream),
                mappingPromises = this._streamMapDataPromises.get(stream),
                dataReadyPromise = mappingPromises ? Promise.all(mappingPromises) : this.nullPromise;

            if (mappingPromises) {
                this._streamMapDataPromises.delete(stream);
            }

            if (dataToPersist) {
                this._streamRawData.delete(stream);
            }

            dataReadyPromise.then(function (results) {

                //return dataToPersist ? self.writeOfflineData(dataToPersist, stream.query, context) : null;
            }).then(function () {
                stream.dataError(error);
                return null;
            }).catch(function (e) {
                console.error(e, stream);
            });

        }
    },


    /**
 * To be called once for each [fetchData()]{@link RawDataService#fetchData}
 * or [fetchRawData()]{@link RawDataService#fetchRawData} call received to
 * indicate that all the raw data meant for the specified stream has been
 * added to that stream.
 *
 * Subclasses should not override this method.
 *
 * @method
 * @argument {DataStream} stream - The stream to which the data objects
 *                                 corresponding to the raw data have been
 *                                 added.
 * @argument {?} context         - An arbitrary value that will be passed to
 *                                 [writeOfflineData()]{@link RawDataService#writeOfflineData}
 *                                 if it is provided.
 */
    rawDataBatchDone: {
        value: function (stream, context) {
            var self = this,
                dataToPersist = this._streamRawData.get(stream),
                mappingPromises = this._streamMapDataPromises.get(stream),
                dataReadyPromise = mappingPromises ? Promise.all(mappingPromises) : this.nullPromise;

            dataReadyPromise
                .then(function () {
                    stream.dataBatchDone();
                    return null;
                }).catch(function (e) {
                    console.error(e, stream);
                });

        }
    },

    /**
     * Records in the process of being written to streams (after
     * [addRawData()]{@link RawDataService#addRawData} has been called and
     * before [rawDataDone()]{@link RawDataService#rawDataDone} is called for
     * any given stream). This is used to collect raw data that needs to be
     * stored for offline use.
     *
     * @private
     * @type {Object.<Stream, records>}
     */
    _streamRawData: {
        get: function () {
            if (!this.__streamRawData) {
                this.__streamRawData = new WeakMap();
            }
            return this.__streamRawData;
        }
    },

    __streamRawData: {
        value: undefined
    },

    /***************************************************************************
     * Mapping Raw Data
     */

    /**
     * Convert a selector for data objects to a selector for raw data.
     *
     * The selector returned by this method will be the selector used by methods
     * that deal with raw data, like
     * [fetchRawData()]{@link RawDataService#fetchRawData]},
     * [addRawData()]{@link RawDataService#addRawData]},
     * [rawDataDone()]{@link RawDataService#rawDataDone]}, and
     * [writeOfflineData()]{@link RawDataService#writeOfflineData]}. Any
     * [stream]{@link DataStream} available to these methods will have their
     * selector references temporarly replaced by references to the mapped
     * selector returned by this method.
     *
     * The default implementation of this method returns the passed in selector.
     *
     * @method
     * @argument {DataQuery} selector - A selector defining data objects to
     *                                     select.
     * @returns {DataQuery} - A selector defining raw data to select.
     */
    mapSelectorToRawDataQuery: {
        value: function (query) {
            return query;
        }
    },

    mapSelectorToRawDataSelector: {
        value: deprecate.deprecateMethod(void 0, function (selector) {
            return this.mapSelectorToRawDataQuery(selector);
        }, "mapSelectorToRawDataSelector", "mapSelectorToRawDataQuery"),
    },

    _defaultDataMapping: {
        value: new DataMapping()
    },

    /**
     * Retrieve DataMapping for passed objectDescriptor.
     *
     * @method
     * @argument {Object} object - An object whose object descriptor has a DataMapping
     */
    mappingForObjectDescriptor: {
        value: function (objectDescriptor) {
            var mapping = objectDescriptor && this.mappingForType(objectDescriptor);


            if (!mapping) {
                if (objectDescriptor) {
                    mapping = this._objectDescriptorMappings.get(objectDescriptor);
                    if (!mapping) {
                        mapping = DataMapping.withObjectDescriptor(objectDescriptor);
                        this._objectDescriptorMappings.set(objectDescriptor, mapping);
                    }
                }
                else {
                    mapping = this._defaultDataMapping;
                }
            }

            return mapping;
        }
    },

    /**
     * Retrieve DataMapping for this object.
     *
     * @method
     * @argument {Object} object - An object whose object descriptor has a DataMapping
     */
    mappingForObject: {
        value: function (object) {
            return this.mappingForObjectDescriptor(this.objectDescriptorForObject(object));
        }
    },

    /**
     * Called by a mapping before doing it's mapping work, giving the data service.
     * an opportunity to intervene.
     *
     * Subclasses should override this method to influence how are properties of
     * the raw mapped data to data objects:
     *
     * @method
     * @argument {Object} mapping - A DataMapping object handing the mapping.
     * @argument {Object} rawData - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} dataObject - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    mappingWillMapRawDataToObject: {
        value: function (mapping, rawData, dataObject, context, readExpressions) {
            let delegateRawData;
            if((delegateRawData = this.callDelegateMethod("rawDataServiceMappingWillMapRawDataToObject", this, mapping, rawData, dataObject, context, readExpressions))) {
                return delegateRawData;
            } else {
                return rawData;
            }
        }
    },

    /**
     * Called by a mapping before doing it's mapping work for a property, giving the data service.
     * an opportunity to intervene.
     *
     * Subclasses should override this method to influence how are properties of
     * the raw mapped data to data objects:
     *
     * @method
     * @argument {Object} mapping - A DataMapping object handing the mapping.
     * @argument {Object} rawData - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} dataObject - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {String} propertyName - the name of the property being mapped
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     * @argument {Object} mappingScope - A Scope object (from FRB) that holds objects involved in mappig logic.

     */
    mappingWillMapRawDataToObjectProperty: {
        value: function (mapping, rawData, dataObject, propertyName, context, mappingScope) {
            this.callDelegateMethod("rawDataServiceMappingWillMapRawDataToObjectProperty", this, mapping, rawData, dataObject, propertyName, context, mappingScope);
        }
    },
    
    /**
     * Called by a mapping after doing it's mapping work for a property, giving the data service.
     * an opportunity to intervene.
     *
     * Subclasses should override this method to influence how are properties of
     * the raw mapped data to data objects:
     *
     * @method
     * @argument {Object} mapping - A DataMapping object handing the mapping.
     * @argument {Object} rawData - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} dataObject - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {String} propertyName - the name of the property being mapped
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     * @argument {Object} mappingScope - A Scope object (from FRB) that holds objects involved in mappig logic.

     */
    mappingDidMapRawDataToObjectPropertyValue: {
        value: function (mapping, rawData, dataObject, propertyName, propertyValue, context, mappingScope) {
            this.callDelegateMethod("rawDataServiceMappingDidMapRawDataToObjectPropertyValue", this, mapping, rawData, dataObject, propertyName, propertyValue, context, mappingScope);
        }
    },

    
    
    /**
     * Called by a mapping after doing it's mapping work, giving the data service.
     * an opportunity to know what happened.
     * 
     * Default implementation invokes the delegate method
     * 
     *  rawDataServiceMappingRawDataToObjectDidComplete()
     *
     * Which is ivoked while there's still a blackout on tracking changes
     * Subclasses should override this method as needed:
     *
     * @method
     * @argument {Object} mapping - A DataMapping object handing the mapping.
     * @argument {Object} rawData - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} dataObject - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     * @argument {Array} mappedProperties - An object whose properties must be set or

     */
    mappingDidMapRawDataToObject: {
        value: function (mapping, rawData, dataObject, context, mappedProperties) {
            this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidComplete", this, mapping, rawData, dataObject, context, mappedProperties);
        }
    },

    /**
     * Convert raw data to data objects of an appropriate type.
     *
     * Subclasses should override this method to map properties of the raw data
     * to data objects, as in the following:
     *
     *     mapRawDataToObject: {
     *         value: function (object, record) {
     *             object.firstName = record.GIVEN_NAME;
     *             object.lastName = record.FAMILY_NAME;
     *         }
     *     }
     *
     * Alternatively, subclasses can define a
     * [mapping]{@link DataService#mapping} to do this mapping.
     *
     * The default implementation of this method uses the service's mapping if
     * the service has one, and otherwise calls the deprecated
     * [mapFromRawData()]{@link RawDataService#mapFromRawData}, whose default
     * implementation does nothing.
     *
     * @todo Make this method overridable by type name with methods like
     * `mapRawDataToHazard()` and `mapRawDataToProduct()`.
     *
     * @method
     * @argument {Object} record            - An object whose properties' values hold
     *                                      the raw data.
     * @argument {Object} object            - An object whose properties must be set or
     *                                      modified to represent the raw data.
     * @argument {Object} context            - The value that was passed in to the
     *                                      [addRawData()]{@link RawDataService#addRawData}
     *                                      all that invoked this method.
     * @argument {Array} readExpressions    - A list of expressions to map
     * @argument {Boolean} registerMappedPropertiesAsChanged    - Instructing the mapping to treat mapped properties as changes on the mapped objec.
     *                                                          this is needed when objects are mapped for the sake of being saved
     *                            

     */
    mapRawDataToObject: {
        value: function (record, object, context, readExpressions, registerMappedPropertiesAsChanged) {
            var self = this,
                mapping = this.mappingForObject(object),
                snapshot,
                result;

            // console.log(object.dataIdentifier.objectDescriptor.name +" _mapRawDataToObject id:"+record.id);
            if (mapping) {
                let mappedProperties = this.delegate ? [] : null;

                /*
                    When we fetch objects that have inverse relationships on each others none could complete their mapRawDataProcess because the first one's promise for mapping the relationship to the second never commpletes because the second one itself has it's raw data's foreignKey value to the first one converted/fetched, unique object is found, but that second mapping attenpt to map it gets stuck on the reverse to the second, etc...

                    So to break the cycle, if there's a known snapshot and the object is being mapped, then we don't return a promise, knowing there's already one pending for the first pass.
                */
                snapshot = this.snapshotForObject(object);
                //Changed order of snapshot being set before mapping so that doesn't work
                //if(Object.equals(snapshot,record) ) {

                //Replacing with:
                if (this._objectsBeingMapped.has(object)) {
                    return Promise.resolve(object);

                    // if(this._objectsBeingMapped.has(object)) {
                    //     console.log(object.dataIdentifier.objectDescriptor.name +" _mapRawDataToObject id:"+record.id+" FOUND EXISTING MAPPING PROMISE");
                    //     return undefined;
                    //     return Promise.resolve(object);
                    //     return this._getMapRawDataToObjectPromise(snapshot,object);
                    // } else {
                    //     //rawData is un-changed, no point doing anything...
                    //     return undefined;
                    // }
                }


                this._objectsBeingMapped.add(object);

                result = mapping.mapRawDataToObject(record, object, context, readExpressions, mappedProperties, registerMappedPropertiesAsChanged);

                //Recording snapshot even if we already had an object
                //Record snapshot before we may create an object
                //this.recordSnapshot(object.dataIdentifier, record);

                // console.log(object.dataIdentifier.objectDescriptor.name +" _mapRawDataToObject id:"+record.id+" FIRST NEW MAPPING PROMISE");

                if (result) {
                    return result.then( (resultValue) => {
                        result = self.mapRawDataToObject(record, object, context, readExpressions);
                        if (!this._isAsync(result)) {
                            // self._deleteMapRawDataToObjectPromise(record, object);
                            this._objectsBeingMapped.delete(object);
                            this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidComplete", this, mapping, record, object, context, mappedProperties);

                            return result;
                        }
                        else {
                            result = result.then( (resolved) => {

                                // self._deleteMapRawDataToObjectPromise(record, object);
                                this._objectsBeingMapped.delete(object);
                                this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidComplete", this, mapping, record, object, context, mappedProperties);

                                return resolved;
                            }, (mappingError) => {

                                // self._deleteMapRawDataToObjectPromise(record, object);
                                this._objectsBeingMapped.delete(object);
                                this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidFail", this, mapping, record, object, context, mappedProperties, mappingError);

                            });
                            return result;
                        }

                    }, (mappingError) => {
                        // self._deleteMapRawDataToObjectPromise(record, object);
                        this._objectsBeingMapped.delete(object);
                        this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidFail", this, mapping, record, object, context, mappedProperties, mappingError);
                        throw mappingError;
                    });
                } else {
                    result = this.mapRawDataToObject(record, object, context, readExpressions);
                    if (!this._isAsync(result)) {

                        this._objectsBeingMapped.delete(object);
                        this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidComplete", this, mapping, record, object, context, mappedProperties);

                        return Promise.resolve(result);
                    }
                    else {
                        return result.then((resolved) => {

                            // self._deleteMapRawDataToObjectPromise(record, object);
                            this._objectsBeingMapped.delete(object);
                            this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidComplete", this, mapping, record, object, context, mappedProperties);

                            return resolved;
                        }, (mappingError) => {
                            // self._deleteMapRawDataToObjectPromise(record, object);
                            this._objectsBeingMapped.delete(object);
                            this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidFail", this, mapping, record, object, context, mappedProperties, mappingError);

                        });
                        //return result;
                    }
                }
            } else {


                this._objectsBeingMapped.add(object);

                result = this.mapRawDataToObject(record, object, context, readExpressions);

                if (!this._isAsync(result)) {

                    // self._deleteMapRawDataToObjectPromise(record, object);
                    this._objectsBeingMapped.delete(object);
                    this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidComplete", this, mapping, record, object, context, mappedProperties);

                    return Promise.resolve(result);
                }
                else {
                    return result.then((resolved) => {
                        // self._deleteMapRawDataToObjectPromise(record, object);
                        this._objectsBeingMapped.delete(object);
                        this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidComplete", this, mapping, record, object, context, mappedProperties);

                        return resolved;
                    }, (mappingError) => {
                        // self._deleteMapRawDataToObjectPromise(record, object);
                        this._objectsBeingMapped.delete(object);
                        this.callDelegateMethod("rawDataServiceMappingRawDataToObjectDidFail", this, mapping, record, object, context, mappedProperties, mappingError);
                    });
                    //return result;
                }
            }

            //this._setMapRawDataToObjectPromise(record, object, result);

            // return result;

        }
    },


    /**
     * Public method invoked by the framework during the conversion from
     * an object to a raw data when a created object is saved.
     * 
     * This is optional except when objects of multiple subclasses end up
     * stored in the same container, something needs to tell their type apart
     * so they can be re-instantiated corretly.
     *
     * @method
     * @argument {Object} object - An object whose type must be set or
     *                             modified to represent the raw data.
     * @argument {Object} rawData - An object whose properties' values hold
     *                             the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method. Typically a DataOperation so far
     */
    mapObjectTypeToRawData: {
        value: function (object, rawData, context) {
            return this.mappingForObject(object)?.mapObjectTypeToRawData(object, rawData, context);
        }
    },

    /**
     * Public method invoked by the framework during the conversion from
     * an object to a raw data.
     * Designed to be overriden by concrete RawDataServices to allow fine-graine control
     * when needed, beyond transformations offered by an ObjectDescriptorDataMapping or
     * an ExpressionDataMapping
     *
     * @method
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {Object} record - An object whose properties' values hold
     *                             the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    mapObjectToRawData: {
        value: function (object, record, context) {
            return this.mappingForObject(object)?.mapObjectToRawData(object, record, context);
            // this.mapToRawData(object, record, context);
        }
    },

    /**
     * Called by a mapping before doing it's mapping work, giving the data service.
     * an opportunity to intervene.
     *
     * Subclasses should override this method to influence how properties of
     * data objects are mapped back to raw data:
     *
     * @method
     * @argument {Object} mapping - A DataMapping object handing the mapping.
     * @argument {Object} rawData - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    willMapObjectToRawData: {
        value: function (mapping, object, rawData, context) {
            return rawData;
        }
    },
    /**
     * Called by a mapping after doing it's mapping work.
     *
     * Subclasses should override this method as needed:
     *
     * @method
     * @argument {Object} mapping - A DataMapping object handing the mapping.
     * @argument {Object} rawData - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    didMapObjectToRawData: {
        value: function (mapping, object, rawData, context) {
            return rawData;
        }
    },


    /**
     * Public method invoked by the framework during the conversion from
     * an object to a raw data.
     * Designed to be overriden by concrete RawDataServices to allow fine-graine control
     * when needed, beyond transformations offered by an ObjectDescriptorDataMapping or
     * an ExpressionDataMapping
     *
     * @method
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {String} propertyName - The name of a property whose values
     *                                      should be converted to raw data.
     * @argument {Object} data - An object whose properties' values hold
     *                             the raw data.
     */

    mapObjectPropertyToRawData: {
        value: function (object, propertyName, data) {
        }
    },

    /**
 * @todo Document.
 * @todo Make this method overridable by type name with methods like
 * `mapHazardToRawData()` and `mapProductToRawData()`.
 *
 * @method
 */
    _mapObjectPropertyToRawData: {
        value: function (object, propertyName, record, context, added, removed, lastReadSnapshot, rawDataSnapshot) {
            var mapping = this.mappingForObject(object),
                result;

            if (mapping) {
                result = mapping.mapObjectPropertyToRawData(object, propertyName, record, context, added, removed, lastReadSnapshot, rawDataSnapshot);
            }

            if (record) {
                if (result) {
                    var otherResult = this.mapObjectPropertyToRawData(object, propertyName, record, context, added, removed, lastReadSnapshot, rawDataSnapshot);
                    if (this._isAsync(result) && this._isAsync(otherResult)) {
                        result = Promise.all([result, otherResult]);
                    } else if (this._isAsync(otherResult)) {
                        result = otherResult;
                    }
                } else {
                    result = this.mapObjectPropertyToRawData(object, propertyName, record, context, added, removed, lastReadSnapshot, rawDataSnapshot);
                }
            }

            return result;
        }
    },
    /**
     * Method called by mappings when a mapObjectToRawDataProperty is complete.
     *
     * @method
     * @argument {Object} mapping        - the mapping object
     * @argument {Object} object         - An object whose properties' values
     *                                     hold the model data.
     * @argument {Object} data           - The object on which to assign the property
     * @argument {string} propertyName   - The name of the raw property to which
     *                                     to assign the values.
     */
    mappingDidMapObjectToRawDataProperty: {
        value: function (mapping, object, data, propertyName) {

        }
    },

    /**
    * Method called by mappings when a mapObjectPropertyToRawData is complete.
    *
    * @method
    * @argument {Object} mapping        - the mapping object
    * @argument {Object} object         - An object whose properties' values
    *                                     hold the model data.
    * @argument {string} propertyName   - The name of the property being mapped
    * @argument {Object} data           - The raw data object on which to assign the property
    * @argument {string} propertyName   - The name of the raw property to which
    *                                     to assign the values.
    */
    mappingDidMapObjectPropertyToRawDataProperty: {
        value: function (mapping, object, propertyName, data, rawPropertyName) {

        }
    },

    /**
     * Method called by mappings when asked for a rawDataDescriptor and don't have one.
     *
     * @method
     * @argument {Object} mapping        - the mapping object
     *                                     to assign the values.
     * @returns {ObjectDescriptor}  -
     */
    rawDataDescriptorForDataMapping: {
        value: function (mapping) {
            return this.rawDataDescriptorForObjectDescriptor(mapping.objectDescriptor);
        }
    },

    /**
     * Method called by mappings when asked for a rawDataDescriptor and don't have one.
     *
     * @abstract    Needs to be overriden by subclasses
     * @method
     * @argument {ObjectDescriptor} objectDescriptor        - the objectDescriptor object
     * @returns {ObjectDescriptor}  -
     */
     rawDataDescriptorForObjectDescriptor: {
        value: function (objectDescriptor) {
            return null;
        }
    },

    /**
     * @todo Document.
     * @todo Make this method overridable by type name with methods like
     * `mapHazardToRawData()` and `mapProductToRawData()`.
     * @todo: context should be last, but that's a breaking change
     * @todo: It would be much more efficient to drive the iteration from here
     * instead of doing it once with the mapping and then offering the data service to loop again on the mapping's results.
     *
     *
     * @method
     */
    _mapObjectToRawData: {
        value: function (object, record, context) {
            var mapping = this.mappingForObject(object),
                result;

            if (mapping) {
                //Benoit: third argument was context but it's not defined on
                //ExpressionDataMapping's mapObjectToRawData method
                result = mapping.mapObjectToRawData(object, record);
            }

            if (record) {
                if (result) {
                    var otherResult = this.mapObjectToRawData(object, record, context);
                    if (this._isAsync(result) && this._isAsync(otherResult)) {
                        result = Promise.all([result, otherResult]);
                    } else if (this._isAsync(otherResult)) {
                        result = otherResult;
                    }

                    result = result.then(() => {
                        return record;
                    })
                } else {
                    result = this.mapObjectToRawData(object, record, context);
                }
            }

            return result;
        }
    },

    // /**
    //  * If defined, used by
    //  * [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject} and
    //  * [mapObjectToRawData()]{@link RawDataService#mapObjectToRawData} to map
    //  * between the raw data on which this service is based and the typed data
    //  * objects which this service provides and manages.
    //  *
    //  * @type {?DataMapping}
    //  */
    // mapping: {
    //     value: undefined
    // },

    _mappingsPromise: {
        get: function () {
            if (!this.__mappingsPromise) {
                this.__mappingsPromise = Promise.all(this.mappings.map(function (mapping) {
                    return mapping.objectDescriptor;
                })).then(function (values) {

                });
            }
            return this.__mappingsPromise;
        }
    },

    mappingsIterator: {
        get: function() {
            return this._mappingByType.values();
        }
    },  

    _objectDescriptorMappings: {
        get: function () {
            if (!this.__objectDescriptorMappings) {
                this.__objectDescriptorMappings = new Map();
            }
            return this.__objectDescriptorMappings;
        }
    },

    /**
     * Map from a parent class to the mappings used by the service to
     * determine what subclass to create an instance of for a particular
     * rawData object
     *
     * For example, say a class 'Person' has 2 subclasses 'Employee' & 'Customer'.
     * RawDataService would evaluate each person rawData object against each item
     * in _rawDataTypeMappings and determine if that rawData should be an instance
     * of 'Employee' or 'Customer'.
     * @type {Map<ObjectDescpriptor:RawDataTypeMapping>}
     */

    _descriptorToRawDataTypeMappings: {
        value: undefined
    },

    /**
     * Adds each mapping passed in to _descriptorToRawDataTypeMappings
     *
     * @method
     * @param {Array<RawDataTypeMapping>} mappings
     */
    _registerRawDataTypeMappings: {
        value: function (mappings) {
            var mapping, parentType,
                i, n;

            for (i = 0, n = mappings ? mappings.length : 0; i < n; i++) {
                mapping = mappings[i];
                parentType = mapping.type.parent;
                if (!this._descriptorToRawDataTypeMappings.has(parentType)) {
                    this._descriptorToRawDataTypeMappings.set(parentType, []);
                }
                this._descriptorToRawDataTypeMappings.get(parentType).push(mapping);
            }
        }
    },

    /**
     * Evaluates a rawData object against the RawDataTypeMappings for the fetched
     * class and returns the subclass for the first mapping that evaluates to true.
     *
     * @method
     * @param {ObjectDescriptor} parent Fetched class for which to look for subclasses
     * @param {Object} rawData rawData to evaluate against the RawDataTypeMappings
     * @return {ObjectDescriptor}
     */
    _descriptorForParentAndRawData: {
        value: function (parent, rawData) {
            var mappings = this._descriptorToRawDataTypeMappings.get(parent),
                compiled, mapping, subType,
                i, n;

            if (mappings && mappings.length) {
                for (i = 0, n = mappings.length; i < n && !subType; ++i) {
                    mapping = mappings[i];
                    subType = mapping.criteria.evaluate(rawData) && mapping.type;
                }
            }

            return subType ? this._descriptorForParentAndRawData(subType, rawData) : parent;
        }
    },

    canMapObjectDescriptorRawDataToObjectPropertyWithoutFetch: {

        value: function (objectDescriptor, propertyName) {
            var mapping = this.mappingForType(objectDescriptor),
                objectRule = mapping.objectMappingRuleForPropertyName(propertyName),
                objectRuleConverter = objectRule && objectRule.converter,
                valueDescriptor = objectRule && objectRule.propertyDescriptor?._valueDescriptorReference;

            if(!objectRule.propertyDescriptor) {
                console.warn("mapping for property '"+propertyName+"' doesn't have propertyDescriptor in model");
            }

            /*
                This might be overreaching? Let's see 
            */
            if(valueDescriptor && !objectRuleConverter) {
                console.warn("won't map property '"+propertyName+"' as no comverter is specified for valueDescriptor " +valueDescriptor.name);
            }

            return (
                objectRule && (
                    !valueDescriptor ||
                    (valueDescriptor && !!objectRuleConverter && !(objectRuleConverter instanceof RawForeignValueToObjectConverter))
                )
            );
        }
    },

    rawCriteriaForObject: {
        value: function (object, _objectDescriptor) {

            var objectDescriptor = _objectDescriptor || this.objectDescriptorForObject(object),
                mapping = this.mappingForType(objectDescriptor);

            return mapping.rawDataPrimaryKeyCriteriaForObject(object);

        }
    },

    areCriteriaSyntaxPropertiesRawDataPrimaryKeys: {
        value: function(typeToFetch, criteria) {
            let mapping = this.mappingForType(typeToFetch);
            return (mapping && mapping.rawDataPrimaryKeys && mapping.rawDataPrimaryKeys.equals(syntaxProperties(criteria.syntax)));
        }
    },

    objectWithDescriptorMatchingRawDataPrimaryKeyCriteria: {
        value: function (typeToFetch, criteria) {
            var dataIdentifier, existingObject = null;

            /*
            1) dataIdentifierForTypePrimaryKey(type, primaryKey)

            2) objectForDataIdentifier
            */
           /*
            Simplifying assumptions for now:
            if parameters is a string, it's the primary key
            if parameters is an array, it's an array of primaryKeys
            */
           if(this.areCriteriaSyntaxPropertiesRawDataPrimaryKeys(typeToFetch, criteria)) {

                if(typeof criteria.parameters === "string") {
                        dataIdentifier = this.dataIdentifierForTypePrimaryKey(typeToFetch,criteria.parameters);
                        existingObject = this.rootService.objectForDataIdentifier(dataIdentifier);
                } else if(Array.isArray(criteria.parameters)) {
                    var rootService = this.rootService,
                        array = criteria.parameters, i=0, iObject,
                        firstLocalObjectIndex = -1,
                        parametersToFetch;

                    while( i < array.length ) {
                        dataIdentifier = this.dataIdentifierForTypePrimaryKey(typeToFetch,array[i]);
                        iObject = rootService.objectForDataIdentifier(dataIdentifier);
                        if(iObject) {
                            //Add to result
                            (existingObject || (existingObject = [])).push(iObject);
                            //remove from criteria since found
                            // array.splice(i,1);
                            /*
                                The first time we find a local object, we need to fork the arrays as we'll fullfill some from local, and the rest from the network.
                            */
                            if(firstLocalObjectIndex == -1) {
                                firstLocalObjectIndex = i;
                            }
                        } else if(firstLocalObjectIndex !== -1) {

                            if(!parametersToFetch) {
                                parametersToFetch = array.slice(0, firstLocalObjectIndex);
                            }
                            parametersToFetch.push(array[i]);
                        }
                        i++;
                    }

                    if(parametersToFetch) {
                        criteria.parameters = parametersToFetch;
                    } else if(existingObject && existingObject.length === array.length) {
                        /*
                            Looks like we found everything locally
                        */
                        criteria.parameters = Array.empty;
                    }
                }

                return existingObject;

            } 
            else {
                let snapshot = this._snapshot,
                    snapshotDataIdentifierKeys = this._snapshot.keysArray(),
                    mainService = this.mainService,
                    result;
                for(let i=0, countI = snapshotDataIdentifierKeys.length, iSnapshotDataIdentifierKey, iSnapshot, iObject; (i < countI); i++) {
                    iSnapshotDataIdentifierKey = snapshotDataIdentifierKeys[i];
                    //TODO: we should also tests iObject.objectDescriptor any of childObjectDescriptors
                    if(iSnapshotDataIdentifierKey.objectDescriptor === typeToFetch) {
                        iSnapshot = snapshot.get(iSnapshotDataIdentifierKey);
                        if(criteria.evaluate(iSnapshot)) {
                            iObject = mainService.objectForDataIdentifier(iSnapshotDataIdentifierKey);
                            if(iObject) {
                                (result || (result = [])).push(iObject);
                            } else {
                                console.warn(this.name+": No object found for dataIdentifier in snapshot:" + iSnapshotDataIdentifierKey);
                            }
                        }
                    }
                }
                return result;
            }

        }
    },

    /***************************************************************************
     *
     * Data Operation related methods
     *
     ***************************************************************************/

    /**
     * By default, raw data sercvices handling a readOperation don't return a promise, 
     * which triggers the event manager to continue the propagation when that promise settles.
     * 
     * If promisesReadOperationCompletion is set to true, a RawDataService has to return a promise that resolves
     * to the operation followig the read, a readCompletedOperation / readCompletedOperation or a readFailedOperation
     *
     *
     * @property {Boolean}
     */

    promisesReadOperationCompletion: {
        value: false
    },

    _operationListenerNamesByType: {
        value: new Map()
    },
    _operationListenerNameForType: {
        value: function (type) {
            return this._operationListenerNamesByType.get(type) || this._operationListenerNamesByType.set(type, "handle" + type.toCapitalized()).get(type);
        }
    },

    /**
     * Returns a promise that represents the completion of a pending data operation if it exists
     *
     * @method
     * @argument {DataOperation} dataOperation
     */
    completionPromiseForPendingDataOperation: {
        value: function (dataOperation) {
            var dataOperationRegistration = this._pendingDataOperationById.get(dataOperation.id);
            if (dataOperationRegistration && !dataOperationRegistration.completionPromise) {
                dataOperationRegistration.completionPromise = new Promise(function (resolve, reject) {
                    dataOperationRegistration.completionPromiseResolve = resolve;
                    dataOperationRegistration.completionPromiseReject = reject;
                });
            }
            return dataOperationRegistration ? dataOperationRegistration.completionPromise : undefined;
        }
    },

    /**
     * Returns the registered context for a pending data operation if it exists
     *
     * @method
     * @argument {DataOperation} dataOperation
     */
    contextForPendingDataOperation: {
        value: function (dataOperation) {
            var dataOperationRegistration = this._pendingDataOperationById.get(dataOperation.id);
            return dataOperationRegistration
                ? dataOperationRegistration.context
                //Backup in transition
                //: DataService.mainService.registeredDataStreamForDataOperation(dataOperation);
                // Needs cleanup
                : dataOperation?.referrer?.dataStream;
        }
    },

    /**
     * Create if needed a promise that represents the completion of a pending data operation, a data operation
     * that is expected to be followed by data operations representing progress, success or failure.
     *
     * @method
     * @argument {DataOperation} dataOperation
     */

    registerPendingDataOperationWithContext: {
        value: function (dataOperation, context, createPromise) {
            var dataOperationRegistration = this._pendingDataOperationById.get(dataOperation.id);

            if (!dataOperationRegistration) {
                dataOperationRegistration = {
                    dataOperation: dataOperation
                };

                if (context) {
                    dataOperationRegistration.context = context;
                }

                this._pendingDataOperationById.set(dataOperation.id, dataOperationRegistration);

                if (createPromise) {
                    dataOperationRegistration.completionPromise = new Promise(function (resolve, reject) {
                        dataOperationRegistration.completionPromiseResolve = resolve;
                        dataOperationRegistration.completionPromiseReject = reject;
                    });

                    return dataOperationRegistration.completionPromise;
                }
            }
        }
    },

    unregisterPendingDataOperation: {
        value: function (dataOperation) {
            this._pendingDataOperationById.delete(dataOperation.id);
            //Backup until bug fixed
            //DataService.mainService.unregisterDataStreamForDataOperation(dataOperation);
        }
    },

    unregisterDataOperationPendingReferrer: {
        value: function (dataOperation) {
            this._pendingDataOperationById.delete(dataOperation.referrerId);
            //Backup until bug fixed
            //DataService.mainService.unregisterDataStreamForDataOperation(dataOperation);
        }
    },
    /**
     * Returns a promise that represents the completion of data operation's referrer operation if it exists
     *
     * @method
     * @argument {DataOperation} dataOperation
     */
    referrerForDataOperation: {
        value: function (dataOperation) {
            var dataOperationRegistration = this._pendingDataOperationById.get(dataOperation.referrerId);
            return dataOperationRegistration
                ? dataOperationRegistration.dataOperation
                : null;
        }
    },

    /**
     * Returns a promise that represents the completion of data operation's referrer operation if it exists
     *
     * @method
     * @argument {DataOperation} dataOperation
     */
    referrerCompletionPromiseForDataOperation: {
        value: function (dataOperation) {
            var referrerDataOperationRegistration = this._pendingDataOperationById.get(dataOperation.referrerId);
            return referrerDataOperationRegistration ? referrerDataOperationRegistration.completionPromise : undefined;
        }
    },

    /**
 * Returns a promise that represents the completion of data operation's referrer operation if it exists
 *
 * @method
 * @argument {DataOperation} dataOperation
 */
    referrerContextForDataOperation: {
        value: function (dataOperation) {
            var referrerDataOperationRegistration = this._pendingDataOperationById.get(dataOperation.referrerId || dataOperation.referrer.id);
            return referrerDataOperationRegistration
                ? referrerDataOperationRegistration.context
                : undefined;
            //For migration
            //: DataService.mainService.registeredDataStreamForDataOperation(dataOperation);
        }
    },

    /**
     * Resolves the promise that represents the completion of data operation's referrer operation, if it exists
     *
     * @method
     * @argument {DataOperation} dataOperation
     */
    resolveCompletionPromiseWithDataOperation: {
        value: function (dataOperation) {
            var referrerDataOperationRegistration = this._pendingDataOperationById.get(dataOperation.referrerId);
            if (!referrerDataOperationRegistration) {
                return;
            }
            referrerDataOperationRegistration.completionPromiseResolve(dataOperation);
            this._pendingDataOperationById.delete(dataOperation.referrerId);
        }
    },

    /**
     * Rejects the promise that represents the completion of data operation's referrer operation, if it exists
     *
     * @method
     * @argument {DataOperation} dataOperation
     */
    rejectCompletionPromiseWithDataOperation: {
        value: function (dataOperation) {
            var referrerDataOperationRegistration = this._pendingDataOperationById.get(dataOperation.referrerId);
            if (!referrerDataOperationRegistration) {
                return;
            }
            //dataOperation.data is an Error
            referrerDataOperationRegistration.completionPromiseReject(dataOperation.data);
            this._pendingDataOperationById.delete(dataOperation.referrerId);
        }
    },



    handleRead: {
        value: function (readEvent) {

            var query = readEvent.query,
                self = this;
            stream = readEvent.dataStream;
            stream.query = query;

            // make sure type is an object descriptor or a data object descriptor.
            // query.type = this.rootService.objectDescriptorForType(query.type);


            var objectDescriptor = query.type,
                criteria = query.criteria,
                criteriaWithLocale,
                parameters,
                rawParameters,
                readOperation = new DataOperation(),
                rawReadExpressions = [],
                rawOrderings,
                promises;
            // localizableProperties = objectDescriptor.localizablePropertyDescriptors;

            /*
                We need to turn this into a Read Operation. Difficulty is to turn the query's criteria into
                one that doesn't rely on objects. What we need to do before handing an operation over to another context
                bieng a worker on the client side or a worker on the server side, is to remove references to live objects.
                One way to do this is to replace every object in a criteria's parameters by it's data identifier.
                Another is to serialize the criteria.
            */
            readOperation.referrerId = readEvent.id;
            readOperation.type = DataOperation.Type.ReadOperation;
            readOperation.target = objectDescriptor;
            readOperation.rawDataService = this;

            if(query.identity) {
                readOperation.identity = query.identity;
            } else if(this.identity) {
                readOperation.identity = this.identity;
            }
            //readOperation.data = {};

            //Need to add a check to see if criteria may have more spefific instructions for "locale".
            /*
                1/19/2021 - we were only adding locale when the object descriptor being fetched has some localizableProperties, but a criteria may involve a subgraph and we wou'd have to go through the syntactic tree of the criteria, and readExpressions, to figure out if anywhere in that subgraph, there might be localizable properties we need to include the locales for.

                Since we're localized by default, we're going to include it no matter what, it's going to be more rare that it is not needed than it is.
            */
            /*
                WIP Adds locale as needed. Most common case is that it's left to the framework to qualify what Locale to use.

                A core principle is that each data object (DO) has a locale property behaving in the following way:
                locales has 1 locale value, a locale object.
                This is the most common use case. The property’s getter returns the user’s locale.
                Fetching an object with a criteria asking for a specific locale will return an object in that locale.
                Changing the locale property of an object to another locale instance (singleton in Locale’s case), updates all the values of its localizable properties to the new locale set.
                locales has either no value, or “*” equivalent, an “All Locale Locale”
                This feches the json structure and returns all the values in all the locales
                locales has an array of locale instances.
                If locale’s cardinality is > 1 then each localized property would return a json/dictionary of locale->value instead of 1 value.
            */

            readOperation.locales = self.userLocales;


            if (criteria) {
                //readOperation.criteria = criteria.clone();
                readOperation.criteria = criteria;
            }

            if (query.fetchLimit) {
                readOperation.data.readLimit = query.fetchLimit;
            }

            if (query.batchSize) {
                readOperation.data.batchSize = query.batchSize;
            }

            if (query.orderings && query.orderings > 0) {
                rawOrderings = [];
                // self._mapObjectDescriptorOrderingsToRawOrderings(objectDescriptor, query.sortderings,rawOrderings);
                // readOperation.data.orderings = rawOrderings;
                readOperation.data.orderings = query.orderings;
            }

            /*
                for a read operation, we already have criteria, shouldn't data contains the array of
                expressions that are expected to be returned?
            */
            /*
                The following block is from PhrontClientService, we shouldn't map to rawReadExpressions just yet.
            */
            // self._mapObjectDescriptorReadExpressionToRawReadExpression(objectDescriptor, query.readExpressions,rawReadExpressions);
            // if(rawReadExpressions.length) {
            //     readOperation.data.readExpressions = rawReadExpressions;
            // }
            if (query.readExpressions && query.readExpressions.length) {
                readOperation.data.readExpressions = query.readExpressions;
            }

            /*
                We need to do this in node's DataWorker, it's likely that we'll want that client side as well, where it's some sort of token set post authorization.
            */
            if (this.application.identity && this.shouldAuthenticateReadOperation) {
                readOperation.identity = this.application.identity;
            }

            /*

                this is half-assed, we're mapping full objects to RawData, but not the properties in the expression.
                phront-service does it, but we need to stop doing it half way there and the other half over there.
                SaveChanges is cleaner, but the job is also easier there.

            */
            parameters = criteria ? criteria.parameters : undefined;
            rawParameters = parameters;

            if (parameters && typeof criteria.parameters === "object") {
                var keys = Object.keys(parameters),
                    i, countI, iKey, iValue, iRecord,
                    criteriaClone;

                //rawParameters = Array.isArray(parameters) ? [] : {};

                for (i = 0, countI = keys.length; (i < countI); i++) {
                    iKey = keys[i];
                    iValue = parameters[iKey];
                    if (!iValue) {
                        console.warn("fetchData: criteria ",criteria, "has value: "+value+" for parameter key " + iKey);
                    } else {
                        if (iValue.dataIdentifier) {


                            if (!criteriaClone) {
                                criteriaClone = criteria.clone();
                                rawParameters = criteriaClone.parameters;
                            }
                            /*
                                this isn't working because it's causing triggers to fetch properties we don't have
                                and somehow fails, but it's wastefull. Going back to just put primary key there.
                            */
                            // iRecord = {};
                            // rawParameters[iKey] = iRecord;
                            // (promises || (promises = [])).push(
                            //     self._mapObjectToRawData(iValue, iRecord)
                            // );
                            rawParameters[iKey] = iValue.dataIdentifier.primaryKey;
                        }
                        // else {
                        //     rawParameters[iKey] = iValue;
                        // }
                    }

                }

                if (criteriaClone) {
                    readOperation.criteria = criteriaClone;
                }
                // if(promises) promises = Promise.all(promises);
            }
            // if(!promises) promises = Promise.resolve(true);
            // promises.then(function() {
            // if(criteria) {
            //     readOperation.criteria.parameters = rawParameters;
            // }
            //console.log("fetchData operation:",JSON.stringify(readOperation));

            this.registerPendingDataOperationWithContext(readOperation, stream);
            objectDescriptor.dispatchEvent(readOperation);


            // if(criteria) {
            //     readOperation.criteria.parameters = parameters;
            // }

            // });

            //return stream;
        }
    },

    handleReadUpdateOperation: {
        value: function (operation) {
            var referrer = operation.referrerId,
                objectDescriptor = operation.target,
                records = operation.data,
                //stream = DataService.mainService.registeredDataStreamForDataOperation(operation),
                stream = this.contextForPendingDataOperation(operation),
                // stream = this.referrerContextForDataOperation(operation),

                streamObjectDescriptor;
            // if(operation.type === DataOperation.Type.ReadCompletedOperation) {
            //     console.log("handleReadCompleted  referrerId: ",operation.referrerId, "records.length: ",records.length);
            // } else {
            //     console.log("handleReadUpdateOperation  referrerId: ",operation.referrerId, "records.length: ",records.length);
            // }
            // if(operation.type === DataOperation.Type.ReadUpdateOperation) {
            //     console.log("handleReadUpdateOperation  referrerId: ",referrer);
            // }

            //console.log("handleReadUpdateOperation type: "+operation.type+" for target '"+objectDescriptor.name+" for referrerId "+referrer);


            if (stream) {
                streamObjectDescriptor = stream.query.type;
                /*

                    We now could get readUpdate that are reads for readExpressions that are properties (with a valueDescriptor) of the ObjectDescriptor of the referrer. So we need to add a check that the obectDescriptor match, otherwise, it needs to be assigned to the right instance, or created in memory and mapping/converters will find it.
                */

                if (streamObjectDescriptor === objectDescriptor) {
                    if (records && records.length > 0) {
                        //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
                        this.addRawData(stream, records, operation);
                        if (stream.query.doesBatchResult) {
                            this.rawDataBatchDone(stream);
                        }

                    } else if (operation.type !== DataOperation.Type.ReadCompletedOperation) {
                        console.log("operation of type:" + operation.type + ", has no data");
                    }
                } else {
                    //console.error("handleReadUpdateOperation type: " + operation.type + " that is for a readExpression of referrerId "+ referrer);
                    if (records && records.length > 0) {
                        //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
                        this.addRawData(stream, records, operation);
                        if (stream.query.doesBatchResult) {
                            this.rawDataBatchDone(stream);
                        }

                    } else if (operation.type !== DataOperation.Type.ReadCompletedOperation) {
                        console.log("operation of type:" + operation.type + ", has no data");
                    }

                }
            }
            else {
                /*
                    FIXME - we should only register to receive ReadUpdateOperation when we ourselves dispatched a  DataOperation.Type.ReadOperation.

                    The tricky part is that we need to track that we have ones in-flight. So maybe addEventListener/removeEventListener should keep track of a count.
                */
                // console.error(this," -handleReadUpdateOperation type: "+operation.type+" for target '"+objectDescriptor.name+", but can't find a matching stream for referrerId "+referrer);
            }
        }
    },

    handleReadCompletedOperation: {
        value: function (operation) {

            /*
                Not ideal, we should find a way to avoid this, 
                but when mutliple RawDataServices handle the same object descriptors,
                a RawDataService should only take care of raw data it produced
            */

            if(operation.rawDataService === this) {
            
                //The read is complete
                this.handleReadUpdateOperation(operation);
                //var stream = DataService.mainService.registeredDataStreamForDataOperation(operation);
                // var stream = this.referrerContextForDataOperation(operation);
                var stream = this.contextForPendingDataOperation(operation);
                if (stream) {
                    this.rawDataDone(stream);
                    //this._thenableByOperationId.delete(operation.referrerId);
                    this.unregisterDataOperationPendingReferrer(operation);
                }
                else {
                    console.log("receiving operation of type:"+operation.type+", but can't find a matching stream");
                }
                //console.log("handleReadCompleted -clear _thenableByOperationId- referrerId: ",operation.referrerId);
            }

        }
    },

    handleReadFailedOperation: {
        value: function (operation) {
            var stream = this.referrerContextForDataOperation(operation);
            if (stream) {

                this.rawDataError(stream, operation.data);
                this.unregisterDataOperationPendingReferrer(operation);
                //this._thenableByOperationId.delete(operation.referrerId);
            }

        }
    },


    /**
     * Utility method that simplifies creating the right response data operation to a readOperation,
     * taking into account wether we have data or an error, if the response is partial, one of many and not the last one,
     * with also the possibility that the target of the response may be different than the target of the read
     *
     * @method
     * @argument {DataOperation} dataOperation
     */
    responseOperationForReadOperation: {
        value: function (readOperation, err, data, isNotLast, responseOperationTarget = readOperation.target) {
            var isDataArray = Array.isArray(data);

            // if (isDataArray && data.length === 0 && isNotLast) {
            //     return null;
            // }

            var operation = new DataOperation();

            operation.referrerId = readOperation.id;
            if(readOperation.identity) {
                operation.identity = readOperation.identity;
            }

            operation.referrer = readOperation;
            operation.target = responseOperationTarget;
            operation.rawDataService = this;

            //Carry on the details needed by the coordinator to dispatch back to client
            // operation.connection = readOperation.connection;
            operation.clientId = readOperation.clientId;
            //console.log("executed Statement err:",err, "data:",data);

            if (err) {
                // an error occurred
                //console.log("!!! handleRead FAILED:", err, err.stack, rawDataOperation.sql);
                operation.type = DataOperation.Type.ReadFailedOperation;
                //Should the data be the error?
                operation.data = err;
            }
            else {
                // successful response

                //If we need to take care of readExpressions, we can't send a ReadCompleted until we have returnes everything that we asked for.
                if (isNotLast) {
                    operation.type = DataOperation.Type.ReadUpdateOperation;
                } else {
                    operation.type = DataOperation.Type.ReadCompletedOperation;
                }


                /*
                    Make sure we have an array
                */
                if (!isDataArray) {
                    if(data === undefined) {
                        data = [];
                    } else {
                        data = [data];
                    }
                }

                //We provide the inserted records as the operation's payload
                operation.data = data;

                /*
                    Now we check if there's a known stream. If there's one, it's a local (as in memory space) and we map to the matching dataStream)
                
                    TODO: We need to move that out in order to support strategies involving
                    multiple RawDataServices handling the same Data Objects Like :
                        - sharding, fetching different aspect of data from different RawDataServices in parallel,
                        each with a shard of the data. They would have to be equiped with a criteria describing the nature of the shard?

                        - local fallback/cache, like an offline scenario, where the source of truth is in the cloud, but the app
                        needs a local storage, which is the same use-case for on-device storage or on-promise

                        - redundancy, maybe a data needs to be persisted both in a unified storage so some reads might be initialized from 
                        and origin data source (API, DB, etc...) if missing in the unified storage, and changes also needs to both stored in the unified 
                        storage but also propagated back to the origin data source.

                        - othes?

                    Also, the main service being the one that issues the fetch is best placed
                    to actually add data to the matching stream by listening to readCompletedOperations, or not, depending
                    on which RawDataService returns and the strategy involving the coordination of multiple RawDataServices returning results
                    on handling the same data operation.
                */

                // var stream = this.contextForPendingDataOperation(operation);
                // //var stream = DataService.mainService.registeredDataStreamForDataOperation(operation);
                // if (stream) {
                //     this.addRawData(stream, data, operation);

                //     if (operation.type === DataOperation.Type.ReadCompletedOperation) {
                //         this.rawDataDone(stream);
                //     } else if (stream.query.doesBatchResult) {
                //         self.rawDataBatchDone(stream);
                //     }
                // }
            }
            return operation;
        }
    },


    /***************************************************************************
     *
     * saveChanges / transactions
     *
     ***************************************************************************/

    /**
     * Answers wether a RawDataService is capable of saving data
     *
     * @property {Boolean} defaults to false as it's the most common case
     */
    canSaveData: {
        value: false
    },

    /**
     * Answers wether a RawDataService is capable of implementing transaction
     *
     * Let's see if we end up needing it
     *
     * @property {Boolean}
     */
    supportsTransaction: {
        value: false
    },

    usePerformTransaction: {
        value: false
    },

    handleOperationCompleted: {
        value: function (operation) {
            var referrerOperation = this._pendingDataOperationById.get(operation.referrerId);

            /*
                Right now, we listen for the types we care about, on the mainService, so we're receiving it all,
                even those from other data services / types we don' care about, like the PlummingIntakeDataService.

                One solution is to, when we register the types in the data service, to test if it handles operations, and if it does, the add all listeners. But that's a lot of work which will slows down starting time. A better solution would be to do like what we do with Components, where we find all possibly interested based on DOM structure, and tell them to prepare for a first delivery of that type of event. We could do the same as we know which RawDataService handle what ObjectDescriptor, which would give the RawDataService the ability to addListener() right when it's about to be needed.

                Another solution could involve different "pools" of objects/stack, but we'd lose the universal bus.

            */
            if (!referrerOperation) {
                return;
            }

            /*
                After creation we need to do this:                   self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);

                The referrerOperation could get hold of object, but it doesn't right now.
                We could also create a uuid client side and not have to do that and deal wih it all in here which might be cleaner.

                Now resolving the promise finishes the job in saveObjectData that has the object in scope.
            */
            referrerOperation._promiseResolve(operation);
            this._pendingDataOperationById.delete(operation.referrerId);
        }
    },

    handleOperationFailed: {
        value: function (operation) {
            var referrerOperation = this._pendingDataOperationById.get(operation.referrerId);

            /*
                After creation we need to do this:                   self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);

                The referrerOperation could get hold of object, but it doesn't right now.
                We could also create a uuid client side and not have to do that and deal wih it all in here which might be cleaner.

                Now resolving the promise finishes the job in saveObjectData that has the object in scope.
            */

            if (!referrerOperation) {
                return;
            }

            referrerOperation._promiseReject(operation);
            this._pendingDataOperationById.delete(operation.referrerId);
        }
    },


    /**
     * transactionPrepare event handler, a RawDataService needs to look at the transaction and determine
     * if it involves types it's supposed to take care of.
     *
     * @method
     * @argument {TransactionEvent} transactionPrepareEvent
     */

    _dispatchTransactionCreateStart: {
        value: function (transaction, data) {
            var transactionEvent = TransactionEvent.checkout();

            transactionEvent.type = TransactionEvent.transactionCreateStart;
            transactionEvent.transaction = transaction;
            transactionEvent.data = data;
            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionEvent);
            /*
                Return the event to the pool
            */
            TransactionEvent.checkin(transactionEvent);

            return true;
        }
    },
    _dispatchTransactionCreateComplete: {
        value: function (transaction, data) {
            var transactionEvent = TransactionEvent.checkout();

            transactionEvent.type = TransactionEvent.transactionCreateComplete;
            transactionEvent.transaction = transaction;
            transactionEvent.data = data;
            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionEvent);
            /*
                Return the event to the pool
            */
            TransactionEvent.checkin(transactionEvent);

            //Now that we know we start, we need to listen to transactionPrepare
            this.mainService.addEventListener(TransactionEvent.transactionPrepare, this, false);

            //But just because we are ready, it doesn't mean that all RawDataServices involved might,
            //so we listent for transactionRollback in case that's what happens.
            this.mainService.addEventListener(TransactionEvent.transactionRollback, this, false);

            return true;
        }
    },
    _dispatchTransactionCreateFail: {
        value: function (transaction, data) {
            var transactionEvent = TransactionEvent.checkout();

            transactionEvent.type = TransactionEvent.transactionCreateFail;
            transactionEvent.transaction = transaction;
            transactionEvent.data = data;
            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionEvent);
            /*
                Return the event to the pool
            */
            TransactionEvent.checkin(transactionEvent);

            //We're done, nothing to undo/rollback as too eatly in the process.

            return true;
        }
    },

    handleTransactionCreate: {
        value: function (transactionCreateEvent) {
            if (this.supportsTransaction) {

                var self = this,
                    transaction = transactionCreateEvent.transaction,
                    transactionRawContext = this.rawContextForTransaction(transaction),
                    transactionObjectDescriptors = transaction.objectDescriptors,
                    iterator = transactionObjectDescriptors.values(),
                    iteration, iObjectDescriptor,
                    createOperationType = DataOperation.Type.CreateOperation,
                    updateOperationType = DataOperation.Type.UpdateOperation,
                    deleteOperationType = DataOperation.Type.DeleteOperation,
                    createdDataObjects = transaction.createdDataObjects,
                    changedDataObjects = transaction.updatedDataObjects,
                    updatedData = transaction.updatedData,
                    dataObjectChanges = transaction.dataObjectChanges,
                    deletedDataObjects = transaction.deletedDataObjects,
                    deletedData = transaction.deletedData,
                    operationCount = 0,
                    operationObjectDescriptors = [],
                    // transactionCreateStartDispatched = false,
                    dataOperationCreationPromises,
                    createTransactionOperation,
                    dataOperationsByObject = new Map();/* Key is object, value is operation */


                //console.log("handleTransactionCreate: transaction-"+transaction.identifier, transaction);

                //To help debug tracability, let's assign to the createTransactionOperation's id transaction.identifier
                createTransactionOperation = new DataOperation();
                createTransactionOperation.id = transaction.identifier;

                createTransactionOperation.type = DataOperation.Type.CreateTransactionOperation;
                createTransactionOperation.target = TransactionDescriptor;
                createTransactionOperation.data = {};

                transactionRawContext.operations = {};
                transactionRawContext.dataOperationsByObject = dataOperationsByObject;

                this.rawContextForTransaction(transaction).createTransactionOperation = createTransactionOperation;

                while (!(iteration = iterator.next()).done) {
                    iObjectDescriptor = iteration.value;
                    if (this.handlesType(iObjectDescriptor)) {


                        /*
                            As progress, we could build it on the number of objectDescriptors iterted on?
                            Not super accurate but we don't know the totals in term of operations.
                        */

                        /*
                            Even if addEventListener has already been called, it won't add it twice, but we should pay attention to perf.
                            Internal structure is using an array and indexOf(), we might want to re-assess if internally using a Set instead might be better.
                        */
                        if (!dataOperationCreationPromises) {
                            dataOperationCreationPromises = [];
                        }

                        (dataOperationCreationPromises || (dataOperationCreationPromises = [])).push(
                            this._saveTransactionDataOperationsForObjectDescriptor(transaction, iObjectDescriptor, createOperationType, createdDataObjects, updateOperationType, changedDataObjects, dataObjectChanges, deleteOperationType, deletedDataObjects, dataOperationsByObject, createTransactionOperation, operationObjectDescriptors, transactionRawContext)
                                .then(function (_operationCount) {
                                    /*
                                        As soon as we know there will be some action we broadcast we'll be in:
                                    */
                                    if (operationCount === 0 && _operationCount > 0) {
                                        // if(!transactionCreateStartDispatched) {
                                        transactionCreateStartDispatched = self._dispatchTransactionCreateStart(transaction, {
                                            progress: 0
                                        });
                                        // }
                                    }
                                    operationCount += _operationCount;
                                })
                        );

                    }
                }

                transaction.createCompletionPromiseForParticipant(this);

                Promise.all(dataOperationCreationPromises)
                    .then(function () {
                        transactionRawContext.operationCount = operationCount;
                        if (operationCount > 0) {
                            // createTransactionOperation.data = {
                            //     objectDescriptors: transactionObjectDescriptors.map((objectDescriptor) => {return objectDescriptor.module.id})
                            // }

                            self.registerPendingDataOperationWithContext(createTransactionOperation, transaction);
                            createTransactionDataOperationCompletionPromise = self.completionPromiseForPendingDataOperation(createTransactionOperation);

                            createTransactionOperation.data.objectDescriptors = operationObjectDescriptors.map((objectDescriptor) => { return objectDescriptor.module.id });

                            createTransactionOperation.target.dispatchEvent(createTransactionOperation);

                            createTransactionDataOperationCompletionPromise
                                .then(function (dataOperationCompletion) {
                                    self._dispatchTransactionCreateComplete(transaction, {
                                        objectDescriptors: operationObjectDescriptors
                                    });
                                    transaction.resolveCompletionPromiseForParticipant(self);
                                }, function (error) {
                                    self._dispatchTransactionCreateFail(transaction, error);
                                    transaction.rejectCompletionPromiseForParticipantWithError(self, error);
                                });

                        } else {
                            /*
                                Right now we're missing a way to tell that we didn't have anything to do
                            */
                            transaction.resolveCompletionPromiseForParticipant(self);
                        }
                    });
            }
        }
    },


    _saveTransactionDataOperationsForObjectDescriptor: {
        value: function (transaction, iObjectDescriptor, createOperationType, createdDataObjects, updateOperationType, changedDataObjects, dataObjectChanges, deleteOperationType, deletedDataObjects, dataOperationsByObject, createTransactionOperation, operationObjectDescriptors, transactionRawContext) {
            var currentHandledCreatedDataObjects,
                currentHandledChangedDataObjects,
                currentHandledDeletedDataObjects,
                operationCount = 0,
                operationsByType = {},
                dataOperationCreationPromises = [];

            if (createdDataObjects.has(iObjectDescriptor)) {
                currentHandledCreatedDataObjects = createdDataObjects.get(iObjectDescriptor);
            }

            if (changedDataObjects.has(iObjectDescriptor)) {
                currentHandledChangedDataObjects = changedDataObjects.get(iObjectDescriptor);
            }

            if (deletedDataObjects.has(iObjectDescriptor)) {
                currentHandledDeletedDataObjects = deletedDataObjects.get(iObjectDescriptor);
            }

            currentOperationCount =
                (currentHandledCreatedDataObjects ? currentHandledCreatedDataObjects.size : 0) +
                (currentHandledChangedDataObjects ? currentHandledChangedDataObjects.size : 0) +
                (currentHandledDeletedDataObjects ? currentHandledDeletedDataObjects.size : 0);


            if (currentHandledCreatedDataObjects) {
                dataOperationCreationPromises.push(this._saveDataOperationsForObjects(currentHandledCreatedDataObjects, createOperationType, dataObjectChanges, dataOperationsByObject, createTransactionOperation, currentOperationCount, transaction)
                    .then(function (_createOperations) {
                        if (_createOperations && _createOperations.length) {
                            operationCount += _createOperations.length;
                            operationsByType.createOperations = _createOperations;
                        }
                        //push.apply(createOperations, _createOperations);
                    }));
            }

            if (currentHandledChangedDataObjects) {
                dataOperationCreationPromises.push(this._saveDataOperationsForObjects(currentHandledChangedDataObjects, updateOperationType, dataObjectChanges, dataOperationsByObject, createTransactionOperation, currentOperationCount, transaction)
                    .then(function (_updateOperations) {
                        if (_updateOperations && _updateOperations.length) {
                            operationCount += _updateOperations.length;
                            operationsByType.updateOperations = _updateOperations;
                        }
                        //push.apply(updateOperations, _updateOperations);
                    }));
            }

            if (currentHandledDeletedDataObjects) {
                dataOperationCreationPromises.push(this._saveDataOperationsForObjects(currentHandledDeletedDataObjects, deleteOperationType, dataObjectChanges, dataOperationsByObject, createTransactionOperation, currentOperationCount, transaction)
                    .then(function (_deleteOperations) {
                        if (_deleteOperations && _deleteOperations.length) {
                            operationCount += _deleteOperations.length;
                            operationsByType.deleteOperations = _deleteOperations;
                        }
                        //push.apply(deleteOperations, _deleteOperations);
                    }));
            }

            return Promise.all(dataOperationCreationPromises)
                .then(function () {
                    /*
                        We're saving the operations in the rawContext as we'll send them in handlePrepareTransaction
                    */
                    if (operationCount > 0) {
                        /*
                            Same combination of config.name/module.id to make the module id rooted on the project it belongs used in montage-visitor.js serializationModuleIdForObject() 
                            to express it from the app stand point. This may not take into account an project-specific alias of the project?
                            In any case, this should be consolidated in one unique place.

                            This is a new-ish problem that started when we exchange seriaalization between different processes that are different projects
                        */
                        transactionRawContext.operations[iObjectDescriptor.module.id] = operationsByType;
                        //transactionRawContext.operations[`${iObjectDescriptor.module.require.config.name}/${iObjectDescriptor.module.id}`] = operationsByType;
                        operationObjectDescriptors.push(iObjectDescriptor);
                    }
                    return operationCount;
                });
        }

    },

    /**
     * transactionPrepare event handler, a RawDataService needs to look at the transaction and determine
     * if it involves types it's supposed to take care of.
     *
     * @method
     * @argument {TransactionEvent} transactionPrepareEvent
     */
    _dispatchTransactionPrepareStart: {
        value: function (transaction, data) {
            var transactionEvent = TransactionEvent.checkout();

            transactionEvent.type = TransactionEvent.transactionPrepareStart;
            transactionEvent.transaction = transaction;
            transactionEvent.data = data;
            transactionEvent.target = TransactionDescriptor
            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionEvent);
            /*
                Return the event to the pool
            */
            TransactionEvent.checkin(transactionEvent);

            return true;
        }
    },
    _dispatchTransactionPrepareComplete: {
        value: function (transaction, data) {
            var transactionEvent = TransactionEvent.checkout();

            transactionEvent.type = TransactionEvent.transactionPrepareComplete;
            transactionEvent.transaction = transaction;
            transactionEvent.data = data;
            transactionEvent.target = TransactionDescriptor

            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionEvent);
            /*
                Return the event to the pool
            */
            TransactionEvent.checkin(transactionEvent);

            //Now that we know we start, we'll have
            this.mainService.addEventListener(TransactionEvent.transactionCommit, this, false);
            this.mainService.addEventListener(TransactionEvent.transactionRollback, this, false);

            return true;
        }
    },
    _dispatchTransactionPrepareFail: {
        value: function (transaction, data) {
            var transactionEvent = TransactionEvent.checkout();

            transactionEvent.type = TransactionEvent.transactionPrepareFail;
            transactionEvent.transaction = transaction;
            transactionEvent.data = data;
            transactionEvent.target = TransactionDescriptor

            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionEvent);
            /*
                Return the event to the pool
            */
            TransactionEvent.checkin(transactionEvent);

            return true;
        }
    },

    handleTransactionPrepare: {
        value: function (transactionPrepareEvent) {

            //console.log("handleTransactionPrepare: ",transactionPrepareEvent);
            var self = this,
                transaction = transactionPrepareEvent.transaction,
                objectDescriptors = transaction.objectDescriptors,
                createdDataObjects = transaction.createdDataObjects,
                changedDataObjects = transaction.updatedDataObjects,
                dataObjectChanges = transaction.dataObjectChanges,
                deletedDataObjects = transaction.deletedDataObjects,
                iterator = objectDescriptors.values(),
                iteration, iObjectDescriptor,
                transactionRawContext = this.rawContextForTransaction(transaction),
                createTransactionOperation = transactionRawContext.createTransactionOperation,
                appendTransactionOperation,
                handledObjectDescriptors,
                // currentHandledCreatedDataObjects,
                // currentHandledChangedDataObjects,
                // currentHandledDeletedDataObjects,
                dataOperationCreationPromises,
                createDataOperationCreationPromises,
                updateDataOperationCreationPromises,
                deleteDataOperationCreationPromises,
                createOperationType = DataOperation.Type.CreateOperation,
                updateOperationType = DataOperation.Type.UpdateOperation,
                deleteOperationType = DataOperation.Type.DeleteOperation,
                startPromise,
                appendCompletedOperationCompletionPromise,
                transactionOperations,
                currentOperationCount = 0,
                operationCount = transactionRawContext.operationCount,
                createOperations = [],
                updateOperations = [],
                deleteOperations = [],
                push = Array.prototype.push,
                supportsTransaction = this.supportsTransaction;


            //console.log("handleTransactionPrepare: transaction-"+transaction.identifier, transaction);


            if (supportsTransaction && transactionRawContext && transactionRawContext.operationCount > 0) {
                /*
                    Now we know we're in:
                */
                this._dispatchTransactionPrepareStart(transaction, createTransactionOperation.data);


                appendTransactionOperation = this.createAppendTransactionOperationForTransaction(transaction);
                appendTransactionOperation.data.operations = transactionRawContext.operations;


                self.registerPendingDataOperationWithContext(appendTransactionOperation, transaction);
                appendCompletedOperationCompletionPromise = self.completionPromiseForPendingDataOperation(appendTransactionOperation);

                transaction.createCompletionPromiseForParticipant(this);

                TransactionDescriptor.dispatchEvent(appendTransactionOperation);

                appendCompletedOperationCompletionPromise
                    .then(function (dataOperationCompletion) {
                        self._dispatchTransactionPrepareComplete(transaction, {
                            dataOperationsByObject: transactionRawContext.dataOperationsByObject
                        });
                        transaction.dataOperationsByObject = transactionRawContext.dataOperationsByObject;
                        transaction.resolveCompletionPromiseForParticipant(self);
                    })
                    .catch(function (error) {
                        self._dispatchTransactionPrepareFail(transaction, error);
                        transaction.rejectCompletionPromiseForParticipantWithError(self, error);
                    });
            }
        }
    },


    _rawContextByTransaction: {
        value: undefined
    },

    /**
     * retuns rawContextByTransaction allows us to store raw data level info for a transaction
     *
     * @method
     * @argument {Transaction} transaction
     * @returns {Object} - An object containing raw Data level info relevant to a transaction
     */
    rawContextForTransaction: {
        value: function (transaction) {
            var rawContext = this._rawContextByTransaction.get(transaction);

            if (transaction && !rawContext) {
                rawContext = {};
                this._rawContextByTransaction.set(transaction, rawContext);
            }
            return rawContext;
        }
    },

    preparedDataOperationsForTransaction: {
        value: function (transaction) {
            var rawContext = this._rawContextByTransaction.get(transaction);

            return rawContext ? rawContext.preparedDataOperations : undefined;
        }
    },

    /**
     * Removes the rawContext object for a Transaction, typically called when the transaction is over
     *
     * @method
     * @argument {Transaction} transaction
     * @returns undefined
     */
    clearRawContextForTransaction: {
        value: function (transaction) {
            this._rawContextByTransaction.delete(transaction);
        }
    },


    createTransactionOperationForTransaction: {
        value: function (transaction) {
            var createTransaction = new DataOperation();

            createTransaction.type = DataOperation.Type.CreateTransactionOperation;
            createTransaction.target = TransactionDescriptor;
            createTransaction.data = [];

            return createTransaction;
        }
    },

    createAppendTransactionOperationForTransaction: {
        value: function (transaction) {
            var transactionRawContext = this.rawContextForTransaction(transaction),
                rawTransactions = transactionRawContext.rawTransactions,
                createTransactionOperation = transactionRawContext.createTransactionOperation,

                appendTransactionOperation = new DataOperation();

            appendTransactionOperation.type = DataOperation.Type.AppendTransactionOperation;
            appendTransactionOperation.target = TransactionDescriptor;
            appendTransactionOperation.referrerId = createTransactionOperation.id;
            appendTransactionOperation.data = {
                rawTransactions: rawTransactions
            };

            /*
                DataOperations coming in:
            */
            // this.mainService.addEventListener(DataOperation.Type.AppendTransactionCompletedOperation,this,false);
            // this.mainService.addEventListener(DataOperation.Type.AppendTransactionFailedOperation,this,false);

            return appendTransactionOperation;
        }
    },

    // handleCreateTransactionOperation: {
    //     value: function (createTransactionOperation) {
    //         console.warn("rawDataTypeIdForMapping() needs to be overriden with a concrete implementation by subclasses of RawDataService");
    //     }
    // },

    handleCreateTransactionCompletedOperation: {
        value: function (createTransactionCompletedOperation) {
            var transaction = this.referrerContextForDataOperation(createTransactionCompletedOperation),
                createTransactionOperation,
                data,
                transactionRawContext;


            //console.log("handleCreateTransactionCompletedOperation: transaction-"+transaction.identifier, transaction);

            if (transaction) {
                createTransactionOperation = this.referrerForDataOperation(createTransactionCompletedOperation),
                    data = createTransactionCompletedOperation.data,
                    transactionRawContext = this.rawContextForTransaction(transaction);

                /*
                    data is an object with the following shape:
                    {
                        "aRawDataServiceIdentifier": "-some-raw-data=service-transaction-id",
                        .....
                    }

                    Right now it's been tested where there's only one RawDataService "answering", which is the instance itself, but in the case of a browser rawDataService that fronts a DataWorker, there will be more. In that case today, a coordinator in the data worker will combine these pairs in one object.
                */

                transactionRawContext.rawTransactions = createTransactionCompletedOperation.data;
                transactionRawContext.createTransactionOperation = createTransactionOperation;

                this.resolveCompletionPromiseWithDataOperation(createTransactionCompletedOperation);
            }
        }
    },
    handleCreateTransactionFailedOperation: {
        value: function (operation) {
            var transaction = this.referrerContextForDataOperation(operation);
            console.error("handleCreateTransactionFailedOperation: transaction-" + transaction.identifier, transaction);

            this.rejectCompletionPromiseWithDataOperation(operation);
        }
    },

    handleAppendTransactionCompletedOperation: {
        value: function (appendTransactionCompletedOperation) {
            var transaction = this.referrerContextForDataOperation(appendTransactionCompletedOperation);
            if (transaction) {

                //console.log("handleAppendTransactionCompletedOperation: transaction-"+transaction.identifier, transaction);

                /*
                    This is fine as long as we have only one transaction running at a time, we'll need to be more subtle when we handle concurrent transaction
                */
                // this.mainService.removeEventListener(DataOperation.Type.AppendTransactionCompletedOperation,this,false);
                // this.mainService.removeEventListener(DataOperation.Type.AppendTransactionFailedOperation,this,false);
                this.resolveCompletionPromiseWithDataOperation(appendTransactionCompletedOperation);
            }

        }
    },
    handleAppendTransactionFailedOperation: {
        value: function (appendTransactionFailedOperation) {

            var transaction = this.referrerContextForDataOperation(appendTransactionFailedOperation);
            if (transaction) {
                console.error("handleAppendTransactionFailedOperation: transaction-" + transaction.identifier, transaction);

                /*
                    This is fine as long as we have only one transaction running at a time, we'll need to be more subtle when we handle concurrent transaction
                */
                // this.mainService.removeEventListener(DataOperation.Type.AppendTransactionCompletedOperation,this,false);
                // this.mainService.removeEventListener(DataOperation.Type.AppendTransactionFailedOperation,this,false);
                this.rejectCompletionPromiseWithDataOperation(appendTransactionFailedOperation);
            }

        }
    },


    __processObjectChangesForProperty: {
        value: function (object, aProperty, aPropertyDescriptor, aPropertyChanges, operationData, lastReadSnapshot, rawDataSnapshot, rawDataPrimaryKeys, mapping) {

            /*
                We already do that in expression-data-mapping mapObjectPropertyToRawData(), but expression-data-mapping doesn't know about added/removed changes where our _processObjectChangesForProperty does.
            */
            // if(rawDataPrimaryKeys && rawDataPrimaryKeys.indexOf(aRawProperty) !== -1) {
            //     return;
            // }

            var self = this,
                aPropertyDeleteRule = aPropertyDescriptor ? aPropertyDescriptor.deleteRule : null;

            /*
                A collection with "addedValues" / "removedValues" keys
                Which for now we only handle for Arrays.

                The recent addition of a DataObject property that can be a Map, we may have to re-visit that. It would be better to handle incremental changes to a map than sending all keys and all values are we doing for now
            */
            if (aPropertyChanges && (aPropertyChanges.hasOwnProperty("addedValues") || aPropertyChanges.hasOwnProperty("removedValues"))) {
                if (!(aPropertyDescriptor.cardinality > 1)) {
                    throw new Error("added/removed values for property without a to-many cardinality");
                }
                //     /*
                //         Until we get more sophisticated and we can leverage
                //         the full serialization, we turn objects into their primaryKey

                //         We have a partial view, the backend will need pay attention that we're not re-adding object if it's already there, and should be unique.
                //     */
                //    var valuesIterator, iValue, addedValues, removedValues;
                //    if(aPropertyChanges.addedValues) {

                //         /*
                //             Notes:
                //             If dataObject[aProperty] === null, we could treat addedValues as a set, and there might be something going on in tracking/propagating changes that leads to a set being considered as added. Triggers do their best to keep the array created in place, and change it's content rather than replace it, even when a set is done. That in itself is likely the reason we see this.

                //             There might not be downsides to deal with it as an add though.
                //         */
                //         valuesIterator = aPropertyChanges.addedValues.values();
                //         while ((iValue = valuesIterator.next().value)) {
                //             (addedValues || (addedValues = [])).push(this.dataIdentifierForObject(iValue).primaryKey);
                //         }

                //         /*
                //             After converting to primaryKeys in an array, we make it replace the original set for the same key on aPropertyChanges
                //         */
                //        if(addedValues) {
                //             aPropertyChanges.addedValues = addedValues;
                //        } else {
                //            delete aPropertyChanges.addedValues;
                //        }
                //    }

                //     if(aPropertyChanges.removedValues) {
                //         valuesIterator = aPropertyChanges.removedValues.values();
                //         while ((iValue = valuesIterator.next().value)) {
                //             //TODO: Check if the removed value should be itself be deleted
                //             //if(aPropertyDeleteRule === DeleteRule.CASCADE){}
                //             (removedValues || (removedValues = [])).push(this.dataIdentifierForObject(iValue).primaryKey);
                //         }
                //         if(removedValues) {
                //             aPropertyChanges.removedValues = removedValues;
                //         } else {
                //             delete aPropertyChanges.removedValues;
                //         }
                //     }

                //     //Here we mutated the structure from changesForDataObject. I should be cleared
                //     //when saved, but what if save fails and changes happen in-between?
                //     operationData[aRawProperty] = aPropertyChanges;

                return this._mapObjectPropertyToRawData(object, aProperty, operationData, undefined/*context*/, aPropertyChanges.addedValues, aPropertyChanges.removedValues, lastReadSnapshot, rawDataSnapshot);

            }
            else {
                return this._mapObjectPropertyToRawData(object, aProperty, operationData, undefined/*context*/, undefined, undefined, lastReadSnapshot, rawDataSnapshot);

                /*
                    we need to check post mapping that the rawValue is different from the snapshot
                */
                // if (this._isAsync(result)) {
                //     return result.then(function (value) {
                //         self._setOperationDataSnapshotForProperty(operationData, snapshot, dataSnapshot, aRawProperty );
                //     });
                // }
                // else {
                //     self._setOperationDataSnapshotForProperty(operationData, snapshot, dataSnapshot, aRawProperty );
                // }
            }
        }
    },

    /**
     * Map the properties of an object that have changed to be included as data in a DataOperation
     *
     * @method
     * @argument {Object} object - The object whose data should be saved.
     * @argument {DataOperation.Type} operationType - The object whose data should be saved.
     * @returns {external:Promise} - A promise fulfilled to operationData when mapping is done.
     *
     */
    _mapObjectChangesToOperationData: {
        value: function (object, dataObjectChanges, operationData, snapshot, dataSnapshot, isNewObject, isDeletedObject, objectDescriptor) {
            var aPropertyIteration,
                aProperty,
                aRawProperty,
                // snapshotValue,
                anObjectDescriptor = objectDescriptor || this.objectDescriptorForObject(object),
                mapping = this.mappingForType(anObjectDescriptor),
                rawDataPrimaryKeys = mapping.rawDataPrimaryKeys,
                aPropertyChanges,
                aPropertyDescriptor,
                result,
                mappingPromise,
                mappingPromises,
                propertyIterator;


                /* 
                    check if wr need to set/add fullModuleId to the iteration here!
                */


                /*
                    There's a risk here for a deletedObject that it's values have been changed and therefore wouldn't match what was fetched. We need to test that.

                    #TODO TEST maybe we don't need the isDeletedObject flag as deletedObjects shouldn't have ataObjectChanges.

                    But we need to implemement cascade delete.

                    1/27/2025: In some cases, like augmenting mapping raw Data to object, 
                    a data service delegate can add values for created objects (like originDataSnapshot) that don't get
                    registered as changes because it's set within the "objectsBeingMapped" blackout.

                    We should try to have the degate being called after the blackout, so it's clear.

                    So maybe a delegate call like "rawDataServiceWillCompleteMappingRawDataToObject" - when we don't want to trigger changes
                    and a rawDataServiceDidCompleteMappingRawDataToObject - where any change to the object would be registering
                    changes.

                    But for created objects, it seems safer to look at the state of the object, rather than changes?
                */
            propertyIterator = (isDeletedObject || !dataObjectChanges)
                    ? Object.keys(object).values()
                    : dataObjectChanges.keys();


            

            while (!(aPropertyIteration = propertyIterator.next()).done) {
                aProperty = aPropertyIteration.value;
                // aRawProperty = mapping.mapObjectPropertyNameToRawPropertyName(aProperty);
                //aRawProperty = mapping.mapObjectPropertyToRawProperty(object, aProperty);


                // snapshotValue = snapshot[aRawProperty];
                aPropertyChanges = dataObjectChanges ? dataObjectChanges.get(aProperty) : undefined;
                aPropertyDescriptor = anObjectDescriptor.propertyDescriptorForName(aProperty);

                //For delete, we're looping over Object.keys(object), which may contain properties that aren't
                //serializable. Ourr goal for delete is to use these values for optimistic locking, so no change, no need
                //If we pass this down to _processObjectChangesForProperty, it will attempt to map and fail if no aPropertyDescriptor
                //exists. So we catch it here since we know the context about the operation.
                if (isDeletedObject && (!aPropertyDescriptor || !aPropertyChanges)) {
                    continue;
                }

                /*
                    If it's a new object and somehow multiple changes led to have addedValues or removedValues, we reset that
                    so it will be processed as an new object
                */
                if(isNewObject && (aPropertyChanges?.hasOwnProperty("addedValues") || aPropertyChanges?.hasOwnProperty("removedValues"))) {
                    aPropertyChanges = null;
                }

                result = this.__processObjectChangesForProperty(object, aProperty, aPropertyDescriptor, aPropertyChanges, operationData, snapshot, dataSnapshot, rawDataPrimaryKeys, mapping);

                if (result && this._isAsync(result)) {
                    (mappingPromises || (mappingPromises = [])).push(result);
                }
            }

            if (mappingPromises && mappingPromises.length) {
                mappingPromise = mappingPromises.length === 1 ? mappingPromises[0] : Promise.all(mappingPromises);
            }


            return (mappingPromise
                ? mappingPromise.then(function () {
                    return operationData;
                })
                : Promise.resolve(operationData))


        }
    },

    /**
     * Creates one save operation for an object, eirher a create, an update or a delete
     * .
     *
     * @method
     * @argument {Object} object - The object whose data should be saved.
     * @argument {DataOperation.Type} operationType - The object whose data should be saved.
     * @returns {external:Promise} - A promise fulfilled when the operationo is ready.
     *
     */

    _saveDataOperationForObject: {
        value: function (object, operationType, dataObjectChangesMap, dataOperationsByObject, commitTransactionOperation) {
            try {

                console.log("_saveDataOperation ("+operationType+") forObject "+ object.dataIdentifier+ " in commitTransactionOperation "+commitTransactionOperation.id)
                //TODO
                //First thing we should be doing here is run validation
                //on the object, which should be done one level up
                //by the mainService. Do there and test

                /*
                    Here we want to use:
                    this.rootService.changesForDataObject();

                    to only map back, and send, only:
                    1. what was changed by the user, and
                    2. that is different from the snapshot?

                */

                var self = this,
                    operation = new DataOperation(),
                    dataIdentifier = this.dataIdentifierForObject(object),
                    objectDescriptor = this.objectDescriptorForObject(object),
                    //We make a shallow copy so we can remove properties we don't care about
                    snapshot,
                    dataSnapshot = {},
                    dataObjectChanges = dataObjectChangesMap.get(object),
                    propertyIterator,
                    isNewObject = operationType
                        ? operationType === DataOperation.Type.CreateOperation
                        : self.rootService.isObjectCreated(object),
                    localOperationType = operationType
                        ? operationType
                        : isNewObject
                            ? DataOperation.Type.CreateOperation
                            : DataOperation.Type.UpdateOperation,
                    isDeletedObject = localOperationType === DataOperation.Type.DeleteOperation,
                    operationData = {},
                    localizableProperties = objectDescriptor.localizablePropertyDescriptors,
                    criteria,
                    i, iValue, countI;

                operation.referrer = commitTransactionOperation;

                operation.target = objectDescriptor;

                operation.type = localOperationType;

                if (dataIdentifier) {
                    if (!isNewObject) {
                        criteria = this.rawCriteriaForObject(object, objectDescriptor);
                    }
                    else {
                        operationData.id = dataIdentifier.primaryKey;
                    }
                }

                if (snapshot = this.snapshotForDataIdentifier(object.dataIdentifier)) {
                    //We make a shallow copy so we can remove properties we don't care about
                    snapshot = Object.assign({}, snapshot);
                }


                if (localizableProperties && localizableProperties.size) {
                    operation.locales = this.localesForObject(object)
                }

                operation.criteria = criteria;

                //Nothing to do, change the operation type and bail out
                if (!isNewObject && !dataObjectChanges && !isDeletedObject) {
                    operation.type = DataOperation.Type.NoOp;
                    return Promise.resolve(operation);
                }

                operation.data = operationData;


                /*
                    The last fetched values of the properties that changed, so the backend can use it to make optimistic-locking update
                    with a where that conditions that the current value is still
                    the one that was last fecthed by the client making the update.

                    For deletedObjects, if there were changes, we don't care about them, it's not that relevant, we're going to use all known properties fetched client side to eventually catch a conflict if someone made a change in-between.
                */
                if (!isNewObject) {
                    operation.snapshot = dataSnapshot;
                } else {
                    this.mapObjectTypeToRawData(object, operationData, operation);
                }

                console.log("_save ("+operationType+") for "+ object.dataIdentifier+ " in commitTransactionOperation "+commitTransactionOperation.id + " mapping starts")
                return this._mapObjectChangesToOperationData(object, dataObjectChanges, operationData, snapshot, dataSnapshot, isNewObject, isDeletedObject, objectDescriptor)
                    .then(function (resolvedOperationData) {
                        console.log("_saveDataOperation ("+operationType+") forObject "+ object.dataIdentifier+ " in commitTransactionOperation "+commitTransactionOperation.id + " mapping ends")

                        if (!isDeletedObject) {

                            if(Object.keys(operationData).length === 0) {
                                /*
                                    if there are no changes known, it's a no-op: if it's an existing object nothing to do and if it's a new empty object... should it go through?? Or it's either a CreateCancelled or an UpdateCancelled.

                                    It also can be considered a no-op of a property on an object changes, but it is stored as a foreign key or in an array of foreign keys on the inverse relationship side, in which case, there's nothing to do, as thanks to inverse value propagation, it will become an update operation on the other side.
                                */

                                operation.type = DataOperation.Type.NoOp;
                                /*
                                    If a property change would turn as a no-op from a raw data stand point, we still need to tell the object layer client of the saveChanges did save it
                                */
                                operation.changes = dataObjectChanges;
                            }
                            else {
                                /*
                                    Now that we got them, clear it so we don't conflict with further changes if we have some async mapping stuff in-between.
                                    If somehow things fail, we have the pending operation at hand to re-try
                                */
                                //We cache the changes on the operation. As this isn't part of an operation's serializeSelf,
                                //we keep track of it for dispatching events when save is complete and don't have to worry
                                //about side effects for the server side.
                                operation.changes = dataObjectChanges;
                                //self.clearRegisteredChangesForDataObject(object);
                            }
                        }
                        if (dataOperationsByObject) {
                            dataOperationsByObject.set(object, operation);
                        }
                        return operation;
                    });
            }
            catch (error) {
                return Promise.reject(error);
            }
        }
    },

    _saveDataOperationsForObjects: {
        value: function (objects, operationType, dataObjectChangesMap, dataOperationsByObject, createTransaction, operationCount, transaction) {
            var self = this;
            return new Promise(function (resolve, reject) {
                try {

                    var iterator = objects.values(),
                        isUpdateOperationType = operationType === DataOperation.Type.UpdateOperation,
                        iOperationPromises,
                        iOperationPromise,
                        operations,
                        percentCompletion,
                        lastProgressSent = (createTransaction && createTransaction.lastProgressSent) || 0,
                        transactionPrepareProgressEvent,
                        commitTransactionOperation = self.commitTransactionOperationForTransaction(transaction),
                        iObject;

                    while ((iObject = iterator.next().value)) {
                        iOperationPromise = self._saveDataOperationForObject(iObject, operationType, dataObjectChangesMap, dataOperationsByObject, commitTransactionOperation);
                        (iOperationPromises || (iOperationPromises = [])).push(iOperationPromise);
                        iOperationPromise.then(function (resolvedOperation) {
                            var operationCreationProgress = (createTransaction && createTransaction.operationCreationProgress) || 0;

                            if (createTransaction) {
                                createTransaction.operationCreationProgress = ++operationCreationProgress;
                            }

                            /*
                                NoOps will be handled by iterating on dataObjectChangesMap later on
                            */
                            if (resolvedOperation.type !== DataOperation.Type.NoOp) {
                                (operations || (operations = [])).push(resolvedOperation);
                            }

                            percentCompletion = Math.round((operationCreationProgress / operationCount) * 100) / 100;

                            if (percentCompletion > lastProgressSent) {
                                //console.log("_saveDataOperationsForObjects: "+percentCompletion);

                                transactionPrepareProgressEvent = TransactionEvent.checkout();
                                transactionPrepareProgressEvent.type = TransactionEvent.transactionPrepareProgress;
                                transactionPrepareProgressEvent.transaction = transaction;
                                transactionPrepareProgressEvent.data = percentCompletion;
                                TransactionDescriptor.dispatchEvent(transactionPrepareProgressEvent);
                                /*  Return the event to the pool */
                                TransactionEvent.checkin(transactionPrepareProgressEvent);


                                //self.dispatchDataEventTypeForObject(DataEvent.saveChangesProgress, self, percentCompletion);

                                lastProgressSent = percentCompletion;
                                if (createTransaction) {
                                    createTransaction.lastProgressSent = lastProgressSent;
                                }
                            }

                        }, function (rejectedValue) {
                            reject(rejectedValue);
                        });
                    }

                    if (iOperationPromises) {

                        Promise.all(iOperationPromises)
                            .then(function (resolvedOperations) {
                                /*
                                    resolvedOperations could contains some null if changed objects don't have anything to solve in their own row because it's stored on the other side of a relationship, which is why we keep track of the other array ourselves to avoid looping over again and modify the array after, or send noop operation through the wire for nothing. Cost time an money!
                                */
                                resolve(operations);
                            }, function (rejectedValue) {
                                reject(rejectedValue);
                            });

                    } else {
                        resolve(null);
                    }
                }
                catch (error) {
                    reject(error);
                }
            });
        }
    },


    /**
     * transactionPrepare event handler, a RawDataService needs to look at the transaction and determine
     * if it involves types it's supposed to take care of.
     *
     * @method
     * @argument {TransactionEvent} transactionPrepareEvent
     */
    _dispatchTransactionCommitStart: {
        value: function (transaction, data) {
            var transactionEvent = TransactionEvent.checkout();

            transactionEvent.type = TransactionEvent.transactionCommitStart;
            transactionEvent.transaction = transaction;
            transactionEvent.data = data;
            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionEvent);
            /*
                Return the event to the pool
            */
            TransactionEvent.checkin(transactionEvent);

            return true;
        }
    },
    _dispatchTransactionCommitComplete: {
        value: function (transaction, data) {
            var transactionEvent = TransactionEvent.checkout();

            transactionEvent.type = TransactionEvent.transactionCommitComplete;
            transactionEvent.transaction = transaction;
            transactionEvent.data = data;
            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionEvent);
            /*
                Return the event to the pool
            */
            TransactionEvent.checkin(transactionEvent);

            //Now that we know we're done, we cleanup
            this.mainService.removeEventListener(TransactionEvent.transactionPrepare, this, false);
            this.mainService.removeEventListener(TransactionEvent.transactionCommit, this, false);
            this.mainService.removeEventListener(TransactionEvent.transactionRollback, this, false);

            return true;
        }
    },
    _dispatchTransactionCommitFail: {
        value: function (transaction, data) {
            var transactionEvent = TransactionEvent.checkout();

            transactionEvent.type = TransactionEvent.transactionPrepareFail;
            transactionEvent.transaction = transaction;
            transactionEvent.data = data;
            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionEvent);
            /*
                Return the event to the pool
            */
            TransactionEvent.checkin(transactionEvent);

            //Now that we know we're done, we cleanup
            this.mainService.removeEventListener(TransactionEvent.transactionPrepare, this, false);
            this.mainService.removeEventListener(TransactionEvent.transactionCommit, this, false);
            this.mainService.removeEventListener(TransactionEvent.transactionRollback, this, false);

            return true;
        }
    },

    handleTransactionCommit: {
        value: function (transactionCommitEvent) {
            var self = this,
                transaction = transactionCommitEvent.transaction,
                transactionRawContext = this.rawContextForTransaction(transaction),
                createTransactionOperation = transactionRawContext.createTransactionOperation;

            //console.log("handleTransactionCommit: transaction-"+transaction.identifier, transaction);

            if (this.supportsTransaction && createTransactionOperation) {

                this._dispatchTransactionCommitStart(transaction, {
                    dataOperationsByObject: transactionRawContext.dataOperationsByObject
                });

                /*
                    Now dispatch the commitTransactionDataOperation so it gets executed:
                */
                var commitTransactionOperation = this.commitTransactionOperationForTransaction(transaction),
                    commitTransactionDataOperationCompletionPromise;

                if(this.usePerformTransaction) {
                    commitTransactionOperation.data.operations = transactionRawContext.operations;
                }

                this.registerPendingDataOperationWithContext(commitTransactionOperation, transaction);
                commitTransactionDataOperationCompletionPromise = this.completionPromiseForPendingDataOperation(commitTransactionOperation);

                transaction.createCompletionPromiseForParticipant(this);

                TransactionDescriptor.dispatchEvent(commitTransactionOperation);

                commitTransactionDataOperationCompletionPromise
                    .then(function (dataOperationCompletion) {

                        var dataOperationsByObject = transactionRawContext.dataOperationsByObject,
                            CreateOperation = DataOperation.Type.CreateOperation,
                            UpdateOperation = DataOperation.Type.UpdateOperation,
                            DeleteOperation = DataOperation.Type.DeleteOperation,
                            NoOpOperation = DataOperation.Type.NoOp,
                            objectEnumerator = dataOperationsByObject.keys(),
                            objectIteration,
                            iObject,
                            iOperation,
                            iObjectDescriptor,
                            iDataIdentifier;

                        while (!(objectIteration = objectEnumerator.next()).done) {
                            iObject = objectIteration.value;
                            iOperation = dataOperationsByObject.get(iObject);
                            iObjectDescriptor = iOperation.target;

                            if (iOperation.type === CreateOperation) {
                                iDataIdentifier = self.dataIdentifierForObject(iObject);
                                if(!iDataIdentifier) {
                                    iDataIdentifier = self.dataIdentifierForTypeRawData(iObjectDescriptor, iOperation.data);
                                    self.rootService.registerUniqueObjectWithDataIdentifier(iObject, iDataIdentifier);    
                                }
                                self.recordSnapshot(iDataIdentifier, iOperation.data);

                            } else if (iOperation.type === UpdateOperation || iOperation.type === NoOpOperation) {
                                iDataIdentifier = self.dataIdentifierForObject(iObject);
                                self.recordSnapshot(iDataIdentifier, iOperation.data, true);
                            } else if (iOperation.type === DeleteOperation) {
                                iDataIdentifier = self.dataIdentifierForObject(iObject);

                                //Removes the snapshot we have for iDataIdentifier
                                self.removeSnapshot(iDataIdentifier);
                            }

                        }

                        self._dispatchTransactionCommitComplete(transaction, dataOperationCompletion.data)
                        transaction.resolveCompletionPromiseForParticipant(self);
                    }, function (commitTransactionFailedOperationError) {
                        self._dispatchTransactionCommitFail(transaction, commitTransactionFailedOperationError)
                        transaction.rejectCompletionPromiseForParticipantWithError(self, commitTransactionFailedOperationError);
                    });
            }
        }
    },

    commitTransactionOperationForTransaction: {
        value: function (transaction) {

            var transactionRawContext = this.rawContextForTransaction(transaction),
                commitTransaction = transactionRawContext.commitTransactionOperation;

            if(!commitTransaction) {
                rawTransactions = transactionRawContext.rawTransactions,
                createTransactionOperation = transactionRawContext.createTransactionOperation,
                commitTransaction = new DataOperation();

                commitTransaction.type = DataOperation.Type.CommitTransactionOperation;
                commitTransaction.target = TransactionDescriptor;
                commitTransaction.referrerId = createTransactionOperation.id;
                commitTransaction.data = {
                    rawTransactions: rawTransactions
                };

                /*
                    DataOperations coming in:
                */
                this.mainService.addEventListener(DataOperation.Type.CommitTransactionCompletedOperation, this, false);
                this.mainService.addEventListener(DataOperation.Type.CommitTransactionFailedOperation, this, false);
            }

            return commitTransaction;

        }
    },

    handleCommitTransactionProgressOperation: {
        value: function (operation) {
            /*
                Inform Main DataService of progress:
            */
            var transactionCommitProgressEvent = TransactionEvent.checkout(),
                transaction = this.referrerContextForDataOperation(operation);

            // console.log("handleCommitTransactionProgressOperation: transaction-"+transaction.identifier, transaction);

            transactionCommitProgressEvent.type = TransactionEvent.transactionCommitProgress;
            transactionCommitProgressEvent.transaction = transaction;
            /*
                TODO test and finalize data for both progress Event and DataOperations
            */
            transactionCommitProgressEvent.data = operation.data;
            /*
                There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
            */
            TransactionDescriptor.dispatchEvent(transactionCommitProgressEvent);
            TransactionEvent.checkin(transactionCommitProgressEvent);
        }
    },

    handleCommitTransactionCompletedOperation: {
        value: function (commitTransactionCompletedOperation) {
            //var transaction = this.referrerContextForDataOperation(commitTransactionCompletedOperation);
            //console.log("handleCommitTransactionCompletedOperation: transaction-"+transaction.identifier, transaction);


            /*
                This is fine as long as we have only one transaction running at a time, we'll need to be more subtle when we handle concurrent transaction
            */
            // this.mainService.removeEventListener(DataOperation.Type.CommitTransactionCompletedOperation,this,false);
            // this.mainService.removeEventListener(DataOperation.Type.CommitTransactionFailedOperation,this,false);

            this.resolveCompletionPromiseWithDataOperation(commitTransactionCompletedOperation);
        }
    },

    handleCommitTransactionFailedOperation: {
        value: function (commitTransactionFailedOperation) {

            var transaction = this.referrerContextForDataOperation(commitTransactionFailedOperation);
            console.error("handleCommitTransactionFailedOperation: transaction-" + transaction?.identifier, transaction);

            /*
                This is fine as long as we have only one transaction running at a time, we'll need to be more subtle when we handle concurrent transaction
            */
            // this.mainService.removeEventListener(DataOperation.Type.CommitTransactionCompletedOperation,this,false);
            // this.mainService.removeEventListener(DataOperation.Type.CommitTransactionFailedOperation,this,false);

            this.rejectCompletionPromiseWithDataOperation(commitTransactionFailedOperation);
        }
    },

    handleTransactionRollback: {
        value: function (transactionCommitEvent) {
            var self = this,
                transaction = transactionCommitEvent.transaction,
                transactionRawContext = this.rawContextForTransaction(transaction),
                createTransactionOperation = transactionRawContext.createTransactionOperation;

            if (this.supportsTransaction && createTransactionOperation) {

                /*
                    Inform Main DataService we're starting:
                */
                var transactionRollbackStartEvent = TransactionEvent.checkout();

                transactionRollbackStartEvent.type = TransactionEvent.transactionRollbackStart;
                transactionRollbackStartEvent.transaction = transaction;
                transactionRollbackStartEvent.data = null;//??
                /*
                    There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
                */
                TransactionDescriptor.dispatchEvent(transactionRollbackStartEvent);
                /*
                    Return the event to the pool
                */
                TransactionEvent.checkin(transactionRollbackStartEvent);


                /*
                    Now dispatch the commitTransactionDataOperation so it gets executed:
                */
                var rollbackTransactionOperation = this.rollbackTransactionOperationForTransaction(transaction),
                    rollbackTransactionDataOperationCompletionPromise;

                this.registerPendingDataOperationWithContext(rollbackTransactionOperation, transaction);
                rollbackTransactionDataOperationCompletionPromise = this.completionPromiseForPendingDataOperation(rollbackTransactionOperation);
                TransactionDescriptor.dispatchEvent(rollbackTransactionOperation);


                /*
                    Preparing shared data
                */
                var transactionRollbackCompletionEvent = TransactionEvent.checkout();
                transactionRollbackCompletionEvent.transaction = transaction;


                rollbackTransactionDataOperationCompletionPromise
                    .then(function (rollbackTransactionCompletedOperation) {
                        transactionRollbackCompletionEvent.type = TransactionEvent.transactionCommitComplete;
                        /*
                            TODO test and finalize data for both Complete Event and DataOperations
                        */
                        transactionRollbackCompletionEvent.data = rollbackTransactionCompletedOperation.data;

                    }, function (rollbackTransactionFailedOperationError) {
                        transactionRollbackCompletionEvent.type = TransactionEvent.transactionCommitComplete;
                        transactionRollbackCompletionEvent.data = rollbackTransactionFailedOperationError;

                    })
                    .finally(function () {
                        /*
                            Inform Main DataService: There shouldn't be an async involved here as this is meant to be handled by the local main dataService.
                        */
                        TransactionDescriptor.dispatchEvent(transactionRollbackCompletionEvent);
                        TransactionEvent.checkin(transactionRollbackCompletionEvent);
                    })
            }
        }
    },

    rollbackTransactionOperationForTransaction: {
        value: function (transaction) {

            var transactionRawContext = this.rawContextForTransaction(transaction),
                rawTransactions = transactionRawContext.rawTransactions,
                createTransactionOperation = transactionRawContext.createTransactionOperation,
                rollbackTransaction = new DataOperation();

            rollbackTransaction.type = DataOperation.Type.RollbackTransactionOperation;
            rollbackTransaction.target = TransactionDescriptor;
            rollbackTransaction.referrerId = createTransactionOperation.id;
            rollbackTransaction.data = {
                rawTransactions: rawTransactions
            };

            /*
                DataOperations coming in:
            */
            this.mainService.addEventListener(DataOperation.Type.RollbackTransactionCompletedOperation, this, false);
            this.mainService.addEventListener(DataOperation.Type.RollbackTransactionFailedOperation, this, false);

            return rollbackTransaction;

        }
    },

    handleRollbackTransactionCompletedOperation: {
        value: function (rollbackTransactionCompletedOperation) {
            /*
                This is fine as long as we have only one transaction running at a time, we'll need to be more subtle when we handle concurrent transaction
            */
            // this.mainService.removeEventListener(DataOperation.Type.RollbackTransactionCompletedOperation,this,false);
            // this.mainService.removeEventListener(DataOperation.Type.RollbackTransactionFailedOperation,this,false);

            this.resolveCompletionPromiseWithDataOperation(rollbackTransactionCompletedOperation);
        }
    },

    handleRollbackTransactionFailedOperation: {
        value: function (rollbackTransactionFailedOperation) {
            /*
                This is fine as long as we have only one transaction running at a time, we'll need to be more subtle when we handle concurrent transaction
            */
            // this.mainService.removeEventListener(DataOperation.Type.RollbackTransactionCompletedOperation,this,false);
            // this.mainService.removeEventListener(DataOperation.Type.RollbackTransactionFailedOperation,this,false);

            this.rejectCompletionPromiseWithDataOperation(rollbackTransactionFailedOperation);
        }
    },

    /**
     * transactionCreate event handler where a RawDataService creates the matching DataOperation for objects created.
     *
     * @method
     * @argument {TransactionEvent} transactionPrepareEvent
     */

    //  handleTransactionCreate: {
    //     value: function(transactionPrepareEvent) {
    //         var dataOperationCreationPromises = [];




    //     }
    // },


    /***************************************************************************
     *
     * Authorization / Access Control
     *
     ***************************************************************************/

    identityQuery: {
        get: function () {
            return this.connection.identityQuery;
        }
    },


    /**
     * The access token delivered once an identity has been authorized
     * to access a data service. Type stays open/abstract as it can take many forms
     *
     * @type {Object}
     */
    __accessTokenBydentity: {
        value: undefined
    },

    _accessTokenBydentity: {
        get: function () {
            return (this.__accessTokenBydentity || (this.__accessTokenBydentity = new Map()));
        }
    },

    accessTokenForIdentity: {
        value: function (identity) {
            return this._accessTokenBydentity.get(identity);
        }
    },

    registerAccessTokenForIdentity: {
        value: function (accessToken, identity) {
            return this._accessTokenBydentity.set(identity, accessToken);
        }
    },

    unregisterAccessTokenForIdentity: {
        value: function (identity) {
            /*
                TODO: Verify that accessToken is equal to this._accessTokenBydentity.get(identity) first?
            */
            return this._accessTokenBydentity.delete(identity);
        }
    },

    accessToken: {
        get: function () {
            return this.accessTokenForIdentity(this.identity);
        }
    },


    /***************************************************************************
     * Deprecated
     */

    /**
     * @todo Document deprecation in favor of
     * [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject}
     *
     * @deprecated
     * @method
     */
    mapFromRawData: {
        value: function (object, record, context) {
            // Implemented by subclasses.
            return object;
        }
    },

    /**
     * @todo Document deprecation in favor of
     * [mapObjectToRawData()]{@link RawDataService#mapObjectToRawData}
     *
     * @deprecated
     * @method
     */
    mapToRawData: {
        value: function (object, record) {
            // Implemented by subclasses.
        }
    },

    /**
     * @todo Remove any dependency and delete.
     *
     * @deprecated
     * @type {OfflineService}
     */
    offlineService: {
        value: undefined
    },

    /**
     * Allows DataService to provide a rawDataTypeId for a Mapping's
     * ObjectDescriptor
     *
     * @method
     * @param {DataMapping} aMapping
     */

    rawDataTypeIdForMapping: {
        value: function (aMapping) {
            console.warn("rawDataTypeIdForMapping() needs to be overriden with a concrete implementation by subclasses of RawDataService")
        }
    },
    /**
     * Allows DataService to provide a rawDataTypeId for a Mapping's
     * ObjectDescriptor
     *
     * @method
     * @param {DataMapping} aMapping
     */

    rawDataTypeNameForMapping: {
        value: function (aMapping) {
            // console.warn("rawDataTypeNameForMapping() needs to be overriden with a concrete implementation by subclasses of RawDataService")
        }
    }

});
