var DigitalAsset = require("./digital-asset").DigitalAsset;

/**
 * @class Image
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends DataObject
 */


exports.Image = DigitalAsset.specialize(/** @lends Image.prototype */ {
    constructor: {
        value: function Image() {
            this.super();
            //console.log("Phront Image created");
            return this;
        }
    },

    transformedSrc: {
        value: undefined
    },
    exifMetadata: {
        value: undefined
    }

});
