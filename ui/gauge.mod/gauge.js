const { VisualSize } = require("core/enums/visual-size");
const { Control } = require("ui/control");
const uuid = require("core/uuid");

/**
 */
class Gauge extends Control {
    progressTrailColor = null;
    strokeLinecap = "round";
    progressColor = null;
    textColor = null;
    showText = false;
    value = 0;
    max = 100;
    min = 0;

    /**
     * The size of the segmented control
     * @returns {string} The current size
     */
    _size = VisualSize.medium;

    get size() {
        return this._size;
    }

    set size(value) {
        if (this._size === value) return;

        if (!VisualSize.members.includes(value)) {
            console.warn("Invalid size value. Defaulting to medium.");
            this._size = VisualSize.medium;
        } else {
            this._size = VisualSize[value];
        }

        this.needsDraw = true;
    }

    _strokeWidth = VisualSize.medium;

    get strokeWidth() {
        return this._strokeWidth;
    }

    set strokeWidth(value) {
        if (this._strokeWidth === value) return;

        if (!VisualSize.members.includes(value)) {
            console.warn("Invalid stroke width value. Defaulting to medium.");
            this._strokeWidth = VisualSize.medium;
        } else {
            this._strokeWidth = VisualSize[value];
        }

        this.needsDraw = true;
    }

    // Clamp value between min and max
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

    draw() {
        if (!this._completedFirstDraw) {
            this.uuid = this.uuid || uuid.generate();
            this.shadowElement.setAttribute("id", `${this.uuid}`);
        }

        const progressTailColor = this._getProgressTrailColor();
        const circleDimensions = this._getCircleDimensions();
        const progressColor = this._getProgressColor();
        const strokeWidth = this._getStrokeWidth();
        const radius = (circleDimensions.value - strokeWidth.value) / 2;

        this.element.style.width = `${circleDimensions.value}${circleDimensions.unit}`;
        this.element.style.height = this.element.style.width;

        this.graphicElement.setAttribute("viewBox", `0 0 ${circleDimensions.value} ${circleDimensions.value}`);
        this.graphicElement.setAttribute("width", circleDimensions.value);
        this.graphicElement.setAttribute("height", circleDimensions.value);

        this._drawCircle(this.trailElement, {
            strokeLinecap: this.strokeLinecap,
            strokeColor: progressTailColor,
            strokeWidth,
            circleSize: circleDimensions,
            radius,
        });

        this.trailElement.setAttribute("filter", `url(#${this.uuid})`);

        this._drawCircle(this.progressElement, {
            strokeLinecap: this.strokeLinecap,
            strokeColor: progressColor,
            strokeWidth,
            circleSize: circleDimensions,
            radius,
        });

        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (this.normalizedValue / 100) * circumference;

        this.progressElement.setAttribute("stroke-dasharray", circumference);
        this.progressElement.setAttribute("stroke-dashoffset", offset);

        // Add text if enabled
        this._drawText(circleDimensions);
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
        element.setAttribute("transform", `rotate(-90 ${circleSize.value / 2} ${circleSize.value / 2})`);
    }

    _drawText(circleSize) {
        if (!this.showText) return;

        if (!this.progressTextElement) {
            // Create text element
            this.progressTextElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        }

        const fontSize = Math.max(12, circleSize.value * 0.2); // Ensure text is readable
        const centerX = circleSize.value / 2;
        const centerY = circleSize.value / 2;

        const textElement = this.progressTextElement;
        textElement.setAttribute("class", "ModGauge-progress-text");
        textElement.setAttribute("x", centerX);
        textElement.setAttribute("y", centerY);
        textElement.setAttribute("text-anchor", "middle");
        textElement.setAttribute("dominant-baseline", "central");
        textElement.setAttribute("fill", this.textColor);
        textElement.setAttribute("font-size", `${fontSize}px`);
        textElement.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
        textElement.textContent = this.progressText;

        this.graphicElement.appendChild(textElement);
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

    // Get progress trail color with CSS fallback support
    // TODO: explore Color object ?
    // TODO: method could be used in other components
    _getProgressTrailColor() {
        const typeOfColor = typeof this.progressTrailColor;
        const color = this.progressTrailColor;
        let progressTrailColor;

        // If it's already a resolved color object
        if (typeOfColor === "object" && color !== null && color.value) {
            progressTrailColor = color.value;
        }

        // If it's a string, check for CSS variable or use directly
        if (!progressTrailColor && typeOfColor === "string") {
            const cssValue =
                this.getCSSPropertyValue(`progress-trail-color-${color}`) ||
                this.getCSSPropertyValue(`progress-trail-color`);
            progressTrailColor = cssValue || color;
        }

        // Default progress tail color
        return progressTrailColor || "rgb(243, 244, 246)";
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
        return progressColor || "rgb(21, 112, 239)";
    }

    // Get circle dimensions
    // TODO: explore Size object with value and unit?
    // TODO: method could be used in other components
    _getCircleDimensions() {
        const typeOfSize = typeof this.size;
        const size = this.size;
        let circleDimensions;

        if (typeOfSize === "object" && size !== null && size.value && size.unit) {
            circleDimensions = size;
        }

        if (!circleDimensions && typeOfSize === "string") {
            const cssValue = this.getCSSPropertyValue(`size-${size}`);
            circleDimensions = this.parseCssValue(cssValue);
        }

        if (typeOfSize === "number") {
            circleDimensions = {
                value: size,
                unit: "px",
            };
        }

        // Default size
        return (
            circleDimensions ?? {
                value: 48,
                unit: "px",
            }
        );
    }

    // TODO: method could be used in other components
    parseCssValue(cssValue) {
        if (!cssValue) {
            console.warn("Invalid CSS value provided for parsing.");
            return { value: 0, unit: "" };
        }

        const match = cssValue.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);

        if (!match) return { value: 0, unit: "" };

        return {
            value: parseFloat(match[1]),
            unit: match[2] || "",
        };
    }
}

exports.Gauge = Gauge;
