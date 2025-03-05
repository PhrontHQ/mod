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
            _currentRule: {value: undefined}
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
}


