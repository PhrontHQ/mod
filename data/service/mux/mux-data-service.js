const RawDataService = require("../raw-data-service").RawDataService,
    //SyntaxInOrderIterator = (require)("mod/core/frb/syntax-iterator").SyntaxInOrderIterator,
    Montage = require('core/core').Montage,
    DataOperation = require("../data-operation").DataOperation,
    secretObjectDescriptor = require("data/model/app/secret.mjson").montageObject;


/**
* MuxDataService is the super class of RawDataServices that specialize in coordinating multiple child services such as:
*   - a FIFODataService
*   - a SynchronizationDataService
*   - a CacheDataService
*   - a ShardDataService
*   - a PriorityDataService
*   - a FallbackDataService
*
* @class
* @extends RawDataService
*/
exports.MuxDataService = class MuxDataService extends RawDataService {/** @lends MuxDataService */

    constructor() {
        super();

        return this;
    }

    handleReadOperation(readOperation) {

       super.handleReadOperation(readOperation);
        
    }

    /**
     * Mux RawDataServices orchestrate the work of other concrete RawDataServices, they won't have a connection of their own
     *
     * @property
     *
     */
    get connection() {
        return null;
    }

}
