var Montage = require("mod/core/core").Montage,
    Component = require("mod/ui/component").Component;

exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    },

    label: {
        value: null
    },

    text: {
        value: null
    }

});
