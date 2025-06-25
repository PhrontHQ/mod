/**
 * @module mod/core/converter/object-key-value-converter
 * @requires mod/core/converter/converter
 */
const Converter = require("./converter").Converter;

var singleton;

/**
 * Converts the passed object's value for the key set on the converter, using the configured converter 
 *
 * @class ObjectKeyValueConverter
 * @extends Converter
 */
var ObjectKeyValueConverter = exports.ObjectKeyValueConverter = Converter.specialize({

    constructor: {
        value: function () {
            return this;
        }
    },

    objectKey: {
      value: undefined
    },
    valueConverter: {
      value: undefined
    },

    convert: {
        value: function ObjectKeyValueConverter_convert(object) {
            if(!this.objectKey) {
                console.warn("ObjectKeyValueConverter unable to convert as objectKey is not set");
            }

            let objectValue = object[this.objectKey];
            
            if(objectValue !== undefined) {
                if(!this.valueConverter) {
                    console.warn("ObjectKeyValueConverter unable to convert as valueConverter is not set");
                } else {
                    object[this.objectKey] = this.valueConverter.convert(object[this.objectKey]);
                }
            }

          return object;
        }
    }

});