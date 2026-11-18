/**
 * Incremental observer for the `traverse{}` block. See traverse.js for the
 * semantics shared with the evaluator.
 *
 * The output is a single array that is only ever spliced (never replaced while
 * the start node and depth range stay the same), so map{}, filter{}, has(),
 * last(), etc. stacked on top of it stay incremental.
 *
 * Internally every traversed node gets a record:
 *
 *     {node, up, depth, included, children, span, cancelStep, ...}
 *
 * `children` is aligned 1:1 with the collection returned by the step (cut or
 * null entries get a "skipped" placeholder with a span of 0), so range changes
 * on that collection map directly onto it. `span` is the number of output
 * entries in the record's subtree, itself included. A record's position in the
 * output is computed from the spans of its preceding siblings and ancestors.
 *
 * Lazily loaded relationships work without anything special: a step that is
 * undefined because it hasn't been fetched yet stays observed, and when the
 * data arrives, the property change builds and splices in that subtree. No
 * step observer is created at maxDepth, so nothing beyond it is fetched.
 */

var Observers = require("./observers"),
    Traverse = require("./traverse");

exports.makeTraverseBlockObserver = makeTraverseBlockObserver;
function makeTraverseBlockObserver(observeStart, observeStep, observeFirstDepth, observeSecondDepth) {
    var observeDepthRange = makeDepthRangeObserver(arguments.length - 2, observeFirstDepth, observeSecondDepth);

    function observeTraverse(emit, scope) {
        return observeDepthRange(function replaceDepthRange(range) {
            if (!range) {
                return emit();
            }
            return observeStart(function replaceStart(start) {
                if (start == null) {
                    return emit();
                }
                return observeTraversal(start, observeStep, range.min, range.max, emit, scope);
            }, scope);
        }, scope);
    }

    // Mirrors the replacing observer onto a stable output array, like
    // map{} and filter{} do.
    return Observers.makeToArrayObserver(observeTraverse);
}

function makeDepthRangeObserver(depthArgCount, observeFirst, observeSecond) {
    if (depthArgCount <= 0) {
        var defaultRange = Traverse.depthRange(0);
        return function observeDefaultDepthRange(emit) {
            return emit(defaultRange);
        };
    } else if (depthArgCount === 1) {
        return function observeMaxDepth(emit, scope) {
            return observeFirst(function replaceMaxDepth(max) {
                return emit(Traverse.depthRange(1, max));
            }, scope);
        };
    } else {
        return function observeMinMaxDepth(emit, scope) {
            return observeFirst(function replaceMinDepth(min) {
                return observeSecond(function replaceMaxDepth(max) {
                    return emit(Traverse.depthRange(2, min, max));
                }, scope);
            }, scope);
        };
    }
}

