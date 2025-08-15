const HttpService = require("../http-service").HttpService,
    Montage = require('../../../core/core').Montage;

/**
* 
* Doc to look at to implement handling refresh tokens:
*  https://developer.whoop.com/docs/tutorials/refresh-token-javascript/
*
* @class
* @extends HttpService
*/
exports.ClientOAuthDataService = class ClientOAuthDataService extends HttpService {/** @lends ClientOAuthDataService */


    /***************************************************************************
     * Initializing
     */

    constructor() {
        super();

        return this;
    }

    static {

        Montage.defineProperties(this.prototype, {
            apiVersion: {
                value: "FROM AWS, NECESSARY FOR GCP?"
            }
        });
    }

    handleReadOperation(readOperation) {

           super.handleReadOperation(readOperation);
            
    }

}
