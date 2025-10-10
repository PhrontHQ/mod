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

    get criteria() {
        return this._criteria;
    }

    set criteria(value) {
        this._criteria = value;
    }

    serializeSelf(serializer) {
        super.serializeSelf(serializer);
        serializer.setProperty("criteria", this._criteria, "reference");
        serializer.setAllValues();
    }

    deserializeSelf(deserializer) {
        super.deserializeSelf(deserializer);
        this._criteria = deserializer.getProperty("criteria");
    }

    /**
     * Evaluates the criteria expression against the data instance.
     *
     * @param {object} dataInstance - The data object instance to validate.
     * @returns {Promise<ValidationError|null>} A Promise that resolves to a
     * `ValidationError` object if the expression is falsy, or `null` if it is truthy.
     */
    async evaluateRule(dataInstance) {
        try {
            const isValid = this.criteria.evaluate(dataInstance);

            if (!isValid) {
                // Rule failed, return the error object.
                return new ValidationError(this.message, this);
            }
        } catch (error) {
            console.error(`Error evaluating expression for rule "${this.name}": ${this.criteria.expression}`, error);
            // An expression that throws an error is a developer mistake; treat as passing.
            return null;
        }

        // Rule passed.
        return null;
    }
};
