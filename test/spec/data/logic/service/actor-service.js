var RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    ActorNames = ["Cary Grant", "John Wayne", "Jack Nicholson"];

// exports.ActorService = RawDataService.specialize(/** @lends ActorService.prototype */ {
const ActorService = exports.ActorService = class ActorService extends RawDataService {/** @lends ActorService */
}

ActorService.addClassProperties({

    supportsDataOperation: {
        value: false
    },

    fetchRawData: {
        value: function (stream) {;
            this.addRawData(stream, ActorNames.map((name) => {
                return {name: name}
            }));
            this.rawDataDone(stream);
        }
    }

});
