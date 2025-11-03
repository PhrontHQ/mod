/**
 * @module mod/data/model/messaging-channel/phone-number
 */
const MessagingChannel = require("./messaging-channel").MessagingChannel;
const Montage = require("core/core").Montage;

/**
 * @class PhoneNumber
 * @extends DataObject
 * @classdesc Represents a PhoneNumber, in any country.
 *
 * TODO: Using https://github.com/paypal/fullstack-phone
 * https://www.npmjs.com/package/fullstack-phone
 *
 * for the actual phone number, which parts are stored inline but gathered as one type here that
 * will be leveraged from that library
 */
exports.PhoneNumber = class PhoneNumber extends MessagingChannel {
    static {
        Montage.defineProperties(this.prototype, {
            countryCode: {
                value: undefined,
            },
            nationalNumber: {
                value: undefined,
            },
            extension: {
                value: undefined,
            },
            supportsVoice: {
                value: undefined,
            },
            supportsTextMessage: {
                value: undefined,
            },
            supportsMultimediaMessage: {
                value: undefined,
            },
            supportsiMessage: {
                value: undefined,
            },
            supportsRichCommunication: {
                value: undefined,
            },
            supportsFax: {
                value: undefined,
            },
            isMobile: {
                value: undefined,
            },
            supportsVideoConferencing: {
                value: undefined,
            },
            supportsPaging: {
                value: undefined,
            },
            supportsTextphone: {
                value: undefined,
            },
            supportsRealTimeText: {
                value: undefined,
            },
        });
    }
};
