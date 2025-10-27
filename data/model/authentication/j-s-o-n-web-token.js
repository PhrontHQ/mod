/**
    @module mod/data/model/authentication/j-s-o-n-web-token
*/
const DataObject = require("../data-object").DataObject;
const Montage = require("core/core").Montage;

/**
 * @class JSONWebToken
 * @extends DataObject
 *
 * Reasources
 * https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/overview/ad-fs-openid-connect-oauth-flows-scenarios
 *
 */
exports.JSONWebToken = class JSONWebToken extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            header: {
                value: undefined,
            },
            claims: {
                value: undefined,
            },
        });
    }
};
