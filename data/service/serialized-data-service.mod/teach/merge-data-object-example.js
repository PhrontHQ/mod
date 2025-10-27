const serializedDataObjects = require("./serialized-data-objects.mjson").montageObject;
    
    
    async function _loadRolesIfNeeded() {
    const mainService = this.application.mainService,
            roleDescriptorQuery = DataQuery.withTypeAndCriteria(RoleDescriptor);
    return mainService.fetchData(roleDescriptorQuery)
    .then((roles) => {
        if(!roles || roles.length === 0) {
            let promises;
            for(let i=0, countI = SerializedRoles.length, iRole; (i<countI); i++) {
                iRole = SerializedRoles[i];
                iRole.originId = iRole.identifier;
                (promises || (promises = [])).push(this._mergeDevice(iRole));
            }

            return promises?.length === 0
                ? null
                : Promise.all(promises);

        } else {
            return roles;
        }
    });
}

async function _loadDevicesIfNeeded() {

    let mainService = this.application.mainService,
        dataObject;

    //Debug, the Promise.all() doesn't resolve??
    await _loadRolesIfNeeded();
    //Quick hack to force table creation if missing
    const deviceConfigurationQuery = DataQuery.withTypeAndCriteria(DeviceConfiguration);
    mainService.fetchData(deviceConfigurationQuery);

    let mergePromises = [];
    for(let i=0, countI = SerializedDevices.length; (i <countI); i++) {
        console.log(SerializedDevices[i]);
        if(typeof this[`_merge${SerializedDevices[i].objectDescriptor.name}IfNeeded`] === "function") {
            mergePromises.push(this[`_merge${SerializedDevices[i].objectDescriptor.name}IfNeeded`](SerializedDevices[i]));
        } else {
            mergePromises.push(this[`_mergeDeviceIfNeeded`](SerializedDevices[i]));
        }
    }

    return Promise.all(mergePromises)
    .then((mergedObjects) => {
        //return mainService.saveChanges();
    })
    .then((saveResult) => {
        return saveResult;
    })
    .catch((error) => {
        console.error("Merge DeviceTypes saveChanges failed with error:", error);
        reject(error);
    });  

}

function _mergeExistingDeviceTypeIntoDevice(existingDeviceType, aDeviceDataObject) {
            
    console.log("DeviceType named "+ aDeviceDataObject.name+" exists" ); 

    aDeviceDataObject.originId = aDeviceDataObject.identifier;
    return this._mergeDevice(aDeviceDataObject)
    .then(() => {
        
        //Flag the current with the new UUID so we can remember we did this
        existingDeviceType.originId = aDeviceDataObject.identifier;

        let promises;
        const nameCriteria = new Criteria().initWithExpression("name == $.name || model == $.model", {
            name: "",
            model: "",
        }),
        nameCriteriaPredicateFunction = nameCriteria.predicateFunction;

        //Move existingDeviceType's aliases onto aDeviceDataObjectAliases
        if(existingDeviceType.aliases && existingDeviceType.aliases.length > 0) {
            let existingDeviceTypeAliases = existingDeviceType.aliases,
                aDeviceDataObjectAliases = aDeviceDataObject.aliases;

            for(let iAlias of existingDeviceTypeAliases) {
                if(!aDeviceDataObjectAliases.includes(iAlias)) {
                    aDeviceDataObjectAliases.push(iAlias);
                }
            }
        }

        if(existingDeviceType.associatedTaskTypes && existingDeviceType.associatedTaskTypes.length > 0) {
            let associatedTaskTypes = aDeviceDataObject.associatedTaskTypes,
                existingDeviceTypeAssociatedTaskTypes = existingDeviceType.associatedTaskTypes,
                hasData = existingDeviceTypeAssociatedTaskTypes.length;

            //We move the TaskTypes to aDeviceDataObject's associatedTaskTypes to form the same equivalent relationships
            if(hasData) {
                //We know we don't have any in the serialization
                associatedTaskTypes.push(...existingDeviceTypeAssociatedTaskTypes);
            }
        }

        if(existingDeviceType.devices && existingDeviceType.devices.length > 0) {
            let typeInstances = aDeviceDataObject.typeInstances,
                existingDeviceTypeDevices = existingDeviceType.devices,
                hasData = typeInstances.length;

            for (let i = 0, countI = existingDeviceTypeDevices.length; i < countI; i++) {

                if(existingDeviceTypeDevices[i].name) {
                    nameCriteria.parameters.name = existingDeviceTypeDevices[i].name;
                }
                if(existingDeviceTypeDevices[i].model) {
                    nameCriteria.parameters.model = existingDeviceTypeDevices[i].model;
                }

                if(!hasData || !typeInstances.find(nameCriteriaPredicateFunction)) {

                    typeInstances.push(existingDeviceTypeDevices[i]);
                }
            }
        }

        if(promises) {
            return Promise.all(promises);
        } else {
            return Promise.resolve(aDeviceDataObject);    
        }
    });

}

