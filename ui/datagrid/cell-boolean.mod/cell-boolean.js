var Cell = require("../cell.mod").Cell;

exports.CellBoolean = class CellBoolean extends Cell {

    enterDocument(isFirstTime) {
        super.enterDocument(isFirstTime);
        if (isFirstTime) {
            this._element.addEventListener("click", this);
            this.checkbox.addEventListener("input", this);
        }
        this.checkbox.checked = this._value;
    }

    handleClick() {
        this.checkbox.focus();
    }



    handleInput () {
        this.value = this.checkbox.checked;
    }

    static {
        Cell.defineProperties(CellBoolean.prototype, {
            _value: {
                value: false
            },

            value: {
                get: function () {
                    return this._value;
                },
                set: function (value) {
                    value = !!value;
                    if (this._value !== value) {
                        this._value = value;
                        if (this.checkbox) {
                            this.checkbox.checked = value;
                        }
                    }
                }
            },
        });
    }

}
