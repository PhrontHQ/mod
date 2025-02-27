var Montage = require("./core").Montage,
    Promise = require("./promise").Promise,
    URL = require("./mini-url");

var DocumentResources = Montage.specialize({

    _SCRIPT_TIMEOUT: {
        value: 5000
    },
    _document: {
        value: null
    },
    _resources: {
        value: null
    },
    _preloaded: {
        value: null
    },
    _expectedStyles: {
        value: null
    },

    constructor: {
        value: function DocumentResources() {
            this._expectedStyles = [];
            this._isPollingDocumentStyleSheets = !this._isLinkLoadEventAvailable();
        }
    },

    /**
     * Returns major webkit version or null if not webkit
     */
    _webkitVersion: {
        value: function () {
            var version = /AppleWebKit\/([\d.]+)/.exec(navigator.userAgent);

            if (version) {
                return parseInt(version[1]);
            }
            return null;
        }
    },

    /**
     * Returns if the load event is available for link elements
     */
    _isLinkLoadEventAvailable: {
        value: function () {
            var link = document.createElement("link"),
                webkitVersion = this._webkitVersion();

            if ("onload" in link) {
                // In webkits below version 535, onload is in link but
                // the event doesn't fire when the file has been loaded
                return !(webkitVersion !== null && webkitVersion < 535);
            }

            return false;
        }
    },

    initWithDocument: {
        value: function (_document) {
            this.clear();
            this._document = _document;

            this._populateWithDocument(_document);

            return this;
        }
    },

    _populateWithDocument: {
        value: function (_document) {

            /*
                getElementsByTagName() returns HTML Collection which is cached and returned, which is faster than querySelectorAll() that creates a Node List every time.
            */

            //var scripts = _document.querySelectorAll("script"),
            var scripts = _document.getElementsByTagName("script"),
                i, countI;

            for (i = 0, countI = scripts.length; i < countI; i++) {
                if (scripts[i].src) {
                    this._addResource(this.normalizeUrl(scripts[i].src));
                }
            }

            var links = _document.getElementsByTagName("link");
            //var links = _document.querySelectorAll("link");


            for (i = 0, countI = links.length; i < countI; i++) {
                if (links[i].rel === "stylesheet") {
                    this._addResource(this.normalizeUrl(links[i].href));
                }
            }
        }
    },

    clear: {
        value: function () {
            this._resources = Object.create(null);
            this._preloaded = Object.create(null);
        }
    },

    _addResource: {
        value: function (url, classListScope) {
            this._resources[url] = classListScope || true;
        }
    },

    cssScopeForResource: {
        value: function (url) {
            return this._resources[url] !== true ? this._resources[url] : null;       
        }
    },

    hasResource: {
        value: function (url) {
            return url in this._resources;
        }
    },

    isResourcePreloaded: {
        value: function (url) {
            return this._preloaded[url] === true;
        }
    },

    isResourcePreloading: {
        value: function(url) {
            return Promise.is(this._preloaded[url]);
        }
    },

    setResourcePreloadedPromise: {
        value: function (url, promise) {
            this._preloaded[url] = promise;
        }
    },

    setResourcePreloaded: {
        value: function (url) {
            this._preloaded[url] = true;
        }
    },

    getResourcePreloadedPromise: {
        value: function (url) {
            return this._preloaded[url];
        }
    },

    addScript: {
        value: function (script) {
            var url = this.normalizeUrl(script.src);

            if (url) {
                if (this.isResourcePreloaded(url)) {
                    return Promise.resolve();
                } else if (this.isResourcePreloading(url)) {
                    return this.getResourcePreloadedPromise(url);
                } else {
                    return this._importScript(script);
                }
            } else {
                return this._importScript(script);
            }
        }
    },

    // TODO: this should probably be in TemplateResources, need to come up with
    //       a better scheme for know what has been loaded in what document.
    //       This change would make addStyle sync and up to whoever is adding
    //       to listen for its proper loading.
    _importScript: {
        value: function (script) {
            var self = this,
                _document = this._document,
                documentHead = _document.head,
                promise,
                url = script.src;

            if (url) {
                self._addResource(url);

                promise = new Promise(function(resolve, reject){
                    var loadingTimeout;
                    // We wait until all scripts are loaded, this is important
                    // because templateDidLoad might need to access objects that
                    // are defined in these scripts, the downsize is that it takes
                    // more time for the template to be considered loaded.
                    var scriptLoadedFunction = function scriptLoaded(event) {
                        self.setResourcePreloaded(url);
                        script.removeEventListener("load", scriptLoaded, false);
                        script.removeEventListener("error", scriptLoaded, false);

                        clearTimeout(loadingTimeout);
                        resolve(event);
                    };

                    script.addEventListener("load", scriptLoadedFunction, false);
                    script.addEventListener("error", scriptLoadedFunction, false);

                    // Setup the timeout to wait for the script until the resource
                    // is considered loaded. The template doesn't fail loading just
                    // because a single script didn't load.
                    //Benoit: It is odd that we act as if everything was fine here...
                    loadingTimeout = setTimeout(function () {
                        self.setResourcePreloaded(url);
                        resolve();
                    }, self._SCRIPT_TIMEOUT);
                });

                this.setResourcePreloadedPromise(url, promise);

            } else {

                promise = new Promise(function(resolve,reject){
                    resolve();
                });

            }

            // This is one of the very few ocasions where we go around the draw
            // loop to modify the DOM. Since it doesn't affect the layout
            // (unless the script itself does) it shouldn't be a problem.
            documentHead.appendChild(
                _document.createComment("Inserted from FIXME")
            );
            documentHead.appendChild(script);

            return promise;
        }
    },

    handleEvent: {
        value: function (event) {
            var target = event.target,
                index;

            if (target.tagName === "LINK") {
                index = this._expectedStyles.indexOf(target.href);
                if (index >= 0) {
                    this._expectedStyles.splice(index, 1);
                    let classListScope = this.cssScopeForResource(target.href),
                        stylesheet = target.sheet;

                    /*
                        Adding CSS Scoping for components in dev mode. When we mop, we'll add it in the CSS. 
                    
                        target.ownerDocument is the page's document. We captured
                        the Component's element's classes before we got here, in this._resources[target.href]

                        @scope (.ComponentElementClass1.ComponentElementClass2) {
                            -> All Component's CSS file's rules needs to be relocated here <-
                        }
                        target.ownerDocument.styleSheets, but we need the component's element's classList
                    */
                    
                    if(classListScope && stylesheet.disabled === false && typeof CSSScopeRule === "function") {
                        let cssRules = stylesheet.cssRules,
                            iStart = 0,
                            scopeRule;

                        // console.log("classListScope: ",classListScope);
                        //Insert the scope rule, after any CSSImportRule
                        while(cssRules[iStart] instanceof CSSImportRule) {
                            iStart++;
                        }

                        /*
                            This worked — creating one CSSScopeRule for the whole component's stylesheet
                            and nest all other rules in it. But it started to fail in Chrome 132.
                        */
                        stylesheet.insertRule(`@scope (${classListScope}) to (${classListScope}) {}`, iStart);
                        scopeRule = stylesheet.cssRules[iStart];


                        /*
                            So as a workaround, creating one CSSScopeRule for each of a component's stylesheet's rules
                            works in Chrome 132, and WebKit. Firefox doesn't support it yet as of 1/27/2025
                        */

                        //Now loop on rules to move - re-create them as there's no other way :-( 
                        // for(let i = cssRules.length-1; (i>iStart) ; i--) {
                        //     //stylesheet.insertRule(`@scope (${classListScope}) to (${classListScope}) {}`, i);
                        //     stylesheet.insertRule(`@scope (${classListScope}) {}`, i);
                        //     scopeRule = stylesheet.cssRules[iStart];    
                        //     scopeRule.insertRule(cssRules[i].cssText);
                        //     stylesheet.deleteRule(i);
                        // }

                        //console.log("stylesheet: ",stylesheet.cssRules[0].cssText);

                    }

                }
                target.removeEventListener("load", this, false);
                target.removeEventListener("error", this, false);
            }
        }
    },

    addStyle: {
        value: function (element, DOMParent, classListScope) {
            var url = element.getAttribute("href"),
                documentHead;

            if (url) {
                url = this.normalizeUrl(url);
                if (this.hasResource(url)) {
                    return;
                }
                this._addResource(url, classListScope);
                this._expectedStyles.push(url);
                if (!this._isPollingDocumentStyleSheets) {
                    // fixme: Quick workaround for IE 11. Need a better patch.
                    // -> link DOM elements are loaded before they are attached to the DOM
                    element.setAttribute("href", url);

                    element.addEventListener("load", this, false);
                    element.addEventListener("error", this, false);
                }
            }
            documentHead = DOMParent || this._document.head;
            documentHead.insertBefore(element, documentHead.firstChild);
        }
    },

    normalizeUrl: {
        value: function (url, baseUrl) {
            if (!baseUrl) {
                baseUrl = this._document.location.href;
            }

            return URL.resolve(baseUrl, url);
        }
    },

    domain: {
        value: global.location ? global.location.protocol + "//" + global.location.host : ''
    },

    isCrossDomain: {
        value: function (url) {
            return url.indexOf(this.domain + "/") !== 0 ||
                url.indexOf("file://") === 0;
        }
    },

    preloadResource: {
        value: function (url, forcePreload) {
            var skipPreload;

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
            } else {
                return this._preloadResource(url);
            }
        }
    },

    _preloadResource: {
        value: function (url) {
            var self = this,

                promise = new Promise(function(resolve, reject) {
                    var req = new XMLHttpRequest();
                    req.open("GET", url);
                    req.addEventListener("load", resolve, false);
                    req.addEventListener("error", resolve, false);
                    req.addEventListener("timeout", resolve, false);
                    req.timeout = self._SCRIPT_TIMEOUT;
                    req.send();
                    req.listener = resolve;
                })
                .then((event) => {
                    this.setResourcePreloaded(url);
                    event.target.removeEventListener("load", event.target.listener);
                    event.target.removeEventListener("error", event.target.listener);
                    event.target.removeEventListener("timeout", event.target.listener);
                });

            this.setResourcePreloadedPromise(url, promise);

            return promise;
        }
    },

    areStylesLoaded: {
        get: function () {
            var styleSheets,
                ix;

            if (this._isPollingDocumentStyleSheets) {
                if (this._expectedStyles.length > 0) {
                    styleSheets = this._document.styleSheets;
                    for (var i = 0, styleSheet; (styleSheet = styleSheets[i]); i++) {
                        ix = this._expectedStyles.indexOf(styleSheet.href);
                        if (ix >= 0) {
                            this._expectedStyles.splice(ix, 1);
                        }
                    }
                }
            }

            return this._expectedStyles.length === 0;
        }
    }

}, {

    getInstanceForDocument: {
        value: function (_document) {
            //jshint -W106
            var documentResources = _document.__montage_resources__;

            if (!documentResources) {
                documentResources = _document.__montage_resources__ = new DocumentResources().initWithDocument(_document);
            }

            return documentResources;
            //jshint +W106
        }
    }

});

exports.DocumentResources = DocumentResources;
