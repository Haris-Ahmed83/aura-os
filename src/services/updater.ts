import { Capacitor } from '@capacitor/core';

const GITHUB_REPO = 'Haris-Ahmed83/aura-os';
const LAST_CHECK_KEY = 'aura_last_update_check';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;

export async function checkForUpdates(): Promise<{ hasUpdate: boolean; version?: string; downloadUrl?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { hasUpdate: false };
  }

  try {
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck && (Date.now() - Number(lastCheck)) < CHECK_INTERVAL) {
      return { hasUpdate: false };
    }

    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    );

    if (!response.ok) return { hasUpdate: false };

    const release = await response.json();
    const latestVersion = release.tag_name?.replace('v', '');

    if (!latestVersion) return { hasUpdate: false };

    const bundleAsset = release.assets?.find((a: any) =>
      a.name === 'web-bundle.zip'
    );

    if (!bundleAsset) return { hasUpdate: false };

    return {
      hasUpdate: true,
      version: latestVersion,
      downloadUrl: bundleAsset.browser_download_url
    };
  } catch (error) {
    console.error('Update check failed:', error);
    return { hasUpdate: false };
  }
}
