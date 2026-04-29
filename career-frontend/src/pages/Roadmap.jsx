import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const S = {
  card: {
    background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28
  },
  input: {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f9fafb', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  select: {
    width: '100%', padding: '12px 16px',
    background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f9fafb', fontSize: '0.95rem', outline: 'none',
    appearance: 'none', cursor: 'pointer'
  },
  phaseCard: {
    background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24,
    marginLeft: 48, position: 'relative'
  },
  skillPill: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 8, margin: '3px',
    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
    color: '#34d399', fontSize: '0.8rem', fontWeight: 500
  },
  projItem: {
    padding: '8px 14px', borderRadius: 8, marginBottom: 6,
    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
    color: '#818cf8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8
  }
};

export default function Roadmap() {
  const [searchParams] = useSearchParams();
  const initialCareer = searchParams.get('career') || '';

  const [career, setCareer] = useState(initialCareer);
  const [level, setLevel] = useState('Beginner');
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRoadmap = async (c = career, l = level) => {
    if (!c.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/ai/roadmap', { career: c, level: l });
      setRoadmapData(res.data);
    } catch {
      setError('Failed to generate roadmap. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initialCareer) generateRoadmap(initialCareer, 'Beginner');
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
          🗺️ AI Roadmap Generator
        </h1>
        <p style={{ color: '#9ca3af' }}>Get a phase-by-phase, personalized learning path — powered by AI.</p>
      </div>

      {/* Controls */}
      <div style={{ ...S.card, marginBottom: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Target Career
            </label>
            <input
              type="text"
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              placeholder="e.g., Data Scientist, Web Developer..."
              style={S.input}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Your Level
            </label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} style={S.select}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <button
            onClick={() => generateRoadmap()}
            disabled={loading || !career.trim()}
            className="btn-primary"
            style={{ height: 46, paddingLeft: 24, paddingRight: 24 }}
          >
            {loading ? '⏳ Generating...' : '✨ Generate'}
          </button>
        </div>
        {error && <p style={{ color: '#ef4444', marginTop: 12, fontSize: '0.875rem' }}>{error}</p>}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'spin 2s linear infinite', display: 'inline-block' }}>🧠</div>
          <p style={{ color: '#9ca3af' }}>AI is crafting your personalized roadmap...</p>
        </div>
      )}

      {/* Roadmap */}
      {!loading && roadmapData?.roadmap && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              📍 {roadmapData.career} — {level} Roadmap
            </h2>
            <span style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.8rem', fontWeight: 700 }}>
              {roadmapData.roadmap.length} Phases
            </span>
          </div>

          {/* Timeline */}
          <div style={{ position: 'relative', paddingLeft: 0 }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 20, top: 20, bottom: 20, width: 2, background: 'linear-gradient(to bottom, #6366f1, rgba(99,102,241,0.1))' }} />

            {roadmapData.roadmap.map((phase, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 0, marginBottom: 28, position: 'relative' }}>
                {/* Circle */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                  background: idx === 0 ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(17,24,39,0.9)',
                  border: '2px solid #6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 800, color: idx === 0 ? '#fff' : '#818cf8',
                  boxShadow: idx === 0 ? '0 0 20px rgba(99,102,241,0.5)' : 'none'
                }}>
                  {idx + 1}
                </div>

                {/* Card */}
                <div style={S.phaseCard}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#818cf8' }}>Phase {idx + 1}:</span> {phase.phase}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                        ✅ Skills to Master
                      </h4>
                      <div>
                        {(phase.skills || []).map(s => (
                          <span key={s} style={S.skillPill}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                        🚀 Projects to Build
                      </h4>
                      {(phase.projects || []).map(p => (
                        <div key={p} style={S.projItem}>
                          <span>→</span> {p}
                        </div>
                      ))}
                    </div>
                  </div>

                  {phase.tools && phase.tools.length > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>🛠️ Tools</h4>
                      {phase.tools.map(t => (
                        <span key={t} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, margin: '2px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: '0.75rem' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !roadmapData && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🗺️</div>
          <p>Enter a career above and click Generate to get your AI roadmap.</p>
        </div>
      )}
    </div>
  );
}
