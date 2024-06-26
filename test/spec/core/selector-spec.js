
var Selector = require("mod/core/selector").Selector;
var serialize = require("mod/core/serialization/serializer/montage-serializer").serialize;
var deserialize = require("mod/core/serialization/deserializer/montage-deserializer").deserialize;

describe("core/selector-spec", function () {

    it("should initialize with path", function () {
        var selector = new Selector().initWithPath("a.b");
        expect(selector.evaluate({a: {b: 10}})).toBe(10);
    });

    it("should initialize with syntax", function () {
        var selector = new Selector().initWithSyntax({
            "type": "property",
            "args": [
                {"type": "value"},
                {"type": "literal", "value": "foo"}
            ]
        });
        expect(selector.evaluate({foo: 10})).toBe(10);
    });

    it("should serialize", function () {
        var selector = new Selector().initWithPath("a.b");
        var serialization = serialize(selector, require);
        var json = JSON.parse(serialization);
        expect(json).toEqual({
            root: {
                prototype: "mod/core/criteria",
                values: {
                    expression: "a.b"
                }
            }
        });
    })

    it("should deserialize", function (done) {
        var serialization = {
                "root": {
                    "prototype": "mod/core/selector",
                    "values": {
                        "path": "a.b"
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        deserialize(serializationString, require).then(function (selector) {
            expect(selector.evaluate({a: {b: 20}})).toEqual(20);
            done();
        });
    })

    it("should compose with class methods", function () {
        var selector = Selector.and('a', 'b');
        expect(selector.evaluate({a: false, b: true})).toBe(false);
    });

    it("should compose with instance methods", function () {
        var selector = new Selector().initWithPath("a").and("b");
        expect(selector.evaluate({a: false, b: true})).toBe(false);
    });
});

