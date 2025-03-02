/**
 * @module mod/core/converter/number-to-enum-member-converter
 * @requires mod/core/converter/converter
 */
var RawValueToObjectConverter = require("./raw-value-to-object-converter").RawValueToObjectConverter,
    Montage = require("core/core").Montage,
    Enum = require("core/enum").Enum;

/**
 * Converts a number to an integer
 * @class NumberToNearestIntegerConverter
 * @extends Converter
 */

const NumberToEnumMemberConverter = exports.NumberToEnumMemberConverter = class NumberToEnumMemberConverter extends RawValueToObjectConverter {

    static {

        Montage.defineProperties(this.prototype, {
            _enum: {value: undefined}
        });

        Montage.defineProperties(this, {
            _singleton: {value: undefined}
        });
        
    }

    static get singleton() {
        return this._singleton || (this._singleton = new this());
    }

    constructor (...args) {
        super(...args);

        if (this.constructor === NumberToEnumMemberConverter) {
            if (!this.constructor._singleton) {
                this.constructor._singleton = this;
            }

            return this.constructor.singleton;
        }

        return this;

    }

    get enum() {
        return this._enum !== undefined 
            ? this._enum 
            : this._enum = (this.currentRule?.propertyDescriptor?._valueDescriptorReference instanceof Enum) && this.currentRule.propertyDescriptor._valueDescriptorReference
    }

    convert(number) {
        if(this.enum) {
            let _number = Number(number);
            if(!Number.isNaN(_number)) {
                return this.enum.memberWithIntValue(_number);
            } else {
                throw "NumberToEnumMemberConverter convert(): "+number+" is not a number";
            }
        } else {
            throw "NumberToEnumMemberConverter convert(): No enum, can't convert " + number;
        }

    }

    revert(enumMemberString) {
        if(this.enum) {
            if(typeof enumMemberString === "string") {
                return this.enum.intValueForMember(enumMemberString);
            } else {
                throw "NumberToEnumMemberConverter convert(): "+number+" is not a number";
            }
        } else {
            throw "NumberToEnumMemberConverter revert(): No enum, can't revert " + enumMemberString;
        }

    }

}

Object.defineProperty(exports, 'singleton', {
    get: Object.getOwnPropertyDescriptor(NumberToEnumMemberConverter, 'singleton').get
});
