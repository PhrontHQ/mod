const Enum = require("../enum").Enum;

const positions = ["start", "end"];
const classNames = positions.map((position) => `mod--position-${position}`);

/**
 * Visual position types for components.
 * @typedef {"start"|"end"} VisualPosition
 */

/**
 * VisualPosition enum with available position values.
 * @type {Object.<string, VisualPosition>}
 * @property {string} start - Position at the beginning/start
 * @property {string} end - Position at the end
 */
exports.VisualPosition = new Enum().initWithMembersAndValues(
    positions,
    positions
);

/**
 * CSS class names corresponding to visual positions.
 * @type {Object.<string, string>}
 * @property {string} start - CSS class "mod--position-start"
 * @property {string} end - CSS class "mod--position-end"
 */
exports.VisualPositionClassNames = new Enum().initWithMembersAndValues(
    positions,
    classNames
);
