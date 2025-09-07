# Control Fields

Draft for a spec to implememnt a Field components that adds to any control a consistent way to show:

- a label describing what is edited. This is related to the property of a data instance being edited, which we should be able to automatically fill if we have on the matching property descriptor a "user display name" 
- toggle between a view look, to an edit look on user input?
- validation errors' messages as they happen
- help
- placeholders values? 
- whether the value has been edited?
- if the data being loaded?
- the fact that someone else is editing the same value at the same time and facilitate a chat between the two to avoid stepping on each other (later...)
- the list of previous valid values entered there by the user in the current session, like a dedicated UndoManager for that control/property, where the user can navigate and re-select a past value
- the last person who edited that field, if allowed to know
- the fact that the user may not ba able to make a change and why. Maybe offer to make the change and send it to someone who can as a "Change / update Request"? (later...) 

- should a control have a pointer to the field it's in so they can collaborate?

## Naming

Not sure "Field" is the best name, a bit dry on its own. It's been traditionally called a "FormField" when Forms were all the rage, but I'm not sure younger generations see it as such in digital form on mobile.
 
It feels that fields, especially with a label, typically the name of a property of the underlying object, are really "PropertyEditingFields" 
so consulting  the LLM braintrust(?) and mine, here are some options:
 
- InputField -> nameInputField as the identifier used in the serialization
- PropertyEditor -> namePropertyEditor as the identifier used in the serialization
- EditingField -> nameEditingField as the identifier used in the serialization

If we manage to have a propertyDescriptor set on a Field, from the control a bunch of things should come for free in term of configuration...