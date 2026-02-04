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
     * Converts a date range to a formatted string representation.
     * 
     * @function
     * @param {Date} startDate - The start date of the range
     * @param {Date} endDate - The end date of the range
     * @param {string|string[]} [locales] - A string with a BCP 47 language tag, or an array of such strings
     * @param {Object} [options] - An object with formatting options for Intl.DateTimeFormat
     * @returns {string} The formatted date range string
     */
    convert: {
        value: function (startDate, endDate, locales, options) {
            const dateTimeFormat = new Intl.DateTimeFormat(locales, options);
            return dateTimeFormat.formatRange(startDate, endDate);
        }
    }
});

