const { VisualOrientation } = require("core/enums/visual-orientation");
const { VisualShape } = require("core/enums/visual-shape");
const { VisualSize } = require("core/enums/visual-size");
const { Component } = require("ui/component");

/**
 * A segmented control component that allows users to select from multiple options.
 * Displays options as segments with a sliding thumb indicator for the selected option.
 *
 * @class SegmentedControl
 * @extends Component
 */
const SegmentedControl = class SegmentedControl extends Component {
    // FIXME: @Benoit workaround: until `removeRangeAtPathChangeListener` is implemented
    _cancelHandleOptionsChange = null;

    /**
     * The currently selected option value
     * @type {*}
     */
    selection = null;

    /**
     * The disabled state of the segmented control
     * @returns {boolean} True if disabled, false otherwise
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
     * The array of options for the segmented control
     * @returns {Array} The options array
     */
    _options = [];

    get options() {
        return this._options;
    }

    set options(value) {
        if (this._options === value) return;

        if (Array.isArray(value)) {
            this._options = value;
        } else {
            console.warn("Options must be an array.");
            this._options = [];
        }

        this._normalizedOptions = this._normalizeOptions();
        this.needsDraw = true;
    }

    /**
     * The orientation of the segmented control
     * @returns {string} The current orientation (horizontal or vertical)
     */
    _orientation = VisualOrientation.horizontal;

    get orientation() {
        return this._orientation;
    }

    set orientation(value) {
        if (this._orientation === value) return;

        if (!VisualOrientation.members.includes(value)) {
            console.warn("Invalid orientation value. Defaulting to horizontal.");
            this._orientation = VisualOrientation.horizontal;
        } else {
            this._orientation = VisualOrientation[value];
        }

        this.needsDraw = true;
    }

    /**
     * The size of the segmented control
     * @returns {string} The current size
     */
    _size = VisualSize.medium;

    get size() {
        return this._size;
    }

    set size(value) {
        if (this._size === value) return;

        if (!VisualSize.members.includes(value)) {
            console.warn("Invalid size value. Defaulting to medium.");
            this._size = VisualSize.medium;
        } else {
            this._size = VisualSize[value];
        }

        this.needsDraw = true;
    }

    /**
     * The shape of the segmented control
     * @returns {string} The current shape
     */
    _shape = VisualShape.rounded;

    get shape() {
        return this._shape;
    }

    set shape(value) {
        if (this._shape === value) return;

        if (!VisualShape.members.includes(value)) {
            console.warn("Invalid shape value. Defaulting to 'rounded'.");
            this._shape = VisualShape.rounded;
        } else {
            this._shape = VisualShape[value];
        }

        this.needsDraw = true;
    }

    enterDocument() {
        this._cancelHandleOptionsChange = this.addRangeAtPathChangeListener("_options", this, "handleOptionsChange");
        this.addPathChangeListener("_selectedOption", this, "handleSelectionChange");
    }

    exitDocument() {
        this.removePathChangeListener("_selectedOption", this);
        this._cancelHandleOptionsChange?.();
    }

    slotContentDidFirstDraw(slot) {
        this.needsDraw = true;
    }

    /**
     * Handles changes to the options array.
     * Re-normalizes options and triggers a redraw.
     */
    handleOptionsChange() {
        this._normalizedOptions = this._normalizeOptions();
        this.needsDraw = true;
    }

    /**
     * Handles selection changes and dispatches a change event
     * @param {Object} option - The selected option object
     */
    handleSelectionChange(option) {
        const event = new CustomEvent("change", {
            detail: option,
            bubbles: true,
        });

        this.selection = option?.value || null;
        this.dispatchEvent(event);
        this.needsDraw = true;
    }

    draw() {
        // Apply classes based on shape, size, and orientation
        this._applyOrientationClasses();
        this._applyDisabledClass();
        this._applyShapeClasses();
        this._applySizeClasses();

        // Move the thumb to the selected segment if available
        const { selectedIterations = [] } = this.templateObjects?.segments ?? {};
        const [selectedIteration] = selectedIterations;

        if (selectedIteration) {
            this.thumbElement.style.display = "block";
            const segmentElement = selectedIteration.firstElement;
            this._moveThumbToSegment(segmentElement);
        } else {
            // If no segment is selected, hide the thumb
            this.thumbElement.style.display = "none";
        }
    }

    didDraw() {
        if (this._completedFirstDraw) {
            this.element.classList.add("mod--ready");
        }
    }

    /**
     * Normalizes the options array to ensure consistent object structure
     * @private
     * @returns {Array} Array of normalized option objects with label, value, and disabled properties
     */
    _normalizeOptions() {
        return this._options.map((option) => {
            if (typeof option === "string" || typeof option === "number") {
                return { label: option, value: option, disabled: false };
            }

            return {
                ...option,
                disabled: option.disabled || false,
                label: option.label,
                value: option.value,
            };
        });
    }

    /**
     * Moves the thumb element to match the position and size of the selected segment
     * @private
     * @param {HTMLElement} segmentElement - The DOM element of the selected segment
     */
    _moveThumbToSegment(segmentElement) {
        if (!segmentElement || !this.thumbElement) return;

        const height = segmentElement.offsetHeight;
        const width = segmentElement.offsetWidth;

        if (width === 0 || height === 0) {
            console.warn("Segment element has zero width or height, cannot position thumb.");
            return;
        }

        this.thumbElement.style.height = `${height}px`;
        this.thumbElement.style.width = `${width}px`;

        if (this._orientation === VisualOrientation.horizontal) {
            const left = segmentElement.offsetLeft;
            this.thumbElement.style.transform = `translate3d(${left}px, 0, 0)`;
        } else {
            const top = segmentElement.offsetTop;
            this.thumbElement.style.transform = `translate3d(0, ${top}px, 0)`;
        }
    }

    /**
     * Applies CSS classes based on the current orientation
     * @private
     */
    _applyOrientationClasses() {
        this.element.classList.remove(...Object.values(VisualOrientation.values));
        this.element.classList.add(this._orientation);
    }

    /**
     * Applies CSS classes based on the current shape
     * @private
     */
    _applyShapeClasses() {
        this.element.classList.remove(...Object.values(VisualShape.values));
        this.element.classList.add(this._shape);
    }

    /**
     * Applies CSS classes based on the current size
     * @private
     */
    _applySizeClasses() {
        this.element.classList.remove(...Object.values(VisualSize.values));
        this.element.classList.add(this._size);
    }

    /**
     * Applies or removes the disabled CSS class based on the disabled state
     * @private
     */
    _applyDisabledClass() {
        if (this.disabled) {
            this.element.classList.add("mod--disabled");
        } else {
            this.element.classList.remove("mod--disabled");
        }
    }
};

if (window.MontageElement) {
    MontageElement.define("segmented-control-mod", SegmentedControl);
}

exports.SegmentedControl = SegmentedControl;
