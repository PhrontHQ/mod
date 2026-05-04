var DataService = require("mod/data/service/data-service").DataService,
    DataObjectDescriptor = require("mod/data/model/data-object-descriptor").DataObjectDescriptor,
    ModuleObjectDescriptor = require("mod/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("mod/core/module-reference").ModuleReference,
    RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    defaultEventManager = require("mod/core/event/event-manager").defaultEventManager;

const ActorDescriptor = require("spec/data/logic/model/actor.mjson").montageObject;
const CategoyDescriptor = require("spec/data/logic/model/category.mjson").montageObject;
const movieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;

describe("A DataTrigger", function () {
    let mainService, movieA, movieB;

    beforeAll((done) => {
        require.async("spec/data/logic/service/montage-data.mjson").then((exports) => {
            mainService = exports.montageObject;
            mainService._childServiceRegistrationPromise.then(() => {
                movieA = mainService.createDataObject(movieDescriptor);
                mainService.saveDataObject(movieA);
                done();
            });
        })
    });

    xit("can get primitive value on property", function () {

    })

    xit("can set primitive value on property", function () {
        
    })

    it("can set array value on property", function () {
        let actor = mainService.createDataObject(ActorDescriptor);
        movieA.cast = [actor];
        expect(movieA.cast.length).toBe(1);
        expect(movieA.cast[0]).toBe(actor);
    });

    it("can get array value on property with default value", function () {
        expect(movieA.showtimes.length).toBe(1);
    });

    it("can get array value on property with default value", function () {
        expect(movieA.showtimes.length).toBe(1);
    });

    xit("can get Map value on property", function () {

    })

    xit("can set Map value on property", function () {
        
    })

    xit("can get Set value on property", function () {

    })

    xit("can set Set value on property", function () {
        
    })

});