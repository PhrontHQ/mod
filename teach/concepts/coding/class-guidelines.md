# Requiring Dependencies

Mod has historically supported CommonJS require, with its own implementation, allowing it to work in the asynchronous-native environment of browsers, as well as in node.js

We're planning to allow add support for ES import() and ideally support import of files coded for require() and vice versa, which should be possible as bun.js seems to have done just that.

However, in term of syntax, while the destructuring assignment syntax

```const { Component } = require("ui/component");
const { Component } = require("ui/component");
```

while attractively compact, has a runtime overhead compared to the classic syntax:

```const Component = require("ui/component").Component
const Component = require("ui/component").Component
```

which at a framework level where performance impacts everything built on top, is not worth adding. In a root / end-user mod / end-mod, it's perfectly fine to favor the readability of destructuring assignment syntax, but please avoid if when coding inside mod and mod-based reusable frameworks.

# Setting default instance property values

In a bizarre ES6 choice, doing this:

const Subclass = exports.Subclass = class Subclass extends SuperClass {

propertyA = "";

}

effectively ends up assigning "" to the propertyA of each instance of Subclass created.

This is grossly innefficient on a prototype-based language where default values are better looked up on the prototype chain with the default value set only on the Subclass's prototype's propertyA.

So in order to get back to use classes without losing that, please use the following construct:

const Subclass = exports.Subclass = class extends SuperClass {    static {

Montage.defineProperties(this.prototype, {

propertyA: { value: ""},
propertyB: { value: null},

propertyC: { value: null}
});
}
....
}
