import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

const GITHUB_REPO = 'Haris-Ahmed83/aura-os';
const APPLIED_VERSION_KEY = 'aura_applied_version';
const APK_VERSION_KEY = 'aura_apk_version';

export interface UpdateInfo {
  hasWebUpdate: boolean;
  hasApkUpdate: boolean;
  version?: string;
  apkDownloadUrl?: string;
  webBundleUrl?: string;
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  if (!Capacitor.isNativePlatform()) {
    return { hasWebUpdate: false, hasApkUpdate: false };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    );

    if (!response.ok) return { hasWebUpdate: false, hasApkUpdate: false };

    const release = await response.json();
    const latestVersion = release.tag_name?.replace('v', '');

    if (!latestVersion) return { hasWebUpdate: false, hasApkUpdate: false };

    const result: UpdateInfo = { hasWebUpdate: false, hasApkUpdate: false, version: latestVersion };

    const lastWebApplied = localStorage.getItem(APPLIED_VERSION_KEY);
    if (lastWebApplied !== latestVersion) {
      const bundleAsset = release.assets?.find((a: any) => a.name === 'web-bundle.zip');
      if (bundleAsset) {
        result.hasWebUpdate = true;
        result.webBundleUrl = bundleAsset.browser_download_url;
      }
    }

    const lastApkApplied = localStorage.getItem(APK_VERSION_KEY);
    if (lastApkApplied !== latestVersion) {
      const apkAsset = release.assets?.find((a: any) => a.name === 'app-debug.apk');
      if (apkAsset) {
        result.hasApkUpdate = true;
        result.apkDownloadUrl = apkAsset.browser_download_url;
      }
    }

    return result;
  } catch (error) {
    console.error('Update check failed:', error);
    return { hasWebUpdate: false, hasApkUpdate: false };
  }
}

export async function applyWebUpdate(url: string, version: string): Promise<boolean> {
  try {
    const redirectResponse = await fetch(url, { redirect: 'follow' });
    const directUrl = redirectResponse.url;

    const downloaded = await CapacitorUpdater.download({
      url: directUrl,
      version: version,
    });

    localStorage.setItem(APPLIED_VERSION_KEY, version);
    await new Promise(resolve => setTimeout(resolve, 500));
    await CapacitorUpdater.set({ id: downloaded.id });

    return true;
  } catch (error) {
    console.error('Web update failed:', error);
    throw error;
  }
}

export async function downloadAndInstallApk(url: string, version: string): Promise<void> {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
    localStorage.setItem(APK_VERSION_KEY, version);
  } catch (error) {
    console.error('APK download failed:', error);
    throw error;
  }
}
