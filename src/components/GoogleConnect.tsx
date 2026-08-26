import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Calendar as CalendarIcon, Mail, CheckCircle2, LogOut, RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly';
const TOKEN_KEY = 'aura_gtoken';
const REFRESH_KEY = 'aura_grefresh';
const EXPIRY_KEY = 'aura_gexpiry';

interface StoredToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

const saveToken = (data: { access_token: string; refresh_token?: string; expires_in: number }) => {
  const stored: StoredToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 300) * 1000, // refresh 5 min early
  };
  localStorage.setItem(TOKEN_KEY, stored.access_token);
  if (stored.refresh_token) localStorage.setItem(REFRESH_KEY, stored.refresh_token);
  localStorage.setItem(EXPIRY_KEY, stored.expires_at.toString());
  (window as any).gapiAccessToken = stored.access_token;
};

const getStoredToken = (): StoredToken | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!token) return null;
  return {
    access_token: token,
    refresh_token: localStorage.getItem(REFRESH_KEY) || undefined,
    expires_at: parseInt(expiry || '0', 10),
  };
};

const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  (window as any).gapiAccessToken = null;
};

export const GoogleConnect: React.FC = () => {
  const [user, setUser] = useState<boolean>(false);
  const [events, setEvents] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [silentRefreshing, setSilentRefreshing] = useState(false);

  const fetchGoogleData = useCallback(async (accessToken: string) => {
    setLoading(true);
    (window as any).gapiAccessToken = accessToken;
    try {
      // Fetch Calendar events
      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&singleEvents=true&maxResults=3&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (calRes.ok) {
        const calData = await calRes.json();
        setEvents(calData.items || []);
      }

      // Fetch unread emails
      const gmailRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=3`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (gmailRes.ok) {
        const gmailData = await gmailRes.json();
        const messages = gmailData.messages || [];
        const details = await Promise.all(
          messages.map(async (msg: any) => {
            const res = await fetch(
              `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            return res.ok ? res.json() : null;
          })
        );
        setEmails(details.filter(Boolean));
      }
    } catch (e) {
      console.error('Error fetching Google data:', e);
    }
    setLoading(false);
  }, []);

  const handleTokenSuccess = useCallback((tokenResponse: any) => {
    saveToken(tokenResponse);
    setUser(true);
    fetchGoogleData(tokenResponse.access_token);
    toast.success('Google account connected!');
  }, [fetchGoogleData]);

  // Web login via @react-oauth/google (uses Google Identity Services popup)
  const webLogin = useGoogleLogin({
    onSuccess: handleTokenSuccess,
    onError: (err) => {
      console.error('Google login error:', err);
      toast.error('Google login failed. Try again.');
    },
    scope: SCOPES,
    flow: 'implicit',
  });

  // Check for stored token on mount
  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      const now = Date.now();
      if (stored.expires_at > now) {
        // Token still valid
        setUser(true);
        (window as any).gapiAccessToken = stored.access_token;
        fetchGoogleData(stored.access_token);
      } else if (stored.refresh_token) {
        // Token expired, try refresh
        refreshAccessToken(stored.refresh_token);
      } else {
        // Token expired, no refresh token — ask user to reconnect
        clearToken();
      }
    }
  }, []);

  const refreshAccessToken = async (refreshToken: string) => {
    setSilentRefreshing(true);
    try {
      // Try silent re-auth first (no popup needed if user previously consented)
      const tokenClient = (window as any).google?.accounts?.oauth2;
      if (tokenClient) {
        const client = tokenClient.initTokenClient({
          client_id: '93524226912-iv57sq9ts1i1a6a0rane5o4c19ujacn5.apps.googleusercontent.com',
          scope: SCOPES,
          callback: (resp: any) => {
            if (resp.access_token) {
              saveToken(resp);
              setUser(true);
              fetchGoogleData(resp.access_token);
            }
            setSilentRefreshing(false);
          },
          error_callback: () => {
            // Silent refresh failed, try with refresh token
            refreshViaBackend(refreshToken);
          },
        });
        client.requestAccessToken({ prompt: 'none' });
      } else {
        await refreshViaBackend(refreshToken);
      }
    } catch (e) {
      console.error('Token refresh failed:', e);
      clearToken();
      setSilentRefreshing(false);
    }
  };

  const refreshViaBackend = async (_refreshToken: string) => {
    try {
      // Use Google's token endpoint directly with refresh token
      // Note: This requires client_secret, so we use a proxy endpoint
      // For dev, we'll just prompt re-login
      toast.info('Session expired. Please reconnect Google.');
      clearToken();
      setUser(false);
      setSilentRefreshing(false);
    } catch (e) {
      clearToken();
      setUser(false);
      setSilentRefreshing(false);
    }
  };

  const login = async () => {
    if (Capacitor.isNativePlatform()) {
      loginNative();
      return;
    }
    webLogin();
  };

  const loginNative = async () => {
    const CLIENT_ID = '93524226912-iv57sq9ts1i1a6a0rane5o4c19ujacn5.apps.googleusercontent.com';
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent('com.aura.app://')}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&prompt=select_account`;

    clearToken();

    try {
      const { Browser } = await import('@capacitor/browser');
      const { App } = await import('@capacitor/app');

      let tokenHandled = false;

      const urlHandle = await App.addListener('appUrlOpen', async (event: any) => {
        const url = event.url;
        if (!tokenHandled && url && url.includes('#')) {
          const hashPart = url.substring(url.indexOf('#') + 1);
          const params = new URLSearchParams(hashPart);
          const token = params.get('access_token');
          const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
          if (token) {
            tokenHandled = true;
            await Browser.close();
            handleTokenSuccess({ access_token: token, expires_in: expiresIn });
          }
        }
      });

      Browser.addListener('browserFinished', async () => {
        if (!tokenHandled) {
          tokenHandled = true;
          try { await urlHandle.remove(); } catch (_) {}
        }
      });

      await Browser.open({ url: authUrl, width: 600, height: 700 });
    } catch (_e) {
      window.location.href = authUrl;
    }
  };

  const logout = () => {
    clearToken();
    setUser(false);
    setEvents([]);
    setEmails([]);
    toast.info('Google disconnected');
  };

  if (silentRefreshing) {
    return (
      <div className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <RefreshCw size={16} className="animate-spin" /> Refreshing session...
      </div>
    );
  }

  if (!user) {
    return (
      <button onClick={login} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
        <CalendarIcon size={18} /> Connect Google Account
      </button>
    );
  }

  return (
    <div className="google-widgets" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} /> Google Connected
        </span>
        <button onClick={logout} style={{ background: 'none', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LogOut size={12} /> Disconnect
        </button>
      </div>

      <div className="widget glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          <CalendarIcon size={18} color="var(--accent-blue)" /> Upcoming Events
        </h3>
        {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading...</p> : events.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No upcoming events.</p> : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map((event, i) => (
              <li key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <strong style={{ display: 'block', color: 'var(--primary)' }}>{event.summary}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(event.start.dateTime || event.start.date).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="widget glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          <Mail size={18} color="var(--accent-rose)" /> Unread Emails
        </h3>
        {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading...</p> : emails.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Inbox Zero! <CheckCircle2 size={14} color="var(--accent-emerald)"/></p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {emails.map((email: any, i: number) => {
              const headers = email.payload?.headers || [];
              const subject = headers.find((h: any) => h.name === 'Subject')?.value;
              const from = headers.find((h: any) => h.name === 'From')?.value;
              return (
                <li key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <strong style={{ display: 'block', color: 'var(--primary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subject || 'No Subject'}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {from}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
