# Modifying Data Objects

there are a few things to know that are specific to Mod data layer.

As part of describing data objects, property descriptors allow to set the cardinality of a relationship to another data object, and also the name of the reciprocal, known as inverse property in Mod.

Using that information, the main DataService which observes changes on data objects, uses it to make sure relationships are updated on both sides. So for example, if a vehicle wheels property, which is an array, is being added a wheel object, then the main DataService will make sure that the wheel's hostVehicle property is set to that vehicle whose wheels array property was just modified.

When properties are "to many", meaning their cardinality is superior to 1, mod data assign them an empty array, which is then mutated. Assigning a new array will end up moving objects from that array to the one already on the object.
