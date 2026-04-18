
module.exports = Scope;
function Scope(value) {
    this.value = value;
    return this;
}
Scope.prototype.parent = null;
Scope.prototype.nest = function (value) {
    var child = Object.create(this);
    child.value = value;
    child.parent = this;
    return child;
};
/**
 * Discovers, cache and return the root scope of this scope.
 * WARNING: This is cached. So it could get staled if the Scope hierararchy is manually patched
 * The only public API today is extending downwaed with .nest(value)
 *
 * @property
 * @return {Scope} 
 */

Object.defineProperties(Scope.prototype, {
    _root: {
        value: undefined,
        enumerable: false,
        writable: true
    },
    root: {
        get: function() {
            if(!this._root) {
                let child = this,
                    parent;
                while(child.parent) {
                    child.parent.child = child;
                    child = child.parent;
                }
                this._root = child;
            }
            return this._root;
        }
    }
});

