var Party = require("./party").Party;

/**
 * @class Organization
 * @extends Party
 */


 /*

 TODO: add timeRanges to model Operating Hours	Operating hours	Specifies a time zone and associated time slots for a branch or office location.

 There could be a morningOperationTimeRange,
 A range of "days" can have an array of ranges of operating hours

 That should give us enough flexibility

 */


exports.Organization = Party.specialize(/** @lends Organization.prototype */ {
    constructor: {
        value: function Organization() {
            this.super();
            return this;
        }
    },
    parent: {
        value: undefined
    },
    suborganizations: {
        value: undefined
    },
    tags: {
        value: undefined
    },
    mainContact: {
        value: undefined
    },
    userPools: {
        value: undefined
    },
    applications: {
        value: undefined
    },

    /*
        Partial because temporary
    */
    deserializeSelf: {
        value: function(deserializer) {
            this.super(deserializer);

            var value;
            value = deserializer.getProperty("name");
            if (value !== void 0) {
                this.name = value;
            }

            value = deserializer.getProperty("identifier");
            if (value !== void 0) {
                this.identifier = value;
            }

        }
    }

});
