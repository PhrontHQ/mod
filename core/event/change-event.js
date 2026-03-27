var Montage = require("../core").Montage,
    RangeChange = require("./range-change").RangeChange;

/**
 * Models changes happening to an Object's properties/keys as well as changes to data structures such as Arrays,
 * Set or Map. It synthesizes multiple aspects of Collection's listen features under one event object
 * and one familiar pattern: events.
 *
 * The addEventListener's listener's option object should be used to limit the scope of what properties/keys are listened to, in order to limit the overhead in setting up the raw mechanics of observing and dispatchnng changes.
 *
 * @class
 * @extends Montage
 */

 //MutableEvent is restricted to use on the client only...

var ChangeEvent = exports.ChangeEvent = Montage.specialize({
    constructor: {
        value: function ChangeEvent() {
            this.timeStamp = performance.now();
            return this;
        }
    },

    type: {
        value: "change"
    },
    cancelable: {
        value: false
    },
    target: {
        value: "change"
    },
    _currentTarget: {
        value: void 0
    },
    /**
     * @type {Property}
     * @default {Targer} null
     */
    currentTarget: {
        get: function () {
            return this._currentTarget;
        },
        set: function (value) {
            this._currentTarget = value;
        }
    },

    bubbles: {
        value: true
    },

    /**
     * The property whose value may have changed. Property feels like a better name than "key"
     *
     * @type {String}
     * @default null
     */
    property: {
        value: undefined
    },
    /**
     * The key/property whose value may have changed
     *
     * @type {String}
     * @default null
     */
    key: {
        get: function () {
            return this.property;
        },
        set: function (value) {
            this.property = value;
        }
    },

    /**
     * The property for target's property
     *
     * @type {PropertyDescriptor}
     * @default null
     */
    _propertyDescriptor: {
        value: undefined
    },
    propertyDescriptor: {
        get: function () {
            if(!this._propertyDescriptor) {
                this._propertyDescriptor = this.target.objectDescriptor.propertyDescriptorNamed(this.property);
            }
            return this._propertyDescriptor;
        },
        set: function (value) {
            if(value !== this._propertyDescriptor) {
                this._propertyDescriptor = value;
            }
        }
    },

    /**
     * The value of property before it was changed
     *
     * @type {Object}
     * @default null
     */
    previousPropertyValue: {
        value: undefined
    },
    previousKeyValue: {
        get: function () {
            return this.previousPropertyValue;
        },
        set: function (value) {
            this.previousPropertyValue = value;
        }
    },

    /**
     * The current value of the property
     *
     * @type {Object}
     * @default null
     */
    propertyValue: {
        value: undefined
    },
    keyValue: {
        get: function () {
            return this.propertyValue;
        },
        set: function (value) {
            this.propertyValue = value;
        }
    },


    /**
     * Alternative: group all range changes under 1 typed RangeChange object that
     * combines index, added and removed values
     *
     * @type {RangeChange}
     * @default null
     */
    rangeChange: {
        value: undefined
    },

    /**
     * For an ordered property with a cardinality > 1,
     * the index where the change happens
     *
     * @type {Object}
     * @default null
     */
    index: {
        value: undefined
    },

    /**
     * For an ordered property with a cardinality > 1,
     * the values added to the range starting at rangeIndex
     *
     * @type {Object}
     * @default null
     */
    addedValues: {
        value: undefined
    },

    /**
     * For an ordered property with a cardinality > 1,
     * the values removed from the range starting at rangeIndex
     *
     * @type {Object}
     * @default null
     */
    removedValues: {
        value: undefined
    }

});
