 /*global require, exports*/

/**
 * @module mod/ui/press-target
 * @requires mod/ui/component
 * @requires mod/composer/press-composer
 * @requires collections/map
 */
var Component = require("../component").Component,
    PressComposer = require("../../composer/press-composer").PressComposer,
    Map = require("core/collections/map");

/**
 * @class PressTarget
 * @extends Component
 */
var PressTarget = exports.PressTarget = Component.specialize( /** @lends PressTarget.prototype # */ {

    /**
     * Dispatched when the button is activated through a mouse click, finger
     * tap, or when focused and the spacebar is pressed.
     *
     * @event PressTarget#action
     * @property {Map} detail - The detail object as defined in {@link AbstractControl#detail}
     */

    /**
     * Dispatched when the button is pressed for a period of time, set by
     * {@link PressTarget#holdThreshold}.
     *
     * @event PressTarget#longAction
     * @property {Map} detail - The detail object as defined in {@link PressTarget#detail}
     */

    /**
     * @private
     * @property {Map} value
     * @default null
     */
    _detail: {
        value: null
    },

    /**
     * The data property of the action event.
     *
     * @returns {Map}
     */
    detail: {
        get: function () {
            if (this._detail === null || this._detail === undefined) {
                this._detail = new Map();
            }
            return this._detail;
        }
    },

    /**
     * Creates an action event with custom data.
     *
     * @function
     * @returns {CustomEvent}
     */
    createActionEvent: {
        value: function () {
            var actionEvent = document.createEvent("CustomEvent"),
                eventDetail;

            eventDetail = this._detail;
            actionEvent.initCustomEvent("action", true, true, eventDetail);
            return actionEvent;
        }
    },

    /**
     * @function
     * @fires PressTarget#action
     */
    dispatchActionEvent: {
        value: function () {
            return this.dispatchEvent(this.createActionEvent());
        }
    },

    /**
     * Convenience property to toggle enabled state.
     */
    disabled: {
        get: function () {
            return !this.enabled;
        },
        set: function (value) {
            if (typeof value === "boolean") {
                this.enabled = !value;
            }
        }
    },

    /**
     * @constructs
     */
    constructor: {
        value: function PressTarget() {
            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);
            this._pressComposer.defineBinding("longPressThreshold", {"<-": "holdThreshold", source: this});

            //classList management
            this.defineBinding("classList.has('mod--disabled')", {"<-": "!enabled"});
            this.defineBinding("classList.has('mod--active')", {"<-": "active"});
        }
    },

    /**
     * Enables or disables the Button from user input. When this property is
     * set to `false`, the "mod--disabled" CSS style is applied to the
     * button's DOM element during the next draw cycle. When set to `true` the
     * "mod--disabled" CSS class is removed from the element's class
     * list.
     * @property {boolean} value
     */
    enabled: {
        value: true
    },

    /**
     * @private
     */
    _preventFocus: {
        value: false
    },

    /**
     * Specifies whether the button should receive focus or not.
     *
     * @property {boolean}
     * @default false
     */
    preventFocus: {
        get: function () {
            return this._preventFocus;
        },
        set: function (value) {
            this._preventFocus = !!value;
            this.needsDraw = true;
        }
    },

    acceptsActiveTarget: {
        value: function () {
            return ! this._preventFocus;
        }
    },

    willBecomeActiveTarget: {
        value: function (previousActiveTarget) {

        }
    },



    /**
     * The amount of time in milliseconds the user must press and hold the
     * button a `longAction` event is dispatched. The default is 1 second.
     * @property {number} value
     * @default 1000
     */
    holdThreshold: {
        value: 1000
    },

    /**
     * @property {PressComposer} value
     * @default null
     * @private
     */
    _pressComposer: {
        value: null
    },

    /**
     * @private
     */
    _active: {
        value: false
    },

    /**
     * This property is true when the button is being interacted with, either
     * through mouse click or touch event, otherwise false.
     *
     * @property {boolean}
     * @default false
     */
    active: {
        get: function () {
            return this._active;
        },
        set: function (value) {
            this._active = value;
            this.needsDraw = true;
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
        }
    },

    // Optimisation
    addEventListener: {
        value: function (type, listener, useCapture) {
            Component.prototype.addEventListener.call(this, type, listener, useCapture);
            if (type === "longAction") {
                this._pressComposer.addEventListener("longPress", this, false);
            }
        }
    },

    // Handlers

    /**
     * Called when the user starts interacting with the component.
     *
     * @private
     */
    handlePressStart: {
        value: function (event) {
            this.active = true;

            if (event.touch) {
                // Prevent default on touchmove so that if we are inside a scroller,
                // it scrolls and not the webpage
                document.addEventListener("touchmove", this, false);
            }

            if (!this._preventFocus) {
                this._element.focus();
            }
        }
    },

    /**
     * Called when the user has interacted with the button.
     *
     * @private
     */
    handlePress: {
        value: function (event) {
            this.active = false;
            this.dispatchActionEvent();
            document.removeEventListener("touchmove", this, false);
        }
    },

    handleKeyup: {
        value: function (event) {
            // action event on spacebar
            if (event.keyCode === 32) {
                this.active = false;
                this.dispatchActionEvent();
            }
        }
    },

    handleLongPress: {
        value: function (event) {
            // When we fire the "longAction" event we don't want to fire the
            // "action" event as well.
            this._pressComposer.cancelPress();

            var longActionEvent = document.createEvent("CustomEvent");
            longActionEvent.initCustomEvent("longAction", true, true, null);
            this.dispatchEvent(longActionEvent);
        }
    },

    /**
     * Called when all interaction is over.
     * @private
     */
    handlePressCancel: {
        value: function (event) {
            this.active = false;
            document.removeEventListener("touchmove", this, false);
        }
    },

    /**
     * @private
     */
    handleTouchmove: {
        value: function (event) {
            event.preventDefault();
        }
    }
});
