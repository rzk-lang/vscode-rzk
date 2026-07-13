import * as vscode from 'vscode';

export type ManageInstallation = 'auto' | 'always' | 'never';

/**
 * Whether the extension should install and update its own copy of rzk:
 *  - "auto" — only when rzk cannot be found on the system;
 *  - "always" — even when rzk is available on the PATH;
 *  - "never" — never download rzk.
 *
 * An explicitly configured `rzk.path` always takes precedence over the managed copy.
 */
export function getManageInstallation(): ManageInstallation {
  const value = vscode.workspace
    .getConfiguration()
    .get<string>('rzk.manageInstallation');
  return value === 'always' || value === 'never' ? value : 'auto';
}

/** The path configured in `rzk.path`, or an empty string when it is not set */
export function getConfiguredRzkPath(): string {
  // Using `||` and not `??` to handle the empty string (the default value) as well
  return vscode.workspace.getConfiguration().get<string>('rzk.path') || '';
}
