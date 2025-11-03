/**
 * @module mod/data/model/messaging-channel/email-address
 */
const MessagingChannel = require("./messaging-channel").MessagingChannel;
const Montage = require("core/core").Montage;

/**
 * @class EmailAddress
 * @extends MessagingChannel
 *
 * A way to reach someone:
 *  - a postal address,
 * - a phone number / SMS
 * - an email,
 * - an instant message (skype...)
 * - a social profile (public twitter @account or private DM)
 * - a push notification (through Apple and Google push notifications, tied to a user identity)
 * - an in-app messaging, either when user is in-App or async via service-worker.
 *
 */
exports.EmailAddress = class EmailAddress extends MessagingChannel {
    static {
        Montage.defineProperties(this.prototype, {
            email: {
                value: undefined,
            },
            userName: {
                value: undefined,
            },
            domain: {
                value: undefined,
            },
        });
    }
};
