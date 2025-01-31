var DataMapping = require("./data-mapping").DataMapping,
    assign = require("../../core/frb/assign"),
    compile = require("../../core/frb/compile-evaluator"),
    DataService = require("./data-service").DataService,
    Criteria = require("../../core/criteria").Criteria,
    ObjectDescriptorReference = require("../../core/meta/object-descriptor-reference").ObjectDescriptorReference,
    parse = require("../../core/frb/parse"),
    Map = require("../../core/collections/map"),
    MappingRule = require("./mapping-rule").MappingRule,
    Promise = require("../../core/promise").Promise,
    Scope = require("../../core/frb/scope"),
    Set = require("../../core/collections/set"),
    deprecate = require("../../core/deprecate"),
    RawForeignValueToObjectConverter = require("../converter/raw-foreign-value-to-object-converter").RawForeignValueToObjectConverter,
    DataOperation = require("./data-operation").DataOperation,
    syntaxProperties = require("core/frb/syntax-properties"),
    SyntaxInOrderIterator = require("../../core/frb/syntax-iterator").SyntaxInOrderIterator;

var ONE_WAY_BINDING = "<-";
var TWO_WAY_BINDING = "<->";

/**
 * Maps raw data to data objects, using FRB expressions, of a specific type.
 *
 * TODO: Write more thorough description.
 *
 * @class
 * @extends external:DataMapping
 */
