var RawDataService = require("./raw-data-service").RawDataService,
    DataOperation = require("./data-operation").DataOperation,
    AuthorizationPolicy = require("./authorization-policy").AuthorizationPolicy;


/**
 *
 * @class
 * @extends RawDataService
 *
 * Assess authorization for a DataIdentity
 */
const IdentityAuthorizationService = exports.IdentityAuthorizationService = class IdentityAuthorizationService extends RawDataService {/** @lends IdentityAuthorizationService */
    constructor() {
        super();
    }
}

IdentityAuthorizationService.addClassProperties({

// exports.IdentityAuthorizationService = IdentityAuthorizationService = RawDataService.specialize( /** @lends IdentityAuthorizationService.prototype */ {


//     constructor: {
//         value: function IdentityAuthorizationService() {
//             this.super();
//         }
//     },
    deserializedFromSerialization: {
        value: function (label) {

            this.application.addEventListener(DataOperation.Type.AuthorizeConnectionOperation, this);

        }
    },

    /**
     * Assess authorization for an AuthorizeConnectionOperation for a DataIdentity.
     *
     * Services overriding the (plural)
     * @method
     * @argument {DataOperation} authorizeConnectionOperation
     * @returns {Promise} - A promise fulfilled with a boolean value.
     *
     */
    handleIdentityAuthorizeConnectionOperation: {
        value: function(authorizeConnectionOperation) {
            /*
                A root service on the client could authorize access to an indexedDB?
                Let's be restrictive for now and see how we expand that to the client.

                Behind the AWS API Gateway using WebSockets, this can only be received following the execution of a connect's authorizer function.
            */
            if(this.accessPolicies && this.authorizationPolicy === AuthorizationPolicy.OnConnect) {
                if(this.currentEnvironment.isNode) {
                    var identity = authorizeConnectionOperation.target,
                    accessPoliciesEvaluation,
                    self = this,
                    allowedDataIdentities;

                // if(authorizationPolicy === AuthorizationPolicy.UpFront) {
                    /*
                        First we need to check that if we have allowedDataIdentities.

                        If there aren't any restriction, then everything is open from a data stand point.
                    */

                // }

            /*
                What we do here is async, so we need to return a promise to the event manager so it can adjust propagation accordingly
            */
               return this.evaluateAccessPoliciesForDataOperation(authorizeConnectionOperation)
               .then(function(resolvedValue) {
                    var authorizeConnectionCompletedOperation = new DataOperation();

                    authorizeConnectionCompletedOperation.referrerId = authorizeConnectionOperation.id;
                    authorizeConnectionCompletedOperation.target = authorizeConnectionOperation.target;
                    authorizeConnectionCompletedOperation.context = authorizeConnectionOperation.context;
                    authorizeConnectionCompletedOperation.clientId = authorizeConnectionOperation.clientId;

                    if(self.isDataOperationAuthorized(authorizeConnectionOperation)) {
                        authorizeConnectionCompletedOperation.type = DataOperation.Type.AuthorizeConnectionCompletedOperation;
                        /*
                            data should contain the signed token instead
                        */
                        authorizeConnectionCompletedOperation.data = authorizeConnectionOperation.data;

                    } else {
                        authorizeConnectionCompletedOperation.type = DataOperation.Type.AuthorizeConnectionFailedOperation;
                        authorizeConnectionCompletedOperation.data = new Error("Authorization Failed");

                    }

                    authorizeConnectionCompletedOperation.target.dispatchEvent(authorizeConnectionCompletedOperation);


               }, function(error) {
                    var authorizeConnectionCompletedOperation = new DataOperation();

                    authorizeConnectionCompletedOperation.referrerId = authorizeConnectionOperation.id;
                    authorizeConnectionCompletedOperation.referrer = authorizeConnectionOperation;
                    authorizeConnectionCompletedOperation.target = authorizeConnectionOperation.target;
                    authorizeConnectionCompletedOperation.type = DataOperation.Type.AuthorizeConnectionFailedOperation;

                    /*
                        We may want to offuscate that depending on the circumstances
                    */
                    authorizeConnectionCompletedOperation.data = error;
                    //authorizeConnectionCompletedOperation.data = new Error("Authorization Failed");

                    authorizeConnectionCompletedOperation.target.dispatchEvent(authorizeConnectionCompletedOperation);

               });

            }


            }

           

        }
    }



});
