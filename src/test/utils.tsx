import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GoogleOAuthProvider clientId="test-client-id">
    {children}
  </GoogleOAuthProvider>
);

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providers?: React.ReactNode;
}

function customRender(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { providers, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders>
      {providers}
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { customRender as render };

export const mockLocalStorage = (initialData: Record<string, string> = {}) => {
  const store = { ...initialData };
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    store,
  };
};

export const createMockTask = (overrides: Partial<{
  id: string;
  title: string;
  type: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
}> = {}) => ({
  id: 'task-1',
  title: 'Test Task',
  type: 'Idea',
  color: 'blue',
  priority: 'medium',
  description: '',
  subtasks: [],
  ...overrides,
});

export const createMockExpense = (overrides: Partial<{
  id: string;
  name: string;
  amount: number;
  category: 'food' | 'transport' | 'subscription' | 'health' | 'entertainment' | 'other';
  date: string;
  recurring: boolean;
}> = {}) => ({
  id: 'expense-1',
  name: 'Test Expense',
  amount: 100,
  category: 'food' as const,
  date: new Date().toISOString().split('T')[0],
  recurring: false,
  ...overrides,
});

export const createMockJournalEntry = (overrides: Partial<{
  id: string;
  content: string;
  date: string;
  mood: string;
  image: string;
}> = {}) => ({
  id: 'journal-1',
  content: 'Test journal entry',
  date: new Date().toISOString(),
  mood: '😊',
  ...overrides,
});

export const createMockScheduleEvent = (overrides: Partial<{
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'reminder' | 'deadline' | 'personal';
}> = {}) => ({
  id: 'event-1',
  title: 'Test Event',
  date: new Date().toISOString().split('T')[0],
  time: '10:00',
  type: 'reminder' as const,
  ...overrides,
});

export const createMockSavingsGoal = (overrides: Partial<{
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  color: string;
}> = {}) => ({
  id: 'goal-1',
  name: 'Test Goal',
  targetAmount: 1000,
  savedAmount: 100,
  color: '#3b82f6',
  ...overrides,
});

export const waitFor = (callback: () => void | Promise<void>, options?: { timeout?: number; interval?: number }) => {
  const { timeout = 1000, interval = 50 } = options || {};
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      try {
        callback();
        resolve();
      } catch (e) {
        if (Date.now() - start > timeout) {
          reject(e);
        } else {
          setTimeout(check, interval);
        }
      }
    };
    check();
  });
};