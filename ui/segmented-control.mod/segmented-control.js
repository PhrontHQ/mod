const Component = require("ui/component").Component;

/**
 * A segmented control component that allows users to select from multiple options.
 * Displays options as segments with a sliding thumb indicator for the selected option.
 *
 * @class SegmentedControl
 * @extends Component
 */
const SegmentedControl = (exports.SegmentedControl = class SegmentedControl extends Component {
    // FIXME: @Benoit workaround: until `removeRangeAtPathChangeListener` is implemented
    _cancelHandleOptionsChange = null;

    // Indicates when the component is ready for animations
    _readyForAnimation = false;

    // Controls whether animations should be enabled
    _shouldEnableAnimation = false;

    // Tracks if we're currently resizing
    _isResizing = false;

    // Timer for resize debounce
    _resizeTimer = null;

    /**
     * The path to the value within each option object.
     * If options are simple values, use 'this'.
     * @type {string}
     */
    valuePath = "this";

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

        this.needsDraw = true;
    }

    enterDocument() {
        this._cancelHandleOptionsChange = this.addRangeAtPathChangeListener("_options", this, "handleOptionsChange");
        this.addPathChangeListener("_selectedOption", this, "handleSelectionChange");

        if (!this._resizeObserver && window.ResizeObserver) {
            // Set up the ResizeObserver to trigger a redraw when the component's size changes.
            this._resizeObserver = new ResizeObserver(this.handleResize);
            this._resizeObserver.observe(this.element);
        }

        // Fallback for browsers that do not support ResizeObserver
        // FIXME: In certain scenarios (e.g., within a succession),
        // ResizeObserver may not reliably detect size changes.
        // This fallback ensures resize events are still handled.
        window.addEventListener("resize", this.handleResize);
    }

    exitDocument() {
        this.removePathChangeListener("_selectedOption", this);
        this._cancelHandleOptionsChange?.();
        this._resizeObserver?.disconnect();
        window.removeEventListener("resize", this.handleResize);

        // Clean up resize timer if it exists
        if (this._resizeTimer) {
            clearTimeout(this._resizeTimer);
        }
    }

    /**
     * Handles resize events by marking the component for redraw.
     */
    handleResize = () => {
        this._isResizing = true;

        // Clear existing timer
        if (this._resizeTimer) {
            clearTimeout(this._resizeTimer);
        }

        this.needsDraw = true;

        // Re-enable animations after resize stops (debounced)
        this._resizeTimer = setTimeout(() => {
            this._isResizing = false;
            this.needsDraw = true;
        }, 150); // 150ms debounce delay
    };

    /**
     * Handles changes to the options array.
     * Triggers a redraw.
     */
    handleOptionsChange() {
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

    /**
     * Called before the draw cycle.
     * Disables animations if currently resizing.
     */
    willDraw() {
        if (this._isResizing && this._readyForAnimation) {
            this.element?.classList.remove("mod--readyForAnimation");
        }
    }

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

            if (!this._readyForAnimation && !this._shouldEnableAnimation) {
                // Trigger a redraw to enable animations
                this._shouldEnableAnimation = true;
                this.needsDraw = true;
                return;
            }
        } else {
            // Wait for the inner repetition segments to be drawn, before moving the thumb
            segments.addEventListener("firstDraw", this.handleSegmentsFirstDraw, false);
        }

        if (this._shouldEnableAnimation && !this._readyForAnimation && !this._isResizing) {
            // Enable animations after the initial positioning, to avoid unwanted transitions
            // Only enable if we're not currently resizing
            this.element?.classList.add("mod--readyForAnimation");
            this._readyForAnimation = true;
        }
    }

    /**
     * Called after the draw cycle.
     * Re-enables animations after resizing has stopped.
     */
    didDraw() {
        if (!this._isResizing && this._readyForAnimation) {
            // Re-enable animations after resize has stopped
            this.element?.classList.add("mod--readyForAnimation");
        }
    }

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
