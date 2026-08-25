import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { gapi } from 'gapi-script';
import { Calendar as CalendarIcon, Mail, CheckCircle2 } from 'lucide-react';

const CLIENT_ID = "93524226912-iv57sq9ts1i1a6a0rane5o4c19ujacn5.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly";

export const GoogleConnect: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
      });
    }
    gapi.load('client:auth2', start);
  }, []);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setUser(codeResponse);
      // Store token globally so Schedule page can use it for creating events
      (window as any).gapiAccessToken = codeResponse.access_token;
      fetchData(codeResponse.access_token);
    },
    scope: SCOPES,
    onError: (error) => console.log('Login Failed:', error)
  });

  const fetchData = async (accessToken: string) => {
    setLoading(true);
    gapi.client.setToken({ access_token: accessToken });
    
    try {
      // Fetch Calendar Events
      await gapi.client.load('calendar', 'v3');
      const calendarResponse = await (gapi.client as any).calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 3,
        'orderBy': 'startTime'
      });
      setEvents(calendarResponse.result.items || []);

      // Fetch Gmail Messages
      await gapi.client.load('gmail', 'v1');
      const gmailResponse = await (gapi.client as any).gmail.users.messages.list({
        'userId': 'me',
        'q': 'is:unread',
        'maxResults': 3
      });
      
      const messages = gmailResponse.result.messages || [];
      const emailDetails = await Promise.all(
        messages.map(async (msg: any) => {
          const res = await (gapi.client as any).gmail.users.messages.get({
            'userId': 'me',
            'id': msg.id,
            'format': 'metadata',
            'metadataHeaders': ['Subject', 'From']
          });
          return res.result;
        })
      );
      setEmails(emailDetails);
      
    } catch (error) {
      console.error("Error fetching data", error);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <button onClick={() => login()} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
        <CalendarIcon size={18} /> Connect Google Account
      </button>
    );
  }

  return (
    <div className="google-widgets" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
      
      {/* Calendar Widget */}
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

      {/* Gmail Widget */}
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
