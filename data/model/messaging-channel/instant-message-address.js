/**
 * @module mod/data/model/messaging-channel/instant-message-address
 */
const MessagingChannel = require("./messaging-channel").MessagingChannel;
const Montage = require("core/core").Montage;

/**
 * @class InstantMessageAddress
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
exports.InstantMessageAddress = class InstantMessageAddress extends MessagingChannel {
    static {
        Montage.defineProperties(this.prototype, {
            serviceName: {
                value: undefined,
            },
            userName: {
                value: undefined,
            },
            provider: {
                value: undefined,
            },
        });
    }
};
