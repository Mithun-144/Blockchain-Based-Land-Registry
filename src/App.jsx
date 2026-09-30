import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MyProperties from './pages/MyProperties';
import Marketplace from './pages/Marketplace';
import PropertyDetail from './pages/PropertyDetail';
import TransferWizard from './pages/TransferWizard';
import SellWizard from './pages/SellWizard';
import RegisterModal from './components/RegisterModal';
import NetworkModal from './components/NetworkModal';
import { getNetworkConfig } from './api/blockchain';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('propchain_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState('dashboard');
  const [transferProp, setTransferProp] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [networkConfig, setNetworkConfig] = useState(getNetworkConfig());

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('propchain_user', JSON.stringify(u));
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('propchain_user');
    setPage('dashboard');
  };

  const handlePropertyRegistered = () => {
    // When a property is registered, refresh view or navigate to my-properties
    setPage('my-properties');
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
