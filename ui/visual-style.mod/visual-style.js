/*global require, exports, console, MontageElement */

var Montage = require("montage").Montage,
    uuid = require("core/uuid");


var PROPERTIES = [
    {name: "baseSurfaceFill", variable: "--visual-style-base-surface-fill", defaultValue: "hsl(0, 0%, 100%)"},
    {name: "raisedSurfaceFill", variable: "--visual-style-raised-surface-fill", backup: "baseSurfaceFill"},
    {name: "elevatedSurfaceFill", variable: "--visual-style-elevated-surface-fill", backup: "baseSurfaceFill"},

    {name: "controlBackgroundFill", variable: "--visual-style-control-background-fill", defaultValue: "hsl(0, 0%, 86%)"},
    {name: "controlSecondaryBackgroundFill", variable: "--visual-style-control-secondary-background-fill", backup: "controlBackgroundFill"},
    {name: "controlTertiaryBackgroundFill", variable: "--visual-style-control-tertiary-background-fill", backup: "controlSecondaryBackgroundFill"},
    {name: "controlQuaternaryBackgroundFill", variable: "--visual-style-control-quaternary-background-fill", backup: "controlTertiaryBackgroundFill"},

    {name: "controlFill", variable: "--visual-style-control-fill", defaultValue: "hsl(0, 0%, 93%)"},
    {name: "controlSecondaryFill", variable: "--visual-style-control-secondary-fill", backup: "controlFill"},
    {name: "controlTertiaryFill", variable: "--visual-style-control-tertiary-fill", backup: "controlSecondaryFill"},
    {name: "controlQuaternaryFill", variable: "--visual-style-control-quaternary-fill", backup: "controlTertiaryFill"},

    {name: "controlBorderFill", variable: "--visual-style-control-border-fill", defaultValue: "hsl(0, 0%, 80%)"},
    {name: "controlBorderRadius", variable: "--visual-style-control-border-radius", defaultValue: "8px"},
    {name: "controlBorderWidth", variable: "--visual-style-control-border-width", defaultValue: "1px"},
    {name: "controlBuffer", variable: "--visual-style-control-buffer", defaultValue: ".625em 1em"},

    {name: "controlLabelFill", variable: "--visual-style-control-label-fill", backup: "textFill"},
    {name: "controlLabelSize", variable: "--visual-style-control-label-size", backup: "textSize"},

    {name: "controlSelectionFill", variable: "--visual-style-control-selection-fill", defaultValue: "hsl(211, 100%, 50%)"},
    {name: "controlSelectionBackgroundFill", variable: "--visual-style-control-selection-background-fill", backup: "controlBackgroundFill"},

    {name: "controlHoverFill", variable: "--visual-style-control-hover-fill", backup: "controlFill"},
    {name: "controlActiveFill", variable: "--visual-style-control-active-fill", backup: "controlSelectionFill"},
    {name: "controlFocusFill", variable: "--visual-style-control-focus-fill", backup: "controlActiveFill"},

    {name: "textFill", variable: "--visual-style-text-fill", defaultValue: "hsla(0, 0%, 0%, .7)"},
    {name: "textSecondaryFill", variable: "--visual-style-text-secondary-fill", backup: "textFill"},
    {name: "textTertiaryFill", variable: "--visual-style-text-tertiary-fill", backup: "textSecondaryFill"},
    {name: "textQuaternaryFill", variable: "--visual-style-text-quaternary-fill", backup: "textTertiaryFill"},

    {name: "textErrorFill", variable: "--visual-style-text-error-fill", backup: "textFill"},

    {name: "textSize", variable: "--visual-style-text-size", defaultValue: "12px"},

    {name: "linkTextFill", variable: "--visual-style-link-text-fill", backup: "textFill"}
    
]
/**
 * @extends module:mod/ui/visual-style.mod
 */
