var DataObject = require("../data-object").DataObject;

/**
 * @class OrganizationRegistration
 * @extends DataObject
 */


 /*

 TODO: add timeRanges to model Operating Hours	Operating hours	Specifies a time zone and associated time slots for a branch or office location.

 There could be a morningOperationTimeRange,
 A range of "days" can have an array of ranges of operating hours

 That should give us enough flexibility

 */


exports.OrganizationRegistration = DataObject.specialize(/** @lends OrganizationRegistration.prototype */ {
    constructor: {
        value: function OrganizationRegistration() {
            this.super();
            return this;
        }
    },
    registrarOrganization: {
        value: undefined
    },
    Identifier: {
        value: undefined
    },
    registrantOrganization: {
        value: undefined
    }
});
