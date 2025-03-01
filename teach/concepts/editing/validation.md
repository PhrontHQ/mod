Validation Introduction

* There are different levels of validations:

  * Intention validation
    * Even if a user is allowed to do something, some changes may have dire consequences. It should be easy to configure a property to require prompting the user (n times?) before the value is actually applied to the data object's property.
  * Data-model validation
    * Starting with basic validation of the type a property expects, enforcing cardinality, etc... it also means evaluating rules considered as "business logic"
  * Some validation should be enforced by UI Controls even before a value is set on a data object. For examnple, if a to-many property has a cardinality of 3 maximun, the UI Component editing this property should make it impossible to add more than 3 objects in the first place. Cardinality enforcement will still be avaluated before saving in case upper layers did not provide that level of service, which would be a big user experience fail...
  * When it's not possible by UI Controls to prevent the input of invalid data, then UI controls need to have the support from the system to assess possible validity issues and be able to convey them to the user so they're understood and can be fixed. Which means having the ability for every validation logic to come with user-facing wording.
