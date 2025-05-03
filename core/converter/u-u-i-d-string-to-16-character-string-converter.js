/**
 * @module mod/core/converter/u-u-i-d-string-to-16-character-string-converter
 * @requires mod/core/converter/converter
 */
var Converter = require("./converter").Converter,
    deprecate = require("../deprecate"),
    shouldMuteWarning = false,
    singleton;

/**
 * @class UUIDStringTo16CharacterStringConverter
 * @classdesc Converts a string to upper-case.
 */
var UUIDStringTo16CharacterStringConverter = exports.UUIDStringTo16CharacterStringConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === UUIDStringTo16CharacterStringConverter) {
                if (!singleton) {
                    singleton = this;
                }

                if (!shouldMuteWarning) {
                    deprecate.deprecationWarning(
                        "Instantiating UUIDStringTo16CharacterStringConverter is deprecated," +
                        " use its singleton instead"
                    );
                }

                return singleton;
            }

            return this;
        }
    },

    /**
     * Converts the specified string to all upper case letters.
     * @function
     * @param {string} v The string to convert.
     * @returns {string} The converted string.
     */
    convert: {
        value: function (uuid) {
            const hex = uuid.replace(/-/g, '');
            const bytes = new Uint8Array(hex.match(/../g).map(h => parseInt(h, 16)));
            SfCC = String.fromCharCode;

            return `${SfCC(bytes[0])}${SfCC(bytes[1])}${SfCC(bytes[2])}${SfCC(bytes[3])}${SfCC(bytes[4])}${SfCC(bytes[5])}${SfCC(bytes[6])}${SfCC(bytes[7])}${SfCC(bytes[8])}${SfCC(bytes[9])}${SfCC(bytes[10])}${SfCC(bytes[11])}${SfCC(bytes[12])}${SfCC(bytes[13])}${SfCC(bytes[14])}${SfCC(bytes[15])}`;
        }
    },

    _utf16StringHexCodeAt: {
        value: function(utf16, i) {
            return utf16.charCodeAt(i).toString(16).padStart(2, '0');
        }
    },
    /**
     * Reverts the specified string.
     * @function
     * @param {string} v The specified string.
     * @returns {string}
     */
    revert: {
        value: function (utf16) {
            if (utf16.length !== 16) {
                throw new Error("Input string must be 16 characters long.");
            }

            const hex = this._utf16StringHexCodeAt;

            return `${hex(utf16, 0)}${hex(utf16, 1)}${hex(utf16, 2)}${hex(utf16, 3)}-${hex(utf16, 4)}${hex(utf16, 5)}-${hex(utf16, 6)}${hex(utf16, 7)}-${hex(utf16, 8)}${hex(utf16, 9)}-${hex(utf16, 10)}${hex(utf16, 11)}${hex(utf16, 12)}${hex(utf16, 13)}${hex(utf16, 14)}${hex(utf16, 15)}`
        }
    }

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            shouldMuteWarning = true;
            singleton = new UUIDStringTo16CharacterStringConverter();
            shouldMuteWarning = false;
        }

        return singleton;
    }
});
