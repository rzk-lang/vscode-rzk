import * as vscode from 'vscode';
import { spawnSync } from 'node:child_process';
import { delimiter } from 'node:path';
import { output } from './logging';
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

  const binFolder = vscode.Uri.joinPath(context.globalStorageUri, 'bin');

  installRzkIfNotExists({ binFolder });

  context.environmentVariableCollection.append(
    'PATH',
    delimiter + binFolder.fsPath
  );

  vscode.commands.registerCommand(
    'rzk.clearLocalInstallations',
    (silent = false) => {
      clearLocalInstallations(binFolder, silent);
    }
  );

  let client: LanguageClient;
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

    const fileEvents: vscode.FileSystemWatcher[] = [];
    if (vscode.workspace.workspaceFolders?.length) {
      // Only single-folder workspaces are supported for now
      const pattern = new vscode.RelativePattern(
        vscode.workspace.workspaceFolders[0],
        'rzk.yaml'
      );
      const configFileWatcher =
        vscode.workspace.createFileSystemWatcher(pattern);
      fileEvents.push(configFileWatcher);
    }
    fileEvents.push(
      vscode.workspace.createFileSystemWatcher('**/*.rzk'),
      vscode.workspace.createFileSystemWatcher('**/*.rzk.md')
    );
    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
      documentSelector: ['rzk', 'literate rzk markdown'],
      synchronize: {
        // This option is deprecated, but the server doesn't receive config changes without it
        configurationSection: 'rzk',
        fileEvents,
      },
      middleware: {
        async provideDocumentFormattingEdits(document, options, token, next) {
          const lspResults = await next(document, options, token);
          const previouslyPrompted = context.globalState.get<boolean>(
            'formattingPromptDisplayed',
            false
          );
          if (lspResults?.length && !previouslyPrompted) {
            vscode.window
              .showInformationMessage(
                'Your document has just been formatted by Rzk! You can disable this in the extension settings.',
                'Keep it enabled',
                'Disable autoformatting'
              )
              .then((choice) => {
                if (choice === 'Disable autoformatting') {
                  vscode.workspace
                    .getConfiguration('rzk')
                    .update('format.enable', false);
                }
                if (choice) {
                  context.globalState.update('formattingPromptDisplayed', true);
                }
              });
          }
          return lspResults;
        },
      },
    };

    // Create the language client and start the client.
    client = new LanguageClient(
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
  // For internal use. I don't see a good reason to expose to the client
  vscode.commands.registerCommand('rzk.stopLspServer', async () => {
    try {
      await client?.stop();
      output.appendLine('Language server stopped successfully');
    } catch (e) {
      output.appendLine('Error stopping language server: ' + JSON.stringify(e));
    }
  });

  vscode.commands.registerCommand('rzk.restartLspServer', async () => {
    try {
      await client?.restart();
      output.appendLine('Language server restarted successfully');
    } catch (e) {
      output.appendLine(
        'Error restarting language server: ' + JSON.stringify(e)
      );
    }
  });
}
