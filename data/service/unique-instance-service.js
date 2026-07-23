const Target = require("core/target").Target,
    defaultEventManager = require("core/event/event-manager").defaultEventManager,
    Montage = require("core/core").Montage,
    PropertyChanges = require("core/collections/listen/property-changes"),
    uuid = require("../../core/uuid");

const UniqueInstanceService = (exports.UniqueInstanceService = class UniqueInstanceService extends Target {
    /*******
     * Unsure
     */
    registerInstance(instance) {
        this.registeredObjectsForObjectDescriptor(instance.objectDescriptor).push(instance);
    }

    unregisterInstance(instance) {
            this.registeredObjectsForObjectDescriptor(instance.objectDescriptor).delete(instance);
    }

    //Should be moved to EditingContext
    // registerCreatedInstance(instance) {
    //     var objectDescriptor = this.objectDescriptorForInstance(dataObject),
    //         createdDataObjects = this.createdDataObjects,
    //         value = createdDataObjects.get(objectDescriptor);
    //     if (!value) {
    //         createdDataObjects.set(objectDescriptor, (value = new Set()));
    //     }

    //     /*
    //     This makes sure that properties' data triggers' valueStatus are set to null
    //     ensuring there's no reference to it in a storage
    // */
    //     //////////this._setCreatedObjectPropertyTriggerStatusToNull(dataObject);

    //     value.add(dataObject);
    //     this.objectDescriptorsWithChanges.add(objectDescriptor);

    //     this.dispatchDataEventTypeForObject(DataEvent.create, dataObject);
    // }

    // unregisterCreatedDataObject(instance) {
    //     var objectDescriptor = this.objectDescriptorForInstance(dataObject),
    //         value = this.createdDataObjects.get(objectDescriptor);
    //     if (value) {
    //         value.delete(dataObject);
    //         this.objectDescriptorsWithChanges.delete(objectDescriptor);
    //     }
    // }
    

    /******
     * Uniquing
     ******/
    /*
     * Replaces getDataObject. 
     * 
     * Needs to be async to allow lazy loading of prototypes
     */
    getInstance(type, rawData, dataIdentifier, context) {
        let instance = dataIdentifier && this.instanceForDataIdentifier(dataIdentifier, rawData, context);

        if (!instance) {
            if (dataIdentifier === undefined) {
                instance = this.createInstance(type);
            } else {
                instance = this._createInstance(type, dataIdentifier);
            }
        }
    }

    /*
     * Replaces createDataObject. 
     * 
     * Needs to be async to allow lazy loading of prototypes
     */
    createInstance(type) {
        var service = this.childServiceForType(type),
            //Gives a chance to raw data service to provide a primary key for clien-side creation/
            //Especially useful for systems that use uuid as primary keys.
            //object = this._createDataObject(type, service.dataIdentifierForNewObjectWithObjectDescriptor(type))
            object = this._createDataObject(
                type,
                this.dataIdentifierForNewInstanceWithObjectDescriptor(this.objectDescriptorForType(type))
            );

        this.registerCreatedDataObject(object);
    }

    _createInstance(type, dataIdentifier) {
        var objectDescriptor = this.objectDescriptorForType(type),
                object = Object.create(this._getPrototypeForType(objectDescriptor)),
                dataIdentifierDataService = dataIdentifier.dataService,
                delegateDataIdentifier;
            // constructor = this._getPrototypeForType(objectDescriptor).constructor,
            // object = new constructor;
            // //object = Reflect.construct(constructor, this._emptyArray);

            if (object) {
                delegateDataIdentifier =
                    dataIdentifierDataService.callDelegateMethod(
                        "dataIdentifierForRawDataServiceCreatingObjectWithDataIdentifier",
                        dataIdentifier.dataService,
                        dataIdentifier
                    ) ?? dataIdentifier;

                /*
                Our delegate overrode our dataIdentifier, we're going to keep a reference from
                dataIdentifier to the object
            */
                if (delegateDataIdentifier !== dataIdentifier) {
                    this.mainService.recordObjectForDataIdentifier(object, dataIdentifier);
                    dataIdentifier = delegateDataIdentifier;
                }
                //This needs to be done before a user-land code can attempt to do
                //anything inside its constructor, like creating a binding on a relationships
                //causing a trigger to fire, not knowing about the match between identifier
                //and object... If that's feels like a real situation, it is.
                this.registerUniqueInstanceWithDataIdentifier(object, dataIdentifier);
                // if (dataIdentifier && this.isUniquing) {
                //     this.recordDataIdentifierForObject(dataIdentifier, object);
                //     this.recordObjectForDataIdentifier(object, dataIdentifier);
                // }

                //This can't work with ES Classes
                //object = object.constructor.call(object) || object;
                if (object) {
                    this._setObjectType(object, objectDescriptor);
                    this._objectDescriptorForObjectCache.set(object, objectDescriptor);

                    //This is an in-memory cache of all objects with the same objectDescriptor, regarding of the fact that are new objects or fetched
                    this.registerDataObject(object);
                }

                dataIdentifierDataService.callDelegateMethod(
                    "rawDataServiceDidCreateObject",
                    dataIdentifierDataService,
                    object
                );
            }
            return object;
    }



    primaryKeyForNewInstanceWithObjectDescriptor(type) {
        return uuid.generate( Date.now(), /* isFull, to include hyphens*/ true);
    }
            
    dataIdentifierForNewInstanceWithObjectDescriptor(objectDescriptor) {
        var primaryKey = this.primaryKeyForNewInstanceWithObjectDescriptor(objectDescriptor);

        if (primaryKey) {
            return this.dataIdentifierForTypePrimaryKey(objectDescriptor, primaryKey);
        }
        return undefined;
    }

    dataIdentifierForTypePrimaryKey(type, primaryKey) {
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
    registerDataIdentifierForTypePrimaryKey(dataIdentifier, type, primaryKey) {
        var dataIdentifierMap = this._typeIdentifierMap.get(type);

        if (!dataIdentifierMap) {
            this._typeIdentifierMap.set(type, (dataIdentifierMap = new Map()));
        }

        dataIdentifierMap.set(primaryKey, dataIdentifier);
    }

    /**
     *  Returns a unique instance for a DataIdentifier
     *
     * @method
     * @argument {DataIdentifier} dataIdentifier        - the dataIdentifier
     * @argument {Object} rawData                       - the raw data for the instance expected to be found
     * @argument {Object} context                       - the context around, typically a DataOperation
     * @returns {Objecr}                                - instance found for that dataIdentifier if any
     */
    instanceForDataIdentifier(dataIdentifier, rawData, context) {
        return this._instanceByDataIdentifier.get(dataIdentifier);
    }

    /**
     * Records an instances's DataIdentifier
     *
     * @method
     * @argument {DataIdentifier} dataIdentifier    - DataIdentifier
     * @argument {object} object                    - instance represented by dataIdentifier
     */
    recordInstanceForDataIdentifier(instance, dataIdentifier) {
        this._instanceByDataIdentifier.set(dataIdentifier, instance);
    }

    recordDataIdentifierForInstance(dataIdentifier, object) {
        /*
            When we have a SynchronizationDataService in-between MainService and RawDataOnes, dataIdentifier and
                this._dataIdentifierByObject.get(object) are actually not the same. need to figure out why, but narrowing the test
            to verify they have the same primaryKey should help for now.
        */
            if (
                this._dataIdentifierByInstance.has(object) &&
                this._dataIdentifierByInstance.get(object)?.primaryKey !== dataIdentifier.primaryKey
            ) {
                //throw new Error("recordDataIdentifierForObject when one already exists:"+JSON.stringify(object));
                console.error(
                    "WARNING: recordDataIdentifierForObject when one already exists:" + JSON.stringify(object)
                );
            }
            /*
            TODO: This is called twice when this._dataIdentifierByObject already contains (object, dataIdentifier)
        */
            this._dataIdentifierByInstance.set(object, dataIdentifier);
    }

    /**
     * Records an object's DataIdentifier
     *
     * @method
     * @argument {DataIdentifier} dataIdentifier    - DataIdentifier
     * @argument {object} instance                    - object represented by dataIdentifier
     */
    recordInstanceForDataIdentifier(instance, dataIdentifier) {
        this._instanceByDataIdentifier.set(dataIdentifier, instance);
    }

    registerUniqueInstanceWithDataIdentifier(instance, dataIdentifier) {
        //Benoit: this is currently relying on a manual turn-on of isUniquing on the MainService, which is really not something people should have to worry about...
            /*
            Benoit 2/13/25: Relaxing to have RawDataServices keep track of this in a context
            where mutliple RawDataServices for the same ObjectDescriptors are involved
            with different native RawData shapes
        */
        //if (object && dataIdentifier && this.isRootService && this.isUniquing) {
        if (instance && dataIdentifier) {
            this.recordDataIdentifierForInstance(dataIdentifier, instance);
            this.recordInstanceForDataIdentifier(instance, dataIdentifier);
        }
    }

    //Unused?
    removeInstanceForDataIdentifier(dataIdentifier) {
        throw new Error("Throwing error to detect where this method is called")
        this._instanceByDataIdentifier.delete(dataIdentifier);
    }

    /******
     * Type/Object Descriptors Management
     */

    objectDescriptorForType(type) {
        let descriptor =
            this._constructorToObjectDescriptorMap.get(type) ||
            (typeof type === "string" && this._moduleIdToObjectDescriptorMap[type]);

        return descriptor || type;
    }

    _registerObjectDescriptor(jObjectDescriptor, moduleIdToObjectDescriptorMap = this._moduleIdToObjectDescriptorMap) {
            var result = null;

            if (jObjectDescriptor.object) {
                this._constructorToObjectDescriptorMap.set(jObjectDescriptor.object, jObjectDescriptor);
            } else if (jObjectDescriptor.module && typeof jObjectDescriptor.loadObjectFromModule === "function") {
                result = jObjectDescriptor.loadObjectFromModule().then(() => {
                    this._constructorToObjectDescriptorMap.set(jObjectDescriptor.object, jObjectDescriptor);
                });
            }
            var jModule = jObjectDescriptor.module;
            if (!jModule) {
                jModuleId = Montage.getInfoForObject(this).moduleId;
            } else {
                jModuleId = jModule.id;
                jModuleId += "/";
                jModuleId += jObjectDescriptor.exportName;
            }
            moduleIdToObjectDescriptorMap[jModuleId] = jObjectDescriptor;

            //Setup the event propagation chain
            /*
            this is now done in objectDescriptor as it follows the hierachy of objectDescriptor before getting to DataServices.
        */
            // jObjectDescriptor.nextTarget = service;
            return result;
    }

    /**
     * Get the type of the specified data object.
     *
     * @private
     * @method
     * @argument {Object} object       - The object whose type is sought.
     * @returns {DataObjectDescriptor} - The type of the object, or undefined if
     * no type can be determined.
     */
    _getInstanceType(instance) {
        var type = this._typeRegistry.get(object),
            moduleId = typeof object === "string" ? object : this._getModuleIdForObject(object);
        while (!type && object) {
            if (object.constructor.TYPE instanceof DataObjectDescriptor) {
                type = object.constructor.TYPE;
            } else if (this._moduleIdToObjectDescriptorMap[moduleId]) {
                type = this._moduleIdToObjectDescriptorMap[moduleId];
            } else {
                object = Object.getPrototypeOf(object);
            }
        }
        return type;
    }

    _getModuleIdForInstance(instance) {
        var info = Montage.getInfoForObject(object);
        return [info.moduleId, info.objectName].join("/");
    }

    _setInstanceType(instance, type) {
        if (this._getInstanceType(instance) !== type) {
            this._typeRegistry.set(instance, type);
        }
    }

    registerTypes(types) {
        var map = this._moduleIdToObjectDescriptorMap,
            typesPromises,
            j,
            countJ,
            jObjectDescriptor,
            jResult,
            self = this;

        for (j = 0, countJ = types.length; j < countJ; j++) {
            jObjectDescriptor = types[j];

            jResult = this._registerObjectDescriptor(jObjectDescriptor, map);

            // jResult = this._makePrototypeForType(service, jObjectDescriptor);
            if (jResult && Promise.is(jResult)) {
                (typesPromises || (typesPromises = [])).push(jResult);
            }
        }

        // types.forEach(function (objectDescriptor) {
        //     var module = objectDescriptor.module,
        //         moduleId = [module.id, objectDescriptor.exportName].join("/");
        //     map[moduleId] = objectDescriptor;
        // });

    }

    _makePrototypeForType(objectDescriptor) {
        if (objectDescriptor.object) {
            return this.__makePrototypeForType(childService, objectDescriptor, objectDescriptor.object);
        } else {
            var self = this,
                module = objectDescriptor.module;
            if (module && typeof objectDescriptor.loadObjectFromModule === "function") {
                return objectDescriptor.loadObjectFromModule().then(function (moduleObject) {
                    return self.__makePrototypeForType(childService, objectDescriptor, moduleObject);
                });

                // return module.require.async(module.id).then(function (exports) {
                //     return self.__makePrototypeForType(childService, objectDescriptor, exports[objectDescriptor.exportName]);
                // });
            } else {
                return Promise.resolveNull;
            }
        }
    }

    __makePrototypeForType(objectDescriptor, constructor) {
        /* to handle things like native types passing by */

        //How to handle this 
            // if (!childService) {
            //     return constructor
            //         ? constructor.prototype
            //         : objectDescriptor?.object
            //         ? objectDescriptor.object.prototype
            //         : typeof objectDescriptor === "function"
            //         ? objectDescriptor
            //         : null;
            // }

            var prototype = Object.create(
                    constructor?.prototype
                        ? constructor.prototype
                        : typeof objectDescriptor === "function"
                        ? objectDescriptor
                        : Object
                ),
                /*
            FIXME
            we're "lucky" here as when this is called, the current DataService hasn't registered yet the mappings, so we end up creating triggers for all property descriptors.
        */
                dataTriggers = this.DataTrigger.addTriggers(
                    this,
                    objectDescriptor,
                    prototype
                ),
                uniqueInstanceService = this;

            Object.defineProperty(prototype, "dataIdentifier", {
                enumerable: true,
                get: function () {
                    return uniqueInstanceService.dataIdentifierForObject(this);
                },
            });
            Object.defineProperty(prototype, "snapshot", {
                enumerable: true,
                get: function () {
                    /*
                    this is making a big assumption that there's only one raw data service handling this,
                    but the whole point of introducing data operations was to open up the fact that there could be multiple,
                    like a cloud + a local.

                    So we might want to keep an eye on this, even though all should be in-sync if they handle the same properties.
                */
                    return this.dataIdentifier.dataService.snapshotForObject(this);
                    // return mainService._getChildServiceForObject(this)?.snapshotForObject(this);
                },
            });
            Object.defineProperty(prototype, "nextTarget", {
                enumerable: true,
                get: function () {
                    return this.objectDescriptor;
                },
            });

            /*
            OPTIMIZE ME: We need to be smarter and only do that for the highest levels as it will be inherited
        */
            Object.defineProperty(prototype, "propertyChanges_prototype_addOwnPropertyChangeListener", {
                value: this.propertyChanges_prototype_addOwnPropertyChangeListener,
            });
            Object.defineProperty(prototype, "addOwnPropertyChangeListener", {
                value: this._instance_addOwnPropertyChangeListener,
            });

            Object.defineProperty(prototype, "propertyChanges_prototype_removeOwnPropertyChangeListener", {
                value: this.propertyChanges_prototype_removeOwnPropertyChangeListener,
            });
            Object.defineProperty(prototype, "removeOwnPropertyChangeListener", {
                value: this._instance_removeOwnPropertyChangeListener,
            });

            this._instancePrototypes.set(constructor, prototype);
            this._instancePrototypes.set(objectDescriptor, prototype);
            this._instanceTriggers.set(objectDescriptor, dataTriggers);
            // this._constructorToObjectDescriptorMap.set(constructor, objectDescriptor);
            return prototype;
    }

    _getPrototypeForType(type) {
        var info, triggers, prototypeToExtend, prototype;
            type = this.objectDescriptorForType(type);
            prototype = this._instancePrototypes.get(type);
            if (type && !prototype) {
                return this.__makePrototypeForType(
                    type,
                    type.object
                );
            }
            return prototype;
    }

    /******
     * Serialization
     */

    deserializedFromSerialization(label) {

        //Sets ourselve as application's main service
        if (!defaultEventManager.application.uniqueInstanceService) {
            defaultEventManager.application.uniqueInstanceService =
                defaultEventManager.application.uniqueInstanceService =
                defaultEventManager.application.uniqueInstanceService =
                    this;
        }
    }
    


})

UniqueInstanceService.addClassProperties({

    /************
     * Prototypes
     */

    _instancePrototypes: {
        value: new Map()
    },

    /***********
     * Triggers / Properties
     */

    _instance_addOwnPropertyChangeListener: {
        get: function () {
            if (!this.__instance_addOwnPropertyChangeListener) {
                var dataService = this;

                this.__instance_addOwnPropertyChangeListener = function (
                    key,
                    listener,
                    beforeChange,
                    trackRemoteChanges
                ) {
                    // if (
                    //     trackRemoteChanges ||
                    //     dataService.shouldListenForRemoteObjectPropertyChange(this, key, beforeChange)
                    // ) {
                    //     // if(dataService.shouldAddEventListenerForObjectRemotePropertyChange(this,key,beforeChange)) {
                    //     dataService.trackRemoteObjectPropertyChanges(this, key);
                    // }
                    return this.propertyChanges_prototype_addOwnPropertyChangeListener(key, listener, beforeChange);
                };
            }
            return this.__instance_addOwnPropertyChangeListener;
        },
    },

    _instance_removeOwnPropertyChangeListener: {
        get: function () {
            if (!this.__instance_removeOwnPropertyChangeListener) {
                var dataService = this;

                this.__instance_removeOwnPropertyChangeListener = function (
                    key,
                    listener,
                    beforeChange,
                    trackRemoteChanges
                ) {
                    // if (
                    //     trackRemoteChanges ||
                    //     dataService.shouldListenForRemoteObjectPropertyChange(this, key, beforeChange)
                    // ) {
                    //     // if(dataService.shouldAddEventListenerForObjectRemotePropertyChange(this,key,beforeChange)) {
                    //     dataService.removeEventListener("");
                    // }

                    return this.propertyChanges_prototype_removeOwnPropertyChangeListener(
                        key,
                        listener,
                        beforeChange
                    );
                };
            }
            return this.__instance_removeOwnPropertyChangeListener;
        },
    },

    _instanceTriggers: {
        get: function () {
            if (!this.__instanceTriggers) {
                this.__instanceTriggers = new Map();
            }
            return this.__instanceTriggers;
        }
    },

    propertyChanges_prototype_addOwnPropertyChangeListener: {
        value: PropertyChanges.prototype.addOwnPropertyChangeListener,
    },
    propertyChanges_prototype_removeOwnPropertyChangeListener: {
        value: PropertyChanges.prototype.removeOwnPropertyChangeListener,
    },

    /************
     * Types / ObjectDescriptors
     */
    _constructorToObjectDescriptorMap: {
        value: new Map()
    },

    _moduleIdToObjectDescriptorMap: {
        value: {}
    },
    

    /************
     * Uniquing
     */

    _dataIdentifierByInstance: {
        // This property is shared with all child services.
        // If created lazily the wrong data identifier will be returned when
        // accessed by a child service.

        /*
        Benoit 2/13/2025. Going for a per service bookkeeping, so rootService is the one creating and uniquing
        objects, but RawDataServices can keep track with their own native dataIdentifiers
    */
        get: function () {
            return this.__dataIdentifierByInstance || (this.__dataIdentifierByInstance = new WeakMap());
        },
    },

    _instanceByDataIdentifier: {
        get: function () {
            return this.__instanceByDataIdentifier || (this.__instanceByDataIdentifier = new WeakMap())
        }
    },

    //Came from RawDataSerrvice.
    _typeIdentifierMap: {
        get: function () {
            return this.__typeIdentifierMap || (this.__typeIdentifierMap = new Map());
        }
    },

    _typeRegistry: {
        get: function () {
            if (!this.__typeRegistry) {
                this.__typeRegistry = new WeakMap();
            }
            return this.__typeRegistry;
        },
    }
})