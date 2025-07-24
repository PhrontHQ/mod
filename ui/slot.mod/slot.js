/**
 * @module "mod/ui/slot.mod"
 * @requires mod/ui/component
 */
const { Component } = require("../component");

/**
 * @class Slot
 * @classdesc A structural component that serves as a place-holder for some
 * other component.
 * @extends Component
 */
exports.Slot = class Slot extends Component {
    /**
     * An optional helper object.  The slot consults
     * `delegate.slotElementForComponent(component):Element` if available for
     * the element it should use when placing a particular component on the
     * document.  The slot informs `delegate.slotDidSwitchContent(slot,
     * newContent, newComponent, oldContent, oldComponent)` if the content has
     * finished changing.  The component arguments are the `component`
     * properties of the corresponding content, or fall back to `null`.
     * @type {?Object}
     * @default null
     */
    delegate = null;

    _content = null;

    get hasTemplate() {
        return false;
    }

    /**
     * The component that resides in this slot and in its place in the
     * template.
     * @type {Component}
     * @default null
     */
    get content() {
        return this._content;
    }

    set content(value) {
        let element;

        if (value && typeof value.needsDraw !== "undefined") {
            // If the incoming content was a component;
            // make sure it has an element before we say it needs to draw
            if (!value.element) {
                element = document.createElement("div");

                if (this.respondsToDelegateMethod("slotElementForComponent")) {
                    element = this.callDelegateMethod("slotElementForComponent", this, value, element);
                }
                value.element = element;
            } else {
                element = value.element;
            }

            // The child component will need to draw;
            // this may trigger a draw for the slot itself
            this.domContent = element;
            value.needsDraw = true;
        } else {
            this.domContent = value;
        }

        this._content = value;
        this.needsDraw = true;
    }

    enterDocument(firstTime) {
        if (firstTime) {
            this.element.classList.add("slot-mod");
        }

        this.addEventListener("firstDraw", this, false);
    }

    exitDocument() {
        this.removeEventListener("firstDraw", this, false);
    }

    handleFirstDraw() {
        this.callDelegateMethod("slotContentDidFirstDraw", this);
    }

    /**
     * Informs the `delegate` that `slotDidSwitchContent(slot)`
     * @function
     */
    contentDidChange() {
        this.callDelegateMethod("slotDidSwitchContent", this);
    }
};
