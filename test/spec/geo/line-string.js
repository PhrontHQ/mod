var LineString = require("mod/data/model/geo/line-string").LineString,
    Bindings = require("mod/core/frb/bindings"),
    Deserializer = require("mod/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    Position = require("mod/data/model/geo/position").Position,
    Serializer = require("mod/core/serialization/serializer/montage-serializer").MontageSerializer;

describe("A LineString", function () {

    function roundedBbox(bbox) {
        return bbox.map(function (coordinate) {
            return Math.round(coordinate);
        })
    }

    it("can be created", function () {
        var line = LineString.withCoordinates([[0, 0], [0, 10]]);
        expect(line).toBeDefined();
    });

    it("can serialize", function () {
        var l1 = LineString.withCoordinates([[0, 0], [0, 10]]),
            serializer = new Serializer().initWithRequire(require),
            serialized = serializer.serializeObject(l1);
        expect(serialized).not.toBeNull();
    });

    it("can deserialize", function (done) {
        var l1 = LineString.withCoordinates([[0, 0], [0, 10]]),
            serialized = new Serializer().initWithRequire(require).serializeObject(l1);
        new Deserializer().init(serialized, require).deserializeObject().then(function (lineString) {
            expect(l1.equals(lineString)).toBe(true);
            done();
        });
    });

    it("can test for intersection with another line string", function () {
        var line = LineString.withCoordinates([[0, 0], [0, 10]]),
            intersectingLine = LineString.withCoordinates([[-5, 5], [5, 5]]),
            nonIntersectingLine = LineString.withCoordinates([[-5, -5], [5, -5]]);
        expect(line.intersects(intersectingLine)).toBe(true);
        expect(line.intersects(nonIntersectingLine)).toBe(false);
    });

    it ("can test for equality", function () {
        var a = LineString.withCoordinates([[0, 0], [10, 0], [10, 10], [0, 10]]),
            b = LineString.withCoordinates([[0, 0], [10, 0], [10, 10], [0, 10]]),
            c = LineString.withCoordinates([[0, 0], [10, 0], [10, 10]]),
            d = LineString.withCoordinates([[0, 0], [10, 0], [10, 10], [10, 10]]);

        expect(a.equals(b)).toBe(true);
        expect(a.equals(c)).toBe(false);
        expect(a.equals(d)).toBe(false);
    });

    it ("can test clone itself", function () {
        var a = LineString.withCoordinates([[0, 0], [10, 0], [10, 10], [0, 10]]),
            b = a.clone();

        expect(a.equals(b)).toBe(true);
    });

});
