var Montage = require("../../core/core").Montage,
    Enum = require("../../core/enum").Enum,
    ASCENDING = {name: "Ascending"},
    DESCENDING = {name: "Descending"},
    // parse = require("core/frb/parse"),
    // compile = require("core/frb/compile-evaluator"),
    evaluate = require("core/frb/evaluate");
    // Scope = require("core/frb/scope");



 //OrderingRule
 
 
/*
 * var syntax = parse("a.b");
 * var array = [
 *         {foo: "A", bar: "2"}, {foo: "A", bar: "1"}, {foo: "C", bar: "5"},
 *         {foo: "D", bar: "3"}, {foo: "B", bar: "2"}, {foo: "B", bar: "4"},
 *         {foo: "F", bar: "1"}, {foo: "G", bar: "2"}, {foo: "E", bar: "4"}
 *     ];
 * var sortExpression = "foo";
 * var evaluatedSortExpression = compile(parse("sorted{foo}"));
 * var evaluatedDoubleSortExpression = compile(parse("sorted{foo+bar}"));
 * var evaluatedInvertedSortExpression = compile(parse("sorted{foo}.reversed()"));
 * var evaluatedSyntax = compile(syntax);
 * var c = evaluatedSyntax(new Scope({a: {b: 10}}));
 * var sortedArray = evaluatedSortExpression(new Scope(array));
 * var inverseSortedArray = evaluatedInvertedSortExpression(new Scope(array));
 * var doubleSortedArray = evaluatedDoubleSortExpression(new Scope(array));
 */


//OrderingDirection
var orderingDirections = [
    "Ascending",
    "Descending"
];
exports.OrderingDirection = OrderingDirection = new Enum().initWithMembersAndValues(orderingDirections,orderingDirections);
//Backward compatibility:
exports.OrderType = OrderingDirection;

/**
 * @class
 * @extends external:Montage
 */
exports.OrderingRule = Montage.specialize(/** @lends OrderingRule.prototype */ {

    /**
     * An expression to be applied to objects in a set to yield a value
     * according to which those objects will be sorted.
     *
     * @type {String}
     */
    expression: {
        value: undefined
    },

    /**
     * Whether objects to be sorted will be sorted with the
     * [expression's]{@link OrderingRule#expression} value
     * [ascending]{@link OrderingRule.ASCENDING} or
     * [descending]{@link OrderingRule.DESCENDING}.
     *
     * @type {String}
     */
    order: {
        get: function() {
            return this.orderingDirection;
        },
        set: function(value) {
            this.orderingDirection = value;
        }
    },
    orderingDirection: {
        value: ASCENDING
    }

}, {

    /**
     * Backward Compatibility
     * @xpression's]{@link OrderingRule#expression} value
     * [ascending]{@link OrderingRule.ASCENDING} or
     * [descending]{@link OrderingRule.DESCENDING}.
     *
     * @type {OrderingRule}
     */
    withExpressionAndOrderingDirection: {
        value: function (expression, orderingDirection) {
            var orderingRule = new this();
            orderingRule.expression = expression;
            orderingRule.orderingDirection = orderingDirection;
            return orderingRule;
        }
    },

    /**
     * Backward Compatibility
     * [expression's]{@link OrderingRule#expression} value
     * [ascending]{@link OrderingRule.ASCENDING} or
     * [descending]{@link OrderingRule.DESCENDING}.
     *
     * @type {OrderingRule}
     */
    withExpressionAndOrder: {
        value: function (expression, order) {
            return this.withExpressionAndOrderingDirection(expression, order);
        }
    },

    Ascending: {
        value: OrderType.Ascending
    },

    Descending: {
        value: OrderType.Descending
    },

    ASCENDING: {
        value: ASCENDING
    },

    DESCENDING: {
        value: DESCENDING
    }

});

if(!Array.prototype.sortedArrayWithOrderingRules) {

    let sortedArrayWithOrderingRules = function(orderingRules) {
            var expression = "";
            //Build combined expression
            for (var i=0,iOrderingRule, iExpression;(iOrderingRule = orderingRules[i]);i++) {
                iExpression = iOrderingRule.expression;
        
                expression += `${expression.length ? "." : ""}sorted{${iExpression}}${iOrderingRule.order === DESCENDING ? ".reversed()" : ""}`;
        
                // if (expression.length) {
                //     expression += ".";
                // }
        
                // expression += "sorted{";
                // expression += iExpression;
                // expression += "}";
        
                // if (iOrderingRule.order === DESCENDING) {
                //     expression += ".reversed()";
                // }
            }
            return evaluate(expression, this);
        };

    Object.defineProperty(Array.prototype, "sortedArrayWithOrderingRules", {
        value: sortedArrayWithOrderingRules
    });

    Object.defineProperty(Array.prototype, "sortedArrayWithDataOrderings", {
    value: sortedArrayWithOrderingRules
    });
   
}