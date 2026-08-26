import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Calendar, 
  Settings as SettingsIcon, 
  Search, 
  Plus,
  Bell,
  Sparkles,
  Command,
  CheckCircle2,
  Clock,
  Lightbulb,
  Trash2,
  X,
  StickyNote,
  Moon,
  Sun,
  User,
  Shield,
  Palette,
  Save,
  BookOpen,
  BarChart2,
  Wallet,
  Mic,
  MicOff,
  Wand2,
  Edit2,
  Image as ImageIcon,
  Search as SearchIcon,
  Filter,
  Headphones,
  Download,
  Upload,
  Bot,
  MoreVertical,
  ArrowRight,
  Target,
  FileText,
  Lock,
  Hash,
  ListTodo,
  TrendingUp
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleConnect } from './components/GoogleConnect';
import { Toaster, toast } from 'sonner';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import WeatherWidget from './components/WeatherWidget';
import HabitsTracker from './components/HabitsTracker';
import ExpenseCharts from './components/ExpenseCharts';
import QuickNotes from './components/QuickNotes';
import ThemeManager from './components/ThemeManager';
import AppLock from './components/AppLock';
import { exportToPDF } from './components/pdfExport';
import NotificationCenter, { sendBrowserNotification } from './components/NotificationCenter';
import RecurringTracker from './components/RecurringTracker';
import PomodoroStats from './components/PomodoroStats';
import './index.css';

// Types
interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: string;
  color: string;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
  subtasks?: SubTask[];
}

interface TaskColumns {
  todo: Task[];
  inProgress: Task[];
  completed: Task[];
  deleted: Task[];
}

interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'reminder' | 'deadline' | 'personal';
}

interface JournalEntry {
  id: string;
  content: string;
  date: string;
  mood: string;
  image?: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: 'food' | 'transport' | 'subscription' | 'health' | 'entertainment' | 'other';
  date: string;
  recurring: boolean;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  color: string;
}

interface AppSettings {
  displayName: string;
  theme: 'dark' | 'midnight' | 'ocean' | 'light' | 'auto';
  notifications: boolean;
  autoSave: boolean;
  compactMode: boolean;
  geminiApiKey: string;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDates: string[];
}

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  pinned: boolean;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'deadline' | 'alert' | 'info';
  timestamp: string;
  read: boolean;
}

interface PomodoroSession {
  id: string;
  startTime: string;
  duration: number;
  completed: boolean;
}

// Initial Data
const initialTasks: TaskColumns = {
  todo: [
    { id: '1', title: 'Build Personal Assistant App', type: 'Idea', color: 'blue' },
    { id: '2', title: 'Research Premium UI features', type: 'Idea', color: 'blue' },
  ],
  inProgress: [
    { id: '3', title: 'Integrate Drag & Drop', type: 'Active', color: 'purple' },
  ],
  completed: [
    { id: '4', title: 'Initialize Project', type: 'Done', color: 'green' },
  ],
  deleted: []
};

const defaultSettings: AppSettings = {
  displayName: 'Haris',
  theme: 'dark',
  notifications: true,
  autoSave: true,
  compactMode: false,
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
};

// ─── HARIS PERSONAL KNOWLEDGE BASE (pre-trained) ───────────────────────────
const HARIS_KNOWLEDGE_BASE: Record<string, string> = {
  name: "Muhammad Haris",
  location: "Abbottabad, KPK, Pakistan",
  phone: "0340 330 0584",
  email: "haris1.tech@gmail.com",
  linkedin: "linkedin.com/in/muhammadharis-tech",
  github: "github.com/Haris-Ahmed83",
  portfolio: "haris.primevoai.com",
  title: "AI Engineer & GHL Automation Specialist | Full-Stack Developer",
  education: "Bachelor of Science in Computer Science (In Progress) — Abbottabad University Of Science And Technology",
  current_job: "GoHighLevel (GHL) Expert at Cyberx Digital, Abbottabad — Feb 2026 to Present",
  skills: "GHL & Automation: GoHighLevel, n8n, Zapier | AI & LLMs: LangChain, LangGraph, RAG systems, Vector Search (Qdrant, ChromaDB), Groq, OpenAI, Gemini | Backend: Python, FastAPI, PostgreSQL, Redis | Frontend: React, Next.js, TypeScript, TailwindCSS | Mobile: Flutter, Dart, Firebase | DevOps: Docker, GitHub Actions, Vercel",
  achievements: "31 booked calls in 9 days via GHL automation | 95%+ accuracy on production RAG system | Response time reduced from hours to under 1 minute | $0/month full production infrastructure | 170+ GitHub repositories",
  projects: "1. Production RAG System (LangChain, LangGraph, Qdrant, Groq, FastAPI, React) — 95%+ accuracy. 2. Free LLM API Proxy (multi-provider, rate limiting, zero-cost). 3. AI Document Summarizer (FastAPI, Gemini, NLP). 4. GHL Automation Funnel — reduced manual followup by 80%. 5. Real-Time Crypto Dashboard (React, TypeScript, WebSocket, Binance API).",
  cv: "Full CV: AI Engineer with expertise in RAG systems, GHL automation, Python, FastAPI, React, Flutter. Key achievement: 31 booked calls in 9 days for a digital marketing agency.",
  summary: "AI Engineer and GoHighLevel Automation Specialist with proven expertise in building production-grade RAG systems, LLM-powered applications, and full-stack web/mobile solutions. Delivered automation systems that booked 30+ calls/month through intelligent follow-up workflows. Proficient in Python, React, FastAPI, LangChain/LangGraph, Flutter, and cloud-native deployment.",
};

