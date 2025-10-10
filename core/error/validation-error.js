/**
 * Represents a single validation failure.
 * This object is created when a ValidationRule fails.
 */
exports.ValidationError = class ValidationError {
    /**
     * @param {string} message The user-facing error message.
     * @param {ValidationRule} rule The rule instance that generated the error.
     */
    constructor(message, rule) {
        if (!message || typeof message !== "string") {
            throw new Error("ValidationError requires a 'message' string.");
        }

        if (!rule) {
            throw new Error("ValidationError requires a 'rule' object.");
        }

        this.message = message;
        this.rule = rule;
    }
};
