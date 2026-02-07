# Notes

## Backward Compatibility in Schema Evolution: Guide

[https://www.dataexpert.io/blog/backward-compatibility-schema-evolution-guide](https://www.dataexpert.io/blog/backward-compatibility-schema-evolution-guide)

* Backward compatibility ensures that new schema versions can handle data created with older versions without breaking systems.
  * Evolution of a property from toOne, to a toMany:
    The new code would expect an array, but we would be able to convert the previously existing single id value into an array if the property descriptor now has a cardinality > 1. The mapping could also use n expression like "someId || someIds", ensuring the mapping works with older data. We could also have converters that do one or the other, which should become a single query, for the older case, the new one, or a combination
* Implementing Backward Compatibility in PracticeBuilding on the safe practices discussed earlier, implementing backward compatibility ensures schema evolution doesn't disrupt your system.
  * Using Schema RegistriesSchema registries play a crucial role in maintaining compatibility within your data infrastructure. When a new schema is registered, the registry compares it against previous versions. If the update violates the configured compatibility rule - like BACKWARD compatibility - the system blocks the update with a** ****409 Conflict error** . This prevents breaking changes from affecting production.
