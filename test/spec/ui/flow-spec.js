var TestPageLoader = require("mod-testing/testpageloader").TestPageLoader,
    RangeController = require("mod/core/range-controller").RangeController;

function cleanTextContent(element) {
    return element.textContent.replace(/\s\s+/g, ' ').trim();
}

TestPageLoader.queueTest("flow/flow", function (testPage) {

    describe("ui/flow/flow-spec", function () {
        describe("Flow", function () {
            var flow,
                flowRepetition,
                rangeController;

            function waitForFlowRepetition() {
                var component = flow._repetition || flow;

                return testPage.waitForComponentDraw(flow).then(function () {
                    return flow._repetition;
                });
            }

            beforeEach(function () {
                flow = testPage.querySelector(".flow").component;
                flow.cameraPosition = [0, 0, 250];
                flow.cameraTargetPoint = [0, 0, 0];
                flow.cameraFov = 90;
                flow.paths = [{
                    "knots": [
                        {
                            "knotPosition": [-5000, 0, 0],
                            "nextHandlerPosition": [-5000 / 3, 0, 0],
                            "previousDensity": 100,
                            "nextDensity": 100
                        },
                        {
                            "knotPosition": [5000, 0, 0],
                            "previousHandlerPosition": [5000 / 3, 0, 0],
                            "previousDensity": 100,
                            "nextDensity": 100
                        }
                    ],
                    "headOffset": 50,
                    "tailOffset": 50
                }];
                flow.content = [];
            });

            it("can be created", function () {
                expect(flow).toBeDefined();
            });

            describe("setting up camera, paths and content", function () {
                it("should create the expected iterations", function (done) {
                    var content = [],
                        i;

                    for (i = 0; i < 100; i++) {
                        content.push(i);
                    }

                    flow.content = content;
                    waitForFlowRepetition().then(function (flowRepetition) {
                        expect(cleanTextContent(flowRepetition.element)).toBe("0 1 2");
                        done();
                    });
                });
            });

            describe("updating content", function () {
                it("should update the visible iterations but not delete iterations", function (done) {
                    var content = [],
                        i;

                    for (i = 0; i < 2; i++) {
                        content.push("(" + i + ")");
                    }

                    flow.content = content;

                    waitForFlowRepetition().then(function (flowRepetition) {
                        expect(cleanTextContent(flowRepetition.element)).toBe("(0) (1)");
                        expect(flowRepetition.element.children.length).toBe(3);
                        done();
                    });
                });
            });

            describe("scrolling", function () {
                it("should update and recycle the iterations as expected", function (done) {
                    var content = [],
                        i;

                    for (i = 0; i < 100; i++) {
                        content.push(i);
                    }
                    flow.scroll = 0;
                    flow.content = content;

                    waitForFlowRepetition().then(function (flowRepetition) {
                        expect(cleanTextContent(flowRepetition.element)).toBe("0 1 2");
                        flow.scroll = 3;
                        testPage.waitForComponentDraw(flowRepetition).then(function () {
                            expect(cleanTextContent(flowRepetition.element)).toBe("3 1 2 4 5");
                            flow.scroll = 2;
                            testPage.waitForComponentDraw(flowRepetition).then(function () {
                                expect(cleanTextContent(flowRepetition.element)).toBe("3 1 2 4 0");
                                flow.scroll = 0;
                                testPage.waitForComponentDraw(flow).then(function () {
                                    expect(cleanTextContent(flowRepetition.element)).toBe("3 1 2 4 0");
                                    expect(flowRepetition.element.children.length).toBe(5);
                                    done();
                                });
                            });
                        });
                    });
                });
            });

            describe("handling resize", function () {
                beforeEach(function () {
                    var content = [],
                        i;

                    for (i = 0; i < 100; i++) {
                        content.push(i);
                    }
                    flow.scroll = 0;
                    flow.content = content;
                });

                it("should regenerate iterations and trim the excess", function (done) {
                    flow.handleResize();
                    waitForFlowRepetition().then(function (flowRepetition) {
                        expect(cleanTextContent(flowRepetition.element)).toBe("0 1 2");
                        expect(flowRepetition.element.children.length).toBe(3);
                        done();
                    });
                });
                it("after flow changes in size should update frustum culling and iterations", function (done) {
                    flow.element.style.width = "300px";
                    flow.handleResize();

                    waitForFlowRepetition().then(function (flowRepetition) {
                        expect(cleanTextContent(flowRepetition.element)).toBe("0 1");
                        expect(flowRepetition.element.children.length).toBe(2);
                        flow.element.style.width = "500px";
                        flow.handleResize();
                        testPage.waitForComponentDraw(flowRepetition).then(function () {
                            expect(cleanTextContent(flowRepetition.element)).toBe("0 1 2");
                            expect(flowRepetition.element.children.length).toBe(3);
                            done();
                        });
                    });
                });
            });

            describe("updating contentController", function () {
                beforeEach(function () {
                    var content = [],
                        i;

                    rangeController = new RangeController();
                    for (i = 0; i < 100; i++) {
                        content.push("(" + i + ")");
                    }
                    flow.contentController = rangeController;
                    rangeController.content = content;
                });
                it("should update the visible iterations", function (done) {
                    waitForFlowRepetition().then(function (flowRepetition) {
                        expect(cleanTextContent(flowRepetition.element)).toBe("(0) (1) (2)");
                        expect(flowRepetition.element.children.length).toBe(3);
                        done();
                    });
                });
            });

            describe("selection", function () {
                beforeEach(function () {
                    var content = [],
                        i;

                    rangeController = new RangeController();
                    for (i = 0; i < 100; i++) {
                        content.push("(" + i + ")");
                    }
                    flow.contentController = rangeController;
                    rangeController.content = content;
                });

                it("modifying controller's selection should update iterations", function (done) {
                    rangeController.selection = ["(1)"];
                    waitForFlowRepetition().then(function (flowRepetition) {
                        expect(cleanTextContent(flowRepetition.element)).toBe("(0) (1) (2)");
                        expect(flowRepetition.element.children[0].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[1].children[0].component.iteration.selected).toBeTruthy();
                        expect(flowRepetition.element.children[2].children[0].component.iteration.selected).toBeFalsy();
                        rangeController.selection = ["(2)"];
                        expect(flowRepetition.element.children[0].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[1].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[2].children[0].component.iteration.selected).toBeTruthy();
                        done();
                    });
                });
                it("modifying iterations's selected should update controller's selection", function (done) {
                    waitForFlowRepetition().then(function (flowRepetition) {
                        flowRepetition.element.children[0].children[0].component.iteration.selected = true;
                        expect(rangeController.selection.toString()).toBe("(0)");
                        expect(flow.selection.toString()).toBe("(0)");
                        done();
                    });
                });
                // it("changes in controller's selection should be reflected in flow's selection", function () {
                // });
                it("changes in flow's selection should be reflected in controller's selection", function () {
                    flow.selection = ["(1)"];
                    expect(rangeController.selection.toString()).toBe("(1)");
                });
                it("after scrolling enough to hide selected iteration, no iteration should be selected", function (done) {
                    flow.selection = ["(1)"];
                    flow.scroll = 50;
                    waitForFlowRepetition().then(function (flowRepetition) {
                        expect(cleanTextContent(flowRepetition.element)).toBe("(48) (49) (50) (51) (52)");
                        expect(flowRepetition.element.children[0].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[1].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[2].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[3].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[4].children[0].component.iteration.selected).toBeFalsy();
                        done();
                    });
                });
                it("iterations in selection should be selected after they enter in the frustum area", function (done) {
                    flow.selection = ["(1)"];
                    flow.scroll = 50;

                    waitForFlowRepetition().then(function (flowRepetition) {
                        expect(cleanTextContent(flowRepetition.element)).toBe("(48) (49) (50) (51) (52)");

                        flow.scroll = 0;
                        waitForFlowRepetition().then(function (flowRepetition) {
                            expect(cleanTextContent(flowRepetition.element)).toBe("(0) (1) (2) (51) (52)");
                            expect(flowRepetition.element.children[0].children[0].component.iteration.selected).toBeFalsy();
                            expect(flowRepetition.element.children[1].children[0].component.iteration.selected).toBeTruthy();
                            expect(flowRepetition.element.children[2].children[0].component.iteration.selected).toBeFalsy();
                            expect(flowRepetition.element.children[3].children[0].component.iteration.selected).toBeFalsy();
                            expect(flowRepetition.element.children[4].children[0].component.iteration.selected).toBeFalsy();
                            done();
                        });
                    });
                });
            });
        });
    });
});
