/*global require, exports, console, MontageElement */

/**
 * @module "ui/modal-overlay.mod"
 */
var Overlay = require("../overlay.mod").Overlay,
    Promise = require("../../core/promise").Promise;

var CLASS_PREFIX = "modalOverlay-mod";

/**
 * @class ModalOverlay
 * @extends Overlay
 */
exports.ModalOverlay = class ModalOverlay extends Overlay {

    enterDocument(firstTime) {
        var body;
            
            super.enterDocument(firstTime);

            if (firstTime) {
                body = this.element.ownerDocument.body;
                body.appendChild(this.modalMaskElement);
            }
    }
    
    show(component) {
        var queue = this._queue,
                ix = queue.indexOf(this),
                promise;

            // The overlay is not scheduled to draw so we add it to the queue
            // and return a promise that will be solved when shown.
            // If no overlay is being shown (empty queue) then we show it
            // immediately and return a solved promise.
            if (ix === -1) {
                if (queue.length === 0) {
                    super.show();
                    promise = Promise.resolve();
                } else {
                    promise = this._showPromise = {};
                     this._showPromise.promise = new Promise(function(resolve, reject) {
                         promise.resolve = resolve;
                         promise.reject = reject;
                     });
                    promise = this._showPromise.promise;
                }

                if (component) {
                    this._slotComponent.content = component;
                }

                queue.push(this);

                // The overlay is scheduled to draw so we just return the
                // previously created promise. If the overlay is currently
                // being shown (head of the queue) then we add it again to the
                // queue.
            } else {
                if (ix === 0) {
                    promise = this._showPromise = {};
                     this._showPromise.promise = new Promise(function(resolve, reject) {
                         promise.resolve = resolve;
                         promise.reject = reject;
                     });
                    queue.push(this);
                }
                promise = this._showPromise.promise;
            }

            return promise;
    }

    hide() {
        var queue = this._queue,
                ix = queue.indexOf(this),
                nextOverlay;

            if (ix === 0) {
                queue.shift();
                super.hide();
                if (queue.length > 0) {
                    nextOverlay = queue[0];
                    nextOverlay._showPromise.resolve();
                    Overlay.prototype.show.call(nextOverlay);
                }
            } else if (ix > 0) {
                queue.splice(ix, 1);
                this._showPromise.reject(new Error("Modal Overlay position in the queue is not 0"));
            }
    }

    draw() {
        super.draw();

        if (this._isShown && this.hasModalMask) {
            this.modalMaskElement.classList.add(`${this.elementCSSClassName}-modalMask--visible`);
        } else {
            this.modalMaskElement.classList.remove(`${this.elementCSSClassName}-modalMask--visible`);
        }
    }

    static {

        Overlay.defineProperties(ModalOverlay.prototype, {

            elementCSSClassName: {
                value: "modalOverlay-mod"
            },

            _queue: {
                value: []
            },

            _showPromise: {
                value: null
            },

            _dismissOnExternalInteraction: {
                value: false
            },

            hasModalMask: {
                value: true
            },

            _slotComponent: {
                value: null
            },

        })
    }

}


