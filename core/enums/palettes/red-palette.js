const { Enum } = require("core/enum");
const { Color } = require("core/color");

const weights = ["w25", "w50", "w100", "w200", "w300", "w400", "w500", "w600", "w700", "w800", "w900", "w950"];

const colors = [
    Color.fromHex("#FFFBFA"),  // w25 - Very light red tint
    Color.fromHex("#FEF3F2"),  // w50 - Light red tint
    Color.fromHex("#FEE4E2"),  // w100 - Lighter red
    Color.fromHex("#FECDCA"),  // w200 - Light red
    Color.fromHex("#FDA29B"),  // w300 - Medium light red
    Color.fromHex("#F97066"),  // w400 - Medium red
    Color.fromHex("#F04438"),  // w500 - Primary red
    Color.fromHex("#D92D20"),  // w600 - Darker red
    Color.fromHex("#B42318"),  // w700 - Dark red
    Color.fromHex("#912018"),  // w800 - Very dark red
    Color.fromHex("#7A271A"),  // w900 - Near burgundy red
    Color.fromHex("#55160C"),  // w950 - Darkest burgundy red
];

/**
 * @typedef {Object} RedPalette
 * @property {string} w25 - Very light red tint
 * @property {string} w50 - Light red tint
 * @property {string} w100 - Lighter red color
 * @property {string} w200 - Light red color
 * @property {string} w300 - Medium light red color
 * @property {string} w400 - Medium red color
 * @property {string} w500 - Primary red color
 * @property {string} w600 - Darker red color
 * @property {string} w700 - Dark red color
 * @property {string} w800 - Very dark red color
 * @property {string} w900 - Near burgundy red color
 * @property {string} w950 - Darkest burgundy red color
 */

/**
 * RedPalette is an enumeration of red colors with different weights.
 * It provides a consistent set of red colors for use in UI components.
 * @type {RedPalette}
 */
const RedPalette = new Enum().initWithMembersAndValues(weights, colors);

exports.RedPalette = RedPalette;
