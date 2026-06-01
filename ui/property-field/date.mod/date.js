const { InternationalDateToStringFormatter } = require("../../../core/converter/international-date-to-string-formatter");
const { PressComposer } = require("composer/press-composer");
const dateToDateInputStringConverter = require("../../../core/converter/date-to-date-input-string-converter").singleton

/**
 * @module "ui/date.mod"
 */
var Component = require("ui/component").Component;

/**
 * @class Date
 * @extends Component
 */
exports.Date = Component.specialize(/** @lends Date.prototype */{

    constructor: {
        value: function Date() {
            var self = this;
            this.addOwnPropertyChangeListener("value", function (value) {
                if (!value) {
                    self._isEditMode = true;
                }
            });
            this.addOwnPropertyChangeListener("readonly", this);
        }
    },

    dateToDateInputStringConverter: {
        get: function () {
            return dateToDateInputStringConverter;
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

    _disablePressComposer: {
        value: function () {
            if (this._isPressComposerEnabled) {
                this._isPressComposerEnabled = false;
                this._chip.removeComposer(this._pressComposer);
            }
        }
    },

    _enablePressComposer: {
        value: function () {
            if (!this._isPressComposerEnabled && this._chip) {
                this._isPressComposerEnabled = true;
                this._chip.addComposer(this._pressComposer);
            }
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._input.element.addEventListener("blur", this);
            if (!this.readonly) {
                this._enablePressComposer();
            }
        }
    },

    handleBlur: {
        value: function(event) {
            this._isEditMode = !this.value;
        }
    },

    handlePress: {
        value: function (event) {
            console.log("Date.handlePress", event);
            this._isEditMode = true;
            this._input.element.focus();
            console.log(this._input.element);
        }
    },

    handleReadonlyChange: {
        value: function (value) {
            if (value) {
                this._enablePressComposer();
            } else {
                this._disablePressComposer();
            }
        }
    },

    _isEditMode: {
        value: true
    }

});
