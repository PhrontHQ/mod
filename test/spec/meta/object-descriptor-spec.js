"use strict";
/**
 @module mod/data/object-descriptor-spec.js
 @requires mod/core/core
 @requires mod/core/logger
 */
const ObjectDescriptor = require("mod/core/meta/object-descriptor").ObjectDescriptor;
const Deserializer = require("mod/core/serialization/deserializer/montage-deserializer").MontageDeserializer;
const Serializer = require("mod/core/serialization/serializer/montage-serializer").MontageSerializer;
const EventDescriptor = require("mod/core/meta/event-descriptor.js").EventDescriptor;
const movieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;
const ModelHelper = require("./blueprint/model-helper").ModelHelper;
const Customer = require("./blueprint/customer").Customer;
const Employee = require("./blueprint/employee").Employee;
const Person = require("./blueprint/person").Person;
const Model = require("mod/core/meta/model").Model;
const Montage = require("mod/core/core").Montage;

// Require to deserialize
// TODO add proper deps to montage modules
require("mod/core/meta/object-descriptor");
require("mod/core/meta/property-descriptor");
require("mod/core/meta/module-object-descriptor");

describe("meta/object-descriptor-spec", () => {
    describe("Model", () => {
        describe("Adding object descriptors", () => {
            const binder = new Model().initWithNameAndRequire("CompanyModel", require);
            const personObjectDescriptor = new ObjectDescriptor().initWithName("Person");
            binder.addObjectDescriptor(personObjectDescriptor);

            const companyObjectDescriptor = new ObjectDescriptor().initWithName("Company");
            binder.addObjectDescriptor(companyObjectDescriptor);

            it("should have a binder", () => {
                expect(personObjectDescriptor.model).toBe(binder);
                expect(companyObjectDescriptor.model).toBe(binder);
            });
        });
    });

    describe("ObjectDescriptor", () => {
        describe("propertyDescriptors", () => {
            describe("parent propertyDescriptors", () => {
                let parent, parentProperty, child, childProperty;

                beforeEach(() => {
                    parent = new ObjectDescriptor().initWithName("Person");
                    parentProperty = parent.newPropertyDescriptor("foo", 1);
                    child = new ObjectDescriptor().initWithName("Customer");
                    childProperty = child.newPropertyDescriptor("bar", 1);
                });

                it("can get propertyDescriptor added to parent", () => {
                    child.parent = parent;
                    child.addPropertyDescriptor(childProperty);
                    parent.addPropertyDescriptor(parentProperty);
                    expect(child.propertyDescriptorForName("bar")).toBe(childProperty);
                    expect(child.propertyDescriptorForName("foo")).toBe(parentProperty);
                    expect(child._ownPropertyDescriptors.length).toBe(1);
                    expect(child._ownPropertyDescriptors[0]).toBe(childProperty);
                    expect(child.propertyDescriptors.length).toBe(2);
                    expect(child.propertyDescriptors[0]).toBe(childProperty);
                    expect(child.propertyDescriptors[1]).toBe(parentProperty);
                });

                it("can get propertyDescriptor when parent is assigned", () => {
                    child.addPropertyDescriptor(childProperty);
                    parent.addPropertyDescriptor(parentProperty);

                    expect(child.propertyDescriptors.length).toBe(1);

                    child.parent = parent;

                    expect(child.propertyDescriptorForName("bar")).toBe(childProperty);
                    expect(child.propertyDescriptorForName("foo")).toBe(parentProperty);
                    expect(child._ownPropertyDescriptors.length).toBe(1);
                    expect(child._ownPropertyDescriptors[0]).toBe(childProperty);
                    expect(child.propertyDescriptors.length).toBe(2);
                    expect(child.propertyDescriptors[0]).toBe(childProperty);
                    expect(child.propertyDescriptors[1]).toBe(parentProperty);
                });
            });
        });

        describe("associations", () => {
            const personObjectDescriptor = new ObjectDescriptor().initWithName("Person");
            const companyObjectDescriptor = new ObjectDescriptor().initWithName("Company");

            const employerAssociation = personObjectDescriptor.addToManyPropertyDescriptorNamed("employer");
            employerAssociation.valueDescriptor = companyObjectDescriptor;
            const employeesAssociation = companyObjectDescriptor.addToManyPropertyDescriptorNamed("employees");
            employeesAssociation.valueDescriptor = personObjectDescriptor;

            personObjectDescriptor.addPropertyDescriptor(employerAssociation);
            companyObjectDescriptor.addPropertyDescriptor(employeesAssociation);

            it("basic properties should be correct", () => {
                expect(personObjectDescriptor.propertyDescriptorForName("employer")).toBe(employerAssociation);
                expect(companyObjectDescriptor.propertyDescriptorForName("employees")).toBe(employeesAssociation);
            });

            it("target objectDescriptor promise to be resolved", async () => {
                const objectDescriptor = await personObjectDescriptor.propertyDescriptorForName("employer")
                    .valueDescriptor;
                expect(objectDescriptor).toBeTruthy();
                expect(objectDescriptor).toBe(companyObjectDescriptor);
            });

            it("target objectDescriptor promise to be resolved", async () => {
                const objectDescriptor = await companyObjectDescriptor.propertyDescriptorForName("employees")
                    .valueDescriptor;
                expect(objectDescriptor).toBeTruthy();
                expect(objectDescriptor).toBe(personObjectDescriptor);
            });
        });

        describe("objectDescriptor to instance association", () => {
            let binder, personObjectDescriptor, companyObjectDescriptor;

            beforeEach(() => {
                binder = new Model().initWithNameAndRequire("Model", require);
                personObjectDescriptor = new ObjectDescriptor().initWithName("Person");
                binder.addObjectDescriptor(personObjectDescriptor);
                companyObjectDescriptor = new ObjectDescriptor().initWithName("Company");
                binder.addObjectDescriptor(companyObjectDescriptor);
            });

            it("should be found with the objectDescriptor name", () => {
                expect(binder.objectDescriptorForName("Person")).toBe(personObjectDescriptor);
                expect(binder.objectDescriptorForName("Company")).toBe(companyObjectDescriptor);
            });
        });

        describe("applying a basic objectDescriptor to a prototype", () => {
            let louis, personObjectDescriptor;

            beforeEach(() => {
                const binder = new Model().initWithNameAndRequire("Model", require);
                personObjectDescriptor = new ObjectDescriptor().initWithName("Person");
                personObjectDescriptor.addPropertyDescriptor(personObjectDescriptor.newPropertyDescriptor("name", 1));
                personObjectDescriptor.addPropertyDescriptor(
                    personObjectDescriptor.newPropertyDescriptor("keywords", Infinity)
                );

                binder.addObjectDescriptor(personObjectDescriptor);
                Model.group.addModel(binder);

                louis = personObjectDescriptor.newInstance().init();
            });

            it("should have a objectDescriptor", () => {
                expect(louis.objectDescriptor).toBe(personObjectDescriptor);
            });

            it("should have a the correct properties defined", () => {
                expect(Object.getPrototypeOf(louis).hasOwnProperty("name")).toBeTruthy();
                expect(Object.getPrototypeOf(louis).hasOwnProperty("keywords")).toBeTruthy();
            });
        });

        describe("adding a PropertyDescriptor", () => {
            let circle, shapeObjectDescriptor;

            beforeEach(() => {
                const binder = new Model().initWithNameAndRequire("Model", require);
                shapeObjectDescriptor = new ObjectDescriptor().initWithName("Shape");
                binder.addObjectDescriptor(shapeObjectDescriptor);
                let propertyDescriptor = shapeObjectDescriptor.newPropertyDescriptor("size", 1);
                shapeObjectDescriptor.addPropertyDescriptor(propertyDescriptor);
                propertyDescriptor = shapeObjectDescriptor.newPropertyDescriptor("readOnlyPropertyDescriptor", 1);
                propertyDescriptor.readOnly = true;
                shapeObjectDescriptor.addPropertyDescriptor(propertyDescriptor);
                propertyDescriptor = shapeObjectDescriptor.newPropertyDescriptor("mandatoryPropertyDescriptor", 1);
                propertyDescriptor.mandatory = true;
                shapeObjectDescriptor.addPropertyDescriptor(propertyDescriptor);
                propertyDescriptor = shapeObjectDescriptor.newPropertyDescriptor("denyDelete", 1);
                propertyDescriptor.denyDelete = true;
                shapeObjectDescriptor.addPropertyDescriptor(propertyDescriptor);
                Model.group.addModel(binder);

                circle = shapeObjectDescriptor.newInstance().init();
            });

            describe("normal propertyDescriptor's property", () => {
                it("should be settable", () => {
                    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "size");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("function");
                    expect(circle.size).toBeNull();
                    circle.size = "big";
                    expect(circle.size).toEqual("big");
                });

                it("should be enumerable", () => {
                    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "size");
                    expect(descriptor.enumerable).toBeTruthy();
                });

                it("should have a get and set", () => {
                    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "size");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("function");
                });
            });

            describe("read only propertyDescriptor's property", () => {
                it("should not be settable", () => {
                    expect(() => {
                        circle.readOnlyPropertyDescriptor = "big";
                    }).toThrow();
                });

                it("should have a get and no set", () => {
                    const descriptor = Object.getOwnPropertyDescriptor(
                        Object.getPrototypeOf(circle),
                        "readOnlyPropertyDescriptor"
                    );
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("undefined");
                });
            });

            describe("mandatory propertyDescriptor's property", () => {
                it("should not be settable", () => {
                    expect(() => {
                        circle.readOnlyPropertyDescriptor = "big";
                    }).toThrow();
                });

                it("should have a get and no set", () => {
                    const descriptor = Object.getOwnPropertyDescriptor(
                        Object.getPrototypeOf(circle),
                        "readOnlyPropertyDescriptor"
                    );
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("undefined");
                });
            });

            describe("denyDelete propertyDescriptor's property", () => {
                it("should not be settable to null", () => {
                    circle.denyDelete = "big";
                    expect(() => {
                        circle.denyDelete = null;
                    }).toThrow();
                });
            });
        });

        describe("serializing", () => {
            const companyModel = ModelHelper.companyModel();
            const personObjectDescriptor = companyModel.objectDescriptorForName("Person");

            personObjectDescriptor.maxAge = 60;

            it("can serialize", () => {
                const serializedModel = new Serializer().initWithRequire(require).serializeObject(companyModel);
                expect(serializedModel).not.toBeNull();
            });

            it("can deserialize", async () => {
                try {
                    const serializedModel = new Serializer().initWithRequire(require).serializeObject(companyModel);
                    const deserializedModel = await new Deserializer()
                        .init(serializedModel, require)
                        .deserializeObject();

                    const metadata = Montage.getInfoForObject(deserializedModel);
                    expect(serializedModel).not.toBeNull();
                    expect(metadata.objectName).toBe("Model");
                    expect(metadata.moduleId).toBe("core/meta/model");
                    const personObjectDescriptor = deserializedModel.objectDescriptorForName("Person");
                    expect(personObjectDescriptor).toBeTruthy();
                    expect(personObjectDescriptor.propertyDescriptorForName("phoneNumbers")).not.toBeNull();
                    expect(personObjectDescriptor.maxAge).toBe(60);
                } catch (err) {
                    fail(err);
                }
            });
        });

        describe("create new prototype", () => {
            it("Should be a prototype", () => {
                const info = Montage.getInfoForObject(Person);
                expect(info.isInstance).toBeFalsy();
            });

            it("Should have the right moduleId and Name", () => {
                const info = Montage.getInfoForObject(Person);
                expect(info.moduleId).toBe("spec/meta/blueprint/person");
                expect(info.objectName).toBe("Person");
            });
        });

        describe("createDefaultObjectDescriptorForObject", () => {
            it("should always return a promise", async () => {
                try {
                    const objectDescriptorPromise = ObjectDescriptor.createDefaultObjectDescriptorForObject({});
                    expect(typeof objectDescriptorPromise.then).toBe("function");
                    const objectDescriptor = await objectDescriptorPromise;
                    expect(ObjectDescriptor.prototype.isPrototypeOf(objectDescriptor)).toBe(true);
                } catch (err) {
                    fail(err);
                }
            });

            it("has the correct module id for the parent", async () => {
                try {
                    const { ComponentObjectDescriptorTest1 } =
                        await require("spec/meta/component-object-descriptor-test/component-object-descriptor-test-1.mod");
                    const objectDescriptor = await ObjectDescriptor.createDefaultObjectDescriptorForObject(
                        ComponentObjectDescriptorTest1
                    );
                    const id = objectDescriptor.parent.objectDescriptorInstanceModule.resolve(require);
                    expect(id === "mod/ui/component.mjson" || id === "mod/ui/component.mjson").toBeTruthy();
                } catch (err) {
                    fail(err);
                }
            });
        });

        describe("ObjectDescriptor descriptor", () => {
            it("uses the correct module ID for objects with no .mjson", () => {
                const Sub = ObjectDescriptor.specialize();
                // fake object loaded from module
                Object.defineProperty(Sub, "_montage_metadata", {
                    value: {
                        require: require,
                        module: "pass",
                        moduleId: "pass", // deprecated
                        property: "Pass",
                        objectName: "Pass", // deprecated
                        isInstance: false,
                    },
                });

                const sub = new Sub();
                sub._montage_metadata = Object.create(Sub._montage_metadata, {
                    isInstance: { value: true },
                });

                expect(
                    sub.objectDescriptorModuleId === "pass.mjson" || sub.objectDescriptorModuleId === "pass.mjson"
                ).toBeTruthy();
            });

            it("creates an objectDescriptor when the parent has no objectDescriptor", async () => {
                try {
                    const objectDescriptor = await ObjectDescriptor.objectDescriptor;
                    expect(
                        objectDescriptor.objectDescriptorInstanceModule.id === "core/meta/blueprint.mjson" ||
                            objectDescriptor.objectDescriptorInstanceModule.id === "core/meta/object-descriptor.mjson"
                    ).toBeTruthy();
                } catch (err) {
                    fail(err);
                }
            });
        });

        describe("events", () => {
            let objectDescriptor;

            beforeEach(() => {
                objectDescriptor = new ObjectDescriptor().initWithName("test");
            });

            describe("eventDescriptors", () => {
                it("returns the same array", () => {
                    objectDescriptor.addEventDescriptorNamed("event");
                    const eventDescriptors = objectDescriptor.eventDescriptors;
                    expect(objectDescriptor.eventDescriptors).toBe(eventDescriptors);
                });
            });

            describe("adding", () => {
                let eventDescriptor;
                afterEach(() => {
                    expect(objectDescriptor.eventDescriptors.length).toEqual(1);
                    expect(objectDescriptor.eventDescriptors[0]).toBe(eventDescriptor);
                });

                it("adds an existing objectDescriptor", () => {
                    eventDescriptor = new EventDescriptor().initWithNameAndObjectDescriptor("event");
                    objectDescriptor.addEventDescriptor(eventDescriptor);

                    expect(eventDescriptor.owner).toBe(objectDescriptor);
                    expect(objectDescriptor.eventDescriptorForName("event")).toBe(eventDescriptor);
                });

                it("only adds the objectDescriptor once", () => {
                    eventDescriptor = new EventDescriptor().initWithNameAndObjectDescriptor("event");

                    objectDescriptor.addEventDescriptor(eventDescriptor);
                    objectDescriptor.addEventDescriptor(eventDescriptor);

                    expect(eventDescriptor.owner).toBe(objectDescriptor);
                    expect(objectDescriptor.eventDescriptorForName("event")).toBe(eventDescriptor);
                });

                it("creates a new objectDescriptor with the given name", () => {
                    eventDescriptor = objectDescriptor.addEventDescriptorNamed("event");

                    expect(eventDescriptor.owner).toBe(objectDescriptor);
                    expect(eventDescriptor.name).toEqual("event");
                    expect(objectDescriptor.eventDescriptorForName("event")).toBe(eventDescriptor);
                });
            });

            it("creates a new event objectDescriptor", () => {
                const eventDescriptor = objectDescriptor.newEventDescriptor("event");

                expect(eventDescriptor.name).toEqual("event");
                expect(eventDescriptor.owner).toBe(objectDescriptor);
            });

            it("removes an existing objectDescriptor", () => {
                const eventDescriptor = objectDescriptor.addEventDescriptorNamed("event");
                objectDescriptor.removeEventDescriptor(eventDescriptor);

                expect(eventDescriptor.owner).toBe(null);
                expect(objectDescriptor.eventDescriptorForName("event")).toBe(null);
            });

            it("removes an existing objectDescriptor from it's previous owner", () => {
                const oldObjectDescriptor = new ObjectDescriptor().initWithName("old");

                const eventDescriptor = new EventDescriptor().initWithNameAndObjectDescriptor(
                    "event",
                    oldObjectDescriptor
                );
                objectDescriptor.addEventDescriptor(eventDescriptor);

                expect(eventDescriptor.owner).toBe(objectDescriptor);
                expect(objectDescriptor.eventDescriptorForName("event")).toBe(eventDescriptor);
                expect(oldObjectDescriptor.eventDescriptorForName("event")).toBe(null);
            });

            it("lists event objectDescriptors of the parent", () => {
                const parentObjectDescriptor = new ObjectDescriptor().initWithName("parent");
                objectDescriptor.parent = parentObjectDescriptor;

                const parentEvent = parentObjectDescriptor.addEventDescriptorNamed("parentEvent");
                const event = objectDescriptor.addEventDescriptorNamed("event");

                expect(objectDescriptor.eventDescriptors.length).toEqual(2);
                expect(objectDescriptor.eventDescriptors).toEqual([event, parentEvent]);
            });
        });

        describe("UserInterfaceDescriptor", () => {
            let employee;
            let customer;

            beforeEach(() => {
                employee = new Employee();
                customer = new Customer();
            });

            it("should be required if it exists", async () => {
                const employeeObjectDescriptor = await employee.constructor.objectDescriptor;
                const employeeUiDescriptor = await employeeObjectDescriptor.userInterfaceDescriptor;

                expect(employeeUiDescriptor).toBeTruthy();
                expect(employeeUiDescriptor.descriptionExpression).toBe("department");
                expect(employeeUiDescriptor.inspectorComponentModule.id).toBe("ui/inspectors/employee.mod");

                const customerObjectDescriptor = await customer.constructor.objectDescriptor;
                const customerUiDescriptor = await customerObjectDescriptor.userInterfaceDescriptor;

                expect(customerUiDescriptor).toBeFalsy();
            });
        });

        describe("validation", () => {
            it("should have a movie descriptor with the correct name and number of validation rules", () => {
                // Setup & Execute & Assert
                expect(movieDescriptor).toBeDefined();
                expect(movieDescriptor.name).toBe("Movie");
                expect(movieDescriptor.validationRules.length).toBe(4);
            });

            it("should pass validation for a valid title", async () => {
                // Setup & Execute
                const noValidationErrors = await movieDescriptor.evaluateObjectValidity({ title: "Inception" });

                // Assert
                expect(noValidationErrors.length).toBe(0);
            });

            it("should fail validation when the title is shorter than the minimum length", async () => {
                // Setup & Execute
                const validationErrors = await movieDescriptor.evaluateObjectValidity({ title: "A" });

                // Assert
                expect(validationErrors.length).toBe(1);
                expect(validationErrors[0].message).toBe("The title must be at least 2 characters long.");
            });

            it("should fail validation when the title is longer than the maximum length", async () => {
                // Setup & Execute
                const validationErrors = await movieDescriptor.evaluateObjectValidity({
                    title: "This title is definitely longer than thirty-two characters.",
                });

                // Assert
                expect(validationErrors.length).toBe(1);
                expect(validationErrors[0].message).toBe("The title must be at most 32 characters long.");
            });

            it("should fail validation when the title contains a forbidden '@' character", async () => {
                // Setup & Execute
                const validationErrors = await movieDescriptor.evaluateObjectValidity({ title: "Invalid@Title" });

                // Assert
                expect(validationErrors.length).toBe(1);
                expect(validationErrors[0].message).toBe("The title cannot contain the '@' character.");
            });

            it("should return all applicable errors when a title violates multiple rules", async () => {
                // Setup & Execute
                const validationErrors = await movieDescriptor.evaluateObjectValidity({ title: "@" });

                // Assert
                expect(validationErrors.length).toBe(2);
                expect(validationErrors.map(({ message }) => message)).toContain(
                    "The title must be at least 2 characters long."
                );
                expect(validationErrors.map(({ message }) => message)).toContain(
                    "The title cannot contain the '@' character."
                );
            });

            it("should pass validation for a title at the minimum length boundary", async () => {
                // Setup & Execute
                const noValidationErrors = await movieDescriptor.evaluateObjectValidity({ title: "Up" });

                // Assert
                expect(noValidationErrors.length).toBe(0);
            });

            it("should pass validation for a title at the maximum length boundary", async () => {
                // Setup & Execute: This title is exactly 32 characters
                const noValidationErrors = await movieDescriptor.evaluateObjectValidity({
                    title: "The Lord of the Rings: The Two!!",
                });

                // Assert
                expect(noValidationErrors.length).toBe(0);
            });

            it("should pass validation if the releaseDate is not provided", async () => {
                // Setup & Execute: The expression `!releaseDate` handles the null/undefined case
                const noValidationErrors = await movieDescriptor.evaluateObjectValidity({
                    title: "Movie without a date",
                });

                // Assert
                expect(noValidationErrors.length).toBe(0);
            });

            it("should pass validation for a releaseDate with a year before 2042", async () => {
                // Setup & Execute
                const noValidationErrors = await movieDescriptor.evaluateObjectValidity({
                    title: "Old Movie",
                    releaseDate: new Date("1999-12-31"),
                });

                // Assert
                expect(noValidationErrors.length).toBe(0);
            });

            it("should fail validation for a releaseDate with a year of 2042", async () => {
                // Setup & Execute
                const validationErrors = await movieDescriptor.evaluateObjectValidity({
                    title: "Future Movie",
                    releaseDate: new Date("2042-01-01"),
                });

                // Assert
                expect(validationErrors.length).toBe(1);
                expect(validationErrors[0].message).toBe("The release date must be before 2042.");
            });

            it("should fail validation for a releaseDate with a year after 2042", async () => {
                // Setup & Execute
                const validationErrors = await movieDescriptor.evaluateObjectValidity({
                    title: "Very Future Movie",
                    releaseDate: new Date("2050-06-15"),
                });

                // Assert
                expect(validationErrors.length).toBe(1);
                expect(validationErrors[0].message).toBe("The release date must be before 2042.");
            });

            it("should not return a releaseDate error if another validation rule fails", async () => {
                // Setup & Execute: Title is too short, but releaseDate is valid.
                const validationErrors = await movieDescriptor.evaluateObjectValidity({
                    title: "A",
                    releaseDate: new Date("2020-01-01"),
                });

                // Assert
                expect(validationErrors.length).toBe(1);
                // The only error should be about the title.
                expect(validationErrors[0].message).toBe("The title must be at least 2 characters long.");
            });
        });
    });
});
