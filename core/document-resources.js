const Montage = require("./core").Montage;
const Promise = require("./promise").Promise;
const URL = require("./mini-url");

exports.DocumentResources = class DocumentResources extends Montage {
    static getInstanceForDocument(_document) {
        let documentResources = _document.__montage_resources__;

        if (!documentResources) {
            documentResources = _document.__montage_resources__ = new DocumentResources().initWithDocument(_document);
        }

        return documentResources;
    }

    static {
        Montage.defineProperties(this.prototype, {
            domain: { value: global.location?.origin ?? "" },
            _isPollingDocumentStyleSheets: { value: false },
            _SCRIPT_TIMEOUT: { value: 5_000 },
            _expectedStyles: { value: null },
            _resources: { value: null },
            _preloaded: { value: null },
            _document: { value: null },

            // Scope and Layering configuration
            /**
             * #WARNING - EXPERIMENTAL if true, it will trigger the use of the _scopeStylesheetRulesWithSelectorInCSSLayerName() method
             * above to wrap an component's CSS into a @scope rule. modifying selectors such that they work within the new @scope, meaning
             * using pseudo selector :scope as necessary.
             *
             * This works in some limited use cases and would need a lot more subtlety to be robust, reliable
             * and useful
             *
             * @property {boolean}
             */
            automaticallyAddsCSSLayerToUnscoppedCSS: { value: true },
            _scopeSelectorRegExp: { value: /@scope\s*\(([^)]+)\)/ },
            automaticallyAddsCSSScope: { value: true },
        });
    }

    constructor() {
        super();
        this._expectedStyles = [];
        this._isPollingDocumentStyleSheets = !this._isLinkLoadEventAvailable();
    }

    get areStylesLoaded() {
        if (this._isPollingDocumentStyleSheets && this._expectedStyles.length > 0) {
            const styleSheets = this._document.styleSheets;

            for (let i = 0, styleSheet; (styleSheet = styleSheets[i]); i++) {
                const ix = this._expectedStyles.indexOf(styleSheet.href);

                if (ix >= 0) {
                    this._expectedStyles.splice(ix, 1);
                }
            }
        }

        return this._expectedStyles.length === 0;
    }

    initWithDocument(_document) {
        this.clear();
        this._document = _document;
        this._populateWithDocument(_document);

        return this;
    }

    clear() {
        this._resources = Object.create(null);
        this._preloaded = Object.create(null);
    }

    cssContextForResource(url) {
        return this._resources[url] !== true ? this._resources[url] : null;
    }

    hasResource(url) {
        return url in this._resources;
    }

    isResourcePreloaded(url) {
        return this._preloaded[url] === true;
    }

    isResourcePreloading(url) {
        return Promise.is(this._preloaded[url]);
    }

    setResourcePreloadedPromise(url, promise) {
        this._preloaded[url] = promise;
    }

    setResourcePreloaded(url) {
        this._preloaded[url] = true;
    }

    getResourcePreloadedPromise(url) {
        return this._preloaded[url];
    }

    addScript(script) {
        const url = this.normalizeUrl(script.src);

        if (url) {
            if (this.isResourcePreloaded(url)) {
                return Promise.resolveUndefined;
            } else if (this.isResourcePreloading(url)) {
                return this.getResourcePreloadedPromise(url);
            }
        }

        return this._importScript(script);
    }

    handleEvent(event) {
        const target = event.target;

        if (target.tagName === "LINK") {
            const index = this._expectedStyles.indexOf(target.href);

            if (index >= 0) {
                this._expectedStyles.splice(index, 1);
                const cssContext = this.cssContextForResource(target.href);

                if (cssContext && typeof cssContext === "object") {
                    const stylesheet = target.sheet;

                    // Adding CSS Layers, and Scoping for components in dev mode.
                    // When we mop, we'll add it in the CSS.
                    this._applyCSSScopingAndLayering(stylesheet, cssContext);
                }
            }

            target.removeEventListener("load", this, false);
            target.removeEventListener("error", this, false);
        }
    }

    addStyle(element, DOMParent, classListScope, cssLayerName) {
        let url = element.getAttribute("href");

        if (url) {
            url = this.normalizeUrl(url);

            if (this.hasResource(url)) return;

            this._addResource(url, classListScope, cssLayerName);
            this._expectedStyles.push(url);

            if (!this._isPollingDocumentStyleSheets) {
                // FIXME: Quick workaround for IE 11. Need a better patch.
                // -> link DOM elements are loaded before they are attached to the DOM
                element.setAttribute("href", url);
                element.addEventListener("load", this, false);
                element.addEventListener("error", this, false);
            }
        }

        const documentHead = DOMParent || this._document.head;
        documentHead.insertBefore(element, documentHead.firstChild);
    }

    normalizeUrl(url, baseUrl) {
        if (!baseUrl) {
            baseUrl = this._document.location.href;
        }

        return URL.resolve(baseUrl, url);
    }

    isCrossDomain(url) {
        return url.indexOf(this.domain + "/") !== 0 || url.indexOf("file://") === 0;
    }

    preloadResource(url, forcePreload) {
        let skipPreload = false;
        url = this.normalizeUrl(url);

        // We do not preload cross-domain urls to avoid x-domain security
        // errors unless forcePreload is requested, it could be a server
        // configured with CORS.
        if (!forcePreload && this.isCrossDomain(url)) {
            skipPreload = true;
        }

        if (skipPreload || this.isResourcePreloaded(url)) {
            return Promise.resolveUndefined;
        } else if (this.isResourcePreloading(url)) {
            return this.getResourcePreloadedPromise(url);
        }

        return this._preloadResource(url);
    }

    //-------------------------- Private Methods -------------------------//

    /**
     * Returns if the load event is available for link elements
     * @returns {boolean}
     */
    _isLinkLoadEventAvailable() {
        const link = document.createElement("link");
        const webkitVersion = this._webkitVersion();

        if ("onload" in link) {
            // In webkits below version 535, onload is in link but
            // the event doesn't fire when the file has been loaded
            return !(webkitVersion !== null && webkitVersion < 535);
        }

        return false;
    }

    /**
     * Returns major webkit version or null if not webkit
     * @returns {number|null}
     */
    _webkitVersion() {
        const version = /AppleWebKit\/([\d.]+)/.exec(navigator.userAgent);

        if (version) return parseInt(version[1]);

        return null;
    }

    _populateWithDocument(_document) {
        // getElementsByTagName() returns HTML Collection which is cached and returned,
        // which is faster than querySelectorAll() that creates a Node List every time.
        const scripts = _document.getElementsByTagName("script");

        for (let i = 0, countI = scripts.length; i < countI; i++) {
            if (scripts[i].src) {
                this._addResource(this.normalizeUrl(scripts[i].src));
            }
        }

        const links = _document.getElementsByTagName("link");

        for (let i = 0, countI = links.length; i < countI; i++) {
            if (links[i].rel === "stylesheet") {
                this._addResource(this.normalizeUrl(links[i].href));
            }
        }
    }

    _preloadResource(url) {
        const promise = fetch(url, { signal: AbortSignal.timeout(this._SCRIPT_TIMEOUT) })
            // We catch the error here to ensure the promise resolves.
            .catch((error) => error)
            .finally(() => this.setResourcePreloaded(url));

        this.setResourcePreloadedPromise(url, promise);

        return promise;
    }

    // TODO: this should probably be in TemplateResources, need to come up with
    // a better scheme for know what has been loaded in what document.
    // This change would make addStyle sync and up to whoever is adding
    // to listen for its proper loading.
    _importScript(script) {
        const _document = this._document;
        const documentHead = _document.head;
        const url = script.src;
        let promise;

        if (url) {
            this._addResource(url);

            promise = new Promise((resolve, reject) => {
                let loadingTimeout;
                // We wait until all scripts are loaded, this is important
                // because templateDidLoad might need to access objects that
                // are defined in these scripts, the downsize is that it takes
                // more time for the template to be considered loaded.
                const scriptLoadedFunction = (event) => {
                    this.setResourcePreloaded(url);
                    script.removeEventListener("load", scriptLoadedFunction, false);
                    script.removeEventListener("error", scriptLoadedFunction, false);

                    clearTimeout(loadingTimeout);
                    resolve(event);
                };

                script.addEventListener("load", scriptLoadedFunction, false);
                script.addEventListener("error", scriptLoadedFunction, false);

                // Setup the timeout to wait for the script until the resource
                // is considered loaded. The template doesn't fail loading just
                // because a single script didn't load.
                // @Benoit: It is odd that we act as if everything was fine here...
                loadingTimeout = setTimeout(() => {
                    this.setResourcePreloaded(url);
                    resolve();
                }, this._SCRIPT_TIMEOUT);
            });

            this.setResourcePreloadedPromise(url, promise);
        } else {
            promise = Promise.resolveUndefined;
        }

        // This is one of the very few ocasions where we go around the draw
        // loop to modify the DOM. Since it doesn't affect the layout
        // (unless the script itself does) it shouldn't be a problem.
        documentHead.appendChild(_document.createComment("Inserted from FIXME"));
        documentHead.appendChild(script);

        return promise;
    }

    /**
     * Registers a resource with its associated CSS context.
     *
     * @param {string} url The URL of the resource.
     * @param {string} classListScope The CSS class list scope associated with the resource.
     * @param {string} cssLayerName The CSS layer name associated with the resource.
     */
    _addResource(url, classListScope, cssLayerName) {
        // TODO: we need to clarify why classListScope already contains the cssLayerName?
        const classSelector = classListScope?.replace(`.${cssLayerName}`, "");
        this._resources[url] = { classListScope, cssLayerName, classSelector };
    }

    /**
     * Applies CSS Scoping and Layering logic to a loaded stylesheet.
     * Handles wrapping rules in scope and layer based on configuration.
     *
     * @param {CSSStyleSheet} stylesheet
     * @param {Object} cssContext - The CSS context containing classListScope and cssLayerName.
     */
    _applyCSSScopingAndLayering(stylesheet, cssContext) {
        // Validate requirements for scoping and layering
        if (
            typeof CSSLayerBlockRule !== "function" ||
            typeof CSSScopeRule !== "function" ||
            stylesheet.disabled === true ||
            !cssContext.classListScope
        ) {
            return;
        }

        const insertionIndex = this._findSafeCssRuleInsertionPoint(stylesheet);
        const currentRule = stylesheet.cssRules[insertionIndex];

        console.log("Current rule at insertion index:", insertionIndex, currentRule);

        // Exit early if we encounter a layer rule, as no further action is needed
        if (currentRule instanceof CSSLayerBlockRule) return;

        this._encapsulateRulesInScope(stylesheet, cssContext, insertionIndex);
        this._encapsulateRulesInLayer(stylesheet, cssContext, insertionIndex);
    }

    /**
     * Determines the safe index to insert new rules.
     * Skips top level rules (charset, import)
     *
     * @param {CSSStyleSheet} sheet - The stylesheet to process.
     * @returns {number} The index to start processing rules from.
     */
    _findSafeCssRuleInsertionPoint(sheet) {
        const { cssRules } = sheet;
        let i = cssRules.length;

        // Loop backwards to find the last @import rule
        while (i-- > 0) {
            if (!(cssRules[i] instanceof CSSImportRule)) break;
        }

        return i;
    }

    /**
     * Encapsulates stylesheet rules in a scope rule if necessary.
     *
     * @param {CSSStyleSheet} stylesheet - The stylesheet to modify.
     * @param {Object} cssContext - The CSS context.
     * @param {number} index - The index of the rule to check for scope.
     */
    _encapsulateRulesInScope(stylesheet, cssContext, index) {
        const currentRule = stylesheet.cssRules[index];
        const isScopeRule = currentRule instanceof CSSScopeRule;

        if (!isScopeRule && this.automaticallyAddsCSSScope) {
            // No @scope rule exists, auto-generate it
            this._scopeRules(stylesheet, cssContext, index);
        } else if (isScopeRule) {
            // @scope rule exists, refine the selectors
            this._refineExistingScopeRule(stylesheet, cssContext, index);
        }
    }

    /**
     * Scopes all rules in the given stylesheet by wrapping them in a scope rule.
     * Modifies selectors to use :scope based on the provided CSS context.
     *
     * @param {CSSStyleSheet} stylesheet - The stylesheet to modify.
     * @param {Object} cssContext - The CSS context.
     * @param {number} index - The insertion index at which to insert the scope rule.
     */
    _scopeRules(stylesheet, cssContext, index) {
        const { cssLayerName, classSelector } = cssContext;
        const { cssRules } = stylesheet;

        const classListScopeRegexp = new RegExp(`(${classSelector})+(?=$)|(${classSelector})+(?= >)`, "dg");
        const classListScopeContentRegexp = new RegExp(`(${classSelector})+(?=[.,:,\s,>]|$)`, "dg");

        // Insert the scope rule at the given insertion index
        stylesheet.insertRule(`@scope (.${cssLayerName}${classSelector}) {}`, index);
        const scopeRule = cssRules[index];

        // Move rules into the scope (looping backwards to safely delete)
        // Note: We stop > index because index is now the @scope rule itself
        for (let i = cssRules.length - 1; i > index; i--) {
            const rule = cssRules[i];

            // Skip some Pseudo class (e.g., :root) that can't be scoped
            // TODO: we possibly need a more complete list of such pseudo-classes
            if (rule.selectorText === ":root") continue;

            // Modify selectors to use :scope
            rule.selectorText = rule.selectorText
                .replaceAll(classListScopeRegexp, ":scope")
                .replaceAll(classListScopeContentRegexp, "");

            scopeRule.insertRule(rule.cssText);
            stylesheet.deleteRule(i);
        }
    }

    /**
     * Updates an existing scope rule string based on the layer name.
     *
     * @param {CSSStyleSheet} stylesheet - The stylesheet containing the scope rule.
     * @param {Object} cssContext - The CSS context.
     * @param {number} index - The index of the scope rule in the stylesheet.
     */
    _refineExistingScopeRule(stylesheet, cssContext, index) {
        const scopeRule = stylesheet.cssRules[index];
        const scopeRegex = /@scope\s*\(([^)]+)\)/;
        const match = scopeRegex.exec(scopeRule.cssText);

        if (match) {
            const originalFullMatch = match[0]; // e.g., "@scope (.ModButton)"
            const originalSelector = match[1]; // e.g., ".ModButton"

            const newSelector = `.${cssContext.cssLayerName}${originalSelector}`;
            const newScopeDefinition = `@scope (${newSelector})`;

            let scopeRuleCSSText = scopeRule.cssText.replace(originalFullMatch, newScopeDefinition);

            try {
                stylesheet.deleteRule(index);
                stylesheet.insertRule(scopeRuleCSSText, index);
            } catch (e) {
                console.warn("Failed to update scope rule:", e);
            }
        }
    }

    /**
     * Encapsulates css rules into a layer rule if necessary.
     *
     * @param {CSSStyleSheet} sheet - The stylesheet to modify.
     * @param {Object} cssContext - The CSS context.
     * @param {number} index - The insertion index at which to insert the new layer rule.
     */
    _encapsulateRulesInLayer(sheet, cssContext, index) {
        const cssRules = sheet.cssRules;
        const targetRule = cssRules[index];

        if (targetRule && targetRule instanceof CSSScopeRule) {
            // Move the specific Scope Rule inside a new Layer
            const layer = this._createAndInsertLayerRule(sheet, cssContext.cssLayerName, index);

            // Remove the rule at index + 1, the position to which the scope rule shifted following layer insertion.
            // Then, insert that specific text into the new layer.
            sheet.deleteRule(index + 1);
            layer.insertRule(targetRule.cssText);

            console.log(layer.cssText);
        } else if (this.automaticallyAddsCSSLayerToUnscoppedCSS) {
            // Wrap all remaining rules into a new Layer
            const layer = this._createAndInsertLayerRule(sheet, cssContext.cssLayerName, index);

            // Loop backwards to safely delete rules from the parent while moving them
            for (let i = cssRules.length - 1; i > index; i--) {
                layer.insertRule(cssRules[i].cssText);
                sheet.deleteRule(i);
            }
        }
    }

    /**
     * Inserts a new layer rule into the stylesheet at the specified index
     * and returns the newly created CSSLayerBlockRule object.
     *
     * @param {CSSStyleSheet} sheet - The stylesheet to modify.
     * @param {string} layerName - The name of the CSS layer to create.
     * @param {number} index - The insertion index at which to insert the new layer rule.
     * @returns {CSSLayerBlockRule} - The newly created CSSLayerBlockRule object.
     */
    _createAndInsertLayerRule(sheet, layerName, index) {
        sheet.insertRule(`@layer ${layerName} {}`, index);
        return sheet.cssRules[index];
    }
};
