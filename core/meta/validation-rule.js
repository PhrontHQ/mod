const Montage = require("core/core").Montage;
const Target = require("core/target").Target;

/**
 * Serves as a base class for all validation rules, ensuring a consistent API
 * for the validation service. This class is designed to be extended, not

 * used directly.
 *
 * @class ValidationRule
 * @extends Montage
 */
exports.ValidationRule = class ValidationRule extends Target {
    static {
        Montage.defineProperties(this.prototype, {
            _validationProperties: { value: null },
            _owner: { value: null },
            _message: { value: "" },
            _hints: { value: null },
            _name: { value: "" },
        });
    }

    /**
     * @type {ObjectDescriptor}
     */
    get owner() {
        return this._owner;
    }

    set owner(value) {
        this._owner = value;
    }

    /**
     * Name of the validation rule.
     * @type {string}
     */
    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    /**
     * The error message to display when validation fails.
     * TODO: This should support templating to include dynamic values.
     * FRB, or i18n keys?
     * @type {string}
     */
    get message() {
        return this._message;
    }

    set message(value) {
        this._message = value || "";
    }

    get ownPropertyNames() {
        if (this._ownPropertyNames) return this._ownPropertyNames;
        if (!this.owner) return [];

        const ownProperties = this.owner.ownPropertyDescriptors.map(({ name }) => name);
        this._ownPropertyNames = ownProperties;

        return this._ownPropertyNames;
    }

    /**
     * An array of property names that this validation rule depends on.
     * @type {Array<string>}
     */
    get validationProperties() {
        return this._validationProperties || [];
    }

    set validationProperties(value) {
        this._validationProperties = value;
    }

    /**
     * A collection of hints or suggestions to provide additional context or
     * guidance to the user when validation fails.
     * @type {Object}
     */
    get hints() {
        return this._hints;
    }

    set hints(value) {
        this._hints = value;
    }

    /**
     * Initialize a newly allocated object descriptor validation rule.
     * @param {string} name - The rule's name.
     * @param {ObjectDescriptor} objectDescriptor - The owning object descriptor.
     * @returns {this}
     */
    initWithNameAndObjectDescriptor(name, objectDescriptor) {
        if (typeof name !== "string") {
            throw new Error("A valid name string must be provided.");
        }

        if (!objectDescriptor) {
            throw new Error("A valid ObjectDescriptor must be provided.");
        }

        this._name = name;
        this._owner = objectDescriptor;
        return this;
    }

    /**
     * Serializes the validation rule's properties using the provided serializer.
     * @param {Serializer} serializer - The serializer instance.
     */
    serializeSelf(serializer) {
        serializer.setProperty("validationProperties", this.validationProperties, "reference");
        serializer.setProperty("owner", this.owner, "reference");
        serializer.setProperty("message", this.message);
        serializer.setProperty("hints", this.hints);
        serializer.setProperty("name", this.name);
        serializer.setAllValues();
    }

    /**
     * Deserializes the validation rule's properties using the provided deserializer.
     * @param {Deserializer} deserializer - The deserializer instance.
     */
    deserializeSelf(deserializer) {
        this.validationProperties = deserializer.getProperty("validationProperties");
        this.message = deserializer.getProperty("message");
        this.owner = deserializer.getProperty("owner");
        this.hints = deserializer.getProperty("hints");
        this.name = deserializer.getProperty("name");
    }

    /**
     * Core validation method that all subclasses must implement.
     * It evaluates the rule against a given data object instance.
     *
     * @param {object} dataInstance - The data object instance to validate.
     * @returns {Promise<ValidationError|null>} A Promise that resolves to a
     * ValidationError object if validation fails, or null if it succeeds.
     */
    async evaluateRule(dataInstance) {
        // This method must be implemented by subclasses.
        throw new Error("ValidationRule.evaluateRule() must be implemented.");
    }
};
