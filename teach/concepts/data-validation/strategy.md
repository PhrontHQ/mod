# Data Validation Strategy

This spec outlines a centralized data validation system that works across client and server environments while making UI validation display simpler.

## Core Architecture

The system is built on three main components:

### **1. Validation Rules**

Validation rules are defined on `ObjectDescriptors` using a `validationRules` property, providing a centralized definition of validation constraints.

This supports both simple, single-property rules (e.g., "age must be a positive number") and complex, multi-property rules (e.g., "end date must be after start date").

Additionally, the system can automatically generate basic rules from the property-descriptor schema (such as type-checking or required fields) and will be added to the `validationRules` property on the `ObjectDescriptors` object.

The system handles all validation rules **asynchronously,** where validation rules return Promises. The validation engine waits for resolution, and failures add errors to the object's `invalidityState`.

**Example**:

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

### Important Note: UI Interaction and "Touched" State

Validation logic must know about UI control interaction state, specifically when a control is **"touched"** (focused then blurred by user) for proper UX.

Indeed, for required fields, errors shouldn't appear on initial load before user interaction. Validation should only trigger _after_ the user has "touched" the control and left it in an invalid state.

`employee.touchedProperties = ["firstName", "email"]; // Like this?`

### **2. Invalidity State**

When a data object fails validation, it is not rejected right away. Instead, validation errors are stored in a special `invalidityState` property on the object instance itself.

This state maintains a structured list of all current validation failures (`ValidationError`), specifying which properties are involved and why they're invalid. This approach allows the application to function with temporarily invalid data until the user makes corrections.

#### ValidationError

A `ValidationError` object would likely contain three key pieces of information:

-   `message`: The user-facing error message, translated into the current language.
-   `validationProperties`: An array of property object descriptor involved in the validation failure.
-   `rule`: The validation rule object descriptor that failed (e.g., `isMandatory`, `min`, or a custom rule like `endDateAfterStartDate`).

#### Example 1: Basic Mandatory Field Error

This error occurs when a field marked with `"isMandatory": true` is left empty.

**Scenario:** The user saves an employee record but leaves the `firstName` field blank.

-   **Invalid Data:** `firstName: ""`
-   **Rule Violated:** The auto-generated `isMandatory` rule on the `firstName` property.

The resulting `ValidationError` would look like this:

```json
{
    "message": "First Name is required and cannot be empty.",
    "validationProperties": [
        // Array of property field descriptor instances that this rule depends on
        {
            "name": "firstName"
            // ... (all other PropertyDescriptor properties)
        }
    ],
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
    "validationProperties": [{ "name": "employeeId" }],
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
    "validationProperties": [{ "name": "startDate" }, { "name": "endDate" }],
    "rule": { "name": "endDateAfterStartDate" }
}
```

#### The Complete `invalidityState` property

When multiple validation rules fail on an object instance, the `invalidityState` property would contain an array of all the corresponding `ValidationError` objects.

For an employee instance with all three errors from the examples above, its `invalidityState` would look like this:

```json
"invalidityState": [
  {
    "message": "First Name is required and cannot be empty.",
    "validationProperties": [{ "name": "firstName" }],
    "rule": {"name": "isMandatory" }
  },
  {
    "message": "Employee ID must be in the format 'E' followed by 5 digits (e.g., E12345).",
    "validationProperties": [{ "name": "employeeId" }],
    "rule": { "name": "employeeIdFormat" }
  },
  {
    "message": "End date must be after the start date.",
    "validationProperties": [{ "name": "startDate" }, { "name": "endDate" }],
    "rule": { "name": "endDateAfterStartDate" }
  }
]
```

### 3. Smart PropertyField Components

A set of UI components called **`PropertyField`** that wrap standard inputs (text fields, number inputs, etc.) to provide labels, help text, and validation error display.

Each `PropertyField` components are data-aware, knowing their associated object instance (`dataInstance`) and property (`dataTypeProperty`).

This lets the UI control read the `invalidityState` directly from the data object. When validation errors occur, the control automatically displays error messages and updates its appearance (e.g., showing a red border).

#### Dynamic Discovery

To minimize developer effort, the system automatically determines the data context by parsing FRB data binding expressions.

For example, when a `PropertyField` value binds to `@owner.user.name`, the system parses this path to automatically determine:

-   **`dataType`**: The `User` data object descriptor.
-   **`dataTypeProperty`**: The `name` property object descriptor.
-   **`dataInstance`**: The specific `user` instance being edited.

#### Manual Override

Dynamic discovery, can be **overridden** when needed. Developers can manually specify `dataType`, `dataTypeProperty`, and `dataInstance` for complex scenarios where automatic detection is insufficient, providing control without losing the system's convenience.

## Validation Flow

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
    2. Each control checks the `invalidityState` to see if there are any errors associated with the property it manages.
    3. If an error exists, the control updates its appearance to reflect the error (e.g., showing a red border, displaying a help-text error message, etc.), providing immediate feedback to the user.

**Questions:**

1.  Multiple Errors Per Property:
    What happens if a property fails multiple rules? For example, if firstName is both empty (fails isMandatory) and too long when present (fails max):

    ```json
    "invalidityState": [
        {
            "message": "First Name is required...",
            "validationProperties": [{"name": "firstName", /*...*/}],
            "rule": {"name": "isMandatory", /*...*/}
        },
        {
            "message": "First Name cannot be more than 128 characters...",
            "validationProperties": [{"name": "firstName", /*...*/}],
            "rule": {"name": "maxLength", /*...*/}
        }
    ]
    ```

    Should PropertyField display both messages, or only the first one?
