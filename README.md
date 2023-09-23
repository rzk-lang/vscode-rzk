# Supporting Rzk in VSCode (`rzk-1-experimental-highlighting`)

Syntax and semantic highlighting for [`rzk`](https://rzk-lang.github.io/rzk/), an experimental proof assistant for synthetic ∞-categories, as well as automatic typechecking.

![Syntax highlighting example.](images/example-unfolding-square.png)

Features:

1. Basic syntax highlighting with a simple TextMate grammar.
2. Semantic highlighting via LSP (you must have `rzk` version v0.6 or above).
3. Prompts for installing/updating `rzk` binaries from GitHub Releases automatically (usable from local Terminal).
4. Markdown Preview button for `*.rzk.md` files.
5. Automatic typechecking for all files listed in `rzk.yaml`

See [Changelog](CHANGELOG.md) for recent updated and changes.

More examples:

![Syntax highlighting example.](images/example-relfunext2.png)

## Typechecking

The extension typechecks files in the open project automatically and reports all errors as diagnostic messages.
To define a Rzk project, simply create a file called `rzk.yaml` (**not** `.yml`!) that lists all the files to be typechecked under the `include` field. All paths are relative to the project root and support wildcards (for supported operators, see [glob](https://hackage.haskell.org/package/Glob-0.10.2/docs/System-FilePath-Glob.html#v:compile)).

For example, a typcial `rzk.yaml` would look like so:

```yaml
include:
  - 'src/**/*.rzk'
  - 'src/**/*.rzk.md'
```

Typechecking takes place automatically once the project is first opened and upon _saving_ changes to any of the source files or the configuration file.

## Configuration

Extension settings can be configured by going to the settings page (using the menu `File > Preferences > Settings`, or using the shortcut <kbd>CTRL + ,</kbd> on Windows/Linux or <kbd>⌘ + ,</kbd> on macOS).

The currently available settings are:

| Name                   | Type      | Default value | Description                                                                                                                                   |
| ---------------------- | --------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `rzk.path`             | `string`  | `""`          | The path to the `rzk` executable to use for the language server. `""` (default) means that `rzk` executable available in `PATH` will be used. |
| `rzk.fetchPrereleases` | `boolean` | `false`       | If true, will include releases marked as \"pre-release\" on GitHub when fetching the latest binaries.                                         |
