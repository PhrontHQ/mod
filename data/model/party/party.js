var DataObject = require("../data-object").DataObject;
/**
 * @class Party
 * @extends DataObject
 */


exports.Party = DataObject.specialize(/** @lends Party.prototype */ {

    name: {
        value: undefined
    },
    aliases: {
        value: undefined
    },
    existenceTimeRange: {
        value: undefined
    },
    postalAddresses: {
        value: undefined
    },
    emailAddresses: {
        value: undefined
    },
    phoneNumbers: {
        value: undefined
    },
    instantMessageAddresses: {
        value: undefined
    },
    urlAddresses: {
        value: undefined
    },
    contactForms: {
        value: undefined
    },
    images: {
        value: undefined
    }

});
