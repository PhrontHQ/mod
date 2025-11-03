const Montage = require("core/core").Montage;

/**
 * @class LogEntry
 * @extends Montage
 * TODO: @benoit: not a DataObject on purpose?
 */
exports.LogEntry = Montage.specialize({
    time: {
        value: undefined,
    },
    value: {
        value: undefined,
    },
});
