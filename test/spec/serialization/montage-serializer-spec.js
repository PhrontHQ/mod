var Montage = require("mod/core/core").Montage,
    MontageSerializer = require("mod/core/serialization/serializer/montage-serializer").MontageSerializer,
    objects = require("spec/serialization/testobjects-v2").objects,
    ModuleReference = require("mod/core/module-reference").ModuleReference,
    Alias = require("mod/core/serialization/alias").Alias;

    function createFakeModuleReference(id, _require) {
        return new ModuleReference().initWithIdAndRequire(id, _require || require);
    }

describe("spec/serialization/montage-serializer-spec", function () {
    var serializer;
    var originalUnits;

    beforeEach(function () {
        originalUnits = MontageSerializer._units;
        MontageSerializer._units = {};
        serializer = new MontageSerializer().initWithRequire(require);
        serializer.setSerializationIndentation(4);
    });

    afterEach(function () {
        MontageSerializer._units = originalUnits;
    });

    describe("native types serialization", function() {
        it("should serialize native types", function () {
            var object = {
                    string: "string",
                    date: new Date('05 October 2011 14:48 UTC'),
                    number: 42,
                    regexp: /regexp/gi,
                    array: [1, 2, 3],
                    boolean: true,
                    nil: null
                },
                expectedSerialization,
                serialization;

            expectedSerialization = {
                object: {
                    value: {
                        string: "string",
                        date: "2011-10-05T14:48:00.000Z",
                        number: 42,
                        regexp: {"/": {source: "regexp", flags: "gi"}},
                        array: {"@": "array"},
                        boolean: true,
                        nil: null,
                        object: {"@": "object"}
                    }
                },
                array: {
                    value: [1, 2, 3]
                },
                string: {
                    value: "string"
                },
                date: {
                    value: "2011-10-05T14:48:00.000Z"
                },
                number: {
                    value: 42
                },
                regexp: {
                    value: {"/": {source: "regexp", flags: "gi"}}
                },
                boolean: {
                    value: true
                },
                nil: {
                    value: null
                }
            };

            object.object = object;

            serialization = serializer.serialize(object);
            expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
        });

        it("should serialize a string", function() {
            var object = "string",
                expectedSerialization,
                serialization;

            expectedSerialization = {
                root: {
                    value: "string"
                }
            };

            serialization = serializer.serializeObject(object);
            expect(JSON.parse(serialization)).toEqual(expectedSerialization);
        });

        describe("numbers", function() {
            it("should serialize a positive number", function() {
                var object = 42,
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: 42
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize a negative number", function() {
                var object = -42,
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: -42
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize a rational number", function() {
                var object = 3.1415,
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: 3.1415
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });
        });

        describe("booleans", function() {
            it("should serialize true", function() {
                var object = true,
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: true
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize false", function() {
                var object = false,
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: false
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });
        });

        it("should serialize a null value", function() {
            var object = null,
                expectedSerialization,
                serialization;

            expectedSerialization = {
                root: {
                    value: null
                }
            };

            serialization = serializer.serializeObject(object);
            expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
        });

        it("shouldn't serialize an undefined value", function() {
            var object,
                expectedSerialization,
                serialization;

            expectedSerialization = {
            };

            serialization = serializer.serializeObject(object);
            expect(JSON.parse(serialization)).toEqual(expectedSerialization);
        });
    });


    describe("Montage objects serialization", function () {

        describe("types", function () {
            it("should serialize an empty class object", function () {
                var object = objects.Empty,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        object: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an empty instance object", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize without the object name", function () {
                var object = new objects.TestobjectsV2(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2",
                        values: {
                            identifier: null
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("modules", function () {
            it("should serialize a module reference", function () {
                var object = createFakeModuleReference("pass"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        value: {"%": "pass"}
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an module reference as an object property", function () {
                var object = new objects.OneProp(),
                    ref = createFakeModuleReference("pass"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null,
                            prop: {"%": "pass"}
                        }
                    }
                };

                object.prop = ref;

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an module reference multiple times", function () {
                var object = new objects.TwoProps(),
                    ref = createFakeModuleReference("pass"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[TwoProps]",
                        values: {
                            identifier: null,
                            prop1: {"%": "pass"},
                            prop2: {"%": "pass"}
                        }
                    }
                };

                object.prop1 = ref;
                object.prop2 = ref;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a module reference from a different package", function () {
                var montageRequire = require.getPackage({name: "montage"}),
                    object = createFakeModuleReference("core/module-reference", montageRequire),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        value: {"%": "mod/core/module-reference"}
                    }
                };

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should throw when there is no mapping to the module from a different package", function () {
                var montageRequire = require.getPackage({name: "montage"}),
                    object = createFakeModuleReference("pass", require),
                    serialization;

                // montageRequire has no mapping to this package, and so the
                // module reference cannot be serialized
                serializer = new MontageSerializer().initWithRequire(montageRequire);
                serializer.setSerializationIndentation(4);

                expect(function () {
                    serialization = serializer.serializeObject(object);
                }).toThrow();
            });
        });

        describe("properties", function () {
            it("shouldn't serialize undefined values", function () {
                var object = new objects.OneProp(),
                    undefined,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null
                        }
                    }
                };

                object.prop = undefined;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an instance object with an array property", function () {
                var object = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null,
                            prop: [1, 2, 3, 4, 5]
                        }
                    }
                };

                object.prop = [1, 2, 3, 4, 5];

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an instance object with native type properties", function () {
                var object = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize according to the 'serializer' attribute", function () {
                var object = new objects.SerializableAttribute(),
                    prop1 = new objects.OneProp(),
                    prop2 = new objects.OneProp(),
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[SerializableAttribute]",
                        values: {
                            prop1a: {"@": "oneprop"},
                            prop1b: {"@": "oneprop"},
                            prop2a: {"@": "oneprop2"},
                            prop2b: {"@": "oneprop2"},
                            identifier: null
                        }
                    },

                    oneprop: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            prop: "prop1",
                            identifier: null
                        }
                    },

                    oneprop2: {}
                };

                prop1.prop = "prop1";
                prop2.prop = "prop2";
                object.prop1a = object.prop1b = prop1;
                object.prop2a = object.prop2b = prop2;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        it("should serialize two connected objects", function () {
            var object = new objects.OneProp(),
                simple = new objects.Simple(),
                serialization,
                expectedSerialization;

            expectedSerialization = {
                root: {
                    prototype: "spec/serialization/testobjects-v2[OneProp]",
                    values: {
                        identifier: null,
                        prop: {"@": "simple"}
                    }
                },

                simple: {
                    prototype: "spec/serialization/testobjects-v2[Simple]",
                    values: {
                        identifier: null,
                        number: 42,
                        string: "string"
                    }
                }
            };

            object.prop = simple;

            serialization = serializer.serializeObject(object);
            expect(JSON.parse(serialization)).toEqual(expectedSerialization);
        });

        it("should serialize two disconnected objects", function () {
            var object = new objects.Empty(),
                simple = new objects.Simple(),
                serialization,
                expectedSerialization;

            expectedSerialization = {
                anObject: {
                    prototype: "spec/serialization/testobjects-v2[Empty]",
                    values: {
                        identifier: null
                    }
                },

                anotherObject: {
                    prototype: "spec/serialization/testobjects-v2[Simple]",
                    values: {
                        identifier: null,
                        number: 42,
                        string: "string"
                    }
                }
            };

            object.prop = simple;

            serialization = serializer.serialize({anObject: object, anotherObject: simple});
            expect(JSON.parse(serialization)).toEqual(expectedSerialization);
        });

        describe("cycles", function () {
            it("should serialize an instance object that references itself", function () {
                var object = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null,
                            prop: {"@": "root"}
                        }
                    }
                };

                object.prop = object;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize two instance objects with a mutual dependence", function () {
                var object = new objects.OneProp(),
                    oneProp = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null,
                            prop: {"@": "oneprop"}
                        }
                    },

                    oneprop: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            prop: {"@": "root"},
                            identifier: null
                        }
                    }
                };

                object.prop = oneProp;
                oneProp.prop = object;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("serializeProperties delegate", function () {
            it("should serialize native type property", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            number: 42
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("number", 42);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an object property", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            object: {"@": "empty"}
                        }
                    },

                    empty: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("object", empty);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an object property as an external reference", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            object: {"@": "empty"}
                        }
                    },
                    empty: {}
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("object", empty, "reference");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an external reference to an object that implements serializeSelf", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            object: {"@": "empty"}
                        }
                    },
                    empty: {}
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("object", empty, "reference");
                };

                empty.serializeSelf = function (serializer) {
                    serializer.setProperty("object", {});
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize all properties", function () {
                var object = new objects.CustomAllProperties(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[CustomAllProperties]",
                        values: {
                            identifier: null,
                            manchete: 42,
                            rodriguez: {"@": "empty"},
                            luz: {"@": "empty2"}
                        }
                    },
                    empty: {},
                    empty2: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize references to native types as value", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            string: "string",
                            number: 42,
                            boolean: true,
                            nil: null
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("string", "string", "reference");
                    serializer.set("number", 42, "reference");
                    serializer.set("boolean", true, "reference");
                    serializer.set("nil", null, "reference");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should add objects", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]"
                    },

                    empty: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.addObject(empty);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should ignore adding a native type as an object", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]"
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.addObject("string");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("serializeSelf delegate", function () {
            beforeEach(function () {
                MontageSerializer.defineSerializationUnit("unitA",
                function (serializer, object) {
                    if (object._unitA) {
                        return {
                            content: object._unitA
                        };
                    }
                });
                MontageSerializer.defineSerializationUnit("unitB",
                function (serializer, object) {
                    if (object._unitB) {
                        return {
                            content: object._unitB
                        };
                    }
                });
                MontageSerializer.prototype.initWithRequire(require);

                serializeSelfTestObject = new objects.TwoProps();
                serializeSelfTestObject.prop1 = "prop1";
                serializeSelfTestObject.prop2 = "prop2";
                serializeSelfTestObject._unitA = "unit-a content";
                serializeSelfTestObject._unitB = "unit-b content";
            });

            it("should only serialize the type", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]"
                    }
                };

                object.serializeSelf = function (serializer) {
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should only serialize the the properties", function () {
                var object = serializeSelfTestObject,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[TwoProps]",
                        values: {
                            identifier: null,
                            prop1: "prop1",
                            prop2: "prop2"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setAllValues();
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should only serialize unit A", function () {
                var object = serializeSelfTestObject,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[TwoProps]",
                        unitA: {
                            content: "unit-a content"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setUnit("unitA");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should only serialize unit A and unit B explicitly", function () {
                var object = serializeSelfTestObject,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[TwoProps]",
                        unitA: {
                            content: "unit-a content"
                        },
                        unitB: {
                            content: "unit-b content"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setUnit("unitA");
                    serializer.setUnit("unitB");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should only serialize all units", function () {
                var object = serializeSelfTestObject,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[TwoProps]",
                        unitA: {
                            content: "unit-a content"
                        },
                        unitB: {
                            content: "unit-b content"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setAllUnits();
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a native type property", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            manchete: 42
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setProperty("manchete", 42);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an object property", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            object: {"@": "empty"}
                        }
                    },

                    empty: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setProperty("object", empty);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an object property as an external reference", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            object: {"@": "empty"}
                        }
                    },
                    empty: {}
                };

                object.serializeSelf = function (serializer) {
                    serializer.setProperty("object", empty, "reference");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a subtitute object", function () {
                var object = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return empty;
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a subtitute object that is an object literal", function () {
                var object = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        value: {
                            substituteObject: true
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return {
                        substituteObject: true
                    };
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object that has already been serialized", function () {
                var object = new objects.TwoProps(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[TwoProps]",
                        values: {
                            prop1: {"@": "simple"},
                            prop2: {"@": "simple"}
                        }
                    },
                    simple: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("prop1", simple);
                    serializer.set("prop2", empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a reference to a substitute object, when serializing a reference to the proxy object, that has already been serialized", function () {
                var object = new objects.TwoProps(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[TwoProps]",
                        values: {
                            prop1: {"@": "simple"},
                            prop2: {"@": "simple"}
                        }
                    },
                    simple: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("prop1", empty);
                    serializer.set("prop2", empty, "reference");
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object for an object that has a user defined label", function () {
                var object = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    object: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return empty;
                };

                serialization = serializer.serialize({object: object});
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object, with a self reference, for an object that has a user defined label", function () {
                var object = new objects.Simple(),
                    oneProp = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null,
                            prop: {"@": "root"}
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return oneProp;
                };

                oneProp.prop = oneProp;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object, with a reference to the substituted object, for an object that has a user defined label", function () {
                var object = new objects.Simple(),
                    oneProp = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null,
                            prop: {"@": "root"}
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return oneProp;
                };

                oneProp.prop = object;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object, that has already been serialized, for an object that has a user defined label", function () {
                var object = new objects.TwoProps(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[TwoProps]",
                        values: {
                            prop1: {"@": "empty"},
                            prop2: {"@": "empty"}
                        }
                    },
                    empty: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("prop1", simple);
                    serializer.set("prop2", empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serialize({root: object, empty: empty});
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object for an object where both object and substitute object have a user defined label", function () {
                var object = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    empty: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return empty;
                };

                serialization = serializer.serialize({object: object, empty: object});
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object of an object that was added with serializeProperties' addObject", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]"
                    },

                    simple: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.addObject(empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object of an object that was added with serializeSelf's addObject", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]"
                    },

                    simple: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.addObject(empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a chain of substitute objects", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    oneProp = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null,
                            prop: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return simple;
                };

                simple.serializeSelf = function (serializer) {
                    return oneProp;
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should add objects", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]"
                    },

                    empty: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.addObject(empty);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should ignore adding a native type as an object", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]"
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.addObject("string");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object when both object and substitute object have a user defined label", function () {
                var object = new objects.TwoProps(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[TwoProps]",
                        values: {
                            prop1: {"@": "empty"},
                            prop2: {"@": "empty"}
                        }
                    },
                    simple: {
                        value: {"@": "empty"}
                    },
                    empty: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("prop1", simple);
                    serializer.set("prop2", empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serialize({root: object, empty: empty, simple: simple});
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("labels", function () {
            it("should serialize an object using its identifier property as the label", function () {
                var object = new objects.OneProp(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null,
                            prop: {"@": "anObject"}
                        }
                    },

                    anObject: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: "anObject"
                        }
                    }
                };

                object.prop = empty;
                empty.identifier = "anObject";

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should not serialize an object using its identifier property as the label if it's invalid", function () {
                var object = new objects.OneProp(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            identifier: null,
                            prop: {"@": "empty"}
                        }
                    },

                    empty: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: "an-object"
                        }
                    }
                };

                object.prop = empty;
                empty.identifier = "an-object";

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should avoid name clashes between given labels and generated labels from identifier", function () {
                var object = new objects.OneProp(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    generated: {
                        prototype: "spec/serialization/testobjects-v2[OneProp]",
                        values: {
                            prop: {"@": "generated2"},
                            identifier: null
                        }
                    },

                    generated2: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: "generated"
                        }
                    }
                };

                object.prop = empty;
                empty.identifier = "generated";

                serialization = serializer.serialize({generated: object});
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });
        });

        describe("external references", function () {
            it("should serialize an external reference", function () {
                var object = new objects.OneReferenceProp(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[OneReferenceProp]",
                        values: {
                            identifier: null,
                            referenceProp: {"@": "empty"}
                        }
                    },
                    empty: {}
                };

                object.referenceProp = empty;
                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should not consider an object that was referenced and then serialized as an external object", function () {
                var object = new objects.OneProp(),
                    oneProp = new objects.OneProp(),
                    externalObjects,
                    serialization;

                object.serializeProperties = function (serializer) {
                    serializer.set("object1", oneProp, "reference");
                    serializer.set("object2", oneProp);
                };

                serialization = serializer.serializeObject(object);
                externalObjects = serializer.getExternalObjects();

                expect(Object.keys(externalObjects).length).toBe(0);
            });

            it("should return all external objects", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    simple = new objects.Simple(),
                    serialization,
                    externalObjects;

                object.serializeSelf = function (serializer) {
                    serializer.setProperty("external", simple, "reference");
                    serializer.setProperty("internal", empty);
                };

                serialization = serializer.serializeObject(object);
                externalObjects = serializer.getExternalObjects();

                expect(Object.keys(externalObjects).length).toBe(1);
                expect(externalObjects.simple).toBe(simple);
            })
        });

        describe("serialization units", function () {
            it("should serialize native values in serialization unit", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        },
                        testing: {
                            number: 42,
                            string: "string"
                        }
                    }
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, object) {
                    return {
                        number: 42,
                        string: "string"
                    };
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize references in serialization unit", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        },
                        testing: {
                            simpleRef1: {"@": "simple"},
                            simpleRef2: {"@": "simple"}
                        }
                    },
                    simple: {}
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, object) {
                    var simpleRef = serializer.addObjectReference(simple);

                    return {
                        simpleRef1: simpleRef,
                        simpleRef2: simpleRef
                    };
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should first serialize the object then a reference in serialization unit", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        },
                        testing: {
                            simpleRef: {"@": "simple"},
                            simple: {"@": "simple"}
                        }
                    },
                    simple: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, _object) {
                    if (_object !== object) {
                        return;
                    }

                    var simpleRef = serializer.addObjectReference(simple);

                    return {
                        simpleRef: simpleRef,
                        simple: simple
                    };
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should first serialize a reference then the object in serialization unit", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        },
                        testing: {
                            simpleRef: {"@": "simple"},
                            simple: {"@": "simple"}
                        }
                    },
                    simple: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, _object) {
                    if (_object !== object) {
                        return;
                    }

                    var simpleRef = serializer.addObjectReference(simple);

                    return {
                        simple: simple,
                        simpleRef: simpleRef
                    };
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a parentless object in serialization unit", function () {
                var object = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "spec/serialization/testobjects-v2[Simple]",
                        values: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    },
                    empty: {
                        prototype: "spec/serialization/testobjects-v2[Empty]",
                        values: {
                            identifier: null
                        }
                    }
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, _object) {
                    if (_object !== object) {
                        return;
                    }

                    serializer.addObject(empty);
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

        });
    });

    describe("Template properties serialization", function () {
        it("should serialize a template property alias", function () {
            var object = {
                    ":templateProperty": new Alias().init("@component:propertyName")
                },
                expectedSerialization,
                serialization;

            expectedSerialization = {
                ":templateProperty": {
                    "alias": "@component:propertyName"
                }
            };

            serialization = serializer.serialize(object);
            expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
        });

        it("should not serialize a alias outside a template property", function () {
            var object = {
                    "property": new Alias().init("@component:propertyName")
                };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });

        it("should not serialize a value with a template property label", function () {
            var object = {
                ":property": 42
            };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });

        it("should not serialize an object literal with a template property label", function () {
            var object = {
                ":property": {}
            };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });

        it("should not serialize a regexp with a template property label", function () {
            var object = {
                ":property": /regexp/
            };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });

        it("should not serialize a montage object with a template property label", function () {
            var object = {
                ":property": objects.Empty
            };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });
    });

    describe("native objects serialization", function() {
        describe("array", function() {
            it("should serialize an empty array", function() {
                var object = [],
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: []
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize an array with native values", function() {
                var object = [
                        "string",
                        42,
                        /regexp/gi,
                        true
                    ],
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: [
                            "string",
                            42,
                            {"/": {source: "regexp", flags: "gi"}},
                            true
                        ]
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize composed arrays", function() {
                var object = [[true], [[false]]],
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: [[true], [[false]]]
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize different references to the same array", function() {
                var child = ["string"],
                    object = {
                        child1: child,
                        child2: child
                    },
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    array: {
                        value: ["string"]
                    },

                    root: {
                        value: {
                            child1: {"@": "array"},
                            child2: {"@": "array"}
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize an array with a reference to itself", function() {
                var object = [],
                    expectedSerialization,
                    serialization;

                object.push(object);

                expectedSerialization = {
                    root: {
                        value: [
                            {"@": "root"}
                        ]
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

        });

        it("should serialize a RegExp", function() {
            var object = /this \/ "\/ regexp/gm,
                expectedSerialization,
                serialization;

            expectedSerialization = {
                root: {
                    value: {"/": {
                        source: "this \\\/ \"\\\/ regexp",
                        flags: "gm"}}
                }
            };

            serialization = serializer.serializeObject(object);
            expect(JSON.parse(serialization)).toEqual(expectedSerialization);
        });

        describe("object literal", function() {
            it("should serialize an empty object literal", function() {
                var object = {},
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: {}
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize an object literal with native values", function() {
                var object = {
                        string: "string",
                        number: 42,
                        regexp: /regexp/gi,
                        boolean: true
                    },
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: {
                            string: "string",
                            number: 42,
                            regexp: {"/": {source: "regexp", flags: "gi"}},
                            boolean: true
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize composed object literals", function() {
                var object = {
                        child: {
                            child: {
                                leaf: true
                            }
                        },
                    },
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        value: {
                            child: {
                                child: {
                                    leaf: true
                                }
                            }
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize different references to the same object literal ", function() {
                var child = {
                        string: "string"
                    },
                    object = {
                        child1: child,
                        child2: child
                    },
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    object: {
                        value: {
                            string: "string"
                        }
                    },

                    root: {
                        value: {
                            child1: {"@": "object"},
                            child2: {"@": "object"}
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should serialize an object literal with a reference to itself", function() {
                var object = {},
                    expectedSerialization,
                    serialization;

                object.self = object;

                expectedSerialization = {
                    root: {
                        value: {
                            self: {"@": "root"}
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });
        });

        describe("labels", function() {
            it("should serialize a reference to an object using its given label", function() {
                var object = {},
                    anotherObject = {name: "anotherObject"},
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        value: {
                            object1: {"@": "anotherObject"},
                            object2: {"@": "anotherObject"}
                        }
                    },

                    anotherObject: {
                        value: {
                            name: "anotherObject"
                        }
                    }
                };

                object.object1 = anotherObject;
                object.object2 = anotherObject;

                serialization = serializer.serialize({root: object, anotherObject: anotherObject});
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should avoid name clashes between given labels and generated labels from the type of object", function() {
                var object = {},
                    anotherObject = {name: "anotherObject"},
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    object: {
                        value: {
                            anotherObject1: {"@": "object3"},
                            anotherObject2: {"@": "object3"}
                        }
                    },

                    object2: {
                        value: {}
                    },

                    object3: {
                        value: {
                            name: "anotherObject"
                        }
                    }
                };

                object.anotherObject1 = anotherObject;
                object.anotherObject2 = anotherObject;

                serialization = serializer.serialize({object: object, object2: {}});
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });
        });
    });

    it("should be oblivious to Object.prototype aditions", function() {
        Object.defineProperty(Object.prototype, "clear", {
            value: function() {},
            writable: true,
            configurable: true,
            enumerable: true
        });

        var object = "a string",
            serialization,
            expectedSerialization;

        expectedSerialization = {
            "clear": {
                "value": "a string"
            }
        };

        serialization = serializer.serialize({clear: object});
        expect(JSON.parse(serialization))
            .toEqual(expectedSerialization);

        delete Object.prototype.clear;
    });

});
