/**
 *   @module "mod/ui/input-radio.mod"
 */
const { KeyComposer } = require("../../composer/key-composer");
const { CheckControl } = require("ui/check-control");
const { Montage } = require("core/core");

/**
 * Wraps the a &lt;input type="radio"> element with binding support for the element's standard attributes.
 * @class module:"mod/ui/native/input-radio.mod".InputRadio
 * @extends module:mod/ui/check-input.CheckInput
 */
exports.Radio = class Radio extends CheckControl {
    static {
        Montage.defineProperties(this.prototype, {
            drawsFocusOnPointerActivation: { value: true },
            _radioButtonController: { value: null },
            _keyComposer: { value: null },
            hasTemplate: { value: false },
        });
    }

    /**
     * The radio button controller that ensures that only one radio button in
     * its `content` is `checked` at any time.
     * @type {RadioButtonController}
     */
    set radioButtonController(value) {
        if (this._radioButtonController) {
            this._radioButtonController.unregisterRadioButton(this);
        }

        this._radioButtonController = value;

        if (value) {
            value.registerRadioButton(this);
        }
    }

    get radioButtonController() {
        return this._radioButtonController;
    }

    // <---- Event Handlers ---->

    handleKeyPress() {
        this.active = true;
    }

    handleKeyRelease() {
        this.active = false;
        this.check();
    }

    // <---- Lifecycle Functions ---->

    enterDocument(firstTime) {
        if (firstTime) {
            this.element.setAttribute("role", "radio");
        }
    }

    /**
     * Prepares the component for activation events.
     * @override
     * @protected
     */
    prepareForActivationEvents() {
        super.prepareForActivationEvents();

        this._keyComposer = new KeyComposer();
        this._keyComposer.component = this;
        this._keyComposer.keys = "space";
        this.addComposer(this._keyComposer);

        this._keyComposer.addEventListener("keyPress", this, false);
        this._keyComposer.addEventListener("keyRelease", this, false);
    }
};
