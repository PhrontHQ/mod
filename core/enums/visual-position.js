const { Enum } = require("../enum");

/**
 * @typedef {"start"|"end"} VisualPosition
 */
exports.VisualPosition = new Enum().initWithMembersAndValues(
    ["start", "end"],
    ["mod--start", "mod--end"]
);
