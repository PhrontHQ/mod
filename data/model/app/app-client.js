/**
 * @module business-data.mod/data/main.mod/model/app/app-client
 */

const DataObject = require("../data-object").DataObject;
const Montage = require("core/core").Montage;

/**
 * @class AppClient
 * @extends DataObject
 *
 * An AppClient is the representatiom/registration of an application for the sake of authentication and authorization.
 *
 * A User Pool can be provided by external services, in which case this acts as a cache.
 */
exports.AppClient = class AppClient extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            name: {
                value: undefined,
            },
            identifier: {
                value: undefined,
            },
            credentials: {
                value: undefined,
            },
            cognitoUserPoolClient: {
                value: undefined,
            },
            userPool: {
                value: undefined,
            },
        });
    }
};
