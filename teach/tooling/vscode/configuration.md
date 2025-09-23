# VSCode Best Practices + Conventions

### Component-specific Teach
A teach for a component can be opened as it's own workspace in VSCode. This allows mod and the teach to be opened in adjacent windows. It also allows the teach to leverage workspace-level features in VSCode. 

The baseline configuration of the teach workspace is as follows
```
<component-name>.mod/
      -- teach/
        -- .vscode/
            --settings.json
```
where settings.json sets the workspace title to be the name of the teach
```json
{
    "workspace.title": "<component-name>.mod/teach"
}
```
For example, the `settings.json` in `button.mod/teach/.vscode/settings.json`
```json
{
    "workspace.title": "button.mod/teach"
}
```