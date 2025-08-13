const { Component } = require("/ui/component");

exports.VisualStyle = class VisualStyle extends Component{
    static reservedKeywords = new Set([
        "isDeserializing",
        "ignoredKeys",
        "element",
        "parent",
        "prefix",
    ]);

    static VISUAL_STYLE_PROXY = Symbol("VisualStyleProxy");
    static ignoredKeys = new Set(["style"]);
    static prefix = "mod";

    hasTemplate = false;

    get element() {
        if (this._element) return this._element;
        if (this.parent?.element) return this.parent?.element;

        return document.documentElement;
    }

    set element(value) {
        if (value instanceof Element) {
            this._element = value;
        } else {
            throw new TypeError("Element must be an instance of Element.");
        }
    }

    // @Benoit: how to pass property to the constructor from the serialization?
    get prefix() {
        const parentPrefix = this.parent?.prefix;

        if (this._prefix) {
            // FIXME:
            // if (parentPrefix) return `${parentPrefix}-${this._prefix}`;
            return this._prefix;
        }

        // If no prefix is set, use the parent's prefix or the default
        // FIXME:
        // if (parentPrefix) return parentPrefix;

        return VisualStyle.prefix;
    }

    set prefix(value) {
        if (typeof value === "string" && value.trim() !== "") {
            this._prefix = value;
        } else {
            throw new TypeError("Prefix must be a string.");
        }
    }

    get ignoredKeys() {
        if (this._ignoredKeys) return this._ignoredKeys;

        // If parent has ignored keys, return them
        if (this.parent?.ignoredKeys) return this.parent.ignoredKeys;

        // If no parent and no ignored keys, return the default
        return VisualStyle.ignoredKeys;
    }

    set ignoredKeys(value) {
        if (Array.isArray(value)) {
            this._ignoredKeys = new Set(value);
        } else if (value instanceof Set) {
            this._ignoredKeys = value;
        } else {
            throw new TypeError("Ignored keys must be a Set or an Array.");
        }
    }

    #proxy = null;

    constructor() {
        super();
        this.root = {};
        this.#proxy = this.#createProxy(this.root);

        return this.#proxy;
    }

    static isVisualStyleProxy(value) {
        return (
            Object.isObject(value) &&
            value[VisualStyle.VISUAL_STYLE_PROXY] === true
        );
    }

    #createProxy(obj, path = []) {
        const handler = {
            set: (target, property, value) => {
                // Handle reserved keywords
                if (VisualStyle.reservedKeywords.has(property)) {
                    this[property] = value;
                    return true;
                }

                // Check if value is already a VisualStyle proxy
                if (VisualStyle.isVisualStyleProxy(value)) {
                    target[property] = value;
                    value.parent = this;
                    return true;
                }

                const currentPath = [...path, property];

                if (Object.isObject(value)) {
                    target[property] = this.#createProxy(value, currentPath);
                    this.#processNestedObject(value, currentPath);
                } else {
                    target[property] = value;
                    const varName = this.#buildVarName(currentPath);
                    this.#setCSSVariable(varName, value);
                }

                return true;
            },
            get: (target, property) => {
                if (property === VisualStyle.VISUAL_STYLE_PROXY) return true;

                if (VisualStyle.reservedKeywords.has(property)) {
                    return this[property];
                }

                return target[property] || null;
            },
        };

        return new Proxy(obj, handler);
    }

    #processNestedObject(obj, path = []) {
        Object.entries(obj).forEach(([key, value]) => {
            const currentPath = [...path, key];

            if (Object.isObject(value)) {
                this.#processNestedObject(value, currentPath);
            } else {
                const varName = this.#buildVarName(currentPath);
                this.#setCSSVariable(varName, value);
            }
        });
    }

    #buildVarName(path) {
        const filtered = path.filter((key) => !this.ignoredKeys.has(key));
        const kebabPath = filtered.map((key) => key.toKebabCase()).join("-");

        if (this.prefix) return `--${this.prefix}-${kebabPath}`;

        return `--${kebabPath}`;
    }

    // Set CSS variable on element
    #setCSSVariable(varName, value) {
        this.element.style.setProperty(varName, value);
    }

    // Remove CSS variable from element
    #removeCSSVariable(varName) {
        this.element.style.removeProperty(varName);
    }
}
