// ES6 myModule.js

/*
    Not allowed in a function, so can't be combined with our automatic wrapper for commonJS
*/
//import LIGHTSPEED from './module-x.js';

/*
    This works fine inside commonJS wrapper, but relative URL when evaled
    are based on the script that does the eval...
*/
// var LIGHTSPEED;
// import ('http://127.0.0.1:8888/node_modules/phront/data/main.mod/model/module-x.js').then(function(module) {
//     LIGHTSPEED = module.LIGHTSPEED;
// });

//Thus is working client side, more work needed using the project esm:
//https://www.npmjs.com/package/esm
//https://github.com/standard-things/esm
// var LIGHTSPEED = (require)("./module-x.js").LIGHTSPEED;


/*
class List extends Array {
    constructor(...args) {
      super().push(...args);
    }
    // chainable push
    push(...args) {
      super.push(...args);
      return this;
    }
  }

  exports.List = List;

  const abc = new List('a', 'b').push('c');
  // Symbol.species by default grant same constructor
  abc.slice(2) instanceof List; // true
  console.log(abc);
  var set = new Set([1,2,3,4,5,6]);
  var other = List.from(set);
  console.log("other:",other);
  */
var Montage = require("core/core").Montage,
    Locale = require("core/locale").Locale;


/**
 * A LocalizedString encapsulate the localized version of a string in multiple languages. 
 * 
 * The main use is to leverage the user's prefered language and have it behave as a regular string. But
 * the internal representation is as follow:
 * 
 *  {
 *      "en": {
 *          "US": "Network Interface"
 *      },
 *      "fr": {
 *          "FR": "Interface Réseau"
 *      }
 * }
 * 
 * 
 * @class
 * @extends external:String
 */





class LocalizedString extends String {
    //ES2019
    //#localization = "blue";

    static {
        Montage.defineProperties(LocalizedString, {
            _defaultLocale: { value: undefined },
            defaultLocale: {
                set: function(value) {
                    this._defaultLocale = value;
                },
                get: function() {
                    return this._defaultLocale || Locale.systemLocale;
                }
            },
            locale: {
                set: function(value) {
                    this.prototype._locale = value;
                },
                get: function() {
                    return this.prototype._locale || this.defaultLocale;
                }
            },
            /*
                Needed for MontageVisitor's getTypeOf() to return MontageObject
            */
            getInfoForObject: {
                value: function(object) {
                    return Montage.getInfoForObject(object);
                }
            }
        
        });

        const valueOf_toString = function() {
            if(this._localization) {
                return this._localization[this.locale.language][this.locale.region];
            } else {
                return this;
            }
        };

        Montage.defineProperties(this.prototype, {
            /**
             *  This changes the locale of all LocalizedString
             *  that haven't been set directly a locale that would
             *  override the prototype's default value
             *
             * @property {Application} value
             * @default null
             */
            localization: {
                set: function(value) {
                    this._localization = value;
                },
                get: function() {
                    return this._localization;
                }
            },
            locale: {
                set: function(value) {
                    this._locale = value;
                },
                get: function() {
                    return this._locale || LocalizedString.defaultLocale;
                }
            },
            valueOf: {
                value: valueOf_toString
            },
            toString: {
                value: valueOf_toString
            },
            serializeSelf: {
                value: function (serializer) {
                    if(this._localization) {
                        serializer.setProperty("localization", this._localization);
                    }
                }
            },
            deserializeSelf: {
                value: function (deserializer) {
                    var value;
                    value = deserializer.getProperty("localization");
                    if (value !== void 0) {
                        if(typeof value === "object") {
                            this.localization = value;
                        } else {
                            console.warn(`LocalizedString deserializeSelf(): ignoring deserialized value for localization that is not an object:`, value);
                        }
                    }
                }
            },

        });
    }


    constructor(thing) {
        super(thing||"");

        /*
            As soon as an instance's property value is set, even when that very property has been defined as non enumerable, on it's prototype, it's considered enumerable on that instance.

            So the only way to keep it non-enumerable is to redefine per instance, or use a shared WeakMap Instance -> Map [privateVariableName -> value]
        */
        //console.log("this.#localization",this.#localization);

        Object.defineProperty(this, "_localization",
        {
            configurable: true,
            value: undefined,
            writable: true,
            enumerable: false
        });
    }
};

/*
    configurable: true
    enumerable: false
    value: undefined
    writable: true
*/






  exports.LocalizedString = LocalizedString;

  /*
  //Test
  const abc = new LocalizedString('a', 'b');
  var prop;
  abc.localization = {};
  console.log("Object.keys(abc):",Object.keys(abc));
  for( prop in abc) {
      console.log("for in on abc:",prop,"->",abc[prop]);
  }
  console.log("JSON.stringify(abc):",JSON.stringify(abc));
  */

