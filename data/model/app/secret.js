/**
    @module mod/data/model/app/secret
*/

var Montage = require("core/core").Montage,
    DataObject = require("../data-object").DataObject;

/**
 * @class Secret
 * @extends DataObject
 *
 */

exports.Secret = class Secret extends DataObject { /** @lends Secret.prototype */

    static {

        Montage.defineProperties(this.prototype, {

            name: {
                value: undefined
            },
            value: {
                value: undefined
            }
        });
    }

    deserializeSelf(deserializer) {
        if(super.deserializeSelf) {
            super.deserializeSelf(deserializer);
        }

        var value;
        value = deserializer.getProperty("name");
        if (name !== void 0) {
            this.name = value;
        }
        value = deserializer.getProperty("value");
        if (value !== void 0) {
            this.value = value;
        }
    }

    serializeSelf(serializer) {
        if(this.name) {
            serializer.setProperty("name", this.name);
        }
        if(this.value) {
            serializer.setProperty("value", this.value);
        }
        
    }
}
