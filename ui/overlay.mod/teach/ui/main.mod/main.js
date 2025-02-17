var Component = require("mod/ui/component").Component;

exports.Main = Component.specialize({
    handleOpenOverlayButtonAction: {
        value: function (event) {
            this.overlay.show();
        }
    },

    // FIXME: When the overlay is displayed, it is attached to the root component,
    // placing it on a different node than the main component. As a result, the
    // close button's action event is not propagated to the main component,
    // preventing it from handling the event as intended.
    handleCloseOverlayButtonAction: {
        value: function () {
            this.overlay.hide();
        }
    },

    didShowOverlay: {
        value: function (overlay) {
            console.log("didShowOverlay", overlay);
        }
    },

    didHideOverlay: {
        value: function (overlay) {
            console.log("didHideOverlay", overlay);
        }
    },

    _overlay: {
        value: undefined
    },

    overlay: {
        get: function () {
            return this._overlay;
        },
        set: function (value) {
            window.consentmentForm = this;
            window.overlay = value;
            this._overlay = value;
        }
    }
});
