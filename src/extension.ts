import * as vscode from 'vscode';
import { spawnSync } from 'node:child_process';
import { type TokenModifier, type TokenType, legend } from './semanticTokens';

// Inspired by https://github.com/microsoft/vscode-extension-samples/tree/main/semantic-tokens-sample

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
    const path =
      vscode.workspace.getConfiguration().get<string | null>('rzk.path') ??
      'rzk';
    const processResult = spawnSync(path, ['tokenize'], { input: doc });
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
