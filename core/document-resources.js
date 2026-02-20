const Montage = require("./core").Montage;
const Promise = require("./promise").Promise;
const URL = require("./mini-url");
const currentEnvironment = require("./environment").currentEnvironment;

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
            wrapsComponentStylesheetsInCSSLayer: { value: true },
            domain: { value: global.location?.origin ?? "" },
            _isPollingDocumentStyleSheets: { value: false },
            _SCRIPT_TIMEOUT: { value: 5_000 },
            _expectedStyles: { value: null },
            _resources: { value: null },
            _preloaded: { value: null },
            _document: { value: null },
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
                    // @benoit: do we have a flag for dev mode?
                    this._wrapStyleSheetInLayer(stylesheet, cssContext);
                }
            }

            target.removeEventListener("load", this, false);
            target.removeEventListener("error", this, false);
        }
    }

    addStyle(element, DOMParent, context) {
        let url = element.getAttribute("href");

        if (url) {
            url = this.normalizeUrl(url);

            if (this.hasResource(url)) return;

            this._addResource(url, context);
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
     * Registers a resource with its associated context information
     *
     * @param {string} url The URL of the resource.
     * @param {{}} [resourceContext={}] An optional context object containing resource related information,
     * such as moduleLayerClassName and moduleLayerPath when importing a stylesheet resource.
     */
    _addResource(url, resourceContext = {}) {
        this._resources[url] = resourceContext;
    }

    /**
     * Modifies an existing CSSStyleSheet in-place to wrap it in a scoped layer structure.
     *
     * @param {CSSStyleSheet} sheet - The existing CSSStyleSheet to modify.
     * @param {{moduleLayerClassName: string, moduleLayerPath: string}} cssContext - The CSS context.
     * @returns {CSSStyleSheet} The modified stylesheet instance.
     */
    _wrapStyleSheetInLayer(sheet, cssContext) {
        // Validate requirements for scoping and layering
        if (!currentEnvironment.isLocalModding || !CSSLayerBlockRule || !CSSScopeRule || sheet.disabled) return;

        try {
            const { moduleLayerClassName, moduleLayerPath } = cssContext;
            const rulesToWrap = [];
            let insertionIndex = 0;

            // Iterate backwards so deleting rules doesn't shift indices of unvisited rules
            for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
                const rule = sheet.cssRules[i];

                // TODO: this is an incomplete list of possibilities
                // that part is experimental, we might need to add more constraints.
                const isImport = rule instanceof CSSImportRule;
                const isLayer = rule instanceof CSSLayerBlockRule || rule instanceof CSSLayerStatementRule;
                const isRoot = rule instanceof CSSStyleRule && rule.selectorText?.startsWith(":root");

                if (!isImport && !isLayer && !isRoot) {
                    // Unshift to maintain the original top-to-bottom order
                    rulesToWrap.unshift(rule.cssText);
                    sheet.deleteRule(i);
                    insertionIndex = i;
                }
            }

            if (rulesToWrap.length === 0) return sheet;

            const extractedCssText = rulesToWrap.join("\n");

            // Create the new wrapped CSS string
            const wrappedCss = `@layer ${moduleLayerPath} {
                @scope (.${moduleLayerClassName}) {
                    :scope, * { all: revert-layer !important; }
                }

                @layer style {
                    * {
                        all: revert;
                    }

                    ${extractedCssText}
                }
            }`;

            // Insert the new wrapped CSS into the existing stylesheet
            sheet.insertRule(wrappedCss, insertionIndex);
        } catch (error) {
            console.error("Unable to wrap scoped stylesheet (likely cross-origin)", error);
        }

        return sheet;
    }
};
