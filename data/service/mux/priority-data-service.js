const MuxDataService = require("./mux-data-service").MuxDataService,
    Montage = require('core/core').Montage,
    DataOperation = require("../data-operation").DataOperation;


/**
* PriorityDataService 
*
* @class
* @extends MuxDataService
*/
exports.PriorityDataService = class PriorityDataService extends MuxDataService {/** @lends PriorityDataService */

    constructor() {
        super();

        return this;
    }

    handleReadOperation(readOperation) {

       super.handleReadOperation(readOperation);
        
    }

}
