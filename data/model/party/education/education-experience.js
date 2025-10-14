var DataObject = require("data/model/data-object").DataObject;

/**
 * @class EducationExperience
 * @extends DataObject
 * @classdesc Represents a Person's gender.
 *
 */

exports.EducationExperience = DataObject.specialize(/** @lends EducationExperience.prototype */ {
    constructor: {
        //support a signature like (colorSpace, channel1, channel2, channel3, channel4, name)
        //or (colorSpace, [channel1, channel2, channel3, channel4], name)
        value: function EducationExperience() {
            return this;
        }
    },

    name: {
        value: undefined
    }


});
