/**
 * @module mod/data/model/messaging-channel/messaging-channel
 */
const DataObject = require("../data-object").DataObject;
const Montage = require("core/core").Montage;

/**
 * @class MessagingChannel
 * @extends DataObject
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
exports.MessagingChannel = class MessagingChannel extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            label: {
                value: undefined,
            },
            preferredForParties: {
                value: undefined,
            },
            description: {
                value: undefined,
            },
            tags: {
                value: undefined,
            },
        });
    }
};