exports.VisualStyle = class VisualStyle extends Montage {


    /*************
     * Additional Considerations / TODOs
     * See ./notes.md
     */

    constructor() {
        super();
        PROPERTIES.forEach(function (property) {
            this[property.name] = new VisualStyleProperty();
            this[property.name].variableName = property.variable;
            this[property.name].value = property.defaultValue;
        }, this);
        
        PROPERTIES.forEach(function (property) {
            if (this[property.name] && this[property.backup]) {
                this[property.name].fallback = this[property.backup];
            }
        }, this);
        this.identifier = uuid.generate();

    }

    /** 
     * Name of this visual style.
     */
    name;


    /** 
     * The scope in which to apply this visual style. Derived from the name.
     * If no name is provided, the scope will be generated from the identifer
     */
    get scopeName() {
        return this.name || this.identifier;
    }

    /** 
     * Create the CSS for this visual style
     */
    generateCSS(isRoot) {
        let rawCSS;
        
        if (!isRoot) {
            rawCSS = `@scope ([data-visual-style="${this.scopeName}"]) {
            `;
        } else {
            rawCSS = `
                html, body {
                `;
        }


        PROPERTIES.forEach(function (property) {
            rawCSS = this._addVariableForProperty(property.name, rawCSS);
        }, this);
        rawCSS += `}
        `;
        
        return rawCSS;
    }

    _addVariableForProperty(name, rawCSS) {
        var property = this[name],
            value = this._getValueFor(name);

        if (value) {
            rawCSS += `${property.variableName}: ${value};
            `;
        }

        return rawCSS;
    }

    _getValueFor(name) {
        var property = this[name],
            value;

        while (!value && property) {
            value = property.value;
            property = property.fallback;
        }

        return value;
    }

    deserializeSelf(deserializer) {
        this.name = deserializer.getProperty("name");
        this._deserializeProperty(deserializer, "baseSurfaceFill");
        this._deserializeProperty(deserializer, "raisedSurfaceFill");
        this._deserializeProperty(deserializer, "elevatedSurfaceFill");
        this._deserializeProperty(deserializer, "controlBackgroundFill");
        this._deserializeProperty(deserializer, "controlSecondaryBackgroundFill");
        this._deserializeProperty(deserializer, "controlTertiaryBackgroundFill");
        this._deserializeProperty(deserializer, "controlQuaternaryBackgroundFill");
        this._deserializeProperty(deserializer, "controlFill");
        this._deserializeProperty(deserializer, "controlSecondaryFill");
        this._deserializeProperty(deserializer, "controlTertiaryFill");
        this._deserializeProperty(deserializer, "controlQuaternaryFill");
        this._deserializeProperty(deserializer, "controlBorderFill");
        this._deserializeProperty(deserializer, "controlBorderRadius");
        this._deserializeProperty(deserializer, "controlBorderWidth");
        this._deserializeProperty(deserializer, "controlBuffer");
        this._deserializeProperty(deserializer, "controlLabelFill");
        this._deserializeProperty(deserializer, "controlLabelSize");
        this._deserializeProperty(deserializer, "controlHoverFill");
        this._deserializeProperty(deserializer, "controlActiveFill");
        this._deserializeProperty(deserializer, "controlFocusFill");
        this._deserializeProperty(deserializer, "controlSelectionFill");
        this._deserializeProperty(deserializer, "controlSelectionBackgroundFill");
        this._deserializeProperty(deserializer, "textFill");
        this._deserializeProperty(deserializer, "textSecondaryFill");
        this._deserializeProperty(deserializer, "textTertiaryFill");
        this._deserializeProperty(deserializer, "textQuaternaryFill");
        this._deserializeProperty(deserializer, "textSize");
        this._deserializeProperty(deserializer, "linkTextFill");
    }

    _deserializeProperty(deserializer, property) {
        var value = deserializer.getProperty(property);
        this[property].value = value ? value : this[property].value;
    }

}

class VisualStyleProperty {

    fallback;
    variableName;
    value;

    static withVariable (variable) {
        var property = new VisualStyleProperty();
        property.variableName = variable;
        return property
    }

    static withVariableAndFallback(variable, fallback) {
        var property = this.withVariable(variable);
        property.fallback = fallback;
        return property;
    }

    static withVariableAndValue(variable, value) {
        var property = this.withVariable(variable);
        property.value = value;
        return property;
    }

    static withVariableFallbackAndValue (variable, fallback, value) {
        var property = this.withVariableAndFallback(variable, fallback);
        property.value = value;
        return property;
    }

}

