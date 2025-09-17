const RgbColor = require("mod/core/visual/color/rgb-color").RgbColor;

describe("mod/core/visual/color/rgb-color-spec", function () {
    describe("Constructor", function () {
        it("should create a color with default values", function () {
            const color = new RgbColor();
            expect(color.red).toBe(0);
            expect(color.green).toBe(0);
            expect(color.blue).toBe(0);
            expect(color.alpha).toBe(1);
        });

        it("should create a color with specified RGBA values", function () {
            const color = new RgbColor(255, 128, 64, 0.5);
            expect(color.red).toBe(255);
            expect(color.green).toBe(128);
            expect(color.blue).toBe(64);
            expect(color.alpha).toBe(0.5);
        });
    });

    describe("Static Color Constants", function () {
        it("should provide transparent color", function () {
            const transparent = RgbColor.transparent;
            expect(transparent.red).toBe(0);
            expect(transparent.green).toBe(0);
            expect(transparent.blue).toBe(0);
            expect(transparent.alpha).toBe(0);
        });

        it("should provide white color", function () {
            const white = RgbColor.white;
            expect(white.red).toBe(255);
            expect(white.green).toBe(255);
            expect(white.blue).toBe(255);
            expect(white.alpha).toBe(1);
        });

        it("should provide black color", function () {
            const black = RgbColor.black;
            expect(black.red).toBe(0);
            expect(black.green).toBe(0);
            expect(black.blue).toBe(0);
            expect(black.alpha).toBe(1);
        });

        it("should cache color instances", function () {
            const transparent1 = RgbColor.transparent;
            const transparent2 = RgbColor.transparent;
            expect(transparent1).toBe(transparent2);
        });
    });

    describe("Validation Methods", function () {
        describe("isValidHue", function () {
            it("should validate hue values", function () {
                expect(RgbColor.isValidHue(0)).toBe(true);
                expect(RgbColor.isValidHue(180)).toBe(true);
                expect(RgbColor.isValidHue(360)).toBe(true);
                expect(RgbColor.isValidHue(-1)).toBe(false);
                expect(RgbColor.isValidHue(361)).toBe(false);
                expect(RgbColor.isValidHue("invalid")).toBe(false);
            });
        });

        describe("isValidSaturation", function () {
            it("should validate saturation values", function () {
                expect(RgbColor.isValidSaturation(0)).toBe(true);
                expect(RgbColor.isValidSaturation(50)).toBe(true);
                expect(RgbColor.isValidSaturation(100)).toBe(true);
                expect(RgbColor.isValidSaturation(-1)).toBe(false);
                expect(RgbColor.isValidSaturation(101)).toBe(false);
            });
        });

        describe("isValidLightness", function () {
            it("should validate lightness values", function () {
                expect(RgbColor.isValidLightness(0)).toBe(true);
                expect(RgbColor.isValidLightness(50)).toBe(true);
                expect(RgbColor.isValidLightness(100)).toBe(true);
                expect(RgbColor.isValidLightness(-1)).toBe(false);
                expect(RgbColor.isValidLightness(101)).toBe(false);
            });
        });

        describe("isValidRgbValue", function () {
            it("should validate RGB values", function () {
                expect(RgbColor.isValidRgbValue(0)).toBe(true);
                expect(RgbColor.isValidRgbValue(128)).toBe(true);
                expect(RgbColor.isValidRgbValue(255)).toBe(true);
                expect(RgbColor.isValidRgbValue(-1)).toBe(false);
                expect(RgbColor.isValidRgbValue(256)).toBe(false);
            });
        });

        describe("isValidAlphaValue", function () {
            it("should validate alpha values", function () {
                expect(RgbColor.isValidAlphaValue(0)).toBe(true);
                expect(RgbColor.isValidAlphaValue(0.5)).toBe(true);
                expect(RgbColor.isValidAlphaValue(1)).toBe(true);
                expect(RgbColor.isValidAlphaValue(-0.1)).toBe(false);
                expect(RgbColor.isValidAlphaValue(1.1)).toBe(false);
            });
        });

        describe("isValidHexColorString", function () {
            it("should validate hex color strings", function () {
                expect(RgbColor.isValidHexColorString("#fff")).toBe(true);
                expect(RgbColor.isValidHexColorString("#ffffff")).toBe(true);
                expect(RgbColor.isValidHexColorString("#ffffffff")).toBe(true);
                expect(RgbColor.isValidHexColorString("fff")).toBe(true);
                expect(RgbColor.isValidHexColorString("ffffff")).toBe(true);
                expect(RgbColor.isValidHexColorString("#ff")).toBe(false);
                expect(RgbColor.isValidHexColorString("invalid")).toBe(false);
                expect(RgbColor.isValidHexColorString(123)).toBe(false);
            });
        });

        describe("isValidTransparentKeyword", function () {
            it("should identify transparent color strings", function () {
                expect(RgbColor.isValidTransparentKeyword("transparent")).toBe(true);
                expect(RgbColor.isValidTransparentKeyword("initial")).toBe(true);
                expect(RgbColor.isValidTransparentKeyword("inherit")).toBe(true);
                expect(RgbColor.isValidTransparentKeyword("")).toBe(true);
                expect(RgbColor.isValidTransparentKeyword("  ")).toBe(true);
                expect(RgbColor.isValidTransparentKeyword("red")).toBe(false);
            });
        });
    });

    describe("Factory Methods", function () {
        describe("from", function () {
            it("should create from string", function () {
                const color = RgbColor.from("#ff0000");
                expect(color.red).toBe(255);
                expect(color.green).toBe(0);
                expect(color.blue).toBe(0);
                expect(color.alpha).toBe(1);
            });

            it("should create from array", function () {
                const color = RgbColor.from([255, 128, 64, 0.5]);
                expect(color.red).toBe(255);
                expect(color.green).toBe(128);
                expect(color.blue).toBe(64);
                expect(color.alpha).toBe(0.5);
            });

            it("should create from existing RgbColor", function () {
                const original = new RgbColor(255, 128, 64);
                const copy = RgbColor.from(original);
                expect(copy).toBe(original);
            });

            it("should throw error for invalid format", function () {
                expect(function () {
                    RgbColor.from(123);
                }).toThrow(new Error("Invalid color format. Expected string, RgbColor, or number array"));
            });
        });

        describe("fromString", function () {
            it("should create color from hex strings", function () {
                const color = RgbColor.fromString("#ff0000");
                expect(color.red).toBe(255);
                expect(color.green).toBe(0);
                expect(color.blue).toBe(0);
                expect(color.alpha).toBe(1);
            });

            it("should create color from RGB strings", function () {
                const color = RgbColor.fromString("rgb(255, 0, 0)");
                expect(color.red).toBe(255);
                expect(color.green).toBe(0);
                expect(color.blue).toBe(0);
                expect(color.alpha).toBe(1);
            });

            it("should create color from RGBA strings", function () {
                const color = RgbColor.fromString("rgba(255, 0, 0, 0.5)");
                expect(color.red).toBe(255);
                expect(color.green).toBe(0);
                expect(color.blue).toBe(0);
                expect(color.alpha).toBe(0.5);
            });

            it("should create transparent color from transparent strings", function () {
                const color = RgbColor.fromString("transparent");
                expect(color.isTransparent()).toBe(true);
            });

            it("should throw error for invalid strings", function () {
                expect(function () {
                    RgbColor.fromString("invalid");
                }).toThrow();

                expect(function () {
                    RgbColor.fromString(123);
                }).toThrow(new Error("Color string must be a string"));
            });
        });

        describe("fromRgbString", function () {
            it("should parse RGB strings", function () {
                const color = RgbColor.fromRgbString("rgb(255, 128, 64)");
                expect(color.red).toBe(255);
                expect(color.green).toBe(128);
                expect(color.blue).toBe(64);
                expect(color.alpha).toBe(1);
            });

            it("should parse RGBA strings", function () {
                const color = RgbColor.fromRgbString("rgba(255, 128, 64, 0.5)");
                expect(color.red).toBe(255);
                expect(color.green).toBe(128);
                expect(color.blue).toBe(64);
                expect(color.alpha).toBe(0.5);
            });

            it("should handle decimal values", function () {
                const color = RgbColor.fromRgbString("rgba(252.5, 128.7, 64.2, 0.75)");
                expect(color.red).toBe(252.5);
                expect(color.green).toBe(128.7);
                expect(color.blue).toBe(64.2);
                expect(color.alpha).toBe(0.75);
            });

            it("should throw error for invalid format", function () {
                expect(function () {
                    RgbColor.fromRgbString("invalid");
                }).toThrow(new Error("Invalid RGBA/RGB color format"));
            });
        });

        describe("fromHexString", function () {
            it("should parse 6-digit hex", function () {
                const color = RgbColor.fromHexString("#ff8040");
                expect(color.red).toBe(255);
                expect(color.green).toBe(128);
                expect(color.blue).toBe(64);
                expect(color.alpha).toBe(1);
            });

            it("should parse 3-digit hex shorthand", function () {
                const color = RgbColor.fromHexString("#f84");
                expect(color.red).toBe(255);
                expect(color.green).toBe(136);
                expect(color.blue).toBe(68);
                expect(color.alpha).toBe(1);
            });

            it("should parse 8-digit hex with alpha", function () {
                const color = RgbColor.fromHexString("#ff804080");
                expect(color.red).toBe(255);
                expect(color.green).toBe(128);
                expect(color.blue).toBe(64);
                expect(color.alpha).toBeCloseTo(0.5, 2);
            });

            it("should work without # prefix", function () {
                const color = RgbColor.fromHexString("ff8040");
                expect(color.red).toBe(255);
                expect(color.green).toBe(128);
                expect(color.blue).toBe(64);
            });

            it("should throw error for invalid hex", function () {
                expect(function () {
                    RgbColor.fromHexString("#zz");
                }).toThrow();

                expect(function () {
                    RgbColor.fromHexString("#fffff");
                }).toThrow();
            });
        });

        describe("fromHsl", function () {
            it("should create color from HSL values", function () {
                const color = RgbColor.fromHsl(0, 100, 50);
                expect(color).toBeDefined();
                expect(color.red).toBe(255);
                expect(color.green).toBe(0);
                expect(color.blue).toBe(0);
                expect(color.alpha).toBe(1);
            });

            it("should create color from HSLA values", function () {
                const color = RgbColor.fromHsl(240, 100, 50, 0.8);
                expect(color).toBeDefined();
                expect(color.red).toBe(0);
                expect(color.green).toBe(0);
                expect(color.blue).toBe(255);
                expect(color.alpha).toBe(0.8);
            });

            it("should throw error for invalid HSL values", function () {
                expect(function () {
                    RgbColor.fromHsl(-1, 100, 50);
                }).toThrow(new Error("Hue value must be between 0 and 360"));

                expect(function () {
                    RgbColor.fromHsl(0, 101, 50);
                }).toThrow(new Error("Saturation value must be between 0 and 100"));

                expect(function () {
                    RgbColor.fromHsl(0, 100, 101);
                }).toThrow(new Error("Lightness value must be between 0 and 100"));

                expect(function () {
                    RgbColor.fromHsl(0, 100, 50, 2);
                }).toThrow(new Error("Alpha value must be between 0 and 1"));
            });
        });

        describe("fromHslString", function () {
            it("should create color from HSL string", function () {
                const color = RgbColor.fromHslString("hsl(0, 100%, 50%)");
                expect(color.red).toBe(255);
                expect(color.green).toBe(0);
                expect(color.blue).toBe(0);
                expect(color.alpha).toBe(1);
            });

            it("should create color from HSLA string", function () {
                const color = RgbColor.fromHslString("hsla(0, 100%, 50%, 0.8)");
                expect(color.red).toBe(255);
                expect(color.green).toBe(0);
                expect(color.blue).toBe(0);
                expect(color.alpha).toBe(0.8);
            });

            it("should throw error for invalid HSL string", function () {
                expect(function () {
                    RgbColor.fromHslString("invalid");
                }).toThrow();
            });
        });
    });

    describe("Instance Methods", function () {
        let color;

        beforeEach(function () {
            color = new RgbColor(255, 128, 64, 0.8);
        });

        describe("isTransparent", function () {
            it("should detect transparent colors", function () {
                expect(RgbColor.transparent.isTransparent()).toBe(true);
                expect(new RgbColor(255, 0, 0, 0).isTransparent()).toBe(true);
                expect(new RgbColor(255, 0, 0, 0.5).isTransparent()).toBe(false);
            });
        });

        describe("getLuminance", function () {
            it("should calculate luminance for white", function () {
                expect(RgbColor.white.getLuminance()).toBeCloseTo(1, 1);
            });

            it("should calculate luminance for black", function () {
                expect(RgbColor.black.getLuminance()).toBe(0);
            });

            it("should calculate luminance for other colors", function () {
                const red = new RgbColor(255, 0, 0);
                expect(red.getLuminance()).toBeCloseTo(0.2126, 3);
            });
        });

        describe("copyWithAlpha", function () {
            it("should create new color with different alpha", function () {
                const newColor = color.copyWithAlpha(0.5);
                expect(newColor.alpha).toBe(0.5);
                expect(newColor.red).toBe(color.red);
                expect(newColor.green).toBe(color.green);
                expect(newColor.blue).toBe(color.blue);
                expect(newColor).not.toBe(color);
            });

            it("should throw error for invalid alpha", function () {
                expect(function () {
                    color.copyWithAlpha(2);
                }).toThrow(new Error("Alpha value must be between 0 and 1"));
            });
        });

        describe("copyWithoutAlpha", function () {
            it("should create new color with full opacity", function () {
                const newColor = color.copyWithoutAlpha();
                expect(newColor.alpha).toBe(1);
                expect(newColor.red).toBe(color.red);
                expect(newColor.green).toBe(color.green);
                expect(newColor.blue).toBe(color.blue);
            });
        });

        describe("copyWithRed", function () {
            it("should create new color with different red value", function () {
                const newColor = color.copyWithRed(200);
                expect(newColor.red).toBe(200);
                expect(newColor.green).toBe(color.green);
                expect(newColor.blue).toBe(color.blue);
                expect(newColor.alpha).toBe(color.alpha);
            });

            it("should throw error for invalid red value", function () {
                expect(function () {
                    color.copyWithRed(256);
                }).toThrow(new Error("Red value must be between 0 and 255"));
            });
        });

        describe("copyWithGreen", function () {
            it("should create new color with different green value", function () {
                const newColor = color.copyWithGreen(200);
                expect(newColor.green).toBe(200);
                expect(newColor.red).toBe(color.red);
                expect(newColor.blue).toBe(color.blue);
                expect(newColor.alpha).toBe(color.alpha);
            });
        });

        describe("copyWithBlue", function () {
            it("should create new color with different blue value", function () {
                const newColor = color.copyWithBlue(200);
                expect(newColor.blue).toBe(200);
                expect(newColor.red).toBe(color.red);
                expect(newColor.green).toBe(color.green);
                expect(newColor.alpha).toBe(color.alpha);
            });
        });

        describe("copyWithValues", function () {
            it("should update multiple values", function () {
                const newColor = color.copyWithValues({ red: 200, alpha: 0.5 });
                expect(newColor.red).toBe(200);
                expect(newColor.alpha).toBe(0.5);
                expect(newColor.green).toBe(color.green);
                expect(newColor.blue).toBe(color.blue);
            });

            it("should ignore invalid values", function () {
                const newColor = color.copyWithValues({ red: -50, green: 300 });
                expect(newColor.red).toBe(color.red);
                expect(newColor.green).toBe(color.green);
            });

            it("should work with empty object", function () {
                const newColor = color.copyWithValues({});
                expect(newColor.red).toBe(color.red);
                expect(newColor.green).toBe(color.green);
                expect(newColor.blue).toBe(color.blue);
                expect(newColor.alpha).toBe(color.alpha);
            });
        });
    });

    describe("Conversion Methods", function () {
        let color;

        beforeEach(function () {
            color = new RgbColor(255, 128, 64, 0.8);
        });

        describe("toRgbString", function () {
            it("should convert to RGB string", function () {
                expect(color.toRgbString()).toBe("rgb(255, 128, 64)");
            });
        });

        describe("toRgbaString", function () {
            it("should convert to RGBA string", function () {
                expect(color.toRgbaString()).toBe("rgba(255, 128, 64, 0.8)");
            });
        });

        describe("toHexString", function () {
            it("should convert to hex string with alpha", function () {
                const hexString = color.toHexString();
                expect(hexString).toBe("#ff8040cc");
            });
        });

        describe("toString", function () {
            it("should return RGBA string by default", function () {
                expect(color.toString()).toBe("rgba(255, 128, 64, 0.8)");
            });

            it("should return RGB string for opaque colors", function () {
                const opaqueColor = new RgbColor(255, 128, 64);
                expect(opaqueColor.toString()).toBe("rgb(255, 128, 64)");
            });
        });

        describe("toShortHexString", function () {
            it("should convert to short hex string when possible", function () {
                const shortColor = new RgbColor(255, 0, 0); // #ff0000 -> #f00
                expect(shortColor.toShortHexString()).toBe("#f00");
            });

            it("should convert to short hex string with alpha when possible", function () {
                const colorWithExactAlpha = new RgbColor(255, 0, 0, 136 / 255);
                expect(colorWithExactAlpha.toShortHexString()).toBe("#f008");
            });

            it("should return null when not compressible to short format", function () {
                const nonCompressibleColor = new RgbColor(255, 128, 64);
                expect(nonCompressibleColor.toShortHexString()).toBeNull();
            });
        });

        describe("toLongHexString", function () {
            it("should convert to long hex string for opaque colors", function () {
                const opaqueColor = new RgbColor(255, 128, 64);
                expect(opaqueColor.toLongHexString()).toBe("#ff8040");
            });

            it("should convert to long hex string with alpha for transparent colors", function () {
                const transparentColor = new RgbColor(255, 128, 64, 0.5);
                expect(transparentColor.toLongHexString()).toBe("#ff804080");
            });
        });

        describe("toHslString", function () {
            it("should convert to HSL string", function () {
                // Using a color that will produce clean HSL values
                const red = new RgbColor(255, 0, 0);
                expect(red.toHslString()).toBe("hsl(0, 100%, 50%)");
            });
        });

        describe("toHslaString", function () {
            it("should convert to HSLA string", function () {
                // Using a color that will produce clean HSL values
                const red = new RgbColor(255, 0, 0, 0.8);
                expect(red.toHslaString()).toBe("hsla(0, 100%, 50%, 0.8)");
            });
        });
    });

    describe("Integration Tests", function () {
        it("should round-trip through string conversion", function () {
            const original = new RgbColor(255, 128, 64, 0.8);
            const rgbaString = original.toRgbaString();
            const converted = RgbColor.fromString(rgbaString);

            expect(converted.red).toBe(original.red);
            expect(converted.green).toBe(original.green);
            expect(converted.blue).toBe(original.blue);
            expect(converted.alpha).toBe(original.alpha);
        });

        it("should round-trip through hex conversion", function () {
            const original = new RgbColor(255, 128, 64);
            const hexString = original.toHexString();
            const converted = RgbColor.fromString(hexString);

            expect(converted.red).toBe(original.red);
            expect(converted.green).toBe(original.green);
            expect(converted.blue).toBe(original.blue);
        });
    });
});
