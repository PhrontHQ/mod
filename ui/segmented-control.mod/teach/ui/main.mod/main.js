const { Component } = require("mod/ui/component");

exports.Main = class Main extends Component {
    stringOptions = ["Apple", "Banana", "Cherry", "Orange"];
    objectOptions = [
        { label: "Daily", value: "daily" },
        { label: "Weekly", value: "weekly" },
        { label: "Monthly", value: "monthly" },
    ];

    dynamicOptions = [
        "Lychee",
        "Papaya",
        "Guava",
        "Mango",
        "Passion Fruit",
        "Pineapple",
        "Dragon Fruit",
        "Coconut",
    ];
    dynamicSelection = "Mango";

    _moreOptions = [
        "Watermelon",
        "Tamarillo",
        "Yuzu",
        "Persimmon",
        "Starfruit",
        "Kumquat",
        "Jackfruit",
        "Feijoa",
        "Rambutan",
        "Longan",
        "Soursop",
        "Mangosteen",
    ];
    _moreOptionsIndex = 0;

    handleAction(event) {
        switch (event.target.identifier) {
            case "addDynamicOption":
                this.dynamicOptions.push(this._moreOptions[this._moreOptionsIndex++ % this._moreOptions.length]);
                break;
            case "removeDynamicOption":
                if (this.dynamicOptions.length <= 1) break;

                const [removedOption] = this.dynamicOptions.splice(-1, 1);

                if (removedOption === this.dynamicSelection) {
                    this.dynamicSelection = this.dynamicOptions[this.dynamicOptions.length - 1];
                }
                break;
        }
    }
};
