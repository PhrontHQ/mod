/*global require,exports,describe,it,expect */
var Montage = require("mod/core/core").Montage,
    Component = require("mod/ui/component").Component,
    Overlay = require("mod/ui/overlay.mod").Overlay,
    MockDOM = require("mocks/dom"),
    Event = require("mocks/event"),
    defaultEventManager = require("mod/core/event/event-manager").defaultEventManager;
    defaultKeyManager = require("mod/core/event/key-manager").defaultKeyManager;

describe("ui/overlay-spec", function () {
    var anOverlay;

    beforeEach(function () {
        defaultEventManager._activeTarget = null;
        anOverlay = new Overlay();
        anOverlay.hasTemplate = false;
        anOverlay.element = MockDOM.element();
        anOverlay.modalMaskElement = MockDOM.element();

        anOverlay._firstDraw = false;

        anOverlay.enterDocument(true);
    });

    describe("position calculation", function () {
        it("should use the overlay position property", function () {
            anOverlay.position = {left: 100, top: 100};
            anOverlay._calculatePosition();
            expect(anOverlay._drawPosition).toEqual({left: 100, top: 100});
        });

        it("should calculate the overlay position to be in the middle of the screen when no position hints are given", function () {
            var aWindow = anOverlay.element.ownerDocument.defaultView;

            aWindow.innerWidth = 700;
            aWindow.innerHeight = 600;
            anOverlay.element.offsetWidth = 100;
            anOverlay.element.offsetHeight = 50;

            anOverlay._calculatePosition();
            expect(anOverlay._drawPosition).toEqual({left: 300, top: 275});
        });

        describe("anchor position", function () {
            it("should center the element bellow the anchor", function () {
                var anAnchor = document.createElement("div"),
                    anOverlayElement;

                anAnchor.style.position = "absolute";
                anAnchor.style.top = "100px";
                anAnchor.style.left = "200px";
                anAnchor.style.width = "100px";
                anAnchor.style.height = "100px";
                anAnchor.style.backgroundColor = "red";

                document.body.appendChild(anAnchor);

                anOverlay._element = anOverlayElement = document.createElement("div");
                anOverlayElement.style.position = "absolute";
                anOverlayElement.style.top = 0;
                anOverlayElement.style.left = 0;
                anOverlayElement.style.zIndex = 9999;
                anOverlayElement.style.width = "50px";
                anOverlayElement.style.height = "100px";
                anOverlayElement.style.backgroundColor = "green";

                document.body.appendChild(anOverlayElement);

                anOverlay.anchor = anAnchor;
                anOverlay._calculatePosition();
                anOverlayElement.style.top = anOverlay._drawPosition.top;
                anOverlayElement.style.left = anOverlay._drawPosition.left;

                document.body.removeChild(anOverlayElement);
                document.body.removeChild(anAnchor);

                expect(anOverlay._drawPosition).toEqual({left: 225, top: 200});
            });

            it("should center the element bellow the anchor and bump it to the right because it's left outside the screen", function () {
                var anAnchor = document.createElement("div"),
                    anOverlayElement;

                anAnchor.style.position = "absolute";
                anAnchor.style.top = "100px";
                anAnchor.style.left = 0;
                anAnchor.style.width = "100px";
                anAnchor.style.height = "100px";
                anAnchor.style.backgroundColor = "red";

                document.body.appendChild(anAnchor);

                anOverlay._element = anOverlayElement = document.createElement("div");
                anOverlayElement.style.position = "absolute";
                anOverlayElement.style.top = 0;
                anOverlayElement.style.left = 0;
                anOverlayElement.style.zIndex = 9999;
                anOverlayElement.style.width = "110px";
                anOverlayElement.style.height = "100px";
                anOverlayElement.style.backgroundColor = "green";

                document.body.appendChild(anOverlayElement);

                anOverlay.anchor = anAnchor;
                anOverlay._calculatePosition();

                document.body.removeChild(anOverlayElement);
                document.body.removeChild(anAnchor);

                expect(anOverlay._drawPosition).toEqual({left: 0, top: 200});
            });
        });
    });

    describe("delegate", function () {
        var delegate;
        beforeEach(function () {
            delegate = anOverlay.delegate = {};
            anOverlay.hide();

        });

        it("should call willPositionOverlay", function () {
            delegate.willPositionOverlay = jasmine.createSpy();

            anOverlay.position = {
                left: 100,
                top: 50
            };

            anOverlay._calculatePosition();

            expect(delegate.willPositionOverlay).toHaveBeenCalledWith(anOverlay, anOverlay.position);
        });

        it("should call didHideOverlay", function () {
            delegate.didHideOverlay = jasmine.createSpy();

            anOverlay._isShown = false;

            anOverlay.willDraw();

            expect(delegate.didHideOverlay).toHaveBeenCalledWith(anOverlay);
        });

        it("should call didShowOverlay", function () {
            delegate.didShowOverlay = jasmine.createSpy();

            anOverlay.show();
            anOverlay.willDraw();
            anOverlay.draw();

            expect(delegate.didShowOverlay).toHaveBeenCalledWith(anOverlay);
        });

        describe("shouldDismissOverlay", function () {
            it("should hide the overlay when a pressStart is fired outside the overlay and it returns true", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().and.returnValue(true);

                var event = Event.event();

                anOverlay.enterDocument(true);

                anOverlay.show();
                anOverlay.willDraw();
                anOverlay.draw();

                event.target = anOverlay;
                event.target = MockDOM.element();
                anOverlay._pressComposer._dispatchPressStart(event);
                expect(anOverlay._isShown).toBe(false);

                expect(delegate.shouldDismissOverlay).toHaveBeenCalledWith(anOverlay, event.target, "pressStart");
            });

            it("should not be called when a pressStart is fired inside the overlay", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().and.returnValue(true);

                var event = Event.event();

                anOverlay.dismissOnExternalInteraction = true;
                anOverlay.enterDocument(true);

                anOverlay._isShown = true;
                event.target = anOverlay;
                event.target = MockDOM.element();
                anOverlay.element.appendChild(event.target);

                anOverlay._pressComposer._dispatchPressStart(event);
                expect(anOverlay._isShown).toBe(true);

                expect(delegate.shouldDismissOverlay).not.toHaveBeenCalled();
            });

            it("should not hide the overlay when a pressStart is fired outside the overlay and it returns false", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().and.returnValue(false);

                var event = Event.event();

                anOverlay.enterDocument(true);

                anOverlay.show();
                anOverlay.willDraw();
                anOverlay.draw();
                event.target = MockDOM.element();
                anOverlay._pressComposer._dispatchPressStart(event);

                expect(anOverlay._isShown).toBe(true);

                expect(delegate.shouldDismissOverlay).toHaveBeenCalledWith(anOverlay, event.target, "pressStart");
            });

            it("should be called when the escape key is pressed", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().and.returnValue(true);

                anOverlay.enterDocument(true);
                anOverlay.show();
                anOverlay.willDraw();
                anOverlay.draw();

                var event = Event.event();
                event.type = "keyPress";
                event.identifier = "escape";
                event.targetElement = MockDOM.element();
                anOverlay.handleKeyPress(event);

                expect(anOverlay._isShown).toBe(false);
                expect(delegate.shouldDismissOverlay).toHaveBeenCalledWith(anOverlay, event.targetElement, "keyPress");
            });

            it("should not hide the overlay when the delegate returns false", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().and.returnValue(false);

                anOverlay.enterDocument(true);
                anOverlay.show();
                anOverlay.willDraw();
                anOverlay.draw();

                var event = Event.event();
                event.type = "keyPress";
                event.target = anOverlay;
                event.identifier = "escape";
                event.targetElement = MockDOM.element();
                anOverlay.dispatchEvent(event);
                anOverlay.handleKeyPress(event);

                expect(anOverlay._isShown).toBe(true);
                expect(delegate.shouldDismissOverlay).toHaveBeenCalledWith(anOverlay, event.targetElement, "keyPress");
            });

            it("should return activeTarget to the component that had it before", function () {
                var previousTarget = new Component();
                defaultEventManager.activeTarget = previousTarget;

                anOverlay.enterDocument(true);
                anOverlay.show();
                anOverlay.willDraw();
                anOverlay.draw();
                expect(defaultEventManager.activeTarget).toBe(anOverlay);
                anOverlay.hide();
                expect(defaultEventManager.activeTarget).toBe(previousTarget);
            });

            it("should not change the activeTarget if it's non-modal", function () {
                var previousTarget = new Component();
                defaultEventManager.activeTarget = previousTarget;

                anOverlay.isModal = false;
                anOverlay.enterDocument(true);
                anOverlay.show();
                anOverlay.willDraw();
                anOverlay.draw();
                expect(defaultEventManager.activeTarget).toBe(previousTarget);
                anOverlay.hide();
                expect(defaultEventManager.activeTarget).toBe(previousTarget);
            });

            it("should not show if the overlay isn't able to be the activeTarget", function () {
                var previousTarget = new Component();
                previousTarget.surrendersActiveTarget = function () {
                    return false;
                };
                defaultEventManager.activeTarget = previousTarget;

                anOverlay.enterDocument(true);
                anOverlay.show();
                anOverlay.willDraw();
                anOverlay.draw();
                expect(anOverlay._isShown).toBe(false);
            })
        });

    });

    describe("dismissOnExternalInteraction", function () {
        it("should hide the overlay when a pressStart is fired outside the overlay and dismissOnExternalInteraction is true", function () {
            var event = Event.event();

            anOverlay.dismissOnExternalInteraction = true;
            anOverlay.enterDocument(true);

            anOverlay.show();
            anOverlay.willDraw();
            anOverlay.draw();
            event.target = MockDOM.element();
            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(false);
        });

        it("should not hide the overlay when a pressStart is fired inside the overlay and dismissOnExternalInteraction is true", function () {
            var event = Event.event();

            anOverlay.dismissOnExternalInteraction = true;
            anOverlay.enterDocument(true);

            anOverlay.show();
            anOverlay.willDraw();
            anOverlay.draw();
            event.target = MockDOM.element();
            anOverlay.element.appendChild(event.target);

            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(true);
        });

        it("should not hide the overlay when a pressStart is fired outside the overlay and dismissOnExternalInteraction is false", function () {
            var event = Event.event();

            anOverlay.dismissOnExternalInteraction = false;
            anOverlay.enterDocument(true);

            anOverlay.show();
            anOverlay.willDraw();
            anOverlay.draw();
            event.target = MockDOM.element();
            anOverlay._pressComposer._dispatchPressStart(event);

            expect(anOverlay._isShown).toBe(true);
        });
    });

    describe("enterDocument", function () {
        it("should move the element to be a child of the body", function () {
            expect(anOverlay.element.ownerDocument.body.childNodes).toContain(anOverlay.element);
        });
    });

    describe("draw", function () {
        beforeEach(function () {
            var aWindow = anOverlay.element.ownerDocument.defaultView;

            aWindow.innerWidth = 700;
            aWindow.innerHeight = 600;
        });

        it("should be requested after show() when hidden", function () {
            anOverlay._isShown = false;

            anOverlay.show();
            anOverlay.willDraw();
            anOverlay.draw();

            expect(anOverlay.needsDraw).toBe(true);
            expect(anOverlay.classList.has("overlay-mod--visible")).toBe(true);
        });

        it("should be requested after hide() when shown", function () {
            anOverlay._isShown = true;

            anOverlay.hide();

            expect(anOverlay.needsDraw).toBe(true);
            expect(anOverlay.classList.has("overlay-mod--visible")).toBe(false);
        });

        it("should not calculate position on willDraw when content is not shown", function () {
            anOverlay._isShown = false;

            anOverlay.willDraw();

            expect(anOverlay._drawPosition).toBe(null);
        });

        it("should calculate the position on willDraw", function () {
            spyOn(anOverlay, "_calculatePosition");
            anOverlay._isShown = true;

            anOverlay.willDraw();

            expect(anOverlay._calculatePosition).toHaveBeenCalled();
        });

        it("should position the element when it's measurable", function () {
            anOverlay._isShown = true;
            anOverlay.element.offsetWidth = 100;
            anOverlay.element.offsetHeight = 50;
            anOverlay._calculatePosition();

            anOverlay.draw();

            expect(anOverlay.element.style.top).toBe("275px");
            expect(anOverlay.element.style.left).toBe("300px");
        });

        it("should be requested on window resize when shown", function () {
            anOverlay.needsDraw = false;
            anOverlay._isShown = true;
            anOverlay.handleResize();

            expect(anOverlay.needsDraw).toBe(true);
        });

        it("should not be requested on window resize when hidden", function () {
            anOverlay.needsDraw = false;
            anOverlay._isShown = false;
            anOverlay.handleResize();

            expect(anOverlay.needsDraw).toBe(false);
        });
    });

    describe("dismissal", function () {
        it("should hide the overlay when a pressStart is fired outside the overlay", function () {
            var event = Event.event();

            anOverlay.show();
            anOverlay.willDraw();
            anOverlay.draw();
            event.target = MockDOM.element();
            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(false);
        });

        it("should not hide the overlay when a pressStart is fired inside the overlay", function () {
            var event = Event.event();

            anOverlay._isShown = true;
            event.target = MockDOM.element();
            anOverlay.element.appendChild(event.target);

            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(true);
        });

        it("should hide the overlay when the escape key is pressed", function () {
            anOverlay.enterDocument(true);
            anOverlay.show();

            var event = Event.event();
            event.type = "keyPress";
            event.identifier = "escape";
            event.targetElement = MockDOM.element();
            anOverlay.handleKeyPress(event);

            expect(anOverlay._isShown).toBe(false);
        });
    });

    describe("keyPress", function () {
        it("should be loaded when the overlay is shown", function () {
            anOverlay.enterDocument(true);
            anOverlay.show();

            expect(anOverlay._keyComposer._isLoaded).toBe(true);
        });

        it("should not be loaded when the overlay is shown", function () {
            anOverlay.enterDocument(true);
            anOverlay.show();
            anOverlay.hide();

            expect(anOverlay._keyComposer._isLoaded).toBe(false);
        });

        it("should be loaded when the overlay is hidden and shown again", function () {
            anOverlay.enterDocument(true);
            anOverlay.show();
            anOverlay.hide();
            anOverlay.show();

            expect(anOverlay._keyComposer._isLoaded).toBe(true);
        });
    });

    describe("events", function () {
        it("should fire dismiss event when overlay is dismissed", function () {
            var event = Event.event(),
                callback = jasmine.createSpy();

            anOverlay.show();
            anOverlay.willDraw();
            anOverlay.draw();
            event.target = MockDOM.element();

            anOverlay.addEventListener("dismiss", callback, false);

            anOverlay._pressComposer._dispatchPressStart(event);
            expect(callback).toHaveBeenCalled();
        });
    });

    describe("pressComposer", function () {
        var pressComposer;
        beforeEach(function () {
            pressComposer = anOverlay._pressComposer;
        });

        it("should not be loaded initially", function () {
            expect(anOverlay.element.ownerDocument.hasEventListener("mousedown", pressComposer)).toBe(false);
        });

        xit("should be loaded when showing", function () {
            anOverlay.show();
            expect(anOverlay.element.ownerDocument.hasEventListener("mousedown", pressComposer)).toBe(true);
        });

        it("should be unloaded when hiding", function () {
            anOverlay.show();
            anOverlay.hide();
            expect(anOverlay.element.ownerDocument.hasEventListener("mousedown", pressComposer)).toBe(false);
        });
    });

    describe("show", function () {

        it("should enter the document", function () {
            var componentA = new Component();
            componentA.hasTemplate = false;
            componentA.element = MockDOM.element();
            componentA.element.appendChild(anOverlay.element);

            anOverlay.show();
            expect(anOverlay._needsEnterDocument).toBe(true);
        });
    });
});
