const { VisualVariant, VisualVariantClassNames } = require("core/enums/visual-variant");
const { VisualShape, VisualShapeClassNames } = require("core/enums/visual-shape");
const { PaletteColors } = require("core/enums/palettes/palette-colors");
const { Color } = require("core/color");
const { Component } = require("ui/component");

class ThemedComponent extends Component {
    normalizeColor(color) {
        if (typeof color === "string") {
            return Color.fromString(color);
        } else if (color instanceof Color) {
            return color.value;
        }

        return null; // Default to null if color is not a string or Color instance
    }
}

/**
 * A tag component for displaying labeled items with optional dismissible functionality.
 * @class Tag
 * @extends Component
 */
const Tag = class Tag extends ThemedComponent {
    /**
     * The text content displayed in the tag
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

    _backgroundColor = null;

    get backgroundColor() {
        return this._backgroundColor || PaletteColors.gray.w100;
    }

    set backgroundColor(value) {
        if (this._backgroundColor === value) return;

        this._backgroundColor = this.normalizeColor(value);
        this.needsDraw = true;
    }

    /**
     * The shape of the tag
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

    /**
     * The variant of the tag
     * @returns {string} The current variant
     */
    _variant = VisualVariant.plain;

    get variant() {
        return this._variant;
    }

    set variant(value) {
        if (this._variant === value) return;

        if (!VisualVariant.members.includes(value)) {
            console.warn("Invalid variant value. Defaulting to 'plain'.");
            this._variant = VisualVariant.plain;
        } else {
            this._variant = VisualVariant[value];
        }

        this.needsDraw = true;
    }

    /**
     * When true, displays an X mark icon and emits a dismiss event when clicked
     * @type {boolean}
     */
    _dismissable = false;

    get dismissable() {
        return this._dismissable;
    }

    set dismissable(value) {
        if (this._dismissable === value) return;
        this._dismissable = Boolean(value);
        this.needsDraw = true;
    }

    /**
     * Visual placeholder following the same pattern as segment.mod
     * @type {*}
     */
    visual = null;

    enterDocument() {
        this.addOwnPropertyChangeListener("dismissable", this);
    }

    exitDocument() {
        this.removeOwnPropertyChangeListener("dismissable", this);
    }

    /**
     * Handles changes to the dismissable property
     */
    handleDismissableChange() {
        this.needsDraw = true;
    }

    /**
     * Handles dismiss button click events
     * @param {Event} event - The click event
     */
    handleDismissAction(event) {
        if (!this._dismissable) return;

        event.preventDefault();
        event.stopPropagation();

        const dismissEvent = new CustomEvent("dismiss", {
            detail: { tag: this },
            bubbles: true,
        });

        this.dispatchEvent(dismissEvent);
    }

    draw() {
        this._applyShapeClasses();
        this._applyVariantClasses();
        this._applyColorStyles();
        this._updateDismissButton();
    }

    /**
     * Applies CSS classes based on the current shape
     * @private
     */
    _applyShapeClasses() {
        this.element.classList.remove(...Object.values(VisualShapeClassNames.values));
        this.element.classList.add(VisualShapeClassNames[this._shape]);
    }

    /**
     * Applies CSS classes based on the current variant
     * @private
     */
    _applyVariantClasses() {
        this.element.classList.remove(...Object.values(VisualVariantClassNames.values));
        this.element.classList.add(VisualVariantClassNames[this._variant]);
    }

    /**
     * Applies color styles to the tag
     * @private
     */
    _applyColorStyles() {
        this.element.style.backgroundColor = this.backgroundColor;

        if (this.backgroundColor) {
            const luminance = this.backgroundColor.getLuminance();
            this.element.style.color = luminance > 0.5 ? PaletteColors.gray.w900 : PaletteColors.gray.w100;
        }
    }

    /**
     * Updates the visibility and functionality of the dismiss button
     * @private
     */
    _updateDismissButton() {
        if (this._dismissable) {
            this.element.classList.add("mod--dismissable");
        } else {
            this.element.classList.remove("mod--dismissable");
        }
    }
};

if (window.MontageElement) {
    MontageElement.define("tag-mod", Tag);
}

exports.Tag = Tag;
