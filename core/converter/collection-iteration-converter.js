/**
 * @module mod/core/converter/collection-iteration-converter
 * @requires mod/core/converter/converter
 */
var Converter = require("./converter").Converter,
    Promise = require("../promise").Promise;


/**
 * @class CollectionIterationConverter
 * @classdesc Converts key/value arrays or an array of pairs to a Map.
 * @extends Converter
 */
exports.CollectionIterationConverter = Converter.specialize( /** @lends CollectionIterationConverter# */ {
    /*********************************************************************
     * Serialization
     */

    serializeSelf: {
        value: function (serializer) {

            serializer.setProperty("mapConverter", this.keysConverter);
            serializer.setProperty("mapReverter", this.keysConverter);

        }
    },
    deserializeSelf: {
        value: function (deserializer) {

            value = deserializer.getProperty("mapConverter");
            if (value) {
                this.mapConverter = value;
            }

            value = deserializer.getProperty("mapReverter");
            if (value) {
                this.mapReverter = value;
            }
        }
    },

    /**
     * @property {Converter|function}
     * @default {Converter} undefined
     */
    mapConverter: {
        get: function() {
            return this._iterationConverter;
        },
        set: function(value) {
            this._iterationConverter = value;
            this._convert = this._convertElementIndexCollection;
            this._revert = this._revertElementIndexCollection;
        }
    },

    /**
     * @property {Converter|function}
     * @default {Converter} undefined
     */
    mapReverter: {
        get: function() {
            return this._iterationReverter;
        },
        set: function(value) {
            this._iterationReverter = value;
            this._convert = this._convertElementIndexCollection;
            this._revert = this._revertElementIndexCollection;
        }
    },

    /**
     * @property {Converter|function}
     * @default {Converter} undefined
     */
    __iterationConverter: {
        value: undefined
    },
    _iterationConverter: {
        get: function() {
            return this.__iterationConverter;
        },
        set: function(value) {
            this.__iterationConverter = value;
        }
    },

    /**
     * @property {Converter|function}
     * @default {Converter} undefined
     */
    __iterationReverter: {
        value: undefined
    },
    _iterationReverter: {
        get: function() {
            if(!this.__iterationReverter) {
                if(this.__iterationConverter && typeof this.__iterationConverter.revert === "function") {
                    return this.__iterationConverter;
                }
            } else {
                return this.__iterationReverter;
            }
        },
        set: function(value) {
            this.__iterationReverter = value;
        }
    },

    _convert: {
        value: undefined
    },
    convert: {
        get: function() {
            return this._convert;
        },
        set: function(value) {
            this._convert = value;
        }
    },

    _revert: {
        value: undefined
    },
    revert: {
        get: function() {
            return this._revert;
        },
        set: function(value) {
            this._revert = value;
        }
    },

    /**
     * @function
     * @param {Collection} value - a collection where this._iterationConverter is applied on each value
     * @returns {Collection} a collection of the same type as the input containing each value converted.
     */
    _convertElementIndexCollection: {
        value: function (value) {

            if(!this._iterationConverter || !value ) return value;

            var values = value.values(),
                converter = this._iterationConverter,
                iteration,
                isConverterFunction = typeof converter === "function",
                iValue,
                index = 0,
                result = new value.constructor;

            while(!(iteration = values.next()).done) {
                iValue = iteration.value;
                result.add(
                    isConverterFunction
                        ? converter(iValue,index++,value)
                        : converter.convert(iValue)
                );
                index++;
            }
            return result;
        }
    },


    /**
     * @function
     * @param {Collection} value - a collection where this._iterationReverter is applied on each value
     * @returns {Collection} a collection of the same type as the input containing each value reverted.
     */
    _revertElementIndexCollection: {
        enumerable: false,
        value: function(value) {

            if(!this._iterationReverter || !value) return value;

            var values = value.values(),
                reverter = this._iterationReverter,
                iteration,
                isReverterFunction = typeof reverter === "function",
                iValue,
                index = 0,
                result = new value.constructor;

            if(!isReverterFunction && typeof reverter.revert !== "function") {
                return value;
            }

            while(!(iteration = values.next()).done) {
                iValue = iteration.value;
                result.add(
                    isReverterFunction
                        ? reverter(iValue,index++,value)
                        : reverter.revert(iValue)
                );
                index++;
            }
            return result;
        }
    }

});

