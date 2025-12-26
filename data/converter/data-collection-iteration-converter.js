/**
 * @module mod/core/converter/collection-iteration-converter
 * @requires mod/core/converter/converter
 */
var CollectionIterationConverter = require("core/converter/collection-iteration-converter").CollectionIterationConverter,
    Montage = require("core/core").Montage;

/**
 * @class DataCollectionIterationConverter
 * @classdesc Converts key/value arrays or an array of pairs to a Map.
 * @extends Converter
 */
exports.DataCollectionIterationConverter = class DataCollectionIterationConverter extends CollectionIterationConverter {/** @lends DataCollectionIterationConverter */
   
    static {

        Montage.defineProperties(this.prototype, {
            _currentRule: {value: undefined},
            _foreignDescriptor: {value: undefined}
        });

    }

    constructor() {
        super();
    }

    get currentRule() {
        return this._currentRule;
    }

    set currentRule(value) {
        if(value !== this._currentRule) {
            this._currentRule = value;

            //Pass down
            this._iterationConverter.currentRule = value;
            this._iterationReverter.currentRule = value;
        }
    }

    set foreignDescriptor(value) {
        if(value !== this._foreignDescriptor) {
            this._foreignDescriptor = value;
            //Pass down
            this._iterationConverter.foreignDescriptor = value;
        }
    }

    convert(value) {
        if(this.currentRule?.propertyDescriptor.cardinality === 1) {
            if(Array.isArray(value)) {
                if(value.length === 1) {
                    return super.convert(value.one());
                } else {
                    throw `convert value with length > 1 for property ${this.currentRule.propertyDescriptor.name} with a cardinality of 1`
                }

            } else {
                throw `Collection other than array are not handled for a property ${this.currentRule.propertyDescriptor.name} with a cardinality of 1: ${value}`;
            }

        } else {
            return super.convert(value);
        }
    } 
}


