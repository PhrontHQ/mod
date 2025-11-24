const Montage = require("core/core").Montage,
   Identity = require("../identity").Identity;


/**
 * @class UserIdentity
 * @extends DataObject
 */
exports.UserIdentity =  class UserIdentity extends Identity /** @lends UserIdentity */ {

    static {

        Montage.defineProperties(this.prototype, {

            username: {
                value: undefined
            },
            password: {
                value: undefined
            },
            accountConfirmationCode: {
                value: undefined
            },
            isAccountConfirmed: {
                value: false
            },
            isAuthenticated: {
                get: function () {
                    return !!this.session;
                },
                set: function (value) {
                    if (this.session && !value) {
                        this.session = null;
                    }
                }
            },
            isMfaEnabled: {
                value: false
            },
            firstName: {
                value: undefined
            },
            lastName: {
                value: undefined
            },
            email: {
                value: undefined
            },
            phone: {
                value: undefined
            },
            image: {
                value: undefined
            },
            tags: {
                value: undefined
            },
            idToken: {
                value: undefined
            },
            accessToken: {
                value: undefined
            },
            mfaCode: {
                value: undefined
            },
            locale: {
                value: undefined
            },
            timeZone: {
                value: undefined
            },
            user: {value: undefined},
            images: {value: undefined},
            addresses: {value: undefined},
        });
    }    
}
