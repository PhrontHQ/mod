/**
 * @module mod/data/model/authentication/identity-provider
 */
const Intangible = require("../party/intangible").Intangible;
const Montage = require("../../../core/core").Montage;

/**
 * @class IdentityProvider
 * @extends Intangible
 */
exports.IdentityProvider = class IdentityProvider extends Intangible {
    static {
        Montage.defineProperties(this.prototype, {
            ownerOrganization: {
                value: undefined,
            },
            tenantOrganizations: {
                value: undefined,
            },
        });
    }
};
