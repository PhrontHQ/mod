/**
    @module mod/data/model/authentication/o-auth-access-token
*/

const DataObject = require("../data-object").DataObject;
const Montage = require("core/core").Montage;

/**
 * @class OAuthAccessToken
 * @extends DataObject
 *
 * Resources
 * https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/overview/ad-fs-openid-connect-oauth-flows-scenarios
 *
 */
exports.OAuthAccessToken = class OAuthAccessToken extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            identity: {
                value: undefined,
            },
            accessToken: {
                value: undefined,
            },
            tokenType: {
                value: undefined,
            },
            validityDuration: {
                value: undefined,
            },

            validityRange: {
                value: undefined,
            },
            scope: {
                value: undefined,
            },
            refreshToken: {
                value: undefined,
            },
            idToken: {
                value: undefined,
            },
            refreshTokenValidityDuration: {
                value: undefined,
            },
            refreshTokenValidityRange: {
                value: undefined,
            },
        });
    }

    /**
     * Returns the number of millisecond for which a token is valid.
     * If that number is negative, it's expired.
     *
     * @property
     * @readonly
     * @returns {Number} Array of relevant propertyDescriptors
     */

    get remainingValidityDuration() {
        return this.validityRange.end.valueOf() - Date.now();
    }
};
