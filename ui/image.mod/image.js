/**
 * @module "mod/ui/native/image.mod"
 * @requires mod/ui/component
 * @requires mod/ui/native-control
 */
const { Component } = require("ui/component");

/**
 * Wraps the a &lt;img> element with binding support for its standard attributes.
 * @class module:"mod/ui/native/image.mod".Image
 * @extends module:mod/ui/control.Control
 */
const Image = class Image extends Component {
    hasTemplate = true;
};

/** @lends module:"mod/ui/native/image.mod".Image */
Image.addAttributes({
    /**
     * A text description to display in place of the image.
     * @type {string}
     * @default null
     */
    alt: null,

    /**
     * The height of the image in CSS pixels.
     * @type {number}
     * @default null
     */
    height: null,

    /**
     * The URL where the image is located.
     * @type {string}
     * @default null
     */
    src: null,

    /**
     * The width of the image in CSS pixels.
     * @type {number}
     * @default null
     */
    width: null,

    /**
     * The loading strategy for the image.
     * @type {string}
     * @default "eager"
     * @values ["eager", "lazy"]
     */
    loading: {
        dataType: "string",
        value: "eager",
    },
});

exports.Image = Image;
