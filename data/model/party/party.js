const { Montage } = require("core/core");
const DataObject = require("../data-object").DataObject;

/**
 * Represents a party, which can be an individual, organization, or group.
 * @class Party
 * @extends DataObject
 */
exports.Party = class Party extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            /**
             * The primary name of the party.
             * @type {string}
             * @public
             */
            name: { value: undefined },

            /**
             * An array of alternative names for the party.
             * @type {string[]}
             * @public
             */
            aliases: { value: undefined },

            /**
             * An array of postal addresses associated with the party.
             * @type {PartyPostalAddressDescriptor[]}
             */
            postalAddresses: { value: undefined },

            /**
             * An array of email addresses associated with the party.
             * @type {PartyEmailAddressDescriptor[]}
             * @public
             */
            emailAddresses: { value: undefined },

            /**
             * An array of phone numbers associated with the party.
             * @type {PartyPhoneNumberDescriptor[]}
             * @public
             */
            phoneNumbers: { value: undefined },

            /**
             * An array of SMS numbers associated with the party.
             * @type {PartySmsNumberDescriptor[]}
             * @public
             */
            smsNumbers: { value: undefined },

            /**
             * An array of instant message addresses associated with the party.
             * @type {PartyInstantMessageAddressDescriptor[]}
             * @public
             */
            instantMessageAddresses: { value: undefined },

            /**
             * An array of URL addresses associated with the party.
             * @type {URL[]}
             * @public
             */
            urlAddresses: { value: undefined },

            /**
             * An array of contact forms associated with the party.
             * @type {PartyContactFormDescriptor[]}
             * @public
             */
            contactForms: { value: undefined },

            /**
             * An array of images associated with the party.
             * @type {ImageDescriptor[]}
             * @public
             */
            images: { value: undefined },
        });
    }
};
