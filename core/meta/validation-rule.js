const PropertyValidationSemantics = require("./validation-semantics").PropertyValidationSemantics;
const Criteria = require("../criteria").Criterisa;
const Montage = require("../core").Montage;
const deprecate = require("../deprecate");

/**
 * @class PropertyValidationRule
 * @extends Montage
 */
exports.PropertyValidationRule = class PropertyValidationRule extends Montage {
    static {
        Montage.defineProperties(this.prototype, {
            _owner: { value: null },
            _name: { value: "" },
            _criteria: { value: null },
            _messageKey: { value: "" },
            _propertyValidationEvaluator: { value: null },

            // Descriptors required by Montage's serialization
            objectDescriptorModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
            objectDescriptor: require("../core")._objectDescriptorDescriptor,
            blueprintModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
            blueprint: require("../core")._objectDescriptorDescriptor,
        });
    }

    /**
     * Initialize a newly allocated object descriptor validation rule.
     * @param {string} name - The rule's name.
     * @param {ObjectDescriptor} objectDescriptor - The owning object descriptor.
     * @returns {this}
     */
    initWithNameAndObjectDescriptor(name, objectDescriptor) {
        this._name = name;
        this._owner = objectDescriptor;
        return this;
    }

    serializeSelf(serializer) {
        serializer.setProperty("name", this.name);
        serializer.setProperty("objectDescriptor", this.owner, "reference");
        serializer.setProperty("criteria", this._criteria, "reference");
        serializer.setProperty("messageKey", this.messageKey);
        serializer.setAllValues();
    }

    deserializeSelf(deserializer) {
        // Deserialize the property name
        let value = deserializer.getProperty("name");

        if (value !== undefined) {
            this._name = value;
        }

        // Deserialize the object descriptor (owner)
        value = deserializer.getProperty("objectDescriptor") || deserializer.getProperty("blueprint");

        if (value !== undefined) {
            this._owner = value;
        }

        // Backward compatibility
        value = deserializer.getProperty("validationSelector");

        if (value) {
            this._criteria = value;
        } else {
            value = deserializer.getProperty("criteria");

            if (value) {
                this._criteria = value;
            }
        }

        value = deserializer.getProperty("messageKey");

        if (value !== undefined) {
            this._messageKey = value;
        }

        // FIXME [PJYF Jan 8 2013] There is an API issue in the deserialization.
        // We should be able to write deserializer.getProperties() instead.
        const propertyNames = Montage.getSerializablePropertyNames(this);

        for (let i = 0, l = propertyNames.length; i < l; i++) {
            const propertyName = propertyNames[i];
            this[propertyName] = deserializer.getProperty(propertyName);
        }
    }

    /**
     * Component description attached to this validation rule.
     * @type {ObjectDescriptor}
     */
    get owner() {
        return this._owner;
    }

    /**
     * The identifier is the same as the name and is used to make the
     * serialization of a ObjectDescriptor humane.
     * @type {string}
     */
    get identifier() {
        return [this.objectDescriptor.identifier, "rule", this.name].join("_");
    }

    /**
     * Name of the property being described.
     * @type {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Criteria to evaluate to check this rule.
     * @type {Criteria}
     */
    get criteria() {
        if (!this._criteria) {
            this._criteria = Criteria.false;
        }

        return this._criteria;
    }

    set criteria(value) {
        this._criteria = value;
    }

    /**
     * Backward compatibility for `validationSelector`.
     * @type {Criteria}
     */
    get validationSelector() {
        return this.criteria;
    }

    set validationSelector(value) {
        this.criteria = value;
    }

    /**
     * Message key to display when the rule fires.
     * @type {string}
     */
    get messageKey() {
        if (!this._messageKey || this._messageKey.length === 0) {
            return this._name;
        }

        return this._messageKey;
    }

    set messageKey(value) {
        this._messageKey = value;
    }

    /**
     * Evaluates the rules based on the ObjectDescriptor and the properties.
     * @param {object} objectInstance - The object instance to evaluate the rule for.
     * @returns {boolean} - True if the rule fires, false otherwise.
     */
    evaluateRule(objectInstance) {
        if (this._propertyValidationEvaluator === null) {
            const propertyValidationSemantics = new PropertyValidationSemantics().initWithObjectDescriptor(
                this.objectDescriptor
            );
            this._propertyValidationEvaluator = propertyValidationSemantics.compile(this.criteria.syntax);
        }

        return this._propertyValidationEvaluator(objectInstance);
    }

    /*********************************************************************
     * Deprecated methods
     *********************************************************************/

    /**
     * @deprecated Use `initWithNameAndObjectDescriptor` instead.
     * @param {string} name
     * @param {ObjectDescriptor} blueprint
     * @returns {this}
     */
    initWithNameAndBlueprint = deprecate.deprecateMethod(
        void 0,
        (name, blueprint) => this.initWithNameAndObjectDescriptor(name, blueprint),
        "initWithNameAndBlueprint",
        "initWithNameAndObjectDescriptor"
    );
};
