const Montage = require("core/core").Montage,
    ExpressionDataMapping = require("./expression-data-mapping").ExpressionDataMapping,
    RawForeignValueToObjectConverter = require("../converter/raw-foreign-value-to-object-converter").RawForeignValueToObjectConverter,
    SyntaxInOrderIterator = require("core/frb/syntax-iterator").SyntaxInOrderIterator,
    Criteria = require("core/criteria").Criteria,
    parse = require("core/frb/parse"),
    compile = require("core/frb/compile-evaluator"),
    assign = require("core/frb/assign"),
    Scope = require("core/frb/scope");

/**
 * Extends ExpressionDataMapping to add the ability to map a DataOperatin to an HTTP Request
 * 
 *      https://developer.mozilla.org/en-US/docs/Web/API/Request
 * 
 * inclusing Headers
 * 
 *      https://developer.mozilla.org/en-US/docs/Web/API/Headers
 * 
 * As well as map the HTTP Response 
 * 
 *      https://developer.mozilla.org/en-US/docs/Web/API/Response
 * 
 * to the array that will be used by the Raw Data Service as rawData in object mapping
 * 
 * @class FetchResourceDataMapping
 * @extends ExpressionDataMapping
 */
exports.FetchResourceDataMapping = class FetchResourceDataMapping extends ExpressionDataMapping {

    static {

        Montage.defineProperties(this.prototype, {
            _xWwwFormUrlencodedType: {value: 'application/x-www-form-urlencoded'},
            _formData: {value: "form-data"},

            /**
             * Provides a reference to the Montage event manager used in the
             * application.
             *
             * @property {EventManager} value
             * @default defaultEventManager
             */
            fetchRequestMappingByOperationType: {value: undefined, serializable: true},

            /**
             * Whether or not this target can accept user focus and become the
             * activeTarget This matches up with the `document.activeElement` property
             * purpose-wise; Events from components that should be dispatched as
             * logically occurring at the point of user focus should be dispatched at
             * the activeTarget
             *
             * By default a target does not accept this responsibility.
             *
             * @type {boolean}
             * @default false
             */
            fetchResponseMapping: {value: undefined, serializable: true}
        });

    }

    /*
        "fetchRequestMappingByCriteria": {"@":"fetchRequestMappingByCriteria"},
        "fetchResponseMapping": {
    */

    deserializeSelf(deserializer) {

        super.deserializeSelf(deserializer);

        this.fetchRequestMappingByOperationType = deserializer.getProperty("fetchRequestMappingByOperationType");
        this.fetchResponseRawDataMappingExpressionByCriteria = deserializer.getProperty("fetchResponseRawDataMappingExpressionByCriteria");

    }


    _buildFetchRequestMappingRulesFromRawRules(rawRules) {
        let targetExpressions = rawRules ? Object.keys(rawRules) : null,
            rules = [];

        if(this.objectDescriptor && targetExpressions && targetExpressions.length) {
            for (let i = 0, iTargetExpression, iRawRule, iRule; (iTargetExpression = targetExpressions[i]); ++i) {
                iRawRule = rawRules[iTargetExpression];
                iRule = this.makeRuleFromRawRule(iRawRule, iTargetExpression, true, true);
                rules.push(iRule);
            } 
        }

        return rules;
    }

    /*
    _mapObjectMappingRules: {
        value: function (rawRules) {
            var propertyNames = rawRules ? Object.keys(rawRules) : null,
                objectMappingRules = this.objectMappingRules, rawDataMappingRules = this.rawDataMappingRules,
                propertyName, i;

            //TODO Add path change listener for objectDescriptor to
            //account for chance that objectDescriptor is added after the rules
            if (this.objectDescriptor && propertyNames) {
                for (i = 0; (propertyName = propertyNames[i]); ++i) {
                    this._mapObjectMappingRuleForPropertyName(rawRules[propertyName], propertyName, objectMappingRules, rawDataMappingRules);
                }
            }
        }
    },
    */

    _mapDataOperationToFetchRequestWithMappingRulesWithScope(dataOperation, fetchRequests, fetchRequestMappingRules, dataOperationScope) {
        let j, jRule, jRuleEvaluationResult, iUrl, options, iRequest;

        for(j=0;(jRule = fetchRequestMappingRules[j]); j++) {

            jRuleEvaluationResult = jRule.evaluate(dataOperationScope);
            if(jRule.targetPath === "url") {
                iUrl = jRuleEvaluationResult;
            } else {
                assign( (options || (options = {})), jRule.targetPath, jRuleEvaluationResult, undefined /*parameters*/, undefined /*document*/, undefined /*components*/);
            }
        }

        //Turn a JSON body to form if needed
        if(options?.method == "POST" && typeof options?.body === "object") {
            let headers = options?.headers,
                contentType = headers && (headers["content-type"] || headers["Content-Type"]);
            if(contentType === this._xWwwFormUrlencodedType) {
                options.body = new URLSearchParams(options.body);
            } else if(contentType?.includes(this._formData)) {
                let formData = new FormData(),
                body = options.body,
                bodyKeys = Object.keys(body);

                for(let i=0, countI = bodyKeys.length; (i < countI); i++) {
                    formData.append(bodyKeys[i], body[bodyKeys[i]]);
                }
                options.body = formData;
            }
        }

        if(!iUrl) {
            throw new Error("mapDataOperationToFetchRequests: no url found for dataOperation: ",+dataOperation, " and criteria: "+dataOperation.criteria);
        } else {
            iRequest = new Request(iUrl, options);
            //console.debug("Request "+iUrl+" with  options: "+ JSON.stringify(options));
            (fetchRequests || (fetchRequests = [])).push(iRequest);
        }

    }

    _criteriaFromOrCombinedSyntaxAndCombinedParameters(syntax, combinedParameters) {

        /*
            {
                "type":"equals",
                "args":[
                    {
                        "type":"property",
                        "args":[
                            {
                                "type": "value"
                            },
                            {
                                "type":"literal",
                                "value":"factoryId"
                            }
                        ]
                    },
                    {
                        "type":"parameters"
                    }
                ]
            }
        */

        let _syntax = structuredClone(syntax),
            parameterArg = _syntax.args[0].args[0].type == "parameters"
            ? _syntax.args[0].args
            : _syntax.args[0].args[1].type == "parameters"
                ? _syntax.args[0].args
                : _syntax.args[1].args[0].type == "parameters"
                    ? _syntax.args[1].args
                    : _syntax.args[1].args[1].type == "parameters"
                        ? _syntax.args[1].args
                        : null;

        if(parameterArg) {
            let parameterKey = parameterArg[1].value,
                parameters = combinedParameters[parameterKey];
            console.log("parameterArg: ",parameterArg);

            parameterArg.pop();
            let criteria = new Criteria().initWithSyntax(_syntax, parameters);
            return criteria;
        } else {
            return null;
        }
    
    }

    /**
     * Returns fetchRequestDescriptor conforming to the options object of a Request constructot .
     * used in the Fetch API - 
     * TODO: overrides to false as we should have that done by SQL
     * when correct mapping from orderings to ORDER BY clause is done
     *
     * @public
     * @argument {DataStream} dataStream
     */
    mapDataOperationToFetchRequests (dataOperation, fetchRequests) {

        /*
            First, loop on on criterias and evalutate dataOperation for each.

            The dataOperation could be matching multiple criteria, which will mean multiple reuests to send
            in order to fulfill the dataOperation
        */
        let fetchRequestMappingByCriteria;
        
       if(fetchRequestMappingByCriteria = this.fetchRequestMappingByOperationType?.get(dataOperation.type)) {
            let criteriaIterator = fetchRequestMappingByCriteria.keys(),
                dataOperationScope = this._scope.nest(dataOperation),
                iCriteria;


            while ((iCriteria = criteriaIterator.next().value)) {

                if(iCriteria.evaluate(dataOperation)) {
                    //We have a match, we need to evaluate the rules to 
                    let fetchRequestMappingRules = fetchRequestMappingByCriteria.get(iCriteria),
                        j, jRule, jRuleEvaluationResult, iUrl, options, iRequest;

                    /*
                        Current serialization is an object to simplify manual authoring, 
                        but our API should be an array of mapping rules. So if we don't
                        have an array, we do the work
                    */
                    if(!Array.isArray(fetchRequestMappingRules)) {
                        fetchRequestMappingByCriteria.set(iCriteria, (fetchRequestMappingRules = this._buildFetchRequestMappingRulesFromRawRules(fetchRequestMappingRules)))
                    }

                    if(dataOperation.criteria?.name === RawForeignValueToObjectConverter.RawForeignValueToObjectConverterCombinedCriteria) {

                        var iterator = new SyntaxInOrderIterator(dataOperation.criteria.syntax, "or"),
                            originalCriteria = dataOperation.criteria,
                            currentCriteria,
                            combinedParameters = originalCriteria.parameters,
                            parentSyntax, currentSyntax, firstArgSyntax, secondArgSyntax,
                            localeSyntax;
                            while ((currentSyntax = iterator.next("or").value)) {
                                firstArgSyntax = currentSyntax.args[0];
                                secondArgSyntax = currentSyntax.args[1];

                                if(firstArgSyntax.type !== "or") {
                                    currentCriteria = this._criteriaFromOrCombinedSyntaxAndCombinedParameters(firstArgSyntax, combinedParameters);
                                    //Temporarily changing the criteria to do what we need
                                    dataOperation.criteria = currentCriteria;
                                    this._mapDataOperationToFetchRequestWithMappingRulesWithScope(dataOperation, fetchRequests, fetchRequestMappingRules, dataOperationScope);    
                                }

                                if(secondArgSyntax.type !== "or") {
                                    currentCriteria = this._criteriaFromOrCombinedSyntaxAndCombinedParameters(secondArgSyntax, combinedParameters);
                                    //Temporarily changing the criteria to do what we need
                                    dataOperation.criteria = currentCriteria;
                                    this._mapDataOperationToFetchRequestWithMappingRulesWithScope(dataOperation, fetchRequests, fetchRequestMappingRules, dataOperationScope);
                                }
                            }
        

                            //Reseting to what it should be:
                            dataOperation.criteria = originalCriteria;


                    } else {
                        this._mapDataOperationToFetchRequestWithMappingRulesWithScope(dataOperation, fetchRequests, fetchRequestMappingRules, dataOperationScope);
                    }

                    
                    // for(j=0;(jRule = fetchRequestMappingRules[j]); j++) {

                    //     jRuleEvaluationResult = jRule.evaluate(dataOperationScope);
                    //     if(jRule.targetPath === "url") {
                    //         iUrl = jRuleEvaluationResult;
                    //     } else {
                    //         assign( (options || (options = {})), jRule.targetPath, jRuleEvaluationResult, undefined /*parameters*/, undefined /*document*/, undefined /*components*/);
                    //     }
                    // }

                    // //Turn a JSON body to form if needed
                    // if(options?.method == "POST" && typeof options?.body === "object") {
                    //     let headers = options?.headers,
                    //         contentType = headers && (headers["content-type"] || headers["Content-Type"]);
                    //     if(contentType === this._xWwwFormUrlencodedType) {
                    //         options.body = new URLSearchParams(options.body);
                    //     } else if(contentType?.includes(this._formData)) {
                    //         let formData = new FormData(),
                    //         body = options.body,
                    //         bodyKeys = Object.keys(body);

                    //         for(let i=0, countI = bodyKeys.length; (i < countI); i++) {
                    //             formData.append(bodyKeys[i], body[bodyKeys[i]]);
                    //         }
                    //         options.body = formData;
                    //     }
                    // }

                    // if(!iUrl) {
                    //     throw new Error("mapDataOperationToFetchRequests: no url found for dataOperation: ",+dataOperation, " and criteria: "+iCriteria);
                    // } else {
                    //     iRequest = new Request(iUrl, options);
                    //     //console.debug("Request "+iUrl+" with  options: "+ JSON.stringify(options));
                    //     (fetchRequests || (fetchRequests = [])).push(iRequest);
                    // }


                }
            }
        }

        return fetchRequests;
    }

    fetchResponseRawDataMappingFunctionForCriteria(aCriteria) {
        let value = this.fetchResponseRawDataMappingExpressionByCriteria.get(aCriteria);

        if(!value) {
            throw new Error("No Fetch Response Mapping found for Criteria: "+ aCriteria);
        }

        if(typeof value !== "function") {
            //We parse and compile the expression so we can evaluate it:
            try {
                value = compile(parse(value));
            } catch(compileError) {
                throw new Error("Fetch Response Mapping Expression Compile error: "+ compileError+", for Criteria: "+ aCriteria);
            }

            this.fetchResponseRawDataMappingExpressionByCriteria.set(aCriteria, value);
        }

        return value;
    }

    /**
     * This method allows to reshape the data returned by an API into an array of identically shaped
     * objects, which is what mod data expects
     *
     * @method
     * @argument {Object}fetchResponse
     *                      JSON content of the response
     * @argument {Array}rawData
     *                     The array where rawData is expected.
     *
     * @returns undefined
     *
     */
    mapFetchResponseToRawData(fetchResponse, rawData) {

        /*
            We need to find the criteria that led us to the current response:

            fetchResponse -> fetchRequest -> criteria -> response mapping
        */

            let criteriaIterator = this.fetchResponseRawDataMappingExpressionByCriteria.keys(),
                fetchResponseScope = this._scope.nest(fetchResponse),
                iCriteria;

        while ((iCriteria = criteriaIterator.next().value)) {

            if(iCriteria.evaluate(fetchResponse)) {
                //We have a match, we need to evaluate the rules to 
                let fetchResponseRawDataMappingFunction = this.fetchResponseRawDataMappingFunctionForCriteria(iCriteria),
                    result = fetchResponseRawDataMappingFunction(fetchResponseScope);

                if(result) {
                    Array.isArray(result) 
                        ? rawData.push(...result)
                        : rawData.push(result);
                }
            }
        }
    }
    
}