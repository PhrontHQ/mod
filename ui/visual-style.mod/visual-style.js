/*global require, exports, console, MontageElement */

var Montage = require("montage").Montage,
    uuid = require("core/uuid");


var PROPERTIES = [
    {name: "baseSurfaceColor", variable: "--visual-style-base-surface-color", defaultValue: "hsl(0, 0%, 100%)"},
    {name: "baseFill", variable: "--visual-style-base-fill", defaultValue: "hsl(0, 0%, 100%)"},
    {name: "raisedSurfaceColor", variable: "--visual-style-raised-surface-color", backup: "baseSurfaceColor"},
    {name: "elevatedSurfaceColor", variable: "--visual-style-elevated-surface-color", backup: "baseSurfaceColor"},

    {name: "controlBackgroundColor", variable: "--visual-style-control-background-color", defaultValue: "hsl(0,0%,86%)"},
    {name: "controlSecondaryBackgroundColor", variable: "--visual-style-control-secondary-background-color", backup: "controlBackgroundColor"},
    {name: "controlTertiaryBackgroundColor", variable: "--visual-style-control-tertiary-background-color", backup: "controlSecondaryBackgroundColor"},
    {name: "controlQuaternaryBackgroundColor", variable: "--visual-style-control-quaternary-background-color", backup: "controlTertiaryBackgroundColor"},

    {name: "controlColor", variable: "--visual-style-control-color", defaultValue: "hsl(0, 0%, 93%)"},
    {name: "controlSecondaryColor", variable: "--visual-style-control-secondary-color", backup: "controlColor"},
    {name: "controlTertiaryColor", variable: "--visual-style-control-tertiary-color", backup: "controlSecondaryColor"},
    {name: "controlQuaternaryColor", variable: "--visual-style-control-quaternary-color", backup: "controlTertiaryColor"},

    {name: "controlBorderColor", variable: "--visual-style-control-border-color", defaultValue: "hsl(0, 0%, 80%)"},
    {name: "controlBorderRadius", variable: "--visual-style-control-border-radius", defaultValue: "8px"},
    {name: "controlBorderWidth", variable: "--visual-style-control-border-width", defaultValue: "1px"},
    {name: "controlBuffer", variable: "--visual-style-control-buffer", defaultValue: ".625em 1em"},

    {name: "controlTextWeight", variable: "--visual-style-control-text-weight", defaultValue: "normal"},

    {name: "controlSelectionColor", variable: "--visual-style-control-selection-color", defaultValue: "hsl(211, 100%, 50%)"},
    {name: "controlSelectionBackgroundColor", variable: "--visual-style-control-selection-background-color", backup: "controlBackgroundColor"},

    {name: "controlHoverColor", variable: "--visual-style-control-hover-color", backup: "controlColor"},
    {name: "controlActiveColor", variable: "--visual-style-control-active-color", backup: "controlSelectionColor"},
    {name: "controlFocusColor", variable: "--visual-style-control-focus-color", backup: "controlActiveColor"},

    {name: "textColor", variable: "--visual-style-text-color", defaultValue: "hsla(0, 0%, 0%, .7)"},
    {name: "textSecondaryColor", variable: "--visual-style-text-secondary-color", backup: "textColor"},
    {name: "textTertiaryColor", variable: "--visual-style-text-tertiary-color", backup: "textSecondaryColor"},
    {name: "textQuaternaryColor", variable: "--visual-style-text-quaternary-color", backup: "textTertiaryColor"},


    {name: "linkTextColor", variable: "--visual-style-link-text-color", backup: "textColor"},

    
]
/**
 * @extends module:mod/ui/visual-style.mod
 */
var VisualStyle = exports.VisualStyle = class VisualStyle extends Montage {


    /*************
     * Additional Considerations / TODOs
     * 1. Move the PROPERTIES down to property definitions instead of a pseudo-serialization? Or make VisualStyleProperty an enum?
     * 2. Allow components to reference any visual style defined elsewhere in the application. A map on VisualStyle?
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
        this._deserializeProperty(deserializer, "baseSurfaceColor");
        this._deserializeProperty(deserializer, "controlBackgroundColor");
        this._deserializeProperty(deserializer, "controlSecondaryBackgroundColor");
        this._deserializeProperty(deserializer, "controlTertiaryBackgroundColor");
        this._deserializeProperty(deserializer, "controlQuaternaryBackgroundColor");
        this._deserializeProperty(deserializer, "controlColor");
        this._deserializeProperty(deserializer, "controlSecondaryColor");
        this._deserializeProperty(deserializer, "controlTertiaryColor");
        this._deserializeProperty(deserializer, "controlQuaternaryColor");
        this._deserializeProperty(deserializer, "controlSelectionColor");
        this._deserializeProperty(deserializer, "controlSelectionBackgroundColor");
        this._deserializeProperty(deserializer, "controlHoverColor");
        this._deserializeProperty(deserializer, "controlBorderColor");
        
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

