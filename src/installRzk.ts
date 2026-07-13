import * as vscode from 'vscode';
import semver from 'semver';
import { spawn, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { output } from './logging';
import {
  fetchReleaseBinary,
  fetchLatestCompatibleRelease,
  isCompatibleVersion,
  minimumRzkVersion,
} from './githubReleases';
import { extract } from 'tar';
import { getConfiguredRzkPath, getManageInstallation } from './config';

const binExtension = process.platform === 'win32' ? '.exe' : '';
const binName = 'rzk' + binExtension;

const rzkReleasesUrl = 'https://github.com/rzk-lang/rzk/releases/latest';

/**
 * Reads the version of the rzk binary at `binPath` (e.g. "0.9.2"),
 * or null if it is not a working rzk executable.
 */
function getRzkVersion(binPath: string) {
  const result = spawnSync(binPath, ['version']);
  if (result.status !== 0) {
    return null;
  }
  return result.stdout.toString().trim();
}

/**
 * Finds the user's own installation of rzk (from `rzk.path`, then the PATH),
 * along with its version
 */
function getUserRzkPath() {
  // Check the config variable first, then the PATH
  const configuredPath = getConfiguredRzkPath();
  const path = configuredPath || 'rzk';
  // TODO: handle reporting errors for the config being set but not pointing to a valid executable
  const version = getRzkVersion(path);
  if (version == null) {
    return null;
  }
  return { path, version, isConfigured: configuredPath !== '' };
}

/**
 * Shows a message at most once, keyed by `key`. Used for notifications that would
 * otherwise reappear on every activation. Without `globalState` (i.e. when the user
 * asked for the check explicitly) the message is always shown.
 */
async function showOnce(
  globalState: vscode.Memento | undefined,
  key: string,
  show: () => Thenable<unknown>
) {
  if (globalState) {
    if (globalState.get<boolean>(key, false)) return;
    await globalState.update(key, true);
  }
  // Ignore the returned promise to not block the rest of the code waiting for user input
  void show();
}

/**
 * Warns that the user's own rzk is too old for this extension. The binary is used
 * regardless: `rzk.path` may well be pinned to an old version deliberately.
 */
async function warnUnsupportedVersion(
  { version, isConfigured }: { version: string; isConfigured: boolean },
  globalState: vscode.Memento | undefined
) {
  output.appendLine(
    `rzk v${version} is older than the minimum supported v${minimumRzkVersion}. Using it anyway.`
  );
  // `rzk.manageInstallation` is only a way out for an rzk picked up from the PATH:
  // an explicitly configured `rzk.path` takes precedence over the managed copy.
  const hint = isConfigured
    ? 'Please update it, or clear `rzk.path` to let VS Code install and update rzk for you.'
    : 'Please update your installation of rzk, or set `rzk.manageInstallation` to "always" to have VS Code install and update rzk for you.';
  const settingToOpen = isConfigured ? 'rzk.path' : 'rzk.manageInstallation';
  await showOnce(globalState, `unsupportedRzkVersion:${version}`, () =>
    vscode.window
      .showWarningMessage(
        `This extension requires rzk v${minimumRzkVersion} or above, but v${version} is installed. Features such as cross-file references, hover and typechecking progress will not work. ${hint}`,
        'Open releases',
        'Open settings'
      )
      .then((choice) => {
        if (choice === 'Open releases') {
          void vscode.env.openExternal(vscode.Uri.parse(rzkReleasesUrl));
        }
        if (choice === 'Open settings') {
          void vscode.commands.executeCommand(
            'workbench.action.openSettings',
            settingToOpen
          );
        }
      })
  );
}

export async function installRzkIfNotExists({
  binFolder,
  globalState,
}: {
  binFolder: vscode.Uri;
  globalState: vscode.Memento;
}) {
  const manageInstallation = getManageInstallation();
  const userRzk = getUserRzkPath();
  // An explicitly configured `rzk.path` is always respected, even when the extension
  // is asked to manage the installation: pinning a particular binary is deliberate.
  const useManagedInstead =
    manageInstallation === 'always' && !userRzk?.isConfigured;

  if (userRzk != null && !useManagedInstead) {
    const { path, version } = userRzk;
    output.appendLine(
      `Using rzk v${version} from "${path === 'rzk' ? 'PATH' : path}"`
    );
    // This installation is not managed by the extension, so it cannot be updated here.
    // An unsupported version is reported on its own; checking for updates on top of
    // that would only produce a second notification saying the same thing.
    if (!isCompatibleVersion(version)) {
      await warnUnsupportedVersion(userRzk, globalState);
      return;
    }
    await checkForUpdates(path, {
      globalState,
      isConfiguredPath: userRzk.isConfigured,
    });
    return;
  }

  if (manageInstallation === 'never') {
    output.appendLine(
      'Cannot find rzk, and `rzk.manageInstallation` is set to "never", so it will not be installed automatically.'
    );
    await showOnce(globalState, 'manageInstallationNeverWarning', () =>
      vscode.window.showWarningMessage(
        'Cannot find rzk, and `rzk.manageInstallation` is set to "never". Install rzk yourself, or change the setting to let the extension install it for you.'
      )
    );
    return;
  }

  if (useManagedInstead && userRzk != null) {
    output.appendLine(
      `Found rzk v${userRzk.version} on the PATH, but \`rzk.manageInstallation\` is set to "always". Using the extension-managed installation instead.`
    );
  }

  // Create the bin folder (recursively) if it doesn't exist
  await vscode.workspace.fs.createDirectory(binFolder);
  const listing = await vscode.workspace.fs.readDirectory(binFolder);

  const localBin = listing
    .filter(([_name, type]) => type === vscode.FileType.File)
    .find(([name, _type]) => name === binName);
  if (localBin) {
    const path = join(binFolder.fsPath, localBin[0]);
    const version = getRzkVersion(path);
    output.appendLine(
      `Found local installation of rzk: ${path} (v${version ?? 'unknown'})`
    );
    // The extension owns this binary, so an unsupported (or broken) one is simply
    // replaced, without asking: the extension cannot work with it as it is.
    if (version == null || !isCompatibleVersion(version)) {
      output.appendLine(
        `Local rzk (v${
          version ?? 'unknown'
        }) does not satisfy the minimum supported v${minimumRzkVersion}. Reinstalling.`
      );
      await vscode.window.withProgress(
        {
          title: `Updating rzk (v${
            version ?? 'unknown'
          } => v${minimumRzkVersion} or above)...`,
          location: vscode.ProgressLocation.Notification,
          cancellable: false,
        },
        (progress) => installLatestRzk(binFolder, progress)
      );
      return;
    }
    await checkForUpdates(path, { binFolder, globalState });
    const intervalMinutes =
      vscode.workspace
        .getConfiguration()
        .get<number>('rzk.updateCheckIntervalMinutes') ?? 60;
    if (intervalMinutes > 0) {
      setInterval(
        () => checkForUpdates(path, { binFolder, globalState }),
        1000 * 60 * intervalMinutes
      );
    }
    return;
  }

  // Asking would be redundant: setting `rzk.manageInstallation` to "always" *is* the
  // request to have rzk installed and kept up to date by the extension.
  if (manageInstallation === 'always') {
    output.appendLine(
      'No extension-managed installation of rzk yet. Installing it, since `rzk.manageInstallation` is set to "always".'
    );
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: false,
      },
      (progress) => {
        progress.report({ message: 'Installing rzk...' });
        return installLatestRzk(binFolder, progress);
      }
    );
    return;
  }

  output.appendLine(
    "Prompting to install rzk — if you don't see a prompt, VS Code's Do Not Disturb mode is likely suppressing it."
  );
  // Ignore the returned promise to not block the rest of the code waiting for user input
  void vscode.window
    .showWarningMessage(
      "Cannot find 'rzk' in PATH. Install latest version of rzk from GitHub releases?",
      'Yes',
      'Build via...',
      'Ignore'
    )
    .then(async (value) => {
      if (value === 'Yes') {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
          },
          (progress) => {
            progress.report({
              message: `Installing rzk...`,
            });
            return installLatestRzk(binFolder, progress);
          }
        );
      } else if (value === 'Build via...') {
        const choice = await vscode.window.showQuickPick(['stack', 'cabal'], {
          title: 'This will install rzk globally on your system',
          ignoreFocusOut: true,
          placeHolder: 'Install using:',
        });
        if (choice === undefined) return;
        output.appendLine('Building via ' + choice);
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            cancellable: true,
          },
          (progress, cancellationToken) => {
            progress.report({
              message: `Installing rzk using ${choice}...`,
            });
            return buildRzkWithPackageManager(choice, cancellationToken);
          }
        );
      }
    });
}

