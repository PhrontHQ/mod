/*global require, exports*/

const Montage = require("core/core").Montage;
const VisualPosition = require("core/enums/visual-position").VisualPosition;
const VisualOrientation = require("core/enums/visual-orientation").VisualOrientation;
const DisplayOptions = require("core/enums/display-options").DisplayOptions;
const Component = require("ui/component").Component;

const LabeledVisual = (exports.LabeledVisual = class LabeledVisual extends Component {
    /** @lends module:"mod/ui/labeled-visual.mod".LabeledVisual# */

    // <---- Static ---->

    static VisualPosition = VisualPosition;

    static VisualOrientation = VisualOrientation;

    static DisplayOptions = DisplayOptions;

    // <---- Properties ---->
    static {
        Montage.defineProperties(this.prototype, {
            _visualPosition: { value: VisualPosition.start },
            _visualOrientation: { value: VisualOrientation.horizontal },
            _displayOptions: { value: DisplayOptions.displayBoth },
            hasTemplate: { value: true },
            converter: { value: null },
            _label: { value: null },
            defaultLabel: { value: null, enumerable: false }
        });
    }

    get VisualPosition() {
        return this._visualPosition;
    }

    /**
     * The position of the visual relative to the label.
     * @type {VisualPosition}
     * @param {VisualPosition} position - The position of the visual: "Start" or "End".
     */
    set VisualPosition(position) {
        const member = this._resolveEnumMember(VisualPosition, position);

        if (member === null) {
            console.warn('Invalid visual position: "' + position + '"');
            return;
        }

        const value = VisualPosition[member];

        if (value !== this._visualPosition) {
            this._visualPosition = value;
            this._applyVisualPositionStyles();
        }
    }

    get VisualOrientation() {
        return this._visualOrientation;
    }

    /**
     * The direction the visual and the label are laid out in.
     * @type {VisualOrientation}
     * @param {VisualOrientation} orientation - The visual orientation: "horizontal" or "vertical".
     */
    set VisualOrientation(orientation) {
        const member = this._resolveEnumMember(VisualOrientation, orientation);

        if (member === null) {
            console.warn('Invalid visual orientation: "' + orientation + '"');
            return;
        }

        const value = VisualOrientation[member];

        if (value !== this._visualOrientation) {
            this._visualOrientation = value;
            this._applyVisualOrientationStyles();
        }
    }

    get DisplayOptions() {
        return this._displayOptions;
    }

    /**
     * What parts of the component are displayed.
     * @type {DisplayOptions}
     * @param {DisplayOptions} displayOptions - "DisplayBoth", "VisualOnly" or "LabelOnly".
     */
    set DisplayOptions(displayOptions) {
        const member = this._resolveEnumMember(DisplayOptions, displayOptions);

        if (member === null) {
            console.warn('Invalid display options: "' + displayOptions + '"');
            return;
        }

        const value = DisplayOptions[member];

        if (value !== this._displayOptions) {
            this._displayOptions = value;
            this._applyDisplayOptionsStyles();
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
            this._applyVisualPositionStyles();
            this._applyVisualOrientationStyles();
            this._applyDisplayOptionsStyles();
        }
    }

    // <---- Private ---->

    /**
     * Resolves an input intended for an enum property into one of the enum's
     * member names. Member names are matched case-insensitively, and enum
     * values (such as the CSS classes they carry) are accepted as well.
     * @private
     * @returns {string|null} a member name of the enum, or null if no member matches.
     */
    _resolveEnumMember(anEnum, value) {
        if (typeof value === "string") {
            const lowerCaseValue = value.toLowerCase();

            for (const member of anEnum.members) {
                if (
                    member.toLowerCase() === lowerCaseValue ||
                    String(anEnum[member]).toLowerCase() === lowerCaseValue
                ) {
                    return member;
                }
            }
        }

        return null;
    }

    /**
     * Removes the CSS classes carried by the given enum from the classList,
     * so a single member's class can be applied.
     * @private
     */
    _deleteEnumStyles(anEnum) {
        for (const value of Object.values(anEnum)) {
            if (typeof value === "string") {
                this.classList.delete(value);
            }
        }
    }

    /**
     * Applies the current visual position's styling by updating CSS classes
     * @private
     * @see VisualPosition
     */
    _applyVisualPositionStyles() {
        this._deleteEnumStyles(VisualPosition);
        this.classList.add(this.VisualPosition);
    }

    /**
     * Applies the current visual orientation's styling by updating CSS classes
     * @private
     * @see VisualOrientation
     */
    _applyVisualOrientationStyles() {
        this._deleteEnumStyles(VisualOrientation);
        this.classList.add(this.VisualOrientation);
    }

    /**
     * Applies the current display options' styling by updating CSS classes
     * @private
     * @see DisplayOptions
     */
    _applyDisplayOptionsStyles() {
        this._deleteEnumStyles(DisplayOptions);
        this.classList.add(this.DisplayOptions);
    }
});
