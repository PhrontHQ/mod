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
            domain: { value: global.location ? global.location.protocol + "//" + global.location.host : "" },
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
            _scopeSelectorRegExp: { value: /scope\(([^()]*)\)/g },
            automaticallyAddsCSSScope: { value: false },
        });
    }

    constructor() {
        super();
        this._expectedStyles = [];
        this._isPollingDocumentStyleSheets = !this._isLinkLoadEventAvailable();
    }

    get areStylesLoaded() {
        if (this._isPollingDocumentStyleSheets) {
            if (this._expectedStyles.length > 0) {
                let styleSheets = this._document.styleSheets;

                for (let i = 0, styleSheet; (styleSheet = styleSheets[i]); i++) {
                    let ix = this._expectedStyles.indexOf(styleSheet.href);

                    if (ix >= 0) {
                        this._expectedStyles.splice(ix, 1);
                    }
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
                return Promise.resolve();
            } else if (this.isResourcePreloading(url)) {
                return this.getResourcePreloadedPromise(url);
            }

            return this._importScript(script);
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
                const classListScope = cssContext.classListScope;
                const cssLayerName = cssContext.cssLayerName;
                const stylesheet = target.sheet;
                const cssRules = stylesheet.cssRules;

                /**
                 * Adding CSS Layers, and Scoping for components in dev mode.
                 * When we mop, we'll add it in the CSS.
                 *
                 * target.ownerDocument is the page's document.
                 * We captured the Component's element's classes before we got here, in this._resources[target.href]
                 *
                 * @scope (.ComponentElementClass1.ComponentElementClass2) {
                 *     -> All Component's CSS file's rules needs to be relocated here <-
                 *  }
                 *
                 * target.ownerDocument.styleSheets, but we need the component's element's classList
                 */

                if (classListScope && stylesheet.disabled === false && typeof CSSScopeRule === "function") {
                    let iStart = 0;

                    // Insert the scope rule, after any CSSImportRule
                    while (cssRules[iStart] instanceof CSSImportRule) {
                        iStart++;
                    }

                    // If it's not using CSS Layers
                    if (!(cssRules[iStart] instanceof CSSLayerBlockRule)) {
                        // If it's not using CSSScope
                        if (!(cssRules[iStart] instanceof CSSScopeRule) && this.automaticallyAddsCSSScope) {
                            this._scopeStylesheetRulesWithSelectorInCSSLayerName(
                                stylesheet,
                                classListScope,
                                cssLayerName,
                            );
                        } else if (cssRules[iStart] instanceof CSSScopeRule) {
                            // Add the layer name in scope
                            const scopeSelectorRegExp = this._scopeSelectorRegExp;
                            const scopeRule = stylesheet.cssRules[iStart];
                            const scopeRuleCSSText = scopeRule.cssText;
                            let scopeSelector;
                            let match;

                            // Delete current scopeRule
                            stylesheet.deleteRule(iStart);

                            while ((match = scopeSelectorRegExp.exec(scopeRuleCSSText)) !== null) {
                                scopeSelector = `.${cssLayerName}${match[1]}`;
                                scopeRuleCSSText = scopeRuleCSSText.replace(match[1], scopeSelector);
                            }

                            stylesheet.insertRule(scopeRuleCSSText);
                        }

                        let scopeRule = stylesheet.cssRules[iStart];

                        // If the CSS is scoped, we move it into the CSSLayerBlockRule
                        if (scopeRule && scopeRule instanceof CSSScopeRule) {
                            stylesheet.insertRule(`@layer ${cssLayerName} {}`, iStart);
                            let packageLayer = stylesheet.cssRules[iStart];

                            scopeRule = stylesheet.cssRules[++iStart];

                            stylesheet.deleteRule(iStart);
                            packageLayer.insertRule(scopeRule.cssText);
                        } else if (this.automaticallyAddsCSSLayerToUnscoppedCSS) {
                            stylesheet.insertRule(`@layer ${cssLayerName} {}`, iStart);
                            let packageLayer = stylesheet.cssRules[iStart];

                            // We layer all rules
                            for (let i = cssRules.length - 1; i > iStart; i--) {
                                packageLayer.insertRule(cssRules[i].cssText);
                                stylesheet.deleteRule(i);
                            }
                        }
                    }
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
            return Promise.resolve();
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this._SCRIPT_TIMEOUT);

        const promise = fetch(url, { signal: controller.signal })
            // We catch the error here to ensure the promise resolves.
            .catch((error) => error)
            .finally(() => {
                // Cleanup timer and set state regardless of success/failure
                clearTimeout(timeoutId);
                this.setResourcePreloaded(url);
            });

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
            promise = Promise.resolve();
        }

        // This is one of the very few ocasions where we go around the draw
        // loop to modify the DOM. Since it doesn't affect the layout
        // (unless the script itself does) it shouldn't be a problem.
        documentHead.appendChild(_document.createComment("Inserted from FIXME"));
        documentHead.appendChild(script);

        return promise;
    }

    _addResource(url, classListScope, cssLayerName) {
        this._resources[url] = { classListScope, cssLayerName } || true;
    }

    _scopeStylesheetRulesWithSelectorInCSSLayerName(stylesheet, classListScope, cssLayerName) {
        if (classListScope && stylesheet.disabled === false && typeof CSSScopeRule === "function") {
            const classListScopeRegexp = new RegExp(`(${classListScope})+(?=$)|(${classListScope})+(?= >)`, "dg");
            const classListScopeContentRegexp = new RegExp(`(${classListScope})+(?=[.,:,\s,>]|$)`, "dg");
            const cssRules = stylesheet.cssRules;
            let iStart = 0;

            // Insert the scope rule, but after any CSSImportRule
            while (cssRules[iStart] instanceof CSSImportRule) {
                iStart++;
            }

            stylesheet.insertRule(`@scope (.${cssLayerName}${classListScope}) {}`, iStart);
            const scopeRule = cssRules[iStart];

            // Now loop on rules to move - re-create them as there's no other way :-(
            for (let i = cssRules.length - 1; i > iStart; i--) {
                cssRules[i].selectorText = cssRules[i].selectorText
                    .replaceAll(classListScopeRegexp, ":scope")
                    .replaceAll(classListScopeContentRegexp, "");

                scopeRule.insertRule(cssRules[i].cssText);
                stylesheet.deleteRule(i);
            }
        }
    }
};
