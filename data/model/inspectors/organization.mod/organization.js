var Component = require("../../../../ui/component").Component;

const DataService = require("../../../../data/service/data-service").DataService;


exports.Organization = class Organization extends Component {

    context = null;

    getContext() {
        const grandparent = this.parentComponent && this.parentComponent.parentComponent;
        return grandparent && grandparent.context;
    }

    _roleSelection;

    get roleSelection() {
        return this._roleSelection;
    }

    set roleSelection(value) {
        if (this._roleSelection !== value) {
            this._roleSelection = value;
        }
    }

    enterDocument(firstTime) {
        if (firstTime) {
            if (!this.data){
                throw new Error("Department context is required for Organization inspector");
            }
            this.#buildJobRolesFromDepartment(this.data).then((roles) => {
                this.roles = roles;
            });
            this.context = this.getContext();
            this.addRangeAtPathChangeListener("roleSelection", this, "_handleSelectionChange");
        }
    }

    _handleSelectionChange(plus, minus, index) {
        var obj = {plus: plus, context: this.context};
        this.dispatchEventNamed("cascadingListPush", true, false, obj);
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
