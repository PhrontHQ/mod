var Intangible = require("./intangible").Intangible;

/**
 * @class Profile
 * @extends Intangible
 * 
 */

exports.Profile = class Profile extends Intangible {

    static {
        Montage.defineProperties(this.prototype, {
            /**
             * @property {Party}
             * @public
             * @override
             */
            representedParty: { value: undefined },

            /**
             * hostOrganization
             * @property {Organization}
             * @public
             */
            hostOrganization: { value: undefined },

            /**
             * The name used by the representedParty within hostOrganization.
             * @property {String}
             * @public
             * @override
             */
            name: { value: undefined },

            /**
             * @property {Image}
             * @public
             * @override
             */
            visualRepresentation: { value: undefined },

            /**
             * An array of BCP 47 locale identifiers (e.g., "en-US")
             * representing the person's language preferences.
             * @property {URL}
             * @public
             */
            hostUrl: { value: undefined },


        });
    }
};
