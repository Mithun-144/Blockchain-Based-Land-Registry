import React from 'react';
import {
  LayoutDashboard,
  Home,
  Store,
  LogOut,
  Server,
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
  const initial = user?.avatar || (user?.name ? user.name.charAt(0).toUpperCase() : 'U');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => setPage('dashboard')}>
          <PropChainMark size={32} />
          <span className="navbar-brand-name">PropChain</span>
          <span className="navbar-brand-tag">Official Portal</span>
        </div>

        {/* Nav links */}
        {user && (
          <div className="navbar-nav">
            <button
              className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
              onClick={() => setPage('dashboard')}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
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
                <div className="user-info-name">{user.name}</div>
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
