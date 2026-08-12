import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import GraphCanvas from '../components/Graph/GraphCanvas';
import NoteEditor from '../components/Editor/NoteEditor';
import AskAI from '../components/AI/AskAI';

export default function Home() {
  const { user, logout } = useAuth();

  // Graph data
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);

  // Notes list
  const [notes, setNotes] = useState([]);

  // Active note (selected from graph or list)
  const [activeNote, setActiveNote] = useState(null);

  // New note form
  const [showNewNote, setShowNewNote] = useState(false);
  const [newTitle,    setNewTitle]    = useState('');
  const [newContent,  setNewContent]  = useState({ html: '', text: '' });
  const [saving,      setSaving]      = useState(false);

  // Search
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);

  // Panel view: 'graph' | 'note' | 'ai'
  const [rightPanel, setRightPanel] = useState('graph');

  // Load graph + notes
  const loadGraph = useCallback(async () => {
    const [graphRes, notesRes] = await Promise.all([
      api.get('/graph'),
      api.get('/notes'),
    ]);
    setGraphNodes(graphRes.data.nodes);
    setGraphEdges(graphRes.data.edges);
    setNotes(notesRes.data);
  }, []);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  // Socket.io live updates
  useEffect(() => {
    if (!user) return;
    const socket = io('http://localhost:8000');
    socket.emit('join_user', { user_id: user.id });
    socket.on('graph_updated', () => loadGraph());
    return () => socket.disconnect();
  }, [user, loadGraph]);

  // Node click → open note
  const handleNodeClick = useCallback(async (nodeId) => {
    const note = notes.find(n => n.id === nodeId);
    if (note) {
      setActiveNote(note);
      setRightPanel('note');
    }
  }, [notes]);

  // Create note
  const handleCreateNote = async () => {
    if (!newTitle.trim() || !newContent.text.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/notes', {
        title:        newTitle,
        content:      newContent.text,
        html_content: newContent.html,
      });
      setNotes(prev => [res.data, ...prev]);
      setNewTitle('');
      setNewContent({ html: '', text: '' });
      setShowNewNote(false);
      await loadGraph();
    } finally {
      setSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    await api.delete(`/notes/${noteId}`);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (activeNote?.id === noteId) { setActiveNote(null); setRightPanel('graph'); }
    await loadGraph();
  };

  // Semantic search
  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.post('/ai/search', { query: searchQuery });
      setSearchResults(res.data.results);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={s.root}>
      {/* ── SIDEBAR ───────────────────────────────────── */}
      <aside style={s.sidebar}>

        {/* Logo + user */}
        <div style={s.sideTop}>
          <div style={s.logo}>🌿 Arbor</div>
          <div style={s.userRow}>
            <span style={s.userName}>{user?.name}</span>
            <button style={s.logoutBtn} onClick={logout}>Out</button>
          </div>
        </div>

        {/* Search */}
        <div style={s.searchRow}>
          <input style={s.searchInput} placeholder="Semantic search..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <button style={s.searchBtn} onClick={handleSearch}>
            {searching ? '...' : '🔍'}
          </button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div style={s.searchResults}>
            <div style={s.sectionLabel}>Search Results</div>
            {searchResults.map(r => (
              <div key={r.id} style={s.searchItem}
                onClick={() => { handleNodeClick(r.id); setSearchResults([]); setSearchQuery(''); }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3' }}>{r.title}</div>
                <div style={{ fontSize: 11, color: '#7d8590' }}>{Math.round(r.similarity * 100)}% match</div>
              </div>
            ))}
            <button style={s.clearSearch} onClick={() => setSearchResults([])}>Clear</button>
          </div>
        )}

        {/* New note button */}
        <button style={s.newNoteBtn} onClick={() => setShowNewNote(v => !v)}>
          {showNewNote ? '✕ Cancel' : '+ New Note'}
        </button>

        {/* New note form */}
        {showNewNote && (
          <div style={s.newNoteForm}>
            <input style={s.titleInput} placeholder="Note title..."
              value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <NoteEditor content={newContent.html}
              onChange={c => setNewContent(c)} />
            <button style={s.saveBtn} onClick={handleCreateNote} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Note'}
            </button>
          </div>
        )}

        {/* Notes list */}
        <div style={s.sectionLabel}>All Notes ({notes.length})</div>
        <div style={s.notesList}>
          {notes.map(note => (
            <div key={note.id}
              style={{ ...s.noteItem, ...(activeNote?.id === note.id ? s.noteActive : {}) }}
              onClick={() => { setActiveNote(note); setRightPanel('note'); }}>
              <div style={s.noteItemTitle}>{note.title}</div>
              <div style={s.noteItemPreview}>{note.content?.slice(0, 60)}...</div>
              <div style={s.noteItemMeta}>
                {note.has_embedding ? '🔗 Linked' : '⏳ Linking...'}
                <button style={s.deleteBtn}
                  onClick={e => { e.stopPropagation(); handleDeleteNote(note.id); }}>🗑</button>
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <p style={{ color: '#7d8590', fontSize: 12, padding: '12px 0' }}>
              No notes yet. Create your first note!
            </p>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────── */}
      <main style={s.main}>

        {/* Top bar */}
        <div style={s.topBar}>
          <div style={s.tabs}>
            {[
              { id: 'graph', label: '🕸️ Graph' },
              { id: 'note',  label: '📝 Note',  disabled: !activeNote },
              { id: 'ai',    label: '✨ AI',     disabled: !activeNote },
            ].map(tab => (
              <button key={tab.id}
                style={{ ...s.tabBtn, ...(rightPanel === tab.id ? s.tabActive : {}), ...(tab.disabled ? s.tabDisabled : {}) }}
                onClick={() => !tab.disabled && setRightPanel(tab.id)}
                disabled={tab.disabled}>
                {tab.label}
              </button>
            ))}
          </div>
          <div style={s.graphStats}>
            {graphNodes.length} notes · {graphEdges.length} connections
          </div>
        </div>

        {/* Panel content */}
        <div style={s.panel}>

          {/* Graph panel */}
          {rightPanel === 'graph' && (
            <GraphCanvas
              nodes={graphNodes}
              edges={graphEdges}
              activeNoteId={activeNote?.id}
              onNodeClick={handleNodeClick}
            />
          )}

          {/* Note panel */}
          {rightPanel === 'note' && activeNote && (
            <div style={s.notePanel}>
              <div style={s.notePanelHeader}>
                <h2 style={s.notePanelTitle}>{activeNote.title}</h2>
                <button style={s.aiBtn} onClick={() => setRightPanel('ai')}>
                  ✨ Ask AI
                </button>
              </div>
              <div style={s.noteContent}
                dangerouslySetInnerHTML={{ __html: activeNote.html_content || `<p>${activeNote.content}</p>` }} />
            </div>
          )}

          {/* AI panel */}
          {rightPanel === 'ai' && activeNote && (
            <div style={s.aiPanel}>
              <button style={s.backBtn} onClick={() => setRightPanel('note')}>
                ← Back to Note
              </button>
              <AskAI noteId={activeNote.id} noteTitle={activeNote.title} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const s = {
  root:            { display: 'flex', height: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden' },
  sidebar:         { width: 280, background: '#161b22', borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', padding: '16px', overflowY: 'auto', flexShrink: 0, gap: 8 },
  sideTop:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logo:            { fontSize: 20, fontWeight: 700, color: '#3fb950' },
  userRow:         { display: 'flex', alignItems: 'center', gap: 8 },
  userName:        { fontSize: 12, color: '#7d8590' },
  logoutBtn:       { background: 'none', border: '1px solid #30363d', borderRadius: 4, color: '#7d8590', cursor: 'pointer', fontSize: 11, padding: '2px 8px' },
  searchRow:       { display: 'flex', gap: 6 },
  searchInput:     { flex: 1, background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '7px 10px', color: '#e6edf3', fontSize: 12, outline: 'none' },
  searchBtn:       { background: '#21262d', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', cursor: 'pointer', padding: '0 10px', fontSize: 14 },
  searchResults:   { background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 10 },
  searchItem:      { padding: '8px', borderRadius: 6, cursor: 'pointer', marginBottom: 4, background: '#161b22' },
  clearSearch:     { background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', fontSize: 11, width: '100%', marginTop: 4 },
  newNoteBtn:      { background: '#238636', border: 'none', borderRadius: 6, padding: '9px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  newNoteForm:     { display: 'flex', flexDirection: 'column', gap: 8, background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 12 },
  titleInput:      { background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: '8px 10px', color: '#e6edf3', fontSize: 13, outline: 'none' },
  saveBtn:         { background: '#1f6feb', border: 'none', borderRadius: 6, padding: '9px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  sectionLabel:    { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7d8590', padding: '4px 0' },
  notesList:       { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  noteItem:        { background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' },
  noteActive:      { border: '1px solid #3fb950', background: 'rgba(63,185,80,0.05)' },
  noteItemTitle:   { fontSize: 12, fontWeight: 600, color: '#e6edf3', marginBottom: 3 },
  noteItemPreview: { fontSize: 11, color: '#7d8590', marginBottom: 4, lineHeight: 1.4 },
  noteItemMeta:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#7d8590' },
  deleteBtn:       { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: 0.6 },
  main:            { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #21262d', background: '#161b22' },
  tabs:            { display: 'flex', gap: 8 },
  tabBtn:          { background: 'none', border: '1px solid #30363d', borderRadius: 6, padding: '6px 14px', color: '#7d8590', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  tabActive:       { background: 'rgba(88,166,255,0.1)', borderColor: '#58a6ff', color: '#58a6ff' },
  tabDisabled:     { opacity: 0.4, cursor: 'not-allowed' },
  graphStats:      { fontSize: 11, color: '#7d8590' },
  panel:           { flex: 1, overflow: 'hidden' },
  notePanel:       { padding: '24px 32px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' },
  notePanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  notePanelTitle:  { fontSize: 22, fontWeight: 700, color: '#e6edf3' },
  aiBtn:           { background: 'rgba(188,140,255,0.15)', border: '1px solid rgba(188,140,255,0.3)', borderRadius: 6, padding: '7px 14px', color: '#bc8cff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  noteContent:     { fontSize: 14, lineHeight: 1.8, color: '#c9d1d9' },
  aiPanel:         { padding: '20px 24px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' },
  backBtn:         { background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 },
};
