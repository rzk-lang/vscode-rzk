import * as vscode from 'vscode';
import { spawnSync } from 'node:child_process';

// Inspired by https://github.com/microsoft/vscode-extension-samples/tree/main/semantic-tokens-sample

// https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide#standard-token-types-and-modifiers
const tokenTypes = [
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

const tokenModifiers = [
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
const legend = new vscode.SemanticTokensLegend(
  tokenTypes as Writeable<typeof tokenTypes>,
  tokenModifiers as Writeable<typeof tokenModifiers>
);

let output = vscode.window.createOutputChannel('Rzk');
export function activate(context: vscode.ExtensionContext) {
  output.appendLine('Rzk extension activated.');
  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      ['rzk', 'literate rzk markdown'],
      new DocumentSemanticTokensProvider(),
      legend
    )
  );
}

type TokenType = (typeof tokenTypes)[number];
type TokenModifier = (typeof tokenModifiers)[number];

interface ParsedToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: TokenType;
  tokenModifiers: TokenModifier[];
}

class DocumentSemanticTokensProvider
  implements vscode.DocumentSemanticTokensProvider
{
  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    output.appendLine(`Parsing file "${document.uri}"`);
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
    const processResult = spawnSync('rzk', ['tokenize'], { input: doc });
    const stdout = processResult.stdout.toString();
    output.appendLine(stdout);
    try {
      return JSON.parse(stdout);
    } catch {
      return [];
    }
  }
}
