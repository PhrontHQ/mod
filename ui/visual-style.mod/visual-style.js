/*global require, exports, console, MontageElement */

var Montage = require("montage").Montage,
    uuid = require("core/uuid");


var PROPERTIES = [
    {name: "baseSurfaceColor", variable: "--mod-vs-base-surface-color", defaultValue: "hsl(0, 0%, 100%)"},
    {name: "raisedSurfaceColor", variable: "--mod-vs-raised-surface-color", backup: "baseSurfaceColor"},
    {name: "elevatedSurfaceColor", variable: "--mod-vs-elevated-surface-color", backup: "baseSurfaceColor"},

    {name: "controlBackgroundColor", variable: "--mod-vs-control-background-color", defaultValue: "hsl(0,0%,86%)"},
    {name: "controlSecondaryBackgroundColor", variable: "--mod-vs-control-secondary-background-color", backup: "controlBackgroundColor"},
    {name: "controlTertiaryBackgroundColor", variable: "--mod-vs-control-tertiary-background-color", backup: "controlSecondaryBackgroundColor"},
    {name: "controlQuaternaryBackgroundColor", variable: "--mod-vs-control-quaternary-background-color", backup: "controlTertiaryBackgroundColor"},

    {name: "controlColor", variable: "--mod-vs-control-color", defaultValue: "linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,83%))"},
    {name: "controlSecondaryColor", variable: "--mod-vs-control-secondary-color", backup: "controlColor"},
    {name: "controlTertiaryColor", variable: "--mod-vs-control-tertiary-color", backup: "controlSecondaryColor"},
    {name: "controlQuaternaryColor", variable: "--mod-vs-control-quaternary-color", backup: "controlTertiaryColor"},

    {name: "controlBorderColor", variable: "--mod-vs-control-border-color", defaultValue: "hsla(0,0%,65%,1)"},
    {name: "controlBorderRadius", variable: "--mod-vs-control-border-radius", defaultValue: "8px"},

    {name: "controlSelectionColor", variable: "--mod-vs-control-selection-color", defaultValue: "hsl(211, 100%, 50%)"},
    {name: "controlSelectionBackgroundColor", variable: "--mod-vs-control-selection-background-color", backup: "controlBackgroundColor"},

    {name: "controlHoverColor", variable: "--mod-vs-control-hover-color", backup: "controlColor"},
    {name: "controlActiveColor", variable: "--mod-vs-control-active-color", backup: "controlSelectionColor"},
    {name: "controlFocusColor", variable: "--mod-vs-control-focus-color", backup: "controlActiveColor"},

    {name: "textColor", variable: "--mod-vs-text-color", defaultValue: "hsl(0, 0, 0)"},
    {name: "textSecondaryColor", variable: "--mod-vs-text-secondary-color", backup: "textColor"},
    {name: "textTertiaryColor", variable: "--mod-vs-text-tertiary-color", backup: "textSecondaryColor"},
    {name: "textQuaternaryColor", variable: "--mod-vs-text-quaternary-color", backup: "textTertiaryColor"},

    {name: "linkTextColor", variable: "--mod-vs-link-text-color", backup: "textColor"}
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
        var name = this.name || this.identifier;
        return `mod-vs-${name}`;
    }

    /** 
     * Create the CSS for this visual style
     */
    generateCSS(isRoot) {
        let rawCSS;
        
        if (!isRoot) {
            rawCSS = `@scope (.${this.scopeName}) {
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

