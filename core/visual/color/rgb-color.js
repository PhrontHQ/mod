const BaseColor = require("core/visual/color/base-color").BaseColor;

/**
 * Represents a color in RGBA (Red, Green, Blue, Alpha) format.
 * Extends the BaseColor class with RGB-specific functionality and conversion methods.
 *
 * RGB is the most common color representation used in digital displays and web development.
 * Each component represents the intensity of red, green, and blue light:
 * - Red: Intensity of red light (0-255)
 * - Green: Intensity of green light (0-255)
 * - Blue: Intensity of blue light (0-255)
 * - Alpha: Transparency level (0-1, where 0 is transparent and 1 is opaque)
 *
 * @class RgbColor
 * @extends BaseColor
 * @see {@link https://en.wikipedia.org/wiki/RGB_color_model} RGB Color Model Documentation
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/rgb} MDN RGB Color Reference
 * @example
 * // Create a red color
 * const red = new RgbColor(255, 0, 0, 1);
 *
 * // Create from hex string
 * const blue = RgbColor.fromString("#0000FF");
 *
 * // Create from RGB string
 * const green = RgbColor.fromString("rgb(0, 255, 0)");
 *
 * // Create semi-transparent colors
 * const semiTransparentRed = new RgbColor(255, 0, 0, 0.5);
 *
 * // Color manipulation
 * const darkerRed = red.copyWithRed(128);
 * const transparentRed = red.copyWithAlpha(0.3);
 */
