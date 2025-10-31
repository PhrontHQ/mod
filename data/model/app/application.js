/**
 * @module phront/data/main.mod/model/aws/secret
 */

const DataObject = require("../data-object").DataObject;
const Montage = require("core/core").Montage;

/**
 * @class Application
 * @extends DataObject
 *
 * An application is an instance of a project configured to run for a certain organization.
 *
 * The same source application could be configured differently
 * and at some point needs to be "owned" by an organization.
 * Needs to add source project aspects - like the GitHub project URL/ID
 *
 */
exports.Application = class Application extends DataObject {
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
            controllingParty: {
                value: undefined,
            },
            appClients: {
                value: undefined,
            },
            userPool: {
                value: undefined,
            },
            controllingOrganization: {
                value: undefined,
            },
        });
    }
};
