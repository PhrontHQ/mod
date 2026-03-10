var Montage = require("../../core/core").Montage,
    uuid = require("../../core/uuid"),
    DataService = require("../service/data-service").DataService,
    CountedSet = require("core/counted-set").CountedSet,
    Transaction;

/**
 * A Transaction represents a unit of changes grouped together and intend to be saved at the same time.

 * @class
 * @extends external:Montage
 */
 Transaction = exports.Transaction = Montage.specialize(/** @lends Transaction.prototype */ {
    constructor: {
        value: function Transaction() {
            this.identifier = uuid.generate();
            this._completionPromiseFunctionsByParticipant = new Map();
            return this;
        }
    },

    init: {
        value: function (service) {
            this.service = service;
            return this;
        }
    },

    identifier: {
        value: undefined
    },

    /**
     * Returns a Set containing ObjectDescriptors involved in the transaction across all type of changes
     *
     * @type {Set}
     */
    objectDescriptors: {
        get: function () {
            return new Set(this.objectDescriptorsWithChanges);
        }
    },

    objectDescriptorsWithChanges: {
        get: function () {
            return this._objectDescriptorsWithChanges || (this._objectDescriptorsWithChanges = new CountedSet());
        }
    },

    _completionPromiseFunctionsByParticipant: {
        value: undefined
    },

    createCompletionPromiseForParticipant: {
        value: function(participant) {
            var participationPromiseArguments = this._completionPromiseFunctionsByParticipant.get(participant),
                self = this;

            if(!participationPromiseArguments) {
                var participantCompletionPromise = new Promise(function(resolve, reject) {
                    self._completionPromiseFunctionsByParticipant.set(participant,arguments);
                });
                this.participantCompletionPromises.push(participantCompletionPromise);
            }
        }
    },

    resolveCompletionPromiseForParticipant: {
        value: function(participant) {
            var promiseFunctions = this._completionPromiseFunctionsByParticipant.get(participant);
            if(promiseFunctions) {
                promiseFunctions[0](participant);
                if(this._completionAllSettledValues) {
                    this._completionAllSettledValues.push({status: "fulfilled", value: participant});
                }
            }
        }
    },
    rejectCompletionPromiseForParticipantWithError: {
        value: function(participant, error) {
            var promiseFunctions = this._completionPromiseFunctionsByParticipant.get(participant);
            if(promiseFunctions) {
                promiseFunctions[1](error);
                if(this._completionAllSettledValues) {
                    this._completionAllSettledValues.push({status: "rejected", reason: error});
                }
            }
        }
    },

    clearCompletionPromises: {
        value: function(participant) {
            this._participantCompletionPromises.length = 0;
            this._completionPromiseFunctionsByParticipant.clear();
            this._completionPromise = null;
        }
    },


    _participantCompletionPromises: {
        value: undefined
    },

    participantCompletionPromises: {
        get: function() {
            return this._participantCompletionPromises || (this._participantCompletionPromises = []);
        }
    },

    _completionPromise: {
        value: undefined
    },
    _completionPromiseFunctions: {
        value: undefined
    },

    /*
        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
        [
          {status: "fulfilled", value: 33},
          {status: "fulfilled", value: 66},
          {status: "fulfilled", value: 99},
          {status: "rejected",  reason: Error: an error}
        ]
    */
    _completionAllSettledValues: {
        value: undefined
    },

    completionPromise: {
        get: function() {
            if(!this._completionPromise) {
                /*
                    We don't really know when we're done receiving createCompletionPromiseForParticipant
                    So it's dicy, if someonce calls completionPromise before it's over, stuff will be missed...
                */
               if(this.participantCompletionPromises && this.participantCompletionPromises.length) {
                    this._completionPromise = Promise.all(this.participantCompletionPromises);

                    var self = this;
                    this._completionPromise.finally(function() {
                        self.clearCompletionPromises();
                    })
               } else {
                    this._completionPromise = Promise.resolve(null);
               }
                // var self = this;
                // this._completionPromise = new Promise(function(resolve, reject) {
                //     self._completionAllSettledValues = [];
                //     self._completionPromiseFunctions = arguments;
                // });
            }
            return this._completionPromise;
        }
    },


    // _performCompletionPromises: {
    //     value: undefined
    // },

    // performCompletionPromises: {
    //     get: function() {
    //         return this._performCompletionPromises || (this._performCompletionPromises = []);
    //     }
    // },

    // performCompletionPromise: {
    //     value: undefined
    // },


    // rawDataServiceSucceeded: {
    //     value: function(aRawDataService) {
    //         var participationPromiseArguments = this._completionPromiseFunctionsByParticipant.get(aRawDataService);

    //         //Execute's the promise's resolve function, we don't care about the
    //         participationPromiseArguments[0]();
    //     }
    // },

    // rawDataServiceFailedWithError: {
    //     value: function(aRawDataService, error) {
    //         var participationPromiseArguments = this._completionPromiseFunctionsByParticipant.get(aRawDataService);

    //         //Execute's the promise's reject function with the error:
    //         participationPromiseArguments[1](error);
    //     }
    // },



    /**
     * A Map where keys are ObjectDescriptors and values are matching dataObject instances that are created in that transaction
     *
     * @type {Map}
     */
    createdDataObjects: {
        get: function () {
            if (!this._createdDataObjects) {
                this._createdDataObjects = new Map();
                var self = this;
                this._createdDataObjects.addMapChangeListener(function (value, key) {
                    value.addRangeChangeListener(function (dataObject) {
                        self.service.registerTransactionForObject(dataObject, self);
                    });
                });
            }
            return this._createdDataObjects;
        }
    },

    /**
     * A Map where keys are ObjectDescriptors and values are matching dataObject instances that are changed in that transaction
     *
     * @type {Map}
     */
    updatedDataObjects: {
        get: function () {
            if (!this._updatedDataObjects) {
                this._updatedDataObjects = new Map();
                var self = this;
                this._updatedDataObjects.addMapChangeListener(function (value, key) {
                    value.addRangeChangeListener(function (dataObject) {
                        self.service.registerTransactionForObject(dataObject, self);
                    });
                });
            }
            return this._updatedDataObjects;
        }
    },

    changedDataObjects: {
        get: function () {
            return this.updatedDataObjects;
        }
    },

    /**
     * A Map where keys are ObjectDescriptors and values are maps where criteria
     * matching dataObject instances with changes are the keys, and values are the changes
     *
     * @type {Map}
     */
    updatedData: {
        value: undefined
    },


    /**
     * A Map containing the changes for an object. Keys are the property modified,
     * values are either a single value, or a map with added/removed keys for properties
     * that have a cardinality superior to 1. The underlyinng collection doesn't matter
     * at that level.
     *
     * Retuns undefined if no changes have been registered.
     *
     * @type {Map.<Object>}
     */

    _buildChangesForDataObject: {
        value: function (dataObject) {
            let changesForDataObject = new Map();
            this.dataObjectChanges.set(dataObject, changesForDataObject);
            return changesForDataObject;
        },
    },

    /**
     * A Map where keys are dataObjects and values are changes for a dataObject that will be saved within the transaction.
     *
     * @type {Map}
     */
     dataObjectChanges: {
        get: function () {
            if (!this._dataObjectChanges) {
                this._dataObjectChanges = new Map();
                var self = this;
                this._dataObjectChanges.addMapChangeListener(function (dataObject, key) {
                    // value.addMapChangeListener(function (changesSet, dataObject) {
                        self.service.registerTransactionForObject(dataObject, self);
                    // });
                });
            }
            return this._dataObjectChanges;
        }
    },

    changesForDataObject: {
        value: function (dataObject) {
            return this.dataObjectChanges.get(dataObject) || this._buildChangesForDataObject(dataObject);
        },
    },

    /**
     * A Map where keys are ObjectDescriptors and values are matching dataObject instances that are deleted in that transaction
     *
     * @type {Map}
     */
    deletedDataObjects: {
        get: function () {
            if (!this._deletedDataObjects) {
                this._deletedDataObjects = new Map();
                var self = this;
                this._deletedDataObjects.addMapChangeListener(function (value, key) {
                    value.addRangeChangeListener(function (dataObject) {
                        self.service.registerTransactionForObject(dataObject, self);
                    });
                });
            }
            return this._deletedDataObjects || (this._deletedDataObjects = new Map());
        }
    },

    /**
     * A Map where keys are ObjectDescriptors and values are Sets containing criteria
     * describing dataObject instances to be deleted, or null if all instances are to be deleted
     *
     * @type {Map}
     */
     deletetedData: {
        value: undefined
    },

    /**
     * A Map
     *
     * @type {Map}
     */

    dataOperationsByObject: {
        value: undefined
    },


    deserializeSelf: {
        value: function (deserializer) {
            this.super(deserializer);

            var result, value;
            value = deserializer.getProperty("identifier");
            if (value !== void 0) {
                this.identifier = value;
            }

            value = deserializer.getProperty("objectDescriptorModuleIds");
            if (value !== void 0) {
                var mainService = DataService.mainService,
                    i, iObjectDescriptorModuleId, countI,
                    objectDescriptors = [];

                for(i=0, countI = value.length; (i<countI); i++) {
                    iObjectDescriptorModuleId = value[i];
                    iObjectDescriptor = this.mainService.objectDescriptorWithModuleId(iObjectDescriptorModuleId);
                    if(!iObjectDescriptor) {
                        console.warn("Transation -deserializeSelf(): Could not find an ObjecDescriptor with moduleId "+iObjectDescriptorModuleId);
                    } else {
                        objectDescriptors.push(iObjectDescriptor);
                    }
                }

                this.objectDescriptors = objectDescriptors;
            }
            // value = deserializer.getProperty("scope");
            // if (value !== void 0) {
            //     this.scope = value;
            // }

        }

    },
    serializeSelf: {
        value: function (serializer) {
            this.super(serializer);

            if(this.identifier) {
                serializer.setProperty("identifier", this.identifier);
            }

            if(this.objectDescriptors) {
                var objectDescriptorModuleIds = this.objectDescriptors.map((objectDescriptor) => {return objectDescriptor.module.id});

                serializer.setProperty("objectDescriptorModuleIds", objectDescriptorModuleIds);
            }


            // if(this.applicationCredentials) {
            //     serializer.setProperty("applicationCredentials", this.applicationCredentials);
            // }

            // if(this.scope) {
            //     serializer.setProperty("scope", this.scope);
            // }
        }
    },


    //Track Object Changes
    registerDataObjectChangesFromEvent: {
            value: function (changeEvent, shouldTrackChangesWhileBeingMapped) {
                var dataObject = changeEvent.target,
                    key = changeEvent.key,
                    objectDescriptor = this.service.objectDescriptorForObject(dataObject),
                    propertyDescriptor = objectDescriptor.propertyDescriptorForName(key);
                    // isDataObjectBeingMapped = this._objectsBeingMapped.has(dataObject);

                //Property with definitions are read-only shortcuts, we don't want to treat these as changes the raw layers will want to know about
                if (propertyDescriptor.definition) {
                    return;
                }

                this._registerDataObjectChangesFromEvent(
                    changeEvent,
                    shouldTrackChangesWhileBeingMapped
                );
            },
        },

        _registerDataObjectChangesFromEvent: {
            value: function (
                changeEvent,
                shouldTrackChangesWhileBeingMapped
            ) {
                var dataObject = changeEvent.target,
                    isCreatedObject = this.createdDataObjects.has(dataObject) || this.service.isObjectCreated(dataObject),
                    key = changeEvent.key,
                    keyValue = changeEvent.keyValue,
                    addedValues = changeEvent.addedValues,
                    removedValues = changeEvent.removedValues,
                    //FIX ME -- Remove reference to private property
                    isDataObjectBeingMapped = this.service._objectsBeingMapped.has(dataObject),
                    changesForDataObject = this.changesForDataObject(dataObject),
                    //WARNING TEST: THIS WAS REDEFINING THE PASSED ARGUMENT
                    //inversePropertyDescriptor,
                    self = this;

                /*
                Benoit refactoring saveChanges: shouldn't we be able to know that if there are no changesForDataObject, as we create on, it would ve the only time we'd have to call:

                                this.registerChangedDataObject(dataObject);

                ?
                #TODO TEST!!
            */
                // if (dataObject.objectDescriptor.name === "EmploymentPositionStaffing") {
                //     debugger;
                // }

                if (!isCreatedObject && (!isDataObjectBeingMapped || shouldTrackChangesWhileBeingMapped)) {
                    //this.updatedDataObjects.add(dataObject);
                    this.registerChangedDataObject(dataObject);
                }

                //Now handled in changesForDataObject
                // if(!changesForDataObject) {
                //     changesForDataObject = new Map();
                //     this.dataObjectChanges.set(dataObject,changesForDataObject);
                // }

                /*

                TODO / WARNING / FIX: If an object's property that has not been fetched, mapped and assigned is accessed, it will be undefined and will trigger a fetch to get it. If the business logic then assumes it's not there and set a value synchronously, when the fetch comes back, we will have a value and the set will look like an update.

                This situation is poorly handled and should be made more robust, here and in DataTrigger.

                Should we look into the snapshot to help? Then map what's there first, and then compare before acting?

                var dataObjectSnapshot = this._getChildServiceForObject(dataObject)._snapshot.get(dataObject.dataIdentifier);

                Just because it's async, doesn't mean we couldn't get it right, since we can act after the sync code action and reconciliate the 2 sides.

            */

                /*
                While a single change Event should be able to model both a range change
                equivalent of minus/plus and a related length property change at
                the same time, a changeEvent from the perspective of tracking data changes
                doesn't really care about length, or the array itself. The key of the changeEvent will be one of the target's and the added/removedValues would be from that property's array if it's one.

                Which means that data objects setters should keep track of an array
                changing on the object itself, as well as mutation done to the array itself while modeling that object's relatioonship.

                Client side we're going to have partial views of a whole relationship
                as we may not want to fetch everything at once if it's big. Which means
                that even if we can track add / removes to a property's array, what we
                may consider as an add / remove client side, may be a no-op while it reaches the server, and we may want to be able to tell the client about that specific fact.


            */

                //A change event could carry both a key/value change and addedValues/remove, like a splice, where the key would be "length"

                if ((addedValues && addedValues.length > 0) || (removedValues && removedValues.length > 0)) {

                    /*
                        TODO: FIXME
                        if addedValues and removedValues contain the same objects in a different order,
                        there's a bug in a way the graph is updated that is not symetric and the underlaying property of the object that change
                        ends up empty.
                        We set the to-one inverse of the objects in the array to null, 
                        which in turn, understands this as it shouldn't belong in the array of its inverse relationship, from which it is removed.

                        This is wastefull when it's just a different order that has no consequence for the graph itself.
                        But the problem is that when we process the addedValues that should re-set things, there's a problem in logic that guards
                        against upading the graph forever, that's ends the cycle before the state has been fully processed.

                        #WARNING #TODO #FIXME - THAT NEEDS TO BE FIXED!

                    */

                    //If both array contain the same values, there's nothing to do from a relationship/graph management stand point 
                    if(addedValues.isContentEqual(removedValues)) {
                        return;
                    }


                    //For key that can have add/remove the value of they key is an object
                    //that itself has two keys: addedValues and removedValues
                    //which value will be a set;
                    var manyChanges = changesForDataObject.get(key),
                        i,
                        countI;

                    if (!manyChanges) {
                        manyChanges = {};
                        manyChanges.index = changeEvent.index;
                        changesForDataObject.set(key, manyChanges);
                    }

                    //Not sure if we should consider evaluating added values regarded
                    //removed ones, one could be added and later removed.
                    //We later need to convert these into dataIdentifers, we could avoid a loop later
                    //doing so right here.

                    /*
                        Benoit 1/8/26 - Got a use-case of a swap: same values in addedValues and removedValues.
                        But with processing removedValues being the last, it would empty the array...

                        So removedValues needs to be handles first, and then addedValues second
                    */
                    if (removedValues) {
                        /*
                        In this case, the array already contains the added value and we'll save it all anyway. So we just propagate.
                        If the change is triggered by resolving properties by the framewok itself, then isDataObjectBeingMapped is true, and we don't want to register any of it as a change
                    */
                        if (Array.isArray(manyChanges) && (isCreatedObject || isDataObjectBeingMapped)) {
                            //noop
                        } else {
                            var registeredRemovedValues = manyChanges.removedValuesSet;
                            if (!registeredRemovedValues) {
                                if (!isDataObjectBeingMapped) {
                                    manyChanges.removedValues = removedValues;
                                    manyChanges.removedValuesSet = registeredRemovedValues = new Set(removedValues);
                                }
                            } else {
                                for (i = 0, countI = removedValues.length; i < countI; i++) {
                                    if (!isDataObjectBeingMapped) {
                                        registeredRemovedValues.add(removedValues[i]);
                                    }
                                }
                            }
                        }
                        /*
                        Work on local graph integrity. When objects are disassociated, it could mean some deletions may happen bases on delete rules.
                        App side goal is to maintain the App graph, server's side is to maintain database integrity. Both needs to act on delete rules:
                        - get object's descriptor
                        - get PropertyDescriptor from key
                        - get PropertyDescriptor's .deleteRule
                            deleteRule can be:
                                - DeleteRule.NULLIFY
                                - DeleteRule.CASCADE
                                - DeleteRule.DENY
                                - DeleteRule.IGNORE
                    */

                        //,,,,,TODO
                    }

                    if (addedValues) {
                        /*
                        In this case, the array already contains the added value and we'll save it all anyway. So we just propagate.
                    */
                        if (Array.isArray(manyChanges) && (isCreatedObject || isDataObjectBeingMapped)) {
                            //noop
                        } else {
                            var registeredAddedValues = manyChanges.addedValuesSet;
                            if (!registeredAddedValues) {
                                /*
                                FIXME: we ended up here with manyChanges being an array, containing the same value as addedValues. And we end up setting addedValues property on that array. So let's correct it. We might not want to track toMany as set at all, and just stick to added /remove. This might happens on remove as well, we need to check further.
                            */
                                if (Array.isArray(manyChanges) && manyChanges.equals(addedValues)) {
                                    manyChanges = {};
                                    manyChanges.index = changeEvent.index;
                                    changesForDataObject.set(key, manyChanges);
                                }

                                if (!isDataObjectBeingMapped) {
                                    manyChanges.addedValues = addedValues;
                                    manyChanges.addedValuesSet = registeredAddedValues = new Set(addedValues);
                                }
                            } 
                        }
                    }

                }
            }
        },

        registerCreatedDataObject: {
            value: function (dataObject) {
                var objectDescriptor = this.service.objectDescriptorForObject(dataObject),
                    createdDataObjects = this.createdDataObjects,
                    value = createdDataObjects.get(objectDescriptor);
                if (!value) {
                    createdDataObjects.set(objectDescriptor, (value = new Set()));
                }

                /*
                This makes sure that properties' data triggers' valueStatus are set to null
                ensuring there's no reference to it in a storage
            */
                //////////this._setCreatedObjectPropertyTriggerStatusToNull(dataObject);

                value.add(dataObject);
                this.objectDescriptorsWithChanges.add(objectDescriptor);
            }
        },

        unregisterCreatedDataObject: {
            value: function (dataObject) {
                var objectDescriptor = this.objectDescriptorForObject(dataObject),
                    value = this.createdDataObjects.get(objectDescriptor);
                if (value) {
                    value.delete(dataObject);
                    if (value.size === 0) {
                        this.createdDataObjects.delete(objectDescriptor);
                        this.objectDescriptorsWithChanges.delete(objectDescriptor);
                    }
                }
            },
        },

        registerChangedDataObject: {
            value: function (dataObject) {
                var objectDescriptor = this.service.objectDescriptorForObject(dataObject),
                    updatedDataObjects,
                    value;

                if (this.createdDataObjects.has(dataObject) || this.service.isObjectCreated(dataObject)) {
                    console.warn(
                        `DataService can't register a new object (${objectDescriptor.name}) in updatedDataObjects`
                    );
                    return;
                }

                updatedDataObjects = this.updatedDataObjects;
                value = updatedDataObjects.get(objectDescriptor);

                if (!value) {
                    updatedDataObjects.set(objectDescriptor, (value = new Set()));
                }
                value.add(dataObject);
                this.objectDescriptorsWithChanges.add(objectDescriptor);
            },
        },

        unregisterChangedDataObject: {
            value: function (dataObject) {
                var objectDescriptor = this.service.objectDescriptorForObject(dataObject),
                    value = this.updatedDataObjects.get(objectDescriptor);

                if (value) {
                    value.delete(dataObject);
                    if (value.size === 0) {
                        this.updatedDataObjects.delete(objectDescriptor);
                        this.objectDescriptorsWithChanges.delete(objectDescriptor);
                    }
                }
            },
        },

        registerDeletedDataObject: {
            value: function (dataObject) {
                var objectDescriptor = this.service.objectDescriptorForObject(dataObject),
                    deletedDataObjects = this.deletedDataObjects,
                    value = deletedDataObjects.get(objectDescriptor);
                if (!value) {
                    deletedDataObjects.set(objectDescriptor, (value = new Set()));
                }
                value.add(dataObject);
                this.objectDescriptorsWithChanges.add(objectDescriptor);
            },
        },

        isObjectDeleted: {
            value: function (dataObject) {
                return this.deletedDataObjects.get(dataObject.objectDescriptor)?.has(dataObject);
            },
        },

        unregisterDeletedDataObject: {
            value: function (dataObject) {
                var objectDescriptor = this.objectDescriptorForObject(dataObject),
                    value = this.deletedDataObjects.get(objectDescriptor);
                if (value) {
                    value.delete(dataObject);
                    if (value.size === 0) {
                        this.deletedDataObjects.delete(objectDescriptor);
                        this.objectDescriptorsWithChanges.delete(objectDescriptor);
                    }
                    
                }
            }
        },

});
