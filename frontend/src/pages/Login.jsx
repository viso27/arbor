import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🌿 Arbor</div>
        <p style={s.sub}>Sign in to your knowledge graph</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input style={s.input} type="email" placeholder="Email"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input style={s.input} type="password" placeholder="Password"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={s.link}>Don't have an account? <Link to="/register" style={{ color: '#58a6ff' }}>Register</Link></p>
      </div>
    </div>
  );
}

const s = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' },
  card:  { background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 400 },
  logo:  { fontSize: 28, fontWeight: 700, color: '#3fb950', marginBottom: 8, textAlign: 'center' },
  sub:   { color: '#7d8590', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  error: { background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', color: '#f85149', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 },
  input: { width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '10px 12px', color: '#e6edf3', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
  btn:   { width: '100%', background: '#238636', border: 'none', borderRadius: 6, padding: '11px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  link:  { color: '#7d8590', fontSize: 13, textAlign: 'center', marginTop: 16 },
};
