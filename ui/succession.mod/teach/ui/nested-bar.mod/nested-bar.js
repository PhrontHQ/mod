"use strict";

var Component = require("mod/ui/component").Component;

exports.NestedBar = Component.specialize({

    title: {value: "NestedBar Component"},

    buildInAnimation: {
        value: {
            fromCssClass: "nestedBarBuildInFrom",
            cssClass: "nestedBarBuildIn"
        }
    },

    buildOutAnimation: {
        value: {
            cssClass: "nestedBarBuildOut",
            toCssClass: "nestedBarBuildOutTo"
        }
    },
     handleBuildInEnd: {
        value: function (event) {
            this.lastBuildInComponentIdentifier = event.target.identifier;
        }
    },

    handleBuildOutEnd: {
        value: function (event) {
            this.lastBuildOutComponentIdentifier = event.target.identifier;
        }
    }
});
