const RawDataService = require("../raw-data-service").RawDataService,
    { DataObject } = require("../../model/data-object"),
    { KebabCaseConverter } = require("core/converter/kebab-case-converter");

/**
 * @class SerializedDataService
 * @extends RawDataService
 */
exports.SerializedDataService = class SerializedDataService extends RawDataService {
    constructor() {
        super();
        this._typeToLocation = new Map();
    }

    // FIXME: this method is temporary, for testing purposes only
    registerInstancesForType(dataType, { location, require }) {
        if (!location || !require) {
            throw new Error("Both location and require must be provided");
        }

        this._typeToLocation.set(dataType, {
            location,
            require,
        });
    }

    _kebabTypeName(typeName) {
        this._typeNameConverter = this._typeNameConverter || new KebabCaseConverter();
        return this._typeNameConverter.convert(typeName);
    }

    handleReadOperation(readOperation) {
        // TODO: Temporary workaround — until RawDataService can lazily subscribe to incoming
        // data operations, verify here whether this service should handle the operation.
        if (!this.handlesType(readOperation.target)) return;

        let location, _require;

        if (this._typeToLocation.has(readOperation.target)) {
            location = this._typeToLocation.get(readOperation.target);

            if (location.location) {
                _require = location.require;
                location = location.location;
            }
        }

        if (!_require) {
            _require = global.require;
        }

        if (!location) {
            location = `data/instance/${this._kebabTypeName(readOperation.target.name)}/main.mjson`;
        }

        // TODO :Update to look in data/instance/<typename>/main.mjson if a location is not provided
        if (!location || !_require) {
            throw new Error(`No location or require registered for type ${readOperation.target.name}`);
        }

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

                if (rawData[0] instanceof DataObject) {
                    rawData.forEach((object) => {
                        this.rootService.mergeDataObject(object);
                    });
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

        responseOperation.target.dispatchEvent(responseOperation);

        // Resolve once dispatchEvent() is completed, including any pending progagationPromise.
        responseOperation.propagationPromise.then(() => {
            readOperationCompletionPromiseResolve?.(responseOperation);
        });
    }

    static {
        RawDataService.defineProperties(SerializedDataService.prototype, {
            _defaultDataModuleId: {
                value: "./data.mjson",
            },

            moduleId: {
                value: undefined,
            },

            deserializeSelf: {
                value: function (deserializer) {
                    RawDataService.prototype.deserializeSelf.call(this, deserializer);

                    let value = deserializer.getProperty("instances");

                    if (value) {
                        this._mapDataModuleIds(value);
                    }
                },
            },

            _mapDataModuleIds: {
                value: function (instances) {
                    instances.forEach((item) => {
                        if (!item.type || !item.moduleId) {
                            console.warn("type and moduleId are required to register data in SerializedDataService");
                            return;
                        }

                        console.log(this);

                        if (!this.handlesType(item)) {
                            console.warn(`type ${item.type.name} is not handled by this SerializedDataService`);
                        }

                        this._typeToLocation.set(item.type, item.moduleId);
                    });
                },
            },
        });
    }
};
