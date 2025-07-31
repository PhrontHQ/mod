const { Enum } = require("core/enum");
const { Color } = require("core/color");

const weights = ["w25", "w50", "w100", "w200", "w300", "w400", "w500", "w600", "w700", "w800", "w900", "w950"];

const colors = [
    Color.fromHex("#FCFCFD"),
    Color.fromHex("#F9FAFB"),
    Color.fromHex("#F3F4F6"),
    Color.fromHex("#E5E7EB"),
    Color.fromHex("#D2D6DB"),
    Color.fromHex("#9DA4AE"),
    Color.fromHex("#6C737F"),
    Color.fromHex("#4D5761"),
    Color.fromHex("#384250"),
    Color.fromHex("#1F2A37"),
    Color.fromHex("#111927"),
    Color.fromHex("#0D121C"),
];

/**
 * @typedef {Object} GrayPalette
 * @property {string} w25 - Lightest gray color
 * @property {string} w50 - Lighter gray color
 * @property {string} w100 - Light gray color
 * @property {string} w200 - Medium light gray color
 * @property {string} w300 - Medium gray color
 * @property {string} w400 - Darker medium gray color
 * @property {string} w500 - Dark gray color
 * @property {string} w600 - Darker gray color
 * @property {string} w700 - Very dark gray color
 * @property {string} w800 - Almost black gray color
 * @property {string} w900 - Near black gray color
 * @property {string} w950 - Blackest gray color
 */

/**
 * GrayPalette is an enumeration of gray colors with different weights.
 * It provides a consistent set of gray colors for use in UI components.
 * @type {GrayPalette}
 */
const GrayPalette = new Enum().initWithMembersAndValues(weights, colors);

exports.GrayPalette = GrayPalette;
