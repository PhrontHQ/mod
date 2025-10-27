/**
    @module phront/data/main.mod/model/app/user-agent-window
*/

const DataObject = require("../data-object").DataObject;
const Montage = require("core/core").Montage;

/**
 * @class UserAgentWindow
 * @extends DataObject
 *
 * A UserAgentWindow represents a window in a user agent (e.g., a browser tab).
 *
 */
exports.UserAgentWindow = class UserAgentWindow extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            name: {
                value: undefined,
            },
            /**
             * The time range models when the window is opened and closed.
             * By default there will be one.
             */
            durationTimeRange: {
                value: undefined,
            },

            /**
             * The position of the window over time.
             * An array of LogEntry objects:
             *  {
             *      time: aDate,
             *      value: aPoint
             *  }
             *
             * @property {Array<PointLogEntry>>} value
             */
            positionTimeLog: {
                value: undefined,
            },

            /**
             * The size of the window over time.
             * An array of LogEntry objects:
             *  {
             *      time: aDate,
             *      value: aUserAgentWindowSize
             *  }
             *
             * @property {Array<PointLogEntry>>} value
             */
            sizeTimeLog: {
                value: undefined,
            },

            /**
             * The screen the window is on over time.
             * An array of LogEntry objects:
             *  {
             *      time: aDate,
             *      value: aScreen
             *  }
             * If a screen chatacteristics were to change while a window is on it,
             * like a user tweaking it's computer display settings, like changing resolution,
             * we would add a new screen in the log with the new characteristics,
             * if we were able to track that and know about it.
             *
             * @property {Array<PointLogEntry>>} value
             */
            screenTimeLog: {
                value: undefined,
            },
        });
    }
};
