/**
    @module "mod/ui/url-field.mod"
*/
var TextField = require("ui/text-field.mod").TextField;
/**
 * Wraps the <input type="url"> element with binding support for the element's standard attributes.
   @class module:"mod/ui/url-field.mod".UrlField
   @extends module:mod/ui/text-field.TextField

 */
exports.UrlField = class UrlField extends TextField {
    constructor() {
        super(); // super
    }

    static {

        TextField.defineProperties(UrlField.prototype, {

            hasTemplate: {
                value: true
            }

        })

    }

};