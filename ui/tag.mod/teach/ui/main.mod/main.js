const { Component } = require("mod/ui/component");

exports.Main = class Main extends Component {
    handleTagDismiss(event) {
        console.log("Tag dismissed:", event.detail.tag.label);
        // In a real application, you might remove the tag from a collection
    }
};
