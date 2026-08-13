# Support Cardinality Over 1

Property Field needs to include a repetition to have the ability to edit a collection of values.

This allows us to have only one PropertyField class to know and use, where we abstract the differences between one and many. 

Adding this means that PropertyField can, and has to, enforce cardinality of the proeprty, it has to offer "add" — it knows the type that needs to be created as it's specified in the property descripor, and delete
