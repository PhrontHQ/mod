var RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    AuthorizationPolicy = require("mod/data/service/authorization-policy").AuthorizationPolicy;

// exports.UpFrontService = RawDataService.specialize(/** @lends UpFrontService.prototype */ {
const UpFrontService = exports.UpFrontService = class UpFrontService extends RawDataService {/** @lends UpFrontService */
}

UpFrontService.addClassProperties({

    authorizationServices: {
        value: ["spec/data/logic/authorization/authorization-service"]
    },

    authorizationPolicy: {
        value: AuthorizationPolicy.UP_FRONT
    },

    fetchRawData: {
        value: function (stream) {
            stream.dataDone();
        }
    }

});
