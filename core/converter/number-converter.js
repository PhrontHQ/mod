// Number and String formatting functions from Google Closure Library
// http://code.google.com/closure/library/
// /library/format/format.js

// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2011 Andrew Plummer
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the “Software”), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sub-license, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice, and every other copyright notice found in this
// software, and all the attributions in every file, and this permission notice
// shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED
//
/**
 * @module mod/core/converter/number-converter
 * @requires mod/core/converter/converter
 */
var Converter = require("./converter").Converter;
var Validator = require("./converter").Validator;
var isNumber = require("./converter").isNumber;
var isDef = require("./converter").isDef;
require('../shim/string');

/**
 * Regular expression for detecting scaling units, such as K, M, G, etc. for
 * converting a string representation to a numeric value.  Also allow 'k' to be
 * aliased to 'K'.  These could be used for SI (powers of 1000) or Binary
 * (powers of 1024) conversions.  Also allow final 'B' to be interpreted as
 * byte-count, implicitly triggering binary conversion (e.g., '10.2MB').
 * @type {RegExp}
 * @memberof module:mod/core/converter#
 * @private
 */
var SCALED_NUMERIC_RE_ = /^([\-]?\d+\.?\d*)([K,M,G,T,P,k,m,u,n]?)[B]?$/;

/**
 * Ordered list of scaling prefixes in decreasing order.
 * @memberof module:mod/converter#
 * @type {Array}
 * @private
 */
    // kishore - changed prefix 'G' to 'B' to represent Billion
var NUMERIC_SCALE_PREFIXES_ = [
    'P', 'T', 'B', 'M', 'K', '', 'm', 'u', 'n'
];


/**
 * Scaling factors for conversion of numeric value to string.  SI conversion.
 * @memberof module:mod/converter#
 * @type {Object}
 * @private
 */
var NUMERIC_SCALES_SI_ = exports.NUMERIC_SCALES_SI_ = {
    '': 1,
    'n': 1e-9,
    'u': 1e-6,
    'm': 1e-3,
    'k': 1e3,
    'K': 1e3,
    'M': 1e6,
    'B': 1e9,
    'T': 1e12,
    'P': 1e15
};

/**
 * Scaling factors for conversion of numeric value to string. Binary conversion.
 * @memberof module:mod/converter#
 * @type {Object}
 * @private
 */
var NUMERIC_SCALES_BINARY_ = exports.NUMERIC_SCALES_BINARY_ = {
    '': 1,
    'n': Math.pow(1024, -3),
    'u': Math.pow(1024, -2),
    'm': 1.0 / 1024,
    'k': 1024,
    'K': 1024,
    'M': Math.pow(1024, 2),
    'G': Math.pow(1024, 3),
    'T': Math.pow(1024, 4),
    'P': Math.pow(1024, 5)
};

/**
 * Converts a numeric value to string, using specified conversion scales.
 * @memberof module:mod/converter#
 * @param {number} val Value to be converted.
 * @param {Object} conversion Dictionary of scaling factors.
 * @param {number} optDecimals The number of decimals to use.  Default is 2.
 * @param {string} optSuffix Optional suffix to append.
 * @returns {string} The human readable form of the byte size.
 * @private
 */
var _numericValueToString = exports._numericValueToString = function (val, conversion, optDecimals, optSuffix, prefixes) {
    prefixes = prefixes || NUMERIC_SCALE_PREFIXES_;
    var origVal = val;
    var symbol = '';
    var scale = 1;
    if (val < 0) {
        val = -val;
    }
    for (var i = 0; i < prefixes.length; i++) {
        var unit = prefixes[i];
        scale = conversion[unit];
        if (val >= scale || (scale <= 1 && val > 0.1 * scale)) {
            // Treat values less than 1 differently, allowing 0.5 to be "0.5" rather
            // than "500m"
            symbol = unit;
            break;
        }
    }
    if (!symbol) {
        scale = 1;
    }
    if (optSuffix) {
        symbol += optSuffix;
    }
    var ex = Math.pow(10, isDef(optDecimals) ? optDecimals : 2);
    return Math.round(origVal / scale * ex) / ex + symbol;
};

/**
 * Converts a string to numeric value, taking into account the units.
 * @memberof module:mod/converter#
 * @param {string} stringValue String to be converted to numeric value.
 * @param {Object} conversion Dictionary of conversion scales.
 * @returns {number} Numeric value for string.  If it cannot be converted, returns NaN.
 * @private
 */
var _stringToNumericValue = function (stringValue, conversion) {
    var match = stringValue.match(SCALED_NUMERIC_RE_);
    if (!match) {
        return NaN;
    }
    return match[1] * conversion[match[2]];
};


/**
 * Checks whether string value containing scaling units (K, M, G, T, P, m, u,
 * n) can be converted to a number.
 * Where there is a decimal, there must be a digit to the left of the decimal
 * point.
 * Negative numbers are valid.
 * @example 0, 1, 1.0, 10.4K, 2.3M, -0.3P, 1.2m
 * @memberof module:mod/core/converter#
 * @function
 * @param {string} val String value to check.
 * @returns {boolean} true If the string could be converted to a numeric value.
 */
var isConvertableScaledNumber = function (val) {
    return SCALED_NUMERIC_RE_.test(val);
};


/**
 * Converts a string to numeric value, taking into account the units.
 * If string ends in 'B', use binary conversion.
 * @memberof module:mod/core/converter#
 * @function
 * @param {string} stringValue String to be converted to numeric value.
 * @returns {number} Numeric value for string.
 */
