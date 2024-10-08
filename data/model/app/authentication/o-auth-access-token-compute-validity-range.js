/**
    @module mod/data/model/app/authentication/o-auth-access-token-compute-validity-range
*/
const Range = require("../../../../core/range").Range;


exports.OAuthAccessTokenComputeValidityRange = function (validityDuration) {
        var rangeBegin = new Date(),
            rangeEnd = rangeBegin.dateByAdjustingComponentValues(0 /*year*/, 0 /*monthIndex*/, 0 /*day*/, 0 /*hours*/, 0 /*minutes*/, validityDuration /*seconds*/, 0 /*milliseconds*/);

        return new Range(rangeBegin, rangeEnd);
    };
