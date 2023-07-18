import * as vscode from 'vscode';
import { spawnSync } from 'node:child_process';
import { delimiter } from 'node:path';
import { output } from './logging';
// import { legend, DocumentSemanticTokensProvider } from './semanticTokens';
import { clearLocalInstallations, installRzkIfNotExists } from './installRzk';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient/node';

function locateRzk(context: vscode.ExtensionContext) {
  let path = vscode.workspace.getConfiguration().get<string>('rzk.path') ?? '';
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
  path = vscode.Uri.joinPath(
    context.globalStorageUri,
    'bin',
    'rzk' + binExtension
  ).fsPath;
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
    // context.subscriptions.push(
    //   vscode.languages.registerDocumentSemanticTokensProvider(
    //     ['rzk', 'literate rzk markdown'],
    //     new DocumentSemanticTokensProvider(rzkPath),
    //     legend
    //   )
    // );
  }

  const binFolder = vscode.Uri.joinPath(context.globalStorageUri, 'bin');

  installRzkIfNotExists({ binFolder });

  context.environmentVariableCollection.append(
    'PATH',
    delimiter + binFolder.fsPath
  );

  vscode.commands.registerCommand('rzk.clearLocalInstallations', () => {
    clearLocalInstallations(binFolder);
  });

  if (rzkPath) {
    let serverOptions: ServerOptions = {
      run: {
        command: rzkPath,
        args: ['lsp'],
      },
      debug: {
        command: rzkPath,
        args: ['lsp'],
      },
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
      // Register the server for plain text documents
      documentSelector: ['rzk', 'literate rzk markdown'],
      // synchronize: {
      //   fileEvents: vscode.workspace.createFileSystemWatcher('**/*.rzk'),
      // },
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
      'rzk-language-server',
      'Rzk Language Server',
      serverOptions,
      clientOptions
    );

    // Start the client. This will also launch the server
    client
      .start()
      .then(() => {
        output.appendLine('Language server started ' + client.isRunning());
      })
      .catch((e) => {
        output.appendLine('Language server error: ' + JSON.stringify(e));
      });

    context.subscriptions.push(client);
  }
}
