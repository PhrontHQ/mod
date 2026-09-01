var Component = require("mod/ui/component").Component,
    Promise = require('mod/core/promise');

exports.Main = Component.specialize(/** @lends Main# */{

   
    handleArchiveAction: {
        value: function () {
            console.log("archive");
            this.listItem.close();
        }
    },

    handleDeleteAction: {
        value: function () {
            console.log("delete");
            this.listItem.close();
        }
    }

});
