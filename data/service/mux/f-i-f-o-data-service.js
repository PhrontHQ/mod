const MuxDataService = require("./mux-data-service").MuxDataService,
    Montage = require('core/core').Montage,
    DataOperation = require("../data-operation").DataOperation;


/**
* FIFODataService 
*
* @class
* @extends MuxDataService
*/
exports.FIFODataService = class FIFODataService extends MuxDataService {/** @lends FIFODataService */

    constructor() {
        super();

        return this;
    }

    handleReadOperation(readOperation) {

       super.handleReadOperation(readOperation);
        
    }

}
