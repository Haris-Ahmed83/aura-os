import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Plus, Trash2, ArrowLeft, Pin, PinOff, FileText } from 'lucide-react';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  pinned: boolean;
}

interface QuickNotesProps {
  notes: Note[];
  onSave: (notes: Note[]) => void;
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;color:var(--text-1);margin:8px 0 4px;font-family:Outfit,sans-serif;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;color:var(--text-1);margin:10px 0 6px;font-family:Outfit,sans-serif;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:800;color:var(--text-1);margin:12px 0 8px;font-family:Outfit,sans-serif;">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-1);font-weight:600;">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em style="color:var(--text-2);font-style:italic;">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:12.5px;font-family:monospace;color:var(--accent);">$1</code>');

  html = html.replace(/^(\s*)- (.+)$/gm, '$1<li style="margin:2px 0;color:var(--text-2);">$2</li>');

  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    return `<ul style="padding-left:20px;margin:4px 0;list-style:disc;">${match}</ul>`;
  });

  html = html.replace(/\n/g, '<br/>');

  return html;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const QuickNotes: React.FC<QuickNotesProps> = ({ notes: initialNotes, onSave }) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showingEditor, setShowingEditor] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesRef = useRef(notes);

  notesRef.current = notes;

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const debouncedSave = useCallback((updated: Note[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSave(updated);
    }, 1000);
  }, [onSave]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes]);

  const selectedNote = sortedNotes.find((n) => n.id === selectedId) || null;

  const createNote = () => {
    const newNote: Note = {
      id: generateId(),
      title: 'Untitled Note',
      content: '',
      updatedAt: new Date().toISOString(),
      pinned: false,
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setSelectedId(newNote.id);
    debouncedSave(updated);
    if (isMobileView) setShowingEditor(true);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (selectedId === id) {
      setSelectedId(null);
      if (isMobileView) setShowingEditor(false);
    }
    debouncedSave(updated);
  };

  const togglePin = (id: string) => {
    const updated = notes.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n);
    setNotes(updated);
    debouncedSave(updated);
  };

  const updateNote = (id: string, field: 'title' | 'content', value: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, [field]: value, updatedAt: new Date().toISOString() } : n
    );
    setNotes(updated);
    debouncedSave(updated);
  };

  const selectNote = (id: string) => {
    setSelectedId(id);
    if (isMobileView) setShowingEditor(true);
  };

  const goBack = () => {
    setShowingEditor(false);
  };

  const listPanel = (
    <div style={{
      width: isMobileView ? '100%' : '280px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: isMobileView ? 'none' : '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--text-1)' }}>
          Notes
        </span>
        <button
          onClick={createNote}
          style={{
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#000',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <Plus size={14} /> New
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {sortedNotes.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '40px 16px', color: 'var(--text-3)',
            fontSize: '13px', textAlign: 'center', gap: '8px',
          }}>
            <FileText size={32} style={{ opacity: 0.3 }} />
            <span>No notes yet</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => selectNote(note.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: selectedId === note.id ? 'var(--accent-subtle)' : 'transparent',
                  border: selectedId === note.id ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {note.pinned && <Pin size={10} color="var(--accent)" style={{ flexShrink: 0 }} />}
                  <span style={{
                    fontSize: '13px', fontWeight: 600,
                    color: selectedId === note.id ? 'var(--accent)' : 'var(--text-1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {note.title || 'Untitled'}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.content ? note.content.substring(0, 60).replace(/[#*\-\`]/g, '') : 'Empty note'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', opacity: 0.6 }}>
                  {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const editorPanel = (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {!selectedNote ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--text-3)',
        }}>
          <FileText size={40} style={{ opacity: 0.2 }} />
          <span style={{ fontSize: '14px' }}>Select a note or create a new one</span>
        </div>
      ) : (
        <>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {isMobileView && (
              <button
                onClick={goBack}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-2)',
                  cursor: 'pointer', padding: '4px', display: 'flex',
                  alignItems: 'center', borderRadius: '6px',
                }}
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <input
              value={selectedNote.title}
              onChange={(e) => updateNote(selectedNote.id, 'title', e.target.value)}
              placeholder="Note title..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-1)',
              }}
            />

            <button
              onClick={() => togglePin(selectedNote.id)}
              title={selectedNote.pinned ? 'Unpin' : 'Pin'}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: selectedNote.pinned ? 'var(--accent)' : 'var(--text-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedNote.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>

            <button
              onClick={() => deleteNote(selectedNote.id)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: 'var(--text-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <textarea
              value={selectedNote.content}
              onChange={(e) => updateNote(selectedNote.id, 'content', e.target.value)}
              placeholder="Write in markdown...&#10;&#10;# Heading&#10;**bold** and *italic*&#10;- list item&#10;`code`"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: '16px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13.5px',
                lineHeight: '1.7',
                color: 'var(--text-1)',
                minWidth: 0,
              }}
            />

            <div style={{
              flex: 1,
              borderLeft: '1px solid var(--border)',
              padding: '16px',
              overflowY: 'auto',
              fontSize: '13.5px',
              lineHeight: '1.7',
              color: 'var(--text-2)',
              minWidth: 0,
            }}>
              {selectedNote.content ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.content) }} />
              ) : (
                <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: '13px' }}>
                  Preview will appear here...
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      minHeight: '500px',
    }}>
      {isMobileView ? (
        showingEditor ? editorPanel : listPanel
      ) : (
        <>
          {listPanel}
          {editorPanel}
        </>
      )}
    </div>
  );
};

export default QuickNotes;
