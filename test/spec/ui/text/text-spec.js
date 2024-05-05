/*global require,exports,describe,it,expect */
var Montage = require("mod/core/core").Montage;
var TestPageLoader = require("mod-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("text-test", function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });

    describe("ui/text/text-spec", function () {

        describe("Text", function () {
            it("wipes out its content in initialization", function () {
                expect(testPage.getElementById("bar")).toBeNull();
            });
        });

        describe("Text using plain text", function () {
            it("can be created", function () {
                expect(test.plainText).toBeDefined();
            });

            it("value can be set", function (done) {
                test.plainText.value = "foo";
                testPage.waitForDraw().then(function () {
                    expect(test.plainText.element.textContent).toEqual("foo");
                    done();
                });
            });

            it("value can be reset", function (done) {
                test.plainText.value = "";
                testPage.waitForDraw().then(function () {
                    expect(test.plainText.element.textContent).toEqual("");
                    done();
                });
            });
        });
    });
});
