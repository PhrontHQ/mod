/**
 * @module mod/data/service/u-r-l-search-param-identity-service
 */

var DataService = require("data/service/data-service").DataService,
    IdentityService = require("data/service/identity-service").IdentityService,
    DataOperation = require("data/service/data-operation").DataOperation,
    Identity = require("data/model/identity").Identity,
    IdentityObjectDescriptor = require("data/model/identity.mjson").montageObject,
    ReadEvent = require("../model/read-event").ReadEvent,
    URLSearchParamIdentityService;


/**
 *
 * @class
 * @extends DataIdentityService
 */
exports.URLSearchParamIdentityService = URLSearchParamIdentityService = IdentityService.specialize( /** @lends URLSearchParamIdentityService.prototype */ {


    constructor: {
        value: function URLSearchParamIdentityService() {
            this.super();

            return this;
        }
    },

     /***************************************************************************
     * Serialization
     */

    deserializeSelf: {
        value:function (deserializer) {
            this.super(deserializer);

            value = deserializer.getProperty("searchParamName");
            if (value) {
                this.searchParamName = value;
            }

            value = deserializer.getProperty("identityQuery");
            if (value) {
                this.identityQuery = value;
            }

            value = deserializer.getProperty("defaultSearchParamValue");
            if (value) {
                this.defaultSearchParamValue = value;
            }

        }
    },


    /**
     * The name of search param the data service should get it's value from to create a DataIdentity
     *
     * @property {String} serializable
     * @default undefined
     */
    searchParamName: {
        value: undefined
    },

    _searchParamValue: {
        value: undefined
    },
    searchParamValue: {
        get: function() {
            return this._searchParamValue != undefined
            ? this._searchParamValue
            : this.defaultSearchParamValue;
        },
        set: function(value) {
            if(!value !== this._searchParamValue) {
                this._searchParamValue = value;
            }
        }
    },

    /**
     * in case nothing is found, the value to be returned.
     *
     * @property {String} serializable
     * @default undefined
     */

    defaultSearchParamValue: {
        value: undefined
    },

    identityQuery: {
        value: undefined
    },

    _identity: {
        value: undefined
    },

    handleReadOperation: {
        value: function (operation) {
            // var stream = DataService.mainService.registeredDataStreamForDataOperation(operation);
            
            /*
                As we evolve the stack, rawDataService doesn't do
                                this.registerPendingDataOperationWithContext(readOperation, stream);

                in its implementation of handleReadOperation(), which would force RawDataServices to call super...
            */
            var stream = this.contextForPendingDataOperation(operation) || operation.dataStream;
            this.fetchRawData(stream);
            this.unregisterPendingDataOperation(operation);
        }
    },

    fetchRawData: {
        value: function (stream) {

            if(!this._identity) {
                this._identity = new Identity();

                this.searchParamValue = this.application.url.searchParams.get(this.searchParamName);

                this._identity.scope = [this.identityQuery];
            }

            /* This bypass typicall rawData level since we create an object here */
            stream.addData([this._identity]);
            stream.dataDone();
        }
    }
}, {
});
