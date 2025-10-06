var RegisteredOrganization = require("./registered-organization").RegisteredOrganization;

/**
 * @class GovernmentAgency
 * @extends RegisteredOrganization
 * 
 * 
 * 
 */

/*

*/


exports.GovernmentAgency = RegisteredOrganization.specialize(/** @lends IncorporatedOrganization.prototype */ {
    constructor: {
        value: function GovernmentAgency() {
            this.super();
            return this;
        }
    }

});
