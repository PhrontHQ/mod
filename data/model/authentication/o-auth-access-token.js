/**
    @module mod/data/model/authentication/o-auth-access-token
*/
const Montage = require("core/core").Montage,
    DataObject = require("../data-object").DataObject,
    Range = require("core/range").Range,
    Date = require("core/extras/date").Date;

/**
 * @class OAuthAccessToken
 * @extends DataObject
 *
 * Resources
 * https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/overview/ad-fs-openid-connect-oauth-flows-scenarios
 *
 */
exports.OAuthAccessToken = class OAuthAccessToken extends DataObject /** @lends OAuthAccessToken.prototype */ {
    
    static {

        Montage.defineProperties(this.prototype, {
            identity: {
                value: undefined
            },
            accessToken: {
                value: undefined
            },
            tokenType: {
                value: undefined
            },
            _issueDate: {
                value: undefined
            },
            expirationDate: {
                value: undefined
            },
            refreshExpirationDate: {
                value: undefined
            },

            _validityDuration: {
                value: undefined
            },

            _validityRange: {
                value: undefined
            },
            scopes: {
                value: undefined
            },
            refreshToken: {
                value: undefined
            },
            idToken: {
                value: undefined
            },
            _refreshValidityDuration: {
                value: undefined
            },
            _refreshValidityRange: {
                value: undefined
            }
        });
    }

    get issueDate() {
        if(!this._issueDate) {
            this._issueDate = Date.date;
        }
        return this._issueDate;
    }
    set issueDate(value) {
        if(value !== this._issueDate) {
            this._issueDate = value;
        }
    }

    get validityDuration() {
        if(!this._validityDuration && this._validityRange) {
            return this.validityRange.end.valueOf() - this.issueDate.valueOf();
        }
        return this._validityDuration;
    }
    set validityDuration(value) {
        if(value !== this._validityDuration) {
            this._validityDuration = value;
        }
    }

    get validityRange() {
        /*
            We treat ranges as collections, we create empty ones upfront so we can easily set them begin/end
            So we have to test for wether .begin and .end are defined here to know if we should do something
        */
        if((!this._validityRange?.begin && !this._validityRange?.end)  && (this._validityDuration || this.expirationDate)) {
        var rangeBegin = this.issueDate,
            rangeEnd = this.expirationDate
                ? this.expirationDate
                : rangeBegin.dateByAdjustingComponentValues(0 /*year*/, 0 /*monthIndex*/, 0 /*day*/, 0 /*hours*/, 0 /*minutes*/, this.validityDuration /*seconds*/, 0 /*milliseconds*/);
            this._validityRange = new Range(rangeBegin, rangeEnd);
        }

        return this._validityRange;
    }
    set validityRange(value) {
        if(value !== this._validityRange) {
            this._validityRange = value;
        }
    }

    get refreshValidityDuration() {
        if(!this._refreshValidityDuration && this._refreshValidityRange) {
            return this.refreshValidityRange.end.valueOf() - this.issueDate.valueOf();
        }
        return this._refreshValidityDuration;
    }
    set refreshValidityDuration(value) {
        if(value !== this._refreshValidityDuration) {
            this._refreshValidityDuration = value;
        }
    }

    get refreshValidityRange() {
        if(!this._refreshValidityRange && (this._refreshValidityDuration || this.refreshExpirationDate)) {
            var rangeBegin = this.issueDate,
                rangeEnd = this.refreshExpirationDate
                ? this.refreshExpirationDate
                : rangeBegin.dateByAdjustingComponentValues(0 /*year*/, 0 /*monthIndex*/, 0 /*day*/, 0 /*hours*/, 0 /*minutes*/, this.refreshValidityDuration /*seconds*/, 0 /*milliseconds*/);
                this._refreshValidityRange = new Range(rangeBegin, rangeEnd);
        }

        return this._refreshValidityRange;
    }
    set refreshValidityRange(value) {
        if(value !== this._refreshValidityRange) {
            this._refreshValidityRange = value;
        }
    }



    /**
     * Returns the number of millisecond for which a token is valid.
     * If that number is negative, it's expired.
     *
     * @property
     * @readonly
     * @returns {Number} Array of relevant propertyDescriptors
     */
    get remainingValidityDuration() {
        return this.validityRange.end.valueOf() - Date.now();
    }

}
