
// The traverse{} block: transitive / recursive navigation, such as all the
// ancestors or all the descendants of a node.
//
//     start.traverse{step}
//     start.traverse(maxDepth){step}
//     start.traverse(minDepth, maxDepth){step}
//
// Parsing and stringifying are covered by the shared cases in language.js, and
// simple evaluations by the shared cases in evaluate.js, which
// evaluate-with-observe-spec.js also uses to check the observer's initial
// value. This file covers what those tables can't express: cyclic graphs, live
// updates, changing depth arguments, lazily fetched relationships and the
// evaluator's early exits.

var Bindings = require("../bindings");
var evaluate = require("../evaluate");
var Observers = require("../observers");
var TraverseObserver = require("../traverse-observer");
var Scope = require("../scope");

function names(nodes) {
    return nodes.map(function (node) {
        return node.name;
    });
}

// root
// ├── a
// │   └── a1
// └── b
function makeTree() {
    var a1 = {name: "a1", children: []},
        a = {name: "a", children: [a1]},
        b = {name: "b", children: []},
        root = {name: "root", children: [a, b]};
    return {root: root, a: a, a1: a1, b: b};
}

// a1 -> a -> root
function makeChain() {
    var root = {name: "root", parent: null},
        a = {name: "a", parent: root},
        a1 = {name: "a1", parent: a};
    return {root: root, a: a, a1: a1};
}

// A chain whose parent reads are recorded, to check how far a walk goes.
function makeRecordingChain(nodeNames) {
    var reads = [],
        nodes = nodeNames.map(function (name) {
            return {name: name};
        });
    nodes.forEach(function (node, index) {
        Object.defineProperty(node, "parent", {
            get: function () {
                reads.push(node.name);
                return index + 1 < nodes.length ? nodes[index + 1] : null;
            },
            enumerable: true
        });
    });
    return {nodes: nodes, reads: reads};
}

// Stands in for a data object whose relationships are fetched on demand: the
// data layer learns that a relationship is needed when it gets observed.
function LazyNode(name, requests) {
    this.name = name;
    this.requests = requests;
}

LazyNode.prototype.observeProperty = function (key, emit, scope) {
    if (key === "children") {
        this.requests.push(this.name + "." + key);
    }
    return Observers.observeProperty(this, key, emit, scope);
};

