var Component = require("mod/ui/component").Component;

/**
 * @class List
 * @extends Component
 */
const List = exports.List = class List extends Component {
    _iterationdDefaultListItem = null

    get iterationdDefaultListItem() {
        return this._iterationdDefaultListItem;
    }

    set iterationdDefaultListItem(aValue) {
        if(this._iterationdDefaultListItem !== aValue) {
            this._iterationdDefaultListItem = aValue;
        }
    }

}
