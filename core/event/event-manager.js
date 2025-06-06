/*global Window, Document, Element, Event, Components, Touch, MontageElement */

/**
 * @author Lea Verou
 * @license MIT
 * @see http://leaverou.github.com/chainvas/
 */

/**
 * @module mod/core/event/event-manager
 * @requires mod/core/core
 * @requires mod/core/event/mutable-event
 * @requires mod/core/serialization
 * @requires mod/core/event/action-event-listener
 */

var Montage = require("../core").Montage,
    MutableEvent = require("./mutable-event").MutableEvent,
    Serializer = require("../serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("../serialization/deserializer/montage-deserializer").MontageDeserializer,
    Map = require("../collections/map"),
    currentEnvironment = require("../environment").currentEnvironment,
    Event_NONE = 0,
    Event_CAPTURING_PHASE =	1,
    Event_AT_TARGET	= 2,
    Event_BUBBLING_PHASE = 3,
    defaultEventManager,
    browserSupportsCaptureOption = false,
    browserSupportsPassiveOption = false,
    MontageElement = (typeof window === "object") ? window.MontageElement : null;





/**
 * Notes to integrate coomposers in event manager:
 *
 * 1. Composers have to be registered.
 *      - Composer's code  should register themeselves
 *      - Component relying on them today already require them
 *      - later the tool can have a map of event names -> moduleId and
 *      automatically add to the root serialization, or each template, the  modules  needed.
 *
 * 2. addEventListner("eventName")
 *      - if not standard, find in map the composer registered if any
 *      - instantiate one
 *      - if listener is a component, set the relationship as before
 *          - load, etc... which make the composer add it's own listeners
 *      - add the composer to the options object.
 */





/**
 * add|removeEventListener options related feature detection for older browsers
 */
try {
    var options = {
        get passive() {
            browserSupportsPassiveOption = true;
            return false;
        },
        get capture() {
            browserSupportsCaptureOption = true;
            return false;
        }
    };
    addEventListener("test", null, options);
    removeEventListener("test", null, options);
} catch(e) {}


/**
 * If needed, polyfill for Event Listener with Options
 * from:
 * https://raw.githubusercontent.com/WICG/EventListenerOptions/gh-pages/EventListenerOptions.polyfill.js
 *
 */
if (typeof EventTarget === "function" && (!browserSupportsPassiveOption || !browserSupportsCaptureOption)) {
    (function() {
        var super_add_event_listener = EventTarget.prototype.addEventListener;
        var super_remove_event_listener = EventTarget.prototype.removeEventListener;
        var super_prevent_default = Event.prototype.preventDefault;

        function parseOptions(type, listener, options, action) {
        var needsWrapping = false;
        var useCapture = false;
        var passive = false;
        var fieldId;
        if (options) {
            if (typeof(options) === 'object') {
            passive = options.passive ? true : false;
            useCapture = options.useCapture ? true : false;
            } else {
            useCapture = options;
            }
        }
        if (passive)
            needsWrapping = true;
        if (needsWrapping) {
            fieldId = useCapture.toString();
            fieldId += passive.toString();
        }
        action(needsWrapping, fieldId, useCapture, passive);
        }

        Event.prototype.preventDefault = function() {
        if (this.__passive) {
            console.warn("Ignored attempt to preventDefault an event from a passive listener");
            return;
        }
        super_prevent_default.apply(this);
        }

        EventTarget.prototype.addEventListener = function(type, listener, options) {
        var super_this = this;
        parseOptions(type, listener, options,
            function(needsWrapping, fieldId, useCapture, passive) {
            if (needsWrapping) {
                var fieldId = useCapture.toString();
                fieldId += passive.toString();

                if (!this.__event_listeners_options)
                this.__event_listeners_options = {};
                if (!this.__event_listeners_options[type])
                this.__event_listeners_options[type] = {};
                if (!this.__event_listeners_options[type][listener])
                this.__event_listeners_options[type][listener] = [];
                if (this.__event_listeners_options[type][listener][fieldId])
                return;
                var wrapped = {
                handleEvent: function (e) {
                    e.__passive = passive;
                    if (typeof(listener) === 'function') {
                    listener(e);
                    } else {
                    listener.handleEvent(e);
                    }
                    e.__passive = false;
                }
                };
                this.__event_listeners_options[type][listener][fieldId] = wrapped;
                super_add_event_listener.call(super_this, type, wrapped, useCapture);
            } else {
                super_add_event_listener.call(super_this, type, listener, useCapture);
            }
            });
        }

        EventTarget.prototype.removeEventListener = function(type, listener, options) {
        var super_this = this;
        parseOptions(type, listener, options,
            function(needsWrapping, fieldId, useCapture, passive) {
            if (needsWrapping &&
                this.__event_listeners_options &&
                this.__event_listeners_options[type] &&
                this.__event_listeners_options[type][listener] &&
                this.__event_listeners_options[type][listener][fieldId]) {
                super_remove_event_listener.call(super_this, type, this.__event_listeners_options[type][listener][fieldId], false);
                delete this.__event_listeners_options[type][listener][fieldId];
                if (this.__event_listeners_options[type][listener].length == 0)
                delete this.__event_listeners_options[type][listener];
            } else {
                super_remove_event_listener.call(super_this, type, listener, useCapture);
            }
            });
        }

    })();
}


//This is a quick polyfill for IE10 that is not exposing CustomEvent as a function.
//From https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
if (
    typeof document !== "undefined" &&
        typeof window !== "undefined" &&
            typeof Event !== "undefined" &&
                typeof CustomEvent !== "function"
) {
    CustomEvent = function CustomEvent (event, params) { // jshint ignore:line
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    };

    CustomEvent.prototype = Event.prototype;
    window.CustomEvent = CustomEvent;
}



// jshint -W015
/* This is to handle browsers that have TouchEvents but don't have the global constructor function Touch */
if (
    typeof document !== "undefined" &&
        typeof window !== "undefined" &&
            typeof Touch === "undefined" &&
                "ontouchstart" in window
) {
    Touch = function Touch() {}; // jshint ignore:line

    (function () {
        var onFirstTouchstart;
        document.addEventListener("touchstart", onFirstTouchstart = function onFirstTouchstart(event) {
            window.Touch = event.touches[0].constructor;
            if (document.nativeRemoveEventListener) {
                document.nativeRemoveEventListener("touchstart", onFirstTouchstart, true);
            } else {
                document.removeEventListener("touchstart", onFirstTouchstart, true);
            }
            if (defaultEventManager && defaultEventManager.isStoringPointerEvents) {
                defaultEventManager.isStoringPointerEvents = false;
                defaultEventManager.isStoringPointerEvents = true;
            }
        }, true);
    })();

    window.Touch = Touch;
}


var _PointerVelocity = Montage.specialize({
    _identifier: {
        enumerable: false,
        writable: true,
        value: null
    },
    initWithIdentifier: {
        value: function (identifier) {
            this._identifier = identifier;
            return this;
        }
    },
    clearCache: {
        value: function () {
            this._data = this._x = this._y = this._speed = this._angle = null;
            return this;
        }
    },
    _data: {
        enumerable: false,
        writable: true,
        value: null
    },
    _x: {
        enumerable: false,
        writable: true,
        value: null
    },
    _y: {
        enumerable: false,
        writable: true,
        value: null
    },
    _speed: {
        enumerable: false,
        writable: true,
        value: null
    },
    _angle: {
        enumerable: false,
        writable: true,
        value: null
    },
    x: {
        get: function () {
            if (this._x === null) {
                if (this._data === null) {
                    this._data = defaultEventManager._getPointerVelocityData(this._identifier);
                }
                this._x = defaultEventManager._calculatePointerVelocity(this._data.time, this._data.x);
            }
            return this._x;
        },
        set: function () {
        }
    },
    y: {
        get: function () {
            if (this._y === null) {
                if (this._data === null) {
                    this._data = defaultEventManager._getPointerVelocityData(this._identifier);
                }
                this._y = defaultEventManager._calculatePointerVelocity(this._data.time, this._data.y);
            }
            return this._y;
        },
        set: function () {
        }
    },
    speed: {
        get: function () {
            if (this._speed === null) {
                this._speed = Math.sqrt(this.x * this.x + this.y * this.y);
            }
            return this._speed;
        },
        set: function () {
        }
    },
    angle: {
        get: function () {
            if (this._angle === null) {
                this._angle = Math.atan2(this.y, this.x);
            }
            return this._angle;
        },
        set: function () {
        }
    }
});


var _PointerStorageMemoryEntry = Montage.specialize({
    constructor: {
        value: function (identifier) {
            this.data = new Array(32);
            this.velocity = {velocity: (new _PointerVelocity()).initWithIdentifier(identifier)};
            return this;
        }
    },
    data: {
        enumerable: false,
        writable: true,
        value: null
    },
    size: {
        enumerable: false,
        writable: true,
        value: 0
    },
    pos: {
        enumerable: false,
        writable: true,
        value: 0
    },
    velocity: {
        enumerable: false,
        writable: true,
        value: 0
    }

});

var _StoredEvent = Montage.specialize({
    constructor: {
        value: function (clientX, clientY, timeStamp) {
            this.clientX = clientX;
            this.clientY = clientY;
            this.timeStamp = timeStamp;
            return this;
        }
    },
    clientX: {
        enumerable: false,
        writable: true,
        value: null
    },
    clientY: {
        enumerable: false,
        writable: true,
        value: 0
    },
    timeStamp: {
        enumerable: false,
        writable: true,
        value: 0
    }
});



/***************************************************************************************************************
 *
 * Support for Event Serialiation/Deserialization
 *
 **************************************************************************************************************/

// var _serializeObjectRegisteredEventListenersForPhase = function (serializer, object, registeredEventListeners, eventListenerDescriptors, capture) {
//     var i, l, type, listenerRegistrations, listeners, aListener, mapIter;
//     mapIter = registeredEventListeners.keys();

//     while ((type = mapIter.next().value)) {
//         listenerRegistrations = registeredEventListeners.get(type);
//         listeners = listenerRegistrations && listenerRegistrations.get(object);
//         if (Array.isArray(listeners) && listeners.length > 0) {
//             for (i = 0, l = listeners.length; i < l; i++) {
//                 aListener = listeners[i];
//                 eventListenerDescriptors.push({
//                     type: type,
//                     listener: serializer.addObjectReference(aListener),
//                     capture: capture
//                 });
//             }
//         }
//         else if (listeners){
//             eventListenerDescriptors.push({
//                 type: type,
//                 listener: serializer.addObjectReference(listeners),
//                 capture: capture
//             });
//         }
//     }
// };



var _serializedListenerEntryForType = function (listenerEntry, eventType, serializer) {
    //If entry only contains listener and capture keys, we can steamline to capture only
    if(Object.keys(listenerEntry) === 2) {
        return {
            type: eventType,
            listener: serializer.addObjectReference(listenerEntry.listener),
            capture: listenerEntry.capture
        };
    } else {
        var serializedEntry = {};
        Object.assign(serializedEntry,listenerEntry);
        delete serializedEntry.listener;
        return {
            type: eventType,
            listener: serializer.addObjectReference(listenerEntry.listener),
            options: serializedEntry
        };
    }
}

Serializer.defineSerializationUnit("listeners", function listenersSerializationUnit(serializer, object) {
    var eventManager = defaultEventManager,
        eventListenerDescriptors = [],
        targetEntry = eventManager._targetEventListeners.get(object),
        descriptors,
        descriptor,
        listener;

        // _serializeObjectRegisteredEventListenersForPhase(serializer, object,eventManager._registeredCaptureEventListeners,eventListenerDescriptors,true);
        // _serializeObjectRegisteredEventListenersForPhase(serializer, object,eventManager._registeredBubbleEventListeners,eventListenerDescriptors,false);

        targetEntry && targetEntry.forEach(function(targetEntryForEventType/*value*/, eventType/*key*/, map) {
            targetEntryForEventType.forEach(function(listenerEntries/*value*/, phase/*key*/, map) {
                var i, l, iListenerEntry, iSerializedEntry;

                if (Array.isArray(listenerEntries) && listenerEntries.length > 0) {
                    for (i = 0, l = listenerEntries.length; i < l; i++) {
                        eventListenerDescriptors.push(_serializedListenerEntryForType(listenerEntries[i],eventType,serializer));
                    }
                }
                else if (listenerEntries){
                    eventListenerDescriptors.push(_serializedListenerEntryForType(listenerEntries,eventType,serializer));
                }

            });
        });


    if (eventListenerDescriptors.length > 0) {
        return eventListenerDescriptors;
    }
});

Deserializer.defineDeserializationUnit("listeners", function listenersDeserializationUnit(deserializer, object, listeners) {
    for (var i = 0, listener; (listener = listeners[i]); i++) {
        if(listener.hasOwnProperty("capture") && typeof listener.capture === "boolean")  {
            object.addEventListener(listener.type, listener.listener, listener.capture);
        } else {
            object.addEventListener(listener.type, listener.listener, listener.options);
        }
    }
});




function EventListener(){}





/**
 * @class EventManager
 * @extends Montage
 */
var EventManager = exports.EventManager = Montage.specialize(/** @lends EventManager.prototype # */ {
    /**
     * @constructs
     */
    constructor: {
        value: function EventManager () {
            this._trackingTouchStartList = new Map();
            this._trackingTouchEndList = new Map();
            this._findActiveTargetMap = new Map();
            this._eventPathForTargetMap = new Map();
            this._claimedPointers = new Map();
            this._registeredCaptureEventListeners = new Map();
            this._registeredBubbleEventListeners = new Map();
            this._observedTarget_byEventType_ = Object.create(null);
            this._currentDispatchedTargetListeners = new Map();
            this._elementEventHandlerByElement = new WeakMap();
            this.environment = currentEnvironment;
            this.isBrowser = currentEnvironment.isBrowser;
            //Faster to invoke on this then a global symbol like Element
            this.isBrowser 
                ? this.isElement = Element.isElement
                : undefined;
            this._trackingTouchTimeoutIDs = new Map();
            // this._functionType = "function";

            this._targetEventListeners = new Map();
            /*
                _targetEventListeners -> Map( eventType -> map (
                                                        CaptureEventListeners -> [EventListeners{
                                                                                    listener: {},
                                                                                    capture: true,
                                                                                    once: true/false,
                                                                                    passive: true/false,
                                                                                    callBack
                                                        }]
                                                        BubbleEventListeners -> [EventListeners{
                                                                                    listener: {},
                                                                                    capture: false,
                                                                                    once: true/false,
                                                                                    passive: true/false,
                                                                                    callBack

                                                        }]) )


                when addEventListner is going to be called with a boolean capture, we're going to buil d a listener object with the matching defauls (those might need to change per browser?)
            */

            return this;
        }
    },
    spliceOne: {
        value: function spliceOne(arr, index) {
            var len = arr.length;
            if (len) {
                while (index < len) {
                    arr[index] = arr[index + 1];
                    index++;
                }
                arr.length--;
            }
        }
    },
    /**
     * Utility
     * @see ClipboardEvent http://dev.w3.org/2006/webapi/clipops/clipops.html#event-types-and-details
     * @see DND http://www.w3.org/TR/2010/WD-html5-20101019/dnd.html
     * @see document.implementation.hasFeature("HTMLEvents", "2.0")
     * @see DOM2 http://www.w3.org/TR/DOM-Level-2-Events/events.html
     * @see DOM3 http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
     * @see DOM4 http://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#events
     * @see GECKO https://developer.mozilla.org/en/Gecko-Specific_DOM_Events
     * @see MSFT defacto standard
     * @see ProgressEvent http://www.w3.org/TR/progress-events/
     * @see TouchEvent http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
     * @see INPUT http://dev.w3.org/html5/spec/common-input-element-apis.html#common-event-behaviors
     * @see WEBSOCKETS http://www.w3.org/TR/html5/comms.html
     * @see http://www.quirksmode.org/dom/events/index.html
     * @see https://developer.mozilla.org/en/DOM/DOM_event_reference
     */
    eventDefinitions: {
        value: {
            abort: {bubbles: false, cancelable: false}, //ProgressEvent, DOM3, //DOM2 does bubble
            beforeunload: {bubbles: false}, //MSFT
            blur: {bubbles: false, cancelable: false}, //DOM2, DOM3
            change: {bubbles: true, cancelable: false}, //DOM2, INPUT
            click: {bubbles: true, cancelable: true}, //DOM3
            close: {bubbles: false, cancelable: false}, //WEBSOCKETS
            compositionend: {bubbles: true, cancelable: false}, //DOM3
            compositionstart: {bubbles: true, cancelable: true}, //DOM3
            compositionupdate: {bubbles: true, cancelable: false}, //DOM3
            contextmenu: {bubbles: true, cancelable: true}, //MSFT
            copy: {bubbles: true, cancelable: true}, //ClipboardEvent
            cut: {bubbles: true, cancelable: true}, //ClipboardEvent
            dblclick: {bubbles: true, cancelable: false}, //DOM3
            DOMActivate: {bubbles: true, cancelable: true, deprecated: true}, //DOM2, DOM3 deprecated
            DOMContentLoaded: {bubbles: true, cancelable: false},
            DOMMouseScroll: {bubbles: true}, //GECKO
            drag: {bubbles: true, cancelable: true}, //DND
            dragend: {bubbles: true, cancelable: false}, //DND
            dragenter: {bubbles: true, cancelable: true}, //DND
            dragleave: {bubbles: true, cancelable: false}, //DND
            dragover: {bubbles: true, cancelable: true}, //DND
            dragstart: {bubbles: true, cancelable: true}, //DND
            drop: {bubbles: true, cancelable: true}, //DND
            error: {
                bubbles: function (target) {
                    // error does not bubble when used as a ProgressEvent
                    // return !(XMLHttpRequest.prototype.isPrototypeOf(target) ||
                    return !(target instanceof XMLHttpRequest ||
                        target instanceof WebSocket ||
                        target.tagName && "VIDEO" === target.tagName.toUpperCase() ||
                        target.tagName && "AUDIO" === target.tagName.toUpperCase());
                },
                cancelable: false
            }, //DOM2, DOM3, ProgressEvent
            focus: {bubbles: false, cancelable: false}, //DOM2, DOM3
            focusin: {bubbles: true, cancelable: false}, //DOM3
            focusout: {bubbles: true, cancelable: false}, //DOM3
            input: {bubbles: true, cancelable: false}, // INPUT
            invalid: {bubbles: false, cancelable: true}, // INPUT
            keydown: {bubbles: true, cancelable: false}, //DOM3
            keypress: {bubbles: true, cancelable: false}, //DOM3
            keyup: {bubbles: true, cancelable: false}, //DOM3
            load: {bubbles: false, cancelable: false}, //ProgressEvent, DOM2, DOM3
            loadend: {bubbles: false, cancelable: false}, //ProgressEvent
            loadstart: {bubbles: false, cancelable: false}, //ProgressEvent
            message: {bubbles: false, cancelable: false}, //WEBSOCKETS
            mousedown: {bubbles: true, cancelable: true}, //DOM3
            mouseenter: {bubbles: false, cancelable: false}, //DOM3
            mouseleave: {bubbles: false, cancelable: false}, //DOM3
            mousemove: {bubbles: true, cancelable: true}, //DOM3
            mouseout: {bubbles: true, cancelable: true}, //DOM3
            mouseover: {bubbles: true, cancelable: true}, //DOM3
            mouseup: {bubbles: true, cancelable: true}, //DOM3
            mousewheel: {bubbles: true},
            offline: {bubbles: false, cancelable: false}, //DOM3
            online: {bubbles: false, cancelable: false}, //DOM3
            open: {bubbles: false, cancelable: false}, //DOM3
            orientationchange: {bubbles: false},
            paste: {bubbles: true, cancelable: true}, //ClipboardEvent
            progress: {bubbles: false, cancelable: false}, //ProgressEvent
            reset: {bubbles: true, cancelable: false}, //DOM2
            resize: {bubbles: false, cancelable: false}, //DOM2 bubbles, DOM3

            scroll: {
                bubbles: function (target) {
                    return /*isDocument*/!!target.defaultView;
                },
                cancelable: false
            }, //DOM2, DOM3 When dispatched on Document element must bubble to defaultView object

            select: {bubbles: true, cancelable: false}, //DOM2, DOM3

            submit: {bubbles: true, cancelable: true}, //DOM2
            timeout: {bubbles: false, cancelable: false}, //DOM2
            touchcancel: {bubbles: true, cancelable: false}, //TouchEvent
            touchend: {bubbles: true, cancelable: true}, //TouchEvent
            touchmove: {bubbles: true, cancelable: true}, //TouchEvent
            touchstart: {bubbles: true, cancelable: true}, //TouchEvent
            unload: {bubbles: false, cancelable: false}, //DOM2, DOM3
            visibilitychange: {
                bubbles: true,
                cancelable: false,
                type: (typeof document !== "undefined")
                    ? (typeof document.msHidden !== "undefined")
                        ? "msvisibilitychange"
                        : (typeof document.webkitHidden !== "undefined")
                            ? "webkitvisibilitychange"
                            : undefined
                    : undefined
            }, //DOM2, DOM3
            webkitvisibilitychange: {
                bubbles: true,
                cancelable: false,
                type: "visibilitychange"
            },
            msvisibilitychange: {
                bubbles: true,
                cancelable: false,
                type: "visibilitychange"
            }, //DOM2, DOM3
            wheel: {bubbles: true, cancelable: true}, //DOM3
            pointerdown: {bubbles: true, cancelable: true}, //PointerEvent
            pointerup: {bubbles: true, cancelable: true}, //PointerEvent
            pointerenter: {bubbles: false, cancelable: true}, //PointerEvent
            pointercancel: {bubbles: true, cancelable: true}, //PointerEvent
            pointerout: {bubbles: true, cancelable: true}, //PointerEvent
            pointerover: {bubbles: true, cancelable: true}, //PointerEvent
            pointerleave: {bubbles: false, cancelable: true}, //PointerEvent
            pointermove: {bubbles: true, cancelable: true}, //PointerEvent
            MSPointerDown: {bubbles: true, cancelable: true}, //MSPointerEvent
            MSPointerMove: {bubbles: true, cancelable: true}, //PointerEvent
            MSPointerUp: {bubbles: true, cancelable: true}, //MSPointerEvent
            MSPointerOver: {bubbles: true, cancelable: true}, //MSPointerEvent
            MSPointerOut: {bubbles: true, cancelable: true}, //MSPointerEvent
            MSPointerHover: {bubbles: true, cancelable: true}//MSPointerEvent

        }
    },

    /**
     * @private
     */
    _DOMPasteboardElement: {
        value: null,
        enumerable: false
    },

    /**
     * @property {string} value
     * @private
     */
    _delegate: {
        value: null,
        enumerable: false
    },

    /**
     * @returns {string}
     * @param {string}
     * @default null
     */
    delegate: {
        enumerable: false,
        get: function () {
            return this._delegate;
        },
        set: function (delegate) {
            this._delegate = delegate;
        }
    },

    /**
     * @property {Application} value
     * @private
     */
    _application: {
        value: null,
        enumerable: false
    },

    /**
     * The application object associated with the event manager.
     * @returns {Application}
     * @param {Application}
     * @default null
     *
     * @todo if this changes...we probably need to unregister all the windows
     * we know about and frankly probably the components too
     */
    application: {
        enumerable: false,
        get: function () {
            return this._application;
        },
        set: function (application) {
            this._application = application;
            //To avoid circular depenencies, we set it on environment
            this.environment.application = application;
        }
    },

    // Dictionary keyed by event types with the collection of handlers per event type
    // This dictates why the event manager observes events of a particular type

    /**
     * All windows this event Manager may be listening to
     *
     * @property {Array} value
     * @private
     */
    _registeredWindows: {
        value: null,
        enumerable: false
    },

    /**
     * @property {Object} value
     * @private
     */
    _windowsAwaitingFinalRegistration: {
        value: (new WeakMap),
        enumerable: false
    },

    // Initialization

    /**
     * @function
     * @param {external:window} aWindow
     * @returns {EventManager}
     */
    initWithWindow: {
        enumerable: false,
        value: function (aWindow) {
            if (!!this._registeredWindows) {
                throw "EventManager has already been initialized";
            }

            // TODO do we also complain if no window is given?
            // Technically we don't need one until we start listening for events
            this.registerWindow(aWindow);
            return this;
        }
    },
    /**
     * @function
     * @param {external:window} aWindow
     */
    registerWindow: {
        enumerable: false,
        value: function (aWindow) {

            if (aWindow.defaultEventManager && aWindow.defaultEventManager !== this) {
                throw Error("EventManager cannot register a window already registered to another EventManager");
            }

            if (this._registeredWindows && this._registeredWindows.indexOf(aWindow) >= 0) {
                throw new Error("EventManager cannot register a window more than once");
            }

            if (!this._registeredWindows) {
                this._registeredWindows = [];
            }

            if (this._windowsAwaitingFinalRegistration.has(aWindow)) {
                return;
            }

            // Setup the window as much as possible now without knowing whether
            // the DOM is ready or not

            // Keep a reference to the original listener functions

            // Note I think it may be implementation specific how these are implemented
            // so I'd rather preserve any native optimizations a browser has for
            // adding listeners to the document versus and element etc.
            if (aWindow.EventTarget) {
                aWindow.EventTarget.prototype.nativeAddEventListener = aWindow.EventTarget.prototype.addEventListener;
            }

            aWindow.Element.prototype.nativeAddEventListener = aWindow.Element.prototype.addEventListener;
            Object.defineProperty(aWindow, "nativeAddEventListener", {
                configurable: true,
                value: aWindow.addEventListener
            });

            aWindow.document.nativeAddEventListener = aWindow.document.addEventListener;
            aWindow.XMLHttpRequest.prototype.nativeAddEventListener = aWindow.XMLHttpRequest.prototype.addEventListener;

            if (aWindow.DocumentFragment) {
                aWindow.DocumentFragment.prototype.nativeAddEventListener = aWindow.DocumentFragment.prototype.addEventListener;
            }

            if (aWindow.ShadowRoot) {
                aWindow.ShadowRoot.prototype.nativeAddEventListener = aWindow.ShadowRoot.prototype.addEventListener;
            }

            if (aWindow.Worker) {
                aWindow.Worker.prototype.nativeAddEventListener = aWindow.Worker.prototype.addEventListener;
            }
            if (aWindow.MediaController) {
                aWindow.MediaController.prototype.nativeAddEventListener = aWindow.MediaController.prototype.addEventListener;
            }

            if (aWindow.EventTarget) {
                aWindow.EventTarget.prototype.nativeRemoveEventListener = aWindow.EventTarget.prototype.removeEventListener;
            }
            aWindow.Element.prototype.nativeRemoveEventListener = aWindow.Element.prototype.removeEventListener;
            Object.defineProperty(aWindow, "nativeRemoveEventListener", {
                configurable: true,
                value: aWindow.removeEventListener
            });

            aWindow.document.nativeRemoveEventListener = aWindow.document.removeEventListener;
            aWindow.XMLHttpRequest.prototype.nativeRemoveEventListener = aWindow.XMLHttpRequest.prototype.removeEventListener;

            if (aWindow.DocumentFragment) {
                aWindow.DocumentFragment.prototype.nativeRemoveEventListener = aWindow.DocumentFragment.prototype.removeEventListener;
            }

            if (aWindow.ShadowRoot) {
                aWindow.ShadowRoot.prototype.nativeRemoveEventListener = aWindow.ShadowRoot.prototype.removeEventListener;
            }

            if (aWindow.Worker) {
                aWindow.Worker.prototype.nativeRemoveEventListener = aWindow.Worker.prototype.removeEventListener;
            }
            if (aWindow.MediaController) {
                aWindow.MediaController.prototype.nativeRemoveEventListener = aWindow.MediaController.prototype.removeEventListener;
            }

            // Redefine listener functions
            Object.defineProperty(aWindow, "addEventListener", {
                configurable: true,
                value: (aWindow.XMLHttpRequest.prototype.addEventListener =
                    aWindow.Element.prototype.addEventListener =
                        aWindow.document.addEventListener =
                            function addEventListener(eventType, listener, optionsOrUseCapture) {
                                //this.nativeAddEventListener(eventType, listener, optionsOrUseCapture);
                                aWindow.defaultEventManager.registerTargetEventListener(this, eventType, listener, optionsOrUseCapture);
                            })
            });
            if (aWindow.EventTarget) {
                aWindow.EventTarget.prototype.addEventListener = aWindow.addEventListener;
            }

            if (aWindow.Worker) {
                aWindow.Worker.prototype.addEventListener = aWindow.addEventListener;
            }
            if (aWindow.MediaController) {
                aWindow.MediaController.prototype.addEventListener = aWindow.addEventListener;
            }

            Object.defineProperty(aWindow, "removeEventListener", {
                configurable: true,
                value: (
                    aWindow.XMLHttpRequest.prototype.removeEventListener =
                    aWindow.Element.prototype.removeEventListener =
                        aWindow.document.removeEventListener =
                            function removeEventListener(eventType, listener, optionsOrUseCapture) {
                                //this.nativeRemoveEventListener(eventType, listener, optionsOrUseCapture);
                                if(aWindow.defaultEventManager) {
                                    return aWindow.defaultEventManager.unregisterTargetEventListener(this, eventType, listener, optionsOrUseCapture);
                                }
                            })
            });

            if (aWindow.EventTarget) {
                aWindow.EventTarget.prototype.removeEventListener = aWindow.removeEventListener;
            }

            if (aWindow.Worker) {
                aWindow.Worker.prototype.removeEventListener = aWindow.removeEventListener;
            }
            if (aWindow.MediaController) {
                aWindow.MediaController.prototype.removeEventListener = aWindow.removeEventListener;
            }

            // In some browsers (Firefox) each element has their own addEventLister/removeEventListener
            // Methodology to find all elements found in Chainvas (now mostly gone from this)
            if (aWindow.HTMLDivElement.prototype.addEventListener !== aWindow.Element.prototype.nativeAddEventListener) {
                if (aWindow.HTMLElement &&
                    'addEventListener' in aWindow.HTMLElement.prototype
                ) {
                    var candidates = Object.getOwnPropertyNames(aWindow),
                        candidate, candidatePrototype,
                        i = 0, candidatesLength = candidates.length;
                    for (i; i < candidatesLength; i++) {
                        candidate = candidates[i];
                        if (candidate.match(/^HTML\w*Element$/) && typeof candidate === "function") {
                            candidatePrototype = candidate.prototype;
                            candidatePrototype.nativeAddEventListener = candidatePrototype.addEventListener;
                            candidatePrototype.addEventListener = aWindow.Element.prototype.addEventListener;
                            candidatePrototype.nativeRemoveEventListener = candidatePrototype.removeEventListener;
                            candidatePrototype.removeEventListener = aWindow.Element.prototype.removeEventListener;
                        }
                    }
                }
            }

            /**
             * The component instance directly associated with the specified element.
             *
             * @member external:Element#component
             */
            Montage.defineProperty(aWindow.Element.prototype, "component", {
                get: function () {
                    return defaultEventManager._elementEventHandlerByElement.get(this);
                },
                enumerable: false
            });

            /**
             * @namespace EventManager
             * @instance
             * @global
             */
            defaultEventManager = aWindow.defaultEventManager = exports.defaultEventManager = this;
            this._registeredWindows.push(aWindow);

            this._windowsAwaitingFinalRegistration.set(aWindow,aWindow);

            // Some registration demands the window's dom be accessible
            // only finalize registration when that's true
            if (/loaded|complete|interactive/.test(aWindow.document.readyState)) {
                this._finalizeWindowRegistration(aWindow);
            } else {
                aWindow.document.addEventListener("DOMContentLoaded", this, true);
            }



            this._evaluateShouldDispatchEventCondition();


        }
    },

    _finalizeWindowRegistration: {
        enumerable: false,
        value: function (aWindow) {

            if (!this._windowsAwaitingFinalRegistration.has(aWindow)) {
                throw "EventManager wasn't expecting to register this window";
            }

            this._windowsAwaitingFinalRegistration.delete(aWindow);

            this._listenToWindow(aWindow);
            // TODO uninstall DOMContentLoaded listener if all windows finalized
        }
    },
    /**
     * @function
     * @param {external:window} aWindow
     */
    unregisterWindow: {
        enumerable: false,
        value: function (aWindow) {
            if (this._registeredWindows.indexOf(aWindow) < 0) {
                throw "EventManager cannot unregister an unregistered window";
            }

            this._registeredWindows = this._registeredWindows.filter(function (element) {
                return (aWindow !== element);
            });

            delete aWindow.defaultEventManager;

            // Restore existing listener functions
            if (aWindow.EventTarget) {
                aWindow.EventTarget.prototype.addEventListener = aWindow.EventTarget.prototype.nativeAddEventListener;
            }
            aWindow.Element.prototype.addEventListener = aWindow.Element.prototype.nativeAddEventListener;
            Object.defineProperty(aWindow, "addEventListener", {
                configurable: true,
                value: aWindow.nativeAddEventListener
            });

            aWindow.document.addEventListener = aWindow.document.nativeAddEventListener;
            aWindow.XMLHttpRequest.prototype.addEventListener = aWindow.XMLHttpRequest.prototype.nativeAddEventListener;
            if (aWindow.Worker) {
                aWindow.Worker.prototype.addEventListener = aWindow.Worker.prototype.nativeAddEventListener;
            }

            if (aWindow.EventTarget) {
                aWindow.EventTarget.prototype.removeEventListener = aWindow.EventTarget.prototype.nativeRemoveEventListener;
            }

            aWindow.Element.prototype.removeEventListener = aWindow.Element.prototype.nativeRemoveEventListener;
            Object.defineProperty(aWindow, "removeEventListener", {
                configurable: true,
                value: aWindow.nativeRemoveEventListener
            });

            aWindow.document.removeEventListener = aWindow.document.nativeRemoveEventListener;
            aWindow.XMLHttpRequest.prototype.removeEventListener = aWindow.XMLHttpRequest.prototype.nativeRemoveEventListener;
            if (aWindow.Worker) {
                aWindow.Worker.prototype.removeEventListener = aWindow.Worker.prototype.nativeRemoveEventListener;
            }

            // In some browsers (Firefox) each element has their own addEventLister/removeEventListener
            // Methodology to find all elements found in Chainvas
            if (aWindow.HTMLDivElement.prototype.nativeAddEventListener !== aWindow.Element.prototype.addEventListener) {
                if (aWindow.HTMLElement &&
                    'addEventListener' in aWindow.HTMLElement.prototype &&
                    aWindow.Components &&
                    aWindow.Components.interfaces
                ) {
                    var candidate, candidatePrototype;

                    for (candidate in Components.interfaces) {
                        if (candidate.match(/^nsIDOMHTML\w*Element$/)) {
                            candidate = candidate.replace(/^nsIDOM/, '');
                            if ((candidate = window[candidate])) {
                                candidatePrototype = candidate.prototype;
                                candidatePrototype.addEventListener = candidatePrototype.nativeAddEventListener;
                                delete candidatePrototype.nativeAddEventListener;
                                candidatePrototype.removeEventListener = candidatePrototype.nativeRemoveEventListener;
                                delete candidatePrototype.nativeRemoveEventListener;
                            }
                        }
                    }
                }
            }

            // Delete our references
            if (aWindow.EventTarget) {
                delete aWindow.EventTarget.prototype.nativeAddEventListener;
            }

            delete aWindow.Element.prototype.nativeAddEventListener;
            delete aWindow.nativeAddEventListener;

            delete aWindow.document.nativeAddEventListener;
            delete aWindow.XMLHttpRequest.prototype.nativeAddEventListener;
            if (aWindow.Worker) {
                delete aWindow.Worker.prototype.nativeAddEventListener;
            }

            if (aWindow.EventTarget) {
                delete aWindow.EventTarget.prototype.nativeRemoveEventListener;
            }
            delete aWindow.Element.prototype.nativeRemoveEventListener;
            delete aWindow.nativeRemoveEventListener;

            delete aWindow.document.nativeRemoveEventListener;
            delete aWindow.XMLHttpRequest.prototype.nativeRemoveEventListener;
            if (aWindow.Worker) {
                delete aWindow.Worker.prototype.nativeRemoveEventListener;
            }

            delete aWindow.Element.prototype.component;

            this._stopListeningToWindow(aWindow);
        }
    },

    /**
     * @function
     */
    unregisterWindows: {
        enumerable: false,
        value: function () {
            this._registeredWindows.forEach(this.unregisterWindow);
        }
    },

    // Event Handler Registration

    /**
     * Registered event listeners.
     *
     * @example
     * ```json         * ```
     *
     * @property {Listeners} value
     * @default {}
     */
    registeredEventListeners: {
        enumerable: false,
        value: {}
    },

    /**
     * Returns a dictionary of all listeners registered for the specified eventType,
     * regardless of the target being observed.
     *
     * @function
     * @param {Event} eventType The event type.
     * @returns null || listeners
     */
    // registeredEventListenersForEventType_: {
    //     value: function (eventType) {
    //         var captureRegistration = this._registeredCaptureEventListeners.get(eventType),
    //             bubbleRegistration = this._registeredBubbleEventListeners.get(eventType),
    //             result = null;

    //         if (captureRegistration) {
    //             captureRegistration.forEach(function(listeners, target, map) {
    //                 if (listeners && listeners.length > 0) {
    //                     result = result || [];
    //                     listeners.forEach(function(aListener) {
    //                         result.push(aListener);
    //                     });
    //                 }
    //             });
    //         }

    //         if (bubbleRegistration) {
    //             bubbleRegistration.forEach(function(listeners, target, map) {
    //                 if (listeners && listeners.length > 0) {
    //                     result = result || [];
    //                     listeners.forEach(function(aListener) {
    //                         result.push(aListener);
    //                     });
    //                 }
    //             });
    //         }

    //         return result;
    //     }
    // },

    registeredEventListenersForEventType_: {
        value: function (eventType) {
            var result = null,
                self = this;
            this._targetEventListeners.forEach(function(targetEntry/*value*/, target/*key*/, map) {

                    var forEachResult = self.registeredEventListenersForEventType_onTarget_(eventType, target);
                    if(forEachResult) {
                        if(!Array.isArray(forEachResult)) {
                            (result || (result = [])).push(forEachResult);
                        } else {
                            Array.prototype.push.apply((result || (result = [])), forEachResult);
                        }
                    }

            });
            return result;
        }
    },



    /**
     * Returns the list of all listeners registered for
     * the specified eventType on the specified target, regardless of the phase.
     *
     * @function
     * @param {Event} eventType - The event type.
     * @param {Event} target - The event target.
     * @returns {?ActionEventListener}
     */
    // registeredEventListenersForEventType_onTarget_: {
    //     enumerable: false,
    //     value: function (eventType, target) {

    //         var captureRegistration = this._registeredCaptureEventListeners.get(eventType),
    //             bubbleRegistration = this._registeredBubbleEventListeners.get(eventType),
    //             listeners,
    //             result = null;

    //         if (!eventType || !target || (!captureRegistration && !bubbleRegistration)) {
    //             return null;
    //         } else {
    //             listeners = captureRegistration ? captureRegistration.get(target) : null;
    //             if (listeners) {
    //                 if (!result) {
    //                     result = listeners;
    //                 }
    //             }
    //             listeners = bubbleRegistration ? bubbleRegistration.get(target) : null;
    //             if (listeners) {
    //                 if (!result) {
    //                     result = listeners;
    //                 } else {
    //                     result = result.union(listeners);
    //                 }
    //             }
    //             return result;
    //         }
    //     }
    // },

    registeredEventListenersForEventType_onTarget_: {
        enumerable: false,
        value: function (eventType, target) {
            if (!eventType || !target) {
                return null;
            }

            var targetEntry = this._targetEventListeners.get(target),
            targetEntryForEventType = targetEntry && targetEntry.get(eventType),
            captureListenerEntries = targetEntryForEventType && targetEntryForEventType.get(Event_CAPTURING_PHASE),
            bubbleListenerEntries = targetEntryForEventType && targetEntryForEventType.get(Event_BUBBLING_PHASE),
            result = null;

            if(captureListenerEntries || bubbleListenerEntries) {
                if(captureListenerEntries) {
                    if(!Array.isArray(captureListenerEntries)) {
                        result = captureListenerEntries.listener;
                    }
                    else {
                        result = [];
                        Array.prototype.push.apply(result, captureListenerEntries.map(this._listenerEntryListenerMapper));
                    }
                }
                if(bubbleListenerEntries) {
                    if(!Array.isArray(bubbleListenerEntries)) {
                        if(!result) {
                            result = bubbleListenerEntries.listener;
                        } else if(!Array.isArray(result)) {
                            result = [result,bubbleListenerEntries.listener]
                        } else {
                            result.push(bubbleListenerEntries.listener)
                        }
                    }
                    else {
                        if(!result) {
                            result = [];
                        }
                        Array.prototype.push.apply(result, bubbleListenerEntries.map(this._listenerEntryListenerMapper));
                    }
                }
            }

            return result;
        }
    },
    _listenerEntryListenerMapper: {
        value: function(listenerEntry) {
            return listenerEntry.listener;
        }
    },

    /**
     * Returns all listeners registered for
     * the specified eventType on the specified target and specified phase.
     *
     * @function
     * @param {Event} eventType - The event type.
     * @param {Event} target - The event target.
     * @returns {?ActionEventListener}
     */
    // registeredEventListenersForEventType_onTarget_phase_: {
    //     enumerable: false,
    //     value: function (eventType, target, capture) {
    //         if (!target) {
    //             return null;
    //         }
    //         return this._registeredEventListenersForEventType_onTarget_registeredEventListeners_(eventType, target, (capture ? this._registeredCaptureEventListeners : this._registeredBubbleEventListeners));
    //     }
    // },
    registeredEventListenersForEventType_onTarget_phase_: {
        enumerable: false,
        value: function (eventType, target, capture) {
            if (!target) {
                return null;
            }
            return this._registeredEventListenersOnTarget_eventType_eventPhase(target, eventType,  (capture ? Event_CAPTURING_PHASE : Event_BUBBLING_PHASE));
        }
    },

    _registeredEventListenersForEventType_onTarget_registeredEventListeners_: {
        value: function (eventType, target, registeredEventListeners) {

            // 0.02224230716159459 on Samsung Galaxy Tab3 7"
            var result = registeredEventListeners.get(eventType);
            return result ? result.get(target) : null;
        },
        enumerable: false
    },

    _registeredEventListenersOnTarget_eventType_eventPhase: {
        value: function (target, eventType, eventPhase) {

            var targetEntry = this._targetEventListeners.get(target),
            targetEntryForEventType = targetEntry ? targetEntry.get(eventType) : null,
            targetEntryForEventTypeListeners = targetEntryForEventType
            ? eventPhase === Event_CAPTURING_PHASE
                ? targetEntryForEventType.get(Event_CAPTURING_PHASE)
                : targetEntryForEventType.get(Event_BUBBLING_PHASE)
            : null;

            return targetEntryForEventTypeListeners || null;
        },
        enumerable: false
    },


    /**
     * Returns the dictionary of all listeners registered on
     * the specified target, keyed by eventType.
     *
     * @function
     * @param {Event} target The event target.
     * @returns observedEventListeners
     */
    registeredEventListenersOnTarget_: {
        value: function (target) {

            var eventType,
                eventRegistration,
                _registeredCaptureEventListeners = this._registeredCaptureEventListeners,
                _registeredBubbleEventListeners = this._registeredBubbleEventListeners,
                observedEventListeners = [],
                mapIter;

            mapIter = _registeredCaptureEventListeners.keys();
            while ((eventType = mapIter.next().value)) {
                eventRegistration = _registeredCaptureEventListeners.get(eventType);
                if (eventRegistration.has(target)) {
                    observedEventListeners.push(eventType);
                }
            }

            mapIter = _registeredBubbleEventListeners.keys();
            while ((eventType = mapIter.next().value)) {
                eventRegistration = _registeredBubbleEventListeners.get(eventType);
                if (eventRegistration.has(target)) {
                    observedEventListeners.push(eventType);
                }
            }


            return observedEventListeners;
        }
    },

    /**
     * This adds the listener to the definitive collection of
     * what targets are being observed for what eventTypes by whom and in what phases.
     * This collection maintained by the EventManager is used throughout
     * the discovery and distribution steps of the event handling system.
     *
     * @function
     * @param {Event} target - The event target.
     * @param {Event} eventType - The event type.
     * @param {Event} listener - The event listener.
     * @param {Event} useCapture - The event capture.
     * @returns returnResult
     */
     _registeredCaptureEventListeners: {
       value:null
    },

    _registeredBubbleEventListeners: {
      value:null
    },

    _indexOfRegisteredListener: {
        enumerable: false,
        value: function indexOfRegisteredListener(targetEntryForEventTypeListeners, listener, listenerEntry) {
            var i=0, countI = targetEntryForEventTypeListeners.length;

            if(listenerEntry) {

                for(;i<countI;i++) {
                    if(targetEntryForEventTypeListeners[i] === listenerEntry) return i;
                }

            } else {

                for(;i<countI;i++) {
                    if(targetEntryForEventTypeListeners[i].listener === listener) return i;
                }

            }
            return -1;
        }
    },

   registerTargetEventListener: {
        enumerable: false,
        value: function registerTargetEventListener(target, eventType, listener, optionsOrUseCapture) {
            var listenerOptions = typeof optionsOrUseCapture === "object" ? optionsOrUseCapture : {capture: !!optionsOrUseCapture},
                targetEntry = this._targetEventListeners.get(target) || (this._targetEventListeners.set(target, (targetEntry = new Map())) && targetEntry),
                targetEntryForEventType = targetEntry.get(eventType) || (targetEntry.set(eventType, (targetEntryForEventType = new Map())) && targetEntryForEventType),
                isNewTarget = false,
                //For the first listener and for perf optimization we don't create an array. We do that starting with the second listener, unless for some reason the listener is an Array??
                targetEntryForEventTypeListeners = listenerOptions.capture
                    ? targetEntryForEventType.get(Event_CAPTURING_PHASE) || (targetEntryForEventType.set(Event_CAPTURING_PHASE, (targetEntryForEventTypeListeners = Array.isArray(listenerOptions) ? [listenerOptions] : listenerOptions)) && targetEntryForEventTypeListeners)
                    : targetEntryForEventType.get(Event_BUBBLING_PHASE) || (targetEntryForEventType.set(Event_BUBBLING_PHASE, (targetEntryForEventTypeListeners = Array.isArray(listenerOptions) ? [listenerOptions] : listenerOptions)) && targetEntryForEventTypeListeners);

            // if(eventType === "pointerdown" || eventType === "pointerup" || eventType.indexOf("press") !== -1) {
                if(typeof optionsOrUseCapture === "object") {

                    if(optionsOrUseCapture.passive) {
                        // console.log(target,"registerTargetEventListener "+eventType," listener:",listener, "optionsOrUseCapture:",optionsOrUseCapture);
                    }
                    //trigger passive:
                    optionsOrUseCapture.passive;

                }
                // else {
                //     console.log(target.toString(),"registerTargetEventListener "+eventType);

                // }
            // }

            listenerOptions.listener = listener;

            if(targetEntryForEventTypeListeners) {
                if(Array.isArray(targetEntryForEventTypeListeners)) {
                    if(Array.isArray(listener) && targetEntryForEventTypeListeners.length === 1) {
                        isNewTarget = true;
                    }
                    if(this._indexOfRegisteredListener(targetEntryForEventTypeListeners,listener) === -1) {
                        //We need to make sure we don't add it twice:
                        targetEntryForEventTypeListeners.push(listenerOptions);
                    }
                } else if(targetEntryForEventTypeListeners.listener !== listener) {
                    targetEntryForEventType.set(listenerOptions.capture ? Event_CAPTURING_PHASE : Event_BUBBLING_PHASE,[targetEntryForEventTypeListeners, listenerOptions]);
                } else {
                    isNewTarget = true;
                }
            }
            //console.log("targetEntryForEventType",targetEntryForEventType);

            //We'll check/cache the callbacks when we first dispatch

            if (isNewTarget && typeof target.nativeAddEventListener === "function") {
            //if (targetEntryForEventType.size === 1 && typeof target.nativeAddEventListener === "function") {
                    this._observeTarget_forEventType_(target, eventType, listenerOptions);
            }
        }
    },

    unregisterTargetEventListener: {
        enumerable: false,
        value: function unregisterTargetEventListener(target, eventType, listener, optionsOrUseCapture) {
            // if(typeof optionsOrUseCapture === "object") {
            //     console.log(target,"unregisterTargetEventListener "+eventType," listener:",listener, "optionsOrUseCapture:",optionsOrUseCapture);
            // }

            var listenerOptions = typeof optionsOrUseCapture === "object" ? optionsOrUseCapture : {capture: !!optionsOrUseCapture},
                targetEntry = this._targetEventListeners.get(target),
                targetEntryForEventType = targetEntry ? targetEntry.get(eventType) : null,
                targetEntryForEventTypeListeners = targetEntryForEventType
                ? listenerOptions.capture
                    ? targetEntryForEventType.get(Event_CAPTURING_PHASE)
                    : targetEntryForEventType.get(Event_BUBBLING_PHASE)
                : null,
                targetEntryForEventTypeOtherPhaseListeners = targetEntryForEventType
                ? listenerOptions.capture
                    ? targetEntryForEventType.get(Event_BUBBLING_PHASE)
                    : targetEntryForEventType.get(Event_CAPTURING_PHASE)
                : null,
                /* Only if options is passed as an array car we safely assume it's the objects we stored and keep track on, which helps us find it faster */
                registeredListenerRecordIndex = Array.isArray(targetEntryForEventTypeListeners)
                    ? this._indexOfRegisteredListener(targetEntryForEventTypeListeners,listener, (optionsOrUseCapture === listenerOptions ? listenerOptions : null))
                    : -1;

            if(registeredListenerRecordIndex !== -1) {
                if (this._currentDispatchedTargetListeners.has(targetEntryForEventTypeListeners)) {
                    var indexes = this._currentDispatchedTargetListeners.get(targetEntryForEventTypeListeners);
                    if (!indexes) {
                        this._currentDispatchedTargetListeners.set(targetEntryForEventTypeListeners,(indexes = []));
                    }
                    indexes.push(registeredListenerRecordIndex);

                } else {
                    this.spliceOne(targetEntryForEventTypeListeners,registeredListenerRecordIndex);
                }
                //If it's empty after, we remove
                if(targetEntryForEventTypeListeners.length === 0) {
                    listenerOptions.capture
                    ? targetEntryForEventType.delete(Event_CAPTURING_PHASE)
                    : targetEntryForEventType.delete(Event_BUBBLING_PHASE)
                }

            } else if(targetEntryForEventTypeListeners) {
                //We have only one listener, we remove the whole entry
                listenerOptions.capture
                ? targetEntryForEventType.delete(Event_CAPTURING_PHASE)
                : targetEntryForEventType.delete(Event_BUBBLING_PHASE)
            }

            this._stopObservingTargeForEventTypeIfNeeded(target, eventType, targetEntryForEventType);
            // if(targetEntryForEventType && !targetEntryForEventType.get(Event_CAPTURING_PHASE) && !targetEntryForEventType.get(Event_BUBBLING_PHASE)) {
            //     // If no targets for this eventType; stop observing this event
            //     this._stopObservingTarget_forEventType_(target, eventType);
            // }
        }
    },

    _stopObservingTargeForEventTypeIfNeeded: {
        value: function(target, eventType, _targetEntryForEventType) {
            var targetEntry,
                targetEntryForEventType = _targetEntryForEventType || ((targetEntry = this._targetEventListeners.get(target)) ? targetEntry.get(eventType) : null);

                if(targetEntryForEventType && !targetEntryForEventType.get(Event_CAPTURING_PHASE) && !targetEntryForEventType.get(Event_BUBBLING_PHASE)) {
                    // If no targets for this eventType; stop observing this event
                    this._stopObservingTarget_forEventType_(target, eventType);
                }

        }
    },

    registerEventListener: {
         enumerable: false,
         value: function registerEventListener(target, eventType, listener, optionsOrUseCapture) {
             var capture = typeof  optionsOrUseCapture === "object" ? optionsOrUseCapture.capture : !!optionsOrUseCapture;
             this._registerEventListener(target, eventType, listener, capture ? this._registeredCaptureEventListeners : this._registeredBubbleEventListeners);
        }
    },
    _registerEventListener: {
        enumerable: false,
        value: function _registerEventListener(target, eventType, listener, registeredEventListeners) {
            var eventTypeRegistration = registeredEventListeners.get(eventType),
                isNewTarget = false,
                returnResult = false,
                listeners;

            if (!eventTypeRegistration) {
                // First time this eventType has been requested
                registeredEventListeners.set(eventType, (eventTypeRegistration = new Map()));
                // listeners = [listener];
                // eventTypeRegistration.set(target,listeners);
                eventTypeRegistration.set(target,listener);

                isNewTarget = true;
                returnResult = true;
            } else {

                // Or, the event type was already observed; install this new listener (or at least any new parts)
                if (!eventTypeRegistration.has(target)) {
                    // listeners = [];
                    // eventTypeRegistration.set(target,listeners);
                    eventTypeRegistration.set(target,listener);

                    isNewTarget = true;
                }
                else {
                  listeners = eventTypeRegistration.get(target);
                  if (Array.isArray(listeners)) {
                      if (listeners.indexOf(listener) !== -1) {
                          returnResult = true;
                      } else {
                          listeners.push(listener);
                          returnResult = true;
                      }
                  } else {
                      if (listeners !== listener) {
                          listeners = [listeners,listener];
                          eventTypeRegistration.set(target,listeners);
                      }

                      returnResult = true;
                  }
                }
            }

            if (isNewTarget && typeof target.nativeAddEventListener === "function") {
                this._observeTarget_forEventType_(target, eventType);
            }

            return returnResult;
        }
    },
    /**
     * This unregisters the listener.
     *
     * @function
     * @param {Event} target - The event target.
     * @param {Event} eventType - The event type.
     * @param {Event} listener - The event listener.
     * @param {Event} useCapture - The event capture.
     */
     unregisterEventListener: {
         enumerable: false,
         value: function unregisterEventListener(target, eventType, listener, useCapture) {
             //console.log("EventManager.unregisterEventListener", target, eventType, listener, useCapture);

             return useCapture ?
                this._unregisterEventListener(target, eventType, listener, this._registeredCaptureEventListeners, this._registeredBubbleEventListeners) :
                    this._unregisterEventListener(target, eventType, listener, this._registeredBubbleEventListeners, this._registeredCaptureEventListeners);
        }
    },
    _unregisterEventListener: {
        enumerable: false,
        value: function _unregisterEventListener (target, eventType, listener, registeredEventListeners, otherPhaseRegisteredEventListeners) {


            var eventTypeRegistration = registeredEventListeners.get(eventType),
                listeners,
                map;

            if (!eventTypeRegistration) {
                // this eventType wasn't being observed at all
                return;
            }

            // the event type was observed; see if the target was registered
            listeners = eventTypeRegistration.get(target);
            if (!listeners) {
                return;
            }

            // the target was being observed for this eventType; see if the specified listener was registered
            if (listeners === listener) {
                eventTypeRegistration.set(target,null);
                this._unregisterTargetForEventTypeIfNeeded(target, eventType, listeners, registeredEventListeners, otherPhaseRegisteredEventListeners);
                return;
            }
            else if (Array.isArray(listeners)) {
                if (listeners.indexOf(listener) === -1) {
                    return;
                }
                if (this._currentDispatchedTargetListeners.has(listeners)) {
                    map = this._currentDispatchedTargetListeners.get(listeners);
                    if (!map) {
                        this._currentDispatchedTargetListeners.set(listeners,(map = new Map()));
                    }
                    map.set(listener,true);

                } else {
                    this.spliceOne(listeners,listeners.indexOf(listener));
                    // Done unregistering the listener for the specified phase
                    // Now see if we need to remove any registrations as a result of that
                    this._unregisterTargetForEventTypeIfNeeded(target, eventType, listeners, registeredEventListeners, otherPhaseRegisteredEventListeners);

                }
            }
            else {
            //There's only one listener and it's no this one.
                return;
            }

            // console.log("EventManager.unregisteredEventListener", this.registeredEventListeners)
        }
    },
    _unregisterTargetForEventTypeIfNeeded: {
        value: function(target, eventType, listeners, registeredEventListeners, otherPhaseRegisteredEventListeners) {
            if (!Array.isArray(listeners) || listeners.length === 0) {
                var eventTypeRegistration = registeredEventListeners.get(eventType),
                    otherPhaseEventTypeRegistration = otherPhaseRegisteredEventListeners.get(eventType);

                eventTypeRegistration.delete(target);

                if (eventTypeRegistration.size === 0 && (!otherPhaseEventTypeRegistration || (otherPhaseEventTypeRegistration && otherPhaseEventTypeRegistration.size === 0))) {
                    // If no targets for this eventType; stop observing this event
                    //delete registeredEventListeners[eventType];
                    this._stopObservingTarget_forEventType_(target, eventType);
                }
            }
        }
    },
    /**
     * Determines the actual target to observe given a target and an eventType.
     * This correctly decides whether to observe the element specified or
     * to observe some other element to leverage event delegation.
     * This should be consulted whenever starting or stopping the observation of
     * a target for a given eventType.
     *
     * @function
     * @param {Event} eventType
     * @param {Event} target
     * @returns null || target.screen ? target.document : target.ownerDocument
     */
    actualDOMTargetForEventTypeOnTarget: {
        value: function (eventType, target) {

            if (!target.nativeAddEventListener) {
                return null;
            } else {

                if (/*isDocument*/!!target.defaultView) {
                    return target;
                }

                var entry = this.eventDefinitions[eventType],
                    bubbles;

                // For events we know we can safely delegate to handling at a higher level, listen on the document
                // otherwise, be less surprising and listen on the specified target

                if (!entry) {
                    return target;
                }

                // TODO allow eventTypes to describe a preferred delegation target window|document|none etc.
                bubbles = (typeof entry.bubbles === "function") ? entry.bubbles(target) : entry.bubbles;

                if (bubbles) {
                    // TODO why on the document and not the window?
                    var shadowRoot;
                    return /* isWindow*/target.screen ? target.document :
                        (shadowRoot = this.shawdowRootFromNode(target)) ?
                            shadowRoot : target.ownerDocument;
                } else {
                    return target;
                }
            }
        }
    },

    shawdowRootFromNode: {
        value: function isInShadow(node) {
            if (window.ShadowRoot) {
                while (node) {
                    if (node.toString() === "[object ShadowRoot]") {
                        return node;
                    }
                    node = node.parentNode;
                }
            }
        }
    },

    /**
     * @private
     */
    _observedTarget_byEventType_: {value: null},

    // Individual Event Registration

    _passiveEvents: {
        enumerable: false,
        value: [
            /*
            // Disabled for flow
            'wheel',
            'mousewheel',
            'touchstart',
            'touchmove',
            */
            'scroll'
        ]
    },

    isPassiveEventType: {
        enumerable: false,
        value: function (eventType) {
            return this._passiveEvents.indexOf(eventType) !== -1;
        }
    },

    /**
     * @private
     */
    _observeTarget_forEventType_: {
        enumerable: false,
        value: function (target, eventType, listenerOptions) {

            var listenerTarget;

            if ((listenerTarget = this.actualDOMTargetForEventTypeOnTarget(eventType, target)) && (!this._observedTarget_byEventType_[eventType] || !this._observedTarget_byEventType_[eventType].has(listenerTarget))) {
                if (!this._observedTarget_byEventType_[eventType]) {
                    this._observedTarget_byEventType_[eventType] = new Map();
                }
                this._observedTarget_byEventType_[eventType].set(listenerTarget,this);

                var eventDefinition = this.eventDefinitions[eventType],
                    eventOpts;

                if(!eventDefinition) {
                    console.debug("Event type "+eventType+" missed definition");
                }

                eventOpts = this.isPassiveEventType(eventType)
                    ? {passive: true}
                    : eventDefinition
                        ? eventDefinition.bubbles
                        : true; //by default


                // eventOpts = {
                //     passive: this.isPassiveEventType(eventType),
                //     capture: true
                // }

                listenerTarget.nativeAddEventListener((eventDefinition ? (eventDefinition.type || eventType) : eventType), this, eventOpts);
            }
            // console.log("started listening: ", eventType, listenerTarget)
        }
    },

    /**
     * @private
     */
    _stopObservingTarget_forEventType_: {
        enumerable: false,
        value: function (target, eventType) {

            var listenerTarget = this.actualDOMTargetForEventTypeOnTarget(eventType, target),
                registeredTargetForActivation = this._registeredTargetForActivation.get(eventType);

            /*
                In registerTargetForActivation, we listen to event types that start an interaction cycle. If these were removed, it would create bugs as they wouldn't be dispatched by the event manager anymore. So we keep track of these in this._registeredTargetForActivation, and we check before removing the native event listener that this is not one of them.

                Some of these are instaled on window, so we add a check to see it's the documennt of that window. Ideally we wouldn't have to do that, but that requires thorough testing.
            */

            if (listenerTarget && (!registeredTargetForActivation || (registeredTargetForActivation && ((registeredTargetForActivation !== listenerTarget) && (registeredTargetForActivation.document !== listenerTarget)))) ) {
                this._observedTarget_byEventType_[eventType].delete(listenerTarget);
                listenerTarget.nativeRemoveEventListener(eventType, this, true);
            }
            // console.log("stopped listening: ", eventType, window)
        }
    },

    /**
     * @private
     */
    _activationHandler: {
        enumerable: true,
        value: null
    },

    // Toggle listening for EventManager

    /**
     * @private
     */
    _listenToWindow: {
        enumerable: false,
        value: function (aWindow) {

            // We use our own function to handle activation events so it's not inadvertently
            // removed as a listener when removing the last listener that may have also been observing
            // the same eventType of an activation event
            if (!this._activationHandler) {
                var eventManager = this;
                this._activationHandler = function _activationHandler(evt) {
                    var eventType = evt.type,
                        canBecomeActiveTarget = eventType !== "mouseenter" && eventType !== "pointerenter",
                        touchCount;

                    // Prepare any components associated with elements that may receive this event
                    // They need to registered there listeners before the next step, which is to find the components that
                    // observing for this type of event
                    if (evt.changedTouches) {
                        touchCount = evt.changedTouches.length;
                        for (var i = 0; i < touchCount; i++) {
                            eventManager._prepareComponentsForActivation(evt.changedTouches[i].target, canBecomeActiveTarget);
                        }
                    } else {
                        eventManager._prepareComponentsForActivation(evt.target, canBecomeActiveTarget);
                    }
                };
            }

            this.registerTargetForActivation(aWindow);

            if (this.application) {

                var applicationLevelEvents = this.registeredEventListenersOnTarget_(this.application),
                    eventType;

                for (eventType in applicationLevelEvents) {
                    if (applicationLevelEvents.hasOwnProperty(eventType)) {
                        this._observeTarget_forEventType_(aWindow, eventType);
                    }
                }
            }
        }
    },

    _registeredTargetForActivation: {
        value: new Map()
    },

    registerTargetForActivation: {
        value: function (target) {
            var _document = target instanceof Window ? target.document : target;
            // The EventManager needs to handle "gateway/pointer/activation events" that we
            // haven't let children listen for yet
            // when the EM handles them eventually it will need to allow
            // all components from the event target to the window to prepareForActivationEvents
            // before finding event handlers that were registered for these events
            if (window.PointerEvent) {
                target.nativeAddEventListener("pointerdown", this._activationHandler, true);
                this._registeredTargetForActivation.set("pointerdown", target);

                _document.nativeAddEventListener("pointerenter", this._activationHandler, true);
                this._registeredTargetForActivation.set("pointerenter", _document);


            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                target.nativeAddEventListener("MSPointerDown", this._activationHandler, true);
                this._registeredTargetForActivation.set("MSPointerDown", target);

                // IE10 has no support for pointerenter or pointerleave events.
                _document.nativeAddEventListener("mouseenter", this._activationHandler, true);
                this._registeredTargetForActivation.set("mouseenter", _document);

            } else {
                target.nativeAddEventListener("touchstart", this._activationHandler, true);
                this._registeredTargetForActivation.set("touchstart", target);

                target.nativeAddEventListener("mousedown", this._activationHandler, true);
                this._registeredTargetForActivation.set("mousedown", target);

                // mouseenter events are not dispatched from window under Chrome and Safari.
                _document.nativeAddEventListener("mouseenter", this._activationHandler, true);
                this._registeredTargetForActivation.set("mouseenter", _document);
            }

            target.nativeAddEventListener("focus", this._activationHandler, true);
            this._registeredTargetForActivation.set("focus", target);

            // Clicking on a label element with a for attribute pointing to an
            // input type radio or checkbox will check the input. In Chrome
            // this will fire a focus event in the input element, this focus
            // will call the _activationHandler, and that will allow a change
            // event to fire in the input. In Safari, at least in the version at
            // the time of writing this comment (15.5), the focus event is not
            // fired and that was causing the event manager to fail to fire the
            // expected change event. The following two lines fix the issue by
            // directly listening to the change event in the window to call
            // the _activationHandler:

            target.nativeAddEventListener("change", this._activationHandler, true);
            this._registeredTargetForActivation.set("change", target);

        }

    },

    /**
     * @private
     */
    _stopListeningToWindow: {
        enumerable: false,
        value: function (aWindow) {

            var applicationLevelEvents = this.registeredEventListenersOnTarget_(this.application),
                windowLevelEvents = this.registeredEventListenersOnTarget_(aWindow),
                eventType,
                index;

            for (eventType in applicationLevelEvents) {
                if (applicationLevelEvents.hasOwnProperty(eventType)) {
                    this._stopObservingTarget_forEventType_(aWindow, eventType);
                }
            }

            for (eventType in windowLevelEvents) {
                if (windowLevelEvents.hasOwnProperty(eventType)) {
                    this._stopObservingTarget_forEventType_(aWindow, eventType);
                }
            }

            if ((index = this._listeningWindowOnTouchCancel.indexOf(aWindow)) > -1) {
                this.spliceOne(this._listeningWindowOnTouchCancel,index);
                // the listener on 'touchCancel' has already been removed by the previous step.
            }
        }
    },

    /**
     * @function
     */
    // _resetRegisteredEventListeners: {
    //     enumerable: false,
    //     value: function (registeredEventListeners) {
    //         var i, l, target, eventType,
    //             eventRegistration,
    //             self = this;

    //         for (eventType in registeredEventListeners) {
    //             if (registeredEventListeners.hasOwnProperty(eventType)) {
    //                 eventRegistration = registeredEventListeners.get(eventType);

    //                 if (eventRegistration && eventRegistration.length > 0) {
    //                     for (i = 0, l = eventRegistration.length; i < l; i++) {
    //                         target = eventRegistration[i];
    //                         self._stopObservingTarget_forEventType_(target, eventType);
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // },

    reset: {
        enumerable: false,
        value: function () {
            // this._resetRegisteredEventListeners(this._registeredCaptureEventListeners);
            // this._resetRegisteredEventListeners(this._registeredBubbleEventListeners);

            self = this;
            this._targetEventListeners.forEach(function(targetEntry/*value*/, target/*key*/, map) {

                targetEntry.forEach(function(targetEntryForEventType/*value*/, eventType/*key*/, map) {
                    self._stopObservingTarget_forEventType_(target, eventType);
                });

            });


            // TODO for each component claiming a pointer, force them to surrender the pointer?
            this._claimedPointers = new Map();
            this._targetEventListeners = new Map();
            // this._registeredCaptureEventListeners = new Map();
            // this._registeredBubbleEventListeners = new Map();

        }
    },


    /**
     * @function
     */
    unload: {
        enumerable: false,
        value: function () {
            this._stopListening();
        }
    },
    _bubbleMethodNameByEventType_: {
        value: new Map()
    },
    _bubbleMethodNameByEventTypeIdentifier_: {
        value: new Map()
    },
    /**
     * @function
     */
    methodNameForBubblePhaseOfEventType: {
        enumerable: false,
        value: function methodNameForBubblePhaseOfEventType(eventType, identifier, capitalizedEventType, capitalizedIdentifier) {
            var eventTypeBucket;
            if (identifier) {
                eventTypeBucket = this._bubbleMethodNameByEventTypeIdentifier_.get(eventType) || (this._bubbleMethodNameByEventTypeIdentifier_.set(eventType, new Map())).get(eventType);
                return eventTypeBucket.get(identifier) || (eventTypeBucket.set(identifier, ("handle" + (capitalizedIdentifier || identifier.toCapitalized()) + (capitalizedEventType || eventType.toCapitalized())))).get(identifier);
            } else {
                return this._bubbleMethodNameByEventType_.get(eventType) || (this._bubbleMethodNameByEventType_.set(eventType, ("handle" + (capitalizedEventType || eventType.toCapitalized())))).get(eventType);
            }
        }
    },

    /**
     * @private
     */
    _captureMethodNameByEventType_: {
        value: new Map()
    },
    _catptureMethodNameByEventTypeIdentifier_: {
        value: new Map()
    },

    methodNameForCapturePhaseOfEventType: {
        enumerable: false,
        value: function methodNameForCapturePhaseOfEventType(eventType, identifier, capitalizedEventType, capitalizedIdentifier) {
            var eventTypeBucket;
            if (identifier) {
                eventTypeBucket = this._catptureMethodNameByEventTypeIdentifier_.get(eventType) || (this._catptureMethodNameByEventTypeIdentifier_.set(eventType,new Map())).get(eventType);
                return eventTypeBucket.get(identifier) || (eventTypeBucket.set(identifier,("capture" + (capitalizedIdentifier || identifier.toCapitalized()) + (capitalizedEventType || eventType.toCapitalized())))).get(identifier);
            } else {
                return this._captureMethodNameByEventType_.get(eventType) ||
                    (this._captureMethodNameByEventType_.set(eventType, ("capture" + (capitalizedEventType || eventType.toCapitalized())))).get(eventType);
            }
        }
    },

    // Claimed pointer information

    /**
     * @private
     */
    _claimedPointers: {
        enumerable: false,
        value: null
    },

    /**
     * The component claiming the specified pointer component
     *
     * @function
     * @param {string} pointer The pointer identifier in question
     * @returns component
     */
    componentClaimingPointer: {
        value: function (pointer) {
            return this._claimedPointers.get(pointer);
        }
    },

    /**
     * Whether or not the specified pointer identifier is claimed by the
     * specified component.
     *
     * @function
     * @param {string} pointer The pointer identifier in question
     * @param {string} component The component to interrogate regarding
     * ownership of the specified pointer
     * @returns {boolean}
     */
    isPointerClaimedByComponent: {
        value: function (pointer, component) {

            if (!component) {
                throw "Must specify a valid component to see if it claims the specified pointer, '" + component + "' is not valid.";
            }

            return this._claimedPointers.get(pointer) === component;
        }
    },

    /**
     * Claims that a pointer, referred to by the specified pointer identifier,
     * is claimed by the specified component.  This does not give the component
     * exclusive use of the pointer per se, but does indicate that the
     * component is acting in a manner where it expects to be the only one
     * performing major actions in response to this pointer.  Other components
     * should respect the claimant's desire to react to this pointer in order
     * to prevent an entire hierarchy of components from reacting to a pointer
     * in potentially conflicting ways.
     *
     * If the pointer is currently claimed by another component that component
     * is asked to surrender the pointer, which is may or may not agree to do.
     *
     * @function
     * @param {string} pointer The pointer identifier to claim
     * @param {string} component The component that is claiming the specified
     * pointer.
     * @returns {boolean} - Whether or not the pointer was successfully claimed.
     */
    claimPointer: {
        value: function (pointer, component) {

            // if null, undefined, false: complain
            if (!pointer && pointer !== 0) {
                throw "Must specify a valid pointer to claim, '" + pointer + "' is not valid.";
            }

            if (!component) {
                throw "Must specify a valid component to claim a pointer, '" + component + "' is not valid.";
            }

            var claimant = this._claimedPointers.get(pointer);

            if (claimant === component) {
                // Already claimed this pointer ourselves
                return true;

            } else if (!claimant) {
                //Nobody has claimed it; go for it
                this._claimedPointers.set(pointer,component);
                return true;

            } else {
                //Somebody else has claimed it; ask them to surrender
                if (claimant.surrenderPointer(pointer, component)) {
                    this._claimedPointers.set(pointer,component);
                    return true;
                } else {
                    return false;
                }
            }

        }
    },

    /**
     * Forfeits the specified pointer identifier from the specified component.
     * The specified component must be the current claimant.
     *
     * @function
     * @param {string} pointer The pointer identifier in question
     * @param {string} component The component that is trying to forfeit the
     * specified pointer
     */
    forfeitPointer: {
        value: function (pointer, component) {
            if (component === this._claimedPointers.get(pointer)) {
                this._claimedPointers.delete(pointer);
            } else {
                throw "Not allowed to forfeit pointer '" + pointer + "' claimed by another component";
            }

        }
    },

    /**
     * Forfeits all pointers from the specified component.
     *
     * @function
     * @param {Component} component
     */
    forfeitAllPointers: {
        value: function (component) {

            var mapIter  = this._claimedPointers.keys(),
                pointerKey,
                claimant;

            while ((pointerKey = mapIter.next().value)) {
                claimant = this._claimedPointers.get(pointerKey);
                if (component === claimant) {
                    // NOTE basically doing the work ofr freePointerFromComponent
                    this._claimedPointers.delete(pointerKey);
                }
            }
        }
    },

    // Pointer Storage for calculating velocities

    /**
     * @private
     */
    _isStoringPointerEvents: {
        enumerable: false,
        value: false
    },

    /**
     * @returns {boolean}
     * @default false
     */
    isStoringPointerEvents: {
        enumerable: true,
        get: function () {
            return this._isStoringPointerEvents;
        },
        set: function (value) {
            if (value === true) {
                if (!this._isStoringPointerEvents) {
                    this._isStoringPointerEvents = true;

                    if (
                        (typeof PointerEvent !== "undefined") ||
                            (typeof MSPointerEvent !== "undefined" && typeof navigator !== "undefined" && navigator.msPointerEnabled)
                    ) {
                        Object.defineProperty(MutableEvent.prototype, "velocity", {
                            get: function () {
                                return defaultEventManager.pointerMotion(this.pointerId).velocity;
                            }
                        });
                    } else if (typeof Touch !== "undefined") {
                        Object.defineProperty(Touch.prototype, "velocity", {
                            get: function () {
                                return defaultEventManager.pointerMotion(this.identifier).velocity;
                            }
                        });
                    }
                }
            } else {
                this._isStoringPointerEvents = false;
                this._pointerStorage.memory = {};
                this._isMouseDragging = false;
            }
        }
    },

    /**
     * @private
     */
    _isStoringMouseEventsWhileDraggingOnly: {
        enumerable: false,
        value: true
    },

    /**
     * @type {Function}
     * @default {boolean} true
     */
    isStoringMouseEventsWhileDraggingOnly: {
        enumerable: true,
        get: function () {
            return this._isStoringMouseEventsWhileDraggingOnly;
        },
        set: function (value) {
            this._isStoringMouseEventsWhileDraggingOnly = (value === true) ? true : false;
        }
    },

    /**
     * @private
     */
    _isMouseDragging: {
        enumerable: false,
        value: false
    },

    /**
     * @private
     */
    _pointerStorage: {
        enumerable: false,
        value: {
            memory: {},
            velocity: {},
            add: function (identifier, data) {
                if (!this.memory[identifier]) {
                    this.memory[identifier] = {
                        data: new Array(32),
                        size: 0,
                        pos: 0
                    };
                }
                this.memory[identifier].data[this.memory[identifier].pos] = data;
                if (this.memory[identifier].size < this.memory[identifier].data.length) {
                    this.memory[identifier].size++;
                }
                this.memory[identifier].pos = (this.memory[identifier].pos + 1) % this.memory[identifier].data.length;
            },
            remove: function (identifier) {
                delete this.memory[identifier];
            },
            clear: function (identifier) {
                if (this.memory[identifier]) {
                    this.memory[identifier].size = 0;
                }
            },
            getMemory: function (identifier) {
                return this.memory[identifier];
            },
            isStored: function (identifier) {
                return (this.memory[identifier] && (this.memory[identifier].size > 0));
            },
            storeEvent: function (mutableEvent) {
                var isBrowserSupportPointerEvents = currentEnvironment.isBrowserSupportPointerEvents,
                    event = mutableEvent instanceof MutableEvent ? mutableEvent._event : mutableEvent,
                    pointerType = event
                                    ? event.pointerType
                                    : null;
                if(!pointerType) return;

                if ((isBrowserSupportPointerEvents &&
                    (pointerType === "mouse" || (window.MSPointerEvent && pointerType === window.MSPointerEvent.MSPOINTER_TYPE_MOUSE))) ||
                    (!isBrowserSupportPointerEvents && event instanceof MouseEvent)) {

                    switch (mutableEvent.type) {
                        case "pointerdown":
                        case "MSPointerDown":
                        case "mousedown":
                            defaultEventManager._isMouseDragging = true;
                            /* falls through */
                        // roll into mousemove. break omitted intentionally.
                        case "pointermove":
                        case "MSPointerMove":
                        case "mousemove":
                            if (defaultEventManager._isStoringMouseEventsWhileDraggingOnly) {
                                if (defaultEventManager._isMouseDragging) {
                                    this._storeMouse(mutableEvent);
                                }
                            } else {
                                this._storeMouse(mutableEvent);
                            }
                            break;

                        case "pointerup":
                        case "MSPointerUp":
                        case "mouseup":
                            this._storeMouse(mutableEvent);
                            break;
                    }
                } else if ((isBrowserSupportPointerEvents &&
                    (pointerType === "touch" || (window.MSPointerEvent && pointerType === window.MSPointerEvent.MSPOINTER_TYPE_TOUCH))) ||
                    (window.TouchEvent !== void 0 && !isBrowserSupportPointerEvents && event instanceof TouchEvent)) {

                    switch (event.type) {
                        case "pointerdown":
                        case "MSPointerDown":
                        case "pointermove":
                        case "MSPointerMove":
                        case "pointerup":
                        case "MSPointerUp":
                            this._storeTouch(event.pointerId, event.clientX, event.clientY, event.timeStamp);
                            break;

                        case "touchstart":
                        case "touchmove":
                            this._storeTouches(event.touches, event.timeStamp);
                            break;

                        case "touchend":
                            this._storeTouches(event.changedTouches, event.timeStamp);
                            break;
                    }
                }
            },

            removeEvent: function (mutableEvent) {
                var isBrowserSupportPointerEvents = currentEnvironment.isBrowserSupportPointerEvents,
                    event = mutableEvent instanceof MutableEvent ? mutableEvent._event : mutableEvent;

                if ((isBrowserSupportPointerEvents &&
                    (mutableEvent.pointerType === "mouse" || (window.MSPointerEvent && mutableEvent.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_MOUSE))) ||
                    (!isBrowserSupportPointerEvents && event instanceof MouseEvent)) {

                    if (mutableEvent.type === "mouseup" || mutableEvent.type === "pointerup" || mutableEvent.type === "MSPointerUp") {
                        defaultEventManager._isMouseDragging = false;

                        if (defaultEventManager._isStoringMouseEventsWhileDraggingOnly) {
                            this.clear("mouse");
                        }
                    }
                } else if ((isBrowserSupportPointerEvents &&
                    (mutableEvent.pointerType === "touch" || (window.MSPointerEvent && mutableEvent.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_TOUCH))) ||
                    (window.TouchEvent !== void 0 && !isBrowserSupportPointerEvents && event instanceof TouchEvent)) {

                    if (mutableEvent.type === "touchend" || mutableEvent.type === "pointerup" || mutableEvent.type === "MSPointerUp") {
                        if (mutableEvent.changedTouches) {
                            for (var i = 0, changedTouches = mutableEvent.changedTouches, iChangedTouch; (iChangedTouch = changedTouches[i]); i++) {
                                this.remove(iChangedTouch.identifier);
                            }
                        } else {
                            this.remove(mutableEvent.pointerId);
                        }
                    }
                }
            },

            _storeMouse: function (event) {
                this.add("mouse", {
                    clientX: event.clientX,
                    clientY: event.clientY,
                    timeStamp: event.timeStamp
                });

                Object.defineProperty(event, "velocity", {
                    get: function () {
                        return defaultEventManager.pointerMotion("mouse").velocity;
                    }
                });
            },

            _storeTouches: function (touches, timeStamp) {
                var touch;

                for (var i = 0; (touch = touches[i]); i++) {
                    this._storeTouch(touch.identifier, touch.clientX, touch.clientY, timeStamp);
                }
            },

            _storeTouch: function (identifier, clientX, clientY, timeStamp) {
                this.add(identifier, {
                    clientX: clientX,
                    clientY: clientY,
                    timeStamp: timeStamp
                });
            }
        }
    },

    /**
     @private
     */
    _getPointerVelocityData: {
        enumerable: false,
        value: function (identifier) {
            var i = 0,
                memory,
                memoryLength,
                evt,
                startTime,
                iTime,
                oldTime, oldX, oldY, squaredModule,
                addData = true,
                data = {
                    x: [],
                    y: [],
                    time: []
                };
            memory = defaultEventManager._pointerStorage.getMemory(identifier);
            memoryLength = memory.data.length;
            evt = memory.data[((memory.pos - 1) + memoryLength) % memoryLength];
            startTime = iTime = oldTime = evt.timeStamp;
            oldX = evt.clientX;
            oldY = evt.clientY;
            while (addData && (iTime > startTime - 350) && (i < memory.size)) {
                evt = memory.data[((memory.pos - i - 1) + memoryLength) % memoryLength];
                iTime = evt.timeStamp;
                squaredModule = oldX * oldX + oldY * oldY;
                if ((squaredModule > 2) && ((oldTime - iTime) <= 50)) {
                    data.x.push(evt.clientX);
                    data.y.push(evt.clientY);
                    data.time.push(iTime);
                    oldTime = iTime;
                    oldX = evt.clientX;
                    oldY = evt.clientY;
                    i++;
                } else {
                    addData = false;
                }
            }
            return data;
        }
    },

    /**
     @private
     */
    _fitPointerCurve: {
        enumerable: false,
        value: function (bezier, data) {
            var a, b, c, d, epsilon = 0.0001,
                dl = data.length, e, t, v, t2, t3, i,
                f0, c0, d0, b0, a0, s0, e0,
                f1, c1, d1, b1, a1, s1, e1,
                f2, c2, d2, b2, a2, s2, e2,
                f3, c3, d3, b3, a3, s3, e3;
            do {
                f0 = c0 = d0 = b0 = a0 = s0 = f1 = c1 = d1 = b1 = a1 = s1 = f2 = c2 = d2 = b2 = a2 = s2 = f3 = c3 = d3 = b3 = a3 = s3 = 0;
                for (i = 0; i < dl; i++) {
                    e = data[i];
                    t = e.t;
                    t2 = t * t;
                    t3 = t2 * t;
                    v = e.v;
                    e0 = epsilon * (6 * (t2 - t) - t3 + 2);
                    e1 = epsilon * 6 * (t3 - 2 * t2 + t);
                    e2 = epsilon * 6 * (t2 - t3);
                    e3 = epsilon * 2 * t3;
                    s0 += e0 * e0;
                    s1 += e1 * e1;
                    s2 += e2 * e2;
                    s3 += e3 * e3;
                    f0 += v * e0;
                    f1 += v * e1;
                    f2 += v * e2;
                    f3 += v * e3;
                    d0 -= e0;
                    d1 -= e1;
                    d2 -= e2;
                    d3 -= e3;
                    c0 -= e0 * t;
                    c1 -= e1 * t;
                    c2 -= e2 * t;
                    c3 -= e3 * t;
                    b0 -= e0 * t2;
                    b1 -= e1 * t2;
                    b2 -= e2 * t2;
                    b3 -= e3 * t2;
                    a0 -= e0 * t3;
                    a1 -= e1 * t3;
                    a2 -= e2 * t3;
                    a3 -= e3 * t3;
                }
                epsilon *= 2;
            } while (s0 === 0 || s1 === 0 || s2 === 0 || s3 === 0);
            t = epsilon / s0;
            f0 *= t;
            c0 *= t * 3;
            d0 *= t;
            b0 *= t * 3;
            a0 *= t;
            t = epsilon / s1;
            f1 *= t;
            c1 *= t * 3;
            d1 *= t;
            b1 *= t * 3;
            a1 *= t;
            t = epsilon / s2;
            f2 *= t;
            c2 *= t * 3;
            d2 *= t;
            b2 *= t * 3;
            a2 *= t;
            t = epsilon / s3;
            f3 *= t;
            c3 *= t * 3;
            d3 *= t;
            b3 *= t * 3;
            a3 *= t;
            s0 = bezier[0];
            s1 = bezier[1];
            s2 = bezier[2];
            s3 = bezier[3];
            a = (s1 - s2) * 3 + s3 - s0;
            b = s0 + s2 - 2 * s1;
            c = s1 - s0;
            d = s0;
            for (i = 0; i < 20; i++) {
                t = f0 + d * d0 + c * c0 + b * b0 + a * a0;
                s0 += t;
                d += t;
                a -= t;
                b += t;
                c -= t;
                t = f1 + d * d1 + c * c1 + b * b1 + a * a1;
                s1 += t;
                a += t * 3;
                b -= t + t;
                c += t;
                t = f2 + d * d2 + c * c2 + b * b2 + a * a2;
                s2 += t;
                a -= t * 3;
                b += t;
                t = f3 + d * d3 + c * c3 + b * b3 + a * a3;
                s3 += t;
                a += t;
            }
            bezier[0] = s0;
            bezier[1] = s1;
            bezier[2] = s2;
            bezier[3] = s3;
        }
    },

    /**
     @private
     */
    _pointerBezierValue: {
        enumerable: false,
        value: function (t, bezier) {
            var it = 1 - t;
            return it * it * it * bezier[0] + 3 * it * it * t * bezier[1] + 3 * it * t * t * bezier[2] + t * t * t * bezier[3];
        }
    },
    /**
     @private
     */
    _calculatePointerVelocity: {
        enumerable: false,
        value: function (time, position) {
            var length = time.length,
                timeMin = time[0],
                timeMax = time[0],
                timeInterval,
                iMin = 0, i;
            for (i = 1; i < length; i++) {
                if (time[i] < timeMin) {
                    timeMin = time[i];
                    iMin = i;
                }
            }
            timeInterval = timeMax - timeMin;
            if (timeInterval) {
                if (length > 5) {
                    var s, e, bezier, data = [];
                    for (i = 0; i < length; i++) {
                        data[i] = {
                            v: position[i],
                            t: (time[i] - timeMin) / timeInterval
                        };
                    }
                    s = data[iMin].v;
                    e = data[0].v;
                    bezier = [s, (s * 2 + e) / 3, (s + e * 2) / 3, e];
                    this._fitPointerCurve(bezier, data);
                    return (this._pointerBezierValue(0.8, bezier) - this._pointerBezierValue(0.6, bezier)) * 5000 / timeInterval;
                } else if (length > 1) {
                    return (position[0] - position[iMin]) * 1000 / timeInterval;
                } else {
                    return 0;
                }
            } else {
                return 0;
            }
        }
    },

    /**
     @function
     @param {attribute} identifier
     */
    pointerMotion: {
        value: function (identifier) {
            if (defaultEventManager._pointerStorage.isStored(identifier)) {
                return {velocity: (new _PointerVelocity()).initWithIdentifier(identifier)};
            } else {
                return undefined;
            }
        }
    },

    monitorDOMModificationInEventHandling: {value: false},

    domModificationEventHandler: {
        value: Montage.specialize({
            handleEvent: {
                value: function (event) {
                    throw "DOM Modified";
                }
            },
            captureDOMSubtreeModified: {
                value: function (event) {
                    throw "DOMSubtreeModified";
                }
            },
            captureDOMAttrModified: {
                value: function (event) {
                    throw "DOMAttrModified";
                }
            },
            captureDOMCharacterDataModified: {
                value: function (event) {
                    throw "DOMCharacterDataModified";
                }
            }
        })
    },

    _trackingTouchStartList: {
        value: null
    },
    _trackingTouchEndList: {
        value: null
    },

    _trackingTouchTimeoutIDs: {
        value: null
    },

    _wouldTouchTriggerSimulatedEvent: {
        value: function (event) {

            switch (event.type) {
                case "touchstart":
                case "touchend":
                    return true;
                default:
                    return false;
            }

        }
    },

    _couldEventBeSimulated: {
        value: function (event) {

            switch (event.type) {
                case "mousedown":
                case "mouseup":
                case "click":
                    return true;
                default:
                    return false;
            }

        }
    },

    _listeningWindowOnTouchCancel: {
        value: []
    },

    _findWindowFromEvent: {
        value: function (event) {
            var target = event.target,
                aWindow;

            if (target) {
                aWindow = target instanceof Window ? target : target.defaultView instanceof Window ?
                    target.defaultView : target.ownerDocument && target.ownerDocument.defaultView ?
                    target.ownerDocument.defaultView : null;
            }

            return aWindow;
        }
    },

    _isWindowListeningOnTouchCancel: {
        value: function (aWindow) {
            return this._registeredWindows.indexOf(aWindow) > -1 && this._listeningWindowOnTouchCancel.indexOf(aWindow) > -1;
        }
    },

    _listenToTouchCancelIfNeeded: {
        value: function (event) {
            var aWindow = this._findWindowFromEvent(event);

            if (aWindow && !this._isWindowListeningOnTouchCancel(aWindow)) {
                var self = this;

                aWindow.addEventListener("touchcancel", function touchcancelListener(event) {
                    var changedTouches = event.changedTouches,
                        touchesStartList = self._trackingTouchStartList,
                        identifier;

                    for (var i = 0, length = changedTouches.length; i < length; i++) {
                        identifier = changedTouches[i].identifier;

                        if (touchesStartList.has(identifier)) {
                            touchesStartList.delete(identifier);
                        }
                    }
                }, true);

                this._listeningWindowOnTouchCancel.push(aWindow);
            }
        }
    },

    _blocksEmulatedEvents: {
        value: true
    },
    blocksEmulatedEvents: {
        get: function() { return this._blocksEmulatedEvents; },
        set: function(value) {
            if (value !== this._blocksEmulatedEvents) {
                this._blocksEmulatedEvents = value;
                this._evaluateShouldDispatchEventCondition();
            }
        }
    },
    _shouldDispatchEventCondition: {
        value: undefined
    },

    _evaluateShouldDispatchEventCondition: {
        value: function() {
            this._shouldDispatchEventCondition = (this.blocksEmulatedEvents && !window.PointerEvent &&
            !(window.MSPointerEvent && window.navigator.msPointerEnabled));
        }
    },


    /**
     * @function
     * @param {Event} event
     * @description Decides if an event can be dispatched by the EventManager within a montage app.
     * Filter emulated mouse events (mousedown, mouseup, click) from touch events.
     *
     * @private
     */
    _shouldDispatchEvent: {
        value: function (event) {
            if (this._shouldDispatchEventCondition) {
                /**
                 * Under IOS < 10.3.1, emulated mouse events have a timestamp set to 0. (Just WKWebView not UIWebView)
                 * starting with 10.3.1, timeStamp is non null. However, emulated events don't have the property movementX/Y
                 * that desktop Safari has, so we're adding logic to leverage that.
                 * Plus, this property can't be used for Firefox.
                 * Firefox has an open bug since 2004: the property timeStamp is not populated correctly.
                 * -> https://bugzilla.mozilla.org/show_bug.cgi?id=238041
                 */
                if (this.environment.isIOSDevice && this.environment.isWKWebView) {
                    if (event.timeStamp === 0) {
                        return false;
                    }
                    if (this._couldEventBeSimulated(event) && !event.hasOwnProperty("movementX")) {
                        return false;
                    }
                }

                /**
                 * No needs do dispatch mouse events on android devices.
                 */
                if (this.environment.isAndroidDevice && this._couldEventBeSimulated(event)) {
                    return false;
                }

                // Checks if the event may trigger simulated events.
                if (this._wouldTouchTriggerSimulatedEvent(event)) {
                    var changedTouches = event.changedTouches;

                    // Needs to clean the tracking touches "start" when a touch event is canceled.
                    this._listenToTouchCancelIfNeeded(event);

                    for (var i = 0, length = changedTouches.length; i < length; i++) {
                        this._trackTouch(event, changedTouches[i]);
                    }

                } else if (this._couldEventBeSimulated(event)) { // Determines if mouse events are simulated.
                    return !this._isEmulatedEvent(event);
                }  // else -> Dispatches all the others.
            }

            return true;
        }
    },

    _trackTouch: {
        value: function (touchEvent, touch) {
            var timeoutIDs = this._trackingTouchTimeoutIDs,
                trackingTouchStartList = this._trackingTouchStartList,
                trackingTouchEndList = this._trackingTouchEndList,
                touchIdentifier = touch.identifier;

            touch.timeStamp = touchEvent.timeStamp;

            if (touchEvent.type === "touchstart") {
                /**
                 * Touch identifiers are not unique for Firefox or Chrome (they are re-used).
                 * So, we need to clear the timeout that was supposed to clean this tracking touch.
                 */
                var timeoutID = timeoutIDs.get(touchIdentifier);

                if (timeoutID) {
                    clearTimeout(timeoutID);
                    timeoutIDs.delete(touchIdentifier);
                }

                trackingTouchStartList.set(touchIdentifier,touch);

            } else { // touchend
                timeoutIDs.set(touchIdentifier, setTimeout(function () {
                    trackingTouchEndList.delete(touchIdentifier);
                    delete timeoutIDs[touchIdentifier];
                }, 400));
                /**
                 * 400ms -> need a higher timeout than the click delay for UIWebViews.
                 * Probably related to the fact Apple pauses JavaScript execution during scrolls on UIWebViews.
                 * http://developer.telerik.com/featured/scroll-event-change-ios-8-big-deal/
                 */

                trackingTouchStartList.delete(touchIdentifier);
                trackingTouchEndList.set(touchIdentifier,touch);
            }
            // console.groupTimeEnd("_trackTouch");

        }
    },

    /**
     * @function
     * @param {Event} event
     * @description Decides if an event is an emualted mouse event.
     * Checks if a target has already been "activated" by a touch.
     *
     * @private
     */
    _isEmulatedEvent: {
        value: function (event) {
            /**
             * Can't use the position, indeed the emulated mouse events are not at the same position
             * than the touch events than triggered them. Doesn't work with a radius as well.
             * (using a radius can make it fail with wide fast movements -> FF)
             *
             * Needs to check both maps for devices with multiples pointers
             * (touchstart + mousedown -> mouseup -> click) or (touchstart + delay ≈ 600ms -> mousedown)
             */
            var response = this._findEmulatedEventIdentifierWithEventAndTrackingTouchList(event, this._trackingTouchStartList) > -1;

            if (!response) {
                var trackingTouchList = this._trackingTouchEndList,
                    identifier = this._findEmulatedEventIdentifierWithEventAndTrackingTouchList(event, trackingTouchList);

                // Faster "awake", can be useful for devices with multiple pointers. (simultaneous click/touch)
                if ((response = identifier > -1) && event.type === "click") {
                    var timeoutIDs = this._trackingTouchTimeoutIDs,
                        timeoutID = timeoutIDs.get(identifier);

                    if (timeoutID) {
                        clearTimeout(timeoutID);

                        trackingTouchList.delete(identifier);
                        timeoutIDs.delete(identifier);
                    }
                }
            }

            return response;
        }
    },

    _emulatedEventTimestampThreshold: {
        value: 20 //ms
    },

    _emulatedEventRadiusThreshold: {
        value: 20 //px
    },

    /**
     * @function
     * @private
     *
     */
    _findEmulatedEventIdentifierWithEventAndTrackingTouchList: {
        value: function (mouseEvent, trackingTouchList) {
            var mouseTarget = mouseEvent.target,
                identifier = -1,
                key,
                touch,
                mapIter;

            mapIter = trackingTouchList.keys();
            while ((key = mapIter.next().value)) {
                touch = trackingTouchList.get(key);

                if (touch.target === mouseTarget ||
                    this._couldEmulatedEventHaveWrongTarget(
                        touch,
                        mouseEvent,
                        this._emulatedEventRadiusThreshold,
                        this._emulatedEventTimestampThreshold
                    )) {

                    identifier = key;
                    break;
                }
            }
            return identifier;
        }
    },


    /**
     * @function
     * @private
     * @description Check if a mouse event can not be a simulated event even if the target is different.
     * Indeed, Touch Events and simulated Mouse Events can have a different target and not the same position on Chrome.
     *
     */
    _couldEmulatedEventHaveWrongTarget: {
        value: function (touch, mouseEvent, radiusThreshold, timestampThreshold) {

            if (/*dTimestamp*/(mouseEvent.timeStamp - touch.timeStamp) <= timestampThreshold) {
                var dX = touch.clientX - mouseEvent.clientX,
                    dY = touch.clientY - mouseEvent.clientY;

                return dX * dX + dY * dY <= radiusThreshold * radiusThreshold;
            }

            return false;
        }
    },


    // Event Handling
    /**
     * @property {Array}
     * @description the pointer to the current candidate event listeners.
     *
     * @private
     */
    _currentDispatchedTargetListeners: {
        value:null
    },
    /**
     * @function
     * @description the pointer to the current candidate event listeners.
     *
     * @private
     */
    // _processCurrentDispatchedTargetListenersToRemove: {
    //     value: function(target, eventType, useCapture, listeners) {

    //         var registeredEventListeners,
    //             otherPhaseRegisteredEventListeners,
    //             currentDispatchedTargetListenersToRemove = this._currentDispatchedTargetListeners.get(listeners);

    //         if (currentDispatchedTargetListenersToRemove && currentDispatchedTargetListenersToRemove.size > 0) {
    //             listeners.removeObjects(currentDispatchedTargetListenersToRemove);
    //             registeredEventListeners = useCapture ? this._registeredCaptureEventListeners : this._registeredBubbleEventListeners;
    //             otherPhaseRegisteredEventListeners = useCapture ? this._registeredBubbleEventListeners : this._registeredCaptureEventListeners;
    //             this._unregisterTargetForEventTypeIfNeeded(target, eventType, listeners, registeredEventListeners, otherPhaseRegisteredEventListeners);
    //         }
    //     }
    // },
    _integerAscendingSortFunction: {
        value: function(a, b) {
            return a - b;
        }
    },
    _processCurrentDispatchedTargetListenersToRemove: {
        value: function(target, eventType, phase, listeners) {

            var registeredEventListeners,
                otherPhaseRegisteredEventListeners,
                //currentDispatchedTargetListenersToRemove is an array that contains the indexes of the listenerEntries that needs to be removed post phase distribution
                currentDispatchedTargetListenersToRemove = this._currentDispatchedTargetListeners.get(listeners);

            if (currentDispatchedTargetListenersToRemove && currentDispatchedTargetListenersToRemove.length > 0) {
                var targetEntry = this._targetEventListeners.get(target),
                targetEntryForEventType = targetEntry ? targetEntry.get(eventType) : null,
                targetEntryForEventTypeListeners = targetEntryForEventType
                    ? targetEntryForEventType.get(phase)
                    : null;

                //Remove what needs to be
                currentDispatchedTargetListenersToRemove.sort(this._integerAscendingSortFunction);
                for(var i = 0, countI = currentDispatchedTargetListenersToRemove.length, index; i < countI; i++) {
                    index = currentDispatchedTargetListenersToRemove[i] - i;
                    targetEntryForEventTypeListeners.splice(index, 1);
                }

                this._stopObservingTargeForEventTypeIfNeeded(target, eventType, targetEntryForEventType);
            }
        }
    },

    _invokeTargetListenersForEventPhase: {
        value: function(iTarget, mutableEvent, phase, _eventType, promise) {
            if(promise && promise.then) {
                return promise.then(() => {
                    if(!mutableEvent.immediatePropagationStopped) {
                        return this.__invokeTargetListenersForEventPhase(iTarget, mutableEvent, phase, _eventType);
                    }
                });
            } else {
                return this.__invokeTargetListenersForEventPhase(iTarget, mutableEvent, phase, _eventType);
            }
        }
    },


    __invokeTargetListenersForEventPhase: {
        value: function __invokeTargetListenersForEventPhase(iTarget, mutableEvent, phase, _eventType) {
            var eventType = (_eventType || mutableEvent.type),
                listenerEntries = this._registeredEventListenersOnTarget_eventType_eventPhase(iTarget, eventType, phase);

            if (listenerEntries) {

                // currentTargetIdentifierSpecificCaptureMethodName = this.methodNameForCapturePhaseOfEventType(eventType, iTarget.identifier, capitalizedEventType);
                if (Array.isArray(listenerEntries)) {
                    var j=0,
                        _currentDispatchedTargetListeners = this._currentDispatchedTargetListeners,
                        nextEntry,
                        previousPromise,
                        promise,
                        // promises,
                        mutableEventPhase = mutableEvent.eventPhase,
                        self = this;

                    _currentDispatchedTargetListeners.set(listenerEntries,null);
                    while ((nextEntry = listenerEntries[j++]) && !mutableEvent.immediatePropagationStopped) {
                        if(promise) {
                            if(promise.then) {
                                previousPromise = promise;
                            }
                        }
                        promise = this._invokeTargetListenerEntryForEvent(iTarget, nextEntry, mutableEvent, mutableEventPhase, undefined/*currentTargetIdentifierSpecificCaptureMethodName*/, undefined/*identifierSpecificCaptureMethodName*/, undefined/*captureMethodName*/, previousPromise);

                        // if(previousPromise && promise) {
                        //     if(!promises) {
                        //         promises = [previousPromise, promise];
                        //     } else {
                        //         promises.push(promise);
                        //     }
                        // }
                    }

                    if(/*promises || */promise && promise.then) {
                        /*
                            We now chain each listener promise, so we can enforce an stopImmedidatePopagation

                            mutableEvent.immediatePropagationStopped

                            So no need to do a promise.all anymore
                        */
                        // promise =  (promises && promises.length)
                        // ? Promise.all(promises)
                        // : promise;

                        return promise.finally(function() {
                            self._processCurrentDispatchedTargetListenersToRemove(iTarget, eventType, phase, listenerEntries);
                            _currentDispatchedTargetListeners.delete(listenerEntries);
                        });

                    } else {
                        this._processCurrentDispatchedTargetListenersToRemove(iTarget, eventType, phase, listenerEntries);
                        _currentDispatchedTargetListeners.delete(listenerEntries);
                        return;
                    }
                }
                else {
                    /*
                        There's only one listener, so no previous promise to pass
                    */
                    return this._invokeTargetListenerEntryForEvent(iTarget, listenerEntries, mutableEvent, mutableEvent.eventPhase, undefined/*currentTargetIdentifierSpecificCaptureMethodName*/, undefined/*identifierSpecificCaptureMethodName*/, undefined/*captureMethodName*/, /*promise*/undefined);
                }
            }
        }
    },

    /**
     @function
     @param {Event} event The handled event.
     */
    handleEvent: {
        enumerable: false,
        value: function EventManager_handleEvent(event) {
            // if(event.type === "pointerdown" || event.type === "pointerup" || event.type.indexOf("press") !== -1) {
            //     console.log("handleEvent "+event.type,event.target);
            // }
            //console.log("----> handleEvent "+event.type);
            var i,
                iTarget,
                eventPath,
                eventType = event.type,
                eventDefinition = this.eventDefinitions[eventType],
                eventBubbles = event.bubbles,
                mutableEvent,
                mutableEventTarget,

                //New stuff
                CAPTURING_PHASE = Event_CAPTURING_PHASE,
                BUBBLING_PHASE = Event_BUBBLING_PHASE,
                targetEntry, targetEntryForEventType,
                promise;

            if(this.isBrowser) {
                if(
                    (MontageElement && event.target instanceof MontageElement) ||
                    (event instanceof UIEvent && !this._shouldDispatchEvent(event))
                ) {
                    return void 0;
                }

                // performance.mark('event-manager:handleEvent:start');

                if (this.monitorDOMModificationInEventHandling) {
                    document.body.addEventListener("DOMSubtreeModified", this.domModificationEventHandler, true);
                    document.body.addEventListener("DOMAttrModified", this.domModificationEventHandler, true);
                    document.body.addEventListener("DOMCharacterDataModified", this.domModificationEventHandler, true);
                }

                if ("DOMContentLoaded" === eventType) {
                    var loadedWindow = event.target.defaultView;
                    if (loadedWindow && this._windowsAwaitingFinalRegistration.has(loadedWindow)) {
                        this._finalizeWindowRegistration(loadedWindow);
                        // Stop listening for DOMContentLoaded on this target
                        // Otherwise the eventManager's handleEvent will be called
                        // again from within here when the eventManager is found
                        // to be a listener for this event when we find the listeners
                        event.target.removeEventListener("DOMContentLoaded", this, true);
                    }
                }
            }


            if (typeof event.propagationStopped !== "boolean") {
                mutableEvent = MutableEvent.fromEvent(event);
            } else {
                mutableEvent = event;
            }

            if(eventDefinition && eventDefinition.type) {
                mutableEvent.type = eventType = eventDefinition.type;
            }

            mutableEventTarget = mutableEvent.target;
            eventPath = this.eventPathForTarget(mutableEventTarget);
            mutableEvent._composedPath = eventPath;


            // Let the delegate handle the event first
            if (this.delegate && typeof this.delegate.willDistributeEvent === "function") {
                this.delegate.willDistributeEvent(mutableEvent);
            }

            if (this._isStoringPointerEvents) {
                this._pointerStorage.storeEvent(mutableEvent);
            }


            targetEntry = this._targetEventListeners.get(mutableEventTarget);
            targetEntryForEventType = targetEntry ? targetEntry.get(eventType) : null;

            // Capture Phase Distribution
            mutableEvent.eventPhase = CAPTURING_PHASE;
            /*
                 The event path we generate is from bottom to top, capture needs to traverse this backwards
                 As eventPath now includes the target, we need to stop at index 1 in capture, and start from in bubble
            */
            i = eventPath.length;
            let countI = i;
            while (i>1 && !mutableEvent.immediatePropagationStopped && !mutableEvent.propagationStopped && (iTarget = eventPath[--i])) {
                if(eventPath.length !== countI || mutableEvent.currentTarget === iTarget) {
                    //eventPath was modified
                    while((iTarget = eventPath[--i]) === mutableEvent.currentTarget) {};
                }
                mutableEvent.currentTarget = iTarget;

                promise = this._invokeTargetListenersForEventPhase(iTarget, mutableEvent, CAPTURING_PHASE, eventType, promise);
            }

            // At Target Distribution
            if (!mutableEvent.immediatePropagationStopped && !mutableEvent.propagationStopped) {
                mutableEvent.eventPhase = Event_AT_TARGET;
                mutableEvent.currentTarget = iTarget = mutableEventTarget;
                //Capture
                promise = this._invokeTargetListenersForEventPhase(iTarget, mutableEvent, CAPTURING_PHASE, eventType, promise);

                //Bubble
                promise = this._invokeTargetListenersForEventPhase(iTarget, mutableEvent, BUBBLING_PHASE, eventType, promise);
            }

            /*
                 Bubble Phase Distribution
                 As eventPath now includes the target, we need to stop at index 1 in capture, and start from in bubble
            */
            if(eventBubbles) {
                mutableEvent.eventPhase = BUBBLING_PHASE;
                for (i = 1; !mutableEvent.immediatePropagationStopped && !mutableEvent.propagationStopped && (iTarget = eventPath[i]); i++) {
                    mutableEvent.currentTarget = iTarget;

                    promise = this._invokeTargetListenersForEventPhase(iTarget, mutableEvent, BUBBLING_PHASE, eventType, promise);

                }
            }


            if(promise) {
                var self = this;
                mutableEvent.propagationPromise = promise.then(function() {
                    self._finalizeHandleEvent(mutableEvent, event);
                });
            } else {
                this._finalizeHandleEvent(mutableEvent, event);
            }

            //console.profileEnd("handleEvent "+event.type);
            //console.groupTimeEnd("handleEvent");

            // performance.mark('event-manager:handleEvent:end');
            // performance.measure('handleEvent', 'event-manager:handleEvent:start', 'event-manager:handleEvent:end');
        }
    },

    _finalizeHandleEvent: {
        value: function(mutableEvent, event) {
            mutableEvent.eventPhase = Event_NONE;
            mutableEvent.currentTarget = null;

            if(this.isBrowser) {
                if (this._isStoringPointerEvents) {
                    this._pointerStorage.removeEvent(event);
                }

                if (this.monitorDOMModificationInEventHandling) {
                    document.body.removeEventListener("DOMSubtreeModified", this.domModificationEventHandler, true);
                    document.body.removeEventListener("DOMAttrModified", this.domModificationEventHandler, true);
                    document.body.removeEventListener("DOMCharacterDataModified", this.domModificationEventHandler, true);
                }
            }


        }
    },

    /**
     * @private
     */
    // _invokeTargetListenerForEvent: {
    //     value: function _invokeTargetListenerForEvent(iTarget, jListener, mutableEvent, currentTargetIdentifierSpecificPhaseMethodName, targetIdentifierSpecificPhaseMethodName, phaseMethodName) {
    //         // var functionType = "function";
    //         // if (typeof jListener === functionType) {
    //         //     jListener.call(iTarget, mutableEvent);
    //         // }
    //         // else if (identifierSpecificPhaseMethodName && typeof jListener[identifierSpecificPhaseMethodName] === functionType) {
    //         //     jListener[identifierSpecificPhaseMethodName](mutableEvent);
    //         // }
    //         // else if (typeof jListener[phaseMethodName] === functionType) {
    //         //     jListener[phaseMethodName](mutableEvent);
    //         // }
    //         // else if (typeof jListener.handleEvent === functionType) {
    //         //     jListener.handleEvent(mutableEvent);
    //         // }
    //     (currentTargetIdentifierSpecificPhaseMethodName && typeof jListener[currentTargetIdentifierSpecificPhaseMethodName] === this._functionType)
    //         ? jListener[currentTargetIdentifierSpecificPhaseMethodName](mutableEvent)
    //         : (targetIdentifierSpecificPhaseMethodName && typeof jListener[targetIdentifierSpecificPhaseMethodName] === this._functionType)
    //             ? jListener[targetIdentifierSpecificPhaseMethodName](mutableEvent)
    //             : (typeof jListener[phaseMethodName] === this._functionType)
    //                 ? jListener[phaseMethodName](mutableEvent)
    //                 : (typeof jListener.handleEvent === this._functionType)
    //                     ? jListener.handleEvent(mutableEvent)
    //                     : (typeof jListener === this._functionType)
    //                         ? jListener.call(iTarget, mutableEvent)
    //                         : void 0;

    //     }
    // },

    _invokeTargetListenerEntryForEvent: {
        value: function _invokeTargetListenerEntryForEvent(iTarget, listenerEntry, mutableEvent, phase, currentTargetIdentifierSpecificPhaseMethodName, targetIdentifierSpecificPhaseMethodName, phaseMethodName, promise) {
            if(promise && promise.then) {
                return promise.then(() => {
                    if(!mutableEvent.immediatePropagationStopped) {
                        return this.__invokeTargetListenerEntryForEvent(iTarget, listenerEntry, mutableEvent, phase, currentTargetIdentifierSpecificPhaseMethodName, targetIdentifierSpecificPhaseMethodName, phaseMethodName);
                    } else {
                        throw new Error("immediatePropagationStopped");
                    }
                });
            } else {
                return this.__invokeTargetListenerEntryForEvent(iTarget, listenerEntry, mutableEvent, phase, currentTargetIdentifierSpecificPhaseMethodName, targetIdentifierSpecificPhaseMethodName, phaseMethodName);
            }
        }
    },


    /**
     * @method
     * @param {String} type The type of an event.
     * @param {Object} listener The listener for the event described.
     * @param {Object} target The target of the event.
     * @param {Boolean} capture true if asking for a callback in the capture phase, false for bubble.

     * @description Returns the function to invoke on listener when an event happens. This takes into account our logic on routing event callbacks
     * based on event type, phase and target's identifier.
     *
     */

    callbackForEventTypeListenerOnTargetInPhase: {
        value: function callbackForEventTypeListenerOnTargetInPhase(type, listener, target, capture, currentTarget) {
            var callback, currentTargetIdentifierSpecificPhaseMethodName, targetIdentifierSpecificPhaseMethodName, phaseMethodName;

            callback = ((currentTargetIdentifierSpecificPhaseMethodName = this._currentTargetIdentifierSpecificPhaseMethodName(capture, type, currentTarget.identifier)) && typeof listener[currentTargetIdentifierSpecificPhaseMethodName] === "function")
            ? currentTargetIdentifierSpecificPhaseMethodName
            : ((targetIdentifierSpecificPhaseMethodName =  this._currentTargetIdentifierSpecificPhaseMethodName(capture,type,target.identifier)) && typeof listener[targetIdentifierSpecificPhaseMethodName] === "function")
                ? targetIdentifierSpecificPhaseMethodName
                : (typeof listener[(phaseMethodName = this._currentTargetIdentifierSpecificPhaseMethodName(capture,type, null))] === "function")
                    ? phaseMethodName
                    : (typeof listener.handleEvent === "function")
                        ? "handleEvent"
                        : typeof listener === "function"
                            ? listener
                            : void 0;

            if(typeof callback === "string") {
                callback = listener[callback];
            }

            return callback;
        }
    },

        /**
     * @private
     */
    __invokeTargetListenerEntryForEvent: {
        value: function __invokeTargetListenerEntryForEvent(iTarget, listenerEntry, mutableEvent, phase, currentTargetIdentifierSpecificPhaseMethodName, targetIdentifierSpecificPhaseMethodName, phaseMethodName) {
            var listener = listenerEntry.listener,
                callback,
                // callbacks = listenerEntry.callbacks,
                result;


            //TEST, shutting currentTargetIdentifierSpecificPhaseMethodName down:
            //currentTargetIdentifierSpecificPhaseMethodName = null;

            // if(typeof listener === this._functionType) {
            //     result = listener.call(iTarget, mutableEvent);
            // } else {


            /*
                Caching the callback needs the same fallback strategy as finding it, worth it?
            */

            //if(!(callback = (callbacks && callbacks.get(iTarget)))) {

                    // callback = (currentTargetIdentifierSpecificPhaseMethodName && typeof (callback = listener[currentTargetIdentifierSpecificPhaseMethodName]) === this._functionType)
                    //     ? callback
                    //     : (targetIdentifierSpecificPhaseMethodName && typeof (callback = listener[targetIdentifierSpecificPhaseMethodName]) === this._functionType)
                    //         ? callback
                    //         : (typeof (callback = listener[phaseMethodName]) === this._functionType)
                    //             ? callback
                    //             : (typeof (callback = listener.handleEvent) === this._functionType)
                    //                 ? callback
                    //                 : void 0;


                    // callback = ((currentTargetIdentifierSpecificPhaseMethodName = this._currentTargetIdentifierSpecificPhaseMethodName(listenerEntry.capture, mutableEvent.type, iTarget.identifier)) && typeof listener[currentTargetIdentifierSpecificPhaseMethodName] === this._functionType)
                    // ? currentTargetIdentifierSpecificPhaseMethodName
                    // : ((targetIdentifierSpecificPhaseMethodName =  this._currentTargetIdentifierSpecificPhaseMethodName(listenerEntry.capture,mutableEvent.type,mutableEvent.target.identifier)) && typeof listener[targetIdentifierSpecificPhaseMethodName] === this._functionType)
                    //     ? targetIdentifierSpecificPhaseMethodName
                    //     : (typeof listener[(phaseMethodName = this._currentTargetIdentifierSpecificPhaseMethodName(listenerEntry.capture,mutableEvent.type, null))] === this._functionType)
                    //         ? phaseMethodName
                    //         : (typeof listener.handleEvent === this._functionType)
                    //             ? "handleEvent"
                    //             : typeof listener === this._functionType
                    //                 ? listener
                    //                 : void 0;

                    // if(typeof callback === "string") {
                    //     callback = listener[callback];
                    // }

                    callback = this.callbackForEventTypeListenerOnTargetInPhase(mutableEvent.type, listener, mutableEvent.target, listenerEntry.capture, iTarget);

                    // if(!listenerEntry.once) {
                    //     if(!callbacks) {
                    //         listenerEntry.callbacks = callbacks = new Map();
                    //     }
                    //     callbacks.set(iTarget, callback);
                    // }
                //}

                if(callback) {

                    mutableEvent.eventPhase = phase;
                    mutableEvent.currentTarget = iTarget;


                    //callback.call(listener, mutableEvent);
                    result = typeof callback !== "function"
                    ? listener[callback](mutableEvent)
                    : (callback === listener)
                        ? callback.call(iTarget, mutableEvent)
                        : callback.call(listener, mutableEvent);

                }
            //}

            if(listenerEntry.once) {
                this.unregisterTargetEventListener(iTarget, mutableEvent.type, listener, listenerEntry);
            }

            return result;

        }
    },

    _currentTargetIdentifierSpecificPhaseMethodName: {
        value: function(capture, eventType, targetIdentifier) {
            return capture
                ? this.methodNameForCapturePhaseOfEventType(eventType, targetIdentifier)
                : this.methodNameForBubblePhaseOfEventType(eventType, targetIdentifier);
        }
    },


    /**
     * Ensure that any components associated with DOM elements in the hierarchy between the
     * original activationEvent target and the window are preparedForActionEvents
     *
     * Benoit todo: Make this more generic and configurable to be applicable to different trees.
     *
     * @function
     * @private
     */
    _prepareComponentsForActivation: {
        value: function (eventTarget, canBecomeActiveTarget) {
            var target = eventTarget,
                previousTarget,
                targetView = target && target.defaultView ? target.defaultView : window,
                targetDocument = targetView.document ? targetView.document : document,
                associatedComponent,
                lookedForActiveTarget = false,
                activeTarget = null;

            do {
                if (target) {
                    associatedComponent = this.eventHandlerForElement(target);
                    if (associatedComponent) {

                        // Once we've found a component starting point,
                        // find the closest Target that accepts focus
                        if (!lookedForActiveTarget) {
                            lookedForActiveTarget = true;
                            activeTarget = this._findActiveTarget(associatedComponent);
                        }

                        if (!associatedComponent.preparedForActivationEvents) {
                            associatedComponent._prepareForActivationEvents();
                        }
                    }
                }

                previousTarget = target;

                // We only need to go up to the window, and even that's debateable as the activationEvent system really
                // only pertains to components, which are only ever associated with elements. The root element being the
                // exception which is associated with the document.
                switch (target) {
                    case targetView:
                        target = null;
                        break;
                    case targetDocument:
                        target = targetView;
                        break;
                    case targetDocument.documentElement:
                        target = targetDocument;
                        break;
                    default:
                        target = target.parentNode;
                        break;
                }

            } while (target && previousTarget !== target);

            if (canBecomeActiveTarget) {
                this.activeTarget = activeTarget;
            }
        }
    },
    _findActiveTargetMap : {
        value: undefined
    },
    /**
     * @private
     */
    _findActiveTarget: {
        value: function (target) {

            var foundTarget = null,
                checkedTargetMap = this._findActiveTargetMap;

            checkedTargetMap.clear();
            //TODO report if a cycle is detected?
            while (!foundTarget && target && !(checkedTargetMap.has(target))) {

                //TODO complain if a non-Target-alike is considered

                checkedTargetMap.set(target,true);

                if (target.acceptsActiveTarget) {
                    foundTarget = target;
                } else {
                    target = target.nextTarget;
                }
            }

            return foundTarget;
        }
    },

    _eventPathForTargetMap : {
        value: undefined
    },

    eventPathForTarget: {
        enumerable: false,
        value: function (target) {

            if (this.isBrowser && (this.isElement(target) || target instanceof Document || target === window)) {
                return this._eventPathForDomTarget(target);
            } else {
                return this._eventPathForTarget(target);
            }
        }
    },

    /**
     * Build the event target chain for the the specified Target
     * @private
     */
    _eventPathForTarget: {
        enumerable: false,
        value: function (target) {

            if (!target) {
                return this._emptyComposedPath;
            } else if(target.composedPath) {
                /*
                    If target has a commposedPath, it's likely cached.
                    So in case it's mutated by a listner, we're making a copy
                    to  guard against that.
                */
                return Array.from(target.composedPath);
            } else {

                var targetCandidate = target,
                    application = this.application,
                    eventPath = [],
                    discoveredTargets = this._eventPathForTargetMap;

                discoveredTargets.clear();

                // Consider the target "discovered" for less specialized detection of cycles
                // discoveredTargets.set(target,true);

                do {
                    if (!discoveredTargets.has(targetCandidate)) {
                        eventPath.push(targetCandidate);
                        discoveredTargets.set(targetCandidate,true);
                    }

                    targetCandidate = targetCandidate.nextTarget;

                    if (!targetCandidate || discoveredTargets.has(targetCandidate)) {
                        targetCandidate = application;
                    }

                    if (targetCandidate && discoveredTargets.has(targetCandidate)) {
                        targetCandidate = null;
                    }
                }
                while (targetCandidate);

                return eventPath;
            }

        }
    },

    _emptyComposedPath: {
        value: Object.freeze([])
    },
    /**
     * Build the event target chain for the the specified DOM target
     * @private
     */
    _eventPathForDomTarget: {
        enumerable: false,
        value: function (target) {

            if (!target) {
                return this._emptyComposedPath;
            }

            var targetCandidate = target,
                targetView = targetCandidate && targetCandidate.defaultView ? targetCandidate.defaultView : window,
                targetDocument = targetView.document ? targetView.document : document,
                targetApplication = this.application,
                previousBubblingTarget,
                eventPath = [];

            do {
                // Include the target itself as the root of the event's compsoedPath
                    eventPath.push(targetCandidate);

                previousBubblingTarget = targetCandidate;
                // use the structural DOM hierarchy until we run out of that and need
                // to give listeners on document, window, and application a chance to respond
                switch (targetCandidate) {
                    case targetApplication:
                        targetCandidate = targetCandidate.parentApplication;
                        if (targetCandidate) {
                            targetApplication = targetCandidate;
                        }
                        break;
                    case targetView:
                        targetCandidate = targetApplication;
                        break;
                    case targetDocument:
                        targetCandidate = targetView;
                        break;
                    case targetDocument.documentElement:
                        targetCandidate = targetDocument;
                        break;
                    default:
                        targetCandidate = targetCandidate.parentNode;

                        // Run out of hierarchy candidates? go up to the application
                        if (!targetCandidate) {
                            targetCandidate = targetApplication;
                        }

                        break;
                }
            }
            while (targetCandidate && previousBubblingTarget !== targetCandidate);

            return eventPath;
        }
    },

    /**
     * @private
     */
    _elementEventHandlerByElement: {
        enumerable: false,
        value: null
    },

    /**
     @function
     @param {Event} anElementEventHandler
     @param {Element} anElement
     */
    registerEventHandlerForElement: {
        enumerable: false,
        value: function (anElementEventHandler, anElement) {
            // console.log("registerEventHandlerForElement",anElementEventHandler,anElementEventHandler,anElement)
            var oldEventHandler = this.eventHandlerForElement(anElement);
            // unreference unused event handlers
            if (oldEventHandler) {
                if(oldEventHandler !== anElementEventHandler) {
                    this.unregisterEventHandlerForElement(anElement);
                    this._elementEventHandlerByElement.set(anElement,anElementEventHandler);
                }
            } else {
                this._elementEventHandlerByElement.set(anElement,anElementEventHandler);
            }
        }
    },

    /**
     @function
     @param {Element} anElement
     */
    unregisterEventHandlerForElement: {
        enumerable: false,
        value: function (anElement) {
            this._elementEventHandlerByElement.delete(anElement);
        }
    },
    /**
     @function
     @param {Element} anElement
     @returns this._elementEventHandlerByElement.get(anElement)
     */
    eventHandlerForElement: {
        enumerable: false,
        value: function (anElement) {
            return this._elementEventHandlerByElement.get(anElement);
        }
    },

    /**
     * @private
     */
    _activeTarget: {
        value: null
    },

    /**
     * The logical component that has focus within the application
     *
     * This can be used as the proximal target for dispatching in
     * situations where it logically makes sense that and event, while
     * created by some other component, should appear to originate from
     * where the user is currently focused.
     *
     * This is particularly useful for things such as keyboard shortcuts or
     * menuAction events.
     *
     * Prior to setting the activeTarget manually the desired target should
     * be checked to see if it `acceptsActiveTarget`. In the course of then
     * setting that target as the activeTarget, the current activeTarget
     * will be instructed to `surrendersActiveTarget`. If the activeTarget
     * refuses to surrender, the change is rejected.
     */
    activeTarget: {
        get: function () {
            return this._activeTarget || this.application;
        },
        set: function (value) {

            if (!value) {
                value = this.application;
            }

            if (value === this._activeTarget || (this.activeTarget && !this.activeTarget.surrendersActiveTarget(value))) {
                return;
            }

            if (value) {
                value.willBecomeActiveTarget(this.activeTarget);
                this._activeTarget = value;
                value.didBecomeActiveTarget();
            }
        }
    }

});

// Object.defineProperty(exports, "defaultEventManager", {
//     get: function () {
//         if (typeof defaultEventManager === "undefined") {
//             defaultEventManager = new EventManager();
//             if (typeof window !== "undefined") {
//                 defaultEventManager.initWithWindow(window);
//             }
//         }
//         return defaultEventManager;
//     }
// });

exports.defaultEventManager = defaultEventManager = new EventManager();
if (typeof window !== "undefined") {
    defaultEventManager.initWithWindow(window);
}
