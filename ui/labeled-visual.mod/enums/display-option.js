const { Enum } = require("../../../core/enum");

/**
 * @typedef {"displayBoth"|"visualOnly"|"labelOnly"} DisplayOption
 */
exports.DisplayOption = new Enum().initWithMembersAndValues(
    ["displayBoth", "visualOnly", "labelOnly"],
    ["mod--display-both", "mod--visual-only", "mod--label-only"]
);
