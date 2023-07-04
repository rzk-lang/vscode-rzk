import * as vscode from 'vscode';
import { spawnSync } from 'node:child_process';
import { output } from './logging';
import { legend, DocumentSemanticTokensProvider } from './semanticTokens';
import { installRzkIfNotExists } from './installRzk';

function locateRzk(context: vscode.ExtensionContext) {
  let path =
    vscode.workspace.getConfiguration().get<string | null>('rzk.path') ?? null;
  // Probe 1 - extension settings
  if (path) {
    const result = spawnSync(path, ['version']);
    if (result.status === 0) {
      return path;
    } else {
      output.appendLine(
        'The configured `rzk.path` option does not point to a valid rzk executable'
      );
    }
  }
  // Probe 2 - global PATH
  const binExtension = process.platform === 'win32' ? '.exe' : '';
  path = 'rzk' + binExtension;
  let result = spawnSync(path, ['version']);
  if (result.status === 0) {
    return path;
  } else {
    output.appendLine('Cannot find rzk globally');
  }

  // Probe 3 - extension storage bin folder
  path = context.globalStorageUri.with({
    path: context.globalStorageUri.path + '/bin/rzk' + binExtension,
  }).path;
  result = spawnSync(path, ['version']);
  if (result.status === 0) {
    return path;
  }

  return null;
}

export function activate(context: vscode.ExtensionContext) {
  output.appendLine('Rzk extension activated.');

  const rzkPath = locateRzk(context);

  if (rzkPath) {
    context.subscriptions.push(
      vscode.languages.registerDocumentSemanticTokensProvider(
        ['rzk', 'literate rzk markdown'],
        new DocumentSemanticTokensProvider(rzkPath),
        legend
      )
    );
  }

  const binFolder = context.globalStorageUri.with({
    path: context.globalStorageUri.path + '/bin',
  });

  installRzkIfNotExists({ binFolder });
}
