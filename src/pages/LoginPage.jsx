import React, { useState } from 'react';
import {
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
import { PropChainMark } from '../components/PropChainLogo';

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
        setSuccess('Account created! X.509 cryptographic identity enrolled with ca1.sro.com. You can now sign in.');
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
    <div className="login-page">
      <div className="login-card animate-in">
        {/* Logo */}
        <div className="login-logo">
          <div style={{ display: 'inline-flex', marginBottom: 10 }}>
            <PropChainMark size={48} />
          </div>
          <h1>PropChain Portal</h1>
          <p>National Blockchain Property Registry</p>
        </div>

        {/* Trust badge */}
        <div className="gov-banner">
          <ShieldCheck size={16} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Gov e-ID Authentication</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>X.509 Cryptographic Identity · CDAC MSP</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--r)',
          padding: 3,
          marginBottom: 20,
          gap: 3,
        }}>
          <button
            type="button"
            onClick={() => switchTab('login')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'calc(var(--r) - 2px)',
              border: 'none',
              background: tab === 'login' ? '#fff' : 'transparent',
              boxShadow: tab === 'login' ? 'var(--shadow-xs)' : 'none',
              fontWeight: tab === 'login' ? 600 : 400,
              color: tab === 'login' ? 'var(--accent)' : 'var(--text-400)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.18s ease',
              fontFamily: 'inherit',
            }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'calc(var(--r) - 2px)',
              border: 'none',
              background: tab === 'register' ? '#fff' : 'transparent',
              boxShadow: tab === 'register' ? 'var(--shadow-xs)' : 'none',
              fontWeight: tab === 'register' ? 600 : 400,
              color: tab === 'register' ? 'var(--accent)' : 'var(--text-400)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.18s ease',
              fontFamily: 'inherit',
            }}
          >
            <UserPlus size={14} /> Register
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="error-msg flex items-center gap-8" style={{ marginBottom: 14 }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{
            background: 'var(--green-light)',
            border: '1px solid var(--green-border)',
            borderRadius: 'var(--r)',
            padding: '10px 14px',
            color: 'var(--green)',
            fontSize: '0.8125rem',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <ShieldCheck size={14} />
            <span>{success}</span>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-16">
            <div className="form-group">
              <label className="form-label">
                <Mail size={13} /> Email Address
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
              <label className="form-label">
                <Lock size={13} /> Password
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-400)', padding: 0, display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ padding: '11px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-16">
            <div className="form-group">
              <label className="form-label">
                <User size={13} /> Full Name
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
              <label className="form-label">
                <Mail size={13} /> Email Address
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
              <label className="form-label">
                <Lock size={13} /> Password
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  className="form-input"
                  type={showRegPass ? 'text' : 'password'}
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass(!showRegPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-400)', padding: 0, display: 'flex',
                  }}
                >
                  {showRegPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={13} /> Confirm Password
              </label>
              <input
                className="form-input"
                type="password"
                value={regPassConfirm}
                onChange={(e) => setRegPassConfirm(e.target.value)}
                placeholder="Re-enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ padding: '11px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Create Account</span>
                </>
              )}
            </button>

            <div className="divider" />
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-400)' }}>
              Your account is stored securely in this device's registry.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
