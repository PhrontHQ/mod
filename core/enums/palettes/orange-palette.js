const { Enum } = require("core/enum");
const { Color } = require("core/color");

const weights = ["w25", "w50", "w100", "w200", "w300", "w400", "w500", "w600", "w700", "w800", "w900", "w950"];

const colors = [
    Color.fromHex("#FFFCF5"), // w25 - Very light orange tint
    Color.fromHex("#FFFAEB"), // w50 - Light orange tint
    Color.fromHex("#FEDF89"), // w100 - Lighter orange
    Color.fromHex("#FEC84B"), // w200 - Light orange
    Color.fromHex("#FDB022"), // w300 - Medium light orange
    Color.fromHex("#F79009"), // w400 - Medium orange
    Color.fromHex("#DC6803"), // w500 - Primary orange
    Color.fromHex("#B54708"), // w600 - Darker orange
    Color.fromHex("#93370D"), // w700 - Dark orange
    Color.fromHex("#7A2E0E"), // w800 - Very dark orange
    Color.fromHex("#4E1D09"), // w900 - Near brown orange
    Color.fromHex("#3A1508"), // w950 - Darkest brown orange
];

/**
 * @typedef {Object} OrangePalette
 * @property {string} w25 - Very light orange tint
 * @property {string} w50 - Light orange tint
 * @property {string} w100 - Lighter orange color
 * @property {string} w200 - Light orange color
 * @property {string} w300 - Medium light orange color
 * @property {string} w400 - Medium orange color
 * @property {string} w500 - Primary orange color
 * @property {string} w600 - Darker orange color
 * @property {string} w700 - Dark orange color
 * @property {string} w800 - Very dark orange color
 * @property {string} w900 - Near brown orange color
 * @property {string} w950 - Darkest brown orange color
 */

/**
 * OrangePalette is an enumeration of orange colors with different weights.
 * It provides a consistent set of orange colors for use in UI components.
 * @type {OrangePalette}
 */
const OrangePalette = new Enum().initWithMembersAndValues(weights, colors);

exports.OrangePalette = OrangePalette;
