
var Criteria = require("mod/core/criteria").Criteria;
var serialize = require("mod/core/serialization/serializer/montage-serializer").serialize;
var deserialize = require("mod/core/serialization/deserializer/montage-deserializer").deserialize;

describe("core/criteria-spec", function () {

    it("should initialize with path", function () {
        var criteria = new Criteria().initWithPath("a.b");
        expect(criteria.evaluate({a: {b: 10}})).toBe(10);
    });

    it("should initialize with syntax", function () {
        var criteria = new Criteria().initWithSyntax({
            "type": "property",
            "args": [
                {"type": "value"},
                {"type": "literal", "value": "foo"}
            ]
        });
        expect(criteria.evaluate({foo: 10})).toBe(10);
    });

    it("should serialize", function () {
        var criteria = new Criteria().initWithPath("a.b");
        var serialization = serialize(criteria, require);
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
                    "prototype": "mod/core/criteria",
                    "values": {
                        "path": "a.b"
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        deserialize(serializationString, require).then(function (criteria) {
            expect(criteria.evaluate({a: {b: 20}})).toEqual(20);
            done();
        });
    })

    it("should compose with class methods", function () {
        var criteria = Criteria.and('a', 'b');
        expect(criteria.evaluate({a: false, b: true})).toBe(false);
    });

    it("should compose with instance methods", function () {
        var criteria = new Criteria().initWithPath("a").and("b");
        expect(criteria.evaluate({a: false, b: true})).toBe(false);
    });
});

