var Montage = require("../../core/core").Montage;

/**
 * A RawDataIdentifier represents a universal identifier for an object created by
 * by a RawDataService in Mod Data. It provides the support for uniquing data instances and snapshots in a RawDataService.
 * Whether an object exists in one or more local DataServices in an Application
 * or in a remote one, a RawDataIdentifier encapsulates the information needed to
 * uniquely identify an object, like a primary key in a database.  A RawDataIdentifier
 * has a URL representation, which is conceptually aligned with the notion of
 * resource. It should have:
 *
 * - a host/source/origin: where the data come from. Automatically generated
 * primary keys exists in only one environment - Dev, test, prod, etc...,
 * (a user's authorization (if any necessary) should be left to be resolved
 * by a client receiving the identifier, only people authenticated and authorized
 * would be able to get it and that happens at DataService level)
 *
 * - a type
 *
 * - a primary key. This could be a combination of property/value, but it needs
 * to be serializable as a valid url
 *
 * Exact details are not exposed and may vary per specific DataService or RawDataService
 *
 * Note, a dataService's identifier is by default it's moduleId.
 *
 * "mod-data://[this.dataService.identifier]/[this.dataService.connectionDescriptor.name]/[this.objectDescriptor.name]/[this.primaryKey]
 *
 * "mod-data://twitter-service/production/user/14DS9ZT459EF44305UI

 * @class
 * @extends external:Montage
 */
exports.RawDataIdentifier = Montage.specialize(/** @lends RawDataIdentifier.prototype */ {

    /**
     * The DataService that created this RawDataIdentifier
     *
     * @type {DataService}
     */
    dataService: {
        value: undefined
    },

    /**
     * The ObjectDescriptor associated with a rawDataIdentifier if available
     *
     * @type {ObjectDescriptor}
     */
    objectDescriptor: {
        value: undefined
    },

    /**
     * The primaryKey of the object the rawDataIdentifier represents
     *
     * @type {Object}
     */
    primaryKey: {
        value: undefined
    },

    /**
     * The primaryKey of the object the rawDataIdentifier represents
     *
     * @type {String}
     */
    _typeName:{
        value: undefined
    },
    typeName: {
        get: function() {
            return this._typeName || (this._typeName = this.objectDescriptor ? this.objectDescriptor.name : "MISSING_TYPE_NAME");
        },
        set: function(value) {
            this._typeName = value;
        }
    },

    /**
     * Whether a RawDataIdentifier is persistent/final vs temporary when created
     * client side.
     *
     * @type {boolean}
     */
    isPersistent: {
        value: false
    },

    _identifier: {
        get: function() {
            return this.url;
        }
    },

    identifier: {
        get: function() {
            return this.url;
        }
    },

    toString: {
        value: function() {
            return this.url;
        }
    },

    valueOf: {
        value: function() {
            return this.url;
        }
    },

    _url: {
        value: undefined
    },

    /**
     * The url representation of a rawDataIdentifier
     *
     * @type {string}
     */
    url: {
        get: function () {
            if(!this._url) {
                var _url = "mod-data://";
                _url += this.dataService.identifier;
                _url += "/";
                _url += this.dataService.connection
                            ? this.dataService.connection.identifier
                                ? this.dataService.connection.identifier
                                : this.dataService.connection.name
                                    ? this.dataService.connection.name
                                    : name
                            : "default";
                _url += "/";
                _url += this.objectDescriptor.name;
                _url += "/";
                _url += this.primaryKey;
                this._url = _url;
            }
            return this._url;
        },
        set: function (value) {
            return (this._url = value);
        }
    }

});
