/**
 * @requires mod/core/converter/converter
 */
var Converter = require("./converter").Converter;
    
/**
 * @class DateRangeToStringConverter
 * @classdesc Converts a Date Range to the string format expected by an <input type="date"> .
 */
var DateRangeToStringConverter = exports.DateRangeToStringConverter = Converter.specialize({
 
    /**
     * Constructor for DateRangeToStringConverter.
     * 
     * @function
     * @param {string|string[]} [locales] - A string with a BCP 47 language tag, or an array of such strings
     * @param {Object} [options] - An object with formatting options for Intl.DateTimeFormat
     */
    constructor: {
        value: function DateRangeToStringConverter() {
            this.dateTimeFormat = new Intl.DateTimeFormat(this.locales, this.options);
        }
    },

    /**
     * The locales for date formatting.
     * @type {string|string[]}
     */
    locales: {
        value: "en-US",
        writable: true
    },

    /**
     * The options for date formatting.
     * @type {Object}
     */
    options: {
        value: {year: "numeric"},
        writable: true
    },

    /**
     * Converts a date range to a formatted string representation.
     * 
     * @function
     * @param {Range<Date>} range - The date range to be formatted
     * @returns {string} The formatted date range string
     */
    convert: {
        value: function (range) {
            return this.dateTimeFormat.formatRange(range.begin, range.end);
        }
    }
});

