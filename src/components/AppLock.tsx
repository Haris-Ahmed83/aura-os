import { useState, useCallback, useEffect, useRef } from 'react';
import { Lock, Fingerprint, Delete, AlertCircle } from 'lucide-react';

interface AppLockProps {
  onUnlock: () => void;
}

const PIN_LENGTH = 6;
const STORAGE_HASH_KEY = 'aura_lock_hash';
const STORAGE_ENABLED_KEY = 'aura_lock_enabled';

function hashPin(pin: string): string {
  return btoa(pin);
}

function AppLock({ onUnlock }: AppLockProps) {
  const [phase, setPhase] = useState<'set' | 'confirm' | 'enter'>('set');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_ENABLED_KEY);
    if (stored === 'true') {
      setPhase('enter');
    }

    if (window.PublicKeyCredential) {
      setBiometricAvailable(true);
    }
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      setError('');
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + digit;
        if (next.length === PIN_LENGTH) {
          handlePinComplete(next);
        }
        return next;
      });
    },
    [phase, confirmPin]
  );

  const handlePinComplete = useCallback(
    (completePin: string) => {
      if (phase === 'set') {
        setConfirmPin(completePin);
        setPhase('confirm');
        setPin('');
      } else if (phase === 'confirm') {
        if (completePin === confirmPin) {
          const hash = hashPin(completePin);
          localStorage.setItem(STORAGE_HASH_KEY, hash);
          localStorage.setItem(STORAGE_ENABLED_KEY, 'true');
          onUnlock();
        } else {
          setError('PINs do not match. Try again.');
          triggerShake();
          setPhase('set');
          setPin('');
          setConfirmPin('');
        }
      } else if (phase === 'enter') {
        const storedHash = localStorage.getItem(STORAGE_HASH_KEY);
        if (hashPin(completePin) === storedHash) {
          onUnlock();
        } else {
          setError('Incorrect PIN');
          triggerShake();
          setPin('');
        }
      }
    },
    [phase, confirmPin, onUnlock, triggerShake]
  );

  const handleBackspace = useCallback(() => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' && pin.length === PIN_LENGTH) {
        handlePinComplete(pin);
      }
    },
    [handleDigit, handleBackspace, pin, handlePinComplete]
  );

  const handleBiometric = useCallback(async () => {
    try {
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          onUnlock();
        }
      }
    } catch {
      setError('Biometric auth not available');
    }
  }, [onUnlock]);

  const getTitle = () => {
    if (phase === 'set') return 'Set Your PIN';
    if (phase === 'confirm') return 'Confirm PIN';
    return 'Enter PIN to Unlock';
  };

  const getSubtitle = () => {
    if (phase === 'set') return `Choose a ${PIN_LENGTH}-digit PIN`;
    if (phase === 'confirm') return 'Re-enter your PIN';
    return '';
  };

  return (
    <div style={styles.overlay}>
      <div style={{
        ...styles.container,
        ...(shake ? styles.shake : {}),
      }}>
        <div style={styles.iconContainer}>
          <Lock size={32} color="var(--accent)" />
        </div>

        <h2 style={styles.title}>{getTitle()}</h2>
        {getSubtitle() && <p style={styles.subtitle}>{getSubtitle()}</p>}

        <div style={styles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                ...(i < pin.length ? styles.dotFilled : {}),
              }}
            />
          ))}
        </div>

        {error && (
          <div style={styles.errorRow}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              style={styles.key}
              onClick={() => handleDigit(String(d))}
              aria-label={`Digit ${d}`}
            >
              {d}
            </button>
          ))}
          <div style={styles.keySpacer}>
            {biometricAvailable && phase === 'enter' && (
              <button
                style={{ ...styles.key, ...styles.bioKey }}
                onClick={handleBiometric}
                aria-label="Biometric unlock"
              >
                <Fingerprint size={20} />
              </button>
            )}
          </div>
          <button
            style={styles.key}
            onClick={() => handleDigit('0')}
            aria-label="Digit 0"
          >
            0
          </button>
          <button
            style={{ ...styles.key, ...styles.backspaceKey }}
            onClick={handleBackspace}
            aria-label="Delete"
          >
            <Delete size={20} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={pin}
          onKeyDown={handleKeyDown}
          readOnly
          style={styles.hiddenInput}
          aria-label="PIN input"
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    backdropFilter: 'blur(20px)',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    padding: 40,
    maxWidth: 320,
    width: '100%',
  },
  shake: {
    animation: 'shake 0.5s ease-in-out',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--text-1)',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-3)',
    margin: 0,
    marginTop: -12,
  },
  dotsRow: {
    display: 'flex',
    gap: 12,
    padding: '8px 0',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid var(--border)',
    background: 'transparent',
    transition: 'all 0.15s ease',
  },
  dotFilled: {
    background: 'var(--accent)',
    borderColor: 'var(--accent)',
    boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 40%, transparent)',
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#ef4444',
    fontSize: 13,
    minHeight: 20,
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    width: '100%',
    maxWidth: 260,
  },
  key: {
    height: 56,
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--surface-2, var(--surface-1))',
    color: 'var(--text-1)',
    fontSize: 20,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.1s ease',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  keySpacer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioKey: {
    background: 'color-mix(in srgb, var(--accent) 10%, var(--surface-2, var(--surface-1)))',
    color: 'var(--accent)',
    border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
  },
  backspaceKey: {
    color: 'var(--text-3)',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
};

export default AppLock;
