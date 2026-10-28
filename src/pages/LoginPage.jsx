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
  Zap,
  Landmark,
  Scale,
  Building,
  Building2,
  TreePine,
  CheckCircle2,
  ChevronRight,
  Users,
} from 'lucide-react';
import { BlockchainAPI, PRESET_USERS, PRESET_PASSWORDS } from '../api/blockchain';
import { PropChainMark } from '../components/PropChainLogo';

export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState('login'); // 'login' | 'roles' | 'register'

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
  const [authenticatingUser, setAuthenticatingUser] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
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

  const handleQuickRoleSelect = async (presetUser) => {
    setError('');
    setSuccess('');
    setAuthenticatingUser(presetUser.email);
    setLoading(true);
    try {
      const defaultPassword = PRESET_PASSWORDS[presetUser.email.toLowerCase()] || 'Cdac@123';
      const res = await BlockchainAPI.login(presetUser.email, defaultPassword);
      if (res.ok) {
        onLogin(res.user);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(`Quick login failed: ${err.message}`);
    } finally {
      setLoading(false);
      setAuthenticatingUser('');
    }
  };

  const fillQuickCredential = (presetEmail) => {
    const password = PRESET_PASSWORDS[presetEmail.toLowerCase()] || 'Cdac@123';
    setEmail(presetEmail);
    setPass(password);
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

  const citizens = PRESET_USERS.filter((u) => u.type === 'citizen');
  const orgUsers = PRESET_USERS.filter((u) => u.type === 'org');

  const getOrgIcon = (org) => {
    switch (org) {
      case 'bank-com':
        return <Landmark size={18} color="#0284c7" />;
      case 'judiciary-com':
        return <Scale size={18} color="#dc2626" />;
      case 'municipal-com':
        return <Building size={18} color="#0d9488" />;
      case 'revenue-com':
        return <Building2 size={18} color="#d97706" />;
      case 'panchayat-com':
        return <TreePine size={18} color="#16a34a" />;
      case 'sro-com':
      default:
        return <Building2 size={18} color="#4f46e5" />;
    }
  };

  return (
    <div className="login-page">
      <div
        className="login-card animate-in"
        style={{
          maxWidth: tab === 'roles' ? 680 : 450,
          transition: 'max-width 0.25s ease',
        }}
      >
        {/* Logo */}
        <div className="login-logo">
          <div style={{ display: 'inline-flex', marginBottom: 10 }}>
            <PropChainMark size={48} />
          </div>
          <h1>PropChain Portal</h1>
          <p>National Blockchain Property Registry (NBF-Lite)</p>
        </div>

        {/* Trust badge */}
        <div className="gov-banner" style={{ marginBottom: 18 }}>
          <ShieldCheck size={16} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Gov e-ID & Fabric MSP Authentication</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
              7-Org Distributed Consensus · X.509 Cryptographic Identity
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--r)',
            padding: 3,
            marginBottom: 20,
            gap: 3,
          }}
        >
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
              fontSize: '0.8125rem',
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
            onClick={() => switchTab('roles')}
            style={{
              flex: 1.25,
              padding: '8px 0',
              borderRadius: 'calc(var(--r) - 2px)',
              border: 'none',
              background: tab === 'roles' ? '#fff' : 'transparent',
              boxShadow: tab === 'roles' ? 'var(--shadow-xs)' : 'none',
              fontWeight: tab === 'roles' ? 600 : 400,
              color: tab === 'roles' ? 'var(--accent)' : 'var(--text-400)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.18s ease',
              fontFamily: 'inherit',
            }}
          >
            <Zap size={14} color="#f59e0b" /> Demo Roles
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
              fontSize: '0.8125rem',
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
          <div
            style={{
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
            }}
          >
            <ShieldCheck size={14} />
            <span>{success}</span>
          </div>
        )}

        {/* ── QUICK DEMO ROLES TAB ── */}
        {tab === 'roles' && (
          <div className="flex flex-col gap-16 animate-in">
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-500)', lineHeight: 1.5 }}>
              Select any pre-configured identity to instantly authenticate and access their role-specific portal on the 7-org Hyperledger Fabric network:
            </div>

            {/* Institutional Authorities Section */}
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-400)',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Institutional & Regulatory Authorities</span>
                <span
                  style={{
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    padding: '1px 6px',
                    borderRadius: 8,
                    fontSize: '0.65rem',
                  }}
                >
                  6 Nodes
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 8,
                }}
              >
                {orgUsers.map((orgUser) => {
                  const isCurrentAuth = authenticatingUser === orgUser.email;
                  return (
                    <div
                      key={orgUser.email}
                      onClick={() => !loading && handleQuickRoleSelect(orgUser)}
                      style={{
                        padding: '10px 12px',
                        background: '#fff',
                        border: '1.5px solid var(--border)',
                        borderRadius: 10,
                        cursor: loading ? 'wait' : 'pointer',
                        transition: 'all 0.16s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: 'var(--bg-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getOrgIcon(orgUser.org)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              color: 'var(--text-900)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {orgUser.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-400)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {orgUser.role}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-500)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {orgUser.org}
                        </span>
                        {isCurrentAuth ? (
                          <div className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                          <ChevronRight size={14} color="var(--text-400)" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Citizens Section */}
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-400)',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Citizen Accounts</span>
                <span
                  style={{
                    background: 'var(--green-light)',
                    color: 'var(--green)',
                    padding: '1px 6px',
                    borderRadius: 8,
                    fontSize: '0.65rem',
                  }}
                >
                  Buyers & Sellers
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 8,
                }}
              >
                {citizens.map((citizen) => {
                  const isCurrentAuth = authenticatingUser === citizen.email;
                  return (
                    <div
                      key={citizen.email}
                      onClick={() => !loading && handleQuickRoleSelect(citizen)}
                      style={{
                        padding: '10px 12px',
                        background: '#fff',
                        border: '1.5px solid var(--border)',
                        borderRadius: 10,
                        cursor: loading ? 'wait' : 'pointer',
                        transition: 'all 0.16s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = citizen.avatarColor || 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: citizen.avatarColor || '#2563eb',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {citizen.avatar}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              color: 'var(--text-900)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {citizen.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-400)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {citizen.role}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-400)' }}>{citizen.email}</span>
                        {isCurrentAuth ? (
                          <div className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                          <ChevronRight size={14} color="var(--text-400)" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
                placeholder="e.g. rahul@cdac.in or court@judiciary.com"
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
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-400)',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Quick autofill chips */}
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-400)',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Zap size={11} color="#f59e0b" /> Quick Fill Demo Account:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => fillQuickCredential('rahul@cdac.in')}
                >
                  Rahul (Citizen)
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => fillQuickCredential('manager@bank.com')}
                >
                  🏦 SBI Bank
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => fillQuickCredential('court@judiciary.com')}
                >
                  ⚖️ Court
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => fillQuickCredential('officer@municipal.com')}
                >
                  🏙️ BBMP
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => fillQuickCredential('registrar@sro.com')}
                >
                  🏛️ SRO
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
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-400)',
                    padding: 0,
                    display: 'flex',
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
              Your account identity is registered and enrolled with CA1 of SRO organization.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
