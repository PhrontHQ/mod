# Implementation Plan: Version 1

Version 1 implements only core validation components with manual configuration, deferring automatic data context discovery, error message localization and performance optimizations.

1. **Base `ValidationRule` Class**

    - **Purpose**: To serve as a blueprint for all validation rules. It ensures each rule has a consistent API for the `ValidationService` to use.
    - **Properties**:
        - `name: string`: A unique identifier for the rule (e.g., `isMandatory`).
        - `message: string`: The localized message.
        - `validationProperties: PropertyDescriptor[]`: An array of property descriptor objects that this rule depends on. This wiil be used for the `ValidationService` to know when to re-run the rule.
    - **Methods**:
        - `evaluateRule(dataInstance): Promise<ValidationError | null>`:
            - Core asynchronous method all subclasses must implement.
            - Accepts the data object instance for validation.
            - Run rules in parallel using `Promise.all`.
            - Returns a **Promise** resolving to either:
                - A `ValidationError` object (validation fails)
                - `null` (validation succeeds)
    - **Pseudo-code for the base class**

        ```js
        class ValidationRule {
            constructor(name, message, validationProperties) {
                this.name = name;
                this.message = message;
                this.validationProperties = validationProperties;
            }

            async evaluateRule(dataInstance) {
                // This method must be implemented by subclasses.
                throw new Error("ValidationRule.evaluateRule() must be implemented.");
            }
        }
        ```

2. `ExpressionValidationRule` Subclass (**extends `ValidationRule`)**

    - **Purpose**: To validate a data instance against a given string expression.
    - **Properties**:
        - Inherits `name`, `message`, and `validationProperties` from `ValidationRule`.
        - `criteria: Criteria`: Object that contains an expression string to be evaluated (e.g., "endDate > startDate`"`).
    - **Methods**:
        - `evaluateRule(dataInstance): Promise<ValidationError | null>`:
            1. **Override** the base class method.
            2. Evaluate the `criteria` expression against the instance object.
            3. Return a `ValidationError` if the expression is false, using the rule's details.
            4. Return `null` if the expression evaluates to true.
    - **Pseudo-code for the subclass**

        ```js
        class ExpressionValidationRule extends ValidationRule {
            constructor(name, message, validationProperties, criteria) {
                super(name, message, validationProperties);
                this.criteria = criteria;
            }

            async evaluateRule(dataInstance) {
                // delegate logic to FRB...
                const isValid = evaluateExpression(this.criteria, dataInstance);

                if (!isValid) {
                    // Rule failed, return the error object.
                    return new ValidationError(
                      message: this.message, // Later, we should use a localization service.
                      rule: this,
                    );
                }

                // Rule passed.
                return null;
           }
        }
        ```

3. `ValidationService`

    - **Purpose**: This service orchestrates the validation process by triggering rules and updating the `invalidityState` property on data objects.
    - **Methods**:
        - `validateDataObject(instance, allRules)`:
            1. **Run All Rules**: Asynchronously execute the `validate` method for each rule in `allRules` with the `instance`.
            2. **Collect Results**: Gather all `ValidationError` objects from failed validations.
            3. **Update State**: Replace `instance.invalidityState` with the new error map, if any.

4. `PropertyField` Component Enhancements

    In Version 1, the `PropertyField` component will aonly accept data context through explicit properties since automatic discovery will be implemented later.

    - **New Properties:**
        - `dataInstances: object[]`: A collection of data instances for editing. Enables a component to modify the same property across multiple objects (though most use cases will involve a single object).
        - `dataInstance: object` : A convenience getter/setter that simplifies access to to `dataInstances[0]`.
        - `dataType: ObjectDescriptor`: The object descriptor that defines the schema for the `dataInstance`.
        - `dataTypeProperty: PropertyDescriptor`: The property descriptor within the `dataType` that this field edits (e.g., the `firstName` property descriptor).
        - `isTouched: boolean`: Initialized to `false`. Indicates whether the field has been interacted with by the user.

5. `ValidationError`

    **Purpose:** The `ValidationError` class encapsulates details of a validation failure.
    **Properties**

    - `message: string`: User-facing error message for display. Future versions will use localized strings from `messageKey`.
    - `rule: ValidationRule`: the `ValidationRule` that generated the error (e.g., `isMandatory`).

## Future Improvements

1. `ValidationService` Enhancements

    - **Methods**:
      `validateProperty(instance, propertyName, allRules)`:
        - **Find Relevant Rules**: Filter `allRules` to include only those affecting the changed property.
        - **Execute Rules**: Run filtered rules.
        - **Process Results**: Collect errors from failed validations.
        - **Update State**: The service retrieves the current invalidityState, removes errors for re-validated rules, adds new errors from failures, and finally updates instance.invalidityState with the modified map.

2. **`ValidationRule` & `ExpressionValidationRule`** Enhancements

    - **Methods**:
      `validationProperties()`
        - Implement a `validationProperties()` method that returns a Set of dependent properties that the rule depends on.

3. **Automatic Context Discovery via Data-Binding**

    When a UI component is bound to a data expression, the system automatically performs an analysis to establish the data validation context:

    1. **Binding Declaration:** Define a binding
        - **Example:** A input property text field value is bound to `value: @owner.user.email`.
    2. **Intelligent Expression Resolution:** FRB parses this expression to identify three crucial elements:
        - **Target Instance `dataInstance`:** The object containing the property being edited (the `user` object).
        - **Target Type `dataType`:** TheUser object descriptor.
        - **Target Property `dataTypeProperty`:** The name of the property itself (`email`).

4. **Support** **Internationalization (i18n) for Messages & Labels**

    To support full translation, validation messages and UI component labels will use Localized String Data Objects.
