/*global require, exports, console, MontageElement */

var Control = require("ui/component").Component;

/**
 * @extends module:mod/ui/visual-style.mod
 */
var VisualStyle = exports.VisualStyle = class VisualStyle extends Component {

    baseSurfaceColor = VisualStyleProperty.withVariable("--mod-vs-base-surface-color");
    // raisedSurfaceColor;
    // elevatedSurfaceColor;
    controlBackgroundColor = VisualStyleProperty.withVariable("--mod-vs-control-background-color");
    controlSecondaryBackgroundColor = VisualStyleProperty.withVariable("--mod-vs-control-secondary-background-color");
    controlTertiaryBackgroundColor = VisualStyleProperty.withVariable("--mod-vs-control-tertiary-background-color");
    controlQuaternaryBackgroundColor = VisualStyleProperty.withVariable("--mod-vs-control-quaternary-background-color");
    controlColor = VisualStyleProperty.withVariable("--mod-vs-control-color");
    controlSecondaryColor = VisualStyleProperty.withVariable("--mod-vs-control-secondary-color");
    controlTertiaryColor = VisualStyleProperty.withVariable("--mod-vs-control-tertiary-color");
    controlQuaternaryColor = VisualStyleProperty.withVariable("--mod-vs-control-quaternary-color");
    controlSelectionColor = VisualStyleProperty.withVariable("--mod-vs-control-selection-color");
    controlSelectionBackgroundColor = VisualStyleProperty.withVariable("--mod-vs-control-selection-background-color");

    controlHoverColor = VisualStyleProperty.withVariable("--mod-vs-control-hover-color");
    // controlActiveColor;
    // controlFocusColor;


    // textColor;
    // secondaryTextColor;
    // tertiaryTextColor;
    // quaternaryTextColor;
    // linkTextColor;

    controlBorderColor = VisualStyleProperty.withVariable("--mod-vs-control-border-color");

    enterDocument(firstTime) {
        
    }

    apply() {
        var head = document.querySelector("head"),
            style = document.createElementNS("style"),
            rawCSS = "html, body {";

        rawCSS = this._addVariableForProperty("baseSurfaceColor", rawCSS);
        rawCSS += "} \n";

        style.innerHTML = rawCSS;
        head.appendChild(style);
    }

    _addVariableForProperty(name, rawCSS) {
        var property = this[name];
        if (property && property.value) {
            rawCSS += property.variableName + ": " + property.value + ";\n";
        }

        return rawCSS;
    }

    deserializeSelf(deserializer) {
        this._deserializeProperty("baseSurfaceColor");
        this._deserializeProperty("controlBackgroundColor");
        this._deserializeProperty("controlSecondaryBackgroundColor");
        this._deserializeProperty("controlTertiaryBackgroundColor");
        this._deserializeProperty("controlQuaternaryBackgroundColor");
        this._deserializeProperty("controlColor");
        this._deserializeProperty("controlSecondaryColor");
        this._deserializeProperty("controlTertiaryColor");
        this._deserializeProperty("controlQuaternaryColor");
        this._deserializeProperty("controlSelectionColor");
        this._deserializeProperty("controlSelectionBackgroundColor");
        this._deserializeProperty("controlHoverColor");
        this._deserializeProperty("controlBorderColor");
    }

    _deserializeProperty(deserializer, property) {
        var value = deserializer.getProperty(property);
        this[property].value = value ? value : this[property].value;
    }
}

class VisualStyleProperty {

    variableName;
    value;

    static withVariable (variable) {
        var property = new VariableStylePropery();
        property.variableName = variable;
        return property
    }

    static withVariableAndValue (variable, value) {
        var property = new VariableStylePropery();
        property.variableName = variable;
        property.value = value;
        return property;
    }

}

