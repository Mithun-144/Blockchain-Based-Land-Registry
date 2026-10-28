import React, { useState } from 'react';
import {
  LayoutDashboard,
  Home,
  Store,
  LogOut,
  Server,
  Landmark,
  Scale,
  Building,
  Building2,
  ChevronDown,
  Shield,
  Layers,
} from 'lucide-react';
import { PropChainMark } from './PropChainLogo';

export default function Navbar({
  user,
  page,
  setPage,
  onLogout,
  onOpenNetworkModal,
  networkConfig,
}) {
  const [isPortalDropdownOpen, setIsPortalDropdownOpen] = useState(false);
  const initial = user?.avatar || (user?.name ? user.name.charAt(0).toUpperCase() : 'U');

  const isOrgUser = user?.type === 'org' || user?.dashboard;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div
          className="navbar-brand"
          onClick={() => {
            if (isOrgUser) {
              setPage(`${user.dashboard}-dashboard`);
            } else {
              setPage('dashboard');
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <PropChainMark size={32} />
          <span className="navbar-brand-name">PropChain</span>
          <span className="navbar-brand-tag">National Blockchain Registry</span>
        </div>

        {/* Nav links */}
        {user && (
          <div className="navbar-nav">
            {/* Citizen navigation */}
            <button
              className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
              onClick={() => setPage('dashboard')}
            >
              <LayoutDashboard size={15} />
              <span>Citizen Portal</span>
            </button>
            <button
              className={`nav-item ${page === 'my-properties' ? 'active' : ''}`}
              onClick={() => setPage('my-properties')}
            >
              <Home size={15} />
              <span>My Properties</span>
            </button>
            <button
              className={`nav-item ${page === 'marketplace' ? 'active' : ''}`}
              onClick={() => setPage('marketplace')}
            >
              <Store size={15} />
              <span>Marketplace</span>
            </button>

            {/* Institutional Portals Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className={`nav-item ${
                  ['bank-dashboard', 'judiciary-dashboard', 'authority-dashboard', 'sro-dashboard'].includes(page)
                    ? 'active'
                    : ''
                }`}
                onClick={() => setIsPortalDropdownOpen(!isPortalDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: isOrgUser ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                }}
              >
                <Layers size={15} color={isOrgUser ? '#4f46e5' : 'inherit'} />
                <span style={{ fontWeight: isOrgUser ? 600 : 'inherit' }}>
                  {page === 'bank-dashboard'
                    ? '🏦 Bank Portal'
                    : page === 'judiciary-dashboard'
                    ? '⚖️ Court Portal'
                    : page === 'authority-dashboard'
                    ? '🏙️ Authority Portal'
                    : page === 'sro-dashboard'
                    ? '🏛️ SRO Portal'
                    : 'Org Portals'}
                </span>
                <ChevronDown size={13} />
              </button>

              {isPortalDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    minWidth: 240,
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
                    border: '1px solid var(--border)',
                    padding: '8px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                  onMouseLeave={() => setIsPortalDropdownOpen(false)}
                >
                  <div
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-400)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    7-Org Network Portals
                  </div>

                  <button
                    className={`nav-item ${page === 'bank-dashboard' ? 'active' : ''}`}
                    onClick={() => {
                      setPage('bank-dashboard');
                      setIsPortalDropdownOpen(false);
                    }}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', borderRadius: 8 }}
                  >
                    <Landmark size={15} color="#0284c7" />
                    <span>🏦 Bank Portal (bank-com)</span>
                  </button>

                  <button
                    className={`nav-item ${page === 'judiciary-dashboard' ? 'active' : ''}`}
                    onClick={() => {
                      setPage('judiciary-dashboard');
                      setIsPortalDropdownOpen(false);
                    }}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', borderRadius: 8 }}
                  >
                    <Scale size={15} color="#dc2626" />
                    <span>⚖️ Judiciary Portal (judiciary-com)</span>
                  </button>

                  <button
                    className={`nav-item ${page === 'authority-dashboard' ? 'active' : ''}`}
                    onClick={() => {
                      setPage('authority-dashboard');
                      setIsPortalDropdownOpen(false);
                    }}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', borderRadius: 8 }}
                  >
                    <Building size={15} color="#0d9488" />
                    <span>🏙️ Municipal / Revenue (Cadastral)</span>
                  </button>

                  <button
                    className={`nav-item ${page === 'sro-dashboard' ? 'active' : ''}`}
                    onClick={() => {
                      setPage('sro-dashboard');
                      setIsPortalDropdownOpen(false);
                    }}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', borderRadius: 8 }}
                  >
                    <Building2 size={15} color="#4f46e5" />
                    <span>🏛️ Sub-Registrar (SRO Deeds)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right side */}
        {user && (
          <div className="navbar-right">
            {/* Network badge */}
            <button
              className={`badge ${networkConfig?.mockMode ? 'badge-amber' : 'badge-green'}`}
              style={{ cursor: 'pointer', paddingTop: 5, paddingBottom: 5 }}
              onClick={onOpenNetworkModal}
              title="Configure blockchain node"
            >
              <Server size={12} />
              {networkConfig?.mockMode ? 'Simulated' : 'Live'}
            </button>

            {/* User pill */}
            <div className="user-pill">
              <div
                className="user-avatar"
                style={{ background: user.avatarColor || '#1d4ed8' }}
              >
                {initial}
              </div>
              <div>
                <div className="user-info-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{user.name}</span>
                  {user.org && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        background: 'rgba(0,0,0,0.06)',
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      {user.org}
                    </span>
                  )}
                </div>
                <div className="user-info-role">{user.role?.split('/')[0]}</div>
              </div>
            </div>

            {/* Sign out */}
            <button
              className="btn btn-danger btn-sm"
              onClick={onLogout}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
