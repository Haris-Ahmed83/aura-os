export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  type: string;
  color: string;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
  subtasks?: SubTask[];
}

export interface TaskColumns {
  todo: Task[];
  inProgress: Task[];
  completed: Task[];
  deleted: Task[];
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'reminder' | 'deadline' | 'personal';
}

export interface JournalEntry {
  id: string;
  content: string;
  date: string;
  mood: string;
  image?: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: 'food' | 'transport' | 'subscription' | 'health' | 'entertainment' | 'other';
  date: string;
  recurring: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  color: string;
}

export interface AppSettings {
  displayName: string;
  theme: 'dark' | 'midnight' | 'ocean';
  notifications: boolean;
  autoSave: boolean;
  compactMode: boolean;
  geminiApiKey: string;
}

export type DropResult = import('@hello-pangea/dnd').DropResult;