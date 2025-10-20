const { Montage } = require("core/core");
const { Being } = require("./being");

/**
 * Represents a human individual, extending the base 'Being' class
 * with properties specific to a person, such as name, gender, and aliases.
 * @class Person
 * @extends Being
 */
exports.Person = class Person extends Being {
    static {
        Montage.defineProperties(this.prototype, {
            /**
             * Encapsulates the components of a person's full name.
             * Overrides Party's string-based name.
             * @property {PersonName}
             * @public
             * @override
             */
            name: { value: undefined },

            /**
             * A Person's gender.
             * @property {"Male"|"Female"|"Other"|"Undisclosed"}
             * @public
             */
            gender: { value: undefined },

            /**
             * An array of additional or alternative names (aliases)
             * for the person, such as a name from before marriage.
             * @property {PersonName[]}
             * @public
             * @override
             */
            aliases: { value: undefined },

            /**
             * An array of BCP 47 locale identifiers (e.g., "en-US")
             * representing the person's language preferences.
             * @property {string[]}
             * @public
             */
            preferredLocales: { value: undefined },

            /**
             * An array of strings used for categorization.
             * @property {string[]}
             * @public
             */
            tags: { value: undefined },

            /**
             * An array of linked user accounts or identities.
             * @property {UserIdentity[]}
             * @public
             */
            userIdentities: { value: undefined },

            /**
             * An array of PersonSignatureDescriptor representing the person's digital signatures.
             * @property {PersonSignatureDescriptor[]}
             * @public
             */
            signatures: { value: undefined },

            /**
             * An array of PersonEducationExperience representing the person's educational background.
             * @property {PersonEducationExperience[]}
             * @public
             */
            educationExperiences: { value: undefined },
        });
    }
};
