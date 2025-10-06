/**
    @module "mod/ui/url-field.mod"
*/
var TextField = require("ui/text-field.mod").TextField;
/**
 * Wraps the <input type="url"> element with binding support for the element's standard attributes.
   @class module:"mod/ui/url-field.mod".UrlField
   @extends module:mod/ui/text-field.TextField

 */
const UrlField = exports.UrlField = TextField.specialize({
    constructor: {
        value: function UrlField() {
            this.super(this); // super
        }
    },

    hasTemplate: {
        value: true
    }


});