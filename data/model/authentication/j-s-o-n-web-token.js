/**
    @module mod/data/model/app/authorization/j-s-o-n-web-token
*/

var DataObject = require("../../data-object").DataObject;

/**
 * @class JSONWebToken
 * @extends DataObject
 *
 */

/*
    Reasources
    https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/overview/ad-fs-openid-connect-oauth-flows-scenarios

*/

exports.JSONWebToken = DataObject.specialize(/** @lends JSONWebToken.prototype */ {
    constructor: {
        value: function() {
            this.super();
            return this;
        }
    },
    header: {
        value: undefined
    },
    claims: {
        value: undefined
    }
});
