var Montage = require("mod/core/core").Montage,
    TestPageLoader = require("mod-testing/testpageloader").TestPageLoader,
    Template = require("mod/core/template").Template,
    Application = require("mod/core/application").application;

TestPageLoader.queueTest("resize-event/resize-event", function (testPage) {
    describe("ui/resize-event-spec", function () {
        var eventManager,
            application,
            delegate;

        var querySelector = function (s) {
            return testPage.querySelector(s);
        };
        var querySelectorAll = function (s) {
            return testPage.querySelectorAll(s);
        };

        beforeEach(function () {
            application = testPage.global.mr("mod/core/application").application;
            eventManager = application.eventManager;
            delegate = application.delegate;
        });

        it("should trigger change event when size changes", function (done) {
            var testDiv = document.getElementById("test-container");
            function handleChange(event) {
                expect(event.type).toBe("change");
                done();
            }
            testDiv.addEventListener("change", handleChange, {
                size: {
                    box: "border-box"
                }
            });
            // Simulate a size change
            testDiv.style.width = "200px";
            testDiv.style.height = "200px";
            // You may need to trigger a reflow or dispatch a custom event if your implementation requires it
        });
    });
});
