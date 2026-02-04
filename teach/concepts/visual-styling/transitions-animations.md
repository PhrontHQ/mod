# A VisualStyle's transitions and animations

We haven't codified transitions / animations at VisualStyle's level yet but that definitely belongs there at some point as well.

This from ui/segmented-control.mod/segmented-control.css

    &.mod--readyForAnimation {
        > .ModSegmentedControl-container {
            > .ModSegmentedControl-thumb {
                transition: var(--mod-segmented-control-thumb-transition);
Is a good example of one that is control-specific here.

## build-in / build-out  transitions / animations for in and out of view

Mod already have build-ins / build-outs, an idea I borrowed from Keynote where they are both effective and intuitive to use for non-technical people, assuming a library of templated ones existing with high-level, easy to understand properties to tweak them.

## "interact-in / interact-out" for transitions / animations related to user interactions?

Besides coming in and out of view, an important other class of animation / transition is around user interactions with UI Controls. Here's the correspondence Between CSS States and DOM Events:



| CSS Pseudo-Class | Corresponding DOM Events               | Description                                                                                                                                                                                                                                                            |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`:hover`**     | `mouseenter`, `mouseleave`             | Matches when a pointing device (like a mouse cursor) is over an element. The events`mouseenter` and `mouseleave` are generally more useful than `mouseover` and `mouseout`because they do not bubble up from child elements.                                           |
| **`:focus`**     | `focus`, `blur`, `focusin`, `focusout` | Matches when an element has received focus, typically via keyboard navigation or a mouse click on certain elements (like form fields, buttons, or links).`focusin` and `focusout` events bubble, allowing detection on ancestor elements (useful for `:focus-within`). |
| **`:active`**    | `mousedown`, `mouseup`                 | Matches when an item is being activated by the user, for example, when a mouse button is pressed down on it. The state is typically triggered between the`mousedown` and `mouseup`events.                                                                              |

Those are clearly inconsistents. We also have current event composers providing the likes of "press", "long press", "swipe", "rotate", "translate" related events created by composers (which should really become a private API only, such that users only have to know about the resulting events).

Each of the transitions around those interations, as they are identified, and when they stop, needs the ability to associate a transition / animation.

