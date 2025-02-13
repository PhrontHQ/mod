/*global require, exports*/

const { PressComposer } = require("composer/press-composer");
const { KeyComposer } = require("composer/key-composer");
const { Control } = require("ui/control");

// TODO: migrate away from using undefinedGet and undefinedSet

/**
 * @typedef {"horizontal"|"vertical"} ButtonOrientation
 * @typedef {"start"|"end"} ButtonPosition
 * /

/**
 * Wraps a native <code>&lt;button></code> or <code>&lt;input[type="button"]></code> HTML element.
 * The element's standard attributes are exposed as bindable properties.
 * @class module:"mod/ui/native/button.mod".Button
 * @extends module:mod/ui/control.Control
 * @fires action
 * @fires hold
 *
 * @example
 * <caption>JavaScript example</caption>
 *   var b1 = new Button();
 *   b1.element = document.querySelector("btnElement");
 *   b1.addEventListener("action", function(event) {
 *     console.log("Got event 'action' event");
 *   });
 *
 * @example
 * <caption>Serialized example</caption>
 * {
 *   "aButton": {
 *     "prototype": "mod/ui/native/button.mod",
 *     "values": {
 *       "element": {"#": "btnElement"}
 *     },
 *     "listeners": [
 *        {
 *          "type": "action",
 *          "listener": {"@": "appListener"}
 *        }
 *     ]
 *   },
 *   "listener": {
 *     "prototype": "appListener"
 *   }
 * }
 * <button data-mod-id="btnElement"></button>
 */
