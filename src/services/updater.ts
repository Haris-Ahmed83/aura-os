import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

const GITHUB_REPO = 'Haris-Ahmed83/aura-os';
const APPLIED_VERSION_KEY = 'aura_applied_version';

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

    const lastApplied = localStorage.getItem(APPLIED_VERSION_KEY);
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

    localStorage.setItem(APPLIED_VERSION_KEY, latestVersion);

    await new Promise(resolve => setTimeout(resolve, 500));

    await CapacitorUpdater.set({ id: downloaded.id });

    return { hasUpdate: true, version: latestVersion };
  } catch (error) {
    console.error('Update check failed:', error);
    return { hasUpdate: false };
  }
}