type Progress = Parameters<Parameters<typeof vscode.window.withProgress>[1]>[0];
async function installLatestRzk(binFolder: vscode.Uri, progress?: Progress) {
  output.appendLine('Installing rzk...');
  const release = await fetchLatestCompatibleRelease();
  if (!release) {
    vscode.window.showErrorMessage(
      'An error occurred fetching GitHub releases!'
    );
    return;
  }
  output.appendLine(`Fetched rzk release ${release.tag_name} from GitHub`);
  progress?.report({
    message: `Installing rzk ${release.tag_name}...`,
  });
  const assetBuffer = await fetchReleaseBinary(release);
  if (!assetBuffer) {
    output.appendLine('Failed to fetch release asset');
    return;
  }
  output.appendLine(`Downloaded binary for release ${release.tag_name}`);

  output.appendLine(`Extracting to "${binFolder.path}"`);
  const assetStream = Readable.from(Buffer.from(assetBuffer));
  // Stop the server to avoid any possible permission denied errors
  await vscode.commands
    .executeCommand('rzk.stopLspServer')
    .then(undefined, (err) => {
      output.appendLine(
        `Error stopping the LSP server (${err}). Perhaps the server wasn't running? `
      );
    });
  // Silently clear the existing installation. Apparently, stopping the server is not enough
  await vscode.commands
    .executeCommand('rzk.clearLocalInstallations', true)
    .then(undefined, (err) => {
      output.appendLine('Error clearing local installations.');
    });
  let error = false;
  const tarInputStream = extract({
    cwd: binFolder.fsPath,
    onwarn(code, message, data) {
      // Note: throwing here causes it to fail silently. It cannot be caught
      error = true;
      output.appendLine(
        `Error ${code} occurred while extracting: "${message}"`
      );
      vscode.window
        .showWarningMessage(
          `An error occurred during extraction (${code}).
Please file an issue on [GitHub](https://github.com/rzk-lang/vscode-rzk/issues).
Don't forget to include the logs from the output panel.`,
          'Open output panel'
        )
        .then((action) => {
          if (action === 'Open output panel') {
            output.show();
          }
        });
    },
  });
  await pipeline(assetStream, tarInputStream);
  if (error) return;
  output.appendLine('File extracted successfully');
  vscode.window
    .showInformationMessage(
      'Rzk installed successfully. Please reload the window for the changes to take effect',
      'Reload'
    )
    .then((value) => {
      if (value === 'Reload') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    });
}

