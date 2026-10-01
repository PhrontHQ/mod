# Repository Guide

- This is a CommonJS Mod/Montage library, not a conventional app; modules are loaded through `montage.js`/the `core/mr` loader and package boundaries are defined by `package.json` mappings and manifests.
- UI components usually span a `.js`, `.mjson`, `.html`, and `.css` file under `ui/`; keep serialized metadata in sync when changing a component's declared properties.
- The root test package is `test/`; `test/package.json` maps `mod` and `mod-testing` to the repository, and `test/manifest.json` supplies test-package resources.
- Run `npm test` for the Node/Jasmine suite; DOM-dependent UI tests need the browser runner, `npm run test:karma` (Chrome, single run), or `npm run test:jasmine` (HTTP server plus browser page).
- Run `npm run lint` for the repository JSHint check; test specs are excluded by `.jshintignore`, while `core/mr` has a focused `npm run lint-mr` command.
- CI runs `lint`, `test`, `test:karma-travis`, and an `integration` job; integration uses `MONTAGE_VERSION` and `MOP_VERSION` (the CI invocation is `npm run integration MONTAGE_VERSION=. MOP_VERSION="#master"`).
- Browser tests use `karma.conf.js`, load source and serialized resources directly, and default to Chrome; CI's Chrome launcher adds `--no-sandbox`.
- FRB parser sources have generated output: use `npm run build-frb-parser` or `npm run peggy-build-frb-parser` only when intentionally regenerating the parser.
- Follow the repository formatting settings: four spaces, LF line endings, no trailing whitespace, and a final newline (`.editorconfig`); JSHint is configured for ES6-era code with required semicolons and four-space indentation.


## Development Best Practices

- In ES6 classes, properties without a getter and setter are added in the static block of the class by calling Montage.addProperties(this.prototype, props)
  