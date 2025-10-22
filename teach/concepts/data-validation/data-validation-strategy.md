# Data Validation Strategy

This spec outlines a centralized data validation system that works across client and server environments while making UI validation display simpler.

## Core Architecture

The system is built on several main components:

### 1. Validation Rules

Validation rules are defined on `ObjectDescriptors` using a `validationRules` property, providing a centralized definition of validation constraints.

This supports both simple, single-property rules (e.g., "age must be a positive number") and complex, multi-property rules (e.g., "end date must be after start date").

Additionally, the system can automatically generate basic rules from the property-descriptor schema (such as type-checking or required fields) and will be added to the `validationRules` property on the `ObjectDescriptors` object.

The system handles all validation rules **asynchronously**, where validation rules return Promises. The validation engine waits for resolution, and failures add errors to the object's `invalidityState`.

#### Implementation

1. **Base `ValidationRule` Class**

    - **Purpose**: To serve as a blueprint for all validation rules.
    - **Properties**:
        - `name: string`: A unique identifier for the rule (e.g., `isMandatory`).
        - `message: string`: The localized message.
        - `hints: string[]`: An array of strings providing additional guidance or suggestions related to the data validation process.
        - `validationProperties: string[]`: An array of property name that this rule depends on.
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

2. **`ExpressionValidationRule` Subclass (extends `ValidationRule`)**

    - **Purpose**: To validate a data instance against a given string expression.
    - **Properties**:
        - Inherits `name`, `message`, `hints` and `validationProperties` from `ValidationRule`.
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

#### Example

```json
{
    "root": {
        "prototype": "mod/core/meta/module-object-descriptor",
        "values": {
            "name": "Employee",
            "propertyDescriptors": [
                { "@": "firstName" },
                { "@": "lastName" },
                { "@": "email" },
                { "@": "startDate" },
                { "@": "endDate" },
                { "@": "employeeId" }
            ],
            "validationRules": [
                // Custom single-property and complex, multi-property rules
                // go here.
                { "@": "employeeIdFormat" },
                { "@": "endDateAfterStartDate" }
            ]
            //... other properties like "module", "parent", etc.
        }
    },
    "firstName": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "firstName",

            // Label that appears in property fields and is used to generate
            // error messages automatically.
            "label": "First Name",

            // -----------------------------------------------------------------
            // The following properties will automatically generate expression
            // validation rules:
            // -----------------------------------------------------------------

            // Validates that the value is a string
            // Default error message: "{label} is not a valid {valueType}."
            "valueType": "string",

            // Specifies that the field must have a value and cannot be left empty
            // Default error message: "{label} is required and cannot be empty."
            "isMandatory": true,

            // Sets the minimum length for the string value
            // Default error message: "{label} must be at least {min} characters long."
            "minLength": 2,

            // Sets the maximum length for the string value
            // Default error message: {label} cannot be more than {max} characters long.
            "maxLength": 128
        }
    },
    "lastName": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "lastName",
            "label": "Last Name",
            "valueType": "string",
            "isMandatory": true,
            "minLength": 2,
            "maxLength": 128
        }
    },
    "email": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "email",
            "label": "Email",
            "valueType": "email",
            "isMandatory": true,
            "minLength": 5,
            "maxLength": 128
        }
    },
    "startDate": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "startDate",
            "label": "Start Date",
            "valueType": "date",
            "isMandatory": true
        }
    },
    "endDate": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "endDate",
            "label": "End Date",
            "valueType": "date"
        }
    },
    "employeeId": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "employeeId",
            "label": "Employee ID",
            "valueType": "string",
            "isMandatory": true
        }
    },
    // Single property rule
    "employeeIdFormat": {
        "prototype": "mod/core/validation/expression-validation-rule",
        "values": {
            "message": "Employee ID must be in the format 'E' followed by 5 digits (e.g., E12345).",
            "name": "employeeId",
            "criteria": { "@": "employeeIdFormatCriteria" }
        }
    },
    "employeeIdFormatCriteria": {
        "prototype": "mod/core/criteria",
        "values": {
            "expression": "employeeId.match('^[E][0-9]{5}$')"
        }
    },
    // Complex, multi-property rule
    "endDateAfterStartDate": {
        "prototype": "mod/core/validation/expression-validation-rule",
        "values": {
            "message": "End date must be after the start date.",
            "name": "enDate",
            "validationProperties": ["startDate"],
            "criteria": { "@": "endDateAfterStartDateCriteria" }
        }
    },
    "endDateAfterStartDateCriteria": {
        "prototype": "mod/core/criteria",
        "values": {
            // The rule automatically pass if either date has not yet been entered
            "expression": "startDate == null || endDate == null || endDate > startDate"
        }
    }
}
```

### 2. Invalidity State

When a data object fails validation, it is not rejected right away. Instead, validation errors are stored in a special `invalidityState` property on the object instance itself.

This state maintains a structured list of all current validation failures (`ValidationError`), specifying which properties are involved and why they're invalid. This approach allows the application to function with temporarily invalid data until the user makes corrections.

### 3. ValidationError

A `ValidationError` object would likely contain three key pieces of information:

-   `message: string`: The user-facing error message, translated into the current language.
-   `rule: ValidationRule`: The validation rule object descriptor that failed (e.g., `isMandatory`, `min`, or a custom rule like `endDateAfterStartDate`).

#### Example 1: Basic Mandatory Field Error

This error occurs when a field marked with `"isMandatory": true` is left empty.

**Scenario:** The user saves an employee record but leaves the `firstName` field blank.

-   **Invalid Data:** `firstName: ""`
-   **Rule Violated:** The auto-generated `isMandatory` rule on the `firstName` property.

