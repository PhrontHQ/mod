var Geometry = require("./geometry").Geometry,
    Polygon = require("./polygon").Polygon;

/**
 *
 * A Geometry whose coordinates property is an array of
 * Polygon coordinate arrays.
 *
 * @class
 * @extends external:Geometry
 */
var MultiPolygon = exports.MultiPolygon = Geometry.specialize(/** @lends MultiPolygon.prototype */ {

    /**
     * @type {array<Polygon>>
     */
    coordinates: {
        value: undefined
    },

    bounds: {
        value: function () {
            throw "MultiPolygon.bounds() implementation requires geo.mod";
        }
    },

    makeBoundsObserver: {
        value: function () {
            throw "MultiPolygon.makeBoundsObserver() implementation requires geo.mod";
        }
    },

    observeBounds: {
        value: function (emit) {
            throw "MultiPolygon.observeBounds() implementation requires geo.mod";
        }
    },

    /**
     * @method
     * @param {Polygon} geometry    - The polygon to test for
     *                                intersection
     * @returns {boolean}
     */
    intersects: {
        value: function (geometry) {
            return this.coordinates.some(function (polygon) {
                return polygon.intersects(geometry);
            });
        }
    },

    /**
     * @deprecated
     */
    toGeoJSON: {
        value: function () {
            var coordinates = this.coordinates && this.coordinates.map(function (polygons) {
                    return polygons.coordinates.map(function (rings) {
                        return rings.map(function (position) {
                            return [position.longitude, position.latitude];
                        });
                    });
                }) || [[[]]];
            return {
                type: "MultiPolygon",
                coordinates: coordinates
            }
        }
    },

    /**
     * Returns true if the provided position in contained with any of this
     * geometry's polygons.
     * @method
     * @param {Position} position
     * @return boolean
     */
    contains: {
        value: function (position) {
            return this.coordinates.some(function (polygon) {
                return polygon.contains(position);
            });
        }
    },

    /**
     * Tests whether this Multi-Polygon's coordinates member equals the
     * provided one.  The two geometries are considered equal if they have the
     * same number of child polygons and each child is considered equal
     * to the passed in multi-polygon's child at the same position.
     * @param {MultiPolygon} other - the multi-polygon to test for equality.
     * @return {boolean}
     */
    equals: {
        value: function (other) {
            var isThis = other instanceof MultiPolygon,
                a = isThis && this.coordinates,
                b = isThis && other.coordinates;
            return isThis && a.length === b.length && this._compare(a, b);
        }
    },

    /**
     * Returns a copy of this LineString.
     *
     * @method
     * @returns {Geometry}
     */
    clone: {
        value: function () {
            var coordinates = this.coordinates.map(function (polygon) {
                return polygon.coordinates.map(function (ring) {
                    return ring.map(function (coordinate) {
                        return [coordinate.longitude, coordinate.latitude];
                    });
                })
            });
            return exports.MultiPolygon.withCoordinates(coordinates);
        }
    },

    _compare: {
        value: function (a, b) {
            var isEqual = true, i, n;
            for (i = 0, n = a.length; i < n && isEqual; i += 1) {
                isEqual = a[i].equals(b[i]);
            }
            return isEqual;
        }
    }

}, {

    /**
     * Returns a newly initialized point with the specified coordinates.
     *
     * @param {array<array<number>>} rings - The LinearRings that compose
     *                                       this polygon.  The first ring
     *                                       is the outline of the polygon.
     *                                       The other rings represent holes
     *                                       inside the outer polygon.
     * @param {?Projection} projection     - If supplied projects the supplied
     *                                       coordinates to this reference
     *                                       system.
     * @return {Polygon} polygon
     */
    withCoordinates: {
        value: function (rings, projection) {
            var self = new this();
            self.coordinates = rings.map(function (ring) {
                return Polygon.withCoordinates(ring, projection);
            });
            return self;
        }
    }

});
