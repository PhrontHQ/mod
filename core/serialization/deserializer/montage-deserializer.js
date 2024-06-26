var Montage = require("../../core").Montage,
    MontageContext = require("./montage-interpreter").MontageContext,
    MontageReviver = require("./montage-reviver").MontageReviver,
    BindingsModule = require("../bindings"),
    Map = require("../../../core/collections/map").Map,
    Promise = require("../../promise").Promise,
    currentEnvironment = require("../../environment").currentEnvironment,
    deprecate = require("../../deprecate"),
    ObjectKeys = Object.keys,
    JSON_parse = JSON.parse;

var MontageDeserializer = exports.MontageDeserializer = Montage.specialize({

    _serializationString: {
        value: null
    },

    _serialization: {
        value: null
    },

    serialization: {
        value: {
            get: function () {
                return this._serialization;
            }
        }
    },

    init: {
        value: function (serialization, _require, objectRequires, module, isSync, useParsedSerialization) {
            if (typeof serialization === "string") {
                this._serializationString = serialization;
            } else {
                if(useParsedSerialization) {
                    this._serialization = serialization;
                } else {
                    this._serializationString = JSON.stringify(serialization);
                }
            }
            this._require = _require;
            this._module = module;

            /*
                forking for node's require
            */
            var locationId = module
                ? _require.location
                    ? _require.location + module.id
                    : module.id
                : module;

            this._locationId = locationId;

            this._reviver = new MontageReviver().init(
                _require, objectRequires, this, isSync, locationId
            );
            this._isSync = isSync;

            return this;
        }
    },
    _isSync: {value: false},
    isSync: {
        get: function() {
            return this._isSync;
        }
    },

    __defaultInstances: {
        value: undefined
    },
    _defaultInstances: {
        get: function() {
            return this.__defaultInstances || (this.__defaultInstances = {
                application: Montage.application
            });
        }
    },
        /**
     * @param {Object} instances Map-like object of external user objects to
     * link against the serialization.
     * @param {Element} element The root element to resolve element references
     * against.
     * @return {Promise|object} Deserialized objects if the deserializer was
     * initialized with sync set to true, or a Promise for the deserialized
     * objects otherwise.
     */
    deserialize: {
        value: function (instances, element) {
            var _serializationString = this._serializationString;
            if((!_serializationString) && !this._serialization) {
                return this._isSync ? null : Promise.resolve(null);
            }

            if(!instances) {
                instances = this._defaultInstances;
            } else if(!instances.application) {
                instances.application = this._defaultInstances.application;
            }

            var context = this._module && MontageDeserializer.moduleContexts.get(this._module),
                circularError;
            if (context) {
                if (context._objects.root) {
                    return this._isSync ? context._objects : Promise.resolve(context._objects);
                } else {
                    circularError = new Error(
                        "Unable to deserialize because a circular dependency was detected. " +
                        "Module \"" + this._locationId + "\" has already been loaded but " +
                        "its root could not be resolved."
                    );
                    if (this._isSync) {
                        throw circularError;
                    } else {
                        return Promise.reject(circularError);
                    }
                }
            }

            try {
                var serialization = this._serialization || JSON_parse(_serializationString);
                //We need a new JSON.parse every time, so if we had one, we use it, but we trash it after.
                if(this._serialization) {
                    this._serialization = null;
                }
                context = new MontageContext()
                    .init(serialization, this._reviver, instances, element, this._require, this._isSync);
                if (this._locationId) {
                    MontageDeserializer.moduleContexts.set(this._module, context);
                }
                try {
                    return context.getObjects();
                } catch (ex) {
                    if (this._isSync) {
                        if(currentEnvironment.isNode && ex.code === "ERR_INVALID_ARG_VALUE" && ex.message.startsWith("The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received ")) {
                            var messageParts = ex.message.split("The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received ");
                            if(messageParts.length === 2) {
                                console.error("context.getObjects() failed. serialization at "+this._module.id+" contains package-relative moduleId "+messageParts[1]+" that needs to be changed to file relative to be compatible with node's native require");
                            }
                        }
                        throw ex;
                    } else {
                        return Promise.reject(ex);
                    }
                }
            } catch (ex) {
                if (this._isSync) {
                    throw ex;
                } else {
                    return this._formatSerializationSyntaxError(_serializationString);
                }
            }
        }
    },

    deserializeObject: {
        value: function(objects) {
            return (this._isSync    ? this.deserialize(objects).root
                                    : this.deserialize(objects).then(function(objects) {
                                            return objects ? objects.root : null;
                                        }));
        }
    },

    preloadModules: {
        value: function () {
            var serialization = JSON.parse(this._serializationString),
                reviver = this._reviver,
                moduleLoader = reviver.moduleLoader,
                i,
                labels,
                label,
                object,
                locationId,
                locationDesc,
                module,
                promises;

            if (serialization !== null) {
                labels = ObjectKeys(serialization);
                for (i = 0; (label = labels[i]); ++i) {
                    object = serialization[label];
                    locationId = object.prototype || object.object;

                    if (locationId) {
                        if (typeof locationId !== "string") {
                            throw new Error(
                                "Property 'object' of the object with the label '" +
                                label + "' must be a module id"
                            );
                        }
                        locationDesc = MontageReviver.parseObjectLocationId(locationId);
                        module = moduleLoader.getModule(locationDesc.moduleId, label, this);
                        if (Promise.is(module)) {
                            (promises || (promises = [])).push(module);
                        }
                    }
                }
            }

            if (promises) {
                return Promise.all(promises);
            }
        }
    },

    getExternalObjectLabels: {
        value: function () {
            var serialization = this._serialization,
                labels = [];

            for (var label in serialization) {
                if (ObjectKeys(serialization[label]).length === 0) {
                    labels.push(label);
                }
            }

            return labels;
        }
    },

    _formatSerializationSyntaxError: {
        value: function (source) {
            var gutterPadding = "   ",
                origin = this._origin,
                message,
                error,
                lines,
                gutterSize,
                line;

            return require.async("core/jshint").then(function (module) {
                if (!module.JSHINT(source)) {
                    error = module.JSHINT.errors[0];
                    lines = source.split("\n");
                    gutterSize = (gutterPadding + lines.length).length;
                    line = error.line - 1;

                    for (var i = 0, l = lines.length; i < l; i++) {
                        lines[i] = (new Array(gutterSize - (i + 1 + "").length + 1)).join(i === line ? ">" : " ") +
                            (i + 1) + " " + lines[i];
                    }
                    message = "Syntax error at line " + error.line +
                        (origin ? " from " + origin : "") + ":\n" +
                        error.evidence + "\n" + error.reason + "\n" +
                        lines.join("\n");
                } else {
                    message = "Syntax error in the serialization but not able to find it!\n" + source;
                }

                throw new Error(message);
            });
        }
    },

    // Deprecated methods

    initWithObject: {
        value: deprecate.deprecateMethod(void 0, function (serialization, _require, objectRequires, locationId, moduleContexts) {
            return this.init(serialization, _require, objectRequires, locationId, moduleContexts);
        }, "initWithObject", "init")
    },

    initWithObjectAndRequire: {
        value: deprecate.deprecateMethod(void 0, function (serialization, _require, objectRequires) {
            return this.init(serialization, _require, objectRequires);
        }, "initWithObjectAndRequire", "init")
    }

}, {
    // Adapted from mr/sandbox
    getModuleRequire: {
        value: function (parentRequire, moduleId) {
            var topId = parentRequire.resolve(moduleId);
            var module = parentRequire.getModuleDescriptor(topId);

            while (module.redirect || module.mappingRedirect) {
                if (module.redirect) {
                    topId = module.redirect;
                } else {
                    parentRequire = module.mappingRequire;
                    topId = module.mappingRedirect;
                }
                module = parentRequire.getModuleDescriptor(topId);
            }

            return module.require;
        }
    },

    _cache: {
        value: null
    },

    moduleContexts: {
        get: function () {
            if (!this._cache) {
                this._cache = new Map();
            }
            return this._cache;
        }
    }
});


MontageDeserializer.defineDeserializationUnit = function (name, funktion) {
    MontageReviver.defineUnitReviver(name, funktion);
};

//deprecated
MontageDeserializer.defineDeserializationUnit("bindings", BindingsModule.deserializeObjectBindings);

exports.deserialize = function (serializationString, _require) {
    return new MontageDeserializer().init(serializationString, _require).deserializeObject();
};
