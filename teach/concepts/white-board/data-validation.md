# Data Validation

Intro, this a draft for a spec to implememnt a comprehesive data validation.

## Goals

* Allow the core of data validation logic to be implemented at the data layer level, so it can be used both client and worker side
* Minimize, standardize the work needed to put it in place at UI Controls level. By automating the knowledge of what kind of data type and the property actually bound to the control that ends up setting the value on the control, we can get more semantic information.


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
- An ObjectDescriptor needs to able to quickly find all validationRules when object's proeprty change happens so we can only execute thoses
- validation has to be async, as it's possible that some rules may involve fetching more data to be executed, or defering execution to the worker? HOW DO WE KNOW THAT? HOW DO WE MAKE IT HAPPEN? IS IT A NEW TYPE OF DATAOPERATION?
- Failure to pass validation rule means additions to the object’s invalidityState. Are these instances of Error?

## DataObjects' InvalidityState / validationErrors

The name "InvalidityState" comes from HTML5's ValidityState, which is a weired name considering what it does... So InvalidityState would be the better name. But we should probably consider other possibilities if they were better, like validationErrors? 

When validation logic runs, if ValidationRules fail, they will be entered in an instance's own invalidityState. That state needs to be strutured with the type's properties involved pointing to the invalidatities found. Each invalidity needs to provide information needed to be conveyed to the user, via UI controls, so they can be addressed.

What's stored within the InvalidityState should likely be a new ValidationError subclass of Error that we need to create. 

That error should also have a reference to the related ValidationRule that failed, from which we should be able to access the  multiple properties involved in the validationRule that failed, which are the expressions of the criteria making the validation rules. Criteria's qualifiedProperties does that today for its own expression, we should be able to use this.


## PropertyField 

PropertyField is a new set of components that wrap a control that handle a label, the display of user input validation error, offering help / hints, placeholder values, access to all previously valid values entered for quick local undo, and more as needed.

Their name comes from their close relationship with a property of an object being edited. For example, the value of the label property should by default automatically come from the "display name" value available on that property's descriptor of the data instance's ObjectDescriptor. It should also be possible to set a PropertyField's label property value with anything more specific via direct setting or binding. But it's not just label: help / hint, placeholder values etc.. should make the most of what's available in the data model.


  ### Conventions
  * have all property fields in one folder under /ui /ui/property-field/property-field.mod,  /ui/property-field/number.mod, etc...
  - we coined /ui/property-field/multiline-text.mod for a textarea and  /ui/property-field/text.mod for a single line text field / input


  ### Using the InvalidityState

  PropertyFields need to know which property of which instance it is editing, so it can access informations off that instance's invalidityState for the property it is wired to edit. Some error validations can also involve more than 1 property. In order to enable this, we propose that PropertyField gains the following new properties:

  * dataType, or dataDescriptor - The Type or ObjectDescriptor of the instance whose proeprty is being edited. We intend to populate this by leveraging information from data bindings when available
  - dataInstance(s) - the instance of dataType whose property is being edited. 
  - dataTypeProperty or dataInstanceProperty or just dataProperty? typeProperty? - the property of the dataInstance of dataType/dataDescriptor that the property field is editing. 

  The pairing of dataType/dataDescriptor and dataInstance(s) make it clear what dataInstance(s) is, even for non-technical people


    #### To Be Considered Further

    - Some controls edit multiple instances. So we may want to use dataInstances with dataInstance as a getter/setter over dataInstances[0]. For a component named Persons it would be logical that it would have an "instances" property. But for a component named Person "instance" makes more sense. So defaults to an array containing the one instance if it exists?


  ### Simplifying use: One Control class, one dedicated PropertyField subclass

  This allows us to optimally address specific layouts needs per control. It also allows modders to instantiate fields without having to bother with compositions of a control in a Prpp[ertyField every time], the exact same way we're instantiating controls today. Internally, the control will get its properties / binding / values from the PropertyField wrapping it.



## Dynamically Discovering dataType and dataTypeProperty

