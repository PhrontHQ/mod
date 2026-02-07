/**
 * @module monatage/core/converter/i-s-o-date-string-to-date-converter
 * @requires mod/core/converter/i-s-o-8601-date-string-to-date-component-values-callback-converter
 */
const Converter = require("./converter").Converter;
var singleton;

//ISO 8601

//for Date.parseRFC3339
require("../extras/date");

/**
 * @class ISO8601DateStringToDateConverter
 * @classdesc Converts an ISO8601 UTC string to a date and reverts it.
 */
var ISO8601FormattedStringToDateConverter = exports.ISO8601FormattedStringToDateConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === ISO8601FormattedStringToDateConverter) {
                if (!singleton) {
                    singleton = this;

                    this.callback = function dateConverter(year, month, day, hours, minutes, seconds, milliseconds) {
                        return new Date(Date.UTC(year, --month, day, hours, minutes, seconds, milliseconds));
                    };
                }

                return singleton;
            }

            return this;
        }
    },

        /**
     * Converts an ISO 8601 string (like the ones coming from PostgreSQL for examnple) to Date component values
     * passed to the converter's callback function
     *
     * Parse string like '2019-09-12 09:52:52.992823+00'
     * Assumes string is always +00
     *
     * @function
     * @param {string} v The string to convert.
     * @returns {Range} The Date converted from the string.
     *
     */
    convert: {
        value: function (s) {
            if (typeof s === "string") {

                //This is initially implemented from a Date Range stand point, where infinity means there's no end to the range, it's open
                if (s.caseInsensitiveEquals("infinity")) {
                    return null;
                } else {
                    return new Date(s);
                }
            } else {
                return null;
            }
        }
    },

    /**
     * Reverts the specified Date to an RFC3339 String.
     * @function
     * @param {Range} v The specified string.
     * @returns {string}
     */
    revert: {
        value: function (v) {
            //Wish we could just called toString() on v,
            //but it's missing the abillity to cutomize the
            //stringify of begin/end
            /*
                if v.begin/end are CalendarDate, we need to transform them to JSDate to make them in UTC, be able to use toISOString
            */
            return (
                    v
                        ? ((typeof v.toJSDate === "function")
                            ? v.toJSDate().toISOString()
                            : v.toISOString())
                        : v
            );
        }
    }

},{
    singleton: {
        get: function () {
            if (!singleton) {
                singleton = new ISO8601FormattedStringToDateConverter();
            }

            return singleton;
        }
    }
});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        return ISO8601FormattedStringToDateConverter.singleton;
    }
});
