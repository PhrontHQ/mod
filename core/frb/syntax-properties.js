/**
 * The names of the properties required to evaluate .expression
 *
 * The raw data that .expression is evaluated against may not
 * have all of the properties referenced in .expression before the
 * the MappingRule is used. This array is used at the time of mapping to
 * populate the raw data with any properties that are missing.
 *
 * @type {string[]}
 */

const SyntaxInOrderIterator = require("core/frb/syntax-iterator").SyntaxInOrderIterator;


module.exports = function syntaxProperties(syntax) {

    var iterator = new SyntaxInOrderIterator(syntax, "property"),
        resultSet = null,
        currentSyntax;

    while ((currentSyntax = iterator.next().value)) {

        //We don't want the numbers here - like when an expression traverses an array at a known index
        if(typeof currentSyntax.args[1].value !== "number") {
            (resultSet || (resultSet = new Set())).add(currentSyntax.args[1].value);
        }
    }

    /*
        Quick test for comparing with previous implementation that is still here bellow
        TODO: Cleanup
    */
        // let parseRequirementsFromSyntax = _parseRequirementsFromSyntax(syntax);
    // if(parseRequirementsFromSyntax && !parseRequirementsFromSyntax.equals(Array.from(resultSet))) {
    //     console.log("check point");
    // }

    return Array.from(resultSet);
};


// module.exports = function syntaxProperties(syntax) {
//         return _parseRequirementsFromSyntax(syntax);
// };

function _parseRequirementsFromRecord(syntax, requirements) {
    var args = syntax.args,
        keys = Object.keys(args),
        _requirements = requirements || null,
        i, countI;

    for(i=0, countI = keys.length;(i<countI); i++) {
        _requirements = _parseRequirementsFromSyntax(args[keys[i]], _requirements);
    };

    return _requirements;
}

function _parseRequirementsFromSyntax(syntax, requirements) {
    var args = syntax.args,
        type = syntax.type,
        _requirements = requirements || null;

    if (type === "property" && args[0].type === "value") {
        if(!_requirements || (_requirements && _requirements.indexOf(args[1].value) === -1)) {
            (_requirements || (_requirements = [])).push(args[1].value);
        }
    } else if (type === "property" && args[0].type === "property") {
        var subProperty = [args[1].value],
            result;
        _parseRequirementsFromSyntax(args[0], subProperty);
        result = subProperty.reverse();
        if(!_requirements || (_requirements && _requirements.indexOf(result) === -1)) {
            (_requirements || (_requirements = [])).push(result);
        }
    } else if (type === "record") {
        _requirements = _parseRequirementsFromRecord(syntax, _requirements);
    } else if (args) {
        if(args[0]) {
            _requirements = _parseRequirementsFromSyntax(args[0], _requirements);
        }
        if(args[1]) {
            _requirements = _parseRequirementsFromSyntax(args[1], _requirements);
        }
    }

    return _requirements;
}
