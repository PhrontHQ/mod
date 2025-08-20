const BaseColor = require("core/visual/color/base-color").BaseColor;

/**
 * Represents a color in HSLA (Hue, Saturation, Lightness, Alpha) format.
 * Extends the BaseColor class with HSL-specific functionalities.
 *
 * HSL is often more intuitive for color manipulation as it separates:
 * - Hue: The color itself (0-360 degrees on the color wheel)
 * - Saturation: The intensity/purity of the color (0-100%)
 * - Lightness: How light or dark the color is (0-100%)
 * - Alpha: The transparency level (0-1, where 0 is transparent and 1 is opaque)
 *
 * HSL is particularly useful for:
 * - Creating color variations (lighter/darker, more/less saturated)
 * - Color animation and transitions
 * - Generating color palettes and themes
 * - Accessibility-conscious color adjustments
 *
 * @class HslColor
 * @extends BaseColor
 * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV} HSL Color Model Documentation
 * @see {@link https://upload.wikimedia.org/wikipedia/commons/6/6b/HSL_color_solid_cylinder_saturation_gray.png} HSL Color Model Visualization
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl} MDN HSL Color Reference
 * @example
 * // Create a red color in HSL
 * const red = new HslColor(0, 100, 50, 1);
 *
 * // Create from HSL string
 * const blue = HslColor.fromString("hsl(240, 100%, 50%)");
 *
 * // Color manipulation is intuitive with HSL
 * const lighterRed = red.copyWithLightness(75);    // Make lighter
 * const desaturatedRed = red.copyWithSaturation(50); // Make less vivid
 * const complementaryColor = red.copyWithHue(180);   // Opposite on color wheel
 */
