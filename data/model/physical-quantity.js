var Montage = require("core/core").Montage;
    DataObject = require("data/model/data-object").DataObject,
    Unit = require("./unit").Unit;
    PhysicalDimension = require("./physical-dimension").PhysicalDimension;

/**
 * @class PhysicalQuantity
 * @extends DataObject
 * 
 * https://en.m.wikipedia.org/wiki/Physical_quantity
 * 
 * https://dba.stackexchange.com/questions/280538/best-way-to-designate-unit-of-weight-in-postgresql
 * https://www.postgresql.org/docs/17/ddl-generated-columns.html
 * https://www.google.com/search?q=postgresql+physical+quantity+units&client=safari&sca_esv=75315e11642a04a4&rls=en&ei=LDpPZ7CSB8Gt5NoPh83OoAI&start=10&sa=N&sstk=ATObxK68g-RBuj1HcYwzWnKVSbIDz_e-ce0-yCjykawUh8L91tGtsk0rXPHUIl7GbI-hMfM34p_GVrALz4OdxfBxNvfLFEAn0n31Xg&ved=2ahUKEwiw2I7LioyKAxXBFlkFHYemEyQQ8NMDegQIDBAW&biw=1920&bih=952&dpr=2
 * https://github.com/df7cb/postgresql-unit
 * 
 * https://www.npmjs.com/package/mathjs
 * https://github.com/josdejong/mathjs
 * https://mathjs.org/docs/datatypes/units.html
 * 
 * https://github.com/gentooboontoo/js-quantities
 * https://www.npmjs.com/package/js-quantities
 * 
 * https://github.com/haimkastner/unitsnet-js
 * https://www.npmjs.com/package/unitsnet-js
 * 
 * Older:
 * https://github.com/GhostWrench/pqm
 * https://www.npmjs.com/package/pqm
 * 
 * http://micah.cowan.name/blog/2015/09/04/a-units-of-measure-implementation-in-javascript/
 * 
 * https://www.npmjs.com/package/kotunil-js-lib
 * 
 * 
 * https://github.com/MikeMcl/bignumber.js?tab=readme-ov-file
 * https://www.npmjs.com/package/js-big-decimal
 * https://github.com/iriscouch/bigdecimal.js/blob/master/README.md
 * https://github.com/srknzl/bigdecimal.js (From README.md: ...This implementation is faster than popular big decimal libraries for most operations. See benchmarks results part below for comparison of each operation.)
 * https://elvisciotti.medium.com/java-bigdecimal-in-javascript-9498fd4f2efe
 * 
 */

/* Test */
// var meter = new Unit();
//     meter.name = "meter";

// var lengthDimension = new PhysicalDimension();
// lengthDimension.units = [meter];
//     meter.dimension = lengthDimension;


let PhysicalQuantity;
exports.PhysicalQuantity = PhysicalQuantity = class PhysicalQuantity extends Number {
    constructor(value, physicalDimension, unit) {
        super(value);

        if(physicalDimension) this.dimension = physicalDimension;
        if(unit) this.unit = unit;
        
        return this;
    }

    toString() {
        return `${super.toString()} ${this.unit.name}`;
    }

    valueOf() {
        let value = super.valueOf();
        // console.log("value:", value);
        // let result = new this.constructor(value, this.dimension, this.unit) ;
        return value;
    }
}


let Length;
exports.Length = Length = class Length extends PhysicalQuantity {
    constructor(value, unit) {
        super(value, lengthDimension, unit);
    }

}

// var nineMeters = new Length(9, meter);
// console.log("nineMeters: ", nineMeters);
// var twiceNineMeters = nineMeters * 2;
//Symbols???
// var twiceNineMeters = nineMeters.*(2);

// console.log("twiceNineMeters: ", twiceNineMeters);


// exports.PhysicalQuantity = DataObject.specialize(/** @lends PhysicalQuantity.prototype */ {
//     constructor: {
//         value: function Asset() {
//             this.super();
//             return this;
//         }
//     },
//     value: {
//         value: undefined
//     },
//     unit: {
//         value: undefined
//     },
//     dimension: {
//         value: undefined
//     }
// });



