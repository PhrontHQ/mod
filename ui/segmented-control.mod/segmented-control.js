const Component = require("ui/component").Component;

/**
 * A segmented control component that allows users to select from multiple options.
 * Displays options as segments with a sliding thumb indicator for the selected option.
 *
 * @class SegmentedControl
 * @extends Component
 */
const SegmentedControl = (exports.SegmentedControl = class SegmentedControl extends Component {
    static {
        Montage.defineProperties(this.prototype, {
             // FIXME: @Benoit workaround: until `removeRangeAtPathChangeListener` is implemented
            _cancelHandleOptionsChange: {value: null},
            // Indicates when the component is ready for animations
            _readyForAnimation: {value: false},
            // Controls whether animations should be enabled
            _shouldEnableAnimation: {value: false},
            _isChangingSelection: {value: false},
            /**
             * The path to the value within each option object.
             * If options are simple values, use 'this'.
             * @type {string}
             */
            valuePath: { value: "this"},
            /**
             * The currently selected option value
             * @type {*}
             */
            selection: { value: null },

            /**
             * The disabled state of the segmented control
             * @returns {boolean} True if disabled, false otherwise
             */
            _disabled: { value: false }
        });
    }

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

        this.needsDraw = true;
    }

    enterDocument() {
        this._cancelHandleOptionsChange = this.addRangeAtPathChangeListener("_options", this, "handleOptionsChange");
        this.addPathChangeListener("_selectedOption", this, "handleSelectionChange");
        this.element.addEventListener("change", this, {
               size: {
                     box: "border-box"
              }
        });
        this.element?.classList.remove("mod--readyForAnimation");
    }
    exitDocument() {
        this.removePathChangeListener("_selectedOption", this);
        this._cancelHandleOptionsChange?.();
    }

    handleChange(event) {
        this.needsDraw = true;
    }

    /**
     * Handles changes to the options array.
     * Triggers a redraw.
     */
    handleOptionsChange(event) {
        this.needsDraw = true;
    }

    /**
     * Handles selection changes and dispatches a change event
     * @param {Object} option - The selected option object
     */
    handleSelectionChange(option) {
        if (option === undefined) return;

        const event = new CustomEvent("change", {
            detail: option,
            bubbles: true,
        });

        const selectedValue = this.valueForExpression.call(option, this.valuePath);
        this.selection = selectedValue || null;
        this.dispatchEvent(event);
        this._isChangingSelection = true;
        // Enable animations immediately for the upcoming draw
        this.element?.classList.add("mod--readyForAnimation");
        this._readyForAnimation = true;
        // Listen for transition end to disable animations
        this.thumbElement?.addEventListener("transitionend", this.handleTransitionEnd, { once: true });
        this.needsDraw = true;
    }

    /**
     * Handles the "firstDraw" event for the segments element.
     * @param {Event} event - The "firstDraw" event.
     */
    handleSegmentsFirstDraw = (event) => {
        const segmentsElement = event.target;
        segmentsElement.removeEventListener("firstDraw", this.handleSegmentsFirstDraw, false);
        this.needsDraw = true;
    };

    draw() {
        this._applyDisabledClass();

        const { segments = {} } = this.templateObjects ?? {};

        if (segments._completedFirstDraw) {
            // Move the thumb to the selected segment if available
            const { selectedIterations = [] } = segments ?? {};
            const [selectedIteration] = selectedIterations;

            if (selectedIteration) {
                this.thumbElement.style.display = "block";
                const segmentElement = selectedIteration.firstElement;
                this._moveThumbToSegment(segmentElement);
            } else {
                // If no segment is selected, hide the thumb
                this.thumbElement.style.display = "none";
            }
        } else {
            // Wait for the inner repetition segments to be drawn, before moving the thumb
            segments.addEventListener("firstDraw", this.handleSegmentsFirstDraw, false);
        }
    }

    /**
     * Handles the end of thumb transition animations
     */
    handleTransitionEnd = (event) => {
        if (this._isChangingSelection) {
            this.element?.classList.remove("mod--readyForAnimation");
            this._readyForAnimation = false;
            this._isChangingSelection = false;
        }
    };

    /**
     * Moves the thumb element to match the position and size of the selected segment
     * @private
     * @param {HTMLElement} segmentElement - The DOM element of the selected segment
     */
    _moveThumbToSegment(segmentElement) {
        if (!segmentElement || !this.thumbElement) return;

        // 1. --- BATCH READS ---
        // Read all required properties from the DOM at once.
        const { offsetHeight: height, offsetWidth: width, offsetLeft: left } = segmentElement;

        if (width === 0 || height === 0) {
            console.warn("Segment element has zero width or height, cannot position thumb.");
            return;
        }

        // 2. --- BATCH WRITES ---
        // Apply all style changes to the thumb element at once.
        this.thumbElement.style.height = `${height}px`;
        this.thumbElement.style.width = `${width}px`;
        this.thumbElement.style.transform = `translate3d(${left}px, 0, 0)`;
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
});

if (window.MontageElement) {
    MontageElement.define("segmented-control-mod", SegmentedControl);
}