exports.HslColor = class HslColor extends BaseColor {
    /**
     * Cached transparent color instance for performance optimization.
     * @static
     * @private
     * @type {HslColor|null}
     */
    static #transparent = null;

    /**
     * Cached white color instance for performance optimization.
     * @static
     * @private
     * @type {HslColor|null}
     */
    static #white = null;

    /**
     * Cached black color instance for performance optimization.
     * @static
     * @private
     * @type {HslColor|null}
     */
    static #black = null;

    /**
     * Returns a fully transparent HSL color (alpha = 0).
     *
     * @static
     * @returns {HslColor} Transparent HSL color instance (0, 0%, 0%, 0)
     */
    static get transparent() {
        return this.#transparent || (this.#transparent = new HslColor(0, 0, 0, 0));
    }

    /**
     * Returns a white HSL color with full opacity.
     *
     * @static
     * @returns {HslColor} White HSL color instance (0, 0%, 100%, 1)
     */
    static get white() {
        return this.#white || (this.#white = new HslColor(0, 0, 100, 1));
    }

    /**
     * Returns a black HSL color with full opacity.
     *
     * @static
     * @returns {HslColor} Black HSL color instance (0, 0%, 0%, 1)
     */
    static get black() {
        return this.#black || (this.#black = new HslColor(0, 0, 0, 1));
    }

    /**
     * Internal storage for the hue component value.
     * @private
     * @type {number}
     */
    #hue = 0;

    /**
     * Sets the hue component value with validation.
     * @param {number} value - Hue value in degrees (0-360, where 0/360=red, 120=green, 240=blue)
     * @throws {Error} If hue is not a number or not between 0 and 360
     */
    set hue(value) {
        if (typeof value !== "number" || !BaseColor.isValidHue(value)) {
            throw new Error("Hue value must be between 0 and 360");
        }
        this.#hue = value;
    }

    /**
     * Gets the hue component value in degrees (0-360).
     * @type {number}
     * @readonly
     */
    get hue() {
        return this.#hue;
    }

    /**
     * Internal storage for the saturation component value.
     * @private
     * @type {number}
     */
    #saturation = 0;

    /**
     * Sets the saturation component value with validation.
     * @param {number} value - Saturation value as percentage (0-100, where 0=grayscale, 100=pure color)
     * @throws {Error} If saturation is not a number or not between 0 and 100
     */
    set saturation(value) {
        if (typeof value !== "number" || !BaseColor.isValidSaturation(value)) {
            throw new Error("Saturation value must be between 0 and 100");
        }
        this.#saturation = value;
    }

    /**
     * Gets the saturation component value as percentage (0-100).
     * @type {number}
     * @readonly
     */
    get saturation() {
        return this.#saturation;
    }

    /**
     * Internal storage for the lightness component value.
     * @private
     * @type {number}
     */
    #lightness = 0;

    /**
     * Sets the lightness component value with validation.
     * @param {number} value - Lightness value as percentage (0-100, where 0=black, 50=normal, 100=white)
     * @throws {Error} If lightness is not a number or not between 0 and 100
     */
    set lightness(value) {
        if (typeof value !== "number" || !BaseColor.isValidLightness(value)) {
            throw new Error("Lightness value must be between 0 and 100");
        }
        this.#lightness = value;
    }

    /**
     * Gets the lightness component value as percentage (0-100).
     * @type {number}
     * @readonly
     */
    get lightness() {
        return this.#lightness;
    }

    /**
     * Creates a new HslColor instance with the specified HSL and alpha values.
     * All HSL values are validated to ensure they fall within their respective valid ranges.
     * Alpha value is validated to ensure it falls within the valid range (0-1).
     *
     * @param {number} [hue=0] - Hue in degrees (0-360, where 0/360=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta)
     * @param {number} [saturation=0] - Saturation percentage (0-100, where 0=grayscale, 100=vivid color)
     * @param {number} [lightness=0] - Lightness percentage (0-100, where 0=black, 50=normal, 100=white)
     * @param {number} [alpha=1] - Alpha component (0-1, where 0=transparent, 1=opaque)
     * @throws {Error} If any parameter is not a number or outside its valid range
     */
    constructor(hue = 0, saturation = 0, lightness = 0, alpha = 1) {
        super(alpha);
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
    }

    /**
     * Creates an HslColor instance from various input formats.
     * Supports HSL strings, RGB Color instances, HSL Color instances, and arrays.
     *
     * @static
     * @param {string|HslColor|number[]} value - The value to convert to an HslColor
     * @returns {HslColor} A new HslColor instance
     * @throws {Error} If the input format is not supported or invalid
     */
    static from(value) {
        if (typeof value === "string") return this.fromString(value);
        if (value instanceof HslColor) return value;

        if (Array.isArray(value) && value.length >= 3) {
            const [h, s, l, a = 1] = value;
            return new HslColor(h, s, l, a);
        }

        throw new Error("Invalid HSL color format. Expected string, HslColor, or number array");
    }

    /**
     * Creates an HslColor instance from RGB values.
     *
     * @static
     * @param {number} red - Red component (0-255)
     * @param {number} green - Green component (0-255)
     * @param {number} blue - Blue component (0-255)
     * @param {number} [alpha=1] - Alpha component (0-1, where 0 is transparent and 1 is opaque)
     * @returns {HslColor} A new HslColor instance
     * @throws {Error} If RGB values are out of range (0-255) or alpha is out of range (0-1)
     * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB} RGB to HSL conversion algorithm
     */
    static fromRgb(red, green, blue, alpha = 1) {
        const hslColor = this.fromRgbToHsl(red, green, blue);
        const { hue, saturation, lightness } = hslColor;
        return new HslColor(hue, saturation, lightness, alpha);
    }

    /**
     * Creates an HslColor instance from a string representation.
     * Supports HSL, HSLA formats, RGB, RGBA formats, hexadecimal strings, and CSS keywords.
     *
     * @static
     * @param {string} string - The color string to parse
     * @returns {HslColor} A new HslColor instance
     * @throws {Error} If the string format is not supported or invalid
     */
    static fromString(string) {
        if (typeof string !== "string") {
            throw new Error("Color string must be a string");
        }

        const normalized = string.trim().toLowerCase();

        // Try transparent keyword first
        if (this.isValidTransparentKeyword(normalized)) return this.transparent;

        // Try HSL/HSLA format (preferred for HSL class)
        if (normalized.startsWith("hsl")) return this.fromHslString(normalized);

        // Try hex format (converted via RGB)
        if (this.isValidHexColorString(normalized)) return this.fromHexString(normalized);
        // Try RGB/RGBA format (converted via RGB)
        if (normalized.startsWith("rgb")) return this.fromRgbString(normalized);

        // If none of the formats match, throw an error
        throw new Error(`Unsupported color format: ${string}`);
    }

    /**
     * Creates an HslColor instance from an RGB string representation.
     * Parses CSS-style rgb() and rgba() function notation and converts to HSL color space.
     *
     * @static
     * @param {string} rgbaString - RGB/RGBA string (e.g., "rgb(255, 0, 0)" or "rgba(255, 0, 0, 0.5)")
     * @returns {HslColor} A new HslColor instance
     * @throws {Error} If the RGB string format is invalid or values are out of range
     */
    static fromRgbString(rgbaString) {
        const { red, green, blue, alpha } = super.fromRgbString(rgbaString);
        return this.fromRgb(red, green, blue, alpha);
    }

    /**
     * Creates an HslColor instance from an HSL or HSLA string.
     * Parses CSS-style hsl() and hsla() function notation directly without conversion.
     * Percentage notation is required for saturation and lightness components.
     *
     * @static
     * @param {string} hslString - HSL/HSLA string (e.g., "hsl(120, 100%, 50%)" or "hsla(120, 100%, 50%, 0.5)")
     * @returns {HslColor} A new HslColor instance
     * @throws {Error} If the string format is invalid or values are out of range
     */
    static fromHslString(hslString) {
        const { hue, saturation, lightness, alpha } = super.fromHslString(hslString);
        return new HslColor(hue, saturation, lightness, alpha);
    }

    /**
     * Creates an HslColor instance from a hexadecimal string.
     * Supports all standard hex formats with or without '#' prefix.
     *
     * @static
     * @param {string} hexString - Hex color string with optional '#' prefix
     * @returns {HslColor} A new HslColor instance
     * @throws {Error} If the hex string format is invalid
     */
    static fromHexString(hexString) {
        const { red, green, blue, alpha } = super.fromHexString(hexString);
        return this.fromRgb(red, green, blue, alpha);
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
        const { red, green, blue } = this.#toRgbColor();
        return this._getLuminance(red, green, blue);
    }

    /**
     * Creates a copy of the current color with a new alpha value.
     * Returns a new HslColor instance with only the alpha channel modified.
     * The HSL components remain unchanged.
     *
     * @param {number} alpha - New alpha value (0-1, where 0=transparent, 1=opaque)
     * @returns {HslColor} New HslColor instance with updated alpha
     * @throws {Error} If alpha value is not between 0 and 1
     */
    copyWithAlpha(alpha) {
        return new HslColor(this.hue, this.saturation, this.lightness, alpha);
    }

    /**
     * Creates a copy of the current color with full opacity (alpha = 1).
     * Returns a new HslColor instance with the alpha channel set to fully opaque.
     * This is useful for removing transparency from a color while preserving its HSL values.
     *
     * @returns {HslColor} New HslColor instance with alpha set to 1
     */
    copyWithoutAlpha() {
        return new HslColor(this.hue, this.saturation, this.lightness, 1);
    }

    /**
     * Creates a copy of the current color with a new saturation value.
     * Returns a new HslColor instance with only the saturation component modified.
     * The hue, lightness, and alpha components remain unchanged.
     *
     * This is particularly useful for creating muted or vivid variations of a color.
     *
     * @param {number} saturation - New saturation value (0-100, where 0=grayscale, 100=vivid)
     * @returns {HslColor} New HslColor instance with updated saturation
     * @throws {Error} If saturation value is not between 0 and 100
     */
    copyWithSaturation(saturation) {
        return new HslColor(this.hue, saturation, this.lightness, this.alpha);
    }

    /**
     * Creates a copy of the current color with a new lightness value.
     * Returns a new HslColor instance with only the lightness component modified.
     * The hue, saturation, and alpha components remain unchanged.
     *
     * This is particularly useful for creating lighter or darker variations of a color.
     *
     * @param {number} lightness - New lightness value (0-100, where 0=black, 50=normal, 100=white)
     * @returns {HslColor} New HslColor instance with updated lightness
     * @throws {Error} If lightness value is not between 0 and 100
     */
    copyWithLightness(lightness) {
        return new HslColor(this.hue, this.saturation, lightness, this.alpha);
    }

    /**
     * Creates a copy of the current color with a new hue value.
     * Returns a new HslColor instance with only the hue component modified.
     * The saturation, lightness, and alpha components remain unchanged.
     *
     * This is particularly useful for creating complementary colors or color rotations.
     *
     * @param {number} hue - New hue value (0-360, where 0/360=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta)
     * @returns {HslColor} New HslColor instance with updated hue
     * @throws {Error} If hue value is not between 0 and 360
     */
    copyWithHue(hue) {
        return new HslColor(hue, this.saturation, this.lightness, this.alpha);
    }

    /**
     * Creates a copy of the current color with selectively updated values.
     * Returns a new HslColor instance with any combination of HSLA values modified.
     * Invalid values are ignored and the original values are preserved for safety.
     * This method provides a convenient way to modify multiple color components at once.
     *
     * @param {Object} [values={}] - Object containing values to update
     * @param {number} [values.hue] - New hue value (0-360)
     * @param {number} [values.saturation] - New saturation value (0-100)
     * @param {number} [values.lightness] - New lightness value (0-100)
     * @param {number} [values.alpha] - New alpha value (0-1)
     * @returns {HslColor} New HslColor instance with updated values
     */
    copyWithValues(values = {}) {
        const { hue, saturation, lightness, alpha } = values;

        return new HslColor(
            HslColor.isValidHue(hue) ? hue : this.hue,
            HslColor.isValidSaturation(saturation) ? saturation : this.saturation,
            HslColor.isValidLightness(lightness) ? lightness : this.lightness,
            HslColor.isValidAlphaValue(alpha) ? alpha : this.alpha
        );
    }

    /**
     * Converts the HSL color to an HSLA string representation.
     * Uses CSS hsla() function syntax with comma-separated values.
     * Always includes the alpha component, even when fully opaque.
     *
     * @returns {string} HSLA color string (e.g., "hsla(120, 100%, 50%, 1)")
     */
    toHslaString() {
        return this._toHslaString(this.hue, this.saturation, this.lightness);
    }

    /**
     * Converts the HSL color to an HSL string representation (without alpha).
     * Uses CSS hsl() function syntax with comma-separated values.
     * The alpha component is omitted, regardless of its value.
     *
     * @returns {string} HSL color string (e.g., "hsl(120, 100%, 50%)")
     */
    toHslString() {
        return this._toHslString(this.hue, this.saturation, this.lightness);
    }

    /**
     * Converts the HSL color to an RGB string representation.
     * First converts HSL to RGB color space, then formats as CSS rgb() function.
     * The alpha component is omitted, regardless of its value.
     *
     * @returns {string} RGB color string (e.g., "rgb(0, 255, 0)")
     */
    toRgbString() {
        const { red, green, blue } = this.#toRgbColor();
        return this._toRgbString(red, green, blue);
    }

    /**
     * Converts the HSL color to an RGBA string representation.
     * First converts HSL to RGB color space, then formats as CSS rgba() function.
     * Always includes the alpha component, even when fully opaque.
     *
     * @returns {string} RGBA color string (e.g., "rgba(0, 255, 0, 1)")
     */
    toRgbaString() {
        const { red, green, blue } = this.#toRgbColor();
        return  this._toRgbaString(red, green, blue);
    }

    /**
     * Converts the HSL color to a short hexadecimal string representation.
     * Returns 3-digit hex (RGB) or 4-digit hex (RGBA) when all digit pairs are identical.
     * Returns null if the color cannot be represented in short format.
     * First converts HSL to RGB, then delegates to the RGB hex formatting logic.
     *
     * @returns {string|null} Short hex string if possible (e.g., "#f00", "#f00f"), null if not compressible
     */
    toShortHexString() {
        const { red, green, blue } = this.#toRgbColor();
        return this._toShortHexString(red, green, blue);
    }

    /**
     * Converts the HSL color to a long hexadecimal string representation.
     * Always uses 6-digit hex (RRGGBB) for opaque colors or 8-digit hex (RRGGBBAA) for transparent colors.
     * First converts HSL to RGB, then delegates to the RGB hex formatting logic.
     * RGB values are rounded to the nearest integer before conversion.
     *
     * @returns {string} Long hex string (e.g., "#ff0000" or "#ff0000ff")
     */
    toLongHexString() {
        const { red, green, blue } = this.#toRgbColor();
        return this._toLongHexString(red, green, blue);
    }

    /**
     * Returns the string representation of the HSL color.
     * Automatically chooses between HSL and HSLA format based on alpha value.
     * For opaque colors (alpha = 1), uses HSL format for brevity.
     * For transparent colors (alpha < 1), uses HSLA format to preserve alpha information.
     *
     * @returns {string} HSL or HSLA color string representation
     */
    toString() {
        if (this.isOpaque()) return this.toHslString();
        return this.toHslaString();
    }

    /**
     * Converts the current HSL color to RGB color space.
     * This is a private helper method used internally for RGB-based operations
     * like luminance calculation and hex string generation.
     *
     * @private
     * @returns {{red: number, green: number, blue: number}} RGB color components (0-255)
     */
    #toRgbColor() {
        return HslColor.fromHslToRgb(this.hue, this.saturation, this.lightness);
    }
};
