/**
    @module phront/data/main.mod/model/app/web-socket-session
*/

const    Montage = require("core/core").Montage,
        DataObject = require("../data-object").DataObject;

/**
 * @class WebSocketSessionConnection
 * @extends DataObject
 *
 * A WebSocketSessionConnection is the representation of a client agent connecting
 * via a WebSocket to serverlss DataWorkers for a continuous period of time
 * a WebSocketSession has an array of WebSocketSessionConnection, which happens
 * if a client keeps running while the APIGateway disconnects it and it reconnects as needed.
 * Later on, when we can revive a full session with the snapshot of data rwad and all,
 * it add another use case where we'd had more re-connections.
 */

const WebSocketSessionConnection = exports.WebSocketSessionConnection = class WebSocketSessionConnection extends DataObject {
    static {

        Montage.defineProperties(this.prototype, {

            /**
             * The WebSocketSession the connection belongs to
             */
            session: {
                value: undefined
            },

            /**
             * The WebSocket connectionId that’s created and provided by AWS API Gateway
             */
            serverConnectionId: {
                value: undefined
            }
        });
    }
}
