//var Converter = require("core/converter/converter").Converter,
var ExpressionConverter = require("../../core/converter/expression-converter").ExpressionConverter,
    ObjectDescriptorReference = require("../../core/meta/object-descriptor-reference").ObjectDescriptorReference,
    Promise = require("../../core/promise").Promise,
    Scope = require("../../core/frb/scope"),
    parse = require("../../core/frb/parse"),
    compile = require("../../core/frb/compile-evaluator");

/**
 * @class RawValueToObjectConverter
 * @classdesc Converts a property value of raw data to the referenced object.
 * @extends Converter
 */
exports.RawValueToObjectConverter = ExpressionConverter.specialize( /** @lends RawValueToObjectConverter# */ {

/*
                converter.expression = converter.expression || rule.expression;
                converter.foreignDescriptor = converter.foreignDescriptor || propertyDescriptor.valueDescriptor;
                converter.objectDescriptor = this.objectDescriptor;
                converter.serviceIdentifier = rule.serviceIdentifier;

*/


    /*********************************************************************
     * Serialization
     */

    serializeSelf: {
        value: function (serializer) {

            this.super(serializer);

            // serializer.setProperty("convertExpression", this.convertExpression);

            serializer.setProperty("foreignDescriptor", this._foreignDescriptorReference);
            serializer.setProperty("foreignDescriptorMappings", this.foreignDescriptorMappings);

            // serializer.setProperty("revertExpression", this.revertExpression);

            serializer.setProperty("root", this.owner);

            serializer.setProperty("serviceIdentifier", this.serviceIdentifier);
            serializer.setProperty("service", this.service);

        }
    },

    deserializeSelf: {
        value: function (deserializer) {

            this.super(deserializer);

            // var value = deserializer.getProperty("convertExpression");
            // if (value) {
            //     this.convertExpression = value;
            // }

            // value = deserializer.getProperty("revertExpression");
            // if (value) {
            //     this.revertExpression = value;
            // }

            value = deserializer.getProperty("foreignDescriptor");
            if (value instanceof ObjectDescriptorReference) {
                if(!deserializer.isSync) {
                    this._foreignDescriptorReference = value;
                }
                else {
                    this.foreignDescriptor = deserializer._context._require(value._reference.objectDescriptorModule.id).montageObject;
                }
            } else if (value) {
                this.foreignDescriptor = value;
            }

            value = deserializer.getProperty("foreignDescriptorMappings");
            if (value) {
                this.foreignDescriptorMappings = value;
            }

            value = deserializer.getProperty("service");
            if (value) {
                this.service = value;
            }

            value = deserializer.getObjectByLabel("root");
            if (value) {
                this.owner = value;
            }

            value = deserializer.getProperty("serviceIdentifier");
            if (value) {
                this.serviceIdentifier = value;
            }

            deserializer.deserializeUnit("bindings");
        }
    },

    // /*********************************************************************
    //  * Initialization
    //  */

    // /**
    //  * @param {string} convertExpression the expression to be used for building a criteria to obtain the object corresponding to the value to convert.
    //  * @return itself
    //  */
    // initWithConvertExpression: {
    //     value: function (convertExpression) {
    //         this.convertExpression = convertExpression;
    //         return this;
    //     }
    // },

    /*********************************************************************
     * Properties
     */


    // _convertExpression: {
    //     value: null
    // },

    // /**
    //  * The expression used to convert a raw value into a modeled one, for example a foreign property value into the objet it represents.
    //  * @type {string}
    //  * */
    // convertExpression: {
    //     get: function() {
    //         return this._convertExpression;
    //     },
    //     set: function(value) {
    //         if(value !== this._convertExpression) {
    //             this._convertExpression = value;
    //             this._convertSyntax = undefined;
    //         }
    //     }
    // },

    // _convertSyntax: {
    //     value: undefined
    // },

    // /**
    //  * Object created by parsing .convertExpression using frb/grammar.js that will
    //  * be used to initialize the convert query criteria
    //  * @type {Object}
    //  * */

    // convertSyntax: {
    //     get: function() {
    //         return (this._convertSyntax ||
    //             ((this._convertSyntax === undefined)    ? (this._convertSyntax = (this.convertExpression ? parse(this.convertExpression) : null))
    //                                                     : null));
    //     }
    // },

    // _revertExpression: {
    //     value: null
    // },

    // /**
    //  * The expression used to revert the modeled value into a raw one. For example,
    //  * reverting an object into it's primary key.
    //  * @type {string}
    //  * */
    // revertExpression: {
    //     get: function() {
    //         return this._revertExpression;
    //     },
    //     set: function(value) {
    //         if(value !== this._revertExpression) {
    //             this._revertExpression = value;
    //             this._revertSyntax = undefined;
    //         }
    //     }
    // },

    // _revertSyntax: {
    //     value: undefined
    // },

    // /**
    //  * Object created by parsing .revertExpression using frb/grammar.js that will
    //  * be used to revert the modeled value into a raw one
    //  * @type {Object}
    //  * */
    // revertSyntax: {
    //     get: function() {
    //         return this._revertSyntax ||
    //             (this._revertSyntax === undefined  ? this._revertSyntax = this.revertExpression ? parse(this.revertExpression)
    //                                                                                                                     : null
    //                                                 : null);
    //     }
    // },

    // _compiledRevertSyntax: {
    //     value: undefined
    // },

    // compiledRevertSyntax: {
    //     get: function () {

    //         return this._compiledRevertSyntax ||
    //                 (this._compiledRevertSyntax === undefined   ? this._compiledRevertSyntax = this.revertSyntax    ? compile(this.revertSyntax)
    //                                                                                                                 : null
    //                                                             : null);
    //     }
    // },


    /**
     * The descriptor of the destination object. If one is not provided,
     * .objectDescriptor will be used. If .objectDescriptor is not provided,
     * the value descriptor of the property descriptor that defines the
     * relationship will be used.
     * @type {?ObjectDescriptorReference}
     * */
    foreignDescriptor: {
        serializable: false,
        get: function () {
            var isReference = this._foreignDescriptor instanceof ObjectDescriptorReference;
            return isReference             ? this._foreignDescriptor :
                   this._foreignDescriptor ? Promise.resolve(this._foreignDescriptor) :
                   this._foreignDescriptorReference && this._foreignDescriptorReference.promise(require);
        },
        set: function (descriptor) {
            if(descriptor !== this._foreignDescriptor) {
                this._foreignDescriptor = descriptor;
                //Clear the cache in case it's shared
                this.__descriptorToFetch = null;
            }
        }
    },

    /**
     * foreignDescriptorMappings enables the converter to handle polymorphic relationships
     * where the object that need to be found from a foreign key can be of different type,
     * and potentially be stored in different raw-level storage, diffferent table in a database
     * or different API endpoint. The arrau contains RawDataTypeMappings which have an expression,
     * which if it evaluates as true on a value means this RawDataTypeMapping's object descriptor
     * should be used. When present, the converter will evaluate the value passed,
     * in polyporphic case a record like:
     * {
     *      foreignKeyOfTypeA: null,
     *      foreignKeyOfTypeB: "foreign-key-value",
     *      foreignKeyOfTypeC: null
     * }
     *
     * Only one of those properties can be not null at a time
     *
     * @type {?Array<RawDataTypeMapping>}
     * */

    foreignDescriptorMappings: {
        value: undefined
    },


    /**
     * Uses foreignDescriptorMappings to find an ObjectDescriptor that matches
     * the passed raw data, delegating to iindividual RawDataTypeMappings
     * the job of assessing if their condition match the raw data or not.
     *
     * Such expression might consider a combination of raw data key/value,
     * an type property, a mutually exclusive list of potential foreignKeys,
     * and eventually one foreign primary key if it were to contain the type of
     * the data it represents.
     *
     * @method
     * @argument {Object} value The raw data to evaluate.
     * @returns {ObjectDescriptor} An ObjectDescriptor if one is found or null.
     *
     */

    foreignDescriptorForValue: {
        value: function(value) {

            for(var i=0, mappings = this.foreignDescriptorMappings, countI = mappings?.length, iMapping;(i<countI);i++) {
                if(mappings[i].match(value)) {
                    return mappings[i].type;
                }
            }
            return null;
        }
    },


    foreignDescriptorMatchingRawProperty: {
        value: function(rawProperty) {

            if(this.foreignDescriptorMappings) {
                for(var i=0, mappings = this.foreignDescriptorMappings, countI = mappings?.length, iMapping;(i<countI);i++) {
                    if(mappings[i].rawDataProperty === rawProperty) {
                        return mappings[i];
                    }
                }
            }
            return null;
        }
    },

    __foreignDescriptorMappingsByObjectyDescriptor: {
        value: undefined
    },
    _foreignDescriptorMappingsByObjectyDescriptor: {
        get: function() {
            if(!this.__foreignDescriptorMappingsByObjectyDescriptor) {
                for(var i=0, mappings = this.foreignDescriptorMappings, countI = mappings?.length, iMapping, mappingByObjectDescriptor = new Map();(i<countI);i++) {
                    mappingByObjectDescriptor.set(mappings[i].type,mappings[i]);
                }
                this.__foreignDescriptorMappingsByObjectyDescriptor = mappingByObjectDescriptor;
            }
            return this.__foreignDescriptorMappingsByObjectyDescriptor;
        }
    },

    rawDataTypeMappingForForeignDescriptor: {
        value: function(anObjectDescriptor) {
            return this._foreignDescriptorMappingsByObjectyDescriptor.get(anObjectDescriptor);
        }
    },

    _rawDataPropertyByForeignDescriptor: {
        value: undefined
    },
    rawDataPropertyForForeignDescriptor: {
        value: function(anObjectDescriptor) {
            var rawProperty;

            if(!anObjectDescriptor) return null;

            if(!this._rawDataPropertyByForeignDescriptor) {
                this._rawDataPropertyByForeignDescriptor = new Map();
            } else {
                rawProperty = this._rawDataPropertyByForeignDescriptor.get(anObjectDescriptor);
            }

            if(!rawProperty) {
                var rawDataTypeMapping = this.rawDataTypeMappingForForeignDescriptor(anObjectDescriptor),
                    rawDataTypeMappingExpressionSyntax = rawDataTypeMapping.expressionSyntax;

                /*
                    Assuming the raw-data-type-mapping expressions are of the form: "aForeignKeyId.defined()"
                */

                if(rawDataTypeMappingExpressionSyntax.type === "defined" && rawDataTypeMappingExpressionSyntax.args[0].type === "property") {
                    rawProperty = rawDataTypeMappingExpressionSyntax.args[0].args[1].value;

                    this._rawDataPropertyByForeignDescriptor.set(anObjectDescriptor,rawProperty);

                } else {
                    console.error("Couldn't find raw data Property for foreign descriptor", anObjectDescriptor, "rawDataTypeMapping:",rawDataTypeMapping);
                }
            }

            return rawProperty;

        }

    },

    /**
     * The descriptor of the source object. It will be used only if it is provided and
     * .foreignDescriptor is not provided.
     * @type {?ObjectDescriptorReference}
     **/
    objectDescriptor: {
        get: function () {
            return  this._objectDescriptor                      ?   Promise.resolve(this._objectDescriptor) :
                    this.owner && this.owner.objectDescriptor   ?   Promise.resolve(this.owner.objectDescriptor) :
                    this._isAsync(this.owner)                   ?   this._objectDescriptorReference :
                                                                    undefined;
        },
        set: function (value) {
            this._objectDescriptor = value;
        }
    },

    _objectDescriptorReference: {
        get: function () {
            var self = this;
            return this.owner.then(function (object) {
                var objectDescriptor = object.objectDescriptor;
                self.objectDescriptor = objectDescriptor;
                return objectDescriptor;
            });
        }
    },

    _isAsync: {
        value: function (object) {
            return object && object.then && typeof object.then === "function";
        }
    },


    /**
     * The descriptor for which to perform the fetch.
     * This returns foreignDescriptor, if it exists, and otherwise
     * returns objectDescriptor.
     * @type {?ObjectDescriptorReference}
     **/
    _descriptorToFetch: {
        get: function () {
            if (!this.__descriptorToFetch) {
                if (this.foreignDescriptor && this.foreignDescriptor.promise) {
                    this.__descriptorToFetch = this.foreignDescriptor.promise(require);
                } else if (this.foreignDescriptor) {
                    this.__descriptorToFetch = this.foreignDescriptor;
                } else {
                    this.__descriptorToFetch = this.objectDescriptor;
                }
            }
            return this.__descriptorToFetch;

            // this.__descriptorToFetch = this._foreignDescriptor ? this._foreignDescriptor.then(function (descriptor) {
            //     return descriptor || self.objectDescriptor;
            // }) : Promise.resolve(this.objectDescriptor);
            // return this.foreignDescriptor || this.objectDescriptor;
        }
    },

    owner: {
        get: function () {
            return this._owner ? this._owner.then ? this._owner : Promise.resolve(this._owner) : undefined;
        },
        set: function (value) {
            this._owner = value;
        }
    },

    // __scope: {
    //     value: null
    // },

    // /**
    //  * Scope with which convert and revert expressions are evaluated.
    //  * @type {?Scope}
    //  **/
    // scope: {
    //     get: function() {
    //         return this.__scope || (this.__scope = new Scope(this));
    //     }
    // },

    /**
     * The service to use to make requests.
     */
    service: {
        get: function () {
            return  this._service 
                ? this._service 
                : this.owner    
                    ? this.owner.then(function (object) { 
                        return object.service; 
                    }) 
                    : undefined;
        },
        set: function (value) {
            this._service = !value || value.then ? value : Promise.resolve(value);
        }
    },

    /**
     * Identifier of the child of .service that the query should be routed to
     */
    serviceIdentifier: {
        value: undefined
    },

    /*********************************************************************
     * Public API
     */

    /**
     * Convert raw data to data objects of an appropriate type.
     *
     * Subclasses should override this method to provide a concrete conversion.
     * @method
     * @param {Property} v The value to format.
     * @returns {Promise} A promise for the referenced object.  The promise is
     * fulfilled after the object is successfully fetched.
     */
    convert: {
        value: function (v) {
            return Promise.resolve(v);
        }
    },



    /**
     * Revert object value of a known type to raw data
     *
     * Subclasses should override this method to provide a concrete revert.
     * @function
     * @param {Scope} v The value to revert.
     * @returns {string} v
     */
    revert: {
        value: function (v) {
            return Promise.resolve(v);
        }
    },

    /**
     * The current Mapping rule calling convert or revert
     */
    currentRule: {
        value: undefined
    }


});
