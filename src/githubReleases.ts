import * as vscode from 'vscode';
import semver from 'semver';
import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import { output } from './logging';

// TODO: use an API token to avoid low rate limits
const octokit = new Octokit();

/** In semver range format */
const supportedRzkVersions = '>=0.11.0 <1.0.0';

/** The lowest version of rzk this extension works with, e.g. "0.11.0" */
export const minimumRzkVersion =
  semver.minVersion(supportedRzkVersions)?.version ?? '0.11.0';

type Release =
  RestEndpointMethodTypes['repos']['listReleases']['response']['data'][number];
type Asset = Release['assets'][number];
type RzkPlatform = 'Windows' | 'macOS' | 'Linux';
type RzkArch = 'X64' | 'ARM64';

const platformMapping: Partial<Record<NodeJS.Platform, RzkPlatform>> = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
};

const archMapping: Record<string, RzkArch | undefined> = {
  x64: 'X64',
  arm64: 'ARM64',
};

/**
 * The names of the release assets usable on the current platform, most preferred first.
 * Only macOS ships an ARM64 build (as of rzk v0.9.x), so an X64 asset is always
 * listed as a fallback: it runs under emulation on Apple Silicon and Windows on ARM.
 */
function getReleaseAssetNames(release: Release) {
  const platform = platformMapping[process.platform];
  if (!platform) {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
  const arch = archMapping[process.arch];
  const archs: RzkArch[] = arch && arch !== 'X64' ? [arch, 'X64'] : ['X64'];
  return archs.map(
    (arch) => `rzk-${release.tag_name}-${platform}-${arch}.tar.gz`
  );
}

/** The best release asset for the current platform, if the release has one */
function findReleaseAsset(release: Release): Asset | undefined {
  for (const name of getReleaseAssetNames(release)) {
    const asset = release.assets.find((asset) => asset.name === name);
    if (asset) return asset;
  }
  return undefined;
}

/**
 * Checks whether the given rzk version is compatible with the extension
 * @param version A version string, e.g. "1.3.2" or "v0.4.1.1"
 */
export function isCompatibleVersion(version: string) {
  return semver.satisfies(semver.coerce(version) ?? '', supportedRzkVersions);
}

/**
 * Finds the latest release on GitHub that is compatible with the extension and returns its information.
 */
export async function fetchLatestCompatibleRelease(): Promise<
  Release | undefined
> {
  // TODO: implement pagination in case no release matches the criteria in the default page size
  const { data: releases } = await octokit.rest.repos.listReleases({
    owner: 'rzk-lang',
    repo: 'rzk',
  });

  const fetchPrereleases =
    vscode.workspace.getConfiguration().get<boolean>('rzk.fetchPrereleases') ??
    false;
  // Find the latest release that satisfies the version range the extension supports
  //   and has an asset for the current platform
  const latestRelease = releases.find(
    (release) =>
      isCompatibleVersion(release.tag_name) &&
      (fetchPrereleases || !release.prerelease) &&
      findReleaseAsset(release)
  );
  return latestRelease;
}

/**
 * Fetches the appropriate executable file from GitHub for the current platform
 */
export async function fetchReleaseBinary(release: Release) {
  const asset = findReleaseAsset(release);
  if (!asset) {
    output.appendLine(
      `Error: none of ${getReleaseAssetNames(release).join(
        ', '
      )} were found in release ${release.tag_name}`
    );
    return undefined;
  }
  output.appendLine(`Downloading ${asset.name}`);
  const { data } = await octokit.rest.repos.getReleaseAsset({
    owner: 'rzk-lang',
    repo: 'rzk',
    asset_id: asset.id,
    headers: {
      Accept: 'application/octet-stream',
    },
  });
  // The "Accept" header affects the type of the returned data, which is not reflected in the typings
  const binary = data as unknown as ArrayBuffer;
  return binary;
}
