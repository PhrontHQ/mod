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
        }
    }

    static {
        Montage.defineProperties(this.prototype, {

            /**
             * @private
             * @type {object}
             */
            __iterator: {
                value: null,
            },
            _expression: {
                value: null,
            },
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

    /**
     * Serializes the ExpressionIterator's properties using the provided serializer.
     * @param {Serializer} serializer - The serializer instance.
     */
    serializeSelf(serializer) {
        super.serializeSelf(serializer);
        serializer.setProperty("expression", this.expression);
    }

    /**
     * Deserializes the ExpressionIterator's properties using the provided deserializer.
     * @param {Deserializer} deserializer - The deserializer instance.
     */
    deserializeSelf(deserializer) {
        this.expression = deserializer.getProperty("expression");
    }


    /* 
     * Borrowed from Iterator.from() static method
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/from
     *
     * Allows a configured instance to iterate over a specific value
     * @param {Iterable} value - An objec to iterate on.
     * @return {this}
     */
    from(value) {
        this._value = value;
        return this;
    }

    get _iterator() {
        return this.__iterator || (this.__iterator = this._generateNext(this._expression));
    }

    /**
     * TEST ME - to see if expression were changed while
     * iteration is happening if it does the right thing
     *
     * @type {object}
     */
    _reset() {
        this._expression = null;
        this._compiledSyntax = null;

        //Reset qualifiedProperties cache
        this._qualifiedProperties = null;

        this._syntax = null;
    }

    get expression() {
        return this._expression;
    }
    set expression (value) {
        if (value !== this._expression) {
            //We need to reset:
            this._reset();
            this._expression= value;
        }
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

            /* 
                To have the yiels return {value:..., done: true}, 
                the last yield needs to be the one to cary 
                the last actual value, done: will be false 
                the function needs to end without a yield 
                then {value:undefined, done: true} is returned by next()
            */
            if(this._current) {
                yield this._current;
            }
        }
    }
}