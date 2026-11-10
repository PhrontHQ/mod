const { Enum } = require("../enum");

/**
 * @typedef {"displayBoth"|"visualOnly"|"labelOnly"} DisplayOptions
 */
exports.DisplayOptions = new Enum().initWithMembersAndValues(
    ["displayBoth", "visualOnly", "labelOnly"],
    ["mod--display-both", "mod--visual-only", "mod--label-only"]
);
