var Montage = require("mod/core/core").Montage,
    TestPageLoader = require("mod-testing/testpageloader").TestPageLoader,
    PressComposer = require("mod/composer/press-composer").PressComposer;

TestPageLoader.queueTest("press-composer-test/press-composer-test", function (testPage) {
    var test;

    beforeEach(function () {
        test = testPage.test;

        if (test && test.example) {
            test.example.eventManager.blocksEmulatedEvents = false;
        }
    });

    describe("composer/press-composer-spec", function () {
        if (!window.PointerEvent && !(window.MSPointerEvent && window.navigator.msPointerEnabled)) {

            describe("PressComposer", function () {

                it("should fire pressStart on mousedown", function () {
                    var listener = testPage.addListener(test.press_composer, null, "pressStart");

                    testPage.mouseEvent({target: test.example.element}, "mousedown");

                    expect(listener).toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.PRESSED);
                });

                it("should fire press on mouseup", function () {
                    var pressListener = testPage.addListener(test.press_composer, null, "press");
                    var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                    testPage.mouseEvent({target: test.example.element}, "mouseup");

                    expect(pressListener).toHaveBeenCalled();
                    expect(cancelListener).not.toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                });

                if (window.Touch) {
                    it("should fire pressStart on touchstart", function () {
                        var listener = testPage.addListener(test.press_composer, null, "pressStart");

                        testPage.touchEvent({target: test.example.element}, "touchstart");

                        expect(listener).toHaveBeenCalled();
                        expect(test.press_composer.state).toBe(PressComposer.PRESSED);
                    });

                    it("should fire press on touchend", function () {
                        var pressListener = testPage.addListener(test.press_composer, null, "press");
                        var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                        testPage.touchEvent({target: test.example.element}, "touchend");
                        // no event filtering within test so the state test need to before raising the mousedown event.
                        expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);

                        testPage.mouseEvent({target: test.example.element}, "mousedown"); //simulate event emulation

                        expect(pressListener).toHaveBeenCalled();
                        expect(cancelListener).not.toHaveBeenCalled();
                    });
                }

                // touchend's target is always the same as touch start, so this
                // test doesn't apply
                it("should fire pressCancel when the mouse/touch is released elsewhere", function () {
                    var pressListener = testPage.addListener(test.press_composer, null, "press");
                    var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                    testPage.mouseEvent({target: test.example.element}, "mousedown");
                    testPage.mouseEvent({target: test.innerComponent.element}, "mouseup");

                    expect(pressListener).not.toHaveBeenCalled();
                    expect(cancelListener).toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);

                    if (window.Touch) {
                        pressListener = testPage.addListener(test.press_composer, null, "press");
                        cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                        testPage.touchEvent({target: test.example.element}, "touchstart");
                        testPage.touchEvent({target: test.innerComponent.element}, "touchend");

                        expect(pressListener).not.toHaveBeenCalled();
                        expect(cancelListener).toHaveBeenCalled();
                        expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                    }
                });

                it("should end the interaction when surrenderPointer is called", function () {
                    var pressListener = testPage.addListener(test.press_composer, null, "press");
                    var endInteractionSpy = spyOn(test.press_composer, "_endInteraction").and.callThrough();

                    testPage.mouseEvent({target: test.example.element}, "mousedown");

                    test.press_composer.surrenderPointer(-1, test.example);

                    expect(pressListener).not.toHaveBeenCalled();
                    expect(endInteractionSpy).toHaveBeenCalled();

                    testPage.mouseEvent({target: test.example.element}, "mouseup");

                    expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);

                    if (window.Touch) {
                        pressListener = testPage.addListener(test.press_composer, null, "press");

                        testPage.touchEvent({target: test.example.element}, "touchstart");

                        test.press_composer.surrenderPointer(-1, test.example);

                        expect(pressListener).not.toHaveBeenCalled();
                        expect(endInteractionSpy).toHaveBeenCalled();

                        testPage.touchEvent({target: test.innerComponent.element}, "touchend");

                        expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                    }
                });

                describe("delegate", function () {
                    it("shouldComposerSurrenderPointerToComponent should be called", function () {
                        var pressListener = testPage.addListener(test.press_composer, null, "press");
                        var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                        test.press_composer.delegate = {
                            shouldComposerSurrenderPointerToComponent: function (pressComposer, pointer, component) {
                                return false;
                            }
                        };
                        spyOn(test.press_composer.delegate, 'shouldComposerSurrenderPointerToComponent').and.callThrough();

                        testPage.mouseEvent({target: test.example.element}, "mousedown");

                        test.press_composer.surrenderPointer(-1, test.example);

                        expect(cancelListener).not.toHaveBeenCalled();
                        expect(test.press_composer.state).toBe(PressComposer.PRESSED);

                        testPage.mouseEvent({target: test.example.element}, "mouseup");

                        expect(pressListener).toHaveBeenCalled();
                        expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);

                        if (window.Touch) {
                            pressListener = testPage.addListener(test.press_composer, null, "press");
                            cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                            test.press_composer.delegate = {
                                shouldComposerSurrenderPointerToComponent: function (pressComposer, pointer, component) {
                                    return false;
                                }
                            };
                            spyOn(test.press_composer.delegate, 'shouldComposerSurrenderPointerToComponent').and.callThrough();

                            testPage.touchEvent({target: test.example.element}, "touchstart");

                            test.press_composer.surrenderPointer(test.press_composer, -1, test.example);

                            expect(cancelListener).not.toHaveBeenCalled();
                            expect(test.press_composer.state).toBe(PressComposer.PRESSED);

                            testPage.touchEvent({target: test.example.element}, "touchend");
                            // no event filtering within test so the state test need to before raising the mousedown event.
                            expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);

                            testPage.mouseEvent({target: test.example.element}, "mousedown"); //simulate event emulation
                            expect(pressListener).toHaveBeenCalled();
                        }
                    });
                });

                describe("cancelPress", function () {
                    it("cancels the active press and returns true", function () {
                        var pressListener = testPage.addListener(test.press_composer, null, "press");
                        var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                        testPage.mouseEvent({target: test.example.element}, "mousedown");

                        expect(test.press_composer.cancelPress()).toBe(true);

                        expect(pressListener).not.toHaveBeenCalled();
                        expect(cancelListener).toHaveBeenCalled();
                        expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);

                        if (window.Touch) {
                            pressListener = testPage.addListener(test.press_composer, null, "press");
                            cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                            testPage.touchEvent({target: test.example.element}, "touchstart");

                            expect(test.press_composer.cancelPress()).toBe(true);

                            expect(pressListener).not.toHaveBeenCalled();
                            expect(cancelListener).toHaveBeenCalled();
                            expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                        }
                    });

                    it("returns false if there is no active press", function () {
                        var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                        expect(test.press_composer.cancelPress()).toBe(false);

                        expect(cancelListener).not.toHaveBeenCalled();
                        expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                    });
                });

                describe("longPress", function () {
                    it("is fired after longPressThreshold", function (done) {
                        var listener = testPage.addListener(test.press_composer, null, "longPress");

                        testPage.mouseEvent({target: test.example.element}, "mousedown");

                        setTimeout(function () {
                            expect(listener).toHaveBeenCalled();
                            testPage.mouseEvent({target: test.example.element}, "mouseup");

                            if (window.Touch) {
                                listener = testPage.addListener(test.press_composer, null, "longPress");

                                testPage.touchEvent({target: test.example.element}, "touchstart");

                                setTimeout(function () {
                                    expect(listener).toHaveBeenCalled();
                                    testPage.touchEvent({target: test.example.element}, "touchend");
                                    done();
                                });
                            } else {
                                done();
                            }
                        });
                    });

                    it("isn't fired if the press is released before the timeout", function (done) {
                        var longListener = testPage.addListener(test.press_composer, null, "longPress");

                        testPage.mouseEvent({target: test.example.element}, "mousedown");

                        setTimeout(function () {
                            expect(longListener).not.toHaveBeenCalled();

                            testPage.mouseEvent({target: test.example.element}, "mouseup");

                            if (window.Touch) {
                                longListener = testPage.addListener(test.press_composer, null, "longPress");

                                testPage.touchEvent({target: test.example.element}, "touchstart");

                                setTimeout(function () {
                                    expect(longListener).not.toHaveBeenCalled();
                                    testPage.touchEvent({target: test.example.element}, "touchend");
                                    done();
                                }, test.press_composer.longPressThreshold - 100);
                            } else {
                                done();
                            }
                        }, test.press_composer.longPressThreshold - 100);
                    });

                    describe("longPressThreshold", function () {
                        it("can be changed", function (done) {
                            var listener = testPage.addListener(test.press_composer, null, "longPress");
                            var timeout = test.press_composer.longPressThreshold - 500;
                            test.press_composer.longPressThreshold = timeout;

                            testPage.mouseEvent({target: test.example.element}, "mousedown");

                            setTimeout(function () {
                                expect(listener).toHaveBeenCalled();
                                testPage.mouseEvent({target: test.example.element}, "mouseup");
                            }, timeout);

                            if (window.Touch) {
                                listener = testPage.addListener(test.press_composer, null, "longPress");
                                timeout = test.press_composer.longPressThreshold - 500;
                                test.press_composer.longPressThreshold = timeout;

                                testPage.touchEvent({target: test.example.element}, "touchstart");

                                setTimeout(function () {
                                    expect(listener).toHaveBeenCalled();
                                    testPage.touchEvent({target: test.example.element}, "touchend");
                                    done();
                                }, timeout);
                            } else {
                                done();
                            }
                        });
                    });
                });
            });

            describe("Nested PressComposers", function () {
                beforeEach(function () {
                    test.outer_press_composer._endInteraction();
                    test.inner_press_composer._endInteraction();
                });

                it("should fire pressStart for inner composer", function () {
                    var inner_listener = testPage.addListener(test.inner_press_composer, null, "pressStart"),
                        outer_listener = testPage.addListener(test.outer_press_composer, null, "pressStart");

                    testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                    testPage.mouseEvent({target: test.innerComponent.element}, "mouseup");

                    expect(inner_listener).toHaveBeenCalled();
                    expect(outer_listener).not.toHaveBeenCalled();

                    if (window.Touch) {
                        /* Touch */
                        inner_listener = testPage.addListener(test.inner_press_composer, null, "pressStart");
                        outer_listener = testPage.addListener(test.outer_press_composer, null, "pressStart");

                        testPage.touchEvent({target: test.innerComponent.element}, "touchstart");
                        testPage.touchEvent({target: test.innerComponent.element}, "touchend");

                        expect(inner_listener).toHaveBeenCalled();
                        expect(outer_listener).not.toHaveBeenCalled();
                    }
                });


                it("should fire press for inner composer", function () {
                    var inner_listener = testPage.addListener(test.inner_press_composer, null, "press"),
                        outer_listener = testPage.addListener(test.outer_press_composer, null, "press");

                    testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                    testPage.mouseEvent({target: test.innerComponent.element}, "mouseup");

                    expect(inner_listener).toHaveBeenCalled();
                    expect(outer_listener).not.toHaveBeenCalled();

                    if (window.Touch) {
                        /* Touch */
                        inner_listener = testPage.addListener(test.inner_press_composer, null, "press");
                        outer_listener = testPage.addListener(test.outer_press_composer, null, "press");

                        var boundingRect = test.innerComponent.element.getBoundingClientRect(),
                            clientX = boundingRect.left,
                            clientY = boundingRect.top;

                        testPage.touchEvent({clientX:clientX, clientY: clientY, target: test.innerComponent.element}, "touchstart");
                        testPage.touchEvent({clientX:clientX, clientY: clientY, target: test.innerComponent.element}, "touchend");
                        testPage.mouseEvent({target: test.innerComponent.element}, "mousedown"); //simulate event emulation

                        expect(inner_listener).toHaveBeenCalled();
                        expect(outer_listener).not.toHaveBeenCalled();
                    }

                });

                it("should not fire PressStart for outer composer", function () {
                    var inner_listener = testPage.addListener(test.inner_press_composer, null, "pressCancel"),
                        outer_listener = testPage.addListener(test.outer_press_composer, null, "pressStart");

                    testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                    testPage.mouseEvent({target: test.innerComponent.element}, "mouseup");

                    expect(outer_listener).not.toHaveBeenCalled();
                    expect(inner_listener).not.toHaveBeenCalled();

                    if (window.Touch) {
                        /* Touch */
                        inner_listener = testPage.addListener(test.inner_press_composer, null, "pressCancel");
                        outer_listener = testPage.addListener(test.outer_press_composer, null, "pressStart");

                        var boundingRect = test.innerComponent.element.getBoundingClientRect(),
                            clientX = boundingRect.left,
                            clientY = boundingRect.top;

                        testPage.touchEvent({clientX:clientX, clientY: clientY, target: test.innerComponent.element}, "touchstart");
                        testPage.touchEvent({clientX:clientX, clientY: clientY, target: test.innerComponent.element}, "touchend");

                        expect(outer_listener).not.toHaveBeenCalled();
                        expect(inner_listener).not.toHaveBeenCalled();
                    }
                });

                // touchend's target is always the same as touch start, so this
                // test doesn't apply
                describe("outer_listener", function () {
                    var _dispatchPressStartSpy;
                    beforeEach(function () {
                        _dispatchPressStartSpy = spyOn(test.outer_press_composer, "_dispatchPressStart").and.callThrough();
                    });

                    it("should not fire a PressStart event when the mouse is released elsewhere", function () {
                        testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                        testPage.mouseEvent({target: testPage.document}, "mouseup");
                        expect(_dispatchPressStartSpy).not.toHaveBeenCalled();
                    });

                    it("should not fire a PressStart event when the mouse is released within the element but unclaimed", function () {
                        testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                        testPage.mouseEvent({target: test.inner2Component.element}, "mouseup");
                        expect(_dispatchPressStartSpy).not.toHaveBeenCalled();
                    });

                    if (window.Touch) {
                        it("should not fire a PressStart event when the touch is released elsewhere", function () {
                            testPage.touchEvent({target: test.innerComponent.element}, "touchstart");
                            testPage.touchEvent({target: testPage.document}, "touchend");
                            expect(_dispatchPressStartSpy).not.toHaveBeenCalled();
                        });

                        it("should not fire a PressStart event when the touch is released within the element but unclaimed", function () {
                            testPage.touchEvent({target: test.innerComponent.element}, "touchstart");
                            testPage.touchEvent({target: test.inner2Component.element}, "touchend");
                            expect(_dispatchPressStartSpy).not.toHaveBeenCalled();
                        });
                    }
                });
            });
        }
    });
});
