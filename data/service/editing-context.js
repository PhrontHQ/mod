const DataService = require("./data-service").DataService;



/**********
 * 
 * Questions/Notes
 * 1. Once EditingContext.fetchData converts the query to a ReadOperation, it is removed from the flow. The RawDataService dispatches the read completed and calls rawDataDone. So 
 *    How does EditingContext get a hold of the resulting data to begin listening to changes?
 * 
 * 
 */

/****
 * Alternate Names Under Consideration
 * 
 * ChangeContext
 * PendingChanges
 * PendingChangeContext
 * PendingChangeManager
 * ChangeManager
 */

const EditingContext = exports.EditingContext = class EditingContext extends DataService {

    /***************
    * Change Management
    */

    _buildChangesForDataObject() {
        let changesForDataObject = new Map();
        this.dataObjectChanges.set(dataObject, changesForDataObject);
        return changesForDataObject;
    }

    changesForDataObject(dataObject) {
        return this.dataObjectChanges.get(dataObject) || this._buildChangesForDataObject(dataObject);
    }

    get changedDataObjects() {
        return this._changedDataObjects || (this._changedDataObjects = new Map());
    }

    get createdDataObjects() {
        return this._createdDataObjects || (this._createdDataObjects = new Map());
    }

    get dataObjectChanges() {
        return this._dataObjectChanges || (this._dataObjectChanges = new Map());
    }


    get deletedDataObjects() {
        return this._deletedDataObjects || (this._deletedDataObjects = new Map());
    }

    get managedInstances() {
        return this._managedInstances || (this._managedInstances = new Map());
    }


    /***************
    * Object Lifecycle
    */

    createDataObject(type) {
            var service = this.mainService.childServiceForType(type),
                objectDescriptor = this.mainService.objectDescriptorForType(type),
                //Gives a chance to raw data service to provide a primary key for clien-side creation/
                //Especially useful for systems that use uuid as primary keys.
                //object = this._createDataObject(type, service.dataIdentifierForNewObjectWithObjectDescriptor(type))
                object = this._createDataObject(
                    type,
                    service.dataIdentifierForNewObjectWithObjectDescriptor(objectDescriptor)
                );

            this.mainService.registerCreatedDataObject(object);

            return object;
    }

    registerCreatedDataObject(dataObject) {
            var objectDescriptor = this.mainService.objectDescriptorForObject(dataObject),
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

            this.dispatchDataEventTypeForObject(DataEvent.create, dataObject);
    }

    deleteDataObject(object) {
        var saved = !this.isObjectCreated(object);
        this.registerDeletedDataObject(object);
        return this._updateDataObject(object, saved && "deleteDataObject");
    }

    resetDataObject(object) {
        var service = this.mainService.childServiceForType(object.objectDescriptor),
            promise;

        if (service) {
            promise = service.resetDataObject(object);
        }

        return promise;
    }

    undoPropertyChange(object, propertyName) {
        //TODO
    }

    undoPropertiesChange(object, /* propertyName1 ... propertyNameN */) {
        //TODO
    }


    saveChanges() {
        //If nothing to do, we bail out as early as possible.
        if (
            this.createdDataObjects.size === 0 &&
            this.changedDataObjects.size === 0 &&
            this.deletedDataObjects.size === 0
        ) {


            //CHANGE: Skip checking for pending transaction

            let createdDataObjects = this.createdDataObjects, //Map
                changedDataObjects =  this.changedDataObjects, //Map
                deletedDataObjects = this.deletedDataObjects, //Map
                dataObjectChanges = this.dataObjectChanges; //Map


            //Create transaction
            //Dispatch Transaction
        }

    }



    /**
     * EventChange handler, begining of tracking objects changes via Triggers right now,
     * which are installed on propertyDescriptors. We might need to refine that by adding the
     * ability to model wether a property is persisted or not. If it's not meant to be persisted,
     * then a DataService most likely doesn't have much to do with it.
     * Right now, this is unfortunately called even during the mapRawDataToObject.
     * We need a way to ignore this as early as possible
     *
     * @method
     * @argument {ChangeEvent} [changeEvent] - The changeEvent
     *
     */
    handleChange(changeEvent) {
        // this.registerDataObjectChangesFromEvent(changeEvent);
        console.log("EditingContext.handleChange", changeEvent);
    }

    registerDataObjectChangesFromEvent(changeEvent, shouldTrackChangesWhileBeingMapped) {
        let dataObject = changeEvent.target,
            key = changeEvent.key,
            objectDescriptor = this.objectDescriptorForObject(dataObject),
            propertyDescriptor = objectDescriptor.propertyDescriptorForName(key),
            isDataObjectBeingMapped = this._objectsBeingMapped.has(dataObject);

        //Property with definitions are read-only shortcuts, we don't want to treat these as changes the raw layers will want to know about
        if (propertyDescriptor.definition) {
            return;
        }

        if (!isDataObjectBeingMapped && this.autosaves /* && !this.isAutosaveScheduled*/) {
            //this.isAutosaveScheduled = true;
            this.debouncedQueueMicrotaskWithDelay(() => {
                this.isAutosaveScheduled = false;
                this.saveChanges();
            });
        }

        let inversePropertyName = propertyDescriptor.inversePropertyName,
            inversePropertyDescriptor;

        if (inversePropertyName) {
            inversePropertyDescriptor = propertyDescriptor._inversePropertyDescriptor /* Sync */;
            if (!inversePropertyDescriptor) {
                var self = this;
                return propertyDescriptor.inversePropertyDescriptor.then(function (_inversePropertyDescriptor) {
                    if (!_inversePropertyDescriptor) {
                        console.error(
                            "objectDescriptor " +
                                objectDescriptor.name +
                                "'s propertyDescriptor " +
                                propertyDescriptor.name +
                                " declares an inverse property named " +
                                inversePropertyName +
                                " on objectDescriptor " +
                                propertyDescriptor._valueDescriptorReference.name +
                                ", no matching propertyDescriptor could be found on " +
                                propertyDescriptor._valueDescriptorReference.name
                        );
                    } else {
                        self._registerDataObjectChangesFromEvent(
                            changeEvent,
                            propertyDescriptor,
                            _inversePropertyDescriptor,
                            shouldTrackChangesWhileBeingMapped
                        );
                    }
                });
            } else {
                this._registerDataObjectChangesFromEvent(
                    changeEvent,
                    propertyDescriptor,
                    inversePropertyDescriptor,
                    shouldTrackChangesWhileBeingMapped
                );
            }
        } else {
            this._registerDataObjectChangesFromEvent(
                changeEvent,
                propertyDescriptor,
                inversePropertyDescriptor,
                shouldTrackChangesWhileBeingMapped
            );
        }
    }

    _registerDataObjectChangesFromEvent(changeEvent, propertyDescriptor, inversePropertyDescriptor, shouldTrackChangesWhileBeingMapped) {
        var dataObject = changeEvent.target,
            isCreatedObject = this.isObjectCreated(dataObject),
            key = changeEvent.key,
            keyValue = changeEvent.keyValue,
            addedValues = changeEvent.addedValues,
            removedValues = changeEvent.removedValues,
            isDataObjectBeingMapped = this._objectsBeingMapped.has(dataObject),
            changesForDataObject = this.changesForDataObject(dataObject),
            //WARNING TEST: THIS WAS REDEFINING THE PASSED ARGUMENT
            //inversePropertyDescriptor,
            self = this;

        if (!isCreatedObject && (!isDataObjectBeingMapped || shouldTrackChangesWhileBeingMapped)) {
            //this.changedDataObjects.add(dataObject);
            this.registerChangedDataObject(dataObject);
        }

        if (
            changeEvent.key &&
            typeof changeEvent.keyValue !== "undefined" &&
            key !== "length" &&
            /* new for blocking re-entrant */ changesForDataObject.get(key) !== keyValue
        ) {
            if (!isDataObjectBeingMapped || shouldTrackChangesWhileBeingMapped) {
                changesForDataObject.set(key, keyValue);
            }

            //Now set the inverse if any
            if (inversePropertyDescriptor) {
                self._setDataObjectPropertyDescriptorValueForInversePropertyDescriptor(
                    dataObject,
                    propertyDescriptor,
                    keyValue,
                    inversePropertyDescriptor,
                    changeEvent.previousKeyValue,
                    isDataObjectBeingMapped
                );
            }
        }

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
            if (addedValues.isContentEqual(removedValues)) {
                return;
            }


            //For key that can have add/remove the value of they key is an object
            //that itself has two keys: addedValues and removedValues
            //which value will be a set;
            var manyChanges = changesForDataObject.get(key),
                isManyChangesArray = manyChanges && isArray(manyChanges),
                i,
                countI;

            //TODO The logic for tracking array changes uses the index at which the change occured a la handleRangeChange(plus, minus, index). 
            // The problem is that it assumes there was a single action taken at a single index within a save cycle. 
            //Example: foo.bar = [A, B, C, D, E, F, G];
            //
            // foo.bar.splice(2, 2); Removes 2 items at index 2 so change event has index 2
            // foo.bar.push(H); Adds item to end of array so change event has index 5 
            // foo.bar.unshift(Z); Adds item to beginning of array so change event has index 0
            // saveChanges();
            // 
            // The index captured in dataObjectChanges is the one from the first change event, so 2. 
            // The indices at which to make the 2nd and 3rd changes are lost. 

            if (!manyChanges) {
                manyChanges = new CollectionChanges();
                changesForDataObject.set(key, manyChanges);
            } 
            

            if (isManyChangesArray && (isCreatedObject || isDataObjectBeingMapped)) {
                if (removedValues) {
                    self._removeDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(
                        dataObject,
                        propertyDescriptor,
                        removedValues,
                        inversePropertyDescriptor,
                        isDataObjectBeingMapped
                    );
                }
                if (addedValues) {
                    self._addDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(
                        dataObject,
                        propertyDescriptor,
                        addedValues,
                        inversePropertyDescriptor,
                        isDataObjectBeingMapped
                    );
                }
            } else {

                if (addedValues && isManyChangesArray && manyChanges.equals(addedValues)) {
                    manyChanges = new CollectionChanges();
                    changesForDataObject.set(key, manyChanges);
                }
                manyChanges.trackChangeEvent(changeEvent);

                if (removedValues) {
                    registeredRemovedValues = manyChanges.removedValues;

                    if (isDataObjectBeingMapped) {
                        let targetName = changeEvent.target instanceof ObjectDescriptor ? changeEvent.target.name : changeEvent.target.dataIdentifier?.typeName;
                        
                        console.warn(`[DataService] RemovedValue during mapping? ${targetName}.${changeEvent.key}`);
                    }
                

                    for (i = 0, countI = removedValues.length; i < countI; i++) {
                        if (!isDataObjectBeingMapped) {
                            registeredRemovedValues.add(removedValues[i]);
                        }
                        self._removeDataObjectPropertyDescriptorValueForInversePropertyDescriptor(
                            dataObject,
                            propertyDescriptor,
                            removedValues[i],
                            inversePropertyDescriptor,
                            isDataObjectBeingMapped
                        );
                    }
                }

                if (addedValues) {
                    registeredAddedValues = manyChanges.addedValues;

                    if (isDataObjectBeingMapped) {
                        let targetName = changeEvent.target instanceof ObjectDescriptor ? changeEvent.target.name : changeEvent.target.dataIdentifier?.typeName;
                        console.warn(`[DataService] Add value during mapping? ${targetName}.${changeEvent.key}`);
                    }
                    let shouldAdd = true;
                    for (i = 0, countI = addedValues.length; i < countI; i++) {
                        if (!isDataObjectBeingMapped) {
                            if (!registeredAddedValues.has(addedValues[i])) {
                                registeredAddedValues.add(addedValues[i]);
                                shouldAdd = true;
                            } else if (!addedValues[i]) {
                                shouldAdd = true;
                            } else {
                                shouldAdd = false;
                            }
                        }
                        if (shouldAdd) {
                            self._addDataObjectPropertyDescriptorValueForInversePropertyDescriptor(
                                dataObject,
                                propertyDescriptor,
                                addedValues[i],
                                inversePropertyDescriptor,
                                isDataObjectBeingMapped
                            );
                        }
                    }
                }
            }

            return;

        }

    }

    registerChangedDataObject(dataObject) {
        var objectDescriptor = this.objectDescriptorForObject(dataObject),
            changedDataObjects,
            value;


        if (this.isObjectCreated(dataObject)) {
            console.warn(
                `DataService can't register a new object (${objectDescriptor.name}) in changedDataObjects`
            );
            return;
        }

        changedDataObjects = this.changedDataObjects;
        value = changedDataObjects.get(objectDescriptor);

        if (!value) {
            changedDataObjects.set(objectDescriptor, (value = new Set()));
        }
        value.add(dataObject);
        this.objectDescriptorsWithChanges.add(objectDescriptor);
    }

    _addDataObjectPropertyDescriptorValueForInversePropertyDescriptor(
                dataObject,
                propertyDescriptor,
                value,
                inversePropertyDescriptor,
                _inversePropertyCardinality,
                _inversePropertyName,
                isDataObjectBeingMapped
            ) {
        if (inversePropertyDescriptor && value) {
            if (isDataObjectBeingMapped) {
                this._objectsBeingMapped.add(value);
            }

            if ((_inversePropertyCardinality || inversePropertyDescriptor.cardinality) > 1) {
                //many to many:
                //value, if there is one, needs to be added to the other's side:
                inverseValue = value[_inversePropertyName || inversePropertyDescriptor.name];
                if (inverseValue) {
                    /*
                    We shouldn't add the same object again, so we need to check if it is there. I really don't like doinf indexOf() here, but it's not a set...
                */
                    if (inverseValue.indexOf(dataObject) === -1) {
                        inverseValue.push(dataObject);
                    }
                } else {
                    //No existing array so we create one on the fly
                    value[_inversePropertyName || inversePropertyDescriptor.name] = [dataObject];
                }
            } else {
                //A many-to-one
                let propertyName = _inversePropertyName || inversePropertyDescriptor.name,
                    objectPropertyValue = Object.getPropertyDescriptor(value, propertyName)?.get?.call(
                        value,
                        /*shouldFetch*/ false
                    );

                if (objectPropertyValue !== dataObject) {
                    value[_inversePropertyName || inversePropertyDescriptor.name] = dataObject;
                }
            }

            if (isDataObjectBeingMapped) {
                this._objectsBeingMapped.delete(value);
            }
        }
    }

    _addDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(
                dataObject,
                propertyDescriptor,
                values,
                inversePropertyDescriptor,
                isDataObjectBeingMapped
            ) {

        if (inversePropertyDescriptor) {
            //value should  be an array
            if ((values && !isArray(values)) || !(propertyDescriptor.cardinality > 0)) {
                console.warn(
                    "Something's off...., values added to propertyDescriptor:",
                    propertyDescriptor,
                    " of data object:",
                    dataObject,
                    " should be an array"
                );
            }

            var inversePropertyName = inversePropertyDescriptor.name,
                inversePropertyCardinality = inversePropertyDescriptor.cardinality,
                i,
                countI;

            for (i = 0, countI = values?.length; i < countI; i++) {
                this._addDataObjectPropertyDescriptorValueForInversePropertyDescriptor(
                    dataObject,
                    propertyDescriptor,
                    values[i],
                    inversePropertyDescriptor,
                    inversePropertyCardinality,
                    inversePropertyName,
                    isDataObjectBeingMapped
                );
            }
        }
    }

    _removeDataObjectPropertyDescriptorValueForInversePropertyDescriptor(
                dataObject,
                propertyDescriptor,
                value,
                inversePropertyDescriptor,
                _inversePropertyCardinality,
                _inversePropertyName
            ) {
        if (inversePropertyDescriptor && value) {
            if ((_inversePropertyCardinality || inversePropertyDescriptor.cardinality) > 1) {
                /*
                many to many:
                value needs to be renoved to the other's side, unless it doesn't exists (which would be the case if it wasn't fetched).
            */
                inverseValue = value[_inversePropertyName || inversePropertyDescriptor.name];
                if (inverseValue) {
                    inverseValue.delete(dataObject);
                }
            } else {
                //A many-to-one, sever the ties
                value[_inversePropertyName || inversePropertyDescriptor.name] = null;
            }
        }
    }

    _removeDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, values, inversePropertyDescriptor) {
        if (inversePropertyDescriptor) {
            //value should  be an array
            if (!isArray(values) || !(propertyDescriptor.cardinality > 0)) {
                console.warn(
                    "Something's off...., values added to propertyDescriptor:",
                    propertyDescriptor,
                    " of data object:",
                    dataObject,
                    " should be an array"
                );
            }

            var inversePropertyName = inversePropertyDescriptor.name,
                inversePropertyCardinality = inversePropertyDescriptor.cardinality,
                i,
                countI;

            for (i = 0, countI = values.length; i < countI; i++) {
                this._removeDataObjectPropertyDescriptorValueForInversePropertyDescriptor(
                    dataObject,
                    propertyDescriptor,
                    values[i],
                    inversePropertyDescriptor,
                    inversePropertyCardinality,
                    inversePropertyName
                );
            }
        }
    }

    _setDataObjectPropertyDescriptorValueForInversePropertyDescriptor(
                dataObject,
                propertyDescriptor,
                value,
                inversePropertyDescriptor,
                previousValue,
                isDataObjectBeingMapped
            ) {

            if (!inversePropertyDescriptor) {
                return;
            }

            // if(this._objectsBeingMapped.has(dataObject) && this._objectsBeingMapped.has(value)) {
            //     return;
            // }

            let addedValueAsObjectsBeingMapped = false,
                setInversePromise;

            if (this._objectsBeingMapped.has(dataObject)) {
                if (this._objectsBeingMapped.has(value)) {
                    return;
                } else {
                    addedValueAsObjectsBeingMapped = true;
                    this._objectsBeingMapped.add(value);
                }
            }

            var inversePropertyName = inversePropertyDescriptor.name,
                inversePropertyCardinality = inversePropertyDescriptor.cardinality,
                inverseValue;

            if (propertyDescriptor.cardinality === 1) {
                //value should not be an array
                if (isArray(value)) {
                    console.warn(
                        "Something's off...., the value of propertyDescriptor:",
                        propertyDescriptor,
                        " of data object:",
                        dataObject,
                        " should not be an array"
                    );
                }

                if (value) {
                    if (inversePropertyCardinality > 1) {
                        /*
                        value needs to be added to the other's side:

                        BUT - TODO - doing value[inversePropertyName] actually fires the trigger if wasn't there alredy.
                        In some cases, we rely on the value being there so it gets saved properly, by putting a foreignKey in for example.
                        It might be possible to handle that when we save only, or we could do the lookup using the property getter's secret shouldFetch argument.

                            inverseValue = Object.getPropertyDescriptor(value,inversePropertyName).get(false); //<-shouldFetch false

                        If we add the value and we don't know what was there (because we didn't fetch), we won't be able to do optimistic locking
                        We also would need to mark that property as "incommplete?", which we would need to do to able to add to a relationship without resolving it.
                        such that if the user actually fetch that property we can re-apply what was added/removed locally to what was actually fetched.

                        Also value[inversePropertyName] does fire the trigger, but it's async, so we're likely missing the value here and we migh need to use a promise with
                        getObjectProperty/ies

                    */
                        inverseValue = value[inversePropertyName];
                        if (inverseValue) {
                            /*
                            We might be looping back, but in any case, we shouldn't add the same object again, so we need to check if it is there. I really don't like doinf indexOf() here, but it's not a set...
                        */
                            if (inverseValue.indexOf(dataObject) === -1) {
                                inverseValue.push(dataObject);
                            }
                        } else {
                            //No existing array so we create one on the fly
                            value[inversePropertyName] = [dataObject];
                        }
                    } else {
                        /*
                        A 1-1 then. Let's not set if it's the same...

                        CAVEAT: if inversePropertyName has not been fetched so far, we don't really know what the value is.
                        If the "join" is made on value's primary key, checking the snapshot wouldn't tell us anything.
                        If we do value[inversePropertyName], it does trigger a fetch anyway and the value returned may or may not
                        end up overriding value[inversePropertyName] = dataObject done here, which isn't what the user intended.
                    */
                        setInversePromise = this.getObjectProperties(value, [inversePropertyName]).then(() => {
                            if (value[inversePropertyName] !== dataObject) {
                                value[inversePropertyName] = dataObject;
                            }
                        });
                    }
                }

                if (previousValue) {
                    inverseValue = previousValue[inversePropertyName];
                    if (inversePropertyCardinality > 1) {
                        /*
                        previousValue needs to be removed from the other's side:
                    */
                        if (inverseValue) {
                            /*
                            Assuming it only exists once in the array as it should...
                        */
                            inverseValue.delete(dataObject);
                        }
                        // else {
                        //     //No existing array so nothing to do....
                        // }
                    } else if (inverseValue === dataObject) {
                        /*
                    only if previousValue still points back to dataObject, do we sever the relationship
                    This checks allows to break a cycle of 1-1 updatimg each other one side moves on
                */
                        //A 1-1 then
                        previousValue[inversePropertyName] = null;
                    }
                }
            } else if (propertyDescriptor.cardinality > 1) {
                //value should  be an array
                if (value && !isArray(value)) {
                    console.warn(
                        "Something's off...., the value of propertyDescriptor:",
                        propertyDescriptor,
                        " of data object:",
                        dataObject,
                        " should be an array"
                    );
                }

                this._addDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(
                    dataObject,
                    propertyDescriptor,
                    value,
                    inversePropertyDescriptor
                );

                if (previousValue) {
                    this._removeDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(
                        dataObject,
                        propertyDescriptor,
                        previousValue,
                        inversePropertyDescriptor
                    );
                }
                // for(var i=0, countI = value.length, iValue; (i<countI); i++) {
                //     iValue = value[i];

                //     if(inversePropertyCardinality > 1) {
                //         //many to many:
                //         //value needs to be added to the other's side:
                //         inverseValue = value[inversePropertyName];
                //         if(inverseValue) {
                //             inverseValue.push(dataObject)
                //         } else {
                //             //No existing array so we create one on the fly
                //             value[inversePropertyName] = [dataObject];
                //         }

                //     } else {
                //         //A many-to-one
                //         iValue[inversePropertyName] = dataObject;
                //     }

                // }
            }

            //Cleanup:
            if (addedValueAsObjectsBeingMapped) {
                if (setInversePromise) {
                    setInversePromise.then(() => {
                        this._objectsBeingMapped.delete(value);
                    });
                } else {
                    this._objectsBeingMapped.delete(value);
                }
            }
    }


    /***************
    * Fetch Data
    */

    // fetchData(queryOrType, optionalCriteria, optionalStream) {

    // }

    /***
     * 
     * Pass the editing context with the data stream
     * Then in RawDataService, you can ask the EditingContext to create the object and 
     * it can register it at that point. It avoids the need to loop again after the 
     * fetch is complete
     * 
     */

    makeReadOperationForStream(stream) {
        let readOperation = this._makeReadOperationForStream(stream);
        stream.editingContext = this;
        return readOperation;
    }

    registerManagedInstanceForType(type, instance) {
        let set, i, n;
        if (!this._managedInstances.has(type)) {
            this._managedInstances.set(type, new Set());
        }
        this._managedInstances.get(type).add(instance);
    }

    captureReadCompletedOperation(readCompletedOperation) {
        console.log("EditingContext.captureReadCompletedOperation", readCompletedOperation);
    }

    static {

        DataService.defineProperties(EditingContext.prototype, {

            autosaves: {
                value: true
            },

            _dataObjectChanges: {
                value: undefined,
            }

        });

    }


};

