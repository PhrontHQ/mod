"use strict";

var Component = require("mod/ui/component").Component;

exports.Bar = Component.specialize({

    title: {value: "Bar Component"},

    buildInAnimation: {
        value: {
            fromCssClass: "barBuildInFrom",
            cssClass: "barBuildIn"
        }
    },

    buildOutAnimation: {
        value: {
            cssClass: "barBuildOut",
            toCssClass: "barBuildOutTo"
        }
    }

});
