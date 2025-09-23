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
            expect(visualStyle.baseSurfaceFill.fallback).toBe(undefined);
            expect(visualStyle.raisedSurfaceFill.fallback).toBe(visualStyle.baseSurfaceFill);
            expect(visualStyle.elevatedSurfaceFill.fallback).toBe(visualStyle.baseSurfaceFill);

            expect(visualStyle.controlBackgroundFill.fallback).toBe(undefined);
            expect(visualStyle.controlSecondaryBackgroundFill.fallback).toBe(visualStyle.controlBackgroundFill, "control secondary bg color falls back to control bg color");
            expect(visualStyle.controlTertiaryBackgroundFill.fallback).toBe(visualStyle.controlSecondaryBackgroundFill, "control tertiary bg color falls back to control secondary bg color");
            expect(visualStyle.controlQuaternaryBackgroundFill.fallback).toBe(visualStyle.controlTertiaryBackgroundFill, "control quaternary bg color falls back to control tertiary bg color");

            expect(visualStyle.controlFill.fallback).toBe(undefined);
            expect(visualStyle.controlSecondaryFill.fallback).toBe(visualStyle.controlFill, "control secondary color falls back to control color");
            expect(visualStyle.controlTertiaryFill.fallback).toBe(visualStyle.controlSecondaryFill, "control secondary color falls back to control color");
            expect(visualStyle.controlQuaternaryFill.fallback).toBe(visualStyle.controlTertiaryFill, "control secondary color falls back to control color");

            expect(visualStyle.controlBorderFill.fallback).toBe(undefined);

            expect(visualStyle.controlSelectionFill.fallback).toBe(undefined);
            expect(visualStyle.controlSelectionBackgroundFill.fallback).toBe(visualStyle.controlBackgroundFill);

            expect(visualStyle.controlHoverFill.fallback).toBe(visualStyle.controlFill);
            expect(visualStyle.controlActiveFill.fallback).toBe(visualStyle.controlSelectionFill);
            expect(visualStyle.controlFocusFill.fallback).toBe(visualStyle.controlActiveFill);

            expect(visualStyle.textFill.fallback).toBe(undefined);
            expect(visualStyle.textSecondaryFill.fallback).toBe(visualStyle.textFill);
            expect(visualStyle.textTertiaryFill.fallback).toBe(visualStyle.textSecondaryFill);
            expect(visualStyle.textQuaternaryFill.fallback).toBe(visualStyle.textTertiaryFill);

            expect(visualStyle.linkTextFill.fallback).toBe(visualStyle.textFill);
        });

        it("defines a default value for visual style properties without fallbacks", function () {
            expect(visualStyle.baseSurfaceFill.value).toBeDefined("baseSurfaceFill value is defined");
            expect(visualStyle.controlBackgroundFill.value).toBeDefined("controlBackgroundFill value is defined");
            expect(visualStyle.controlFill.value).toBeDefined("controlFill value is defined");
            expect(visualStyle.controlBorderFill.value).toBeDefined("controlBorderFill value is defined");
            expect(visualStyle.controlSelectionFill.value).toBeDefined("controlSelectionFill value is defined");
            expect(visualStyle.textFill.value).toBeDefined("textFill value is defined");
        });
    });

    describe("css output", function () {

        it("can generate the default visual style", function () {
            var expectedOutput = `
                html, body {
                --visual-style-base-surface-fill: hsl(0, 0%, 100%);
            --visual-style-raised-surface-fill: hsl(0, 0%, 100%);
            --visual-style-elevated-surface-fill: hsl(0, 0%, 100%);
            --visual-style-control-background-fill: hsl(0,0%,86%);
            --visual-style-control-secondary-background-fill: hsl(0,0%,86%);
            --visual-style-control-tertiary-background-fill: hsl(0,0%,86%);
            --visual-style-control-quaternary-background-fill: hsl(0,0%,86%);
            --visual-style-control-fill: hsl(0, 0%, 93%);
            --visual-style-control-secondary-fill: hsl(0, 0%, 93%);
            --visual-style-control-tertiary-fill: hsl(0, 0%, 93%);
            --visual-style-control-quaternary-fill: hsl(0, 0%, 93%);
            --visual-style-control-border-fill: hsl(0, 0%, 80%);
            --visual-style-control-border-radius: 8px;
            --visual-style-control-border-width: 1px;
            --visual-style-control-buffer: .625em 1em;
            --visual-style-control-label-fill: hsla(0, 0%, 0%, .7);
            --visual-style-control-label-size: 12px;
            --visual-style-control-selection-fill: hsl(211, 100%, 50%);
            --visual-style-control-selection-background-fill: hsl(0,0%,86%);
            --visual-style-control-hover-fill: hsl(0, 0%, 93%);
            --visual-style-control-active-fill: hsl(211, 100%, 50%);
            --visual-style-control-focus-fill: hsl(211, 100%, 50%);
            --visual-style-text-fill: hsla(0, 0%, 0%, .7);
            --visual-style-text-secondary-fill: hsla(0, 0%, 0%, .7);
            --visual-style-text-tertiary-fill: hsla(0, 0%, 0%, .7);
            --visual-style-text-quaternary-fill: hsla(0, 0%, 0%, .7);
            --visual-style-text-size: 12px;
            --visual-style-link-text-fill: hsla(0, 0%, 0%, .7);
            }
            `;


            expect(visualStyle.generateCSS(true)).toEqual(expectedOutput);
        })

        it("can generate a visual style with hierarchy", function () {
            var expectedOutput = `
                html, body {
                --visual-style-base-surface-fill: hsl(0, 0%, 100%);
            --visual-style-raised-surface-fill: hsl(0, 0%, 100%);
            --visual-style-elevated-surface-fill: hsl(0, 0%, 100%);
            --visual-style-control-background-fill: #888;
            --visual-style-control-secondary-background-fill: #777;
            --visual-style-control-tertiary-background-fill: #777;
            --visual-style-control-quaternary-background-fill: #777;
            --visual-style-control-fill: #F00;
            --visual-style-control-secondary-fill: #E00;
            --visual-style-control-tertiary-fill: #D00;
            --visual-style-control-quaternary-fill: #D00;
            --visual-style-control-border-fill: hsl(0, 0%, 80%);
            --visual-style-control-border-radius: 8px;
            --visual-style-control-border-width: 1px;
            --visual-style-control-buffer: .625em 1em;
            --visual-style-control-label-fill: #484;
            --visual-style-control-label-size: 12px;
            --visual-style-control-selection-fill: #0F0;
            --visual-style-control-selection-background-fill: #0D0;
            --visual-style-control-hover-fill: #F00;
            --visual-style-control-active-fill: #0FF;
            --visual-style-control-focus-fill: #0FF;
            --visual-style-text-fill: #484;
            --visual-style-text-secondary-fill: #666;
            --visual-style-text-tertiary-fill: #777;
            --visual-style-text-quaternary-fill: #777;
            --visual-style-text-size: 12px;
            --visual-style-link-text-fill: #484;
            }
            `;
            visualStyle.controlBackgroundFill.value = "#888";
            visualStyle.controlSecondaryBackgroundFill.value = "#777";
            visualStyle.controlFill.value = "#F00";
            visualStyle.controlSecondaryFill.value = "#E00"; 
            visualStyle.controlTertiaryFill.value = "#D00"; 
            visualStyle.controlQuaternaryFill.value = "#D00"; 
            visualStyle.controlSelectionFill.value = "#0F0";
            visualStyle.controlSelectionBackgroundFill.value = "#0D0";
            visualStyle.controlActiveFill.value = "#0FF";
            visualStyle.textFill.value = "#484";
            visualStyle.textSecondaryFill.value = "#666";
            visualStyle.textTertiaryFill.value = "#777";
            visualStyle.textQuaternaryFill.value = "#777";

            expect(visualStyle.generateCSS(true)).toEqual(expectedOutput);
        })

        it("can generate a scoped visual style", function () {
            var expectedOutput = `
    @scope([data-visual-style="scope"]) {
            --visual-style-base-surface-fill: hsl(0, 0%, 100%);
            --visual-style-raised-surface-fill: hsl(0, 0%, 100%);
            --visual-style-elevated-surface-fill: hsl(0, 0%, 100%);
            --visual-style-control-background-fill: hsl(0,0%,86%);
            --visual-style-control-secondary-background-fill: hsl(0, 0%, 86%);
            --visual-style-control-tertiary-background-fill: hsl(0, 0%, 86%);
            --visual-style-control-quaternary-background-fill: hsl(0, 0%, 86%);
            --visual-style-control-fill: #F00;
            --visual-style-control-secondary-fill: #E00;
            --visual-style-control-tertiary-fill: #D00;
            --visual-style-control-quaternary-fill: #D00;
            --visual-style-control-border-fill: hsl(0, 0%, 80%);
            --visual-style-control-border-radius: 8px;
            --visual-style-control-border-width: 1px;
            --visual-style-control-buffer: .625em 1em;
            --visual-style-control-label-fill: #222;
            --visual-style-control-label-size: 12px;
            --visual-style-control-selection-fill: hsl(211, 100%, 50%);
            --visual-style-control-selection-background-fill: hsl(0, 0%, 86%);
            --visual-style-control-hover-fill: #F00;
            --visual-style-control-active-fill: hsl(211, 100%, 50%);
            --visual-style-control-focus-fill: hsl(211, 100%, 50%);
            --visual-style-text-fill: #222;
            --visual-style-text-secondary-fill: #222;
            --visual-style-text-tertiary-fill: #222;
            --visual-style-text-quaternary-fill: #222;
            --visual-style-text-size: 12px;
            --visual-style-link-text-fill: #222;
        }
            `;
            visualStyle.name = "scope";

            visualStyle.controlFill.value = "#F00";
            visualStyle.controlSecondaryFill.value = "#E00";
            visualStyle.controlTertiaryFill.value = "#D00";
            visualStyle.controlQuaternaryFill.value = "#D00";
            visualStyle.textFill.value = "#222";

            expect(visualStyle.generateCSS()).toEqual(expectedOutput);
        })
            
    });

});