function _mergeDeviceIfNeeded(aDeviceDataObject) {

    return new Promise((resolve, reject) => {
        const mainService = this.application.mainService;
        const deviceCriteria = new Criteria().initWithExpression("name == $.name && originId == $.identifier", {
            name: aDeviceDataObject.name,
            identifier: aDeviceDataObject.identifier
        });

        console.log("Fetching "+ aDeviceDataObject.name +" Device");
        const deviceQuery = DataQuery.withTypeAndCriteria(Device, deviceCriteria);
        deviceQuery.readExpressions = ["name", "originId", "aliases", "type", "subtypes", "typeInstances", "associatedTaskTypes"];

        //We fetch to see if we already have device in the DB matching aDeviceDataObject.
        mainService.fetchData(deviceQuery)
        .then((existingDeviceTypeResult) => {
            let nextStepPromise;

            //We didn't find any, so we're going to merge it.
            if(existingDeviceTypeResult.length === 0) {

                //We didn't find it, it's not a type, let's go:
                if(!aDeviceDataObject.isType) {
                    aDeviceDataObject.originId = aDeviceDataObject.identifier;
                    nextStepPromise = this._mergeDevice(aDeviceDataObject);
                } else {

                    //But if it's a type, we need to see if there's an equivalent DeviceType in the DB
                    console.log("Fetching "+ aDeviceDataObject.name +" DeviceType");
                    const nameCriteria = new Criteria().initWithExpression("name == $.name", {
                        name: aDeviceDataObject.name
                    });
                    const deviceTypeQuery = DataQuery.withTypeAndCriteria(DeviceType, nameCriteria);
                    deviceTypeQuery.readExpressions = ["name", "originId", "aliases", "type", "subtypes", "devices", "associatedTaskTypes"];

                    mainService.fetchData(deviceTypeQuery)
                    .then((existingDeviceTypeResult) => {

                        //No equivalent pre-existing DeviceType found, we go ahead
                        if(existingDeviceTypeResult.length === 0) {
                            aDeviceDataObject.originId = aDeviceDataObject.identifier;
                            nextStepPromise = this._mergeDevice(aDeviceDataObject);
                        } else {

                            /*
                                We undortunately found existing DeviceType with the same name. We need to consolidate their graph into aDeviceDataObject
                                    - regarding tasks, task types, etc...
                            */
                            //if((existingDeviceType = existingDeviceTypeResult[0]) && !existingDeviceType.originId && (existingDeviceType.originId !== aDeviceDataObject.identifier))
                            let existingDeviceTypePromises
                            for(let existingDeviceType of existingDeviceTypeResult) {
                                (existingDeviceTypePromises || (existingDeviceTypePromises = [])).push(this._mergeExistingDeviceTypeIntoDevice(existingDeviceType, aDeviceDataObject));
                            }
                            nextStepPromise = existingDeviceTypePromises
                                ? existingDeviceTypePromises.length === 1
                                    ? existingDeviceTypePromises[0]
                                    : Promise.all(existingDeviceTypePromises)
                                : Promise.resolve(aDeviceDataObject);
                        }
                    });
                }


            } 
            return nextStepPromise;
            
        })
        .then((aDeviceDataObjects) => {
            resolve(aDeviceDataObjects);
        })
        .catch((error) => {
            console.error(error);
            reject(error);
        });  
    })
}

