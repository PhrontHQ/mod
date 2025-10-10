const Serializer = require("mod/core/serialization/serializer/montage-serializer").MontageSerializer;
const ObjectDescriptor = require("mod/core/meta/object-descriptor").ObjectDescriptor;
const TestPageLoader = require("mod-testing/testpageloader").TestPageLoader;
const Component = require("mod/ui/component").Component;

TestPageLoader.queueTest("component-object-descriptor-test/component-object-descriptor-test", (testPage) => {
    describe("meta/component-object-descriptor-spec", () => {
        let component1, component2, component3;

        beforeEach(() => {
            component1 = testPage.test.component1;
            component2 = testPage.test.component2;
            component3 = testPage.test.component3;
        });

        it("can create a new objectDescriptor", async () => {
            const newObjectDescriptor = new ObjectDescriptor().initWithName(component1.identifier);
            component1.objectDescriptor = newObjectDescriptor;
            const objectDescriptor = await component1.objectDescriptor;

            expect(newObjectDescriptor).toBeDefined();
            expect(objectDescriptor).toBe(newObjectDescriptor);
        });

        it("can create a new property objectDescriptor", async () => {
            const newObjectDescriptor = new ObjectDescriptor().initWithName(component1.identifier);
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty");
            component1.objectDescriptor = newObjectDescriptor;
            const objectDescriptor = await component1.objectDescriptor;
            const propertyDescriptor = objectDescriptor.propertyDescriptorForName("bindableProperty");

            expect(propertyDescriptor).toBeDefined();
        });

        it("can serialize the component objectDescriptor", async () => {
            const serializer = new Serializer().initWithRequire(require);
            const newObjectDescriptor = new ObjectDescriptor().initWithName(component1.identifier);

            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty1");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty2");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty3");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty4");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty5");
            newObjectDescriptor.addEventDescriptorNamed("action");
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(
                newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty1"),
                "required"
            );
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(
                newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty2"),
                "required"
            );
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(
                newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty3"),
                "required"
            );
            component1.objectDescriptor = newObjectDescriptor;

            const objectDescriptor = await component1.objectDescriptor;
            const serializedDescription = serializer.serializeObject(objectDescriptor);

            expect(serializedDescription).toBeTruthy();
        });

        xit("can load the component objectDescriptor from the reel", async () => {
            const objectDescriptor = await component2.objectDescriptor;

            expect(objectDescriptor).toBeTruthy();
            // TODO test look weird requiredBindableProperty1 vs bindableProperty1
            expect(objectDescriptor.propertyDescriptorForName("bindableProperty1")).toBeTruthy();
            expect(objectDescriptor.propertyDescriptorForName("required")).toBeTruthy();
        });

        it("can create validation rules", async () => {
            const serializer = new Serializer().initWithRequire(require);
            const newObjectDescriptor = new ObjectDescriptor().initWithName(component3.identifier);

            expect(newObjectDescriptor).toBeTruthy();

            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty1");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty2");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty3");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty4");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty5");
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(
                newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty1"),
                "required"
            );
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(
                newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty2"),
                "required"
            );
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(
                newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty3"),
                "required"
            );

            newObjectDescriptor.addValidationRule("rule1").criteria = null;
            component3.objectDescriptor = newObjectDescriptor;

            const objectDescriptor = await component3.objectDescriptor;
            expect(objectDescriptor).toBeTruthy();
            const serializedDescription = serializer.serializeObject(objectDescriptor);
            expect(serializedDescription).toBeTruthy();
        });

        describe("test converter objectDescriptor", () => {
            const component = new Component();

            it("should exist", async () => {
                const objectDescriptor = await component.objectDescriptor;
                expect(objectDescriptor).toBeTruthy();
            });

            it("should have an 'element' property object descriptor", async () => {
                const objectDescriptor = await component.objectDescriptor;
                const propertyDescriptor = objectDescriptor.propertyDescriptorForName("element");

                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("string");
                expect(propertyDescriptor.readOnly).toBe(true);
            });

            it("should have an 'identifier' property object descriptor", async () => {
                const objectDescriptor = await component.objectDescriptor;
                const propertyDescriptor = objectDescriptor.propertyDescriptorForName("identifier");

                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("string");
            });
        });
    });
});
