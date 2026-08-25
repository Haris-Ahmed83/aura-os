import { useState, useCallback, useRef } from 'react';
import type { JournalEntry } from '../types';
import { toast } from 'sonner';

export type JournalContentPart = 
  | { type: 'text'; content: string }
  | { type: 'link'; content: string }
  | { type: 'tag'; content: string };

export function useJournal() {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [newJournal, setNewJournal] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');
  const [journalImage, setJournalImage] = useState<string | null>(null);
  const [journalSearch, setJournalSearch] = useState('');
  const [journalFilterMood, setJournalFilterMood] = useState<string | null>(null);
  const [aiPromptMsg, setAiPromptMsg] = useState('');
  const [isJournalListening, setIsJournalListening] = useState(false);
  const journalRecognitionRef = useRef<any>(null);

  const handleAddJournal = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournal.trim() && !journalImage) return;
    setJournalEntries(prev => [
      {
        id: Date.now().toString(),
        content: newJournal,
        date: new Date().toISOString(),
        mood: selectedMood,
        image: journalImage || undefined,
      },
      ...prev,
    ]);
    setNewJournal('');
    setJournalImage(null);
    setAiPromptMsg('');
  }, [newJournal, selectedMood, journalImage]);

  const handleJournalImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          setJournalImage(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const generateAiPrompt = useCallback(() => {
    const prompts = [
      'What is one thing that made you smile today?',
      'What was your biggest challenge today?',
      'Describe a moment of peace you had recently.',
      'What is a new idea you want to explore?',
      'Who are you grateful for today and why?',
    ];
    setAiPromptMsg(prompts[Math.floor(Math.random() * prompts.length)]);
  }, []);

  const handleJournalVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in your browser. Try Chrome.');
      return;
    }

    if (isJournalListening) {
      journalRecognitionRef.current?.stop();
      setIsJournalListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    journalRecognitionRef.current = recognition;

    recognition.onstart = () => setIsJournalListening(true);
    let finalTranscriptStr = newJournal;
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptStr += event.results[i][0].transcript + ' ';
          setNewJournal(finalTranscriptStr);
        } else {
          interim += event.results[i][0].transcript;
        }
      }
    };
    recognition.onerror = () => setIsJournalListening(false);
    recognition.onend = () => setIsJournalListening(false);
    recognition.start();
  }, [isJournalListening, newJournal]);

  const handleDeleteJournal = useCallback((id: string) => {
    setJournalEntries(prev => prev.filter(j => j.id !== id));
  }, []);

  const logMood = useCallback((mood: string, note?: string) => {
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      good: '💪',
      great: '🔥',
      sad: '😔',
      tired: '😴',
      stressed: '😰',
      motivated: '🚀',
      bored: '😑',
    };
    const emoji = moodEmojis[mood] || '😊';
    setJournalEntries(prev => [
      {
        id: Date.now().toString(),
        content: note || `Mood: ${mood}`,
        date: new Date().toISOString(),
        mood: emoji,
      },
      ...prev,
    ]);
    toast.success(`Mood logged: ${emoji}`);
  }, []);

  const parseJournalContent = useCallback((content: string): JournalContentPart[] => {
    const parts = content.split(/(\[\[.*?\]\]|#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        return { type: 'link' as const, content: part, key: i };
      }
      if (part.startsWith('#')) {
        return { type: 'tag' as const, content: part, key: i };
      }
      return { type: 'text' as const, content: part, key: i };
    });
  }, []);

  return {
    journalEntries,
    setJournalEntries,
    newJournal,
    setNewJournal,
    selectedMood,
    setSelectedMood,
    journalImage,
    setJournalImage,
    journalSearch,
    setJournalSearch,
    journalFilterMood,
    setJournalFilterMood,
    aiPromptMsg,
    setAiPromptMsg,
    isJournalListening,
    setIsJournalListening,
    journalRecognitionRef,
    handleAddJournal,
    handleJournalImageUpload,
    generateAiPrompt,
    handleJournalVoice,
    handleDeleteJournal,
    logMood,
    parseJournalContent,
  };
}