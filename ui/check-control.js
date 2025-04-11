/*global require, exports */

/**
 *   @module mod/ui/check-control
 */
const { PressComposer } = require("composer/press-composer");
const { Control } = require("ui/control");

/**
 * The base class for the Checkbox component. You will not typically create
 * this class directly but instead use the Checkbox component.
 * @class module:mod/ui/check-input.CheckControl
 * @extends module:mod/ui/control.Control
 */
exports.CheckControl = class CheckControl extends Control {
    static {
        Montage.defineProperties(this.prototype, {
            /**
             * Stores if we need to "fake" checking of the input element.
             *
             * When preventDefault is called on touchstart and touchend events (e.g. by
             * the scroller component) the checkbox doesn't check itself, so we need
             * to fake it later.
             *
             * @default false
             * @private
             */
            _shouldFakeCheck: { value: false },
            _pressComposer: { value: null },
            checkedClassName: { value: null },
        });
    }

    constructor() {
        super();
        const bindings = {};

        // Add default binding
        this._addCheckedClassNameToBindings("montage--checked", bindings);

        // Add custom binding if a custom class name is provided
        if (this.checkedClassName) {
            this._addCheckedClassNameToBindings(this.checkedClassName, bindings);
        }

        this.defineBindings(bindings);
    }

    // <---- Public Functions ---->

    toggleChecked() {
        if (this.disabled) return;

        this.checked = !this.checked;
        this.dispatchActionEvent();
    }

    // <---- Event Handlers ---->

    handlePressStart(event) {
        if (this.hasStandardElement) {
            this._shouldFakeCheck = event.defaultPrevented;
        } else {
            this.active = true;

            if (event.touch) {
                // Prevent default on touchmove so that if we are inside a scroller,
                // it scrolls and not the webpage
                document.addEventListener("touchmove", this, false);
            }
        }
    }

    handlePress(_) {
        if (this._shouldFakeCheck) {
            this._shouldFakeCheck = false;
            this._fakeCheck();
        }

        if (!this.hasStandardElement) {
            this.active = false;
            this.toggleChecked();
        }
    }

    handlePressCancel(_) {
        if (!this.hasStandardElement) {
            this.active = false;
            document.removeEventListener("touchmove", this, false);
        }
    }

    handleChange(_) {
        if (!this._pressComposer || this._pressComposer.state !== PressComposer.CANCELLED) {
            Object.getPropertyDescriptor(this, "checked").set.call(this, this.element.checked, true);
            this.dispatchActionEvent();
        }
    }

    // <---- Lifecycle Functions ---->

    /**
     * Prepares the component for activation events.
     * @override
     * @protected
     */
    prepareForActivationEvents() {
        this._pressComposer = new PressComposer();
        this.addComposer(this._pressComposer);

        this._pressComposer.addEventListener("pressStart", this, false);
        this._pressComposer.addEventListener("press", this, false);
        this._pressComposer.addEventListener("cancel", this, false);
        this._element.addEventListener("change", this);
    }

    draw() {
        super.draw();
        this._element.setAttribute("aria-checked", this._checked);
    }

    // <---- Private Functions ---->

    /**
     * @private
     */
    _addCheckedClassNameToBindings(className, bindings = {}) {
        const expression = `classList.has('${className}')`;
        bindings[expression] = { "<-": "checked" };

        return bindings;
    }

    /**
     * Fake the checking of the element.
     *
     * Changes the checked property of the element and dispatches a change event.
     * Radio button overrides this.
     *
     * @private
     */
    _fakeCheck() {
        // NOTE: this may be BAD, modifying the element outside of
        // the draw loop, but it's what a click/touch would
        // actually have done
        this._element.checked = !this._element.checked;

        const changeEvent = new Event("change", {
            cancelable: true,
            bubbles: true,
        });

        this._element.dispatchEvent(changeEvent);
    }
};

exports.CheckControl.addAttributes({
    /** @lends module:"mod/ui/native/check-control".InputCheckbox# */

    /**
     * Specifies if the checkbox is in it checked state or not.
     * @type {boolean}
     * @default false
     */
    checked: { value: false, dataType: "boolean" },

    /**
     * The value associated with the element.
     * @type {string}
     * @default "on"
     */
    value: { value: "on" },
});
