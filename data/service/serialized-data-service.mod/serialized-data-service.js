const fs = require('fs'),
    path = require("path"),
    RawDataService = require("../raw-data-service").RawDataService,
    DataOperation = require("../data-operation").DataOperation;

/**
*
* @class SerializedDataService
* @extends RawDataService
* 
* 
* 
* Example of mergeDataObjects can be found here
* 
* 
* 
* 
* 
*/
const SerializedDataService = exports.SerializedDataService = class SerializedDataService extends RawDataService {/** @lends SerializedDataService */
    constructor() {
        super();

        return this;

    }


    handleReadOperation(readOperation) {
        let readOperationCompletionPromise;

        /*
            This gives a chance to a delegate to do something async by returning a Promise from rawDataServiceWillHandleReadOperation(readOperation).
            When that promise resolves, then we check if readOperation.defaultPrevented, if yes, the we don't handle it, otherwise we proceed.

            Wonky, WIP: needs to work without a delegate actually implementing it.
            And a RawDataService shouldn't know about all that boilerplate

            Note: If there was a default delegate shared that would implement rawDataServiceWillHandleReadOperation by returning Promise.resolve(readOperation)
            it might be simpler, but probably a bit less efficient

        */
        readOperationCompletionPromise = this.callDelegateMethod("rawDataServiceWillHandleReadOperation", this, readOperation);
        if(readOperationCompletionPromise) {
            readOperationCompletionPromise = readOperationCompletionPromise.then((readOperation) => {
                if(!readOperation.defaultPrevented) {
                    this._handleReadOperation(readOperation);
                }
            });
        } else {
            this._handleReadOperation(readOperation);
        }

        //If we've been asked to return a promise for the read Completion Operation, we do so. Again, this is fragile. IT HAS TO MOVE UP TO RAW DATA SERVICE
        //WE CAN'T RELY ON INDIVIDUAL DATA SERVICE IMPLEMENTORS TO KNOW ABOUT THAT...
        if(this.promisesReadCompletionOperation) {
            return readOperationCompletionPromise;
        }

    }

    _handleReadOperation(readOperation) {

        /*
            Until we solve more efficiently (lazily) how RawDataServices listen for and receive data operations, we have to check wether we're the one to deal with this:
        */
        if(!this.handlesType(readOperation.target)) { 
            return;
        }

        let readOperationCompletionPromiseResolvers,
            readOperationCompletionPromise, readOperationCompletionPromiseResolve, readOperationCompletionPromiseReject;


        if(this.promisesReadCompletionOperation) {
            readOperationCompletionPromiseResolvers = Promise.withResolvers();
            readOperationCompletionPromise = readOperationCompletionPromiseResolvers.promise;
            readOperationCompletionPromiseResolve = readOperationCompletionPromiseResolvers.resolve;
            readOperationCompletionPromiseReject = readOperationCompletionPromiseResolvers.reject;
        } else {
            readOperationCompletionPromise = readOperationCompletionPromiseResolve = readOperationCompletionPromiseReject = undefined;
        }

        let rawData;

        let responseOperation = this.responseOperationForReadOperation(readOperation.referrer ? readOperation.referrer : readOperation, null, rawData);
        responseOperation.target.dispatchEvent(responseOperation);

        //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
        responseOperation.propagationPromise.then(() => {
            readOperationCompletionPromiseResolve?.(responseOperation);
        });


    }

}
