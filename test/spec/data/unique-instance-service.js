var UniqueInstanceService = require("mod/data/service/unique-instance-service").UniqueInstanceService,
    // DataObjectDescriptor = require("mod/data/model/data-object-descriptor").DataObjectDescriptor,
    // ModuleObjectDescriptor = require("mod/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    // ModuleReference = require("mod/core/module-reference").ModuleReference,
    // RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    defaultEventManager = require("mod/core/event/event-manager").defaultEventManager,
    mainService = require("spec/data/logic/service/main.mjson").montageObject;

const AnimatedMovieDescriptor = require("spec/data/logic/model/animated-movie.mjson").montageObject;
const CategoryDescriptor = require("spec/data/logic/model/category.mjson").montageObject;
const movieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;

describe("A UniqueInstanceService", function () {

    let uniqueInstanceService;

    beforeAll((done) => {
        // mainService._childServiceRegistrationPromise.then(() => {
        //     let categoryService = mainService.childServiceForType(CategoryDescriptor);
        //     debugger;
        //     done();
        // });
        uniqueInstanceService = UniqueInstanceService.defaultUniqueInstanceService;
        uniqueInstanceService.reset();
        done();
    });

    beforeEach(() => {
        uniqueInstanceService = new UniqueInstanceService();
    })

    it("has a singleton", function () {
        expect(UniqueInstanceService.defaultUniqueInstanceService).toBeDefined();
    });

    it("can get prototype for object descriptor sync", () => {
        let prototype = uniqueInstanceService._getPrototypeForType(CategoryDescriptor),
            triggers = uniqueInstanceService._instanceTriggers.get(CategoryDescriptor);
        expect(prototype).toBeDefined();
        expect(triggers).toBeDefined();
        expect(triggers.name).toBeDefined();
    });

    it("can create object with lazy prototype", () => {
        //Ensure prototype is not yet created
        expect(uniqueInstanceService._instancePrototypes.has(movieDescriptor)).toBe(false);

        let movie = uniqueInstanceService.createInstance(movieDescriptor),
        triggers = uniqueInstanceService._instanceTriggers.get(movieDescriptor);
        expect(movie).toBeDefined();
        expect(movie.objectDescriptor).toBe(movieDescriptor);
        expect(triggers).toBeDefined();
        expect(triggers.category).toBeDefined();
    })

    // it("can fetchData", function (done) {
    //     let editingContext = new EditingContext(),
    //         error = null,
    //         data;

    //     editingContext.fetchData(CategoryDescriptor).then((result) => {
    //         data = result;
    //     }).catch((e) => {
    //         error = e;
    //     }).finally(() => {
    //         expect(error).toBe(null);
    //         expect(data).toBeDefined();
    //         expect(Array.isArray(data)).toBe(true);
    //         expect(data.length).toBe(3);
    //         expect(editingContext._managedInstances.size).toBe(1);
    //         expect(editingContext._managedInstances.get(CategoryDescriptor).size).toBe(3);
    //         done();
    //     });
    // });
})