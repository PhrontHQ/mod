var deprecate = require("../../core/deprecate");
exports.RawPropertyValueToObjectConverter = require("./raw-foreign-value-to-object-converter").RawForeignValueToObjectConverter;
deprecate.deprecationWarningOnce("RawPropertyValueToObjectConverter is deprecated, now use require(\"mod/data/converter/raw-foreign-value-to-object-converter\").RawForeignValueToObjectConverter instead");
