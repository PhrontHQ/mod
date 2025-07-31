class Color {
    // Static transparent color property
    static get transparent() {
        return new Color(0, 0, 0, 0);
    }

    constructor(red = 0, green = 0, blue = 0, alpha = 1) {
        this.red = Math.max(0, Math.min(255, red));
        this.green = Math.max(0, Math.min(255, green));
        this.blue = Math.max(0, Math.min(255, blue));
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    // Static method to create Color from any string format
    static fromString(colorString) {
        if (typeof colorString !== "string") {
            throw new Error("Color string must be a string");
        }

        const trimmed = colorString.trim();

        // Check if it's a hex color (starts with # or is just hex digits)
        if (trimmed.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
            return Color.fromHex(trimmed);
        }

        // Check if it's rgba/rgb format
        if (trimmed.startsWith("rgb")) {
            return Color.fromRgba(trimmed);
        }

        // If none of the formats match, throw an error
        throw new Error(`Unsupported color format: ${colorString}`);
    }

    // Converts a hex color string to a Color object.
    // Supports hex codes:
    // - 3-digit (RGB)
    // - 4-digit (RGBA)
    // - 6-digit (RRGGBB)
    // - 8-digit (RRGGBBAA)
    static fromHex(hexString) {
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

    static fromRgba(rgbaString) {
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
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 1) {
            throw new Error("Color values out of range");
        }

        return new Color(r, g, b, a);
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

    // Convert back to hex string
    toHex(includeAlpha = true) {
        const r = Math.round(this.red).toString(16).padStart(2, "0");
        const g = Math.round(this.green).toString(16).padStart(2, "0");
        const b = Math.round(this.blue).toString(16).padStart(2, "0");

        if (includeAlpha) {
            const a = Math.round(this.alpha * 255)
                .toString(16)
                .padStart(2, "0");

            return `#${r}${g}${b}${a}`;
        }

        return `#${r}${g}${b}`;
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
}

exports.Color = Color;
