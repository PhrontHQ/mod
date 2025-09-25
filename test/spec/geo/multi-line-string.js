var MultiLineString = require("mod/data/model/geo/multi-line-string").MultiLineString,
    Bindings = require("mod/core/frb/bindings"),
    Deserializer = require("mod/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    LineString = require("mod/data/model/geo/line-string").LineString,
    Position = require("mod/data/model/geo/position").Position,
    Serializer = require("mod/core/serialization/serializer/montage-serializer").MontageSerializer;

describe("A MultiLineString", function () {

    it("can be created", function () {
        var multiline = MultiLineString.withCoordinates([
            [[0, 0], [0, 10]],
            [[0, 0], [0, -10]],
            [[0, 0], [10, 0]],
            [[0, 0], [-10, 0]]
        ]);
        expect(multiline).toBeDefined();
        expect(multiline.coordinates.length).toBe(4);
        expect(multiline.coordinates[0].coordinates[0].longitude).toBe(0);
        expect(multiline.coordinates[0].coordinates[0].latitude).toBe(0);
        expect(multiline.coordinates[0].coordinates[1].longitude).toBe(0);
        expect(multiline.coordinates[0].coordinates[1].latitude).toBe(10);
    });

    it("can serialize", function () {
        var l1 = MultiLineString.withCoordinates([
                [[0, 0], [0, 10]],
                [[0, 0], [0, -10]],
                [[0, 0], [10, 0]],
                [[0, 0], [-10, 0]]
            ]),
            serializer = new Serializer().initWithRequire(require),
            serialized = serializer.serializeObject(l1);
        expect(serialized).not.toBeNull();
    });

    it("can deserialize", function (done) {
        var l1 = MultiLineString.withCoordinates([
                [[0, 0], [0, 10]],
                [[0, 0], [0, -10]],
                [[0, 0], [10, 0]],
                [[0, 0], [-10, 0]]
            ]),
            serializer = new Serializer().initWithRequire(require),
            serialized = serializer.serializeObject(l1);
        new Deserializer().init(serialized, require).deserializeObject().then(function (lineString) {
            expect(l1.equals(lineString)).toBe(true);
            done();
        });
    });

    it("can test for intersection with a line string", function () {
        var multiline = MultiLineString.withCoordinates([
                [[0, 0], [0, 10]],
                [[0, 0], [0, -10]],
                [[0, 0], [10, 0]],
                [[0, 0], [-10, 0]]
            ]),
            intersectingLine = LineString.withCoordinates([[-5, -5], [-5, 5]]),
            nonIntersectingLine = LineString.withCoordinates([[-5, -5], [-5, -15]]);
        expect(multiline.intersects(intersectingLine)).toBe(true);
        expect(multiline.intersects(nonIntersectingLine)).toBe(false);
    });

    it ("can test for equality", function () {
        var a = MultiLineString.withCoordinates([
                [[0, 0], [0, 10]],
                [[0, 0], [0, -10]],
                [[0, 0], [10, 0]],
                [[0, 0], [-10, 0]]
            ]),
            b = MultiLineString.withCoordinates([
                [[0, 0], [0, 10]],
                [[0, 0], [0, -10]],
                [[0, 0], [10, 0]],
                [[0, 0], [-10, 0]]
            ]),
            c = MultiLineString.withCoordinates([
                [[0, 0], [0, 10]],
                [[0, 0], [10, 0]],
                [[0, 0], [-10, 0]]
            ]),
            d = MultiLineString.withCoordinates([
                [[0, 0], [0, 10]],
                [[0, 0], [0, -10]],
                [[10, 0], [10, 0]],
                [[0, 0], [-10, 0]]
            ]),
            e = MultiLineString.withCoordinates([
                [[0, 0], [0, 10]],
                [[0, 0], [0, -10]],
                [[0, 0], [10, 0], [10, 10]],
                [[0, 0], [-10, 0]]
            ]);

        expect(a.equals(b)).toBe(true);
        // c has fewer line-string children
        expect(a.equals(c)).toBe(false);
        // d has a different longitude for the third child line-string's
        // first element
        expect(a.equals(d)).toBe(false);
        // e has an additional position in the third child line-string
        expect(a.equals(e)).toBe(false);
    });

    it ("can clone itself", function () {
        var a = MultiLineString.withCoordinates([
                [[0, 0], [0, 10]],
                [[0, 0], [0, -10]],
                [[0, 0], [10, 0]],
                [[0, 0], [-10, 0]]
            ]),
            b = a.clone();

        expect(a.equals(b)).toBe(true);
    });

});
