import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

const GITHUB_REPO = 'Haris-Ahmed83/aura-os';
const LAST_APPLIED_KEY = 'aura_last_applied_version';

export async function checkForUpdates(): Promise<{ hasUpdate: boolean; version?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { hasUpdate: false };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    );

    if (!response.ok) return { hasUpdate: false };

    const release = await response.json();
    const latestVersion = release.tag_name?.replace('v', '');

    if (!latestVersion) return { hasUpdate: false };

    const lastApplied = localStorage.getItem(LAST_APPLIED_KEY);
    if (lastApplied === latestVersion) {
      return { hasUpdate: false };
    }

    const bundleAsset = release.assets?.find((a: any) =>
      a.name === 'web-bundle.zip'
    );

    if (!bundleAsset) return { hasUpdate: false };

    const downloaded = await CapacitorUpdater.download({
      url: bundleAsset.browser_download_url,
      version: latestVersion,
    });

    await CapacitorUpdater.set({ id: downloaded.id });
    localStorage.setItem(LAST_APPLIED_KEY, latestVersion);

    return { hasUpdate: true, version: latestVersion };
  } catch (error) {
    console.error('Update check failed:', error);
    return { hasUpdate: false };
  }
}
