/*global require, exports*/

/**
 * @module mod/ui/base/abstract-toggle-switch.mod
 * @requires mod/composer/press-composer
*/
var AbstractControl = require("./abstract-control").AbstractControl,
    PressComposer = require("../../composer/press-composer").PressComposer;

/**
 * @class AbstractToggleSwitch
 * @extends AbstractControl
 * @fires AbstractToggleSwitch#action
 */
var AbstractToggleSwitch = exports.AbstractToggleSwitch = AbstractControl.specialize( /** @lends AbstractToggleSwitch# */ {

    /**
     * Dispatched when the switch is toggled through a mouse click, finger tap,
     * or when focused and the spacebar is pressed.
     * @event action
     * @memberof AbstractToggleSwitch
     * @property {Map} detail - The detail object as defined in {@link AbstractControl#detail}
     */

    constructor: {
        value: function AbstractToggleSwitch() {
            if(this.constructor === exports.AbstractToggleSwitch) {
                throw new Error("AbstractToggleSwitch cannot be instantiated.");
            }

            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);

            this.defineBindings({
                "classList.has('mod-ToggleSwitch--checked')": {
                    "<-": "checked"
                },
                "classList.has('mod--disabled')": {
                    "<-": "!enabled"
                }
            });
        }
    },

    _enabled: {
        value: true
    },

    /**
     * Enables or disables the toggle switch from user input. When this
     * property is set to `false`, the "mod--disabled" CSS style is applied
     * to the button's DOM element during the next draw cycle. When set to
     * `true` the "mod--disabled" CSS class is removed from the element's
     * class list.
     * @type {boolean}
     */
    enabled: {
        get: function () {
            return this._enabled;
        },
        set: function (value) {
            this._enabled = value;
            this.needsDraw = true;
        }
    },

    acceptsActiveTarget: {
        value: function () {
            return this.enabled;
        }
    },

    _pressComposer: {
        value: null
    },

    _checked: {
        value: false
    },

    checked: {
        get: function () {
            return this._checked;
        },
        set: function (value) {
            this._checked = value;
            this.needsDraw = true;
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._pressComposer.addEventListener("press", this, false);
        }
    },

    /**
     * Called when the user has interacted with the toggle switch.
     * @private
     */
    handlePress: {
        value: function (event) {
            if(!this.enabled) {
                return;
            }

            this.checked = !this.checked;
            this.dispatchActionEvent();
        }
    },

    handleKeyup: {
        value: function (event) {
            if(!this.enabled) {
                return;
            }

            // action event on spacebar
            if (event.keyCode === 32) {
                this.checked = !this.checked;
                this.dispatchActionEvent();
            }
        }
    },

    enterDocument: {
        value: function (firstDraw) {
            this.element.setAttribute("role", "checkbox");
            this.element.addEventListener("keyup", this, false);
        }
    },

    draw: {
        value: function () {
            this.element.setAttribute("aria-checked", this._checked);
            this.element.setAttribute("aria-disabled", !this._enabled);
        }
    }

});
