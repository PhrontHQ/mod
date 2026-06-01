var Montage = require("../../core/core").Montage,
    Target = require("core/target").Target,
    DataObjectDescriptor = require("./data-object.mjson").montageObject,
    uuid = require("../../core/uuid"),
    DataService = require("../service/data-service").DataService;

/**
 * A Transaction represents a unit of changes grouped together and intend to be saved at the same time.

 * @class
 * @extends external:Montage
 */

const Transaction = exports.Transaction = class Transaction extends Target {
    /** @lends Transaction */
    constructor() {
        super();

        this.identifier = uuid.generate();
        this._completionPromiseFunctionsByParticipant = new Map();
        DataObjectDescriptor.addEventListener("change", this, false);
        return this;
    }

    static {
        Montage.defineProperties(this.prototype, {
            // apiVersion: {
            //     value: "FROM AWS, NECESSARY FOR GCP?"
            // }
            identifier: {
                value: undefined
            },
            /**
             * The identity instance representing the user behind the changes grouped in the transaction.
             * That identity is carried through the data operation created by the data layer to process it.
             *
             * @type {mod/data/identity}
             */
            identity: {
                value: undefined
            },

            /**
             * Returns a Set containing ObjectDescriptors involved in the transaction across all type of changes
             *
             * @type {Set}
             */
            _objectDescriptors: {
                value: undefined
            },
            objectDescriptors: {
                get: function() {
                    //No caching for now, if we do, we'd have to observe  this.createdDataObjects/updatedDataObjects/deletedDataObjects to keep it accurate
                    let resultSet;

                    if(this.createdDataObjects.size) {
                        (resultSet || (resultSet = new Set())).addEach(this.createdDataObjects.keysArray())
                    }
                    if(this.updatedDataObjects.size) {
                        (resultSet || (resultSet = new Set())).addEach(this.updatedDataObjects.keysArray())
                    }
                    if(this.deletedDataObjects.size) {
                        (resultSet || (resultSet = new Set())).addEach(this.deletedDataObjects.keysArray())
                    }

                    return resultSet;
                    
                    return new Set(...this.createdDataObjects.keysArray(), ...this.updatedDataObjects.keysArray(), ...this.deletedDataObjects.keysArray())
                    // return this._objectDescriptors;
                },
                set: function(value) {
                    console.warn("Transaction.objectDescriptors is now computed on-demand from the content of this.createdDataObjects/updatedDataObjects/deletedDataObjects and not cached")
                    if(value !== this._objectDescriptors) {
                        this._objectDescriptors = value;
                    }
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
                value: undefined
            },

            isObjectCreated: {
                value: function (object) {
                    return !!this.createdDataObjects?.get(object.objectDescriptor)?.has(object);
                }
            },

            /**
             * A Map where keys are ObjectDescriptors and values are matching dataObject instances that are changed in that transaction
             *
             * @type {Map}
             */
            updatedDataObjects: {
                value: undefined
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
             * A Map where keys are dataObjects and values are changes for a dataObject that will be saved within the transaction.
             *
             * @type {Map}
             */
            dataObjectChanges: {
                value: undefined
            },

            _buildChangesForDataObject: {
                value: function (dataObject) {
                    let changesForDataObject = new Map();
                    this.dataObjectChanges.set(dataObject, changesForDataObject);
                    return changesForDataObject;
                },
            },

            changesForDataObject: {
                value: function (dataObject) {
                    return this.dataObjectChanges.get(dataObject);
                },
            },

            /**
             * A Map where keys are ObjectDescriptors and values are matching dataObject instances that are deleted in that transaction
             *
             * @type {Map}
             */
            deletedDataObjects: {
                value: undefined
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

            handleChange: {
                value: function (changeEvent) {
                    //We're going to add ourselve as context for the mainService to better know what to do
                    //This is convoluted... but as data-service.js requires this file...
                    // let mainService = changeEvent.target.dataIdentifier.dataService.mainService;
                    changeEvent.transaction = this;
                }
            }

        });
    }
};



//  Transaction = exports.Transaction = Montage.specialize(/** @lends Transaction.prototype */ {
//     constructor: {
//         value: function Transaction() {
//             this.identifier = uuid.generate();
//             this._completionPromiseFunctionsByParticipant = new Map();
//             this.addEventListener("change", this, false);
//             return this;
//         }
//     },

//     identifier: {
//         value: undefined
//     },

//     /**
//      * The identity instance representing the user behind the changes grouped in the transaction.
//      * That identity is carried through the data operation created by the data layer to process it.
//      *
//      * @type {mod/data/identity}
//      */
//     identity: {
//         value: undefined
//     },

//     /**
//      * Returns a Set containing ObjectDescriptors involved in the transaction across all type of changes
//      *
//      * @type {Set}
//      */
//     objectDescriptors: {
//         value: undefined
//     },

//     _completionPromiseFunctionsByParticipant: {
//         value: undefined
//     },

//     createCompletionPromiseForParticipant: {
//         value: function(participant) {
//             var participationPromiseArguments = this._completionPromiseFunctionsByParticipant.get(participant),
//                 self = this;

//             if(!participationPromiseArguments) {
//                 var participantCompletionPromise = new Promise(function(resolve, reject) {
//                     self._completionPromiseFunctionsByParticipant.set(participant,arguments);
//                 });
//                 this.participantCompletionPromises.push(participantCompletionPromise);
//             }
//         }
//     },

//     resolveCompletionPromiseForParticipant: {
//         value: function(participant) {
//             var promiseFunctions = this._completionPromiseFunctionsByParticipant.get(participant);
//             if(promiseFunctions) {
//                 promiseFunctions[0](participant);
//                 if(this._completionAllSettledValues) {
//                     this._completionAllSettledValues.push({status: "fulfilled", value: participant});
//                 }
//             }
//         }
//     },
//     rejectCompletionPromiseForParticipantWithError: {
//         value: function(participant, error) {
//             var promiseFunctions = this._completionPromiseFunctionsByParticipant.get(participant);
//             if(promiseFunctions) {
//                 promiseFunctions[1](error);
//                 if(this._completionAllSettledValues) {
//                     this._completionAllSettledValues.push({status: "rejected", reason: error});
//                 }
//             }
//         }
//     },

//     clearCompletionPromises: {
//         value: function(participant) {
//             this._participantCompletionPromises.length = 0;
//             this._completionPromiseFunctionsByParticipant.clear();
//             this._completionPromise = null;
//         }
//     },


//     _participantCompletionPromises: {
//         value: undefined
//     },

//     participantCompletionPromises: {
//         get: function() {
//             return this._participantCompletionPromises || (this._participantCompletionPromises = []);
//         }
//     },

//     _completionPromise: {
//         value: undefined
//     },
//     _completionPromiseFunctions: {
//         value: undefined
//     },

//     /*
//         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
//         [
//           {status: "fulfilled", value: 33},
//           {status: "fulfilled", value: 66},
//           {status: "fulfilled", value: 99},
//           {status: "rejected",  reason: Error: an error}
//         ]
//     */
//     _completionAllSettledValues: {
//         value: undefined
//     },

//     completionPromise: {
//         get: function() {
//             if(!this._completionPromise) {
//                 /*
//                     We don't really know when we're done receiving createCompletionPromiseForParticipant
//                     So it's dicy, if someonce calls completionPromise before it's over, stuff will be missed...
//                 */
//                if(this.participantCompletionPromises && this.participantCompletionPromises.length) {
//                     this._completionPromise = Promise.all(this.participantCompletionPromises);

//                     var self = this;
//                     this._completionPromise.finally(function() {
//                         self.clearCompletionPromises();
//                     })
//                } else {
//                     this._completionPromise = Promise.resolve(null);
//                }
//                 // var self = this;
//                 // this._completionPromise = new Promise(function(resolve, reject) {
//                 //     self._completionAllSettledValues = [];
//                 //     self._completionPromiseFunctions = arguments;
//                 // });
//             }
//             return this._completionPromise;
//         }
//     },


//     // _performCompletionPromises: {
//     //     value: undefined
//     // },

//     // performCompletionPromises: {
//     //     get: function() {
//     //         return this._performCompletionPromises || (this._performCompletionPromises = []);
//     //     }
//     // },

//     // performCompletionPromise: {
//     //     value: undefined
//     // },


//     // rawDataServiceSucceeded: {
//     //     value: function(aRawDataService) {
//     //         var participationPromiseArguments = this._completionPromiseFunctionsByParticipant.get(aRawDataService);

//     //         //Execute's the promise's resolve function, we don't care about the
//     //         participationPromiseArguments[0]();
//     //     }
//     // },

//     // rawDataServiceFailedWithError: {
//     //     value: function(aRawDataService, error) {
//     //         var participationPromiseArguments = this._completionPromiseFunctionsByParticipant.get(aRawDataService);

//     //         //Execute's the promise's reject function with the error:
//     //         participationPromiseArguments[1](error);
//     //     }
//     // },



//     /**
//      * A Map where keys are ObjectDescriptors and values are matching dataObject instances that are created in that transaction
//      *
//      * @type {Map}
//      */
//     createdDataObjects: {
//         value: undefined
//     },

//     isObjectCreated: {
//         value: function (object) {
//             return !!this.createdDataObjects?.get(object.objectDescriptor)?.has(object);
//         }
//     },

//     /**
//      * A Map where keys are ObjectDescriptors and values are matching dataObject instances that are changed in that transaction
//      *
//      * @type {Map}
//      */
//     updatedDataObjects: {
//         value: undefined
//     },

//     /**
//      * A Map where keys are ObjectDescriptors and values are maps where criteria
//      * matching dataObject instances with changes are the keys, and values are the changes
//      *
//      * @type {Map}
//      */
//     updatedData: {
//         value: undefined
//     },


//     /**
//      * A Map where keys are dataObjects and values are changes for a dataObject that will be saved within the transaction.
//      *
//      * @type {Map}
//      */
//      dataObjectChanges: {
//         value: undefined
//     },

//     changesForDataObject: {
//         value: function (dataObject) {
//             return this.dataObjectChanges.get(dataObject);
//         },
//     },

//     /**
//      * A Map where keys are ObjectDescriptors and values are matching dataObject instances that are deleted in that transaction
//      *
//      * @type {Map}
//      */
//     deletedDataObjects: {
//         value: undefined
//     },

//     /**
//      * A Map where keys are ObjectDescriptors and values are Sets containing criteria
//      * describing dataObject instances to be deleted, or null if all instances are to be deleted
//      *
//      * @type {Map}
//      */
//      deletetedData: {
//         value: undefined
//     },

//     /**
//      * A Map
//      *
//      * @type {Map}
//      */

//     dataOperationsByObject: {
//         value: undefined
//     },


//     deserializeSelf: {
//         value: function (deserializer) {
//             this.super(deserializer);

//             var result, value;
//             value = deserializer.getProperty("identifier");
//             if (value !== void 0) {
//                 this.identifier = value;
//             }

//             value = deserializer.getProperty("objectDescriptorModuleIds");
//             if (value !== void 0) {
//                 var mainService = DataService.mainService,
//                     i, iObjectDescriptorModuleId, countI,
//                     objectDescriptors = [];

//                 for(i=0, countI = value.length; (i<countI); i++) {
//                     iObjectDescriptorModuleId = value[i];
//                     iObjectDescriptor = this.mainService.objectDescriptorWithModuleId(iObjectDescriptorModuleId);
//                     if(!iObjectDescriptor) {
//                         console.warn("Transation -deserializeSelf(): Could not find an ObjecDescriptor with moduleId "+iObjectDescriptorModuleId);
//                     } else {
//                         objectDescriptors.push(iObjectDescriptor);
//                     }
//                 }

//                 this.objectDescriptors = objectDescriptors;
//             }
//             // value = deserializer.getProperty("scope");
//             // if (value !== void 0) {
//             //     this.scope = value;
//             // }

//         }

//     },
//     serializeSelf: {
//         value: function (serializer) {
//             this.super(serializer);

//             if(this.identifier) {
//                 serializer.setProperty("identifier", this.identifier);
//             }

//             if(this.objectDescriptors) {
//                 var objectDescriptorModuleIds = this.objectDescriptors.map((objectDescriptor) => {return objectDescriptor.module.id});

//                 serializer.setProperty("objectDescriptorModuleIds", objectDescriptorModuleIds);
//             }


//             // if(this.applicationCredentials) {
//             //     serializer.setProperty("applicationCredentials", this.applicationCredentials);
//             // }

//             // if(this.scope) {
//             //     serializer.setProperty("scope", this.scope);
//             // }
//         }
//     },

//         handleChange: {
//             value: function (changeEvent) {
//                 //We're going to add ourselve as context for the mainService to better know what to do
//                 //This is convoluted... but as data-service.js requires this file...
//                 // let mainService = changeEvent.target.dataIdentifier.dataService.mainService;
//                 changeEvent.transaction = this;
//             }
//         }

// });
