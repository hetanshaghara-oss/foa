import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CareerExplorer from './pages/CareerExplorer';
import CareerDetail from './pages/CareerDetail';
import Roadmap from './pages/Roadmap';
import Dashboard from './pages/Dashboard';
import Comparison from './pages/Comparison';

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      style={{
        color: active ? '#818cf8' : '#9ca3af',
        fontWeight: 500,
        fontSize: '0.9rem',
        textDecoration: 'none',
        padding: '6px 12px',
        borderRadius: '8px',
        background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
        border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {children}
    </Link>
  );
}

function App() {
  return (
    <Router basename="/careerpath">
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#030712', color: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
        <nav style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(3,7,18,0.9)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '0 24px'
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.25rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎯</div>
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Career Path AI</span>
            </Link>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <NavLink to="/">🏠 Home</NavLink>
              <NavLink to="/explorer">🔍 Explore</NavLink>
              <NavLink to="/roadmap">🗺️ Roadmap</NavLink>
              <NavLink to="/compare">⚖️ Compare</NavLink>
              <NavLink to="/dashboard">📊 Dashboard</NavLink>
            </div>
          </div>
        </nav>

        <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explorer" element={<CareerExplorer />} />
            <Route path="/career/:title" element={<CareerDetail />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/compare" element={<Comparison />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
