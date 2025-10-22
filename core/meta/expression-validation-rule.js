const { ValidationError } = require("core/error/validation-error");
const { ValidationRule } = require("./validation-rule");
const { Montage } = require("../core");

/**
 * A concrete validation rule that validates a data instance against a given
 * string expression from a `Criteria` object.
 *
 * @class ExpressionValidationRule
 * @extends ValidationRule
 */
exports.ExpressionValidationRule = class ExpressionValidationRule extends ValidationRule {
    static {
        Montage.defineProperties(this.prototype, {
            _criteria: { value: null },
        });
    }

    /**
     * The `Criteria` object containing the expression to be evaluated for this
     * validation rule.
     * @type {Criteria}
     */
    get criteria() {
        return this._criteria;
    }

    set criteria(value) {
        this._criteria = value;
    }

    /**
     * An array of property names that this validation rule depends on.
     * @override
     * @type {Array<string>}
     */
    get validationProperties() {
        if (this._validationProperties) return this._validationProperties;

        // Cache the result for future calls.
        this._validationProperties = this._findValidationProperties();
        return this._validationProperties;
    }

    /**
     * @override
     * @type {Array<string>}
     */
    set validationProperties(value) {
        // Read-only, do nothing.
    }

    /**
     * Serializes the expression validation rule
     * @param {Serializer} serializer - The serializer instance.
     */
    serializeSelf(serializer) {
        super.serializeSelf(serializer);
        serializer.setProperty("criteria", this._criteria, "reference");
        serializer.setAllValues();
    }

    /**
     * Deserializes the expression validation rule
     * @param {Deserializer} deserializer - The deserializer instance.
     */
    deserializeSelf(deserializer) {
        super.deserializeSelf(deserializer);
        this._criteria = deserializer.getProperty("criteria");
    }

    /**
     * Evaluates the criteria expression against the data instance.
     * @override
     * @async
     * @param {object} dataInstance - The data object instance to validate.
     * @returns {Promise<ValidationError|null>} A Promise that resolves to a
     * `ValidationError` object if the expression is falsy, or `null` if it is truthy.
     * NOTE: we use Promise here to be ready for future async criteria evaluations.
     */
    evaluateRule(dataInstance) {
        try {
            const isValid = this.criteria.evaluate(dataInstance);

            if (!isValid) {
                // Rule failed, return the error object.
                const error = new ValidationError().initWithMessageAndRule(this.message, this);
                return Promise.resolve(error);
            }

            // Rule passed.
            return Promise.resolve(null);
        } catch (error) {
            console.error(`Error evaluating expression for rule "${this.name}": ${this.criteria.expression}`, error);
            // An expression that throws an error is a developer mistake; treat as passing.
            return Promise.resolve(null);
        }
    }

    /**
     * Finds the list of property names that this validation rule depends on.
     * @returns {Array<string>} An array of property names.
     */
    _findValidationProperties() {
        // Get the list of qualified properties from the criteria.
        // FIXME: does not work as expected, the entire path is parsed, e.g. "address.city"
        // and return ["address", "city"]. It should return ["address"]
        const qualifiedProperties = this.criteria?.qualifiedProperties || [];

        return qualifiedProperties.filter((property) => {
            return this.ownPropertyNames.includes(property);
        });
    }
};
