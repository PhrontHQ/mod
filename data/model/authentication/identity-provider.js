/**
    @module mod/data/model/app/authorization/j-s-o-n-web-token
*/

var Intangible = require("../party/intangible").Intangible;

/**
 * @class IdentityProvider
 * @extends Intangible
 *
 */

/*

*/

exports.IdentityProvider = Intangible.specialize(/** @lends JSONWebToken.prototype */ {
    constructor: {
        value: function IdentityProvider() {
            this.super();
            return this;
        }
    },
    ownerOrganization: {
        value: undefined
    },
    tenantOrganizations: {
        value: undefined
    }
});
