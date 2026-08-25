import { http, HttpResponse } from 'msw';

const mockCalendarEvents = [
  {
    id: 'cal-1',
    summary: 'Team Meeting',
    start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
    end: { dateTime: new Date(Date.now() + 90000000).toISOString() },
  },
  {
    id: 'cal-2',
    summary: 'Client Call',
    start: { dateTime: new Date(Date.now() + 172800000).toISOString() },
    end: { dateTime: new Date(Date.now() + 176400000).toISOString() },
  },
];

const mockGmailMessages = [
  {
    id: 'msg-1',
    payload: {
      headers: [
        { name: 'Subject', value: 'Welcome to Aura OS' },
        { name: 'From', value: 'team@aura.app' },
      ],
    },
  },
  {
    id: 'msg-2',
    payload: {
      headers: [
        { name: 'Subject', value: 'Your weekly digest' },
        { name: 'From', value: 'digest@aura.app' },
      ],
    },
  },
];

export const handlers = [
  http.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', () => {
    return HttpResponse.json(
      { id: 'new-event-id', summary: 'Created Event' },
      { status: 200 }
    );
  }),

  http.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', () => {
    return HttpResponse.json({ items: mockCalendarEvents }, { status: 200 });
  }),

  http.get('https://www.googleapis.com/gmail/v1/users/me/messages', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    if (q === 'is:unread') {
      return HttpResponse.json({ messages: mockGmailMessages.map(m => ({ id: m.id })) }, { status: 200 });
    }
    return HttpResponse.json({ messages: [] }, { status: 200 });
  }),

  http.get('https://www.googleapis.com/gmail/v1/users/me/messages/:id', ({ params }) => {
    const message = mockGmailMessages.find(m => m.id === params.id);
    if (message) {
      return HttpResponse.json(message, { status: 200 });
    }
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-*:generateContent', () => {
    return HttpResponse.json(
      {
        candidates: [
          {
            content: {
              parts: [{ text: 'Mock AI response' }],
            },
          },
        ],
      },
      { status: 200 }
    );
  }),

  http.get('https://api.github.com/users/:username/events/public', () => {
    return HttpResponse.json(
      [
        {
          type: 'PushEvent',
          repo: { name: 'Haris-Ahmed83/test-repo' },
          created_at: new Date().toISOString(),
        },
      ],
      { status: 200 }
    );
  }),
];

export const errorHandlers = [
  http.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),

  http.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),

  http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-*:generateContent', () => {
    return HttpResponse.json({ error: 'API key invalid' }, { status: 400 });
  }),
];

import { setupServer } from 'msw/node';

export const server = setupServer(...handlers);