function _mergeDevice(aDeviceDataObject) {
    console.log("Merging DeviceType named "+ aDeviceDataObject.name +" that doesn't exist" );
    if(aDeviceDataObject.devices?.length) {

    }
    return this.application.mainService.mergeDataObject(aDeviceDataObject, this)
    .then((value) => {
        console.log("Merged ", aDeviceDataObject);
        return aDeviceDataObject;
    });

}

function _mergeCreatedDeviceType(aDeviceDataObject) {
    console.log("Merging DeviceType named "+ aDeviceDataObject.name +" that doesn't exist" );
    let newObject = this.application.mainService.createDataObject(aDeviceDataObject.objectDescriptor);
    newObject.name = aDeviceDataObject.name;
    newObject.aliases = aDeviceDataObject.aliases;

    let promises;
    let subtypes = aDeviceDataObject.subtypes;
    for (let i = 0, countI = subtypes.length; i < countI; i++) {
        (promises || (promises = [])).push(this._mergeDevice(subtypes[i])
        .then((newSubtype) => {
            newObject.subtypes.push(newSubtype);
        }));
    }


    //this.application.mainService.mergeDataObject(aDeviceDataObject);
    return promises ? Promise.all(promises): Promise.resolve(newObject);
}

    _organizations
   function organizations() {
        if(!_organizations) {
            return (this._organizations = this.application.mainService.fetchData(OrganizationDescriptor))
            .then((organizations) => {
                return organizations;
            })
        } else {
            return this._organizations;
        }
    }

    _deviceProtocols
    deviceProtocols() {
        if(!this._deviceProtocols) {
            return (this._deviceProtocols = this.application.mainService.fetchData(DeviceProtocolDescriptor))
            .then((deviceProtocols) => {
                return deviceProtocols;
            })
        } else {
            return this._deviceProtocols;
        }
    }

    willMergeDataObject(dataObject) {
        if(dataObject.objectDescriptor.name === "Organization") {
            return this.organizations()
            .then((organizations) => {
                console.log("willMergeDataObject Organization" + dataObject);

                //Now filter:
                const nameCriteria = new Criteria().initWithExpression("name == $.name", {
                    name: dataObject.name
                });
                let existingOrganizations = organizations.filter(nameCriteria.predicateFunction);

                if(existingOrganizations.length > 1) {
                    throw "There shouldn't be more than one existing organization matching "+dataObject.name;
                }
                if(existingOrganizations.length == 1) {
                    return existingOrganizations[0];
                } else {
                    return dataObject;
                } 
            });
        } else if(dataObject.objectDescriptor.name === "DeviceProtocol") {
            return this.deviceProtocols()
            .then((deviceProtocols) => {
                console.log("willMergeDataObject DeviceProtocol" + dataObject);

                //Now filter:
                const nameCriteria = new Criteria().initWithExpression("name == $.name", {
                    name: dataObject.name
                });
                let existingDeviceProtocols = deviceProtocols.filter(nameCriteria.predicateFunction);
                
                if(existingDeviceProtocols.length > 1) {
                    throw "There shouldn't be more than one existing organization matching "+dataObject.name;
                }

                if(existingDeviceProtocols.length == 1) {
                    return existingDeviceProtocols[0];
                } else {
                    return dataObject;
                }
            });

        } else {
            console.log("willMergeDataObject " + dataObject);
            return Promise.resolve(dataObject);
        }
    }

    willMergeDataObjectPropertyValueIntoExistingDataObject(dataObject, propertyName,  valueToMerge, existingDataObject, propertyArray, propertyIndex ) {
        console.log("willMergeDataObjectPropertyValueIntoExistingDataObject " + propertyName);
        return Promise.resolve(valueToMerge);
    }