exports.ExpressionDataMapping = DataMapping.specialize(/** @lends ExpressionDataMapping.prototype */ {

    /***************************************************************************
     * Initialization
     */


    /**
     * @param   {ObjectDescriptor} objectDescriptor       - the definition of the objects
     *                                   mapped by this mapping.
     * @param   {DataService} service  - the data service this mapping should use.
     * @return itself
     */
    initWithServiceObjectDescriptorAndSchema: {
        value: function (service, objectDescriptor, schema) {
            this.service = service;
            this.objectDescriptor = objectDescriptor;
            this.rawDataDescriptor = schema;
            return this;
        }
    },


    /***************************************************************************
     * Serialization
     */

    serializeSelf: {
        value: function (serializer) {
            // serializer.setProperty("name", this.name);
            // if ((this._model) && (!this.model.isDefault)) {
            //     serializer.setProperty("model", this._model, "reference");
            // }
            //
            // if (this.objectDescriptorInstanceModule) {
            //     serializer.setProperty("objectDescriptorModule", this.objectDescriptorInstanceModule);
            // }
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            var value = deserializer.getProperty("objectDescriptor"),
                self = this,
                hasReferences = false,
                result = this;
            if (value) {
                if (value instanceof ObjectDescriptorReference) {
                    this.objectDescriptorReference = value;
                    hasReferences = true;
                } else {
                    this.objectDescriptor = value;
                }
            }

            this.schemaReference = deserializer.getProperty("schema");
            if (this.schemaReference) {
                hasReferences = true;
            }

            value = deserializer.getProperty("requisitePropertyNames");
            if (value) {
                this.addRequisitePropertyName.apply(this, value);
            }

            value = deserializer.getProperty("rawDataTypeName");
            if (value) {
                this.rawDataTypeName = value;
            }



            value = deserializer.getProperty("primaryKeyPropertyDescriptors");
            if (value) {
                this.primaryKeyPropertyDescriptors = value;
                this.rawDataPrimaryKeys = value.map((aPropertyDescriptor) => {return aPropertyDescriptor.name});
            } else {
                value = deserializer.getProperty("rawDataPrimaryKeys");
                if (value) {
                    this.rawDataPrimaryKeys = value;
                }
            }


            if (hasReferences && !deserializer.isSync) {
                result = this.resolveReferences().then(function () {
                    value = deserializer.getProperty("objectMapping");
                    if (value) {
                        self._rawOwnObjectMappingRules = value.rules;
                    }
                    value = deserializer.getProperty("rawDataMapping");
                    if (value) {
                        self._rawOwnRawDataMappingRules = value.rules;
                    }
                    return self;
                });
            } else {

                if(!this.objectDescriptor) {
                    this.objectDescriptor = deserializer._context._require(this._objectDescriptorReference._reference.objectDescriptorModule.id).montageObject;
                }

                value = deserializer.getProperty("objectMapping");
                if (value) {
                    self._rawOwnObjectMappingRules = value.rules;
                }
                value = deserializer.getProperty("rawDataMapping");
                if (value) {
                    self._rawOwnRawDataMappingRules = value.rules;
                }
            }
            return result;
        }
    },


    resolveReferences: {
        value: function () {
            var self = this;
            return this._resolveObjectDescriptorReferenceIfNecessary().then(function () {
                return self._resolveSchemaReferenceIfNecessary();
            });
        }
    },

    _resolveObjectDescriptorReferenceIfNecessary: {
        value: function () {
            var self = this,
                requiresInitialization = !this.objectDescriptor && this.objectDescriptorReference,
                promise = requiresInitialization ?  this.objectDescriptorReference :
                                                    Promise.resolve(null);
            return promise.then(function (objectDescriptor) {
                if (objectDescriptor) {
                    self.objectDescriptor = objectDescriptor;
                }
                return null;
            });
        }
    },

    _resolveSchemaReferenceIfNecessary: {
        value: function () {
            var self = this,
                requiresInitialization = !this.rawDataDescriptor && this.rawDataDescriptorReference,
                promise = requiresInitialization ?  this.rawDataDescriptorReference :
                    Promise.resolve(null);
            return promise.then(function (objectDescriptor) {
                if (objectDescriptor) {
                    self.rawDataDescriptor = objectDescriptor;
                }
                return null;
            });
        }
    },


    /***************************************************************************
     * Properties
     */

     /**
     * The scope against which rule expressions will be evaluated
     * @type {Scope}
     */

    __scope: {
        value: null
    },

    _scope: {
        get: function() {
            return this.__scope || new Scope(this.service);
        }
    },

    /***************************************************************************
     * Schema
     */

    /**
     * The descriptor of the objects that are mapped to by this
     * data mapping.
     * @type {ObjectDescriptor}
     */
    objectDescriptor: {
        get: function () {
            return this._objectDescriptor;
        },
        set: function (value) {
            this._objectDescriptor = value;
            this._objectDescriptorReference = new ObjectDescriptorReference().initWithValue(value);
        }
    },

    /**
     * A reference to the object descriptor that is used
     * by this mapping.  Used by serialized data mappings.
     * @type {ObjectDescriptorReference}
     */
    objectDescriptorReference: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this._objectDescriptorReference ? this._objectDescriptorReference.promise(require) :
                                                     Promise.resolve(null);
        }, "objectDescriptorReference", "objectDescriptor", true),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this._objectDescriptorReference = value;
        }, "objectDescriptorReference", "objectDescriptor", true)
    },

    /**
     * The mapping for the parent object descriptor to
     * this mapping's object descriptor.
     * @type {DataMapping}
     */
    parent: {
        get: function () {
            if (!this._parent && this.objectDescriptor && this.objectDescriptor.parent && this.service) {
                this._parent = this.service.mappingForType(this.objectDescriptor.parent);
                if (this._parent) {
                    this._hasGeneratedObjectMappingRules = false;
                    this._hasGeneratedRawDataMappingRules = false;
                }
            }
            return this._parent;
        }
    },


    /**
     * The name of the raw type mapped to the mapping's objectDescriptor.
     * Could be a different name for a REST API or
     * the name of a table/storage in a database.
     * If not set, returns the name of the ObjectDescriptor.
     *
     * In a database, this is needed for example to use
     * a vertical inheritance strategy where multiple subclasses
     * are stored in the same table, which also means in this case
     * that a DataService will have to use RawDataTypeMapping to
     * know how to instantiate RawData coming from a shared storage if
     * a query's type is a superclass and results will contain instances
     * of multiple types.
     *
     * If a mapping doesn't have a value set, it looks to it's service for an answer.
     *
     * @property {string}
     * @default undefined
     */
    _rawDataTypeName: {
        value: undefined
    },
    rawDataTypeName: {
        get: function () {
            return this._rawDataTypeName || (this._rawDataTypeName  = this.service.rawDataTypeNameForMapping(this) || this.objectDescriptor.name);
        },
        set: function (value) {
            this._rawDataTypeName = value;
        }
    },

    /**
     * An expression that should be added to any criteria when reading/writing data
     * for the ObjectDescriptor in the rawDataTypeName. This is necessary
     * to add this  expression to any fecth's criteria to get instances
     * of a type that is stored in the same table as others, or fetching a super class
     * and getting instances of any possible subclass.
     *
     * When creating data, every rawData needs to have this expression validate to
     * true, so we should use it like a binding that can change the rawData
     * to make the expression value.
     *
     * This might be worth turning into a  RawDataTypeMapping for effieciency,
     * but it's an implementation detail specic to a type's raw data mapping and
     * therefore belongs there rather than in another construction
     * at the DataService level.
     *
     * @property {string}
     * @default undefined
     */
    rawDataTypeExpression: {
        value: undefined
    },
    /**
     * The id of the raw type mapped to the mapping's objectDescriptor.
     * Could be statically generated by a tool, or dynamicallay fetched in the case
     * of a database that internally maintain unique ids for every object
     * created in a schema.
     *
     * If a mapping doesn't have a value set, it looks to it's service for an answer
     * and caches it.
     *
     * @property {string}
     * @default undefined
     */
    _rawDataTypeId: {
        value: undefined
    },
    rawDataTypeId: {
        get: function () {
            return this._rawDataTypeId || (this._rawDataTypeId = this.service.rawDataTypeIdForMapping(this));
        },
        set: function (value) {
            this._rawDataTypeId = value;
        }
    },

    isPrimaryKeyComponent: {
        value: function(value) {
            if(this.rawDataPrimaryKeys && this.rawDataPrimaryKeys.indexOf(value) !== -1) {
                return true;
            } else if(this.primaryKeyPropertyDescriptors) {
                for(var primaryKeyPropertyDescriptors = this.primaryKeyPropertyDescriptors, i=0, countI = primaryKeyPropertyDescriptors.length; (i<countI); i++) {
                    if(primaryKeyPropertyDescriptors[i].name === value) {
                        return true;
                    }
                }
                return false;
            }
        }
    },

    /**
     * Array of expressions that combine to make the primary key for objects
     * of the type defined by this.objectDescriptor. Will use this.parent.rawDataPrimaryKeys
     * if this.rawDataPrimaryKeys is not set
     * @type {Array<string>}
     */
    rawDataPrimaryKeys: {
        get: function () {
            return this._rawDataPrimaryKeys || this.parent && this.parent.rawDataPrimaryKeys;
        },
        set: function (value) {
            this._rawDataPrimaryKeys = value;
        }
    },

    rawDataPrimaryKeyExpressionSyntaxes: {
        get: function () {
            if (!this._rawDataPrimaryKeyExpressionSyntaxes && this.rawDataPrimaryKeys) {
                this._rawDataPrimaryKeyExpressionSyntaxes = this.rawDataPrimaryKeys.map(
                    function (key) {
                        return parse(key);
                    }
                );
            }
            return this._rawDataPrimaryKeyExpressionSyntaxes;
        }
    },

    rawDataPrimaryKeyProperties: {
        get: function() {
            return this.rawDataPrimaryKeyExpressionSyntaxes.map(syntaxProperties);
        }
    },


    rawDataPrimaryKeyCompiledExpressions: {
        get: function () {
            if (!this._rawDataPrimaryKeyCompiledExpressions && this.rawDataPrimaryKeys) {
                this._rawDataPrimaryKeyCompiledExpressions = this.rawDataPrimaryKeyExpressionSyntaxes.map(
                    function (expressionSyntax) {
                        return compile(expressionSyntax);
                    }
                );
            }
            return this._rawDataPrimaryKeyCompiledExpressions;
        }
    },

    /**
     * Adds a name to the list of rawDataPrimaryKeys
     * Array of expressions that combine to make the primary key for objects
     * of the type defined by this.objectDescriptor
     * @param {...string} propertyName
     */
    addRawDataPrimaryKey: {
        value: function () {
            var i, length, arg;
            for (i = 0, length = arguments.length; i < length; i += 1) {
                arg = arguments[i];
                if (!this._ownRequisitePropertyNames.has(arg)) {
                    this._ownRequisitePropertyNames.add(arg);
                    this._requisitePropertyNames = null; //To ensure all arguments are added to this.requisitePropertyNames
                }
            }
        }
    },

    /**
     * The required properties specific to this objectDescriptor. The
     * full requisitePropertyNames will be the union of these
     * and this.parent.requesitePropertyNames.
     */
    _ownRequisitePropertyNames: {
        get: function () {
            if (!this.__ownRequisitePropertyNames) {
                this.__ownRequisitePropertyNames = new Set();
            }
            return this.__ownRequisitePropertyNames;
        }
    },

    /**
     * The properties that will be eagerly mapped (I.E. mapped before
     * an instance can be returned from a fetch).
     *
     * For example, take an objectDescriptor and mapping for a class Foo:
     *    Foo {
     *      id
     *      name
     *      description
     *      bar
     *    }
     *
     *    FooMapping {
     *       requisitePropertyNames: ["id", "name", "description"]
     *    }
     *
     * A Foo object shall not be returned from a fetchData() call until
     * it's id, name, and description are mapped. Foo#bar will loaded
     * lazily only once it referenced on the returned Foo instance.
     * @property {Set}
     */
    requisitePropertyNames: {
        get: function () {
            var propertyName, iterator;

            if (!this._requisitePropertyNames) {
                this._requisitePropertyNames = new Set(this._ownRequisitePropertyNames);
                if (this.parent) {
                    iterator = this.parent.requisitePropertyNames.values();
                    while ((propertyName = iterator.next().value)) {
                        if (!this._requisitePropertyNames.has(propertyName)) {
                            this._requisitePropertyNames.add(propertyName);
                        }
                    }
                }
            }
            return this._requisitePropertyNames;
        }
    },

    _rawRequisitePropertyNames: {
        value: undefined
    },
    rawRequisitePropertyNames: {
        get: function () {
            if(!this._rawRequisitePropertyNames) {
                this._rawRequisitePropertyNames = new Set();

                var iterator = this.requisitePropertyNames.values(),
                objectRule, rule, objectMappingRules = this.objectMappingRules,
                rawDataMappingRules = this.rawDataMappingRules,
                promises, propertyName, result = this._rawRequisitePropertyNames;


                if (this.requisitePropertyNames.size) {
                    while ((propertyName = iterator.next().value)) {
                        objectRule = this.objectMappingRuleForPropertyName(propertyName);
                        if(objectRule) {
                            /*
                                Test for polymorphic Associations with the Exclusive Belongs To (AKA Exclusive Arc) strategy where each potential destination table
                                gets it's matching foreignKeyId
                            */
                           var objectRuleConverter = objectRule.converter,
                           objectRuleConverterForeignDescriptorMappings = objectRuleConverter && objectRuleConverter.foreignDescriptorMappings,
                           j, countJ;

                            if(objectRuleConverterForeignDescriptorMappings && objectRule.sourcePath === "this") {

                                for(j=0, countJ = objectRuleConverterForeignDescriptorMappings.length;(j<countJ);j++) {
                                    result.add(objectRuleConverter.rawDataPropertyForForeignDescriptor(objectRuleConverterForeignDescriptorMappings[j].type));
                                }

                            } else if(objectRuleConverterForeignDescriptorMappings && objectRule.sourcePathSyntax && objectRule.sourcePathSyntax.type === "record") {
                                var rawForeignKeys = Object.keys(objectRule.sourcePathSyntax.args);

                                for(j=0, countJ = rawForeignKeys.length;(j<countJ);j++) {
                                    result.add(rawForeignKeys[j]);
                                }

                            } else {
                                //rule = rawDataMappingRuleForPropertyName(objectRule.sourcePath);
                                result.add(objectRule.sourcePath);
                            }
                        } else {
                            console.error("expression-data-mapping.js: - rawRequisitePropertyNames: couldn't find object rule for propertyName -"+propertyName+" of objectDescriptor "+this.objectDescriptor.name);
                            rule = null;
                        }

                        // if(rule) {
                        //     result.add(objectRule.sourcePath);
                        // }
                    }
                }

            }
            return this._rawRequisitePropertyNames;
        }
    },

    /**
     * Adds a name to the list of properties that will participate in
     * eager mapping.  The requisite property names will be mapped
     * during the map from raw data phase.
     * @param {...string} propertyName
     */
    addRequisitePropertyName: {
        value: function () {
            var i, length, arg;
            for (i = 0, length = arguments.length; i < length; i += 1) {
                arg = arguments[i];
                if (!this._ownRequisitePropertyNames.has(arg)) {
                    this._ownRequisitePropertyNames.add(arg);
                    this._requisitePropertyNames = null; //To ensure all arguments are added to this.requisitePropertyNames
                    this._rawRequisitePropertyNames = null;
                }
            }
        }
    },


    /**
     * The descriptor of the "raw data" mapped from by this
     * data mapping.
     * @type {ObjectDescriptor}
     */
    _rawDataDescriptor: {
        value: undefined
    },
    rawDataDescriptor: {
        get: function () {
            /*
                If this.service programmatically creates a rawDataDescriptor for an ObjectDescriptor, it means that RawDataService loops over the ObjectDescriptor, and use the mapping to decide how the RawDataDescriptor should be, calling mapping.objectMappingRuleForPropertyName(), then this._initializeObjectMappingRuleForPropertyName(), ...
                and we loop back here on .rawDataDescriptor via makeRuleFromRawRule() -> ._defaultConverter() -> .rawDataDescriptor

                All of this because we try to find a default converter using _converterForValueTypes() that does:
                            var converters = exports.ExpressionDataMapping.defaultConverters;
                            return converters[sourceType] && converters[sourceType][destinationType] || null;


                But, does it even make sense to have a such a lookup on a class setting when converters are typically specified per RawDataService?

                So we need to solve that design problem before we could do this.
            */
            // if(this._rawDataDescriptor === undefined) {
            //     //Give service a chance to provide one, likely programmatically buit otherwise it would have been set in serialization
            //     var value = this.service.rawDataDescriptorForDataMapping(this);
            //     if(value !== undefined) {
            //         this._rawDataDescriptor = value;
            //     }
            // }
            return this._rawDataDescriptor;
        },
        set: function (value) {
            this._rawDataDescriptor = value;
            if (value) {
                this._rawDataDescriptorReference = new ObjectDescriptorReference().initWithValue(value);
            }
        }
    },

    /**
     * A reference to the object descriptor of the "raw data" that
     * is used by this mapping.  Used by serialized data mappings.
     * @type {ObjectDescriptorReference}
     */
    rawDataDescriptorReference: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this._rawDataDescriptorReference ? this._rawDataDescriptorReference.promise(require) :
                                                     Promise.resolve(null);
        }, "rawDataDescriptorReference", "rawDataDescriptor", true),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this._rawDataDescriptorReference = value;
        }, "rawDataDescriptorReference", "rawDataDescriptor", true)
    },


    /**
     * The service that owns this mapping object.
     * Used to create fetches for relationships.
     * @type {DataService}
     */
    _service: {
        value: undefined
    },

    _propagateServiceToMappingRulesConverter: {
        value: function(service, mappingRules) {
            if(service && mappingRules) {
                var valuesIterator = mappingRules.values(),
                iRule;

                while((iRule = valuesIterator.next().value)) {
                    if(iRule.converter) {
                        iRule.converter.service = service;
                    }
                    if(iRule.reverter) {
                        iRule.reverter.service = service;
                    }
                }
            }
        }
    },

    service: {
        get: function () {
            return this._service;
        },
        set: function (value) {
            if(value !== this._service) {
                this._service = value;

                //Propagate to rules one and for all
                //this._propagateServiceToMappingRulesConverter(value, this.objectMappingRules);
                //this._propagateServiceToMappingRulesConverter(value, this.rawDataMappingRules);
            }
        }
    },



    /***************************************************************************
     * Mapping
     */

    /**
     * Convert raw data to data objects of an appropriate type.
     *
     * Subclasses should override this method to map properties of the raw data
     * to data objects, as in the following:
     *
     *     mapRawDataToObject: {
     *         value: function (data, object) {
     *             object.firstName = data.GIVEN_NAME;
     *             object.lastName = data.FAMILY_NAME;
     *         }
     *     }
     *
     * The default implementation of this method copies the properties defined
     * by the raw data object to the data object.
     *
     * @method
     * @argument {Object} data   - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     */

     /*
        if we make this.requisitePropertyNames a default prefetchExpression
        for a query, and pass an array to mapRawDataToObject, then we should
        be able to unify both use cases

        1.If we have Cache Object.keys(rawData) -> the rules that matched
            loop on that, else build the cache:

            1. Loop on object rules:
                forEach object side rule (they are property names so far):

                    if(rule has an raw-property-value-to-object-converter && not in prerequiste && not in object/prefetchExpression) {
                        skip;
                    } else {
                        get requirements (list of raw data properties)
                        assess if Objec.keys(rawData) contains all of them.
                            if(yes, that rule can and need to be mapped)
                        //Cache Object.keys(rawData) -> the rules that matched

                    }
                }
     */

    // _mappingRulesByRawDataProperty: {
    //     value: undefined
    // },

    /**
     * gather all ObjectMapping rules that require rawDataProperty
     *
     * @method
     * @argument {Set} rawDataProperties - An set of RawData properties. Set vs Array as the order could depend on server
     *                                      but we need an order agnostic data struture.
     * @returns {DataStream|Promise|?}   - Either the value or a "promise" for it
     *
     */
    // _buildMappingRulesForRawDataProperty: {
    //     value: function (rawDataProperty) {
    //         var objectMappingRules = this.objectMappingRules,
    //             rulesIterator = objectMappingRules.values(),
    //             allMappingRules = new Set;
    //             aRule, aRulePropertyRequirements;

    //         while ((aRule = iterator.next().value)) {
    //             aRulePropertyRequirements = aRule.requirements;
    //             if()

    //             allMappingRules.add(aRule);
    //         }
    //         this._mappingRulesByRawDataProperty.set(rawDataProperty,allMappingRules);

    //         ;

    //     }
    // },

    // mappingRulesForRawDataProperty: {
    //     value: function (rawDataProperty) {
    //         return this._mappingRulesByRawDataProperty.get(rawDataProperty) ||
    //                 this._buildMappingRulesForRawDataProperty(rawDataProperty);
    //     }
    // },

    //Cache the union of all the object rules relevant to a set of RawDataKeys
    __mappingRulesByRawDataProperties: {
        value: undefined
    },

    _mappingRulesByRawDataProperties: {
        get: function() {
            return this.__mappingRulesByRawDataProperties || (this.__mappingRulesByRawDataProperties = new Map());
        }
    },

    // _buildMappingRulesForRawDataProperties: {
    //     value: function (rawDataProperties) {
    //         console.warn("_buildMappingRulesForRawDataProperties "+rawDataProperties);
    //         var objectMappingRules = this.objectMappingRules,
    //             iObjectMappingPropertyName,
    //             rawDataPropertiesSet = new Set(rawDataProperties),
    //             // rulesIterator = objectMappingRules.values(),
    //             matchingRules = new Set(),
    //             aRule, aRulePropertyRequirements, iMatch,
    //             i, countI;

    //         // while ((aRule = rulesIterator.next().value)) {
    //         for(iObjectMappingPropertyName in objectMappingRules) {
    //             if(aRule = objectMappingRules[iObjectMappingPropertyName]) {
    //                 aRulePropertyRequirements = aRule.requirements;
    //                 if(aRulePropertyRequirements) {
    //                     iMatch = 0;
    //                     for(i=0, countI = aRulePropertyRequirements.length;i<countI;i++) {
    //                         if (rawDataPropertiesSet.has(aRulePropertyRequirements[i])) {
    //                             iMatch++;
    //                         }
    //                     }
    //                     if(iMatch === countI) {
    //                         matchingRules.add(aRule);
    //                     }
    //                 }
    //             }
    //         }
    //         this._mappingRulesByRawDataProperties.set(rawDataProperties, (matchingRules = Array.from(matchingRules)));
    //         return matchingRules;
    //     }
    // },

    _buildMappingRulesForRawDataProperty: {
        value: function (rawDataProperty) {
            var objectMappingRules = this.objectMappingRules,
                iObjectMappingPropertyName,
                matchingRules = new Set(),
                aRule, aRulePropertyRequirements,
                i, countI;

            for(iObjectMappingPropertyName in objectMappingRules) {
                if(aRule = objectMappingRules[iObjectMappingPropertyName]) {
                    aRulePropertyRequirements = aRule.requirements;
                    if(aRulePropertyRequirements) {
                        for(i=0, countI = aRulePropertyRequirements.length;i<countI;i++) {
                            let aRuleCache = aRulePropertyRequirements[i];
                            if (Array.isArray(aRuleCache)) {
                                for(let j=0, countJ = aRuleCache.length; j<countJ; j++) {
                                    if (rawDataProperty === aRuleCache[j]) {
                                        matchingRules.add(aRule)
                                    }
                                }
                            } else if (rawDataProperty === aRulePropertyRequirements[i]) {
                                matchingRules.add(aRule);
                            }
                        }
                    }
                }
            }
            this._mappingRulesByRawDataProperties.set(rawDataProperty, (matchingRules = Array.from(matchingRules)));
            return matchingRules;
        }
    },


    /**
     * Returns all ObjectMapping rules that are can be mapped if one have these set of raw property keys
     *
     * @method
     * @argument {Set} rawDataProperties - An set of RawData properties. Set vs Array as the order could depend on server
     *                                      but we need an order agnostic data struture.
     * @returns {DataStream|Promise|?}   - Either the value or a "promise" for it
     *
     */
    // mappingRulesForRawDataProperties: {
    //     value: function (rawDataProperties) {
    //         return this._mappingRulesByRawDataProperties.get(rawDataProperties) ||
    //                     this._buildMappingRulesForRawDataProperties(rawDataProperties);
    //     }
    // },

    mappingRulesForRawDataProperty: {
        value: function (rawDataProperty) {
            return this._mappingRulesByRawDataProperties.get(rawDataProperty) ||
                        this._buildMappingRulesForRawDataProperty(rawDataProperty);
        }
    },



    //Cache the union of all the object rules relevant to a set of RawDataKeys
    __rawDataMappingRulesByObjectProperties: {
        value: undefined
    },

    _rawDataMappingRulesByObjectProperties: {
        get: function() {
            return this.__rawDataMappingRulesByObjectProperties || (this.__rawDataMappingRulesByObjectProperties = new Map());
        }
    },

    _buildRawDataMappingRulesForObjectProperty: {
        value: function (objectProperty) {
            var rawDataMappingRules = this.rawDataMappingRules,
                iRawDataMappingPropertyName,
                matchingRules = new Set(),
                aRule, aRulePropertyRequirements, iMatch,
                i, countI;

            for (iRawDataMappingPropertyName in rawDataMappingRules) {
                aRule = rawDataMappingRules[iRawDataMappingPropertyName];
                aRulePropertyRequirements = aRule.requirements;
                if(aRulePropertyRequirements) {
                    iMatch = 0;
                    for(i=0, countI = aRulePropertyRequirements.length;i<countI;i++) {
                        if (objectProperty === aRulePropertyRequirements[i]) {
                            iMatch++;
                        }
                    }
                    /*
                        rawDataMappingRules is an object that inherits properties from the parent mapping.
                        if the mapping overrides a property from it's parent, we want it and don't want to have
                        the parent as well.
                    */
                    if(iMatch === countI && matchingRules.size === 0) {
                        matchingRules.add(aRule);
                    }
                }
            }
            this._rawDataMappingRulesByObjectProperties.set(objectProperty,matchingRules);
            return matchingRules;
        }
    },

    /**
     * Returns all rawDataMappingRules that are can be mapped if one have these set of object property keys
     *
     * @method
     * @argument {Set} ObjectProperties - An set of object properties. Set vs Array as the order could depend on server
     *                                      but we need an order agnostic data struture.
     * @returns {DataStream|Promise|?}   - Either the value or a "promise" for it
     *
     */
    rawDataMappingRulesForObjectProperty: {
        value: function (objectProperty) {
            return this._rawDataMappingRulesByObjectProperties.get(objectProperty) ||
                        this._buildRawDataMappingRulesForObjectProperty(objectProperty);
        }
    },

    _mapRawDataPropertiesToObject: {
        value: function(data, object, context, readExpressions, mappingScope, unmappedRequisitePropertyNames, promises, mappedProperties) {
            var rawDataProperties = data ? Object.keys(data) : null,
                result,
                rawDataPropertyIteration = 0, rawDataPropertyIterationCount = (rawDataProperties?.length || 0),
                dataMatchingRules,
                requisitePropertyNames = this.requisitePropertyNames,
                hasSnapshot = this.service.hasSnapshotForObject(object),
                aRule,
                matchingRules = new Set(),
                aRuleRequirements, i, countI,
                service = this.service,
                objectDescriptor = this.objectDescriptor,
                r = 0,
                dataHasRuleRequirements,
                isObjectCreated = service.isObjectCreated(object),
                changesForDataObject,
                mainService;

            /*
                If data is null and we have readExpressions, which are object-level, we go on and set those.
            */
            if(data === null && rawDataPropertyIterationCount === 0 && readExpressions.length > 0) {
                for(let iReadExpression of readExpressions) {
                    object[iReadExpression] = null;
                }
            }
            else {
                /*
                    We have a rawData object to work with, we proceed to mapping properties it holds
                */
                for(;(rawDataPropertyIteration < rawDataPropertyIterationCount); rawDataPropertyIteration++) {
                    dataMatchingRules = this.mappingRulesForRawDataProperty(rawDataProperties[rawDataPropertyIteration]);
    
                    r = 0;
                    while ((aRule = dataMatchingRules[r++])) {
    
                        /*
                            If a rawData property led us to a Rule we've seen before, we don't want to process it twice
                        */
                        if(matchingRules.has(aRule)) {
                            continue;
                        }
    
                        matchingRules.add(aRule);
    
                        isRequiredRule = requisitePropertyNames.has(aRule.targetPath) ||  (readExpressions && readExpressions.indexOf(aRule.targetPath) !== -1);
                        aRuleRequirements = aRule.requirements;
                        dataHasRuleRequirements = true;
    
                        //Check if the rule has what it needs.
                        // FIXME: aRuleRequirements contains properties from root object down to nested objects -- but will only work for one level deep.
                        // Nested objects need to be resolved for more complex scenarios. E.g., 5 level nested properties duplicated.
                        // [[]] of rules. 
                        // TODO: Use or build a Property iterator on the syntactic tree. (no duplication of data structures, lighter weight :) )
                        // Explore if using expression evaluation is feasible (this is an assessment if data is really accesible).
                        // Theoretically production shouldn't waste time computing this; only in development while data is flexible.
                        let iData = data
                        for(i=0, countI = aRuleRequirements.length;(i<countI);i++) {
                            if (Array.isArray(aRuleRequirements[i])) {
                                let propertyPath = aRuleRequirements[i];
                                let jData = iData;
                                for(j=0, countJ = propertyPath.length; (j<countJ); j++) {
                                    if (!jData.hasOwnProperty(propertyPath[j])) {
                                        dataHasRuleRequirements = false;
                                        break;
                                    } else {
                                        jData = jData[propertyPath[j]]
                                    }
                                }
                            }
                            else if(!iData.hasOwnProperty(aRuleRequirements[i])) {
                                dataHasRuleRequirements = false;
                                break;
                            }
                        }    
                        if(isRequiredRule && !dataHasRuleRequirements) {
                            console.error("Rule: ",aRule, "can't be mapped because data is missing required property \"" + aRuleRequirements[i] + "\"");
                        }
    
                        /*
                            #WARNING TO DO: IF WE HAVE PENDING CHANGES - A DIFFERENT VALUE - FOR A PROPERTY THAT WOULD BE OVERRIDEN BY THIS CURRENT MAPPING WE'RE GOING TO HAVE
                            TO TELL THE USER ABOUT IT TO RESOLVE
    
                            original condition: Why do we even need to consider snapshot here?
    
                            if((!hasSnapshot && !requisitePropertyNames.has(aRule.targetPath)) || ((aRule.converter && (aRule.converter instanceof RawForeignValueToObjectConverter)) &&
                                !requisitePropertyNames.has(aRule.targetPath) &&
                                (readExpressions && readExpressions.indexOf(aRule.targetPath) === -1))) {
                                    continue;
                            }
                        */
    
                        /*
                            if we don't have what we need to fullfill, we bail out.
    
                            Previously if the rule isn't required, we would bail out, but if it's been sent ny the server, me might as well make it useful than stay unused in the snapshot, as long as we can.
                        */
    
                        // if(service.canMapObjectDescriptorRawDataToObjectPropertyWithoutFetch(objectDescriptor, aRule.targetPath) && dataHasRuleRequirements) {
                        //     console.log("Now mapping property "+aRule.targetPath+" of "+objectDescriptor.name);
                        // }
    
                        if((!isRequiredRule && !service.canMapObjectDescriptorRawDataToObjectPropertyWithoutFetch(objectDescriptor, aRule.targetPath)) || !dataHasRuleRequirements) {
                            continue;
                        }
                        // if(!isRequiredRule || !dataHasRuleRequirements) {
                        //     continue;
                        // }

                        /*
                            Tell our service: mappingWillMapRawDataToObjectProperty
                        */
                        service.mappingWillMapRawDataToObjectProperty(this, data, object, aRule.targetPath, context, mappingScope);
    
                        result = this.mapRawDataToObjectProperty(data, object, aRule.targetPath, context, mappingScope);
                        if(isObjectCreated) {
                            if (this._isAsync(result)) {
                                const targetPath = aRule.targetPath;
                                result = result.then((resultValue) => {
                                    this._registerMappedPropertyValueAsChangesForCreatedObject(targetPath, resultValue, (changesForDataObject || (changesForDataObject = service.changesForDataObject(object))), object, (mainService || (mainService = service.mainService)));      
                                    /*
                                        Tell our service: mappingDidMapRawDataToObjectProperty
                                    */
                                    service.mappingDidMapRawDataToObjectProperty(this, data, object, targetPath, context, mappingScope);
  
                                    return resultValue;
                                });
                            } else {
                                this._registerMappedPropertyValueAsChangesForCreatedObject(aRule.targetPath, result, (changesForDataObject || (changesForDataObject = service.changesForDataObject(object))), object, (mainService || (mainService = service.mainService)));
                                /*
                                    Tell our service: mappingDidMapRawDataToObjectProperty
                                */
                                service.mappingDidMapRawDataToObjectProperty(this, data, object, aRule.targetPath, context, mappingScope);

                            }
                        }
                        unmappedRequisitePropertyNames.delete(aRule.targetPath);
                        
                        if (this._isAsync(result)) {
                            (promises || (promises = [])).push(result);
                        }
                    }
                }
            }

            
            return promises;
        }
    },

    _registerMappedPropertyValueAsChangesForCreatedObject: {
        value: function(mappedProperty, value, objectChanges, createdObject, _mainService = this.service.mainService) {
            /*
                If the object is created and we're mapping it, we need to record values set as changes
                so will be saved properly.
            */
                objectChanges.set(mappedProperty, value);
        
            /*
                If there's a value, we attempt to merge it. mergeDataObject takes care of deciding if value
                is a DataObject worth tracking
            */
            if(value) {
                _mainService.mergeDataObject(value);
            }
    
        }
    },

    _mapRawDataToObjectRequisiteProperties: {
        value: function(data, object, context, readExpressions, mappingScope, requisitePropertyNames, promises) {
            if (requisitePropertyNames.size) {
                let iterator = requisitePropertyNames.values(),
                propertyName, result;

                while ((propertyName = iterator.next().value)) {
                    result = this.mapRawDataToObjectProperty(data, object, propertyName, context, mappingScope);
                    if (this._isAsync(result)) {
                        (promises || (promises = [])).push(result);
                    }
                }
            }
            return promises;
        }
    },

    mapRawDataToObject: {
        value: function (rawData, object, context, readExpressions, mappedProperties) {
            var promises,
                requisitePropertyNames = this.requisitePropertyNames,
                unmappedRequisitePropertyNames = new Set(requisitePropertyNames),
                mappingScope;

            if(context instanceof DataOperation) {
                mappingScope = this._scope.nest(context);
                mappingScope = mappingScope.nest(rawData);

            } else {
                mappingScope = this._scope.nest(rawData);
            }

            /*
                Tell our service it's about to start
                TODO: We may need to pass an additional 'mappedProperties' array argument to collect and communicate 
                back to our service
            */
            data = this.service.mappingWillMapRawDataToObject(this, rawData, object, context, readExpressions)

            promises = this._mapRawDataPropertiesToObject(rawData, object, context, readExpressions, mappingScope, unmappedRequisitePropertyNames, promises, mappedProperties);
            
            /*
                This is causing problems: as partial aspects of the object are filled-in, the attempts to run mapping rules for object properties on raw data that doesn't contain
                the right raw properties, we end up with undefiend values, overriding previously successfully mapped ones.

                To avoid that, we'd need to only run a rule after we verified the raw data has the properties a rule expect to be there.
            */
            //promises = this._mapRawDataToObjectRequisiteProperties(data, object, context, readExpressions, mappingScope, unmappedRequisitePropertyNames, promises);



            // for(;(rawDataPropertyIteration < rawDataPropertyIterationCount); rawDataPropertyIteration++) {
            //     dataMatchingRules = this.mappingRulesForRawDataProperty(rawDataProperties[rawDataPropertyIteration]);

            //     r = 0;
            //     while ((aRule = dataMatchingRules[r++])) {

            //         /*
            //             If a rawData propety led us to a Rule we've seen before, we don't want to process it twice
            //         */
            //         if(matchingRules.has(aRule)) {
            //             continue;
            //         }

            //         matchingRules.add(aRule);

            //         isRequiredRule = requisitePropertyNames.has(aRule.targetPath) ||  (readExpressions && readExpressions.indexOf(aRule.targetPath) !== -1);
            //         aRuleRequirements = aRule.requirements;
            //         dataHasRuleRequirements = true;

            //         //Check if the rule has what it needs.
            //         for(i=0, countI = aRuleRequirements.length;(i<countI);i++) {
            //             if(!data.hasOwnProperty(aRuleRequirements[i])) {
            //                 dataHasRuleRequirements = false;
            //                 break;
            //             }
            //         }

            //         if(isRequiredRule && !dataHasRuleRequirements) {
            //             console.error("Rule: ",aRule, "can't be mapped because data is missing required property \"" + aRuleRequirements[i] + "\"");
            //         }

            //         /*
            //             #WARNING TO DO: IF WE HAVE PENDING CHANGES - A DIFFERENT VALUE - FOR A PROPERTY THAT WOULD BE OVERRIDEN BY THIS CURRENT MAPPING WE'RE GOING TO HAVE
            //             TO TELL THE USER ABOUT IT TO RESOLVE

            //             original condition: Why do we even need to consider snapshot here?

            //             if((!hasSnapshot && !requisitePropertyNames.has(aRule.targetPath)) || ((aRule.converter && (aRule.converter instanceof RawForeignValueToObjectConverter)) &&
            //                 !requisitePropertyNames.has(aRule.targetPath) &&
            //                 (readExpressions && readExpressions.indexOf(aRule.targetPath) === -1))) {
            //                     continue;
            //             }
            //         */

            //         /*
            //             if we don't have what we need to fullfill, we bail out.

            //             Previously if the rule isn't required, we would bail out, but if it's been sent ny the server, me might as well make it useful than stay unused in the snapshot, as long as we can.
            //         */

            //         // if(service.canMapObjectDescriptorRawDataToObjectPropertyWithoutFetch(objectDescriptor, aRule.targetPath) && dataHasRuleRequirements) {
            //         //     console.log("Now mapping property "+aRule.targetPath+" of "+objectDescriptor.name);
            //         // }

            //         if((!isRequiredRule && !service.canMapObjectDescriptorRawDataToObjectPropertyWithoutFetch(objectDescriptor, aRule.targetPath)) || !dataHasRuleRequirements) {
            //             continue;
            //         }
            //         // if(!isRequiredRule || !dataHasRuleRequirements) {
            //         //     continue;
            //         // }

            //         result = this.mapRawDataToObjectProperty(data, object, aRule.targetPath, context, mappingScope);
            //         if (this._isAsync(result)) {
            //             (promises || (promises = [])).push(result);
            //         }
            //     }
            // }


            return (promises && promises.length &&
                ( promises.length === 1
                    ? promises[0].then(() => object)
                    : Promise.all(promises).then(() => object))
                ) 
                || 
                (
                    //Tell our service we're done
                    this.service.mappingDidMapRawDataToObject(this, rawData, object, context, mappedProperties)
                    ||
                    Promise.resolve(object)
                );
        }
    },


    // mapRawDataToObject: {
    //     value: function (data, object, context, isUpdateToExistingObject) {
    //         var iterator = this.requisitePropertyNames.values(),
    //             promises, propertyName, result;

    //         if(isUpdateToExistingObject) {
    //             var dataKeys = Object.keys(data),
    //                 i, countI = dataKeys.length,
    //                 rawDataMappingRules = this.rawDataMappingRules,
    //                 objectMappingRules = this.objectMappingRules,

    //                 iKey, iRule;
    //             for(i=0;i<countI;i++) {


    //                 iKey = dataKeys[i];
    //                 iRule = this.rawDataMappingRuleForPropertyName(iKey);
    //                 if(iRule) {
    //                     result = this.mapRawDataToObjectProperty(data, object, iRule.targetPath, context);
    //                     if (this._isAsync(result)) {
    //                         (promises || (promises = [])).push(result);
    //                     }
    //                 }
    //             }

    //         }
    //         else {
    //             if (this.requisitePropertyNames.size) {
    //                 while ((propertyName = iterator.next().value)) {
    //                     result = this.mapRawDataToObjectProperty(data, object, propertyName, context);
    //                     if (this._isAsync(result)) {
    //                         (promises || (promises = [])).push(result);
    //                     }
    //                 }
    //             }
    //         }

    //         return promises && promises.length && Promise.all(promises);
    //     }
    // },

    /**
     * Maps the value of a single raw data property onto the model object
     *
     * @method
     * @argument {Object} data           - An object whose properties' values
     *                                     hold the raw data.
     * @argument {Object} object         - The object on which to assign the property
     * @argument {string} propertyName   - The name of the model property to which
     *                                     to assign the value(s).
     * @returns {DataStream|Promise|?}   - Either the value or a "promise" for it
     *
     */
    mapRawDataToObjectProperty: {
        value: function (data, object, propertyName, context, scope = this._scope.nest(data)) {
            var rule = this.objectMappingRuleForPropertyName(propertyName),
                propertyDescriptor = rule && this.objectDescriptor.propertyDescriptorForName(propertyName),
                isRelationship = propertyDescriptor && !propertyDescriptor.definition && propertyDescriptor.valueDescriptor,
                isDerived = propertyDescriptor && !!propertyDescriptor.definition,
                propertyScope,
                locales,
                debug = DataService.debugProperties.has(propertyName) || (rule && rule.debug === true);


            //Simplistic and potentially wrong, but if there's no properties on data for that rule, then there's no point doing it
            // if(rule && !data.hasOwnProperty(rule.sourcePath)) {
            //     return undefined;
            // }


            // Check if property is included in the DataService.debugProperties collection. Intended for debugging.
            if (debug) {
                console.debug("ExpressionDataMapping.mapRawDataToObjectProperty", object, propertyName);
                console.debug("To debug ExpressionDataMapping.mapRawDataToObjectProperty for " + propertyName + ", set a breakpoint here.");
            }

            // propertyScope = scope.nest(data);

            //Try to pass on the locales context to prepare the rule:
            if(context instanceof DataOperation) {
                var referrerOperation = this.service.referrerForDataOperation(context);

                if(referrerOperation && referrerOperation.criteria && referrerOperation.criteria.parameters) {
                    locales = referrerOperation.criteria.parameters.DataServiceUserLocales;
                }
            }

            this._prepareRawDataToObjectRule(rule, propertyDescriptor, locales);


            return  isRelationship ?                                this._resolveRelationship(object, propertyDescriptor, rule, scope) :
                    propertyDescriptor && !isDerived ?              this._resolveProperty(object, propertyDescriptor, rule, scope) :
                                                                    null;
        }
    },
    _resolveRelationship: {
        value: function (object, propertyDescriptor, rule, scope) {
            //console.debug(object.dataIdentifier.objectDescriptor.name+" - "+propertyDescriptor.name+" _resolveRelationship on object id: "+object.dataIdentifier.primaryKey);
            var self = this,
                hasInverse = !!propertyDescriptor.inversePropertyName,
                ruleEvaluationResult = rule.evaluate(scope),
                penultimateStep;
                //data;

            function ruleEvaluated(result) {

                // console.debug(object.dataIdentifier.objectDescriptor.name+" - "+propertyDescriptor.name+" _resolveRelationship on object id: "+object.dataIdentifier.primaryKey +" resolved to ",result);
                var data;
                if(propertyDescriptor.cardinality === 1 &&
                    result instanceof Array
                ) {
                    if(result.length === 1) {
                        data = result[0];
                    } else if(result.length === 0) {
                        data = null;
                    } else {
                        console.error("_resolveRelationship(object:",object,"propertyDescriptor:",propertyDescriptor, "objectDescriptor:", self.objectDescriptor.name+" rule evaluated to an array with more then one value ("+result+") for a cardinality of 1. rule:",rule," with scope:",scope);
                        data = null;
                    }
                }
                else {
                    data = result;
                }

                return hasInverse ? self._assignInversePropertyValue(data, object, propertyDescriptor, rule).then(function() {return data;}) : data;
            }

            function ruleEvaluationError(error) {
                var message = "Failed to evaluate expression data mapping rule.\n";
                message += error.message;
                error.rule = rule;
                error.scope = scope;
                console.error("_resolveRelationship(object:",object,"propertyDescriptor:",propertyDescriptor, "objectDescriptor:", self.objectDescriptor.name+" failed to evaluate rule:",rule," with scope:",scope, "error:",error);
                throw error;
            }

            if (this._isAsync(ruleEvaluationResult)) {
                penultimateStep = ruleEvaluationResult.then(ruleEvaluated, ruleEvaluationError);
            } else {
                penultimateStep = ruleEvaluated(ruleEvaluationResult);
            }

            if (this._isAsync(penultimateStep)) {
                return penultimateStep.then(function (data) {
                    self._setObjectValueForPropertyDescriptor(object, data, propertyDescriptor, true);
                    return data;
                });
            } else {
                /*
                    If a propertyDescriptor has a valueDescriptor, it is treated as a relationship. In the case of a Date for example, a converter isn't async so it returns a value that isn't a promise and there was no code to still assign the result to the object. This fixes it.
                */
                //object[propertyDescriptor.name] = data;
                return (object[propertyDescriptor.name] = penultimateStep);
            }

        }
    },

    // _resolveRelationship: {
    //     value: function (object, propertyDescriptor, rule, scope) {
    //         //console.debug("_resolveRelationship "+propertyDescriptor.name+" on ",object);
    //         var self = this,
    //             hasInverse = !!propertyDescriptor.inversePropertyName,
    //             data;

    //         return rule.evaluate(scope).then(function (result) {
    //             if(propertyDescriptor.cardinality === 1 &&
    //                 result instanceof Array &&
    //                 result.length === 1
    //             ) {
    //                 data = result[0];
    //             }
    //             else {
    //                 data = result;
    //             }

    //             return hasInverse ? self._assignInversePropertyValue(data, object, propertyDescriptor, rule) : null;
    //         }, function(error) {
    //             var message = "Failed to evaluate expression data mapping rule.\n";
    //             message += error.message;
    //             error.rule = rule;
    //             error.scope = scope;
    //             console.error("failed to evaluate rule:",rule," with scope:",scope);
    //             throw error;
    //         }).then(function () {
    //             self._setObjectValueForPropertyDescriptor(object, data, propertyDescriptor);
    //             return null;
    //         });
    //     }
    // },

    _assignInversePropertyValue: {
        value: function (data, object, propertyDescriptor, rule) {
            var self = this,
                inversePropertyName = propertyDescriptor.inversePropertyName;

            return propertyDescriptor.valueDescriptor.then(function (objectDescriptor) {
                var inversePropertyDescriptor = objectDescriptor.propertyDescriptorForName(inversePropertyName);

                if(inversePropertyName && !inversePropertyDescriptor) {
                    console.warn("ExpressionDataMapping _assignInversePropertyValue() failed: no inversePropertyDescriptor found named "+inversePropertyName+" of "+object.objectDescriptor.name);
                }
                if (data) {
                    //Adding shouldFlagObjectBeingMapped argument to true.
                    if(Array.isArray(data)) {
                        self._setObjectsValueForPropertyDescriptor(data, object, inversePropertyDescriptor, true);
                    } else {
                        self._setObjectValueForPropertyDescriptor(data, object, inversePropertyDescriptor, true);
                    }

                }
                return null;
            });
        }
    },

    _setRawDataPropertyValueIfNeeded: {
        value: function(rawData, rawDataPropertyName, rawDataPropertValue, lastReadSnapshot, rawDataSnapshot) {
            /*
                If lastReadSnapshot and rawDataSnapshot are defined, we add check, now with allraw property name and value that we should se
            */

            /*
                It's great to construct the rawDataSnapshot of the previous values of keys that chanegd
                but if key is a toMany array, rawDataPropertValue is going to be like:
                {
                    addedValues: [,,,],
                    removedValues: [,,,]
                }

                and that can't be directly compared to the structure of lastReadSnapshot....

                So we check for that. That said, it might be cleaner to pass on the relevant property descriptor which is available in the methods calling this as there might be richer semantics there.
            */

           if(lastReadSnapshot && rawDataSnapshot &&
            !(rawDataPropertValue && typeof rawDataPropertValue === "object" && (rawDataPropertValue.hasOwnProperty("addedValues") || rawDataPropertValue.hasOwnProperty("removedValues")))) {

                if(lastReadSnapshot[rawDataPropertyName] !== rawDataPropertValue) {
                    rawData[rawDataPropertyName] = rawDataPropertValue;
                    if(lastReadSnapshot[rawDataPropertyName] !== undefined) {
                        rawDataSnapshot[rawDataPropertyName] = lastReadSnapshot[rawDataPropertyName];
                    }
                }
            } else {
            /*
                    No snapshot, we just set as before when we were not considering snapshots at this level, so that should take care of legacy
                */
                rawData[rawDataPropertyName] = rawDataPropertValue;
            }
        }
    },

    _revertRelationshipToRawData: {
        value: function (rawData, propertyDescriptor, rule, scope, rawDataProperty, lastReadSnapshot, rawDataSnapshot) {
            var propertyName = propertyDescriptor.name,
                self, result;

            if (!rule.converter.revert) {
                console.log("Converter does not have a revert function for property (" + propertyDescriptor.name + ")");
            }
            result = rule.evaluate(scope);

            if (this._isAsync(result)) {
                self = this;
                result.then(function (value) {
                    self._setRawDataPropertyValueIfNeeded(rawData, (rawDataProperty||propertyName), result, lastReadSnapshot, rawDataSnapshot);
                    // rawData[rawDataProperty||propertyName] = result;
                    return null;
                });
            } else {
                this._setRawDataPropertyValueIfNeeded(rawData, propertyName, result, lastReadSnapshot, rawDataSnapshot);
                // rawData[propertyName] = result;
            }
            return result;
        }
    },

    _revertPropertyToRawData: {
        value: function (rawData, propertyName, rule, scope, lastReadSnapshot, rawDataSnapshot) {
            var result = rule.evaluate(scope),
                self;

            if (this._isAsync(result)) {
                self = this;
                result.then(function (value) {
                    self._setRawDataPropertyValueIfNeeded(rawData, propertyName, value, lastReadSnapshot, rawDataSnapshot);
                    // rawData[propertyName] = value;
                    return null;
                });
            } else {
                this._setRawDataPropertyValueIfNeeded(rawData, propertyName, result, lastReadSnapshot, rawDataSnapshot);
                // rawData[propertyName] = result;
            }
            return result;
        }
    },


    _resolveProperty: {
        value: function (object, propertyDescriptor, rule, scope) {
            var result = rule.evaluate(scope),
                propertyName = typeof propertyDescriptor === "object" ? propertyDescriptor.name : propertyDescriptor,
                self = this;

            if (this._isAsync(result)) {
                result.then(function (value) {
                    self._setObjectValueForPropertyDescriptor(object, value, propertyDescriptor);
                    return null;
                });
            } else {
                object[propertyName] = result;
            }
            return result;
        }
    },

    /**
     * Convert model objects to raw data objects of an appropriate type.
     *
     * Subclasses should override this method to map properties of the model objects
     * to raw data, as in the following:
     *
     *     mapObjectToRawData: {
     *         value: function (object, data) {
     *             data.GIVEN_NAME = object.firstName;
     *             data.FAMILY_NAME = object.lastName;
     *         }
     *     }
     *
     * The default implementation of this method copies the properties defined
     * by the model object to the raw data object.
     *
     * @method
     * @argument {Object} object - An object whose properties' values
     *                             hold the model data.
     * @argument {Object} data   - An object whose properties must be set or
     *                             modified to represent the model data
     * @argument {Iterator} keyIterator   - an iterator to loop over a subset
     *                                      of object's properties that
     *                                         must be mapped to raw data.

     */
    mapObjectToRawData: {
        value: function (object, data) {
            var rawDataMappingRules = this.rawDataMappingRules,
                promises = [],
                key, result;

            for (key in rawDataMappingRules) {
                result = this.mapObjectToRawDataProperty(object, data, key);
                if (this._isAsync(result)) {
                    promises = promises || [];
                    promises.push(result);
                }
            }

            return (promises && promises.length && Promise.all(promises) || Promise.resolve(null))
            .then(() => data);
        }
    },

    /**
     * Maps the value of a single object property to raw data. Assumes that
     * the object property has been resolved
     *
     * @method
     * @argument {Object} object         - An object whose properties' values
     *                                     hold the model data.
     * @argument {Object} data           - The object on which to assign the property
     * @argument {string} propertyName   - The name of the raw property to which
     *                                     to assign the values.
     */

    // _mapObjectToRawDataProperty: {
    //     value: function(object, data, propertyName, rawDataMappingRule) {
    //         var propertyScope = this._scope.nest(object),
    //             result,
    //             rawDataMappingRules = this.rawDataMappingRulesForObjectPropertyName(propertyName);

    //         if(rawDataMappingRules) {
    //             var i=0,
    //                 countI = rawDataMappingRules.length,
    //                 rule, propertyDescriptor, isRelationship, value;

    //             for(;(i<countI); i++) {

    //                 rule = rawDataMappingRules[i];
    //                 propertyDescriptor = rule && rule.propertyDescriptor;
    //                 isRelationship = propertyDescriptor && propertyDescriptor.value;

    //                 if (isRelationship && rule.converter) {
    //                     this._prepareObjectToRawDataRule(rule);
    //                     result = this._revertRelationshipToRawData(data, propertyDescriptor, rule, propertyScope, propertyName);
    //                 } else if (rule.converter || rule.reverter) {
    //                     result = this._revertPropertyToRawData(data, propertyName, rule, propertyScope);
    //                 } else /*if (propertyDescriptor)*/ { //relaxing this for now
    //                     value = rule.expression(propertyScope);
    //                     /*
    //                         We assume there shouldn't be more than one rule tha produces a value for the same property.
    //                     */
    //                     if(value !== undefined) {
    //                         data[propertyName] = rule.expression(propertyScope);
    //                     }
    //                 }
    //             }
    //         }

    //         return result;
    //     }
    // },
    _mapObjectPropertyToRawDataProperty: {
        value: function(object, propertyName, data,  rawPropertyName, added, removed, _rule, lastReadSnapshot, rawDataSnapshot) {

            if((added && added.size > 0) || (removed && removed.size > 0 )) {
                var tmpExtendObject,
                    //We derived object so we can pretend the value of the property is alternatively added, then removed, to get the mapping done.
                    //tmpExtendObject = Object.create(object),
                    diffData = Object.create(null),
                    mappedKeys,
                    i, countI, iKey,
                    aPropertyChanges = {},
                    addedResult, addedResultIsPromise,
                    removedResult, removedResultIsPromise,
                    requirements,
                    result;

                data[rawPropertyName] = aPropertyChanges;

                if(added && added.size > 0) {
                    /*
                        Here we have a situation where in the most common case object[propertyName] is not equal to the content of added, like if there were pre-exising values.

                        Since we want to only send the diff if possible (we might need to add a flag on RawDataService to know if it can handle diffs or if needs the whole thing.). If there were a notion of order in the propertyDescriptor, that might also be a reason to not send a diff.

                        First we tried to use an extension of the object, but that still modifies it. So we're going to build just a payload object with the values for _rule.requirements.
                    */
                    requirements = _rule.requirements;
                    tmpExtendObject = {};
                    for(i=0, countI = requirements.length; ( i<countI); i++ ) {
                        //added is a set, regular properties are array, not ideal but we need to convert to be able to map.
                        tmpExtendObject[requirements[i]] = (requirements[i] === propertyName) ? Array.from(added) : object[requirements[i]];
                    }

                    //tmpExtendObject[propertyName] = Array.from(added);
                    addedResult = this.__mapObjectToRawDataProperty(tmpExtendObject, diffData, rawPropertyName, _rule, lastReadSnapshot, rawDataSnapshot);

                    if (this._isAsync(addedResult)) {
                        addedResultIsPromise = true;
                        addedResult = addedResult.then(() => {
                            this._assignMappedDiffDataToPropertyChangesObjectKey(diffData, aPropertyChanges,"addedValues");
                        });
                    } else {
                        this._assignMappedDiffDataToPropertyChangesObjectKey(diffData, aPropertyChanges,"addedValues");
                    }
                }

                if(removed && removed.size > 0 ) {

                    requirements = (requirements || _rule.requirements);
                    // tmpExtendObject[propertyName] = Array.from(result);
                    tmpExtendObject = (tmpExtendObject || {});

                    for(i=0, countI = requirements.length; ( i<countI); i++ ) {
                        //added is a set, regular properties are array, not ideal but we need to convert to be able to map.
                        tmpExtendObject[requirements[i]] = (requirements[i] === propertyName) ? Array.from(removed) : object[requirements[i]];
                    }

                    removedResult = this.__mapObjectToRawDataProperty(tmpExtendObject, diffData, rawPropertyName, _rule, lastReadSnapshot, rawDataSnapshot);

                    if (this._isAsync(removedResult)) {
                        removedResultIsPromise = true;
                        removedResult = removedResult.then(() => {
                            this._assignMappedDiffDataToPropertyChangesObjectKey(diffData, aPropertyChanges,"removedValues");
                        });
                    } else {
                        this._assignMappedDiffDataToPropertyChangesObjectKey(diffData, aPropertyChanges,"removedValues");
                    }
                }

                if(addedResultIsPromise && removedResultIsPromise) {
                    return Promise.all([addedResultIsPromise, removedResultIsPromise]);
                } else if(addedResultIsPromise) {
                    return addedResultIsPromise;
                } else if(removedResultIsPromise) {
                    return removedResultIsPromise;
                }

                return;

            } else {
                return this.__mapObjectToRawDataProperty(object, data, rawPropertyName, _rule, lastReadSnapshot, rawDataSnapshot);
            }
        }
    },

    _assignMappedDiffDataToPropertyChangesObjectKey: {
        value: function(diffData, aPropertyChanges, key /* addedValues/removedValues*/) {
            var mappedKeys = Object.keys(diffData),
                i, countI;

            for(i=0, countI = mappedKeys.length; (i <countI); i++) {
                aPropertyChanges[key] = diffData[mappedKeys[i]];
            }
        }
    },

    __mapObjectToRawDataProperty: {
        value: function(object, data, propertyName, _rule, lastReadSnapshot, rawDataSnapshot) {
            var propertyScope = this._scope.nest(object),
            rule = _rule ? _rule : this.rawDataMappingRuleForPropertyName(propertyName),
            result,
                propertyDescriptor = rule && rule.propertyDescriptor,
                isRelationship = propertyDescriptor && propertyDescriptor.valueDescriptor,
                value;



                if (isRelationship && rule.converter) {
                    this._prepareObjectToRawDataRule(rule);
                    result = this._revertRelationshipToRawData(data, propertyDescriptor, rule, propertyScope, propertyName, lastReadSnapshot, rawDataSnapshot);
                } else if (rule.converter || rule.reverter) {
                    result = this._revertPropertyToRawData(data, propertyName, rule, propertyScope, lastReadSnapshot, rawDataSnapshot);
                } else /*if (propertyDescriptor)*/ { //relaxing this for now
                    value = rule.expression(propertyScope);
                    /*
                        We assume there shouldn't be more than one rule tha produces a value for the same property.
                    */
                    if(value !== undefined) {
                        this._setRawDataPropertyValueIfNeeded(data, propertyName, value, lastReadSnapshot, rawDataSnapshot);
                        //data[propertyName] = value;
                        result = value;
                    }
                }

            return result;
        }
    },


    _mapObjectPropertyToRawDataWithRule: {
        value: function(object, propertyName, data, added, removed, rule, lastReadSnapshot, rawDataSnapshot) {

            /*
                If the objectRule.sourcePath isn't part of our own primary key
                TODO LATER:
                Should we worry as well about objectRule.sourcePath being one of our raw property that would be used as a foreign key and stored somewhere else? We would have to have a converter for that, and we would have to check what property that converter is using, extracting that from parsing the converter's convertExpression, and then look into the mapping of the objectDescriptor of the inversePropertyDescriptor, if we have one, if that property matches one of it's mapping rawDataMappingRules.
            */

            var rawDataProperty = rule.targetPath,
                requiredObjectProperties = (rule && this.rawDataPrimaryKeys) ? rule.requirements : null,
                result, self = this;

            if(requiredObjectProperties) {
                result = this.service.rootService.getObjectPropertyExpressions(object, requiredObjectProperties);
            }

            if (this._isAsync(result)) {
                result = result.then(function (value) {
                    //console.log("_mapObjectPropertyToRawDataProperty "+object.constructor.name+" - "+propertyName);
                    return self._mapObjectPropertyToRawDataProperty(object, propertyName, data, rawDataProperty, added, removed, rule, lastReadSnapshot, rawDataSnapshot);
                });
            } else {
                result = this._mapObjectPropertyToRawDataProperty(object, propertyName, data, rawDataProperty, added, removed, rule, lastReadSnapshot, rawDataSnapshot);
            }

            //using delegation to allow dataService customization
            if (this._isAsync(result)) {
                result = result.then(function (value) {
                    self.service.mappingDidMapObjectPropertyToRawDataProperty(self, object, propertyName, data, rawDataProperty);
                    return value;
                });
            } else {
                this.service.mappingDidMapObjectPropertyToRawDataProperty(this, object, propertyName, data, rawDataProperty);
            }

            return result;
        }
    },

    mapObjectPropertyToRawData: {
        value: function(object, propertyName, data, context, added, removed, lastReadSnapshot, rawDataSnapshot) {
            var objectRule = this.objectMappingRuleForPropertyName(propertyName),
            rawDataMappingRules,
            rawDataProperty;

            if(objectRule) {
                rawDataMappingRules = this.rawDataMappingRulesForObjectPropertyName(propertyName);
                if(rawDataMappingRules) {
                    var iterator = rawDataMappingRules.values(), rule, result, self = this, iPreviousPromise, iPromises;

                    while((rule = iterator.next().value)) {

                        if(!rule) {
                            throw new Error("No rawDataMappingRule found to map property "+propertyName+" of object,", object, "to raw data");
                        }

                        rawDataProperty = rule.targetPath;
                        //We don't want to map if it's a part of the primary key
                        if(!this.rawDataPrimaryKeys || (this.rawDataPrimaryKeys && this.rawDataPrimaryKeys.indexOf(rawDataProperty) !== -1)) {
                            continue;
                        }

                        if (result && this._isAsync(result)) {
                            iPreviousPromise = result;
                        }

                        result = this._mapObjectPropertyToRawDataWithRule(object, propertyName, data, added, removed, rule, lastReadSnapshot, rawDataSnapshot);

                        if (this._isAsync(result)) {
                            if(iPreviousPromise) {
                                (iPromises || (iPromises = [])).push(result);
                            }
                        }
                    }

                    if(iPromises) {
                        if(iPromises.length > 1) {
                            return Promise.all(iPromises);
                        } else if(iPromises.length === 1) {
                            return iPromises[0];
                        } else {
                            return;
                        }
                    } else {
                        //There was only one rule, so we have one result;
                        return result;
                    }
                }
                return;
            }
            else if(object.propertySerializability(propertyName) /* if the value returned is undefined or false, we don't care */) {
                console.warn("ExpressionDataMapping.mapObjectPropertyToRawData(): No objectMappingRules found to map property '"+propertyName+"' of " + object.objectDescriptor.name);
            }
        }
    },


    /**
     * Maps the property name of a single object property to it's raw level
     * property equivallent.
     *
     * @method
     * @argument {Object} object         - A data object.
     * @argument Promise{string} propertyName   - The name of the property to map.
     */

    // mapObjectPropertyToRawProperty: {
    //     value: function(object, property) {
    //         var objectRule = this.objectMappingRuleForPropertyName(property),
    //             rawProperty;

    //         if(objectRule) {
    //             var rawDataMappingRules = this.rawDataMappingRulesForObjectPropertyName(property);

    //             if(rawDataMappingRules) {
    //                 if(rawDataMappingRules.length === 1) {
    //                     rawProperty = rawDataMappingRules[0].targetPath;

    //                     //Temporary sanity test
    //                     if(rawProperty !== objectRule.sourcePath ) {
    //                         console.error("Something's not right here, DEBUG ME!!!");
    //                     }

    //                 } else {
    //                     /*
    //                         We need to loop on the rules and evaluate them with object. There *should* be only one matching for currently known use-cases, but in theory there could be more. If such a real use case emerges, we'll have to revisit the caller code to deal with that.

    //                         For now, we'll use the first rule that doesn't evaluate to undefined
    //                     */
    //                    var propertyScope = this._scope.nest(object);


    //                     for(var i=0, countI = rawDataMappingRules.length, iRule, iRuleValue, iRuleValuePromises;(i<countI); i++) {
    //                         iRule = rawDataMappingRules[i];
    //                         iRuleValue = iRule.evaluate(propertyScope);
    //                         if(iRuleValue !== undefined) {
    //                             if (this._isAsync(iRuleValue)) {
    //                                 (iRuleValuePromises || (iRuleValuePromises = [])).push(iRuleValue);
    //                             } else {
    //                                 rawProperty = iRule.targetPath;
    //                                 break;
    //                             }
    //                         }
    //                     }

    //                     /*
    //                         If the evaluate returns promises, we need to find one that doesn't resolve to undefined if any.
    //                     */
    //                     if(iRuleValuePromises) {
    //                         rawProperty = Promise.all(iRuleValuePromises).then(function(iRuleValues) {
    //                             for(var i=0, countI = iRuleValues.length;(i<countI); i++) {
    //                                 if(iRuleValues[i] !== undefined) {
    //                                     /*
    //                                         iRuleValues contains the result of the conversion, what we want is the targetPath of the matching rule.
    //                                     */
    //                                     return rawDataMappingRules[i].targetPath;
    //                                 }
    //                             }
    //                             return undefined;
    //                         })
    //                     }
    //                 }
    //             }




    //             // var objectRuleSourcePathSyntax = objectRule.sourcePathSyntax,
    //             // rawDataRule = this.rawDataMappingRuleForPropertyName(objectRule.sourcePath);

    //             // if(rawDataRule && objectRuleSourcePathSyntax) {
    //             //     if(objectRuleSourcePathSyntax.type === "property") {
    //             //         rawProperty = objectRule.sourcePath;
    //             //     } else if(objectRuleSourcePathSyntax.type === "record") {
    //             //         /*
    //             //             construction used for polymorphic Associations with the Exclusive Belongs To (aka Exclusive Arc) strategy where each potential destination table
    //             //             gets it's matching foreignKeyId.

    //             //             if that's the case we should have a converter with a foreignDescriptorMappings.


    //             //         */
    //             //        var objectRuleConverter = objectRule.converter,
    //             //             objectRuleConverterForeignDescriptorMappings = objectRuleConverter && objectRuleConverter.foreignDescriptorMappings;

    //             //        if(objectRuleConverterForeignDescriptorMappings) {

    //             //             rawProperty = objectRuleConverter.rawDataPropertyForForeignDescriptor(this.service.objectDescriptorForObject(object[property]));

    //             //             //Moved tha implementation in RawForeignValueToObjectConverter.rawDataPropertyForForeignDescriptor()
    //             //             /*
    //             //                 var anObjectDescriptor = this.service.objectDescriptorForObject(object[property]),

    //             //                     rawDataTypeMapping = objectRuleConverter.rawDataTypeMappingForForeignDescriptor(anObjectDescriptor),
    //             //                     rawDataTypeMappingExpressionSyntax = rawDataTypeMapping.expressionSyntax;

    //             //                 //console.log("rawDataTypeMappingExpressionSyntax",rawDataTypeMappingExpressionSyntax);

    //             //                 if(rawDataTypeMappingExpressionSyntax.type === "defined" && rawDataTypeMappingExpressionSyntax.args[0].type === "property") {
    //             //                     rawProperty = rawDataTypeMappingExpressionSyntax.args[0].args[1].value;
    //             //                 } else {
    //             //                     console.error("Couldn't map mapObjectPropertyToRawProperty with rawDataTypeMappingExpressionSyntax", object, property, rawDataTypeMappingExpressionSyntax);
    //             //                 }
    //             //             */

    //             //         }
    //             //     }
    //             // }

    //         }
    //         if(!rawProperty) {
    //             rawProperty = property;
    //         }

    //         return rawProperty;
    //     }
    // },


    /**
     * Maps the value property name of a single object property to it's raw level
     * property value equivallent.
     *
     * @method
     * @argument {Object} object         - A data object.
     * @argument {string} propertyName   - The name of the property to map.
     */

    mapObjectPropertyValueToRawPropertyValue: {
        value: function(object, propertyName) {

        }
    },

    _rawPropertyNamesForObjectPropertyName: {
        get: function() {
            return this.__rawPropertyNamesForObjectPropertyName || (this.__rawPropertyNamesForObjectPropertyName = new Map());
        }
    },

    mapObjectPropertyDescriptorToRawPropertyNames: {
        value: function(propertyDescriptor) {
            return this._rawPropertyNamesForObjectPropertyName.get(propertyDescriptor.name) || (this._buildMapObjectPropertyDescriptorToRawPropertyNames(propertyDescriptor));
        }
    },

    /*
        If a foreign Key is mapped both as a such and as a way to get an object property, there's a collision and only one ends up in this.rawDataMappingRules
    */
    _useRawDataMappingRulesForObjectProperty: {
        value: false
    },

    _buildMapObjectPropertyDescriptorToRawPropertyNames: {
        value: function(propertyDescriptor) {
            var rawPropertyNames,
                property = propertyDescriptor.name;

            if(this._useRawDataMappingRulesForObjectProperty) {
                var iRawDataMappingRules = this.rawDataMappingRulesForObjectProperty(property),
                    iRawDataMappingRulesIterator = iRawDataMappingRules && iRawDataMappingRules.values(),
                    iRawDataMappingRule, iExpression;

                rawPropertyNames = [];
                while((iRawDataMappingRule = iRawDataMappingRulesIterator.next().value)) {
                    iExpression = iRawDataMappingRule.targetPath;
                    rawPropertyNames.push(iExpression);
                }

            } else {

                var isMapPropertyDescriptor = (propertyDescriptor._keyDescriptorReference != null || propertyDescriptor.keyType != null),
                    propertyDescriptorValueDescriptor = propertyDescriptor._valueDescriptorReference,
                    objectRule = this.objectMappingRuleForPropertyName(property),
                    rule = objectRule && this.rawDataMappingRuleForPropertyName(objectRule.sourcePath),
                    converterforeignDescriptorMappings = objectRule && objectRule.converter && objectRule.converter.foreignDescriptorMappings,
                    objectRuleSourcePathSyntax = objectRule && objectRule.sourcePathSyntax,
                    j, countJ, jRawProperty,
                    k, countK, kPropertyDescriptor,
                    rawPropertyNames = new Set();

                if (converterforeignDescriptorMappings) {
                    for (j = 0, countJ = converterforeignDescriptorMappings.length; (j < countJ); j++) {
                        jRawProperty = converterforeignDescriptorMappings[j].rawDataProperty;
                        rawPropertyNames.add(jRawProperty);
                    }
                } else if (isMapPropertyDescriptor) {
                    if (objectRuleSourcePathSyntax && objectRuleSourcePathSyntax.type !== "record") {
                        throw "Can't create key and column array columns with expression '" + objectRule.sourcePath + "'";
                    }
                    //The keys
                    keyArrayColumn = objectRuleSourcePathSyntax.args.keys.args[1].value;
                    rawPropertyNames.add(keyArrayColumn);

                    //The values
                    valueArrayColumn = objectRuleSourcePathSyntax.args.values.args[1].value;
                    rawPropertyNames.add(valueArrayColumn);
                } else {
                    //If the source syntax is a record and we have a converter, it can't become a column and has to be using a combination of other raw proeprties that have to be in propertyDescriptors
                    if (objectRuleSourcePathSyntax && objectRuleSourcePathSyntax.type === "record") {
                        var iPropertyDescriptorRawProperties = Object.keys(objectRuleSourcePathSyntax.args);
                        for (j = 0, countJ = iPropertyDescriptorRawProperties.length; (j < countJ); j++) {
                            rawPropertyNames.add(iPropertyDescriptorRawProperties[j]);
                        }
                    } else if (rule) {
                        //In another place we used the object Rule and therefore it's objectRule.sourcePath
                        //Should streamline at some point
                        rawPropertyNames.add(rule.targetPath);
                    } else {
                        /*
                            It's a bit weird, this can happens if a column is used as part of a compound source expresssion along other columns to produce an object property. This shouldn't be handled here...
                        */
                        rawPropertyNames.add(property);
                    }
                }

                //Cache an Array and return it
                rawPropertyNames = Array.from(rawPropertyNames);
        }

        this._rawPropertyNamesForObjectPropertyName.set(property, rawPropertyNames);
        return rawPropertyNames;



            // //Old logic to remove
            // var objectRule = this.objectMappingRuleForPropertyName(property);

            // if(objectRule) {
            //     if(objectRule.sourcePathSyntax.type === "record") {
            //         throw "Support for object properties mapped to multiple columns isn't properly implemented";
            //     }
            //     return objectRule.sourcePath;
            // }
            // else {
            // /*
            //     It's a bit weird, this can happens if a column is used as part of a compound source expresssion along other columns to produce an object property. This shouldn't be handled here...
            // */
            //   return property;
            // }

        }
    },

    mapObjectPropertyNameToRawPropertyNames: {
        value: function(propertyName) {
            var propertyDescriptor = this.objectDescriptor.propertyDescriptorForName(propertyName);
            if(!propertyDescriptor) {
                // if(this.isPrimaryKeyComponent(propertyName)) {
                //     return propertyName;
                // } else {
                //     console.warn("!!!!! mapObjectPropertyNameToRawPropertyNames('"+propertyName+"') has no propertyDescriptor and is not part of the primary key, what's going on here????")

                /*
                    This can happens:
                    - if a column is used as part of a compound source expresssion along other columns to produce an object property. This shouldn't be handled here...
                    - if the caller doesn't know if propertyName has been mapped, so in that case it would be already a raw propertu
                    - if it's a component of the primary key
                */
                return [propertyName];
                //}
            } else {
                return this.mapObjectPropertyDescriptorToRawPropertyNames(propertyDescriptor);
            }
        }
    },

    /*
        Provide temporary backward compatibility for code calling mapObjectPropertyNameToRawPropertyName()
        Keep the exception.
    */
    mapObjectPropertyNameToRawPropertyName: {
        value: function(propertyName) {
            var objectRule = this.objectMappingRuleForPropertyName(propertyName);

            if(objectRule && objectRule.sourcePathSyntax.type === "record") {
                throw "Support for object properties mapped to multiple columns isn't properly implemented";
            }
            else {
                return this.mapObjectPropertyNameToRawPropertyNames(propertyName)[0];
            }
        }

    },

    // mapObjectPropertyNameToRawPropertyName: {
    //     value: function(property) {
    //         var objectRule = this.objectMappingRuleForPropertyName(property),
    //             rule = objectRule && this.rawDataMappingRuleForPropertyName(objectRule.sourcePath);

    //         if(rule) {
    //             //A sourcePath that's part the primary key doesn't sounds good, it has to be a relationship...
    //             if(this.rawDataPrimaryKeys.indexOf(objectRule.sourcePath) === -1) {
    //                 return objectRule.sourcePath;
    //             } else {
    //                 return null;
    //             }
    //         }
    //         else {
    //           return property;
    //         }

    //     }
    // },


    /**
     * Prefetches any object properties required to map the rawData property
     * and maps once the fetch is complete.
     *
     * This is a bit overeaching. There are two reasons we want to mapObjectToRawDataProperty:
     *  1. Create an object
     *      1.1 If we create an object, properties that are not relations can't
     *          be fetched. We need to make sure we don't actually try.
     *      1.2 If a property is a relationship and it wasn't set on the object,
     *          as an object, we can't get it either.
     *      1.3 So, for created objects, validation rules should prevent the attempt to save if
     *          mandory properties are missing.
     *
     *  2. Update an object.
     *      2.1 We know what has changed
     *      2.2 A property that is a relation to an object, especially without an object descriptor
     *          but also with one can be stored inline as json.
     *
     *
     * @method
     * @argument {Object} object         - An object whose properties' values
     *                                     hold the model data.
     * @argument {Object} data           - The object on which to assign the property
     * @argument {string} propertyName   - The name of the raw property to which
     *                                     to assign the values.
     */
    mapObjectToRawDataProperty: {
        value: function (object, data, propertyName, lastReadSnapshot, rawDataSnapshot, ignoreRequiredObjectProperties) {
            var rule = this.rawDataMappingRuleForPropertyName(propertyName),
                //Adding a test for rawDataPrimaryKeys. Types that are meant to be
                //embedded in others don't have a rawDataPrimaryKeys
                //as they don't exists on their own.
                requiredObjectProperties = (rule && this.rawDataPrimaryKeys) ? rule.requirements : null,
                result, self;

            if(!ignoreRequiredObjectProperties && requiredObjectProperties) {
                result = this.service.rootService.getObjectPropertyExpressions(object, requiredObjectProperties);
            }

            if (this._isAsync(result)) {
                self = this;
                result = result.then(function (value) {
                    return self._mapObjectPropertyToRawDataProperty(object, rule.sourcePath, data, propertyName, lastReadSnapshot, rawDataSnapshot);
                });
            } else {
                result = this._mapObjectPropertyToRawDataProperty(object, rule.sourcePath, data, propertyName, lastReadSnapshot, rawDataSnapshot);
            }

            //using delegation to allow dataService customization
            if (this._isAsync(result)) {
                self = this;
                return result.then(function (value) {
                     self.service.mappingDidMapObjectToRawDataProperty(self, object, data, propertyName);
                     return value;
                });
            } else {
                this.service.mappingDidMapObjectToRawDataProperty(this, object, data, propertyName);
                return result;
            }
        }
    },

    /**
     * Convert model object properties to the raw data properties present in the requirements
     * for a given propertyName
     *
     * @method
     * @argument {Object} object         - An object whose properties' values
     *                                     hold the model data.
     * @argument {Object} data           - An object whose properties must be set or
     *                                     modified to represent the model data.
     * @argument {string} propertyName   - The name of the property whose requirements
     *                                     need to be populated in the raw data.
     */
    mapObjectToCriteriaSourceForProperty: {
        value: function (object, data, propertyName, supportsSyncResult) {
            var rawDataMappingRules = this.rawDataMappingRules,
                // keys = this.rawDataMappingRules.keys(),
                rule = this.objectMappingRuleForPropertyName(propertyName),
                requiredRawProperties = rule ? rule.requirements : [],
                rawRequirementsToMap = new Set(requiredRawProperties),
                ignoreRequiredObjectProperties = true,
                promises, key, result;

            for (key in rawDataMappingRules) {
                /*
                    @marchant / @tejaede
                    Added check to see if we don't already have the value for key in data.
                    This is better to do anyway, and it avoids to get into mapObjectToRawDataProperty trying to fecth the object property that we're precisely trying to fetch, as this method is only called by dataService._fetchObjectPropertyWithPropertyDescriptor(), which seems to lock the stack as it's logically re-entrant. So this blocks it here before it happens there
                */
                if (rawRequirementsToMap.has(key) && !data.hasOwnProperty(key)) {
                    result = this.mapObjectToRawDataProperty(object, data, key, undefined, undefined, ignoreRequiredObjectProperties);
                    if (this._isAsync(result)) {
                        promises = promises || [];
                        promises.push(result);
                    }
                }
            }
            return promises 
                ? Promise.all(promises) 
                : supportsSyncResult 
                    ? null
                    : Promise.resolveNull;
        }
    },

    _prepareObjectToRawDataRule: {
        value: function (rule) {
            var converter = rule.converter,
                propertyDescriptor = rule.propertyDescriptor;

            if (converter) {
                converter.expression = converter.expression || rule.expression;
                converter.foreignDescriptor = converter.foreignDescriptor || propertyDescriptor.valueDescriptor;
            }
        }
    },

    /**
     * Returns the identifier of the child service of .service that is used to
     * fetch propertyName
     *
     * @method
     * @argument {string} propertyName   - The name of a model property
     */
    serviceIdentifierForProperty: {
        value: function (propertyName) {
            var rule = this.objectMappingRuleForPropertyName(propertyName);
            return rule && rule.serviceIdentifier;
        }
    },

    _rawDataMappingRules: {
        value: undefined
    },

    _setObjectsValueForPropertyDescriptor: {
        value: function (objects, value, propertyDescriptor, shouldFlagObjectBeingMapped) {
            var i, n;
            for (i = 0, n = objects.length; i < n; i += 1) {
                this._setObjectValueForPropertyDescriptor(objects[i], value, propertyDescriptor, shouldFlagObjectBeingMapped);
            }
        }
    },

    _setObjectValueForPropertyDescriptor: {
        value: function (object, value, propertyDescriptor, shouldFlagObjectBeingMapped) {
            var propertyName = propertyDescriptor.name,
                isToMany = propertyDescriptor.cardinality !== 1;
            //Add checks to make sure that data matches expectations of propertyDescriptor.cardinality
            // console.debug(object.dataIdentifier.objectDescriptor.name+" - "+propertyDescriptor.name+" _setObjectValueForPropertyDescriptor on object id: "+object.dataIdentifier.primaryKey);

            if(shouldFlagObjectBeingMapped) {
                this.service.rootService._objectsBeingMapped.add(object);
            }

            if (Array.isArray(value)) {
                if (isToMany) {
                    object[propertyName] = value;
                } else if (value.length) {
                    //Cardinality is 1, if data contains more than 1 item, we throw
                    if (value.length > 1) {
                        throw new Error("ExpressionDataMapping for property \""+ this.objectDescriptor.name + "." + propertyName+"\" expects a cardinality of 1 but data to map doesn't match: "+value);
                    }
                    object[propertyName] = value[0];
                }
            } else {
                /*
                    Benoit: adding  && value to the condition as we don't want arrays with null in it
                */
                if(isToMany && value) {
                    /*
                        When we arrive here coming from _assignInversePropertyValue()
                        doing object[propertyName] causes the trigger to go fetch the value of object's propertyName, which is async.

                        So we should either continue to trigger that property , with

                        mainService.getObjectProperties(object, [propertyName])

                        and when that promise resolves we continue the assignment, which might be unnecessary as we'd have that data in the result as this is propagation of fecthed data, not new,

                        or find a way to jut access the local state without triggering the fetch and just update it.
                    */
                   //We call the getter passing shouldFetch = false flag stating that it's an internal call
                   var objectPropertyValue = Object.getPropertyDescriptor(object,propertyName).get.call(object, /*shouldFetch*/false);
                    if(!Array.isArray(objectPropertyValue)) {
                        value = [value];
                        object[propertyName] = value;
                    }
                    else {
                        if(objectPropertyValue.includes(value)) {
                            console.warn("property "+propertyName+" already contains value: ", value);
                        }
                        objectPropertyValue.push(value);
                    }
                } else {
                    object[propertyName] = value;
                }
            }

            if(shouldFlagObjectBeingMapped) {
                this.service.rootService._objectsBeingMapped.delete(object);
            }

        }
    },


    /**
     * Prepares a rule's converter for the property being mapped. This allows
     * converters to be shared across multiple rules.
     *
     * @method
     * @argument {MappingRule} rule   - A MappingRule to go from raw data to an object property
     */
    _prepareRawDataToObjectRule: {
        value: function (rule, propertyDescriptor, locales) {
            var converter = rule && rule.converter;
            if (converter) {
                converter.expression = converter.expression || rule.expression;

                /*
                    This is important when a converter is shared, for example when defined in an ObjectDescriptor but where sub ObjectDescriptors specialize the destination/type of the generic relationship defined in their parent ObjectDescriptor.
                */

                if(converter._foreignDescriptorSetByMapping === undefined && !converter.foreignDescriptor) {
                    converter._foreignDescriptorSetByMapping = true;
                }

                if(converter._foreignDescriptorSetByMapping) {
                    converter.foreignDescriptor = propertyDescriptor.valueDescriptor;
                }
                // converter.foreignDescriptor = converter.foreignDescriptor || propertyDescriptor.valueDescriptor;
                converter.objectDescriptor = this.objectDescriptor;
                converter.serviceIdentifier = rule.serviceIdentifier;
                converter.locales = locales;
            }
        }
    },

    /**
     * Pre-fetches the model properties that are required to map another model property
     *
     * @method
     * @argument {Object} object         - The object on which to prefetch properties
     * @argument {string} propertyName   - The name of the model property for which
     *                                     there are prerequisites
     */
    resolvePrerequisitesForProperty: {
        value: function (object, propertyName) {
            var rule = this.objectMappingRuleForPropertyName(propertyName),
                prerequisites = rule && rule.prerequisitePropertyNames || null;
            if (!rule) {
                console.log("No Rule For:", propertyName);
            }

            return prerequisites ? this.service.rootService.getObjectProperties(object, prerequisites) : Promise.resolve(null);
        }
    },

    _isAsync: {
        value: function (object) {
            return object && object.then && typeof object.then === "function";
        }
    },

    /*
        Looks unused

    _assignDataToObjectProperty: {
        value: function (object, propertyDescriptor, data) {
            var hasData = data && data.length,
                isToMany = propertyDescriptor.cardinality !== 1,
                propertyName = propertyDescriptor.name;

            //Add checks to make sure that data matches expectations of propertyDescriptor.cardinality
            //

            if (Array.isArray(data)) {
                if (isToMany && Array.isArray(object[propertyName])) {
                    object[propertyName].splice.apply(object[propertyName], [0, Infinity].concat(data));
                } else if (isToMany) {
                    object[propertyName] = data;
                } else if (hasData) {
                    //Cardinality is 1, if data contains more than 1 item, we throw
                    if (data.length && data.length > 1) {
                            throw new Error("ExpressionDataMapping for property \""+ this.objectDescriptor.name + "." + propertyName+"\" expects a cardinality of 1 but data to map doesn't match: "+data);
                    }
                    object[propertyName] = data[0];
                }
            } else {
                object[propertyName] = data;
            }
        }
    },
    */

    /***************************************************************************
     * Rules
     */

     /**
     * Adds a rule to be used for mapping objects to raw data.
     * @param {string} targetPath   - The path to assign on the target
     * @param {object} rule         - The rule to be used when processing
     *                                the mapping.  The rule must contain
     *                                the direction and path of the properties
     *                                to map.  Optionally can include
     *                                a converter.
     */
    addObjectMappingRule: {
        value: function (targetPath, rule) {
            var rawRule = {};
            rawRule[targetPath] = rule;

            this._mapObjectMappingRules(rawRule);
            // this._objectMappingRules = null; //To ensure all arguments are added to this.objectMappingRules
            // this._rawDataMappingRules = null; //To ensure all arguments are added to this.rawDataMappingRules
        }
    },

    /**
     * Adds a rule to be used for mapping raw data to objects.
     * @param {string} targetPath   - The path to assign on the target
     * @param {object} rule         - The rule to be used when processing
     *                                the mapping.  The rule must contain
     *                                the direction and path of the properties
     *                                to map.  Optionally can include
     *                                a converter.
     */
    addRawDataMappingRule: {
        value: function (targetPath, rule) {
            var rawRule = {};
            rawRule[targetPath] = rule;
            this._mapRawDataMappingRules(rawRule);
            // this._objectMappingRules = null; //To ensure all arguments are added to this.objectMappingRules
            // this._rawDataMappingRules = null; //To ensure all arguments are added to this.rawDataMappingRules
        }
    },

    _overrideParentRuleForPropertyDescriptor: {
        value: function(parentRule, ownPropertyDescriptor) {
            var myRule = new MappingRule();
            myRule.sourcePath = parentRule.sourcePath;
            myRule.targetPath = parentRule.targetPath;
            if(parentRule.serviceIdentifier) {
                myRule.serviceIdentifier = parentRule.serviceIdentifier;
            }
            if(parentRule.converter) {
                myRule.converter = parentRule.converter;
            }
            if(parentRule.reverter) {
                myRule.reverter = parentRule.reverter;
            }

            myRule.propertyDescriptor = ownPropertyDescriptor;

            return myRule;
        }
    },

    // _assignAllEntriesTo: {
    //     value: function (source, target, isObjectMappingRule, sourceIsParent) {
    //         var service = this.service,
    //             myObjectDescriptor = this.objectDescriptor,
    //             self = this;
    //         source.forEach(function (value, key) {

    //             if(sourceIsParent) {
    //                 var myPropertyDescriptor = myObjectDescriptor.propertyDescriptorForName(
    //                     isObjectMappingRule
    //                         ? value.targetPath
    //                         : value.sourcePath
    //                     );

    //                 //Check if the property was overriden:
    //                 if(myPropertyDescriptor && myPropertyDescriptor !== value.propertyDescriptor) {
    //                     //If it is, we need to clone the rule and assign it our propertyDescriptor
    //                     value = self._overrideParentRuleForPropertyDescriptor(value,myPropertyDescriptor);
    //                 }
    //             }

    //             target.set(key, value);

    //             /* value is a MappingRule */
    //             if(service) {
    //                 if(value.converter) {
    //                     value.converter.service = service;
    //                 }
    //                 if(value.reverter) {
    //                     value.reverter.service = service;
    //                 }

    //             }
    //         });
    //     }
    // },

    _areRulesInitialized: {
        value: false
    },

    _initializeRules: {
        value: function () {
            if (!this._areRulesInitialized) {
                this._areRulesInitialized = true;
                this._mapObjectMappingRules(this._rawOwnObjectMappingRules);
                this._mapRawDataMappingRules(this._rawOwnRawDataMappingRules);
            }
        }
    },

    _rawOwnObjectMappingRules: {
        value: undefined
    },

    objectMappingRules: {
        get: function () {
            if (!this._hasGeneratedObjectMappingRules) {
                if (!this._objectMappingRules) {
                    this._objectMappingRules = {};
                    this._initializeRules();
                }
                if (this.parent && Object.getPrototypeOf(this._objectMappingRules) !== this.parent.objectMappingRules) {
                    Object.setPrototypeOf(this._objectMappingRules, this.parent.objectMappingRules);
                }   
                this._hasGeneratedObjectMappingRules = true;
            }
            return this._objectMappingRules;
        }
    },

    objectMappingRuleForPropertyName: {
        value: function(propertyName) {
            return this.objectMappingRules[propertyName] === undefined
            ? this._initializeObjectMappingRuleForPropertyName(propertyName) && this.objectMappingRules[propertyName]
            : this.objectMappingRules[propertyName];
        }
    },

    objectMappingRulesForRawPropertyName: {
        value: function(propertyName) {


        }
    },


    _rawOwnRawDataMappingRules: {
        value: undefined
    },
    rawDataMappingRules: {
        get: function () {
            if (!this._hasGeneratedRawDataMappingRules) {
                if (!this._rawDataMappingRules) {
                    this._rawDataMappingRules = {};
                    this._initializeRules();
                }
                if (this.parent && Object.getPrototypeOf(this._rawDataMappingRules) !== this.parent.rawDataMappingRules) {
                    Object.setPrototypeOf(this._rawDataMappingRules, this.parent.rawDataMappingRules);
                }   
                this._hasGeneratedRawDataMappingRules = true;
            }
            return this._rawDataMappingRules;
        }
    },

    rawDataMappingRuleForPropertyName: {
        value: function(propertyName) {
            return this.rawDataMappingRules[propertyName] === undefined
            ? this._initializeObjectMappingRuleForPropertyName(propertyName) && this.rawDataMappingRules[propertyName]
            //? this._initializeRawDataMappingRuleForPropertyName(propertyName) && this.rawDataMappingRules[propertyName]
            : this.rawDataMappingRules[propertyName];
        }
    },

    _rawDataMappingRulesByObjectPropertyName: {
        value: undefined
    },
    rawDataMappingRulesForObjectPropertyName: {
        value: function(propertyName) {

            /*
                for some cases,
            */
            /*
                Using this.parent?.rawDataMappingRulesForObjectPropertyName(propertyName) right away when this never got a chance to do it
                basically prevent this to build it's own, missing overrident properties
            */
            //var rawDataMappingRules = (this._rawDataMappingRulesByObjectPropertyName?.get(propertyName)) || (this.parent?.rawDataMappingRulesForObjectPropertyName(propertyName));
            var rawDataMappingRules = this._rawDataMappingRulesByObjectPropertyName?.get(propertyName);

            if(rawDataMappingRules === undefined) {

                var objectRule = this.objectMappingRuleForPropertyName(propertyName);

                if(objectRule) {
                    //Most common case for two-way rules
                    // var rawDataMappingRule = this.rawDataMappingRuleForPropertyName(objectRule.sourcePath);
                    // if(rawDataMappingRule) {
                    //     (this._rawDataMappingRulesByObjectPropertyName || (this._rawDataMappingRulesByObjectPropertyName = new Map())).set(propertyName,(rawDataMappingRules = [rawDataMappingRule]));
                    // }

                    var rawDataMappingRules = this.rawDataMappingRulesForObjectProperty(objectRule.targetPath);
                    if(rawDataMappingRules) {
                        (this._rawDataMappingRulesByObjectPropertyName || (this._rawDataMappingRulesByObjectPropertyName = new Map())).set(propertyName,rawDataMappingRules);
                    }
                }
            }

            return rawDataMappingRules;
        }
    },

    propertyDescriptorForRawPropertyName: {
        value: function(rawPropertyName) {
            //Check that that this isn't the primary key
            if(!this.rawDataPrimaryKeys || (this.rawDataPrimaryKeys && this.rawDataPrimaryKeys.indexOf(rawPropertyName) === -1)) {
                var mappingRule = this.rawDataMappingRuleForPropertyName(rawPropertyName),
                    propertyName = mappingRule ? mappingRule.sourcePath : rawPropertyName;

                return this.objectDescriptor.propertyDescriptorForName(propertyName);
            } else {
                return null;
            }
        }
    },

    /**
     * Maps raw rawData to object rules to MappingRule objects
     * @param {Object<string:Object>} rawRules - Object whose keys are object property
     *                                           names and whose values are raw rules
     * @param {Boolean} addOneWayBindings      - Whether or not to add one way bindings.
     */
    _mapObjectMappingRules: {
        value: function (rawRules) {
            var propertyNames = rawRules ? Object.keys(rawRules) : null,
                objectMappingRules = this.objectMappingRules, rawDataMappingRules = this.rawDataMappingRules,
                propertyName, i;

            //TODO Add path change listener for objectDescriptor to
            //account for chance that objectDescriptor is added after the rules
            if (this.objectDescriptor && propertyNames) {
                for (i = 0; (propertyName = propertyNames[i]); ++i) {
                    this._mapObjectMappingRuleForPropertyName(rawRules[propertyName], propertyName, objectMappingRules, rawDataMappingRules);
                }
            }
        }
    },

    _initializeObjectMappingRuleForPropertyName: {
        value: function (propertyName) {
            (this._rawOwnObjectMappingRules && this._rawOwnObjectMappingRules.hasOwnProperty(propertyName))
                ? this._initializeOwnObjectMappingRuleForPropertyName(propertyName)
                : this.parent
                    ? this.parent._initializeOwnObjectMappingRuleForPropertyName(propertyName)
                    : (this._objectMappingRules[propertyName] = null) && (this._rawDataMappingRules[propertyName] = null)
        }
    },

    _initializeOwnObjectMappingRuleForPropertyName: {
        value: function (propertyName) {
            this._mapObjectMappingRuleForPropertyName(this._rawOwnObjectMappingRules[propertyName], propertyName, this.objectMappingRules, this.rawDataMappingRules);
        }
    },

    _mapObjectMappingRuleForPropertyName: {
        value: function (rawRule, propertyName, objectMappingRules, rawDataMappingRules) {
            if(!rawRule) {
                if(this.rawDataPrimaryKeys.indexOf(propertyName) !== -1) {
                    objectMappingRules[propertyName] = null;
                } else if(objectMappingRules[propertyName] === undefined) {
                    //console.warn("ExpressionDataMapping _mapObjectMappingRuleForPropertyName(): no rule found for propertyName '"+propertyName+"'");
                    objectMappingRules[propertyName] = null;
                }
            } else {
                var rule;

                if (this._shouldMapRule(rawRule, true)) {
                    rule = this.makeRuleFromRawRule(rawRule, propertyName, true, true);
                    objectMappingRules[rule.targetPath] = rule;
                }

                if (this._shouldMapRule(rawRule, false)) {
                    rule = this.makeRuleFromRawRule(rawRule, propertyName, false, true);
                    rawDataMappingRules[rule.targetPath] = rule;
                }
            }
        }
    },

    /**
     * Maps raw object to rawData rules to MappingRule objects
     * @param {Object<string:Object>} rawRules - Object whose keys are raw property
     *                                           names and whose values are object rules
     * @param {Boolean} addOneWayBindings      - Whether or not to add one way bindings.
     */
    _mapRawDataMappingRules: {
        value: function (rawRules) {
            var propertyNames = rawRules ? Object.keys(rawRules) : null,
                objectMappingRules = this.objectMappingRules, rawDataMappingRules = this.rawDataMappingRules,
                propertyName, i;


            //TODO Add path change listener for objectDescriptor to
            //account for chance that objectDescriptor is added after the rules
            if (this.objectDescriptor && propertyNames) {
                for (i = 0; (propertyName = propertyNames[i]); ++i) {
                    this._mapRawDataMappingRuleForPropertyName(rawRules[propertyName], propertyName, objectMappingRules, rawDataMappingRules)
                }
            }

        }
    },

    _initializeRawDataMappingRuleForPropertyName: {
        value: function (propertyName) {
            (this._rawOwnRawDataMappingRules && this._rawOwnRawDataMappingRules.hasOwnProperty(propertyName))
                ? this._initializeOwnRawDataMappingRuleForPropertyName(propertyName)
                : this.parent
                    ? this.parent._initializeOwnRawDataMappingRuleForPropertyName(propertyName)
                    : (this._rawDataMappingRules[propertyName] = null) && (this._rawDataMappingRules[propertyName] = null)
        }
    },

    _initializeOwnRawDataMappingRuleForPropertyName: {
        value: function (propertyName) {
            this._mapRawDataMappingRuleForPropertyName(this._rawOwnRawDataMappingRules[propertyName], propertyName, this.objectMappingRules, this.rawDataMappingRules);
        }
    },

    _mapRawDataMappingRuleForPropertyName: {
        value: function (rawRule, propertyName, objectMappingRules, rawDataMappingRules) {
            if(!rawRule) {
                if(this.rawDataPrimaryKeys.indexOf(propertyName) !== -1) {
                    rawDataMappingRules[propertyName] = null;
                } else if(objectMappingRules[propertyName] === undefined) {
                    console.warn("ExpressionDataMapping _mapRawDataMappingRuleForPropertyName(): no rule found for propertyName '"+propertyName+"'");
                    rawDataMappingRules[propertyName] = null;
                }
            } else {

                var rule;

                if (this._shouldMapRule(rawRule, false)) {
                    rule = this.makeRuleFromRawRule(rawRule, propertyName, false, false);
                    objectMappingRules[rule.targetPath] = rule;
                }
                if (this._shouldMapRule(rawRule, true)) {
                    rule = this.makeRuleFromRawRule(rawRule, propertyName, true, false);
                    rawDataMappingRules[rule.targetPath] = rule;

                    //Let's add indexing for each of rule.requiremts properties if any.
                    if(rule.requirements && rule.requirements.length) {
                        var requirements = rule.requirements,
                            _rawDataMappingRulesByObjectPropertyName = (this._rawDataMappingRulesByObjectPropertyName || (this._rawDataMappingRulesByObjectPropertyName = new Map())),
                            j=0, countJ = requirements.length, jRequirement, jRequirementRules;

                        /*
                            A property in requirements could be present in more than one rule, which the case for example in the case of polymorphic associations implemented with the Exclusive Belongs To (AKA Exclusive Arc) strategy where each potential destination table has a matching foreignKey.
                        */

                        for(;(j<countJ); j++) {
                            jRequirement = requirements[j];
                            jRequirementRules = _rawDataMappingRulesByObjectPropertyName.get(jRequirement) || (_rawDataMappingRulesByObjectPropertyName.set(jRequirement,(jRequirementRules = [])) && jRequirementRules);

                            jRequirementRules.push(rule);
                        }
                    }
                }
            }

        }
    },

    makeRuleFromRawRule: {
        value: function (rawRule, propertyName, addOneWayBindings, isObjectMappingRule) {
            var propertyDescriptorName = !isObjectMappingRule && addOneWayBindings ? rawRule[ONE_WAY_BINDING] || rawRule[TWO_WAY_BINDING] : propertyName,
                propertyDescriptor = this.objectDescriptor.propertyDescriptorForName(propertyDescriptorName),
                rule = MappingRule.withRawRuleAndPropertyName(rawRule, propertyName, addOneWayBindings);

            rule.propertyDescriptor = propertyDescriptor;
            if (rawRule.converter && addOneWayBindings) {
                rule.converter = rawRule.converter;
            } else if (rawRule.converter && !addOneWayBindings) {
                rule.reverter = rawRule.converter;
            } else if (rawRule.reverter && addOneWayBindings) {
                rule.reverter = rawRule.reverter;
            } else if (rawRule.reverter && !addOneWayBindings) {
                rule.converter = rawRule.reverter;
            } else if (addOneWayBindings) {
                rule.converter = this._defaultConverter(rule.sourcePath, rule.targetPath, isObjectMappingRule);
            } else {
                rule.reverter = this._defaultConverter(rule.sourcePath, rule.targetPath, isObjectMappingRule);
            }

            if(rule.converter) {
                rule.converter.scope = this._scope.nest(undefined);
            }
            if(rule.reverter) {
                rule.reverter.scope = this._scope.nest(undefined);
            }
            return rule;
        }
    },

    _shouldMapRule: {
        value: function (rawRule, addOneWayBindings) {
            var isOneWayBinding = rawRule.hasOwnProperty(ONE_WAY_BINDING),
                isTwoWayBinding = !isOneWayBinding && rawRule.hasOwnProperty(TWO_WAY_BINDING);
            return isOneWayBinding && addOneWayBindings || isTwoWayBinding;
        }
    },

    _defaultConverter: {
        value: function (sourcePath, targetPath, isObjectMappingRule) {

            var sourceObjectDescriptor = isObjectMappingRule ? this.rawDataDescriptor : this.objectDescriptor;
            if(sourceObjectDescriptor) {
                var sourceDescriptor = sourceObjectDescriptor.propertyDescriptorForName(sourcePath);

                if(sourceDescriptor) {
                    var targetObjectDescriptor = isObjectMappingRule ? this.objectDescriptor : this.rawDataDescriptor,
                        targetDescriptor = targetObjectDescriptor && targetObjectDescriptor.propertyDescriptorForName(targetPath);

                    return (targetDescriptor && targetDescriptor.valueType && sourceDescriptor.valueType && (sourceDescriptor.valueType !== targetDescriptor.valueType))
                    ? this._converterForValueTypes(targetDescriptor.valueType, sourceDescriptor.valueType)
                    : null;

                } else {
                    return null;
                }
            } else {
                return null;
            }


            // var sourceObjectDescriptor = isObjectMappingRule ? this.rawDataDescriptor : this.objectDescriptor,
            //     targetObjectDescriptor = isObjectMappingRule ? this.objectDescriptor : this.rawDataDescriptor,
            //     sourceDescriptor = sourceObjectDescriptor && sourceObjectDescriptor.propertyDescriptorForName(sourcePath),
            //     targetDescriptor = targetObjectDescriptor && targetObjectDescriptor.propertyDescriptorForName(targetPath),
            //     sourceDescriptorValueType = sourceDescriptor && sourceDescriptor.valueType,
            //     targetDescriptorValueType = targetDescriptor && targetDescriptor.valueType,
            //     shouldUseDefaultConverter = sourceDescriptor && targetDescriptor &&
            //         sourceDescriptorValueType !== targetDescriptorValueType;

            // return  shouldUseDefaultConverter ?  this._converterForValueTypes(targetDescriptorValueType, sourceDescriptorValueType) :
            //                                      null;

        }
    },


    _converterForValueTypes: {
        value: function (sourceType, destinationType) {
            var converters = exports.ExpressionDataMapping.defaultConverters;
            return converters[sourceType] && converters[sourceType][destinationType] || null;
        }
    },

    __rawDataPrimaryKeyCriteriaSyntax: {
        value: undefined
    },

    /*
        Expanding this to suppport single property primary keys - id
        As well as a plain JavaScript object whose property/values represent a compound primary key
    */

    _rawDataPrimaryKeyCriteriaSyntax: {
        get: function() {
            if(!this.__rawDataPrimaryKeyCriteriaSyntax) {


                var iterator = new SyntaxInOrderIterator(this.rawDataPrimaryKeyExpressionSyntaxes[0]),
                parentSyntax, currentSyntax, firstArgSyntax, secondArgSyntax, expression = "";

                while ((currentSyntax = iterator.next().value)) {

                    if(currentSyntax.type === "property") {
                        let iKey = currentSyntax.args[1].type === "literal" 
                            ? currentSyntax.args[1].value
                            : currentSyntax.args[0].value;

                        expression += `${iKey} == $${iKey}`;
                        this.__rawDataPrimaryKeyCriteriaSyntax = parse(expression);
                        break;

                    } else if(currentSyntax.type === "record") {
                        let recordKeys = Object.keys(currentSyntax.args);

                        for(let i=0, iKey, countI = recordKeys.length; (i<countI); i++) {
                            iKey = recordKeys[i];
                            if(expression.length > 0) {
                                expression += " && ";
                            }
                            expression += `${iKey} == $.${iKey}`;        
                        }

                        this.__rawDataPrimaryKeyCriteriaSyntax = parse(expression);
                        break;

                    } else if(currentSyntax.type === "value") {
                        continue;
                    
                    } else {
                        throw ("Raw primary expression syntax is unsupported:",this.rawDataPrimaryKeys);
                    }

                }
            }
            return  this.__rawDataPrimaryKeyCriteriaSyntax;
        }
    },


    
    rawDataPrimaryKeyCriteriaForObject: {
        value: function(object) {
            var rawDataPrimaryKeyExpressions = this.rawDataPrimaryKeys,
                rawDataPrimaryKeyCompiledExpressions = this.rawDataPrimaryKeyCompiledExpressions,
                isObjectCreated = this.service.isObjectCreated(object),
                snapshot = !isObjectCreated && this.service.snapshotForObject(object),
                criteriaParameters,
                i, iCompiledExpression, iExpression, iKeyRawRule, countI;

            /*
                If the object has been fetched, we should have the values in the snapshot, otherwise if they are natural primiary keys, we might be able to get them by mapping back
            */
           for(i=0, countI = rawDataPrimaryKeyCompiledExpressions.length; (i<countI); i++) {
                if(!isObjectCreated && snapshot) {
                    iCompiledExpression = rawDataPrimaryKeyCompiledExpressions[i];
                    let propertyScope = this._scope.nest(snapshot);

                    //criteriaParameters = iCompiledExpression(propertyScope);
                    //(criteriaParameters || (criteriaParameters = {}))[iKey] = snapshot[iKey];

                    (criteriaParameters || (criteriaParameters = {}))[rawDataPrimaryKeyExpressions[i]] = iCompiledExpression(propertyScope);

                } else {
                    if(countI === 1 && object.dataIdentifier) {
                        assign((criteriaParameters || (criteriaParameters = {})), rawDataPrimaryKeyExpressions[i], object.dataIdentifier.primaryKey);
                    } else {
                        iKeyRawRule = this.rawDataMappingRuleForPropertyName(rawDataPrimaryKeyExpressions[i]);
                        if(iKeyRawRule) {
                            this.__mapObjectToRawDataProperty(object, (criteriaParameters || (criteriaParameters = {})), rawDataPrimaryKeyExpressions[i], iKeyRawRule, snapshot);
                        }
                    }
                }
            }

            if(criteriaParameters) {
                return new Criteria().initWithSyntax(this._rawDataPrimaryKeyCriteriaSyntax, criteriaParameters);
            } else {
                return null;
            }


        }
    },


    _rawDataPrimaryKeyCriteriaForObject: {
        value: function(object) {
            var rawDataPrimaryKeys = this.rawDataPrimaryKeys,
                isObjectCreated = this.service.isObjectCreated(object),
                snapshot = !isObjectCreated && this.service.snapshotForObject(object),
                criteriaParameters,
                i, iKey, iKeyRawRule, countI;

            /*
                If the object has been fetched, we should have the values in the snapshot, otherwise if they are natural primiary keys, we might be able to get them by mapping back
            */
           for(i=0, countI = rawDataPrimaryKeys.length; (i<countI); i++) {
                iKey = rawDataPrimaryKeys[i];
                if(!isObjectCreated && snapshot) {
                    (criteriaParameters || (criteriaParameters = {}))[iKey] = snapshot[iKey];
                } else {
                    if(countI === 1 && object.dataIdentifier) {
                        (criteriaParameters || (criteriaParameters = {}))[iKey] = object.dataIdentifier.primaryKey;
                    } else {
                        iKeyRawRule = this.rawDataMappingRuleForPropertyName(iKey);
                        if(iKeyRawRule) {
                            this.__mapObjectToRawDataProperty(object, (criteriaParameters || (criteriaParameters = {})), iKey, iKeyRawRule, snapshot);
                        }
                    }
                }
            }

            if(criteriaParameters) {
                return new Criteria().initWithSyntax(this._rawDataPrimaryKeyCriteriaSyntax, criteriaParameters);
            } else {
                return null;
            }


        }
    },

    /***************************************************************************
     * Deprecated
     */

    /**
     * @todo Document deprecation in favor of
     * [mapRawDataToObject()]{@link DataMapping#mapRawDataToObject}
     */
    mapFromRawData: {
        value: function (object, record, context) {
            return this.mapRawDataToObject(record, object, context);
        }
    },

    /**
     * @todo Document deprecation in favor of
     * [mapObjectToRawData()]{@link DataMapping#mapObjectToRawData}
     */
    mapToRawData: {
        value: function (object, record) {
            this.mapObjectToRawData(object, record);
        }
    }

}, {

    defaultConverters: {
        get: function () {
            if (!exports.ExpressionDataMapping._defaultConverters) {
                var defaultConverters = {};
                exports.ExpressionDataMapping._addDefaultConvertersToMap(defaultConverters);
                exports.ExpressionDataMapping._defaultConverters = defaultConverters;
            }
            return exports.ExpressionDataMapping._defaultConverters;
        }
    },

    _addDefaultConvertersToMap: {
        value: function (converters) {
            exports.ExpressionDataMapping._addDefaultBooleanConvertersToConverters(converters);
            exports.ExpressionDataMapping._addDefaultNumberConvertersToConverters(converters);
            exports.ExpressionDataMapping._addDefaultStringConvertersToConverters(converters);
        }
    },

    _addDefaultBooleanConvertersToConverters: {
        value: function (converters) {
            var booleanConverters = {};
            booleanConverters["string"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return Boolean(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return String(value);
                    }
                }
            });
            booleanConverters["number"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return Boolean(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return Number(value);
                    }
                }
            });
            converters["boolean"] = booleanConverters;
        }
    },

    _addDefaultNumberConvertersToConverters: {
        value: function (converters) {
            var numberConverters = {};
            numberConverters["string"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return Number(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return String(value);
                    }
                },
                identifier: {
                    value: "String -> Number"
                }
            });
            numberConverters["boolean"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return Number(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return Boolean(value);
                    }
                }
            });
            converters["number"] = numberConverters;
        }
    },

    _addDefaultStringConvertersToConverters: {
        value: function (converters) {
            var stringConverters = {};
            stringConverters["number"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return String(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return Number(value);
                    }
                },
                identifier: {
                    value: "Number -> String"
                }
            });
            stringConverters["boolean"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return String(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return Boolean(value);
                    }
                }
            });
            converters["string"] = stringConverters;
        }
    }

});