### The truth is out there
  We typically provide data to controls using bindings. Those binding always involved getting the data object from the component's owner. That owner component should always have a primary data it handles.

  If it's a list of data instances of the same type coming from the DataSet, in order to dispaly a list, we typically use a repetition which iteration's is used to bind the data off the current iteration's dataInstance to the iteration's components values.

  If the DataSet contains a single instance, like it's the case for a detail component, the bindings will likely starts by @owner.dataInstance. ...

  A component can also handle secondary, tertiary, ... data instances of other types that are not connected to the others. So we also need to have a way to make it work for those cases as well. 

  That owner component will either get an existing data set from someone else, or have to fetch to get it. Think of DataSet as a today DataQuery renamed as DataSet. That instance of DataSet has a data type, and that's our starting point: We need to know which DataType is at the root of the expression that will be evaluated. Once we know that, the logic is traversing the expression syntactic tree step by step, and for each step involving a property, finding the property descriptor in the current known ObjectDescriptor / type, find that property descriptor's valueDescriptor if any, which would be the ObjectDescriptor of the data instance expected to be set on that property, and then continue walking the expression syntactic tree until we reach the end. The last current ObjecDescriptor will be the PropertyField's dataType/dataDescriptor and the last property found will be the PropertyField's dataTypeProperty

  Now, when a value is being set on the PropertyField's control, getting the PropertyField's dataInstance will be possible by evaluating the original expression minus the last part. 


### When can we dynamically Discovering dataType and dataTypeProperty

  The moment to do this is going to be when bindings are put in place during the deserialization, or any time a binding is set on the PropertyField's value property. Looking at core/serialization/bindings.js:111 if object.defineBinding exists, then it is invoked, which I believe all do if they inherit from Montage, see core/core.js:1561 defineBinding() and core/core.js:1577 defineBindings()

  So overriding that in PropertyField should allow use to start analyzing the expression of the binding being passed as an argument.



## Validation Flow

1. A user input/change value via a Mod Control.
2. Data bindings propagate the value to dataInstance's property setter, and the DataTrigger
3. the DataTrigger invoke the main service's handleChange(aChangeEvent) carrying the change that happened
4. The mainService is either in autosave and the validation kicks in from saveChanges(), or it directly invoke validation targeted on the propery that just changed
    THIS MEANS WE ACCEPT INVALID DATA ON DATA OBJECTS PROPERTIES TO STAY THERE UNTIL FIXED BY USER
5. Validation errors are set on the data instance's invalidityState
6. The property fields involved in editing the data instance, using data binding or property observing (which means they needs to be able to register as such the invalidity state knowing what they edit) are informed of validation errors to handle and need to handle the states / user-intended errors relevant to them. It could be that other properties are involved as well at the same time. So the ValidationError might need a property carrying set of those properties.
  
  6.1 If a PropertyField acting as a group of sub-property fields or a PropertyFieldGroup, depending on what we decide, should take on errors that involve multiple of its inner property fields at the same time
  

## Visual styling of constraint validation
see [Visual styling of constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation#visual_styling_of_constraint_validation)
The look of HTML elements can be controlled via CSS pseudo-classes.
:REQUIRED AND :OPTIONAL CSS PSEUDO-CLASSES
The :required and :optional pseudo-classes allow writing selectors that match form elements that have the required attribute, or that don't have it.

:PLACEHOLDER-SHOWN CSS PSEUDO-CLASS
See :placeholder-shown.

:VALID :INVALID CSS PSEUDO-CLASSES
The :valid and :invalid pseudo-classes are used to represent <input> elements whose content validates and fails to validate respectively according to the input's type setting. These classes allow the user to style valid or invalid form elements to make it easier to identify elements that are either formatted correctly or incorrectly.

We may or may not need more than that, TBD


## References
- [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
    - See below for one example of a specific invalid state, there are more standard ones liated on the left of that page
    - [ValidityState: tooLong](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState/tooLong)
    - For Range issue, there are rangeOverflow and rangeUnderlow:
        - [rangeOverflow](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState/rangeOverflow)
        - [rangeUnderflow](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState/rangeUnderflow)
- [Constraint Validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation)
- [Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)
- 
