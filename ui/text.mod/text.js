/*global require, exports, console, MontageElement */

/**
 * @module "mod/ui/text.mod"
 */
var Component = require("../component").Component;

/**
 * A Text component shows plain text. Any text can be safely displayed without
 * escaping, but the browser will treat all sequences of white space as a
 * single space.
 *
 * The text component replaces the inner DOM of its element with a TextNode and
 * it renders the [value]{@link Text#value} string in it.
 *
 * @class module:mod/ui/text.Text
 * @extends module:mod/ui/component.Component
 * @classdesc A component that displays a string of plain text.
 */
var MontageText = exports.Text = Component.specialize( /**  @lends module:mod/ui/text.Text# */ {

    hasTemplate: {
        value: false
    },

    _value: {
        value: null
    },

    parseValueAsHTML: {
        value: false
    },

    /**
     * The string to be displayed. `null` is equivalent to the empty string.
     * @type {string}
     * @default null
     */
    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (this._value !== value) {
                this._value = value;
                this.needsDraw = true;
            }
        }
    },

    /**
     * An optional converter for transforming the `value` into the
     * corresponding rendered text.
     * Converters are called at time of draw.
     * @type {?Converter}
     * @default null
    */
    converter: {
        value: null
    },

    /**
     * The default string value assigned to the Text instance.
     * @type {string}
     * @default "" empty string
     */
    defaultValue: {
        value: ""
    },

    _valueNode: {
        value: null
    },

    _RANGE: {
        value: document.createRange()
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                var range = this._RANGE;
                range.selectNodeContents(this.element);
                range.deleteContents();
                if(!this.parseValueAsHTML) {
                    this._valueNode = document.createTextNode("");
                    range.insertNode(this._valueNode);
                }
                this.element.classList.add("text-mod");
            }
        }
    },

    draw: {
        value: function () {
            // get correct value
            var displayValue = (typeof this._value !== "undefined" && this._value !== null) ? this._value : this.defaultValue;

            //push to DOM
            if(!this.parseValueAsHTML) {
                this._valueNode.data = this.converter ? this.converter.convert(displayValue) : displayValue;
            } else {
                this._RANGE.selectNodeContents(this.element);
                this._RANGE.insertNode(this._RANGE.createContextualFragment(displayValue));
            }
        }
    }

});

if (window.MontageElement) {
    MontageElement.define("text-mod", MontageText, {
        observedAttributes: ['value']
    });
}
