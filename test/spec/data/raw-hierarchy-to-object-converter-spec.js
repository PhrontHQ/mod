var RawHierarchyToObjectConverter = require("mod/data/converter/raw-hierarchy-to-object-converter").RawHierarchyToObjectConverter,
    ObjectDescriptor = require("mod/core/meta/object-descriptor").ObjectDescriptor,
    PropertyDescriptor = require("mod/core/meta/property-descriptor").PropertyDescriptor,
    Criteria = require("mod/core/criteria").Criteria,
    serialization = require("./logic/service/raw-data-type-mapping-spec.mjson");

describe("A RawHierarchyToObjectConverter", function() {

    let rawData, objectDescriptor, propertyDescriptor;
    beforeAll(() => {
        rawData = {
            name: "John Doe",
            child: {
                name: "Jane Doe",
                child: {
                    name: "Jean Doe",
                    child: {
                        name: "Joan Doe"
                    }
                }
            }
        };
        objectDescriptor = new ObjectDescriptor().initWithName("Person");
        propertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", objectDescriptor, 1);
        objectDescriptor.addPropertyDescriptor(propertyDescriptor);

        propertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("child", objectDescriptor, 1);
        objectDescriptor.addPropertyDescriptor(propertyDescriptor);
    })

    it("can be created", function () {
        expect(new RawHierarchyToObjectConverter()).toBeDefined();
    });


    it("can map a hierarchy", function () {
        var converter = new RawHierarchyToObjectConverter().initWithHierarchyExpression("child");

        //TODO
    });

    it("can deserializeSelf", function () {
        //TODO
    });
});
