var RawValueToObjectConverter = require("./raw-value-to-object-converter").RawValueToObjectConverter,
    Promise = require("../../core/promise").Promise,
    assign = require("core/frb/assign");
;
/**
 * @class RawHierarchyToObjectConverter
 * @classdesc Converts a property value of raw data to the referenced object.
 * @extends RawValueToObjectConverter
 */
exports.RawHierarchyToObjectConverter = RawValueToObjectConverter.specialize( /** @lends RawEmbeddedValueToObjectConverter# */ {

    /*********************************************************************
     * Serialization
     */

    serializeSelf: {
        value: function (serializer) {

            this.super(serializer);
    
            serializer.setProperty("hierarchyExpression", this.hierarchyExpression);    
        }
    },

    deserializeSelf: {
        value: function (deserializer) {

            this.super(deserializer);
    
            value = deserializer.getProperty("hierarchyExpression");
            if (value) {
                this.hierarchyExpression = value;
            }
        }
    },
    
    /*********************************************************************
     * Properties
     */


    /*********************************************************************
     * Public API
     */
    
    initWithHierarchyExpression: {
        value: function (expression) {
            this.hierarchyExpression = expression;
            return this;
        }
    },

    /**
     * This is a unique clientId (per tab), that's given by the backend to the
     * client's OperationService. This clientId needs then to be passed per
     * operation to allow the server side to leverage it
     *
     * @type {Array<FRB Expressions>}
     */

    hierarchyExpression: {
        value: undefined
    },


    /**
     * Converts an array of raw data that are the raw data of ancestors of an object. 
     * Returns the value converted to object of the first, which is the "parent" of the object being mapped, 
     * and loop on the rest of the array to create those objects and assign them as "parent" of the previous
     * one using the expression at the corresponding index in the "hierarchyExpression" property
     * @param {Property} v The value to format.
     * @returns {Promise} A promise for the referenced object.  The promise is
     * fulfilled after the object is successfully fetched.
     */
    convert: {
        value: function (v) {
            var self = this,
                convertedValue,
                result;

            /*
                besides returning a default value, or a shared "Missing value" singleton, a feature we don't have, there's not much we can do here:
            */
            if(v === null) {
                return Promise.resolveNull;
            } else if( v === undefined) {
                return Promise.resolveUndefined;
            } else return Promise.all([this._descriptorToFetch, this.service]).then(function (values) {
                var typeToFetch = values[0],
                    returnedValue,
                    service = values[1];

                if(Array.isArray(v)) {
                    if(v.length) {
                        let hierarchyExpression = self.hierarchyExpression;
                        for(var i=0, countI=v.length, promises, iExpression, previousResult;(i<countI);i++) {
                            iExpression = hierarchyExpression[i-1];
                            previousResult = result;
                            result =  self._convertOneValue(v[i], typeToFetch, service, iExpression, i, previousResult);

                            if(i == 0) {
                                returnedValue = result;
                            }

                            if (Promise.is(result)) {
                                (promises || (promises = [])).push(result);
                            }
                        }
                        return Promise.all(promises).then(function() {
                            return returnedValue;
                        });
                    }
                    else {
                        return Promise.resolve(v);
                    }
                }
                else {
                    if(v) {
                        return self._convertOneValue(v, typeToFetch, service);
                    }
                }
            });
        }
    },

    _convertOneValue:  {
        value: function (v, typeToFetch, service, hierarchyExpression, index, previousResult) {
            let valueObjectDescriptor = this.foreignDescriptorForValue(v);

            var result = service.resolveObjectForTypeRawData(valueObjectDescriptor || typeToFetch, v);

            if (result) {
                result = Promise.all([previousResult, result])
                    .then( (allResults) => {
                        let previousDataObject = allResults[0],
                            dataObject = allResults[1];

                        if(previousDataObject) {
                            /* Stitch hierarchy as instructed */
                            assign(previousDataObject, hierarchyExpression, dataObject);
                        }

                        return dataObject;
                    });
            }
            else  {
                result = Promise.resolve();
            }
            return result;
        }
    },

    /**
     * Reverts the relationship back to raw data.
     * @function
     * @param {Scope} v The value to revert.
     * @returns {string} v
     */
    revert: {
        value: function (v) {

            throw "RawHierarchyToObjectConverter revert() is not implemented"

            var self = this;

            if(!v) {
                return v;
            } else {
                return Promise.all([this._descriptorToFetch, this.service]).then(function (values) {
                    var revertedValue,
                    result,
                    revertedValuePromise;


                    var objectDescriptor = values[0],
                        service = values[1];

                    if(Array.isArray(v)) {
                        if(v.length) {
                            revertedValue = [];
                            for(var i=0, countI=v.length, promises;(i<countI);i++) {
                                result =  self._revertOneValue(v[i],objectDescriptor, service, revertedValue, i);
                                if (Promise.is(result)) {
                                    (promises || (promises = [])).push(result);
                                }
                            }
                            revertedValuePromise =  Promise.all(promises).then(function() {
                                return revertedValue;
                            });
                        }
                        else {
                            revertedValuePromise = Promise.resolve(v);
                        }
                    }
                    else {
                        if(v) {
                            revertedValuePromise = self._revertOneValue(v,objectDescriptor, service);
                        }
                    }

                    if (self.compiledRevertSyntax) {
                        if (Promise.is(revertedValuePromise)) {
                            return revertedValuePromise.then(function(value) {
                                return self._revertValueWithExpression(value);
                            });
                        } else {
                            return self._revertValueWithExpression(revertedValuePromise);
                        }
                    } else {
                        return revertedValuePromise;
                    }
                });
            }
        }
    },

    _revertValueWithExpression: {
        value: function(value) {
            var scope = this.scope;
            //Parameter is what is accessed as $ in expressions
            scope.value = value;
            return Promise.resolve(this.compiledRevertSyntax(scope));
        }
    },

    _revertOneValue:  {
        value: function (v, objectDescriptor, service, valueArray, index) {
            var record = {},
                mapResult = service._mapObjectToRawData(v, record);

            if (Promise.is(mapResult)) {
                return mapResult.then(function(rawData) {
                    if(valueArray) {
                        valueArray[index] = record;
                    }
                    return record;
                });
            } else {
                if(valueArray) {
                    valueArray[index] = record;
                }
                return record;
            }
        }
    }

});
