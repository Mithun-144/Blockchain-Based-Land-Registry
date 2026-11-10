import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MyProperties from './pages/MyProperties';
import Marketplace from './pages/Marketplace';
import PropertyDetail from './pages/PropertyDetail';
import TransferWizard from './pages/TransferWizard';
import SellWizard from './pages/SellWizard';
import BankDashboard from './pages/BankDashboard';
import JudiciaryDashboard from './pages/JudiciaryDashboard';
import MunicipalDashboard from './pages/MunicipalDashboard';
import RevenueDashboard from './pages/RevenueDashboard';
import PanchayatDashboard from './pages/PanchayatDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import SroDashboard from './pages/SroDashboard';
import RegisterModal from './components/RegisterModal';
import NetworkModal from './components/NetworkModal';
import { BlockchainAPI, getNetworkConfig, saveNetworkConfig } from './api/blockchain';

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
    if (currentUser.dashboard === 'sro') return 'sro-dashboard';
    if (currentUser.dashboard === 'municipal') return 'municipal-dashboard';
    if (currentUser.dashboard === 'revenue') return 'revenue-dashboard';
    if (currentUser.dashboard === 'panchayat') return 'panchayat-dashboard';
    if (currentUser.dashboard === 'authority') {
      if (currentUser.jurisdiction === 'revenue') return 'revenue-dashboard';
      if (currentUser.jurisdiction === 'panchayat') return 'panchayat-dashboard';
      return 'municipal-dashboard';
    }
    return 'dashboard';
  };

  const [page, setPage] = useState(() => getInitialPage(user));
  const [transferProp, setTransferProp] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [networkConfig, setNetworkConfig] = useState(getNetworkConfig());
  const [stripePaymentResult, setStripePaymentResult] = useState(null);

  const handleSetPage = (nextPage) => {
    if (nextPage === 'transfer') {
      setStripePaymentResult(null);
      sessionStorage.removeItem('propchain_pending_transfer');
    }
    setPage(nextPage);
  };
  // 'landing' | 'login' | 'register' — controls pre-auth screens
  const [authScreen, setAuthScreen] = useState('landing');

  // ── Handle return from Stripe hosted checkout redirection ──
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const paymentStatus = urlParams.get('payment_status');

    if (paymentStatus === 'success' && sessionId) {
      BlockchainAPI.verifyStripeSession(sessionId)
        .then((result) => {
          const pendingRaw = sessionStorage.getItem('propchain_pending_transfer');
          let restoredProp = null;
          if (pendingRaw) {
            try {
              const pending = JSON.parse(pendingRaw);
              restoredProp = pending.property;
            } catch (e) {
              console.warn(e);
            }
          }

          if (restoredProp) {
            setTransferProp(restoredProp);
          } else if (result.metadata?.propertyId) {
            const allProps = BlockchainAPI.getAllProperties ? BlockchainAPI.getAllProperties() : [];
            const found = allProps.find((p) => p.id === result.metadata.propertyId);
            if (found) setTransferProp(found);
          }

          if (!user && (result.customerEmail || result.metadata?.buyerEmail)) {
            const email = result.customerEmail || result.metadata?.buyerEmail;
            const dummyUser = {
              name: result.metadata?.buyerName || 'Citizen User',
              email,
              dashboard: 'citizen',
              role: 'Citizen',
              jurisdiction: 'citizen',
              type: 'citizen',
            };
            setUser(dummyUser);
            localStorage.setItem('propchain_user', JSON.stringify(dummyUser));
          }

          setStripePaymentResult({
            success: true,
            paid: true,
            ...result,
          });
          setPage('transfer');
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          console.error('Failed to verify Stripe checkout session:', err);
          setStripePaymentResult({
            success: false,
            error: err.message,
          });
          setPage('transfer');
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (paymentStatus === 'cancelled') {
      const pendingRaw = sessionStorage.getItem('propchain_pending_transfer');
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          if (pending?.property) setTransferProp(pending.property);
        } catch (e) {
          console.warn(e);
        }
      }
      setStripePaymentResult({
        cancelled: true,
      });
      setPage('transfer');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('propchain_user', JSON.stringify(u));
    setPage(getInitialPage(u));
  };

  const handleLogout = () => {
    setStripePaymentResult(null);
    setTransferProp(null);
    setUser(null);
    localStorage.removeItem('propchain_user');
    setPage('dashboard');
    setAuthScreen('landing');
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
    if (authScreen === 'landing') {
      return (
        <LandingPage
          onGoLogin={() => setAuthScreen('login')}
          onGoRegister={() => setAuthScreen('register')}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        initialRegister={authScreen === 'register'}
        onBackToLanding={() => setAuthScreen('landing')}
      />
    );
  }

  return (
    <>
      <Navbar
        user={user}
        page={page}
        setPage={handleSetPage}
        onLogout={handleLogout}
        onOpenNetworkModal={() => setIsNetworkOpen(true)}
        networkConfig={networkConfig}
        onNetworkModeChange={handleNetworkModeChange}
      />

      <main>
        {page === 'dashboard' && (
          <Dashboard
            user={user}
            setPage={handleSetPage}
            setTransferProp={setTransferProp}
            onOpenRegisterModal={() => setIsRegisterOpen(true)}
          />
        )}
        {page === 'my-properties' && (
          <MyProperties
            user={user}
            setPage={handleSetPage}
            setTransferProp={setTransferProp}
            onOpenRegisterModal={() => setIsRegisterOpen(true)}
          />
        )}
        {page === 'marketplace' && (
          <Marketplace
            user={user}
            setPage={handleSetPage}
            setTransferProp={setTransferProp}
          />
        )}
        {page === 'property-detail' && (
          <PropertyDetail
            prop={transferProp}
            user={user}
            setPage={handleSetPage}
            setTransferProp={setTransferProp}
          />
        )}
        {page === 'transfer' && (
          <TransferWizard
            prop={transferProp}
            user={user}
            setPage={handleSetPage}
            stripePaymentResult={stripePaymentResult}
          />
        )}
        {page === 'sell' && (
          <SellWizard
            prop={transferProp}
            user={user}
            setPage={handleSetPage}
          />
        )}

        {/* ── Institutional Org Dashboards ── */}
        {page === 'bank-dashboard' && (
          <BankDashboard
            user={user}
            setPage={handleSetPage}
          />
        )}
        {page === 'judiciary-dashboard' && (
          <JudiciaryDashboard
            user={user}
            setPage={handleSetPage}
          />
        )}
        {page === 'municipal-dashboard' && (
          <MunicipalDashboard
            user={user}
            setPage={handleSetPage}
          />
        )}
        {page === 'revenue-dashboard' && (
          <RevenueDashboard
            user={user}
            setPage={handleSetPage}
          />
        )}
        {page === 'panchayat-dashboard' && (
          <PanchayatDashboard
            user={user}
            setPage={handleSetPage}
          />
        )}
        {page === 'authority-dashboard' && (
          <AuthorityDashboard
            user={user}
            setPage={handleSetPage}
          />
        )}
        {page === 'sro-dashboard' && (
          <SroDashboard
            user={user}
            setPage={handleSetPage}
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
