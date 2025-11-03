/**
 * @module mod/data/model/messaging-channel/contact-form
 */
const MessagingChannel = require("./messaging-channel").MessagingChannel;
const Montage = require("core/core").Montage;

/**
 * @class ContactForm
 * @extends MessagingChannel
 *
 * A way to reach someone by submitting a form i a web page, typically associated with an HTTP Post:
 *
 *
 */
exports.ContactForm = class ContactForm extends MessagingChannel {
    static {
        Montage.defineProperties(this.prototype, {
            /**
             * The url where the form is
             *     *
             * @property {URL}
             */
            url: {
                value: undefined,
            },

            /**
             * The FormData - https://developer.mozilla.org/en-US/docs/Web/API/FormData
             *
             * Might need polyfill for node.js:
             * - https://www.npmjs.com/package/form-data ?
             * - https://github.com/form-data/form-data ?
             *
             * - https://www.npmjs.com/package/formdata-node
             * - https://github.com/octet-stream/form-data
             *
             * - https://www.npmjs.com/package/formdata-polyfill
             * - https://github.com/jimmywarting/FormData
             *
             * @property {FormData}
             */

            formData: {
                value: undefined,
            },
        });
    }
};
