var Montage = require("mod/core/core").Montage;
var AbstractSelect = require("mod/ui/base/abstract-select").AbstractSelect;
var RangeController = require("mod/core/range-controller").RangeController;
var MockDOM = require("mocks/dom");

AbstractSelect.prototype.hasTemplate = false;

describe("test/base/abstract-select-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractSelect();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var SelectSubtype = AbstractSelect.specialize( {});
            var aSelectSubtype;
            expect(function () {
                aSelectSubtype = new SelectSubtype();
            }).not.toThrow();
            expect(aSelectSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var Select = AbstractSelect.specialize( {}),
            aSelect,
            content = [{
                "label": "Canada",
                "value": "canada"
            }, {
                "label": "Germany",
                "value": "germany"
            }, {
                "label": "Norway",
                "value": "norway"
            }];

        beforeEach(function () {
            aSelect = new Select();
            aSelect.element = MockDOM.element();
        });

        describe("enabled", function () {
            beforeEach(function () {
                aSelect = new Select();
                aSelect.element = MockDOM.element();
                aSelect.prepareForActivationEvents();
            });

            it("should add the corresponding class name to classList when enabled is false", function () {
                aSelect.enabled = false;
                expect(aSelect.classList.contains("mod--disabled")).toBe(true);
            });
        });

        describe("content", function () {
            it("should setup the content controller with the content", function () {
                var content = [];

                aSelect.content = content;

                expect(aSelect.contentController.content).toBe(content);
            });

            it("should consider the content dirty when it has a new content", function () {
                aSelect.content = [];

                expect(aSelect._contentIsDirty).toBeTruthy();
            });

            it("should consider the content dirty when it is modified", function () {
                aSelect.content = [];
                aSelect._contentIsDirty = false;

                aSelect.content.push(1);

                expect(aSelect._contentIsDirty).toBeTruthy();
            });
        });

        describe("contentController", function () {
            it("should setup content with the contentController's content", function () {
                var contentController = new RangeController();

                contentController.content = content;
                aSelect.contentController = contentController;

                expect(aSelect.content).toBe(content);
            });
        });

        describe("value", function () {
            beforeEach(function () {
                aSelect = new Select();
                aSelect.content = content.slice(0);
            });

            it("should have a default value from the content", function () {
                expect(aSelect.contentController.content).toContain(aSelect.value);
            });

            it("should change the selection of the content controller", function () {
                aSelect.value = content[1];

                expect(aSelect.contentController.selection.length).toBe(1);
                expect(aSelect.contentController.selection[0]).toBe(content[1]);
            });

            it("should change when content controller's selection change", function () {
                aSelect.contentController.selection = [content[1]];

                expect(aSelect.value).toBe(content[1]);
            });

            it("should change when content controller's selection is modified", function () {
                aSelect.contentController.selection = [content[0]];
                aSelect.contentController.selection.splice(0, 1, content[1]);

                expect(aSelect.value).toBe(content[1]);
            });

            it("should change when content controller is modified", function () {
                aSelect.contentController.selection = [content[0]];

                var newContentController = new RangeController();
                newContentController.content = content;
                newContentController.selection = [content[1]];

                aSelect.contentController = newContentController;
                expect(aSelect.value).toBe(content[1]);
            });

            it("should change to another value when content controller's selection is removed from the content", function () {
                aSelect.contentController.selection = [content[0]];
                aSelect.contentController.content.delete(content[0]);

                expect(aSelect.contentController.content).toContain(aSelect.value);
            });

            it("should dispatch value changes when values' first value change", function () {
                var spy = jasmine.createSpy();

                aSelect.addOwnPropertyChangeListener("value", function () {
                    spy();
                });

                aSelect.values = [content[1]];
                expect(spy).toHaveBeenCalled();
            });
        });

        describe("value with allowsMultipleSelection", function () {
            beforeEach(function () {
                aSelect = new Select();
                aSelect.content = content;
                aSelect.allowsMultipleSelection = true;
            });

            it("should have first of the values", function () {
                aSelect.values = [content[1], content[2]];
                expect(aSelect.value).toBe(content[1]);
            });

            it("should set first of the values", function () {
                aSelect.values = [content[1], content[2]];
                aSelect.value = content[2];
                expect(aSelect.values.slice()).toEqual([content[2]]);
            });
        });

        describe("values", function () {
            beforeEach(function () {
                aSelect = new Select();
                aSelect.content = content;
                aSelect.allowsMultipleSelection = true;
            });

            it("should change the selection of the content controller", function () {
                aSelect.values = [content[1], content[2]];

                expect(aSelect.contentController.selection.length).toBe(2);
                expect(aSelect.contentController.selection[0]).toBe(content[1]);
                expect(aSelect.contentController.selection[1]).toBe(content[2]);
            });

            it("should change the selection of the content controller when values is modifed", function () {
                aSelect.values = [content[1]];
                expect(aSelect.values.toArray()).toEqual([content[1]]);
                expect(aSelect.contentController.selection.toArray()).toEqual([content[1]]);

                aSelect.values.push(content[2]);

                expect(aSelect.contentController.selection.length).toBe(2);
                expect(aSelect.contentController.selection[0]).toBe(content[1]);
                expect(aSelect.contentController.selection[1]).toBe(content[2]);
            });

            it("should change when content controller's selection change", function () {
                aSelect.contentController.selection.splice(0, 1, content[1], content[2]);

                expect(aSelect.values.length).toBe(2);
                expect(aSelect.values[0]).toBe(content[1]);
                expect(aSelect.values[1]).toBe(content[2]);
            });

            it("should change when content controller's selection is modified", function () {
                aSelect.contentController.selection.splice(0, 1, content[1]);
                aSelect.contentController.selection.push(content[2]);

                expect(aSelect.values.length).toBe(2);
                expect(aSelect.values[0]).toBe(content[1]);
                expect(aSelect.values[1]).toBe(content[2]);
            });

            it("should copy the contents when setting a new value", function () {
                // This is needed to bind to a rangeContent()
                aSelect.values = [content[1]];
                aSelect.contentController.selection.push(content[2]);

                expect(aSelect.values.slice()).toEqual([content[1], content[2]]);
            });
        });

        describe("allowsMultipleSelection", function () {
            beforeEach(function () {
                aSelect = new Select();
                aSelect.content = content;
            });

            it("should only have one item in the content controller's selection when allowsMultipleSelection is off", function () {
                aSelect.allowsMultipleSelection = false;
                expect(aSelect.contentController.selection.length).toBe(1);

                aSelect.values = [content[1], content[2]];
                expect(aSelect.contentController.selection.length).toBe(1);
            });

            it("should only have one selected item in content controller's selection when allowsMultipleSelection is turned off", function () {
                aSelect.allowsMultipleSelection = true;
                aSelect.values = [content[1], content[2]];

                aSelect.allowsMultipleSelection = false;
                expect(aSelect.contentController.selection.length).toBe(1);
            });
        });

        describe("labelPropertyName", function () {
            beforeEach(function () {
                aSelect = new Select();
                aSelect.element = MockDOM.element();
            });

            it("should consider the content dirty when it is modified", function () {
                aSelect.labelPropertyName = "key";

                expect(aSelect._contentIsDirty).toBeTruthy();
            });
        });

    });

    describe("draw", function () {
        var Select = AbstractSelect.specialize({}),
            aSelect,
            content = [{
                "label": "Canada",
                "value": "canada"
            }, {
                "label": "Germany",
                "value": "germany"
            }, {
                "label": "Norway",
                "value": "norway"
            }];

        beforeEach(function () {
            aSelect = new Select();
            aSelect.element = MockDOM.element();
            aSelect.contentController.content = content;
            aSelect.needsDraw = false;
        });

        it("should be requested after enabled state is changed", function () {
            aSelect.enabled = ! aSelect.enabled;
            expect(aSelect.needsDraw).toBeTruthy();
        });

        it("should be requested when active", function () {
            aSelect.active = true;
            expect(aSelect.needsDraw).toBeTruthy();
        });

        it("should be requested when value is changed", function () {
            aSelect.value = content[1];
            expect(aSelect.needsDraw).toBeTruthy();
        });

        it("should be requested when values is changed", function () {
            aSelect.values = [content[0], content[1]];
            expect(aSelect.needsDraw).toBeTruthy();
        });

        it("should be requested when values is modified", function () {
            aSelect.values = [content[0]];
            aSelect.needsDraw = false;

            aSelect.values.push(content[1]);
            expect(aSelect.needsDraw).toBeTruthy();
        });

        it("should be requested when contentController selection is changed", function () {
            aSelect.contentController.selection.splice(0, 2, content[1]);
            expect(aSelect.needsDraw).toBeTruthy();
        });

        it("should be requested when contentController selection is modified", function () {
            aSelect.contentController.selection.splice(0, 0, content[0]);
            aSelect.needsDraw = false;
            aSelect.contentController.selection.push(content[1]);
            expect(aSelect.needsDraw).toBeTruthy();
        });

        it("should be requested when content changes", function () {
            aSelect.contentController.content = content.slice(0);
            expect(aSelect.needsDraw).toBeTruthy();
        });

        it("should be requested when content is modified", function () {
            aSelect.content.splice(1, 1);
            expect(aSelect.needsDraw).toBeTruthy();
        });

        it("should be requested when labelPropertyName changes", function () {
            aSelect.labelPropertyName = "key";
            expect(aSelect.needsDraw).toBeTruthy();
        });
    });

    describe("active target", function () {
        var Select = AbstractSelect.specialize( {}),
            aSelect, anElement;

        beforeEach(function () {
            aSelect = new Select();
            anElement = MockDOM.element();
        });

        it("should accept active target", function () {
            expect(aSelect.acceptsActiveTarget).toBeTruthy();
        });
    });

    describe("events", function () {
        var Select = AbstractSelect.specialize( {}),
            aSelect, anElement, listener;

        beforeEach(function () {
            aSelect = new Select();
            anElement = MockDOM.element();
            listener = {
                handleEvent: function () {}
            };
        });

        it("should listen for pressStart only after prepareForActivationEvents", function () {
            var listeners,
                em = aSelect.eventManager;

            listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", aSelect._pressComposer);
            expect(listeners).toBeNull();

            aSelect.prepareForActivationEvents();

            listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", aSelect._pressComposer);
            expect(listeners).toEqual(aSelect);
        });

        /*
            This triggers:

            DEPRECATION: describe with no children (describe() or it()) is deprecated and will be removed in a future version of Jasmine. Please either remove the describe or add children to it.
            Note: This message will be shown only once. Set the verboseDeprecations config property to true to see every occurrence.

            Looking at it, this seems to be done in the it() block above
        */
        // describe("once prepareForActivationEvents is called", function () {
        //     beforeEach(function () {
        //         aSelect.element = anElement;
        //         aSelect.prepareForActivationEvents();
        //     });
        // });
    });

    describe("objectDescriptor", function () {
        it("can be created", function (done) {
            var objectDescriptorPromise = AbstractSelect.objectDescriptor;
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
