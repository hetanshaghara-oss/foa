import { useState } from 'react';

const S = {
  card: {
    background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28
  },
  statBox: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20
  },
  tag: (color = '#818cf8') => ({
    display: 'inline-block', padding: '4px 10px', borderRadius: 6, margin: '2px',
    background: `${color}15`, border: `1px solid ${color}30`, color, fontSize: '0.8rem', fontWeight: 500
  })
};

const MOCK_SKILLS_DONE = ['HTML', 'CSS', 'JavaScript', 'React Basics'];
const MOCK_PROJECTS_DONE = ['Personal Portfolio Website', 'Todo App with React'];
const MOCK_SAVED = ['Web Developer', 'UI/UX Designer'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>📊 My Dashboard</h1>
        <p style={{ color: '#9ca3af' }}>Track your career learning progress and saved paths.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { icon: '✅', label: 'Skills Mastered', value: MOCK_SKILLS_DONE.length, color: '#34d399' },
          { icon: '🚀', label: 'Projects Done', value: MOCK_PROJECTS_DONE.length, color: '#818cf8' },
          { icon: '🔖', label: 'Saved Careers', value: MOCK_SAVED.length, color: '#fbbf24' },
          { icon: '📈', label: 'Progress Score', value: '42%', color: '#06b6d4' },
        ].map((stat, i) => (
          <div key={i} style={S.statBox}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, border: `1px solid ${stat.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 2 }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color, fontFamily: "'Outfit', sans-serif" }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {['overview', 'skills', 'projects'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer',
            background: activeTab === tab ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'transparent',
            color: activeTab === tab ? '#fff' : '#9ca3af', transition: 'all 0.2s ease'
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={S.card}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>🔖 Saved Careers</h3>
            {MOCK_SAVED.map(c => (
              <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>{c}</span>
                <a href={`/careerpath/roadmap?career=${encodeURIComponent(c)}`} style={{ color: '#818cf8', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>View Roadmap →</a>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>📈 Progress Overview</h3>
            {[
              { label: 'HTML & CSS', pct: 90, color: '#818cf8' },
              { label: 'JavaScript', pct: 70, color: '#6366f1' },
              { label: 'React', pct: 45, color: '#a855f7' },
              { label: 'Node.js', pct: 20, color: '#06b6d4' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                  <span style={{ color: '#d1d5db' }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 700 }}>{item.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 9999, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>✅ Mastered Skills</h3>
          <div style={{ marginBottom: 24 }}>
            {MOCK_SKILLS_DONE.map(s => <span key={s} style={S.tag('#34d399')}>{s}</span>)}
          </div>
          <h4 style={{ fontWeight: 600, color: '#9ca3af', marginBottom: 12, fontSize: '0.9rem' }}>🎯 Next Skills to Learn</h4>
          <div>
            {['TypeScript', 'Node.js', 'MongoDB', 'Docker', 'GraphQL'].map(s => <span key={s} style={S.tag('#6b7280')}>{s}</span>)}
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>🚀 Completed Projects</h3>
          {MOCK_PROJECTS_DONE.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: 10 }}>
              <span style={{ color: '#34d399', fontSize: '1.2rem' }}>✅</span>
              <span style={{ fontWeight: 600 }}>{p}</span>
            </div>
          ))}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ color: '#9ca3af', fontWeight: 600, marginBottom: 12, fontSize: '0.9rem' }}>🎯 Suggested Next Projects</h4>
            {['Full-Stack Blog App', 'E-commerce Dashboard', 'Real-time Chat App'].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
                <span style={{ color: '#6b7280' }}>⬜</span>
                <span style={{ color: '#9ca3af' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
