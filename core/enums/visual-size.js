const { Enum } = require("../enum");

/**
 * @typedef {"small"|"medium"|'large'} VisualSize
 */
exports.VisualSize= new Enum().initWithMembersAndValues(
    ["small", "medium", "large"],
    ["mod--size-small", "mod--size-medium", "mod--size-large"]
);
