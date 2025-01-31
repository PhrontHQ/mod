var ObjectSpecification = require("./object-specification").ObjectSpecification;

/**
 * Defines the criteria that objects must satisfy to be included in a set of
 * data as well as other characteristics that data must possess.
 *
 * @class
 * @extends external:ObjectSpecification
 */
exports.DataQuery = ObjectSpecification.specialize(/** @lends DataQuery.prototype */ {


    deserializeSelf: {
        value: function (deserializer) {
            var result, value;

            this.super(deserializer)

            value = deserializer.getProperty("orderings");
            if (value !== void 0) {
                this.orderings = value;
            }

            value = deserializer.getProperty("readExpressions");
            if (value !== void 0) {
                this.readExpressions = value;
            }

            value = deserializer.getProperty("selectBindings");
            if (value !== void 0) {
                this.selectBindings = value;
            }

            value = deserializer.getProperty("selectExpression");
            if (value !== void 0) {
                this.selectExpression = value;
            }

            // else {
            //     value = deserializer.getProperty("typeModule");
            //     if (value) {
            //         var self = this;
            //         this.typeModule = value;

            //         result = value.require.async(value.id).then(function (exports) {
            //             self.type = exports.montageObject;
            //             return self;
            //         });
            //     }
            // }

            value = deserializer.getProperty("fetchLimit");
            if (value !== void 0) {
                this.fetchLimit = value;
            }

            value = deserializer.getProperty("hints");
            if (value !== void 0) {
                this.hints = value;
            }


            return result ? Promise.resolve(this) : this;
        }
    },

    serializeSelf: {
        value: function (serializer) {

            this.super(serializer)

            if(this.orderings) {
                serializer.setProperty("orderings", this.orderings);
            }
            if(this.readExpressions) {
                serializer.setProperty("readExpressions", this.readExpressions);
            }
            if(this.selectBindings) {
                serializer.setProperty("selectBindings", this.selectBindings);
            }
            if(this.selectExpression) {
                serializer.setProperty("selectExpression", this.selectExpression);
            }
            if(this.fetchLimit) {
                serializer.setProperty("fetchLimit", this.fetchLimit);
            }
            if(this.hints) {
                serializer.setProperty("hints", this.hints);
            }

            // if (this.typeModule || (this.type && this.type.objectDescriptorInstanceModule)) {
            //     //serializer.setProperty("type", this.type);
            //     //serializer.setProperty("type", this.type, "reference");

            //     serializer.setProperty("typeModule", (this.typeModule || this.type.objectDescriptorInstanceModule));
            // } else {
            //     serializer.setProperty("type", this.type);
            // }

        }
    },

    equals: {
        value: function (otherQuery) {
            /*
                take care of the ones where we can use === first

                not including selectBindings for now, nor selectExpression as we need to see if we'll keep it

            */
            if(
                this.super(otherQuery) &&
                (this.fetchLimit === otherQuery.fetchLimit) &&
                (this.readExpressions && this.readExpressions.equals(otherQuery.readExpressions)) &&
                (this.orderings && this.orderings.equals(otherQuery.orderings)) &&
                (this.hints && this.hints.equals(otherQuery.hints))
            ) {
                return true;
            } else {
                return false;
            }
        }
    },

    /**
     * A property used to carry the identity of the current user issuing the query
     * This is set by the framework based on wethere there's an authenticated user
     * or not. RawDataServices use this to communicate to servers the identity of
     * who is requiring data so it can be evaluated in term of access contol.
     *
     * @type {Identity}
     */
    identity: {
        value: undefined
    },

    /**
     * An array of DataOrdering objects which, combined, define the order
     * desired for the data in the set specified by this query.
     *
     * @type {Array}
     */
    orderings: {
        get: function () {
            /*
                Benoit, could break backward compatibility but it doesn't look like we relied on this. No point creating an empty attay just for checking if orderings have been set on a data query.
            */
            // if (!this._orderings) {
            //     this._orderings = [];
            // }
            return this._orderings;
        },
        set: function (orderings) {
            this._orderings = orderings;
        }
    },

    _orderings: {
        value: undefined
    },

    /**
     * An object defining bindings that will be created on the array
     * of the dataStream returned by DataService's fetchData. The bindings
     * follow the same syntax as used for regular bindings, creating dynamic
     * properties that array. Expressions on the right side starts by data as the
     * source is automatically set to the DataStream used in a fetchData and
     * DataStream's data property is an array containing the results.
     *
     * For example, if one would want the number of objects fetched, one would do:
     *  aDataQuery.selectBindings = {
     *      "count": {"<-": "data.length"}
     * };
     *
     *  aDataQuery.selectBindings = {
     *      "averageAge": {"<-": "data.map{age}.average()"
     * };
     * will add on the array passed to the then function following a fetchData
     * a property averageAge with the average of the property age of all object in the array
     *
     *   aDataQuery.selectBindings = {
     *       "clothingByColor": {"<-": "data.group{color}"
     *   };
     *   mainService.fetchData(aDataQuery).then(function(results){
     *   //assuming  results is [
     *   //     {type: 'shirt', color: 'blue'},
     *   //     {type: 'pants', color: 'red'},
     *   //     {type: 'blazer', color: 'blue'},
     *   //     {type: 'hat', color: 'red'}
     *   // ];
     *
     *   expect(results.clothingByColor).toEqual([
     *           ['blue', [
     *           {type: 'shirt', color: 'blue'},
     *           {type: 'blazer', color: 'blue'}
     *       ]],
     *       ['red', [
     *           {type: 'pants', color: 'red'},
     *           {type: 'hat', color: 'red'}
     *       ]]
     *   ]);
     *  })
     * Since it is a one-way binding, if a DataService is capable of live updating a query,
     * the value these properties created on the array will stay current/updated over time.
     *
     * It is possible that a DataService may obtain the results of these properties from the
     * server itself, which is preferred, as fetchData can returns objects in batches. These
     * expressions should be built from the whole result set, not the current client view of that
     * result set.
     * @type {Object}
     */

    selectBindings: {
        value: undefined
    },

    /**
     * An expression that is used in memory client side to further refine the set objects retrieves.
     * by the query's criteria expression. This useful in cases the origin service doesn't know how to handle such criteria.
     * That shouldn't be exposed to the end developer, but instead, a RawDataService should be able to analyze a query's criteria
     * and split the apsects that can be executed by the origin service automatically, to filter the rest itself.
     * @type {Array}
     */


    selectExpression: {
        value: undefined
    },


    /**
     * An object defining a list of expressions to resolve at the same time as the query.
     * expressions are based on the content of results described by criteria. A common
     * use is to prefetch relationships off fetched objects.
     * @type {Array}
     */

    //fetchExpressions
    //readExpressions
    readExpressions: {
        value: null
    },

   /**
     * A property defining the number of objets to retrieve at once from the result set.
     * @type {Number}
     */

    batchSize: {
        value: null
    },

    _doesBatchResults: {
        value: null
    },

    doesBatchResult: {
        get: function() {
            return this._doesBatchResults || (typeof this.batchSize === "number");
        }
    },
    /**
     * A property defining the maximum number of objets to retrieve.
     * @type {Number}
     *
     * fetchLimit ? matches fetchData API, limit is SQL
     *
     * readLimit ? matches the operation?
     *
     * maximum ...
     */

    fetchLimit: {
        value: null
    },


    /**
     * An object other objects can use to alter or optimize fetch operations.
     * It is used for example to carry an object's originDataSnapshot if present, 
     * or to pass an object's snapshot to provide context needed to a stateless, serverless
     * Mod worker processing DataOperations 
     * @type {Object}
     */

    hints: {
        value: undefined
    },


});
