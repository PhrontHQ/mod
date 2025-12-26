/**
 * @module mod/core/converter/ModuleIdToObjectConverter
 * @requires mod/core/converter/converter
 */
var Converter = require("../../core/converter/converter").Converter,
    TimeZone = require("../../core/date/time-zone").TimeZone,
    Criteria = require("../../core/criteria").Criteria,
    singleton;

/**
 * @class TimeZoneIdentifierToTimeZoneConverter
 * @classdesc Converts a moduleId to the object it represents
 */
var TimeZoneIdentifierToTimeZoneConverter = exports.TimeZoneIdentifierToTimeZoneConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === TimeZoneIdentifierToTimeZoneConverter) {
                if (!singleton) {
                    singleton = this;
                }

                return singleton;
            }

            return this;
        }
    },

    /*
        this doesn't feel right

        this converter doesn't inherit convertSyntax nor convertExpression properties
        so this can't really work when called via a RawDataService's mapReadOperationToRawReadOperation method
    */

    // convertCriteriaForValue: {
    //     value: function(value) {
    //         var criteria = new Criteria().initWithSyntax(this.convertSyntax, value);
    //         criteria._expression = this.convertExpression;
    //         return criteria;
    //     }
    // },

    /**
     * Converts the TimeZone identifier string to a TimeZone.
     * @function
     * @param {string} v The string to convert.
     * @returns {Date} The TimeZone converted from the string.
     */
    convert: {value: function (v) {
        return  TimeZone.withIdentifier(v);
    }},

    /**
     * Reverts the specified Date to an RFC3339 String.
     * @function
     * @param {TimeZone} v The specified timZone.
     * @returns {string}
     */
    revert: {value: function (v) {
        return v.identifier;
    }}

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new TimeZoneIdentifierToTimeZoneConverter();
        }
        return singleton;
    }
});
