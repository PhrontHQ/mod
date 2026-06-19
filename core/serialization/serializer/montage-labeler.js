var Montage = require("../../core").Montage;

exports.MontageLabeler = Montage.specialize({
    _labelRegexp: {value: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/},
    _labels: {value: null},
    // hash(object) -> label
    _labelsByObject: {value: null},
    _objectsByLabel: {value: null},
    // Labels generation sequence is "label", "label2", "label3", ..., hence
    // starting at 2.
    _INITIAL_LABEL_NUMBER: {value: 2},
    _indexByBaseName: {value: null},
    _userDefinedLabels: {value: null},

    constructor: {
        value: function MontageLabeler() {
            this._labels = new Set();
            this._labelsByObject = new Map();
            this._objectsByLabel = new Map();
            this._indexByBaseName =  new Map();
            this._userDefinedLabels = new Set();
        }
    },

    getTemplatePropertyLabel: {
        value: function (object) {
            var label = this._getObjectLabel(object);

            if (label[0] !== ":") {
                throw new Error("Template property's labels need to start with a colon (:), (\"" + label + "\").");
            }

            return label;
        }
    },

    _getObjectLabel: {
        value: function(object) {
            var label;

            if (this._labelsByObject.has(object)) {
                label = this._labelsByObject.get(object);
            } else {
                label = this.generateObjectLabel(object);
                this.setObjectLabel(object, label);
            }

            return label;
        }
    },

    getObjectLabel: {
        value: function (object) {
            var label = this._getObjectLabel(object);

            if (label[0] === ":") {
                throw new Error("Labels starting with colon (:) can only be used for template values, (\"" + label + "\").");
            }

            return label;
        }
    },

    getObjectName: {
        value: function (object) {
            var identifier = object.identifier,
                objectName;

            if (identifier && this._labelRegexp.test((identifier = identifier.toString()))) {
                //objectName = object.identifier;
                objectName = identifier;
            } else if (object && typeof object === "object" && "getInfoForObject" in object || "getInfoForObject" in object.constructor ) {
                objectName = Montage.getInfoForObject(object).objectName;
                objectName = objectName.toLowerCase();
            } else {
                if (Array.isArray(object)) {
                    objectName = "array";
                } else if (RegExp.isRegExp(object)) {
                    objectName = "regexp";
                } else {
                    objectName =  typeof object;
                }
            }

            return objectName;
        }
    },

    /**
     * When the labeler is initialized with objects these objects are
     * considered user defined objects.
     */
    initWithObjects: {
        value: function(labels) {
            var keys = Object.keys(labels),
                i, label;
            for(i=0;(label = keys[i]); i++) {
                this.setObjectLabel(labels[label], label);
                this._userDefinedLabels.add(label);
            }
        }
    },

    cleanup: {
        value: function() {
            this._labels.clear();
            this._labelsByObject.clear();
            this._objectsByLabel.clear();
            this._indexByBaseName.clear();
            this._userDefinedLabels.clear();
        }
    },

    generateLabel: {
        value: function(baseName) {
            var index = this._indexByBaseName.get(baseName),
                labels = this._labels,
                label;

            do {
                if (index) {
                    label = baseName + index;
                    this._indexByBaseName.set(baseName, (index = index + 1));
                } else {
                    label = baseName;
                    this._indexByBaseName.set(baseName, (index = this._INITIAL_LABEL_NUMBER));
                }
            } while (labels.has(label));

            return label;
        }
    },

    getLabelBaseName: {
        value: function(label) {
            return label.replace(/\d*$/, "");
        }
    },

    addLabel: {
        value: function(label) {
            this._labels.add(label);
        }
    },

    addLabels: {
        value: function(labels) {
            for (var i = 0, ii = labels.length; i < ii; i++) {
                this.addLabel(labels[i]);
            }
        }
    },

    isLabelDefined: {
        value: function(label) {
            return this._labels.has(label);
        }
    },

    isUserDefinedLabel: {
        value: function(label) {
            return this._userDefinedLabels.has(label);
        }
    },

    generateObjectLabel: {
        value: function(object) {
            var objectName = this.getObjectName(object);

            return this.generateLabel(objectName);
        }
    },

    setObjectLabel: {
        value: function(object, label) {
            if (typeof object !== "undefined") {
                this.addLabel(label);
                this._labelsByObject.set(object, label);
                this._objectsByLabel.set(label, object);
            }
        }
    },

    getObjectByLabel: {
        value: function(label) {
            return this._objectsByLabel.get(label);
        }
    }
});
