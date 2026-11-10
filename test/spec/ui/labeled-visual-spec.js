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
                expect(aLabeledVisual.VisualPosition).toEqual(LabeledVisual.VisualPosition.start);
            });
            it("should accept a member name", function () {
                aLabeledVisual.VisualPosition = "end";
                expect(aLabeledVisual.VisualPosition).toEqual(LabeledVisual.VisualPosition.end);
                expect(aLabeledVisual.classList.has("mod--end")).toBeTruthy();
            });
            it("should accept a capitalized member name", function () {
                aLabeledVisual.VisualPosition = "End";
                expect(aLabeledVisual.classList.has("mod--end")).toBeTruthy();
            });
            it("should accept a serialized enum value", function () {
                aLabeledVisual.VisualPosition = "mod--end";
                expect(aLabeledVisual.classList.has("mod--end")).toBeTruthy();
            });
            it("should swap the class when the position changes", function () {
                aLabeledVisual.VisualPosition = "end";
                aLabeledVisual.VisualPosition = "start";
                expect(aLabeledVisual.classList.has("mod--end")).toBeFalsy();
                expect(aLabeledVisual.classList.has("mod--start")).toBeTruthy();
            });
            it("should ignore invalid positions", function () {
                spyOn(console, "warn");
                aLabeledVisual.VisualPosition = "middle";
                expect(aLabeledVisual.VisualPosition).toEqual(LabeledVisual.VisualPosition.start);
            });
        });

        describe("AlignmentOrientation", function () {
            it("should default to row", function () {
                expect(aLabeledVisual.AlignmentOrientation).toEqual(LabeledVisual.AlignmentOrientation.row);
            });
            it("should accept a capitalized member name", function () {
                aLabeledVisual.AlignmentOrientation = "Column";
                expect(aLabeledVisual.AlignmentOrientation).toEqual(LabeledVisual.AlignmentOrientation.column);
                expect(aLabeledVisual.classList.has("mod--column")).toBeTruthy();
            });
            it("should combine with an end position to reverse the column", function () {
                aLabeledVisual.VisualPosition = "End";
                aLabeledVisual.AlignmentOrientation = "Column";
                expect(aLabeledVisual.classList.has("mod--end")).toBeTruthy();
                expect(aLabeledVisual.classList.has("mod--column")).toBeTruthy();
            });
            it("should ignore invalid orientations", function () {
                spyOn(console, "warn");
                aLabeledVisual.AlignmentOrientation = "diagonal";
                expect(aLabeledVisual.AlignmentOrientation).toEqual(LabeledVisual.AlignmentOrientation.row);
            });
        });

        describe("DisplayOptions", function () {
            it("should default to displayBoth", function () {
                expect(aLabeledVisual.DisplayOptions).toEqual(LabeledVisual.DisplayOptions.displayBoth);
            });
            it("should accept a capitalized member name", function () {
                aLabeledVisual.DisplayOptions = "VisualOnly";
                expect(aLabeledVisual.DisplayOptions).toEqual(LabeledVisual.DisplayOptions.visualOnly);
                expect(aLabeledVisual.classList.has("mod--visual-only")).toBeTruthy();
            });
            it("should swap the class when the display options change", function () {
                aLabeledVisual.DisplayOptions = "VisualOnly";
                aLabeledVisual.DisplayOptions = "LabelOnly";
                expect(aLabeledVisual.classList.has("mod--visual-only")).toBeFalsy();
                expect(aLabeledVisual.classList.has("mod--label-only")).toBeTruthy();
            });
            it("should ignore invalid display options", function () {
                spyOn(console, "warn");
                aLabeledVisual.DisplayOptions = "Nothing";
                expect(aLabeledVisual.DisplayOptions).toEqual(LabeledVisual.DisplayOptions.displayBoth);
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
