var VisualStyle = require("mod/ui/visual-style.mod").VisualStyle;

describe("test/ui/visual-style-spec", function () {
    var visualStyle;
    function compareLongString(stringA, stringB) {
        var stringA, stringB;
        if (typeof stringA === 'string' && typeof stringB === 'string') {
            stringA = stringA.replace(/\s/g, "").replace(/\n/g, "");
            stringB = stringB.replace(/\s/g, "").replace(/\n/g, "");

            return stringA === stringB;
        }
        return;
    }

    beforeEach(function () {
        visualStyle = new VisualStyle();
        jasmine.addCustomEqualityTester(compareLongString);
    });

    describe("default styles", function () {
        it("defines the hierarchy of visual style properties", function () {
            expect(visualStyle.baseSurfaceColor.fallback).toBe(undefined);
            expect(visualStyle.raisedSurfaceColor.fallback).toBe(visualStyle.baseSurfaceColor);
            expect(visualStyle.elevatedSurfaceColor.fallback).toBe(visualStyle.baseSurfaceColor);

            expect(visualStyle.controlBackgroundColor.fallback).toBe(undefined);
            expect(visualStyle.controlSecondaryBackgroundColor.fallback).toBe(visualStyle.controlBackgroundColor, "control secondary bg color falls back to control bg color");
            expect(visualStyle.controlTertiaryBackgroundColor.fallback).toBe(visualStyle.controlSecondaryBackgroundColor, "control tertiary bg color falls back to control secondary bg color");
            expect(visualStyle.controlQuaternaryBackgroundColor.fallback).toBe(visualStyle.controlTertiaryBackgroundColor, "control quaternary bg color falls back to control tertiary bg color");

            expect(visualStyle.controlColor.fallback).toBe(undefined);
            expect(visualStyle.controlSecondaryColor.fallback).toBe(visualStyle.controlColor, "control secondary color falls back to control color");
            expect(visualStyle.controlTertiaryColor.fallback).toBe(visualStyle.controlSecondaryColor, "control secondary color falls back to control color");
            expect(visualStyle.controlQuaternaryColor.fallback).toBe(visualStyle.controlTertiaryColor, "control secondary color falls back to control color");

            expect(visualStyle.controlBorderColor.fallback).toBe(undefined);

            expect(visualStyle.controlSelectionColor.fallback).toBe(undefined);
            expect(visualStyle.controlSelectionBackgroundColor.fallback).toBe(visualStyle.controlBackgroundColor);

            expect(visualStyle.controlHoverColor.fallback).toBe(visualStyle.controlColor);
            expect(visualStyle.controlActiveColor.fallback).toBe(visualStyle.controlSelectionColor);
            expect(visualStyle.controlFocusColor.fallback).toBe(visualStyle.controlActiveColor);

            expect(visualStyle.textColor.fallback).toBe(undefined);
            expect(visualStyle.textSecondaryColor.fallback).toBe(visualStyle.textColor);
            expect(visualStyle.textTertiaryColor.fallback).toBe(visualStyle.textSecondaryColor);
            expect(visualStyle.textQuaternaryColor.fallback).toBe(visualStyle.textTertiaryColor);

            expect(visualStyle.linkTextColor.fallback).toBe(visualStyle.textColor);
        });

        it("defines a default value for visual style properties without fallbacks", function () {
            expect(visualStyle.baseSurfaceColor.value).toBeDefined("baseSurfaceColor value is defined");
            expect(visualStyle.controlBackgroundColor.value).toBeDefined("controlBackgroundColor value is defined");
            expect(visualStyle.controlColor.value).toBeDefined("controlColor value is defined");
            expect(visualStyle.controlBorderColor.value).toBeDefined("controlBorderColor value is defined");
            expect(visualStyle.controlSelectionColor.value).toBeDefined("controlSelectionColor value is defined");
            expect(visualStyle.textColor.value).toBeDefined("textColor value is defined");
        });
    });

    describe("css output", function () {

        it("can generate the default visual style", function () {
            var expectedOutput = `
                html, body {
                --visual-style-base-surface-color: hsl(0, 0%, 100%);
            --visual-style-raised-surface-color: hsl(0, 0%, 100%);
            --visual-style-elevated-surface-color: hsl(0, 0%, 100%);
            --visual-style-control-background-color: hsl(0,0%,86%);
            --visual-style-control-secondary-background-color: hsl(0,0%,86%);
            --visual-style-control-tertiary-background-color: hsl(0,0%,86%);
            --visual-style-control-quaternary-background-color: hsl(0,0%,86%);
            --visual-style-control-color: linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,83%));
            --visual-style-control-secondary-color: linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,83%));
            --visual-style-control-tertiary-color: linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,83%));
            --visual-style-control-quaternary-color: linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,83%));
            --visual-style-control-border-color: hsla(0,0%,65%,1);
            --visual-style-control-border-radius: 8px;
            --visual-style-control-selection-color: hsl(211, 100%, 50%);
            --visual-style-control-selection-background-color: hsl(0,0%,86%);
            --visual-style-control-hover-color: linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,83%));
            --visual-style-control-active-color: hsl(211, 100%, 50%);
            --visual-style-control-focus-color: hsl(211, 100%, 50%);
            --visual-style-text-color: hsl(0, 0, 0);
            --visual-style-text-secondary-color: hsl(0, 0, 0);
            --visual-style-text-tertiary-color: hsl(0, 0, 0);
            --visual-style-text-quaternary-color: hsl(0, 0, 0);
            --visual-style-link-text-color: hsl(0, 0, 0);
            }
            `;

            expect(visualStyle.generateCSS(true)).toEqual(expectedOutput);
        })

        it("can generate a visual style with hierarchy", function () {
            var expectedOutput = `
                html, body {
                --visual-style-base-surface-color: hsl(0, 0%, 100%);
            --visual-style-raised-surface-color: hsl(0, 0%, 100%);
            --visual-style-elevated-surface-color: hsl(0, 0%, 100%);
            --visual-style-control-background-color: #888;
            --visual-style-control-secondary-background-color: #777;
            --visual-style-control-tertiary-background-color: #777;
            --visual-style-control-quaternary-background-color: #777;
            --visual-style-control-color: #F00;
            --visual-style-control-secondary-color: #E00;
            --visual-style-control-tertiary-color: #D00;
            --visual-style-control-quaternary-color: #D00;
            --visual-style-control-border-color: hsla(0,0%,65%,1);
            --visual-style-control-border-radius: 8px;
            --visual-style-control-selection-color: #0F0;
            --visual-style-control-selection-background-color: #0D0;
            --visual-style-control-hover-color: #F00;
            --visual-style-control-active-color: #0FF;
            --visual-style-control-focus-color: #0FF;
            --visual-style-text-color: #484;
            --visual-style-text-secondary-color: #666;
            --visual-style-text-tertiary-color: #777;
            --visual-style-text-quaternary-color: #777;
            --visual-style-link-text-color: #484;
            }
            `;
            visualStyle.controlBackgroundColor.value = "#888";
            visualStyle.controlSecondaryBackgroundColor.value = "#777";
            visualStyle.controlColor.value = "#F00";
            visualStyle.controlSecondaryColor.value = "#E00"; 
            visualStyle.controlTertiaryColor.value = "#D00"; 
            visualStyle.controlQuaternaryColor.value = "#D00"; 
            visualStyle.controlSelectionColor.value = "#0F0";
            visualStyle.controlSelectionBackgroundColor.value = "#0D0";
            visualStyle.controlActiveColor.value = "#0FF";
            visualStyle.textColor.value = "#484";
            visualStyle.textSecondaryColor.value = "#666";
            visualStyle.textTertiaryColor.value = "#777";
            visualStyle.textQuaternaryColor.value = "#777";

            expect(visualStyle.generateCSS(true)).toEqual(expectedOutput);
        })

        it("can generate a scoped visual style", function () {
            var expectedOutput = `
            @scope(.mod-vs-scope) {
                --visual-style-base-surface-color: hsl(0, 0%, 100%);
                --visual-style-raised-surface-color: hsl(0, 0%, 100%);
                --visual-style-elevated-surface-color: hsl(0, 0%, 100%);
                --visual-style-control-background-color: hsl(0,0%,86%);
                --visual-style-control-secondary-background-color: hsl(0,0%,86%);
                --visual-style-control-tertiary-background-color: hsl(0,0%,86%);
                --visual-style-control-quaternary-background-color: hsl(0,0%,86%);
                --visual-style-control-color: #F00;
                --visual-style-control-secondary-color: #E00;
                --visual-style-control-tertiary-color: #D00;
                --visual-style-control-quaternary-color: #D00;
                --visual-style-control-border-color: hsla(0,0%,65%,1);
                --visual-style-control-border-radius: 8px;
                --visual-style-control-selection-color: hsl(211, 100%, 50%);
                --visual-style-control-selection-background-color: hsl(0,0%,86%);
                --visual-style-control-hover-color: #F00;
                --visual-style-control-active-color: hsl(211, 100%, 50%);
                --visual-style-control-focus-color: hsl(211, 100%, 50%);
                --visual-style-text-color: #222;
                --visual-style-text-secondary-color: #222;
                --visual-style-text-tertiary-color: #222;
                --visual-style-text-quaternary-color: #222;
                --visual-style-link-text-color: #222;
            }
            `;
            visualStyle.name = "scope";

            visualStyle.controlColor.value = "#F00";
            visualStyle.controlSecondaryColor.value = "#E00";
            visualStyle.controlTertiaryColor.value = "#D00";
            visualStyle.controlQuaternaryColor.value = "#D00";
            visualStyle.textColor.value = "#222";

            expect(visualStyle.generateCSS()).toEqual(expectedOutput);
        })
            
    });

});
