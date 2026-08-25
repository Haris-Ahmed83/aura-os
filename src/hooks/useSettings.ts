import { useState, useCallback, useEffect } from 'react';
import type { AppSettings } from '../App';
import { toast } from 'sonner';

const defaultSettings: AppSettings = {
  displayName: 'Haris',
  theme: 'dark',
  notifications: true,
  autoSave: true,
  compactMode: false,
  geminiApiKey: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('aura_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aura_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    document.body.className = '';
    if (settings.theme !== 'dark') {
      document.body.classList.add(`theme-${settings.theme}`);
    }
  }, [settings.theme]);

  const handleSaveSettings = useCallback(() => {
    localStorage.setItem('aura_settings', JSON.stringify(settings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    toast.success('Settings saved!');
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    settings,
    setSettings,
    settingsSaved,
    setSettingsSaved,
    handleSaveSettings,
    updateSetting,
  };
}