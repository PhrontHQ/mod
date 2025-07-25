const { Control } = require("ui/control");

function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, "$1-$2") // Add hyphen between lowercase and uppercase
        .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
        .toLowerCase(); // Convert to lowercase
}

/**
 */
class CircularProgress extends Control {
    progressTailColor = "#f0f0f0";
    progressColor = "#1890ff";
    strokeLinecap = "round";
    strokeWidth = "medium";
    size = "medium";
    max = 100;
    min = 0;
    value = 0;

    // Clamp value between 0 and 100
    get normalizedValue() {
        const value = Number(this.value) || 0;
        const max = Number(this.max) || 100;
        const min = Number(this.min) || 0;

        return Math.max(min, Math.min(max, value));
    }

    // Get progress text
    get progressText() {
        return `${Math.round(this.normalizedValue)}%`;
    }

    // enterDocument() {
    //     // simulate progress bar animation
    //     const interval = setInterval(() => {
    //         this.value = this.value + 10;
    //         if (this.value > 100) {
    //             clearInterval(interval);
    //         }

    //         this.needsDraw = true;
    //     }, 1000);
    // }

    draw() {
        const progressTailColor = this._getProgressTailColor();
        const progressColor = this._getProgressColor();
        const circleSize = this._getCircleSize();
        const strokeWidth = this._getStrokeWidth();
        const radius = (circleSize.value - strokeWidth.value) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (this.normalizedValue / 100) * circumference;

        this.element.style.width = `${circleSize.value}${circleSize.unit}`;
        this.element.style.height = this.element.style.width;

        this.graphic.setAttribute("width", circleSize.value);
        this.graphic.setAttribute("height", circleSize.value);
        this.graphic.setAttribute("viewbox", `0 0 ${circleSize.value} ${circleSize.value}`);

        this._drawCircle(this.trail, {
            strokeLinecap: this.strokeLinecap,
            strokeColor: progressTailColor,
            strokeWidth,
            circleSize,
            radius,
        });

        this._drawCircle(this.progress, {
            strokeLinecap: this.strokeLinecap,
            strokeColor: progressColor,
            strokeWidth,
            circleSize,
            radius,
        });

        this.progress.setAttribute("stroke-dasharray", circumference);
        this.progress.setAttribute("stroke-dashoffset", offset);
    }

    didDraw() {
        if (!this._completedFirstDraw) {
            // Allow animations after first draw
            requestAnimationFrame(() => this.element?.classList.add("mod--animate"));
        }
    }

    _drawCircle(element, options = {}) {
        const { strokeLinecap, circleSize, radius, strokeWidth, strokeColor } = options;

        element.setAttribute("cx", circleSize.value / 2);
        element.setAttribute("cy", circleSize.value / 2);
        element.setAttribute("r", radius);
        element.setAttribute("fill", "none");
        element.setAttribute("stroke", strokeColor);
        element.setAttribute("stroke-width", strokeWidth.value);
        element.setAttribute("stroke-linecap", strokeLinecap);
    }

    // Get stroke width based on size
    // TODO: explore Size object with value and unit?
    // TODO: method could be used in other components
    _getStrokeWidth() {
        const typeOfSize = typeof this.strokeWidth;
        let strokeWidth;

        if (typeOfSize === "object" && this.strokeWidth !== null && this.strokeWidth.value && this.strokeWidth.unit) {
            strokeWidth = this.strokeWidth;
        }

        if (!strokeWidth && typeOfSize === "string") {
            const cssValue = this.getCSSPropertyValue(`stroke-width-${this.strokeWidth}`);
            strokeWidth = this.parseCssValue(cssValue);
        }

        if (typeOfSize === "number") {
            strokeWidth = {
                value: this.strokeWidth,
                unit: "px",
            };
        }

        // Default stroke width
        return (
            strokeWidth ?? {
                value: 6,
                unit: "px",
            }
        );
    }

    // Get progress tail color with CSS fallback support
    // TODO: explore Color object ?
    // TODO: method could be used in other components
    _getProgressTailColor() {
        const typeOfColor = typeof this.progressTailColor;
        const color = this.progressTailColor;
        let progressTailColor;

        // If it's already a resolved color object
        if (typeOfColor === "object" && color !== null && color.value) {
            progressTailColor = color.value;
        }

        // If it's a string, check for CSS variable or use directly
        if (!progressTailColor && typeOfColor === "string") {
            const cssValue =
                this.getCSSPropertyValue(`progress-tail-color-${color}`) ||
                this.getCSSPropertyValue(`progress-tail-color`);
            progressTailColor = cssValue || color;
        }

        // Default progress tail color
        return progressTailColor || "#f0f0f0";
    }

    // Get progress color with CSS fallback support
    // TODO: explore Color object ?
    // TODO: method could be used in other components
    _getProgressColor() {
        const typeOfColor = typeof this.progressColor;
        const color = this.progressColor;
        let progressColor;

        // If it's already a resolved color object
        if (typeOfColor === "object" && color !== null && color.value) {
            progressColor = color.value;
        }

        // If it's a string, check for CSS variable or use directly
        if (!progressColor && typeOfColor === "string") {
            const cssValue =
                this.getCSSPropertyValue(`progress-color-${color}`) || this.getCSSPropertyValue(`progress-color`);
            progressColor = cssValue || color;
        }

        // Default progress color
        return progressColor || "#1890ff";
    }

    // Get circle dimensions
    // TODO: explore Size object with value and unit?
    // TODO: method could be used in other components
    _getCircleSize() {
        const typeOfSize = typeof this.size;
        const size = this.size;
        let circleSize;

        if (typeOfSize === "object" && size !== null && size.value && size.unit) {
            circleSize = size;
        }

        if (!circleSize && typeOfSize === "string") {
            const cssValue = this.getCSSPropertyValue(`size-${size}`);
            circleSize = this.parseCssValue(cssValue);
        }

        if (typeOfSize === "number") {
            circleSize = {
                value: size,
                unit: "px",
            };
        }

        // Default size
        return (
            circleSize ?? {
                value: 48,
                unit: "px",
            }
        );
    }

    // TODO: method could be used in other components
    getCSSPropertyValue(name) {
        const elementStyles = getComputedStyle(this.element);
        const kebabName = toKebabCase(this.constructor.name);
        const cssPrefix = `--mod-${kebabName}`;
        const cssPropertyName = `${cssPrefix}-${name}`;
        let cssPropertyValue = elementStyles.getPropertyValue(cssPropertyName);

        if (!cssPropertyValue) {
            cssPropertyValue = elementStyles.getPropertyValue(name);
        }

        return cssPropertyValue?.trim() || null;
    }

    // TODO: method could be used in other components
    parseCssValue(cssValue) {
        const match = cssValue.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);

        if (!match) return { value: 0, unit: "" };

        return {
            value: parseFloat(match[1]),
            unit: match[2] || "",
        };
    }
}

exports.CircularProgress = CircularProgress;
