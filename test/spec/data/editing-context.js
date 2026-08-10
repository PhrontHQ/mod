var EditingContext = require("mod/data/service/editing-context").EditingContext,
    // DataObjectDescriptor = require("mod/data/model/data-object-descriptor").DataObjectDescriptor,
    // ModuleObjectDescriptor = require("mod/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    // ModuleReference = require("mod/core/module-reference").ModuleReference,
    // RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    defaultEventManager = require("mod/core/event/event-manager").defaultEventManager,
    mainService = require("spec/data/logic/service/main.mjson").montageObject;

const AnimatedMovieDescriptor = require("spec/data/logic/model/animated-movie.mjson").montageObject;
const CategoryDescriptor = require("spec/data/logic/model/category.mjson").montageObject;
const movieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;

describe("An EditingContext", function () {

    beforeAll((done) => {
        mainService._childServiceRegistrationPromise.then(() => {
            let categoryService = mainService.childServiceForType(CategoryDescriptor);
            debugger;
            done();
        });
    });
    it("can be created", function () {
        expect(new EditingContext()).toBeDefined();
    });

    it("can fetchData", function (done) {
        let editingContext = new EditingContext(),
            error = null,
            data;

        editingContext.fetchData(CategoryDescriptor).then((result) => {
            data = result;
        }).catch((e) => {
            error = e;
        }).finally(() => {
            expect(error).toBe(null);
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(3);
            expect(editingContext._managedInstances.size).toBe(1);
            expect(editingContext._managedInstances.get(CategoryDescriptor).size).toBe(3);
            done();
        });
    });
})