var Organization = require("./organization").Organization;

/**
 * @class UnregisteredOrganization
 * @extends Organization
 */


 /*


 */


exports.UnregisteredOrganization = Organization.specialize(/** @lends UnregisteredOrganization.prototype */ {
    constructor: {
        value: function Organization() {
            this.super();
            return this;
        }
    }

});
