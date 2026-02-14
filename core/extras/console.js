/*global module: false, console */
if (typeof window !== "undefined") {
    document._montageTiming = document._montageTiming || {};
    document._montageTiming.loadStartTime = Date.now();
}



console._groupTime = Object.create(null);
console.groupTime = function(name) {
    var groupTimeEntry = this._groupTime[name];
    if(!groupTimeEntry) {
        groupTimeEntry = {
            count: 0,
            start: 0,
            sum:0
        };
        this._groupTime[name] = groupTimeEntry;
    }
    groupTimeEntry.start = performance.now();
};
console.groupTimeEnd = function(name) {
    var end = performance.now();
    var groupTimeEntry = this._groupTime[name];
    var time = end - groupTimeEntry.start;

    groupTimeEntry.count = groupTimeEntry.count+1;
    groupTimeEntry.sum = groupTimeEntry.sum+time;
};
console.groupTimeAverage = function(name) {
    var groupTimeEntry = this._groupTime[name];
    return groupTimeEntry.sum/groupTimeEntry.count;
};
console.groupTimeTotal = function(name) {
    var groupTimeEntry = this._groupTime[name];
    return groupTimeEntry.sum;
};
console.groupTimeCount = function(name) {
    var groupTimeEntry = this._groupTime[name];
    return groupTimeEntry.count;
};


//Keep at the end so we act on all:
for(let consoleKeys = Object.keys(console), countI = consoleKeys.length, i=0, iMethod; (i<countI); i++) {

    iMethod = console[consoleKeys[i]];
    const onceCache = new Set();
    iMethod.once = function() {};
    iMethod.once = new Proxy(iMethod.once, {
        
        apply: (target, thisArg, argumentsList) => {
            if(!onceCache.hasEqual(argumentsList)) {
                onceCache.add(argumentsList);
                return iMethod.apply(thisArg, argumentsList);
            }
        }
    });
}

module.exports.console = global.console;
