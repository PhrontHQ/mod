/*global require, exports*/

const { VisualOrientation } = require("core/enums/visual-orientation");
const { VisualPosition } = require("core/enums/visual-position");
const { ActionTarget } = require("ui/action-target.mod/action-target");

// TODO: migrate away from using undefinedGet and undefinedSet

/**
 * Wraps a native <code>&lt;button></code> or <code>&lt;input[type="button"]></code> HTML element.
 * The element's standard attributes are exposed as bindable properties.
 * @class module:"mod/ui/native/button.mod".Button
 * @extends module:mod/ui/action-target.mod/action-target
 * @fires action
 * @fires hold
 *
 * @example
 * <caption>JavaScript example</caption>
 *   var b1 = new Button();
 *   b1.element = document.querySelector("btnElement");
 *   b1.addEventListener("action", function(event) {
 *     console.log("Got event 'action' event");
 *   });
 *
 * @example
 * <caption>Serialized example</caption>
 * {
 *   "aButton": {
 *     "prototype": "mod/ui/native/button.mod",
 *     "values": {
 *       "element": {"#": "btnElement"}
 *     },
 *     "listeners": [
 *        {
 *          "type": "action",
 *          "listener": {"@": "appListener"}
 *        }
 *     ]
 *   },
 *   "listener": {
 *     "prototype": "appListener"
 *   }
 * }
 * <button data-mod-id="btnElement"></button>
 */
const Button = (exports.Button = class Button extends ActionTarget {
    /** @lends module:"mod/ui/native/button.mod".Button# */

    // <---- Static ---->

    static VisualOrientation = VisualOrientation;

    static VisualPosition = VisualPosition;

    // <---- Properties ---->

    _visualPosition = VisualPosition.start;

    get visualPosition() {
        return this._visualPosition;
    }

    /**
     * The position of the image
     * @type {VisualPosition}
     * @param {VisualPosition} position - The position of the image
     */
    set visualPosition(position) {
        if (!VisualPosition[position]) {
            console.warn('Invalid image position: "' + position + '"');
            return;
        }

        if (position !== this._visualPosition) {
            this._visualPosition = VisualPosition[position];
            this._applyVisualPositionStyles();
        }
    }

    _visualOrientation = VisualOrientation.horizontal;

    get visualOrientation() {
        return this._visualOrientation;
    }

    /**
     * The orientation of the button
     * @type {VisualOrientation}
     * @param {VisualOrientation} orientation - The orientation of the button
     */
    set visualOrientation(orientation) {
        if (!VisualOrientation[orientation]) {
            console.warn('Invalid orientation: "' + orientation + '"');
            return;
        }

        if (orientation !== this._visualOrientation) {
            this._visualOrientation = VisualOrientation[orientation];
            this._applyVisualOrientationStyles();
        }
    }

    drawsFocusOnPointerActivation = true;

    standardElementTagName = "BUTTON";

    hasTemplate = true;

    /**
     * A Mod converter object used to convert or format the label displayed by
     * the Button instance. When a new value is assigned to <code>label</code>,
     * the converter object's <code>convert()</code> method is invoked,
     * passing it the newly assigned label value.
     * @type {Property}
     * @default null
     */
    converter = null;

    _label = null;

    get label() {
        return this._label;
    }

    set label(value) {
        if (value !== this._label) {
            const isDefined = typeof value !== "undefined";

            if (isDefined && this.converter) {
                try {
                    value = this.converter.convert(value);

                    if (this.error) {
                        this.error = null;
                    }
                } catch (e) {
                    // unable to convert - maybe error
                    this.error = e;
                }
            }

            this._label = isDefined && value !== null ? String(value) : null;
            this.needsDraw = true;
        }
    }

    // <---- Life Cycle ---->

    enterDocument(firstDraw) {
        super.enterDocument?.call(this, firstDraw);

        if (firstDraw) {
            this.element.setAttribute("role", "button");

            const lastChild = this.element.lastChild;

            // Ensure that the last child is a text node
            // Any whitespace (including indentation) in the template will create a #text node
            // But just in case (compressed version) we still check if the last child is a text node
            if (!lastChild || lastChild.nodeType !== Node.TEXT_NODE) {
                // Create a text node if the last child is not a text node
                this.element.appendChild(document.createTextNode(""));
            }

            this._labelNode = this.element.lastChild;

            // Apply Button styles
            this._applyVisualPositionStyles();
            this._applyVisualOrientationStyles();
        }
    }

    /**
     * Draws the component.
     * @override
     */
    draw() {
        super.draw();

        if (this._labelNode) {
            this._labelNode.data = this.label;
        }
    }

    // <---- Private ---->

   
    /**
     * Applies the current image position's styling by updating CSS classes
     * @private
     * @see VisualPosition
     */
    _applyVisualPositionStyles() {
        this.classList.deleteEach(...Object.values(VisualPosition));
        this.classList.add(this.visualPosition);
    }

    /**
     * Applies the current orientation's styling by updating CSS classes
     * @private
     * @see VisualOrientation
     */
    _applyVisualOrientationStyles() {
        this.classList.deleteEach(...Object.values(VisualOrientation));
        this.classList.add(this.visualOrientation);
    }
});

Button.addAttributes({
    /** @lends module:"mod/ui/native/button.mod".Button# */

    /**
     * The URL to which the form data will be sumbitted.
     * @type {string}
     * @default null
     */
    formaction: null,

    /**
     * The content type used to submit the form to the server.
     * @type {string}
     * @default null
     */
    formenctype: null,

    /**
     * The HTTP method used to submit the form.
     * @type {string}
     * @default null
     */
    formmethod: null,

    /**
     * Indicates if the form should be validated upon submission.
     * @type {boolean}
     * @default null
     */
    formnovalidate: { dataType: "boolean" },

    /**
     * The target frame or window in which the form output should be rendered.
     * @type string}
     * @default null
     */
    formtarget: null,

    /**
     * A string indicating the input type of the component's element.
     * @type {string}
     * @default "button"
     */
    type: { value: "button" },

    /**
     * <strong>Use <code>label</code> to set the displayed text on the button</strong>
     * The value associated with the element. This sets the value attribute of
     * the button that gets sent when the form is submitted.
     * @type {string}
     * @default null
     * @see label
     */
    value: null,
});
