const MuxDataService = require("./mux-data-service").MuxDataService,
    Montage = require('core/core').Montage,
    DataOperation = require("../data-operation").DataOperation;


/**
* MutualExclusionDataService 
* A DataService that allows data of the same type / object descriptor that cam come from mutually exclusive 
* individual Data Services to be fetched.
* 
* By default, each DataService acts fullfill a DataStream matching the readOpereration they handled,
* which means that the first one to have a response, found or not, wins - as in resolve matching the data stream
* when there are mutually exclusive DataServices, it means the one with the actual data may not be able to return it in time.
*
* This service adresses that pattern by allowing the first DataService to find a result to resolve the matching query's DataStream 
* until all individual DataServices have tried, and if nothing found, the matching query's DataStream would then be resolved.
*
* We might want to have the ability to try serially for cost reasons 
* ----> by setting individual data service's "promisesReadOperationCompletion" property to true
* to avoid to call metered/expensive API if a result is found early.
* We migh also want the ability to cancel, which stop[Immediate]Propagation help do
*
* @class
* @extends MuxDataService
*/
exports.MutualExclusionDataService = class MutualExclusionDataService extends MuxDataService {/** @lends MutualExclusionDataService */

    constructor() {
        super();

        return this;
    }

    handleReadOperation(readOperation) {

       super.handleReadOperation(readOperation);
        
    }
 
}
