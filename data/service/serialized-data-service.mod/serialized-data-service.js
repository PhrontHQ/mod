const RawDataService = require("../raw-data-service").RawDataService,
    
    DataObject = require("../../model/data-object").DataObject,
    DataOperation = require("../data-operation").DataOperation,
    DataQuery = require("../../model/data-query").DataQuery,
    Criteria = require("core/criteria").Criteria,
    KebabCaseConverter = require("core/converter/kebab-case-converter").KebabCaseConverter;

/**
 * @class SerializedDataService
 * @extends RawDataService
 */
exports.SerializedDataService = class SerializedDataService extends RawDataService {
    constructor() {
        super();
        this._typeToLocation = new Map();
        this._typeToManagedSubtypes = new Map();
        this._dataInstancesPromiseByObjectDescriptor = new Map();
        this.needsRawDataTypeIdentificationCriteria = true;
    }

    deserializedFromSerialization(label) {
        RawDataService.prototype.deserializedFromSerialization.call(this, label);
        
        this._childServiceRegistrationPromise.then(() => {
            this._populateTypeToSubtypesMap();
        });      
    }

    _populateTypeToSubtypesMap() {
        if (this._typeToManagedSubtypes.size === 0) {
            let typeSet = new Set(this.types);

            this.types.forEach((type) => {
                if (!type.descendantDescriptors) {
                    return;
                }
                type.descendantDescriptors.forEach((descendant) => {
                    if (!typeSet.has(descendant)) {
                        return
                    }
                    if (!this._typeToManagedSubtypes.has(type)) {
                        this._typeToManagedSubtypes.set(type, []);
                    }
                    this._typeToManagedSubtypes.get(type).push(descendant);
                });
            });
        }
    }

    registerTypeForInstancesLocation(dataType, location) {
        if (!location) {
            throw new Error("Both location must be provided");
        }

        this._typeToLocation.set(dataType, location);
    }

    _kebabTypeName(typeName) {
        this._typeNameConverter = this._typeNameConverter || new KebabCaseConverter();
        return this._typeNameConverter.convert(typeName);
    }

    primaryKeyForTypeRawData(type, rawData, dataOperation) {
        return rawData.identifier;
    }
    /**
     * Returns the correct subtype for rawData if found, using rawDataTypeIdentificationCriteria.
     * 
     * @method
     * @argument {ObjectDescriptor} objectDescriptor  - The ObjectDescriptor to load data instances for
     * @returns {Promise(Array<dataInstanced>)} - A promise resolving to data instances of  objectDescriptor's type
     */
    dataInstancesPromiseForObjectDescriptor(objectDescriptor) {

        let dataInstancesPromiseForObjectDescriptor = this._dataInstancesPromiseByObjectDescriptor.get(objectDescriptor);
        if(!dataInstancesPromiseForObjectDescriptor) {
                let subtypes = this._typeToManagedSubtypes.get(objectDescriptor),
                    hierarchyInstancePromises;

                if (subtypes) {
                    hierarchyInstancePromises = subtypes.map((subtype) => {
                        return this.dataInstancesPromiseForObjectDescriptor(subtype);
                    });
                    hierarchyInstancePromises.push(this._dataInstancesPromiseForObjectDescriptor(objectDescriptor));
                    dataInstancesPromiseForObjectDescriptor = Promise.all(hierarchyInstancePromises).then((instances) => {
                        return instances.reduce((result, subInstances) => {
                            result.push.apply(result, subInstances);
                            return result;
                        }, []);
                    });
                } else {
                    dataInstancesPromiseForObjectDescriptor = this._dataInstancesPromiseForObjectDescriptor(objectDescriptor);
                }

                this._dataInstancesPromiseByObjectDescriptor.set(objectDescriptor, dataInstancesPromiseForObjectDescriptor);
                
        }
        return dataInstancesPromiseForObjectDescriptor;
    }

    _dataInstancesPromiseForObjectDescriptor(objectDescriptor) {
        let location, _require;

        if (this._typeToLocation.has(objectDescriptor)) {
            location = this._typeToLocation.get(objectDescriptor);

            if (location.location) {
                _require = location.require;
                location = location.location;
            }
        }

        if (!_require) {
            _require = global.require;
        }

        if (!location) {
            location = `data/instance/${this._kebabTypeName(objectDescriptor.name)}/main.mjson`;
        }

        return _require
            .async(location)
            .then((module) => {
                if (!module || !module.montageObject) {
                    throw new Error("Module not found or invalid module format: " + location);
                }

                let { montageObject: rawData } = module;

                return rawData;
            })
            .catch((error) => {
                console.error("Error loading serialized data:", error);
                throw error;
            });
    }


    fetchRawObjectProperty(object, propertyName) {
        //Find deserialized counterpart of object in memory. 
        //Assign object[propertyName] = deserializedObject[propertyName];
        return this.nullPromise;
    }


    mapObjectToRawData(object, rawData, context) {
        //Set the primary key:
        rawData.identifier = object.identifier;

        /*
            Now we need to move everyting on rawData. Loop on object's keys and verify that they
            correspond to known object's descriptor properties.
        */ 
        let objectKeys = Object.keys(object),
            objectDescriptor = object.objectDescriptor;
        for(let countI = objectKeys.length, i = 0, iPropertyDescriptor; (i<countI); i++) {
            iPropertyDescriptor = objectDescriptor.propertyDescriptorNamed(objectKeys[i]);
            if(iPropertyDescriptor) {
                /*
                    We need to decide wether we store the value - object[objectKeys[i]]
                    or if that value has an idententifier if it's an
                */
                if(iPropertyDescriptor.valueDescriptor) {
                    if(iPropertyDescriptor.cardinality === 1) {
                        let iPropertyValue =  object[objectKeys[i]];
                        if(iPropertyValue?.hasOwnProperty("identifier")) {
                            rawData[iPropertyDescriptor.name] = object[objectKeys[i]].identifier;
                        } else {
                            rawData[objectKeys[i]] = object[objectKeys[i]];
                        }
                    } else {
                        let iPropertyValues =  object[objectKeys[i]],
                            oneValue;

                        if(iPropertyValues) {
                            //iPropertyValues is a collection, so we're going to use .one() to get a sample.
                            oneValue = iPropertyValues.one();

                            //The collection is empty, we can carry it over
                            if(!oneValue) {
                                rawData[objectKeys[i]] = iPropertyValues;
                            } else if(Array.isArray(iPropertyValues)) {
                                let rawDataValues = [];

                                for(let countI = iPropertyValues.length, i=0; (i < countI); i++) {
                                    rawDataValues.push(iPropertyValues[i].identifier);
                                }

                                rawData[objectKeys[i]] = rawDataValues;

                            } else if(iPropertyValues instanceof Map) {
                                throw "mapObjectToRawData for a property that is Map needs to be implemented";
                            }
                        } else {
                            rawData[objectKeys[i]] = iPropertyValues;
                        }
                    }

                } else {
                    //We can for shusre move the data as-is
                    rawData[objectKeys[i]] = object[objectKeys[i]];
                }
            }
        }

        return Promise.resolve(rawData);
    }

    _rawDataForObject(object, context) {
        //We need to include it in the results, as rawData. So now we check of if have a rawData for it already
        let iDataInstanceIdentifier = this.dataIdentifierForTypePrimaryKey(object.objectDescriptor, object.identifier),
            iRawData = this.snapshotForDataIdentifier(iDataInstanceIdentifier);

        if(!iRawData) {
            iRawData = {};
            return this.mapObjectToRawData(object, iRawData, context)
            .then((rawData) => {
                this.mapObjectTypeToRawData(object, rawData, context);
                return rawData;
            }).then((rawData) => {
                this.recordSnapshot(iDataInstanceIdentifier, rawData);
                return rawData;
            });
        } else {
            //Not ideal to recrete a promise here...
            return Promise.resolve(iRawData);
        }

    }

    _objectPromiseForDataIdentifier(aDataIdentifier, mainService) {
        let iObjectValue = mainService.objectForDataIdentifier(aDataIdentifier);

        if(!iObjectValue) {
            let criteria = new Criteria().initWithExpression("identifier == $", aDataIdentifier.primaryKey),
                iObjectValueQuery = DataQuery.withTypeAndCriteria(aDataIdentifier.objectDescriptor, criteria);

            return mainService.fetchData(iObjectValueQuery)
                .then((fetchDataResult) => {
                    return fetchDataResult[0];
                });
            
        } else {
            return Promise.resolve(iObjectValue);
        }

    }

    /* adds a promise resolving to the value to mappingPromises passed in*/
    _mapRawDataPropertyToObject (record, property, object, mappingPromises, mainService) {
        let objectDescriptor = object.objectDescriptor,
            iPropertyDescriptor = objectDescriptor.propertyDescriptorNamed(property);

        if(iPropertyDescriptor) {
            /*
                We need to decide wether we store the value - object[property]
                or if that value has an idententifier if it's an
            */
            if(iPropertyDescriptor.valueDescriptor) {
                if(iPropertyDescriptor.cardinality === 1) {
                    let iPropertyValue = object[property];
                    if(typeof iPropertyValue === "string" /* would sure be handy to actually have a uuid tye right now...*/) {
                        let aDataIdentifier = this.dataIdentifierForTypePrimaryKey(iPropertyDescriptor.valueDescriptor, record.identifier);

                        (mappingPromises || (mappingPromises = [])).push(
                            this._objectPromiseForDataIdentifier(aDataIdentifier, mainService)
                            .then((iObjectValue) => {
                                object[property] = iObjectValue
                            })
                        );
        
                    } else {
                        object[property] = record[property];
                    }
                } else {
                    let iPropertyValues =  record[property],
                        oneValue;

                    if(iPropertyValues) {
                        //iPropertyValues is a collection, so we're going to use .one() to get a sample.
                        oneValue = iPropertyValues.one();

                        //The collection is empty, we can carry it over
                        if(!oneValue) {
                            object[property] = iPropertyValues;
                        } else if(Array.isArray(iPropertyValues)) {
                            let values = [],
                                objectDescriptor = iPropertyDescriptor.valueDescriptor;

                            object[property] = values;

                            for(let countI = iPropertyValues.length, i=0; (i < countI); i++) {
                                let aDataIdentifier = this.dataIdentifierForTypePrimaryKey(objectDescriptor, iPropertyValues[i]);

                                (mappingPromises || (mappingPromises = [])).push(
                                    this._objectPromiseForDataIdentifier(aDataIdentifier, mainService)
                                    .then((iObjectValue) => {
                                        values.push(iObjectValue);
                                    })
                                );
                            }

                        } else if(iPropertyValues instanceof Map) {
                            throw "mapObjectToRawData for a property that is Map needs to be implemented";
                        }
                    } else {
                        object[property] = iPropertyValues;
                    }
                }

            } else {
                //We can for shure move the data as-is
                object[property] = record[property];
            }
        }
    }

    mapRawDataToObject (record, object, context, readExpressions, registerMappedPropertiesAsChanged = false) {
        let iDataInstanceIdentifier = this.dataIdentifierForTypePrimaryKey(object.objectDescriptor, record.identifier),
            mainService = this.mainService;

        let recordKeys = Object.keys(record),
            mappingPromises = [];

        for(let countI = recordKeys.length, i = 0; (i<countI); i++) {
            this._mapRawDataPropertyToObject (record, recordKeys[i], object, mappingPromises, mainService);
        }

        if(mappingPromises.length) {
            return Promise.all(mappingPromises);
        } else {
            return Promise.resolve(object)
        }
    }
    handleReadOperation(readOperation) {
        // TODO: Temporary workaround — until RawDataService can lazily subscribe to incoming
        // data operations, verify here whether this service should handle the operation.
        if (!this.handlesType(readOperation.target)) return;


        //TJ If there is no delegate, callDelegateMethod returns null which throws an error. Do we need a null check or should we ALWAYS have a delegate?
        let delegatePromise = this.callDelegateMethod("rawDataServiceWillHandleReadOperation", this, readOperation) || Promise.resolve(readOperation);
        delegatePromise
        .then((readOperation) => {
            /*
                if readOperation.cancelable is true, then if readOperation.defaultPrevented is true, 
                it means the event is cancelled. Those are DOM terms... isCancelled would be more
                legible than defaultPrevented...
            */
            if(!readOperation.defaultPrevented) {

                return this.dataInstancesPromiseForObjectDescriptor(readOperation.target)
                .then((dataInstances) => {

                        const { criteria, objectDescriptor: target } = readOperation,
                                predicateFunction = criteria?.predicateFunction;
                        let rawDataForObjectPromises = [];

                        for(let countI = dataInstances.length, i = 0, iDataInstance, iDataInstanceIdentifier, iRawData; (i < countI); i++) {
                            if(!criteria || (criteria && predicateFunction(dataInstances[i]))) {
                                rawDataForObjectPromises.push(
                                    this._rawDataForObject(dataInstances[i], readOperation)
                                    .then((iDataInstanceRawData) => {
                                        return iDataInstanceRawData;
                                    })
                                );
                            }
                        }

                        if(rawDataForObjectPromises.length) {
                            return Promise.all(rawDataForObjectPromises);
                        } else {
                            return Promise.resolve(rawDataForObjectPromises);
                        }
                })
                .then((filteredRawData) => {
                        return this._finalizeHandleReadOperation(readOperation, filteredRawData);
                })
                .catch((error) => {
                    console.error("Error loading serialized data:", error);
                    throw error;
                });
            }

            if(this.promisesReadCompletionOperation) {
                return readOperationCompletionPromise;
            }

        });
    }

    _finalizeHandleReadOperation(readOperation, rawData, readOperationCompletionPromiseResolve) {
        const responseOperation = this.responseOperationForReadOperation(
            readOperation.referrer ? readOperation.referrer : readOperation,
            null,
            rawData
        );

        responseOperation.target.dispatchEvent(responseOperation);

        // Resolve once dispatchEvent() is completed, including any pending progagationPromise.
        responseOperation.propagationPromise.then(() => {
            readOperationCompletionPromiseResolve?.(responseOperation);
        });
    }

    static {
        RawDataService.defineProperties(SerializedDataService.prototype, {

            _defaultDataModuleId: {
                value: "./data.mjson",
            },

            moduleId: {
                value: undefined,
            },

            deserializeSelf: {
                value: function (deserializer) {
                    RawDataService.prototype.deserializeSelf.call(this, deserializer);

                    let value = deserializer.getProperty("instances");

                    if (value) {
                        this._mapDataModuleIds(value);
                    }
                },
            },

            _mapDataModuleIds: {
                value: function (instances) {
                    instances.forEach((item) => {
                        if (!item.type || !item.moduleId) {
                            console.warn("type and moduleId are required to register data in SerializedDataService");
                            return;
                        }

                        if (!this.handlesType(item.type)) {
                            console.warn(`type ${item.type.name} is not handled by this SerializedDataService`);
                        }

                        this.registerTypeForInstancesLocation(item.type, item.moduleId);
                    });
                },
            },
        });
    }
};
