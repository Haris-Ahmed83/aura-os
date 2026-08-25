import { useState, useCallback } from 'react';
import type { ScheduleEvent } from '../types';
import { toast } from 'sonner';

export function useSchedule() {
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<{
    title: string;
    date: string;
    time: string;
    type: 'meeting' | 'reminder' | 'deadline' | 'personal';
  }>({ title: '', date: '', time: '', type: 'reminder' });

  const handleAddEvent = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date) return;

    const eventObj = { id: Date.now().toString(), ...newEvent };
    setScheduleEvents(prev => [...prev, eventObj]);
    setNewEvent({ title: '', date: '', time: '', type: 'reminder' });
    setShowAddEvent(false);

    const accessToken = (window as any).gapiAccessToken;
    if (accessToken) {
      try {
        const startDateTime = new Date(`${newEvent.date}T${newEvent.time || '09:00'}:00`).toISOString();
        const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: newEvent.title,
            start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          }),
        });

        if (response.ok) {
          toast.success('Event synced to Google Calendar!');
        } else {
          const err = await response.json();
          toast.error('Calendar sync failed');
          console.error('Calendar sync failed:', err);
        }
      } catch (error) {
        toast.error('Failed to sync event to Google Calendar');
        console.error('Failed to sync event to Google Calendar:', error);
      }
    }
  }, [newEvent]);

  const handleDeleteEvent = useCallback((id: string) => {
    setScheduleEvents(prev => prev.filter(ev => ev.id !== id));
  }, []);

  const getUpcomingEvents = useCallback(() => {
    const now = new Date();
    return scheduleEvents
      .filter(ev => new Date(ev.date) >= new Date(now.toISOString().split('T')[0]))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [scheduleEvents]);

  const addMeeting = useCallback((
    title: string,
    date: string,
    time: string = '10:00'
  ) => {
    const newEv: ScheduleEvent = {
      id: Date.now().toString(),
      title,
      date,
      time,
      type: 'meeting',
    };
    setScheduleEvents(prev => [...prev, newEv]);
    return newEv;
  }, []);

  return {
    scheduleEvents,
    setScheduleEvents,
    showAddEvent,
    setShowAddEvent,
    newEvent,
    setNewEvent,
    handleAddEvent,
    handleDeleteEvent,
    getUpcomingEvents,
    addMeeting,
  };
}