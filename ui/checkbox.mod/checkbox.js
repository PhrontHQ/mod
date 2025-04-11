/**
 * @module "mod/ui/native/checkbox.mod"
 * @requires mod/ui/check-control
 */
const { CheckControl } = require("ui/check-control");

/**
 *  @class module:"mod/ui/native/checkbox.mod".Checkbox
 *  @extends module:mod/ui/check-control.CheckControl
 */
exports.Checkbox = class Checkbox extends CheckControl {
    static {
        Montage.defineProperties(this.prototype, {
            hasTemplate: { value: false }
        });
    }

    // <---- Lifecycle Functions ---->

    enterDocument(firstTime) {
        if (firstTime) {
            this.element.setAttribute("role", "checkbox");
        }
    }
};
