import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const S = {
  hero: { textAlign: 'center', padding: '60px 0 40px' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 16px', borderRadius: 9999,
    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
    color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, marginBottom: 24
  },
  h1: { fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, fontFamily: "'Outfit', sans-serif" },
  sub: { fontSize: '1.1rem', color: '#9ca3af', maxWidth: 560, margin: '0 auto 40px' },
  card: {
    background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32
  },
  textarea: {
    width: '100%', minHeight: 120, padding: '16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f9fafb', fontSize: '1rem', resize: 'none',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
  },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 32 },
  careerCard: {
    background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24,
    cursor: 'pointer', transition: 'all 0.3s ease'
  },
  skillTag: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 6,
    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
    color: '#818cf8', fontSize: '0.75rem', margin: '2px'
  }
};

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSuggest = async () => {
    if (!input.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/ai/suggest', { input });
      setSuggestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('AI suggestion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={S.hero}>
        <div style={S.badge}>✨ AI-Powered Career Guidance</div>
        <h1 style={S.h1}>
          Find your{' '}
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            perfect
          </span>{' '}career path
        </h1>
        <p style={S.sub}>Tell us what you love. Our AI analyzes your interests and suggests the best-fit careers with clear, actionable roadmaps.</p>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={S.card}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Describe your interests &amp; strengths
          </label>
          <textarea
            style={S.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., I love building things with code, solving logic puzzles, and making beautiful interfaces..."
            onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 8 }}>{error}</p>}
          <button
            onClick={handleSuggest}
            disabled={loading || !input.trim()}
            className="btn-primary"
            style={{ marginTop: 16, width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '14px' }}
          >
            {loading ? '🧠 Analyzing your profile...' : '🚀 Discover My Career Paths'}
          </button>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            🎯 Your AI Career Suggestions
          </h2>
          <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: 24, fontSize: '0.9rem' }}>Click any card to explore it in detail</p>
          <div style={S.grid3}>
            {suggestions.map((career, i) => (
              <div
                key={i}
                style={S.careerCard}
                onClick={() => navigate(`/career/${encodeURIComponent(career.title)}`)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>
                  {['🌐','📊','🎨','☁️','🔒','📱','🤖'][i % 7]}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, fontFamily: "'Outfit', sans-serif", color: '#818cf8' }}>
                  {career.title}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 16 }}>
                  {career.reason}
                </p>
                <div>
                  {(career.requiredSkills || []).slice(0, 4).map(skill => (
                    <span key={skill} style={S.skillTag}>{skill}</span>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>
                  View roadmap →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature cards */}
      <div style={{ marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { icon: '🗺️', title: 'AI Roadmaps', desc: 'Phase-by-phase learning paths' },
          { icon: '🔍', title: 'Career Explorer', desc: 'Browse 10+ detailed career profiles' },
          { icon: '⚖️', title: 'Compare Careers', desc: 'Side-by-side salary & difficulty' },
          { icon: '💡', title: 'Project Ideas', desc: 'AI-generated portfolio projects' },
        ].map((f, i) => (
          <div key={i} style={{ ...S.card, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{f.icon}</div>
            <h4 style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</h4>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
