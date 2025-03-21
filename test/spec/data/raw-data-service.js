var RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    Criteria = require("mod/core/criteria").Criteria,
    DataMapping = require("mod/data/service/data-mapping").DataMapping,
    DataService = require("mod/data/service/data-service").DataService,
    DataStream = require("mod/data/service/data-stream").DataStream,
    DataObjectDescriptor = require("mod/data/model/data-object-descriptor").DataObjectDescriptor,
    ObjectDescriptor = require("mod/core/meta/object-descriptor").ObjectDescriptor,
    RawDataTypeMapping = require("mod/data/service/raw-data-type-mapping").RawDataTypeMapping;

describe("A RawDataService", function() {

    it("can be created", function () {
        expect(new RawDataService()).toBeDefined();
    });

    it("manages children correctly", function () {
        var toString, Types, objects, Child, children, parent;

        // Define test types with ObjectDescriptors.
        toString = function () { return "Type" + this.id; };
        Types = [0, 1, 2, 3].map(function () { return function () {}; });
        Types.forEach(function (type) { type.TYPE = new DataObjectDescriptor(); });
        Types.forEach(function (type) { type.TYPE.toString = toString; });
        Types.forEach(function (type) { type.TYPE.jasmineToString = toString; });
        Types.forEach(function (type, index) { type.TYPE.id = index; });

        // Define test objects for each of the test types.
        toString = function () { return "Object" + this.id; };
        objects = Types.map(function (type) { return new type(); });
        objects.forEach(function (object) { object.toString = toString; });
        objects.forEach(function (object) { object.jasmineToString = toString; });
        objects.forEach(function (object, index) { object.id = index; });

        // Create test children with unique identifiers to help with debugging.
        toString = function () { return "Child" + this.id; };
        children = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function () { return new RawDataService(); });
        children.forEach(function (child) { child.toString = toString; });
        children.forEach(function (child) { child.jasmineToString = toString; });
        children.forEach(function (child, index) { child.id = index; });

        // Define a variety of types for the test children. Children with an
        // undefined, null, or empty types array will be "all types" children.
        children.forEach(function (child) { Object.defineProperty(child, "types", {writable: true}); });
        children[0].types = [Types[0].TYPE];
        children[1].types = [Types[0].TYPE];
        children[2].types = [Types[1].TYPE];
        children[3].types = [Types[0].TYPE, Types[1].TYPE];
        children[4].types = [Types[0].TYPE, Types[2].TYPE];
        children[5].types = [Types[1].TYPE, Types[2].TYPE];
        children[6].types = [Types[0].TYPE, Types[1].TYPE, Types[2].TYPE];
        children[7].types = undefined;
        children[8].types = null;
        children[9].types = [];

        // Create a service with the desired children.
        parent = new RawDataService();
        parent.toString = function () { return "PARENT"; };
        parent.jasmineToString = parent.toString;
        children.forEach(function (child) { parent.addChildService(child); });

        // Verify the initial parents, types, and type-to-child mapping.
        expect(parent.parentService).toBeUndefined();
        expect(children[0].parentService).toEqual(parent);
        expect(children[1].parentService).toEqual(parent);
        expect(children[2].parentService).toEqual(parent);
        expect(children[3].parentService).toEqual(parent);
        expect(children[4].parentService).toEqual(parent);
        expect(children[5].parentService).toEqual(parent);
        expect(children[6].parentService).toEqual(parent);
        expect(children[7].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[0]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[4]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[0]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[4]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[7]);

        // Modify the children and verify the resulting service parent, types,
        // and type-to-child mapping.
        parent.removeChildService(children[0]);
        parent.removeChildService(children[1]);
        expect(parent.parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[3].parentService).toEqual(parent);
        expect(children[4].parentService).toEqual(parent);
        expect(children[5].parentService).toEqual(parent);
        expect(children[6].parentService).toEqual(parent);
        expect(children[7].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[3]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[4]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[3]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[4]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[7]);

        // Modify and verify some more.
        parent.removeChildService(children[3]);
        expect(parent.parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[4].parentService).toEqual(parent);
        expect(children[5].parentService).toEqual(parent);
        expect(children[6].parentService).toEqual(parent);
        expect(children[7].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[4]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[4]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[4]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[4]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[7]);

        // Modify and verify some more. After the modification there will be no
        // more children for Types[0] so the first "all types" child should be
        // returned for that type.
        parent.removeChildService(children[4]);
        parent.removeChildService(children[6]);
        expect(parent.parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[5].parentService).toEqual(parent);
        expect(children[7].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[7]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[5]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[5]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[7]);

        // Modify and verify some more.
        parent.removeChildService(children[5]);
        parent.removeChildService(children[7]);
        expect(parent.parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[1].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[8]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[8]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[8]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[8]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[8]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[8]);

        // Modify and verify some more.
        parent.removeChildService(children[2]);
        parent.removeChildService(children[8]);
        expect(parent.parentService).toBeUndefined();
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[9]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[9]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[9]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[9]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[9]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[9]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[9]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[9]);

        // Modify and verify some more.
        parent.removeChildService(children[9]);
        expect(parent.parentService).toBeUndefined();
        expect(parent.types.sort()).toEqual([]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toBeNull();
        expect(parent.childServiceForType(Types[1].TYPE)).toBeNull();
        expect(parent.childServiceForType(Types[2].TYPE)).toBeNull();
        expect(parent.childServiceForType(Types[3].TYPE)).toBeNull();
        expect(parent._getChildServiceForObject(objects[0])).toBeNull();
        expect(parent._getChildServiceForObject(objects[1])).toBeNull();
        expect(parent._getChildServiceForObject(objects[2])).toBeNull();
        expect(parent._getChildServiceForObject(objects[3])).toBeNull();
    });



    // it("manages type mappings correcty", function () {
    //     var service = new RawDataService(),
    //         parentDescriptor = new ObjectDescriptor(),
    //         subDescriptorA = new ObjectDescriptor(),
    //         subDescriptorB = new ObjectDescriptor(),
    //         criteriaA = new Criteria().initWithExpression("type == $paramType", {
    //             paramType: "type_a"
    //         }),
    //         criteriaB = new Criteria().initWithExpression("type == $paramType", {
    //             paramType: "type_b"
    //         }),
    //         mappingA = RawDataTypeMapping.withTypeAndCriteria(subDescriptorA, criteriaA),
    //         mappingB = RawDataTypeMapping.withTypeAndCriteria(subDescriptorB, criteriaB),
    //         rawA = {type: "type_a"},
    //         rawB = {type: "type_b"},
    //         rawC = {type: "type_c"};

    //         subDescriptorB.parent = parentDescriptor;
    //         subDescriptorA.parent = parentDescriptor;


    //     service._registerRawDataTypeMappings([mappingA, mappingB]);
    //     expect(service._descriptorForParentAndRawData(parentDescriptor, rawA)).toBe(subDescriptorA);
    //     expect(service._descriptorForParentAndRawData(parentDescriptor, rawB)).toBe(subDescriptorB);
    //     expect(service._descriptorForParentAndRawData(parentDescriptor, rawC)).toBe(parentDescriptor);

    // });


    it("traverses inheritance chain with type mappings", function () {
        var service = new RawDataService(),
            root = new ObjectDescriptor(),
            parentA = new ObjectDescriptor(),
            parentB = new ObjectDescriptor(),
            childA = new ObjectDescriptor(),
            childB = new ObjectDescriptor(),
            grandChild = new ObjectDescriptor(),
            mappingA = RawDataTypeMapping.withTypeAndExpression(parentA, "type == 'type_a'"),
            mappingB = RawDataTypeMapping.withTypeAndExpression(parentB, "type == 'type_b'"),
            childMappingA = RawDataTypeMapping.withTypeAndExpression(childA, "name.indexOf('A CHILD') != -1"),
            childMappingB = RawDataTypeMapping.withTypeAndExpression(childB, "name.defined() && name.indexOf('B CHILD') != -1"),
            grandChildMapping = RawDataTypeMapping.withTypeAndExpression(grandChild, "generation == 3"),
            allMappings = [mappingA, mappingB, childMappingA, childMappingB, grandChildMapping],
            rawA = {
                type: "type_a", //mappingA
                name: "A PARENT",
                generation: 1
            },
            rawChildA = {
                type: "type_a", //mappingA
                name: "A CHILD", //childMappingA
                generation: 2
            },
            rawChildB = {
                type: "type_b", //mappingB
                name: "B CHILD", //childMappingB
                generation: 2
            },
            rawGrandChild = {
                type: "type_b", //mappingB
                name: "B CHILD 2", //childMappingB
                generation: 3 //grandChildMapping
            };;

            root._name = "root";
            parentA._name = "parentA";
            childA._name = "childA";
            parentA.parent = root;
            childA.parent = parentA;

            parentB._name = "parentB";
            childB._name = "childB";
            grandChild._name = "grandChild";
            parentB.parent = root;
            childB.parent = parentB;
            grandChild.parent = childB;



        service._registerRawDataTypeMappings(allMappings);
        expect(service._descriptorForParentAndRawData(root, rawA)).toBe(parentA);
        expect(service._descriptorForParentAndRawData(root, rawChildA)).toBe(childA);
        expect(service._descriptorForParentAndRawData(root, rawChildB)).toBe(childB);
        expect(service._descriptorForParentAndRawData(root, rawGrandChild)).toBe(grandChild);
    });


    it("has a fetchData() method", function () {
        expect(new RawDataService().fetchData).toEqual(jasmine.any(Function));
    });

    xit("has a fetchData() method that uses the passed in stream when one is specified", function () {
    });

    xit("has a fetchData() method that creates and return a new stream when none is passed in", function () {
    });

    xit("has a fetchData() method that sets its stream's selector", function () {
    });

    xit("has a fetchData() method that calls the service's fetchRawData() when appropriate", function () {
    });

    xit("has a fetchData() xmethod that calls a child service's fetchRawData() when appropraite", function () {
    });

    it("has a fetchRawData() method", function () {
        expect(new RawDataService().fetchRawData).toEqual(jasmine.any(Function));
    });

    it("has a fetchRawData() method that fetches empty data by default", function (done) {
        // Call fetchRawData() and verify the resulting stream's initial data.
        var stream = new DataStream();
        new RawDataService().fetchRawData(stream);
        expect(stream.data).toEqual([]);
        // Make sure the stream's promise is fulfilled with the same data.
        stream.then(function (data) {
            expect(data).toBe(stream.data);
            expect(data).toEqual([]);
            done();
        });
    });

    it("has a addRawData() method", function () {
        expect(new RawDataService().addRawData).toEqual(jasmine.any(Function));
    });

    xit("has a addRawData() method that maps the data it receives", function () {
    });

    xit("has a addRawData() method that calls the specified stream's addData() with the mapped data", function () {
    });

    xit("has a addRawData() method that needs to be further tested", function () {});

    it("has a mapFromRawData() method", function () {
        expect(new RawDataService().mapFromRawData).toEqual(jasmine.any(Function));
    });

    xit("has a mapFromRawData() method that needs to be further tested", function () {});

    it("has a rawDataDone() method", function () {
        expect(new RawDataService().rawDataDone).toEqual(jasmine.any(Function));
    });

    xit("has a rawDataDone() method that calls the specified stream's dataDone()", function () {
    });

    xit("has a registerService() method that needs to be further tested", function () {});

    xit("has a mainService class variable that needs to be further tested", function () {});

});
