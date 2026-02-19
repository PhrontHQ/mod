const Enum = require("../enum").Enum;

const variants = ["outlined", "plain"];
const classNames = variants.map((variant) => `mod--variant-${variant}`);

/**
 * Visual variant types for components.
 * @typedef {"outlined"|"plain"} VisualVariant
 */

/**
 * VisualVariant enum with available visual variants.
 * @type {Object.<string, VisualVariant>}
 * @property {string} outlined - Component with outline styling
 * @property {string} plain - Component with minimal/default styling
 */
exports.VisualVariant = new Enum().initWithMembersAndValues(variants, variants);

/**
 * CSS class names corresponding to visual variants.
 * @type {Object.<string, string>}
 * @property {string} outlined - CSS class "mod--variant-outlined"
 * @property {string} plain - CSS class "mod--variant-plain"
 */
exports.VisualVariantClassNames = new Enum().initWithMembersAndValues(
    variants,
    classNames
);
