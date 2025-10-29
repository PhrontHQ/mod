const RawDataService = require("../raw-data-service").RawDataService;
const DataOperation = require("../data-operation").DataOperation;

/**
 * @class SerializedDataService
 * @extends RawDataService
 */
const SerializedDataService = (exports.SerializedDataService = class SerializedDataService extends RawDataService {
    constructor() {
        super();
        this.map = new Map();
    }

    // FIXME: this method is temporary, for testing purposes only
    registerInstancesLocationForType(dataType, instances) {
        this.map.set(dataType, instances);
    }

    handleReadOperation(readOperation) {
        console.log("SerializedDataService.handleReadOperation: called");

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

        // TODO: If the caller requested a promise for the read completion, return it here.
        // This behavior is brittle — it belongs in RawDataService so individual data services
        // don't need to implement it.
        if (this.promisesReadCompletionOperation) {
            return readOperationCompletionPromise;
        }
    }

    _handleReadOperation(readOperation) {
        // TODO: Temporary workaround — until RawDataService can lazily subscribe to incoming
        // data operations, verify here whether this service should handle the operation.
        if (!this.handlesType(readOperation.target)) return;

        let readOperationCompletionPromiseResolve;
        let rawData;

        if (this.promisesReadCompletionOperation) {
            const { promise, resolve, reject } = Promise.withResolvers();
            readOperationCompletionPromiseResolve = resolve;
        } else {
            const location = this.map.get(readOperation.target);

            if (!location) {
                throw new Error(`No location registered for type ${readOperation.target.name}`);
            }

            require.async(location).then((module) => {
                console.log("Loaded module:", module);
                rawData = module;
            });
        }

        const responseOperation = this.responseOperationForReadOperation(
            readOperation.referrer ? readOperation.referrer : readOperation,
            null,
            rawData
        );

        responseOperation.target.dispatchEvent(responseOperation);

        // Resolve once dispatchEvent() is completed, including any pending progagationPromise.
        responseOperation.propagationPromise.then(() => {
            readOperationCompletionPromiseResolve?.(responseOperation);
        });
    }
});
