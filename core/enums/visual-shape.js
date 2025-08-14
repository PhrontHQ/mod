const Enum = require("../enum").Enum;

const shapes = ["rectangle", "rounded", "pill"];
const classNames = shapes.map((shape) => `mod--shape-${shape}`);

/**
 * Visual shape types for components.
 * @typedef {"rectangle"|"rounded"|"pill"} VisualShape
 */

/**
 * VisualShape enum with available shape values.
 * @type {Object.<string, VisualShape>}
 * @property {string} rectangle - Rectangle shape with sharp corners
 * @property {string} rounded - Shape with rounded corners
 * @property {string} pill - Pill shape with fully rounded ends
 */
exports.VisualShape = new Enum().initWithMembersAndValues(
    shapes,
    shapes
);

/**
 * CSS class names corresponding to visual shapes.
 * @type {Object.<string, string>}
 * @property {string} rectangle - CSS class "mod--shape-rectangle"
 * @property {string} rounded - CSS class "mod--shape-rounded"
 * @property {string} pill - CSS class "mod--shape-pill"
 */
exports.VisualShapeClassNames = new Enum().initWithMembersAndValues(
    shapes,
    classNames
);
