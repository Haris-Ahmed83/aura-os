import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { server } from './msw/node';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  localStorage.clear();
});
afterAll(() => server.close());

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    lang: 'en-US',
    interimResults: false,
    maxAlternatives: 1,
    continuous: false,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    onstart: null,
    onend: null,
    onresult: null,
    onerror: null,
  })),
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: window.SpeechRecognition,
});

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mock');

vi.mock('gapi-script', () => ({
  gapi: {
    load: vi.fn((_, callback) => callback?.()),
    client: {
      init: vi.fn(),
      setToken: vi.fn(),
      load: vi.fn(),
      calendar: {
        events: {
          list: vi.fn(),
          insert: vi.fn(),
        },
      },
      gmail: {
        users: {
          messages: {
            list: vi.fn(),
            get: vi.fn(),
          },
        },
      },
    },
    auth2: {
      getAuthInstance: vi.fn(() => ({
        signIn: vi.fn(),
        signOut: vi.fn(),
        currentUser: { get: () => ({ getAuthResponse: () => ({ access_token: 'mock-token' }) }) },
        isSignedIn: { get: () => true },
      })),
    },
  },
}));

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useGoogleLogin: () => ({
    onSuccess: vi.fn(),
    onError: vi.fn(),
  }),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      startChat: vi.fn().mockReturnValue({
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: vi.fn().mockReturnValue('Mock AI response'),
            functionCalls: vi.fn().mockReturnValue([]),
          },
        }),
      }),
    }),
  })),
  SchemaType: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
  },
}));

class MockDragDropContext {
  static droppableId = '';
  static index = 0;
}

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => children,
  Droppable: ({ children }: { children: (provided: any) => React.ReactNode }) =>
    children({
      droppableProps: {},
      innerRef: vi.fn(),
      placeholder: null,
    }),
  Draggable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) =>
    children(
      {
        draggableProps: { style: {}, onDragStart: vi.fn(), onDragEnd: vi.fn() },
        dragHandleProps: { onClick: vi.fn() },
        innerRef: vi.fn(),
      },
      { isDragging: false }
    ),
  DropResult: {} as any,
}));

window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
    args[0]?.includes?.('act(...)')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};