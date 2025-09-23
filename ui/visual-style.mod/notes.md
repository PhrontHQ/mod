# Notes
- Default style was derived from the [digit](https://github.com/PhrontHQ/digit) light theme

## Outstanding Questions / TODOS

### Tasks
- Move the property definitions from the inline js to a visual-style.mjson with relationships, default values.
- Allow devs to define new properties and variables without subclassing
- Pull out use of @scope and @layer from component.js.
- Apply visual-style to all controls in mod/ui/
- Account for browser-prefixes such as the following
```css
    background-image: -webkit-linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,92%) );
    background-image: -moz-linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,92%) );
    background-image: -ms-linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,92%) );
    background-image: linear-gradient(top, hsl(0,0%,96%), hsl(0,0%,92%) );
```


### Icons
- Should VisualStyle provide a standard icon set? Should it provide variables with icon values? e.g. --visual-style-left-carat

### Sizing
VisualStyle should include a property or properties to determine the size of controls. 

#### Proposal
Create a property that defines a base control size and let other controls size themselves accordingly. 

Option A - General property - Create `controlStandardHeight` and let that be the height of buttons and text inputs. Text Areas might set their hight to 3x `controlStandardHeight`. Slider bars might set their height to 0.5x `controlStandardHeight`. 

Option B - Choose a "baseline" control - create `controlButtonHeight` and let that be the height of buttons and text inputs. Text Areas might set their hight to 3x `controlButtonHeight`. Slider bars might set their height to 0.5x `controlButtonHeight`. 



### Other Properties

#### Colors
- `controlSuccessFill`
- `controlWarningFill`
- `controlErrorFill`

Shadow, transparancy, opacity