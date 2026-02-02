var Target = require("mod/core/target").Target;

/**
 * @class Movie
 * @extends Montage
 */
exports.Movie = Target.specialize({

    category: {
        value: undefined
    },

    id: {
        value: undefined
    },

    /**
     * @type {boolean}
     */
    isFeatured: {
        value: undefined
    },

    /**
     * @type {PlotSummary}
     */
    plotSummary: {
        value: undefined
    },

    /**
     * @type {Date}
     */
    releaseDate: {
        value: undefined
    },

    /**
     * @type {string}
     */
    title: {
        value: undefined
    }

});
