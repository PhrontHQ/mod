var Enumeration = require("data/model/enumeration").Enumeration,
    Position = require("./position").Position,
    Promise = require("core/promise").Promise,
    Units = require("./units").Units;

/**
 * @class
 * @extends external:Enumeration
 */
exports.Projection = Enumeration.specialize("", /** @lends Projection.prototype */ {

    isMGRS: {
        value: false
    },

    /**
     * Spatial Reference System Identifier (SRID).
     *
     * @type {string}
     */
    srid: {
        value: undefined
    },

    /**
     * @type {Units}
     * FIXME: Should really be "unit", singular
     */
    units: {
        value: undefined
    }

}, /** @lends Projection */ {

    /**
     * @method
     */
    forSridAndUnits: {
        value: function (srid, units) {
            if (!this._bySrid[srid]) {
                this._bySrid[srid] = this._createWithSridAndUnits(srid, units);
            }
            return this._bySrid[srid];
        }
    },

    _createWithSridAndUnits: {
        value: function (srid, units) {
            var projection = new this();
            projection.srid = srid;
            projection.units = units;

            return projection;
        }
    },

    /**
     * @method
     */
    forSrid: {
        value: function (srid) {
            return this._bySrid[srid] || null;
        }
    },

    _bySrid: {
        get: function () {
            if (!this.__bySrid) {
                this.__bySrid = {};
                this.__bySrid["3395"] = this.forSridAndUnits("3395", Units.METERS);
                this.__bySrid["3857"] = this.forSridAndUnits("3857", Units.METERS);
                this.__bySrid["4326"] = this.forSridAndUnits("4326", Units.DECIMAL_DEGREES);
                this.__bySrid["4269"] = this.forSridAndUnits("4269", Units.DECIMAL_DEGREES);
                this.__bySrid["32718"] = this.forSridAndUnits("32718", Units.DECIMAL_DEGREES);
                this.__bySrid["27700"] = this.forSridAndUnits("27700", Units.METERS);
                this.__bySrid["102100"] = this.forSridAndUnits("102100", Units.METERS);
                this.__bySrid["900913"] = this.forSridAndUnits("900913", Units.METERS);
                this.__bySrid["MGRS"] = this.forSridAndUnits("MGRS", Units.METERS);
                this.__bySrid["MGRS"].isMGRS = true;
            }
            return this.__bySrid;
        }
    },

    _spatialReferenceBaseURL: {
        value: "https://epsg.io/"
    },

    fetchProjectionByID: {
        value: function (srid) {
            var self = this,
                url = this._spatialReferenceBaseURL + srid + ".js",
                units;
            return this._fetch(url).then(function (response) {
                eval(response);
                units = self._unitsForDefinition(response);
                return self.forSridAndUnits(srid, units);
            }).catch(function (e) {
                console.warn(e);
            });
        }
    },

    _metersRegExp: {
        value: /\+units=m/
    },

    _ftRegExp: {
        value: /\+units=us-ft/
    },

    _unitsForDefinition: {
        value: function (definition) {
            return this._metersRegExp.test(definition) ? Units.METERS :
                this._ftRegExp.test(definition)     ? Units.FEET :
                    Units.DECIMAL_DEGREES;
        }
    },

    _fetch: {
        //TODO Make Projection a first level mod-data type and perform the fetch in a service
        value: function (url) {
            var self = this,
                xhr;

            return new Promise(function (resolve, reject) {
                xhr = new XMLHttpRequest();
                xhr.open("GET", url, true);
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error("SRID request failed with status " + xhr.status));
                    }
                };
                xhr.onerror = function (e) {
                    reject(e);
                };
                xhr.send(null);
            });
        }
    }

}, {});
