import { useEffect, useCallback } from 'react';
import { Sun, Moon, Waves, Sunset, Monitor } from 'lucide-react';

type Theme = 'dark' | 'midnight' | 'ocean' | 'light';

interface ThemeManagerProps {
  currentTheme: Theme | 'auto';
  onThemeChange: (theme: string) => void;
}

const themeDefinitions: Record<Theme, { bg: string; surface: string; surface2: string; text: string; text2: string; text3: string; border: string; glassBorder: string; accent: string }> = {
  dark: {
    bg: '#09090b',
    surface: '#16161a',
    surface2: '#1c1c21',
    text: '#F8FAFC',
    text2: '#CBD5E1',
    text3: '#94A3B8',
    border: '#27272a',
    glassBorder: 'rgba(255,255,255,0.06)',
    accent: '#D4AF37',
  },
  midnight: {
    bg: '#0a0f1a',
    surface: '#111827',
    surface2: '#1a2332',
    text: '#E2E8F0',
    text2: '#CBD5E1',
    text3: '#94A3B8',
    border: '#1e293b',
    glassBorder: 'rgba(255,255,255,0.05)',
    accent: '#D4AF37',
  },
  ocean: {
    bg: '#0c1222',
    surface: '#1e293b',
    surface2: '#263348',
    text: '#F1F5F9',
    text2: '#CBD5E1',
    text3: '#94A3B8',
    border: '#334155',
    glassBorder: 'rgba(255,255,255,0.06)',
    accent: '#D4AF37',
  },
  light: {
    bg: '#f8fafc',
    surface: '#ffffff',
    surface2: '#f1f5f9',
    text: '#1e293b',
    text2: '#475569',
    text3: '#94a3b8',
    border: '#e2e8f0',
    glassBorder: 'rgba(0,0,0,0.06)',
    accent: '#D4AF37',
  },
};

const themeIcons: Record<Theme, typeof Moon> = {
  dark: Moon,
  midnight: Sunset,
  ocean: Waves,
  light: Sun,
};

const themeLabels: Record<Theme, string> = {
  dark: 'Dark',
  midnight: 'Midnight',
  ocean: 'Ocean',
  light: 'Light',
};

const themePreviews: Record<Theme, { bg: string; surface: string; text: string }> = {
  dark: { bg: '#09090b', surface: '#16161a', text: '#F8FAFC' },
  midnight: { bg: '#0a0f1a', surface: '#111827', text: '#E2E8F0' },
  ocean: { bg: '#0c1222', surface: '#1e293b', text: '#F1F5F9' },
  light: { bg: '#f8fafc', surface: '#ffffff', text: '#1e293b' },
};

function applyTheme(theme: Theme) {
  const vars = themeDefinitions[theme];
  const root = document.documentElement;
  root.style.setProperty('--bg', vars.bg);
  root.style.setProperty('--surface-1', vars.surface);
  root.style.setProperty('--surface-2', vars.surface2);
  root.style.setProperty('--accent', vars.accent);
  root.style.setProperty('--text-1', vars.text);
  root.style.setProperty('--text-2', vars.text2);
  root.style.setProperty('--text-3', vars.text3);
  root.style.setProperty('--border', vars.border);
  root.style.setProperty('--glass-border', vars.glassBorder);
  root.setAttribute('data-theme', theme);
}

function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function ThemeManager({ currentTheme, onThemeChange }: ThemeManagerProps) {
  const resolvedTheme: Theme = currentTheme === 'auto' ? getSystemTheme() : currentTheme;

  const handleThemeChange = useCallback(
    (theme: string) => {
      onThemeChange(theme);
      localStorage.setItem('aura_theme', theme);
      applyTheme(theme === 'auto' ? getSystemTheme() : theme as Theme);
    },
    [onThemeChange]
  );

  useEffect(() => {
    applyTheme(resolvedTheme);

    if (currentTheme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme(getSystemTheme());
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [currentTheme, resolvedTheme]);

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Theme</h3>
      <div style={styles.grid}>
        <ThemeOption
          label="Auto"
          icon={<Monitor size={18} />}
          isActive={currentTheme === 'auto'}
          preview={null}
          onClick={() => handleThemeChange('auto')}
        />
        {(Object.keys(themePreviews) as Theme[]).map((theme) => {
          const Icon = themeIcons[theme];
          const preview = themePreviews[theme];
          return (
            <ThemeOption
              key={theme}
              label={themeLabels[theme]}
              icon={<Icon size={18} />}
              isActive={resolvedTheme === theme && currentTheme !== 'auto'}
              preview={preview}
              onClick={() => handleThemeChange(theme)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ThemeOption({
  label,
  icon,
  isActive,
  preview,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  preview: { bg: string; surface: string; text: string } | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.option,
        ...(isActive ? styles.optionActive : {}),
      }}
    >
      {preview ? (
        <div style={styles.previewCircle}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: preview.bg,
              border: `2px solid ${preview.surface}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: preview.text,
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      ) : (
        <div style={styles.iconWrap}>{icon}</div>
      )}
      <span style={styles.label}>{label}</span>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  heading: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-1)',
    margin: 0,
  },
  grid: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  option: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    background: 'var(--surface-2, var(--surface-1))',
    color: 'var(--text-2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: 64,
  },
  optionActive: {
    borderColor: 'var(--accent)',
    background: 'color-mix(in srgb, var(--accent) 10%, var(--surface-2, var(--surface-1)))',
    color: 'var(--accent)',
  },
  previewCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1,
  },
};

export default ThemeManager;
