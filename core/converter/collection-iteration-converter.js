/**
 * @module mod/core/converter/collection-iteration-converter
 * @requires mod/core/converter/converter
 */
const Converter = require("./converter").Converter,
    evaluate = require("../frb/evaluate"),
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
            serializer.setProperty("convertedValueIteratorExpression", this.convertedValueIteratorExpression);
            serializer.setProperty("iterator", this.iterator);
            serializer.setProperty("iterationConverter", this.iterationConverter);
            serializer.setProperty("iterationReverter", this.iterationReverter);

            serializer.setProperty("mapConverter", this.keysConverter);
            serializer.setProperty("mapReverter", this.keysConverter);

        }
    },
    deserializeSelf: {
        value: function (deserializer) {

            let value = deserializer.getProperty("iterator");
            if (value) {
                this.iterator = value;
            }

            value = deserializer.getProperty("convertedValueIteratorExpression");
            if (value) {
                this.convertedValueIteratorExpression = value;
            }


            value = deserializer.getProperty("iterationConverter");
            if (value) {
                this.iterationConverter = value;
            }
            value = deserializer.getProperty("iterationReverter");
            if (value) {
                this.iterationReverter = value;
            }


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
     * Sometimes it might be more practocal to get an iterator from the value to be converted, like for an array or a map. A map especially
     * offers both keys() and values() iterators. So setting "keys" as the value for convertedValueIteratorExpression, will lead a CollectionIterationConverter
     * to evaluate that expression on the value being converted and get the iterator it needs.
     * 
     * @property {Iterator|function}
     * @default {Iterator} undefined
     */
    _convertedValueIteratorExpression: {
        value: undefined
    },
    convertedValueIteratorExpression: {
        get: function() {
            return this._convertedValueIteratorExpression;
        },
        set: function(value) {
            if(value !== this._convertedValueIteratorExpression) {
                this._convertedValueIteratorExpression = value;
            }
        }
    },

    /**
     * The iterator object to be used to iterate over the collection to be converted. The iterator can be what turns one object into a collection
     * For example, a single object with an ExpressionIterator will produce a collection of values to convert.
     * 
     * @property {Iterator|function}
     * @default {Iterator} undefined
     */
    _iterator: {
        value: undefined
    },
    iterator: {
        get: function() {
            return this._iterator;
        },
        set: function(value) {
            if(value !== this._iterator) {
                this._iterator = value;
            }
        }
    },


    /**
     * @property {Converter|function}
     * @default {Converter} undefined
     */
    iterationConverter: {
        get: function() {
            return this._iterationConverter;
        },
        set: function(value) {
            this._iterationConverter = value;
            this._convert = this._convertCollection;
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
            this._convert = this._convertCollection;
            this._revert = this._revertCollection;
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
            this._convert = this._convertCollection;
            this._revert = this._revertCollection;
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
    _convertCollection: {
        value: function (value) {

            if(!this._iterationConverter || !value ) return value;

            //If value is not a collection, we make an effort to treat it as an iteration object
            // if(isNaN(value.length) || isNaN(value.size)) {
            //     return this._iterationConverter.convert(value);
            // }

            /*  
                A pre-set iterator can't know the argument valuet is what it needs to iterate on,
                so we use the .from() method to make it aware of it.

                However the other methods are asking value for it, so using .from(value) is not needed.
            */
            var valueIterator = this._iterator
                ? this._iterator.from(value)
                : this.convertedValueIteratorExpression
                    ? evaluate(this.convertedValueIteratorExpression)
                    : value[Symbol.iterator](),
                isValueCollection = (!isNaN(value.length) || !isNaN(value.size));

            if(!valueIterator) {
                throw "No Iterator found for value:", value;
            }

            var converter = this._iterationConverter,
                iteration,
                isConverterFunction = typeof converter === "function",
                iValue,
                iConvertedValue,
                index = 0,
                promises,
                result;

            while(!(iteration = valueIterator.next()).done) {
                iValue = iteration.value;
                iConvertedValue = 
                    isConverterFunction
                        ? converter(iValue,index++,value)
                        : converter.convert(iValue);

                if(Promise.is(iConvertedValue)) {
                    (promises || (promises = [])).push(iConvertedValue);
                } else {
                    /*
                        If we don't have result yet, we create it to be of the same type of the value we received
                        TODO: We might need to add another property to fully control that type from the outside if needed
                        Like for receiving an array but returning a set
                    */
                    if(!isValueCollection) {
                        if(!result) {
                            result = value;
                        }
                    } else {
                        (result || (result = new value.constructor)).add(iConvertedValue);
                    }
                }
                index++;
            }

            return !!promises
            ? promises.length === 1
                ?  promises[0].then((value) => value)
                : Promise.all(promises).then((resolvedValues) => resolvedValues.constructor === value.constructor ? resolvedValues : value.constructor.from(resolvedValues))
            : result;
        }
    },


    /**
     * @function
     * @param {Collection} value - a collection where this._iterationReverter is applied on each value
     * @returns {Collection} a collection of the same type as the input containing each value reverted.
     */
    _revertCollection: {
        enumerable: false,
        value: function(value) {

            if(!this._iterationReverter || !value) return value;

            var valueIterator = value.values(),
                reverter = this._iterationReverter,
                iteration,
                isReverterFunction = typeof reverter === "function",
                iValue,
                iConvertedValue,
                index = 0,
                promises,
                result;

            if(!isReverterFunction && typeof g.revert !== "function") {
                return value;
            }

            while(!(iteration = valueIterator.next()).done) {
                iValue = iteration.value;
                iConvertedValue = 
                    isReverterFunction
                        ? reverter(iValue,index++,value)
                        : reverter.revert(iValue);

                if(Promise.is(iConvertedValue)) {
                    (promises || (promises = [])).push(iConvertedValue);
                } else {
                    (result || (result = new value.constructor)).add(iConvertedValue);
                }
        
                index++;
            }
            
            return !!promises
            ? promises.length === 1
                ?  promises[0].then((value) => value)
                : Promise.all(promises).then((resolvedValues) => resolvedValues.constructor === value.constructor ? resolvedValues : value.constructor.from(resolvedValues))
            : result;
        }
    }

});

