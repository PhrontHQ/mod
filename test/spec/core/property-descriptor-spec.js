var PropertyDescriptor = require("mod/core/meta/property-descriptor").PropertyDescriptor,
    Deserializer = require("mod/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    Range = require("mod/core/range").Range;

describe("A PropertyDescriptor", function() {

    it("can derive cardinalityRange from cardinality", () => {
        let propertyDescriptor = new PropertyDescriptor();
        
        propertyDescriptor.cardinality = 4;
        expect(propertyDescriptor.cardinality).toBe(4);
        expect(propertyDescriptor.cardinalityRange.begin).toBe(0);
        expect(propertyDescriptor.cardinalityRange.end).toBe(4);
        expect(propertyDescriptor.isMandatory).toBe(false);
    });

    it("can derive cardinality from cardinalityRange", () => {
        let propertyDescriptor = new PropertyDescriptor();
        
        propertyDescriptor.cardinalityRange = new Range(6, 10);
        expect(propertyDescriptor.cardinality).toBe(10);
        expect(propertyDescriptor.cardinalityRange.begin).toBe(6);
        expect(propertyDescriptor.cardinalityRange.end).toBe(10);
        expect(propertyDescriptor.isMandatory).toBe(true);
    });

    it("can derive cardinalityRange from isMandatory", () => {
        let propertyDescriptor = new PropertyDescriptor();
        
        propertyDescriptor.isMandatory = true;
        expect(propertyDescriptor.cardinalityRange.begin).toBe(1);
    });

    it("can derive cardinalityRange from cardinality in serialization", (done) => {
        let serialization = `
            {
                "root": {
                    "prototype": "mod/core/meta/property-descriptor",
                    "values": {
                        "name": "foo",
                        "cardinality": 2
                    }
                }
            }
        `,
        deserializer = new Deserializer().init(serialization, require);
        
        deserializer.deserializeObject().then((propertyDescriptor) => {
            expect(propertyDescriptor).toBeDefined();
            expect(propertyDescriptor.cardinality).toBe(2);
            expect(propertyDescriptor.cardinalityRange.begin).toBe(0);
            expect(propertyDescriptor.cardinalityRange.end).toBe(2);
            expect(propertyDescriptor.isMandatory).toBe(false);
            done();
        }).catch((e) => {
            console.error(e);
            done();
        });
    })

    it ("can derive cardinality from cardinalityRange in serialization", (done) => {
        let serialization = `
            {
                "root": {
                    "prototype": "mod/core/meta/property-descriptor",
                    "values": {
                        "name": "foo",
                        "cardinalityRange": {"@": "cardinality_range"}
                    }
                },
                "cardinality_range": {
                    "prototype": "mod/core/range",
                    "values": {
                        "begin": 2,
                        "end": 4
                    }
                }
            }
        `,
        deserializer = new Deserializer().init(serialization, require);
        
        deserializer.deserializeObject().then((propertyDescriptor) => {
            expect(propertyDescriptor).toBeDefined();
            expect(propertyDescriptor.cardinality).toBe(4);
            expect(propertyDescriptor.cardinalityRange.begin).toBe(2);
            expect(propertyDescriptor.cardinalityRange.end).toBe(4);
            expect(propertyDescriptor.isMandatory).toBe(true);
            done();
        }).catch((e) => {
            console.error(e);
            done();
        });
    })

    it("can throw when conflicting properties are serialized", (done) => {
        let serialization = `
            {
                "root": {
                    "prototype": "mod/core/meta/property-descriptor",
                    "values": {
                        "name": "foo",
                        "cardinality": 2,
                        "cardinalityRange": {"@": "cardinality_range"}
                    }
                },
                "cardinality_range": {
                    "prototype": "mod/core/range",
                    "values": {
                        "begin": 2,
                        "end": 4
                    }
                }
            }
        `,
        deserializer = new Deserializer().init(serialization, require),
        error;
        
        deserializer.deserializeObject().then((propertyDescriptor) => {
            expect(false).toBe(true, "Should throw");
        }).catch((e) => {
            error = e;
        }).then(() => {
            expect(error).toBeDefined();
            done();
        });
    })

});
