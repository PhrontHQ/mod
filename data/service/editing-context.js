const DataService = require("./data-service").DataService,
    uniqueInstanceService = require("./unique-instance-service").defaultUniqueInstanceService,
    DataEvent = require("../model/data-event").DataEvent,
    DataOperation = require("./data-operation").DataOperation,
    ObjectPool = require("core/object-pool").ObjectPool,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

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

const EditingContext = (exports.EditingContext = class EditingContext extends DataService {

    constructor() {
        super();
        if (defaultEventManager.application) {
            defaultEventManager.application.registerEditingContext(this);
        }
        this.application.addEventListener(DataOperation.Type.ReadOperation, this, true);
        this.addEventListener("change", this, false);

        this.addEventListener(DataOperation.Type.NoOp, this, false);
        this.addEventListener(DataOperation.Type.ReadFailedOperation, this, false);
        this.addEventListener(DataOperation.Type.ReadCompletedOperation, this, false);
        this.addEventListener(DataOperation.Type.UpdateFailedOperation, this, false);
        this.addEventListener(DataOperation.Type.UpdateCompletedOperation, this, false);
        this.addEventListener(DataOperation.Type.CreateFailedOperation, this, false);
        this.addEventListener(DataOperation.Type.CreateCompletedOperation, this, false);
        this.addEventListener(DataOperation.Type.DeleteFailedOperation, this, false);
        this.addEventListener(DataOperation.Type.DeleteCompletedOperation, this, false);
        this.addEventListener(DataOperation.Type.CreateTransactionFailedOperation, this, false);
        this.addEventListener(DataOperation.Type.CreateTransactionCompletedOperation, this, false);
    }
    /***************
     * Change Management
     */

    _buildChangesForInstance(instance) {
        let changesForInstance = new Map();
        this.instanceChanges.set(instance, changesForInstance);
        return changesForInstance;
    }

    changesForInstance(instance) {
        return this.instanceChanges.get(instance) || this._buildChangesForInstance(instance);
    }

    get changedInstances() {
        return this._changedInstances || (this._changedInstances = new Map());
    }

    get createdInstances() {
        return this._createdInstances || (this._createdInstances = new Map());
    }

    get instanceChanges() {
        return this._instanceChanges || (this._instanceChanges = new Map());
    }

    get deletedInstances() {
        return this._deletedInstances || (this._deletedInstances = new Map());
    }

    get managedInstances() {
        return this._managedInstances || (this._managedInstances = new Map());
    }

    /***************
     * Object Lifecycle
     */

    createInstance(type) {
        var instance = uniqueInstanceService.createInstance(type),
            objectDescriptor = uniqueInstanceService.objectDescriptorForInstance(instance);

        this.registerCreatedInstanceForType(instance, objectDescriptor);
        this.registerManagedInstanceForType(instance, objectDescriptor);

        return instance;
    }

    registerCreatedInstance(instance) {
        var objectDescriptor = uniqueInstanceService.objectDescriptorForInstance(instance);
        this.registerCreatedInstanceForType(instance, objectDescriptor);
    }

    registerCreatedInstanceForType(instance, objectDescriptor) {
        let createdInstances = this.createdInstances,
            value = createdInstances.get(objectDescriptor);
        if (!value) {
            createdInstances.set(objectDescriptor, (value = new Set()));
        }

        /*
            This makes sure that properties' data triggers' valueStatus are set to null
            ensuring there's no reference to it in a storage
        */
        //////////this._setCreatedObjectPropertyTriggerStatusToNull(dataObject);

        value.add(instance);
        this.objectDescriptorsWithChanges.add(objectDescriptor);

        this.dispatchDataEventTypeForObject(DataEvent.create, instance);
    }

    deleteInstance(object) {
        var saved = !this.isInstanceCreated(object);
        this.registerDeletedInstance(object);
        return this._updateInstance(object, saved && "deleteInstance");
    }

    resetInstance(object) {
        var service = this.mainService.childServiceForType(object.objectDescriptor),
            promise;

        if (service) {
            promise = service.resetInstance(object);
        }

        return promise;
    }

    undoPropertyChange(object, propertyName) {
        //TODO
    }

    undoPropertiesChange(object /* propertyName1 ... propertyNameN */) {
        //TODO
    }

    saveChanges() {
        //If nothing to do, we bail out as early as possible.
        if (this.createdInstances.size === 0 && this.changedInstances.size === 0 && this.deletedInstances.size === 0) {
            //CHANGE: Skip checking for pending transaction

            let createdInstances = this.createdInstances, //Map
                changedInstances = this.changedInstances, //Map
                deletedInstances = this.deletedInstances, //Map
                instanceChanges = this.instanceChanges; //Map

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
        if (this.isManagedInstance(changeEvent.target)) {
            //TODO Add check for whether the changed property is managed by this context
            changeEvent.stopPropagation();
            this.registerInstanceChangesFromEvent(changeEvent);
        }
    }

    registerInstanceChangesFromEvent(changeEvent, shouldTrackChangesWhileBeingMapped) {
        let dataObject = changeEvent.target,
            key = changeEvent.key,
            objectDescriptor = this.objectDescriptorForObject(dataObject),
            propertyDescriptor = objectDescriptor.propertyDescriptorForName(key),
            isInstanceBeingMapped = this._objectsBeingMapped.has(dataObject);

        //Property with definitions are read-only shortcuts, we don't want to treat these as changes the raw layers will want to know about
        if (propertyDescriptor.definition) {
            return;
        }

        if (!isInstanceBeingMapped && this.autosaves /* && !this.isAutosaveScheduled*/) {
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
                                propertyDescriptor._valueDescriptorReference.name,
                        );
                    } else {
                        self._registerInstanceChangesFromEvent(
                            changeEvent,
                            propertyDescriptor,
                            _inversePropertyDescriptor,
                            shouldTrackChangesWhileBeingMapped,
                        );
                    }
                });
            } else {
                this._registerInstanceChangesFromEvent(
                    changeEvent,
                    propertyDescriptor,
                    inversePropertyDescriptor,
                    shouldTrackChangesWhileBeingMapped,
                );
            }
        } else {
            this._registerInstanceChangesFromEvent(
                changeEvent,
                propertyDescriptor,
                inversePropertyDescriptor,
                shouldTrackChangesWhileBeingMapped,
            );
        }
    }

    _registerInstanceChangesFromEvent(
        changeEvent,
        propertyDescriptor,
        inversePropertyDescriptor,
        shouldTrackChangesWhileBeingMapped,
    ) {
        var dataObject = changeEvent.target,
            isCreatedObject = this.isInstanceCreated(dataObject),
            key = changeEvent.key,
            keyValue = changeEvent.keyValue,
            addedValues = changeEvent.addedValues,
            removedValues = changeEvent.removedValues,
            isInstanceBeingMapped = this._objectsBeingMapped.has(dataObject),
            changesForInstance = this.changesForInstance(dataObject),
            //WARNING TEST: THIS WAS REDEFINING THE PASSED ARGUMENT
            //inversePropertyDescriptor,
            self = this;

        if (!isCreatedObject && (!isInstanceBeingMapped || shouldTrackChangesWhileBeingMapped)) {
            //this.changedInstances.add(dataObject);
            this.registerChangedInstance(dataObject);
        }

        if (
            changeEvent.key &&
            typeof changeEvent.keyValue !== "undefined" &&
            key !== "length" &&
            /* new for blocking re-entrant */ changesForInstance.get(key) !== keyValue
        ) {
            if (!isInstanceBeingMapped || shouldTrackChangesWhileBeingMapped) {
                changesForInstance.set(key, keyValue);
            }

            //Now set the inverse if any
            if (inversePropertyDescriptor) {
                self._setInstancePropertyDescriptorValueForInversePropertyDescriptor(
                    dataObject,
                    propertyDescriptor,
                    keyValue,
                    inversePropertyDescriptor,
                    changeEvent.previousKeyValue,
                    isInstanceBeingMapped,
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
            var manyChanges = changesForInstance.get(key),
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
            // The index captured in instanceChanges is the one from the first change event, so 2.
            // The indices at which to make the 2nd and 3rd changes are lost.

            if (!manyChanges) {
                manyChanges = new CollectionChanges();
                changesForInstance.set(key, manyChanges);
            }

            if (isManyChangesArray && (isCreatedObject || isInstanceBeingMapped)) {
                if (removedValues) {
                    self._removeInstancePropertyDescriptorValuesForInversePropertyDescriptor(
                        dataObject,
                        propertyDescriptor,
                        removedValues,
                        inversePropertyDescriptor,
                        isInstanceBeingMapped,
                    );
                }
                if (addedValues) {
                    self._addInstancePropertyDescriptorValuesForInversePropertyDescriptor(
                        dataObject,
                        propertyDescriptor,
                        addedValues,
                        inversePropertyDescriptor,
                        isInstanceBeingMapped,
                    );
                }
            } else {
                if (addedValues && isManyChangesArray && manyChanges.equals(addedValues)) {
                    manyChanges = new CollectionChanges();
                    changesForInstance.set(key, manyChanges);
                }
                manyChanges.trackChangeEvent(changeEvent);

                if (removedValues) {
                    registeredRemovedValues = manyChanges.removedValues;

                    if (isInstanceBeingMapped) {
                        let targetName =
                            changeEvent.target instanceof ObjectDescriptor
                                ? changeEvent.target.name
                                : changeEvent.target.dataIdentifier?.typeName;

                        console.warn(`[DataService] RemovedValue during mapping? ${targetName}.${changeEvent.key}`);
                    }

                    for (i = 0, countI = removedValues.length; i < countI; i++) {
                        if (!isInstanceBeingMapped) {
                            registeredRemovedValues.add(removedValues[i]);
                        }
                        self._removeInstancePropertyDescriptorValueForInversePropertyDescriptor(
                            dataObject,
                            propertyDescriptor,
                            removedValues[i],
                            inversePropertyDescriptor,
                            isInstanceBeingMapped,
                        );
                    }
                }

                if (addedValues) {
                    registeredAddedValues = manyChanges.addedValues;

                    if (isInstanceBeingMapped) {
                        let targetName =
                            changeEvent.target instanceof ObjectDescriptor
                                ? changeEvent.target.name
                                : changeEvent.target.dataIdentifier?.typeName;
                        console.warn(`[DataService] Add value during mapping? ${targetName}.${changeEvent.key}`);
                    }
                    let shouldAdd = true;
                    for (i = 0, countI = addedValues.length; i < countI; i++) {
                        if (!isInstanceBeingMapped) {
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
                            self._addInstancePropertyDescriptorValueForInversePropertyDescriptor(
                                dataObject,
                                propertyDescriptor,
                                addedValues[i],
                                inversePropertyDescriptor,
                                isInstanceBeingMapped,
                            );
                        }
                    }
                }
            }

            return;
        }
    }

    isInstanceCreated(instance) {
        var objectDescriptor = uniqueInstanceService.objectDescriptorForInstance(instance),
            createdInstances = this.createdInstances.get(objectDescriptor), //Do we need to check other EditingContexts?
            isObjectCreated = createdInstances && createdInstances.has(instance);

        if (!isObjectCreated) {
            var pendingTransactions = this._pendingTransactions;

            if (pendingTransactions && pendingTransactions.length) {
                for (var i = 0, countI = pendingTransactions.length; i < countI; i++) {
                    if (pendingTransactions[i].createdInstances.get(objectDescriptor)?.has(instance)) {
                        return true;
                    }
                }
                return false;
            } else {
                return false;
            }
        }

        return isObjectCreated;
    }

    registerChangedInstance(instance) {
        var objectDescriptor = uniqueInstanceService.objectDescriptorForInstance(instance),
            changedInstances,
            value;

        if (this.isInstanceCreated(instance)) {
            console.warn(`DataService can't register a new object (${objectDescriptor.name}) in changedInstances`);
            return;
        }

        changedInstances = this.changedInstances;
        value = changedInstances.get(objectDescriptor);

        if (!value) {
            changedInstances.set(objectDescriptor, (value = new Set()));
        }
        value.add(instance);
        this.objectDescriptorsWithChanges.add(objectDescriptor);
    }

    _addInstancePropertyDescriptorValueForInversePropertyDescriptor(
        dataObject,
        propertyDescriptor,
        value,
        inversePropertyDescriptor,
        _inversePropertyCardinality,
        _inversePropertyName,
        isInstanceBeingMapped,
    ) {
        if (inversePropertyDescriptor && value) {
            if (isInstanceBeingMapped) {
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
                        /*shouldFetch*/ false,
                    );

                if (objectPropertyValue !== dataObject) {
                    value[_inversePropertyName || inversePropertyDescriptor.name] = dataObject;
                }
            }

            if (isInstanceBeingMapped) {
                this._objectsBeingMapped.delete(value);
            }
        }
    }

    _addInstancePropertyDescriptorValuesForInversePropertyDescriptor(
        dataObject,
        propertyDescriptor,
        values,
        inversePropertyDescriptor,
        isInstanceBeingMapped,
    ) {
        if (inversePropertyDescriptor) {
            //value should  be an array
            if ((values && !isArray(values)) || !(propertyDescriptor.cardinality > 0)) {
                console.warn(
                    "Something's off...., values added to propertyDescriptor:",
                    propertyDescriptor,
                    " of data object:",
                    dataObject,
                    " should be an array",
                );
            }

            var inversePropertyName = inversePropertyDescriptor.name,
                inversePropertyCardinality = inversePropertyDescriptor.cardinality,
                i,
                countI;

            for (i = 0, countI = values?.length; i < countI; i++) {
                this._addInstancePropertyDescriptorValueForInversePropertyDescriptor(
                    dataObject,
                    propertyDescriptor,
                    values[i],
                    inversePropertyDescriptor,
                    inversePropertyCardinality,
                    inversePropertyName,
                    isInstanceBeingMapped,
                );
            }
        }
    }

    _removeInstancePropertyDescriptorValueForInversePropertyDescriptor(
        dataObject,
        propertyDescriptor,
        value,
        inversePropertyDescriptor,
        _inversePropertyCardinality,
        _inversePropertyName,
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

    _removeInstancePropertyDescriptorValuesForInversePropertyDescriptor(
        dataObject,
        propertyDescriptor,
        values,
        inversePropertyDescriptor,
    ) {
        if (inversePropertyDescriptor) {
            //value should  be an array
            if (!isArray(values) || !(propertyDescriptor.cardinality > 0)) {
                console.warn(
                    "Something's off...., values added to propertyDescriptor:",
                    propertyDescriptor,
                    " of data object:",
                    dataObject,
                    " should be an array",
                );
            }

            var inversePropertyName = inversePropertyDescriptor.name,
                inversePropertyCardinality = inversePropertyDescriptor.cardinality,
                i,
                countI;

            for (i = 0, countI = values.length; i < countI; i++) {
                this._removeInstancePropertyDescriptorValueForInversePropertyDescriptor(
                    dataObject,
                    propertyDescriptor,
                    values[i],
                    inversePropertyDescriptor,
                    inversePropertyCardinality,
                    inversePropertyName,
                );
            }
        }
    }

    _setInstancePropertyDescriptorValueForInversePropertyDescriptor(
        dataObject,
        propertyDescriptor,
        value,
        inversePropertyDescriptor,
        previousValue,
        isInstanceBeingMapped,
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
                    " should not be an array",
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
                    " should be an array",
                );
            }

            this._addInstancePropertyDescriptorValuesForInversePropertyDescriptor(
                dataObject,
                propertyDescriptor,
                value,
                inversePropertyDescriptor,
            );

            if (previousValue) {
                this._removeInstancePropertyDescriptorValuesForInversePropertyDescriptor(
                    dataObject,
                    propertyDescriptor,
                    previousValue,
                    inversePropertyDescriptor,
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

    registerManagedInstanceForType(instance, type) {
        let set, i, n;
        if (!this.managedInstances.has(type)) {
            this.managedInstances.set(type, new Set());
        }
        this.managedInstances.get(type).add(instance);
        this._addChangeListenerToType(type)
    }

    _addChangeListenerToType(type) {
        //Added to highest-level parent so EditingContext does not interfere with more 
        //specific listeners below
        while (type.parent) {
            type = type.parent;
        }
        type.addEventListener("change", this, false);
    }

    isManagedInstance(instance) {
        let forType = this.managedInstances.get(instance.objectDescriptor);
        return forType && forType.has(instance);
    }

    captureReadCompletedOperation(readCompletedOperation) {
        console.log("EditingContext.captureReadCompletedOperation", readCompletedOperation);
    }

    /***********
     * Operations
     */

    captureReadOperation(readOperation) {
        if (!this._rawDataServiceHandlersByReadOperationId.has(readOperation.id)) {
            return;
        }
        if (readOperation.rawDataService) {
            this.registerRawDataServiceForReadOperation(readOperation.rawDataService, readOperation);
        }

        //console.log("captureReadOperation: "+readOperation.target.name+", criteria.expression: "+readOperation.criteria.expression+", criteria.parameters: "+JSON.stringify(readOperation.criteria.parameters), readOperation);
        if (this.performsAccessControl) {
            var self = this,
                result = this.evaluateAccessPoliciesForDataOperation(readOperation);

            if (this._isAsync(result)) {
                /*
                Returning a promise from the event handler ensures the next listener inline doesn't get involed until we're done.
            */
                return result.then(function (value) {
                    return self._captureReadOperationPostAccessPoliciesEvaluation(readOperation);
                });
            } else {
                self._captureReadOperationPostAccessPoliciesEvaluation(readOperation);
            }
        }
    }

    handleReadFailedOperation(operation) {
        var stream = this._thenableByOperationId.get(operation.referrerId);
        if (stream) {
            this.rawDataError(stream, operation.data);
            this._thenableByOperationId.delete(operation.referrerId);
        }
    }

    registerRawDataServiceForReadOperation(rawDataService, readOperation) {
        // let handlers = this._rawDataServiceHandlersByReadOperation.get(readOperation);
        // if (!handlers) {
        //     this._rawDataServiceHandlersByReadOperation.set(readOperation, (handlers = []));
        // }
        // handlers.push(rawDataService);

        // //When readOperation's referrer was a readEvent
        // //this.registerRawDataServiceHandlerForReadOperationId(rawDataService, readOperation.referrerId);
        // this.registerRawDataServiceHandlerForReadOperationId(rawDataService, readOperation.id);
        throw new Error("this was removed in favor of registerRawDataServiceHandlerForReadOperationId");
    }

    //Why do we have both of these?
    registerRawDataServiceHandlerForReadOperationId(rawDataService, readOperationId) {
        let handlers = this._rawDataServiceHandlersByReadEventId.get(readEventId);
        if (!handlers) {
            this._rawDataServiceHandlersByReadEventId.set(readEventId, (handlers = []));
        }
        handlers.push(rawDataService);
    }

    unregisterRawDataServiceHandlerForReadOperationId(rawDataService, readEventId) {
        let handlers = this._rawDataServiceHandlersByReadOperationId.get(readEventId);
        if (handlers) {
            handlers.delete(rawDataService);
        }
    }

    // //Is this used?
    registerReadOperation(readOperation) {
        this._rawDataServiceHandlersByReadOperationId.set(readOperation.id, undefined);
    }

    // //Is this used?
    unregisterReadOperation(readOperation) {
        // if (!this.hasRegisteredRawDataServiceHandlerForReadOperation(readOperation)) {
        //     /*
        //     This means no RawDataService were able to handle that read.
        //     We need to report am error
        // */
        //     /*
        //     REFACTOR: There could be more than one rawDataService handling a read operation.

        //     RawDataService in handleRead used to create a readDataOperation for itself,
        //     and set itself as:
        //                 readOperation.rawDataService = this;
        //     Now in captureReadOperation(), it's missing...

        // */
        //     //readEvent.dataStream.dataError(new Error("No RawDataService to handle query for "+readEvent.dataStream.query.type.name));
        // }

        this._rawDataServiceHandlersByReadOperationId.delete(readOperation.id);
        // ReadEvent.checkin(readOperation);
    }

    /***************
     * Read Only
     */
    registerReadOnlyInstance(instance) {
        this._readOnlyInstancesFoObjectDescriptor(instance.objectDescriptor).push(instance);
    }

    unregisterReadOnlyInstance(instance) {
        if (instance) {
            let readOnlyInstancesRegisteredForObjectDescriptor = this.__readOnlyInstanceByObjectDescriptors?.(
                instance.objectDescriptor,
            );

            if (readOnlyInstancesRegisteredForObjectDescriptor) {
                let index = readOnlyInstancesRegisteredForObjectDescriptor.indexOf(instance);

                if (index !== -1) {
                    readOnlyInstancesRegisteredForObjectDescriptor.splice(index, 1);
                }
            }
        }
    }

    readOnlyInstancesRegisteredForObjectDescriptor(objectDescriptor) {
        return this.__readOnlyInstancesByObjectDescriptors?.get(objectDescriptor);
    }

    /*********
     * Transactions
     */
    handleTransactionCreateStart(transactionPrepareStartEvent) {
        var preparingParticipant = transactionPrepareStartEvent.target,
            handledObjectDescriptors = transactionPrepareStartEvent.data;

        /*
        TODO Future: use handledObjectDescriptors:
        objectDescriptor -> Map {
            "createdDatabjects" -> Set,
            "changedDatabjects" -> Set,
            "deletedDatabjects" -> Set
        }

        along with handleTransationPrepareProgress() to track progress
    */

        //transactionPrepareStartEvent.transaction.createCompletionPromiseForParticipant(preparingParticipant);

        /*
        listen for both complete and fail
    */
        preparingParticipant.addEventListener(TransactionEvent.transationPrepareProgress, this, false);
        preparingParticipant.addEventListener(TransactionEvent.transationPrepareComplete, this, false);
    }

    handleTransactionPrepareStart(transactionPrepareStartEvent) {
        var preparingParticipant = transactionPrepareStartEvent.target,
            handledObjectDescriptors = transactionPrepareStartEvent.data;

        /*
                TODO Future: use handledObjectDescriptors:
                objectDescriptor -> Map {
                    "createdDatabjects" -> Set,
                    "changedDatabjects" -> Set,
                    "deletedDatabjects" -> Set
                }

                along with handleTransationPrepareProgress() to track progress
            */

        //transactionPrepareStartEvent.transaction.createCompletionPromiseForParticipant(preparingParticipant);

        /*
                listen for both complete and fail
            */
        preparingParticipant.addEventListener(TransactionEvent.transationPrepareProgress, this, false);
        preparingParticipant.addEventListener(TransactionEvent.transationPrepareComplete, this, false);
    }

    handleTransactionPrepareProgress(transactionPrepareProgressEvent) {
        var preparingParticipant = transactionPrepareProgressEvent.target;
        //boilerplate for now
    }

    handleTransactionPrepareComplete(transactionPrepareCompleteEvent) {
        var participant = transactionPrepareCompleteEvent.target,
            transaction = transactionPrepareCompleteEvent.transaction;

        //resolve the matching completionPromise with the participant.
        //transaction.resolveCompletionPromiseForParticipant(participant);
    }

    handleTransactionPrepareFail(transactionPrepareFailEvent) {
        var participant = transactionPrepareFailEvent.target,
            transaction = transactionPrepareFailEvent.transaction,
            error = transactionPrepareFailEvent.data;

        //reject the matching completionPromise with the participant.
        // transaction.rejectCompletionPromiseForParticipantWithError(participant, error);
    }

    handleTransactionRollbackStart(transactionRollbackStartEvent) {
        var participant = transactionRollbackStartEvent.target,
            handledObjectDescriptors = participant.data;

        /*
                TODO Future: use handledObjectDescriptors:
                objectDescriptor -> Map {
                    "createdDatabjects" -> Set,
                    "changedDatabjects" -> Set,
                    "deletedDatabjects" -> Set
                }

                along with handleTransationPrepareProgress() to track progress
            */
        //transactionRollbackStartEvent.transaction.createCompletionPromiseForParticipant(participant);

        /*
                listen for both complete and fail
            */
        participant.addEventListener(TransactionEvent.transationCancelProgress, this, false);
        participant.addEventListener(TransactionEvent.transationCancelComplete, this, false);
    }

    handleTransactionRollbackProgress(transactionRollbackProgressEvent) {
        var participant = transactionRollbackProgressEvent.target;
        //boilerplate for now
    }

    handleTransactionRollbackComplete(transactionRollbackCompleteEvent) {
        var participant = transactionRollbackCompleteEvent.target,
            transaction = transactionRollbackCompleteEvent.transaction;

        //resolve the matching completionPromise with the participant.
        //transaction.resolveCompletionPromiseForParticipant(participant);
    }

    handleTransactionRollbackFail() {
        var participant = transactionRollbackFailEvent.target,
            transaction = transactionRollbackFailEvent.transaction,
            error = transactionRollbackFailEvent.data;
    }

    handleTransactionCommitStart(transactionCommitStartEvent) {
        var participant = transactionCommitStartEvent.target,
            handledObjectDescriptors = participant.data;

        /*
        TODO Future: use handledObjectDescriptors:
        objectDescriptor -> Map {
            "createdDatabjects" -> Set,
            "changedDatabjects" -> Set,
            "deletedDatabjects" -> Set
        }

        along with handleTransationPrepareProgress() to track progress
    */
        //transactionCommitStartEvent.transaction.createCompletionPromiseForParticipant(participant);

        /*
        listen for both complete and fail
    */
        participant.addEventListener(TransactionEvent.transationPerformProgress, this, false);
        participant.addEventListener(TransactionEvent.transationPerformComplete, this, false);
    }

    handleTransactionCommitProgress(transactionCommitProgressEvent) {
        var participant = transactionCommitProgressEvent.target;
        //boilerplate for now
    }

    handleTransactionCommitComplete(transactionCommitCompleteEvent) {
        var participant = transactionCommitCompleteEvent.target,
            transaction = transactionCommitCompleteEvent.transaction;

        //resolve the matching completionPromise with the participant.
        //transaction.resolveCompletionPromiseForParticipant(participant);
    }

    handleTransactionCommitFail(transactionCommitFailEvent) {
        var participant = transactionCommitFailEvent.target,
            transaction = transactionCommitFailEvent.transaction,
            error = transactionCommitFailEvent.data;

        //reject the matching completionPromise with the participant.
        //transaction.rejectCompletionPromiseForParticipantWithError(participant, error);
    }

    pendingTransactionPromiseForInstances(instances) {
        let pendingTransactions = this._pendingTransactions;

        if (pendingTransactions && pendingTransactions.length) {
            let firstPendingTransactionsCreatingChangedDataObjectsPromise,
                pendingTransactionsCreatingChangedDataObjectsPromises;

            /* 
                                TODO WIP
                                Nested loop, really need to be optimized as we build up the transactions, 
                                but let's get to work first and then we'll optimize.
        
                                There can only be one pending transaction with the creation of iObject
                                so we bail out if we find it
                            */

            //Loop on ObjectDescriptors with instances being updated

            for (let j = 0, countJ = instances.length; j < countJ; j++) {
                let object = instances[j];

                for (let i = 0, countI = pendingTransactions.length; i < countI; i++) {
                    let iPendingTransaction = pendingTransactions[i];

                    if (iPendingTransaction.createdDataObjects.has(object.objectDescriptor)) {
                        let createdDataObjects = iPendingTransaction.createdDataObjects.get(object.objectDescriptor);

                        if (createdDataObjects.has(object)) {
                            if (!firstPendingTransactionsCreatingChangedDataObjectsPromise) {
                                firstPendingTransactionsCreatingChangedDataObjectsPromise =
                                    this.registeredPromiseForPendingTransaction(iPendingTransaction);
                            } else {
                                if (!pendingTransactionsCreatingChangedDataObjectsPromises) {
                                    pendingTransactionsCreatingChangedDataObjectsPromises = new Set();
                                    pendingTransactionsCreatingChangedDataObjectsPromises.add(
                                        firstPendingTransactionsCreatingChangedDataObjectsPromise,
                                    );
                                }
                                pendingTransactionsCreatingChangedDataObjectsPromises.add(
                                    this.registeredPromiseForPendingTransaction(iPendingTransaction),
                                );
                            }
                            break;
                        }
                    }
                }
            }
            if (!pendingTransactionsCreatingChangedDataObjectsPromises) {
                if (firstPendingTransactionsCreatingChangedDataObjectsPromise) {
                    return firstPendingTransactionsCreatingChangedDataObjectsPromise;
                } else {
                    return Promise.resolveUndefined;
                }
            } else {
                return Promise.all(Array.from(pendingTransactionsCreatingChangedDataObjectsPromises));
            }
        } else {
            return Promise.resolveUndefined;
        }
    }

    _cancelTransaction(transaction, cancelError, rejectFunction) {
        this.addEventListener(TransactionEvent.transactionRollbackStart, this, false);

        transactionRollbackEvent = TransactionEvent.checkout();

        transactionRollbackEvent.type = TransactionEvent.transactionRollback;
        transactionRollbackEvent.transaction = transaction;
        transaction.objectDescriptor.dispatchEvent(transactionRollbackEvent);
        // TransactionDescriptor.dispatchEvent(transactionRollbackEvent);

        return (transactionRollbackEvent.propagationPromise || Promise.resolve())
            .then(function () {
                TransactionEvent.checkin(transactionRollbackEvent);
                return transaction.completionPromise;
            })
            .then(function () {
                rejectFunction(cancelError);
            })
            .catch(function (error) {
                rejectFunction(error);
            })
            .finally(() => {
                this.unregisterPendingTransactionPromise(transaction);
            });
    }

    registerPendingTransactionPromise(transaction, promise) {
        (this._promisesByPendingTransactions || (this._promisesByPendingTransactions = new Map())).set(
            transaction,
            promise,
        );
    }

    registeredPromiseForPendingTransaction(transaction) {
        return this._promisesByPendingTransactions?.get(transaction);
    }

    unregisterPendingTransactionPromise(transaction) {
        if (this._promisesByPendingTransactions) {
            this._promisesByPendingTransactions.delete(transaction);
        }
    }

    addPendingTransaction(aCreateTransactionOperation) {
        (this._pendingTransactions || (this._pendingTransactions = [])).push(aCreateTransactionOperation);
    }

    removePendingTransaction(aCreateTransactionOperation) {
        if (this._pendingTransactions) {
            this._pendingTransactions.delete(aCreateTransactionOperation);
        }
    }

    _dispatchTransactionEventTypeWithInstances(transaction, eventType, instances) {
        var criteriaIterator = instances.keys(),
            iteration,
            iObjectDescriptor,
            iObjects,
            iTransactionEvent,
            propagationPromises,
            propagationPromise;

        /*
                dispatch transactionCreate()
            */
        while (!(iteration = criteriaIterator.next()).done) {
            iObjectDescriptor = iteration.value;
            iObjects = instances.get(iObjectDescriptor);

            iTransactionEvent = TransactionEvent.checkout();

            iTransactionEvent.type = eventType;
            iTransactionEvent.transaction = transaction;
            iTransactionEvent.data = iObjects;

            iObjectDescriptor.dispatchEvent(iTransactionEvent);
            propagationPromise = dataEvent.propagationPromise;
            if (Promise.is(propagationPromise)) {
                (propagationPromises || (propagationPromises = [])).push(propagationPromise);
                propagationPromise.then(function () {
                    eventPool.checkin(dataEvent);
                });
            } else {
                eventPool.checkin(dataEvent);
            }
        }

        return propagationPromises ? Promise.all(propagationPromises) : null;
    }

    /*********
     * Data Events
     */

    _dataEventPoolForEventType(eventType) {
        var pool = (this.__dataEventPoolByEventType || (this.__dataEventPoolByEventType = new Map())).get(eventType);
        if (!pool) {
            this.__dataEventPoolByEventType.set(eventType, (pool = new ObjectPool(this._eventPoolFactoryForEventType)));
        }
        return pool;
    }

    dispatchDataEventTypeForObject(eventType, object, detail) {
        /*
                This needs to be made more generic in EventManager, which has "prepareForActivationEvent,
                but it's very specialized for components. Having all prototypes of DO register as eventListeners upfront
                would be damaging performance wise. We should do it as things happen.
            */
        if (object.dispatchEvent) {
            var eventPool = this._dataEventPoolForEventType(eventType),
                objectDescriptor = this.objectDescriptorForObject(object),
                objectConstructor = object.constructor,
                dataEvent = eventPool.checkout();

            dataEvent.type = eventType;
            dataEvent.target = objectDescriptor;
            dataEvent.dataService = this;
            dataEvent.dataObject = object;
            dataEvent.detail = detail;

            if (!this.isConstructorPreparedToHandleDataEvents(objectConstructor)) {
                this.prepareConstructorToHandleDataEvents(objectConstructor, dataEvent);
            }

            object.dispatchEvent(dataEvent);

            var propagationPromise = dataEvent.propagationPromise;
            if (Promise.is(propagationPromise)) {
                return propagationPromise.then(function () {
                    eventPool.checkin(dataEvent);
                });
            } else {
                eventPool.checkin(dataEvent);
            }
        }
    }

    isConstructorPreparedToHandleDataEvents(instanceConstructor) {
        return (this.__preparedConstructorsForDataEvents || (this.__preparedConstructorsForDataEvents = new Set())).has(
            instanceConstructor,
        );
    }

    prepareConstructorToHandleDataEvents(instanceConstructor, event) {
        if (typeof instanceConstructor.prepareToHandleDataEvents === "function") {
            instanceConstructor.prepareToHandleDataEvents(event);
        }
        //prepareToHandleDataEvent or prepareToHandleCreateEvent
        this.__preparedConstructorsForDataEvents.add(instanceConstructor);
    }

    static {
        DataService.defineProperties(EditingContext.prototype, {
            autosaves: {
                value: true,
            },

            isAutosaveScheduled: {
                value: false,
            },

            _instanceChanges: {
                value: undefined,
            },

            /***********
             * Operations
             */

            /**********
             * @property
             * @type {Map<Operation, Array<RawDataService>>}
             */
            _rawDataServiceHandlersByReadOperationId: {
                get: function () {
                    return (
                        this.__rawDataServiceHandlersByReadOperationId ||
                        (this.__rawDataServiceHandlersByReadOperationId = new Map())
                    );
                },
            },
        });
    }
});


function CollectionChanges() {}
Object.defineProperties(CollectionChanges.prototype, {


    /***
     *  The ids of the Change Events recorded in this object
     *   @property {Set}
    ***/
    _trackedEventIds: {
        get: function () {
            return this.__trackedEventIds || (this.__trackedEventIds = new Set());
        }
    },

    /***
     *  The ordered changes for the tracked collection. The structure of each item in this array will change
     *  based on the type of collection being tracked. 
     * 
     * Array: 
     *  {
     *    index: integer
     *    addedValues: Array
     *    removedValues: Array
     *  }
     * 
     * Set: (no current use case)
     *  {
     *    addedValues: Set
     *    removedValues: Set
     *  }
     * 
     *  Map: (no current use case)
     *  {
     *    addedValues: Array -- [{key: key, value: value}]
     *    removedValues: Array
     *  }
     *   @property {Array}
    ***/
    changes: {
        get: function () {
            return this._changes || (this._changes = []);
        }
    },

    hasChanges: {
        get: function () {

            //FIXME: Use/test this._changes?.length > 0
            return this._changes && this._changes.length > 0;
        }
    },

    /***
     *  All values added to the collection
     *   @property {Set}
    ***/
    addedValues: {
        get: function () {
            return this._addedValues || (this._addedValues = new Set());
        }
    },

    /***
     *  Returns whether any values have been added or removed
     *   @property {Set}
    ***/
    hasAddedOrRemovedValues: {
        get: function () {
            //FIXME: Use/test this._changes?.length > 0
            return (this._addedValues && this._addedValues.size > 0) || (this._removedValues && this._removedValues.size > 0);
        }
    },

    /***
     *  All values removed from the collection
     *   @property {Set}
    ***/
    removedValues: {
        get: function () {
            return this._removedValues || (this._removedValues = new Set());
        }
    },

    /***
     *  Add an entry to the changes array for a given change event
     * 
     * This could be updated to:
     * - Add values to addedValues
     * - Add values to removedValues
     * - Check the type of the property to add an object with the correct structure to changes
    ***/
    trackChangeEvent: {
        value: function (changeEvent) {
            if (!this._trackedEventIds.has(changeEvent.id)) {
                this._trackedEventIds.add(changeEvent.id);
                this.changes.push({
                    index: changeEvent.index,
                    addedValues: changeEvent.addedValues,
                    removedValues: changeEvent.removedValues
                })
            }
        }
    }

})