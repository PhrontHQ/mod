/**
 * @author Benoit Marchant
 */

 /**
 * @module montage/core/event/change-event
 * @requires montage/core/event/event-provider
 * @requires montage/core/event/event-manager
 */

/**
 *
 *
 * Today in core.js
 * // Property Changes
 *

    var PropertyChanges = require("collections/listen/property-changes");
    Object.addEach(Montage, PropertyChanges.prototype);
    Object.addEach(Montage.prototype, PropertyChanges.prototype);


    PropertyChanges.prototype.makePropertyObservable = function (key, makeObservableOnPrototype) {

    PropertyChanges.prototype.addOwnPropertyChangeListener = function (key, listener, beforeChange) {
    PropertyChanges.prototype.removeOwnPropertyChangeListener = function removeOwnPropertyChangeListener(key, listener, beforeChange) {

        PropertyChanges.prototype.addBeforeOwnPropertyChangeListener = function (key, listener) {
        PropertyChanges.prototype.removeBeforeOwnPropertyChangeListener = function (key, listener) {

    PropertyChanges.prototype.dispatchOwnPropertyChange = function dispatchOwnPropertyChange(key, value, beforeChange) {
        PropertyChanges.prototype.dispatchBeforeOwnPropertyChange = function (key, listener) {



    it should test listener callbacks using propertyName on top of identifier, so for an object with identifier "foo" whose property "name" changes:

    1) phase + identifier + PropertyName + event type: handleFooNameChange,
    2) phase + identifier + event type: handleFooChange,
    3) phase + propertyName + event type: handleNameChange,
    4) phase +  event type: handlePropertyChange

            var aTarget = this,
                event = new CustomEvent("change", {
                    keyValue: this.foo,
                    key: "foo",
                    bubbles: false
            });
            this.dispatchEvent(event);

    Or

                var aTarget = this,
                event = new CustomEvent("willChange", {
                    keyValue: this.foo,
                    key: "foo",
                    bubbles: false
            });
            this.dispatchEvent(event);




 *foo.addEventListener(“change”, this, {before: true, expressions: [“name”, “surname”, "mother.lastName"]});

 For using this with size, abstractiong ResizeObserver(), the observe() method can have an option itself. So we need to be able to provide options per expression. 
 Doing so for a property that is involved in a more complex expression is challenging.

foo.addEventListener(“change”, this, { 
    “name”: {
        before: true
    }, 
    “surname”: undefined, //No option here
    "mother.lastName": {
        before: true
    }
});

this.element.addEventListener(“change”, this, { 
    "size": {
        box: "device-pixel-content-box"
    }
});


internally we'll use observeExpression() in core.js

 Without options:properties/property, it would be all
 */


var EventProvider = require("./event-provider").EventProvider,
    defaultEventManager = require("./event-manager").defaultEventManager;


var ChangeEventProvider = exports.ChangeEventProvider = EventProvider.specialize(/** @lends EventProvider.prototype */{

    willRegisterEventListener: {
        value: function EventProvider_proto_registerEventListener(target, type, listener, useCapture_options) {
            var properties = useCapture_options.properties || useCapture_options.property;

            if(Array.isArray(properties)) {
                for(var i=0, countI = properties.length)

            }
            else {
                this.makeTargetPropertyObservable(target,property);
            }


        }
    },

    makeTargetPropertyObservable: {
        value: function EventProvider_proto_registerEventListener(target, property) {
            var properties

            //1. Check that target's property is observeable.


        }
    },

    willUnregisterEventListener: {
        value: function EventProvider_proto_unregisterEventListener(target, type, listener, useCapture_options) {

        }
    }



});