exports.observeTraversal = observeTraversal;
function observeTraversal(start, observeStep, minDepth, maxDepth, emit, scope) {
    var output = [],
        root = makeRecord(start, null, 0),
        nodes, cancel;

    function makeRecord(node, up, depth) {
        return {
            node: node,
            up: up,
            depth: depth,
            included: depth >= minDepth,
            children: [],
            span: 0,
            // while a record's subtree is first built, its nodes are collected
            // here instead of being spliced one by one into the output
            collecting: null,
            cancelStep: null,
            detached: false,
            skipped: false
        };
    }

    function makeChildRecord(parent, node) {
        var record = makeRecord(node, parent, parent.depth + 1);
        if (node == null || Traverse.isOnPath(parent, node)) {
            record.skipped = true;
        }
        return record;
    }

    // Starts observing a record's step and returns the nodes of its subtree,
    // in pre-order.
    function attach(record) {
        var collected;
        record.collecting = record.included ? [record.node] : [];
        record.span = record.collecting.length;
        if (record.depth < maxDepth) {
            record.cancelStep = observeStep(function replaceStepValue(value) {
                if (record.detached) {
                    return;
                }
                return observeNextNodes(record, value);
            }, scope.nest(record.node));
        }
        collected = record.collecting;
        record.collecting = null;
        record.span = collected.length;
        return collected;
    }

    function observeNextNodes(record, value) {
        var cancelRangeChange;
        if (Traverse.isCollection(value) && typeof value.addRangeChangeListener === "function") {
            cancelRangeChange = Observers.observeRangeChange(value, function nextNodesRangeChange(plus, minus, index) {
                if (!record.detached) {
                    replaceChildren(record, index, minus.length, plus);
                }
            }, scope);
        } else {
            // single node, or a collection that can't dispatch range changes
            replaceChildren(record, 0, 0, Traverse.nextNodes(value));
        }
        return function cancelNextNodes() {
            if (cancelRangeChange) {
                cancelRangeChange();
            }
            if (record.detached) {
                detachEach(record.children);
                record.children = [];
            } else {
                replaceChildren(record, 0, record.children.length, Traverse.EMPTY);
            }
        };
    }

    function replaceChildren(record, index, minusLength, plusNodes) {
        var at, removed, removedSpan = 0, added = [], nodes = [], child, subtree, i, j;
        if (!minusLength && !plusNodes.length) {
            return;
        }
        at = childOffset(record, index);
        removed = record.children.slice(index, index + minusLength);
        for (i = 0; i < removed.length; i++) {
            removedSpan += removed[i].span;
            detach(removed[i]);
        }
        for (i = 0; i < plusNodes.length; i++) {
            child = makeChildRecord(record, plusNodes[i]);
            added.push(child);
            if (!child.skipped) {
                subtree = attach(child);
                for (j = 0; j < subtree.length; j++) {
                    nodes.push(subtree[j]);
                }
            }
        }
        swapWithoutDispatch(record.children, index, minusLength, added);
        if (record.collecting) {
            swapWithoutDispatch(record.collecting, at, removedSpan, nodes);
            record.span += nodes.length - removedSpan;
        } else {
            // spans first, so listeners reacting synchronously to the output
            // change see a consistent structure
            adjustSpan(record, nodes.length - removedSpan);
            if (removedSpan || nodes.length) {
                output.swap(at, removedSpan, nodes);
            }
        }
    }

    function adjustSpan(record, delta) {
        if (!delta) {
            return;
        }
        for (; record; record = record.up) {
            record.span += delta;
        }
    }

    // Output position (absolute, or relative to the collected nodes while the
    // record is being built) where the subtree of record.children[index] starts.
    function childOffset(record, index) {
        var offset = record.collecting ? 0 : subtreeOffset(record),
            children = record.children,
            i;
        if (record.included) {
            offset++;
        }
        for (i = 0; i < index; i++) {
            offset += children[i].span;
        }
        return offset;
    }

    // Absolute output position where record's subtree starts.
    function subtreeOffset(record) {
        var offset = 0, up, siblings, i;
        while ((up = record.up)) {
            if (up.included) {
                offset++;
            }
            siblings = up.children;
            for (i = 0; siblings[i] !== record; i++) {
                offset += siblings[i].span;
            }
            record = up;
        }
        return offset;
    }

    // Stops observing a record's subtree. Doesn't touch the output: the caller
    // removes the subtree's span in one splice.
    function detach(record) {
        var cancelStep = record.cancelStep;
        record.detached = true;
        record.cancelStep = null;
        if (cancelStep) {
            cancelStep();
        }
        detachEach(record.children);
        record.children = [];
    }

    function detachEach(records) {
        for (var i = 0; i < records.length; i++) {
            detach(records[i]);
        }
    }

    nodes = attach(root);
    swapWithoutDispatch(output, 0, 0, nodes); // no listeners yet
    cancel = emit(output);

    return function cancelTraversalObserver() {
        if (cancel) {
            cancel();
        }
        detach(root);
    };
}

// Splice for internal bookkeeping arrays, which have no listeners.
function swapWithoutDispatch(array, start, minusLength, plus) {
    var tail = array.slice(start + minusLength), i;
    array.length = start;
    for (i = 0; i < plus.length; i++) {
        array.push(plus[i]);
    }
    for (i = 0; i < tail.length; i++) {
        array.push(tail[i]);
    }
}