function App() {
  const [activeTab, setActiveTab] = useState('finance');
  const [tasks, setTasks] = useState<TaskColumns>(initialTasks);
  const [quickIdea, setQuickIdea] = useState('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [boardCategoryFilter, setBoardCategoryFilter] = useState<'All' | 'Idea' | 'Active' | 'Done'>('All');

  // Task Selection & Menu State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskColumn, setSelectedTaskColumn] = useState<keyof TaskColumns | null>(null);
  const [menuTask, setMenuTask] = useState<{ task: Task; fromCol: keyof TaskColumns } | null>(null);

  // AI Assistant Chat State
  const [aiChatMessages, setAiChatMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: `Hi Buddy..!` }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  
  // Schedule State
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<{title: string, date: string, time: string, type: 'meeting'|'reminder'|'deadline'|'personal'}>({ title: '', date: '', time: '', type: 'reminder' });

  // Journal/Notes State
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [newJournal, setNewJournal] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');
  const [journalImage, setJournalImage] = useState<string | null>(null);
  const [journalSearch, setJournalSearch] = useState('');
  const [journalFilterMood, setJournalFilterMood] = useState<string | null>(null);
  const [aiPromptMsg, setAiPromptMsg] = useState('');
  const [isJournalListening, setIsJournalListening] = useState(false);
  const journalRecognitionRef = useRef<any>(null);

  // Finance State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', category: 'other' as Expense['category'], recurring: false });
  
  // Advanced Finance State
  const [totalFunds, setTotalFunds] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', color: '#3b82f6' });
  const [showAddFunds, setShowAddFunds] = useState<string | null>(null); // goal id
  const [addFundsAmount, setAddFundsAmount] = useState('');

  // Analytics: Pomodoro State
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const pomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Voice Memo State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceTextInput, setVoiceTextInput] = useState('');
  const recognitionRef = useRef<any>(null);

  // AI Auto-Schedule State
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [autoScheduleMsg, setAutoScheduleMsg] = useState('');

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Personal Knowledge Base State
  const [personalKnowledge, setPersonalKnowledge] = useState<Record<string, string>>({});

  // Update state
  const [updateInfo, setUpdateInfo] = useState<{ version: string; hasUpdate: boolean; apkDownloadUrl?: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState('');
  const [spotifyPlaylist, setSpotifyPlaylist] = useState('https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0');

  // New Feature States
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [isLocked, setIsLocked] = useState(true);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load all data from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('aura_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    const savedEvents = localStorage.getItem('aura_events');
    if (savedEvents) setScheduleEvents(JSON.parse(savedEvents));

    const savedJournal = localStorage.getItem('aura_journal');
    if (savedJournal) setJournalEntries(JSON.parse(savedJournal));

    const savedSettings = localStorage.getItem('aura_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const savedExpenses = localStorage.getItem('aura_expenses');
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

    const savedIncome = localStorage.getItem('aura_income');
    if (savedIncome) setMonthlyIncome(Number(savedIncome));

    const savedGoals = localStorage.getItem('aura_goals');
    if (savedGoals) setSavingsGoals(JSON.parse(savedGoals));

    const savedFunds = localStorage.getItem('aura_total_funds');
    if (savedFunds) setTotalFunds(Number(savedFunds));

    const savedKnowledge = localStorage.getItem('aura_knowledge');
    if (savedKnowledge) setPersonalKnowledge(JSON.parse(savedKnowledge));

    const savedHabits = localStorage.getItem('aura_habits');
    if (savedHabits) setHabits(JSON.parse(savedHabits));

    const savedNotes = localStorage.getItem('aura_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const savedNotifications = localStorage.getItem('aura_notifications');
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

    const savedPomodoroSessions = localStorage.getItem('aura_pomodoro_sessions');
    if (savedPomodoroSessions) setPomodoroSessions(JSON.parse(savedPomodoroSessions));

    const lockEnabled = localStorage.getItem('aura_lock_enabled');
    if (!lockEnabled) setIsLocked(false);
  }, []);

  // Check for app updates on native platform
  useEffect(() => {
    (async () => {
      try {
        const { checkForUpdates } = await import('./services/updater');
        const result = await checkForUpdates();
        if (result.hasUpdate && result.version) {
          setUpdateInfo({
            version: result.version,
            hasUpdate: true,
            apkDownloadUrl: result.apkDownloadUrl,
          });
        }
      } catch (_e) {}
    })();
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo?.apkDownloadUrl || !updateInfo?.version) return;
    setUpdating(true);
    setUpdateProgress('Opening download...');
    try {
      const { downloadAndInstallApk } = await import('./services/updater');
      await downloadAndInstallApk(updateInfo.apkDownloadUrl, updateInfo.version);
      setUpdateProgress('Download started! Install from notifications.');
    } catch (_e) {
      setUpdateProgress('');
      setUpdating(false);
      toast.error('Update failed. Try again.');
    }
  };

  // Auto-save all data
  useEffect(() => { localStorage.setItem('aura_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('aura_events', JSON.stringify(scheduleEvents)); }, [scheduleEvents]);
  useEffect(() => { 
    try {
      localStorage.setItem('aura_journal', JSON.stringify(journalEntries)); 
    } catch (e) {
      console.error("Failed to save journal. Storage might be full.", e);
      toast.error("Failed to save journal! If you attached a very large photo, try removing it. Your browser storage is full.");
    }
  }, [journalEntries]);
  useEffect(() => { localStorage.setItem('aura_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('aura_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('aura_income', monthlyIncome.toString()); }, [monthlyIncome]);
  useEffect(() => { localStorage.setItem('aura_total_funds', totalFunds.toString()); }, [totalFunds]);
  useEffect(() => { localStorage.setItem('aura_goals', JSON.stringify(savingsGoals)); }, [savingsGoals]);
  useEffect(() => { localStorage.setItem('aura_knowledge', JSON.stringify(personalKnowledge)); }, [personalKnowledge]);
  useEffect(() => { localStorage.setItem('aura_habits', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('aura_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('aura_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('aura_pomodoro_sessions', JSON.stringify(pomodoroSessions)); }, [pomodoroSessions]);

  // Apply Theme
  useEffect(() => {
    document.body.className = '';
    if (settings.theme !== 'dark') {
      document.body.classList.add(`theme-${settings.theme}`);
    }
  }, [settings.theme]);

  // Spotlight Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.kanban-card, .schedule-card, .journal-card');
      cards.forEach((card) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        (card as HTMLElement).style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(prev => !prev); }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add Idea
  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIdea.trim()) return;
    setTasks(prev => ({ ...prev, todo: [{ id: Date.now().toString(), title: quickIdea, type: 'Idea', color: 'blue' }, ...prev.todo] }));
    setQuickIdea('');
  };

  // Add Schedule Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date) return;
    
    const eventObj = { id: Date.now().toString(), ...newEvent };
    setScheduleEvents(prev => [...prev, eventObj]);
    setNewEvent({ title: '', date: '', time: '', type: 'reminder' });
    setShowAddEvent(false);

    // Sync to Google Calendar if user is connected
    const accessToken = (window as any).gapiAccessToken;
    if (accessToken) {
      try {
        const startDateTime = new Date(`${newEvent.date}T${newEvent.time || '09:00'}:00`).toISOString();
        const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();
        
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: newEvent.title,
            start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          })
        });
        
        if (response.ok) {
          toast.success('Event synced to Google Calendar!');
        } else {
          const err = await response.json();
          toast.error('Calendar sync failed');
          console.error('❌ Calendar sync failed:', err);
        }
      } catch (error) {
        toast.error('Failed to sync event to Google Calendar');
        console.error('❌ Failed to sync event to Google Calendar:', error);
      }
    }
  };

  // Delete Schedule Event
  const handleDeleteEvent = (id: string) => {
    setScheduleEvents(prev => prev.filter(ev => ev.id !== id));
  };

  // Add Journal Entry
  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournal.trim() && !journalImage) return;
    setJournalEntries(prev => [{ id: Date.now().toString(), content: newJournal, date: new Date().toISOString(), mood: selectedMood, image: journalImage || undefined }, ...prev]);
    setNewJournal('');
    setJournalImage(null);
    setAiPromptMsg('');
  };

  // Journal Image Upload with Compression
  const handleJournalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setJournalImage(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Prompt Generator
  const generateAiPrompt = () => {
    const prompts = [
      "What is one thing that made you smile today?",
      "What was your biggest challenge today?",
      "Describe a moment of peace you had recently.",
      "What is a new idea you want to explore?",
      "Who are you grateful for today and why?"
    ];
    setAiPromptMsg(prompts[Math.floor(Math.random() * prompts.length)]);
  };

  // Voice to Text for Journal
  const handleJournalVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { return; }
    
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
  };

  // Delete Journal Entry
  const handleDeleteJournal = (id: string) => {
    setJournalEntries(prev => prev.filter(j => j.id !== id));
  };

  // Parse Links & Tags in Journal
  const renderJournalContent = (content: string) => {
    // Basic regex to find #tags and [[links]]
    const parts = content.split(/(\[\[.*?\]\]|#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        return <span key={i} style={{ color: 'var(--accent-purple)', cursor: 'pointer', background: 'rgba(139,92,246,0.15)', padding: '2px 4px', borderRadius: '4px', margin: '0 2px' }} onClick={() => setJournalSearch(part)}>{part}</span>;
      }
      if (part.startsWith('#')) {
        return <span key={i} style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setJournalSearch(part)}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Permanently delete from deleted column
  const handlePermanentDelete = (id: string) => {
    setTasks(prev => ({ ...prev, deleted: prev.deleted.filter(t => t.id !== id) }));
  };

  // Restore from deleted
  const handleRestore = (id: string) => {
    const task = tasks.deleted.find(t => t.id === id);
    if (!task) return;
    setTasks(prev => ({
      ...prev,
      deleted: prev.deleted.filter(t => t.id !== id),
      todo: [{ ...task, type: 'Idea', color: 'blue' }, ...prev.todo]
    }));
  };

  // Clear all deleted
  const handleClearDeleted = () => {
    setTasks(prev => ({ ...prev, deleted: [] }));
  };

  // Save Settings
  const handleSaveSettings = () => {
    localStorage.setItem('aura_settings', JSON.stringify(settings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Voice Memo Handler
  const handleVoiceMemo = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { return; }
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      setIsListening(false);
      setTasks(prev => ({ ...prev, todo: [{ id: Date.now().toString(), title: `🎤 ${transcript}`, type: 'Idea', color: 'blue' }, ...prev.todo] }));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Voice text fallback — for when SpeechRecognition is unavailable (Android / non-Chrome)
  const handleVoiceTextSubmit = () => {
    if (!voiceTextInput.trim()) return;
    setTasks(prev => ({ ...prev, todo: [{ id: Date.now().toString(), title: `🎤 ${voiceTextInput}`, type: 'Idea', color: 'blue' }, ...prev.todo] }));
    setVoiceTranscript(voiceTextInput);
    setVoiceTextInput('');
    toast.success('Idea added from voice memo!');
  };

  const voiceSupported = typeof window !== 'undefined' && (
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  // AI Auto-Schedule: take "New Ideas" tasks and schedule them into next 7 days
  const handleAutoSchedule = async () => {
    const todoTasks = tasks.todo;
    if (todoTasks.length === 0) { setAutoScheduleMsg('No tasks in New Ideas to schedule!'); setTimeout(() => setAutoScheduleMsg(''), 3000); return; }
    
    setAutoScheduling(true);
    setAutoScheduleMsg('AI is scheduling your tasks...');
    
    const today = new Date();
    const accessToken = (window as any).gapiAccessToken;
    let scheduledCount = 0;
    const newEvents: ScheduleEvent[] = [];

    for (let i = 0; i < todoTasks.length; i++) {
      const task = todoTasks[i];
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + i + 1); // Each task goes next day
      const dateStr = taskDate.toISOString().split('T')[0];
      const timeStr = '10:00';
      
      const newEv: ScheduleEvent = { id: Date.now().toString() + i, title: task.title, date: dateStr, time: timeStr, type: 'reminder' };
      newEvents.push(newEv);

      // Sync to Google Calendar
      if (accessToken) {
        try {
          const startDateTime = new Date(`${dateStr}T10:00:00`).toISOString();
          const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();
          await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: task.title, start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }, end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } })
          });
          scheduledCount++;
        } catch (_) { /* ignore individual failures */ }
      } else {
        scheduledCount++;
      }
    }

    setScheduleEvents(prev => [...prev, ...newEvents]);
    setAutoScheduling(false);
    
    const msg = `${scheduledCount} tasks auto-scheduled${accessToken ? ' & synced to Google Calendar!' : ' to your local Schedule!'}`;
    setAutoScheduleMsg(`✅ ${msg}`);
    toast.success(msg);
    setTimeout(() => setAutoScheduleMsg(''), 4000);
  };

  // Drag and Drop
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceItems = [...tasks[source.droppableId as keyof TaskColumns]];
    const destItems = source.droppableId === destination.droppableId ? sourceItems : [...tasks[destination.droppableId as keyof TaskColumns]];
    const [removed] = sourceItems.splice(source.index, 1);

    const updatedTask = { ...removed };
    if (destination.droppableId === 'inProgress') { updatedTask.type = 'Active'; updatedTask.color = 'purple'; }
    else if (destination.droppableId === 'completed') { updatedTask.type = 'Done'; updatedTask.color = 'green'; }
    else if (destination.droppableId === 'deleted') { updatedTask.type = 'Deleted'; updatedTask.color = 'red'; }
    else { updatedTask.type = 'Idea'; updatedTask.color = 'blue'; }

    if (source.droppableId === destination.droppableId) {
      sourceItems.splice(destination.index, 0, updatedTask);
      setTasks({ ...tasks, [source.droppableId]: sourceItems });
    } else {
      destItems.splice(destination.index, 0, updatedTask);
      setTasks({ ...tasks, [source.droppableId]: sourceItems, [destination.droppableId]: destItems });
    }
  };

  const pageTransition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] };
  const pageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: -10, scale: 0.98 }
  };

  // Greeting based on time
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const now = new Date();
    return scheduleEvents
      .filter(ev => new Date(ev.date) >= new Date(now.toISOString().split('T')[0]))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  const eventTypeColors: Record<string, string> = {
    meeting: 'var(--accent-blue)',
    reminder: 'var(--accent-purple)',
    deadline: 'var(--accent-rose)',
    personal: 'var(--accent-emerald)'
  };

  // Helper to render a Kanban column
  const renderKanbanColumn = (
    droppableId: string,
    title: string,
    icon: React.ReactNode,
    items: Task[],
    options?: { isCompleted?: boolean; isDeleted?: boolean }
  ) => (
    <div className={`kanban-column ${options?.isDeleted ? 'delete-column' : ''}`}>
      <div className="column-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon} {title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge">{items.length}</span>
          {options?.isDeleted && items.length > 0 && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleClearDeleted} className="btn-clear" title="Clear all">
              <Trash2 size={14} />
            </motion.button>
          )}
        </div>
      </div>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            className="column-content"
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ background: snapshot.isDraggingOver ? (options?.isDeleted ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)') : 'transparent', transition: 'background 0.2s' }}
          >
            {items.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    className="kanban-card"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.card-action-btn')) return;
                      setSelectedTask(task);
                      setSelectedTaskColumn(droppableId as keyof TaskColumns);
                    }}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: (options?.isCompleted || options?.isDeleted) && !snapshot.isDragging ? 0.6 : 1,
                      transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.05)` : provided.draggableProps.style?.transform,
                      boxShadow: snapshot.isDragging ? '0 20px 40px rgba(0,0,0,0.5)' : 'none',
                      zIndex: snapshot.isDragging ? 100 : 1,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '8px', marginBottom: '8px' }}>
                      <p style={options?.isCompleted ? { textDecoration: 'line-through', margin: 0, flex: 1 } : { margin: 0, flex: 1 }}>{task.title}</p>
                      {task.priority && (
                        <span className={`priority-badge priority-${task.priority}`} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700, background: task.priority === 'high' ? 'rgba(239,68,68,0.12)' : task.priority === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(212,175,55,0.12)', color: task.priority === 'high' ? 'var(--negative)' : task.priority === 'medium' ? 'var(--warning)' : 'var(--accent)' }}>{task.priority}</span>
                      )}
                    </div>
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-2)' }}>
                        <CheckCircle2 size={12} color="var(--accent)" />
                        <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks</span>
                      </div>
                    )}
                    <div className="card-footer">
                      <span className={`tag tag-${task.color}`}>{task.type}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <motion.button 
                          whileTap={{ scale: 0.8 }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuTask({ task, fromCol: droppableId as keyof TaskColumns });
                          }} 
                          className="card-action-btn" 
                          title="Options & Move Pipeline"
                          style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <MoreVertical size={16} color="var(--text-secondary)" />
                        </motion.button>
                        {options?.isDeleted && (
                          <>
                            <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); handleRestore(task.id); }} className="card-action-btn" title="Restore">↩</motion.button>
                            <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); handlePermanentDelete(task.id); }} className="card-action-btn danger" title="Delete Forever"><X size={14} /></motion.button>
                          </>
                        )}
                        {!options?.isDeleted && (
                          options?.isCompleted ? <CheckCircle2 size={14} color="var(--text-secondary)" /> : <Clock size={14} color="var(--text-secondary)" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {items.length === 0 && (
              <div className="empty-column">
                {options?.isDeleted ? 'Drag here to delete' : 'No items yet'}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );

  // Export Data
  const handleExportData = () => {
    try {
      const data = {
        tasks,
        scheduleEvents,
        journalEntries,
        settings,
        expenses,
        monthlyIncome,
        savingsGoals,
        totalFunds,
        personalKnowledge,
        aiChatMessages,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export data');
    }
  };

  // Import Data
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.tasks) setTasks(data.tasks);
        if (data.scheduleEvents) setScheduleEvents(data.scheduleEvents);
        if (data.journalEntries) setJournalEntries(data.journalEntries);
        if (data.settings) setSettings(data.settings);
        if (data.expenses) setExpenses(data.expenses);
        if (data.monthlyIncome !== undefined) setMonthlyIncome(data.monthlyIncome);
        if (data.savingsGoals) setSavingsGoals(data.savingsGoals);
        if (data.totalFunds !== undefined) setTotalFunds(data.totalFunds);
        if (data.personalKnowledge) setPersonalKnowledge(data.personalKnowledge);
        if (data.aiChatMessages) setAiChatMessages(data.aiChatMessages);
        toast.success('Data imported successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error(error);
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  // Update Task Details
  const handleUpdateTaskDetails = (updatedTask: Task) => {
    if (!selectedTaskColumn) return;
    setTasks(prev => ({
      ...prev,
      [selectedTaskColumn]: prev[selectedTaskColumn].map(t => t.id === updatedTask.id ? updatedTask : t)
    }));
    setSelectedTask(updatedTask);
  };

  // ─── Advanced Conversational AI Engine ──────────────────────────────────────
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userInputText = aiChatInput.trim();
    const query = userInputText.toLowerCase();
    if (!query) return;

    setAiChatMessages(prev => [...prev, { sender: 'user', text: userInputText }]);
    setAiChatInput('');

    // Merge static knowledge base + user-stored runtime knowledge + learned patterns
    const learnedPatterns = JSON.parse(localStorage.getItem('aura_ai_learned') || '{}');
    const mergedKB: Record<string, string> = { ...HARIS_KNOWLEDGE_BASE, ...personalKnowledge, ...learnedPatterns };

    // ── TRUE LLM ENGINE (Google Gemini) ──────────────────────────────────────
    if (settings.geminiApiKey && settings.geminiApiKey.trim() !== '') {
      setAiChatMessages(prev => [...prev, { sender: 'assistant', text: `⏳ Thinking...` }]);
      try {
        const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
        
        // ── Full App Control Tools ─────────────────────────────────────────
        const appTools = {
          functionDeclarations: [
            {
              name: "add_task",
              description: "Add a new task or idea to the user's Idea Board.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: { title: { type: SchemaType.STRING, description: "Task title" } },
                required: ["title"]
              }
            },
            {
              name: "move_task_to_inprogress",
              description: "Move a task from Todo to In Progress on the board. Use when user says they started working on something.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: { title_keyword: { type: SchemaType.STRING, description: "A keyword from the task title to match" } },
                required: ["title_keyword"]
              }
            },
            {
              name: "move_task_to_done",
              description: "Mark a task as completed. Use when user says they finished something.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: { title_keyword: { type: SchemaType.STRING, description: "A keyword from the task title to match" } },
                required: ["title_keyword"]
              }
            },
            {
              name: "add_expense",
              description: "Log a new expense for the user.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: { 
                  amount: { type: SchemaType.NUMBER, description: "The amount spent in rupees" },
                  category: { type: SchemaType.STRING, description: "Category: food, transport, health, entertainment, subscription, other" },
                  name: { type: SchemaType.STRING, description: "Short description of what was spent on" }
                },
                required: ["amount", "category", "name"]
              }
            },
            {
              name: "set_income",
              description: "Set the user's monthly income or budget.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: { amount: { type: SchemaType.NUMBER, description: "Monthly income in rupees" } },
                required: ["amount"]
              }
            },
            {
              name: "add_meeting",
              description: "Add a meeting, reminder, or event to the schedule.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING, description: "Meeting or event title" },
                  date: { type: SchemaType.STRING, description: "Date in YYYY-MM-DD format, use today's date if not specified: " + new Date().toISOString().split('T')[0] },
                  time: { type: SchemaType.STRING, description: "Time in HH:MM 24hr format, default 10:00" }
                },
                required: ["title", "date", "time"]
              }
            },
            {
              name: "log_mood",
              description: "Log the user's mood or journal note.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: { 
                  mood: { type: SchemaType.STRING, description: "The mood word e.g. happy, sad, stressed, motivated" },
                  note: { type: SchemaType.STRING, description: "Optional journal note or context" }
                },
                required: ["mood"]
              }
            },
            {
              name: "delete_task",
              description: "Delete a task from the board. Use when user says to delete or remove a task.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: { title_keyword: { type: SchemaType.STRING, description: "A keyword from the task title to match" } },
                required: ["title_keyword"]
              }
            },
            {
              name: "get_my_info",
              description: "Answer questions about Haris - his profile, skills, projects, experience. Use when user asks about themselves.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: { question: { type: SchemaType.STRING, description: "What the user asked about themselves" } },
                required: ["question"]
              }
            }
          ]
        };

        const currentTasks = [
          ...tasks.todo.map(t => `[TODO] ${t.title}`),
          ...tasks.inProgress.map(t => `[IN PROGRESS] ${t.title}`),
          ...tasks.completed.slice(0,3).map(t => `[DONE] ${t.title}`)
        ].join('\n');

        const currentMonthStr = new Date().toISOString().substring(0, 7);
        const totalSpent = expenses.filter(e => e.recurring || e.date.startsWith(currentMonthStr)).reduce((s, e) => s + e.amount, 0);

        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.6-flash",
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7
          },
          systemInstruction: `You are Aura — Haris's personal AI assistant and partner. You speak in Roman Urdu (Pakistani casual style). Be concise and direct.

