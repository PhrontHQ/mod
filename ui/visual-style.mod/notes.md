# Simplifying Visual Style Authoring

These are notes of possible ways to re-think what could be a smaller set of Visual Style properties that would serve as the foundation, trying to move away from a pure CSS property based approach

## Shadows

A** ****shadow**** **is the dark area or shape produced when an object blocks light. It occurs because light travels in straight lines and cannot bend around opaque objects. When light is obstructed, the space behind the object (relative to the light source) receives less or no light, creating a shadow.

#### Key Characteristics of Shadows:

* **Shape:**** **A shadow often mimics the outline of the object casting it, though its size and sharpness depend on the light source’s size, distance, and angle.
* **Intensity:**** **Shadows can vary from faint to deep black, depending on how much light is blocked.
* **Movement:**** **Shadows change position and shape as the light source or object moves (e.g., the sun’s movement causes shadows to shift throughout the day).
* **Types:**
  * **Umbra:**** **The darkest part of a shadow where all light is blocked.
  * **Penumbra:**** **A lighter, partial shadow where only some light is blocked.

Shadows are fundamental in physics, art, and everyday perception, helping us understand depth, time, and the presence of light sources. Would you like to explore shadows in a specific context, like science, photography, or symbolism

So in a nushell, shadows shouldn't be defined on their own: they should be the result of a light source (color, xyz position and intensity) running into interface elements of a certain height / elevation. A Flat design shouldn't have shadows, except for a modal above the main area. But change the elevation / height of controls' surfaces and shadows should appear.

## Color Palette

A set of colors that goes well together. But should among that set of colors, which one may be assigned to different roles is something that we might want to facilitate: which one goes to titles, vs background surface, or control surface?

## Border Radius - Roundness?

It would be convenient as a simplified input, but it would make this hard:

https://9elements.github.io/fancy-border-radius/#100.79.43.49--.

There might be a way, need more thoughts

## Contrast, applied to elevation

if applied to the elevation of controls' interactive surfaces (z axis height, vertically) a flat design could be seen as as a contrast of 0, a negative value would means recessed buttons and a positive contrast would mean skeumorphic-like look.
