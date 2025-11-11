/**
 * @module mod/data/model/ux/user-experience
 */

const DataObject = require("../../data-object").DataObject;
const Montage = require("core/core").Montage;

/**
 * @class UserExperience
 * @extends DataObject
 *
 * UserExperience represents the data, the "information architecture" of an end-mod / user-mod 
 * 
 * - It holds userIdentityProviders, the Organizations from which a user we'll be offered to authenticate with
 * or none if it can be used anonymously
 * - it holds userIdentities, a list of UserIdentity data instances obtained after authentication via one of the UserExperience's identityProviders
 * - It holds sections, a list of UserExperienceSection instances that individually represent every aspect of an end-mod
 *
 * A User Pool can be provided by external services, in which case this acts as a cache.
 */
exports.UserExperience = class UserExperience extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            userIdentityProviders: {
                value: undefined,
            },
            userIdentities: {
                value: undefined,
            },
            sections: {
                value: undefined,
            }
        });
    }
};