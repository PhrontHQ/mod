const { ExpressionValidationRule } = require("mod/core/meta/expression-validation-rule");
const { ValidationError } = require("mod/core/error/validation-error");
const { Criteria } = require("mod/core/criteria");

describe("logic/validation/expression-validation-rule-spec", () => {
    let rule;

    // Set up a new rule instance before each test.
    beforeEach(() => {
        rule = new ExpressionValidationRule();
        rule.message = "The provided value is invalid.";
        rule.name = "testExpressionRule";
    });

    //--------------------------------------------------------------------------
    // Test for PASSING validation (truthy outcomes)
    //--------------------------------------------------------------------------

    it("should return null when the criteria expression evaluates to true", async () => {
        // Setup: Create a criteria that will pass.
        rule.criteria = new Criteria().initWithExpression("a > 5");
        const dataInstance = { a: 10 };

        // Execute and Assert
        const result = await rule.evaluateRule(dataInstance);
        expect(result).toBeNull();
    });

    it("should return null for a truthy expression using parameters", async () => {
        // Setup: Create a criteria that will pass.
        rule.criteria = new Criteria().initWithExpression("a >= $min", { min: 5 });
        const dataInstance = { a: 10 };

        // Execute and Assert
        const result = await rule.evaluateRule(dataInstance);
        expect(result).toBeNull();
    });

    //--------------------------------------------------------------------------
    // Test for FAILING validation (falsy outcomes)
    //--------------------------------------------------------------------------

    it("should return a ValidationError when the criteria expression evaluates to false", async () => {
        // Setup: Create a criteria that will fail.
        rule.criteria = new Criteria().initWithExpression("a < 5");
        const dataInstance = { a: 10 };

        // Execute
        const result = await rule.evaluateRule(dataInstance);

        // Assert
        expect(result).toBeInstanceOf(ValidationError);
        expect(result.message).toBe("The provided value is invalid.");
        expect(result.rule).toBe(rule); // The error should reference the rule that created it.
    });

    it("should return a ValidationError for a falsy expression using parameters", async () => {
        // Setup: Create a criteria that will fail.
        rule.criteria = new Criteria().initWithExpression("a <= $min", { min: 5 });
        const dataInstance = { a: 10 };

        // Execute
        const result = await rule.evaluateRule(dataInstance);

        // Assert
        expect(result).toBeInstanceOf(ValidationError);
        expect(result.message).toBe("The provided value is invalid.");
        expect(result.rule).toBe(rule); // The error should reference the rule that created it.
    });
});
