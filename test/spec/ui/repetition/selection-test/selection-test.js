var Montage = require("mod/core/core").Montage;
var TestController = require("mod-testing/test-controller").TestController;
var UUID = require("mod/core/uuid");

exports.SelectionTest = TestController.specialize( {

    nameController: {
        value: null
    },

    content: {
        value: null
    },

    constructor: {
        value: function () {
            this.super();
            this.content = ["Alice", "Bob", "Carol", "Dave", "Eve"];
        }
    },

    handleClearSelectionButtonPress: {
        value: function (evt) {
            this.clearSelection();
        }
    },

    handleSelectIndex0ButtonPress: {
        value: function (evt) {
            this.selectIndex(0);
        }
    },

    handleSelectIndex2ButtonPress: {
        value: function (evt) {
            this.selectIndex(2);
        }
    },

    handleSelectIndex4ButtonPress: {
        value: function (evt) {
            this.selectIndex(4);
        }
    },

    handleAddAndSelectButtonPress: {
        value: function (evt) {
            this.addAndSelect();
        }
    },

    clearSelection: {
        value: function () {
            this.nameController.selection = [];
        }
    },

    selectIndex: {
        value: function (index) {
            this.nameController.selection = [this.content[index]];
        }
    },

    addAndSelect: {
        value:function () {
            var value = "Person " + UUID.generate();
            this.nameController.add(value);
            this.nameController.select(value);
        }
    }
});