var stringToNumericValue = exports.stringToNumericValue = function (stringValue) {
    if (stringValue.endsWith('B')) {
        return _stringToNumericValue(
            stringValue, NUMERIC_SCALES_BINARY_);
    }
    return _stringToNumericValue(
        stringValue, NUMERIC_SCALES_SI_);
};



/**
 * Converts a numeric value to string representation. SI conversion.
 * @memberof module:mod/core/converter#
 * @function
 * @param {number} val Value to be converted.
 * @param {number} optDecimals The number of decimals to use. Defaults to 2.
 * @returns {string} String representation of number.
 */
var numericValueToString = exports.numericValueToString = function (val, optDecimals) {
    return _numericValueToString(val, NUMERIC_SCALES_SI_, optDecimals);
};



/**
 * @class NumberValidator
 * @classdesc Validates that a string can be represented as a numeric value, and returns the numeric value.
 * @extends Validator
 */
var NumberValidator = exports.NumberValidator = Validator.specialize( /** @lends NumberValidator# */ {

    /**
     * Indicates whether floating point values are allowed.
     * If `true` (the default) then the validator attempts to parse the string
     * as a float value.
     * If `false`, it attempts to parse the value as an integer.
     * @type {Property}
     * @default {boolean} true
     */
    allowFloat: {
        value: true
    },

    /**
     * @type {Property}
     * @default {boolean} true
     */
    allowNegative: {
        value: true
    },

    /**
     * Determines if the parameter `v` is a number or not.
     * @function
     * @param {string} v The value to validate as a number.
     * @returns {number} num An integer or float, if the value provided to the
     * function can parsed as a number;
     * otherwise returns an error.
     */
    validate: {
        value: function (v) {
            var num;
            v = v || '';
            v = v.replace(/,/g, '');

            if (isNumber(v)) {
                num = v;
            } else {
                num = (this.allowFloat === true ? parseFloat(v, 10) : parseInt(v, 10));
            }
            if (isNaN(num)) {
                // error
                return {message: 'Invalid Number'};
            } else {
                return num;
            }
        }
    }

});


/**
 * @class NumberConverter
 * @classdesc Formats a number for easier readability.
 */
var NumberConverter = exports.NumberConverter = Converter.specialize( /** @lends NumberConverter# */ {

    /**
     * Allow partial conversion
     * @type {Property}
     * @default {boolean} false
     */
    allowPartialConversion: {
        value: false
    },

    /**
     * @type {Function}
     * @default {attribute} NumberValidator Uses this object.
     */
    validator: {
        value: new NumberValidator()
    },

    /**
     * @type {Property}
     * @default {string} null
     */
        // valid fn values are:
    shorten: {
        value: null
    },

    /**
     * @type {Property}
     * @default {number} 2
     */
    decimals: {
        value: 2
    },

    /**
     * @type {Property}
     * @default {boolean} false
     */
    forceDecimals: {
        value: false
    },

    /**
     * @type {Property}
     * @default {number} null
     */
    round: {
        value: null
    },

    _reg: {
        value: /(\d+)(\d{3})/
    },

    /**
     * @type {Property}
     * @default {boolean} true
     */
    allowFloat: {
        value: true
    },

    /**
     * @type {Property}
     * @default {boolean} true
     */
    allowNegative: {
        value: true
    },

    // credit: sugar.js - https://github.com/andrewplummer/Sugar
    _makeReadable: {
        value: function (num, comma, period) {
            comma = comma || ',';
            period = period || '.';
            var split = num.toString().split('.');

            var numeric = split[0];
            while (this._reg.test(numeric)) {
                numeric = numeric.replace(this._reg, '$1' + comma + '$2');
            }

            var afterDecimal = split.length > 1 ? split[1] : '';
            if (this.forceDecimals) {
                while (afterDecimal.length < this.decimals) {
                    afterDecimal += '0';
                }
            }

            var decimal = afterDecimal.length > 0 ? period + afterDecimal : '';
            return numeric + decimal;
        }
    },

    /**
     * @function
     * @param {number} value The value to convert.
     * @returns {string}
     */
    convert: {
        value: function (v) {
            if (this.shorten) {
                // shorten the number to 10K, 100K, 1M etc
                return numericValueToString(v, this.decimals);
            } else {
                var num;
                if (this.round) {
                    num = Number(Math.round(v)).toString();
                } else {
                    var ex = Math.pow(10, this.decimals || 2);
                    var scale = 1;
                    num = Number(Math.round(v / scale * ex) / ex);
                }
                return this._makeReadable(num); //.toString();

            }
        }
    },

    /**
     * @function
     * @param {string} stringValue The string representation of a number.
     * @returns {number} The numeric value validated with to {@link
     * NumberConverter#validator}.
     * @throws {Error} if the return value of {@link
     * NumberConverter#validator#validate} is not a number
     * @see NumberConverter#validator
     * @see NumberConverter#allowFloat
     * @see NumberConverter#allowNegative
     */
    revert: {
        value: function (stringValue) {
            // use a Validator to validate first
            this.validator.allowFloat = this.allowFloat;
            this.validator.allowNegative = this.allowNegative;

            var result = this.validator.validate(stringValue);

            if (isNumber(result)) {
                return result;
            } else {
                // error object {code, message}
                //return null;
                throw new Error(result.message);
            }
            //return parseFloat(stringValue, 10) || null;
        }
    }

});

