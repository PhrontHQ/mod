var Montage = require("./core").Montage,
    defaultEventManager = require("./event/event-manager").defaultEventManager,
    MutableEvent = require("./event/mutable-event").MutableEvent;

/**
 * A Target is any object that can be a candidate for dispatching and receiving
 * events distributed troughout a tree. One such tree is the "component tree" of a
 * Montage application.
 *
 * @class Target
 * @extends Montage
 */
exports.Target = class Target extends Montage {

    static {
        // const p = this.prototype;

        // /**
        //  * Provides a reference to the Montage event manager used in the
        //  * application.
        //  *
        //  * @property {EventManager} value
        //  * @default defaultEventManager
        //  */
        // p.eventManager = defaultEventManager;

        // /**
        //  * Whether or not this target can accept user focus and become the
        //  * activeTarget This matches up with the `document.activeElement` property
        //  * purpose-wise; Events from components that should be dispatched as
        //  * logically occurring at the point of user focus should be dispatched at
        //  * the activeTarget
        //  *
        //  * By default a target does not accept this responsibility.
        //  *
        //  * @type {boolean}
        //  * @default false
        //  */
        // p.acceptsActiveTarget = false;

        // /**
        //  * Called prior to this target becoming the activeTarget
        //  * @function
        //  * @param {Target} oldTarget the current activeTarget
        //  */
        // p.willBecomeActiveTarget = Function.noop;

        // /**
        //  * Called after to this target became the activeTarget
        //  * @function
        //  */
        // p.didBecomeActiveTarget = Function.noop;

        // /**
        //  * Which target to distribute an event after this when distributing events
        //  * throughout a graph of targets.
        //  * @property {boolean} serializable
        //  * @property {Target} value
        //  */
        // p.nextTarget = null;


        Montage.defineProperties(this.prototype, {

            /**
             * Provides a reference to the Montage event manager used in the
             * application.
             *
             * @property {EventManager} value
             * @default defaultEventManager
             */
            eventManager: {value: defaultEventManager, serializable: false},

            /**
             * Whether or not this target can accept user focus and become the
             * activeTarget This matches up with the `document.activeElement` property
             * purpose-wise; Events from components that should be dispatched as
             * logically occurring at the point of user focus should be dispatched at
             * the activeTarget
             *
             * By default a target does not accept this responsibility.
             *
             * @type {boolean}
             * @default false
             */
            acceptsActiveTarget: {value: false, serializable: false},

            /**
             * Called prior to this target becoming the activeTarget
             * @function
             * @param {Target} oldTarget the current activeTarget
             */
            willBecomeActiveTarget: {value: Function.noop},

            /**
             * Called after to this target became the activeTarget
             * @function
             */
            didBecomeActiveTarget: {value: Function.noop},

            /**
             * Which target to distribute an event after this when distributing events
             * throughout a graph of targets.
             * @property {boolean} serializable
             * @property {Target} value
             */
            nextTarget: {value: null, serializable: false},

            /**
             * Optional. If present, EventManager will call this, otherwise it will use nextTarget
             * Returns all next targets on which listeners will be invoked, similar to 
             * https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath
             * @property {Array<Target>}
             */
            composedPath: { value: undefined },

            /**
             * Map storing the last timestamp when each interaction type was processed
             * @type {Map<string, number>}
             * @private
             */
            __debouncedInteractionTimestamps: { value: null },

            /**
             * Map of threshold durations (in milliseconds) for each interaction type
             * @type {Map<string, number>}
             * @private
             */
            __debouncedInteractionThresholds: { value: null },
        });
    }

    get _debouncedInteractionTimestamps() {
        if (!this.__debouncedInteractionTimestamps) {
            this.__debouncedInteractionTimestamps = new Map();
        }
        
        return this.__debouncedInteractionTimestamps;
    }

    get _debouncedInteractionThresholds() {
        if (!this.__debouncedInteractionThresholds) {
            this.__debouncedInteractionThresholds = new Map();
        }

        return this.__debouncedInteractionThresholds;
    }

    /**
     * Whether or not this is the activeTarget
     *
     * This is a getter and is not bindable. Bind to
     * `defaultEventManager.activeTarget == this`.
     *
     * @type {boolean}
     * @readonly
     */
    get isActiveTarget() {
        return this === defaultEventManager.activeTarget;
    }

    registerInteractionForDebounce(interactionKey, threshold) {
        this._debouncedInteractionThresholds.set(interactionKey, threshold);
    }

    unregisterInteractionForDebounce(interactionKey) {
        this._debouncedInteractionThresholds.delete(interactionKey);
        this._debouncedInteractionTimestamps.delete(interactionKey);
    }

    shouldPreventInteraction(interactionKey) {
        if (!this._debouncedInteractionThresholds.has(interactionKey)) return false;

        const currentTime = Date.now();
        const lastTime = this._debouncedInteractionTimestamps.get(interactionKey) || 0;
        const threshold = this._debouncedInteractionThresholds.get(interactionKey) || 0;
        const delta = currentTime - lastTime;

        // Check if we need to debounce
        if (lastTime > 0 && delta < threshold) return true;

        // Update timestamp for this interaction type
        this._debouncedInteractionTimestamps.set(interactionKey, currentTime);

        return false;
    }

    /**
     * Ask this target to surrender its activeTarget status.
     * @function
     * @param {Target} newTarget the Target that is about to become the
     * `activeTarget`
     * @returns {boolean} Whether or not to surrender activeTarget status
     */
    surrendersActiveTarget(newTarget) {
        return true;
    }

    /**
     * Dispatches the specified event with this target
     * as the event's proximal target
     * @function
     * @param {Event} event The event object to dispatch
     */
    dispatchEvent(event) {
        if(!event) return;
        var targettedEvent = (event instanceof MutableEvent) ? event : MutableEvent.fromEvent(event);
        targettedEvent.target = this;
        defaultEventManager.handleEvent(targettedEvent);
        return !event.defaultPrevented;
    }

    /**
     * Creates and dispatches an event with the specified properties with this
     * target as the event's proximal target
     * @function
     * @param {string} type The type of the event to dispatch
     * @param {boolean} canBubble Whether or not the event can bubble
     * @param {boolean} cancelable Whether or not the event can be cancelled
     * @param {Object} detail The optional detail object of the event
     */
    dispatchEventNamed(type, canBubble, cancelable, detail) {
        var event = MutableEvent.fromType(type, canBubble, cancelable, detail);
        event.target = this;
        defaultEventManager.handleEvent(event);

        return !event.defaultPrevented;
    }

    /**
     * Adds an event listener to the object.
     * @function
     * @param {string} type The event type to listen for.
     * @param {object | function} listener The listener object or function.
     * @param {object | boolean} useCapture Specifies whether to listen for the event during the bubble or capture phases.
     */
    addEventListener(type, listener, optionsOrUseCapture) {
        if (listener) {
            defaultEventManager.registerTargetEventListener(this, type, listener, optionsOrUseCapture);
        }
    }

    /**
     * Removes an event listener from the object.
     * @function
     * @param {string} type The event type.
     * @param {object | function} listener The listener object or function.
     * @param {object | boolean} useCapture The phase of the event listener.
     */
    removeEventListener(type, listener, optionsOrUseCapture) {
        if (listener) {
            defaultEventManager.unregisterTargetEventListener(this, type, listener, optionsOrUseCapture);
        }
    }

    /**
     * Load a Composer
     * @function
     * @param {Composer} composer
     */
    loadComposer(composer) {
        if (composer && !composer._isLoaded) {
            composer._resolveDefaults();
            composer.load();
            composer._isLoaded = true;
        }
    }

    /**
     * Unload a Composer
     * @function
     * @param {Composer} composer
     */
    unloadComposer(composer) {
        if (composer && composer._isLoaded) {
            composer.unload();
            composer._isLoaded = false;
        }
    }


}


