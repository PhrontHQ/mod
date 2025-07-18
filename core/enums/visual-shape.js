const { Enum } = require("../enum");

/**
 * @typedef {"rectangle"|"rounded"|'pill'} VisualShape
 */
exports.VisualShape= new Enum().initWithMembersAndValues(
    ["rectangle", "rounded", "pill"],
    ["mod--shape-rectangle", "mod--shape-rounded", "mod--shape-pill"]
);