const Button = (exports.Button = class Button extends Control {
    /** @lends module:"mod/ui/native/button.mod".Button# */

     /**
     * Available image placements
     * @readonly
     * @enum {ButtonPosition}
     */
     static IMAGE_POSITIONS = Object.freeze({
        start: "mod--start",
        end: "mod--end",
    });

    /**
     * Available main axis orientations
     * @readonly
     * @enum {ButtonOrientation}
     */
    static ORIENTATIONS = Object.freeze({
        horizontal: "mod--horizontal",
        vertical: "mod--vertical",
    });

    _imagePosition = Button.IMAGE_POSITIONS.start;

    get imagePosition() {
        return this._imagePosition;
    }

    /**
     * The position of the image
     * @type {ButtonPosition}
     * @param {ButtonPosition} position - The position of the image
     */
    set imagePosition(position) {
        if (position !== this._imagePosition && Button.IMAGE_POSITIONS[position]) {
            this._imagePosition = Button.IMAGE_POSITIONS[position];
            this._applyImagePositionStyles();
        }
    }

    _orientation = Button.ORIENTATIONS.horizontal;

    get orientation() {
        return this._orientation;
    }

    /**
     * The orientation of the button
     * @type {ButtonOrientation}
     * @param {ButtonOrientation} orientation - The orientation of the button
     */
    set orientation(orientation) {
        if (orientation !== this._orientation && Button.ORIENTATIONS[orientation]) {
            this._orientation = Button.ORIENTATIONS[orientation];
            this._applyOrientationStyles();
        }
    }

    drawsFocusOnPointerActivation = true;

    standardElementTagName = "BUTTON";

    hasTemplate = true;

    /**
     * A Mod converter object used to convert or format the label displayed by
     * the Button instance. When a new value is assigned to <code>label</code>,
     * the converter object's <code>convert()</code> method is invoked,
     * passing it the newly assigned label value.
     * @type {Property}
     * @default null
     */
    converter = null;

    label = null;

    get label() {
        return this._label;
    }

    set label(value) {
        const isDefined = typeof value !== "undefined";

        if (isDefined && this.converter) {
            try {
                value = this.converter.convert(value);

                if (this.error) {
                    this.error = null;
                }
            } catch (e) {
                // unable to convert - maybe error
                this.error = e;
            }
        }

        this._label = isDefined && value !== null ? String(value) : null;
    }

    _promise = undefined;

    get promise() {
        return this._promise;
    }

    set promise(value) {
        const handleResolution = () => {
            if (handleResolution.promise === this._promise) {
                this.classList.remove("mod--pending");
                this._promise = undefined;
            }
        };

        if (this._promise !== value) {
            this._promise = value;

            if (this._promise) {
                this.classList.add("mod--pending");
                handleResolution.promise = value;
                this._promise.then(handleResolution);
            }
        }
    }

    /**
     * The amount of time in milliseconds the user must press and hold
     * the button a <code>hold</code> event is dispatched.
     * The default is 1 second.
     * @type {number}
     * @default 1000
     */
    get holdThreshold() {
        return this._pressComposer.longPressThreshold;
    }

    set holdThreshold(value) {
        this._pressComposer.longPressThreshold = value;
    }

    __pressComposer = null;

    get _pressComposer() {
        if (!this.__pressComposer) {
            this.__pressComposer = new PressComposer();
            this.addComposer(this.__pressComposer);
        }

        return this.__pressComposer;
    }

    __spaceKeyComposer = null;

    get _spaceKeyComposer() {
        if (!this.__spaceKeyComposer) {
            this.__spaceKeyComposer = KeyComposer.createKey(
                this,
                "space",
                "space"
            );
        }
        return this.__spaceKeyComposer;
    }

    __enterKeyComposer = null;

    get _enterKeyComposer() {
        if (!this.__enterKeyComposer) {
            this.__enterKeyComposer = KeyComposer.createKey(
                this,
                "enter",
                "enter"
            );
        }
        return this.__enterKeyComposer;
    }

    enterDocument(firstDraw) {
        super.enterDocument?.call(firstDraw);

        if (firstDraw) {
            this.element.setAttribute("role", "button");
            this.element.addEventListener("keyup", this, false);

            // Apply Button styles
            this._applyImagePositionStyles();
            this._applyOrientationStyles();
        }
    }

    /**
     * Prepares the component for activation events.
     * @override
     * @protected
     */
    prepareForActivationEvents() {
        this._pressComposer.addEventListener("pressStart", this, false);
        this._spaceKeyComposer.addEventListener("keyPress", this, false);
        this._enterKeyComposer.addEventListener("keyPress", this, false);
    }

    /**
     * Override addEventListener for optimization
     * @override
     * @protected
     * @param {String} type - The event type
     * @param {Function} listener - The event listener
     * @param {boolean} useCapture - The useCapture flag
     */
    addEventListener(type, listener, useCapture) {
        Control.prototype.addEventListener.call(
            this,
            type,
            listener,
            useCapture
        );

        if (type === "longAction") {
            this._pressComposer.addEventListener("longPress", this, false);
        }
    }

    // <---- Event Handlers ---->

    /**
     * Dispatching the action event on spacebar & enter when the button is focused.
     * @param {MutableEvent} mutableEvent - The event object
     * @protected
     * @fires action
     */
    handleKeyPress(mutableEvent) {
        const { identifier } = mutableEvent;

        if (identifier === "space" || identifier === "enter") {
            this.active = false;
            this.dispatchActionEvent();
        }
    }

    /**
     * Called when the user starts interacting with the component.
     * @protected
     * @param {MutableEvent} mutableEvent - The event object
     */
    handlePressStart(mutableEvent) {
        if (!this._promise) {
            this.active = true;
            this._addEventListeners();
        }
    }

    /**
     * Called when the user has interacted with the button.
     * @protected
     * @param {MutableEvent} mutableEvent - The event object
     * @fires action
     */
    handlePress(mutableEvent) {
        if (!this._promise) {
            this.active = false;
            this.dispatchActionEvent(event.details);
            this._removeEventListeners();
        }
    }

    /**
     * Called when the user has interacted with the button for a long time.
     * @protected
     * @param {MutableEvent} mutableEvent - The event object
     * @fires longAction
     */
    handleLongPress(mutableEvent) {
        if (!this._promise) {
            // When we fire the "hold" event we don't want to fire the
            // "action" event as well.
            this._pressComposer.cancelPress();
            this._removeEventListeners();

            const longActionEvent = document.createEvent("CustomEvent");

            // FIXME: InitCustomEvent is deprecated
            longActionEvent.initCustomEvent("longAction", true, true, null);
            this.dispatchEvent(longActionEvent);
        }
    }

    /**
     * Called when all interaction is over.
     * @protected
     * @param {MutableEvent} mutableEvent - The event object
     */
    handlePressCancel(mutableEvent) {
        this.active = false;
        this._removeEventListeners();
    }

    // <---- Private ---->

    /**
     * Adds event listeners to the button.
     * @private
     */
    _addEventListeners() {
        this._pressComposer.addEventListener("press", this, false);
        this._pressComposer.addEventListener("pressCancel", this, false);

        // FIXME: @benoit: we should maybe have a flag for this kind of event.
        // can be tricky with the event delegation for example if we don't add it.
        // same issue for: the pressComposer and the translate composer.
        this._pressComposer.addEventListener("longPress", this, false);
    }

    /**
     * Removes event listeners from the button.
     * @private
     */
    _removeEventListeners() {
        this._pressComposer.removeEventListener("press", this, false);
        this._pressComposer.removeEventListener("pressCancel", this, false);
        this._pressComposer.removeEventListener("longPress", this, false);
    }

    /**
     * Applies the current image position's styling by updating CSS classes
     * @private
     * @see Button.IMAGE_POSITIONS
     */
    _applyImagePositionStyles() {
        this._removeClassListTokens(...Object.values(Button.IMAGE_POSITIONS));
        this.classList.add(this.imagePosition);
    }

    /**
     * Applies the current orientation's styling by updating CSS classes
     * @private
     * @see Button.ORIENTATIONS
     */
    _applyOrientationStyles() {
        this._removeClassListTokens(...Object.values(Button.ORIENTATIONS));
        this.classList.add(this.orientation);
    }

    // FIXME: Remove this method when the classList's remove method is fixed!
    // Our implementation doesn't support multiple arguments
    // https://dom.spec.whatwg.org/#dom-domtokenlist-remove
    _removeClassListTokens(...tokens) {
        for (const token of tokens) {
            this.classList.remove(token);
        }
    }
});

Button.addAttributes({
    /** @lends module:"mod/ui/native/button.mod".Button# */

    /**
     * The URL to which the form data will be sumbitted.
     * @type {string}
     * @default null
     */
    formaction: null,

    /**
     * The content type used to submit the form to the server.
     * @type {string}
     * @default null
     */
    formenctype: null,

    /**
     * The HTTP method used to submit the form.
     * @type {string}
     * @default null
     */
    formmethod: null,

    /**
     * Indicates if the form should be validated upon submission.
     * @type {boolean}
     * @default null
     */
    formnovalidate: { dataType: "boolean" },

    /**
     * The target frame or window in which the form output should be rendered.
     * @type string}
     * @default null
     */
    formtarget: null,

    /**
     * A string indicating the input type of the component's element.
     * @type {string}
     * @default "button"
     */
    type: { value: "button" },

    /**
     * The name associated with the component's DOM element.
     * @type {string}
     * @default null
     */
    name: null,

    /**
     * <strong>Use <code>label</code> to set the displayed text on the button</strong>
     * The value associated with the element. This sets the value attribute of
     * the button that gets sent when the form is submitted.
     * @type {string}
     * @default null
     * @see label
     */
    value: null,
});
