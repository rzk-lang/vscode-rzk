# rzk-1-experimental-highlighting README

Syntax highlighting for [`rzk`](https://fizruk.github.io/rzk/), an experimental proof assistant for synthetic ∞-categories.

![Syntax highlighting example.](images/example-unfolding-square.png)

Features:

1. Basic syntax highlighting with a simple TextMate grammar.
2. Semantic highlighting via `rzk tokenize` (you must have `rzk` in your PATH, with version v0.5 or above).
3. Markdown Preview button for `*.rzk.md` files.

See [Changelog](CHANGELOG.md) for recent updated and changes.

More examples:

![Syntax highlighting example.](images/example-relfunext2.png)

## Configuration

Extension settings can be configured by going to the settings page (using the menu `File > Preferences > Settings`, or using the shortcut <kbd>CTRL + ,</kbd> on Windows/Linux or <kbd>⌘ + ,</kbd> on macOS).

The currently available settings are:

| Name       | Type             | Default value | Description |
| ---------- | ---------------- | ------------- | ----------- |
| `rzk.path` | `string \| null` | `null`        | The path to the `rzk` executable to use for the language server. Defaults to using the globally available one on the `PATH` |
