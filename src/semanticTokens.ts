import * as vscode from 'vscode';

// https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide#standard-token-types-and-modifiers
export const tokenTypes = [
  'namespace',
  'class',
  'enum',
  'interface',
  'struct',
  'typeParameter',
  'type',
  'parameter',
  'variable',
  'property',
  'enumMember',
  'decorator',
  'event',
  'function',
  'method',
  'macro',
  'label',
  'comment',
  'string',
  'keyword',
  'number',
  'regexp',
  'operator',
] as const;

export const tokenModifiers = [
  'declaration',
  'definition',
  'readonly',
  'static',
  'deprecated',
  'abstract',
  'async',
  'modification',
  'documentation',
  'defaultLibrary',
] as const;

// A workaround because a readonly string[] is not assignable to a normal string[]
type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export const legend = new vscode.SemanticTokensLegend(
  tokenTypes as Writeable<typeof tokenTypes>,
  tokenModifiers as Writeable<typeof tokenModifiers>
);

export type TokenType = (typeof tokenTypes)[number];
export type TokenModifier = (typeof tokenModifiers)[number];
