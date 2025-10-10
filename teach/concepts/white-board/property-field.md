# Property Field

It feels like the Field is where we go from a pure control that acts on a value, to editing the property of an object, and being able to leverage alls the meta information available at the data model level to strengthen the editing experience.

Draft for a spec to implememnt a Field components that adds to any control a consistent way to show:

-   a label describing what is edited. This is related to the property of a data instance being edited, which we should be able to automatically fill if we know the related property descriptor and that **property descriptor has a "user display name"** value set. If one wants to locally overrides that label coming from the data model, one can always set a different label value on the field
-   toggle between a view look, to an edit look on user input? is itr pure styling? or is it switching components? Like between a Text component and an texfield for input? Using a substitution
-   validation errors' messages as they happen
-   help
-   That the field is actively being edited
-   whether the value has been edited?
-   That changes are not saved
-   if the data being loaded?
-   the fact that someone else is editing the same value at the same time and facilitate a chat between the two to avoid stepping on each other (later...)
-   the list of previous valid values entered there by the user in the current session, like a dedicated UndoManager for that control/property, where the user can navigate and re-select a past value
-   the last person who edited that field, if allowed to know
-   the fact that the user may not ba able to make a change and why. Maybe offer to make the change and send it to someone who can as a "Change / update Request"? (later...)
-   Being able to dynamically chose the right converter between property and control based on known types on each side
-   should a control have a pointer to the field it's in so they can collaborate?

## Naming

Not sure "Field" is the best name, a bit dry on its own. It's been traditionally called a "FormField" when Forms were all the rage, but I'm not sure younger generations see it as such in digital form on mobile.

It feels that fields, especially with a label, typically the name of a property of the underlying object, are really "PropertyEditingFields"
so consulting the LLM braintrust(?) and mine, here are some options:

-   InputField -> nameInputField as the identifier used in the serialization
-   PropertyEditor -> namePropertyEditor as the identifier used in the serialization
-   EditingField -> nameEditingField as the identifier used in the serialization
-   PropertyField -> Not as "editing" oriented.

If we manage to have a propertyDescriptor set on a Field, from the control a bunch of things should come for free in term of configuration...

## Control Changes?

-   placeholders values? Yes, where do they come from? Is that level or at the control level? Do we need a value in **Property Descriptor**?
-   Preventing validation errors: If we have validation rules, how do use simething like a range constraint - min/max, to have both a validationRule that can assess a value agains that valid range, vs configuing a picker / control so it doesn't allow an input outside of that range in the first place.
    -   Some values are discrete vs continuous. Does that indicate us how to behave about those?
    -   Some values needs autocomplete - because there's a known list, static or in the backend
    -   Some values are completely open ended. A number

## TODO:

-   JIRA: Rename business.mod's Field to PropertyField in mod/ui
-   JIRA: Identify the control-specific fields we need first
-   JIRA: Wrap them in subclasses: like RangeProperyField (with 2 fields, one for each bound) and a SliderRangePropertyField that has 2 knobs to edit the range. A DateRangePropertyField etc...
-   Setup data pipeline.

### Important Note: UI Interaction and "Touched" State

Validation logic must know about Property Field interaction state, specifically when a Property Field is **"touched"** (focused then blurred by user) for proper UX.

Indeed, for required fields, errors shouldn't appear on initial load before user interaction. Validation should only trigger _after_ the user has "touched" the Property Field and left it in an invalid state.
