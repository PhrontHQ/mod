/*
    Cues from

    https://blog.mgechev.com/2014/09/12/binary-tree-iterator-with-es6-generators/

    https://github.com/mgechev/javascript-algorithms/blob/master/src/data-structures/binary-search-tree.js#L65-L72

*/


var Montage = require("./core").Montage,
    parse = require("./frb/parse"),
    stringify = require("./frb/stringify"),
    evaluate = require("./frb/evaluate"),
    operatorTypes = require("./frb/language").operatorTypes,
    Scope = require("./frb/scope"),
    syntaxProperties = require("./frb/syntax-properties"),
    compile = require("./frb/compile-evaluator");



exports.ExpressionIterator = class ExpressionIterator extends Object {

    constructor(value, expression) {
        super();

        if(value) {
            this._value = value;
            this._expression = expression;
            /*
                Initially, during the creation of the iterator, we need to call it because the next method is actually a generator, so by invoking it we return new instance of the generator.
            */
            this._iterator = this._generateNext(this._expression, value);
        }
    }

    static {
        Montage.defineProperties(this.prototype, {

            /**
             * @private
             * @type {object}
             */
            _syntax: {
                value: null,
            },
            _compiledSyntax: {
                value: null,
            },
            __scope: {
                value: null,
            },
            _current: {
                value: null,
            },
        });


    }

    _reset() {
        this._expression = null;
        this._compiledSyntax = null;

        //Reset qualifiedProperties cache
        this._qualifiedProperties = null;

        this._syntax = null;
    }

    /**
     * The parsed expression, a syntactic tree.
     * Now mutable to avoid creating new objects when appropriate
     *
     * @type {object}
     */
    get syntax() {
        return this._syntax || (this._syntax = parse(this._expression));
    }
    set syntax (value) {
        if (value !== this._syntax) {
            //We need to reset:
            this._reset();
            this._syntax = value;
        }
    }
    
    /**
     * The compiled expression, a function, that is used directly for evaluation.
     *
     * @type {function}
     */
    get compiledSyntax() {
        return this._compiledSyntax || (this._compiledSyntax = compile(this.syntax));
    }

    get _scope() {
        return this.__scope || (this.__scope = new Scope());
    }

    evaluateExpression (value) {
        this._scope.value = value;
        return this.compiledSyntax(this._scope);
    }

    next(expression) {
        return this._iterator.next(expression);
    }

    * _generateNext(expression) {
        var localType;

        if (!this._current) {
            this._current = this._value;
        }

        if (this._current === null) {
            return;
        }

        

        /*
            We may want to make that configurable, but it makes sense to start by
            what we were given by default
        */
        if (this._current === this._value) {
            yield this._current;
        } 

        while (this._current) {
            if(expression && expression !== this._expression) {
                //Less optimized path
                this._current = evaluate(expression, this._current);
            } else {
                this._current = this.evaluateExpression(this._current);
            }
            yield this._current;
        }
   
    }

}