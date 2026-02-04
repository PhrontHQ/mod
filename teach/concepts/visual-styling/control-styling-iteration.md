# Codify more Control interative stated in VisualStyle

Like --visual-style-raised-surface-fill, "for hover" for all controls by default. A specific VisualStyle can always be specific at each control's level if it creatively wants to.

## Hover

The intents of Hover state is to serve as a visual cue or affordance, indicating what will happen when a user interacts (usually clicks) with an element. For example, a color change or an underline on text provides a hint that it is a link.
Indicate Interactivity: Use subtle hover effects (e.g., slight color changes, underlines, or minor scaling) to visually confirm an element is interactive. Changing the cursor to a pointer also reinforces that an element is clickable.
By the way, see https://aslamdoctor.com/what-is-hover-intent-and-why-it-matters-in-web-development/ which makes a good point, I don't think we "debounce" hover like that, but it makes sense.

We have {name: "controlHoverFill", variable: "--visual-style-control-hover-fill", backup: "controlFill"},

in VisualStyle, so a parallel would be to add:

{name: "baseSurfaceHoverFill", variable: "--visual-style-base-surface-hover-fill", defaultValue: "hsl(0, 0%, 100%)"},
{name: "raisedSurfaceHoverFill", variable: "--visual-style-raised-surface-hover-fill", backup: "baseSurfaceFill"},
{name: "elevatedSurfaceHoverFill", variable: "--visual-style-elevated-surface-hover-fill", backup: "baseSurfaceFill"},
That said, I'd rather not use "hover" literally as it doesn't exists on touch. But the same intent is possible: I expect a long press on something to give me feedback that if I lift my finger it's going to do what the preview hints, and if I don't want it, I move my finger out that control before lifting it, avoiding triggering what that control would have done. The same pointer-down behavior works with a mouse as well, and I'd expect the same behavior I descried, which I think is covered by the "active" state in CSS.

So hover is a pre-active, or an "active hint". We have "controlActiveFill", so we could replace "controlHoverFill" by "controlActiveHintFill"


## Active

in VisualStyle, I think we're missing the following:

{name: "baseSurfaceActiveFill", variable: "--visual-style-base-surface-active-fill", defaultValue: "hsl(0, 0%, 100%)"},
{name: "raisedSurfaceActiveFill", variable: "--visual-style-raised-surface-active-fill", backup: "baseSurfaceFill"},
{name: "elevatedSurfaceActiveFill", variable: "--visual-style-elevated-surface-active-fill", backup: "baseSurfaceFill"},

and that current implementation could be a default implementation, even by introducing a variable for the % of the mix?

I think we're also missing active text specific styling variables?


## Thoughts on interactive states

In CSS they have a specific syntax, the pseudo :hover, :active, etc... But separating the notion of "user interaction" - active, hover, focus, from being embedded in the visualStyle's properties, feels like it might make it harder to use? Any thoughts on how we could pull that off and be both conceptually cleaner and more usable?