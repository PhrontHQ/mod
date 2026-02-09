/**
 * @module "ui/main.mod"
 */
const Component = require("mod/ui/component").Component;

/**
 * @class Main
 * @extends Component
 */
exports.Main = class Main extends Component {
    menuOptions = [
        { label: "Home", value: "home" },
        { label: "About", value: "about" },
        { label: "Contact", value: "contact" },
    ];

    items = [
        { title: "Item 1", description: "This is the first item." },
        { title: "Item 2", description: "This is the second item." },
        { title: "Item 3", description: "This is the third item." },
    ];
};
