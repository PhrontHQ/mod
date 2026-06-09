const Enum = require("../enum").Enum;

const orientations = ["horizontal", "vertical"];
const classNames = orientations.map((orientation) => {
    return `mod--orientation-${orientation}`;
});

/**
 * Visual orientation types for components.
 * @typedef {"horizontal"|"vertical"} VisualOrientation
 */

/**
 * VisualOrientation enum with available orientation values.
 * @type {Object.<string, VisualOrientation>}
 * @property {string} horizontal - Horizontal layout orientation
 * @property {string} vertical - Vertical layout orientation
 */
exports.VisualOrientation = new Enum().initWithMembersAndValues(
    orientations,
    orientations
);

/**
 * CSS class names corresponding to visual orientations.
 * @type {Object.<string, string>}
 * @property {string} horizontal - CSS class "mod--orientation-horizontal"
 * @property {string} vertical - CSS class "mod--orientation-vertical"
 */
exports.VisualOrientationClassNames = new Enum().initWithMembersAndValues(
    orientations,
    classNames
);
