const MuxDataService = require("./mux-data-service").MuxDataService,
    Montage = require('core/core').Montage,
    Promise = require("core/promise").Promise,
    CountedSet = require("core/counted-set").CountedSet,
    SyntaxInOrderIterator = require("core/frb/syntax-iterator").SyntaxInOrderIterator,
    DataOperation = require("../data-operation").DataOperation;


/**
* SynchronizationDataService 
*
* We're going to have 1 destinationDataService and n originDataServices
* In the case of a consolidation in one place, we're going to likely have all data coming from originDataServices
* persisred in the destinationDataService. But in the case of a cache, like in the browser, it can't be, so we'll need
* some merge / synchronization Criteria / Rules to fine tune this. For offline purpose, it might be desirable to expose these to the user for direct control vs 
* an arbitrary app-maker's decision, or at least adopt a learning approach. 
*
* @class
* @extends MuxDataService
*/
exports.SynchronizationDataService = class SynchronizationDataService extends MuxDataService {/** @lends SynchronizationDataService */

    static {

        Montage.defineProperties(this.prototype, {
            /*
                No syncing unless at least one of the child service canSaveData.
                It would be better to actually check that once we childServices are known
            */
            canSaveData: {
                value: true
            },
        
            /**
             * Provides a reference to the parent application.
             *
             * @property {Application} value
             * @default null
             */
            _destinationDataService: { value: null},
            _originDataServices: { value: null},
            _readOperationsPendingSynchronization: { value: null},
            __childDataServiceReadCompletionOperationByReadOperation: { value: null},
            __readEmptyHandedDataServicesByReadOperation: { value: null},
            __readEmptyHandedDataServicesByCreatedObjectsToSync: { value: null},
            __syncingObjectsCountedSet: { value: null}
        });
    }

    constructor() {
        super();

        return this;
    }

    get destinationDataService() {
        return this._destinationDataService;
    }
    set destinationDataService(value) {
        if(value !== this._destinationDataService) {

            // value.identifier = "destinationDataService";
            this.identifier = "SynchronizationDataService";
            // this.addEventListener(DataOperation.Type.ReadOperation, this, true);

            this.addEventListener(DataOperation.Type.ReadOperation, this, true);
            this.addEventListener(DataOperation.Type.ReadUpdateOperation, this, true);
            this.addEventListener(DataOperation.Type.ReadFailedOperation, this, true);
            this.addEventListener(DataOperation.Type.ReadCompletedOperation, this, true);

            //To prevent any ReadCompletedOperation from an origin service to make it out of the worker
            this.addEventListener(DataOperation.Type.ReadCompletedOperation, this, false);

            this._destinationDataService = value;
        }
    }

    serializeSelf(serializer) {

        super.serializeSelf(serializer);
        this._setPropertyWithDefaults(serializer, "destinationDataService", this.destinationDataService);
        this._setPropertyWithDefaults(serializer, "originDataServices", this.originDataServices);
    }


    deserializeSelf(deserializer) {


        var value;

        value = deserializer.getProperty("destinationDataService");
        if (value) {
            this.destinationDataService = value;
        }

        value = deserializer.getProperty("originDataServices");
        if (value) {
            this.originDataServices = value;
        }

        super.deserializeSelf(deserializer);

    }


    addChildService(child, types) {
        super.addChildService(child, types);

        if(this.originDataServices.has(child)) {
            child.delegate = this;
        }
    }


    get originDataServices() {
        return this._originDataServices;
    }

    set originDataServices(value) {
        if(this._originDataService !== value) {
            this._originDataServices = value;
        }
    }


    get readOperationsPendingSynchronization() {
        return this._readOperationsPendingSynchronization || (this._readOperationsPendingSynchronization = new Set());
    }


    get _readEmptyHandedDataServicesByReadOperation() {
        return this.__readEmptyHandedDataServicesByReadOperation || (this.__readEmptyHandedDataServicesByReadOperation = new Map());
    }

    get _readEmptyHandedDataServicesByCreatedObjectsToSync() {
        return this.__readEmptyHandedDataServicesByCreatedObjectsToSync || (this.__readEmptyHandedDataServicesByCreatedObjectsToSync = new Map());
    }


     get _syncingObjectsCountedSet() {
        return this.__syncingObjectsCountedSet  || (this.__syncingObjectsCountedSet = new CountedSet());
     }

     isSyncingObject(aDataObject) {
        return this._syncingObjectsCountedSet.has(aDataObject);
     }

    /**
     * Prefetches any object properties required to map the rawData property
     * and maps once the fetch is complete.
     *     *
     *
     * @method
     * @argument {DataOperation} emptyReadOperation   - A readCompletedOperation or a readFailedOperation
     */
    tryToSynchronizeEmptyHandedReadOperation(emptyReadOperation) {
        let readOperation = emptyReadOperation.referrer;

        this.readOperationsPendingSynchronization.add(readOperation);

        let readEmptyHandedDataServices = this._readEmptyHandedDataServicesByReadOperation.get(readOperation),
            syncCreatedObjecsByRawDataService,
            syncCreatedObjectSet;
            
        if(!readEmptyHandedDataServices) {
            readEmptyHandedDataServices = new Map();
            readEmptyHandedDataServices.set(emptyReadOperation.rawDataService, new Set());
            this._readEmptyHandedDataServicesByReadOperation.set(readOperation, readEmptyHandedDataServices)
        } else {
            syncCreatedObjectSet = readEmptyHandedDataServices.get(emptyReadOperation.rawDataService);
            if(!syncCreatedObjectSet) {
                readEmptyHandedDataServices.set(emptyReadOperation.rawDataService, new Set());
            }
        }
        
    }


    rawDataServiceWillHandleReadOperation(originDataService, readOperation) {
        console.log("<-> Service: rawDataService "+originDataService.identifier +" WillHandleReadOperation "+readOperation.id, readOperation);

        /*
            We try to see if we find the result within in our destination service's object store's originDataSnapshot
        */

        return new Promise((resolve, reject) => {
            /*
                Prefix properties in criteria
            */
            let readOperationCriteria = readOperation.criteria,
            originDataSnapshotCriteria = readOperationCriteria?.criteriaPrefixedWithExpression(`originDataSnapshot.${originDataService.identifier}`);

            //We need to create a new DataOperation()
            let originDataSnapshotReadOperation = new DataOperation();
            originDataSnapshotReadOperation.type = DataOperation.Type.ReadOperation;
            originDataSnapshotReadOperation.target = readOperation.target;
            originDataSnapshotReadOperation.identity = originDataSnapshotReadOperation.identity;
            originDataSnapshotReadOperation.data = originDataSnapshotReadOperation.data;
            originDataSnapshotReadOperation.criteria = originDataSnapshotCriteria;

            /*
                We probably can call handleReadOperation on our destinationService directy, which is setup to return  promise.
                If it finds something, then we stop propagation and return the originDataSapshot, since we're likely in a mapping
            */  
            this.destinationDataService.handleReadOperation(originDataSnapshotReadOperation)
            .then((resultOperation) => {
                console.log("<-> Service: rawDataService "+originDataService.identifier +" WillHandleReadOperation "+readOperation.id+" result:", resultOperation);

                //If data was found, it was dispatched back this.destinationDataService.handleReadOperation()
                if(resultOperation.type === DataOperation.Type.ReadCompletedOperation && (resultOperation.data !=- null || resultOperation.data?.length > 0)) {
                    //This will prevent originDataService to try to resume its handleReadOperation()
                    readOperation.preventDefault();
                }
            })
            .catch((error) => {
                reject(error);
            })
            .finally(() => {
                resolve(readOperation);
            });
        });

    }

    
    captureSynchronizationDataServiceReadOperation(readOperation) {
        let rawDataService = readOperation.hints?.rawDataService;

        /*
            If this is a query initiating from an originDataService, We want to evaluate it 
            in our destination data service to see if we already have it.
            To do so, we need to look into the query's type originDataSnapshot, which means prefixing 
            every property in the readOperation.criteria by "originDataSnapshot.${rawDataService.identifier}."" 
        */
        if(rawDataService && this.originDataServices.has(rawDataService) && rawDataService.handlesType(readOperation.target)) {
            console.log("<-> Service capture ReadOperation "+readOperation.id+" from "+rawDataService.identifier+" for "+readOperation.target.name+ " like "+ readOperation.criteria);

            /*
                composedPath is unique to the read operation, so we can mod it without side effects.
                We remove our destinationDataService so it doesn't get to handle this readOperation which it wouldn't be able to anyway.

                We're going to create a new operation and adapt the criteria to look into the originDataSnapshot instead
            */
            readOperation.composedPath().delete(this.destinationDataService);


            return new Promise((resolve, reject) => {
                /*
                    Prefix properties in criteria
                */
                let readOperationCriteria = readOperation.criteria,
                originDataSnapshotCriteria = readOperationCriteria.criteriaPrefixedWithExpression(`originDataSnapshot.${rawDataService.identifier}`);

                //We need to create a new DataOperation()
                let originDataSnapshotReadOperation = new DataOperation();
                originDataSnapshotReadOperation.type = DataOperation.Type.ReadOperation;
                originDataSnapshotReadOperation.target = readOperation.target;
                originDataSnapshotReadOperation.identity = readOperation.identity;
                originDataSnapshotReadOperation.data = readOperation.data;
                originDataSnapshotReadOperation.criteria = originDataSnapshotCriteria;

                /*
                    We probably can call handleReadOperation on our destinationService directy, which is setup to return  promise.
                    If it finds something, then we stop propagation and return the originDataSapshot, since we're likely in a mapping
                */  
                console.log("<-> Service destinationDataService handle[modified]ReadOperation "+originDataSnapshotReadOperation.id+" from "+rawDataService.identifier+", for "+readOperation.target.name+ " like "+ readOperation.criteria);

                this.destinationDataService.handleReadOperation(originDataSnapshotReadOperation)
                .then((resultOperation) => {

                    //If data is found, we let it retur, it should?
                    if(resultOperation.type === DataOperation.Type.ReadCompletedOperation && (resultOperation.data !=- null || resultOperation.data?.length > 0)) {
                        console.log("<-> Service result found for readOperation "+originDataSnapshotReadOperation.id+" from "+readOperation.identifier+" for "+readOperation.target.name+ " like "+ readOperation.criteria);

                        readOperation.stopImmediatePropagation();
                        resolve(resultOperation);
                    } else {

                        console.log("<-> Service result NOT FOUND for readOperation "+originDataSnapshotReadOperation.id+" from "+readOperation.identifier+" for "+readOperation.target.name+ " like "+ readOperation.criteria);

                        /*
                            Nothing found, we remove our destination service from the composedPath 
                            and we let readOperation continue so it reaches the rawDataService origin data service.
                        */
                        resolve(null);
                    }

                })
                .catch((error) => {
                    reject(error);
                });
            });
          

        }
    }

    captureSynchronizationDataServiceReadUpdateOperation(readUpdateOperation) {
        //console.log("captureSynchronizationDataServiceReadUpdateOperation "+readUpdateOperation.id, readUpdateOperation);
    }


    /**
     * Called by a rawDataService with a mapping before doing it's mapping work, giving the delegate 
     * an opportunity to intervene.
     * 
     * @method
     * @argument {RawDataService} rawDataService - the rawDataService involved.
     * @argument {DataMapping} mapping - A DataMapping object handling the mapping.
     * @argument {Object} rawData - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} dataObject - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    rawDataServiceMappingWillMapRawDataToObject(rawDataService, mapping, rawData, dataObject, context, readExpressions) {
        console.log("rawDataServiceMappingWillMapRawDataToObject(...)");
    }

    /**
     * Called by a rawDataService before its mapping starts the mapping work for a property
     *
     * Subclasses should override this method to influence how are properties of
     * the raw mapped data to data objects:
     *
     * @method
     * @argument {RawDataService} rawDataService - the rawDataService involved.
     * @argument {Object} mapping - A DataMapping object handling the mapping.
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
    rawDataServiceMappingWillMapRawDataToObjectProperty(rawDataService, mapping, rawData, dataObject, propertyName, context, mappingScope) {
        //console.log("rawDataServiceMappingWillMapRawDataToObjectProperty(...)");
    }
    
    /**
     * Called by a rawDataService after its mapping completed the mapping work for a property
     *
     * Subclasses should override this method to influence how are properties of
     * the raw mapped data to data objects:
     *
     * @method
     * @argument {RawDataService} rawDataService - the rawDataService involved.
     * @argument {Object} mapping - A DataMapping object handling the mapping.
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
    rawDataServiceMappingDidMapRawDataToObjectPropertyValue(rawDataService, mapping, rawData, dataObject, propertyName, propertyValue, context, mappingScope) {
        
        if(this.isSyncingObject(dataObject)) {
            //Make sure we register the change
            if(!this.mainService.isObjectCreated(dataObject)) {
                this.mainService.registerChangedDataObject(dataObject);
            }
            this.mainService.changesForDataObject(dataObject).set(propertyName, propertyValue);
        }
        //Here we need to make sure that this is registered by the main service as a change, 
        // which is obviously not the default when objects are mapped when fetched
        //console.log("rawDataServiceMappingDidMapRawDataToObjectPropertyValue("+propertyName+")");
    }


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

    resolveObjectForTypeRawData(type, rawData, context) {
        let superValue = super.resolveObjectForTypeRawData(type, rawData, context);

        return superValue;

    }    


    _syncObjectDescriptorRawDataFromReadCompletedOperation(objectDescriptor, rawData, readCompletedOperation, readEmptyHandedDataServices, readEmptyHandedDataServicesByCreatedObjectsToSync) {
        if(objectDescriptor.name === "Task") {
            console.log("sync "+objectDescriptor.name+" rawData: ", rawData);
        }

        let rawDataService = readCompletedOperation.rawDataService,
            //We might want to ask the delegate his take on what readExpressions to use 
            readExpressions = (readCompletedOperation.referrer.target === readCompletedOperation.target) ? readCompletedOperation.referrer?.data?.readExpressions : null,
            //readExpressions = readCompletedOperation.,referrer?.data?.readExpressions,
            dataIdentifier = rawDataService.dataIdentifierForTypeRawData(objectDescriptor,  rawData);

        rawDataService.recordSnapshot(dataIdentifier,  rawData);

        //We get, if it's been created before, or create a brand new object
        let dataObject = rawDataService.getDataObject(objectDescriptor, rawData, dataIdentifier, readCompletedOperation);

        this._syncingObjectsCountedSet.add(dataObject);
        //let dataObject = this.mainService.createDataObject(objectDescriptor);
        /*
            Because we trigger the creation and we forward dataIdentifier creation to our destinationDataService,
            of which we aren't a delegate, our rawDataServiceDidCreateObject() isn't called, so we need to do it here:
        */
        this.mainService.registerCreatedDataObject(dataObject);

        /*
            We make sure we register the created object in the origin service with his natural dataIdentifier
        */
        rawDataService.registerUniqueObjectWithDataIdentifier(dataObject, dataIdentifier);


        // mappedObjects.push(dataObject);


        /*
            We're syncing, so we need to grab as much data as we can if we have no guidelines
        */
        if(!readExpressions) {
            let mapping = this.destinationDataService.mappingForObject(dataObject);

            readExpressions = Object.keys(mapping.objectMappingRules);
        }

        //We ask the fetching rawDataService to do the mapping
        /*
            TODO: while we have a snapshot - which we typically don't have for created objects, but this could be considered
            a merge, we could ask the delegate if there are some specific properties it wishes to have mapped on top of default
            ones
        */
        if(this.delegate?.synchronizationDataServiceWillMapRawDataToObjectFromDataOperationWithReadExpressions) {
            let delegateReadExpressions = this.delegate.synchronizationDataServiceWillMapRawDataToObjectFromDataOperationWithReadExpressions(this, rawData, dataObject, readCompletedOperation, readExpressions)
            if((!readExpressions && delegateReadExpressions) || (readExpressions && delegateReadExpressions)) {
                readExpressions = delegateReadExpressions;
            }
        }

        let originRawDataService = rawDataService;

        /*
            We need to make sure our destinationDataService isn't trying to resolve the read operations
            created by the process of mapRawDataToObject() which can fetch relationships and therefor issue readOperations
            for ObjectDescriptors our destinationDataService handles as well. 

            We don't want our destinationDataService to handle readOperations just related to mapping that object.
            We could addEventLitener and in there hijack the distribution, and target directly the originRawDataService involved.
            But some relationships may be resolved via other origin services that needs to receive it.

            What we can do is while this._objectsBeingMapped contains object, temporarily change the composedPath of readOperations to remove the .
        */
    //    let mappingReadOperationListener = (readOperation) => {
    //         //console.debug("readOperation: ", readOperation);
    //         //composedPath is unique to the read operation, so we can mod it without side effects
    //         let composedPath = readOperation.composedPath();

    //         //Remove our destinationDataService so it doesn't get to handle this readOperation
    //         /*
    //             Let's disable to see what happens: when fetching objecs that are created by a creation data service, 
    //             we end up creating more new ones via the the creation data service instead of fetching the ones we saved before...

    //             TWEAKING. If there's no sign of a originDataSnapshot, there's no way our destinationDataService can find anything
    //         */
    //         if(!readOperation.hints?.originDataSnapshot) {
    //             composedPath.delete(this.destinationDataService);
    //         }
    //    }
    //    this.addEventListener(DataOperation.Type.ReadOperation, mappingReadOperationListener, true);

        return rawDataService.mapRawDataToObject(rawData, dataObject, readCompletedOperation, readExpressions)
        .then((value) => {

            //cleanup:
            //this.removeEventListener(DataOperation.Type.ReadOperation, mappingReadOperationListener, true);


            // //We need to wait until mapping is done for setting originDataSnapshot to trigger a change event that will register this property as changed
            // //Set originDataSnapshot:
            /*
                FIXME: We can't create an object rule mapping for originDataSnapshot if it involves nested/map{} expressions
                because those get bypassed by the one-level checking for requirements in 
                expression-data-mapping.js    _mapRawDataPropertiesToObject: {...} line 950 on (as of this writing)

            */
            if(!dataObject.originDataSnapshot) {
                let originDataSnapshot = {}
                dataObject.originDataSnapshot = originDataSnapshot;
                /*
                    If rawData has an originDataSnapshot, which can be created by FetchResourceDataMapping, we use it
                */
                originDataSnapshot[rawDataService.identifier] = rawData.originDataSnapshot ?? rawData;    
            }

            /*
                One more things: We've mapped the object fetched, but we may also know it was fetched to resolve the property of a source object.
                Establishing that relationship here is important to capture that relationship in our DestinationDataService.

                1. Create the object from the type / primary key.
                2. assign/add the dataObject value to the appropriate property

                SOME WORK WILL MIGHT NEEDED WHEN WE EXPAND TO MORE THAN ONE FETCHED EXPRESSION
            */
            if(readCompletedOperation?.referrer?.data?.readExpressions?.length === 1) {
                let sourceObjectDescriptor = readCompletedOperation.referrer.target,
                    sourceObjectCriteria = readCompletedOperation.referrer.criteria,
                    sourceObjectCriteriaParameters = sourceObjectCriteria.parameters,
                    fetchedPropertyName = readCompletedOperation?.referrer?.data?.readExpressions[0],
                    sourceObjectDescriptorMapping = this.destinationDataService.mappingForObjectDescriptor(sourceObjectDescriptor),
                    sourceObjectDescriptorMappingRawDataPrimaryKeys = sourceObjectDescriptorMapping.rawDataPrimaryKeys,
                    sourceObjectSnapshot = readCompletedOperation?.referrer?.hints?.snapshot,
                    sourceObjectDataIdentifier,
                    sourceObjectPromise,
                    sourceObject;
                 
                //The sourceObjectCriteriaParameters if there (vs the property / value embedded in the criteria's syntax) has to be the primary key
                if(sourceObjectCriteriaParameters) {
                    sourceObjectPromise = this.destinationDataService.resolveObjectForTypeRawData(sourceObjectDescriptor, sourceObjectCriteriaParameters);
                    // sourceObjectDataIdentifier = this.destinationDataService.dataIdentifierForTypeRawData(sourceObjectDescriptor, parameters, readCompletedOperation.referrer)
                }
                else {
                    if(!sourceObjectSnapshot) {
                        sourceObjectSnapshot = {};
                        //We need to extract the primary key from the criteria
                        let parameters = sourceObjectCriteria.parameters;
                        for(let i=0, countI = sourceObjectDescriptorMappingRawDataPrimaryKeys.length, iPrimaryKeyExpression, iPrimaryKeyExpressionValue; (i<countI); i++) {
                            iPrimaryKeyExpression = sourceObjectDescriptorMappingRawDataPrimaryKeys[i];
                            //Borrow valueForExpression to dataObject
                            iPrimaryKeyExpressionValue = dataObject.valueForExpression.call(parameters, iPrimaryKeyExpression);
                            sourceObjectSnapshot[iPrimaryKeyExpression] = iPrimaryKeyExpressionValue;
                        }
                        sourceObjectPromise = this.destinationDataService.resolveObjectForTypeRawData(sourceObjectDescriptor, sourceObjectSnapshot);
                    } else {
                        sourceObjectPromise = this.destinationDataService.resolveObjectForTypeRawData(sourceObjectDescriptor, sourceObjectSnapshot);
                    }
                }

                //2. assign/add the dataObject value to the appropriate property

                return sourceObjectPromise.then((sourceObject) => {
                    /*
                        We make sure we register the created object in the origin service with his natural dataIdentifier
                    */
                    //Added to resolveObjectForTypeRawData() to avoid doing that "manually" here
                    //rawDataService.registerUniqueObjectWithDataIdentifier(dataObject, dataIdentifier);

                    let propertyDescriptor = sourceObjectDescriptor.propertyDescriptorNamed(fetchedPropertyName);

                    if(propertyDescriptor.cardinality === 1) {
                        sourceObject[fetchedPropertyName] = dataObject;
                    } else {
                        if(propertyDescriptor.valueType == "array" || propertyDescriptor.collectionValueType == "array" || propertyDescriptor.collectionValueType == "list" ) {
                            //Problematic: the line bellow triggers a fetch of fetchedPropertyName on sourceObject...
                            //sourceObject[fetchedPropertyName].push(dataObject);

                            let fetchedPropertyNameValue = Object.getPropertyDescriptor(sourceObject,fetchedPropertyName).get.call(sourceObject, /*shouldFetch*/false);
                            if(fetchedPropertyNameValue) {
                                fetchedPropertyNameValue.push(dataObject);
                            } else {
                                console.error("Couldn't update property '"+fetchedPropertyName+"' on sourceObject described by "+sourceObject.objectDescriptor.name+" because fetchedPropertyNameValue is "+ fetchedPropertyNameValue);
                            }
                        } else {
                            throw "Handling of to-many for property "+propertyDescriptor.name+" of "+sourceObjectDescriptor.name+" is not implemented (range? set? map?) "
                        }
                    }

                    return value;
                });
                
            } else {
                return Promise.resolve(value);
            }
        })
        .then((value) => {



            if(this.delegate?.synchronizationDataServiceDidMapRawDataToObjectFromDataOperationWithReadExpressions) {
                this.delegate.synchronizationDataServiceDidMapRawDataToObjectFromDataOperationWithReadExpressions(this, rawData, dataObject, readCompletedOperation, readExpressions)
            }    

            //When we sync "top" read operations
            if(readEmptyHandedDataServices) {
                //Register objects being synced to RawDataService that failed to fetch it
                for (const aRawDataService of readEmptyHandedDataServices.keys()) {
                    let readEmptyHandedDataServices = readEmptyHandedDataServicesByCreatedObjectsToSync.get(dataObject);
                    if(!readEmptyHandedDataServices) {
                        readEmptyHandedDataServicesByCreatedObjectsToSync.set(dataObject, [aRawDataService]);
                    } else {
                        readEmptyHandedDataServices.push(aRawDataService);
                    }
                }
            }


            if(dataObject.objectDescriptor.name === "Task") {
                console.log("\n\n\############# Task "+dataObject.dataIdentifier+" originId: "+JSON.stringify(dataObject.originId)+" "+dataObject.description+" "+dataObject.associatedTools.length+" associatedTools: ["+dataObject.associatedTools.map((value) => value?.description)+"], "+rawData.tools.length+" rawData.tools: " + rawData.tools.map((value) => value?.description)+"\n\n")
            }

            return value;


        })
        .catch((error) => {
            throw error;
        })
        .finally(() => {
            //cleanup:
            this._syncingObjectsCountedSet.delete(dataObject);

            //this.removeEventListener(DataOperation.Type.ReadOperation, mappingReadOperationListener, true);
        });

    }

    /**
     * Called by one of SynchronizationDataService's originDataServices as part of the regular process 
     * of fetching objects. This is the opportunity for SynchronizationDataService to override the originDataSercice's
     * issued dataIdentifier built off that originDataService's primaryKey and replace it by one from the 
     * destinationDataService.
     * 
     * Right now, we're only letting originDataSercices fetch when we don't have data indestinationDataService, 
     * not yet to attempt to find out if there are updates in originDataSercices.
     * 
     * TODO: WHEN WE DO: We'll have to check if destinationDataService has a record for the primary key 
     * in dataObject.dataIdentifier in the row's originDataSnapshot
     *
     * @method
     * @argument {RawDataService} rawDataService - the rawDataService involved.
     * @argument {ObjectDescriptor} objectDescriptor - The Object Descriptor for the Data Object being created.
     */
    dataIdentifierForRawDataServiceCreatingObjectWithDataIdentifier(rawDataService, dataIdentifier) {
        return this.destinationDataService.dataIdentifierForNewObjectWithObjectDescriptor(dataIdentifier.objectDescriptor);
    }

    dataIdentifierForNewObjectWithObjectDescriptor(objectDescriptor) {
        return this.destinationDataService.dataIdentifierForNewObjectWithObjectDescriptor(objectDescriptor);
    }


    /**
     * Called by one of SynchronizationDataService's originDataSercices.
     * OriginDataServices only create data objects when mapping sub-properties of a 
     * root object that the SynchronizationDataService is creating or updating.
     * 
     * But some of these objects could already been existing...
     * 
     * The SynchronizationDataService needs to make those object considered as created, 
     * so it can be saved in the destination service, if they are truly new, but leave them as-is
     * if they already exist.
     * 
     * Since Workers are stateless, unless we have a local snpapshot showing it was fetched,
     * the only way to be sure is to fetch with a criteria involving the originDataSnapshot
     * 
     * Unless it can be hanlded throw an insert ON CONFLICT / DO NOTHING RETURNING / DO UPDATE SET ...
     *
     * @method
     * @argument {RawDataService} rawDataService - the rawDataService involved.
     * @argument {Object} object - A Data Object just created.
     */
    rawDataServiceDidCreateObject(rawDataService, object) {
        //console.log("rawDataServiceDidCreateObject() ["+object.objectDescriptor.name+"] ", object);
        this.mainService.registerCreatedDataObject(object);

        //Now register the object by it's destinationDataService-issued dataIdentifier as well
        this.mainService.recordObjectForDataIdentifier(object, this.destinationDataService.dataIdentifierForNewObjectWithObjectDescriptor(object.objectDescriptor));
    
    }


    rawDataServiceMappingRawDataToObjectDidComplete(rawDataService, mapping, rawData, dataObject, context, mappedProperties) {
        //console.log("rawDataServiceMappingRawDataToObjectDidComplete() ["+ dataObject.objectDescriptor.name+"] rawData: ", rawData, " dataObject: ", dataObject);

        //We need to wait until mapping is done for setting originDataSnapshot to trigger a change event that will register this property as changed
        //Set originDataSnapshot:
        //Check if it's there without triggering a fetch for it. WE GOT TO MAKE THAT EASIER THAN BORROWING THE GETTER THAT WAY...
        //if(!dataObject.originDataSnapshot) {
        if(!Object.getPropertyDescriptor(dataObject,"originDataSnapshot")?.get?.call(dataObject, /*shouldFetch*/false)) {
            let originDataSnapshot = {}
            dataObject.originDataSnapshot = originDataSnapshot;
            /*
                If rawData has an originDataSnapshot, which can be created by FetchResourceDataMapping, we use it
            */
            originDataSnapshot[rawDataService.identifier] = rawData.originDataSnapshot ?? rawData;    
        }

        if(this.delegate?.synchronizationDataServiceDidMapRawDataPropertiesToObjectFromDataOperation) {
            this.delegate.synchronizationDataServiceDidMapRawDataPropertiesToObjectFromDataOperation(this, rawData, mappedProperties, dataObject, context)
        }    

    }

    /*
        When we're involved in creating dataIdentifiers, it's always helping our destinationDataService
    */
    dataIdentifierForTypeRawData(type, rawData, dataOperation) {
        return this.destinationDataService.dataIdentifierForTypeRawData(type, rawData, dataOperation);
    }


    captureSynchronizationDataServiceReadCompletedOperation(readCompletedOperation) {

        //Ideally we shouldn't have that, remove the noise
        if(readCompletedOperation.rawDataService === this) return;

        console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+" from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria+": ", readCompletedOperation.data);

        //Record the read completion from that service:
        this.registerChildDataServiceReadCompletionOperation(readCompletedOperation);

        /*
            Wether it's a readCompletedOperation to a top level readOperation we know about, 
            or if it's one from a subgraph of that being synced, as coming from an originDataService, we try to sync
        */
        if(/*(readCompletedOperation.rawDataService !== this.destinationDataService) ||*/ (this.readOperationsPendingSynchronization.has(readCompletedOperation.referrer) && readCompletedOperation.data?.length)) {
            console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+": REGISTERED from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);

            /*
                A read from another data service failed to return data, and now we have another one did
                We got some work to Sync!

                To do so, we'll have to convert those data into objects created into the main service and do a saveChanges.
                IF the raw data service that provided the data could save, it would have to assess the save by looking at those objects
                and use the originId to compare with its snapshot and realize there's no change and it should be a no-op with existing implementation
            */
                /*
                    If the readCompletedOperation returns result for the type that was requested, we pay attention to readExpressions
                    But if it was a read operation for a type with a readExpression being a relationship to another type,
                    then we get data of that type, and readExpression won't match
                */
            let readExpressions = (readCompletedOperation.referrer.target === readCompletedOperation.target) ? readCompletedOperation.referrer?.data?.readExpressions : null,
                rawData = readCompletedOperation.data,
                iDataIdentifier,
                rawDataService = readCompletedOperation.rawDataService,
                mainService = this.mainService,
                objectDescriptor = readCompletedOperation.target,
                i=0, countI = rawData.length,
                mappingPromises,
                mappedObjects = [],
                iObject,
                mappingPromise,
                iMappingResult,
                readEmptyHandedDataServices = this._readEmptyHandedDataServicesByReadOperation.get(readCompletedOperation.referrer),
                readEmptyHandedDataServicesByCreatedObjectsToSync = this._readEmptyHandedDataServicesByCreatedObjectsToSync;

            for (; i <  countI; i++) {
                // console.log("rawData["+i+"] == ", rawData[i]);

                // iDataIdentifier = rawDataService.dataIdentifierForTypeRawData(objectDescriptor,  rawData[i]);
                // rawDataService.recordSnapshot(iDataIdentifier,  rawData[i]);

                // //We create a brand new object
                // iObject = mainService.createDataObject(objectDescriptor);
                // mappedObjects.push(iObject);

                // //We ask the fetching rawDataService to do the mapping
                // /*
                //     TODO: while we have a snapshot - which we typically don't have for created objects, but this could be considered
                //     a merge, we could ask the delegate if there are some specific properties it wishes to have mapped on top of default
                //     ones
                // */
                // if(this.delegate?.synchronizationDataServiceWillMapRawDataToObjectFromDataOperationWithReadExpressions) {
                //     let delegateReadExpressions = this.delegate.synchronizationDataServiceWillMapRawDataToObjectFromDataOperationWithReadExpressions(this, rawData[i], iObject, readCompletedOperation, readExpressions)
                //     if((!readExpressions && delegateReadExpressions) || (readExpressions && delegateReadExpressions)) {
                //         readExpressions = delegateReadExpressions;
                //     }
                // }
                // iMappingResult = rawDataService.mapRawDataToObject(rawData[i], iObject, readCompletedOperation, readExpressions);

                // //Set originDataSnapshot:
                // iObject.originDataSnapshot = rawData[i];

                if( rawData[i]) {
                    console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+": _syncObjectDescriptorRawDataFromReadCompletedOperation from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);

                    iMappingResult = this._syncObjectDescriptorRawDataFromReadCompletedOperation(objectDescriptor, rawData[i], readCompletedOperation, readEmptyHandedDataServices, readEmptyHandedDataServicesByCreatedObjectsToSync);

                    if (Promise.is(iMappingResult)) {
                        (mappingPromises || (mappingPromises = [])).push(iMappingResult);
                    } else {
                        console.log("We shouldn't be here");
                    } 
                }

                // //Register objects being synced to RawDataService that failed to fetch it
                // for (const aRawDataService of readEmptyHandedDataServices.keys()) {
                //     let readEmptyHandedDataServices = readEmptyHandedDataServicesByCreatedObjectsToSync.get(iObject);
                //     if(!readEmptyHandedDataServices) {
                //         readEmptyHandedDataServicesByCreatedObjectsToSync.set(iObject, [aRawDataService]);
                //     } else {
                //         readEmptyHandedDataServices.push(aRawDataService);
                //     }
                // }
            }

            /*
                We got this, so we need to stop the origin service's readCompletedOperation from being dispatched.
                Since our processing is async, if we were to stopPropagation() we're done with our async stuff,
                the readCompletedOperation will have already been dispatched, so we have to do it now.
            */
            //readCompletedOperation.stopPropagation();
            readCompletedOperation.stopImmediatePropagation();
                

            mappingPromise = mappingPromises 
                ? Promise.all(mappingPromises)
                : Promise.resolve(mappedObjects);
            
            return mappingPromise.then((values) => {

                console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+": _syncObjectDescriptorRawDataFromReadCompletedOperation COMPLETED from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria + ", values:",values);

                let fetchedObjects = values,
                    promise;
                if(this.delegate?.synchronizationDataServiceWillSaveChanges) {
                    promise = this.delegate.synchronizationDataServiceWillSaveChanges(this, fetchedObjects);
                } else {
                    promise = Promise.resolve(fetchedObjects);
                }

                //Now that all is done, we're saving:
                return promise.then( () => {

                    console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+": saving changes from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);

                    /*
                        one more thing: if it's a readOperation for a relationship, we need to make sure the join actually happens.
                        We need to grab info from the the read expression, create the object it represent, then set the relationship
                        we just got data from
                    */
                //    if(readCompletedOperation?.referrer?.data?.readExpressions?.length > 0) {
                //         let readOperation = readCompletedOperation.referrer,
                //             objectDescriptorBeingRead = readOperation.target,
                            
                //             //#WARNING: We're still assuming there's only 1 readExpressions at a time, for now
                //             propertyDescriptor = objectDescriptorBeingRead.propertyDescriptorNamed(readOperation.data.readExpressions[0]),
                //             /*
                //                 Uneasy about that one, it assumes that the client's mapping is from our destinationService, which is the only way used so far.
                //             */
                //             objectBeingReadRawData = readOperation.criteria.parameters,
                //             objectBeingReadDataIdentifier = this.destinationDataService.dataIdentifierForTypeRawData(objectDescriptorBeingRead, objectBeingReadRawData, readOperation),
                //             objectBeingRead = this.objectForTypeRawData(objectDescriptorBeingRead, objectBeingReadRawData, objectBeingReadDataIdentifier, readOperation);

                //             /*
                //                 WARNING: SHORTCUT. Let's test an assumed property before we evaluate as an expression, 
                //                 which could lead to other derivative fetches and might need to adapt the logical flow to do so
                //             */
                //             //objectBeingRead[readOperation.data.readExpressions[0]] = fetchedObjects[0][readOperation.data.readExpressions[0]];
                //             //We need to pay attention to cardinality:
                //             if(propertyDescriptor.cardinality === 1) {
                //                 objectBeingRead[readOperation.data.readExpressions[0]] = fetchedObjects[0];
                //             } else {
                //                 if(propertyDescriptor.valueType == "array" || propertyDescriptor.collectionValueType == "array" || propertyDescriptor.collectionValueType == "list" ) {
                //                     //Do we have to worry about duplicates here?
                //                     //objectBeingRead[readOperation.data.readExpressions[0]] = fetchedObjects[0];
                //                     objectBeingRead[readOperation.data.readExpressions[0]].addEach(fetchedObjects);
                //                 } else {
                //                     throw "Handling of to-many for property "+propertyDescriptor.name+" of "+sourceObjectDescriptor.name+" is not implemented (range? set? map?) "
                //                 }
                //             }
    
                //             objectBeingRead[readOperation.data.readExpressions[0]] = fetchedObjects;

                //    }

                    return mainService.saveChanges()
                        .then((transaction) => {

                            console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+": changes SAVED from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);

                            let createdDataObjects = transaction.createdDataObjects;

                            return fetchedObjects;
                        })
                    });
            })
            .then((fetchedObjects) => {
                // let createdDataObjects = transaction.createdDataObjects;
                    let destinationDataServiceRawData = [];
                    
                // if(createdDataObjects) {

                //     createdDataObjects.forEach((objectDescriptorCreatedObjects) => {
                //         // let objectDescriptorCreatedObjects = createdDataObjects.get(objectDescriptor);
                //         objectDescriptorCreatedObjects.forEach((value) => {
                //             destinationDataServiceRawData.push(this.destinationDataService.snapshotForObject(value));
                //         });
                //     });
                // }

                for(let i=0, countI=fetchedObjects.length; (i<countI); i++) {
                    destinationDataServiceRawData.push(this.destinationDataService.snapshotForObject(fetchedObjects[i]));
                }

                console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+": SNAPSHPOT GATHERED from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);

                console.log(destinationDataServiceRawData);


                /*
                    Clean-up before we dispatch so we don't end up here in captureSynchronizationDataServiceReadCompletedOperation() 
                    again amd attempt to sync things again
                */
                this.readOperationsPendingSynchronization.delete(readCompletedOperation.referrer);

                /*
                    And dispatch a new operation. The last argument means that the target should be of the type of objects returned
                    Not the one that asked for it (readOperation.target)
                */
                let responseOperation = this.destinationDataService.responseOperationForReadOperation(readCompletedOperation.referrer, null, destinationDataServiceRawData, false /*isNotLast*/, readCompletedOperation.target/*responseOperationTarget*/);
                responseOperation.target.dispatchEvent(responseOperation);

                console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+": dispatchEvent responseOperation COMPLETED from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);


                /*
                    Now that we have an found data from one of our childDataServices, created new objects and saved it in our destinationDataService,
                    we're pretty much done, we just nneed to return their snapshot to the client in a read completed operation.
                */
                return destinationDataServiceRawData;

            })
            .catch((error) => {
                console.log("<-> Service failed to sync objects ",mappedObjects," with error: ", error);
                let responseOperation = this.responseOperationForReadOperation(readCompletedOperation.referrer, error, null, false /*isNotLast*/, readCompletedOperation.target/*responseOperationTarget*/);
                responseOperation.target.dispatchEvent(responseOperation);
                return null;
            });


        } else if(readCompletedOperation.data == null || (Array.isArray(readCompletedOperation.data) && readCompletedOperation.data.length === 0 )) {
            console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+": NO DATA FOUND  from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name+ (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);

            // console.debug("No Data Found. Do we check of the rawDataService is an originDataService?")
            /* 
                In this case, we may have the structure created, but it's empty as we couldn't find anything, which can happen
                if the creation was done by one client, while another attenpt to read. 

                Unless readCompletedOperation.rawDataService was the last to handle the readOperation, we flag it. 

                Otherwise, we're done. No data were found, anywhere, we let the readCompoletedOperation distribution run it's course
                to the client
            */
           if(!this.didAllChildServicesCompletedReadOperation(readCompletedOperation.referrer)) {
                console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+": TRY TO SYNC from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);

                //Register what we need to reconciliate with the OG readOperation from client
                this.tryToSynchronizeEmptyHandedReadOperation(readCompletedOperation);

                //We don't want the client to know about this still intermediary result:
                //readCompletedOperation.stopPropagation();
                readCompletedOperation.stopImmediatePropagation();
                

                /*
                    Now that we have a formal approach to the pattern, let's have other origin services
                    take what they need from the readOperation to perform it.

                    That way, the sync service can stay agnostic of their specifics. 
                */
                ////We don't want the origin data services to get this readOperation as it won't match their schema 
                //readCompletedOperation.referrer.stopImmediatePropagation();

                //fetchOriginDataForReadOperation
                //this.fetchOriginDataForReadOperation(readCompletedOperation.referrer);

           } else {
            /*
                Neither our destination service nor any origin data services found something, we let the latest return empty handed to the client
                But it is from an origin data service. Should we tweak it even though the rawDataService property is stripped before being delivered
                to client?
            */
                console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+" CLEANUP from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") +" like "+ readCompletedOperation.referrer.criteria);
                this.unregisterReadOperation(readCompletedOperation.referrer);    
           }

        } else if(this.didAllChildServicesCompletedReadOperation(readCompletedOperation.referrer)) {
            /*
                No readOperationsPendingSynchronization pending, all childServices completed their read
                Cleanup time
            */
            console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+" CLEANUP from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") +" like "+ readCompletedOperation.referrer.criteria);
            this.unregisterReadOperation(readCompletedOperation.referrer);
        } else if(readCompletedOperation.rawDataService === this.destinationDataService) {

            /*
                We got involved, so we need to be the only one that feed those data to an eventual data stream.
                So we handle it and stop propagation so it doesn't reach the origin and destination services.
            */
            /*
                Data found!! We prevent the origin services to act on it
                In the future if one would want to do so for fetching update
                We'd have to introduce some subtlety here
            */
            // if(readCompletedOperation.referrer.target.name === "Workstation" && readCompletedOperation.referrer.data.readExpressions[0] === "parent") {
                console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+" !!! stopImmediatePropagation from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id +", for "+readCompletedOperation.referrer.target.name+ (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);
            // }
    
            readCompletedOperation.referrer.stopImmediatePropagation();
        } else {
            console.log("<-> Service capture ReadCompletedOperation "+readCompletedOperation.id+" ELSE from "+readCompletedOperation.rawDataService.identifier+", referrer "+readCompletedOperation.referrer.id+", for "+readCompletedOperation.referrer.target.name + (readCompletedOperation.referrer?.data?.readExpressions? (" "+readCompletedOperation.referrer?.data?.readExpressions) : "") + " like "+ readCompletedOperation.referrer.criteria);
        }
    }

    // handleSynchronizationDataServiceReadCompletedOperation(readCompletedOperation) {

    //     if(readCompletedOperation.rawDataService !== this && readCompletedOperation.rawDataService !== this.destinationDataService) {
    //         //Temporary solution to prevent OperationCoordinator to send readCompletedOperation from originDataServices back to client
    //         if(readCompletedOperation.clientId) {
    //             console.log("<-> Service handle ReadCompletedOperation "+ readCompletedOperation.id+" with referrer readOperation " + readCompletedOperation.referrer.id +" prevents it to reach client");

    //             readCompletedOperation.clientId = null;
    //         }
    //     }

    // }


    handleReadCompletedOperation (operation) {
        //console.warn("<-> Service handle ReadCompletedOperation is #WARNING Neutralized #WARNING for "+operation.id+" from "+operation.rawDataService.identifier+", referrer "+operation.referrer.id+", for "+operation.referrer.target.name + (operation.referrer?.data?.readExpressions? (" "+operation.referrer?.data?.readExpressions) : "") + " like "+ operation.referrer.criteria);
    }

    fetchOriginDataForReadOperation(readOperation) {
        /*
            The client does a mainService.fetchObjectProperty(), wich ends up being a fetch for the valueDescriptor of that property.
            That means that we first need the originDataSnapshot of the source... 
        */

        /*
            1. Get the originDataSnapshot. We could find a way to have it sent
        */
       //console.debug("get the originDataSnapshot");

    }



    didAllChildServicesCompletedReadOperation(aReadOperation) {
        return  this.readCompletionOperationByChildDataServiceForReadOperation(aReadOperation).size === this.childServicesForType(aReadOperation.target).length
    }

    get _childDataServiceReadCompletionOperationByReadOperation() {
        return this.__childDataServiceReadCompletionOperationByReadOperation || (this.__childDataServiceReadCompletionOperationByReadOperation = new Map());
    }

    readCompletionOperationByChildDataServiceForReadOperation(aReadOperation) {
        let result;
        return this._childDataServiceReadCompletionOperationByReadOperation.get(aReadOperation) || (this._childDataServiceReadCompletionOperationByReadOperation.set(aReadOperation, (result = new Map())) && result);
    }

    registerChildDataServiceReadCompletionOperation(aReadCompletionOperation) {
        let readCompletionOperationByChildDataService = this.readCompletionOperationByChildDataServiceForReadOperation(aReadCompletionOperation.referrer);
        readCompletionOperationByChildDataService.set(aReadCompletionOperation.rawDataService, aReadCompletionOperation);
    }

    unregisterReadOperation(aReadOperation) {
        this._childDataServiceReadCompletionOperationByReadOperation.delete(aReadOperation);
    }

    captureSynchronizationDataServiceReadFailedOperation(readFailedOperation) {

    /*
        '2 UNKNOWN: Getting metadata from plugin failed with error: {"error":"invalid_grant","error_description":"reauth related error (invalid_rapt)","error_uri":"https://support.google.com/a/answer/9368756","error_subtype":"invalid_rapt"}'

        ->>>>> That's an auth problem
    */

    /*
        'relation "mod_plum_v1.Factory" does not exist'

        That can mean that either mod_plum_v1 - the DB doesn't exist, or Factory doesn't exist in mod_plum_v1. 
    */
    if(readFailedOperation.rawDataService === this) {
        //We gave up, and reporting the fail ourselves
        return;
    }

        console.log("captureSynchronizationDataServiceReadFailedOperation: ", readFailedOperation);

        if((readFailedOperation.data.name === DataOperationErrorNames.DatabaseMissing) || 
        (readFailedOperation.data.name === DataOperationErrorNames.ObjectDescriptorStoreMissing) ) {
            //readFailedOperation.stopPropagation();
            return readFailedOperation.rawDataService.createObjectStoreForObjectDescriptor(readFailedOperation.target)
            .then((operation) => {
                /*
                    Now that we've successfully created the storage objectDescriptor, we need data. By resolving this promise
                    we're going to allow a child service, if we have one, handle the read and maybe return data.
                    
                    We need to implement captureSynchronizationDataServiceReadCompletedOperation and or captureSynchronizationDataServiceReadUpdateOperation
                    and remember there that there was this ReadFailedOperation and that we need to save this data in our destination data service.

                    To do so, we'll have to convert those data into objects created into the main service and do a saveChanges.
                    IF the raw data service that provided the data could save, it would have to assess the save by looking at those objects
                    and use the originId to compare with its snapshot and realize there's no change and it should be a no-op with existing implementation
                */
                this.tryToSynchronizeEmptyHandedReadOperation(readFailedOperation);
            })
            .catch((error) => {
                console.error("error: ", error);
            });

        } else {


            /*
                This is the case where a source data service tried to fetch but failed because there's a mismatch in data model / query / criteria
            */
            if(this.readOperationsPendingSynchronization.has(readFailedOperation.referrer)) {
                /*
                    If we have a delegate, we're going to rely on it to take care of the situation
                */
                if(this.delegate?.performReadOperationThatDidFailWithError) {
                    readFailedOperation.stopPropagation();
    
                    this.delegate.performReadOperationThatDidFailWithError(readFailedOperation.referrer, readFailedOperation.data)
                    .then((result) => {
                        /*
                            Delegate's promise resolved to a result, we're now dispatching an actual readCompletedOperation.
                        */
                        let responseOperation = this.responseOperationForReadOperation(readFailedOperation.referrer, null, result);
                        responseOperation.target.dispatchEvent(responseOperation);
    
                    })
                    .catch((error) => {
                        /*
                            Delegate's promise failed to resolved to a result, we're now dispatching an actual readFailedOperation.
                        */
                        let aggregateError = new AggregateError([readFailedOperation.data, error], "Both SynchronizationDataService and its delegate failed to read"),
                            responseOperation = this.responseOperationForReadOperation(readFailedOperation.referrer, aggregateError, null);
                            responseOperation.rawDataService = this;
                        responseOperation.target.dispatchEvent(responseOperation);
                    });
                }
    
            }
            /*
                If we have a delegate, we're going to rely on it to take care of the situation
            */
            // else if(this.delegate?.performReadOperationThatDidFailWithError) {
            //     readFailedOperation.stopPropagation();

            //     this.delegate.performReadOperationThatDidFailWithError(readFailedOperation.referrer, readFailedOperation.data)
            //     .then((result) => {
            //         /*
            //             Delegate's promise resolved to a result, we're now dispatching an actual readCompletedOperation.
            //         */
            //         let responseOperation = this.responseOperationForReadOperation(readFailedOperation.referrer, null, result);
            //         responseOperation.target.dispatchEvent(responseOperation);

            //     })
            //     .catch((error) => {
            //         /*
            //             Delegate's promise failed to resolved to a result, we're now dispatching an actual readFailedOperation.
            //         */
            //         let aggregateError = new AggregateError([readFailedOperation.data, error], "Both SynchronizationDataService and its delegate failed to read"),
            //             responseOperation = this.responseOperationForReadOperation(readFailedOperation.referrer, aggregateError, null);
            //             responseOperation.rawDataService = this;
            //         responseOperation.target.dispatchEvent(responseOperation);
            //     });
            // }

        }
    }

    
    _invokeChildServiceFetchObjectProperty(childService, object, propertyName, isObjectCreated, promise) {
        if(promise && promise.then) {
            return promise.then((results) => {
                //Previous child service didn't find it, so we keep looking for a value
                if(!results) {
                    return childService.fetchObjectProperty(object, propertyName, isObjectCreated);
                } else {
                    return results;
                }
            })
            .catch((error) => {
                //If the Previous child service had an error, we try to find a value
                return childService.fetchObjectProperty(object, propertyName, isObjectCreated);
            });
        } else {
            return childService.fetchObjectProperty(object, propertyName, isObjectCreated);
        }
    }

    _invokeChildServicesFetchObjectProperty(childServices, startIndex = 0, object, propertyName, isObjectCreated) {
        let previousPromise,
            promise;

        for (let i=startIndex, countI = childServices.length, childService; (childService = childServices[i]); i++) {
            if(promise && promise.then) {
                previousPromise = promise;
            }

            promise = this._invokeChildServiceFetchObjectProperty(childService, object, propertyName, isObjectCreated, previousPromise);
        }

        promise.then(function(fetchObjectPropertyResult) {
            return fetchObjectPropertyResult      
        })
        .catch((error) => {
            return Promise.reject(error);
        });

    }

    importOriginObjects(fetchObjectPropertyResult) {
        return Promise.resolve(fetchObjectPropertyResult);
    }

    childServicesFetchObjectProperty(object, propertyName, isObjectCreated) {
        

        /*
            Child Services are in the order they should be tried. The first one should be
            this.destinationDataService. All others should be alternative origins - we start with one other
        */
        let childServices = this.childServicesForType(object.objectDescriptor),
            childService,
            i, countI, result,
            readEmptyHandedDataServices = this._readEmptyHandedDataServicesByCreatedObjectsToSync.get(object),
            needsImport = false,
            destinationDataServiceResultsPromise;

        //childServices[0] is this.destinationDataService
        if(!readEmptyHandedDataServices || (readEmptyHandedDataServices && !readEmptyHandedDataServices.has(childServices[0]))) {
            destinationDataServiceResultsPromise = childServices[0].fetchObjectProperty(object, propertyName, isObjectCreated)
        } else {
            destinationDataServiceResultsPromise = Promise.resolve(null);
        }
        return destinationDataServiceResultsPromise
        .then((destinationDataServiceResults) => {
            if(destinationDataServiceResults) {
                return destinationDataServiceResults; 
            } else {
                needsImport = true;
                return this._invokeChildServicesFetchObjectProperty(childServices, 1, object, propertyName, isObjectCreated);
            }
            
        })
        .catch((error) => {
            needsImport = true;
            return this._invokeChildServicesFetchObjectProperty(childServices, 1, object, propertyName, isObjectCreated);
        })
        .then((fetchObjectPropertyResult) => {
            /*
                These are objects fetch from an origin service, so we need to persist them
                The most efficient way is probably to forget their snapshots and re-consider them
                as createdObjects. 

                Then they'll join the pool to save. But like in 

                    captureSynchronizationDataServiceReadCompletedOperation(readCompletedOperation)?
                
                we should invoke our delegate 
            */


            return fetchObjectPropertyResult;

            //Bellow: this is resolving some individual properties

            if(!needsImport) {
                return fetchObjectPropertyResult;
            } else {
                let importPromise;

                //Now invo
                importPromise = this.importOriginObjects(fetchObjectPropertyResult);

                importPromise.then((importedObjects) => {
                    let promise;
                    if(this.delegate?.synchronizationDataServiceWillSaveChanges) {
                        promise = this.delegate.synchronizationDataServiceWillSaveChanges(this, importedObjects);
                    } else {
                        promise = Promise.resolve(true);
                    }

                    return promise.then((importedObjects) => {
                            return mainService.saveChanges()
                            .then(() => importedObjects);
                        }
                    );

                });

                return importPromise;
            }
            
        })
        




            //     /*
            //         If there's more than one, we're entering the realm of decisions about how to deal with them.
            //         That's why MuxDataService's and it's subclasses were created, to implement the various possible strategies.
            //     */

            // let childServices = this.childServicesForType(object.objectDescriptor),
            //     promises,
            //     childService;

            // if(childServices === 1) {
            //     return childServices[0].fetchObjectProperty(object, propertyName, isObjectCreated)
            // } else {
            //     for(childService of childServices) {
            //         (promises || (promises = [])).push(childService.fetchObjectProperty(object, propertyName, isObjectCreated));
            //     }
            //     //If the
            // }
    }


}
