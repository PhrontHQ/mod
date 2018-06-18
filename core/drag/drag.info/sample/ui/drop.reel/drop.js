/**
 * @module ui/drop.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Drop
 * @extends Component
 */
exports.Drop = Component.specialize(/** @lends Drop# */ {

    dataSource: {
        value: null
    },

    data: {
        value: null
    },

    enterDocument: {
        value: function () {
            this.data = [];
            this.registerDroppable();
            this.application.addEventListener("dragstart", this, false);
        }
    },

    exitDocument: {
        value: function () {
            this.unregisterDroppable();
            this.application.removeEventListener("dragstart", this, false);
        }
    },

    handleDragstart: {
        value: function (event) {
            var shouldAddToCandidate = false;

            if (this.dataSource) {
                var value = event.dataTransfer.getData("text/plain");
                shouldAddToCandidate = value && this.data.indexOf(value) === -1 && 
                    this.dataSource.indexOf(+value) > -1;
            }

            if (shouldAddToCandidate) {
                event.dataTransfer.candidateDropTargets.add(this);
                this._addEventListeners();
            }
        }
    },

    handleDrop: {
        value: function (event) {
            var value = event.dataTransfer.getData("text/plain");

            if (value && this.data.indexOf(value) === -1) {
                this.data.push(value);

                if (event.dataTransfer.dropEffect === "move") {
                    var index;

                    if (
                        this.dataSource && 
                        (index = this.dataSource.indexOf(value)) > -1
                    ) {
                        this.dataSource.splice(index, 1);
                    }
                }
            }
        }
    },

    handleDragended: {
        value: function (event) {
            this._removeEventListeners();
        }
    },

    _addEventListeners: {
        value: function () {
            this.addEventListener("dragended", this);
            this.addEventListener("drop", this);
        }
    },

    _removeEventListeners: {
        value: function () {
            this.removeEventListener("dragended", this);
            this.removeEventListener("drop", this);
        }
    }

});
