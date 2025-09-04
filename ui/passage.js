"use strict";

/**
 * @module mod/ui/passage
 */
const Montage = require("core/core").Montage;

/**
 * Represents a passage between two UI components, managing the transition state and associated data.
 * A Passage encapsulates the source and destination components along with their transition properties
 * and any data that should be passed between them during navigation.
 *
 * TODO:
 * 1. Need to clarify the purpose of `buildInTransitionCssClass`.
 * 2. Should it be used directly by the succession or another specialized Component? (e.g., NavigationController...)
 * 3. Predefine standard mod Transition classes? (e.g., slide-left, slide-right, slide-up, slide-down, fade-in, fade-out...)
 * 4. Consider adding event hooks for transition lifecycle (e.g., onStart, onComplete)?
 * 5. Consider adding sourceModuleId and destinationModuleId for lazy loading scenarios?
 *
 * @class Passage
 * @augments Montage
 */
exports.Passage = Montage.specialize({
    /**
     * A unique identifier that distinguishes this passage from others with the same source and destination.
     *
     * This is useful when you have multiple navigation paths between the same two components
     * and need to apply different behaviors, animations, or data handling based on how the
     * user initiated the transition.
     *
     * @example
     * // Two different ways to reach the settings screen
     * var userProfilePassage = new Passage();
     * userProfilePassage.identifier = "from-profile";
     * userProfilePassage.source = homeScreen;
     * userProfilePassage.destination = settingsScreen;
     * userProfilePassage.buildInCssClass = "slide-up";
     *
     * var menuPassage = new Passage();
     * menuPassage.identifier = "from-menu";
     * menuPassage.source = homeScreen;
     * menuPassage.destination = settingsScreen;
     * menuPassage.buildInCssClass = "slide-right";
     *
     * @type {?String}
     * @default null
     */
    identifier: { value: null },

    /**
     * The component that is currently visible and will be transitioned away from.
     * This component serves as the starting point of the passage transition.
     *
     * @type {?Component}
     * @default null
     */
    source: { value: null },

    /**
     * The component that will become visible after the passage transition completes.
     * This component serves as the end point of the passage transition.
     *
     * @type {?Component}
     * @default null
     */
    destination: { value: null },

    /**
     * CSS class applied to the destination component when it enters the view.
     * This class typically contains animations or styles for the entrance transition.
     *
     * @type {?String}
     * @default undefined
     * @inheritdoc Component#buildInCssClass
     */
    buildInCssClass: { value: undefined },

    /**
     * TODO: what is this for?
     * @type {?String}
     * @default undefined
     * @inheritdoc Component#buildInTransitionCssClass
     */
    buildInTransitionCssClass: { value: undefined },

    /**
     * CSS class applied to the source component when it exits the view.
     * This class typically contains animations or styles for the exit transition.
     *
     * @type {?String}
     * @default undefined
     * @inheritdoc Component#buildOutCssClass
     */
    buildOutCssClass: { value: undefined },

    /**
     * Data associated with the source component.
     *
     * @type {*}
     * @default null
     */
    sourceData: { value: null },

    /**
     * Data that should be passed to or associated with the destination component.
     *
     * @type {*}
     * @default null
     */
    destinationData: { value: null },
});
