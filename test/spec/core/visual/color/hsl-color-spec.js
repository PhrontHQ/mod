const HslColor = require("mod/core/visual/color/hsl-color").HslColor;

describe("mod/core/visual/color/hsl-color-spec", function () {
    describe("Constructor", function () {
        it("should create a color with default values", function () {
            const color = new HslColor();
            expect(color.hue).toBe(0);
            expect(color.saturation).toBe(0);
            expect(color.lightness).toBe(0);
            expect(color.alpha).toBe(1);
        });

        it("should create a color with specified HSLA values", function () {
            const color = new HslColor(240, 75, 60, 0.8);
            expect(color.hue).toBe(240);
            expect(color.saturation).toBe(75);
            expect(color.lightness).toBe(60);
            expect(color.alpha).toBe(0.8);
        });

        it("should throw error for invalid hue", function () {
            expect(function () {
                new HslColor(-1, 50, 50);
            }).toThrow(new Error("Hue value must be between 0 and 360"));

            expect(function () {
                new HslColor(361, 50, 50);
            }).toThrow(new Error("Hue value must be between 0 and 360"));

            expect(function () {
                new HslColor("invalid", 50, 50);
            }).toThrow(new Error("Hue value must be between 0 and 360"));
        });

        it("should throw error for invalid saturation", function () {
            expect(function () {
                new HslColor(0, -1, 50);
            }).toThrow(new Error("Saturation value must be between 0 and 100"));

            expect(function () {
                new HslColor(0, 101, 50);
            }).toThrow(new Error("Saturation value must be between 0 and 100"));
        });

        it("should throw error for invalid lightness", function () {
            expect(function () {
                new HslColor(0, 50, -1);
            }).toThrow(new Error("Lightness value must be between 0 and 100"));

            expect(function () {
                new HslColor(0, 50, 101);
            }).toThrow(new Error("Lightness value must be between 0 and 100"));
        });
    });

    describe("Static Color Constants", function () {
        it("should provide transparent color", function () {
            const transparent = HslColor.transparent;
            expect(transparent.hue).toBe(0);
            expect(transparent.saturation).toBe(0);
            expect(transparent.lightness).toBe(0);
            expect(transparent.alpha).toBe(0);
        });

        it("should provide white color", function () {
            const white = HslColor.white;
            expect(white.hue).toBe(0);
            expect(white.saturation).toBe(0);
            expect(white.lightness).toBe(100);
            expect(white.alpha).toBe(1);
        });

        it("should provide black color", function () {
            const black = HslColor.black;
            expect(black.hue).toBe(0);
            expect(black.saturation).toBe(0);
            expect(black.lightness).toBe(0);
            expect(black.alpha).toBe(1);
        });

        it("should cache color instances", function () {
            const transparent1 = HslColor.transparent;
            const transparent2 = HslColor.transparent;
            expect(transparent1).toBe(transparent2);

            const white1 = HslColor.white;
            const white2 = HslColor.white;
            expect(white1).toBe(white2);

            const black1 = HslColor.black;
            const black2 = HslColor.black;
            expect(black1).toBe(black2);
        });
    });

    describe("Validation Methods", function () {
        describe("isValidHue", function () {
            it("should validate hue values", function () {
                expect(HslColor.isValidHue(0)).toBe(true);
                expect(HslColor.isValidHue(180)).toBe(true);
                expect(HslColor.isValidHue(360)).toBe(true);
                expect(HslColor.isValidHue(-1)).toBe(false);
                expect(HslColor.isValidHue(361)).toBe(false);
                expect(HslColor.isValidHue("invalid")).toBe(false);
            });
        });

        describe("isValidSaturation", function () {
            it("should validate saturation values", function () {
                expect(HslColor.isValidSaturation(0)).toBe(true);
                expect(HslColor.isValidSaturation(50)).toBe(true);
                expect(HslColor.isValidSaturation(100)).toBe(true);
                expect(HslColor.isValidSaturation(-1)).toBe(false);
                expect(HslColor.isValidSaturation(101)).toBe(false);
            });
        });

        describe("isValidLightness", function () {
            it("should validate lightness values", function () {
                expect(HslColor.isValidLightness(0)).toBe(true);
                expect(HslColor.isValidLightness(50)).toBe(true);
                expect(HslColor.isValidLightness(100)).toBe(true);
                expect(HslColor.isValidLightness(-1)).toBe(false);
                expect(HslColor.isValidLightness(101)).toBe(false);
            });
        });

        describe("isValidAlphaValue", function () {
            it("should validate alpha values", function () {
                expect(HslColor.isValidAlphaValue(0)).toBe(true);
                expect(HslColor.isValidAlphaValue(0.5)).toBe(true);
                expect(HslColor.isValidAlphaValue(1)).toBe(true);
                expect(HslColor.isValidAlphaValue(-0.1)).toBe(false);
                expect(HslColor.isValidAlphaValue(1.1)).toBe(false);
            });
        });

        describe("isValidHexColorString", function () {
            it("should validate hex color strings", function () {
                expect(HslColor.isValidHexColorString("#fff")).toBe(true);
                expect(HslColor.isValidHexColorString("#ffffff")).toBe(true);
                expect(HslColor.isValidHexColorString("#ffffffff")).toBe(true);
                expect(HslColor.isValidHexColorString("fff")).toBe(true);
                expect(HslColor.isValidHexColorString("ffffff")).toBe(true);
                expect(HslColor.isValidHexColorString("#ff")).toBe(false);
                expect(HslColor.isValidHexColorString("invalid")).toBe(false);
                expect(HslColor.isValidHexColorString(123)).toBe(false);
            });
        });

        describe("isValidTransparentKeyword", function () {
            it("should identify transparent color strings", function () {
                expect(HslColor.isValidTransparentKeyword("transparent")).toBe(true);
                expect(HslColor.isValidTransparentKeyword("initial")).toBe(true);
                expect(HslColor.isValidTransparentKeyword("inherit")).toBe(true);
                expect(HslColor.isValidTransparentKeyword("")).toBe(true);
                expect(HslColor.isValidTransparentKeyword("  ")).toBe(true);
                expect(HslColor.isValidTransparentKeyword("red")).toBe(false);
            });
        });
    });

    describe("Factory Methods", function () {
        describe("from", function () {
            it("should create from string", function () {
                const color = HslColor.from("hsl(120, 100%, 50%)");
                expect(color.hue).toBe(120);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(1);
            });

            it("should create from array", function () {
                const color = HslColor.from([240, 75, 60, 0.8]);
                expect(color.hue).toBe(240);
                expect(color.saturation).toBe(75);
                expect(color.lightness).toBe(60);
                expect(color.alpha).toBe(0.8);
            });

            it("should create from existing HslColor", function () {
                const original = new HslColor(120, 100, 50);
                const copy = HslColor.from(original);
                expect(copy).toBe(original);
            });

            it("should throw error for invalid format", function () {
                expect(function () {
                    HslColor.from(123);
                }).toThrow(new Error("Invalid HSL color format. Expected string, HslColor, or number array"));
            });
        });

        describe("fromString", function () {
            it("should create color from HSL strings", function () {
                const color = HslColor.fromString("hsl(120, 100%, 50%)");
                expect(color.hue).toBe(120);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(1);
            });

            it("should create color from HSLA strings", function () {
                const color = HslColor.fromString("hsla(240, 75%, 60%, 0.8)");
                expect(color.hue).toBe(240);
                expect(color.saturation).toBe(75);
                expect(color.lightness).toBe(60);
                expect(color.alpha).toBe(0.8);
            });

            it("should create color from hex strings", function () {
                const color = HslColor.fromString("#ff0000");
                expect(color.hue).toBe(0);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(1);
            });

            it("should create color from RGB strings", function () {
                const color = HslColor.fromString("rgb(255, 0, 0)");
                expect(color.hue).toBe(0);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(1);
            });

            it("should create color from RGBA strings", function () {
                const color = HslColor.fromString("rgba(255, 0, 0, 0.5)");
                expect(color.hue).toBe(0);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(0.5);
            });

            it("should create transparent color from transparent strings", function () {
                const color = HslColor.fromString("transparent");
                expect(color.isTransparent()).toBe(true);
            });

            it("should throw error for invalid strings", function () {
                expect(function () {
                    HslColor.fromString("invalid");
                }).toThrow();

                expect(function () {
                    HslColor.fromString(123);
                }).toThrow(new Error("Color string must be a string"));
            });
        });

        describe("fromHslString", function () {
            it("should parse HSL strings", function () {
                const color = HslColor.fromHslString("hsl(120, 100%, 50%)");
                expect(color.hue).toBe(120);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(1);
            });

            it("should parse HSLA strings", function () {
                const color = HslColor.fromHslString("hsla(240, 75%, 60%, 0.8)");
                expect(color.hue).toBe(240);
                expect(color.saturation).toBe(75);
                expect(color.lightness).toBe(60);
                expect(color.alpha).toBe(0.8);
            });

            it("should handle decimal values", function () {
                const color = HslColor.fromHslString("hsla(120.5, 75.7%, 60.2%, 0.75)");
                expect(color.hue).toBe(120.5);
                expect(color.saturation).toBe(75.7);
                expect(color.lightness).toBe(60.2);
                expect(color.alpha).toBe(0.75);
            });

            it("should throw error for invalid format", function () {
                expect(function () {
                    HslColor.fromHslString("invalid");
                }).toThrow();
            });
        });

        describe("fromRgbString", function () {
            it("should create color from RGB string", function () {
                const color = HslColor.fromRgbString("rgb(255, 0, 0)");
                expect(color.hue).toBe(0);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(1);
            });

            it("should create color from RGBA string", function () {
                const color = HslColor.fromRgbString("rgba(0, 255, 0, 0.7)");
                expect(color.hue).toBe(120);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(0.7);
            });
        });

        describe("fromHexString", function () {
            it("should parse 6-digit hex", function () {
                const color = HslColor.fromHexString("#ff0000");
                expect(color.hue).toBe(0);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(1);
            });

            it("should parse 3-digit hex shorthand", function () {
                const color = HslColor.fromHexString("#f00");
                expect(color.hue).toBe(0);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(1);
            });

            it("should parse 8-digit hex with alpha", function () {
                const color = HslColor.fromHexString("#ff000080");
                expect(color.hue).toBe(0);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBeCloseTo(0.5, 2);
            });

            it("should work without # prefix", function () {
                const color = HslColor.fromHexString("00ff00");
                expect(color.hue).toBe(120);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
            });

            it("should throw error for invalid hex", function () {
                expect(function () {
                    HslColor.fromHexString("#zz");
                }).toThrow();

                expect(function () {
                    HslColor.fromHexString("#fffff");
                }).toThrow();
            });
        });

        describe("fromRgb", function () {
            it("should create color from RGB values", function () {
                const color = HslColor.fromRgb(255, 0, 0);
                expect(color.hue).toBe(0);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(1);
            });

            it("should create color from RGBA values", function () {
                const color = HslColor.fromRgb(0, 0, 255, 0.8);
                expect(color.hue).toBe(240);
                expect(color.saturation).toBe(100);
                expect(color.lightness).toBe(50);
                expect(color.alpha).toBe(0.8);
            });

            it("should throw error for invalid RGB values", function () {
                expect(function () {
                    HslColor.fromRgb(-1, 0, 0);
                }).toThrow();

                expect(function () {
                    HslColor.fromRgb(256, 0, 0);
                }).toThrow();

                expect(function () {
                    HslColor.fromRgb(255, 0, 0, 2);
                }).toThrow();
            });
        });
    });

    describe("Instance Methods", function () {
        let color;

        beforeEach(function () {
            color = new HslColor(240, 75, 60, 0.8);
        });

        describe("isTransparent", function () {
            it("should detect transparent colors", function () {
                expect(HslColor.transparent.isTransparent()).toBe(true);
                expect(new HslColor(120, 100, 50, 0).isTransparent()).toBe(true);
                expect(new HslColor(120, 100, 50, 0.5).isTransparent()).toBe(false);
            });
        });

        describe("getLuminance", function () {
            it("should calculate luminance for white", function () {
                expect(HslColor.white.getLuminance()).toBeCloseTo(1, 1);
            });

            it("should calculate luminance for black", function () {
                expect(HslColor.black.getLuminance()).toBe(0);
            });

            it("should calculate luminance for other colors", function () {
                const red = new HslColor(0, 100, 50);
                expect(red.getLuminance()).toBeCloseTo(0.2126, 3);
            });
        });

        describe("copyWithAlpha", function () {
            it("should create new color with different alpha", function () {
                const newColor = color.copyWithAlpha(0.5);
                expect(newColor.alpha).toBe(0.5);
                expect(newColor.hue).toBe(color.hue);
                expect(newColor.saturation).toBe(color.saturation);
                expect(newColor.lightness).toBe(color.lightness);
                expect(newColor).not.toBe(color);
            });

            it("should throw error for invalid alpha", function () {
                expect(function () {
                    color.copyWithAlpha(2);
                }).toThrow();
            });
        });

        describe("copyWithoutAlpha", function () {
            it("should create new color with full opacity", function () {
                const newColor = color.copyWithoutAlpha();
                expect(newColor.alpha).toBe(1);
                expect(newColor.hue).toBe(color.hue);
                expect(newColor.saturation).toBe(color.saturation);
                expect(newColor.lightness).toBe(color.lightness);
            });
        });

        describe("copyWithHue", function () {
            it("should create new color with different hue value", function () {
                const newColor = color.copyWithHue(120);
                expect(newColor.hue).toBe(120);
                expect(newColor.saturation).toBe(color.saturation);
                expect(newColor.lightness).toBe(color.lightness);
                expect(newColor.alpha).toBe(color.alpha);
            });

            it("should throw error for invalid hue value", function () {
                expect(function () {
                    color.copyWithHue(361);
                }).toThrow(new Error("Hue value must be between 0 and 360"));
            });
        });

        describe("copyWithSaturation", function () {
            it("should create new color with different saturation value", function () {
                const newColor = color.copyWithSaturation(50);
                expect(newColor.saturation).toBe(50);
                expect(newColor.hue).toBe(color.hue);
                expect(newColor.lightness).toBe(color.lightness);
                expect(newColor.alpha).toBe(color.alpha);
            });

            it("should throw error for invalid saturation value", function () {
                expect(function () {
                    color.copyWithSaturation(101);
                }).toThrow(new Error("Saturation value must be between 0 and 100"));
            });
        });

        describe("copyWithLightness", function () {
            it("should create new color with different lightness value", function () {
                const newColor = color.copyWithLightness(80);
                expect(newColor.lightness).toBe(80);
                expect(newColor.hue).toBe(color.hue);
                expect(newColor.saturation).toBe(color.saturation);
                expect(newColor.alpha).toBe(color.alpha);
            });

            it("should throw error for invalid lightness value", function () {
                expect(function () {
                    color.copyWithLightness(101);
                }).toThrow(new Error("Lightness value must be between 0 and 100"));
            });
        });

        describe("copyWithValues", function () {
            it("should update multiple values", function () {
                const newColor = color.copyWithValues({ hue: 120, alpha: 0.5 });
                expect(newColor.hue).toBe(120);
                expect(newColor.alpha).toBe(0.5);
                expect(newColor.saturation).toBe(color.saturation);
                expect(newColor.lightness).toBe(color.lightness);
            });

            it("should ignore invalid values", function () {
                const newColor = color.copyWithValues({ hue: -50, saturation: 150 });
                expect(newColor.hue).toBe(color.hue);
                expect(newColor.saturation).toBe(color.saturation);
            });

            it("should work with empty object", function () {
                const newColor = color.copyWithValues({});
                expect(newColor.hue).toBe(color.hue);
                expect(newColor.saturation).toBe(color.saturation);
                expect(newColor.lightness).toBe(color.lightness);
                expect(newColor.alpha).toBe(color.alpha);
            });
        });
    });

    describe("Conversion Methods", function () {
        let color;

        beforeEach(function () {
            color = new HslColor(240, 75, 60, 0.8);
        });

        describe("toHslString", function () {
            it("should convert to HSL string", function () {
                expect(color.toHslString()).toBe("hsl(240, 75%, 60%)");
            });
        });

        describe("toHslaString", function () {
            it("should convert to HSLA string", function () {
                expect(color.toHslaString()).toBe("hsla(240, 75%, 60%, 0.8)");
            });
        });

        describe("toRgbString", function () {
            it("should convert to RGB string", function () {
                const red = new HslColor(0, 100, 50);
                expect(red.toRgbString()).toBe("rgb(255, 0, 0)");
            });
        });

        describe("toRgbaString", function () {
            it("should convert to RGBA string", function () {
                const red = new HslColor(0, 100, 50, 0.5);
                expect(red.toRgbaString()).toBe("rgba(255, 0, 0, 0.5)");
            });
        });

        describe("toString", function () {
            it("should return HSLA string by default", function () {
                expect(color.toString()).toBe("hsla(240, 75%, 60%, 0.8)");
            });

            it("should return HSL string for opaque colors", function () {
                const opaqueColor = new HslColor(240, 75, 60);
                expect(opaqueColor.toString()).toBe("hsl(240, 75%, 60%)");
            });
        });

        describe("toShortHexString", function () {
            it("should convert to short hex string when possible", function () {
                const shortColor = new HslColor(0, 100, 50); // Pure red -> #f00
                expect(shortColor.toShortHexString()).toBe("#f00");
            });

            it("should return null when not compressible to short format", function () {
                // This HSL will likely produce RGB values that can't be compressed
                const nonCompressibleColor = new HslColor(240, 75, 60);
                expect(nonCompressibleColor.toShortHexString()).toBeNull();
            });
        });

        describe("toLongHexString", function () {
            it("should convert to long hex string for opaque colors", function () {
                const red = new HslColor(0, 100, 50);
                expect(red.toLongHexString()).toBe("#ff0000");
            });

            it("should convert to long hex string with alpha for transparent colors", function () {
                const red = new HslColor(0, 100, 50, 0.5);
                expect(red.toLongHexString()).toBe("#ff000080");
            });
        });
    });

    describe("Integration Tests", function () {
        it("should round-trip through HSL string conversion", function () {
            const original = new HslColor(240, 75, 60, 0.8);
            const hslaString = original.toHslaString();
            const converted = HslColor.fromString(hslaString);

            expect(converted.hue).toBe(original.hue);
            expect(converted.saturation).toBe(original.saturation);
            expect(converted.lightness).toBe(original.lightness);
            expect(converted.alpha).toBe(original.alpha);
        });

        it("should round-trip through RGB conversion", function () {
            const original = new HslColor(120, 100, 50);
            const rgbString = original.toRgbString();
            const converted = HslColor.fromString(rgbString);

            // Allow for small rounding differences in conversion
            expect(converted.hue).toBeCloseTo(original.hue, 0);
            expect(converted.saturation).toBeCloseTo(original.saturation, 0);
            expect(converted.lightness).toBeCloseTo(original.lightness, 0);
        });

        it("should round-trip through hex conversion", function () {
            const original = new HslColor(0, 100, 50); // Pure red
            const hexString = original.toLongHexString();
            const converted = HslColor.fromString(hexString);

            expect(converted.hue).toBeCloseTo(original.hue, 0);
            expect(converted.saturation).toBeCloseTo(original.saturation, 0);
            expect(converted.lightness).toBeCloseTo(original.lightness, 0);
        });
    });
});
