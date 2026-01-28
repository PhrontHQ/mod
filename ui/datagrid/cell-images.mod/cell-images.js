var Cell = require("../cell.mod").Cell;

exports.CellImages = class CellImages extends Cell {

    enterDocument (isFirstTime) {
        super.enterDocument(isFirstTime);
        if (isFirstTime) {
            this._element.addEventListener("click", this);
        }
    }
    

    handleClick() {
        if (this.hasExpandButton) {
            this.expandButton.focus();
        }
    }

};
