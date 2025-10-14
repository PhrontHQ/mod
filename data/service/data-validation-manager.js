/**
 * Describes a store that provides ObjectDescriptors for given data objects.
 * @typedef {object} ObjectDescriptorStore
 * @property {(object: object) => ObjectDescriptor} getForObject - Retrieves the appropriate descriptor for a given object.
 */

/**
 * Manages the validation of data objects based on their descriptors.
 */
exports.DataValidationManager = class DataValidationManager {
    /** @type {ObjectDescriptorStore} */
    #objectDescriptorStore;

    /**
     * @param {ObjectDescriptorStore} objectDescriptorStore - A store responsible for providing object descriptors.
     */
    constructor(objectDescriptorStore) {
        if (typeof objectDescriptorStore?.getForObject !== "function") {
            throw new Error("A valid ObjectDescriptorStore with a `getForObject` method must be provided.");
        }

        this.#objectDescriptorStore = objectDescriptorStore;
    }

    /**
     * Asynchronously validates a collection of objects.
     *
     * @param {Array<object>} objects - An array of objects to validate.
     * @returns {Promise<Map<object, Map<string, ValidationError[]>>>} A promise that resolves with a map where each
     * key is an object from the input array and its value is a map of validation errors, grouped by rule name.
     */
    async validateObjects(objects) {
        // Create an array of promises, where each promise validates one object.
        const validationPromises = objects.map(async (object) => {
            const invalidityState = await this.getInvalidityStateForObject(object);
            // Return a [key, value] pair for the final Map constructor.
            return [object, invalidityState];
        });

        // Wait for all validation promises to resolve.
        const resolvedPairs = await Promise.all(validationPromises);

        // Construct the final result map from the resolved [object, invalidityState] pairs.
        return new Map(resolvedPairs);
    }

    /**
     * Asynchronously evaluates the validity of a single object and groups any errors by rule name.
     *
     * @param {object} object - The object to evaluate.
     * @returns {Promise<Map<string, ValidationError[]>>} A promise that resolves with the object's
     * invalidity state. An empty map signifies a valid object.
     */
    async getInvalidityStateForObject(object) {
        const invalidityState = new Map();

        try {
            const objectDescriptor = this.#objectDescriptorStore.getForObject(object);
            const validationErrors = await objectDescriptor.evaluateObjectValidity(object);

            // Group validation errors by rule name.
            for (const validationError of validationErrors) {
                const { rule } = validationError;

                // A single rule can be associated with multiple properties.
                const associatedProperties = rule.validationProperties || [];

                for (const propertyName of associatedProperties) {
                    if (!invalidityState.has(propertyName)) {
                        invalidityState.set(propertyName, []);
                    }

                    invalidityState.get(propertyName).push(validationError);
                }
            }
        } catch (error) {
            // Log the error for debugging but re-throw to let the caller handle it.
            console.error(`Error evaluating validity for object:`, object, error);
            throw error;
        }

        return invalidityState;
    }
};
