const   Montage = require("../../core/core").Montage,
        Target = require("../../core/target").Target,
        DataEvent = require("./data-event").DataEvent,
        Date = require("core/extras/date").Date;

/**
 * @class DataObject
 * @extends Montage
 */


 /*
    Need to be able to set creationDate when an instance is created by
    the DataService. Not when the instance is created by the constructor.

    A proposal is to have a "datacreate" or "create" event whose target is
    the new instance. That is listened to by some code that does it.

    We could then later build a UI to do the same visually.
*/

exports.DataObject = class DataObject extends Target {

    constructor() {
        super()
    }

    static {

        Montage.defineProperties(this.prototype, {

            /**
             * The full moduleId of the object, starting by the name of the package it belongs to
             *
             * @property {Object}
             * @default null
             */
            fullModuleId: { value: undefined},

            /**
             * Stores the latest known data snapshot from an origin service it was imported from. 
             * An entry per origin data service contains the data snapshot from that origin
             *
             * @property {Object}
             * @default null
             */
            originDataSnapshot: { value: undefined},

            
            /**
             * The primaryKey from a different system a Data Object may have come from originally
             *
             * @property {Object}
             * @default null
             */
            originId: { value: undefined},

            /**
             * If true, indicates that an instance is used by others as their type, 
             * which is the equivalent of the role of the prototype in JavaScript: 
             * an object one derived from
             *
             * @property {boolean}
             * @default false
             */
            isType: { value: false},

            /**
             * The reference to what would be an object's prototype in JavaScript: 
             * A unique instance of parent class that defines common characteristics for all objects of that type
             *
             * @property {Object}
             * @default undefined
             */
            type: { value: false},

            /**
             * All instances of this class and/or subclasses that are also used as types
             *
             * @property {Array<Object>}
             * @default undefined
             */
            subtypes: { value: false},

            /**
             * All instances of that class that have the same type and that are not used as type, meaning the value of their property 'isType' is false
             *
             * @property {Array<Object>}
             * @default undefined
             */
            typeInstances: { value: false},

            /**
             * If true, indicates that an instance is used by others as a source of default values
             *
             * @property {String}
             * @default undefined
             */
            isTemplate: { value: false},

            /**
             * The reference to another obect of the same class that acts as a template, 
             * providing default values
             *
             * @property {Object}
             * @default undefined
             */
            template: { value: false},

            /**
             * All instances of that class that have the same type and that are not used as type, meaning the value of their property 'isType' is false
             *
             * @property {Array<Object>}
             * @default undefined
             */
            templateInstances: { value: false},

            /**
             * The description of what a data object is
             *
             * @property {String}
             * @default undefined
             */
            description: { value: undefined},

            /**
             * The time a data object was created
             *
             * @property {Date}
             * @default undefined
             */
            creationDate: { value: undefined},

            // /**
            //  * The identity of the user who created a data object.
            //  * WOULD BE BETTER HANDLED AS PART OD HAVING A LOG THAT RECORDS OVER TIME
            //  *
            //  * @property {Identity}
            //  * @default undefined
            //  */
            // creationIdentity: { value: undefined},


            /**
             * The last time a data object was modified
             * WOULD BE BETTER HANDLED AS PART OD HAVING A LOG THAT RECORDS OVER TIME
             *
             * @property {Date}
             * @default undefined
             */
            modificationDate: { value: undefined},

            // /**
            //  * The identity of the user who last modified a data object. This would be better as
            //  * WOULD BE BETTER HANDLED AS PART OF HAVING A LOG THAT RECORDS OVER TIME
            //  *
            //  * @property {Identity}
            //  * @default undefined
            //  */
            // modderIdentity: { value: undefined},

            /**
             * The last time a data object was published, as in getting "live"
             * WOULD BE BETTER HANDLED AS PART OD HAVING A LOG THAT RECORDS OVER TIME
             *
             * @property {Date}
             * @default undefined
             */
            publicationDate: { value: undefined},

            // /**
            //  * The identity of the user who last published a data object, as in getting getting "live"
            //  * WOULD BE BETTER HANDLED AS PART OD HAVING A LOG THAT RECORDS OVER TIME
            //  *
            //  * @property {Date}
            //  * @default undefined
            //  */
            // publisherIdentity: { value: undefined}

            /**
             * states wether a data object is allowed to change. This has implication to prevent changes 
             * - Object.freeze() and not tracking changes, as well as fetching those first from previous 
             * fetch if they've been fetched already.
             *
             * @property {boolean}
             * @default true
             */
            isReadOnly: { value: false},

        });
    }

    date() {
        return Date.date;
    }


    deserializeSelf(deserializer) {
        if(super.deserializeSelf) {
            super.deserializeSelf(deserializer);
        }


        /*
            Can't use this unless we know that this.objectDescriptor is available to us
        */
        if(this.objectDescriptor) {
            let propertyDescriptors = this.objectDescriptor.propertyDescriptors;

            //for (let i=0, iPropertyDescriptor = 0, iValue, countI = propertyDescriptors.length; i < countI; i++) {
            for (let iPropertyDescriptor of propertyDescriptors) {
                if(deserializer.hasProperty(iPropertyDescriptor.name)) {
                    this[iPropertyDescriptor.name] = deserializer.getProperty(iPropertyDescriptor.name);
                }
                // let iValue = deserializer.getProperty(iPropertyDescriptor.name);
                // if (iValue !== void 0) {
                //     this[iPropertyDescriptor.name] = iValue;
                // }
            }    
        } 
        /*
            Backward compatibility, only run if we don't have an objectDescriptor
        */
        else {
            var value;
            value = deserializer.getProperty("originId");
            if (value !== void 0) {
                this.originId = value;
            }
            value = deserializer.getProperty("originDataSnapshot");
            if (value !== void 0) {
                this.originDataSnapshot = value;
            }
    
            value = deserializer.getProperty("isType");
            if (value !== void 0) {
                this.isType = value;
            }
            value = deserializer.getProperty("isTemplate");
            if (value !== void 0) {
                this.isTemplate = value;
            }
    
            value = deserializer.getProperty("description");
            if (value !== void 0) {
                this.description = value;
            }
            value = deserializer.getProperty("creationDate");
            if (value !== void 0) {
                this.creationDate = value;
            }
            value = deserializer.getProperty("modificationDate");
            if (value !== void 0) {
                this.modificationDate = value;
            }
            value = deserializer.getProperty("publicationDate");
            if (value !== void 0) {
                this.publicationDate = value;
            }
    
        }


    }

    serializeSelf(serializer) {
        if(this.originId) {
            serializer.setProperty("originId", this.originId);
        }
        if(this.originDataSnapshot) {
            serializer.setProperty("originDataSnapshot", this.originDataSnapshot);
        }
        
        if(this.isType !== undefined) {
            serializer.setProperty("isType", this.isType);
        }
        if(this.isTemplate !== undefined) {
            serializer.setProperty("isTemplate", this.isTemplate);
        }

        if(this.description) {
            serializer.setProperty("description", this.description);
        }
        if(this.creationDate) {
            serializer.setProperty("creationDate", this.creationDate);
        }
        if(this.modificationDate) {
            serializer.setProperty("modificationDate", this.modificationDate);
        }
        if(this.publicationDate) {
            serializer.setProperty("publicationDate", this.publicationDate);
        }
    }

    /*
        This class methods are polymorphic, which poses a problem.
        Object needs to receive create events from Object instances and all instances inheriting from Object.

        So it needs to listen to dataService and filter, which is a bit wasteful
        or we could propagate the event with nextTarget to go through the propertyDescriptor hierarchy and then Object can listen only on it's Object Descriptor.

        BUT as these methds are inherited when declared in specializes, the handle methods are a problem.

    */

    /**
     * prepareToHandleDataEvents helps register lazily prepare DO's custom logic.
     * Each type listens to events issued by it's corresponding ObjectDescriptor
     * @param {DataEvent} event the first event triggering the prepareToHandleDataEvents
     */

    static prepareToHandleDataEvents (event) {
        event.dataService.objectDescriptorForType(this).addEventListener(DataEvent.create,this,false);
    }

    static handleCreate(event) {
        // if(event.dataObject instanceof this) {
            event.dataObject.creationDate = event.dataObject.modificationDate = new Date();
        // }
    }

    static handleUpdate(event) {
        event.dataObject.modificationDate = new Date();
    }

}
