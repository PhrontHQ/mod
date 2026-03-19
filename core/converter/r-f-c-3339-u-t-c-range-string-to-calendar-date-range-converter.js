/**
 * @module data/converter/r-f-c-3339-u-t-c-range-string-to-date-range-converter
 * @requires montage/core/converter/converter
 */
var RFC3339UTCRangeStringToDateRangeConverter = require("./r-f-c-3339-u-t-c-range-string-to-date-range-converter").RFC3339UTCRangeStringToDateRangeConverter,
    CalendarDate = require("core/date/calendar-date").CalendarDate,
    Range = require("core/range").Range,
    TimeZone = require("core/date/time-zone").TimeZone,
    ISO8601DateStringToDateComponentValuesCallbackConverter = require("core/converter/i-s-o-8601-date-string-to-date-component-values-callback-converter").ISO8601DateStringToDateComponentValuesCallbackConverter;

/**
 * @class RFC3339UTCRangeStringToCalendarDateRangeConverter
 * @classdesc Converts an RFC3339 UTC string to a calendarDate and reverts it.
 */
var RFC3339UTCRangeStringToCalendarDateRangeConverter = exports.RFC3339UTCRangeStringToCalendarDateRangeConverter = RFC3339UTCRangeStringToDateRangeConverter.specialize({

    constructor: {
        value: function () {
            var self = this;
            this.addOwnPropertyChangeListener("timeZone", function (value) {
                if (!value) {
                    return;
                }
                self._stringConverter = self._stringConverter || (self._stringConverter = new ISO8601DateStringToDateComponentValuesCallbackConverter());

                self._stringConverter.callback = function dateConverter(year, month, day, hours, minutes, seconds, milliseconds) {
                    if (!self.timeZone) {
                        throw "RFC3339UTCRangeStringToCalendarDateRangeConverter.timeZone is not set";
                    }
                    return new CalendarDate.withUTCComponentValuesInTimeZone(year, month, day, hours, minutes, seconds, milliseconds, self.timeZone);
                }; 

                self._rangeParser = self._stringConverter.convert.bind(self._stringConverter);
            });
        }
    },

    /**
     * @type {strange/parseEndpoint}
     */
    _rangeParser: {
        value: undefined
    },

    /**
     * @type {ISO8601DateStringToDateComponentValuesCallbackConverter}
     */
    _stringConverter: {
        value: undefined
    },


    /**
     * The TimeZone to which to convert the CalendarDate. 
     * 
     * This is a required property
     * @type {TimeZone}
     */
    timeZone: {
        value: undefined
    },


    /**
     * Converts the RFC3339 string to a Date.
     * @function
     * @param {string} v The string to convert.
     * @returns {Range} The Date converted from the string.
     */
    convert: {
        value: function (v) {
            if(typeof v === "string") {
                return Range.parse(v, this._rangeParser);
            } else {
                return v;
            }
        }
    }
});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        throw "RFC3339UTCRangeStringToCalendarDateRangeConverter does not have a singleton because it requires a timeZone and is not stateless";
        return null;
    }
});
