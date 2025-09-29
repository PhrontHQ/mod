/**
 * Defines extensions to intrinsic `Function` object.
 * @see {external:Function}
 * @module mod/core/extras/function
 */

/**
 * @external Function
 */

require("./object");

/**
 *  A utility to reduce unnecessary allocations of `function (x) {return x}` in
 *  its many colorful but ultimately wasteful parameter name variations.
 *
 *  @function external:Function.identity
 *  @param {Any} any value
 *  @returns {Any} that value
*/
Object.defineProperty(Function, "identity", {
    value: function (x) {
        return x;
    },
    writable: true,
    configurable: true
});

/**
 * A utility to reduce unnecessary allocations of `function () {}`
 * in its many colorful variations.  It does nothing and thus makes a suitable
 * default in some circumstances.
 *
 * @function external:Function.noop
 */
Object.defineProperty(Function, "noop", {
    value: function () {
    },
    writable: true,
    configurable: true
});

/**
 * A utility for creating a comparator function for a particular aspect of a
 * figurative class of objects.
 *
 * @function external:Function.by
 * @param {Function} relation A function that accepts a value and returns a
 * corresponding value to use as a representative when sorting that object.
 * @param {Function} compare an alternate comparator for comparing the
 * represented values.  The default is `Object.compare`, which
 * does a deep, type-sensitive, polymorphic comparison.
 * @returns {Function} a comparator that has been annotated with
 * `by` and `compare` properties so
 * `Array#sorted` can perform a transform that reduces the need to
 * call `by` on each sorted object to just once.
*/
Object.defineProperty(Function, "by", {
    value: function (by, compare) {
        compare = compare || Object.compare;
        by = by || Function.identity;
        var compareBy = function (a, b) {
            return compare(by(a), by(b));
        };
        compareBy.compare = compare;
        compareBy.by = by;
        return compareBy;
    },
    writable: true,
    configurable: true
});

Object.defineProperty(Function.prototype, "isClass", {
    get: function () {
        return this.toString().startsWith("class");
    },
    configurable: true
});


if (typeof Function.isFunction === "undefined") {
    /**
     * Function.isFunction() - Determines if a value is a function
     *
     * Adds a static method to the Function constructor that determines whether the passed
     * value is a function. This method provides functionality similar to `Array.isArray()`
     * but specifically for function types.
     *
     * This method detects all types of functions including regular functions, arrow functions,
     * async functions, generator functions, class constructors, and built-in functions.
     *
     * Only adds the method if it doesn't already exist, ensuring
     * compatibility with environments that may implement this method natively in the future.
     *
     * @function external:Function.isFunction
     * @param {*} value - The value to test. Can be any JavaScript value.
     * @returns {boolean} Returns `true` if the value is any type of function
     */
    Function.isFunction = function (value) {
        return typeof value === "function";
    };
}
