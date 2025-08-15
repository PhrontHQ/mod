/**
    Defines extensions to intrinsic `Object`.
    @see {external:Object}
    @module mod/core/extras/object
*/

/**
 * Returns the descriptor object for an object's property.
 * @param {Object} anObject The object containing the property.
 * @param {string} propertyName The name of the property.
 * @returns {Object} The object's property descriptor.
 * @function external:Object.getPropertyDescriptor
*/
Object.defineProperty(Object, "getPropertyDescriptor", {
    value: function (anObject, propertyName) {
        var current = anObject,
            currentDescriptor;

        do {
            currentDescriptor = Object.getOwnPropertyDescriptor(current, propertyName);
        } while (!currentDescriptor && (current = current.__proto__ || Object.getPrototypeOf(current)));

        return currentDescriptor;
    },
    writable: true,
    configurable: true
});

/**
 * Returns the prototype object and property descriptor for a property
 * belonging to an object.
 * @param {Object} anObject The object to return the prototype for.
 * @param {string} propertyName The name of the property.
 * @returns {Object} An object containing two properties named `prototype` and
 * `propertyDescriptor` that contain the object's prototype object and property
 * descriptor, respectively.  @function
 * external:Object.getPrototypeAndDescriptorDefiningProperty
 */
Object.defineProperty(Object, "getPrototypeAndDescriptorDefiningProperty", {
    value: function (anObject, propertyName) {
        var current = anObject,
            currentDescriptor;
        if (propertyName) {

            do {
                currentDescriptor = Object.getOwnPropertyDescriptor(current, propertyName);
            } while (!currentDescriptor && (current = current.__proto__ || Object.getPrototypeOf(current)));

            return {
                prototype: current,
                propertyDescriptor: currentDescriptor
            };
        }
    },
    writable: true,
    configurable: true
});

/**
 * Removes all properties owned by this object making the object suitable for
 * reuse.
 *
 * @function external:Object#clear
 * @returns this
 */
Object.defineProperty(Object.prototype, "clear", {
    value: function () {
        var keys = Object.keys(this),
            i = keys.length;

        while (i) {
            i--;
            delete this[keys[i]];
        }

        return this;
    },
    writable: true,
    configurable: true
});

if (Object.hasOwnProperty('deleteBinding') === false) {
    Object.defineProperty(Object, "deleteBinding", {
        value: function (target, targetPath) {
            var Bindings = require("core/frb/bindings");
            Bindings.cancelBinding(target, targetPath);
        },
        writable: true,
        configurable: true
    });
}

if (Object.hasOwnProperty('deepFreeze') === false) {
    Object.defineProperty(Object, "deepFreeze", {
        value: function (object) {
            var propertyNames = Object.getOwnPropertyNames(object),
                property;

            for (var i = 0, length = propertyNames.length; i < length; i++) {
                if ((property = object[propertyNames[i]]) !== null &&
                    typeof property === 'object'
                ) {
                    Object.deepFreeze(property);
                }
            }

            return Object.freeze(object);
        },
        writable: true,
        configurable: true
    });
}

if (Object.prototype.hasOwnProperty('isEmpty') === false) {
    Object.defineProperty(Object.prototype, "isEmpty", {
        get: function () {
            for(let prop in this) return false;
            return true;
        },
        configurable: true,
        enumerable: false
    });
}

if (typeof Object.isObject === "undefined") {
    /**
     * Object.isObject() - General plain object check with optional strict mode
     *
     * Determines whether the passed value is an object, with two modes of checking:
     * - Default mode: Returns true for any non-null object (including arrays, dates, etc.)
     * - Strict mode: Returns true only for plain objects using toString() method
     *
     * In strict mode, this matches objects created with {}, new Object(),
     * Object.create(Object.prototype), and similar plain object patterns.
     *
     * @function external:Object.isObject
     * @param {*} value - The value to test. Can be any JavaScript value.
     * @param {boolean} [strict=false] - If true, performs strict plain object check using toString()
     * @returns {boolean} Returns `true` if the value passes the object check, `false` otherwise
     *
     * @example
     * // Default mode - any non-null object
     * Object.isObject({});                           // true
     * Object.isObject([]);                           // true
     * Object.isObject(new Date());                   // true
     * Object.isObject(null);                         // false
     * Object.isObject("string");                     // false
     *
     * @example
     * // Strict mode - plain objects only
     * Object.isObject({}, true);                     // true
     * Object.isObject(new Object(), true);           // true
     * Object.isObject(Object.create(Object.prototype), true); // true
     * Object.isObject([], true);                     // false
     * Object.isObject(new Date(), true);             // false
     * Object.isObject(null, true);                   // false
     */
    Object.isObject = function (value, strict = false) {
        if (value === null || typeof value !== "object") return false;

        if (strict) {
            return Object.prototype.toString.call(value) === "[object Object]";
        }

        return true;
    };
}