// var prototype = exports.Target.prototype;
// Montage.defineProperties(exports.Target.prototype, {
//     /**
//      * Provides a reference to the Montage event manager used in the
//      * application.
//      *
//      * @property {EventManager} value
//      * @default defaultEventManager
//      */
//     eventManager: {
//         value: defaultEventManager
//     },

//      /**
//      * Whether or not this target can accept user focus and become the
//      * activeTarget This matches up with the `document.activeElement` property
//      * purpose-wise; Events from components that should be dispatched as
//      * logically occurring at the point of user focus should be dispatched at
//      * the activeTarget
//      *
//      * By default a target does not accept this responsibility.
//      *
//      * @type {boolean}
//      * @default false
//      */
//      acceptsActiveTarget: {
//         value: false
//     },

//     /**
//      * Which target to distribute an event after this when distributing events
//      * throughout a graph of targets.
//      * @property {boolean} serializable
//      * @property {Target} value
//      */
//     nextTarget: {
//         value: null
//     }
// });

// prototype.eventManager = defaultEventManager;
// prototype.acceptsActiveTarget = false;
// prototype.willBecomeActiveTarget = Function.noop;
// prototype.didBecomeActiveTarget = Function.noop;
// prototype.nextTarget = null;

// // exports.Target = Montage.specialize( /** @lends Target.prototype */
// Object.defineProperties(exports.Target.prototype,

// {

//     /**
//      * Provides a reference to the Montage event manager used in the
//      * application.
//      *
//      * @property {EventManager} value
//      * @default defaultEventManager
//      */

