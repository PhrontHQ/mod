const { InternationalDateToStringFormatter } = require("../../core/converter/international-date-to-string-formatter");
const { PressComposer } = require("composer/press-composer");

/**
 * @module "ui/date-property-field.mod"
 */
var Component = require("ui/component").Component;

/**
 * @class DatePropertyField
 * @extends Component
 */
exports.DatePropertyField = Component.specialize(/** @lends DatePropertyField.prototype */{

    constructor: {
        value: function DatePropertyField() {
            var self = this;
            this.addOwnPropertyChangeListener("value", function (value) {
                if (!value) {
                    self._isEditMode = true;
                }
            });
        }
    },

    dateFormatConverter: {
        get: function () {
            if (!this._dateFormatConverter) {
                this._dateFormatConverter = new InternationalDateToStringFormatter();
                this._dateFormatConverter.options = {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                };
            }
            return this._dateFormatConverter;
        }
    },

    _pressComposer: {
        get: function () {
            if (!this.__pressComposer) {
                this.__pressComposer = new PressComposer();
                this.__pressComposer.addEventListener("press", this);
            }
            return this.__pressComposer;
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._input.element.addEventListener("blur", this);
            this._chip.addComposer(this._pressComposer);
        }
    },

    handleBlur: {
        value: function(event) {
            this._isEditMode = !this.value;
        }
    },

    handlePress: {
        value: function (event) {
            console.log("DatePropertyField.handlePress", event);
            this._isEditMode = true;
            this._input.element.focus();
            console.log(this._input.element);
        }
    },

    _isEditMode: {
        value: true
    }

});