CRITICAL RULES FOR FUNCTION CALLS:
- When user asks to SET/ADD/CREATE a meeting, event, reminder → ALWAYS call add_meeting function
- When user says "spent X on Y" or "add expense" → ALWAYS call add_expense
- When user says "set income/budget" → ALWAYS call set_income
- When user says "add task" or "todo" → ALWAYS call add_task
- When user says "I feel X" → ALWAYS call log_mood
- When user says "done with X" or "finished X" → call move_task_to_done
- When user says "started working on X" → call move_task_to_inprogress
- NEVER just suggest what to do — ACTUALLY DO IT by calling the function
- If a time is given like "10pm", convert to 24hr format (22:00)
- If no date is given, use today: ${new Date().toISOString().split('T')[0]}
- If no time is given, use 10:00

SELF-IMPROVEMENT: If user corrects you or says "no, I meant..." or "actually...", remember the correction. Store it as a learned pattern.

PERSONAL KNOWLEDGE: ${JSON.stringify(mergedKB)}

APP STATE:
- Total Funds: Rs ${totalFunds}
- Monthly Income: Rs ${monthlyIncome}
- Spent this month: Rs ${totalSpent}
- Remaining: Rs ${totalFunds + monthlyIncome - totalSpent}
- Current Tasks:
${currentTasks || 'No tasks yet'}

