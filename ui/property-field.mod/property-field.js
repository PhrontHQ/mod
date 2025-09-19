/**
 * @module ui/field.reel
 */
var Component = require("ui/component").Component;

/**
 * @class PropertyField
 * @extends Component or Control?
 */
var PropertyField = exports.PropertyField = Component.specialize(/** @lends PropertyField# */ {

    helpShown: {
        value: false
    },

    handleFieldInfoButtonAction: {
        value: function () {
            this.helpShown = !this.helpShown;
        }
    },

    handleCloseHelpButtonAction: {
        value: function () {
            this.helpShown = !this.helpShown;
        }
    }
});

//The following is legacy and likely needs to evolve

/*

    bindPropertyToClassName is an attempt to simplify the task of associating
    a logical state, here in a component, but likely comes from data, to a 
    visual state, here through the use of a matching CSS class name.

    This can be done instead with a binding like:

    "classList.has('has-error')": {"<-": "@owner.hasError"}

    which can easily be applied to either conponent or data object on the 
    right side.

    This is a frequent pattern that we need to provide a stronger anwer to, 
    so we can expose it in a visual way easy to understand for people who
    don't code.

*/

// bindPropertyToClassName = function bindPropertyToClassName (constructor, propertyName, className, isReversed) {
//     var privatePropertyName = "_" + propertyName;

//     constructor.prototype["_" + privatePropertyName] = false;

//     Object.defineProperty(constructor.prototype, propertyName, {
//         set: function (value) {
//             if (typeof value === "boolean" && this[privatePropertyName] !== value) {
//                 this[privatePropertyName] = value;

//                 if ((value && !isReversed) || (isReversed && !value)) {
//                     this.classList.add(className);
//                 } else {
//                     this.classList.remove(className);
//                 }
//             } else {
//                 this.classList.remove(className);
//                 this[privatePropertyName] = null;
//             }
//         },
//         get: function () {
//             return this[privatePropertyName];
//         }
//     });
// };


// bindPropertyToClassName(Field, "hasError", "has-error");
// bindPropertyToClassName(Field, "isValidated", "is-validated");
// bindPropertyToClassName(Field, "disabled", "is-disabled");
