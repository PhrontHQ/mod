var Montage = require("mod/core/core").Montage,
    Composer = require("mod/composer/composer").Composer;

exports.SimpleTestComposer = Composer.specialize( {

    lazyLoad: {
        value: false
    },

    _loadWasCalled: {
        value: false
    },

    load: {
        value: function () {
            this._loadWasCalled = true;
        }
    },

    unload: {
        value: function () {

        }
    },

    frame: {
        value: function (timestamp) {

        }
    }

});

exports.LazyLoadTestComposer = Composer.specialize( {

    _loadWasCalled: {
        value: false
    },

    load: {
        value: function () {
            this._loadWasCalled = true;
        }
    },

    unload: {
        value: function () {

        }
    },

    frame: {
        value: function (timestamp) {

        }
    }

});
