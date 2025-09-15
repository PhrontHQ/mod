/*global require, exports, console, MontageElement */

var Montage = require("montage").Montage;


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

    {name: "controlBorderColor", variable: "--mod-vs-border-color", defaultValue: "hsla(0,0%,65%,1)"},

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

    


    constructor() {
        super();
        //TODO move the PROPERTIES down to real property definitions? Or make VisualStyleProperty an enum?
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
    }

    /** 
     * Scope in which to apply this visual style. E.g. 
     * 'acme-panel' could set the visual style for a panel branded for Acme co
     * 'slider' could set the visual style for all slider components
     */
    scope;

    /*
    * @type {Array<VisualStyle>}
    */
    scopedStyles;


    generateCSS() {
        let rawCSS;
        
        if (this.scope) {
            rawCSS = `@scope (.${this.scope}) {
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
        if (this.scopedStyles) {
            this.scopedStyles.forEach(function (scope) {
                rawCSS += `
                ${scope.generateCSS()}
                `;
            }, this);
        }
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

    _normalizeModuleId(moduleId) {
        if (moduleId.startsWith("mod/")) {
            moduleId = moduleId.replace("mod/", "");
        }
        return moduleId;
    }

    deserializeSelf(deserializer) {
        this.scope = deserializer.getProperty("scope");
        this.scopedStyles = deserializer.getProperty("scopedStyles");
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


    /********************************************
     * CSS Layer Proposal
     */

    /**
     * @type string
     * Allows the implementer to name the layer to which the visual style is applied. 
     * Undecided if this should be an arbitrary string or be an enum like (FRAMEWORK, ROOT, COMPONENT_CLASS, COMPONENT)
     */
    layer;

    /**
     * An alternative to 'layer' where the implementer simply assigns the priority of the rule. The range of priorities used is up to the implementer. 
     * 1 - Applied with maximum specificity and should never be overwritten by an outside rule
     * 2 - Applied for the majority of components, but can be overwritten at the base level. 
     * Undefined - Applied at the framework level. 
     */
    priority;

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

