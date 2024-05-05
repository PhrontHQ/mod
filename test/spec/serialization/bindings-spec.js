
var Montage = require("mod/core/core").Montage;
var Bindings = require("mod/core/core").Bindings;
var serialize = require("mod/core/serialization/serializer/montage-serializer").serialize;
var deserialize = require("mod/core/serialization/deserializer/montage-deserializer").deserialize;
var Deserializer = require("mod/core/serialization/deserializer/montage-deserializer").MontageDeserializer;

var Type = exports.Type = Montage.specialize( {
    foo: {
        value: 10
    }
});

describe("serialization/bindings-spec", function () {

    it("should serialize a simple binding in normal form", function () {
        var object = new Type();
        Bindings.defineBindings(object, {
            "bar": {
                "<-": "foo"
            }
        });
        var serialization = serialize(object, require);
        var notation = JSON.parse(serialization);
        expect(notation).toEqual({
            "root": {
                "prototype": "spec/serialization/bindings-spec[Type]",
                "values": {
                    "foo": 10,
                    "identifier": null,
                    "bar": {
                        "<-": "foo"
                    }
                }
            }
        });
    });

    it("should deserialize a simple binding in normal form", function (done) {
        var serialization = {
                "root": {
                    "prototype": "spec/serialization/bindings-spec[Type]",
                    "values": {
                        "foo": 10,
                        "bar": {
                            "<-": "foo"
                        }
                    }
                }
            },
            serializationString = JSON.stringify(serialization);
        deserialize(serializationString, require).then(function (object) {
            expect(object.foo).toBe(10);
            object.foo = 20;
            expect(object.bar).toBe(20);
        }).finally(function () {
            done();
        });
    });

    it("should deserialize a simple binding with a component reference", function (done) {
        var serialization = {
                "root": {
                    "prototype": "spec/serialization/bindings-spec[Type]",
                    "values": {
                        "foo": 10,
                        "bar": {
                            "<-": "@root.foo"
                        }
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        deserialize(serializationString, require).then(function (object) {
            expect(object.foo).toBe(10);
            object.foo = 20;
            expect(object.bar).toBe(20);
        }).finally(function () {
            done();
        });
    });

    it("should fail deserializing a binding to a non existing object", function (done) {
        var serialization = {
                "root": {
                    "prototype": "spec/serialization/bindings-spec[Type]",
                    "values": {
                        "foo": 10,
                        "bar": {"<-": "@unknown.foo"}
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        deserialize(serializationString, require).then(function (object) {
            expect("deserialization").toBe("fail");
        }).catch(function(err) {
            expect(err).toBeDefined();
        }).finally(function () {
            done();
        });
    });

    describe("template properties' bindings", function () {
        var deserializer;

        beforeEach(function () {
            deserializer = new Deserializer();
        });

        it("should not allow binding to a template property of a component that does not exist", function (done) {
            var serialization = {
                    "component": {
                        "prototype": "mod/ui/component",
                        "values": {
                            "value": {"<-": "@unknown:templateProperty"}
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            deserializer.deserialize().then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function(err) {
                expect(err).toBeDefined();
            }).finally(function () {
                done();
            });
        });

        it("should allow binding to a template property of a component that exists", function (done) {
            var serialization = {
                    "known": {},

                    "component": {
                        "prototype": "mod/ui/component",
                        "values": {
                            "value": {"<-": "@known:templateProperty"}
                        }
                    }
                },
                instances = {
                    "known": {}
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            deserializer.deserialize(instances).then(function (res) {
                expect(res).toBeDefined();
            }).finally(function () {
                done();
            });
        });

        it("should bind correctly to a component with a colon", function (done) {
            // This "trick" can be used to speed up template properties'
            // resolution at bind time.
            var serialization = {
                    "owner": {},
                    "owner:templateProperty": {},

                    "component": {
                        "prototype": "mod/ui/component",
                        "values": {
                            "value": {"<-": "@owner:templateProperty"}
                        }
                    }
                },
                owner = {},
                instances = {
                    "owner": owner,
                    "owner:templateProperty": {}
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            deserializer.deserialize(instances).then(function (objects) {
                expect(objects.component.value).toBe(instances["owner:templateProperty"]);
            }).finally(function () {
                done();
            });
        });
    });
});

