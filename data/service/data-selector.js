var DataQuery = require("data/model/data-query").DataQuery;

/**
 * Backward compatibility support for data/service/data-selector after that
 * class has been moved to data/model/data-query.
 *
 * @class
 * @extends external:Montage
 * @todo Deprecate.
 */
exports.DataSelector = DataQuery;
