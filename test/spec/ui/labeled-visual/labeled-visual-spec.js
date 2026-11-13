var TestPageLoader = require("mod-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("labeled-visual-test", function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });

    describe("ui/labeled-visual-spec", function () {
        describe("VisualPosition", function () {
            it("should default to start", function () {
                expect(test.labeledVisual.visualPosition).toEqual(test.labeledVisual.constructor.VisualPosition.start);
            });
            it("should accept a member name", function () {
                test.labeledVisual.visualPosition = "end";
                expect(test.labeledVisual.visualPosition).toEqual(test.labeledVisual.constructor.VisualPosition.end);
                expect(test.labeledVisual.classList.has("mod--end")).toBeTruthy();
            });
            it("should reject a member name with incorrect case", function () {
                spyOn(console, "warn");
                test.labeledVisual.visualPosition = "End";
                expect(test.labeledVisual.visualPosition).toEqual(test.labeledVisual.constructor.VisualPosition.start);
            });
            it("should reject a serialized enum value", function () {
                spyOn(console, "warn");
                test.labeledVisual.visualPosition = "mod--end";
                expect(test.labeledVisual.visualPosition).toEqual(test.labeledVisual.constructor.VisualPosition.start);
            });
            it("should swap the class when the position changes", function () {
                test.labeledVisual.visualPosition = "end";
                test.labeledVisual.visualPosition = "start";
                expect(test.labeledVisual.classList.has("mod--end")).toBeFalsy();
                expect(test.labeledVisual.classList.has("mod--start")).toBeTruthy();
            });
            it("should ignore invalid positions", function () {
                spyOn(console, "warn");
                test.labeledVisual.visualPosition = "middle";
                expect(test.labeledVisual.visualPosition).toEqual(test.labeledVisual.constructor.VisualPosition.start);
            });
        });

        describe("visualOrientation", function () {
            it("should accept an exact member name", function () {
                test.labeledVisual.visualOrientation = "vertical";
                expect(test.labeledVisual.visualOrientation).toEqual(test.labeledVisual.constructor.VisualOrientation.vertical);
                expect(test.labeledVisual.classList.has("mod--vertical")).toBeTruthy();
            });
            it("should reject a member name with incorrect case", function () {
                spyOn(console, "warn");
                test.labeledVisual.visualOrientation = "Vertical";
                expect(test.labeledVisual.visualOrientation).toEqual(test.labeledVisual.constructor.VisualOrientation.horizontal);
            });
        });

        describe("DisplayOptions", function () {
            it("should default to displayBoth", function () {
                expect(test.labeledVisual.displayOptions).toEqual(test.labeledVisual.constructor.DisplayOption.displayBoth);
            });
            it("should accept an exact member name", function () {
                test.labeledVisual.displayOptions = "visualOnly";
                expect(test.labeledVisual.displayOptions).toEqual(test.labeledVisual.constructor.DisplayOption.visualOnly);
                expect(test.labeledVisual.classList.has("mod--visual-only")).toBeTruthy();
            });
            it("should reject a member name with incorrect case", function () {
                spyOn(console, "warn");
                test.labeledVisual.displayOptions = "VisualOnly";
                expect(test.labeledVisual.displayOptions).toEqual(test.labeledVisual.constructor.DisplayOption.displayBoth);
            });
            it("should swap the class when the display options change", function () {
                test.labeledVisual.displayOptions = "visualOnly";
                test.labeledVisual.displayOptions = "labelOnly";
                expect(test.labeledVisual.classList.has("mod--visual-only")).toBeFalsy();
                expect(test.labeledVisual.classList.has("mod--label-only")).toBeTruthy();
            });
            it("should ignore invalid display options", function () {
                spyOn(console, "warn");
                test.labeledVisual.displayOptions = "nothing";
                expect(test.labeledVisual.displayOptions).toEqual(test.labeledVisual.constructor.DisplayOption.displayBoth);
            });
        });

        describe("label", function () {
            it("is writable", function () {
                test.labeledVisual.label = "hello";
                expect(test.labeledVisual.label).toEqual("hello");
            });
            it("should accept falsy values", function () {
                test.labeledVisual.label = false;
                expect(test.labeledVisual.label).toEqual("false");
                test.labeledVisual.label = 0;
                expect(test.labeledVisual.label).toEqual("0");
                test.labeledVisual.label = "";
                expect(test.labeledVisual.label).toEqual("");
            });
            it("should be null when undefined or null", function () {
                test.labeledVisual.label = void 0;
                expect(test.labeledVisual.label).toBeNull();
                test.labeledVisual.label = null;
                expect(test.labeledVisual.label).toBeNull();
            });
            it("should be converted by a converter", function () {
                test.labeledVisual.converter = {
                    convert: function (value) {
                        return value.toUpperCase();
                    }
                };
                test.labeledVisual.label = "hello";
                expect(test.labeledVisual.label).toEqual("HELLO");
            });
            it("should request a draw when changed", function () {
                test.labeledVisual.label = "random";
                expect(test.labeledVisual.needsDraw).toBeTruthy();
            });
        });
    });
});
