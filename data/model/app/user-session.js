const DataObject = require("../data-object").DataObject;
const Montage = require("core/core").Montage;

/**
 * @class UserSession
 * @extends DataObject
 */
exports.UserSession = class UserSession extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
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
            person: {
                value: undefined
            }
        });
    }
};
