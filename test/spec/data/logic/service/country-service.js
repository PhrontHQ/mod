var RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    CountryNames = ["USA"];

// exports.CountryService = RawDataService.specialize(/** @lends CategoryService.prototype */ {
const CountryService = exports.CountryService = class CountryService extends RawDataService {/** @lends CountryService */
}

CountryService.addClassProperties({

    supportsDataOperation: {
        value: false
    },

    fetchRawData: {
        value: function (stream) {
            var countryId = stream.query.criteria.parameters || -1,
                isValidCategory = countryId > 0 && CountryNames.length >= countryId,
                countryName = isValidCategory && CountryNames[countryId - 1] || "Unknown";
            this.addRawData(stream, [{
                name: countryName
            }]);
            this.rawDataDone(stream);
        }
    }

});
