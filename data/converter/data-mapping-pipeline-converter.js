var PipelineConverter = require("core/converter/pipeline-converter").PipelineConverter,
    Set = require("core/collections/set");

/**
 * Converter that chains a series of converters together
 *
 *
 * @class PipelineConverter
 * @extends Converter
 */
exports.DataMappingPipelineConverter = PipelineConverter.specialize({

    constructor: {
        value: function () {
            this.super();
            //In super, keeping as reference / doc
            //this.addRangeAtPathChangeListener("converters", this, "_handleConvertersRangeChange");
        }
    },

    _handleConvertersRangeChange: {
        value: function (plus, minus, index) {
            var plusSet = new Set(plus),
                minusSet = new Set(minus),
                converter, i;

            for (i = 0; (converter = minus[i]); ++i) {
                if (!plusSet.has(converter)) {
                    converter.currentRule = null;
                }
            }

            for (i = 0; (converter = plus[i]); ++i) {
                if (!minusSet.has(converter)) {
                    converter.currentRule = converter.currentRule || this.currentRule;
                }
            }
        }
    },
    _currentRule: {
        value: undefined
    },

    currentRule: {
        get: function() {
            return this._currentRule;
        },
        set: function(value) {
            if(value !== this._currentRule) {
                this._currentRule = value;
                for (let converters = this.converters, i = 0; (converters[i]); ++i) {
                    converters[i].currentRule = value;
                }
            }
        }
    },
    _foreignDescriptor: {
        value: undefined
    },

    foreignDescriptor: {
        get: function() {
            return this._foreignDescriptor;
        },
        set: function(value) {
            if(value !== this._foreignDescriptor) {
                this._foreignDescriptor = value;
                for (let converters = this.converters, i = 0; (converters[i]); ++i) {
                    converters[i].foreignDescriptor = value;
                }
            }
        }
    }


});
