# Change Log

All notable changes to the "rzk-1-experimental-highlighting" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

### v0.3.2 — 2022-07-05

1. Prompt installing/updating `rzk` binary from GitHub Releases!
2. Add configuration option to specify preferred path to `rzk` (use the one found in `PATH` by default).
3. Update highlighting via TextMate for some Unicode syntax introduced in `rzk-0.5.2`.

### v0.3.1 — 2022-06-21

1. Add `rzk.path` configuration option (see [#22](https://github.com/fizruk/vscode-rzk/pull/22)).
2. Add GitHub Action to compile/check the extension (see [#23](https://github.com/fizruk/vscode-rzk/pull/23)).

### v0.3.0 — 2022-06-20

This version introduces improvements to the highlighting:

1. Add semantic highlighting via `rzk tokenize` feature in rzk (v0.5 and higher, see https://github.com/fizruk/rzk/pull/53) (see [#15](https://github.com/fizruk/vscode-rzk/pull/15)).
2. Fix a few issues with TextMate highlighting (see [#14](https://github.com/fizruk/vscode-rzk/pull/14)).

### v0.2.6 — 2022-06-16

Add Markdown Preview button for Literate Rzk (see [#16](https://github.com/fizruk/vscode-rzk/pull/16)).

### v0.2.5 — 2022-06-11

1. Support syntax highlighting for `*.rzk.tex` files (see [#5](https://github.com/fizruk/vscode-rzk/pull/5)).
2. Add icons for literate Rzk files (both Markdown and TeX, see [#13](https://github.com/fizruk/vscode-rzk/pull/13)).
3. Some minor fixes (restoring rainbow-parentheses and keybinding for code commenting).
4. Using YAML for the language grammar (see [#6](https://github.com/fizruk/vscode-rzk/pull/6)).
5. Add `launch.json` and prettify (see [#1](https://github.com/fizruk/vscode-rzk/pull/1)).

### v0.2.4 — 2022-05-27

Support syntax highlighting for `*.rzk.md` files

### v0.2.3 — 2022-05-20

Support syntax highlighting for most of rzk-v0.4.0

### 0.2.2

Slight improvements in syntax highlighting.

### 0.2.1

Add file icons for `.rzk` files.

### 0.2.0

Support `rzk` code blocks in Markdown files.

### 0.0.2

Do not treat `<` and `>` as brackets in the extension.

### 0.0.1

Initial release of the Syntax Highlighter for rzk
