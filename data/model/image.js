const DigitalAsset = require("./digital-asset").DigitalAsset;
const Montage = require("core/core").Montage;

/**
 * @class Image
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends DataObject
 */
exports.Image = class Image extends DigitalAsset {
    static {
        Montage.defineProperties(this.prototype, {
            transformedSrc: {
                value: undefined,
            },
            exifMetadata: {
                value: undefined,
            },
        });
    }
};
