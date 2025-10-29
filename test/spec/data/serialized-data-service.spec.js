const { SerializedDataService } = require("mod/data/service/serialized-data-service.mod/serialized-data-service");
const { defaultEventManager } = require("mod/core/event/event-manager");
const { DataService } = require("mod/data/service/data-service");

const Country = require("mod/data/model/country").montageObject;

describe("SerializedDataService", () => {
    let serializedDataService;
    let mainService;

    beforeEach(async () => {
        mainService = new DataService();
        serializedDataService = new SerializedDataService();
        // defaultEventManager.application.mainService = mainService;

        // Register some instances for testing
        serializedDataService.registerInstancesLocationForType(Country, "test/spec/data/logic/model/countries.mjson");

        // FIXME: can't register for an array of types, an error is thrown
        // await mainService.registerChildService(serializedDataService, [Country]);

        await mainService.registerChildService(serializedDataService, Country);
    });

    afterEach(() => {
        // Cleanup code after each test
    });

    it("should handle read operations", async () => {
        const countries = await mainService.fetchData(Country);
        console.log(countries);
    });
});
