const { Enum } = require("core/enum");
const { Color } = require("core/color");

const weights = ["w25", "w50", "w100", "w200", "w300", "w400", "w500", "w600", "w700", "w800", "w900", "w950"];

const colors = [
    Color.fromHex("#F6FEF9"), // w25 - Very light green tint
    Color.fromHex("#ECFDF3"), // w50 - Light green tint
    Color.fromHex("#DCFAE6"), // w100 - Lighter green
    Color.fromHex("#A9EFC5"), // w200 - Light green
    Color.fromHex("#75E0A7"), // w300 - Medium light green
    Color.fromHex("#47CD89"), // w400 - Medium green
    Color.fromHex("#17B26A"), // w500 - Primary green
    Color.fromHex("#079455"), // w600 - Darker green
    Color.fromHex("#067647"), // w700 - Dark green
    Color.fromHex("#085D3A"), // w800 - Very dark green
    Color.fromHex("#074D31"), // w900 - Near forest green
    Color.fromHex("#053321"), // w950 - Darkest forest green
];

/**
 * @typedef {Object} GreenPalette
 * @property {string} w25 - Very light green tint
 * @property {string} w50 - Light green tint
 * @property {string} w100 - Lighter green color
 * @property {string} w200 - Light green color
 * @property {string} w300 - Medium light green color
 * @property {string} w400 - Medium green color
 * @property {string} w500 - Primary green color
 * @property {string} w600 - Darker green color
 * @property {string} w700 - Dark green color
 * @property {string} w800 - Very dark green color
 * @property {string} w900 - Near forest green color
 * @property {string} w950 - Darkest forest green color
 */

/**
 * GreenPalette is an enumeration of green colors with different weights.
 * It provides a consistent set of green colors for use in UI components.
 * @type {GreenPalette}
 */
const GreenPalette = new Enum().initWithMembersAndValues(weights, colors);

exports.GreenPalette = GreenPalette;
