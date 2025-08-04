const { Enum } = require("../enum");

const sizes = ["small", "medium", "large"];
const classNames = sizes.map((size) => `mod--size-${size}`);

/**
 * @typedef {"small"|"medium"|'large'} VisualSize
 */
const VisualSize = new Enum().initWithMembersAndValues(sizes, sizes);

const VisualSizeClassNames = new Enum().initWithMembersAndValues(sizes, classNames);

exports.VisualSizeClassNames = VisualSizeClassNames;
exports.VisualSize = VisualSize;
