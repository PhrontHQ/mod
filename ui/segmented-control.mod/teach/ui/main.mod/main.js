const { Component } = require("mod/ui/component");

exports.Main = class Main extends Component {
    stringOptions = ["Apple", "Banana", "Cherry", "Orange"];
    objectOptions = [
        { label: "Daily", value: "daily" },
        { label: "Weekly", value: "weekly" },
        { label: "Monthly", value: "monthly" }
    ];

    mixedDisabledOptions = [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2", disabled: true },
        { label: "Option 3", value: "option3" }
    ];
};
