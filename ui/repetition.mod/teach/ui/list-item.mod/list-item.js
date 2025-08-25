var Component = require("mod/ui/component").Component;

/**
 * @class ListIten
 * @extends Component
 */
exports.ListItem = Component.specialize();
const ListItem = class ListItem extends Component {

    _value = "default"

    get value() {
        return this._value;
    }

    set value(aValue) {
        if(this._value !== aValue) {
            this._value = aValue;
        }
    }

}
