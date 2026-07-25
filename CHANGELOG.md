# Change Log

All notable changes to the "rzk-1-experimental-highlighting" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## v0.6.1 - 2026-07-25

This release updates the grammar to match `rzk` v0.11.1, which adds higher
inductive types. The minimum supported `rzk` version is unchanged (v0.11.0);
an extension-managed `rzk` picks up v0.11.1 on its own, since it always
updates to the latest release the extension supports.

- Highlight the re-ascription clauses `eliminate with` and `compute with`,
  which replace the `eliminator` clause of `rzk` v0.11.0. Both are matched as
  two-word sequences, as `let mod` already was, because `compute` on its own
  is a plausible identifier and only the pair is a keyword.
- The `into` motive of a modal `let mod` (new in `rzk` v0.11.1) needs no
  grammar change: `into` was already a keyword for `match`.
- Cover the new syntax in the tests: the circle with a path constructor and
  both re-ascription clauses, taken from the `rzk` documentation and checked
  against `rzk` v0.11.1, is added to the snapshot fixtures.

## v0.6.0 - 2026-07-21

This release accompanies `rzk` v0.11.0 and pins the extension to it: the
minimum supported `rzk` version is now v0.11.0 (previously v0.9.2), and
an extension-managed `rzk` updates automatically.

- Postulates and assumptions are now highlighted distinctly, at the declaration and at every use site, so a proof that leans on an axiom is visible at a glance. There are three tiers, in decreasing order of severity: a `#postulate` (a permanent axiom) renders in the error red of the `invalid` scope; a top-level `#assume` (a file-wide axiom such as `funext`, discharged at module end) renders in the same reddish colour as holes; an `#assume` inside a `#section` (a hypothesis the section abstracts over at its `#end`) renders in italics. The colours come from the language server marking these names with standard semantic token modifiers (`abstract`, plus `static` for postulates), which the extension maps to TextMate scopes. Requires `rzk` v0.11.0 or higher.
- Update the TextMate grammar for the `rzk` v0.11.0 syntax:
  - highlight the `#data` command (the declared name colours as a type,
    with the `uses` clause supported as for `#define`);
  - highlight `match`, `into`, and the `eliminator` clause as keywords,
    the branch arrows `⇒` / `=>`, and the lattice operations
    `⊔` / `⊓` / `sup` / `inf`;
  - drop the patterns for the syntax removed in `rzk` v0.11.0 (brace
    parameters `{p : A | φ}`). This also fixes a mis-highlighting: a
    single-line block comment containing a colon was coloured as a
    brace parameter instead of a comment.
- Drop the highlighting of the old modal-type syntax `<| m | A |>`.
- Colour the tope of a paren-form shaped parameter `(t : 2 | φ)` as the
  brace form used to (possible now that the modal-type bar is gone).
- Fix a parameter region opened by a non-parameter group (such as
  `(suc n)`) before a later colon, which could span to following lines
  and mis-colour them.
