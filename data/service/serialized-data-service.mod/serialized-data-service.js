const RawDataService = require("../raw-data-service").RawDataService;

/**
 * @class SerializedDataService
 * @extends RawDataService
 */
exports.SerializedDataService = class SerializedDataService extends RawDataService {
    constructor() {
        super();
        this.map = new Map();
    }

    // FIXME: this method is temporary, for testing purposes only
    registerInstancesForType(dataType, { location, require }) {
        if (!location || !require) {
            throw new Error("Both location and require must be provided");
        }

        this.map.set(dataType, {
            location,
            require,
        });
    }

    handleReadOperation(readOperation) {
        // TODO: Temporary workaround — until RawDataService can lazily subscribe to incoming
        // data operations, verify here whether this service should handle the operation.
        if (!this.handlesType(readOperation.target)) return;

        let location, _require;
        if (this.map.has(readOperation.target)) {
            location = this.map.get(readOperation.target).location;
            _require = this.map.get(readOperation.target).require;
        } else {
            location = this.dataModuleId;
            _require = global.require;
        }
        

        if (!location || !_require) {
            throw new Error(`No location or require registered for type ${readOperation.target.name}`);
        }

        console.log("SerializedDataService.handleReadOperation");

        return _require
            .async(location)
            .then((module) => {
                if (!module || !module.montageObject) {
                    throw new Error("Module not found or invalid module format: " + location);
                }

                let { montageObject: rawData } = module;
                const { criteria } = readOperation;

                if (criteria) {
                    rawData = module.montageObject.filter(criteria.predicateFunction);
                }

                return this._finalizeHandleReadOperation(readOperation, rawData);
            })
            .catch((error) => {
                console.error("Error loading serialized data:", error);
                throw error;
            });
    }

    _finalizeHandleReadOperation(readOperation, rawData, readOperationCompletionPromiseResolve) {
        const responseOperation = this.responseOperationForReadOperation(
            readOperation.referrer ? readOperation.referrer : readOperation,
            null,
            rawData
        );

        // @benoit:
        // 1. why is this needed?
        // 2. what is target here?
        responseOperation.target.dispatchEvent(responseOperation);

        // Resolve once dispatchEvent() is completed, including any pending progagationPromise.
        responseOperation.propagationPromise.then(() => {
            readOperationCompletionPromiseResolve?.(responseOperation);
        });
    }

    static {

        RawDataService.defineProperties(SerializedDataService.prototype, {

            _defaultDataModuleId: {
                value: "./data.mjson"
            },

            dataModuleId: {
                value: undefined
            },

            deserializeSelf: {
                value: function (deserializer) {
                    RawDataService.prototype.deserializeSelf.call(this, deserializer);
                    let value = deserializer.getProperty("dataModuleId");
                    if (value) {
                        this.dataModuleId = value;
                    }
                }
            }

        })

    }
};
