/*

    FlatArray Draft:

    A class that can let you put arrays inside another, along with inlined values, 
    that treats the whole thing as one classical array from the outside.

    First use: in EventManager, a native event's composedPath() understandably contains DOM elements up to Window
    EventManager's _eventPathForDomTarget() adds the application and eventually  the application's delegate.
    By putting the native event's composedPath() array in a FlatArray, adding to it what Mod does, 
    we can elegantly use both with better performance.
*/


class FlatArray extends Array {
  constructor(...args) {
    super(...args);
    return new Proxy(this, {
      get(target, prop, receiver) {
        // Handle standard array methods to guarantee they return flattened results
        if (typeof prop === 'string' && !isNaN(prop)) {
          const index = Number(prop);
          const flatMap = target.flat(Infinity);
          return flatMap[index];
        }

        const value = Reflect.get(target, prop, receiver);

        // Bind standard array methods to the flattened version of the array
        if (typeof value === 'function') {
          return function (...args) {
            const flatTarget = target.flat(Infinity);
            // Methods that mutate (like push) should still act on the raw data
            if (['push', 'unshift', 'splice'].includes(prop)) {
              return target[prop](...args);
            }
            // Bind read-only and iterative methods to our flattened array view
            return value.apply(flatTarget, args);
          };
        }

        // Intercept length to match the combined total of all nested elements
        if (prop === 'length') {
          return target.flat(Infinity).length;
        }

        return value;
      }
    });
  }
}

// Usage
const myNestedArray = new FlatArray([1, 2], [3, 4], 5, [[6, 7], 8]);

console.log(myNestedArray.length); 
// Output: 8

console.log(myNestedArray[3]); 
// Output: 4

console.log(myNestedArray.map(x => x * 2)); 
// Output: [2, 4, 6, 8, 10, 12, 14, 16]