exports.RgbColor = class RgbColor extends BaseColor {
    /**
     * Cached transparent color instance for performance optimization.
     * @static
     * @private
     * @type {RgbColor|null}
     */
    static #transparent = null;

    /**
     * Cached white color instance for performance optimization.
     * @static
     * @private
     * @type {RgbColor|null}
     */
    static #white = null;

    /**
     * Cached black color instance for performance optimization.
     * @static
     * @private
     * @type {RgbColor|null}
     */
    static #black = null;

    /**
     * Returns a fully transparent RGB color (black with alpha = 0).
     *
     * @static
     * @returns {RgbColor} Transparent RGB color instance (0, 0, 0, 0)
     */
    static get transparent() {
        return this.#transparent || (this.#transparent = new RgbColor(0, 0, 0, 0));
    }

    /**
     * Returns a white RGB color with full opacity.
     *
     * @static
     * @returns {RgbColor} White RGB color instance (255, 255, 255, 1)
     */
    static get white() {
        return this.#white || (this.#white = new RgbColor(255, 255, 255, 1));
    }

    /**
     * Returns a black RGB color with full opacity.
     *
     * @static
     * @returns {RgbColor} Black RGB color instance (0, 0, 0, 1)
     */
    static get black() {
        return this.#black || (this.#black = new RgbColor(0, 0, 0, 1));
    }

    /**
     * Internal storage for the red component value.
     * @private
     * @type {number}
     */
    #red = 0;

    /**
     * Sets the red component value with validation.
     * @param {number} value - Red component value (0-255, where 0=no red, 255=maximum red)
     * @throws {Error} If red is not a number or not between 0 and 255
     */
    set red(value) {
        if (typeof value !== "number" || !RgbColor.isValidRgbValue(value)) {
            throw new Error("Red value must be between 0 and 255");
        }
        this.#red = value;
    }

    /**
     * Gets the red component value (0-255).
     * @type {number}
     * @readonly
     */
    get red() {
        return this.#red;
    }

    /**
     * Internal storage for the green component value.
     * @private
     * @type {number}
     */
    #green = 0;

    /**
     * Sets the green component value with validation.
     * @param {number} value - Green component value (0-255, where 0=no green, 255=maximum green)
     * @throws {Error} If green is not a number or not between 0 and 255
     */
    set green(value) {
        if (typeof value !== "number" || !RgbColor.isValidRgbValue(value)) {
            throw new Error("Green value must be between 0 and 255");
        }
        this.#green = value;
    }

    /**
     * Gets the green component value (0-255).
     * @type {number}
     * @readonly
     */
    get green() {
        return this.#green;
    }

    /**
     * Internal storage for the blue component value.
     * @private
     * @type {number}
     */
    #blue = 0;

    /**
     * Sets the blue component value with validation.
     * @param {number} value - Blue component value (0-255, where 0=no blue, 255=maximum blue)
     * @throws {Error} If blue is not a number or not between 0 and 255
     */
    set blue(value) {
        if (typeof value !== "number" || !RgbColor.isValidRgbValue(value)) {
            throw new Error("Blue value must be between 0 and 255");
        }
        this.#blue = value;
    }

    /**
     * Gets the blue component value (0-255).
     * @type {number}
     * @readonly
     */
    get blue() {
        return this.#blue;
    }

    /**
     * Creates a new RgbColor instance with the specified RGBA values.
     * All RGB values are validated to ensure they fall within the valid range (0-255).
     * Alpha value is validated to ensure it falls within the valid range (0-1).
     *
     * @param {number} [red=0] - Red component (0-255)
     * @param {number} [green=0] - Green component (0-255)
     * @param {number} [blue=0] - Blue component (0-255)
     * @param {number} [alpha=1] - Alpha component (0-1, where 0=transparent, 1=opaque)
     * @throws {Error} If any parameter is not a number or outside its valid range
     */
    constructor(red = 0, green = 0, blue = 0, alpha = 1) {
        super(alpha);
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    /**
     * Creates an RgbColor instance from various input formats.
     * Supports strings, HSL colors, RGB colors, and arrays.
     *
     * @static
     * @param {string|RgbColor|number[]} value - The value to convert to an RgbColor
     * @returns {RgbColor} A new RgbColor instance
     * @throws {Error} If the input format is not supported or invalid
     */
    static from(value) {
        if (typeof value === "string") return this.fromString(value);
        if (value instanceof RgbColor) return value;

        if (Array.isArray(value) && value.length >= 3) {
            const [r, g, b, a = 1] = value;
            return new RgbColor(r, g, b, a);
        }

        throw new Error("Invalid color format. Expected string, RgbColor, or number array");
    }

    /**
     * Creates an RgbColor instance from HSL/HSLA values.
     *
     * @static
     * @param {number} hue - Hue component (0-360 degrees)
     * @param {number} saturation - Saturation component (0-100%)
     * @param {number} lightness - Lightness component (0-100%)
     * @param {number} [alpha=1] - Alpha component (0-1)
     * @returns {RgbColor} A new RgbColor instance
     * @throws {Error} If any HSL value is outside its valid range
     * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB} HSL to RGB conversion algorithm
     */
    static fromHsl(hue, saturation, lightness, alpha = 1) {
        const hslColor = this.fromHslToRgb(hue, saturation, lightness);
        const { red, green, blue } = hslColor;
        return new RgbColor(red, green, blue, alpha);
    }

    /**
     * Creates an RgbColor instance from a string representation.
     * Supports multiple color formats: hex, RGB, RGBA, HSL, HSLA, and CSS keywords.
     *
     * @static
     * @param {string} string - The color string to parse
     * @returns {RgbColor} A new RgbColor instance
     * @throws {Error} If the string format is not supported or invalid
     */
    static fromString(string) {
        if (typeof string !== "string") {
            throw new Error("Color string must be a string");
        }

        const normalized = string.trim().toLowerCase();

        // Try transparent keyword first
        if (this.isValidTransparentKeyword(normalized)) return this.transparent;

        // Try HSL/HSLA format
        if (normalized.startsWith("hsl")) return this.fromHslString(normalized);

        // Try hex format
        if (this.isValidHexColorString(normalized)) return this.fromHexString(normalized);

        // Try RGB/RGBA format
        if (normalized.startsWith("rgb")) return this.fromRgbString(normalized);

        // If none of the formats match, throw an error
        throw new Error(`Unsupported color format: ${string}`);
    }

    /**
     * Creates an RgbColor instance from an RGB or RGBA string.
     * Parses CSS-style rgb() and rgba() function notation.
     *
     * @static
     * @param {string} rgbaString - RGB/RGBA string (e.g., "rgb(255, 0, 0)" or "rgba(255, 0, 0, 0.5)")
     * @returns {RgbColor} A new RgbColor instance
     * @throws {Error} If the string format is invalid or values are out of range
     */
    static fromRgbString(rgbaString) {
        const { red, green, blue, alpha } = super.fromRgbString(rgbaString);
        return new RgbColor(red, green, blue, alpha);
    }

    /**
     * Creates an RgbColor instance from an HSL or HSLA string.
     * Parses CSS-style hsl() and hsla() function notation and converts to RGB.
     * Percentage notation is required for saturation and lightness components.
     *
     * @static
     * @param {string} hslString - HSL/HSLA string (e.g., "hsl(120, 100%, 50%)" or "hsla(120, 100%, 50%, 0.5)")
     * @returns {RgbColor} A new RgbColor instance
     * @throws {Error} If the string format is invalid or values are out of range
     */
    static fromHslString(hslString) {
        const { hue, saturation, lightness, alpha } = super.fromHslString(hslString);
        return this.fromHsl(hue, saturation, lightness, alpha);
    }

    /**
     * Creates an RgbColor instance from a hexadecimal color string.
     * Supports all standard hex formats with or without '#' prefix.
     *
     * @static
     * @param {string} hexString - Hex color string with optional '#' prefix
     * @returns {RgbColor} A new RgbColor instance
     * @throws {Error} If the hex format is invalid
     */
    static fromHexString(hexString) {
        const { red, green, blue, alpha } = super.fromHexString(hexString);
        return new RgbColor(red, green, blue, alpha);
    }

    /**
     * Calculates the relative luminance of the color according to WCAG 2.0.
     * Luminance is a measure of the brightness of a color as perceived by the human eye,
     * normalized to 0 for darkest black and 1 for lightest white.
     *
     * This calculation is essential for determining color contrast ratios for accessibility compliance.
     * The formula uses gamma-corrected RGB values and specific coefficients that correspond
     * to human visual sensitivity to different colors.
     *
     * @returns {number} Luminance value between 0 (darkest black) and 1 (brightest white)
     * @see {@link https://www.w3.org/TR/WCAG20/#relativeluminancedef} WCAG 2.0 Relative Luminance Definition
     * @see {@link https://www.w3.org/TR/WCAG20/#contrast-ratiodef} WCAG 2.0 Contrast Ratio Definition
     */
    getLuminance() {
        return this._getLuminance(this.red, this.green, this.blue);
    }

    /**
     * Creates a copy of the current color with a new alpha value.
     * Returns a new RgbColor instance with only the alpha channel modified.
     * The RGB components remain unchanged.
     *
     * @param {number} alpha - New alpha value (0-1, where 0=transparent, 1=opaque)
     * @returns {RgbColor} A new RgbColor instance with the updated alpha value
     * @throws {Error} If alpha value is outside the valid range (0-1)
     */
    copyWithAlpha(alpha) {
        return new RgbColor(this.red, this.green, this.blue, alpha);
    }

    /**
     * Creates a copy of the current color with full opacity (alpha = 1).
     * Returns a new RgbColor instance with the alpha channel set to fully opaque.
     * This is useful for removing transparency from a color while preserving its RGB values.
     *
     * @returns {RgbColor} A new RgbColor instance with alpha set to 1
     */
    copyWithoutAlpha() {
        return new RgbColor(this.red, this.green, this.blue, 1);
    }

    /**
     * Creates a copy of the current color with a new red value.
     * Returns a new RgbColor instance with only the red channel modified.
     * The green, blue, and alpha components remain unchanged.
     *
     * @param {number} red - New red component value (0-255)
     * @returns {RgbColor} A new RgbColor instance with the updated red value
     * @throws {Error} If red value is outside the valid range (0-255)
     */
    copyWithRed(red) {
        return new RgbColor(red, this.green, this.blue, this.alpha);
    }

    /**
     * Creates a copy of the current color with a new green value.
     * Returns a new RgbColor instance with only the green channel modified.
     * The red, blue, and alpha components remain unchanged.
     *
     * @param {number} green - New green component value (0-255)
     * @returns {RgbColor} A new RgbColor instance with the updated green value
     * @throws {Error} If green value is outside the valid range (0-255)
     */
    copyWithGreen(green) {
        return new RgbColor(this.red, green, this.blue, this.alpha);
    }

    /**
     * Creates a copy of the current color with a new blue value.
     * Returns a new RgbColor instance with only the blue channel modified.
     * The red, green, and alpha components remain unchanged.
     *
     * @param {number} blue - New blue component value (0-255)
     * @returns {RgbColor} A new RgbColor instance with the updated blue value
     * @throws {Error} If blue value is outside the valid range (0-255)
     */
    copyWithBlue(blue) {
        return new RgbColor(this.red, this.green, blue, this.alpha);
    }

    /**
     * Creates a copy of the current color with multiple updated values.
     * Returns a new RgbColor instance with any combination of RGBA values modified.
     * Invalid values are ignored and the original values are preserved for safety.
     * This method provides a convenient way to modify multiple color components at once.
     *
     * @param {Object} [values={}] - Object containing the values to update
     * @param {number} [values.red] - New red component (0-255)
     * @param {number} [values.green] - New green component (0-255)
     * @param {number} [values.blue] - New blue component (0-255)
     * @param {number} [values.alpha] - New alpha component (0-1)
     * @returns {RgbColor} A new RgbColor instance with the updated values
     */
    copyWithValues(values = {}) {
        const { red, green, blue, alpha } = values;

        return new RgbColor(
            RgbColor.isValidRgbValue(red) ? red : this.red,
            RgbColor.isValidRgbValue(green) ? green : this.green,
            RgbColor.isValidRgbValue(blue) ? blue : this.blue,
            RgbColor.isValidAlphaValue(alpha) ? alpha : this.alpha
        );
    }

    /**
     * Converts the RGB color to an HSLA string representation.
     * First converts RGB to HSL color space, then formats as CSS hsla() function.
     * Always includes the alpha component, even when fully opaque.
     *
     * @returns {string} HSLA color string (e.g., "hsla(0, 100%, 50%, 1)")
     */
    toHslaString() {
        const { hue, saturation, lightness } = this.#toHslColor();
        return this._toHslaString(hue, saturation, lightness);
    }

    /**
     * Converts the RGB color to an HSL string representation (without alpha).
     * First converts RGB to HSL color space, then formats as CSS hsl() function.
     * The alpha component is omitted, regardless of its value.
     *
     * @returns {string} HSL color string (e.g., "hsl(0, 100%, 50%)")
     */
    toHslString() {
        const { hue, saturation, lightness } = this.#toHslColor();
        return this._toHslString(hue, saturation, lightness);
    }

    /**
     * Converts the RGB color to an RGBA string representation.
     * Uses CSS rgba() function syntax with comma-separated values.
     * Always includes the alpha component, even when fully opaque.
     *
     * @returns {string} RGBA color string (e.g., "rgba(255, 0, 0, 1)")
     */
    toRgbaString() {
        return this._toRgbaString(this.red, this.green, this.blue);
    }

    /**
     * Converts the RGB color to an RGB string representation (without alpha).
     * Uses CSS rgb() function syntax with comma-separated values.
     * The alpha component is omitted, regardless of its value.
     *
     * @returns {string} RGB color string (e.g., "rgb(255, 0, 0)")
     */
    toRgbString() {
        return this._toRgbString(this.red, this.green, this.blue);
    }

    /**
     * Converts the RGB color to a short hexadecimal format if possible.
     * Returns 3-digit hex (RGB) or 4-digit hex (RGBA) when all digit pairs are identical.
     * Returns null if the color cannot be represented in short format.
     *
     * The compression is only possible when each RGB component can be represented
     * by a single hex digit repeated twice (e.g., 0x00, 0x11, 0x22, ..., 0xFF).
     *
     * @returns {string|null} Short hex string if possible (e.g., "#f00", "#f00f"), null if not compressible
     */
    toShortHexString() {
        return this._toShortHexString(this.red, this.green, this.blue);
    }

    /**
     * Converts the RGB color to a long hexadecimal format.
     * Always uses 6-digit hex (RRGGBB) for opaque colors or 8-digit hex (RRGGBBAA) for transparent colors.
     * RGB values are rounded to the nearest integer before conversion.
     *
     * @returns {string} Long hex string (e.g., "#ff0000" or "#ff0000ff")
     */
    toLongHexString() {
        return this._toLongHexString(this.red, this.green, this.blue);
    }

    /**
     * Returns the default string representation of the color.
     * Automatically chooses between RGB and RGBA format based on opacity.
     * For opaque colors (alpha = 1), uses RGB format for brevity.
     * For transparent colors (alpha < 1), uses RGBA format to preserve alpha information.
     *
     * @returns {string} RGB or RGBA color string representation
     */
    toString() {
        if (this.isOpaque()) return this.toRgbString();
        return this.toRgbaString();
    }

    /**
     * Converts the current RGB color to HSL color space.
     * This is a private helper method used internally for HSL-based operations
     * like luminance calculation and hex string generation.
     *
     * @private
     * @returns {{hue: number, saturation: number, lightness: number}}
     */
    #toHslColor() {
        return RgbColor.fromRgbToHsl(this.red, this.green, this.blue);
    }
};
