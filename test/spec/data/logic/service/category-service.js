var RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    CategoryNames = ["Action", "Comedy", "Horror"];

// exports.CategoryService = RawDataService.specialize(/** @lends CategoryService.prototype */ {
const CategoryService = exports.CategoryService = class CategoryService extends RawDataService {/** @lends CategoryService */
}

CategoryService.addClassProperties({

    supportsDataOperation: {
        value: true
    },

    fetchRawData: {
        value: function (stream) {
            var categoryId = stream.query.criteria.parameters.categoryID || -1,
                isValidCategory = categoryId > 0 && CategoryNames.length >= categoryId,
                categoryName = isValidCategory && CategoryNames[categoryId - 1] || "Unknown";
            this.addRawData(stream, [{
                name: categoryName
            }]);
            this.rawDataDone(stream);
        }
    },


    handleReadOperation: {
        value: function (readOperation) {
            if (!this.handlesType(readOperation.target)) {
                return;
            }

            var parameters = readOperation.criteria && readOperation.criteria.parameters,
                rawData;

            if (parameters && parameters.hasOwnProperty("categoryID")) {
                let categoryId = readOperation.criteria.parameters.categoryID || -1,
                    isValidCategory = categoryId > 0 && CategoryNames.length >= categoryId;
                rawData = [{
                    name: isValidCategory && CategoryNames[categoryId - 1] || "Unknown"
                }]
            } else {
                rawData = CategoryNames.map((name) => {
                    return {name: name};
                })
            }


            let responseOperation = this.responseOperationForReadOperation(
                this.relevantOperationForResponse(readOperation),
                null,
                rawData
            );
            responseOperation.target.dispatchEvent(responseOperation);

            // Resolve once dispatchEvent() is completed, including any pending progagationPromise.
            responseOperation.propagationPromise.then(() => {

                // readOperationCompletionPromiseResolve?.(responseOperation);
            });

        }
    }

});
