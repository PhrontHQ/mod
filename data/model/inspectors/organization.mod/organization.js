var Component = require("../../../../ui/component").Component;

const DataService = require("../../../../data/service/data-service").DataService;


exports.Organization = class Organization extends Component {

    _roleSelection;

    get roleSelection() {
        return this._roleSelection;
    }

    set roleSelection(value) {
        if (this._roleSelection !== value) {
            this._roleSelection = value;
        }
        this.dispatchEventNamed("cascadingListPush", true, false, value);
    }

    enterDocument(firstTime) {
        if (firstTime) {
            if (!this.data){
                throw new Error("Department context is required for Organization inspector");
            }
            this.#buildJobRolesFromDepartment(this.data).then((roles) => {
                this.roles = roles;
            });
    
        }
    }


    #buildJobRolesFromDepartment(department) {
        return DataService.mainService
            .updateObjectProperties(department, "suborganizations")
            .then(() => {
                return Promise.all(
                    department.suborganizations.map((suborg) => {
                        return DataService.mainService.updateObjectProperties(suborg, "jobRoles").then(() => {
                            return suborg.jobRoles;
                        });
                    })
                );
            })
            .then((results) => {
                return results.flat();
            });
        // const { suborganizations = [] } = department;
        // return suborganizations.flatMap((suborg) => suborg.jobRoles || []);
    }
};
