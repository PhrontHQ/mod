/**
    @module mod/data/model/app/authentication/o-auth-access-token
*/

const DataObject = require("../../data-object").DataObject;
/**
 * @class OAuthAccessToken
 * @extends DataObject
 *
 */

/*
    Reasources
    https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/overview/ad-fs-openid-connect-oauth-flows-scenarios

*/

exports.OAuthAccessToken = DataObject.specialize(/** @lends OAuthAccessToken.prototype */ {
    identity: {
        value: undefined
    },
    accessToken: {
        value: undefined
    },
    tokenType: {
        value: undefined
    },
    validityDuration: {
        value: undefined
    },

    /**
     * Returns the number of millisecond for which a token is valid.
     * If that number is negative, it's expired.
     *
     * @property
     * @readonly
     * @returns {Number} Arrat of relevant propertyDescriptors
     */
    remainingValidityDuration: {
        get: function() {
            return this.validityRange.end.valueOf() - Date.now();
        }
    },

    validityRange: {
        value: undefined
    },
    scope: {
        value: undefined
    },
    refreshToken: {
        value: undefined
    },
    idToken: {
        value: undefined
    },
    refreshTokenValidityDuration: {
        value: undefined
    },
    refreshTokenValidityRange: {
        value: undefined
    }
});
