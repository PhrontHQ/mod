/**
    @module "mod/ui/native/textarea.mod"
*/

var TextInput = require("ui/text-input").TextInput;

/**
 * Wraps the a &lt;textarea> element with binding support for the element's standard attributes. Uses an ArrayController instance to manage the element's contents and selection.
   @class module:"mod/ui/native/textarea.mod".Textarea
   @extends module:mod/ui/text-input.TextInput
 */

var TextArea = exports.TextArea = TextInput.specialize(/** @lends module:"mod/ui/native/textarea.mod".Textarea# */ {
    hasTemplate: {value: true }
});

TextArea.addAttributes( /** @lends module:"mod/ui/native/textarea.mod".Textarea# */ {

/**
    The maximum number of characters per line of text to display.
    @type {number}
    @default null
*/
        cols: null,

/**
    The number of lines of text the browser should render for the textarea.
    @type {number}
    @default null
*/
        rows: null,

/**
    If the value of this property is "hard", the browser will insert line breaks such that each line of user input has no more characters than the value specified by the <code>cols</code> property. If the value is "soft" then no line breaks will be added.
    @type {string}
    @default
*/
        wrap: null
});
