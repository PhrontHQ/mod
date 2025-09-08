/* global console */

/**
 * @module ui/main.mod
 * @requires mod/ui/component
 */
var Component = require("mod/ui/component").Component;

/**
 * @class MainVs
 * @extends Component
 */
exports.MainVs = Component.specialize(/** @lends MainVs.prototype */ {

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.visualStyle.apply();
            }
        }
    },

    handleSliderAction: {
        value: function (event) {
            event.stopPropagation();
            console.log("handleSliderAction");
        }
    }
});
