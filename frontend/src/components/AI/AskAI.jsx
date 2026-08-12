import { useState } from 'react';
import api from '../../api/axios';

export default function AskAI({ noteId, noteTitle }) {
  const [question, setQuestion] = useState('');
  const [answer,   setAnswer]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [summary,  setSummary]  = useState('');
  const [sumLoading, setSumLoading] = useState(false);
  const [tab, setTab] = useState('ask'); // 'ask' | 'summarize'

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const res = await api.post('/ai/ask', { note_id: noteId, question });
      setAnswer(res.data.answer);
    } catch {
      setAnswer('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setSumLoading(true);
    setSummary('');
    try {
      const res = await api.get(`/ai/summarize/${noteId}`);
      setSummary(res.data.summary);
    } catch {
      setSummary('Failed to summarize. Please try again.');
    } finally {
      setSumLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={{ color: '#bc8cff', fontWeight: 700, fontSize: 13 }}>✨ AI Assistant</span>
        <span style={{ color: '#7d8590', fontSize: 11 }}>{noteTitle}</span>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {['ask', 'summarize'].map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
            onClick={() => setTab(t)}>
            {t === 'ask' ? '💬 Ask' : '📝 Summarize'}
          </button>
        ))}
      </div>

      {tab === 'ask' && (
        <div>
          <textarea
            style={s.textarea}
            placeholder="Ask anything about this note..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={3}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAsk())}
          />
          <button style={s.btn} onClick={handleAsk} disabled={loading}>
            {loading ? '🤖 Thinking...' : 'Ask AI'}
          </button>
          {answer && (
            <div style={s.answer}>
              {answer.split('\n').map((line, i) => (
                <p key={i} style={{ margin: '4px 0', fontSize: 13, color: '#e6edf3', lineHeight: 1.6 }}>{line}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'summarize' && (
        <div>
          <button style={s.btn} onClick={handleSummarize} disabled={sumLoading}>
            {sumLoading ? '📝 Summarizing...' : 'Generate Summary'}
          </button>
          {summary && (
            <div style={s.answer}>
              <p style={{ margin: 0, fontSize: 13, color: '#e6edf3', lineHeight: 1.7 }}>{summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap:      { background: '#161b22', border: '1px solid #30363d', borderRadius: 10, overflow: 'hidden' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #21262d' },
  tabs:      { display: 'flex', borderBottom: '1px solid #21262d' },
  tab:       { flex: 1, background: 'none', border: 'none', padding: '10px', color: '#7d8590', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  tabActive: { color: '#bc8cff', borderBottom: '2px solid #bc8cff' },
  textarea:  { width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '10px 12px', color: '#e6edf3', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', margin: '12px 0 8px', fontFamily: 'inherit' },
  btn:       { width: '100%', background: 'rgba(188,140,255,0.15)', border: '1px solid rgba(188,140,255,0.3)', borderRadius: 6, padding: '9px', color: '#bc8cff', fontSize: 13, fontWeight: 600, cursor: 'pointer', margin: '0 0 8px' },
  answer:    { background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, padding: '12px 14px', margin: '8px 0 12px' },
};
