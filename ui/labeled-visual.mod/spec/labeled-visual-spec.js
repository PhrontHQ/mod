var Montage = require("mod/core/core").Montage;
var LabeledVisual = require("mod/ui/labeled-visual.mod").LabeledVisual;
var MockDOM = require("mocks/dom");

describe("test/ui/labeled-visual-spec", function () {
    describe("properties", function () {
        var aLabeledVisual;
        beforeEach(function () {
            aLabeledVisual = new LabeledVisual();
            aLabeledVisual.element = MockDOM.element();
        });

        describe("VisualPosition", function () {
            it("should default to start", function () {
                expect(aLabeledVisual.visualPosition).toEqual(LabeledVisual.VisualPosition.start);
            });
            it("should accept a member name", function () {
                aLabeledVisual.visualPosition = "end";
                expect(aLabeledVisual.visualPosition).toEqual(LabeledVisual.VisualPosition.end);
                expect(aLabeledVisual.classList.has("mod--end")).toBeTruthy();
            });
            it("should reject a member name with incorrect case", function () {
                spyOn(console, "warn");
                aLabeledVisual.visualPosition = "End";
                expect(aLabeledVisual.visualPosition).toEqual(LabeledVisual.VisualPosition.start);
            });
            it("should reject a serialized enum value", function () {
                spyOn(console, "warn");
                aLabeledVisual.visualPosition = "mod--end";
                expect(aLabeledVisual.visualPosition).toEqual(LabeledVisual.VisualPosition.start);
            });
            it("should swap the class when the position changes", function () {
                aLabeledVisual.visualPosition = "end";
                aLabeledVisual.visualPosition = "start";
                expect(aLabeledVisual.classList.has("mod--end")).toBeFalsy();
                expect(aLabeledVisual.classList.has("mod--start")).toBeTruthy();
            });
            it("should ignore invalid positions", function () {
                spyOn(console, "warn");
                aLabeledVisual.visualPosition = "middle";
                expect(aLabeledVisual.visualPosition).toEqual(LabeledVisual.VisualPosition.start);
            });
        });

        describe("visualOrientation", function () {
            it("should accept an exact member name", function () {
                aLabeledVisual.visualOrientation = "vertical";
                expect(aLabeledVisual.visualOrientation).toEqual(LabeledVisual.VisualOrientation.vertical);
                expect(aLabeledVisual.classList.has("mod--vertical")).toBeTruthy();
            });
            it("should reject a member name with incorrect case", function () {
                spyOn(console, "warn");
                aLabeledVisual.visualOrientation = "Vertical";
                expect(aLabeledVisual.visualOrientation).toEqual(LabeledVisual.VisualOrientation.horizontal);
            });
        });

        describe("DisplayOptions", function () {
            it("should default to displayBoth", function () {
                expect(aLabeledVisual.displayOptions).toEqual(LabeledVisual.DisplayOption.displayBoth);
            });
            it("should accept an exact member name", function () {
                aLabeledVisual.displayOptions = "visualOnly";
                expect(aLabeledVisual.displayOptions).toEqual(LabeledVisual.DisplayOption.visualOnly);
                expect(aLabeledVisual.classList.has("mod--visual-only")).toBeTruthy();
            });
            it("should reject a member name with incorrect case", function () {
                spyOn(console, "warn");
                aLabeledVisual.displayOptions = "VisualOnly";
                expect(aLabeledVisual.displayOptions).toEqual(LabeledVisual.DisplayOption.displayBoth);
            });
            it("should swap the class when the display options change", function () {
                aLabeledVisual.displayOptions = "visualOnly";
                aLabeledVisual.displayOptions = "labelOnly";
                expect(aLabeledVisual.classList.has("mod--visual-only")).toBeFalsy();
                expect(aLabeledVisual.classList.has("mod--label-only")).toBeTruthy();
            });
            it("should ignore invalid display options", function () {
                spyOn(console, "warn");
                aLabeledVisual.displayOptions = "nothing";
                expect(aLabeledVisual.displayOptions).toEqual(LabeledVisual.DisplayOption.displayBoth);
            });
        });

        describe("label", function () {
            it("is writable", function () {
                aLabeledVisual.label = "hello";
                expect(aLabeledVisual.label).toEqual("hello");
            });
            it("should accept falsy values", function () {
                aLabeledVisual.label = false;
                expect(aLabeledVisual.label).toEqual("false");
                aLabeledVisual.label = 0;
                expect(aLabeledVisual.label).toEqual("0");
                aLabeledVisual.label = "";
                expect(aLabeledVisual.label).toEqual("");
            });
            it("should be null when undefined or null", function () {
                aLabeledVisual.label = void 0;
                expect(aLabeledVisual.label).toBeNull();
                aLabeledVisual.label = null;
                expect(aLabeledVisual.label).toBeNull();
            });
            it("should be converted by a converter", function () {
                aLabeledVisual.converter = {
                    convert: function (value) {
                        return value.toUpperCase();
                    }
                };
                aLabeledVisual.label = "hello";
                expect(aLabeledVisual.label).toEqual("HELLO");
            });
            it("should request a draw when changed", function () {
                aLabeledVisual.label = "random";
                expect(aLabeledVisual.needsDraw).toBeTruthy();
            });
        });
    });
});
