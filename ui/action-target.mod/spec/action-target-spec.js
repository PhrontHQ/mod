var Montage = require("mod/core/core").Montage;
var ActionTarget = require("mod/ui/action-target.mod").ActionTarget;
var MockDOM = require("mocks/dom");

describe("test/ui/action-target-spec", function () {
    describe("properties", function () {
        var anActionTarget;
        beforeEach(function () {
            anActionTarget = new ActionTarget();
            anActionTarget.element = MockDOM.element();
            anActionTarget.prepareForActivationEvents();
        });
        it("should keep the press composer's longPressThreshold in sync with holdThreshold", function () {
            anActionTarget.holdThreshold = 10;
            expect(anActionTarget._pressComposer.longPressThreshold).toEqual(10);
        });
        describe("disabled property", function () {
            var anActionTarget;
            beforeEach(function () {
                anActionTarget = new Button();
                anActionTarget.element = MockDOM.element();
                anActionTarget.originalElement = anActionTarget.element;
            });
            it("should be enabled after the corresponding property change", function () {
                anActionTarget.enabled = true;
                anActionTarget.enterDocument(true);
                anActionTarget._draw();
                anActionTarget.draw();
                expect(anActionTarget.element.disabled).toBeFalsy();
            });
            it("should be disabled after the corresponding property change", function () {
                anActionTarget.enabled = false;
                anActionTarget.enterDocument(true);
                anActionTarget._draw();
                anActionTarget.draw();
                expect(anActionTarget.element.disabled).toBeTruthy();
            });
        });
        describe("active target", function () {
            var anActionTarget, anElement;
            beforeEach(function () {
                anActionTarget = new Button();
                anElement = MockDOM.element();
            });
            it("should set tabindex if needed", function () {
                anElement.tagName = "DIV";
                spyOn(anElement, "setAttribute");
                spyOn(anElement, "removeAttribute");

                anActionTarget.element = anElement;
                anActionTarget._draw();
                anActionTarget.draw();
                expect(anElement.setAttribute).toHaveBeenCalledWith("tabindex", "0");
                anActionTarget.preventFocus = true;
                anActionTarget._draw();
                anActionTarget.draw();
                expect(anElement.removeAttribute).toHaveBeenCalledWith("tabindex");
            });
            it("shouldn't set tabindex if not needed", function () {
                anElement.tagName = "BUTTON";
                spyOn(anElement, "setAttribute");

                anActionTarget.element = anElement;
                anActionTarget._draw();
                anActionTarget.draw();
                expect(anElement.setAttribute).not.toHaveBeenCalledWith("tabindex", "-1");
            });
        });

        describe("converter", function () {
            beforeEach(function () {
                anActionTarget = new Button();
                anActionTarget.element = MockDOM.element();
                anActionTarget.originalElement = anActionTarget.element;
                anActionTarget.element.firstChild = MockDOM.element();
                anActionTarget.converter = {
                    convert: function (v) {
                        return v.replace(/fail/gi, "pass");
                    }
                };
            });
            it("shouldn't go into infinite loop", function () {
                anActionTarget.label = "fail";
                anActionTarget.enterDocument(true);
                anActionTarget.draw();
                anActionTarget.label = "FAIL";
                expect(anActionTarget.label).toEqual("pass");
            });
        });

        describe("events", function () {
            var anActionTarget, anElement, listener;
            beforeEach(function () {
                anActionTarget = new Button();
                anElement = MockDOM.element();
                listener = {
                    handleEvent: function () {}
                }
            });
            it("should listen for pressStart only after prepareForActivationEvents", function () {
                var listeners,
                    em = anActionTarget.eventManager;

                listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", anActionTarget._pressComposer);
                expect(listeners).toBeNull();

                anActionTarget.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", anActionTarget._pressComposer);
                expect(listeners).toEqual(anActionTarget);
            });
            it("should listen for longPress on PressComposer on demand", function () {
                var listeners,
                    em = anActionTarget.eventManager;

                listeners = em.registeredEventListenersForEventType_onTarget_("longPress", anActionTarget._pressComposer);
                expect(listeners).toBeNull();

                anActionTarget.addEventListener("longAction", listener, false);

                listeners = em.registeredEventListenersForEventType_onTarget_("longPress", anActionTarget._pressComposer);
                expect(listeners).toEqual(anActionTarget);
            });
            it("should fires a 'longAction' event when the PressComposer fires a longPress", function () {
                var callback = jasmine.createSpy();
                anActionTarget.addEventListener("longAction", callback, false);
                anActionTarget._pressComposer.dispatchEventNamed("longPress");
                expect(callback).toHaveBeenCalled();
            });
            describe("once prepareForActivationEvents is called", function () {
                beforeEach(function () {
                    anActionTarget.element = anElement;
                    anActionTarget.prepareForActivationEvents();
                });
                it("should fire an 'action' event when the PressComposer fires a pressStart + press", function () {
                    var callback = jasmine.createSpy().and.callFake(function (event) {
                        expect(event.type).toEqual("action");
                    });
                    anActionTarget.addEventListener("action", callback, false);

                    anActionTarget._pressComposer.dispatchEventNamed("pressStart");
                    anActionTarget._pressComposer.dispatchEventNamed("press");

                    expect(callback).toHaveBeenCalled();
                });
                it("shouldn't fire an 'action' event when the PressComposer fires a pressStart + pressCancel", function () {
                    var callback = jasmine.createSpy().and.callFake(function (event) {
                        expect(event.type).toEqual("action");
                    });
                    anActionTarget.addEventListener("action", callback, false);

                    anActionTarget._pressComposer.dispatchEventNamed("pressStart");
                    anActionTarget._pressComposer.dispatchEventNamed("pressCancel");

                    expect(callback).not.toHaveBeenCalled();
                });
                it("should fire an 'action' event with the contents of the detail property", function () {
                     var callback = jasmine.createSpy().and.callFake(function (event) {
                        expect(event.detail.get("foo")).toEqual("bar");
                    });
                    anActionTarget.addEventListener("action", callback, false);

                    anActionTarget.detail.set("foo", "bar");

                    anActionTarget._pressComposer.dispatchEventNamed("pressStart");
                    anActionTarget._pressComposer.dispatchEventNamed("press");

                    expect(callback).toHaveBeenCalled();
                 });
             });
        });
    });
    describe("objectDescriptor", function () {
        it("can be created", function (done) {
            var objectDescriptorPromise = Button.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).not.toBeNull();
            }, function (err) {
                fail(err);
            }).finally(function () {
                done();
            });
        });
    });
});