//     eventManager: {
//         value: defaultEventManager,
//         serializable: false
//     },
//     /**
//      * Whether or not this target can accept user focus and become the
//      * activeTarget This matches up with the `document.activeElement` property
//      * purpose-wise; Events from components that should be dispatched as
//      * logically occurring at the point of user focus should be dispatched at
//      * the activeTarget
//      *
//      * By default a target does not accept this responsibility.
//      *
//      * @type {boolean}
//      * @default false
//      */
//     acceptsActiveTarget: {
//         serializable: false,
//         value: false
//     },

//     /**
//      * Whether or not this is the activeTarget
//      *
//      * This is a getter and is not bindable. Bind to
//      * `defaultEventManager.activeTarget == this`.
//      *
//      * @type {boolean}
//      * @readonly
//      */
//     isActiveTarget: {
//         get: function () {
//             return this === defaultEventManager.activeTarget;
//         }
//     },

//     /**
//      * Called prior to this target becoming the activeTarget
//      * @function
//      * @param {Target} oldTarget the current activeTarget
//      */
//     willBecomeActiveTarget: {
//         value: Function.noop
//     },

//     /**
//      * Called after to this target became the activeTarget
//      * @function
//      */
//     didBecomeActiveTarget: {
//         value: Function.noop
//     },

//     /**
//      * Ask this target to surrender its activeTarget status.
//      * @function
//      * @param {Target} newTarget the Target that is about to become the
//      * `activeTarget`
//      * @returns {boolean} Whether or not to surrender activeTarget status
//      */
//     surrendersActiveTarget: {
//         value: function (newTarget) {
//             return true;
//         }
//     },

//     /**
//      * Which target to distribute an event after this when distributing events
//      * throughout a graph of targets.
//      * @property {boolean} serializable
//      * @property {Target} value
//      */
//     nextTarget: {
//         serializable: false,
//         value: null
//     },

//     /**
//      * Dispatches the specified event with this target
//      * as the event's proximal target
//      * @function
//      * @param {Event} event The event object to dispatch
//      */
//     dispatchEvent: {
//         value: function dispatchEvent(event) {
//             if(!event) return;
//             var targettedEvent = (event instanceof MutableEvent) ? event : MutableEvent.fromEvent(event);
//             targettedEvent.target = this;
//             defaultEventManager.handleEvent(targettedEvent);
//             return !event.defaultPrevented;
//         }
//     },

//     /**
//      * Creates and dispatches an event with the specified properties with this
//      * target as the event's proximal target
//      * @function
//      * @param {string} type The type of the event to dispatch
//      * @param {boolean} canBubble Whether or not the event can bubble
//      * @param {boolean} cancelable Whether or not the event can be cancelled
//      * @param {Object} detail The optional detail object of the event
//      */
//     dispatchEventNamed: {
//         value: function (type, canBubble, cancelable, detail) {
//             var event = MutableEvent.fromType(type, canBubble, cancelable, detail);
//             event.target = this;
//             defaultEventManager.handleEvent(event);

//             return !event.defaultPrevented;
//         }
//     },

//     /**
//      * Adds an event listener to the object.
//      * @function
//      * @param {string} type The event type to listen for.
//      * @param {object | function} listener The listener object or function.
//      * @param {object | boolean} useCapture Specifies whether to listen for the event during the bubble or capture phases.
//      */
//     addEventListener: {
//         value: function addEventListener(type, listener, optionsOrUseCapture) {
//             if (listener) {
//                 defaultEventManager.registerTargetEventListener(this, type, listener, optionsOrUseCapture);
//             }
//         }
//     },

//     /**
//      * Removes an event listener from the object.
//      * @function
//      * @param {string} type The event type.
//      * @param {object | function} listener The listener object or function.
//      * @param {object | boolean} useCapture The phase of the event listener.
//      */
//     removeEventListener: {
//         value: function removeEventListener(type, listener, optionsOrUseCapture) {
//             if (listener) {
//                 defaultEventManager.unregisterTargetEventListener(this, type, listener, optionsOrUseCapture);
//             }
//         }
//     },

//     /**
//      * Load a Composer
//      * @function
//      * @param {Composer} composer
//      */
//     loadComposer: {
//         value: function (composer) {
//             if (composer && !composer._isLoaded) {
//                 composer._resolveDefaults();
//                 composer.load();
//                 composer._isLoaded = true;
//             }
//         }
//     },

//     /**
//      * Unload a Composer
//      * @function
//      * @param {Composer} composer
//      */
//     unloadComposer: {
//         value: function (composer) {
//             if (composer && composer._isLoaded) {
//                 composer.unload();
//                 composer._isLoaded = false;
//             }
//         }
//     }

// });

