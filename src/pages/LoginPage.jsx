import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  UserPlus,
  LogIn,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login state
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await BlockchainAPI.login(email, pass);
      if (res.ok) {
        onLogin(res.user);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (regPass !== regPassConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await BlockchainAPI.registerUser(regEmail, regPass, regName);
      if (res.ok) {
        setSuccess('Account created! You can now sign in.');
        setTab('login');
        setEmail(regEmail);
        setPass('');
        setRegName('');
        setRegEmail('');
        setRegPass('');
        setRegPassConfirm('');
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setSuccess('');
  };

  return (
    <div className="login-page" style={{ padding: '40px 20px' }}>
      <div className="login-card animate-in" style={{ maxWidth: 500 }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="flex items-center justify-center gap-12 mb-8">
            <div style={{ background: '#2563eb', padding: 10, borderRadius: 12, color: '#fff', display: 'flex' }}>
              <Building2 size={36} color="#ffffff" />
            </div>
          </div>
          <h1>PropChain Portal</h1>
          <p>National Blockchain Framework Property Registry</p>
          <p className="text-xs text-muted" style={{ marginTop: 4 }}>
            Powered by NBF-Lite · Hyperledger Fabric Multi-Party Consensus
          </p>
        </div>

        <div className="gov-banner">
          <ShieldCheck size={28} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Citizen Portal — Gov e-ID Auth</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
              Dual X.509 Cryptographic Identity Verification (CDAC MSP)
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => switchTab('login')}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 7,
              border: 'none',
              background: tab === 'login' ? '#fff' : 'transparent',
              boxShadow: tab === 'login' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              fontWeight: tab === 'login' ? 700 : 500,
              color: tab === 'login' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              transition: 'all 0.2s ease',
            }}
          >
            <LogIn size={15} /> Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 7,
              border: 'none',
              background: tab === 'register' ? '#fff' : 'transparent',
              boxShadow: tab === 'register' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              fontWeight: tab === 'register' ? 700 : 500,
              color: tab === 'register' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              transition: 'all 0.2s ease',
            }}
          >
            <UserPlus size={15} /> Register
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="error-msg flex items-center gap-8" style={{ marginBottom: 14 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            className="flex items-center gap-8"
            style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#166534',
              fontSize: '0.875rem',
              marginBottom: 14,
            }}
          >
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-14">
            <div className="form-group">
              <label className="form-label flex items-center gap-6">
                <Mail size={14} /> Email Address
              </label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@cdac.in"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label flex items-center gap-6">
                <Lock size={14} /> Password
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 42, width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ padding: '12px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                  Authenticating with Fabric MSP...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>


          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-14">
            <div className="form-group">
              <label className="form-label flex items-center gap-6">
                <User size={14} /> Full Name
              </label>
              <input
                className="form-input"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Vikram Singh"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label flex items-center gap-6">
                <Mail size={14} /> Email Address
              </label>
              <input
                className="form-input"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. vikram@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label flex items-center gap-6">
                <Lock size={14} /> Choose Password
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  className="form-input"
                  type={showRegPass ? 'text' : 'password'}
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  style={{ paddingRight: 42, width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass(!showRegPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label flex items-center gap-6">
                <Lock size={14} /> Confirm Password
              </label>
              <input
                className="form-input"
                type="password"
                value={regPassConfirm}
                onChange={(e) => setRegPassConfirm(e.target.value)}
                placeholder="Re-enter your password"
                required
              />
              <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 47,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ padding: '12px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </>
              )}
            </button>

            <div className="divider" />
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Your account is stored securely in this device's registry.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
