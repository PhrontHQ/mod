var Deserializer = require("mod/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    serialization = require("spec/data/logic/service/main.mjson");


describe("End-to-end Integration", function() {

    it("can deserialize data-service", function () {
        var service = serialization.montageObject;
            expect(service).toBeDefined();
    });
});
