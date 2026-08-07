/**
    @module phront/data/main.mod/model/app/web-socket-session
*/

var DataObject = require("../data-object").DataObject,
    DataEvent = require("../data-event").DataEvent,
    uuid = require("core/uuid"),
    Montage = require("core/core").Montage;

/**
 * @class WebSocketSession
 * @extends DataObject
 *
 * A WebSocketSession is the representation of a client agent conneting via a WebSocket
 *  to serverlss DataWorkers.
 *
 */


const WebSocketSession = exports.WebSocketSession = class WebSocketSession extends DataObject {

    static {

        Montage.defineProperties(this.prototype, {
            /**
             * The specific app that is run by the client. We should have the matching object
             * known in the databse, with version and all, from a publish done by a user
             * authorized to do so before
             */
            app: {
                value: undefined
            },

            /**
             * the softwareAgent client of the session. The software agent is what runs the app.
             * For client side apps, it's a browser or a custom app.
             * For the cloud, it would be the API Gateway lambda environment,
             *  which like client apps has a JavaScript runtime. Another piece of software
             */
            softwareAgent: {
                value: undefined
            },

            /*
                The device the softwareAgent is running on
            */
            device: {
                value: undefined
            },

            /**
             * The WebSocket connectionId that’s created and provided by AWS API Gateway
             */
            connections: {
                value: undefined
            },

            /**
             * The time range modeling the beginning and end of the session
             */
            durationTimeRange: {
                value: undefined
            },

            /**
             * The locale used by the app, over time if it changes.
             * Most of the time we'll have only one
             *
             * @property {Array<Range<Date>>} value
             */
            localeTimeLog: {
                value: undefined
            },

            /**
             * The locale used by the app, over time if it changes.
             * Most of the time we'll have only one
             *
             * @property {Array<Range<Date>>} value
             */
            timeZoneTimeLog: {
                value: undefined
            },

            /**
             * The locale used by the app, over time if it changes.
             * Most of the time we'll have only one
             *
             * @property {Array<Windows>} value
             */
            windows: {
                value: undefined
            }
        });
    }

    /**
     * prepareToHandleDataEvents helps register lazily prepare DO's custom logic.
     * Each type listens to events issued by it's corresponding ObjectDescriptor
     * @param {DataEvent} event the first event triggering the prepareToHandleDataEvents
     */

    static prepareToHandleDataEvents (event) {
        event.dataService.objectDescriptorForType(this).addEventListener(DataEvent.create,this,false);
    }

    /*
        TODO: Serialization of DataObjects and subclassess need to be automatic. Maybe just removing this?
    */

    deserializeSelf(deserializer) {

        //no super
        // super.deserializeSelf(deserializer);

        var result, value;
        value = deserializer.getProperty("id");
        if (value !== void 0) {
            this.id = value;
        }

        value = deserializer.getProperty("identity");
        if (value !== void 0) {
            this.identity = value;
        }

        value = deserializer.getProperty("connections");
        if (value !== void 0) {
            this.connections = value;
        }

    }
    
    serializeSelf(serializer) {
        //no super
        //super.serializeSelf(serializer);

        if(this.id) {
            serializer.setProperty("id", this.id);
        }

        if(this.identity) {
            serializer.setProperty("identity", this.identity);
        }

        if(this.connections) {
            serializer.setProperty("connections", this.connections);
        }

    }

}