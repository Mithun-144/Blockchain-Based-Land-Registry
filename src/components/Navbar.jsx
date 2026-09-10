import React from 'react';
import {
  Building2,
  LayoutDashboard,
  Home,
  Store,
  LogOut,
  ShieldCheck,
  Server,
  Globe
} from 'lucide-react';

export default function Navbar({ user, page, setPage, onLogout, onOpenNetworkModal, networkConfig }) {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header>
      {/* Modern Top Utility Bar */}
      <div className="top-ribbon">
        <div className="top-ribbon-inner">
          <div className="flex items-center gap-12 text-xs">
            <span className="top-ribbon-tag">NATIONAL REGISTRY</span>
            <span style={{ display: 'inline-flex', items: 'center', gap: 6 }}>
              <Globe size={13} color="#38bdf8" /> NBF-Lite Hyperledger Fabric Blockchain Infrastructure
            </span>
          </div>
          <div className="flex items-center gap-16 text-xs">
            <span>📅 {currentDate}</span>
            {user && (
              <span className="badge badge-blue" style={{ fontSize: '0.72rem', background: '#1e293b', color: '#93c5fd', borderColor: '#334155' }}>
                Gov e-ID: {user.govId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modern Standard Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand" onClick={() => setPage('dashboard')} title="PropChain DApp">
            <div style={{ background: '#2563eb', padding: 7, borderRadius: 8, display: 'flex', color: '#fff' }}>
              <Building2 size={20} color="#ffffff" />
            </div>
            <span>PropChain</span>
            <span className="navbar-brand-badge">Official Portal</span>
          </div>

          {user && (
            <>
              <div className="navbar-nav">
                <button
                  className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setPage('dashboard')}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </button>
                <button
                  className={`nav-item ${page === 'my-properties' ? 'active' : ''}`}
                  onClick={() => setPage('my-properties')}
                >
                  <Home size={16} />
                  <span>My Properties</span>
                </button>
                <button
                  className={`nav-item ${page === 'marketplace' ? 'active' : ''}`}
                  onClick={() => setPage('marketplace')}
                >
                  <Store size={16} />
                  <span>Marketplace</span>
                </button>
              </div>

              <div className="navbar-user">
                <button
                  className={`badge ${networkConfig?.mockMode ? 'badge-amber' : 'badge-green'}`}
                  style={{ cursor: 'pointer', padding: '5px 12px' }}
                  onClick={onOpenNetworkModal}
                  title="Click to configure NBF-Lite blockchain node"
                >
                  <Server size={13} />
                  {networkConfig?.mockMode ? 'Simulated Node' : 'NBF-Lite Live'}
                </button>

                <div className="flex items-center gap-12">
                  <span className="text-sm font-600" style={{ color: '#334155' }}>
                    {user.name}
                  </span>
                  <div
                    className="avatar"
                    onClick={onLogout}
                    title={`Signed in as ${user.email} (${user.govId}). Click to log out`}
                  >
                    {initial}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}


