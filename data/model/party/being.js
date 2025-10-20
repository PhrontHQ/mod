const Party = require("./party").Party;

/**
 * Represents a living entity, such as a person or animal.
 * @class Being
 * @extends {Party}
 *
 * TODO: Add `availability` to model active/working hours.
 * Needs to support recurring weekly schedules, including:
 * - Time zone specification.
 * - An array of time ranges (slots) per day.
 * - Different schedules for different days (e.g., Mon-Fri vs. Sat).
 */
exports.Being = class Being extends Party {};
