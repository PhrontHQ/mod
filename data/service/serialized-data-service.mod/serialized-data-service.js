const RawDataService = require("../raw-data-service").RawDataService;
const DataOperation = require("../data-operation").DataOperation;
const path = require("path");
const fs = require("fs");

/**
 * @class SerializedDataService
 * @extends RawDataService
 */
const SerializedDataService = (exports.SerializedDataService = class SerializedDataService extends RawDataService {
    /** @lends SerializedDataService */

    handleReadOperation(readOperation) {
        let readOperationCompletionPromise;

        readOperationCompletionPromise = this.callDelegateMethod(
            "rawDataServiceWillHandleReadOperation",
            this,
            readOperation
        );

        if (readOperationCompletionPromise) {
            readOperationCompletionPromise = readOperationCompletionPromise.then((readOperation) => {
                if (!readOperation.defaultPrevented) {
                    this._handleReadOperation(readOperation);
                }
            });
        } else {
            this._handleReadOperation(readOperation);
        }

        // If we've been asked to return a promise for the read Completion Operation, we do so. Again, this is fragile.
        // IT HAS TO MOVE UP TO RAW DATA SERVICE WE CAN'T RELY ON INDIVIDUAL DATA SERVICE IMPLEMENTORS TO KNOW ABOUT THAT...
        if (this.promisesReadCompletionOperation) {
            return readOperationCompletionPromise;
        }
    }

    _handleReadOperation(readOperation) {
        /**
         * Until we solve more efficiently (lazily) how RawDataServices listen for and receive data operations,
         * we have to check wether we're the one to deal with this:
         */
        if (!this.handlesType(readOperation.target)) {
            return;
        }

        let readOperationCompletionPromiseResolvers;
        let readOperationCompletionPromise;
        let readOperationCompletionPromiseResolve;
        let readOperationCompletionPromiseReject;

        if (this.promisesReadCompletionOperation) {
            readOperationCompletionPromiseResolvers = Promise.withResolvers();
            readOperationCompletionPromise = readOperationCompletionPromiseResolvers.promise;
            readOperationCompletionPromiseResolve = readOperationCompletionPromiseResolvers.resolve;
            readOperationCompletionPromiseReject = readOperationCompletionPromiseResolvers.reject;
        } else {
            // ?????
            readOperationCompletionPromise = undefined;
            readOperationCompletionPromiseResolve = undefined;
            readOperationCompletionPromiseReject = undefined;
        }

        let rawData;

        let responseOperation = this.responseOperationForReadOperation(
            readOperation.referrer ? readOperation.referrer : readOperation,
            null,
            rawData
        );
        responseOperation.target.dispatchEvent(responseOperation);

        //Resolve once dispatchEvent() is completed, including any pending progagationPromise.
        responseOperation.propagationPromise.then(() => {
            readOperationCompletionPromiseResolve?.(responseOperation);
        });
    }
});
