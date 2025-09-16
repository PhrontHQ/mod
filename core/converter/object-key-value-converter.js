/**
 * @module mod/core/converter/object-key-value-converter
 * @requires mod/core/converter/converter
 */
const Converter = require("./converter").Converter;

var singleton;

/**
 * Replaces the passed object's value for the key set on the converter, with the converted value using the configured converter 
 * 
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
    
    /********************************************
     * Serialization
     */

    deserializeSelf: {
        value: function (deserializer) {

            var value;
            value = deserializer.getProperty("objectKey");
            if (value !== void 0) {
                this.objectKey = value;
            }

            value = deserializer.getProperty("objectConvertedKey");
            if (value !== void 0) {
                this.objectConvertedKey = value;
            }

            value = deserializer.getProperty("deletesObjectKey");
            if (value !== void 0) {
                this.deletesObjectKey = value;
            }
            
            value = deserializer.getProperty("valueConverter");
            if (value !== void 0) {
                this.valueConverter = value;
            }

        }
    },

    serializeSelf: {
        value: function (serializer) {
            if (this.objectKey) {
                serializer.setProperty("objectKey", this.objectKey);
            }
            if (this.objectConvertedKey) {
                serializer.setProperty("objectConvertedKey", this.objectConvertedKey);
            }
            if (this.deletesObjectKey) {
                serializer.setProperty("deletesObjectKey", this.deletesObjectKey);
            }
            if (this.valueConverter) {
                serializer.setProperty("valueConverter", this.valueConverter);
            }

        }
    },

    /**
     * the key/property of the converted object whose value needs to be converted via this.valueConverter
     * If objectConvertedKey is specified, then the converted value will be saved on the converted object under
     * object[this.objectConvertedKey].
     * 
     * if this.objectConvertedKey is specified and this.deletesObjectKey is true, then object[this.objectKey] will be deleted on the converted object.
     *
     * @property {string} objectKey
     * @default undefined
     */
    objectKey: {
      value: undefined
    },
    /**
     * If objectConvertedKey is specified, then the converted value will be saved on the converted object under
     * object[this.objectConvertedKey] instead of object[this.objectKey].
     * 
     * @property {string} objectKey
     * @default undefined
     */
    objectConvertedKey: {
      value: undefined
    },

    /**
     * If deletesObjectKey is set to true, then object[this.objectKey] will delted from object.
     * 
     * @property {boolean} deletesObjectKey
     * @default false
     */

    deletesObjectKey: {
      value: false
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
                    /*
                        If this.valueConverter.convert() returns a promise, we need to handle that... 

                        Should we have an always synchronous ObjectKeyValueConverter and 
                        an always asynchronous AsyncObjectKeyValueConverter ?
                        Or always an asynchronous ObjectKeyValueConverter ?
                    */
                    let convertedValue = this.valueConverter.convert(object[this.objectKey]);
                    if(this.objectConvertedKey) {
                        object[this.objectConvertedKey] = convertedValue;
                        if(this.deletesObjectKey === true) {
                            delete object[this.objectKey];
                        }
                    } else {
                        object[this.objectKey] = convertedValue;
                    }
                }
            }

          return object;
        }
    }

});