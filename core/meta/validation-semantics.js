const Montage = require("../core").Montage;
// TODO kriskowal: massage selectors and FRB together
const Semantics = Montage;
// const Semantics = (require)("core/criteria/semantics").Semantics;
const deprecate = require("../deprecate");

/**
 * @class PropertyValidationSemantics
 * @extends Semantics
 */
exports.PropertyValidationSemantics = class PropertyValidationSemantics extends Semantics {
    static {
        Montage.defineProperties(this.prototype, {
            operators: {
                ...Semantics.operators,
                isBound: (a) => !a,
            },
            evaluators: {
                ...Semantics.evaluators,
                isBound: (collection, modify) => {
                    return (value, parameters) => {
                        value = this.count(collection(value, parameters));
                        return modify(value, parameters);
                    };
                },
            },
        });
    }

    /**
     * Component description attached to this validation rule.
     * @type {ObjectDescriptor}
     */
    get objectDescriptor() {
        return this._objectDescriptor;
    }

    /**
     * Create a new semantic evaluator with the object descriptor.
     * @param {ObjectDescriptor} objectDescriptor
     * @returns {this}
     */
    initWithObjectDescriptor(objectDescriptor) {
        this._objectDescriptor = objectDescriptor;
        return this;
    }

    /**
     * Compile the syntax tree into a function that can be used for evaluating
     * this criteria.
     * @param {object} syntax The parsed expression, a syntactic tree.
     * @returns {function}
     */
    compile(syntax, parents) {
        super.compile(syntax, parents);
    }

    /*****************************************************************
     * Deprecated Methods
     *****************************************************************/

    /**
     * @deprecated Use initWithObjectDescriptor instead.
     * @param {ObjectDescriptor} blueprint
     * @returns {this}
     */
    initWithBlueprint = deprecate.deprecateMethod(
        void 0,
        (blueprint) => {
            return this.initWithObjectDescriptor(blueprint);
        },
        "initWithBlueprint",
        "initWithObjectDescriptor"
    );

    /**
     * @deprecated Use objectDescriptor instead.
     * @type {ObjectDescriptor}
     */
    get blueprint() {
        return deprecate.deprecateMethod(void 0, () => this._blueprint, "blueprint", "objectDescriptor")();
    }
};
