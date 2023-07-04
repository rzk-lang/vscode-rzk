import * as vscode from 'vscode';
import { output } from './logging';
import { legend, DocumentSemanticTokensProvider } from './semanticTokens';
import { installRzkIfNotExists } from './installRzk';

// Inspired by https://github.com/microsoft/vscode-extension-samples/tree/main/semantic-tokens-sample

export function activate(context: vscode.ExtensionContext) {
  output.appendLine('Rzk extension activated.');
  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      ['rzk', 'literate rzk markdown'],
      new DocumentSemanticTokensProvider(),
      legend
    )
  );

  const binFolder = context.globalStorageUri.with({
    path: context.globalStorageUri.path + '/bin',
  });

  installRzkIfNotExists({ binFolder });
}
