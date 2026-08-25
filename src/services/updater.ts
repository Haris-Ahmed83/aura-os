import { Capacitor } from '@capacitor/core';

const GITHUB_REPO = 'Haris-Ahmed83/aura-os';
const APK_VERSION_KEY = 'aura_apk_version';

export interface UpdateInfo {
  hasUpdate: boolean;
  version?: string;
  apkDownloadUrl?: string;
}

export async function checkForUpdates(): Promise<UpdateInfo> {
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

    const lastApkApplied = localStorage.getItem(APK_VERSION_KEY);
    if (lastApkApplied === latestVersion) {
      return { hasUpdate: false };
    }

    const apkAsset = release.assets?.find((a: any) => a.name === 'app-debug.apk');
    if (!apkAsset) return { hasUpdate: false };

    return {
      hasUpdate: true,
      version: latestVersion,
      apkDownloadUrl: apkAsset.browser_download_url,
    };
  } catch (error) {
    console.error('Update check failed:', error);
    return { hasUpdate: false };
  }
}

export async function downloadAndInstallApk(url: string, version: string): Promise<void> {
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: blobUrl });

    localStorage.setItem(APK_VERSION_KEY, version);
  } catch (_e) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
    localStorage.setItem(APK_VERSION_KEY, version);
  }
}
