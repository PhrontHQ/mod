// https://upload.wikimedia.org/wikipedia/commons/6/6b/HSL_color_solid_cylinder_saturation_gray.png
const HslaColor = (exports.HslaColor = class HslaColor {
    constructor(h, s, l, a = 1) {
        this.h = h; // Hue in degrees (0-360)
        this.s = s; // Saturation in percentage (0-100)
        this.l = l; // Lightness in percentage (0-100)
        this.a = a; // Alpha in percentage (0-1)
    }

    static fromColor(color) {
        return color.toHslColor();
    }

    toString(includeAlpha = true) {
        if (includeAlpha) {
            return `hsla(${this.h}, ${this.s}%, ${this.l}%, ${this.a})`;
        }

        return `hsl(${this.h}, ${this.s}%, ${this.l}%)`;
    }
});

exports.Color = class Color {
    // WCAG contrast ratio requirements
    // https://www.w3.org/TR/WCAG21/#contrast-minimum
    static requirements = {
        AA: { normal: 4.5, large: 3 },
        AAA: { normal: 7, large: 4.5 },
    };

    // Static transparent color property
    static get transparent() {
        return new Color(0, 0, 0, 0);
    }

    static get white() {
        return new Color(255, 255, 255, 1);
    }

    static get black() {
        return new Color(0, 0, 0, 1);
    }

    constructor(red = 0, green = 0, blue = 0, alpha = 1) {
        this.red = Math.max(0, Math.min(255, red));
        this.green = Math.max(0, Math.min(255, green));
        this.blue = Math.max(0, Math.min(255, blue));
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    static isValidRgbValue(value) {
        return value >= 0 && value <= 255;
    }

    static isValidAlphaValue(value) {
        return value >= 0 && value <= 1;
    }

    static from(color) {
        if (color instanceof Color) {
            return color;
        } else if (color instanceof HslaColor) {
            return Color.fromHslColor(color);
        } else if (typeof color === "string") {
            return Color.fromString(color);
        } else if (Array.isArray(color) && color.length >= 3) {
            const [r, g, b, a = 1] = color;
            return new Color(r, g, b, a);
        } else {
            throw new Error("Invalid color format");
        }
    }

    /**
     * Helper function to convert hue to RGB component
     * @param {number} chroma - The chroma value (max RGB component)
     * @param {number} base - The base value (min RGB component)
     * @param {number} hueOffset - The hue fraction (0-1)
     */
    static huetoRgb(chroma, base, hueOffset) {
        if (hueOffset < 0) hueOffset += 1;
        if (hueOffset > 1) hueOffset -= 1;

        if (hueOffset < 1 / 6) return chroma + (base - chroma) * 6 * hueOffset;
        if (hueOffset < 1 / 2) return base;

        if (hueOffset < 2 / 3) {
            return chroma + (base - chroma) * (2 / 3 - hueOffset) * 6;
        }

        return chroma;
    }

    /**
     * Create Color from HSL values - Hue, Saturation, Lightness, Alpha
     * @param {HslaColor} hsl - HSL object with h, s, l, and optionally a properties
     * @returns {Color} New Color instance
     * https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
     */
    static fromHslColor(hsl) {
        const h = hsl.h / 360;
        const s = hsl.s / 100;
        const l = hsl.l / 100;
        const a = hsl.a;
        let r, g, b;

        if (s === 0) {
            // achromatic (grayscale)
            r = g = b = l;
        } else {
            // chromatic (colorful)
            const chroma = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const base = 2 * l - chroma;

            r = this.huetoRgb(base, chroma, h + 1 / 3);
            g = this.huetoRgb(base, chroma, h);
            b = this.huetoRgb(base, chroma, h - 1 / 3);
        }

        return new Color(
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255),
            a
        );
    }

    // Static method to create Color from any string format
    static fromString(colorString) {
        if (typeof colorString !== "string") {
            throw new Error("Color string must be a string");
        }

        const trimmed = colorString.trim();

        // Handle cases where backgroundColor might be 'transparent', 'initial', etc.
        if (
            colorString === "transparent" ||
            colorString === "initial" ||
            colorString === "inherit" ||
            !colorString
        ) {
            return Color.transparent;
        }

        // Check if it's a hex color (starts with # or is just hex digits)
        if (trimmed.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
            return Color.fromHexString(trimmed);
        }

        // Check if it's rgba/rgb format
        if (trimmed.startsWith("rgb")) {
            return Color.fromRgbaString(trimmed);
        }

        // Check if it's hsla/hsl format
        if (trimmed.startsWith("hsl")) {
            return Color.fromHslaString(trimmed);
        }

        // If none of the formats match, throw an error
        throw new Error(`Unsupported color format: ${colorString}`);
    }

    /**
     * Parse HSLA/HSL string format
     * @param {string} hslaString - HSLA or HSL string
     * @returns {Color} New Color instance
     */
    static fromHslaString(hslaString) {
        // Match hsla(h, s%, l%, a) or hsl(h, s%, l%) format
        const hslaMatch = hslaString.match(
            /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)/
        );

        if (!hslaMatch) {
            throw new Error("Invalid HSLA/HSL color format");
        }

        const h = parseFloat(hslaMatch[1]);
        const s = parseFloat(hslaMatch[2]);
        const l = parseFloat(hslaMatch[3]);
        const a = hslaMatch[4] !== undefined ? parseFloat(hslaMatch[4]) : 1;

        return Color.fromHslColor(new HslaColor(h, s, l, a));
    }

    // Converts a hex color string to a Color object.
    // Supports hex codes:
    // - 3-digit (RGB)
    // - 4-digit (RGBA)
    // - 6-digit (RRGGBB)
    // - 8-digit (RRGGBBAA)
    static fromHexString(hexString) {
        // Remove # if present and trim
        let hex = hexString.replace("#", "").trim();

        // Expand 3-digit and 4-digit shorthand hex
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .split("")
                .map((char) => char + char)
                .join("");
        }

        // Validate hex length
        if (hex.length !== 6 && hex.length !== 8) {
            throw new Error(`Invalid hex color format: ${hexString}`);
        }

        try {
            let r, g, b, a;

            if (hex.length === 8) {
                // Parse 8-digit hex (RRGGBBAA)
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
                a = parseInt(hex.substring(6, 8), 16) / 255;
            } else {
                // Parse 6-digit hex (RRGGBB)
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
                a = 1;
            }

            return new Color(r, g, b, a);
        } catch (e) {
            throw new Error(`Invalid hex color value: ${hexString}`);
        }
    }

    static fromRgbaString(rgbaString) {
        // Match rgba(r, g, b, a) or rgb(r, g, b) format
        const rgbaMatch = rgbaString.match(
            /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)/
        );

        if (!rgbaMatch) {
            throw new Error("Invalid RGBA/RGB color format");
        }

        const r = parseFloat(rgbaMatch[1]);
        const g = parseFloat(rgbaMatch[2]);
        const b = parseFloat(rgbaMatch[3]);
        const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;

        // Ensure values are within valid ranges
        if (
            !Color.isValidRgbValue(r) ||
            !Color.isValidRgbValue(g) ||
            !Color.isValidRgbValue(b) ||
            !Color.isValidAlphaValue(a)
        ) {
            throw new Error("Color values out of range");
        }

        return new Color(r, g, b, a);
    }

    /**
     * Blends two colors using simple alpha compositing (source-over blending)
     * https://www.w3.org/TR/compositing-1/#simplealphacompositing
     * @param {Color|null} background - The background color (can be null)
     * @param {Color} foreground - The foreground color
     * @returns {Color} The blended color
     */
    static alphaBlend(background, foreground) {
        // If no background layer, return the backgroundColor
        if (!background) return foreground;

        // If backgroundColor is null, return the foreground
        if (!foreground) return background;

        // If backgroundColor is fully opaque, return it
        if (foreground.alpha === 1) return foreground;

        // If backgroundColor is fully transparent, return background
        if (foreground.alpha === 0) return background;

        // Alpha compositing formula: co = Cs x αs + Cb x αb x (1 - αs)
        // Resultant alpha of the composite: αo = αs + αb x (1 - αs)
        const foregroundColorAlpha = foreground.alpha;
        const backgroundAlpha = background.alpha;
        const topAlphaInverse = 1 - foregroundColorAlpha;
        const finalAlpha =
            foregroundColorAlpha + backgroundAlpha * topAlphaInverse;

        // Prevent division by zero
        if (finalAlpha === 0) return Color.transparent;

        const commonOptions = {
            foregroundColorAlpha,
            backgroundAlpha,
            topAlphaInverse,
            finalAlpha,
        };

        const red = this.#blendChannel(
            foreground.red,
            background.red,
            commonOptions
        );

        const green = this.#blendChannel(
            foreground.green,
            background.green,
            commonOptions
        );

        const blue = this.#blendChannel(
            foreground.blue,
            background.blue,
            commonOptions
        );

        return new Color(red, green, blue, finalAlpha);
    }

    /**
     * A helper function to blend a single color channel.
     * @private
     */
    static #blendChannel(
        foregroundChannel,
        backgroundChannel,
        {
            foregroundColorAlpha = 1,
            backgroundAlpha = 1,
            topAlphaInverse = 1,
            finalAlpha = 1,
        }
    ) {
        return (
            (foregroundColorAlpha * foregroundChannel +
                backgroundAlpha * backgroundChannel * topAlphaInverse) /
            finalAlpha
        );
    }

    /**
     * Check if the color is fully opaque (alpha = 1)
     * @returns {boolean} True if the color is fully opaque, false otherwise
     */
    isTransparent() {
        return this.alpha === 0;
    }

    /**
     * Checks if this color meets WCAG accessibility standards against a background color
     * @param {Color|string} backgroundColor - Background color to check against
     * @param {string} wcagLevel - WCAG level ('AA' or 'AAA'), default 'AA'
     * @param {string} textSize - Text size ('normal' or 'large'), default 'normal'
     * @returns {Object} Accessibility information
     */
    checkAccessibility(backgroundColor, wcagLevel = "AA", textSize = "normal") {
        const bgColor = Color.from(backgroundColor);
        const ratio = this.getContrastRatio(bgColor);
        const requiredRatio = Color.requirements[wcagLevel][textSize];
        const passes = ratio >= requiredRatio;

        return {
            ratio: ratio,
            required: requiredRatio,
            passes: passes,
            level: wcagLevel,
            textSize: textSize,
            grade: passes ? "Pass" : "Fail",
        };
    }

    // Calculate relative luminance according to WCAG 2.0
    // the relative brightness of any point in a colorspace, normalized to 0 for darkest black and 1 for lightest white
    // See <https://www.w3.org/TR/WCAG20/#relativeluminancedef>
    getLuminance() {
        const R = this._linearizeColorComponent(this.red);
        const G = this._linearizeColorComponent(this.green);
        const B = this._linearizeColorComponent(this.blue);

        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    /**
     * Calculate the contrast ratio between this color and another color
     * For semi-transparent colors, alpha-blends them over a specified background first
     * @param {Color|string} color - The other color to compare against
     * @param {Color|string|null} blendBackground - Background to blend semi-transparent colors over (default: white)
     * @returns {number} The contrast ratio (1-21)
     */
    getContrastRatio(color, blendBackground = null) {
        // Convert color to Color instance if not already
        color = Color.from(color);

        // If either color has transparency, blend it with the background first
        let color1 = this;
        let color2 = color;

        if (color1.alpha < 1 || color2.alpha < 1) {
            // Default to white background for blending if not specified
            const blendBg = blendBackground
                ? Color.from(blendBackground)
                : Color.white;

            if (color1.alpha < 1) {
                color1 = Color.alphaBlend(blendBg, color1);
            }
            if (color2.alpha < 1) {
                color2 = Color.alphaBlend(blendBg, color2);
            }
        }

        // Calculate luminance for both colors
        const luminance1 = color1.getLuminance();
        const luminance2 = color2.getLuminance();

        // Ensure lighter color is in numerator
        const lighter = Math.max(luminance1, luminance2);
        const darker = Math.min(luminance1, luminance2);

        // Calculate contrast ratio
        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Adjusts this color to meet WCAG accessibility standards against a background color
     * @param {Color|string} backgroundColor - Background color to check against
     * @param {string} wcagLevel - WCAG level ('AA' or 'AAA'), default 'AAA'
     * @param {string} textSize - Text size ('normal' or 'large'), default 'normal'
     * @param {Object} options - Additional options for adjustment
     * @param {boolean} options.adjustSaturation - Whether to try saturation adjustment if lightness fails, default false
     * @param {number} options.saturationStep - Step size for saturation adjustment (0-100), default 10
     * @param {number} options.lightnessStep - Step size for lightness adjustment (0-100), default 5
     * @param {boolean} options.preserveAlpha - Whether to preserve the original alpha value, default true
     * @param {Color|string|null} options.blendBackground - Background for alpha blending calculations, default white
     * @returns {Color} Returns this color if accessible, otherwise returns adjusted color
     */
    getAccessibleTextColor(
        backgroundColor,
        wcagLevel = "AAA",
        textSize = "normal",
        options = {}
    ) {
        // Default options
        const {
            adjustSaturation = false,
            saturationStep = 10,
            lightnessStep = 5,
            preserveAlpha = true,
            blendBackground = null,
        } = options;

        // Convert background to Color instance
        const bgColor = Color.from(backgroundColor);

        // Get target ratio from requirements
        const targetRatio = Color.requirements[wcagLevel][textSize];

        // For semi-transparent backgrounds, we need to consider the blend background
        const effectiveBgColor =
            bgColor.alpha < 1 && blendBackground
                ? Color.alphaBlend(Color.from(blendBackground), bgColor)
                : bgColor;

        // Check if current combination already meets the standard
        const currentRatio = this.getContrastRatio(
            effectiveBgColor,
            blendBackground
        );

        if (currentRatio >= targetRatio) return this; // Already accessible

        // Convert to HSL for adjustment
        const hsl = this.toHslColor();
        const originalAlpha = preserveAlpha ? hsl.a : 1;

        // For adjustment, we work with opaque colors
        hsl.a = 1;

        const bgLuminance = effectiveBgColor.getLuminance();

        // Determine if we need lighter or darker text
        const needsLighterText = bgLuminance < 0.5;

        let bestColor = this;
        let bestRatio = currentRatio;

        // Strategy 1: Try adjusting lightness only (preserves original color character)
        const lightnessResult = this._tryLightnessAdjustment(
            hsl,
            effectiveBgColor,
            targetRatio,
            needsLighterText,
            lightnessStep,
            blendBackground
        );

        if (lightnessResult.ratio >= targetRatio) {
            const resultColor = lightnessResult.color;

            if (preserveAlpha && originalAlpha < 1) {
                // Restore original alpha
                const resultHsl = resultColor.toHslColor();
                resultHsl.a = originalAlpha;
                return Color.fromHslColor(resultHsl);
            }

            return resultColor;
        }

        // Update best result from lightness adjustment
        if (lightnessResult.ratio > bestRatio) {
            bestColor = lightnessResult.color;
            bestRatio = lightnessResult.ratio;
        }

        // Strategy 2: Try saturation adjustment if enabled and lightness didn't work
        if (adjustSaturation) {
            const saturationResult = this._trySaturationAdjustment(
                hsl,
                effectiveBgColor,
                targetRatio,
                needsLighterText,
                lightnessStep,
                saturationStep,
                blendBackground
            );

            if (saturationResult.ratio >= targetRatio) {
                const resultColor = saturationResult.color;

                if (preserveAlpha && originalAlpha < 1) {
                    // Restore original alpha
                    const resultHsl = resultColor.toHslColor();
                    resultHsl.a = originalAlpha;
                    return Color.fromHslColor(resultHsl);
                }

                return resultColor;
            }

            // Update best result from saturation adjustment
            if (saturationResult.ratio > bestRatio) {
                bestColor = saturationResult.color;
                bestRatio = saturationResult.ratio;
            }
        }

        // Strategy 3: Try pure black or white as fallback
        const blackRatio = Color.black.getContrastRatio(
            effectiveBgColor,
            blendBackground
        );
        const whiteRatio = Color.white.getContrastRatio(
            effectiveBgColor,
            blendBackground
        );

        if (blackRatio >= targetRatio && blackRatio > whiteRatio) {
            if (preserveAlpha && originalAlpha < 1) {
                return new Color(0, 0, 0, originalAlpha);
            }

            return Color.black;
        } else if (whiteRatio >= targetRatio) {
            if (preserveAlpha && originalAlpha < 1) {
                return new Color(255, 255, 255, originalAlpha);
            }

            return Color.white;
        } else if (blackRatio >= bestRatio || whiteRatio >= bestRatio) {
            // If either black or white is better than our best found color, return it
            bestColor = blackRatio >= bestRatio ? Color.black : Color.white;
        }

        // Return the best we could find with restored alpha if needed
        if (preserveAlpha && originalAlpha < 1) {
            const bestHsl = bestColor.toHslColor();
            bestHsl.a = originalAlpha;
            return Color.fromHslColor(bestHsl);
        }

        return bestColor;
    }

    /**
     * Helper method to try lightness adjustment only
     * @private
     */
    _tryLightnessAdjustment(
        hsl,
        bgColor,
        targetRatio,
        needsLighterText,
        step,
        blendBackground = null
    ) {
        let bestColor = this;
        let bestRatio = this.getContrastRatio(bgColor, blendBackground);

        const stepDirection = needsLighterText ? step : -step;
        const limit = needsLighterText ? 100 : 0;

        for (
            let lightness = hsl.l;
            needsLighterText ? lightness <= limit : lightness >= limit;
            lightness += stepDirection
        ) {
            const adjustedHsl = {
                ...hsl,
                l: Math.max(0, Math.min(100, lightness)),
            };

            const adjustedColor = Color.fromHslColor(adjustedHsl);
            const ratio = adjustedColor.getContrastRatio(
                bgColor,
                blendBackground
            );

            if (ratio >= targetRatio) {
                return { color: adjustedColor, ratio };
            }

            // Keep track of best option found so far
            if (ratio > bestRatio) {
                bestRatio = ratio;
                bestColor = adjustedColor;
            }
        }

        return { color: bestColor, ratio: bestRatio };
    }

    /**
     * Helper method to try saturation + lightness adjustment
     * @private
     */
    _trySaturationAdjustment(
        hsl,
        bgColor,
        targetRatio,
        needsLighterText,
        lightnessStep,
        saturationStep,
        blendBackground = null
    ) {
        let bestColor = this;
        let bestRatio = this.getContrastRatio(bgColor, blendBackground);

        // Try reducing saturation in steps
        for (
            let saturation = hsl.s;
            saturation >= 0;
            saturation -= saturationStep
        ) {
            // For each saturation level, try lightness adjustments
            const tempHsl = { ...hsl, s: Math.max(0, saturation) };

            const lightnessResult = this._tryLightnessAdjustmentWithHsl(
                tempHsl,
                bgColor,
                targetRatio,
                needsLighterText,
                lightnessStep,
                blendBackground
            );

            if (lightnessResult.ratio >= targetRatio) {
                return lightnessResult;
            }

            // Update best result
            if (lightnessResult.ratio > bestRatio) {
                bestColor = lightnessResult.color;
                bestRatio = lightnessResult.ratio;
            }
        }

        return { color: bestColor, ratio: bestRatio };
    }

    /**
     * Helper method to try lightness adjustment with a given HSL base
     * @private
     */
    _tryLightnessAdjustmentWithHsl(
        hsl,
        bgColor,
        targetRatio,
        needsLighterText,
        step,
        blendBackground = null
    ) {
        let bestColor = Color.fromHslColor(hsl);
        let bestRatio = bestColor.getContrastRatio(bgColor, blendBackground);

        const stepDirection = needsLighterText ? step : -step;
        const limit = needsLighterText ? 100 : 0;

        for (
            let lightness = hsl.l;
            needsLighterText ? lightness <= limit : lightness >= limit;
            lightness += stepDirection
        ) {
            const adjustedHsl = {
                ...hsl,
                l: Math.max(0, Math.min(100, lightness)),
            };

            const adjustedColor = Color.fromHslColor(adjustedHsl);
            const ratio = adjustedColor.getContrastRatio(
                bgColor,
                blendBackground
            );

            if (ratio >= targetRatio) {
                return { color: adjustedColor, ratio };
            }

            // Keep track of best option found so far
            if (ratio > bestRatio) {
                bestRatio = ratio;
                bestColor = adjustedColor;
            }
        }

        return { color: bestColor, ratio: bestRatio };
    }

    /**
     * Convert RGB to HSL with alpha channel
     * @returns {HslaColor} HSLA object with h, s, l, a properties
     */
    toHslColor() {
        const r = this.red / 255;
        const g = this.green / 255;
        const b = this.blue / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        let h;
        let s;

        // Calculate lightness
        let l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            // Calculate saturation
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            // Calculate hue
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        // Include alpha channel in the result
        return new HslaColor(h * 360, s * 100, l * 100, this.alpha);
    }

    // Convert back to hex string
    toHex(includeAlpha = true) {
        const red = Math.round(this.red).toString(16).padStart(2, "0");
        const gren = Math.round(this.green).toString(16).padStart(2, "0");
        const blue = Math.round(this.blue).toString(16).padStart(2, "0");

        if (includeAlpha) {
            const alpha = Math.round(this.alpha * 255)
                .toString(16)
                .padStart(2, "0");

            return `#${red}${gren}${blue}${alpha}`;
        }

        return `#${red}${gren}${blue}`;
    }

    // Convert to CSS rgba string
    toRgba() {
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
    }

    // Convert to CSS rgb string
    toRgb() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }

    toString() {
        return this.toRgba();
    }

    // Helper method to linearize color components for luminance calculation
    // See <https://www.w3.org/TR/WCAG20/#relativeluminancedef>
    _linearizeColorComponent(component) {
        // Normalize to 0-1 range
        const normalized = component / 255;

        // Apply gamma correction according to WCAG 2.0 spec
        if (normalized <= 0.03928) return normalized / 12.92;

        return Math.pow((normalized + 0.055) / 1.055, 2.4);
    }
};
