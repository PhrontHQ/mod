const { Component } = require("mod/ui/component");

exports.Main = class Main extends Component {
    stringOptions = ["Apple", "Banana", "Cherry", "Orange"];
    objectOptions = [
        { label: "Daily", value: "daily" },
        { label: "Weekly", value: "weekly" },
        { label: "Monthly", value: "monthly" },
    ];
};
