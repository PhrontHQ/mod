var DataService = require("mod/data/service/data-service").DataService,
    DataObjectDescriptor = require("mod/data/model/data-object-descriptor").DataObjectDescriptor,
    ModuleObjectDescriptor = require("mod/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("mod/core/module-reference").ModuleReference,
    RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    defaultEventManager = require("mod/core/event/event-manager").defaultEventManager,
    Transaction = require("mod/data/model/transaction").Transaction;

const AnimatedMovieDescriptor = require("spec/data/logic/model/animated-movie.mjson").montageObject;
const CategoyDescriptor = require("spec/data/logic/model/category.mjson").montageObject;
const movieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;

const mainService = require("spec/data/logic/service/montage-data.mjson").montageObject;


describe("A Transaction", function () {
    let mainServiceChangeEvents,
        transactionChangeEvents;

    beforeAll((done) => {
        mainService._childServiceRegistrationPromise.then(() => {
            let original = mainService.handleChange;
            mainService.handleChange = function (changeEvent) {
                mainServiceChangeEvents.push(changeEvent);
                original.apply(mainService, arguments);
            }
            done();
        });
    });

    beforeEach(() => {
        mainServiceChangeEvents = [];
        transactionChangeEvents = [];
    })

    function createTransaction() {
        let transaction = mainService._createEmptyTransaction(),
            original = transaction.handleChange;

        transaction.handleChange = function (changeEvent) {
            transactionChangeEvents.push(changeEvent);
            original.apply(transaction, arguments);
        };

        return transaction;
    }

    it("can track changes on object", function () {
        expect(mainService).toBeDefined();
        let transaction = createTransaction(),
            movie = mainService.createDataObject(movieDescriptor);

        transaction.registerObject(movie);

        movie.title = "The Dark Knight";

        expect(transactionChangeEvents.length).toBe(1, "event not in transaction change events");
        expect(mainServiceChangeEvents.length).toBe(0, "event in mainService change events");
        expect(transaction.createdDataObjects.has(movieDescriptor)).toBe(true, "movieDescriptor not in createdDataObjects");
        expect(transaction.createdDataObjects.get(movieDescriptor).has(movie)).toBe(true, "object not in createdDataObjects");
        expect(transaction.updatedDataObjects.has(movieDescriptor)).toBe(false, "movie not in changedDataObjects");
        expect(transaction.objectDescriptorsWithChanges.has(movieDescriptor)).toBe(true);
    });
});