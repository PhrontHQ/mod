const Enum = require("../enum").Enum;

const sizes = ["small", "medium", "large"];
const classNames = sizes.map((size) => `mod--size-${size}`);

/**
 * Visual size types for components.
 * @typedef {"small"|"medium"|"large"} VisualSize
 */

/**
 * VisualSize enum with available size values.
 * @type {Object.<string, VisualSize>}
 * @property {string} small - Small size variant
 * @property {string} medium - Medium size variant
 * @property {string} large - Large size variant
 */
exports.VisualSize = new Enum().initWithMembersAndValues(sizes, sizes);

/**
 * CSS class names corresponding to visual sizes.
 * @type {Object.<string, string>}
 * @property {string} small - CSS class "mod--size-small"
 * @property {string} medium - CSS class "mod--size-medium"
 * @property {string} large - CSS class "mod--size-large"
 */
exports.VisualSizeClassNames = new Enum().initWithMembersAndValues(
    sizes,
    classNames
);