Available actions: add_task, move_task_to_inprogress, move_task_to_done, add_expense, set_income, add_meeting, log_mood.
Always prefer calling functions over just talking about them.`,
          tools: [appTools as any]
        });
        
        // Trim history payload to 4 items for ~1sec speed
        let rawHistory = aiChatMessages.slice(-4).map(m => ({
          role: m.sender === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }));
        
        while(rawHistory.length > 0 && rawHistory[0].role === 'model') {
          rawHistory.shift();
        }

        const validHistory: { role: string; parts: { text: string }[] }[] = [];
        let expectedRole = 'user';
        for (const msg of rawHistory) {
          if (msg.role === expectedRole) {
            validHistory.push(msg);
            expectedRole = expectedRole === 'user' ? 'model' : 'user';
          }
        }
        
        const chat = model.startChat({ history: validHistory });
        const result = await chat.sendMessage(userInputText);
        
        // Handle potential function calls from Gemini
        const functionCalls = result.response.functionCalls();
        const actionsDone: string[] = [];

        if (functionCalls && functionCalls.length > 0) {
          for (const call of functionCalls) {
            const args = call.args as any;
            if (call.name === 'add_task') {
              setTasks(prev => ({ ...prev, todo: [{ id: Date.now().toString(), title: args.title, type: 'Idea', color: 'blue' }, ...prev.todo] }));
              toast.success(`Task added: "${args.title}"`);
              actionsDone.push(`✅ Task add ho gaya: "${args.title}"`);
            } else if (call.name === 'move_task_to_inprogress') {
              setTasks(prev => {
                const keyword = args.title_keyword.toLowerCase();
                const matched = prev.todo.find(t => t.title.toLowerCase().includes(keyword));
                if (!matched) return prev;
                return {
                  ...prev,
                  todo: prev.todo.filter(t => t.id !== matched.id),
                  inProgress: [...prev.inProgress, { ...matched, type: 'Active', color: 'purple' }]
                };
              });
              toast.success(`Moved to In Progress!`);
              actionsDone.push(`🚀 Task "In Progress" mein move kar diya!`);
            } else if (call.name === 'move_task_to_done') {
              setTasks(prev => {
                const keyword = args.title_keyword.toLowerCase();
                const matched = [...prev.todo, ...prev.inProgress].find(t => t.title.toLowerCase().includes(keyword));
                if (!matched) return prev;
                return {
                  ...prev,
                  todo: prev.todo.filter(t => t.id !== matched.id),
                  inProgress: prev.inProgress.filter(t => t.id !== matched.id),
                  completed: [{ ...matched, type: 'Done', color: 'green' }, ...prev.completed]
                };
              });
              toast.success(`Task marked as done! 🎉`);
              actionsDone.push(`🎉 Task complete ho gaya!`);
            } else if (call.name === 'add_expense') {
              const cat = (['food','transport','health','entertainment','subscription'].includes(args.category) ? args.category : 'other') as any;
              setExpenses(prev => [...prev, { id: Date.now().toString(), name: args.name || `Aura: ${args.category}`, amount: args.amount, category: cat, date: new Date().toISOString().split('T')[0], recurring: false }]);
              setTotalFunds(prev => Math.max(0, prev - args.amount));
              toast.success(`Expense logged: Rs ${args.amount}`);
              actionsDone.push(`💰 Rs ${args.amount} (${args.name || args.category}) record ho gaya aur wallet funds se cut ho gaya.`);
            } else if (call.name === 'set_income') {
              setMonthlyIncome(args.amount);
              toast.success(`Income set to Rs ${args.amount}`);
              actionsDone.push(`💼 Monthly income Rs ${args.amount} set ho gayi.`);
            } else if (call.name === 'add_meeting') {
              // Add to local app schedule
              setScheduleEvents(prev => [...prev, { id: Date.now().toString(), title: args.title, date: args.date, time: args.time || '10:00', type: 'meeting' }]);
              toast.success(`Meeting added: "${args.title}"`);
              actionsDone.push(`📅 Meeting schedule ho gayi: "${args.title}" — ${args.date} ${args.time}`);

              // ── Sync to Google Calendar if user is connected ──────────────
              const gToken = (window as any).gapiAccessToken;
              if (gToken) {
                try {
                  const [hours, minutes] = (args.time || '10:00').split(':').map(Number);
                  const startDateTime = new Date(`${args.date}T${String(hours).padStart(2,'0')}:${String(minutes || 0).padStart(2,'0')}:00`);
                  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour

                  const calEvent = {
                    summary: args.title,
                    description: `Added via Aura AI assistant`,
                    start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Karachi' },
                    end:   { dateTime: endDateTime.toISOString(),   timeZone: 'Asia/Karachi' },
                  };

                  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${gToken}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(calEvent),
                  });

                  if (res.ok) {
                    toast.success('✅ Google Calendar pe bhi add ho gaya!');
                    actionsDone.push('🗓️ Google Calendar mein bhi sync ho gaya!');
                  } else {
                    const errData = await res.json();
                    toast.error(`Google Calendar sync failed: ${errData.error?.message || res.status}`);
                  }
                } catch (calErr: any) {
                  toast.error('Google Calendar sync error: ' + calErr.message);
                }
              }
            } else if (call.name === 'log_mood') {
              const moodEmojis: Record<string, string> = { happy: '😊', good: '💪', great: '🔥', sad: '😔', tired: '😴', stressed: '😰', motivated: '🚀', bored: '😑' };
              const emoji = moodEmojis[args.mood] || '😊';
              setJournalEntries(prev => [{ id: Date.now().toString(), content: args.note || `Mood: ${args.mood}`, date: new Date().toISOString(), mood: emoji }, ...prev]);
              toast.success(`Mood logged: ${emoji}`);
              actionsDone.push(`${emoji} Mood note ho gaya: ${args.mood}`);
            } else if (call.name === 'delete_task') {
              const keyword = args.title_keyword.toLowerCase();
              setTasks(prev => {
                const allCols: (keyof TaskColumns)[] = ['todo', 'inProgress', 'completed'];
                let matched: Task | undefined;
                let fromCol: keyof TaskColumns = 'todo';
                for (const col of allCols) {
                  const found = prev[col].find(t => t.title.toLowerCase().includes(keyword));
                  if (found) { matched = found; fromCol = col; break; }
                }
                if (!matched) return prev;
                const movedTask = { ...matched, type: 'Deleted', color: 'red' };
                return {
                  ...prev,
                  [fromCol]: prev[fromCol].filter(t => t.id !== matched!.id),
                  deleted: [...prev.deleted, movedTask],
                };
              });
              toast.success(`Task moved to Trash!`);
              actionsDone.push(`🗑️ Task "${args.title_keyword}" delete ho gaya!`);
            } else if (call.name === 'get_my_info') {
              actionsDone.push(`📋 Haris ka profile:\n${Object.entries(mergedKB).map(([k,v]) => `${k}: ${v}`).join('\n')}`);
            }
          }
          
          // Build a short natural confirmation from the actions done
          const confirmationText = actionsDone.join('\n');
          setAiChatMessages(prev => {
            const newMsgs = [...prev];
            newMsgs.pop(); 
            return [...newMsgs, { sender: 'assistant', text: confirmationText }];
          });
        } else {
          const responseText = result.response.text();
          setAiChatMessages(prev => {
            const newMsgs = [...prev];
            newMsgs.pop(); 
            return [...newMsgs, { sender: 'assistant', text: responseText }];
          });
        }

        // ── Self-Learning: detect corrections and learn ──────────────────────
        const correctionPatterns = [
          /(?:no|nahi|galat|wrong|actually|asal mein|i meant|matlab|mujhe chahiye tha|yeh nahi).*?(?:\.|$)/i,
          /(?:wrong|galat)\s+(?:answer|jawab|response)/i
        ];
        const isCorrection = correctionPatterns.some(p => p.test(userInputText));
        if (isCorrection) {
          const learned = JSON.parse(localStorage.getItem('aura_ai_learned') || '{}');
          learned[`correction_${Date.now()}`] = `User said: "${userInputText}" — Context: previous AI response was wrong. Remember this for future.`;
          const keys = Object.keys(learned);
          if (keys.length > 50) {
            const oldest = keys.slice(0, keys.length - 50);
            oldest.forEach(k => delete learned[k]);
          }
          localStorage.setItem('aura_ai_learned', JSON.stringify(learned));
        }

        // ── Self-Learning: learn user preferences from positive feedback ──────
        const positivePatterns = /(?:haan|yes|sahi|perfect|bilkul|exactly|great|awesome|shukriya|thanks|good|theek hai)/i;
        if (positivePatterns.test(userInputText) && aiChatMessages.length >= 2) {
          const lastUserMsg = aiChatMessages[aiChatMessages.length - 1]?.text || '';
          if (lastUserMsg) {
            const learned = JSON.parse(localStorage.getItem('aura_ai_learned') || '{}');
            learned[`pref_${Date.now()}`] = `User approved this pattern. Remember how I responded to: "${lastUserMsg}"`;
            const keys = Object.keys(learned);
            if (keys.length > 50) {
              const oldest = keys.slice(0, keys.length - 50);
              oldest.forEach(k => delete learned[k]);
            }
            localStorage.setItem('aura_ai_learned', JSON.stringify(learned));
          }
        }
      } catch (err: any) {
        setAiChatMessages(prev => {
          const newMsgs = [...prev];
          newMsgs.pop();
          return [...newMsgs, { sender: 'assistant', text: `❌ Gemini API Error: ${err.message}` }];
        });
      }
      return;
    }

    // ── STATIC FALLBACK ENGINE (If no API Key) ────────────────────────────────
    let aiResponseText = '';

    // ── Personal knowledge queries (any field) ─────────────────────────────────
    const knownKeys = Object.keys(mergedKB);
    const matchedKey = knownKeys.find(k =>
      query.includes(k) || query.includes(k.replace('_', ' '))
    );

    // ── Store new personal knowledge ────────────────────────────────────────
    const storeMatch = query.match(/(?:my\s+)?([\w\s]+?)\s+(?:is|are|=)\s+(.+)/i);

    // ── Action commands ─────────────────────────────────────────────────────
    const incomeMatch = query.match(/(?:set\s+)?(?:my\s+)?(?:budget|income|salary)\s+(?:is|to|of)?\s*(\d+)/i) ||
                        query.match(/(\d+)\s+(?:is\s+)?my\s+(?:budget|income|salary)/i);
    const expenseMatch = query.match(/(?:spent|add\s+expense)\s+(\d+)\s+(?:on|for)\s+(\w+)/i) ||
                         query.match(/(?:add\s+expense)\s+(\w+)\s+(\d+)/i);
    const taskMatch = query.match(/(?:add\s+task|todo|create\s+task|set\s+my\s+new\s+task|set\s+task|i\s+want\s+to\s+make|i\s+make\s+new|make\s+new|new\s+task)\s+(.+)/i);
    const moodMatch = query.match(/(?:i\s+feel|i'm\s+feeling|mood\s+is|my\s+mood\s+is)\s+(\w+)/i);
    const meetingMatch = query.match(/(?:set|add|create|schedule|make)\s+(?:a\s+)?(?:meeting|event|reminder|session)\s+(?:at|for|on)?\s*(.+)/i) ||
                        query.match(/(?:meeting|event|reminder)\s+(?:at|for|on)\s+(.+)/i);

    // ── Advisor & Q&A patterns ──────────────────────────────────────────────
    const isCareerQuery = query.includes('career') || query.includes('job') || query.includes('freelance') || query.includes('kaam') || query.includes('job dhundo');
    const isSkillQuery = query.includes('skill') || query.includes('technology') || query.includes('learn') || query.includes('seekho');
    const isProjectQuery = query.includes('project') || query.includes('portfolio') || query.includes('kaam kiya');
    const isAdviceQuery = query.includes('advice') || query.includes('mashwara') || query.includes('suggest') || query.includes('help') || query.includes('mujhe batao') || query.includes('kya karoon');
    const isIntroQuery = query.includes('who am i') || query.includes('mera data') || query.includes('meri info') || query.includes('apna data') || query.includes('my profile') || query.includes('summarize me') || query.includes('mera naam');
    const isCVQuery = query.includes('cv') || query.includes('resume') || query.includes('bio') || query.includes('intro');
    const isLinksQuery = query.includes('link') || (query.includes('github') && !query.includes('action') && !query.includes('activity')) || query.includes('linkedin') || query.includes('portfolio') || query.includes('contact');
    const isGreeting = query.match(/^(hi|hello|hey|salam|hii|assalam|yo|sup)\b/i);
    const isGoodResponse = query.match(/^(good|great|okay|ok|fine|accha|theek|thk|shukriya|thanks|thank you|haan|yes|no|nahi)\b/i);
    
    // Live GitHub API Query
    const isGithubLiveQuery = query.includes('github') && (query.includes('last action') || query.includes('activity') || query.includes('recent') || query.includes('kya chala'));

    if (isGithubLiveQuery) {
      setAiChatMessages(prev => [...prev, { sender: 'assistant', text: `⏳ Checking your live GitHub activity...` }]);
      try {
        const username = mergedKB.github.split('/').pop() || 'Haris-Ahmed83';
        const res = await fetch(`https://api.github.com/users/${username}/events/public`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN || ''}`
          }
        });
        if (!res.ok) throw new Error("API Error");
        const events = await res.json();
        
        if (events && events.length > 0) {
          const latestEvent = events[0];
          let actionText = '';
          if (latestEvent.type === 'PushEvent') {
             actionText = `Tumne abhi **${latestEvent.repo.name}** mein code push kiya hai.`;
          } else if (latestEvent.type === 'CreateEvent') {
             actionText = `Tumne abhi ek naya ${latestEvent.payload.ref_type} banaya hai: **${latestEvent.repo.name}**.`;
          } else if (latestEvent.type === 'WatchEvent') {
             actionText = `Tumne abhi **${latestEvent.repo.name}** ko star/watch kiya hai.`;
          } else if (latestEvent.type === 'IssuesEvent') {
             actionText = `Tumne abhi **${latestEvent.repo.name}** mein ek issue ${latestEvent.payload.action} kiya.`;
          } else {
             actionText = `Tumhara last action **${latestEvent.type}** tha on **${latestEvent.repo.name}**.`;
          }
          
          aiResponseText = `🐙 **Live GitHub Update:**\n\n${actionText}\n\n💡 Mashwara: Consistency is key! Har din commit karna resume/portfolio ke liye zabardast hota hai. Aur batao, aaj kaunsa naya feature bana rahe ho?`;
        } else {
          aiResponseText = `🐙 **GitHub Check:** Tumhara username ${username} hai, but koi recent public activity nahi mili. \n\n💡 Tip: Aaj hi ek chhota project commit kardo!`;
        }
      } catch (err) {
        aiResponseText = `❌ Oops! Main abhi GitHub fetch nahi kar paa rahi hoon. Please apna internet ya username check karo. (Username set hai: ${mergedKB.github})`;
      }
      // Remove loading message and add final
      setAiChatMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop(); // remove loading msg
        return [...newMsgs, { sender: 'assistant', text: aiResponseText }];
      });
      return; // Exit early since we updated state already
    } else if (isGreeting) {
      aiResponseText = `Salam Haris! 👋 Kya haal hai? Main hamesha yahan hoon. Apna koi kaam bolo, career ke baare mein poocho, ya apna schedule manage karo. Kya chahiye aaj? 💼`;
    } else if (isGoodResponse) {
      const followups = [
        `Zabardast! Koi naya project start karna hai? Tumhare paas ${tasks.todo.length} active ideas hain — kisi ko "In Progress" mein le jao aaj! 🚀`,
        `Acha! Kya aaj koi task complete hua? Idea Board check karo — ${tasks.inProgress.length} kaam chal raha hai. ✅`,
        `Great! Ek mashwara: aaj tumhara GitHub update karo (${mergedKB.github}). Consistency dikhti hai recruiters ko! 💡`,
        `Theek hai! Ek kaam karo — apna LinkedIn update karo ya ek naya post dalo. Personal branding bohot zaroori hai AI field mein! 🔥`
      ];
      aiResponseText = followups[Math.floor(Math.random() * followups.length)];
    } else if (isIntroQuery) {
      aiResponseText = `🧠 **Tumhari Profile (Muhammad Haris):**\n\n👤 ${mergedKB.title}\n📍 ${mergedKB.location}\n📧 ${mergedKB.email} | 📞 ${mergedKB.phone}\n\n🔗 GitHub: ${mergedKB.github}\n🔗 LinkedIn: ${mergedKB.linkedin}\n🔗 Portfolio: ${mergedKB.portfolio}\n\n🏆 Top Achievement: 31 booked calls in 9 days via GHL automation!\n📚 Education: ${mergedKB.education}`;
    } else if (isLinksQuery) {
      aiResponseText = `🔗 **Tumhare Professional Links:**\n\n• GitHub: ${mergedKB.github}\n• LinkedIn: ${mergedKB.linkedin}\n• Portfolio: ${mergedKB.portfolio}\n• Email: ${mergedKB.email}\n• Phone: ${mergedKB.phone}\n\n💡 Mashwara: LinkedIn profile ko aaj update karo — recruiters sab se pehle wahan dekhte hain!`;
    } else if (isCVQuery) {
      aiResponseText = `📄 **Tumhara CV Summary:**\n\n${mergedKB.summary}\n\n🏆 Key Achievements:\n${mergedKB.achievements.split('|').map(a => `• ${a.trim()}`).join('\n')}\n\n💡 Mashwara: CV mein "31 booked calls in 9 days" wala achievement sabse upar raho — yeh recruiter ka attention pakadta hai!`;
    } else if (isProjectQuery) {
      aiResponseText = `🚀 **Tumhare Key Projects:**\n\n${mergedKB.projects.split('. ').filter(Boolean).map(p => `• ${p}`).join('\n')}\n\n💡 Mashwara: Portfolio website (${mergedKB.portfolio}) ko live raho aur GitHub (${mergedKB.github}) pe regularly commit karo!`;
    } else if (isSkillQuery) {
      aiResponseText = `🛠️ **Tumhari Skills:**\n\n${mergedKB.skills.split('|').map(s => `• ${s.trim()}`).join('\n')}\n\n💡 Mashwara: Tumhare paas AI + Full Stack + Mobile ka rare combination hai. Yeh 2025 mein bahut demand mein hai. Apne RAG system ko showcase karo!`;
    } else if (isCareerQuery) {
      aiResponseText = `💼 **Career Advice for Haris:**\n\nTumhari current position: ${mergedKB.current_job}\n\nMera mashwara:\n1. 🌍 Upwork/Freelancer pe GHL + AI niche target karo — bohot zyada demand hai\n2. 🧠 Production RAG system ka case study likhke LinkedIn pe publish karo\n3. 📈 Apne "31 calls in 9 days" achievement ko metric ke saath pitch karo\n4. 🎯 Next goal: aik agency ka AI workflow automate karo aur testimonial lo\n\nKya tum freelancing explore karna chahte ho ya job talash kar rahe ho?`;
    } else if (isAdviceQuery) {
      const advices = [
        `🎯 Mera mashwara: Tumhare ${tasks.todo.length} active ideas hain. Sab se pehle ek cheez complete karo — AI projects ke liye "done is better than perfect". Kaunsa project tumhe sabse zyada excite karta hai? Woh karo!`,
        `💡 Career ke liye: Tumhara GitHub (${mergedKB.github}) 170+ repos ke saath strong hai. Ek production project ka README update karo aur screenshot add karo — yeh recruiter ke liye game changer hoga!`,
        `📊 Finance ke liye: Income track karo aur 20% savings rule follow karo. Ek savings goal set karo Finance tab mein — chhota shuru karo, consistency important hai!`,
        `🚀 Productivity ke liye: Pomodoro technique use karo — 25 min kaam, 5 min break. Analytics tab mein timer already hai! Daily routine follow karo.`
      ];
      aiResponseText = advices[Math.floor(Math.random() * advices.length)];
    } else if (matchedKey && !incomeMatch && !expenseMatch && !taskMatch && !moodMatch) {
      // Dynamic knowledge lookup
      aiResponseText = `🧠 **${matchedKey.replace('_', ' ').toUpperCase()}:** ${mergedKB[matchedKey]}`;
      if (matchedKey === 'github') aiResponseText += `\n\n💡 Tip: Regularly commit karo — daily green squares recruiters ko impress karte hain!`;
      if (matchedKey === 'skills') aiResponseText += `\n\n💡 Tip: In mein se Python + LangChain + FastAPI ki combination sab se zyada in-demand hai 2025 mein.`;
    } else if (storeMatch && !incomeMatch && !taskMatch) {
      const key = storeMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
      const val = storeMatch[2].trim();
      if (key.length > 1 && key.length < 40 && !['i', 'my', 'the', 'a', 'an'].includes(key)) {
        setPersonalKnowledge(prev => ({ ...prev, [key]: val }));
        aiResponseText = `🧠 Yaad kar liya! "${key}" = "${val}". Aage kisi bhi waqt poochho.`;
        toast.success(`Saved: ${key}`);
      } else {
        aiResponseText = `🤔 Mujhe aur context chahiye. Thoda aur detail mein batao?`;
      }
    } else if (incomeMatch) {
      const amount = parseInt(incomeMatch[1] || incomeMatch[2]);
      if (!isNaN(amount)) {
        setMonthlyIncome(amount);
        const savingsTarget = Math.round(amount * 0.2);
        aiResponseText = `✅ Budget set! Rs ${amount.toLocaleString()} monthly income record ho gaya.\n\n💡 Mashwara: 20% savings rule ke hisaab se Rs ${savingsTarget.toLocaleString()} bachane ki koshish karo. Finance tab mein ek savings goal set karo!`;
        toast.success(`Income set: Rs ${amount.toLocaleString()}`);
      }
    } else if (expenseMatch) {
      let amountStr = '', categoryStr = '';
      if (expenseMatch[1] && expenseMatch[2]) {
        if (isNaN(Number(expenseMatch[1]))) { categoryStr = expenseMatch[1]; amountStr = expenseMatch[2]; }
        else { amountStr = expenseMatch[1]; categoryStr = expenseMatch[2]; }
      }
      const amount = parseFloat(amountStr);
      const validCategories: Expense['category'][] = ['food', 'transport', 'subscription', 'health', 'entertainment', 'other'];
      const cat = categoryStr.trim().toLowerCase() as Expense['category'];
      const finalCategory = validCategories.includes(cat) ? cat : 'other';
      if (!isNaN(amount)) {
        setExpenses(prev => [...prev, { id: Date.now().toString(), name: `Aura: ${categoryStr}`, amount, category: finalCategory, date: new Date().toISOString().split('T')[0], recurring: false }]);
        const currentMonth = new Date().toISOString().substring(0, 7);
        const totalSoFar = expenses.filter(ex => ex.date.startsWith(currentMonth)).reduce((s, ex) => s + ex.amount, 0) + amount;
        aiResponseText = `✅ Expense logged! Rs ${amount.toLocaleString()} (${finalCategory}).\nIs mahine ab tak total: Rs ${totalSoFar.toLocaleString()}`;
        if (monthlyIncome > 0 && totalSoFar > monthlyIncome * 0.8) {
          aiResponseText += `\n\n⚠️ Khabardar! Tumne 80% budget use kar liya hai is mahine. Spending check karo!`;
        }
        toast.success(`Expense Rs ${amount} added`);
      }
    } else if (taskMatch) {
      const taskTitle = taskMatch[1].trim();
      if (taskTitle) {
        setTasks(prev => ({ ...prev, todo: [{ id: Date.now().toString(), title: taskTitle, type: 'Idea', color: 'blue' }, ...prev.todo] }));
        aiResponseText = `✅ Task add ho gaya: "${taskTitle}"\n\n💡 Tip: Idea Board mein jaake is task ki priority set karo aur subtasks add karo. Focus ke liye High priority lagao!`;
        toast.success(`Task added: "${taskTitle}"`);
      }
    } else if (meetingMatch) {
      const meetingInfo = meetingMatch[1].trim();
      const timeMatch = meetingInfo.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      let time = '10:00';
      let title = meetingInfo;
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const min = timeMatch[2] || '00';
        const ampm = (timeMatch[3] || '').toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        time = `${String(hour).padStart(2,'0')}:${min}`;
        title = meetingInfo.replace(timeMatch[0], '').trim() || 'Meeting';
      }
      const today = new Date().toISOString().split('T')[0];
      setScheduleEvents(prev => [...prev, { id: Date.now().toString(), title, date: today, time, type: 'meeting' }]);
      aiResponseText = `📅 Meeting set ho gayi: "${title}" — Aaj ${time} baje.\n\n💡 Tip: Schedule tab mein dekho aur notification set karo!`;
      toast.success(`Meeting: ${title} at ${time}`);
    } else if (moodMatch) {
      const moodWord = moodMatch[1].trim().toLowerCase();
      const moodEmojis: Record<string, string> = { happy: '😊', good: '💪', great: '🔥', sad: '😔', tired: '😴', stressed: '😰', motivated: '🚀', bored: '😑' };
      const emoji = moodEmojis[moodWord] || '😊';
      setJournalEntries(prev => [{ id: Date.now().toString(), content: `Mood log via Aura: I am feeling ${moodWord}`, date: new Date().toISOString(), mood: emoji }, ...prev]);
      const moodAdvice: Record<string, string> = {
        sad: "Tension mat lo Haris! Rest karo, thodi walk karo. Kal nayi energy se kaam karna. 💙",
        tired: "Rest zaroori hai! Pomodoro timer lagao — 25 min kaam phir 5 min break. Ya aaj chhod do. 😴",
        stressed: "Ek kaam karo — sabse chota task complete karo. Momentum aayega phir sab easy lagega. 💡",
        motivated: "Yeh energy pakad ke raho! Abhi sabse important task karo. Idea Board check karo! 🚀",
        great: "Masha'Allah! Is energy mein koi mushkil project attack karo. Aaj ka din productive banao! 🔥",
      };
      aiResponseText = `✅ Journal mein ${emoji} mood note ho gaya.\n\n${moodAdvice[moodWord] || `Shukriya share karne ke liye! Kuch aur baat karo? 😊`}`;
      toast.success(`Mood logged: ${emoji}`);
    } else if (query.includes('budget') || query.includes('finance') || query.includes('money') || query.includes('paise')) {
      const currentMonthStr = new Date().toISOString().substring(0, 7);
      const totalExpense = [...expenses.filter(e => e.recurring), ...expenses.filter(e => !e.recurring && e.date.startsWith(currentMonthStr))].reduce((s, e) => s + e.amount, 0);
      const balance = monthlyIncome - totalExpense;
      aiResponseText = `💰 Finance Report:\n• Income: Rs ${monthlyIncome.toLocaleString()}\n• Spent: Rs ${totalExpense.toLocaleString()}\n• Remaining: Rs ${balance.toLocaleString()}\n\n${balance < 0 ? '⚠️ Budget exceed ho gaya! Expenses reduce karo.' : balance < monthlyIncome * 0.2 ? '⚡ Budget tight hai — sochke kharch karo!' : '✅ Budget simple hai! Savings goal set karo Finance tab mein.'}`;
    } else if (query.includes('task') || query.includes('kaam') || query.includes('progress')) {
      const topTask = tasks.todo[0] || tasks.inProgress[0];
      aiResponseText = `📋 Task Report:\n• Active Ideas: ${tasks.todo.length}\n• In Progress: ${tasks.inProgress.length}\n• Completed: ${tasks.completed.length}\n${topTask ? `\n🎯 Top Priority: "${topTask.title}"` : ''}\n\n💡 Mashwara: ${tasks.inProgress.length === 0 ? 'Koi task "In Progress" mein nahi — aaj kuch shuru karo!' : 'In Progress tasks pe focus karo — unhe complete karo pehle!'}`;
    } else {
      // Fallback — proactive assistant response
      const fallbacks = [
        `🤔 Samajh gaya! Thoda aur detail doge toh better jawab de sakta hoon.\n\nYa yeh try karo:\n• "mera career advice do"\n• "meri skills batao"\n• "mera github latest activity kya hai"\n• "spent 500 on food"`,
        `🧠 Main tumhara personal data jaanta hoon — CV, projects, skills, links sab kuch. Koi bhi specific cheez poochho!\n\nJaise: "mera LinkedIn batao" ya "mujhe career advice do"`,
        `💡 Hint: Main sirf jawab nahi deta — tumhare liye better options bhi suggest karta hoon. Koi decision lena hai? Baat karo! 🤝`
      ];
      aiResponseText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    setTimeout(() => {
      setAiChatMessages(prev => [...prev, { sender: 'assistant', text: aiResponseText }]);
    }, 400);
  };

  return (
    <>
      {isLocked && <AppLock onUnlock={() => setIsLocked(false)} />}
      <div className="app-container" ref={containerRef}>
      
      {/* Command Palette */}
      <AnimatePresence>
        {cmdOpen && (
          <motion.div className="cmd-palette-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCmdOpen(false)}>
            <motion.div className="cmd-palette" initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} onClick={(e) => e.stopPropagation()}>
              <div className="cmd-input-wrapper">
                <Search size={20} color="var(--text-secondary)" />
                <input type="text" autoFocus placeholder="Search, navigate, or try 'add task...' / 'remind me...'" value={cmdSearch} onChange={(e) => setCmdSearch(e.target.value)} />
                <kbd className="shortcut-hint">ESC</kbd>
              </div>
              <div className="cmd-results">
                {cmdSearch.toLowerCase().startsWith('add task ') && (
                  <div className="cmd-item" style={{ color: 'var(--accent)' }} onClick={() => {
                    const taskName = cmdSearch.replace(/add task /i, '').trim();
                    if (taskName) {
                      setTasks(prev => ({ ...prev, todo: [{ id: Date.now().toString(), title: taskName, type: 'Idea', color: 'blue' }, ...prev.todo] }));
                      toast.success(`Task added: "${taskName}"`);
                      setCmdOpen(false);
                      setCmdSearch('');
                    }
                  }}>
                    <Wand2 size={18} /> Add "{cmdSearch.replace(/add task /i, '').trim()}" to Idea Board
                  </div>
                )}
                {cmdSearch.toLowerCase().startsWith('remind me ') && (
                  <div className="cmd-item" style={{ color: 'var(--accent)' }} onClick={() => {
                    const title = cmdSearch.replace(/remind me /i, '').trim();
                    if (title) {
                      setScheduleEvents(prev => [...prev, { id: Date.now().toString(), title, date: new Date().toISOString().split('T')[0], time: '10:00', type: 'reminder' }]);
                      toast.success(`Reminder set: "${title}"`);
                      setCmdOpen(false);
                      setCmdSearch('');
                    }
                  }}>
                    <Wand2 size={18} /> Schedule reminder: "{cmdSearch.replace(/remind me /i, '').trim()}"
                  </div>
                )}
                {[
                  { tab: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Go to Dashboard' },
                  { tab: 'board', icon: <KanbanSquare size={18} />, label: 'Go to Idea Board' },
                  { tab: 'schedule', icon: <Calendar size={18} />, label: 'Go to Schedule' },
                  { tab: 'journal', icon: <BookOpen size={18} />, label: 'Go to Journal' },
                  { tab: 'analytics', icon: <BarChart2 size={18} />, label: 'Go to Analytics' },
                  { tab: 'finance', icon: <Wallet size={18} />, label: 'Go to Finance' },
                  { tab: 'settings', icon: <SettingsIcon size={18} />, label: 'Go to Settings' },
                ].filter(item => !cmdSearch || item.label.toLowerCase().includes(cmdSearch.toLowerCase()))
                 .map(item => (
                  <div key={item.tab} className="cmd-item" onClick={() => { setActiveTab(item.tab); setCmdOpen(false); setCmdSearch(''); }}>
                    {item.icon} {item.label}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo-container">
            <Sparkles className="logo-icon" size={24} />
            <h1 className="logo-text">Aura OS</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { id: 'board', icon: <KanbanSquare size={20} />, label: 'Ideas' },
            { id: 'habits', icon: <Target size={20} />, label: 'Habits' },
            { id: 'schedule', icon: <Calendar size={20} />, label: 'Schedule' },
            { id: 'finance', icon: <Wallet size={20} />, label: 'Finance' },
            { id: 'notes', icon: <FileText size={20} />, label: 'Notes' },
            { id: 'settings', icon: <SettingsIcon size={20} />, label: 'Settings' },
          ].map(item => (
            <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{settings.displayName.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{settings.displayName}</span>
              <span className="user-status">Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="top-header glass-panel">
          <div className="search-trigger" onClick={() => setCmdOpen(true)}>
            <Search size={16} />
            <span>Search or command...</span>
            <div className="shortcut-hint"><Command size={11} /> K</div>
          </div>
          <div className="header-actions">
            {/* Desktop Quick Add Form */}
            <form onSubmit={handleAddIdea} className="quick-add-form">
              <input
                type="text"
                className="quick-add-input"
                placeholder="Quick add idea..."
                value={quickIdea}
                onChange={(e) => setQuickIdea(e.target.value)}
              />
              <motion.button whileTap={{ scale: 0.95 }} type="submit" className="btn-primary">
                <Plus size={16} /> Add
              </motion.button>
            </form>

            {/* Mobile Quick Add Button */}
            <button className="icon-btn mobile-quick-add-btn" title="Quick Add Idea" onClick={() => setShowQuickAddModal(true)}>
              <Plus size={18} color="var(--accent)" />
            </button>

            <NotificationCenter
              notifications={notifications}
              onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
              onClearAll={() => setNotifications([])}
            />
          </div>
        </header>

        {/* Update Banner */}
        {updateInfo && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            margin: '12px 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>
                {updating ? `Updating to v${updateInfo.version}...` : `New version available: v${updateInfo.version}`}
              </div>
              {updateProgress && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{updateProgress}</div>}
              {!updating && !updateProgress && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Tap Update to download the latest version
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleUpdate}
                disabled={updating}
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.6 : 1,
                }}
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setUpdateInfo(null)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Quick Add Idea Modal */}
        <AnimatePresence>
          {showQuickAddModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuickAddModal(false)}>
              <motion.div className="modal-content glass-panel" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lightbulb size={20} color="var(--accent)" /> Quick Add Idea
                  </h3>
                  <button onClick={() => setShowQuickAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <form onSubmit={e => {
                  e.preventDefault();
                  if (!quickIdea.trim()) return;
                  setTasks(prev => ({ ...prev, todo: [{ id: Date.now().toString(), title: quickIdea, type: 'Idea', color: 'blue' }, ...prev.todo] }));
                  setQuickIdea('');
                  setShowQuickAddModal(false);
                  toast.success(`Idea added to board: "${quickIdea}"`);
                }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input
                    className="form-input"
                    placeholder="Type your new idea..."
                    value={quickIdea}
                    onChange={e => setQuickIdea(e.target.value)}
                    autoFocus
                    required
                  />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <motion.button type="submit" whileTap={{ scale: 0.95 }} className="btn-primary" style={{ flex: 1 }}>
                      <Plus size={16} /> Save Idea
                    </motion.button>
                    <button type="button" className="btn-secondary" onClick={() => setShowQuickAddModal(false)} style={{ flex: 1 }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Container */}
        <div className="view-container">
          <AnimatePresence mode="wait">

                {/* ===== DASHBOARD ===== */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="dashboard-view">
                <section className="welcome-section">
                  {/* Top greeting row — Avatar + Name + Bell (matches image) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 800, fontSize: '18px', color: 'white', flexShrink: 0, boxShadow: '0 0 16px rgba(168,85,247,0.4)' }}>
                        {settings.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>{getGreeting()},</p>
                        <h2 style={{ margin: 0 }}>{settings.displayName}! 👋</h2>
                      </div>
                    </div>
                    <button className="icon-btn" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                      <Bell size={18} color="var(--accent)" />
                    </button>
                  </div>

                  {/* Search bar — like image */}
                  <div onClick={() => setCmdOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '50px', padding: '10px 16px', cursor: 'pointer', marginTop: '14px', color: 'var(--text-3)', fontSize: '13px' }}>
                    <Search size={15} />
                    <span>Search anything...</span>
                  </div>

                  {/* Quick Access — Journal + Analytics */}
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', margin: '18px 0 10px' }}>Quick Access</p>
                  <div className="quick-access-grid">
                    <motion.button whileTap={{ scale: 0.96 }} className="quick-access-card purple" onClick={() => setActiveTab('journal')}>
                      <div className="qac-icon purple">
                        <BookOpen size={22} color="var(--accent-purple)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong className="qac-title">Life Journal</strong>
                        <span className="qac-sub">Write. Reflect. Grow.</span>
                      </div>
                      <ArrowRight size={14} className="qac-arrow" color="var(--accent-purple)" />
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.96 }} className="quick-access-card blue" onClick={() => setActiveTab('analytics')}>
                      <div className="qac-icon blue">
                        <BarChart2 size={22} color="var(--accent-blue)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong className="qac-title">Analytics & Focus</strong>
                        <span className="qac-sub">Track. Analyze. Improve.</span>
                      </div>
                      <ArrowRight size={14} className="qac-arrow" color="var(--accent-blue)" />
                    </motion.button>
                  </div>

                  {/* Your Progress */}
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', margin: '18px 0 10px' }}>Your Progress</p>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}><Lightbulb size={14} color="var(--accent-blue)" /></div>
                      <span className="stat-label">Active Ideas</span>
                      <span className="stat-value">{tasks.todo.length}</span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.15)' }}><Clock size={14} color="var(--accent-purple)" /></div>
                      <span className="stat-label">In Progress</span>
                      <span className="stat-value">{tasks.inProgress.length}</span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><CheckCircle2 size={14} color="var(--positive)" /></div>
                      <span className="stat-label">Completed</span>
                      <span className="stat-value">{tasks.completed.length}</span>
                    </div>
                  </div>
                </section>

                <div className="dashboard-widgets" style={{ gridTemplateColumns: '1fr', gap: '14px', marginBottom: '16px' }}>
                  {/* Aura Core AI Assistant Chat */}
                  <div className="aura-ai-widget glass-panel">
                    <h3 className="aura-ai-title">
                      <Sparkles size={18} color="var(--accent)" /> Aura Core AI Assistant
                    </h3>
                    <div className="aura-ai-chat-box">
                      {aiChatMessages.map((msg, i) => (
                        <div key={i} className={`aura-ai-msg ${msg.sender}`}>
                          {msg.text}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendAiMessage} className="aura-ai-form">
                      <input
                        type="text"
                        className="aura-ai-input"
                        placeholder="Ask: 'How is my budget?', 'What are my tasks?'..."
                        value={aiChatInput}
                        onChange={e => setAiChatInput(e.target.value)}
                      />
                      <button type="submit" className="btn-primary aura-ai-send-btn">Send</button>
                    </form>
                  </div>
                </div>

                <div className="dashboard-widgets">
                  {/* Upcoming Events Widget */}
                  <div className="widget glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                      <Calendar size={18} color="var(--accent-blue)" /> Upcoming Events
                    </h3>
                    {getUpcomingEvents().length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No upcoming events. <span style={{ cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => setActiveTab('schedule')}>Add one →</span></p>
                    ) : (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {getUpcomingEvents().map(ev => (
                          <li key={ev.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${eventTypeColors[ev.type]}` }}>
                            <strong style={{ display: 'block', fontSize: '0.9rem' }}>{ev.title}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(ev.date).toLocaleDateString()} {ev.time && `at ${ev.time}`}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Recent Journal Widget */}
                  <div className="widget glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                      <BookOpen size={18} color="var(--accent-purple)" /> Recent Journal
                    </h3>
                    {journalEntries.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No journal entries. <span style={{ cursor: 'pointer', color: 'var(--accent-purple)' }} onClick={() => setActiveTab('journal')}>Write one →</span></p>
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{journalEntries[0].mood}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(journalEntries[0].date).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{journalEntries[0].content.slice(0, 120)}{journalEntries[0].content.length > 120 ? '...' : ''}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phase 2 & 3 Widget Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}>
                  
                  {/* Voice Memo Widget */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                      <Mic size={18} color="var(--accent-rose)" /> Quick Idea Capture
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      {voiceSupported
                        ? 'Speak or type and your idea will instantly appear in the Idea Board.'
                        : 'Type your idea below to add it to the Idea Board.'}
                    </p>
                    {voiceTranscript && (
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '14px', borderLeft: '3px solid var(--accent-blue)' }}>
                        🎤 "{voiceTranscript}"
                      </div>
                    )}
                    {voiceSupported ? (
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={handleVoiceMemo}
                        className={isListening ? 'btn-primary' : 'btn-secondary'}
                        style={{ width: '100%', justifyContent: 'center', background: isListening ? 'rgba(244,63,94,0.2)' : undefined, borderColor: isListening ? 'var(--accent-rose)' : undefined }}
                      >
                        {isListening ? <><MicOff size={16} /> Stop Listening...</> : <><Mic size={16} /> Start Voice Memo</>}
                      </motion.button>
                    ) : (
                      <form onSubmit={(e) => { e.preventDefault(); handleVoiceTextSubmit(); }} style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={voiceTextInput}
                          onChange={(e) => setVoiceTextInput(e.target.value)}
                          placeholder="Type your idea..."
                          style={{
                            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', padding: '10px 14px', borderRadius: '8px', outline: 'none',
                            fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                          }}
                        />
                        <motion.button type="submit" whileTap={{ scale: 0.95 }} className="btn-primary" style={{ padding: '10px 16px' }}>
                          <Plus size={16} /> Add
                        </motion.button>
                      </form>
                    )}
                  </div>

                  {/* AI Auto-Schedule Widget */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                      <Wand2 size={18} color="var(--accent-purple)" /> AI Auto-Schedule
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      AI will automatically schedule all your "New Ideas" into the next {tasks.todo.length} days and sync them to Google Calendar.
                    </p>
                    {autoScheduleMsg && (
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', borderLeft: '3px solid var(--accent-emerald)', color: 'var(--accent-emerald)' }}>
                        {autoScheduleMsg}
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handleAutoSchedule}
                      disabled={autoScheduling}
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <Wand2 size={16} /> {autoScheduling ? 'Scheduling...' : `Auto-Schedule ${tasks.todo.length} Tasks`}
                    </motion.button>
                  </div>

                  {/* Weather Widget */}
                   <WeatherWidget />

                  {/* Spotify Embed Widget */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                      <Headphones size={18} color="#1DB954" /> Focus Music
                    </h3>
                    <iframe
                      style={{ borderRadius: '12px', border: 'none', width: '100%', height: '152px' }}
                      src={spotifyPlaylist}
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {[
                        { label: 'Lo-fi Beats', id: '37i9dQZF1DWZeKCadgRdKQ' },
                        { label: 'Deep Focus', id: '37i9dQZF1DWStqbJZ9G4cQ' },
                        { label: 'Classical', id: '37i9dQZF1DWWEJlAGA9gs0' },
                        { label: 'Chill Vibes', id: '37i9dQZF1DWZJD6lG5Tcry' },
                      ].map(q => (
                        <button key={q.label} onClick={() => setSpotifyPlaylist(`https://open.spotify.com/embed/playlist/${q.id}?utm_source=generator&theme=0`)} style={{ padding: '5px 12px', borderRadius: '20px', border: spotifyPlaylist.includes(q.id) ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)', background: spotifyPlaylist.includes(q.id) ? 'rgba(212,175,55,0.15)' : 'transparent', color: spotifyPlaylist.includes(q.id) ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}>
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Google Integration */}
                <div style={{ marginTop: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Google Integration</h3>
                  <GoogleConnect />
                </div>
              </motion.div>
            )}


            {/* ===== IDEA BOARD (KANBAN) ===== */}
            {activeTab === 'board' && (
              <motion.div key="board" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', width: '100%' }}>
                {/* Header row — title + search + 3dots */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Ideas & Tasks</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-btn" onClick={() => setCmdOpen(true)}><Search size={16} /></button>
                    <button className="icon-btn" onClick={() => setCmdOpen(true)}><MoreVertical size={16} /></button>
                  </div>
                </div>

                {/* Filter Pills — All, Idea, Active, Done */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '2px 4px 6px', scrollbarWidth: 'none' }}>
                  {(['All', 'Idea', 'Active', 'Done'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setBoardCategoryFilter(cat)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: boardCategoryFilter === cat ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: boardCategoryFilter === cat ? 'rgba(212,175,55,0.15)' : 'var(--surface-2)',
                        color: boardCategoryFilter === cat ? 'var(--accent)' : 'var(--text-2)',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="kanban-view" style={{ flex: 1 }}>
                  <DragDropContext onDragEnd={onDragEnd}>
                    {renderKanbanColumn('todo', 'New Ideas', <Lightbulb size={18} color="var(--accent-purple)" />, tasks.todo.filter(t => boardCategoryFilter === 'All' || t.type.toLowerCase() === boardCategoryFilter.toLowerCase()))}
                    {renderKanbanColumn('inProgress', 'In Progress', <Clock size={18} color="var(--accent-blue)" />, tasks.inProgress.filter(t => boardCategoryFilter === 'All' || t.type.toLowerCase() === boardCategoryFilter.toLowerCase()))}
                    {renderKanbanColumn('completed', 'Completed', <CheckCircle2 size={18} color="var(--accent-emerald)" />, tasks.completed.filter(t => boardCategoryFilter === 'All' || t.type.toLowerCase() === boardCategoryFilter.toLowerCase()), { isCompleted: true })}
                    {renderKanbanColumn('deleted', 'Trash', <Trash2 size={18} color="var(--accent-rose)" />, tasks.deleted, { isDeleted: true })}
                  </DragDropContext>
                </div>
              </motion.div>
            )}

            {/* ===== SCHEDULE ===== */}
            {activeTab === 'schedule' && (
              <motion.div key="schedule" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="schedule-view">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.8rem' }}>Schedule</h2>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" onClick={() => setShowAddEvent(true)}>
                    <Plus size={16} /> Add Event
                  </motion.button>
                </div>

                {/* Add Event Modal */}
                <AnimatePresence>
                  {showAddEvent && (
                    <motion.div className="cmd-palette-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddEvent(false)}>
                      <motion.div className="cmd-palette" initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>New Event</h3>
                        <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <input type="text" placeholder="Event title..." value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none', fontFamily: 'Inter, sans-serif' }} autoFocus />
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                            <input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {(['meeting', 'reminder', 'deadline', 'personal'] as const).map(type => (
                              <button key={type} type="button" onClick={() => setNewEvent({ ...newEvent, type })} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: newEvent.type === type ? `2px solid ${eventTypeColors[type]}` : '1px solid rgba(255,255,255,0.1)', background: newEvent.type === type ? 'rgba(255,255,255,0.05)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                                {type}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowAddEvent(false)}>Cancel</button>
                            <button type="submit" className="btn-primary"><Plus size={16} /> Create</button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Events List */}
                {scheduleEvents.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '64px 24px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)', borderRadius: 'var(--r-xl)' }}>
                    <Calendar size={56} color="var(--accent-purple)" style={{ marginBottom: '20px', filter: 'drop-shadow(0 0 20px rgba(138, 115, 255, 0.4))' }} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Your Schedule is Clear</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '300px', margin: '0 auto 24px' }}>Take a breath, or start planning your next big move by adding an event.</p>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" onClick={() => setShowAddEvent(true)}>
                      <Plus size={16} /> Create First Event
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {scheduleEvents
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map(event => (
                      <motion.div key={event.id} layout className="schedule-card glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '4px', height: '40px', borderRadius: '4px', background: eventTypeColors[event.type] }} />
                        <div style={{ flex: 1 }}>
                          <strong style={{ display: 'block', fontSize: '1rem' }}>{event.title}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {event.time && `• ${event.time}`}
                          </span>
                        </div>
                        <span className={`tag`} style={{ background: `${eventTypeColors[event.type]}22`, color: eventTypeColors[event.type], textTransform: 'capitalize' }}>{event.type}</span>
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleDeleteEvent(event.id)} className="card-action-btn danger" title="Delete"><X size={16} /></motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== JOURNAL (SECOND BRAIN) ===== */}
            {activeTab === 'journal' && (
              <motion.div key="journal" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="journal-view">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Life Logger</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Your Second Brain for thoughts and ideas</p>
                  </div>
                  
                  {/* Search & Filter */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <SearchIcon size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="text" placeholder="Search ideas, #tags, [[links]]..." value={journalSearch} onChange={e => setJournalSearch(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px 8px 32px', borderRadius: '20px', outline: 'none', fontFamily: 'Inter, sans-serif', width: '250px', fontSize: '0.85rem' }} />
                      {journalSearch && <X size={14} color="var(--text-secondary)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setJournalSearch('')} />}
                    </div>
                  </div>
                </div>

                {/* Mood Heatmap (Mini) */}
                <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                  <div style={{ marginRight: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}><Filter size={14} style={{ marginRight: '4px' }}/> Filter by Mood:</div>
                  <button onClick={() => setJournalFilterMood(null)} style={{ padding: '4px 12px', borderRadius: '12px', background: journalFilterMood === null ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>All</button>
                  {['😊', '😐', '😔', '🔥', '😴', '💪'].map(mood => {
                    const count = journalEntries.filter(j => j.mood === mood).length;
                    return (
                      <button key={mood} onClick={() => setJournalFilterMood(mood)} style={{ padding: '4px 12px', borderRadius: '12px', background: journalFilterMood === mood ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {mood} <span style={{ opacity: 0.5 }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                
                {/* New Entry Form */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', borderLeft: '3px solid var(--accent-purple)' }}>
                  
                  {/* AI Prompt */}
                  {aiPromptMsg && (
                    <div style={{ background: 'rgba(139,92,246,0.1)', padding: '12px 16px', borderRadius: '8px', color: 'var(--accent-purple)', fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Wand2 size={16} style={{ marginTop: '2px' }} />
                      <span style={{ fontStyle: 'italic' }}>{aiPromptMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddJournal}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      {['😊', '😐', '😔', '🔥', '😴', '💪'].map(mood => (
                        <button key={mood} type="button" onClick={() => setSelectedMood(mood)} style={{ fontSize: '1.5rem', padding: '8px', borderRadius: '50%', background: selectedMood === mood ? 'rgba(255,255,255,0.1)' : 'transparent', border: selectedMood === mood ? '2px solid var(--accent-purple)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                          {mood}
                        </button>
                      ))}
                    </div>
                    
                    {journalImage && (
                      <div style={{ position: 'relative', marginBottom: '16px', display: 'inline-block' }}>
                        <img src={journalImage} alt="Attachment" style={{ height: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setJournalImage(null)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}><X size={12} /></button>
                      </div>
                    )}

                    <div style={{ position: 'relative' }}>
                      <textarea placeholder="Write your thoughts, use #tags or [[links]]..." value={newJournal} onChange={(e) => setNewJournal(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '16px 16px 48px 16px', borderRadius: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', resize: 'vertical', minHeight: '120px', fontSize: '0.95rem', lineHeight: 1.6 }} />
                      
                      {/* Editor Toolbar */}
                      <div style={{ position: 'absolute', bottom: '12px', left: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={generateAiPrompt} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }} title="AI Prompt">
                          <Wand2 size={16} /> Prompt
                        </motion.button>
                        
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontSize: '0.8rem' }} title="Attach Photo">
                          <ImageIcon size={16} /> Photo
                          <input type="file" accept="image/*" onChange={handleJournalImageUpload} style={{ display: 'none' }} />
                        </label>
                        
                        {voiceSupported && (
                        <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleJournalVoice} style={{ background: 'none', border: 'none', color: isJournalListening ? 'var(--accent-rose)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }} title="Voice Journal">
                          {isJournalListening ? <MicOff size={16} /> : <Mic size={16} />} {isJournalListening ? 'Listening...' : 'Voice'}
                        </motion.button>
                        )}
                      </div>

                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="btn-primary" style={{ position: 'absolute', bottom: '12px', right: '16px' }}>
                        <Save size={16} /> Save Entry
                      </motion.button>
                    </div>
                  </form>
                </div>

                {/* Journal Entries Grid/Timeline */}
                <div style={{ columnCount: 2, columnGap: '20px' }}>
                  {journalEntries
                    .filter(j => (journalFilterMood ? j.mood === journalFilterMood : true))
                    .filter(j => (journalSearch ? j.content.toLowerCase().includes(journalSearch.toLowerCase()) : true))
                    .map(entry => (
                    <motion.div key={entry.id} layout className="journal-card glass-panel" style={{ padding: '24px', marginBottom: '20px', breakInside: 'avoid', borderTop: '3px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontSize: '2rem', display: 'block', marginBottom: '4px' }}>{entry.mood}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {new Date(entry.date).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteJournal(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={14} /></button>
                      </div>
                      
                      {entry.image && (
                        <img src={entry.image} alt="Journal memory" style={{ width: '100%', borderRadius: '8px', marginBottom: '16px', objectFit: 'cover', maxHeight: '200px' }} />
                      )}

                      <p style={{ lineHeight: 1.8, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                        {renderJournalContent(entry.content)}
                      </p>
                    </motion.div>
                  ))}
                  
                  {journalEntries.length === 0 && (
                    <div className="glass-panel" style={{ padding: '64px 24px', textAlign: 'center', columnSpan: 'all', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)', borderRadius: 'var(--r-xl)' }}>
                      <StickyNote size={56} color="var(--accent-blue)" style={{ margin: '0 auto 20px', filter: 'drop-shadow(0 0 20px rgba(79, 172, 254, 0.4))' }} />
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Your Second Brain is Empty</h3>
                      <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto' }}>Start logging your daily thoughts, ideas, and memories. They will securely appear here.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ===== SETTINGS ===== */}
            {activeTab === 'settings' && (
              <motion.div key="settings" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="settings-view">
                <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Settings</h2>

                {/* Profile Section */}
                <div className="settings-section glass-panel" style={{ padding: '24px', marginBottom: '16px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-secondary)' }}><User size={18} /> Profile</h3>
                  <div className="settings-row">
                    <label>Display Name</label>
                    <input type="text" value={settings.displayName} onChange={(e) => setSettings({ ...settings, displayName: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontFamily: 'Inter, sans-serif', width: '250px' }} />
                  </div>
                </div>

                {/* AI Integration Section */}
                <div className="settings-section glass-panel" style={{ padding: '24px', marginBottom: '16px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-secondary)' }}><Bot size={18} /> AI Integration</h3>
                  <div className="settings-row">
                    <div>
                      <label>Google Gemini API Key</label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Power Aura with a real LLM for advanced Q&A and reasoning.</p>
                    </div>
                    <input type="password" placeholder="AIzaSy..." value={settings.geminiApiKey || ''} onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontFamily: 'Inter, sans-serif', width: '250px' }} />
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="settings-section glass-panel" style={{ padding: '24px', marginBottom: '16px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-secondary)' }}><Shield size={18} /> Preferences</h3>
                  {[
                    { key: 'notifications', label: 'Enable Notifications', desc: 'Get reminded about upcoming events and deadlines' },
                    { key: 'autoSave', label: 'Auto Save', desc: 'Automatically save changes as you make them' },
                    { key: 'compactMode', label: 'Compact Mode', desc: 'Reduce spacing for more content on screen' },
                  ].map(pref => (
                    <div key={pref.key} className="settings-row" style={{ justifyContent: 'space-between' }}>
                      <div>
                        <label>{pref.label}</label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{pref.desc}</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={settings[pref.key as keyof AppSettings] as boolean} onChange={(e) => setSettings({ ...settings, [pref.key]: e.target.checked })} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary" onClick={handleSaveSettings} style={{ padding: '12px 32px' }}>
                  {settingsSaved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
                </motion.button>

                {/* Theme Manager */}
                <div className="settings-section glass-panel" style={{ padding: '24px', marginTop: '16px' }}>
                  <ThemeManager currentTheme={settings.theme} onThemeChange={(theme) => setSettings({ ...settings, theme: theme as AppSettings['theme'] })} />
                </div>

                {/* App Lock */}
                <div className="settings-section glass-panel" style={{ padding: '24px', marginTop: '16px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-secondary)' }}><Lock size={18} /> App Lock</h3>
                  <div className="settings-row">
                    <div>
                      <label>Privacy Lock</label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Require PIN to access the app</p>
                    </div>
                    <button className="btn-secondary" onClick={() => {
                      localStorage.removeItem('aura_lock_enabled');
                      localStorage.removeItem('aura_lock_hash');
                      toast.success('App lock reset. Reload to set new PIN.');
                    }}>
                      <Lock size={14} /> Reset PIN
                    </button>
                  </div>
                </div>

                {/* PDF Export */}
                <div className="settings-section glass-panel" style={{ padding: '24px', marginTop: '16px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-secondary)' }}><FileText size={18} /> PDF Export</h3>
                  <div className="settings-row">
                    <div>
                      <label>Export to PDF</label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Export tasks, journal, and notes as a printable document.</p>
                    </div>
                    <button className="btn-secondary" onClick={() => {
                      const sections = [
                        { title: 'Tasks', content: [...tasks.todo, ...tasks.inProgress, ...tasks.completed].map(t => `- ${t.title} (${t.type})`).join('\n') || 'No tasks' },
                        { title: 'Journal Entries', content: journalEntries.slice(0, 10).map(j => `- [${j.mood}] ${j.content.substring(0, 100)}`).join('\n') || 'No entries' },
                        { title: 'Notes', content: notes.map(n => `## ${n.title}\n${n.content}`).join('\n\n') || 'No notes' },
                        { title: 'Finance Summary', content: `Monthly Income: Rs ${monthlyIncome}\nTotal Funds: Rs ${totalFunds}\nExpenses: ${expenses.length} entries` },
                      ];
                      exportToPDF('Aura OS Export', sections);
                    }}>
                      <Download size={14} /> Export PDF
                    </button>
                  </div>
                </div>

                {/* Data Management */}
                <div className="settings-section glass-panel" style={{ padding: '24px', marginTop: '16px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-secondary)' }}><Trash2 size={18} /> Data Management</h3>
                  <div className="settings-row">
                    <div>
                      <label>Clear All Data</label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Delete all tasks, events, journal entries, and reset settings</p>
                    </div>
                    <button className="btn-secondary" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.3)' }} onClick={() => {
                      if (confirm('Are you sure? This will delete ALL your data permanently.')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}>
                      <Trash2 size={14} /> Clear All
                    </button>
                  </div>
                  <div className="settings-row" style={{ marginTop: '16px' }}>
                    <div>
                      <label>Export / Import Backup</label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Download your data as a JSON file, or restore from a backup.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" onClick={handleExportData}>
                        <Download size={14} /> Export
                      </button>
                      <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={14} /> Import
                        <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analytics Page */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Analytics</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Your productivity at a glance</p>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  {[
                    { label: 'Total Tasks', value: tasks.todo.length + tasks.inProgress.length + tasks.completed.length, color: 'var(--accent-blue)' },
                    { label: 'Completed', value: tasks.completed.length, color: 'var(--accent-emerald)' },
                    { label: 'In Progress', value: tasks.inProgress.length, color: 'var(--accent-purple)' },
                    { label: 'Journal Entries', value: journalEntries.length, color: 'var(--accent-rose)' },
                    { label: 'Events', value: scheduleEvents.length, color: '#f59e0b' },
                  ].map(stat => (
                    <div key={stat.label} className="glass-panel" style={{ padding: '20px', textAlign: 'center', borderTop: `3px solid ${stat.color}` }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Activity Heatmap */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 size={18} /> Activity Heatmap — Last 12 Weeks</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(84, 1fr)', gap: '3px' }}>
                    {Array.from({ length: 84 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (83 - i));
                      const dateStr = d.toISOString().split('T')[0];
                      const hasJournal = journalEntries.some(j => j.date.startsWith(dateStr));
                      const hasEvent = scheduleEvents.some(e => e.date === dateStr);
                      const hasTask = tasks.completed.length > 0 && i % 3 === 0; // simulated
                      const intensity = (hasJournal ? 1 : 0) + (hasEvent ? 1 : 0) + (hasTask ? 1 : 0);
                      const colors = ['rgba(255,255,255,0.05)', 'rgba(59,130,246,0.3)', 'rgba(59,130,246,0.6)', 'rgba(59,130,246,1)'];
                      return (
                        <div key={i} title={dateStr} style={{ width: '100%', paddingBottom: '100%', borderRadius: '2px', background: colors[intensity], cursor: 'pointer', transition: 'transform 0.15s' }} />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '12px', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Less</span>
                    {['rgba(255,255,255,0.05)', 'rgba(59,130,246,0.3)', 'rgba(59,130,246,0.6)', 'rgba(59,130,246,1)'].map((c, i) => (
                      <div key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', background: c }} />
                    ))}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>More</span>
                  </div>
                </div>

                {/* Pomodoro Timer */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} /> Focus Timer (Pomodoro)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '5rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-2px', color: pomodoroRunning ? 'var(--accent-blue)' : 'var(--text-primary)', transition: 'color 0.3s' }}>
                      {String(Math.floor(pomodoroTime / 60)).padStart(2, '0')}:{String(pomodoroTime % 60).padStart(2, '0')}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" onClick={() => {
                        if (pomodoroRunning) {
                          if (pomodoroRef.current) clearInterval(pomodoroRef.current);
                          setPomodoroRunning(false);
                        } else {
                          setPomodoroRunning(true);
                          pomodoroRef.current = setInterval(() => {
                            setPomodoroTime(prev => {
                              if (prev <= 1) { if (pomodoroRef.current) clearInterval(pomodoroRef.current); setPomodoroRunning(false);
                                setPomodoroSessions(prev => [...prev, { id: Date.now().toString(), startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(), duration: 25 * 60, completed: true }]);
                                toast.success('Pomodoro session completed!');
                                return 25 * 60; }
                              return prev - 1;
                            });
                          }, 1000);
                        }
                      }}>
                        {pomodoroRunning ? '⏸ Pause' : '▶ Start Focus'}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={() => {
                        if (pomodoroRef.current) clearInterval(pomodoroRef.current);
                        setPomodoroRunning(false);
                        setPomodoroTime(25 * 60);
                      }}>
                        ↺ Reset
                      </motion.button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[5, 15, 25, 45].map(mins => (
                        <button key={mins} onClick={() => { if (pomodoroRef.current) clearInterval(pomodoroRef.current); setPomodoroRunning(false); setPomodoroTime(mins * 60); }} style={{ padding: '6px 14px', borderRadius: '20px', border: pomodoroTime === mins * 60 ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.1)', background: pomodoroTime === mins * 60 ? 'rgba(59,130,246,0.15)' : 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pomodoro Stats */}
                <div style={{ marginTop: '24px' }}>
                  <PomodoroStats sessions={pomodoroSessions} />
                </div>
              </motion.div>
            )}

            {/* ===== HABITS ===== */}
            {activeTab === 'habits' && (
              <motion.div key="habits" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} style={{ padding: '32px' }}>
                <HabitsTracker
                  habits={habits}
                  onToggle={(habitId, date) => {
                    setHabits(prev => prev.map(h => {
                      if (h.id !== habitId) return h;
                      const completed = h.completedDates.includes(date);
                      return { ...h, completedDates: completed ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date] };
                    }));
                  }}
                  onAdd={(name, icon) => setHabits(prev => [...prev, { id: Date.now().toString(), name, icon, completedDates: [] }])}
                  onDelete={(habitId) => setHabits(prev => prev.filter(h => h.id !== habitId))}
                />
              </motion.div>
            )}

            {/* ===== NOTES ===== */}
            {activeTab === 'notes' && (
              <motion.div key="notes" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} style={{ padding: '32px', height: '100%' }}>
                <QuickNotes notes={notes} onSave={setNotes} />
              </motion.div>
            )}

            {/* Finance Page */}
            {activeTab === 'finance' && (
              <motion.div key="finance" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}
                className="finance-view">

                {/* ── HEADER ── */}
                <div className="finance-header-row">
                  <h2 className="finance-page-title">Finance</h2>
                  <div className="finance-meta">
                    <div className="finance-meta-user">
                      <div className="finance-meta-name">{settings.displayName}</div>
                      <div className="finance-meta-date">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1.5px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(212,175,55,0.3)' }}>
                      <Shield size={18} color="var(--accent)" />
                    </div>
                  </div>
                </div>

                {/* ── HERO BALANCE CARD (gold gradient like image) ── */}
                {(() => {
                  const currentMonthStr = new Date().toISOString().substring(0, 7);
                  const monthlyRecurring = expenses.filter(e => e.recurring).reduce((s, e) => s + e.amount, 0);
                  const thisMonthOneTime = expenses.filter(e => !e.recurring && e.date.startsWith(currentMonthStr)).reduce((s, e) => s + e.amount, 0);
                  const totalExpense = monthlyRecurring + thisMonthOneTime;
                  const totalAvailablePool = totalFunds + monthlyIncome;
                  const netRemainingBalance = totalAvailablePool - totalExpense;
                  const spentPercent = totalAvailablePool > 0 ? Math.min(100, Math.round((totalExpense / totalAvailablePool) * 100)) : 0;
                  const remainingPercent = Math.max(0, 100 - spentPercent);

                  return (
                    <>
                      {/* Gold hero card */}
                      <div className="finance-hero-card">
                        <div>
                          <div className="finance-hero-label">Total Wallet Funds</div>
                          <div className="finance-hero-amount">
                            <span>Rs</span>
                            <input
                              type="number"
                              value={totalFunds || ''}
                              onChange={(e) => setTotalFunds(Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                          <div className="finance-hero-sub">Available Balance</div>
                          <div className="finance-hero-balance">Rs {netRemainingBalance.toLocaleString('en-PK')}</div>
                        </div>
                        {/* Circular ring — remaining % */}
                        <div className="finance-ring-wrap">
                          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="3.5" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeDasharray={`${remainingPercent}, 100`} strokeLinecap="round" />
                          </svg>
                          <div className="finance-ring-label">
                            {remainingPercent}%
                            <span>Remaining</span>
                          </div>
                        </div>
                      </div>

                      {/* 2-col Income + Spent cards */}
                      <div className="finance-stats-row">
                        {/* Monthly Income */}
                        <div className="finance-stat">
                          <div className="finance-stat-header">
                            <span className="finance-stat-label">Monthly Income</span>
                            <div className="finance-stat-icon">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                            </div>
                          </div>
                          <div className="finance-stat-value">
                            <span className="finance-stat-prefix">Rs</span>
                            <input
                              type="number"
                              value={monthlyIncome || ''}
                              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                              placeholder="0"
                              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', fontVariantNumeric: 'tabular-nums', width: '120px', padding: 0, fontFamily: 'inherit' }}
                            />
                          </div>
                          <div className="finance-stat-footer">
                            <span className="finance-trend-up">↑ Monthly Budget</span>
                          </div>
                        </div>

                        {/* Total Spent */}
                        <div className="finance-stat">
                          <div className="finance-stat-header">
                            <span className="finance-stat-label">Total Spent</span>
                            <div className="finance-ring-wrap">
                              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--surface-3)" strokeWidth="3.5" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--negative)" strokeWidth="3.5" strokeDasharray={`${spentPercent}, 100`} strokeLinecap="round" />
                              </svg>
                              <div className="finance-ring-label" style={{ color: 'var(--negative)' }}>{spentPercent}%</div>
                            </div>
                          </div>
                          <div className="finance-stat-value" style={{ color: 'var(--negative)' }}>
                            <span className="finance-stat-prefix" style={{ color: 'var(--negative)' }}>Rs</span>
                            {totalExpense.toLocaleString()}
                          </div>
                          <div className="finance-stat-footer">
                            <span className="finance-trend-down">↑ {spentPercent}% from last month</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* ── TWO PANELS ── */}
                <div className="finance-panels-row">

                  {/* LEFT — Savings Goals */}
                  <div className="finance-panel">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h3 className="finance-panel-title" style={{ margin: 0 }}>Savings Goals</h3>
                      {savingsGoals.length > 0 && (
                        <button className="btn-primary" onClick={() => setShowAddGoal(true)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <Plus size={13} /> New Goal
                        </button>
                      )}
                    </div>

                    {savingsGoals.length === 0 ? (
                      <div className="finance-empty">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="64" height="64" rx="16" fill="var(--surface-2)"/>
                          <path d="M44 32C44 38.627 38.627 44 32 44C25.373 44 20 38.627 20 32C20 25.373 25.373 20 32 20" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M38 20L44 20L44 26" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M44 20L36 28" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="32" cy="32" r="3" fill="var(--text-3)"/>
                        </svg>
                        <div className="finance-empty-text">
                          <h4>No savings goals yet</h4>
                          <p>Set a target to start tracking your progress</p>
                        </div>
                        <button className="finance-btn-primary" onClick={() => setShowAddGoal(true)}>
                          <Plus size={14} /> New Goal
                        </button>
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '10px' }}>
                        {savingsGoals.map(goal => {
                          const progress = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
                          return (
                            <div key={goal.id} className="goal-item">
                              <div className="goal-item-header">
                                <div>
                                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '2px' }}>{goal.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                                    Rs {goal.savedAmount.toLocaleString()} / Rs {goal.targetAmount.toLocaleString()}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: goal.color }}>{progress}%</span>
                                  <button onClick={() => setShowAddFunds(goal.id)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }}>Add</button>
                                  <button onClick={() => setSavingsGoals(prev => prev.filter(g => g.id !== goal.id))} className="btn-ghost" style={{ padding: '4px', color: 'var(--text-3)' }}><X size={12} /></button>
                                </div>
                              </div>
                              <div className="goal-progress-track">
                                <div className="goal-progress-fill" style={{ width: `${progress}%`, background: goal.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* RIGHT — Expenses */}
                  <div className="finance-panel">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div>
                        <h3 className="finance-panel-title" style={{ margin: 0 }}>Expenses</h3>
                        {expenses.length > 0 && (
                          <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{expenses.length} transaction{expenses.length > 1 ? 's' : ''} this month</p>
                        )}
                      </div>
                      {expenses.length > 0 && (
                        <button className="btn-secondary" onClick={() => { setEditExpenseId(null); setNewExpense({ name: '', amount: '', category: 'other', recurring: false }); setShowAddExpense(true); }} style={{ fontSize: '12px', padding: '6px 12px' }}>
                          <Plus size={13} /> Add
                        </button>
                      )}
                    </div>

                    {expenses.length === 0 ? (
                      <div className="finance-empty">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="64" height="64" rx="16" fill="var(--surface-2)"/>
                          <rect x="18" y="22" width="28" height="20" rx="4" stroke="var(--text-3)" strokeWidth="2"/>
                          <path d="M18 29H46" stroke="var(--text-3)" strokeWidth="2"/>
                          <path d="M24 35H28" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M24 39H32" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <div className="finance-empty-text">
                          <h4>No expenses yet</h4>
                          <p>Track your spending to see where your money goes</p>
                        </div>
                        <button className="finance-btn-secondary" onClick={() => { setEditExpenseId(null); setNewExpense({ name: '', amount: '', category: 'other', recurring: false }); setShowAddExpense(true); }}>
                          <Plus size={14} /> Add Expense
                        </button>
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div className="expense-table-header">
                          <span>Name</span><span>Category</span><span>Date</span><span>Amount</span>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                          {expenses.map(exp => (
                            <motion.div key={exp.id} className="expense-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span className="expense-name">{exp.name}</span>
                                {exp.recurring && <span className="recurring-badge">↻ recurring</span>}
                              </div>
                              <span className={`cat-badge cat-${exp.category}`}>{exp.category}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{exp.date}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="expense-amount">Rs {exp.amount.toLocaleString()}</span>
                                <button onClick={() => { setEditExpenseId(exp.id); setNewExpense({ name: exp.name, amount: exp.amount.toString(), category: exp.category, recurring: exp.recurring }); setShowAddExpense(true); }} className="btn-ghost" style={{ padding: '3px 5px' }}><Edit2 size={12} /></button>
                                <button onClick={() => setExpenses(prev => prev.filter(e => e.id !== exp.id))} className="btn-ghost" style={{ padding: '3px 5px', color: 'var(--text-3)' }}><X size={12} /></button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <button className="btn-secondary" onClick={() => { setEditExpenseId(null); setNewExpense({ name: '', amount: '', category: 'other', recurring: false }); setShowAddExpense(true); }} style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
                          <Plus size={14} /> Add Expense
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Funds Modal */}
                <AnimatePresence>
                  {showAddFunds && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAddFunds(null); setAddFundsAmount(''); }}>
                      <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>Add Funds to Goal</h3>
                        <form onSubmit={e => {
                          e.preventDefault();
                          if (!addFundsAmount) return;
                          const addAmt = parseFloat(addFundsAmount);
                          setSavingsGoals(prev => prev.map(g => g.id === showAddFunds ? { ...g, savedAmount: g.savedAmount + addAmt } : g));
                          setTotalFunds(prev => Math.max(0, prev - addAmt));
                          setAddFundsAmount('');
                          setShowAddFunds(null);
                          toast.success(`Rs ${addAmt} added to Goal Vault!`);
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <input className="form-input" type="number" placeholder="Amount to add (Rs)" value={addFundsAmount} onChange={e => setAddFundsAmount(e.target.value)} required />
                          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <motion.button type="submit" whileTap={{ scale: 0.95 }} className="btn-primary" style={{ flex: 1 }}>Add Funds</motion.button>
                            <button type="button" className="btn-secondary" onClick={() => { setShowAddFunds(null); setAddFundsAmount(''); }} style={{ flex: 1 }}>Cancel</button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* New Bank Goal / Vault Modal */}
                <AnimatePresence>
                  {showAddGoal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddGoal(false)}>
                      <motion.div className="modal-content glass-panel" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%', padding: '24px', border: '1px solid var(--accent-subtle)', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Wallet size={20} color="var(--accent)" /> Create Bank Goal / Vault
                          </h3>
                          <button onClick={() => setShowAddGoal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={e => {
                          e.preventDefault();
                          if (!newGoal.name || !newGoal.targetAmount) return;
                          const goalName = newGoal.name;
                          const target = parseFloat(newGoal.targetAmount);
                          setSavingsGoals(prev => [...prev, { id: Date.now().toString(), name: goalName, targetAmount: target, savedAmount: 0, color: newGoal.color }]);
                          setNewGoal({ name: '', targetAmount: '', color: '#3b82f6' });
                          setShowAddGoal(false);
                          toast.success(`Vault Goal Created: "${goalName}"`);
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Goal Name</label>
                            <input className="form-input" placeholder="e.g. New Laptop, Emergency Fund, Car" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} required style={{ width: '100%' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Target Amount (Rs)</label>
                            <input className="form-input" type="number" placeholder="50000" value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} required style={{ width: '100%' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Accent Theme Color</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              {['#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#f59e0b', '#D4AF37'].map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setNewGoal({ ...newGoal, color: c })}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: c,
                                    border: newGoal.color === c ? '3px solid white' : 'none',
                                    cursor: 'pointer'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <motion.button type="submit" whileTap={{ scale: 0.95 }} className="btn-primary" style={{ flex: 1 }}>Create Vault Goal</motion.button>
                            <button type="button" className="btn-secondary" onClick={() => setShowAddGoal(false)} style={{ flex: 1 }}>Cancel</button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add / Edit Expense Modal */}
                <AnimatePresence>
                  {showAddExpense && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddExpense(false)}>
                      <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>{editExpenseId ? 'Edit Expense' : 'Add Expense'}</h3>
                        <form onSubmit={e => {
                          e.preventDefault();
                          if (!newExpense.name || !newExpense.amount) return;
                          
                          if (editExpenseId) {
                            setExpenses(prev => prev.map(exp => exp.id === editExpenseId ? { ...exp, name: newExpense.name, amount: parseFloat(newExpense.amount), category: newExpense.category, recurring: newExpense.recurring } : exp));
                          } else {
                            const amt = parseFloat(newExpense.amount);
                            setExpenses(prev => [...prev, { id: Date.now().toString(), name: newExpense.name, amount: amt, category: newExpense.category, date: new Date().toISOString().split('T')[0], recurring: newExpense.recurring }]);
                            setTotalFunds(prev => Math.max(0, prev - amt));
                          }
                          
                          setNewExpense({ name: '', amount: '', category: 'other', recurring: false });
                          setEditExpenseId(null);
                          setShowAddExpense(false);
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <input className="form-input" placeholder="Expense name (e.g. Netflix, Groceries)" value={newExpense.name} onChange={e => setNewExpense({ ...newExpense, name: e.target.value })} required />
                          <input className="form-input" type="number" placeholder="Amount (Rs)" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} required />
                          <select className="form-input" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value as Expense['category'] })}>
                            {['food', 'transport', 'subscription', 'health', 'entertainment', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                          </select>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <input type="checkbox" checked={newExpense.recurring} onChange={e => setNewExpense({ ...newExpense, recurring: e.target.checked })} />
                            Recurring monthly
                          </label>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <motion.button type="submit" whileTap={{ scale: 0.95 }} className="btn-primary" style={{ flex: 1 }}>{editExpenseId ? 'Save Changes' : 'Add'}</motion.button>
                            <button type="button" className="btn-secondary" onClick={() => { setShowAddExpense(false); setEditExpenseId(null); }} style={{ flex: 1 }}>Cancel</button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expense Charts */}
                <div style={{ marginTop: '24px' }}>
                  <ExpenseCharts expenses={expenses} monthlyIncome={monthlyIncome} />
                </div>

                {/* Recurring Tracker */}
                <div style={{ marginTop: '24px' }}>
                  <RecurringTracker expenses={expenses} onMarkPaid={(expenseId) => {
                    setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, date: new Date().toISOString().split('T')[0] } : e));
                    toast.success('Recurring expense marked as paid!');
                  }} />
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
      {/* Selected Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedTask(null); setSelectedTaskColumn(null); }}>
            <motion.div className="modal-content glass-panel" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%', padding: '28px', border: '1px solid var(--accent-subtle)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Idea / Task</h3>
                <button onClick={() => { setSelectedTask(null); setSelectedTaskColumn(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Title Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Title</label>
                <input className="form-input" value={selectedTask.title} onChange={e => handleUpdateTaskDetails({ ...selectedTask, title: e.target.value })} style={{ width: '100%' }} />
              </div>

              {/* Priority Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Priority</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => handleUpdateTaskDetails({ ...selectedTask, priority: p })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: selectedTask.priority === p ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                        background: selectedTask.priority === p ? 'var(--accent-subtle)' : 'transparent',
                        color: selectedTask.priority === p ? 'var(--accent)' : 'var(--text-secondary)',
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description / Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Description / Notes</label>
                <textarea
                  className="form-input"
                  placeholder="Add details, links, or context..."
                  value={selectedTask.description || ''}
                  onChange={e => handleUpdateTaskDetails({ ...selectedTask, description: e.target.value })}
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              {/* Checklist / Subtasks */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Checklist</label>
                
                {/* Subtask list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '12px' }}>
                  {selectedTask.subtasks?.map(sub => (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={e => {
                          const updatedSubtasks = selectedTask.subtasks?.map(s => s.id === sub.id ? { ...s, completed: e.target.checked } : s) || [];
                          handleUpdateTaskDetails({ ...selectedTask, subtasks: updatedSubtasks });
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1, textDecoration: sub.completed ? 'line-through' : 'none', color: sub.completed ? 'var(--text-3)' : 'var(--text-1)', fontSize: '0.9rem' }}>
                        {sub.title}
                      </span>
                      <button
                        onClick={() => {
                          const updatedSubtasks = selectedTask.subtasks?.filter(s => s.id !== sub.id) || [];
                          handleUpdateTaskDetails({ ...selectedTask, subtasks: updatedSubtasks });
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask form */}
                <form onSubmit={e => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem('subtaskTitle') as HTMLInputElement;
                  const newTitle = input.value.trim();
                  if (!newTitle) return;
                  const newSub: SubTask = { id: Date.now().toString(), title: newTitle, completed: false };
                  const updatedSubtasks = [...(selectedTask.subtasks || []), newSub];
                  handleUpdateTaskDetails({ ...selectedTask, subtasks: updatedSubtasks });
                  form.reset();
                }} style={{ display: 'flex', gap: '8px' }}>
                  <input name="subtaskTitle" className="form-input" placeholder="Add checklist item..." style={{ flex: 1, padding: '8px 12px' }} />
                  <button type="submit" className="btn-secondary" style={{ padding: '8px 12px' }}><Plus size={16} /></button>
                </form>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" onClick={() => { setSelectedTask(null); setSelectedTaskColumn(null); }} style={{ flex: 1 }}>
                  Done
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-Dots Pipeline Change Bottom Sheet */}
      <AnimatePresence>
        {menuTask && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setMenuTask(null)}
          >
            <motion.div 
              className="modal-content glass-panel" 
              initial={{ scale: 0.95, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 30 }} 
              onClick={e => e.stopPropagation()} 
              style={{ maxWidth: '420px', width: '100%', padding: '24px', borderRadius: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Change Pipeline</span>
                  <h3 style={{ fontSize: '1.1rem', marginTop: '2px' }}>{menuTask.task.title}</h3>
                </div>
                <button onClick={() => setMenuTask(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                {[
                  { col: 'todo', label: 'Move to New Ideas', icon: <Lightbulb size={18} color="var(--accent-blue)" />, desc: 'Add to Backlog / Todo' },
                  { col: 'inProgress', label: 'Move to In Progress', icon: <Clock size={18} color="var(--accent-purple)" />, desc: 'Currently working on this' },
                  { col: 'completed', label: 'Move to Completed', icon: <CheckCircle2 size={18} color="var(--accent-emerald)" />, desc: 'Finished & Done' },
                  { col: 'deleted', label: 'Move to Trash', icon: <Trash2 size={18} color="var(--accent-rose)" />, desc: 'Archive or remove' },
                ].map(target => (
                  <button
                    key={target.col}
                    disabled={menuTask.fromCol === target.col}
                    onClick={() => {
                      const from = menuTask.fromCol;
                      const to = target.col as keyof TaskColumns;
                      setTasks(prev => {
                        const filtered = prev[from].filter(t => t.id !== menuTask.task.id);
                        const updated = {
                          ...menuTask.task,
                          type: to === 'todo' ? 'Idea' : to === 'inProgress' ? 'Active' : to === 'completed' ? 'Done' : 'Deleted',
                          color: to === 'todo' ? 'blue' : to === 'inProgress' ? 'purple' : to === 'completed' ? 'green' : 'red'
                        };
                        return {
                          ...prev,
                          [from]: filtered,
                          [to]: [updated, ...prev[to]]
                        };
                      });
                      toast.success(`Moved to ${target.label.replace('Move to ', '')}`);
                      setMenuTask(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: menuTask.fromCol === target.col ? '1px solid var(--accent-subtle)' : '1px solid var(--border-md)',
                      background: menuTask.fromCol === target.col ? 'rgba(255,255,255,0.03)' : 'var(--surface-2)',
                      color: menuTask.fromCol === target.col ? 'var(--text-3)' : 'var(--text-1)',
                      cursor: menuTask.fromCol === target.col ? 'default' : 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      opacity: menuTask.fromCol === target.col ? 0.5 : 1
                    }}
                  >
                    {target.icon}
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>{target.label} {menuTask.fromCol === target.col && '(Current)'}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{target.desc}</span>
                    </div>
                    {menuTask.fromCol !== target.col && <ArrowRight size={16} color="var(--text-3)" />}
                  </button>
                ))}

                <button
                  onClick={() => {
                    const task = menuTask.task;
                    const col = menuTask.fromCol;
                    setMenuTask(null);
                    setSelectedTask(task);
                    setSelectedTaskColumn(col);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-md)',
                    background: 'transparent',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    marginTop: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <Edit2 size={16} /> Edit Details & Checklist
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster theme="dark" richColors position="bottom-right" />
    </div>
    </>
  );
}

export default App;
