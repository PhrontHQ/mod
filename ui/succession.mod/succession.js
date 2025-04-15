/**
 * @module "mod/ui/succession.mod"
 */
var Component = require("ui/component").Component;

/**
 * Subclasses Component for its `domContent` behavior.
 *
 * If passage properties are defined on the Succession, they will override children's.
 * See {@link Succession#_prepareContentForBuild}.
 *
 * @class Succession
 * @augments Component
 */
exports.Succession = Component.specialize(/** @lends Succession.prototype */{

    contentBuildInAnimation: {
        value: undefined
    },

    contentBuildOutAnimation: {
        value: undefined
    },

    /**
     * When set to true, prevents the component from having empty content when history is popped.
     * @property {boolean}
     * @default false
     */
    preventEmptyContent: {
        value: false
    },

    /**
     * Setting content to a component will add the component to `history`.
     * Setting content to null will clear `history`.
     */
    content: {
        get: function () {
            return this.history.length ? this.history[this.history.length - 1] : undefined;
        },
        set: function (component) {
            if (component) {
                this.history.push(component);
            } else {
                this.history.clear();
            }
        }
    },

    _firstComponent: {
        value: undefined
    },

    _history: {
        value: undefined
    },

    /**
     * A stack consisted of {@link Component}s.
     *
     * @property {Array}
     */
    history: {
        get: function () {
            if (!this._history) {
                this._history = [];
                this._history.addBeforeRangeChangeListener(this);
                this._history.addRangeChangeListener(this);
            }
            return this._history;
        },
        set: function (history) {
            history = Array.isArray(history) ? history : [];
            if (this.history !== history) {
                if (!this.history.length && history.length) {
                    this._firstComponent = history[0];
                }
                this.history.splice.apply(this.history, [0, this.history.length].concat(history));
            }
        }
    },

    /**
     * @property {boolean}
     * @default false
     */
    hasTemplate: {
        enumerable: false,
        value: false
    },

    /**
     * Override build-in / out animation; checks for whether properties are undefined,
     * as null is used to disable passage animation.
     *
     * Priority from most important: Succession -> Passage -> Component
     *
     * @private
     * @function
     */
    _prepareContentForBuild: {
        value: function (content) {
            if (content) {
                if (this.contentBuildInAnimation) {
                    content.buildInAnimationOverride = this.contentBuildInAnimation;
                }
                if (this.contentBuildOutAnimation) {
                    content.buildOutAnimationOverride = this.contentBuildOutAnimation;
                }
            }
        }
    },

    _prepareContentsForBuild: {
        value: function (contents = []) {
            contents.forEach(this._prepareContentForBuild, this);
        }
    },

    /**
     * Ensure components generated by instantiating in JavaScript instead of
     * declaring in template serialization has an element.
     *
     * @private
     * @function
     * @param {Component} content
     */
    _updateDomContentWith: {
        value: function (content) {
            if (content) {
                var element;
                if (!content.element) {
                    element = document.createElement("div");
                    element.id = content.identifier || "appendDiv";
                    content.element = element;
                } else {
                    element = content.element;
                }
                this.domContent = element;
                content.needsDraw = true;
            } else {
                this.domContent = null;
            }
        }
    },

    // =============================================================================================
    // Event Handlers
    // =============================================================================================

    /**
     * Prepare outgoing content; need to prepare before range actually changes because we need to
     * prepare on outgoing content and handleRangeChange happens after outgoing content is gone
     */
    handleRangeWillChange: {
        value: function (plus, minus, index) {
            this._prepareContentForBuild(this.content);
        }
    },
    /**
     * Sets classes on Succession depending on how history was changed
     * Prepare incoming content
     */
    handleRangeChange: {
        value: function (plus, minus, index) {
            var length = this.history ? this.history.length : 0,
                isChanged = plus.length || minus.length,
                isChangeVisible = isChanged && index + plus.length === length,
                isPush = isChangeVisible && !minus.length && index,
                isPop = isChangeVisible && !plus.length && length,
                isReplace = isChangeVisible && !isPush && !isPop && length,
                isClear = isChangeVisible && !length;
            const lastRemovedComponent = minus[0];
                
            // If we are preventing empty content and the last removed component is not null,
            // we push it back to the history stack.
            if (isClear && this.preventEmptyContent && lastRemovedComponent) {
                console.log('Preventing empty content by keeping the last component in the DOM.');
                this._history.push(lastRemovedComponent);
                return;
            }
            
            // Set appropriate classes and update the succession if necessary.
            if (isChangeVisible) {
                this.classList[isPush ? "add" : "remove"]("mod-Succession--push");
                this.classList[isPop ? "add" : "remove"]("mod-Succession--pop");
                this.classList[isReplace ? "add" : "remove"]("mod-Succession--replace");
                this.classList[isClear ? "add" : "remove"]("mod-Succession--clear");
                this._prepareContentForBuild(this.content);
                this.dispatchBeforeOwnPropertyChange("content", this.content);
                this._updateDomContentWith(this.content);
                this.dispatchOwnPropertyChange("content", this.content);

                const affectedComponents = [...plus, ...minus];

                // As we only prepare the incoming and outgoing components for build and if there are multiple affected
                // components (e.g., during a complex history change, like a `clear()`), we need to ensure that all
                // components in between are also prepared for build. This guarantees that animation overrides are
                // applied consistently across all relevant components.
                if (affectedComponents.length > 1) {
                    this._prepareComponentsForBuild(affectedComponents);
                }
            }
        }
    },

    handleBuildInEnd: {
        value: function (event) {
            this.needsCssClassCleanup = true;
            this.needsDraw = true;
        }
    },

    handleBuildOutEnd: {
        value: function (event) {
            this.needsCssClassCleanup = true;
            this.needsDraw = true;
        }
    },

    // =============================================================================================
    // Life Cycle Hooks
    // =============================================================================================

    /**
     * The first time, extract the argument component (if any) and insert it into the succession
     * without animation. Must wait for argument component's template to be expanded as
     * parent replaces template with component's element.
     *
     * TODO: Component's extractDomArgument("*") does not seem to be working so the
     *       content argument must explicitly be named "content".
     */
    enterDocument: {
        value: function (isFirstTime) {
            var contentElement = isFirstTime && this.extractDomArgument("content"),
                contentComponent = contentElement && contentElement.component,
                self = this;
            if (contentComponent) {
                contentComponent.expandComponent().then(function () {
                    self.history.push(contentComponent);
                });
            }
            if (isFirstTime) {
                this.addEventListener("buildInEnd", this);
                this.addEventListener("buildOutEnd", this);
            }
        }
    },

    draw: {
        value: function () {
            if (this.needsCssClassCleanup) {
                this.needsCssClassCleanup = false;
                this.classList.deleteEach([
                    "mod-Succession--push",
                    "mod-Succession--pop",
                    "mod-Succession--replace",
                    "mod-Succession--clear"
                ]);
            }
        }
    }

});
