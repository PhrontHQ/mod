/**
 * @module mod/core/converter/string-to-substring-converter
 * @requires mod/core/converter/converter
 */
const Converter = require("./converter").Converter;

var singleton;

/**
 * Converts a string to the substring with the range set on the converter's substringRange property.
 *
 * @class StringToSubstringConverter
 * @extends Converter
 */
var StringToSubstringConverter = exports.StringToSubstringConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === StringToSubstringConverter) {
                if (!singleton) {
                    singleton = this;
                }

                return singleton;
            }

            return this;
        }
    },

    substringRange: {
      value: undefined
    },

    convert: {
        value: function StringToSubstringConverter_convert(str) {

          return !str
            ? ""
            : typeof str !== "string"
              ? ""
              : (!this.substringRange)
                ? str
                : str.substringWithinRange(this.substringRange)
        }
    }

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new StringToSubstringConverter();
        }

        return singleton;
    }
});
