const Component = require("/ui/component").Component;
const Color = require("/core/color").Color;

exports.Typography = class Typography extends Component {
    static #styleElement = null;

    // Cache for accessible color CSS rules
    static accessibleColorCache = new Map();

    static get styleElement() {
        if (!this.#styleElement) {
            this.#styleElement = document.createElement("style");
            this.#styleElement.id = "mod-typography-styles";
            document.head.appendChild(this.#styleElement);
        }

        return this.#styleElement;
    }

    /**
     * Sets an accessible text color for a given background color.
     * Creates and caches CSS rules to prevent recalculation.
     * @param {Color} textColor - The text color to apply
     * @param {Color} backgroundColor - The background color to check against
     * @returns {string} The CSS class name to apply for accessible text color
     */
    setAccessibleTextColorClassNameForBackground(textColor, backgroundColor) {
        let className =
            this.getAccessibleTextColorClassNameForBackground(backgroundColor);

        // If we already have a cached class name, return it
        if (className) return className;

        // Generate a unique CSS class name based on the background color
        // Convert to hex for consistent naming (remove #)
        const bgHex = backgroundColor.toHex().replace("#", "").toLowerCase();
        className = `mod-typography-accessible-color-for-${bgHex}`;

        // Create the CSS rule
        const cssRule = `.${className} { color: ${textColor.toRgba()}; }`;

        // Inject the rule into the stylesheet
        const styleSheet = Typography.styleElement.sheet;

        try {
            styleSheet.insertRule(cssRule, styleSheet.cssRules.length);
        } catch (error) {
            console.error("Failed to insert CSS rule:", error);
            return null;
        }

        // Cache the result
        Typography.accessibleColorCache.set(backgroundColor.toHex(), className);

        return className;
    }

    /**
     * Retrieves the cached class name for a given background color.
     * If not found, returns null.
     * @param {Color} backgroundColor
     * @returns
     */
    getAccessibleTextColorClassNameForBackground(backgroundColor) {
        // Check if we already have a cached class name for this background color
        if (Typography.accessibleColorCache.has(backgroundColor.toHex())) {
            return Typography.accessibleColorCache.get(backgroundColor.toHex());
        }

        return null;
    }

    draw() {
        const backgroundColor = this.getEffectiveBackgroundColor(this.element);
        const className =
            this.getAccessibleTextColorClassNameForBackground(backgroundColor);

        if (className) {
            // If we have a cached class name, apply it to the element
            this.element.classList.add(className);
        } else {
            // If no cached class name, calculate the accessible text color
            // Let's imagine we get the visual style text color from the global visual style
            const visualStyleTextColor = Color.black;

            const textColor =
                visualStyleTextColor.getAccessibleTextColor(backgroundColor);

            const className = this.setAccessibleTextColorClassNameForBackground(
                textColor,
                backgroundColor
            );

            this.element.classList.add(className);
        }
    }

    /**
     * Recursively searches up the DOM tree to find the effective background color
     * behind an element, handling transparency and inheritance.
     *
     * @param {HTMLElement} element - The starting element
     * @param {Color|null} foregroundColor - Internal parameter for recursion (accumulated transparent colors)
     * @returns {Color} The effective background color
     */
    getEffectiveBackgroundColor(element, foregroundColor = null) {
        // Base case: if no element, return the foreground color or the browser's default background color
        if (!element) {
            return (
                foregroundColor ||
                Color.fromString(this.getBrowserDefaultBackgroundColor())
            );
        }

        // Get computed styles for the current element
        const computedStyle = window.getComputedStyle(element);
        const computedBackgroundColor = computedStyle.backgroundColor;

        // Parse the background color
        let backgroundColor;

        try {
            if (element === document.documentElement) {
                // If we're at the root element, use the browser's default background color
                backgroundColor = Color.fromString(
                    this.getBrowserDefaultBackgroundColor()
                );
            } else {
                backgroundColor = Color.fromString(computedBackgroundColor);
            }
        } catch (error) {
            // If parsing fails, treat as transparent
            backgroundColor = Color.transparent;
        }

        // If the current color is fully opaque, we found our answer
        if (backgroundColor.alpha === 1) {
            return Color.alphaBlend(backgroundColor, foregroundColor);
        }

        // If the current color is completely transparent, continue up the tree
        if (backgroundColor.alpha === 0) {
            return this.getEffectiveBackgroundColor(
                element.parentElement,
                foregroundColor
            );
        }

        // If the current color is partially transparent, blend it with accumulated color
        const blendedColor = Color.alphaBlend(backgroundColor, foregroundColor);

        // If the blended result is fully opaque, return it
        if (blendedColor.alpha >= 1) {
            return new Color(
                blendedColor.red,
                blendedColor.green,
                blendedColor.blue,
                1
            );
        }

        // Continue up the tree with the blended color
        return this.getEffectiveBackgroundColor(
            element.parentElement,
            blendedColor
        );
    }

    // Returns the default TRUE background color for the browser.
    // TODO: could be cached to avoid multiple calls
    // https://developer.mozilla.org/en-US/docs/Web/CSS/system-color#syntax
    getBrowserDefaultBackgroundColor() {
        // Create a temporary element
        const tempElement = document.createElement("div");

        // Apply the CSS system color keyword 'Canvas'
        // Canvas -> Background of application content or documents.
        tempElement.style.backgroundColor = "Canvas";

        // Append it to the body to be able to compute its style
        document.body.appendChild(tempElement);

        // Get the computed color
        const defaultColor =
            window.getComputedStyle(tempElement).backgroundColor;

        // Remove the temporary element from the DOM
        document.body.removeChild(tempElement);

        return defaultColor;
    }
};
