const ExpressionIterator = require("mod/core/expression-iterator").ExpressionIterator;

describe("An ExpressionIterator", function() {

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
    });

    it("can iterate through a hierarchy", function () {
        let iterator = new ExpressionIterator(rawData, "child"),
            next;
        
        next = iterator.next();
        expect(next).toBeDefined();
        expect(next.value).toBeDefined();
        expect(next.value.name).toBe("John Doe");

        next = iterator.next();
        expect(next).toBeDefined();
        expect(next.value).toBeDefined();
        expect(next.value.name).toBe("Jane Doe");

        next = iterator.next();
        expect(next).toBeDefined();
        expect(next.value).toBeDefined();
        expect(next.value.name).toBe("Jean Doe");

        next = iterator.next();
        expect(next).toBeDefined();
        expect(next.value).toBeDefined();
        expect(next.value.name).toBe("Joan Doe");


        //FIXME This should return done = true the first time
        next = iterator.next();
        expect(next.done).toBe(false);
        next = iterator.next();
        expect(next.done).toBe(true);
        
    });

    it("can increment a value", function () {
        let iterator = new ExpressionIterator(5, "this + 1"),
            next;
        
        next = iterator.next();
        expect(next.value).toBe(5);

        next = iterator.next();
        expect(next.value).toBe(6);

        next = iterator.next();
        expect(next.value).toBe(7);

        next = iterator.next();
        expect(next.value).toBe(8);

        next = iterator.next();
        expect(next.value).toBe(9);
        
    });

    // it("can deserializeSelf", function () {
    //     //TODO
    // });
});
