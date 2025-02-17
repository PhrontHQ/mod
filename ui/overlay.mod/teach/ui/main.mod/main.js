const { Component } = require("mod/ui/component");

exports.Main = class Main extends Component {
    _overlay = undefined;

    get overlay() {
        return this._overlay;
    }

    set overlay(value) {
        window.consentmentForm = this;
        window.overlay = value;
        this._overlay = value;
    }

    handleOpenOverlayButtonAction(event) {
        this.overlay.show();
    }

    // FIXME: When the overlay is displayed, it is attached to the root component,
    // placing it on a different node than the main component. As a result, the
    // close button's action event is not propagated to the main component,
    // preventing it from handling the event as intended.
    handleCloseOverlayButtonAction() {
        this.overlay.hide();
    }

    didShowOverlay(overlay) {
        console.log("didShowOverlay", overlay);
    }

    didHideOverlay(overlay) {
        console.log("didHideOverlay", overlay);
    }
};
