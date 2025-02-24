const { Enum } = require("../enum");

/**
 * @typedef {"start"|"end"} VisualPosition
 */
exports.VisualPosition = new Enum().initWithMembersAndValues(
    ["start", "end"],
    ["mod--start", "mod--end"]
);

/**
 * @typedef {"horizontal"|"vertical"} VisualOrientation
 */
exports.VisualOrientation = new Enum().initWithMembersAndValues(
    ["horizontal", "vertical"],
    ["mod--horizontal", "mod--vertical"]
);
