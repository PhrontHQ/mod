const { SerializedDataService } = require("mod/data/service/serialized-data-service.mod/serialized-data-service");
const { defaultEventManager } = require("mod/core/event/event-manager");
const { DataService } = require("mod/data/service/data-service");
const { DataQuery } = require("mod/data/model/data-query");
const { Criteria } = require("mod/core/criteria");
const Deserializer = require("mod/core/serialization/deserializer/montage-deserializer").MontageDeserializer;
const CategoryDescriptor = require("spec/data/logic/model/category.mjson").montageObject;
const MovieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;

const Country = require("mod/data/model/country.mjson").montageObject;

describe("SerializedDataService", () => {
    let serializedDataService;
    let mainService;

    beforeEach(async () => {
        mainService = new DataService();
        serializedDataService = new SerializedDataService();
        defaultEventManager.application.mainService = mainService;

        // Register some instances for testing
        serializedDataService.registerTypeForInstancesLocation(Country, "spec/data/logic/model/countries.mjson");
        serializedDataService.registerTypeForInstancesLocation(
            MovieDescriptor,
            "spec/data/logic/instance/movie/main.mjson"
        );

        await mainService.registerChildService(serializedDataService, [Country, MovieDescriptor]);

        // FIXME: temporary workaround to ensure the child service has the type registered
        // @benoit: What am I missing here?
        serializedDataService.types.push(Country);
        serializedDataService.types.push(MovieDescriptor);
    });

    afterEach(() => {
        // Cleanup code after each test
    });

    it("can deserialize instances for multiple types", (done) => {
        let deserializer = new Deserializer(),
            serialization = {
                root: {
                    prototype: "mod/data/service/serialized-data-service.mod",
                    values: {
                        identifier: "FooBarDataService",
                        name: "FooBarDataService",
                        exportName: "SerializedDataService",
                        types: [{ "@": "CategoryDescriptor" }, { "@": "MovieDescriptor" }],
                        instances: [
                            {
                                type: { "@": "CategoryDescriptor" },
                                moduleId: "spec/data/logic/instance/category/main.mjson",
                            },
                            {
                                type: { "@": "MovieDescriptor" },
                                moduleId: "spec/data/logic/instance/movie/main.mjson",
                            },
                        ],
                    },
                },

                CategoryDescriptor: {
                    object: "spec/data/logic/model/category.mjson",
                },

                MovieDescriptor: {
                    object: "spec/data/logic/model/movie.mjson",
                },
            },
            serializationString = JSON.stringify(serialization);

        deserializer.init(serializationString, require);

        deserializer
            .deserializeObject()
            .then(function (root) {
                expect(Object.getPrototypeOf(root)).toBe(SerializedDataService.prototype);
                expect(root._typeToLocation.size).toBe(2);
                expect(root._typeToLocation.get(CategoryDescriptor)).toBe(
                    "spec/data/logic/instance/category/main.mjson"
                );
                expect(root._typeToLocation.get(MovieDescriptor)).toBe("spec/data/logic/instance/movie/main.mjson");
            })
            .catch(function (reason) {
                fail(reason);
            })
            .finally(function () {
                done();
            });
    });

    it("should handle read operations", async () => {
        // Act
        const countries = await mainService.fetchData(Country);

        // Assert
        expect(countries.length).toBe(5);

        const movies = await mainService.fetchData(MovieDescriptor);

        // Assert
        expect(movies.length).toBe(2);
    });

    it("should handle read operations with criteria", async () => {
        // Arrange
        const criteria = new Criteria().initWithExpression("name == $.name", {
            name: "France",
        });
        const query = DataQuery.withTypeAndCriteria(Country, criteria);

        // Act
        const countries = await mainService.fetchData(query);

        // Assert
        expect(countries.length).toBe(1);
        expect(countries[0].name).toBe("France");
    });
});