The resulting `ValidationError` would look like this:

```json
{
    "message": "First Name is required and cannot be empty.",
    "validationProperties": ["firstName"],
    "rule": {
        // The validation rule object that caused this error
        "name": "isMandatory"
        // ... (all other Validation Rule properties)
    }
}
```

#### Example 2: Custom Single-Property Rule Error

This error is generated by a custom rule that checks a specific format.

**Scenario:** The user enters an `employeeId` that doesn't follow the required pattern.

-   **Invalid Data:** `employeeId: "E-1234"`
-   **Rule Violated:** The custom `employeeIdFormat` rule.

The resulting `ValidationError` would look like this:

```json
{
    "message": "Employee ID must be in the format 'E' followed by 5 digits (e.g., E12345).",
    "rule": { "name": "employeeIdFormat" }
}
```

#### Example 3: Complex Multi-Property Rule Error

This error involves a rule that compares the values of two different properties.

**Scenario:** The user sets an employee's `endDate` to a date that is before their `startDate`.

-   **Invalid Data:** `startDate: "2025-11-10"`, `endDate: "2025-11-01"`
-   **Rule Violated:** The custom `endDateAfterStartDate` rule.

The resulting `ValidationError` would look like this:

```json
{
    "message": "End date must be after the start date.",
    "rule": { "name": "endDateAfterStartDate" }
}
```

#### The Complete `invalidityState` property

The `invalidityState` property is a map where each key is a property name, and the value is an array of `ValidationError` objects for that property. This structure allows multiple validation errors to be tracked per property.

For example, if an employee instance has errors on `firstName`, `employeeId`, `startDate`, and `endDate`, its `invalidityState` would look like:

```json
"invalidityState": {
  "firstName": [
    {
      "message": "First Name is required and cannot be empty.",
      "rule": {"name": "isMandatory" }
    }
  ],
  "employeeId": [
    {
      "message": "Employee ID must be in the format 'E' followed by 5 digits (e.g., E12345).",
      "rule": { "name": "employeeIdFormat" }
    }
  ],
  "endDate": [
    {
      "message": "End date must be after the start date.",
      "rule": { "name": "endDateAfterStartDate" }
    }
  ],
  "startDate": [
    {
      "message": "End date must be after the start date.",
      "rule": { "name": "endDateAfterStartDate" }
    }
  ]
}
```

### 5. Smart PropertyField Components

A set of UI components called **`PropertyField`** that wrap standard inputs (text fields, number inputs, etc.) to provide labels, help text, and validation error display.

Each `PropertyField` components are data-aware, knowing their associated object instance (`dataInstance`), their data object descriptor (`dataType`) and property (`dataTypeProperty`).

This lets the Property Field read the `invalidityState` directly from the data object. When validation errors occur, the Property Field automatically displays error messages and updates its appearance (e.g., showing a red border).

#### Dynamic Discovery

To minimize developer effort, the system automatically determines the data context by parsing FRB data binding expressions.

For example, when a `PropertyField` value binds to `@owner.user.name`, the system parses this expression to automatically determine:

-   `dataInstances: object[]`: A collection of data instances for editing. Enables a component to modify the same property across multiple objects (though most use cases will involve a single object).
-   `dataInstance: object` : A convenience getter/setter that simplifies access to to `dataInstances[0]`.
-   `dataType: ObjectDescriptor`: The object descriptor that defines the schema for the `dataInstance`.
-   `dataTypeProperty: PropertyDescriptor`: The property descriptor within the `dataType` that this field edits (e.g., the `firstName` property descriptor).
-   `isTouched: boolean`: Initialized to `false`. Indicates whether the field has been interacted with by the user.

#### Manual Override

Dynamic discovery, can be **overridden** when needed. Developers can manually specify `dataType`, `dataTypeProperty`, and `dataInstance` for complex scenarios where automatic detection is insufficient, providing control without losing the system's convenience.

#### Validation Flow

1. **User Input & Immediate Model Update**

    When a user updates a **Property Field** (text field, dropdown, etc.), data binding immediately updates the corresponding property in the **Data Model**. At this moment, the model is "dirty" and may be invalid.

2. **Triggering the Validation Logic**

    The **Data Trigger** handles property changes on the Data Model by dispatching a change event. This event calls the **Main Service's** `handleChange()` method with details about the modified property. The Main Service then passes the validation logic to a new **Validation Service** that handles all validation rules and checks.

3. **Executing Validation Rules**
   The Validation Service determines the validation strategy to use:
    - **On-Change Validation:** The service runs validation rules for the changed property and any dependent properties.
    - **On-Save Validation:** When triggered by a `saveChanges()` call (manual or autosave), the service validates the entire Data Model to ensure data validity before persistence.
4. **Managing the** `invalidityState` **Property**
    - **On Failure:** If any rule fails, the service updates the Data Model's `invalidityState` object, mapping property names to their validation errors. Each error contains the message and list of affected properties.
    - **On Success:** If all executed rules pass, the service clears any existing errors for the validated properties from the `invalidityState`.
5. **Real-time UI Feedback**

    The **Mod UI Controls** are designed to be "**reactive**". When this `invalidityState` object is updated, the following happens automatically via bindings:

    1. The relevant **Property Fields** are notified of the change.
    2. Each Property Field checks the `invalidityState` to see if there are any errors associated with the property it manages.
    3. If an error exists, the Property Field updates its appearance to reflect the error (e.g., showing a red border, displaying a help-text error message, etc.), providing immediate feedback to the user.

## Future Improvements

1. `DataValidationManager` Enhancements

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
