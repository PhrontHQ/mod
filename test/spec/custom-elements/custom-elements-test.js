
var querySelector = function (e) { return document.querySelector(e); }

var Montage = require("mod/core/core").Montage;
var Component = require("mod/ui/component").Component;
var Application = require("mod/core/application").application;
// var MontageText = require("mod/ui/text.mod").Text;

var CustomElementTest = exports.CustomElementTest = Montage.specialize({
    textLabel2: {
        value: 'textLabel2'
    }
});
