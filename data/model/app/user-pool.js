/**
    @module app-infrastructure-data.mod/data/main.mod/model/secret
*/

const DataObject = require("../data-object").DataObject;
const Montage = require("core/core").Montage;

/**
 * @class UserPool
 * @extends DataObject
 *
 * An UserPool creates the structure to host collections of users, app clients, devices
 * that typically belongs to an organization. There might be multiple reason and strategies
 * for on party (Organization, person) to use multiple pools.
 *
 */
exports.UserPool = class UserPool extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            name: {
                value: undefined
            },
            applications: {
                value: undefined
            },
            servedOrganizations: {
                value: undefined
            }
        });
    }
};
