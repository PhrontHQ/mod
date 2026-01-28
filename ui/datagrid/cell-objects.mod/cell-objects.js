var Cell = require("../cell.mod").Cell;

exports.CellObjects = class CellObjects extends Cell {


    enterDocument (isFirstTime) {
        super.enterDocument(isFirstTime);
        if (isFirstTime) {
            this._element.addEventListener("click", this);
        }
    }

    handleClick () {
        if (this.hasExpandButton) {
            this.expandButton.focus();
        }
    }

};
