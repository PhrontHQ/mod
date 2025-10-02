/**
 * @module "ui/property-field.mod"
 */
var Component = require("ui/component").Component,
    Montage = require("montage").Montage;

/**
 * @class PropertyField
 * @extends Component
 */
exports.PropertyField = class PropertyField extends Component {

    static {

        Montage.defineProperties(this.prototype, {

            /******************
             * Data 
             */

            /***
             * The instance of the object that owns this property
             * @type {Object}
             */
            dataInstance: {
                value: undefined
            },

            /***
             * The type of the object that owns this property
             * @type {ObjectDescriptor|Class}
             */
            dataType: {
                value: undefined
            },

            /***
             * FRB expression of the value on the dataInstance
             * @type {ObjectDescriptor|Class}
             */
            propertyExpression: {
                value: undefined
            },


            /******************
             * Basic 
             */
            label: {
                value: ""
            },

            isLabelExternal: {
                value: false
            },

            isRequired: {
                value: false
            },
            

            helpMessage: {
                value: undefined
            },

            /******************
             * Validation 
             */

            /***
             * Derived from validity state? 
             * 
             * Or perhaps better if it's error with type ValidityError
             * @type {String}
             */
            errorMessage: {
                value: null
            },

            /***
             * PROPOSAL
             * 
             * Convenience derived from validity state?
             * @type {Boolean}
             */
            isValid: {
                value: false
            },


            /***
             * Represents why or why not the current value is valid
             * @type {ValidityState}
             */
            validityState: {
                value: undefined
            },

            /***
             * A list of rules provided by the data model 
             * @type {ValiditationRule}
             */
            validitationRules: {
                value: undefined
            }
        })

    }
};
