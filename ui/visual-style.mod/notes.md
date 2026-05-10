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


## Option to change variable names based on states (hover, selected. etc..)

### 1. Changing Values with Pseudo-classes

The most common way to handle states is using pseudo-classes like :hover, :focus, or :active. You define the variable in the base state and redefine it in the state-specific selector. 

```
.button {
  /* 1. Define base variables */
  --bg-color: #3498db;
  --text-color: white;
  --scale: 1;

  background-color: var(--bg-color);
  color: var(--text-color);
  transform: scale(var(--scale));
  transition: all 0.3s ease;
}

.button:hover {
  /* 2. Simply override the variable values */
  --bg-color: #2980b9;
  --scale: 1.1;
}

.button:active {
  --bg-color: #1a5276;
  --scale: 0.95;
}
```


### 2. Theming and Global States

For larger state changes like "Dark Mode" or a specific "UI Theme," you can redefine variables at a higher level (like :root or a parent class). Because CSS custom properties cascade, all children using those variables will update instantly. 

```
:root {
  --main-bg: #ffffff;
  --main-text: #333333;
}

/* Change variables based on a body class (set via JavaScript) */
body.dark-mode {
  --main-bg: #1a1a1a;
  --main-text: #f0f0f0;
}

/* Or based on system preferences */
@media (prefers-color-scheme: dark) {
  :root {
    --main-bg: #1a1a1a;
    --main-text: #f0f0f0;
  }
}
```

### 3. Advanced: The "Space Toggle" Trick 

You can even create "on/off" switches using custom properties. By setting a variable to either a space ( ) or initial, you can toggle multiple properties at once. 

```
.card {
  /* If --is-active is a space, the first fallback is used. 
     If it's 'initial', it becomes invalid and the second value is used. */
  --is-active: initial; 
  
  background: var(--is-active, #2ecc71) var(--no-active, #e74c3c);
}

.card.active {
  --is-active: ; /* setting it to an empty space */
}
```
