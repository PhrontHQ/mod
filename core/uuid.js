/* <notice>
 Code from node-uuid: https://github.com/broofa/node-uuid/raw/master/uuid.js
 MIT license https://github.com/broofa/node-uuid/blob/master/LICENSE.md
 </notice> */

/**
 * @module mod/core/uuid
*/





/**
 * @class Uuid
 * @extends Montage
 */
var Montage = require("./core").Montage,
    CHARS = '0123456789ABCDEF'.split(''),
    PROTO = "__proto__",
    VALUE = "value",
    FORMAT = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.split('');


/*
    Adapted from https://github.com/ungap/random-uuid/blob/main/index.js
*/

var crypto = global.crypto;
if (typeof crypto === 'undefined') {
    if(typeof process === 'object') {
    /*
        In node, we're getting here first with node's native require from requiring montage itself,
        and we're gettimg there a second time from mr, but as of this writing, mr fails to resolve "crypro" as a node module as it doesn't know a package named that, and clearly it doesn't try as it should to defer to native require to do so as it should (or find it itself...)

        So caching it on global allows us to avoid that for now.

        Adding () around require fools mr into not trying to parse that as a dependency on the client
    */
        global.crypto = crypto = global.crypto || (require) ('crypto');

        if (!('randomUUID' in crypto)) {

            var randomBytes = crypto.randomBytes;
            /**
             * A "phonyfill" for `getRandomValues`.
             * It's is like a polyfill but **does not conform to the WebCrypto specification!**.
             * Unlike a the [polyfill](./node-polyfill.js), this implementation is faster as it avoids copying data.
             *
             * Specifically, the provided typed array is not filled with random values, nor is it returned form the function.
             * Instead a new typed array of the same type and size is returned, which contains the random data.
             *
             * @param {TypedArray} typedArray A typed array *used only* for specifying the type and size of the return value.
             * @returns {TypedArray} A typed array of the same type and size as `typedArray` filled with random data.
             */
            function getRandomValues(typedArray) {
                const { BYTES_PER_ELEMENT, length } = typedArray;
                const totalBytes = BYTES_PER_ELEMENT * length;
                const { buffer } = randomBytes(totalBytes);
                return Reflect.construct(typedArray.constructor, [buffer]);
            }

            crypto.randomUUID = function randomUUID() {
                return (
                    [1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g,
                        c => (c ^ getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                    );
            };


        }

    } else {

        function generate() {
            var c = CHARS, id = FORMAT, r;

            id[0] = c[(r = Math.random() * 0x100000000) & 0xf];
            id[1] = c[(r >>>= 4) & 0xf];
            id[2] = c[(r >>>= 4) & 0xf];
            id[3] = c[(r >>>= 4) & 0xf];
            id[4] = c[(r >>>= 4) & 0xf];
            id[5] = c[(r >>>= 4) & 0xf];
            id[6] = c[(r >>>= 4) & 0xf];
            id[7] = c[(r >>>= 4) & 0xf];

            id[9] = c[(r = Math.random() * 0x100000000) & 0xf];
            id[10] = c[(r >>>= 4) & 0xf];
            id[11] = c[(r >>>= 4) & 0xf];
            id[12] = c[(r >>>= 4) & 0xf];
            id[15] = c[(r >>>= 4) & 0xf];
            id[16] = c[(r >>>= 4) & 0xf];
            id[17] = c[(r >>>= 4) & 0xf];

            id[19] = c[(r = Math.random() * 0x100000000) & 0x3 | 0x8];
            id[20] = c[(r >>>= 4) & 0xf];
            id[21] = c[(r >>>= 4) & 0xf];
            id[22] = c[(r >>>= 4) & 0xf];
            id[24] = c[(r >>>= 4) & 0xf];
            id[25] = c[(r >>>= 4) & 0xf];
            id[26] = c[(r >>>= 4) & 0xf];
            id[27] = c[(r >>>= 4) & 0xf];

            id[28] = c[(r = Math.random() * 0x100000000) & 0xf];
            id[29] = c[(r >>>= 4) & 0xf];
            id[30] = c[(r >>>= 4) & 0xf];
            id[31] = c[(r >>>= 4) & 0xf];
            id[32] = c[(r >>>= 4) & 0xf];
            id[33] = c[(r >>>= 4) & 0xf];
            id[34] = c[(r >>>= 4) & 0xf];
            id[35] = c[(r >>>= 4) & 0xf];

            return id.join('');
        }

        /*
            For older browsers
        */
        crypto = {
            randomUUID: generate
        }
    }
}

if (!('randomUUID' in crypto)) {
    // https://stackoverflow.com/a/2117523/2800218
    // LICENSE: https://creativecommons.org/licenses/by-sa/4.0/legalcode
    crypto.randomUUID = function randomUUID() {
        return (
            [1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g,
                c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
    };
}

function generateCryptoRandomUUID() {
    return crypto.randomUUID();
};

/*
https://antonz.org/uuidv7/#javascript

UUIDv7 looks like this when represented as a string:

0190163d-8694-739b-aea5-966c26f8ad91
└─timestamp─┘ │└─┤ │└───rand_b─────┘
             ver │var
              rand_a
The 128-bit value consists of several parts:

timestamp (48 bits) is a Unix timestamp in milliseconds.
ver (4 bits) is a UUID version (7).
rand_a (12 bits) is randomly generated.
var* (2 bits) is equal to 10.
rand_b (62 bits) is randomly generated.
* In string representation, each symbol encodes 4 bits as a hex number, so the a in the example is 1010, where the first two bits are the fixed variant (10) and the next two are random. So the resulting hex number can be either 8 (1000), 9 (1001), a (1010) or b (1011).

See RFC 9652 for details.
*/

//An alternative to using .padStart(2, "0"). with _padTwoFormatter.format(aNumber)
//const _padTwoFormatter = new Intl.NumberFormat('en', { minimumIntegerDigits: 2, useGrouping: false });

/*
    https://www.xaymar.com/articles/2020/12/08/fastest-uint8array-to-hex-string-conversion-in-javascript/
*/
// Pre-Init
const LUT_HEX_4b = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
const LUT_HEX_8b = new Array(0x100);
//This is doing the equivalent of .padStart(2, "0") already 
for (let n = 0; n < 0x100; n++) {
  LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xF]}${LUT_HEX_4b[n & 0xF]}`;
}
// End Pre-Init
function toHex(value) {
    return LUT_HEX_8b[value];
}

const generateUUIDv7Buffer = new Uint8Array(16);

/**
 * UUID with hyphens/dashes are considered the full version.
 * The trimmed version is the same without hyphens/dashes 
 * 
 * PostgreSQL can take input in both but only return 
 * uuids as string in their full representation.
 */

function generateUUIDv7(aDate, isFull) {
    // random bytes
    const value = generateUUIDv7Buffer;
    crypto.getRandomValues(value);

    // current timestamp in ms
    const timestamp = BigInt(aDate ? aDate.valueOf() : Date.now());

    // timestamp
    // value[0] = Number((timestamp >> 40n) & 0xffn);
    // value[1] = Number((timestamp >> 32n) & 0xffn);
    // value[2] = Number((timestamp >> 24n) & 0xffn);
    // value[3] = Number((timestamp >> 16n) & 0xffn);
    // value[4] = Number((timestamp >> 8n) & 0xffn);
    // value[5] = Number(timestamp & 0xffn);

    // version and variant
    // value[6] = (value[6] & 0x0f) | 0x70;
    // value[8] = (value[8] & 0x3f) | 0x80; 

    //Initial code we started with, creates an array, then map/loop, then, loop again to join... not very efficient, plus a lot of intermediary strings created
    // const uuidStr = Array.from(value)
    // .map((b) => {
    //     return b.toString(16).padStart(2, "0")
    // })
    // .join("");

    //Looping on Uint8Array directly, more efficient, just one loop still 2 intermediary strings created, one for converting to base 16, the other to pad to 2 characters
    // const iterator = value[Symbol.iterator]();
    // let uuidStr1 = "";

    // for (let iValue of iterator) {
    //     uuidStr1 += iValue.toString(16).padStart(2, "0");
    // }

    //Final implementation: no loop as it's a fixed size we can unroll. Intermediary strings are reused from LUT_HEX_8b Array
    return isFull 
        ? `${toHex(Number((timestamp >> 40n) & 0xffn))}${toHex(Number((timestamp >> 32n) & 0xffn))}${toHex(Number((timestamp >> 24n) & 0xffn))}${toHex(Number((timestamp >> 16n) & 0xffn))}-${toHex(Number((timestamp >> 8n) & 0xffn))}${toHex(Number(timestamp & 0xffn))}-${toHex(((value[6] & 0x0f) | 0x70))}${toHex((value[7]))}-${toHex(((value[8] & 0x3f) | 0x80))}${toHex(value[9])}-${toHex(value[10])}${toHex(value[11])}${toHex(value[12])}${toHex(value[13])}${toHex(value[14])}${toHex(value[15])}`
        : `${toHex(Number((timestamp >> 40n) & 0xffn))}${toHex(Number((timestamp >> 32n) & 0xffn))}${toHex(Number((timestamp >> 24n) & 0xffn))}${toHex(Number((timestamp >> 16n) & 0xffn))}${toHex(Number((timestamp >> 8n) & 0xffn))}${toHex(Number(timestamp & 0xffn))}${toHex(((value[6] & 0x0f) | 0x70))}${toHex((value[7]))}${toHex(((value[8] & 0x3f) | 0x80))}${toHex(value[9])}${toHex(value[10])}${toHex(value[11])}${toHex(value[12])}${toHex(value[13])}${toHex(value[14])}${toHex(value[15])}`
}


//exports.generate = generateCryptoRandomUUID;
exports.generate = generateUUIDv7;


var Uuid = exports.Uuid = Object.create(Object.prototype, /** @lends Uuid# */ {
    /**
     * Returns a univerally unique ID (UUID).
     * @function Uuid.generate
     * @returns {string} The UUID.
     */
    generate: {
        enumerable: false,
        value: generateUUIDv7
    }
});

// TODO figure out why this code only works in this module.  Attempts to move
// it to core/extras/object resulted in _uuid becoming enumerable and tests
// breaking. - @kriskowal

// var UUID = require("./uuid");

// HACK: This is to fix an IE10 bug where a getter on the window prototype chain
// gets some kind of proxy Window object which cannot have properties defined
// on it, instead of the `window` itself. Adding the uuid directly to the
// window removes the needs to call the getter.
// if (typeof window !== "undefined") {
//     window.uuid = UUID.generate();
// }
var uuidGetGenerator = function () {

    var uuid = crypto.randomUUID(),
        info = Montage.getInfoForObject(this);
    try {
        if (info !== null && info.isInstance === false) {
            this._uuid = uuid;
            Object.defineProperty(this, "uuid", {
                get: function () {
                    if (this.hasOwnProperty("uuid")) {
                        // we are calling uuid on the prototype
                        return this._uuid;
                    } else {
                        // we are calling uuid on instance of this prototype
                        return uuidGetGenerator.call(this);
                    }
                }
            });
        } else {
            //This is needed to workaround some bugs in Safari where re-defining uuid doesn't work for DOMWindow.
            if (info.isInstance) {
                Object.defineProperty(this, "uuid", {
                    configurable: true,
                    enumerable: false,
                    writable: false,
                    value: uuid
                });
            }
            //This is really because re-defining the property on DOMWindow actually doesn't work, so the original property with the getter is still there and return this._uuid if there.
            if (this instanceof Element || !info.isInstance || !(VALUE in (Object.getOwnPropertyDescriptor(this, "uuid")||{})) || !(PROTO in this /* lame way to detect IE */)) {
                //This is needed to workaround some bugs in Safari where re-defining uuid doesn't work for DOMWindow.
                this._uuid = uuid;
            }
        }
    } catch(e) {
        // NOTE Safari (as of Version 5.0.2 (6533.18.5, r78685)
        // doesn't seem to allow redefining an existing property on a DOM Element
        // Still want to redefine the property where possible for speed
    }

    // NOTE Safari (as of Version 6.1 8537.71) has a bug related to ES5
    // property values. In some situations, even when the uuid has already
    // been defined as a property value, accessing the uuid of an object can
    // make it go through the defaultUuidGet as if the property descriptor
    // was still the original one. When that happens, a new uuid is created
    // for that object. To avoid this, we always make sure that the object
    // has a _uuid that will be looked up at defaultUuidGet() before
    // generating a new one. This mechanism was created to work around an
    // issue with Safari that didn't allow redefining property descriptors
    // in DOM elements.
    this._uuid = uuid;

    return uuid;
};

var defaultUuidGet = function defaultUuidGet() {
    //return this._uuid || (this._uuid = uuidGetGenerator.call(this));
    return ((Object.prototype.hasOwnProperty.call(this, "_uuid") &&  this._uuid) ? this._uuid : uuidGetGenerator.call(this));
};


Montage.defineUuidProperty = function(object) {
    /**
        @private
    */
    Object.defineProperty(object, "_uuid", {
        enumerable: false,
        value: void 0,
        writable: true
    });

    /**
        Contains an object's unique ID.
        @member external:Object#uuid
        @default null
    */
    Object.defineProperty(object, "uuid", {
        configurable: true,
        get: defaultUuidGet,
        set: Function.noop,
        enumerable: false
    });
};

