# Change Log

All notable changes to the "rzk-1-experimental-highlighting" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## v0.4.1 - 2023-09-27

### Added

- The extension now provides the option to build `rzk` via [stack](https://docs.haskellstack.org/en/stable/) or [cabal](https://www.haskell.org/cabal/).

### Changed

- Updated extension name and description to reflect the newly added features (with LSP).

### Fixed

- Defined `wordPattern` to help VS Code recognize how an identifier looks like in Rzk. This should fix IntelliSense completion for identifiers with non-alpha characters.

## v0.4.0 - 2023-09-23

### Added

- IntelliSense support for `rzk.yaml` (requires the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml))

### Changed

- Replaced the custom tokenizer with LSP support (available starting Rzk `v0.6.0`) (see [#36](https://github.com/rzk-lang/vscode-rzk/pull/36))

## v0.3.7 — 2023-07-10

- Add option to download pre-releases (do not by default) (see [#35](https://github.com/rzk-lang/vscode-rzk/pull/35))

## v0.3.6 — 2023-07-10

- Move to [rzk-lang/vscode-rzk](https://github.com/rzk-lang/vscode-rzk/) (see [#34](https://github.com/rzk-lang/vscode-rzk/pull/34))

## v0.3.5 — 2023-07-09

- Add a bundler to prevent shipping node_modules folder (see [#33](https://github.com/rzk-lang/vscode-rzk/pull/33))

## v0.3.4 — 2023-07-06

Minor improvements:

- Suggest updating globally installed `rzk` version if a new version is available on GitHub Releases (see [#32](https://github.com/rzk-lang/vscode-rzk/pull/32));
- Automatically compile TypeScript when debugging (see [#31](https://github.com/rzk-lang/vscode-rzk/pull/31));

## v0.3.3 — 2023-07-06

- Add VS Code's local bin folder to PATH in local Terminal so that local installation of `rzk` is available there (see [#30](https://github.com/rzk-lang/vscode-rzk/pull/30)).

## v0.3.2 — 2023-07-05

1. Prompt installing/updating `rzk` binary from GitHub Releases!
2. Add configuration option to specify preferred path to `rzk` (use the one found in `PATH` by default).
3. Update highlighting via TextMate for some Unicode syntax introduced in `rzk-0.5.2`.

## v0.3.1 — 2023-06-21

1. Add `rzk.path` configuration option (see [#22](https://github.com/rzk-lang/vscode-rzk/pull/22)).
2. Add GitHub Action to compile/check the extension (see [#23](https://github.com/rzk-lang/vscode-rzk/pull/23)).

## v0.3.0 — 2023-06-20

This version introduces improvements to the highlighting:

1. Add semantic highlighting via `rzk tokenize` feature in rzk (v0.5 and higher, see https://github.com/rzk-lang/rzk/pull/53) (see [#15](https://github.com/rzk-lang/vscode-rzk/pull/15)).
2. Fix a few issues with TextMate highlighting (see [#14](https://github.com/rzk-lang/vscode-rzk/pull/14)).

## v0.2.6 — 2023-06-16

Add Markdown Preview button for Literate Rzk (see [#16](https://github.com/rzk-lang/vscode-rzk/pull/16)).

## v0.2.5 — 2023-06-11

1. Support syntax highlighting for `*.rzk.tex` files (see [#5](https://github.com/rzk-lang/vscode-rzk/pull/5)).
2. Add icons for literate Rzk files (both Markdown and TeX, see [#13](https://github.com/rzk-lang/vscode-rzk/pull/13)).
3. Some minor fixes (restoring rainbow-parentheses and keybinding for code commenting).
4. Using YAML for the language grammar (see [#6](https://github.com/rzk-lang/vscode-rzk/pull/6)).
5. Add `launch.json` and prettify (see [#1](https://github.com/rzk-lang/vscode-rzk/pull/1)).

## v0.2.4 — 2023-05-27

Support syntax highlighting for `*.rzk.md` files

## v0.2.3 — 2023-05-20

Support syntax highlighting for most of rzk-v0.4.0

## 0.2.2

Slight improvements in syntax highlighting.

## 0.2.1

Add file icons for `.rzk` files.

## 0.2.0

Support `rzk` code blocks in Markdown files.

## 0.0.2

Do not treat `<` and `>` as brackets in the extension.

## 0.0.1

Initial release of the Syntax Highlighter for rzk
