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
            console.error(e);
        }).finally(() => {
            expect(error).toBe(null);
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(3);
            expect(editingContext.managedInstances.size).toBe(1);
            expect(editingContext.managedInstances.get(CategoryDescriptor).size).toBe(3);
            done();
        });
    });

    it("can create instance", () => {
        let editingContext = new EditingContext(),
            instance = editingContext.createInstance(movieDescriptor);
            

        expect(instance).toBeDefined();
        expect(editingContext.createdInstances.get(movieDescriptor).has(instance)).toBe(true);
        expect(editingContext.objectDescriptorsWithChanges.has(movieDescriptor)).toBe(true);
        expect(editingContext.managedInstances.get(movieDescriptor).size).toBe(1);

    });

    it("can track changes on managedInstance", () => {
        let editingContext = new EditingContext(),
            instance = editingContext.createInstance(movieDescriptor),
            changes;
            
        editingContext.autosave = false;

        instance.title = "Forrest Gump";
        changes = editingContext.changesForInstance(instance);
        expect(changes).toBeDefined();
        expect(changes.has("title")).toBe(true);
        expect(changes.get("title")).toBe("Forrest Gump");

    });
})