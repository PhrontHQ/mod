var Montage = require("mod/core/core").Montage;
var Button = require("mod/ui/button.mod").Button;
var MockDOM = require("mocks/dom");

describe("test/ui/button-spec", function () {
    describe("properties", function () {
        var aButton;
        beforeEach(function () {
            aButton = new Button();
            aButton.element = MockDOM.element();
            aButton.prepareForActivationEvents();
        });
        it("should keep the press composer's longPressThreshold in sync with holdThreshold", function () {
            aButton.holdThreshold = 10;
            expect(aButton._pressComposer.longPressThreshold).toEqual(10);
        });
        describe("label", function () {
            it("is writable", function () {
                aButton.label = "hello";
                expect(aButton.label).toEqual( "hello");
            });
            it("should accept falsy values", function () {
                aButton.label = false;
                expect(aButton.label).toEqual("false");
                aButton.label = 0;
                expect(aButton.label).toEqual("0");
                aButton.label = "";
                expect(aButton.label).toEqual("");
            });
        });
        describe("active target", function () {
            var aButton, anElement;
            beforeEach(function () {
                aButton = new Button();
                anElement = MockDOM.element();
            });
            it("should set tabindex if needed", function () {
                anElement.tagName = "DIV";
                spyOn(anElement, "setAttribute");
                spyOn(anElement, "removeAttribute");

                aButton.element = anElement;
                aButton._draw();
                aButton.draw();
                expect(anElement.setAttribute).toHaveBeenCalledWith("tabindex", "0");
                aButton.preventFocus = true;
                aButton._draw();
                aButton.draw();
                expect(anElement.removeAttribute).toHaveBeenCalledWith("tabindex");
            });
            it("shouldn't set tabindex if not needed", function () {
                anElement.tagName = "BUTTON";
                spyOn(anElement, "setAttribute");

                aButton.element = anElement;
                aButton._draw();
                aButton.draw();
                expect(anElement.setAttribute).not.toHaveBeenCalledWith("tabindex", "-1");
            });
        });
        describe("draw", function () {
            var aButton;
            beforeEach(function () {
                aButton = new Button();
                aButton.element = MockDOM.element();
            });

            it("should be requested after enabled state is changed", function () {
                aButton.enabled = ! aButton.enabled;
                expect(aButton.needsDraw).toBeTruthy();
            });
            it("should be requested after label is changed", function () {
                aButton.label = "random";
                expect(aButton.needsDraw).toBeTruthy();
            });
            it("should be requested after label is changed", function () {
                aButton.active = true;
                expect(aButton.needsDraw).toBeTruthy();
            });
            it("should be requested after label is changed", function () {
                aButton.preventFocus = true;
                expect(aButton.needsDraw).toBeTruthy();
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
