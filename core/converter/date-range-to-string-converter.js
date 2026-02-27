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
    _locales: {
        value: "en-US",
        writable: true
    },
    locales: {
        get: function( ) {
            return this._locales;
        },
        set: function(value) {
            if(value !== this._locales) {
                this._locales = value;
                this.dateTimeFormat = new Intl.DateTimeFormat(this.locales, this.options);
            }
        },
    },


    /**
     * The options for date formatting.
     * @type {Object}
     */
    _options: {
        value: {year: "numeric"},
        writable: true
    },
    options: {
        get: function( ) {
            return this._options;
        },
        set: function(value) {
            if(value !== this._options) {
                this._options = value;
                this.dateTimeFormat = new Intl.DateTimeFormat(this.locales, this.options);
            }
        },
    },

    rangeFormatSeparatorPart: {
        get: function() {
            if(!this.dateTimeFormat._rangeFormatSeparatorPart) {
                this.dateTimeFormat._rangeFormatSeparatorPart = this.dateTimeFormat.formatRangeToParts(null, new Date())[1].value;
            }
            return this.dateTimeFormat._rangeFormatSeparatorPart;
        }
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

            if(!range.begin || !range.end) {
                let begin = range.begin || null,
                    end = range.end || null,
                    rangeFormattedParts = this.dateTimeFormat.formatRangeToParts(begin, end);
                
                return !begin && !end
                    ? this.rangeFormatSeparatorPart
                    : begin && !end
                        ? `${rangeFormattedParts[0].value}${rangeFormattedParts[1].value}`
                        : `${rangeFormattedParts[1].value}${rangeFormattedParts[2].value}`;
            } else {
                return this.dateTimeFormat.formatRange(range.begin, range.end);
            }
        }
    }
});

