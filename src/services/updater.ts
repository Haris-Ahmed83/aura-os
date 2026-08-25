import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

const GITHUB_REPO = 'Haris-Ahmed83/aura-os';
const APPLIED_VERSION_KEY = 'aura_applied_version';
const APK_VERSION_KEY = 'aura_apk_version';
const CURRENT_VERSION_KEY = 'aura_current_version';

export interface UpdateInfo {
  hasWebUpdate: boolean;
  hasApkUpdate: boolean;
  version?: string;
  apkDownloadUrl?: string;
  webBundleUrl?: string;
}

export function getCurrentVersion(): string {
  return localStorage.getItem(CURRENT_VERSION_KEY) || '0';
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
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const fileName = `web-bundle-${version}.zip`;

          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          const fileUri = await Filesystem.getUri({
            path: fileName,
            directory: Directory.Cache,
          });

          const downloaded = await CapacitorUpdater.download({
            url: fileUri.uri,
            version: version,
          });

          localStorage.setItem(APPLIED_VERSION_KEY, version);
          localStorage.setItem(CURRENT_VERSION_KEY, version);
          await CapacitorUpdater.set({ id: downloaded.id });

          resolve(true);
        } catch (e) {
          console.error('Web apply failed:', e);
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Web update download failed:', error);
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
