const { Enum } = require("../enum");

const variants = ["outlined", "plain"];
const classNames = variants.map((variant) => `mod--variant-${variant}`);

/**
 * @typedef {"outlined"|"plain"} VisualVariant
 */
const VisualVariant = new Enum().initWithMembersAndValues(variants, variants);

const VisualVariantClassNames = new Enum().initWithMembersAndValues(variants, classNames);

exports.VisualVariantClassNames = VisualVariantClassNames;
exports.VisualVariant = VisualVariant;