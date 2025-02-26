const { Enum } = require("../enum");

/**
 * @typedef {"horizontal"|"vertical"} VisualOrientation
 */
exports.VisualOrientation = new Enum().initWithMembersAndValues(
    ["horizontal", "vertical"],
    ["mod--horizontal", "mod--vertical"]
);
