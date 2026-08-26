import React, { useState, useEffect, useCallback } from 'react';
import { gapi } from 'gapi-script';
import { Calendar as CalendarIcon, Mail, CheckCircle2, LogOut } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const CLIENT_ID = "93524226912-iv57sq9ts1i1a6a0rane5o4c19ujacn5.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly";

export const GoogleConnect: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [gapiReady, setGapiReady] = useState(false);

  const handleToken = useCallback(async (accessToken: string) => {
    localStorage.setItem('aura_gapi_token', accessToken);
    (window as any).gapiAccessToken = accessToken;
    setUser({ access_token: accessToken });
    try {
      await fetchData(accessToken);
    } catch (e) {
      console.error("Failed to fetch data with token:", e);
      localStorage.removeItem('aura_gapi_token');
      setUser(null);
    }
  }, []);

  const fetchData = useCallback(async (accessToken: string) => {
    setLoading(true);
    try {
      gapi.client.setToken({ access_token: accessToken });
      (window as any).gapiAccessToken = accessToken;

      await gapi.client.load('calendar', 'v3');
      const calendarResponse = await (gapi.client as any).calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 3,
        orderBy: 'startTime'
      });
      setEvents(calendarResponse.result.items || []);

      await gapi.client.load('gmail', 'v1');
      const gmailResponse = await (gapi.client as any).gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: 3
      });

      const messages = gmailResponse.result.messages || [];
      const emailDetails = await Promise.all(
        messages.map(async (msg: any) => {
          const res = await (gapi.client as any).gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From']
          });
          return res.result;
        })
      );
      setEmails(emailDetails);
    } catch (error) {
      console.error("Error fetching data", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
          'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
        ]
      }).then(() => {
        setGapiReady(true);

        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance && authInstance.isSignedIn.get()) {
          const token = authInstance.currentUser.get().getAuthResponse().access_token;
          handleToken(token);
        }
      }).catch((e: any) => {
        console.error("gapi.client.init failed:", e);
        setGapiReady(true);
      });
    });

    const stored = localStorage.getItem('aura_gapi_token');
    if (stored) {
      handleToken(stored);
    }
  }, []);

  const login = async () => {
    if (!gapiReady) {
      toast.error('Google API is still loading. Please wait...');
      return;
    }

    // On native (Capacitor), use Browser.open for OAuth
    if (Capacitor.isNativePlatform()) {
      loginNative();
      return;
    }

    // On web, use gapi.auth2 popup flow
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance) {
        toast.error('Google Auth not initialized. Please refresh.');
        return;
      }

      const googleUser = await authInstance.signIn({
        ux_mode: 'popup',
        prompt: 'select_account'
      });

      const token = googleUser.getAuthResponse().access_token;
      if (token) {
        handleToken(token);
        toast.success('Google account connected!');
      }
    } catch (err: any) {
      if (err?.error === 'popup_closed_by_user' || err?.type === 'popup_closed') {
        return;
      }
      console.error("Web login failed:", err);
      toast.error('Login failed. Please try again.');
    }
  };

  const loginNative = async () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent('com.aura.app://')}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&prompt=select_account`;

    localStorage.removeItem('aura_gapi_token');
    (window as any).gapiAccessToken = null;

    try {
      const { Browser } = await import('@capacitor/browser');
      const { App } = await import('@capacitor/app');

      let tokenHandled = false;

      const urlHandle = await App.addListener('appUrlOpen', async (event: any) => {
        const url = event.url;
        if (!tokenHandled && url && (url.includes('access_token') || url.includes('#'))) {
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const hashPart = url.substring(hashIndex + 1);
            const params = new URLSearchParams(hashPart);
            const token = params.get('access_token');
            if (token) {
              tokenHandled = true;
              await Browser.close();
              handleToken(token);
              toast.success('Google account connected!');
            }
          }
        }
      });

      Browser.addListener('browserFinished', async () => {
        if (!tokenHandled) {
          tokenHandled = true;
          try { await urlHandle.remove(); } catch (_) {}
          const stored = localStorage.getItem('aura_gapi_token');
          if (stored) handleToken(stored);
        }
      });

      await Browser.open({ url: authUrl, width: 600, height: 700 });
    } catch (_e) {
      window.location.href = authUrl;
    }
  };

  const logout = () => {
    localStorage.removeItem('aura_gapi_token');
    (window as any).gapiAccessToken = null;
    setUser(null);
    setEvents([]);
    setEmails([]);
    gapi.client.setToken(null);
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      if (authInstance) authInstance.signOut();
    } catch (_) {}
  };

  if (!user) {
    return (
      <button onClick={login} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} disabled={!gapiReady}>
        <CalendarIcon size={18} /> {gapiReady ? 'Connect Google Account' : 'Loading Google API...'}
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
          <CalendarIcon size={18} color="var(--accent-blue)" /> Upcoming Meetings
        </h3>
        {loading ? <p>Loading...</p> : events.length === 0 ? <p>No upcoming events.</p> : (
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
        {loading ? <p>Loading...</p> : emails.length === 0 ? <p>Inbox Zero! <CheckCircle2 size={14} color="var(--accent-emerald)"/></p> : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {emails.map((email, i) => {
              const headers = email.payload.headers;
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
