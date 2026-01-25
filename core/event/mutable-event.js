/**
 @module mod/core/event/mutable-event
 @requires montage
 */
 const Montage = require("../core").Montage,
    uuid = require("../../core/uuid"),
    Promise = require("../promise").Promise,
    console = require('../extras/console').console;

var wrapPropertyGetter = function (key, storageKey) {
        return function () {
            return this.hasOwnProperty(storageKey) ? this[storageKey] : this._event[key];
        };
    },
    wrapPropertySetter = function (storageKey) {
        return function (value) {
            this[storageKey] = value;
        };
    };


// XXX Does not presently function server-side
//if (typeof window !== "undefined") {

    var _eventConstructorsByType = {};

    var wrapProperty = function (obj, key) {
        var storageKey = "_" + key;

        Montage.defineProperty(obj, storageKey, {value: undefined});

        Montage.defineProperty(obj, key, {
            get: wrapPropertyGetter(key, storageKey),
            set: wrapPropertySetter(storageKey)
        });
    };
    /**
        @class MutableEvent
    */
    var MutableEvent = exports.MutableEvent = Montage.specialize(/** @lends MutableEvent# */ {

    /**
      @private
    */
        _initPrototypeWithEvent: {
            value: function (event) {
                var key, proto = this.__proto__ || Object.getPrototypeOf(this);

                /* jshint forin: true */
                for (key in event) {
                /* jshint forin: false */

                    //  Don't overwrite keys we have installed
                    if (key in this || Object.getOwnPropertyDescriptor(proto,key)) {
                        continue;
                    }

                    // Skip methods, the ones we care about have been wrapped
                    // already.
                    // TODO actually wrap all known functions generically
                    //if (typeof this[key] === "function") {
                    // continue;
                    //}

                    // TODO ok, maybe it would be quicker to not make this a
                    // function, but I really hate duplicated code.
                    wrapProperty(this, key);
                }

                wrapProperty(this, "replayed");

                return this;
            }
        },

        _initWithEvent: {
            value: function (event) {
                this._event = event;
                return this;
            }
        },

        _id: {
            value: undefined
        },
    
        id: {
            get: function() {
                return this._id || (this._id = uuid.generate());
            },
            set:  function(value) {
                if(value !== this._id) {
                    this._id = value;
                }
            }
        },
    
    
        /**
         * @function
         */
        preventDefault: {
            value: function () {
                this._event 
                    ? this._event.preventDefault()
                    : (this._defaultPrevented = true);
            }
        },

        /**
         * @function - deprecated
         */
        getPreventDefault: {
            value: function () {
                if (this._event) {
                    if (this._event.getPreventDefault) {
                        return this._event.getPreventDefault();
                    }
                    return this._event.defaultPrevented;
                } else {
                    return this.defaultPrevented;
                }
            }
        },

        _defaultPrevented: {
            value: false
        },
        defaultPrevented: {
            value: function () {
                return this._event
                    ? this._event.defaultPrevented
                    : this._defaultPrevented;
            }
        },

        /**
         * @function
         */
        stopImmediatePropagation: {
            value: function () {
                if(this._event) this._event.stopImmediatePropagation();
                // TODO only if the event is cancellable?
                this.propagationStopped = true;
                this.immediatePropagationStopped = true;
            }
        },

        /**
         * @type {Property}
         * @default {boolean} false
         */
        propagationStopped: {
            value: false
        },

        /**
         * @type {Property}
         * @default {boolean} false
         */
        immediatePropagationStopped: {
            value: false
        },

        /**
         * @type {Property}
         * @default {boolean} true
        */
        mutable: {
            value: true
        },

        /**
         * @function
         */
        stopPropagation: {
            value: function () {
                if(this._event) this._event.stopPropagation();
                // TODO only if the event is cancellable?
                this.propagationStopped = true;
            }
        },

        /**
         * @function
         */
        stop: {
            value: function () {
                this.preventDefault();
                this.stopPropagation();
            }
        },

        /**
         * A propagation promise is set by the event maanager when a listener returns a promise from handling the event.
         * event propagates to the next listener when that promise is fullfilled. 
         * 
         * @type {Property}
         * @default {Promise} null
         */
        propagationPromise: {
            value: Promise.resolveUndefined
        },


        _eventPhase: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        eventPhase: {
            get: function () {
                return (this._eventPhase !== void 0)
                ? this._eventPhase
                : this._event
                    ? this._event.eventPhase
                    : undefined;
            },
            set: function (value) {
                this._eventPhase = value;
            }
        },
        _target: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        target: {
            get: function () {
                return (this._target !== void 0)
                    ? this._target
                    : this._event
                        ? this._event.target
                        : undefined;
            },
            set: function (value) {
                this._target = value;
            }
        },
        _currentTarget: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        currentTarget: {
            get: function () {
                return (this._currentTarget !== void 0)
                    ? this._currentTarget
                    : this._event
                        ? this._event.currentTarget
                        : undefined;
            },
            set: function (value) {
                this._currentTarget = value;
            }
        },
        _type: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        type: {
            get: function () {
                return (this._type !== void 0) ? this._type : this._event.type;
            },
            set: function (value) {
                this._type = value;
            }
        },
        _bubbles: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Boolean} null
         */
        bubbles: {
            get: function () {
                return (this._bubbles !== void 0) ? this._bubbles : (this._event && this._event.bubbles);
            },
            set: function (value) {
                this._bubbles = value;
            }
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        touches: {
            get: function () {
                return this._event ? this._event.touches : null;
            },
            set: function (value) {
                this._event.touches = value;
            }
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        changedTouches: {
            get: function () {
                return this._event ? this._event.changedTouches : null;
            },
            set: function (value) {
                this._event.changedTouches = value;
            }
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        targetTouches: {
            get: function () {
                return this._event ? this._event.targetTouches : null;
            }
        },

        _cancelable: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {boolean} should be false by default
         */
        cancelable: {
            get: function () {
                return (this._cancelable !== void 0) ? this._cancelable : this._event && this._event.cancelable;
            },
            set: function (value) {
                this._cancelable = value;
            }
        },

        _defaultPrevented: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {boolean} false
         */
        defaultPrevented: {
            get: function () {
                return (this._defaultPrevented !== void 0) ? this._defaultPrevented : (this._event ? this._event.defaultPrevented : false);
            },
            set: function (value) {
                this._defaultPrevented = value;
            }
        },
        _timeStamp: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        timeStamp: {
            get: function () {
                return (this._timeStamp !== void 0)
                ? this._timeStamp
                : this._event
                    ? this._event.timeStamp
                    : undefined;
            },
            set: function (value) {
                this._timeStamp = value;
            }
        },
        _detail: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Object} null
         */
        detail: {
            get: function () {
                return (this._detail !== void 0) ? this._detail : (this._event && this._event.detail);
            },
            set: function (value) {
                this._detail = value;
            }
        },
        _composedPath: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        composedPath: {
            value: function () {
                return this._composedPath;
            }
        }

    }, {
        wrapEvent: {
            value: true
        },

        /**
         * @function
         * @param {Event} event The original event.
         * @returns newEvent
         */
        fromEvent: {
            value: function fromEvent(event) {
                console.groupTime("fromEvent");
                var eventSubclass = _eventConstructorsByType[event.type];
                if (!eventSubclass) {

                    if(this.wrapEvent) {
                        eventSubclass = function MutableEvent() {
                        };
                        _eventConstructorsByType[event.type] = eventSubclass;
                        eventSubclass.prototype = new exports.MutableEvent()._initPrototypeWithEvent(event);

                    } else {

                    eventSubclass = class extends event.constructor {

                        static {
                            // const p = this.prototype;

                            // /**
                            //  * @type {Property}
                            //  * @default {boolean} false
                            //  */
                            // p.propagationStopped = false;

                            // /**
                            //  * @type {Property}
                            //  * @default {boolean} false
                            //  */
                            // p.immediatePropagationStopped = false;

                            // /**
                            //  * @type {Property}
                            //  * @default {Promise} null
                            //  */
                            // p.propagationPromise = null;


                            // p._eventPhase = void 0;
                            // p._target = void 0;
                            // p._currentTarget = void 0;
                            // p._type = void 0;
                            // p._bubbles = void 0;
                            // p._cancelable = void 0;
                            // p._defaultPrevented = void 0;
                            // p._timeStamp = void 0;
                            // p._detail = void 0;


                            Montage.defineProperties(this.prototype, {

                                /**
                                 * @type {Property}
                                 * @default {boolean} false
                                 */
                                propagationStopped: {value: false},

                                /**
                                 * @type {Property}
                                 * @default {boolean} false
                                 */
                                immediatePropagationStopped: {value: false},

                                /**
                                 * @type {Property}
                                 * @default {Promise} null
                                 */
                                propagationPromise: {value: null},

                                _eventPhase: {value: void 0},
                                _target: {value: void 0},
                                _currentTarget: {value:  void 0},
                                _type: {value: void 0},
                                _bubbles: {value:  void 0},
                                _cancelable: {value:  void 0},
                                _defaultPrevented: {value:  void 0},
                                _timeStamp: {value:  void 0},
                                _detail: {value:  void 0}
                            });

                        }
                        /**
                         * @function
                         */
                        preventDefault() {
                            super.preventDefault();
                        }

                        defaultPrevented() {
                            return super.defaultPrevented;
                        }

                        /**
                         * @function
                         */
                        stopImmediatePropagation() {
                            super.stopImmediatePropagation();
                            // TODO only if the event is cancellable?
                            this.propagationStopped = true;
                            this.immediatePropagationStopped = true;
                        };


                        /**
                         * @function
                         */
                        stopPropagation() {
                            super.stopPropagation();
                            // TODO only if the event is cancellable?
                            this.propagationStopped = true;
                        }

                        /**
                         * @function
                         */
                        stop() {
                            this.preventDefault();
                            this.stopPropagation();
                        }


                        /**
                         * @type {Property}
                         * @default {Element} null
                         */
                        get eventPhase() {
                            return (this._eventPhase !== void 0)
                                ? this._eventPhase
                                : super.eventPhase;
                        }
                        set eventPhase(value) {
                            this._eventPhase = value;
                        }


                        /**
                         * @type {Property}
                         * @default {Element} null
                         */
                        get target() {
                            return (this._target !== void 0)
                                ? this._target
                                : super.target;
                        }
                        set target(value) {
                            this._target = value;
                        }

                        /**
                         * @type {Property}
                         * @default {Element} null
                         */
                        get currentTarget() {
                            return (this._currentTarget !== void 0)
                                ? this._currentTarget
                                : super.currentTarget;
                        }
                        set currentTarget(value) {
                            this._currentTarget = value;
                        }

                        /**
                         * @type {Property}
                         * @default {Element} null
                         */
                        get type() {
                            return (this._type !== void 0) ? this._type : super.type;
                        }
                        set type (value) {
                            this._type = value;
                        }

                        /**
                         * @type {Property}
                         * @default {Element} null
                         */
                        get bubbles() {
                                return (this._bubbles !== void 0)
                                    ? this._bubbles
                                    : super.bubbles;
                            }
                        set bubbles(value) {
                            this._bubbles = value;
                        }

                        /**
                         * @type {Property}
                         * @default {Element} null
                         */
                        get touches () {
                            return this.touches;
                        }
                        set touches (value) {
                            this.touches = value;
                        }

                        /**
                         * @type {Property}
                         * @default {Element} null
                         */
                        get changedTouches () {
                            return super.changedTouches;
                        }
                        set changedTouches (value) {
                            this.changedTouches = value;
                        }

                        /**
                         * @type {Property}
                         * @default {Element} null
                         */
                        get targetTouches() {
                            return this.targetTouches;
                        }

                        /**
                         * @type {Property}
                         * @default {boolean} should be false by default
                         */
                        get cancelable () {
                            return (this._cancelable !== void 0) ? this._cancelable : super.cancelable;
                        }
                        set cancelable (value) {
                            this._cancelable = value;
                        }

                        /**
                         * @type {Property}
                         * @default {boolean} false
                         */
                        get defaultPrevented () {
                            return (this._defaultPrevented !== void 0)
                                ? this._defaultPrevented
                                : super.defaultPrevented;
                        }
                        set defaultPrevented (value) {
                            this._defaultPrevented = value;
                        }

                        /**
                         * @type {Property}
                         * @default {Element} null
                         */
                        get timeStamp () {
                            return (this._timeStamp !== void 0)
                                ? this._timeStamp
                                : super.timeStamp;
                        }
                        set timeStamp(value) {
                            this._timeStamp = value;
                        }

                        /**
                         * @type {Property}
                         * @default {Object} null
                         */
                        get detail() {
                            return (this._detail !== void 0)
                                ? this._detail
                                : super.detail;
                        }
                        set detail(value) {
                            this._detail = value;
                        }

                    };
                    _eventConstructorsByType[event.type] = eventSubclass;

                    }
                }
                var result = this.wrapEvent
                    ? new eventSubclass()._initWithEvent(event)
                    : (Object.setPrototypeOf(event,eventSubclass.prototype) && event);
                    console.groupTimeEnd("fromEvent");
                return result;

            }
        },

        //    Same arguments as initEvent & initCustomEvent

        /**
         * @function
         * @param {Event} type TODO
         * @param {Event} canBubbleArg TODO
         * @param {Event} cancelableArg TODO
         * @param {Event} data TODO
         * @returns this.fromEvent(anEvent)
         */
        fromType: {
            value: function MutableEvent_fromType(type, canBubbleArg, cancelableArg, detail) {
                var newEvent = new this();

                newEvent.type = type;
                newEvent.bubbles = typeof canBubbleArg === "boolean" ? canBubbleArg : false;
                newEvent.cancelable = typeof cancelableArg === "boolean" ? cancelableArg : false;
                if(detail) newEvent.detail = detail;

                return newEvent;

                //return this.fromEvent(new CustomEvent(type, {bubbles: canBubbleArg, cancelable:cancelableArg, detail:detail}));
            }
        }

    });

//} // client-side
