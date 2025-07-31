const { OrangePalette } = require("./orange-palette");
const { GreenPalette } = require("./green-palette");
const { GrayPalette } = require("./gray-palette");
const { BluePalette } = require("./blue-palette");
const { RedPalette } = require("./red-palette");
const { Enum } = require("core/enum");

const names = ["gray", "red", "orange", "blue", "green"];

const palettes = [GrayPalette, RedPalette, OrangePalette, BluePalette, GreenPalette];

/**
 * @typedef {Object} PaletteColors
 * @property {GrayPalette} gray - Gray color palette
 */

const PaletteColors = new Enum().initWithMembersAndValues(names, palettes);

exports.PaletteColors = PaletteColors;
