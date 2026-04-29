import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const CAREER_OPTIONS = [
  'Web Developer', 'Data Scientist', 'UI/UX Designer',
  'Cloud Engineer', 'Cybersecurity Analyst', 'Mobile Developer',
  'Machine Learning Engineer', 'DevOps Engineer', 'Product Manager'
];

const S = {
  card: {
    background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24
  },
  select: {
    width: '100%', padding: '10px 14px',
    background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#f9fafb', fontSize: '0.9rem', outline: 'none', appearance: 'none', cursor: 'pointer'
  },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }
};

const DIFF_COLOR = { Easy: '#34d399', Medium: '#fbbf24', Hard: '#f87171', 'Very High': '#34d399', High: '#818cf8', Medium: '#fbbf24', Low: '#9ca3af' };

export default function Comparison() {
  const [searchParams] = useSearchParams();
  const [selectedCareers, setSelectedCareers] = useState(['', '', '']);
  const [compareData, setCompareData] = useState(null);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/careers').then(res => setCareers(res.data)).catch(() => {});
    const a = searchParams.get('a');
    if (a) setSelectedCareers([decodeURIComponent(a), '', '']);
  }, []);

  const allOptions = [...new Set([...CAREER_OPTIONS, ...careers.map(c => c.title)])];

  const handleSelect = (i, val) => {
    const updated = [...selectedCareers];
    updated[i] = val;
    setSelectedCareers(updated);
  };

  const compare = async () => {
    const selected = selectedCareers.filter(Boolean);
    if (selected.length < 2) return;
    setLoading(true);

    // Get from DB or use defaults
    const rows = await Promise.all(selected.map(async (title) => {
      const found = careers.find(c => c.title === title);
      if (found) return found;
      return {
        title,
        salaryRange: { india: 'N/A', global: 'N/A' },
        demandLevel: 'Unknown',
        difficultyLevel: 'Unknown',
        requiredSkills: [],
        tools: []
      };
    }));

    setCompareData(rows);
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>⚖️ Career Comparison</h1>
        <p style={{ color: '#9ca3af' }}>Compare 2–3 careers side-by-side on salary, difficulty, demand, and more.</p>
      </div>

      {/* Selectors */}
      <div style={{ ...S.card, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          {[0, 1, 2].map(i => (
            <div key={i}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Career {i + 1} {i === 2 && <span style={{ color: '#6b7280' }}>(optional)</span>}
              </label>
              <select value={selectedCareers[i]} onChange={e => handleSelect(i, e.target.value)} style={S.select}>
                <option value="">Select a career...</option>
                {allOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button onClick={compare} disabled={loading || selectedCareers.filter(Boolean).length < 2} className="btn-primary" style={{ height: 44 }}>
            {loading ? '...' : '⚖️ Compare'}
          </button>
        </div>
      </div>

      {/* Comparison table */}
      {compareData && compareData.length >= 2 && (
        <div>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${compareData.length}, 1fr)`, gap: 16, marginBottom: 16 }}>
            <div />
            {compareData.map((c, i) => (
              <div key={i} style={{ ...S.card, textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{['🌐','📊','🎨','☁️','🔒'][i % 5]}</div>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', fontFamily: "'Outfit', sans-serif", color: '#818cf8' }}>{c.title}</h3>
              </div>
            ))}
          </div>

          {/* Rows */}
          {[
            { label: '💰 India Salary', key: c => c.salaryRange?.india },
            { label: '🌍 Global Salary', key: c => c.salaryRange?.global },
            { label: '📈 Demand Level', key: c => c.demandLevel, colorFn: v => DIFF_COLOR[v] || '#f9fafb' },
            { label: '⚡ Difficulty', key: c => c.difficultyLevel, colorFn: v => DIFF_COLOR[v] || '#f9fafb' },
            { label: '🛠️ Tools Count', key: c => `${(c.tools || []).length} tools` },
            { label: '📚 Skills Required', key: c => `${(c.requiredSkills || []).length} skills` },
          ].map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: `200px repeat(${compareData.length}, 1fr)`, gap: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '0.875rem', color: '#9ca3af', paddingLeft: 4 }}>
                {row.label}
              </div>
              {compareData.map((c, ci) => {
                const val = row.key(c);
                const color = row.colorFn ? row.colorFn(val) : '#f9fafb';
                return (
                  <div key={ci} style={{ ...S.card, padding: '14px 20px', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', color }}>
                    {val || '—'}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Skills comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareData.length}, 1fr)`, gap: 16, marginTop: 24 }}>
            {compareData.map((c, i) => (
              <div key={i} style={S.card}>
                <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {c.title} — Key Skills
                </h4>
                <div>
                  {(c.requiredSkills || []).map(s => (
                    <span key={s} style={{ display: 'inline-block', margin: '2px', padding: '4px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '0.75rem' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!compareData && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚖️</div>
          <p>Select at least 2 careers and click Compare.</p>
        </div>
      )}
    </div>
  );
}
