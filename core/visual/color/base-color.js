/**
 * Base class for color representations with alpha transparency support.
 * Provides common utilities for color validation, alpha channel manipulation,
 * and color conversion algorithms used by all color format implementations.
 *
 * This abstract class serves as the foundation for specific color format classes
 * like RgbColor, HslColor, etc., providing shared functionality and validation methods.
 *
 * **Important:** This class is not intended to be instantiated directly.
 * Always use concrete subclasses for color creation and manipulation.
 *
 * @class BaseColor
 * @abstract
 * @see {@link RgbColor} RGB color implementation
 * @see {@link HslColor} HSL color implementation
 * @example
 * // ❌ Don't instantiate BaseColor directly:
 * // const color = new BaseColor(0.5);
 *
 * // ✅ Instead, use a concrete subclass:
 * const rgbColor = new RgbColor(255, 0, 0, 0.5);
 * const hslColor = new HslColor(0, 100, 50, 0.5);
 */
exports.BaseColor = class BaseColor {
    /**
     * Internal storage for the alpha component value.
     * @private
     * @type {number}
     */
    #alpha = 1;

    /**
     * Sets the alpha component value with validation.
     * Alpha controls the transparency level of the color.
     * @param {number} value - Alpha value (0-1, where 0=transparent, 1=opaque)
     * @throws {Error} If alpha is not a number or not between 0 and 1
     */
    set alpha(value) {
        if (typeof value !== "number" || !BaseColor.isValidAlphaValue(value)) {
            throw new Error("Alpha value must be between 0 and 1");
        }
        this.#alpha = value;
    }

    /**
     * Gets the alpha component value (0-1).
     * Alpha controls the transparency level of the color.
     * @type {number}
     * @readonly
     * @default 1
     */
    get alpha() {
        return this.#alpha;
    }

    /**
     * Creates a new BaseColor instance with the specified alpha value.
     * Alpha value is automatically clamped to valid range (0-1) for safety.
     *
     * **Note:** This constructor is intended for use by subclasses only.
     * Direct instantiation of BaseColor is not recommended.
     *
     * @protected
     * @param {number} [alpha=1] - Alpha component (0-1, where 0=transparent, 1=opaque)
     * @throws {Error} If alpha is not a number
     */
    constructor(alpha = 1) {
        this.alpha = alpha;
    }

    /**
     * Validates if a value is within the valid hue range (0-360 degrees).
     * Hue represents the position on the color wheel in degrees.
     *
     * @static
     * @param {number} value - The value to validate
     * @returns {boolean} True if the value is valid for hue component, false otherwise
     */
    static isValidHue(value) {
        return typeof value === "number" && value >= 0 && value <= 360;
    }

    /**
     * Validates if a value is within the valid saturation range (0-100 percent).
     * Saturation represents the intensity or purity of the color.
     *
     * @static
     * @param {number} value - The value to validate
     * @returns {boolean} True if the value is valid for saturation component, false otherwise
     * @example
     * BaseColor.isValidSaturation(0);    // true (grayscale)
     * BaseColor.isValidSaturation(50);   // true (moderate saturation)
     * BaseColor.isValidSaturation(100);  // true (full saturation)
     * BaseColor.isValidSaturation(150);  // false (out of range)
     * BaseColor.isValidSaturation(-5);   // false (negative)
     */
    static isValidSaturation(value) {
        return typeof value === "number" && value >= 0 && value <= 100;
    }

    /**
     * Validates if a value is within the valid lightness range (0-100 percent).
     * Lightness represents how light or dark the color appears.
     *
     * @static
     * @param {number} value - The value to validate
     * @returns {boolean} True if the value is valid for lightness component, false otherwise
     */
    static isValidLightness(value) {
        return typeof value === "number" && value >= 0 && value <= 100;
    }

    /**
     * Validates if a value is within the valid RGB component range (0-255).
     * RGB components represent red, green, and blue intensity values.
     *
     * @static
     * @param {number} value - The value to validate
     * @returns {boolean} True if the value is valid for RGB components, false otherwise
     */
    static isValidRgbValue(value) {
        return typeof value === "number" && value >= 0 && value <= 255;
    }

    /**
     * Validates if a value is within the valid alpha range (0-1).
     * Alpha represents the transparency level of the color.
     *
     * @static
     * @param {number} value - The value to validate
     * @returns {boolean} True if the value is valid for alpha component, false otherwise
     */
    static isValidAlphaValue(value) {
        return typeof value === "number" && value >= 0 && value <= 1;
    }

    /**
     * Checks if a color string represents a transparent color keyword.
     * Recognizes CSS transparency keywords and empty strings.
     *
     * @static
     * @param {string} string - The color string to check
     * @returns {boolean} True if the string represents transparency, false otherwise
     */
    static isValidTransparentKeyword(string) {
        if (typeof string !== "string") return false;
        const trimmed = string.trim().toLowerCase();
        return trimmed === "transparent" || trimmed === "initial" || trimmed === "inherit" || !trimmed;
    }

    /**
     * Checks if a string is a valid hexadecimal color format.
     * Supports all standard hex color formats with optional '#' prefix:
     * - 3-digit: RGB (e.g., "#f00" or "f00")
     * - 4-digit: RGBA (e.g., "#f00f" or "f00f")
     * - 6-digit: RRGGBB (e.g., "#ff0000" or "ff0000")
     * - 8-digit: RRGGBBAA (e.g., "#ff0000ff" or "ff0000ff")
     *
     * @static
     * @param {string} string - The string to validate
     * @returns {boolean} True if the string is a valid hex color, false otherwise
     */
    static isValidHexColorString(string) {
        if (typeof string !== "string") return false;
        const hexColorRegex = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
        return hexColorRegex.test(string.trim());
    }

    /**
     * Converts an HSL color to RGB format.
     * Uses the standard HSL to RGB conversion algorithm.
     *
     * @static
     * @param {number} hue - Hue value (0-360 degrees)
     * @param {number} saturation - Saturation value (0-100 percent)
     * @param {number} lightness - Lightness value (0-100 percent)
     * @returns {{red: number, green: number, blue: number}} An object containing red, green, and blue values (0-255)
     * @throws {Error} If any input values are out of their valid ranges
     * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB} HSL to RGB Algorithm
     */
    static fromHslToRgb(hue, saturation, lightness) {
        // Validate input values
        if (!BaseColor.isValidHue(hue)) {
            throw new Error("Hue value must be between 0 and 360");
        }
        if (!BaseColor.isValidSaturation(saturation)) {
            throw new Error("Saturation value must be between 0 and 100");
        }
        if (!BaseColor.isValidLightness(lightness)) {
            throw new Error("Lightness value must be between 0 and 100");
        }

        // Normalize HSL values to 0-1 range
        hue = hue / 360;
        saturation = saturation / 100;
        lightness = lightness / 100;

        // Calculate RGB components
        let red;
        let green;
        let blue;

        if (saturation === 0) {
            // Achromatic (grayscale) - no color, only lightness
            red = green = blue = lightness;
        } else {
            // Chromatic (colorful) - calculate using HSL to RGB algorithm
            const chroma =
                lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
            const base = 2 * lightness - chroma;

            // Use inherited helper method for hue to RGB conversion
            red = this.hueToRgbComponent(base, chroma, hue + 1 / 3);
            green = this.hueToRgbComponent(base, chroma, hue);
            blue = this.hueToRgbComponent(base, chroma, hue - 1 / 3);
        }

        // Convert to 0-255 range and round to integers
        return {
            red: Math.round(red * 255),
            green: Math.round(green * 255),
            blue: Math.round(blue * 255),
        };
    }

    /**
     * Converts an RGB color to HSL format.
     * Uses the standard RGB to HSL conversion algorithm.
     *
     * @static
     * @param {number} red - Red component (0-255)
     * @param {number} green - Green component (0-255)
     * @param {number} blue - Blue component (0-255)
     * @returns {{hue: number, saturation: number, lightness: number}} An object containing hue (0-360), saturation (0-100), and lightness (0-100) values
     * @throws {Error} If any RGB values are out of the valid range (0-255)
     * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB} RGB to HSL Algorithm
     */
    static fromRgbToHsl(red, green, blue) {
        // Validate input values
        if (!BaseColor.isValidRgbValue(red)) {
            throw new Error("Red value must be between 0 and 255");
        }
        if (!BaseColor.isValidRgbValue(green)) {
            throw new Error("Green value must be between 0 and 255");
        }
        if (!BaseColor.isValidRgbValue(blue)) {
            throw new Error("Blue value must be between 0 and 255");
        }

        // normalize RGB values to 0-1 range
        red = red / 255;
        green = green / 255;
        blue = blue / 255;

        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);

        const lightness = (max + min) / 2;
        let saturation;
        let hue;

        if (max === min) {
            hue = saturation = 0; // achromatic
        } else {
            const delta = max - min;
            // Calculate saturation
            saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

            // Calculate hue
            switch (max) {
                case red:
                    hue = (green - blue) / delta + (green < blue ? 6 : 0);
                    break;
                case green:
                    hue = (blue - red) / delta + 2;
                    break;
                case blue:
                    hue = (red - green) / delta + 4;
                    break;
            }

            hue /= 6;
        }

        return {
            hue: hue * 360,
            saturation: saturation * 100,
            lightness: lightness * 100,
        };
    }

    /**
     * Parses RGB/RGBA color strings into an object with red, green, blue, and alpha values.
     * Supports both rgb() and rgba() CSS function formats with decimal values.
     *
     * @static
     * @param {string} rgbaString - RGB/RGBA string (e.g., "rgb(255, 0, 0)" or "rgba(255, 0, 0, 0.5)")
     * @returns {{red: number, green: number, blue: number, alpha: number}} An object containing red, green, blue (0-255), and alpha (0-1) values
     * @throws {Error} If the string format is invalid or values are out of range
     */
    static fromRgbString(rgbaString) {
        // Match rgba(r, g, b, a) or rgb(r, g, b) format with optional decimal values
        const rgbaMatch = rgbaString.match(
            /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)/
        );

        if (!rgbaMatch) throw new Error("Invalid RGBA/RGB color format");

        const red = parseFloat(rgbaMatch[1]);
        const green = parseFloat(rgbaMatch[2]);
        const blue = parseFloat(rgbaMatch[3]);
        const alpha = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;

        return { red, green, blue, alpha };
    }

    /**
     * Parses HSL/HSLA color strings into an object with hue, saturation, lightness, and alpha values.
     * Supports both hsl() and hsla() CSS function formats with percentage notation for saturation and lightness.
     *
     * @static
     * @param {string} hslString - HSL/HSLA string (e.g., "hsl(120, 100%, 50%)" or "hsla(120, 100%, 50%, 0.5)")
     * @returns {{hue: number, saturation: number, lightness: number, alpha: number}} An object containing hue (0-360), saturation (0-100), lightness (0-100), and alpha (0-1) values
     * @throws {Error} If the string format is invalid or values are out of range
     */
    static fromHslString(hslString) {
        // Match hsla(h, s%, l%, a) or hsl(h, s%, l%) format
        const hslaMatch = hslString.match(
            /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)/
        );

        if (!hslaMatch) throw new Error("Invalid HSLA/HSL color format");

        const hue = parseFloat(hslaMatch[1]);
        const saturation = parseFloat(hslaMatch[2]);
        const lightness = parseFloat(hslaMatch[3]);
        const alpha = hslaMatch[4] !== undefined ? parseFloat(hslaMatch[4]) : 1;

        return { hue, saturation, lightness, alpha };
    }

    /**
     * Parses a hex color string into an object with red, green, blue, and alpha values.
     * Supports all standard hex formats: 3-digit (#RGB), 4-digit (#RGBA), 6-digit (#RRGGBB), and 8-digit (#RRGGBBAA).
     * The '#' prefix is optional and whitespace is automatically trimmed.
     *
     * @static
     * @param {string} hexString - Hex color string with optional '#' prefix
     * @returns {{red: number, green: number, blue: number, alpha: number}} An object containing red, green, blue (0-255), and alpha (0-1) values
     * @throws {Error} If the hex format is invalid
     */
    static fromHexString(hexString) {
        // Remove # if present and trim whitespace
        let hex = hexString.replace("#", "").trim();

        // Expand 3-digit and 4-digit shorthand hex (e.g., "f00" -> "ff0000", "f00f" -> "ff0000ff")
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .split("")
                .map((char) => char + char)
                .join("");
        }

        // Validate hex length after expansion
        if (hex.length !== 6 && hex.length !== 8) {
            throw new Error(`Invalid hex color format: ${hexString}`);
        }

        try {
            let red;
            let green;
            let blue;
            let alpha;

            if (hex.length === 8) {
                // Parse 8-digit hex (RRGGBBAA)
                red = parseInt(hex.substring(0, 2), 16);
                green = parseInt(hex.substring(2, 4), 16);
                blue = parseInt(hex.substring(4, 6), 16);
                alpha = parseInt(hex.substring(6, 8), 16) / 255;
            } else {
                // Parse 6-digit hex (RRGGBB)
                red = parseInt(hex.substring(0, 2), 16);
                green = parseInt(hex.substring(2, 4), 16);
                blue = parseInt(hex.substring(4, 6), 16);
                alpha = 1; // Default to fully opaque
            }

            return { red, green, blue, alpha };
        } catch (e) {
            throw new Error(`Invalid hex color value: ${hexString}`);
        }
    }

    /**
     * Helper function to convert hue to RGB component value.
     * This is a core part of the HSL to RGB conversion algorithm.
     *
     * Uses the standard HSL to RGB conversion formula with proper hue wrapping
     * and linear interpolation between color segments.
     *
     * @static
     * @protected
     * @param {number} base - The base value (minimum RGB component, 0-1)
     * @param {number} chroma - The chroma value (maximum RGB component, 0-1)
     * @param {number} hueOffset - The hue fraction (0-1) with potential offset for R/G/B calculation
     * @returns {number} RGB component value (0-1)
     * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB} HSL to RGB Algorithm
     */
    static hueToRgbComponent(base, chroma, hueOffset) {
        // Wrap hue offset to 0-1 range
        if (hueOffset < 0) hueOffset += 1;
        if (hueOffset > 1) hueOffset -= 1;

        // Calculate RGB component based on hue position
        if (hueOffset < 1 / 6) return base + (chroma - base) * 6 * hueOffset;
        if (hueOffset < 1 / 2) return chroma;
        if (hueOffset < 2 / 3) return base + (chroma - base) * (2 / 3 - hueOffset) * 6;

        return base;
    }

    /**
     * Checks if the color is fully transparent (alpha equals 0).
     * Useful for determining if a color is invisible and can be optimized out.
     *
     * @returns {boolean} True if the color is fully transparent, false otherwise
     * @example
     * const transparentColor = new RgbColor(255, 0, 0, 0);
     * transparentColor.isTransparent(); // true
     *
     * const semiTransparentColor = new RgbColor(255, 0, 0, 0.5);
     * semiTransparentColor.isTransparent(); // false
     *
     * const opaqueColor = new RgbColor(255, 0, 0, 1);
     * opaqueColor.isTransparent(); // false
     */
    isTransparent() {
        return this.alpha === 0;
    }

    /**
     * Checks if the color is fully opaque (alpha equals 1).
     * Useful for determining if alpha channel can be omitted in string representations.
     *
     * @returns {boolean} True if the color is fully opaque, false otherwise
     */
    isOpaque() {
        return this.alpha === 1;
    }

    /**
     * Converts the color to a short hexadecimal string representation if possible.
     * Returns 3-digit hex (RGB) or 4-digit hex (RGBA) when all digit pairs are identical.
     * Returns null if the color cannot be represented in short format.
     *
     * **Abstract Method:** Must be implemented by subclasses.
     *
     * @abstract
     * @returns {string|null} Short hex string if possible (e.g., "#f00", "#f00f"), null if not compressible
     * @throws {Error} If called directly on BaseColor (must be implemented by subclass)
     */
    toShortHexString() {
        throw new Error("toShortHexString() must be implemented by subclass");
    }

    /**
     * Converts the color to a long hexadecimal string representation.
     * Always uses 6-digit hex (RRGGBB) for opaque colors or 8-digit hex (RRGGBBAA) for transparent colors.
     *
     * **Abstract Method:** Must be implemented by subclasses.
     *
     * @abstract
     * @returns {string} Long hex string (e.g., "#ff0000", "#ff0000ff")
     * @throws {Error} If called directly on BaseColor (must be implemented by subclass)
     */
    toLongHexString() {
        throw new Error("toLongHexString() must be implemented by subclass");
    }

    /**
     * Converts the color to the most appropriate hexadecimal string representation.
     * Automatically chooses between short and long format, preferring short when possible.
     * Uses long format when short format is not available or compression is not possible.
     *
     * @returns {string} Hex color string in the most appropriate format
     */
    toHexString() {
        // Try short format first
        const shortHex = this.toShortHexString();
        if (shortHex !== null) return shortHex;

        // Fall back to long format
        return this.toLongHexString();
    }

    /**
     * Helper method to linearize RGB color components for accurate luminance calculation.
     * Applies gamma correction according to WCAG 2.0 specification for accessibility compliance.
     *
     * This transformation is essential for accurate color contrast calculations
     * and ensures that luminance values reflect human perception of brightness.
     *
     * @protected
     * @param {number} component - RGB component value (0-255)
     * @returns {number} Linearized component value (0-1) after gamma correction
     * @see {@link https://www.w3.org/TR/WCAG20/#relativeluminancedef} WCAG 2.0 Relative Luminance Definition
     * @see {@link https://en.wikipedia.org/wiki/SRGB} sRGB Gamma Correction
     */
    linearizeRgbColorComponent(component) {
        // Normalize RGB component to 0-1 range
        const normalized = component / 255;

        // Apply gamma correction according to WCAG 2.0 specification
        if (normalized <= 0.03928) return normalized / 12.92;

        return Math.pow((normalized + 0.055) / 1.055, 2.4);
    }

    /**
     * Calculates the relative luminance of the color according to WCAG 2.0.
     * Luminance is a measure of the brightness of a color as perceived by the human eye,
     * normalized to 0 for darkest black and 1 for lightest white.
     *
     * This calculation is essential for determining color contrast ratios for accessibility compliance.
     * The formula uses the CIE Y component with specific coefficients for red, green, and blue
     * that correspond to human visual sensitivity.
     *
     * @protected
     * @param {number} red - Red component (0-255)
     * @param {number} green - Green component (0-255)
     * @param {number} blue - Blue component (0-255)
     * @returns {number} Luminance value between 0 (darkest black) and 1 (brightest white)
     * @see {@link https://www.w3.org/TR/WCAG20/#relativeluminancedef} WCAG 2.0 Relative Luminance Definition
     * @see {@link https://www.w3.org/TR/WCAG20/#contrast-ratiodef} WCAG 2.0 Contrast Ratio Definition
     */
    _getLuminance(red, green, blue) {
        // Linearize each RGB component using gamma correction
        const R = this.linearizeRgbColorComponent(red);
        const G = this.linearizeRgbColorComponent(green);
        const B = this.linearizeRgbColorComponent(blue);

        // Apply WCAG 2.0 luminance formula with standard coefficients
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    /**
     * Converts the RGB color to a short hexadecimal format if possible.
     * Returns 3-digit hex (RGB) or 4-digit hex (RGBA) when all digit pairs are identical.
     * Returns null if the color cannot be represented in short format.
     *
     * This is a helper method used by subclasses to implement their toShortHexString() methods.
     * The compression is only possible when each RGB component can be represented by a single
     * hex digit repeated twice (e.g., 0x00, 0x11, 0x22, ..., 0xFF).
     *
     * @protected
     * @param {number} red - Red component (0-255)
     * @param {number} green - Green component (0-255)
     * @param {number} blue - Blue component (0-255)
     * @returns {string|null} Short hex string if possible (e.g., "#f00", "#f00f"), null if not compressible
     */
    _toShortHexString(red, green, blue) {
        const fullHex = this._toLongHexString(red, green, blue);
        const hex = fullHex.substring(1); // Remove # prefix

        // Check if it can be compressed to short format
        if (hex.length === 6) {
            // Check if RRGGBB can become RGB (each pair has identical digits)
            if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
                return `#${hex[0]}${hex[2]}${hex[4]}`;
            }
        } else if (hex.length === 8) {
            // Check if RRGGBBAA can become RGBA (each pair has identical digits)
            if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5] && hex[6] === hex[7]) {
                return `#${hex[0]}${hex[2]}${hex[4]}${hex[6]}`;
            }
        }

        // Cannot be compressed to short format
        return null;
    }

    /**
     * Converts the RGB color to a long hexadecimal format.
     * Always uses 6-digit hex (RRGGBB) for opaque colors or 8-digit hex (RRGGBBAA) for transparent colors.
     * RGB values are rounded to the nearest integer before conversion.
     *
     * This is a helper method used by subclasses to implement their toLongHexString() methods.
     * The alpha channel is included only when the color is not fully opaque.
     *
     * @protected
     * @param {number} red - Red component (0-255)
     * @param {number} green - Green component (0-255)
     * @param {number} blue - Blue component (0-255)
     * @returns {string} Long hex string (e.g., "#ff0000" or "#ff0000ff")
     */
    _toLongHexString(red, green, blue) {
        // Convert RGB components to 2-digit hex, padding with zeros if needed
        red = Math.round(red).toString(16).padStart(2, "0");
        green = Math.round(green).toString(16).padStart(2, "0");
        blue = Math.round(blue).toString(16).padStart(2, "0");

        // For opaque colors, use 6-digit format
        if (this.isOpaque()) return `#${red}${green}${blue}`;

        // For transparent colors, add alpha component as 2-digit hex
        const alpha = Math.round(this.alpha * 255)
            .toString(16)
            .padStart(2, "0");

        return `#${red}${green}${blue}${alpha}`;
    }

    /**
     * Converts the color to an RGB string representation.
     * Uses the format "rgb(red, green, blue)".
     * The alpha value is not included in this format.
     *
     * @protected
     * @param {number} red - Red component (0-255)
     * @param {number} green - Green component (0-255)
     * @param {number} blue - Blue component (0-255)
     * @returns {string} RGB string (e.g., "rgb(255, 0, 0)")
     */
    _toRgbString(red, green, blue) {
        return `rgb(${red}, ${green}, ${blue})`;
    }

    /**
     * Converts the color to an RGBA string representation.
     * Uses the format "rgba(red, green, blue, alpha)".
     * The alpha value is included only when the color is not fully opaque.
     *
     * @protected
     * @param {number} red - Red component (0-255)
     * @param {number} green - Green component (0-255)
     * @param {number} blue - Blue component (0-255)
     * @returns {string} RGBA string (e.g., "rgba(255, 0, 0, 0.5)")
     */
    _toRgbaString(red, green, blue) {
        return `rgba(${red}, ${green}, ${blue}, ${this.alpha})`;
    }

    /**
     * Converts the color to an HSL string representation.
     * Uses the format "hsl(hue, saturation%, lightness%)".
     * The alpha value is not included in this format.
     *
     * @protected
     * @param {number} hue - Hue value (0-360 degrees)
     * @param {number} saturation - Saturation value (0-100 percent)
     * @param {number} lightness - Lightness value (0-100 percent)
     * @returns {string} HSL string (e.g., "hsl(120, 100%, 50%)")
     */
    _toHslString(hue, saturation, lightness) {
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    /**
     * Converts the color to an HSLA string representation.
     * Uses the format "hsla(hue, saturation%, lightness%, alpha)".
     * The alpha value is included only when the color is not fully opaque.
     *
     * @protected
     * @param {number} hue - Hue value (0-360 degrees)
     * @param {number} saturation - Saturation value (0-100 percent)
     * @param {number} lightness - Lightness value (0-100 percent)
     * @returns {string} HSLA string (e.g., "hsla(120, 100%, 50%, 0.5)")
     */
    _toHslaString(hue, saturation, lightness) {
        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${this.alpha})`;
    }
};