- Highlighting for the experimental modal syntax, contributed by
  [Islam Talipov](https://github.com/LIshy2)
  ([#74](https://github.com/rzk-lang/vscode-rzk/pull/74)): the cubical
  interval `𝕀` / `II` with its endpoints (`0_I`, `1ᵢ`, and variants),
  and modality annotations in binders (`(x :♭ A)`) in place of the
  retired modal-type brackets.

## v0.5.0 - 2026-07-14

This release pins the extension to `rzk` v0.9.2 or above. Everything new in
`rzk` v0.9.2 is provided by the language server, so updating `rzk` is all it
takes to get, in the editor:

- a typechecking progress indicator, with a working Cancel button;
- cross-file go-to-references and hover;
- workspace symbol search (<kbd>CTRL + T</kbd> / <kbd>⌘ + T</kbd>);
- highlighting for holes;
- warnings for modules blocked by an error in an earlier module;
- cleaner rendering of types in hovers and error messages.

Installation and updates:

- Require `rzk` v0.9.2 or above (previously v0.6.0).
- Add the `rzk.manageInstallation` setting. Set it to `"always"` to have the
  extension install and update `rzk` for you even when `rzk` is available in
  `PATH` — previously, an `rzk` in `PATH` meant no automatic updates at all.
  `"never"` disables downloading `rzk` altogether. An explicitly configured
  `rzk.path` still takes precedence in either case.
- Download the ARM64 binary on Apple Silicon, instead of running the Intel
  binary under Rosetta.
- Reinstall an extension-managed `rzk` when it is older than the minimum
  supported version, so that pinning the version actually reaches existing
  users.
- Warn (once per version) when your own `rzk` is older than the minimum
  supported version. Such an `rzk` is still used: pinning `rzk.path` to a
  particular binary is treated as deliberate.
- Report an available update at most once per version, rather than on every
  activation, for installations the extension does not manage.

## v0.4.6 - 2026-05-31

Syntax highlighting:

- Extend the TextMate grammar to match the latest Rzk surface syntax. New
  constructs covered: block comments (`{- ... -}`), hole identifiers (`?`),
  modal type bracketing (`<| ... |>`), standalone `let` keyword, ASCII `_id`
  modality, `Unit` type and `unit` term, all tope/cube inversions
  (`invᵒᵖ`, `uninvᵒᵖ`, `flipᵒᵖ`, `unflipᵒᵖ` + ASCII variants), and the
  internal `$extract$` keyword (rendered as `invalid` to signal it is not
  for user code).
- Fix lambda highlighting: `\` after a space (e.g. `:= \ x -> x`) now
  receives the lambda scope, and `->` correctly closes the lambda region.
  Two bugs were involved: a `\b` word-boundary in the lambda begin pattern
  that could not match between space and `\`, and a `#param-identifiers`
  regex that could match a zero-length span and silently collapse the
  enclosing begin/end region.
- Add modal-syntax highlighting contributed by
  [Islam Talipov](https://github.com/LIshy2) ([#73](https://github.com/rzk-lang/vscode-rzk/pull/73)):
  modal-type brackets, `mod`/`let mod`, and the three Unicode modalities
  (`♭`, `♯`, `ᵒᵖ`) plus ASCII forms.

UX:

- Suppress VS Code's automatic color decorators for Rzk files, so `#def`,
  `#abc`, etc. no longer get a colour-swatch preview from being mistaken
  for hex colour codes.
- Add the `Rzk: Check for updates` command for triggering an on-demand
  update check ([#57](https://github.com/rzk-lang/vscode-rzk/issues/57)).
- Add the `rzk.updateCheckIntervalMinutes` setting (default 60) to
  configure how often the extension checks GitHub for new `rzk` releases;
  set to `0` to disable the periodic check
  ([#56](https://github.com/rzk-lang/vscode-rzk/issues/56)).

Project hygiene:

- Bump CI from Node 18 to Node 20 (the latest `@vscode/vsce` requires
  Node 20+); bump `actions/setup-node`, `actions/upload-artifact`, and
  `actions/download-artifact` from v3 to v4.
- Add a grammar test suite (`vscode-tmgrammar-test` for inline-annotated
  unit tests and `vscode-tmgrammar-snap` for snapshot tests over real-world
  Rzk extracted from sHoTT). `npm test` runs both layers; CI invokes it.
- Update the README to document `rzk.format.enable` and to mention support
  for `*.rzk.tex` files.

## v0.4.5 - 2023-12-08

- Added some sensible default settings for Rzk files formatting and a message upon formatting for the first time ([#66](https://github.com/rzk-lang/vscode-rzk/pull/66))

## v0.4.4 - 2023-12-06

- Fixed a regression that caused first-time installations to fail

## v0.4.3 - 2023-11-02

- Check for updates to Rzk periodically (hourly for now) instead of just on launch ([#53](https://github.com/rzk-lang/vscode-rzk/pull/53)).
- Fix the word pattern once more to detect Rzk identifiers properly without interfering with the latex-input extension ([#61](https://github.com/rzk-lang/vscode-rzk/pull/61)).
- Fix updating Rzk installation on Ubuntu ([#63](https://github.com/rzk-lang/vscode-rzk/pull/63))

## v0.4.2 — 2023-09-28

- Fix the word pattern to allow triggering latex-input extension on `\` (see [#51](https://github.com/rzk-lang/vscode-rzk/pull/51))

## v0.4.1 - 2023-09-27

- Provide the option to build `rzk` via [stack](https://docs.haskellstack.org/en/stable/) or [cabal](https://www.haskell.org/cabal/).
- Update extension name and description to reflect the newly added features (with LSP).
- Define `wordPattern` to help VS Code recognize how an identifier looks like in Rzk. This should fix IntelliSense completion for identifiers with non-alpha characters.

## v0.4.0 - 2023-09-23

- IntelliSense support for `rzk.yaml` (requires the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml))
- Replace the custom tokenizer with LSP support (available starting Rzk `v0.6.0`) (see [#36](https://github.com/rzk-lang/vscode-rzk/pull/36))
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
