const fs = require('fs'),
    path = require("path"),
    RawDataService = require("../raw-data-service").RawDataService,
    DataOperation = require("../data-operation").DataOperation;

/**
* TODO: Document
*
* @class
* @extends RawDataService
*/
const FileSecretManagerDataService = exports.FileSecretManagerDataService = class FileSecretManagerDataService extends RawDataService {/** @lends FileSecretManagerDataService */
    constructor() {
        super();

        //var mainService = DataService.mainService;
        //this.addEventListener(DataOperation.Type.ReadOperation,this,false);
        /*
            There's somethig fragile that needs to be solved here. If we listen on this, expecting that an event whose target is secretObjectDescriptorm, which we manage, is going to bubble to us. The problem is that it bubbles from Secret to DataObject first, but DataObject isn't handled by SecretManagerDataService, and so it bubbles through something else that manages directly DataObject. So that logic has to be adapted.

            There's also a dependency graph issue if we require secretObjectDescriptor directly, leaving it commmented above to remind of it.
        */
        //secretObjectDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);
        var self = this;
        this._childServiceTypes.addRangeChangeListener(function (plus, minus) {
            for(var i=0, countI = plus.length, iObjectDescriptor; (i < countI); i++) {
                iObjectDescriptor = plus[i];
                if(iObjectDescriptor.name === "Secret") {
                    iObjectDescriptor.addEventListener(DataOperation.Type.ReadOperation,self,false);
                }
            }
        });

        return this;

    }
}

FileSecretManagerDataService.addClassProperties({


    handleCreateTransactionOperation: {
        value: function (createTransactionOperation) {

            /*
                Files doesn't have the notion of transaction, but we still need to find a way to make it work.
            */

        }
    },

    instantiateAWSClientWithOptions: {
        value: function (awsClientOptions) {
            return new SecretsManagerClient(awsClientOptions);
        }
    },

    rawClientPromises: {
        get: function () {
            var promises = this.super();

            // /*
            //     const { SecretsManagerClient, ListSecretsCommand } = require("@aws-sdk/client-secrets-manager");
            // */

            // promises.push(
            //     // require.async("@aws-sdk/client-secrets-manager/dist-cjs/SecretsManagerClient").then(function(exports) { SecretsManagerClient = exports.SecretsManagerClient})
            //     require.async("@aws-sdk/client-secrets-manager").then(function(exports) {
            //         SecretsManagerClient = exports.SecretsManagerClient;
            //         GetSecretValueCommand = exports.GetSecretValueCommand;
            //     })
            // );
            // // promises.push(
            // //     require.async("@aws-sdk/client-secrets-manager/dist-cjs/commands/GetSecretValueCommand").then(function(exports) { GetSecretValueCommand = exports.GetSecretValueCommand})
            // // );

            return promises;

        }
    },

    handleSecretReadOperation: {
        value: function (readOperation) {
            /*
                Until we solve more efficiently (lazily) how RawDataServices listen for and receive data operations, we have to check wether we're the one to deal with this:
            */
            if(!this.handlesType(readOperation.target)) {
                return;
            }

            //console.log("S3DataService - handleObjectReadOperation");

            var self = this,
                data = readOperation.data,
                objectDescriptor = readOperation.target,
                mapping = objectDescriptor && this.mappingForType(objectDescriptor),
                primaryKeyPropertyDescriptors = mapping && mapping.primaryKeyPropertyDescriptors,

                criteria = readOperation.criteria,
                parameters = criteria.parameters,
                // iterator = new SyntaxInOrderIterator(criteria.syntax, "property"),
                secretId = parameters && parameters.name,
                rawData,
                promises,
                operation;

            if(secretId) {
                /*
                    This params returns a data with these keys:
                    ["AcceptRanges","LastModified","ContentLength","ETag","ContentType","ServerSideEncryption","Metadata","Body"]
                */

                (promises || (promises = [])).push(new Promise(function(resolve, reject) {

                    self.rawClientPromise.then(() => {

                        var secretStore = self.connectionDescriptor[self.currentEnvironment.stage]?.secretStore;

                        if(secretStore) {
                            /*
                                In development, process.cwd() resolves to the root of the project 
                                where the worker using this is, which may or may not be the root of the project.
                                This would be different for a worker deployed as a functin

                                __dirname is the location of this file, which is going to be most likely:
                                path_to_.../node_modules/mod/data/service/file-secret-manager-data-service.mod/'

                                Which is always going to be the same, so using this as reference for now.
                            */
                            fs.readFile(path.resolve(__dirname, secretStore), 'utf8', (err, data) => {
                                if (err) {
                                    console.warn(err, err.stack); // an error occurred
                                    reject(err);
                                }
                                else {

                                    let secretStoreValue, secretValue;

                                    try {
                                        secretStoreValue = JSON.parse(data);
                                    } catch(parseError) {
                                        //It's not jSON...
                                        reject(err);
                                        return;
                                    }

                                    secretValue = secretStoreValue[secretId];

                                    if(secretValue) {
                                        rawData = (rawData || (rawData = {}));
                                        rawData["name"] = secretId;
                                        rawData["value"] = secretValue;    
                                    } else {
                                        rawData = null;
                                    }
                                    resolve(rawData);
                                }
                            });
                        }
                      
                    })

                }));

            } else {
                console.log("Not sure what to send back, noOp?")
            }

            if(promises) {
                Promise.all(promises)
                .then(function(resolvedValue) {
                    operation = self.responseOperationForReadOperation(readOperation, null, rawData === null ? [] : [rawData], false/*isNotLast*/);
                    objectDescriptor.dispatchEvent(operation);
                }, function(error) {
                    operation = self.responseOperationForReadOperation(readOperation, error, null, false/*isNotLast*/);
                    objectDescriptor.dispatchEvent(operation);
                })
            } else {
                if(!rawData || (rawData && Object.keys(rawData).length === 0)) {
                    operation = new DataOperation();
                    operation.type = DataOperation.Type.NoOp;
                } else {
                    operation = self.responseOperationForReadOperation(readOperation, null /*no error*/, [rawData], false/*isNotLast*/);
                }
                objectDescriptor.dispatchEvent(operation);
            }
        }
    }


});
