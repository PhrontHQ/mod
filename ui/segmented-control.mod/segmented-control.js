const Component = require("ui/component").Component;
const Montage = require("montage").Montage;

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
            _cancelHandleOptionsChange: { value: null },
            // Indicates when the component is ready for animations
            _readyForAnimation: { value: false },
            // Controls whether animations should be enabled
            _shouldEnableAnimation: { value: false },
            _isChangingSelection: { value: false },
            // Store the previously selected segment element
            _previouslySelectedSegmentElement: { value: null },

            _finishedInitialDraw: { value: false },
            /**
             * The path to the value within each option object.
             * If options are simple values, use 'this'.
             * @type {string}
             */
            valuePath: { value: "this" },
            /**
             * The currently selected option value
             * @type {*}
             */
            selection: { value: null },

            /**
             * The disabled state of the segmented control
             * @returns {boolean} True if disabled, false otherwise
             */
            _disabled: { value: false },
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
                box: "border-box",
            },
        });
        this.element?.classList.remove("mod--readyForAnimation");
        
        // Add scroll listener to detect overflow and show/hide fade
        const segmentsElement = this.element.querySelector(".ModSegmentedControl-segments");
        if (segmentsElement) {
            this._handleSegmentsScroll = this._handleSegmentsScroll.bind(this);
            segmentsElement.addEventListener("scroll", this._handleSegmentsScroll);
            // Check initial scroll state
            this._handleSegmentsScroll();
        }
    }
    
    exitDocument() {
        this.removePathChangeListener("_selectedOption", this);
        this._cancelHandleOptionsChange?.();
        
        // Remove scroll listener
        const segmentsElement = this.element.querySelector(".ModSegmentedControl-segments");
        if (segmentsElement && this._handleSegmentsScroll) {
            segmentsElement.removeEventListener("scroll", this._handleSegmentsScroll);
        }
    }

    _handleSegmentsScroll() {
        const segmentsElement = this.element.querySelector(".ModSegmentedControl-segments");
        if (!segmentsElement) return;
        
        const isScrollable = segmentsElement.scrollWidth > segmentsElement.clientWidth;
        const isAtStart = segmentsElement.scrollLeft === 0;
        const isAtEnd = segmentsElement.scrollLeft + segmentsElement.clientWidth >= segmentsElement.scrollWidth - 1;
        
        // Show mask if scrollable and not at start or not at end
        if (isScrollable && !isAtStart && !isAtEnd) {
            // Show both fades
            segmentsElement.classList.add("mod--scrollable-both");
            segmentsElement.classList.remove("mod--scrollable-end");
            segmentsElement.classList.remove("mod--scrollable-start");
        } else if (isScrollable && isAtStart && !isAtEnd) {
            // Show only right fade
            segmentsElement.classList.add("mod--scrollable-end");
            segmentsElement.classList.remove("mod--scrollable-both");
            segmentsElement.classList.remove("mod--scrollable-start");
        } else if (isScrollable && !isAtStart && isAtEnd) {
            // Show only left fade
            segmentsElement.classList.add("mod--scrollable-start");
            segmentsElement.classList.remove("mod--scrollable-both");
            segmentsElement.classList.remove("mod--scrollable-end");
        } else {
            // No fade needed
            segmentsElement.classList.remove("mod--scrollable-both", "mod--scrollable-start", "mod--scrollable-end");
        }
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
        this.thumbElement.addEventListener("transitionend", this.handleTransitionEnd, { once: true });
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
        // if(this.selection){
        //      const { segments = {} } = this.templateObjects ?? {};
        //     const { selectedIterations = [] } = segments ?? {};
        //     const [selectedIteration] = selectedIterations;
        //     const segmentElement = selectedIteration.firstElement;
        //     this._moveThumbToSegment(segmentElement);
        //     segmentElement.classList.add("mod--active");
        // }
    };

    draw() {
        this._applyDisabledClass();

        const { segments = {} } = this.templateObjects ?? {};

        if (segments._completedFirstDraw) {
            // Move the thumb to the selected segment if available
            const { selectedIterations = [] } = segments ?? {};
            const [selectedIteration] = selectedIterations;

            if (selectedIteration) {
                const segmentElement = selectedIteration.firstElement;
                // this._moveThumbToSegment(segmentElement);
                this._animateThumbToSelection(segmentElement);
                if (!this._finishedInitialDraw) {
                    this._moveThumbToSegment(segmentElement);
                     segmentElement.classList.add("mod--active");
                    this._finishedInitialDraw = true;
                }
            } else {
                // If no segment is selected, hide the thumb
                this.thumbElement.style.opacity = "0";
                this._previouslySelectedSegmentElement = null;
            }
        } else {
            // Wait for the inner repetition segments to be drawn, before moving the thumb
            segments.addEventListener("firstDraw", this.handleSegmentsFirstDraw, false);
        }
    }

    /**
     * Animates the thumb through a sequence of steps when selection changes
     * @private
     * @param {HTMLElement} newSegmentElement - The DOM element of the newly selected segment
     */
    _animateThumbToSelection(newSegmentElement) {
        if (!newSegmentElement || !this.thumbElement) return;

        if (this._isChangingSelection && this._previouslySelectedSegmentElement) {
            // Sequence: invisible → position at old → visible → remove old highlight → slide → add new highlight → invisible
            this._executeSelectionAnimationSequence(newSegmentElement);
        } else {
            this._previouslySelectedSegmentElement = newSegmentElement;
        }
    }

    /**
     * Executes the animation sequence for selection change
     * @private
     * @param {HTMLElement} newSegmentElement - The newly selected segment
     */
    _executeSelectionAnimationSequence(newSegmentElement) {
        const oldSegmentElement = this._previouslySelectedSegmentElement;
        // if (!oldSegmentElement) return;
        // Step 1: Make thumb invisible (already invisible on initial state)
        this.thumbElement.style.opacity = "0";
        this.thumbElement.classList.remove("mod--animating");

        requestAnimationFrame(() => {
            // Step 2: Move thumb to old selection position (invisible)
            this._moveThumbToSegment(oldSegmentElement);

            requestAnimationFrame(() => {
                // Step 3: Make thumb visible
                this.thumbElement.style.opacity = "1";

                requestAnimationFrame(() => {
                    // Step 4: Remove highlighting from old selection
                    oldSegmentElement.classList.remove("mod--active");

                    requestAnimationFrame(() => {
                        // Step 5: Enable transition FIRST by adding class
                        this.thumbElement.classList.add("mod--animating");

                        requestAnimationFrame(() => {
                            // Step 5b: NOW move thumb to new selection (this will be transitioned)
                            this._moveThumbToSegment(newSegmentElement);

                            // Step 6 & 7: Add highlighting to new selection (happens during animation)

                            // Track if we've already cleaned up to avoid double execution
                            let hasCompletedAnimation = false;

                            const handleAnimationEnd = (event) => {
                                if (!hasCompletedAnimation) {
                                    hasCompletedAnimation = true;
                                    cleanup();
                                }
                            };

                            const cleanup = () => {
                                // newSegmentElement.addEventListener("transitionend", handleSegmentTransitionEnd);
                                // Add the active class FIRST, synchronously
                                newSegmentElement.classList.add("mod--active");
                                this._completeThumbAnimation();
                                this.thumbElement.removeEventListener("animationend", handleAnimationEnd);                                
                            };

                            // Listen for animation end
                            this.thumbElement.addEventListener("animationend", handleAnimationEnd);
                        });
                    });
                });
            });
        });

        this._previouslySelectedSegmentElement = newSegmentElement;
    }

    /**
     * Completes the thumb animation by hiding it and cleaning up state
     * @private
     */
    _completeThumbAnimation() {
        // Step 8: Make thumb invisible
        this.thumbElement.style.opacity = "0";
        this.thumbElement.classList.remove("mod--animating");
        this.element?.classList.remove("mod--readyForAnimation");
        this._readyForAnimation = false;
        this._isChangingSelection = false;
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
        const newRect = segmentElement.getBoundingClientRect();
        const parentRect = segmentElement.parentElement.getBoundingClientRect();
        if (width === 0 || height === 0) {
            console.warn("Segment element has zero width or height, cannot position thumb.");
            return;
        }

        // 2. --- BATCH WRITES ---
        // Apply all style changes to the thumb element at once.
        this.thumbElement.style.height = `${newRect.height}px`;
        this.thumbElement.style.width = `${newRect.width}px`;
        this.thumbElement.style.transform = `translate3d(${newRect.left - parentRect.left}px, 0, 0)`;
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
