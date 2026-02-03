const { Component } = require("mod/ui/component");

exports.Main = class Main extends Component {

    get minDate() {
        if (!this._minDate) {
            let time = new Date().getTime();
            time = time - (3 * 24 * 60 * 60 * 1000);
            this._minDate = new Date(time);
        }
        return this._minDate;
    }

    get maxDate() {
        if (!this._maxDate) {
            let time = new Date().getTime();
            time = time + (60 * 24 * 60 * 60 * 1000);
            this._maxDate = new Date(time);
        }
        return this._maxDate;
    }


};
