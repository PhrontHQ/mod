const HttpService = require("./http-service").HttpService,
    Montage = require('core/core').Montage,
    //SyntaxInOrderIterator = (require)("mod/core/frb/syntax-iterator").SyntaxInOrderIterator,
    DataOperation = require("./data-operation").DataOperation,
    secretObjectDescriptor = require("data/model/app/secret.mjson").montageObject;

var SecretManagerServiceClient;

/**
* TODO: Create a shared CloudServiceRawDataService that would become the super class of aws.mod's SecretManagerDataService and this one
*
*
* @class
* @extends OAuthDataService
*/
exports.OAuthDataService = class OAuthDataService extends HttpService {/** @lends OAuthDataService */


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

            /*
                example of a URL:

                https://vehicle-feature-plantone.apps.sb11.edc.caas.ford.com/api/v1/vehicle/VIN?value=1FTVW1EL3NWG08970

            */
           super.handleReadOperation(readOperation);
            
    }

}
