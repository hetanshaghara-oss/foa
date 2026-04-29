import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const DEMAND_COLOR = {
  'Very High': { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  'High':      { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  'Medium':    { bg: 'rgba(245,165,36,0.12)', color: '#fbbf24', border: 'rgba(245,165,36,0.25)' },
  'Low':       { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: 'rgba(107,114,128,0.25)' },
};
const DIFF_COLOR = {
  'Easy':   { bg: 'rgba(16,185,129,0.1)', color: '#34d399', border: 'rgba(16,185,129,0.2)' },
  'Medium': { bg: 'rgba(245,165,36,0.1)', color: '#fbbf24', border: 'rgba(245,165,36,0.2)' },
  'Hard':   { bg: 'rgba(239,68,68,0.1)',  color: '#f87171', border: 'rgba(239,68,68,0.2)' },
};

const ICONS = {
  'Web Developer': '🌐', 'Data Scientist': '📊', 'UI/UX Designer': '🎨',
  'Machine Learning Engineer': '🤖', 'Cloud Engineer': '☁️', 'Mobile Developer': '📱',
  'DevOps Engineer': '⚙️', 'Cybersecurity Analyst': '🔒', 'Product Manager': '📋',
  'Blockchain Developer': '⛓️', 'Full Stack Developer': '🧱', 'Data Engineer': '🗄️',
  'Game Developer': '🎮', 'AI / NLP Engineer': '🧠', 'Backend Developer': '🔧',
  'Embedded Systems Engineer': '🔌', 'QA / Test Engineer': '🧪',
  'Site Reliability Engineer (SRE)': '📡', 'AR/VR Developer': '🥽',
  'Data Analyst': '📈', 'Frontend Developer': '💻', 'Robotics Engineer': '🦾',
  'Digital Marketing Analyst': '📣', 'Scrum Master / Agile Coach': '🏃',
  'Technical Writer': '✍️',
};

const CATEGORIES = [
  { label: 'All', filter: () => true },
  { label: '💻 Development', filter: c => ['Web Developer','Full Stack Developer','Frontend Developer','Backend Developer','Mobile Developer','Game Developer','Embedded Systems Engineer'].includes(c.title) },
  { label: '🤖 AI & Data', filter: c => ['Data Scientist','Machine Learning Engineer','AI / NLP Engineer','Data Engineer','Data Analyst'].includes(c.title) },
  { label: '☁️ Infrastructure', filter: c => ['Cloud Engineer','DevOps Engineer','Site Reliability Engineer (SRE)','Cybersecurity Analyst'].includes(c.title) },
  { label: '🎨 Design & Product', filter: c => ['UI/UX Designer','Product Manager','Technical Writer'].includes(c.title) },
  { label: '🚀 Emerging Tech', filter: c => ['Blockchain Developer','AR/VR Developer','Robotics Engineer'].includes(c.title) },
  { label: '📊 Business & Other', filter: c => ['Scrum Master / Agile Coach','Digital Marketing Analyst','QA / Test Engineer'].includes(c.title) },
];

export default function CareerExplorer() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    axios.get('/api/careers')
      .then(res => { setCareers(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = careers
    .filter(CATEGORIES[activeCategory].filter)
    .filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.overview || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.requiredSkills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>
          Career Explorer
        </h1>
        <p style={{ color: '#9ca3af' }}>
          Browse <strong style={{ color: '#818cf8' }}>{careers.length}</strong> career profiles — with salary ranges, skills, demand levels, and AI roadmaps.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
        <input
          type="text"
          placeholder="Search careers, skills, or tools..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px 12px 44px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, color: '#f9fafb', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
          }}
          onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        )}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {CATEGORIES.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveCategory(i)}
            style={{
              padding: '8px 16px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
              background: activeCategory === i ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.06)',
              color: activeCategory === i ? '#fff' : '#9ca3af',
              boxShadow: activeCategory === i ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
              transform: activeCategory === i ? 'translateY(-1px)' : 'none'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 16 }}>
          Showing <strong style={{ color: '#d1d5db' }}>{filtered.length}</strong> career{filtered.length !== 1 ? 's' : ''}
          {search ? ` matching "${search}"` : ''}
        </p>
      )}

      {/* Career Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 200, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map(career => {
            const demand = DEMAND_COLOR[career.demandLevel] || DEMAND_COLOR['Medium'];
            const diff = DIFF_COLOR[career.difficultyLevel] || DIFF_COLOR['Medium'];
            const icon = ICONS[career.title] || '💼';

            return (
              <Link
                key={career._id || career.title}
                to={`/career/${encodeURIComponent(career.title)}`}
                style={{
                  background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
                  padding: 24, textDecoration: 'none', color: 'inherit',
                  display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Icon + Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                  }}>
                    {icon}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.3 }}>
                    {career.title}
                  </h3>
                </div>

                {/* Overview */}
                <p style={{ color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>
                  {(career.overview || '').length > 110 ? career.overview.slice(0, 110) + '...' : career.overview}
                </p>

                {/* Top skills */}
                <div style={{ marginBottom: 16 }}>
                  {(career.requiredSkills || []).slice(0, 3).map(s => (
                    <span key={s} style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, margin: '2px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.72rem', fontWeight: 500 }}>
                      {s}
                    </span>
                  ))}
                  {(career.requiredSkills || []).length > 3 && (
                    <span style={{ fontSize: '0.72rem', color: '#6b7280', marginLeft: 4 }}>
                      +{career.requiredSkills.length - 3} more
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>India Salary</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{career.salaryRange?.india || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 700, background: demand.bg, color: demand.color, border: `1px solid ${demand.border}` }}>
                      {career.demandLevel}
                    </span>
                    <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 600, background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
                      {career.difficultyLevel}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
          <p style={{ marginBottom: 8 }}>No careers match your search.</p>
          <button onClick={() => { setSearch(''); setActiveCategory(0); }} style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
            Clear filters →
          </button>
        </div>
      )}
    </div>
  );
}
