import * as vscode from 'vscode';
import { spawnSync } from 'node:child_process';
import { output } from './logging';

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

interface ParsedToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: TokenType;
  tokenModifiers: TokenModifier[];
}

export class DocumentSemanticTokensProvider
  implements vscode.DocumentSemanticTokensProvider
{
  constructor(private rzkPath: string) {}

  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    // output.appendLine(`Parsing file "${document.uri}"`);
    const allTokens: ParsedToken[] = this._parseText(document.getText());
    const builder = new vscode.SemanticTokensBuilder(legend);
    allTokens.forEach((token) => {
      builder.push(
        new vscode.Range(
          new vscode.Position(token.line, token.startCharacter),
          new vscode.Position(token.line, token.startCharacter + token.length)
        ),
        token.tokenType,
        token.tokenModifiers
      );
    });
    return builder.build();
  }

  private _parseText(doc: string): ParsedToken[] {
    const processResult = spawnSync(this.rzkPath, ['tokenize'], { input: doc });
    if (processResult.error) {
      const { message, stack } = processResult.error;
      output.appendLine('Error running rzk:' + message + '\n' + stack);
      return [];
    }
    if (processResult.stderr.length) {
      output.appendLine(
        'Error tokenizing:\n' + processResult.stderr.toString()
      );
      return [];
    }
    const stdout = processResult.stdout.toString();
    try {
      return JSON.parse(stdout);
    } catch {
      return [];
    }
  }
}
