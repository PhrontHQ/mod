var DataObject = require("../data-object").DataObject;

/**
 * @class UserIdentity
 * @extends DataObject
 */
exports.UserSession = DataObject.specialize(/** @lends UserSession.prototype */ {

    identity: {
        value: undefined
    },
    environment: {
        value: undefined
    },
    connectionId: {
        value: undefined
    },
    connectionTimeRange: {
        value: false
    },
    person: {value: undefined}
});
