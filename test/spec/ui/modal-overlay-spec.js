/*global require,exports,describe,it,expect */
var Montage = require("mod/core/core").Montage,
    ModalOverlay = require("mod/ui/modal-overlay.mod").ModalOverlay,
    Promise = require("mod/core/promise").Promise,
    MockDOM = require("mocks/dom"),
    defaultEventManager = require("mod/core/event/event-manager").defaultEventManager;

describe("ui/modal-overlay-spec", function () {
    var aModalOverlay,
        anotherModalOverlay;

    beforeEach(function () {
        defaultEventManager._activeTarget = null;
        aModalOverlay = new ModalOverlay();
        aModalOverlay.hasTemplate = false;
        aModalOverlay.element = MockDOM.element();
        aModalOverlay.modalMaskElement = MockDOM.element();
        aModalOverlay.enterDocument(true);

        anotherModalOverlay = new ModalOverlay();
        anotherModalOverlay.hasTemplate = false;
        anotherModalOverlay.element = MockDOM.element();
        anotherModalOverlay.modalMaskElement = MockDOM.element();
        anotherModalOverlay.enterDocument(true);

        ModalOverlay.prototype._queue = [];
    });

    describe("enterDocument", function () {
        it("should move the modal mask to be a child of the body", function () {
            expect(aModalOverlay.element.ownerDocument.body.childNodes).toContain(aModalOverlay.modalMaskElement);
        });
    });

    describe("show", function () {
        it("should return a fullfilled promise for the first overlay", function () {
            var isFulfilled = false,
            promise = new Promise(function(resolve, reject) {
                aModalOverlay.show();
            });

            promise.then((value) => {
                isFulfilled = true;
                expect(isFulfilled).toBeTruthy();
            });
        });

        it("should show the first overlay", function () {
            aModalOverlay.show();

            expect(aModalOverlay._isShown).toBe(true);
        });

        it("should return an unfulfilled promise when another overlay is shown", function () {
            anotherModalOverlay.show();

            var isFulfilled = false,
            promise = new Promise(function(resolve, reject) {
                aModalOverlay.show();
            });

            promise.then((value) => {
                isFulfilled = true;
            })
            .finally(() => {
                expect(isFulfilled).toBe(false);

            });
        });

        it("should not show the overlay when another overlay is shown", function () {
            anotherModalOverlay.show();
            aModalOverlay.show();

            expect(aModalOverlay._isShown).toBe(false);
        });

        it("should return a new promise if the overlay is shown", function () {
            var promise = aModalOverlay.show(),
                anotherPromise = aModalOverlay.show();

            expect(promise).not.toBe(anotherPromise);
        });

        it("should return the same promise if the overlay hasn't shown yet", function () {
            var promise,
                anotherPromise;

            anotherModalOverlay.show();
            promise = aModalOverlay.show();
            anotherPromise = aModalOverlay.show();

            expect(promise).toBe(anotherPromise);
        });
    });

    describe("hide", function () {
        it("should the next overlay when the overlay shown is hidden", function () {
            aModalOverlay.show();
            anotherModalOverlay.show();

            aModalOverlay.hide();

            expect(anotherModalOverlay._isShown).toBe(true);
        });

        it("should reject the show promise when hidden before shown", function (done) {
            anotherModalOverlay.show();
            var promise = aModalOverlay.show();
            aModalOverlay.hide();

            promise.catch(function (err) {
                expect(err).toBeDefined();
            }).finally(function () {
                done();
            });
        });
    });

    describe("draw", function () {
        beforeEach(function () {
            var aWindow = aModalOverlay.element.ownerDocument.defaultView;

            aWindow.innerWidth = 700;
            aWindow.innerHeight = 600;
        });

        it("should not be requested when there is another overlay shown", function () {
            anotherModalOverlay.show();
            aModalOverlay.show();

            expect(aModalOverlay.needsDraw).toBe(false);
        });

        it("should be requested when the overlay shown is hidden", function () {
            anotherModalOverlay.show();
            aModalOverlay.show();

            anotherModalOverlay.hide();

            expect(aModalOverlay.needsDraw).toBe(true);
        });

        it("should show the modal mask", function () {
            aModalOverlay._isShown = true;

            aModalOverlay.willDraw();
            aModalOverlay.draw();

            expect(aModalOverlay.modalMaskElement.classList.contains(`${aModalOverlay.elementCSSClassName}-modalMask--visible`)).toBe(true);
        });

        it("should hide the modal mask", function () {
            aModalOverlay._isShown = false;

            aModalOverlay.draw();

            expect(aModalOverlay.modalMaskElement.classList.contains(`${aModalOverlay.elementCSSClassName}-modalMask--visible`)).toBe(false);
        });
    });
});
