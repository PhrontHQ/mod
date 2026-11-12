/*global require, exports*/

const Montage = require("core/core").Montage;
const VisualPosition = require("core/enums/visual-position").VisualPosition;
const VisualOrientation = require("core/enums/visual-orientation").VisualOrientation;
const DisplayOption = require("./enums/display-option").DisplayOption;
const Component = require("ui/component").Component;

const LabeledVisual = (exports.LabeledVisual = class LabeledVisual extends Component {
    /** @lends module:"mod/ui/labeled-visual.mod".LabeledVisual# */

    // <---- Static ---->

    static VisualPosition = VisualPosition;

    static VisualOrientation = VisualOrientation;

    static DisplayOption = DisplayOption;

    // <---- Properties ---->
    static {
        Montage.defineProperties(this.prototype, {
            _visualPosition: { value: VisualPosition.start },
            _visualOrientation: { value: VisualOrientation.horizontal },
            _displayOptions: { value: DisplayOption.displayBoth },
            hasTemplate: { value: true },
            converter: { value: null },
            _label: { value: null },
            defaultLabel: { value: null, enumerable: false }
        });
    }

    get visualPosition() {
        return this._visualPosition;
    }

    /**
     * The position of the visual relative to the label.
     * @type {VisualPosition}
     * @param {VisualPosition} position - The position of the visual: "start" or "end".
     */
    set visualPosition(position) {
        if (typeof position !== "string" || VisualPosition.intValueForMember(position) === undefined) {
            console.warn('Invalid visual position: "' + position + '"');
            return;
        }

        const value = VisualPosition[position];

        if (value !== this._visualPosition) {
            this.classList.delete(this._visualPosition);
            this._visualPosition = value;
            this.classList.add(value);
        }
    }

    get visualOrientation() {
        return this._visualOrientation;
    }

    /**
     * The direction the visual and the label are laid out in.
     * @type {VisualOrientation}
     * @param {VisualOrientation} orientation - The visual orientation: "horizontal" or "vertical".
     */
    set visualOrientation(orientation) {
        if (
            typeof orientation !== "string" ||
            VisualOrientation.intValueForMember(orientation) === undefined
        ) {
            console.warn('Invalid visual orientation: "' + orientation + '"');
            return;
        }

        const value = VisualOrientation[orientation];

        if (value !== this._visualOrientation) {
            this.classList.delete(this._visualOrientation);
            this._visualOrientation = value;
            this.classList.add(value);
        }
    }

    get displayOptions() {
        return this._displayOptions;
    }

    /**
     * What parts of the component are displayed.
     * @type {DisplayOption}
     * @param {DisplayOption} displayOptions - "displayBoth", "visualOnly" or "labelOnly".
     */
    set displayOptions(displayOptions) {
        if (
            typeof displayOptions !== "string" ||
            DisplayOption.intValueForMember(displayOptions) === undefined
        ) {
            console.warn('Invalid display options: "' + displayOptions + '"');
            return;
        }

        const value = DisplayOption[displayOptions];

        if (value !== this._displayOptions) {
            this.classList.delete(this._displayOptions);
            this._displayOptions = value;
            this.classList.add(value);
        }
    }

    /**
     * A Mod converter object used to convert or format the label displayed by
     * the LabeledVisual instance. When a new value is assigned to <code>label</code>,
     * the converter object's <code>convert()</code> method is invoked,
     * passing it the newly assigned label value.
     * @type {Property}
     * @default null
     */

    get label() {
        /*
            if there is no visual, we have no risk of showing a default value that would
            screw up a visual only configuration. When a visual is provided the default
            label is not used, and either the label or nothing is shown.
        */
        return this._label;
    }

    set label(value) {
        if (value !== this._label) {
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

            this.needsDraw = true;
        }
    }

    // <---- Life Cycle ---->

    enterDocument(firstDraw) {
        super.enterDocument?.call(this, firstDraw);

        if (firstDraw) {
            this.classList.add(this._visualPosition);
            this.classList.add(this._visualOrientation);
            this.classList.add(this._displayOptions);
        }
    }

    // <---- Private ---->

});
