const { Enum } = require("../enum");

const shapes = ["rectangle", "rounded", "pill"];
const classNames = shapes.map((shape) => `mod--shape-${shape}`);

/**
 * @typedef {"rectangle"|"rounded"|'pill'} VisualShape
 */
const VisualShape = new Enum().initWithMembersAndValues(shapes, shapes);

const VisualShapeClassNames = new Enum().initWithMembersAndValues(shapes, classNames);

exports.VisualShapeClassNames = VisualShapeClassNames;
exports.VisualShape = VisualShape;
