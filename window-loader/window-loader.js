var parentWindow = window.opener;

// Let's switch to the parent application package context
require.loadPackage(parentWindow.require.location)
.then(function (require) {
    var loadInfo = window.loadInfo,
        module = loadInfo.module,
        name = loadInfo.name,
        callback = loadInfo.callback;

    // Switching the package context back to the parent application
    // Fixe me: transition to .mr only
    window.require = window.mr = require;

    return require.async("mod/ui/component")
    .then(function (/*exports*/) {
        return require.async("mod/ui/loader.mod")
        .then(function (exports) {
            var mainComponent = exports.Loader.create();
            mainComponent.mainModule = module;
            mainComponent.mainName = name;
            mainComponent.element = window.document.body;
            mainComponent.attachToParentComponent();
            mainComponent.needsDraw = true;

            if (callback) {
                mainComponent.addEventListener("componentLoaded", function componentLoaded(event) {
                    mainComponent.removeEventListener("componentLoaded", componentLoaded);
                    callback(window, event.detail);
                });
            }
        });
    });

});

