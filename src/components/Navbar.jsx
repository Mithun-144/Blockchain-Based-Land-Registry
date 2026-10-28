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
  Check,
  Settings,
} from 'lucide-react';
import { PropChainMark } from './PropChainLogo';

export default function Navbar({
  user,
  page,
  setPage,
  onLogout,
  onOpenNetworkModal,
  networkConfig,
  onNetworkModeChange,
}) {
  const [isPortalDropdownOpen, setIsPortalDropdownOpen] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
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
            {/* Network mode dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className={`badge ${networkConfig?.mockMode ? 'badge-amber' : 'badge-green'}`}
                style={{
                  cursor: 'pointer',
                  paddingTop: 5,
                  paddingBottom: 5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                }}
                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                title="Change Blockchain Network Mode"
              >
                <Server size={12} />
                <span>{networkConfig?.mockMode ? 'Simulated' : 'Live'}</span>
                <ChevronDown size={12} />
              </button>

              {isNetworkDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: 260,
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)',
                    border: '1px solid var(--border)',
                    padding: '8px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                  onMouseLeave={() => setIsNetworkDropdownOpen(false)}
                >
                  <div
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-400)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Blockchain Mode
                  </div>

                  <button
                    onClick={() => {
                      if (onNetworkModeChange) onNetworkModeChange(true);
                      setIsNetworkDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: networkConfig?.mockMode ? '#fef3c7' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>
                        ⚡ Simulated Mode
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: 2 }}>
                        Local browser persistence & mock cryptographic checks
                      </div>
                    </div>
                    {networkConfig?.mockMode && <Check size={16} color="#92400e" />}
                  </button>

                  <button
                    onClick={() => {
                      if (onNetworkModeChange) onNetworkModeChange(false);
                      setIsNetworkDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: !networkConfig?.mockMode ? '#ecfdf5' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065f46' }}>
                        🌐 Live Fabric Mode
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: 2 }}>
                        Direct REST dispatch to NBF-Lite Fabric peers
                      </div>
                    </div>
                    {!networkConfig?.mockMode && <Check size={16} color="#065f46" />}
                  </button>

                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                  <button
                    onClick={() => {
                      setIsNetworkDropdownOpen(false);
                      onOpenNetworkModal();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--text-600)',
                      fontSize: '0.8rem',
                      width: '100%',
                      fontWeight: 500,
                    }}
                  >
                    <Settings size={14} />
                    <span>Configure Node Endpoints...</span>
                  </button>
                </div>
              )}
            </div>

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