function buildRzkWithPackageManager(
  manager: string,
  cancellationToken: vscode.CancellationToken
) {
  return new Promise<void>((resolve, reject) => {
    if (!['stack', 'cabal'].includes(manager)) return;
    const childProcess = spawn(manager, ['install', 'rzk']);
    cancellationToken.onCancellationRequested(() =>
      childProcess.kill('SIGTERM')
    );
    childProcess.on('error', (err) => {
      vscode.window.showErrorMessage(
        'Installation failed ☹️. Error: ' + err.message
      );
      output.appendLine(`Error installing with ${manager}:`);
      output.appendLine('\t' + err.stack);
      reject();
    });
    childProcess.on('exit', (code) => {
      output.appendLine('Installation finished with return code: ' + code);
      vscode.window
        .showInformationMessage(
          'Installation successful 🎉! Please reload your window for the changes to take effect',
          'Reload'
        )
        .then((value) => {
          if (value === 'Reload') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
      resolve();
    });
  });
}

type UpdateCheckOptions = {
  /** Set when rzk is the extension-managed installation, which can be updated in place */
  binFolder?: vscode.Uri;
  /**
   * Set when the check runs automatically (on activation, or on a timer), so that each
   * available update is reported at most once. Omitted when the user asks for the check
   * explicitly, in which case the result is always reported.
   */
  globalState?: vscode.Memento;
  /**
   * Set when rzk comes from an explicitly configured `rzk.path`. Such a binary takes
   * precedence over the managed copy, so `rzk.manageInstallation` is not a way out of
   * updating it by hand.
   */
  isConfiguredPath?: boolean;
};

export async function checkForUpdates(
  binPath: string,
  { binFolder, globalState, isConfiguredPath }: UpdateCheckOptions = {}
) {
  output.appendLine('Checking if updates are available');
  const version = getRzkVersion(binPath);
  if (version == null) {
    output.appendLine(`Cannot determine the version of rzk at "${binPath}"`);
    return;
  }
  const latestRelease = await fetchLatestCompatibleRelease();
  if (latestRelease == null) {
    output.appendLine('Cannot find updates on GitHub');
    return;
  }
  const alreadyLatest = semver.gte(
    semver.coerce(version) ?? '',
    semver.coerce(latestRelease.tag_name) ?? ''
  );
  if (alreadyLatest) {
    output.appendLine('Local rzk version is already the latest available 👍');
    return;
  }
  output.appendLine(
    `An update is available (v${version} => ${latestRelease.tag_name}). Notifying the user — if you don't see a notification, VS Code's Do Not Disturb mode is likely suppressing it.`
  );
  if (binFolder) {
    // The extension manages this installation and can update it in place.
    // Not deduplicated: declining an update should not stop the extension from
    // offering it again on the next periodic check (see `rzk.updateCheckIntervalMinutes`).
    void vscode.window
      .showWarningMessage(
        `Version v${version} of rzk is installed, but ${latestRelease.tag_name} is available. Would you like to update?`,
        'Yes',
        'No'
      )
      .then(async (value) => {
        if (value === 'Yes') {
          output.appendLine('Updating local rzk version');
          await vscode.window.withProgress(
            {
              title: `Updating rzk (v${version} => ${latestRelease.tag_name})...`,
              location: vscode.ProgressLocation.Notification,
              cancellable: false,
            },
            (progress) => installLatestRzk(binFolder, progress)
          );
        }
      });
  } else {
    // Rzk is not managed by this extension, so it cannot be updated from here
    const hint = isConfiguredPath
      ? 'Please update it, or clear `rzk.path` to let VS Code install and update rzk for you.'
      : 'Please update your installation of rzk, or set `rzk.manageInstallation` to "always" to have VS Code install and update rzk for you.';
    const settingToOpen = isConfiguredPath
      ? 'rzk.path'
      : 'rzk.manageInstallation';
    await showOnce(
      globalState,
      `rzkUpdateAvailable:${version}=>${latestRelease.tag_name}`,
      () =>
        vscode.window
          .showInformationMessage(
            `Version v${version} of rzk is installed, but ${latestRelease.tag_name} is available. ${hint}`,
            'Release notes',
            'Open settings'
          )
          .then((choice) => {
            if (choice === 'Release notes') {
              void vscode.env.openExternal(
                vscode.Uri.parse(latestRelease.html_url)
              );
            }
            if (choice === 'Open settings') {
              void vscode.commands.executeCommand(
                'workbench.action.openSettings',
                settingToOpen
              );
            }
          })
    );
  }
}

export function clearLocalInstallations(binFolder: vscode.Uri, silent = false) {
  vscode.workspace.fs
    .delete(vscode.Uri.joinPath(binFolder, binName))
    .then(() => {
      if (silent) return;
      return vscode.window.showInformationMessage(
        'Rzk successfully removed from VS Code. Please reload the window',
        'Reload'
      );
    })
    .then((value) => {
      if (value === 'Reload') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    });
}
