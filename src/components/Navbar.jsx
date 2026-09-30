import React from 'react';
import {
  Building2,
  LayoutDashboard,
  Home,
  Store,
  LogOut,
  Globe,
  Server,
} from 'lucide-react';

export default function Navbar({
  user,
  page,
  setPage,
  onLogout,
  onOpenNetworkModal,
  networkConfig,
}) {
  const initial = user?.avatar || (user?.name ? user.name.charAt(0).toUpperCase() : 'U');
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header>
      {/* Top Utility Bar */}
      <div className="top-ribbon">
        <div className="top-ribbon-inner">
          <div className="flex items-center gap-12 text-xs">
            <span className="top-ribbon-tag">NATIONAL REGISTRY</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Globe size={13} color="#38bdf8" /> NBF-Lite Hyperledger Fabric Blockchain Infrastructure
            </span>
          </div>
          <div className="flex items-center gap-16 text-xs">
            <span>📅 {currentDate}</span>
            {user && (
              <span
                className="badge badge-blue"
                style={{ fontSize: '0.72rem', background: '#1e293b', color: '#93c5fd', borderColor: '#334155' }}
              >
                Gov e-ID: {user.govId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
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

              <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Network Mode Badge */}
                <button
                  className={`badge ${networkConfig?.mockMode ? 'badge-amber' : 'badge-green'}`}
                  style={{ cursor: 'pointer', padding: '5px 12px' }}
                  onClick={onOpenNetworkModal}
                  title="Click to configure NBF-Lite blockchain node"
                >
                  <Server size={13} />
                  {networkConfig?.mockMode ? 'Simulated Node' : 'NBF-Lite Live'}
                </button>

                {/* User Info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 24,
                    padding: '4px 14px 4px 6px',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: user.avatarColor || '#2563eb',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {initial}
                  </div>
                  <div className="text-left" style={{ lineHeight: 1.2 }}>
                    <div className="text-xs font-700" style={{ color: '#0f172a' }}>
                      {user.name}
                    </div>
                    <div className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                      {user.role?.split('/')[0]}
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#dc2626', padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca' }}
                  onClick={onLogout}
                  title="Sign out"
                >
                  <LogOut size={15} />
                  <span style={{ fontSize: '0.82rem' }}>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
