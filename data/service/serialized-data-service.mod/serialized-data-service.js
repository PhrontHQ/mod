const RawDataService = require("../raw-data-service").RawDataService,
    
    DataObject = require("../../model/data-object").DataObject,
    DataOperation = require("../data-operation").DataOperation,
    DataQuery = require("../../model/data-query").DataQuery,
    Criteria = require("core/criteria").Criteria,
    KebabCaseConverter = require("core/converter/kebab-case-converter").KebabCaseConverter;


    const assign = require("../../../core/frb/assign");

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

        // Checks that the serialized instances include objects  
        // when the propertyDescriptor has a valueDescriptor. Validation is 
        // expensive so this should only be enabled in development
        this._isModelValidationEnabled = false;
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
            }).then((rawData) => {
                if (this._isModelValidationEnabled) {
                    this._validateRawDataForType(rawData, objectDescriptor);
                }
                return rawData;
            })
            .catch((error) => {
                console.error("Error loading serialized data:", error);
                throw error;
            });

    }

    _validateRawDataForType(rawData, objectDescriptor) {
        rawData.forEach((rawObject) => {
            this._validateRawDataObjectForType(rawObject, objectDescriptor);
        });
    }

    _validateRawDataObjectForType(rawData, objectDescriptor) {
        let propertyDescriptors = objectDescriptor.propertyDescriptors,
            propertyDescriptor, value, valueType, expectedType,
            i, n;

        for (i = 0, n = propertyDescriptors.length; i < n; i++) {
            propertyDescriptor = propertyDescriptors[i];
            if (propertyDescriptor.valueDescriptor) {
                value = rawData[propertyDescriptor.name];
                expectedType = propertyDescriptor._valueDescriptorReference.name || "object";
                if (!value) {
                    continue;
                } if (!Array.isArray(value)) {
                    valueType = typeof value;
                    if (valueType !== "object") {
                        console.warn(`${objectDescriptor.name}.${propertyDescriptor.name} expects ${expectedType} and received ${valueType}`);
                    }
                } else if (value && value.length) {
                    valueType = typeof value[0];
                    
                    if (valueType !== "object") {
                        console.warn(`${objectDescriptor.name}.${propertyDescriptor.name} expects an array of ${expectedType} and received ${valueType}`);
                    }
                }
            }
        }
        
    }


    fetchRawObjectProperty(object, propertyName) {
        let iDataInstanceIdentifier = this.dataIdentifierForTypePrimaryKey(object.objectDescriptor, object.identifier),
            iRawData = this.snapshotForDataIdentifier(iDataInstanceIdentifier);



        if (!object._originDataSnapshot && propertyName == "originDataSnapshot") {
            object.originDataSnapshot = {};
            object.originDataSnapshot[this.identifier] = iRawData;
            return this.nullPromise;
        }

        //Find deserialized counterpart of object in memory. 
        //Assign object[propertyName] = deserializedObject[propertyName];
        // console.warn("SerializedDataService.fetchRawObjectProperty is not implemented", object, propertyName, iRawData);
        return this.nullPromise;
    }

    _mapObjectPropertyToRawData(object, objectKey, propertyDescriptor, rawData) {
                    
        // debugger;
        if(propertyDescriptor.cardinality === 1) {
            let value =  object[objectKey];
            if(value?.hasOwnProperty("identifier")) {
                rawData[propertyDescriptor.name] = object[objectKey].identifier;
            } else {
                rawData[objectKey] = object[objectKey];
            }
        } else {
            let value =  object[objectKey],
                oneValue;

            if(value) {
                //iPropertyValues is a collection, so we're going to use .one() to get a sample.
                oneValue = value.one();

                //The collection is empty, we can carry it over
                if(!oneValue) {
                    rawData[objectKey] = value;
                } else if(Array.isArray(value)) {
                    let rawDataValues = [];

                    for(let countI = value.length, i=0; (i < countI); i++) {
                        rawDataValues.push(value[i].identifier);
                    }

                    rawData[objectKey] = rawDataValues;

                } else if(value instanceof Map) {
                    throw "mapObjectToRawData for a property that is Map needs to be implemented";
                }
            } else {
                rawData[objectKey] = value;
            }
        }
    }


    mapObjectToRawData(object, rawData, context) {
        //Set the primary key:
        let mappingPromises;
        rawData.identifier = object.identifier;

        this._forEachObjectProperty(object, (propertyValue, propertyKey, propertyDescriptor, object) => {
            if (this._isAsync(propertyDescriptor.valueDescriptor)) {
                (mappingPromises || (mappingPromises = [])).push(propertyDescriptor.valueDescriptor.then(() => {
                    try {
                        this._mapObjectPropertyToRawData(object, propertyKey, propertyDescriptor, rawData);
                    } catch (e) {
                        console.error("SerializedDataService.mapObjectToRawData Error", object, propertyDescriptor, e);
                    }
                    
                }).catch(function (e) {
                    console.error(e);
                }));
            } else if (propertyDescriptor.valueDescriptor) {
                this._mapObjectPropertyToRawData(object, propertyKey, propertyDescriptor, rawData);
            } else {
                rawData[propertyDescriptor.name] = propertyValue;
            }
        });

        if (mappingPromises && mappingPromises.length) {
            return Promise.all(mappingPromises).then(() => {
                return rawData;
            });
        }
        return Promise.resolve(rawData);
    }

    _isAsync(object) {
        return object && object.then && typeof object.then === "function";
    }

    _forEachObjectProperty(object, callback) {
        let objectKeys = Object.keys(object),
            objectDescriptor = object.objectDescriptor;
        for(let countI = objectKeys.length, i = 0, iPropertyDescriptor; (i<countI); i++) {
            iPropertyDescriptor = objectDescriptor.propertyDescriptorNamed(objectKeys[i]);
            if(iPropertyDescriptor) {
                callback(object[objectKeys[i]], objectKeys[i], iPropertyDescriptor, object);
            }
        }
    }

    _rawDataForObject(object, context) {
        //We need to include it in the results, as rawData. So now we check of if have a rawData for it already
        let iDataInstanceIdentifier = this.dataIdentifierForTypePrimaryKey(object.objectDescriptor, object.identifier),
            iRawData = this.snapshotForDataIdentifier(iDataInstanceIdentifier);

        if(!iRawData) {
            iRawData = {};
            return this.mapObjectToRawData(object, iRawData, context)
            .then((rawData) => {
                object.originDataSnapshot = rawData;
                this.mapObjectTypeToRawData(object, rawData, context);
                return rawData;
            }).then((rawData) => {
                this.recordSnapshot(iDataInstanceIdentifier, rawData);
                return rawData;
            }).catch((e) => {
                console.error(e);
            })
        } else {
            if (!object.originDataSnapshot) {
                object.originDataSnapshot = iRawData;
            }
            //Not ideal to recrete a promise here...
            return Promise.resolve(iRawData);
        }

    }
    
    mapObjectTypeToRawData (object, rawData, context) {
        let mapping = this.mappingForObject(object);
        
        if (mapping && mapping.mapObjectTypeToRawData) {
            return mapping.mapObjectTypeToRawData(object, rawData, context);
        }

        if(this.needsRawDataTypeIdentificationCriteria) {
            let criteria = this.defaultOwnRawDataTypeIdentificationCriteriaForObjectDescriptor(object.objectDescriptor);
            assign(rawData, criteria.expression, true, criteria.parameters);
        }
    }
    

    _objectPromiseForDataIdentifier(aDataIdentifier, mainService) {
        let iObjectValue = mainService.objectForDataIdentifier(aDataIdentifier);

        if(!iObjectValue) {
            
            let criteria = new Criteria().initWithExpression("identifier == $", aDataIdentifier.primaryKey),
                iObjectValueQuery = DataQuery.withTypeAndCriteria(aDataIdentifier.objectDescriptor, criteria);


            return mainService.fetchData(iObjectValueQuery).catch((e) => {
                    //FIXME: This should not be necessary. SynchronizationDataService should be able to 
                    //understand that fetching by identifier here means fetching by id in PostgreSQL
                    criteria = new Criteria().initWithExpression("id == $", aDataIdentifier.primaryKey),
                    iObjectValueQuery = DataQuery.withTypeAndCriteria(aDataIdentifier.objectDescriptor, criteria);
                    return mainService.fetchData(iObjectValueQuery)
                })
                .then((fetchDataResult) => {
                    return fetchDataResult[0];
                }).catch((e) => {
                    console.error("Serialized DataService failed to fetch objectPromise", e);
                    return null;
                })
            
        } else {
            return Promise.resolve(iObjectValue);
        }

    }

    /* adds a promise resolving to the value to mappingPromises passed in*/
    _mapRawDataPropertyToObject (record, property, object, mappingPromises, mainService) {
        let objectDescriptor = object.objectDescriptor,
            iPropertyDescriptor = objectDescriptor.propertyDescriptorNamed(property);

        if(iPropertyDescriptor) {
            // debugger;
            /*
                We need to decide wether we store the value - object[property]
                or if that value has an idententifier if it's an
            */
            if(iPropertyDescriptor.valueDescriptor) {
                if (this._isAsync(iPropertyDescriptor.valueDescriptor)) {
                    mappingPromises.push(iPropertyDescriptor.valueDescriptor.then((valueDescriptor) => {
                        return this.__mapRawDataPropertyToObject(record, property, valueDescriptor, object, mainService);
                    }));
                } else {
                    return this.__mapRawDataPropertyToObject(record, property, iPropertyDescriptor.valueDescriptor, object, mainService);
                }

            } else {
                //We can for shure move the data as-is
                object[property] = record[property];
            }
        }
    }

    __mapRawDataPropertyToObject (record, property, valueDescriptor, object, mainService) {
        let objectDescriptor = object.objectDescriptor,
            iPropertyDescriptor = objectDescriptor.propertyDescriptorNamed(property);
        if(iPropertyDescriptor.cardinality === 1) {
                    let iPropertyValue = object[property];
                    if(typeof iPropertyValue === "string" /* would sure be handy to actually have a uuid tye right now...*/) {
                        let aDataIdentifier = this.dataIdentifierForTypePrimaryKey(iPropertyDescriptor.valueDescriptor, record.identifier);

                        return this._objectPromiseForDataIdentifier(aDataIdentifier, mainService)
                            .then((iObjectValue) => {
                                object[property] = iObjectValue
                            })
        
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
                                objectDescriptor = valueDescriptor,
                                mappingPromises = [];

                            object[property] = values;

                            for(let countI = iPropertyValues.length, i=0; (i < countI); i++) {
                                let aDataIdentifier = this.dataIdentifierForTypePrimaryKey(objectDescriptor, iPropertyValues[i]);

                                mappingPromises.push(
                                    this._objectPromiseForDataIdentifier(aDataIdentifier, mainService)
                                    .then((iObjectValue) => {
                                        values.push(iObjectValue);
                                    })
                                );
                            }
                            return Promise.all(mappingPromises).then(() => {
                                object[property].splice.apply(object[property], [0, Infinity].concat(values));
                                return;
                            });

                        } else if(iPropertyValues instanceof Map) {
                            throw "mapObjectToRawData for a property that is Map needs to be implemented";
                        }
                    } else {
                        object[property] = iPropertyValues;
                    }
                }
    }

    mapRawDataToObject (record, object, context, readExpressions, registerMappedPropertiesAsChanged = false) {
        let iDataInstanceIdentifier = this.dataIdentifierForTypePrimaryKey(object.objectDescriptor, record.identifier),
            mainService = this.mainService;

        let recordKeys = Object.keys(record),
            mappingPromises = [];


        for(let countI = recordKeys.length, i = 0; (i<countI); i++) {
            this._mapRawDataPropertyToObject(record, recordKeys[i], object, mappingPromises, mainService);
        }

        if(mappingPromises.length) {
            return Promise.all(mappingPromises).then(() => {
                return object;
            });
        } else {
            return Promise.resolve(object)
        }
    }
    shouldOverrideCriteria(criteria) {
        return criteria && criteria.expression && (criteria.expression.equals("id == $") || criteria.expression.equals("id == id$") || criteria.expression.equals("id == $id"));
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

                let random = Math.random();
                let criteria;

                return this.dataInstancesPromiseForObjectDescriptor(readOperation.target)
                .then((dataInstances) => {
                        criteria = readOperation.criteria;
                            let predicateFunction = criteria?.predicateFunction;

                        if (criteria && this.shouldOverrideCriteria(criteria)) {
                            let parameters = criteria.parameters;
                            if (parameters.id) {
                                parameters = parameters.id;
                            } else if (parameters.identifier) {
                                parameters = parameters.identifier;
                            }
                            criteria = Criteria.withExpression("identifier == $", parameters);
                            predicateFunction = criteria?.predicateFunction;
                        }
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
                    if (!readOperation.data.readExpressions) {
                        return filteredRawData
                    }
                    return filteredRawData.length ? this._valueForRawDataAndReadExpression(readOperation.target, filteredRawData[0], readOperation.data.readExpressions[0]) : filteredRawData;
                }).then((filteredRawData) => {
                    filteredRawData = filteredRawData && Array.isArray(filteredRawData) ? filteredRawData.filter((item) => {
                        return !!item;
                    }) : [filteredRawData];
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

    _shouldLazilyLoadManagedObjects = true;

    _valueForRawDataAndReadExpression(objectDescriptor, rawData, readExpression) {
        var propertyDescriptor = objectDescriptor.propertyDescriptorForName(readExpression),
            valueDescriptor = propertyDescriptor.valueDescriptor;

        if (this._isAsync(valueDescriptor)) {
            return valueDescriptor.then((relObjectDescriptor) => {
                let value = rawData[propertyDescriptor.name],
                    dataIdentifer, snapshot;

                if (!this.handlesType(relObjectDescriptor)) {
                    //Needs to be implemented
                    console.error("SerializedDataService cannot resolve relationship for object that is not also managed by the serializedDataService")
                    return null;
                }

                if (!this._shouldLazilyLoadManagedObjects) {
                    if (Array.isArray(value)) {
                        value = value.map((item) => {
                            dataIdentifer = this.dataIdentifierForTypePrimaryKey(relObjectDescriptor, item);
                            snapshot = this.snapshotForDataIdentifier(dataIdentifer);
                            return snapshot;
                        }).filter((item) => {
                            return !!item;
                        });
                    } else {
                        dataIdentifer = this.dataIdentifierForTypePrimaryKey(relObjectDescriptor, value);
                        value = this.snapshotForDataIdentifier(dataIdentifer);
                    }
                    return value;
                } else {
                    return this._readObjectsWithType(relObjectDescriptor).then((instances) => {
                        if (Array.isArray(value)) {
                            value = value.map((item) => {
                                dataIdentifer = this.dataIdentifierForTypePrimaryKey(relObjectDescriptor, item);
                                snapshot = this.snapshotForDataIdentifier(dataIdentifer);
                                return snapshot;
                            }).filter((item) => {
                                return !!item;
                            });
                        } else {
                            dataIdentifer = this.dataIdentifierForTypePrimaryKey(relObjectDescriptor, value);
                            value = this.snapshotForDataIdentifier(dataIdentifer);
                        }
                        return value;
                    });
                }
                
            });
        }

    }

    _readObjectsWithType (type) {
        return this.dataInstancesPromiseForObjectDescriptor(type).then((instances) => {
            return Promise.all(instances.map((instance) => {
                return this._rawDataForObject(instance)
                                    .then((iDataInstanceRawData) => {
                                        return iDataInstanceRawData;
                                    })
            }));
        });
    }


    _finalizeHandleReadOperation(readOperation, rawData, readOperationCompletionPromiseResolve) {
        let readOperationTarget = readOperation.target,
            readExpressions = readOperation.data && readOperation.data.readExpressions,
            responseOperationTarget;

        if (readExpressions) {
            for (let iPropertyName of readOperation.data.readExpressions) {
                let propertyDescriptor = readOperationTarget.propertyDescriptorNamed(iPropertyName);
                /* 
                    shortcut: propertyDescriptor.valueDescriptor returns a promise, 
                    whose resolved value is set to _valueDescriptorReference
                */
                if(propertyDescriptor.valueDescriptor && propertyDescriptor._valueDescriptorReference) {
                    responseOperationTarget = propertyDescriptor._valueDescriptorReference;
                } else {
                    responseOperationTarget = readOperationTarget;
                }

                // if(supportedProperties.has(iPropertyName)) {
                //     let methodName = `handle${iPropertyName.toCapitalized()}ReadOperation`;
                //     return this[methodName]?.(readOperation)
                // } else {
                //     rawDataArray = null;
                    let responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, null, rawData);
                    responseOperationTarget.dispatchEvent(responseOperation);             
                // }
            }  
        } else {
            let responseOperation = this.responseOperationForReadOperation(
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
