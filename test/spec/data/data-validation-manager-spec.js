const { DataValidationManager } = require("mod/data/service/data-validation-manager");
const movieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;

// Mock ObjectDescriptorStore that returns our movieDescriptor.
const mockObjectDescriptorStore = {
    getForObject: (_) => movieDescriptor,
};

describe("DataValidationManager", () => {
    let validationManager;

    beforeEach(() => {
        validationManager = new DataValidationManager(mockObjectDescriptorStore);
    });

    //--------------------------------------------------------------------------
    // Constructor Tests
    //--------------------------------------------------------------------------
    describe("constructor", () => {
        it("should create an instance successfully with a valid store", () => {
            expect(() => new DataValidationManager(mockObjectDescriptorStore)).not.toThrow();
        });

        it("should throw an error if the store is null or undefined", () => {
            expect(() => new DataValidationManager(null)).toThrow();
            expect(() => new DataValidationManager(undefined)).toThrow();
        });

        it("should throw an error if the store is missing the `getForObject` method", () => {
            const invalidStore = {}; // An object without the required method.
            expect(() => new DataValidationManager(invalidStore)).toThrow();
        });
    });

    //--------------------------------------------------------------------------
    // getInvalidityStateForObject Tests
    //--------------------------------------------------------------------------
    describe("getInvalidityStateForObject", () => {
        it("should return an empty map for an object with no validation errors", async () => {
            // Setup:
            const validObject = { title: "Inception" };

            // Execute:
            const invalidityState = await validationManager.getInvalidityStateForObject(validObject);

            // Assert:
            expect(invalidityState.size).toBe(0);
        });

        it("should group validation errors by rule name", async () => {
            // Setup: An object that will trigger multiple validation errors.
            // The title is too short and contains invalid characters.
            // The release date is in the future (beyond 2042).
            const invalidObject = { title: "@", releaseDate: new Date("2050-06-15") };

            // Execute:
            const invalidityState = await validationManager.getInvalidityStateForObject(invalidObject);

            // Assert:
            // Two unique rule names: 'title' and 'releaseDate'.
            expect(invalidityState).toBeInstanceOf(Map);
            expect(invalidityState.size).toBe(2);

            // Check the errors for the 'title' rule.
            expect(invalidityState.has("title")).toBe(true);
            expect(invalidityState.get("title").length).toBe(2);
            expect(invalidityState.get("title")[0].message).toBe("The title must be at least 2 characters long.");
            expect(invalidityState.get("title")[1].message).toBe("The title cannot contain the '@' character.");

            // Check the errors for the 'releaseDate' rule.
            expect(invalidityState.has("releaseDate")).toBe(true);
            expect(invalidityState.get("releaseDate").length).toBe(1);
            expect(invalidityState.get("releaseDate")[0].message).toBe("The release date must be before 2042.");
        });
    });

    //--------------------------------------------------------------------------
    // validateObjects Tests
    //--------------------------------------------------------------------------
    describe("validateObjects", () => {
        it("should return an empty map when validating an empty array", async () => {
            // Setup:
            const objects = [];

            // Execute:
            const validationResults = await validationManager.validateObjects(objects);

            // Assert:
            expect(validationResults).toBeInstanceOf(Map);
            expect(validationResults.size).toBe(0);
        });

        it("should return a map with empty invalidity states for all valid objects", async () => {
            // Setup:
            const validObject1 = { title: "The Matrix" };
            const validObject2 = { title: "Blade Runner", releaseDate: new Date("1982-06-25") };
            const objects = [validObject1, validObject2];

            // Execute:
            const validationResults = await validationManager.validateObjects(objects);

            // Assert:
            expect(validationResults.size).toBe(2);
            expect(validationResults.get(validObject1).size).toBe(0);
            expect(validationResults.get(validObject2).size).toBe(0);
        });

        it("should correctly identify and group errors for a mix of valid and invalid objects", async () => {
            // Setup:
            const validObject = { title: "A Valid Movie Title" };
            // This object has two errors for the 'title' property.
            const invalidObject = { title: "@" };
            const objects = [validObject, invalidObject];

            // Execute:
            const validationResults = await validationManager.validateObjects(objects);

            // Assert:
            expect(validationResults.size).toBe(2);

            // Check the valid object's result.
            const validObjectErrors = validationResults.get(validObject);
            expect(validObjectErrors.size).toBe(0);

            // Check the invalid object's result.
            const invalidObjectErrors = validationResults.get(invalidObject);
            expect(invalidObjectErrors.size).toBe(1);
            expect(invalidObjectErrors.has("title")).toBe(true);
            expect(invalidObjectErrors.get("title").length).toBe(2);
            expect(invalidObjectErrors.get("title")[0].message).toContain("at least 2 characters");
            expect(invalidObjectErrors.get("title")[1].message).toContain("cannot contain the '@'");
        });

        it("should handle multiple invalid objects with different errors", async () => {
            // Setup:
            const invalidTitleObject = { title: "T" };
            const invalidDateObject = { releaseDate: new Date("2050-01-01") };
            const objects = [invalidTitleObject, invalidDateObject];

            // Execute:
            const validationResults = await validationManager.validateObjects(objects);

            // Assert:
            expect(validationResults.size).toBe(2);

            // Check the first invalid object.
            const titleErrors = validationResults.get(invalidTitleObject);
            expect(titleErrors.size).toBe(1);
            expect(titleErrors.has("title")).toBe(true);
            expect(titleErrors.get("title").length).toBe(1);
            expect(titleErrors.get("title")[0].message).toBe("The title must be at least 2 characters long.");

            // Check the second invalid object.
            const dateErrors = validationResults.get(invalidDateObject);
            expect(dateErrors.size).toBe(1);
            expect(dateErrors.has("releaseDate")).toBe(true);
            expect(dateErrors.get("releaseDate").length).toBe(1);
            expect(dateErrors.get("releaseDate")[0].message).toBe("The release date must be before 2042.");
        });
    });
});
