# Data Validation

Intro, this a draft for a spec to implememnt a comprehesive data validation.

## Goals

* Allow the core of data validation logic to be implemented at the data layer level, so it can be used both client and worker side
* Minimize, standardize the work needed to put it in place at UI Controls level. By automating the knowledge of what kind of data type and the property actually bound to the control that ends up setting the value on the control, we can get more semantic information.

- The data validation logic has to be run automatically on user input and save changes client side, and on data operation processing in the worker.

## Validation Rules

Validation rules are defined on ObjectDescriptors. Right now, it has the begining of an implementation in:

- propertyValidationRules: an array of PropertyValidationRule instances.

  - REVIEW: this might be better named as just "validationRules"
  - REVIEW: Because some validation rules can involve multiple properties, it doesn't make too much sense to put those that are property-specific on property descriptors, or does it?
  - TODO: We need to dynamically implement validationRules for things that are well defined on property descriptors such as the type of object expected (instanceof), cardinality, etc... Those should not be created by hand, but lazily built on the fly, on-demand.
  - TODO: ValidationRule right now is really "ExpressionValidationRule". We most likely need ValidationRule super class that allows a full imperative implementation if needed.

    - TODO: implement validationProperties method that returns a set containing the properties of the object validated involved in the rule. Do we need nested expressions?
      - ValidationRule subclasses will have to manually take care of that
      - ExpressionValidationRule can automatically implement it using the criteria's syntax
- An ObjectDescriptor needs to able to helo quickly find all validationRules when object's proeprty change happens so we can only execute thoses
- validation has to be async, as it's possible that some rules may involve fetching more data to be executed, or defering execution to the worker? HOW DO WE KNOW THAT? HOW DO WE MAKE IT HAPPEN? IS IT A NEW TYPE OF DATAOPERATION?
- Failure to pass validation rule means additions to the object’s invalidityState. Are these instances of Error?

## DataObjects' InvalidityState

When validation logic runs, if validation rules find issues, they will be entered in an instance's own invalidityState. That state needs to be strutured with the type's properties involved pointing to the invalidatities found. Each invalidity needs to provide information needed to be conveyed to the user, via UI controls, so they can be addressed.

Are what's stored within the InvalidityState a new ValidationError subclass of Error that we need to create?

## Control and the InvalidityState

Controls need know which property of which instance it is editing, so it can access informations off that instance's invalidityState for the property it is wired to edit. Some error validations can also involve more than 1 property. In order to enable this, we propose that Control gains the following new properties:

* dataType, or dataDescriptor - The Type or ObjectDescriptor of the instance being edited. We intend to populate this by leveraging information from data bindings when available

- dataInstance(s) - the instance of dataType being edited. There's the problem that some controls edit multiple instances. So we may want to use dataInstances with dataInstance as a getter/setter over dataInstances[0]. For a component named Persons it would be logical that it would have an "instances" property. But for a component named Person "instance" makes more sense. So defaults to an array containing the one instance if it exists?
- When a control has it's value being set, it means that the data object hosting that value is available, so it's the right time to automatically analyse the binding to self-assigned dataInstance and dataType/dataDescriptor from it if available

  - Note the pairing of dataType/dataDescriptor and dataInstance(s) make it clear what dataInstance(s) is, even for non-technical people
- dataExpression - this property would be the expression off dataInstance(s) that gave the control its value(s)
- But those need to be set directly

## Validation Flow

1. A user input/change value via a Mod Control.
2. Data bindings propagate the value to dataInstance's property setter, and the DataTrigger
3. the DataTrigger invoke the main service's handleChange(aChangeEvent) carrying the change that happened
4. The mainService is either in autosave and the validation kicks in from saveChanges(), or it directly invoke validation targeted on the propery that just changed
5. Validation errors are set on the data instance's invalidityState
6. The control(s) involved in editing the data instance, using data binding or property observing (which means they needs to be able to reister as such the invalidity state knowing what they edit) informed of validation errors to handle and need to push the right states / user-intended errors on the field they're part of. It could be that other properties are involved as well at the same time. So the ValidationError might need a property carrying set of those properties.