describe("traverse", function () {

    describe("evaluate", function () {

        var tree, chain;
        beforeEach(function () {
            tree = makeTree();
            chain = makeChain();
        });

        it("should produce the ancestors of a node, nearest first", function () {
            var ancestors = evaluate("traverse{parent}", chain.a1);
            expect(names(ancestors)).toEqual(["a", "root"]);
            expect(ancestors[0]).toBe(chain.a);
            expect(ancestors[1]).toBe(chain.root);
        });

        it("should produce the descendants of a node in depth-first pre-order", function () {
            expect(names(evaluate("traverse{children}", tree.root))).toEqual(["a", "a1", "b"]);
        });

        it("should exclude the start node unless the minimum depth is 0", function () {
            expect(names(evaluate("traverse{children}", tree.root))).toEqual(["a", "a1", "b"]);
            expect(names(evaluate("traverse(0, 1){children}", tree.root))).toEqual(["root", "a", "b"]);
        });

        it("should stop at the maximum depth", function () {
            expect(names(evaluate("traverse(1){children}", tree.root))).toEqual(["a", "b"]);
            expect(names(evaluate("traverse(0){children}", tree.root))).toEqual([]);
        });

        it("should only produce nodes between the minimum and maximum depths", function () {
            expect(names(evaluate("traverse(2, 2){children}", tree.root))).toEqual(["a1"]);
            expect(names(evaluate("traverse(2, 1){children}", tree.root))).toEqual([]);
        });

        it("should evaluate depth arguments in the scope enclosing the traversal", function () {
            // if depth were read on the start node, the traversal would be empty
            tree.root.depth = 0;
            expect(names(evaluate("root.traverse(depth){children}", {
                root: tree.root,
                depth: 1
            }))).toEqual(["a", "b"]);
            expect(names(evaluate("traverse($depth){children}", tree.root, {depth: 1}))).toEqual(["a", "b"]);
        });

        it("should accept numeric strings as depth arguments", function () {
            expect(names(evaluate("traverse($depth){children}", tree.root, {depth: "1"}))).toEqual(["a", "b"]);
        });

        it("should be undefined when a depth argument is not a non-negative integer", function () {
            [undefined, null, -1, 1.5, NaN, "deep"].forEach(function (depth) {
                expect(evaluate("traverse($depth){children}", tree.root, {depth: depth})).toBe(undefined);
            });
        });

        it("should be resilient to beginning of expression containing 'traverse' being undefined", function () {
            expect(evaluate("a.node.traverse{parent}", {a: {}})).toBe(undefined);
        });

        it("should follow a single node or each node of a collection, whichever the step produces", function () {
            var y = {name: "y", next: null},
                x = {name: "x", next: y},
                z = {name: "z"},
                start = {name: "start", next: [x, z]};
            expect(names(evaluate("traverse{next}", start))).toEqual(["x", "y", "z"]);
        });

        it("should end a branch on null or undefined, and skip null elements", function () {
            var a = {name: "a", children: null},
                b = {name: "b"},
                root = {name: "root", children: [null, a, undefined, b]};
            expect(names(evaluate("traverse{children}", root))).toEqual(["a", "b"]);
        });

        it("should cut cycles on each path", function () {
            var a = {name: "a"},
                b = {name: "b"},
                c = {name: "c"};
            a.children = [b];
            b.children = [a, c];
            c.children = [b];
            expect(names(evaluate("traverse{children}", a))).toEqual(["b", "c"]);
            expect(names(evaluate("traverse(0, 10){children}", a))).toEqual(["a", "b", "c"]);

            var loop = {name: "loop"};
            loop.parent = loop;
            expect(evaluate("traverse{parent}", loop)).toEqual([]);
        });

        it("should produce a node once per path reaching it, like SQL's CYCLE clause", function () {
            var shared = {name: "shared", children: []},
                x = {name: "x", children: [shared]},
                y = {name: "y", children: [shared]},
                root = {name: "root", children: [x, y]};
            expect(names(evaluate("traverse{children}", root))).toEqual(["x", "shared", "y", "shared"]);
        });

        it("should evaluate ^ in the scope enclosing the traversal, at any depth", function () {
            // nodes have their own expand property, which ^expand must not reach
            tree.root.expand = tree.a.expand = tree.a1.expand = tree.b.expand = false;
            expect(names(evaluate("tree.traverse{^expand ? children : null}", {
                expand: true,
                tree: tree.root
            }))).toEqual(["a", "a1", "b"]);
        });

        it("should prune subtrees with a filter in the step, and filter results with a filter after it", function () {
            tree.a.active = true;
            tree.a1.active = true;
            tree.b.active = false;
            tree.b.children = [{name: "b1", active: true, children: []}];
            expect(names(evaluate("traverse{children.filter{active}}", tree.root))).toEqual(["a", "a1"]);
            expect(names(evaluate("traverse{children}.filter{active}", tree.root))).toEqual(["a", "a1", "b1"]);
        });

        it("should compose with existing operators", function () {
            expect(evaluate("traverse{parent}.last().name", chain.a1)).toBe("root");
            expect(evaluate("traverse{parent}.length", chain.a1)).toBe(2);
            expect(evaluate("traverse{parent}.map{name}.reversed().join(' / ')", chain.a1)).toBe("root / a");
            expect(evaluate("traverse{parent}.has($ancestor)", chain.a1, {ancestor: chain.root})).toBe(true);
            expect(evaluate("traverse{parent}.has($ancestor)", chain.a, {ancestor: chain.a1})).toBe(false);
            expect(evaluate("traverse{parent}.some{name == 'root'}", chain.a1)).toBe(true);
            expect(evaluate("traverse{parent}.every{name != 'root'}", chain.a1)).toBe(false);
        });

        it("should stop walking as soon as some{}, every{} or has() is decided", function () {
            var recording;

            // control: map{} walks up to the root
            recording = makeRecordingChain(["a1", "a", "root", "top"]);
            expect(evaluate("traverse{parent}.map{name}", recording.nodes[0])).toEqual(["a", "root", "top"]);
            expect(recording.reads).toEqual(["a1", "a", "root", "top"]);

            recording = makeRecordingChain(["a1", "a", "root", "top"]);
            expect(evaluate("traverse{parent}.some{name == 'a'}", recording.nodes[0])).toBe(true);
            expect(recording.reads).toEqual(["a1"]);

            recording = makeRecordingChain(["a1", "a", "root", "top"]);
            expect(evaluate("traverse{parent}.every{name != 'a'}", recording.nodes[0])).toBe(false);
            expect(recording.reads).toEqual(["a1"]);

            recording = makeRecordingChain(["a1", "a", "root", "top"]);
            expect(evaluate("traverse{parent}.has($ancestor)", recording.nodes[0], {ancestor: recording.nodes[2]})).toBe(true);
            expect(recording.reads).toEqual(["a1", "a"]);
        });

        it("should make some{}, every{} and has() undefined when the traversal is", function () {
            expect(evaluate("node.traverse{parent}.some{name == 'a'}", {})).toBe(undefined);
            expect(evaluate("node.traverse{parent}.every{name == 'a'}", {})).toBe(undefined);
            expect(evaluate("node.traverse{parent}.has($ancestor)", {}, {ancestor: chain.a})).toBe(undefined);
        });

    });

    describe("observe", function () {

        var tree, chain;
        beforeEach(function () {
            tree = makeTree();
            chain = makeChain();
        });

        it("should update ancestors when a parent changes", function () {
            var object = Bindings.defineBindings({node: chain.a1}, {
                ancestors: {"<-": "node.traverse{parent}.map{name}"}
            });
            expect(object.ancestors).toEqual(["a", "root"]);

            var top = {name: "top", parent: null};
            chain.root.parent = top;
            expect(object.ancestors).toEqual(["a", "root", "top"]);

            chain.a.parent = top;
            expect(object.ancestors).toEqual(["a", "top"]);

            chain.a1.parent = null;
            expect(object.ancestors).toEqual([]);

            object.node = chain.a;
            expect(object.ancestors).toEqual(["top"]);
        });

        it("should complete ancestors when a lazily fetched parent arrives", function () {
            // parent is undefined until fetched, then an object, or null at the root
            var node = {name: "node"},
                fetched = {name: "fetched"},
                object = Bindings.defineBindings({node: node}, {
                    ancestors: {"<-": "node.traverse{parent}.map{name}"}
                });
            expect(object.ancestors).toEqual([]);

            node.parent = fetched;
            expect(object.ancestors).toEqual(["fetched"]);

            fetched.parent = chain.a;
            expect(object.ancestors).toEqual(["fetched", "a", "root"]);
        });

        it("should update descendants when children are added, removed or replaced", function () {
            var object = Bindings.defineBindings({root: tree.root}, {
                descendants: {"<-": "root.traverse{children}.map{name}"}
            });
            expect(object.descendants).toEqual(["a", "a1", "b"]);

            tree.b.children.push({name: "b1", children: []});
            expect(object.descendants).toEqual(["a", "a1", "b", "b1"]);

            tree.a.children.unshift({name: "a0", children: [{name: "a00", children: []}]});
            expect(object.descendants).toEqual(["a", "a0", "a00", "a1", "b", "b1"]);

            // children not fetched yet
            tree.a1.children.push({name: "a10"});
            expect(object.descendants).toEqual(["a", "a0", "a00", "a1", "a10", "b", "b1"]);

            tree.root.children.splice(0, 1);
            expect(object.descendants).toEqual(["b", "b1"]);

            tree.b.children = [{name: "b2", children: []}];
            expect(object.descendants).toEqual(["b", "b2"]);

            tree.root.children.push(tree.a);
            expect(object.descendants).toEqual(["b", "b2", "a", "a0", "a00", "a1", "a10"]);

            tree.root.children = [];
            expect(object.descendants).toEqual([]);
        });

        it("should keep the same output array", function () {
            var object = Bindings.defineBindings({root: tree.root, depth: 1}, {
                nodes: {"<-": "root.traverse(depth){children}"}
            });
            var nodes = object.nodes;
            expect(names(nodes)).toEqual(["a", "b"]);
            expect(nodes[0]).toBe(tree.a);

            tree.root.children.push({name: "c", children: []});
            object.depth = 2;
            object.root = tree.a;
            expect(names(object.nodes)).toEqual(["a1"]);
            expect(object.nodes).toBe(nodes);
        });

        it("should rebuild when a depth argument changes", function () {
            var object = Bindings.defineBindings({root: tree.root, depth: 1}, {
                output: {"<-": "root.traverse(depth){children}.map{name}"}
            });
            expect(object.output).toEqual(["a", "b"]);

            object.depth = 2;
            expect(object.output).toEqual(["a", "a1", "b"]);

            // not set yet: empty rather than unbounded
            object.depth = undefined;
            expect(object.output).toEqual([]);

            object.depth = 1;
            expect(object.output).toEqual(["a", "b"]);
        });

        it("should update when a value reached with ^ changes", function () {
            var object = Bindings.defineBindings({expand: true, tree: tree.root}, {
                output: {"<-": "tree.traverse{^expand ? children : null}.map{name}"}
            });
            expect(object.output).toEqual(["a", "a1", "b"]);

            object.expand = false;
            expect(object.output).toEqual([]);

            object.expand = true;
            expect(object.output).toEqual(["a", "a1", "b"]);
        });

        it("should keep expressions built on a traversal up to date", function () {
            var object = Bindings.defineBindings({node: chain.a1, ancestor: chain.root}, {
                rootName: {"<-": "node.traverse{parent}.last().name"},
                breadcrumb: {"<-": "node.traverse{parent}.map{name}.reversed().join(' / ')"},
                isUnderAncestor: {"<-": "node.traverse{parent}.has(ancestor)"},
                level: {"<-": "node.traverse{parent}.length"}
            });
            expect(object.rootName).toBe("root");
            expect(object.breadcrumb).toBe("root / a");
            expect(object.isUnderAncestor).toBe(true);
            expect(object.level).toBe(2);

            chain.root.name = "ROOT";
            expect(object.rootName).toBe("ROOT");
            expect(object.breadcrumb).toBe("ROOT / a");

            chain.a.parent = null;
            expect(object.rootName).toBe("a");
            expect(object.breadcrumb).toBe("a");
            expect(object.isUnderAncestor).toBe(false);
            expect(object.level).toBe(1);
        });

        it("should only observe steps within the maximum depth, so nothing beyond it is fetched", function () {
            var requests = [],
                root = new LazyNode("root", requests),
                object = Bindings.defineBindings({root: root, depth: 1}, {
                    nodes: {"<-": "root.traverse(depth){children}"}
                });
            expect(requests).toEqual(["root.children"]);
            expect(object.nodes).toEqual([]);

            // the data layer delivers root's children; they are at the
            // maximum depth, so their own children are not requested
            root.children = [new LazyNode("a", requests), new LazyNode("b", requests)];
            expect(names(object.nodes)).toEqual(["a", "b"]);
            expect(requests).toEqual(["root.children"]);

            object.depth = 2;
            expect(requests).toEqual(["root.children", "root.children", "a.children", "b.children"]);
        });

        it("should be empty while the start is undefined, like map{}", function () {
            var object = Bindings.defineBindings({}, {
                output: {"<-": "node.traverse{parent}.map{name}"}
            });
            expect(object.output).toEqual([]);

            object.node = chain.a1;
            expect(object.output).toEqual(["a", "root"]);

            object.node = null;
            expect(object.output).toEqual([]);
        });

        it("should stop updating once cancelled", function () {
            var object = Bindings.defineBindings({root: tree.root}, {
                output: {"<-": "root.traverse{children}.map{name}"}
            });
            Bindings.cancelBindings(object);

            tree.b.children.push({name: "b1", children: []});
            tree.root.children.splice(0, 1);
            expect(object.output).toEqual(["a", "a1", "b"]);
        });

        it("should check or uncheck every descendant through two-way every{} and some{} bindings", function () {
            tree.a.done = false;
            tree.a1.done = false;
            tree.b.done = true;
            var checklist = Bindings.defineBindings({root: tree.root}, {
                allDone: {"<->": "root.traverse{children}.every{done}"},
                noneDone: {"<->": "!root.traverse{children}.some{done}"}
            });
            expect(checklist.allDone).toBe(false);
            expect(checklist.noneDone).toBe(false);

            // reaches the grandchild a1 too, but not the start node
            checklist.allDone = true;
            expect([tree.a.done, tree.a1.done, tree.b.done]).toEqual([true, true, true]);
            expect(tree.root.done).toBe(undefined);
            expect(checklist.noneDone).toBe(false);

            // as with every{} on an array, setting false cancels rather than unchecks
            checklist.allDone = false;
            expect([tree.a.done, tree.a1.done, tree.b.done]).toEqual([true, true, true]);

            checklist.noneDone = true;
            expect([tree.a.done, tree.a1.done, tree.b.done]).toEqual([false, false, false]);
            expect(checklist.allDone).toBe(false);

            // the source side stays live: changes anywhere in the tree flow back
            tree.a1.done = true;
            expect(checklist.noneDone).toBe(false);
            tree.a.done = tree.b.done = true;
            expect(checklist.allDone).toBe(true);
        });

        it("should write to a property of a node it reaches through a two-way binding", function () {
            var object = Bindings.defineBindings({node: chain.a1}, {
                rootName: {"<->": "node.traverse{parent}.last().name"}
            });
            expect(object.rootName).toBe("root");

            object.rootName = "ROOT";
            expect(chain.root.name).toBe("ROOT");

            chain.root.name = "Root";
            expect(object.rootName).toBe("Root");

            // the hierarchy changes: a becomes the root, and the binding follows it
            chain.a.parent = null;
            expect(object.rootName).toBe("a");
            expect(chain.a.name).toBe("a");

            object.rootName = "A";
            expect(chain.a.name).toBe("A");
            expect(chain.root.name).toBe("Root");
        });

        it("should not accept the traversal itself as the target of a binding", function () {
            // Two-way bindings through a traversal work (see the two specs
            // above); what can't be bound is the traversal's own array, since
            // no single change to the graph would produce a given array.
            expect(function () {
                Bindings.defineBindings({root: tree.root}, {
                    nodes: {"<->": "root.traverse{children}"}
                });
            }).toThrow();
        });

    });

    describe("makeTraverseBlockObserver", function () {

        var observeChildren = Observers.makePropertyObserver(
            Observers.observeValue,
            Observers.makeLiteralObserver("children")
        );

        it("should dispatch incremental range changes", function () {
            var tree = makeTree(),
                changes = [];

            var cancel = TraverseObserver.makeTraverseBlockObserver(
                Observers.observeValue,
                observeChildren
            )(function (output) {
                function rangeChange(plus, minus, index) {
                    changes.push([index, names(minus), names(plus)]);
                }
                rangeChange(output, [], 0);
                output.addRangeChangeListener(rangeChange);
            }, new Scope(tree.root));

            tree.b.children.push({name: "b1", children: []});
            tree.a.children.unshift({name: "a0", children: [{name: "a00", children: []}]});
            tree.root.children.splice(0, 1);
            tree.b.children = [{name: "b2", children: []}];
            cancel();
            tree.root.children.push({name: "c", children: []});

            expect(changes).toEqual([
                [0, [], ["a", "a1", "b"]],
                [3, [], ["b1"]],
                [1, [], ["a0", "a00"]],
                [0, ["a", "a0", "a00", "a1"], []],
                [1, ["b1"], []],
                [1, [], ["b2"]]
            ]);
        });

        it("should agree with evaluate after random changes to a graph", function () {
            // Random graphs with cycles, shared nodes, single-valued, null and
            // undefined steps, mutated by property changes and range changes.
            // After each change, the output must equal a fresh evaluation, and
            // the range changes it dispatched must replay to the same array.
            var ranges = [[1, Infinity], [0, Infinity], [1, 2], [2, 3], [0, 0], [3, 1], [1, 1]],
                seed, random, nodes, holder, range, output, replayed, cancel, step,
                target, array, index, minusLength, plus, count, expected, i, frozen;

            function makeRandom(seed) {
                return function () {
                    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                    return seed / 0x7fffffff;
                };
            }
            function pick() {
                return nodes[Math.floor(random() * nodes.length)];
            }
            function randomStepValue() {
                var roll = random(), result, count;
                if (roll < 0.15) {
                    return undefined;
                } else if (roll < 0.25) {
                    return null;
                } else if (roll < 0.35) {
                    return pick();
                }
                result = [];
                for (count = Math.floor(random() * 4); count > 0; count--) {
                    result.push(random() < 0.1 ? null : pick());
                }
                return result;
            }

            for (seed = 1; seed <= 200; seed++) {
                random = makeRandom(seed);
                nodes = [];
                for (i = 2 + Math.floor(random() * 8); i > 0; i--) {
                    nodes.push({name: "n" + nodes.length});
                }
                nodes.forEach(function (node) {
                    node.children = randomStepValue();
                });
                range = ranges[seed % ranges.length];
                holder = {root: nodes[0], min: range[0], max: range[1]};

                cancel = TraverseObserver.makeTraverseBlockObserver(
                    Observers.makePropertyObserver(Observers.observeValue, Observers.makeLiteralObserver("root")),
                    observeChildren,
                    Observers.makeLiteralObserver(range[0]),
                    Observers.makeLiteralObserver(range[1])
                )(function (_output) {
                    output = _output;
                    replayed = _output.slice();
                    _output.addRangeChangeListener(function (plus, minus, index) {
                        replayed.splice.apply(replayed, [index, minus.length].concat(plus));
                    });
                }, new Scope(holder));

                for (step = 0; step < 40; step++) {
                    target = pick();
                    if (random() < 0.4 || !Array.isArray(target.children)) {
                        target.children = randomStepValue();
                    } else {
                        array = target.children;
                        index = Math.floor(random() * (array.length + 1));
                        minusLength = Math.min(Math.floor(random() * 3), array.length - index);
                        plus = [];
                        for (count = Math.floor(random() * 3); count > 0; count--) {
                            plus.push(random() < 0.1 ? null : pick());
                        }
                        array.swap(index, minusLength, plus);
                    }
                    expected = names(evaluate("root.traverse(min, max){children}", holder));
                    expect(names(output)).toEqual(expected);
                    expect(names(replayed)).toEqual(expected);
                }

                cancel();
                frozen = names(output);
                nodes.forEach(function (node) {
                    node.children = [];
                });
                expect(names(output)).toEqual(frozen);
            }
        });

    });

});
