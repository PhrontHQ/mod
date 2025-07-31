const { Enum } = require("core/enum");
const { Color } = require("core/color");

const weights = ["w25", "w50", "w100", "w200", "w300", "w400", "w500", "w600", "w700", "w800", "w900", "w950"];

const colors = [
    Color.fromHex("#F5F8FF"),  // w25 - Very light blue tint
    Color.fromHex("#EFF8FF"),  // w50 - Light blue tint
    Color.fromHex("#D1E9FF"),  // w100 - Lighter blue
    Color.fromHex("#B2DDFF"),  // w200 - Light blue
    Color.fromHex("#84CAFF"),  // w300 - Medium light blue
    Color.fromHex("#53B1FD"),  // w400 - Medium blue
    Color.fromHex("#2E90FA"),  // w500 - Primary blue
    Color.fromHex("#1570EF"),  // w600 - Darker blue
    Color.fromHex("#175CD3"),  // w700 - Dark blue
    Color.fromHex("#1849A9"),  // w800 - Very dark blue
    Color.fromHex("#194185"),  // w900 - Near navy blue
    Color.fromHex("#102A56"),  // w950 - Darkest navy blue
];

/**
 * @typedef {Object} BluePalette
 * @property {string} w25 - Very light blue tint
 * @property {string} w50 - Light blue tint
 * @property {string} w100 - Lighter blue color
 * @property {string} w200 - Light blue color
 * @property {string} w300 - Medium light blue color
 * @property {string} w400 - Medium blue color
 * @property {string} w500 - Primary blue color
 * @property {string} w600 - Darker blue color
 * @property {string} w700 - Dark blue color
 * @property {string} w800 - Very dark blue color
 * @property {string} w900 - Near navy blue color
 * @property {string} w950 - Darkest navy blue color
 */

/**
 * BluePalette is an enumeration of blue colors with different weights.
 * It provides a consistent set of blue colors for use in UI components.
 * @type {BluePalette}
 */
const BluePalette = new Enum().initWithMembersAndValues(weights, colors);

exports.BluePalette = BluePalette;
