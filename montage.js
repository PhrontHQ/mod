/*global define, module, console, MontageElement, Reflect, customElements */
(function (root, factory) {
    /*
        https://mathiasbynens.be/notes/globalthis

        Also see: https://www.npmjs.com/package/globalthis
    */
    if (typeof globalThis !== 'object') {
        Object.prototype.__defineGetter__('__magic__', function() {
            return this;
        });
        __magic__.globalThis = __magic__; // lolwat
        delete Object.prototype.__magic__;
    }

    if(typeof browser === "undefined" && typeof chrome === "object") {
        globalThis.browser = chrome;
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('montage', [], factory);
        define('mod', [], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require, exports, module);
    } else {
        // Browser globals (root is window)
        root.Montage = factory({}, {}, {});
    }
}(this, function (require, exports, module) {

    "use strict";

    // reassigning causes eval to not use lexical scope.
    //var globalEval = eval,
        /*jshint evil:true */
        //global = globalEval('this'),
        /*
            By leveraging globalThis we probably don't need to do this anymore
        */
        var global = globalThis,
        /*jshint evil:false */
        montageExports = exports;


    // Here we expose global for legacy mop support.
    // TODO move to mr cause it's loader role to expose
    // TODO make sure mop closure has it also cause it's mop role to expose
    global.global = global;


    /*
        To make all components containers:

        document.styleSheets.insertRule("[data-mod-id] {container-type: size;}")
    */


    /*
        To better desl with browser extensions:
    */

    function isCurrentPathname(path) {
        if (!path) {
            return false;
        }
        try {
            const { pathname } = new URL(path, location.origin);
            return pathname === location.pathname;
        }
        catch {
            return false;
        }
    }
    function getManifest(_version) {
        return globalThis.browser?.runtime?.getManifest?.();
    }
    function once(function_) {
        let result;
        return () => {
            if (!cache || typeof result === 'undefined') {
                result = function_();
            }
            return result;
        };
    }

    /*
        See: https://github.com/fregante/webext-detect-page/blob/main/index.ts
    */
if(globalThis.browser) {
    Object.defineProperties(browser, {
        /** Indicates whether the code is being run in extension contexts that have access to the chrome API */
        "_isExtensionContext": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "isExtensionContext": {
            get: function() {
                return this._isExtensionContext !== undefined
                    ? this._isExtensionContext
                    : (this._isExtensionContext = typeof globalThis.browser?.extension === 'object');
            },
            enumerable: false
        },
        "_isWebPage": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        /** Indicates whether the code is being run on http(s):// pages (it could be in a content script or regular web context) */
        "isWebPage": {
            get: function() {
                return this._isWebPage !== undefined
                    ? this._isWebPage
                    : (this._isWebPage = globalThis.location?.protocol.startsWith('http'));
            }
        },
        /** Indicates whether the code is being run in a content script */
        "_isContentScript": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "isContentScript": {
            get: function() {
                return this._isContentScript !== undefined
                    ? this._isContentScript
                    : (this._isContentScript = (this.isExtensionContext && this.isWebPage));
            }
        },
        /** Indicates whether the code is being run in a background context */
        "_isBackground": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "isBackground": {
            get: function() {
                return this._isBackground !== undefined
                    ? this._isBackground
                    : (this._isBackground = (this.isBackgroundPage || this.isBackgroundWorker));
            }
        },
        /** Indicates whether the code is being run in a background page */
        "_isBackgroundPage": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "isBackgroundPage": {
            get: function() {
                return this._isBackgroundPage !== undefined
                    ? this._isBackgroundPage
                    : (function() {
                        const manifest = getManifest(2);
                        if (manifest
                            && isCurrentPathname(manifest.background_page || manifest.background?.page)) {
                                return (this._isBackgroundPage = true);
                        } else {
                            return (this._isBackgroundPage = Boolean(manifest?.background?.scripts
                                && isCurrentPathname('/_generated_background_page.html')));

                        }
                    })()
            }
        },
        /** Indicates whether the code is being run in a background worker */
        "_isBackgroundWorker": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "isBackgroundWorker": {
            get: function() {
                return this._isBackgroundWorker !== undefined
                    ? this._isBackgroundWorker
                    : (this._isBackgroundWorker = (isCurrentPathname(getManifest(3)?.background?.service_worker)));
            }
        }

    });
}


    var browserPlatform = {

        makeResolve: function () {

            return function (base, relative) {
                if(relative === "./") {
                    return base.substring(0,base.lastIndexOf("/")+1);
                } else {
                    return new URL(relative, base).href;
                }
            };
        },

        load: function (location, callback) {

            var xhr = new XMLHttpRequest(),
                global = globalThis;

            xhr.onload = function onload(event) {
                var xhr = event.target;
                // Determine if an XMLHttpRequest was successful
                // Some versions of WebKit return 0 for successful file:// URLs
                if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {

                    var evalText = "(function (require, exports, module, global) {";
                    evalText += xhr.responseText;
                    evalText += "//*/\n})\n//# sourceURL=";
                    evalText += location;

                    try {
                        var resultFunction = eval(evalText),
                            exports = {},
                            module = {};

                        module.exports = exports;
                        resultFunction(function require(){}, exports, module, global);

                        if (callback) {
                            callback(null, module.exports);
                        }

                    } catch (error) {
                        console.error("eval failed for '"+location+"' with error:", error);
                        if (callback) {
                            callback(error, undefined);
                        }
                    }
                } else {
                    if (callback) {
                        callback(new Error("Can't load script " + JSON.stringify(location)), undefined);
                    }
                }
                //This clears the response from memory
                xhr.abort();

            };
            xhr.onerror = function onerror(event) {
                var xhr = event.target;

                //This clears the response from memory
                xhr.abort();

                if (callback) {
                    callback(new Error("Can't load script " + JSON.stringify(location)), undefined);
                }

            };
            xhr.open("GET", location, true);
            xhr.send(null);

            return;

            /*
                Previous script tag based approach that doesn't work an an extension content script
            */
            // var script = document.createElement("script");
            // script.src = location;
            // script.addEventListener("load", function () {
            //     if (callback) {
            //         callback(null, script);
            //     }
            //     // remove clutter
            //     script.parentNode.removeChild(script);
            // });
            // script.addEventListener("error", function () {
            //     if (callback) {
            //         callback(new Error("Can't load script " + JSON.stringify(location)), script);
            //     }
            //     // remove clutter
            //     script.parentNode.removeChild(script);
            // });
            // document.getElementsByTagName("head")[0].appendChild(script);
        },

        getParams: function () {
            var i, j,
                match,
                script,
                montage,
                attr,
                name;
            if (!this._params) {
                this._params = {};

                if(globalThis.browser && globalThis.browser.isContentScript) {
                    /*
                        for now, we set the root of the content script's world as the root of the extension
                    */
                    this._params.montageLocation = "node_modules/mod/";
                } else {

                    // Find the <script> that loads us, so we can divine our
                    // parameters from its attributes.
                    var scripts = document.getElementsByTagName("script");
                    for (i = 0; i < scripts.length; i++) {
                        script = scripts[i];
                        montage = false;
                        if (script.src && (match = script.src.match(/^(.*)montage.js(?:[\?\.]|$)/i))) {
                            this._params.montageLocation = match[1];
                            montage = true;
                        }
                        if (script.hasAttribute("data-mod-location") || script.hasAttribute("data-montage-location")) {
                            this._params.montageLocation = script.getAttribute("data-mod-location") || script.getAttribute("data-montage-location");
                            montage = true;
                        }
                        if (montage) {
                            if (script.dataset) {
                                for (name in script.dataset) {
                                    if (script.dataset.hasOwnProperty(name)) {
                                        this._params[name] = script.dataset[name];
                                    }
                                }
                            } else if (script.attributes) {
                                var dataRe = /^data-(.*)$/, // TODO cache RegEx
                                    letterAfterDash = /-([a-z])/g,
                                    upperCaseChar = function (_, c) {
                                        return c.toUpperCase();
                                    };

                                for (j = 0; j < script.attributes.length; j++) {
                                    attr = script.attributes[j];
                                    match = attr.name.match(dataRe);
                                    if (match) {
                                        this._params[match[1].replace(letterAfterDash, upperCaseChar)] = attr.value;
                                    }
                                }
                            }
                            // Permits multiple montage.js <scripts>; by
                            // removing as they are discovered, next one
                            // finds itself.
                            script.parentNode.removeChild(script);
                            break;
                        }
                    }
                }

            }
            return this._params;
        },

        bootstrap: function (callback) {
            var Require, DOM, Promise, URL,
                params = this.getParams(),
                resolve = this.makeResolve(),
                montageLocation, appLocation;

                montageLocation = montageLocation || resolve(((typeof browser !== "undefined" && browser.isContentScript) ? browser.runtime.getURL("") : global.location), params.montageLocation);
                if(params.package) {
                    appLocation = resolve(global.location, params.package);
                    //should be endsWith
                    if(!appLocation.lastIndexOf("/") !== appLocation.length-1) {
                        appLocation += "/";
                    }
                }


            // observe dom loading and load scripts in parallel
            function callbackIfReady() {
                if (DOM && Require) {
                    callback(Require, Promise, URL);
                }
            }

            // observe dom loaded
            function domLoad() {
                document.removeEventListener("DOMContentLoaded", domLoad, true);
                DOM = true;

                // Give a threshold before we decide we need to show the bootstrapper progress
                // Applications that use our loader will interact with this timeout
                // and class name to coordinate a nice loading experience. Applications that do not will
                // just go about business as usual and draw their content as soon as possible.
                var root = document.documentElement;

                if(!!root.classList) {
                    root.classList.add("montage-app-bootstrapping");
                    root.classList.add("mod-app-bootstrapping");
                } else {
                    root.className = root.className + " mod-app-bootstrapping montage-app-bootstrapping";
                }

                document._montageTiming = document._montageTiming || {};
                document._montageTiming.bootstrappingStartTime = Date.now();

                callbackIfReady();
            }

            // this permits montage.js to be injected after DOMContentLoaded
            // http://jsperf.com/readystate-boolean-vs-regex/2
            if (/interactive|complete/.test(document.readyState)) {
                domLoad();
            } else {
                document.addEventListener("DOMContentLoaded", domLoad, true);
            }

            // determine which scripts to load
            var pending = {
                "require": montageLocation+"core/mr/require.js",
                "require/browser": montageLocation+"core/mr/browser.js",
                "promise": (params.montageLocation === (global.location.origin+"/"))
                ? montageLocation+"core/promise.js" //montage in test
                : montageLocation+"core/promise.js" //anything else
            };

            // miniature module system
            var definitions = {};
            var bootModules = {};
            function bootRequire(id) {
                if (!bootModules[id] && definitions[id]) {
                    var exports = bootModules[id] = {};
                    bootModules[id] = definitions[id](bootRequire, exports) || exports;
                }
                return bootModules[id];
            }

            // execute bootstrap scripts
            function allModulesLoaded() {
                URL = bootRequire("mini-url");
                Promise = bootRequire("promise");
                Require = bootRequire("require");

                // if we get past the for loop, bootstrapping is complete.  get rid
                // of the bootstrap function and proceed.
                delete global.bootstrap;

                callbackIfReady();
            }

            // register module definitions for deferred,
            // serial execution
            global.bootstrap = function (id, factory) {
                definitions[id] = factory;
                delete pending[id];
                for (var module in pending) {
                    if (pending.hasOwnProperty(module)) {
                        // this causes the function to exit if there are any remaining
                        // scripts loading, on the first iteration.  consider it
                        // equivalent to an array length check
                        return;
                    }
                }

                allModulesLoaded();
            };

            function loadModuleScript(path, callback) {
                // try loading script relative to app first (npm 3+)
                browserPlatform.load(resolve(appLocation || global.location, path), function (err, exports) {
                    if (err) {
                        // if that fails, the app may have been installed with
                        // npm 2 or with --legacy-bundling, in which case the
                        // script will be under montage's node_modules
                        browserPlatform.load(resolve(montageLocation, path), callback);
                    } else if (callback) {
                        callback(null, exports);
                    }
                });
            }

            // load in parallel, but only if we're not using a preloaded cache.
            // otherwise, these scripts will be inlined after already
            if (typeof global.BUNDLE === "undefined") {

                // Special Case bluebird for now:
                loadModuleScript(pending.promise, function (error, exports) {
                    delete pending.promise;

                    var exportedPromise = typeof exports === "function"
                        ? exports
                        : exports.Promise;
                    //global.bootstrap cleans itself from global once all known are loaded. "bluebird" is not known, so needs to do it first
                    global.bootstrap("bluebird", function (require, exports) {
                        return exportedPromise;
                        //return global.Promise;
                    });
                    global.bootstrap("promise", function (require, exports) {
                        return exportedPromise;
                        //return global.Promise;
                    });

                    for (var module in pending) {
                        if (pending.hasOwnProperty(module)) {
                            loadModuleScript(pending[module]);
                        }
                    }
                });

            } else {

                global.nativePromise = global.Promise;
                Object.defineProperty(global, "Promise", {
                    configurable: true,
                    set: function(PromiseValue) {
                        Object.defineProperty(global, "Promise", {
                            value: PromiseValue
                        });

                        global.bootstrap("bluebird", function (require, exports) {
                            return global.Promise;
                        });
                        global.bootstrap("promise", function (require, exports) {
                            return global.Promise;
                        });
                    }
                });
            }

            // global.bootstrap("shim-string");

            // one module loaded for free, for use in require.js, browser.js
            global.bootstrap("mini-url", function (require, exports) {
                exports.resolve = resolve;
            });

        },
        initMontage: function (montageRequire, applicationRequire, params) {
            var dependencies = [
                "core/core",
                "core/promise",
                "core/event/event-manager",
                "core/serialization/deserializer/montage-reviver",
                "core/logger"
            ];

            var Promise = global.Promise;
            var deepLoadPromises = [];
            var self = this;

            for (var i = 0, iDependency; (iDependency = dependencies[i]); i++) {
                deepLoadPromises.push(montageRequire.deepLoad(iDependency));
            }

            return Promise.all(deepLoadPromises).then(function () {
                for (var i = 0, iDependency; (iDependency = dependencies[i]); i++) {
                    montageRequire(iDependency);
                }

                var Montage = montageRequire("core/core").Montage;
                var EventManager = montageRequire("core/event/event-manager").EventManager;
                var defaultEventManager = montageRequire("core/event/event-manager").defaultEventManager;
                var MontageDeserializer = montageRequire("core/serialization/deserializer/montage-deserializer").MontageDeserializer;
                var MontageReviver = montageRequire("core/serialization/deserializer/montage-reviver").MontageReviver;
                var logger = montageRequire("core/logger").logger;
                var application;

                exports.MontageDeserializer = MontageDeserializer;
                exports.Require.delegate = exports;

                // montageWillLoad is mostly for testing purposes
                if (typeof global.montageWillLoad === "function") {
                    global.montageWillLoad();
                }




                // Load the application
                var appProto = applicationRequire.packageDescription.applicationPrototype,
                    applicationLocation, appModulePromise;

                if (appProto) {
                    applicationLocation = MontageReviver.parseObjectLocationId(appProto);
                    appModulePromise = applicationRequire.async(applicationLocation.moduleId);
                } else {
                    appModulePromise = montageRequire.async("core/application");
                }

                return appModulePromise.then(function (exports) {
                    var Application = exports[(applicationLocation ? applicationLocation.objectName : "Application")];
                    application = new Application();
                    defaultEventManager.application = application;
                    application.eventManager = defaultEventManager;

                    return application._load(applicationRequire, function () {
                        if (params.module) {
                            // If a module was specified in the config then we initialize it now
                            applicationRequire.async(params.module);
                        }
                        if (typeof global.montageDidLoad === "function") {
                            global.montageDidLoad();
                        }

                        if (window.MontageElement) {
                            MontageElement.ready(applicationRequire, application, MontageReviver);
                        }
                    });

                });
            });
        }
    };

    // exports.TemplateCompilerFactory = function TemplateCompilerFactory(require, exports, module, global, moduleFilename, moduleDirectory) {

    // };

    exports.MJSONCompilerFactory = function MJSONCompilerFactory(require, exports, module, global, moduleFilename, moduleDirectory) {

        //var root =  Require.delegate.compileMJSONFile(module.text, require.config.requireForId(module.id), module.id, /*isSync*/ true);

        if(module.exports.hasOwnProperty("montageObject")) {
            throw new Error(
                'using reserved word as property name, \'montageObject\' at: ' +
                module.location
            );
        }

        if(!module.deserializer) {
            // var root =  Require.delegate.compileMJSONFile(module.text, require.config.requireForId(module.id), module, /*isSync*/ true);
            if(!montageExports.MontageDeserializer) {
                var MontageDeserializerModule = montageExports.config.modules["core/serialization/deserializer/montage-deserializer"];
                montageExports.MontageDeserializer = MontageDeserializerModule.require("./core/serialization/deserializer/montage-deserializer").MontageDeserializer;
            }

            var deserializer = new montageExports.MontageDeserializer(),
                //deserializerRequire = require.config ? require.config.requireForId(module.id) : module.parent.require /* in node */,
                deserializerRequire = require.config ? require.config.requireForId(module.id) : require /* in node */,
                root;

            module.deserializer = deserializer;
            deserializer.init(module.parsedText, deserializerRequire, void 0, module, true, /*useParsedSerialization*/true);
            // deserializer.init(module.json, deserializerRequire, void 0, module, true, true);

            try {
                root = deserializer.deserializeObject();
            } catch(error) {
                console.log(module.id+" deserializeObject() failed with error:",error);

                throw error;
            }

            // console.log("********MJSONCompilerFactory END compileMJSONFile",module.id);

            if ("montageObject" in module.exports && module.exports.montageObject !== root) {
                throw new Error(
                    'Final deserialized object is different than one set on module ' +
                    module.location
                );
            }
            else if(!("montageObject" in module.exports)) {

                /*
                    The following bellow is an option to avoid doing an Object.assign(),
                    which is costly moving every root entry of a serialization to exports,
                    by inverting the logic: replace exports by module.parsedText and then add the montageObject to it.
                    A tweak within in require.js Require.SerializationCompiler where we assign metadata had to be made so we would loop
                    over the replaces module exports vs the one that was passed so far.
                */
                // module.exports = module.parsedText;
                // module.exports.montageObject = root;


                /*
                    But the downside is that we're still creating montage metadata for all these entries that don't need one.
                    So, we kept these entries thinking that otherwise there wouldn't be a way to require the json content of a.mjson file as such.
                    But we haven't really needed that, and if we did, it would still be accessible through another call, or we could also add
                    exports.[json / parsedJson] = module.parsedText;

                */
                module.exports.montageObject = root;
                //Object.assign(module.exports, module.parsedText);

            }

            // if(module.exports) {
            //     Object.assign(module.exports, module.parsedText);
            // }
            // else {
            //     module.exports = module.parsedText;
            // }

            module.deserializer = null;
            module.text = null;
            //Cleaning the parsedText now as we don't use it and it's using memory for no good reason.
            module.parsedText = null;

        }

        // console.log("********MJSONCompilerFactory END montageObject THERE",module.id);


    };

    //Our moduleId can end with a [symbol] to indicate what symbol to
    //use off the export object
    function moduleIdWithoutExportSymbol(locationId) {
        var bracketIndex = locationId.indexOf("[");

        if (bracketIndex > 0) {
            return locationId.substr(0, bracketIndex);
        } else {
            return locationId;
        }
    }

    var _dependenciesWorkingSet = new Set();
    exports.parseMJSONDependencies = function parseMJSONDependencies(module, callback) {

        _dependenciesWorkingSet.clear();

        var jsonRoot = module.parsedText,
            base = module.location,
            rootEntries = Object.keys(jsonRoot),
            _moduleIdWithoutExportSymbol = moduleIdWithoutExportSymbol,
            i=0, iLabel, iDependency, dependencies = _dependenciesWorkingSet, iLabelObject,
            values, valuesKeys, j, countJ, jModule, jKeyValue;

        while ((iLabel = rootEntries[i])) {
            iLabelObject = jsonRoot[iLabel];
            if(typeof iLabelObject.prototype === "string") {
                dependencies.add((iDependency = _moduleIdWithoutExportSymbol(iLabelObject.prototype)));
                if(callback) {
                    callback(iDependency);
                }

                //This is to enable expression-data-mapping to deserialize itself synchronously
                //despite the fact it may have been serialized using object-descriptor-reference.
                //This allows us to add the objectDescriptorModule's id ("%") as a dependency upfront.
                //A stronger version would analyze the whole file for the construct: {"%": "someModuleId"}.
                //But this would impact performance for a use case that we don't need so far.
                if(iDependency === "mod/core/meta/object-descriptor-reference") {
                    /*
                        We're adding the module of that referrence, typiacally serialized as:
                        "ObjectDescriptorReference": {
                            "prototype": "mod/core/meta/object-descriptor-reference",
                            "properties": {
                                "valueReference": {
                                    "objectDescriptor": "Object_Descriptor_Name",
                                    "prototypeName": "Object_Descriptor__Prototype_Name",
                                    "objectDescriptorModule": {"%": "Object_Descriptor__module_id"}
                                }
                            }
                        },
                    */
                    dependencies.add((iDependency = iLabelObject.properties.valueReference.objectDescriptorModule["%"]));
                    if(callback) {
                        callback(iDependency);
                    }
                }

            }
            else if(typeof iLabelObject.object === "string") {
                dependencies.add((iDependency = _moduleIdWithoutExportSymbol(iLabelObject.object)));
                if(callback) {
                    callback(iDependency);
                }
            }

            /*
                introspect values block to detect properties that hold modules.
            */
            values = iLabelObject.values || iLabelObject.properties;

            if((valuesKeys = values ? Object.keys(values) : null)) {
                for(j=0, countJ = valuesKeys.length, jModule, jKeyValue; (j < countJ); j++) {
                    if(typeof (jKeyValue = values[valuesKeys[j]]) === "object" && jKeyValue && typeof (jKeyValue = jKeyValue["%"]) === "string") {
                        jModule = _moduleIdWithoutExportSymbol(jKeyValue);
                        /*
                            We need to eliminate cases where the module refers to the current file,
                            like the objectDescriptorModule property in serialized "mod/core/meta/module-object-descriptor"
                            This is not perfect but will do for now.
                        */
                        if(!(jModule.startsWith("./") && (base.endsWith(jModule.substring(1))))) {
                            dependencies.add(jModule);

                            if(callback) {
                                callback(jModule);
                            }

                        }
                    }

                }
            }

            i++;
        }
        return dependencies.size > 0 ? Array.from(dependencies) : null;
    };

    var dotMJSON = ".mjson",
        dotMJSONLoadJs = ".mjson.load.js",
        TemplatePromise,
        Template;

    exports.Compiler = function (config, compile) {
        if(!exports.config && (config.name === "mod" || config.name === "montage")) {
            exports.config = config;
        }
        return function(module) {

            // if(module.id.endsWith(".html")) {
            //     var html = module.text,
            //         TemplatePromise;

            //     if(!Template) {
            //         TemplatePromise = TemplatePromise ||
            //         (
            //             /* global.require is application's require */
            //             TemplatePromise = global.require.async("mod/core/template")
            //         .then((exports) => {
            //             Template = exports.Template;
            //             return;
            //         }));
            //     } else {
            //         TemplatePromise = TemplatePromise || (TemplatePromise = Promise.resolve(Template));
            //     }

            //     return TemplatePromise
            //     .then(() => {
            //         var template = new Template();
            //         return template.initWithModule(module)
            //         .then(() => {

            //             //FIXME: That method is lame, getObjectsString() should get the document internally
            //             var loadDependencyPromise,
            //                 objectsStringPromise = template.getObjectsString(template.document),
            //                 loadResourcesPromise;

            //             var resources = template.getResources();
            //             if (!resources.resourcesLoaded() && resources.hasResources()) {
            //                 //We can't be sure that we wan these in the root document?
            //                 loadResourcesPromise = resources.loadResources(global.document);
            //             }

            //             if(objectsStringPromise && loadResourcesPromise) {
            //                 loadDependencyPromise = Promise.all([objectsStringPromise, loadResourcesPromise]);
            //             } else {
            //                 loadDependencyPromise = objectsStringPromise;
            //             }

            //             return loadDependencyPromise.then((resolvedValues) => {
            //                 var objectsString;
            //                 if(Array.isArray(resolvedValues)) {
            //                     objectsString = resolvedValues[0];
            //                 } else {
            //                     objectsString = resolvedValues;
            //                 }

            //                 var serializationJSON = JSON.parse(objectsString);
            //                 module.dependencies = montageExports.parseMJSONDependencies(serializationJSON);
            //                 // module.exports.template = template;
            //                 module.exports.montageObject = template;

            //                 //module.factory = exports.TemplateCompilerFactory;

            //                 return module;
            //             })
            //             // .then(() => {
            //             //     return template.instantiateWithInstances(/*context._objects*/null, context._element.ownerDocument)
            //             //     .then((documentPart) => {
            //             //         if(documentPart) {
            //             //             module.exports = documentPart.objects;

            //             //         } else {
            //             //             return null;
            //             //         }

            //             // });
            //         });



            //     });


            // } else {
                if (module.exports || module.factory || (typeof module.text !== "string" &&  !module.parsedText) || (typeof module.exports === "object")) {
                    return module;
                }

                var location = module.location,
                    isMJSON = (location && (location.endsWith(dotMJSON) || location.endsWith(dotMJSONLoadJs)));

                if (isMJSON) {
                    if (typeof module.exports !== "object" && (module.parsedText || typeof module.text === "string")) {
                        try {
                            module.parsedText = module.json;
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                console.error("SyntaxError parsing JSON at "+location);
                                config.lint(module);
                            } else {
                                throw e;
                            }
                        }
                        if (module.parsedText.montageObject) {
                            throw new Error(
                                'using reserved word as property name, \'montageObject\' at: ' +
                                location
                            );
                        }
                    }
                    module.dependencies = montageExports.parseMJSONDependencies(module);
                    module.factory = exports.MJSONCompilerFactory;

                    return module;
                } else {
                    var result = compile(module);
                    return result;
                }
            // }

        };
    };


    exports.initMontageCustomElement = function () {
        if (typeof window.customElements === 'undefined' || typeof window.Reflect === 'undefined') {
            return void 0;
        }


        window.makeCustomElementConstructor = function makeCustomElementConstructor(superConstructor) {
            var constructor = function () {
                return Reflect.construct(
                    HTMLElement, [], constructor
                );
            };
            Object.setPrototypeOf(
                constructor.prototype, (superConstructor || HTMLElement).prototype
            );
            Object.setPrototypeOf(constructor, superConstructor || HTMLElement);
            return constructor;
        }

        var MontageElement = makeCustomElementConstructor();

        function defineMontageElement(name, options) {
            if (!customElements.get(name)) {
                var customElementConstructor = makeCustomElementConstructor(MontageElement);
                customElementConstructor.componentConstructor = options.constructor;
                customElementConstructor.observedAttributes = options.observedAttributes;
                customElements.define(name, customElementConstructor);
            }
        }

        MontageElement.pendingCustomElements = new Map();

        MontageElement.define = function (name, constructor, options) {
            if (options && typeof options === 'object') {
                options.constructor = constructor;
            } else {
                options = { constructor: constructor };
            }

            if (this.require) {
                defineMontageElement(name, options);
            } else {
                this.pendingCustomElements.set(name, options);
            }
        };

        MontageElement.ready = function (require, application, reviver) {
            MontageElement.prototype.findProxyForElement = reviver.findProxyForElement;
            this.application = application;
            this.require = require;

            this.pendingCustomElements.forEach(function (constructor, name) {
                defineMontageElement(name, constructor);
            });

            this.pendingCustomElements.clear();
        };

        Object.defineProperties(MontageElement.prototype, {

            require: {
                get: function () {
                    return MontageElement.require;
                },
                configurable: false
            },

            application: {
                get: function () {
                    return MontageElement.application;
                },
                configurable: false
            },

            componentConstructor: {
                get: function () {
                    return this.constructor.componentConstructor;
                },
                configurable: false
            },

            observedAttributes: {
                get: function () {
                    return this.constructor.observedAttributes;
                },
                configurable: false
            }
        });

        MontageElement.prototype.connectedCallback = function () {
            if (!this._instance) {
                var self = this,
                    component = this.instantiateComponent();

                this._instance = component;
                return this.findParentComponent().then(function (parentComponent) {
                    //self._instance = component;
                    parentComponent.addChildComponent(component);
                    component._canDrawOutsideDocument = true;
                    component.needsDraw = true;
                });
            }
        };

        MontageElement.prototype.disconnectedCallback = function () {
            //TODO
        };

        MontageElement.prototype.findParentComponent = function () {
            var eventManager = this.application.eventManager,
                anElement = this,
                parentComponent,
                aParentNode,
                candidate;

            while ((aParentNode = anElement.parentNode) !== null &&
                !(candidate = eventManager.eventHandlerForElement(aParentNode))) {
                anElement = aParentNode;
            }

            return Promise.resolve(candidate) || this.getRootComponent();
        };

        MontageElement.prototype._deserializedFromTemplate = function (owner, label, documentPart) {
            this._instance._deserializedFromTemplate(owner, label, documentPart);
        }

        MontageElement.prototype.getRootComponent = function () {
            if (!MontageElement.rootComponentPromise) {
                MontageElement.rootComponentPromise = this.require.async("mod/ui/component")
                    .then(function (exports) {
                        return exports.__root__;
                    });
            }

            return MontageElement.rootComponentPromise;
        };

        MontageElement.prototype.instantiateComponent = function () {
            var component = new this.componentConstructor();
            this.bootstrapComponent(component);
            component.element = document.createElement("div");
            return component;
        };

        MontageElement.prototype.bootstrapComponent = function (component) {
            var shadowRoot = this.attachShadow({ mode: 'open' }),
                self = this,
                mainEnterDocument = component.enterDocument,
                mainTemplateDidLoad = component.templateDidLoad,
                proxyElement = this.findProxyForElement(this);

            if (proxyElement) {
                var observedAttributes = this.observedAttributes,
                    observedAttribute,
                    length;

                if (observedAttributes && (length = observedAttributes.length)) {
                    for (var i = 0; i < length; i++) {
                        observedAttribute = observedAttributes[i];
                        component.defineBinding(observedAttribute, {
                            "<->": "" + observedAttribute, source: proxyElement
                        });
                    }
                }
            }

            this.application.eventManager.registerTargetForActivation(shadowRoot);

            component.templateDidLoad = function () {
                var resources = component.getResources();

                if (resources) {
                    self.injectResourcesWithinCustomElement(
                        resources.styles,
                        shadowRoot
                    );

                    self.injectResourcesWithinCustomElement(
                        resources.scripts,
                        shadowRoot
                    );
                }

                this.templateDidLoad = mainTemplateDidLoad;

                if (typeof this.templateDidLoad === "function") {
                    this.templateDidLoad();
                }
            };

            component.enterDocument = function (firstTime) {
                shadowRoot.appendChild(this.element);
                this.enterDocument = mainEnterDocument;

                if (typeof this.enterDocument === "function") {
                    this.enterDocument(firstTime);
                }
            };
        };

        MontageElement.prototype.injectResourcesWithinCustomElement = function (resources, shadowRoot) {
            if (resources && resources.length) {
                for (var i = 0, length = resources.length; i < length; i++) {
                    shadowRoot.appendChild(resources[i]);
                }
            }
        };

        global.MontageElement = MontageElement;
    };

    /**
     * Initializes Montage and creates the application singleton if
     * necessary.
     */
    exports.initMontage = function () {
        var platform = exports.getPlatform();

        // Platform dependent
        platform.bootstrap(function (Require, Promise, URL) {
            var params = platform.getParams();
            var config = {
                // This takes <base> into account
                location: Require.getLocation()
            };

            exports.Require = Require;

            var montageLocation = URL.resolve(config.location, params.montageLocation);

            var location = URL.resolve(config.location, params.package || ".");
            var applicationHash = params.applicationHash;

            if (typeof global.BUNDLE === "object") {
                var bundleDefinitions = {};
                var getDefinition = function (name) {
                     if(!bundleDefinitions[name]) {
                         var defer = bundleDefinitions[name] = {};
                         var deferPromise = new Promise(function(resolve, reject) {
                             defer.resolve = resolve;
                             defer.reject = reject;
                         });
                         defer.promise = deferPromise;
                         return defer;
                    }

                    return bundleDefinitions[name];
                };
                global.bundleLoaded = function (name) {
                    getDefinition(name).resolve();
                };

                var preloading = {};
                var preloadingPromise = new Promise(function(resolve, reject) {
                    preloading.resolve = resolve;
                    preloading.reject = reject;
                });
                preloading.promise = preloadingPromise;

                config.preloaded = preloading.promise;
                // preload bundles sequentially
                var preloaded = Promise.resolve();
                global.BUNDLE.forEach(function (bundleLocations) {
                    preloaded = preloaded.then(function () {
                        return Promise.all(bundleLocations.map(function (bundleLocation) {
                            browserPlatform.load(bundleLocation);
                            return getDefinition(bundleLocation).promise;
                        }));
                    });
                });
                // then release the module loader to run normally
                preloading.resolve(preloaded.then(function () {
                    delete global.BUNDLE;
                    delete global.bundleLoaded;
                }));
            }

            var applicationRequirePromise;

            if (!("remoteTrigger" in params)) {
                if ("autoPackage" in params) {
                    Require.injectPackageDescription(location, {
                        dependencies: {
                            mod: "*"
                        }
                    }, config);
                    Require.injectPackageDescription(location, {
                        dependencies: {
                            montage: "*"
                        }
                    }, config);

                } else {
                    // handle explicit package.json location
                    if (location.slice(location.length - 5) === ".json") {
                        var packageDescriptionLocation = location;
                        location = URL.resolve(location, ".");
                        Require.injectPackageDescriptionLocation(
                            location,
                            packageDescriptionLocation,
                            config
                        );
                    }
                }
                applicationRequirePromise = Require.loadPackage({
                    location: location,
                    hash: applicationHash
                }, config);
            } else {
                // allows the bootstrapping to be remote controlled by the
                // parent window, with a dynamically generated package
                // description
                window.postMessage({
                    type: "montageReady"
                }, "*");

                var trigger = new Promise(function(resolve) {
                    var messageCallback = function (event) {
                        if (
                            params.remoteTrigger === event.origin &&
                            (event.source === window || event.source === window.parent)
                        ) {
                            switch (event.data.type) {
                            case "montageInit":
                                window.removeEventListener("message", messageCallback);
                                resolve([event.data.location, event.data.injections]);
                                break;
                            case "isMontageReady":
                                // allow the injector to query the state in case
                                // they missed the first message
                                window.postMessage({
                                    type: "montageReady"
                                }, "*");
                            }
                        }
                    };

                    window.addEventListener("message", messageCallback);
                });

                applicationRequirePromise = trigger.then(function ([location, injections]) {
                    var promise = Require.loadPackage({
                        location: location,
                        hash: applicationHash
                    }, config);
                    if (injections) {
                        promise = promise.then(function (applicationRequire) {
                            location = URL.resolve(location, ".");
                            var packageDescriptions = injections.packageDescriptions,
                                packageDescriptionLocations = injections.packageDescriptionLocations,
                                mappings = injections.mappings,
                                dependencies = injections.dependencies,
                                index, injectionsLength;

                            if (packageDescriptions) {
                                injectionsLength = packageDescriptions.length;
                                for (index = 0; index < injectionsLength; index++) {
                                    applicationRequire.injectPackageDescription(
                                        packageDescriptions[index].location,
                                        packageDescriptions[index].description);
                                }
                            }

                            if (packageDescriptionLocations) {
                                injectionsLength = packageDescriptionLocations.length;
                                for (index = 0; index < injectionsLength; index++) {
                                    applicationRequire.injectPackageDescriptionLocation(
                                        packageDescriptionLocations[index].location,
                                        packageDescriptionLocations[index].descriptionLocation);
                                }
                            }

                            if (mappings) {
                                injectionsLength = mappings.length;
                                for (index = 0; index < injectionsLength; index++) {
                                    applicationRequire.injectMapping(
                                        mappings[index].dependency,
                                        mappings[index].name);
                                }
                            }

                            if (dependencies) {
                                injectionsLength = dependencies.length;
                                for (index = 0; index < injectionsLength; index++) {
                                    applicationRequire.injectDependency(
                                        dependencies[index].name,
                                        dependencies[index].version);
                                }
                            }

                            return applicationRequire;
                        });
                    }

                    return promise;
                });
            }

            return applicationRequirePromise.then(function (applicationRequire) {
                return applicationRequire.loadPackage({
                    location: montageLocation,
                    hash: params.montageHash
                })
                .then(function (montageRequire) {
                    montageRequire.inject("core/mini-url", URL);

                    // install the linter, which loads on the first error
                    config.lint = function (module) {
                        montageRequire.async("core/jshint")
                        .then(function (JSHINT) {
                            if (!JSHINT.JSHINT(module.text)) {
                                console.warn("JSHint Error: "+module.location);
                                JSHINT.JSHINT.errors.forEach(function (error) {
                                    if (error) {
                                        console.warn("Problem at line "+error.line+" character "+error.character+": "+error.reason);
                                        if (error.evidence) {
                                            console.warn("    " + error.evidence);
                                        }
                                    }
                                });
                            }
                        });
                    };

                    // Expose global require and mr
                    global.require = global.mr = applicationRequire;

                    return platform.initMontage(montageRequire, applicationRequire, params);
                });

            // Will throw error if there is one
            });
        });
    };

    // Bootstrapping for multiple-platforms
    exports.getPlatform = function () {
        if (typeof window !== "undefined" && window && window.document) {
            return browserPlatform;
        } else if (typeof process !== "undefined") {
            return require("./node.js");
        } else {
            throw new Error("Platform not supported.");
        }
    };

    if (typeof window !== "undefined") {
        if (global.__MONTAGE_LOADED__) {
            console.warn("Montage already loaded!");
        } else {
            global.__MONTAGE_LOADED__ = true;
            exports.initMontage();
            exports.initMontageCustomElement();
        }
    } else {
        // may cause additional exports to be injected:
        exports.getPlatform();
    }

    return exports;
}));
