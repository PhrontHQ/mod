/**
 * Shared semantics of the `traverse{}` block.
 *
 *     start.traverse{step}
 *     start.traverse(maxDepth){step}
 *     start.traverse(minDepth, maxDepth){step}
 *
 * Used by the evaluator (compile-evaluator.js), the observer
 * (traverse-observer.js) and external compilers such as pgstringify, so that
 * all of them agree on what a traversal produces:
 *
 * - Depth 0 is the start node, depth 1 its direct parent / children, etc.
 * - Defaults: minDepth 1 (the start node is excluded), maxDepth unbounded.
 *   `traverse(0, n){...}` includes the start node.
 * - Nodes are produced depth-first, pre-order. Siblings keep the order of the
 *   collection returned by the step.
 * - The step is evaluated with each node as `this`. `^` inside the step
 *   reaches the scope enclosing the traversal, whatever the depth.
 * - Step values: null or undefined ends the branch, an Array or a collection
 *   (anything with toArray()) yields each of its elements, any other value is
 *   the single next node. null / undefined elements are skipped.
 * - Cycles are cut per path: a node already present on its own ancestor path
 *   is neither produced nor followed. This matches PostgreSQL's
 *   `CYCLE ... SET ... USING ...` clause, so in-memory and SQL results agree.
 *   In a DAG, a node reachable through two paths is produced once per path.
 */

var EMPTY = [];
exports.EMPTY = EMPTY;

exports.DEFAULT_MIN_DEPTH = 1;
exports.DEFAULT_MAX_DEPTH = Infinity;

/**
 * Normalizes the optional `(…)` arguments of a traverse block.
 *
 * @param {number} depthArgCount 0, 1 (maxDepth) or 2 (minDepth, maxDepth)
 * @returns {{min: number, max: number}|null} null when an argument that was
 *   given is not a non-negative integer (e.g. a $parameter not set yet), in
 *   which case the traversal produces undefined rather than an unbounded walk.
 */
exports.depthRange = depthRange;
function depthRange(depthArgCount, first, second) {
    var min = exports.DEFAULT_MIN_DEPTH,
        max = exports.DEFAULT_MAX_DEPTH;
    if (depthArgCount === 1) {
        max = toDepth(first);
    } else if (depthArgCount >= 2) {
        min = toDepth(first);
        max = toDepth(second);
    }
    if (min === null || max === null) {
        return null;
    }
    return {min: min, max: max};
}

function toDepth(value) {
    if (typeof value === "string" && value !== "") {
        value = +value;
    }
    if (value === Infinity || (typeof value === "number" && value >= 0 && value % 1 === 0)) {
        return value;
    }
    return null;
}

exports.isCollection = isCollection;
function isCollection(value) {
    return value != null && (
        Array.isArray(value) ||
        (typeof value === "object" && typeof value.toArray === "function")
    );
}

/**
 * The next nodes produced by a step value, as an array.
 */
exports.nextNodes = nextNodes;
function nextNodes(value) {
    if (value == null) {
        return EMPTY;
    } else if (Array.isArray(value)) {
        return value;
    } else if (isCollection(value)) {
        return value.toArray();
    } else {
        return [value];
    }
}

/**
 * Whether node is on the ancestor path ending at entry (inclusive).
 * Entries are linked with `up` and carry the visited `node`.
 */
exports.isOnPath = isOnPath;
function isOnPath(entry, node) {
    for (; entry; entry = entry.up) {
        if (entry.node === node) {
            return true;
        }
    }
    return false;
}

/**
 * Walks a traversal, calling visit(node, depth) for every produced node, in
 * order. Returning false from visit stops the walk (used for early exits in
 * some{}, every{} and has()). Uses an explicit stack, so deep hierarchies can't
 * overflow the call stack.
 *
 * @returns {boolean} false if the walk was stopped by visit, true otherwise
 */
exports.walk = walk;
function walk(start, evaluateStep, scope, minDepth, maxDepth, visit) {
    var stack = [{node: start, depth: 0, up: null}],
        entry, nodes, node, i;
    while (stack.length) {
        entry = stack.pop();
        if (entry.depth >= minDepth && visit(entry.node, entry.depth) === false) {
            return false;
        }
        if (entry.depth >= maxDepth) {
            continue;
        }
        nodes = nextNodes(evaluateStep(scope.nest(entry.node)));
        // pushed in reverse so they are popped in collection order (pre-order)
        for (i = nodes.length - 1; i >= 0; i--) {
            node = nodes[i];
            if (node != null && !isOnPath(entry, node)) {
                stack.push({node: node, depth: entry.depth + 1, up: entry});
            }
        }
    }
    return true;
}

/**
 * Builds a function (scope, visit) -> boolean that evaluates the start and
 * depth arguments in scope and walks the traversal. It returns false, without
 * visiting anything, when the start is null/undefined or a depth argument is
 * invalid: the traversal's value is then undefined.
 */
exports.makeTraversalEvaluator = makeTraversalEvaluator;
function makeTraversalEvaluator(evaluateStart, evaluateStep, depthArgCount, evaluateFirstDepth, evaluateSecondDepth) {
    return function evaluateTraversal(scope, visit) {
        var start = evaluateStart(scope),
            range;
        if (start == null) {
            return false;
        }
        range = depthRange(
            depthArgCount,
            depthArgCount > 0 ? evaluateFirstDepth(scope) : undefined,
            depthArgCount > 1 ? evaluateSecondDepth(scope) : undefined
        );
        if (!range) {
            return false;
        }
        walk(start, evaluateStep, scope, range.min, range.max, visit);
        return true;
    };
}
