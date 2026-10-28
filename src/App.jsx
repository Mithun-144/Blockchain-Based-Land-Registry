import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MyProperties from './pages/MyProperties';
import Marketplace from './pages/Marketplace';
import PropertyDetail from './pages/PropertyDetail';
import TransferWizard from './pages/TransferWizard';
import SellWizard from './pages/SellWizard';
import BankDashboard from './pages/BankDashboard';
import JudiciaryDashboard from './pages/JudiciaryDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import SroDashboard from './pages/SroDashboard';
import RegisterModal from './components/RegisterModal';
import NetworkModal from './components/NetworkModal';
import { getNetworkConfig, saveNetworkConfig } from './api/blockchain';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('propchain_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const getInitialPage = (currentUser) => {
    if (!currentUser) return 'dashboard';
    if (currentUser.dashboard === 'bank') return 'bank-dashboard';
    if (currentUser.dashboard === 'judiciary') return 'judiciary-dashboard';
    if (currentUser.dashboard === 'authority') return 'authority-dashboard';
    if (currentUser.dashboard === 'sro') return 'sro-dashboard';
    return 'dashboard';
  };

  const [page, setPage] = useState(() => getInitialPage(user));
  const [transferProp, setTransferProp] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [networkConfig, setNetworkConfig] = useState(getNetworkConfig());

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('propchain_user', JSON.stringify(u));
    setPage(getInitialPage(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('propchain_user');
    setPage('dashboard');
  };

  const handlePropertyRegistered = () => {
    setPage('my-properties');
  };

  const handleNetworkModeChange = (isMock) => {
    const updated = { ...networkConfig, mockMode: isMock };
    saveNetworkConfig(updated);
    setNetworkConfig(updated);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <>
      <Navbar
        user={user}
        page={page}
        setPage={setPage}
        onLogout={handleLogout}
        onOpenNetworkModal={() => setIsNetworkOpen(true)}
        networkConfig={networkConfig}
        onNetworkModeChange={handleNetworkModeChange}
      />

      <main>
        {page === 'dashboard' && (
          <Dashboard
            user={user}
            setPage={setPage}
            setTransferProp={setTransferProp}
            onOpenRegisterModal={() => setIsRegisterOpen(true)}
          />
        )}
        {page === 'my-properties' && (
          <MyProperties
            user={user}
            setPage={setPage}
            setTransferProp={setTransferProp}
            onOpenRegisterModal={() => setIsRegisterOpen(true)}
          />
        )}
        {page === 'marketplace' && (
          <Marketplace
            user={user}
            setPage={setPage}
            setTransferProp={setTransferProp}
          />
        )}
        {page === 'property-detail' && (
          <PropertyDetail
            prop={transferProp}
            user={user}
            setPage={setPage}
            setTransferProp={setTransferProp}
          />
        )}
        {page === 'transfer' && (
          <TransferWizard
            prop={transferProp}
            user={user}
            setPage={setPage}
          />
        )}
        {page === 'sell' && (
          <SellWizard
            prop={transferProp}
            user={user}
            setPage={setPage}
          />
        )}

        {/* ── Institutional Org Dashboards ── */}
        {page === 'bank-dashboard' && (
          <BankDashboard
            user={user}
            setPage={setPage}
          />
        )}
        {page === 'judiciary-dashboard' && (
          <JudiciaryDashboard
            user={user}
            setPage={setPage}
          />
        )}
        {page === 'authority-dashboard' && (
          <AuthorityDashboard
            user={user}
            setPage={setPage}
          />
        )}
        {page === 'sro-dashboard' && (
          <SroDashboard
            user={user}
            setPage={setPage}
          />
        )}
      </main>

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        user={user}
        onRegistered={handlePropertyRegistered}
      />

      <NetworkModal
        isOpen={isNetworkOpen}
        onClose={() => setIsNetworkOpen(false)}
        onConfigUpdated={(cfg) => setNetworkConfig(cfg)}
      />
    </>
  );
}
