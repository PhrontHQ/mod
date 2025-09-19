const PriorityDataService = require("./priority-data-service").PriorityDataService,
    Montage = require('core/core').Montage,
    DataOperation = require("../data-operation").DataOperation;


/**
* DataOperationError 
*
* @class
* @extends Error
*/
exports.DataOperationError = class DataOperationError extends Error {/** @lends DataOperationError */

    constructor() {
        super();

        return this;
    }

    handleReadOperation(readOperation) {

       super.handleReadOperation(readOperation);
        
    }

}
