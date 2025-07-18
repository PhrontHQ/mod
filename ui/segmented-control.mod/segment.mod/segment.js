const { Component } = require("ui/component");

/**
 * A segment component representing an individual option in a segmented control.
 * @class Segment
 * @extends Component
 */
const Segment = class Segment extends Component {
    /**
     * The label text displayed in the segment
     * @type {string}
     */
    _label = "";

    get label() {
        return this._label;
    }

    set label(value) {
        if (this._label === value) return;
        this._label = value;
        this.needsDraw = true;
    }

    /**
     * The value associated with this segment
     * @type {*}
     */
    _value = null;

    get value() {
        return this._value;
    }

    set value(val) {
        if (this._value === val) return;
        this._value = val;
    }

    /**
     * Whether this segment is currently selected
     * @type {boolean}
     */
    _selected = false;

    get selected() {
        return this._selected;
    }

    set selected(value) {
        if (this._selected === value) return;
        this._selected = Boolean(value);
        this.needsDraw = true;
    }

    /**
     * Whether this segment is disabled
     * @type {boolean}
     */
    _disabled = false;

    get disabled() {
        return this._disabled;
    }

    set disabled(value) {
        if (this._disabled === value) return;
        this._disabled = Boolean(value);
        this.needsDraw = true;
    }

    /**
     * The segment option object containing label, value, and disabled state
     * @type {Object}
     */
    _option = null;

    get option() {
        return this._option;
    }

    set option(value) {
        if (this._option === value) return;

        this._option = value;

        if (value) {
            this.label = value.label;
            this.value = value.value;
            this.disabled = Boolean(value.disabled);
        }
    }

    draw() {
        this._applySelectedClass();
        this._applyDisabledClass();
        this._updateTabIndex();
    }

    /**
     * Applies or removes the selected CSS class
     * @private
     */
    _applySelectedClass() {
        if (this._selected) {
            this.element.classList.add("mod--selected");
        } else {
            this.element.classList.remove("mod--selected");
        }
    }

    /**
     * Applies or removes the disabled CSS class
     * @private
     */
    _applyDisabledClass() {
        if (this._disabled) {
            this.element.classList.add("mod--disabled");
        } else {
            this.element.classList.remove("mod--disabled");
        }
    }

    /**
     * Updates the tabindex based on disabled state
     * @private
     */
    _updateTabIndex() {
        this.element.tabIndex = this._disabled ? -1 : 0;
    }
};

if (window.MontageElement) {
    MontageElement.define("mod-segment", Segment);
}

exports.Segment = Segment;
