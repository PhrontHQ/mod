/**
 * @module "mod/ui/label.mod"
 */
var TextComponent = require("../text.mod/text").Text,
    PressComposer = require("../../composer/press-composer").PressComposer;

/* FIXME:
- docs,
- tests,
- emit events?
- handle keyboard events?
*/

exports.Label = class Label extends TextComponent {
    constructor() {
        super();
        this._pressComposer = new PressComposer();
        this.addComposer(this._pressComposer);   
    }


    prepareForActivationEvents() {
        super.prepareForActivationEvents();
        this._pressComposer.addEventListener("press", this, false);
    }

    handlePress(e) {
        super.handlePress(e);
        if(this.target && typeof this.target[this.action] === "function") {
                this.target[this.action]({ from: this });
        }
    }

    static {

        TextComponent.defineProperties(Label.prototype, {

            hasTemplate: {
                value: false
            },


            _pressComposer: {
                value: null
            },

            target: {
                value: null
            },

            action: {
                value: "activate"
            }
        })
    }
}
