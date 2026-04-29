import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const S = {
  sectionCard: {
    background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, marginBottom: 24
  },
  tag: {
    display: 'inline-block', padding: '5px 12px', borderRadius: 8, margin: '3px',
    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
    color: '#818cf8', fontSize: '0.8rem', fontWeight: 500
  },
  toolTag: {
    display: 'inline-block', padding: '5px 12px', borderRadius: 8, margin: '3px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#d1d5db', fontSize: '0.8rem', fontWeight: 500
  },
  statBox: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12, padding: '16px 20px'
  },
  projCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 20, marginBottom: 12,
    transition: 'all 0.2s ease'
  }
};

const DIFFICULTY_COLOR = { Beginner: '#34d399', Intermediate: '#fbbf24', Advanced: '#f87171', Hard: '#f87171' };

export default function CareerDetail() {
  const { title } = useParams();
  const navigate = useNavigate();
  const [career, setCareer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingCareer, setLoadingCareer] = useState(true);

  useEffect(() => {
    axios.get('/api/careers')
      .then(res => {
        const found = res.data.find(c => c.title === decodeURIComponent(title));
        setCareer(found || null);
        setLoadingCareer(false);
      })
      .catch(() => setLoadingCareer(false));
  }, [title]);

  const generateProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await axios.post('/api/ai/projects', { career: career.title });
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
    setLoadingProjects(false);
  };

  if (loadingCareer) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>Loading career details...</div>
  );

  if (!career) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
      <p style={{ color: '#9ca3af', marginBottom: 16 }}>Career not found.</p>
      <Link to="/explorer" style={{ color: '#818cf8' }}>← Back to Explorer</Link>
    </div>
  );

  return (
    <div>
      {/* Back */}
      <Link to="/explorer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9ca3af', textDecoration: 'none', marginBottom: 24, fontSize: '0.875rem' }}>
        ← Back to Explorer
      </Link>

      {/* Hero */}
      <div style={S.sectionCard}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>💼</div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>{career.title}</h1>
              <p style={{ color: '#9ca3af', maxWidth: 500 }}>{career.overview}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate(`/roadmap?career=${encodeURIComponent(career.title)}`)} className="btn-primary">
              🗺️ Get Roadmap
            </button>
            <button onClick={() => navigate(`/compare?a=${encodeURIComponent(career.title)}`)} className="btn-outline">
              ⚖️ Compare
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div style={S.statBox}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>India Salary</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{career.salaryRange?.india}</div>
          </div>
          <div style={S.statBox}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Salary</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{career.salaryRange?.global}</div>
          </div>
          <div style={S.statBox}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demand</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>{career.demandLevel}</div>
          </div>
          <div style={S.statBox}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Difficulty</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: DIFFICULTY_COLOR[career.difficultyLevel] || '#fbbf24' }}>{career.difficultyLevel}</div>
          </div>
        </div>
      </div>

      {/* Skills & Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ ...S.sectionCard, marginBottom: 0 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            💡 Required Skills
          </h3>
          <div>{(career.requiredSkills || []).map(s => <span key={s} style={S.tag}>{s}</span>)}</div>
        </div>
        <div style={{ ...S.sectionCard, marginBottom: 0 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛠️ Tools &amp; Technologies
          </h3>
          <div>{(career.tools || []).map(t => <span key={t} style={S.toolTag}>{t}</span>)}</div>
        </div>
      </div>

      {/* AI Project Ideas */}
      <div style={S.sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>💡 AI Project Ideas</h2>
          <button onClick={generateProjects} disabled={loadingProjects} className="btn-outline" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
            {loadingProjects ? '⏳ Generating...' : '✨ Generate 5 Projects'}
          </button>
        </div>

        {projects.length === 0 && !loadingProjects && (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px 0', fontSize: '0.9rem' }}>
            Click "Generate 5 Projects" to get AI-powered project ideas for this career.
          </p>
        )}

        {projects.map((proj, i) => (
          <div key={i} style={S.projCard}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{proj.title}</h4>
              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: `${DIFFICULTY_COLOR[proj.difficulty] || '#6b7280'}15`, color: DIFFICULTY_COLOR[proj.difficulty] || '#9ca3af', border: `1px solid ${DIFFICULTY_COLOR[proj.difficulty] || '#6b7280'}30` }}>
                {proj.difficulty}
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: 12, lineHeight: 1.6 }}>{proj.description}</p>
            <div>{(proj.skillsUsed || []).map(s => <span key={s} style={{ ...S.tag, fontSize: '0.7rem', padding: '2px 8px' }}>{s}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
