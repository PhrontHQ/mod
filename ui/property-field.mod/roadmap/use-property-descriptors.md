# Use PropertyDescripors

This is the foundational edge of ProperyField: By knowing the dataInstance and it's property being edited, then it can access the matching property descriptor and the semantic it needs to offer validation, support, help, etc...

Right now, instances of ProperyField have used the value property, passed down to the the control put inside the property field. And not the dataInstance / dataType / propertyExpression intended. Those would provide access to the right property descriptor before we have any data available, where the use of "value" means waiting to have content to be able to do the right thing, assuming we can reverse engineer.

with value, we end up with bindins used like this:

    "value": {"<->": "@owner.organization.name"},
    
    "value": {"<->": "@owner.organization.urlAddresses.0"},

The dataInstance here woudl be the expression up to the last one for the first, so:
     "@owner.organization"

Where the second one would be one step before, because of the .0 here. Which is using a toMany - urlAddresses, as if it were a to-one. This would (and SHOULD) never be used with let's say .2. It would make no sense. So if the end of an expression is a number, index, then we'd ignore it.

This heuristic has to be tested but it feels solid, it might work.
