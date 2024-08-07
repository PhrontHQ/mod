var Montage = require("../../core").Montage,
    deprecate = require("../../deprecate");

var SelfDeserializer = Montage.specialize( {
    _isSync: {value: false},
    isSync: {
        get: function() {
            return this._isSync;
        },
        set: function(value) {
            this._isSync = value;
        }
    },

    _object: {value: null},
    _objectDescriptor: {value: null},
    _context: {value: null},
    _unitNames: {value: null},
    _objectUnitNames: {value: null},

    create: {
        value: function () {
            return new this();
        }
    },

    initWithObjectAndObjectDescriptorAndContextAndUnitNames: {
        value: function (object, objectDescriptor, context, unitNames) {
            this._object = object;
            this._objectDescriptor = objectDescriptor;
            this._objectDescriptorValues = objectDescriptor.values || objectDescriptor.properties || objectDescriptor;
            this._context = context;
            this._unitNames = unitNames;

            return this;
        }
    },

    getProperty: {
        value: function (name) {
            return this._objectDescriptorValues[name];
        }
    },

    properties: {
        get: function () {
            return this._objectDescriptorValues;
        }
    },

    hasProperty: {
        value: function (name) {
            return Object.hasOwn(this._objectDescriptorValues, name);
        }
    },

    getType: {
        value: function () {
            if ("prototype" in this._objectDescriptor) {
                return "prototype";
            } else if ("object" in this._objectDescriptor) {
                return "object";
            }
        }
    },

    getTypeValue: {
        value: function () {
            return this._objectDescriptor.prototype || this._objectDescriptor.object;
        }
    },

    getObjectByLabel: {
        value: function (label) {


            return this._context.getObject(label);
        }
    },

    deserializeProperties: {
        value: deprecate.deprecateMethod(void 0, function (propertyNames) {
            return this.deserializeValues(propertyNames);
        }, "deserializeProperties", "deserializeValues")
    },

    deserializeValues: {
        value: function (propertyNames) {
            var object = this._object,
                // .properties deprecated
                values = this._objectDescriptor.values || this._objectDescriptor.properties,
                propertyName;

            if (values) {
                if (!propertyNames) {
                    propertyNames = Montage.getSerializablePropertyNames(object);
                }

                for (var i = 0, ii = propertyNames.length; i < ii; i++) {
                    propertyName = propertyNames[i];
                    object[propertyName] = values[propertyName];
                }
            }
        }
    },

    deserializeUnit: {
        value: function (name) {
            var objectUnitNames = this._objectUnitNames;

            if (!objectUnitNames) {
                objectUnitNames = this._objectUnitNames = [name];
                this._context.setUnitsToDeserialize(this._object, this._objectDescriptor, objectUnitNames);
            } else if (objectUnitNames.indexOf(name) === -1) {
                objectUnitNames.push(name);
            }
        }
    },

    deserializeUnits: {
        value: function () {
            var objectUnitNames = this._objectUnitNames;

            if (!objectUnitNames) {
                objectUnitNames = this._objectUnitNames = this._unitNames;
                this._context.setUnitsToDeserialize(this._object, this._objectDescriptor, objectUnitNames);
            } else {
                for (var i = 0, name; (name = objectUnitNames[i]); i++) {
                    if (objectUnitNames.indexOf(name) === -1) {
                        objectUnitNames.push(name);
                    }
                }
            }
        }
    }
});

exports.SelfDeserializer = SelfDeserializer;
