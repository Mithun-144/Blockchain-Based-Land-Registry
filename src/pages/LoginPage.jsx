import React, { useState } from 'react';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  UserPlus,
  LogIn,
  User,
  Eye,
  EyeOff,
  Landmark,
  Scale,
  Building,
  Building2,
  CheckCircle2,
  ChevronDown,
  Shield,
  FileText,
  Trees,
} from 'lucide-react';
import { BlockchainAPI, PRESET_PASSWORDS } from '../api/blockchain';
import { PropChainMark } from '../components/PropChainLogo';

const DEPARTMENTS = [
  {
    id: 'citizen',
    label: 'Citizen Portal',
    shortLabel: 'Citizen',
    icon: User,
    color: '#2563eb',
    accentBg: '#eff6ff',
    badgeClass: 'badge-blue',
    msp: 'ca1.sro.com',
    peer: 'peer1.sro.com',
    emailLabel: 'Citizen Email Address',
    emailPlaceholder: 'e.g. rahul@cdac.in or priya@cdac.in',
    defaultEmail: 'rahul@cdac.in',
    allowRegister: true,
  },
  {
    id: 'judiciary',
    label: 'Judiciary & Courts',
    shortLabel: 'Judiciary',
    icon: Scale,
    color: '#dc2626',
    accentBg: '#fef2f2',
    badgeClass: 'badge-red',
    msp: 'judiciary-com',
    peer: 'peer1.judiciary.com',
    emailLabel: 'Judicial Officer Email',
    emailPlaceholder: 'court@judiciary.com',
    defaultEmail: 'court@judiciary.com',
    allowRegister: false,
  },
  {
    id: 'bank',
    label: 'Banking Institutions',
    shortLabel: 'Banks',
    icon: Landmark,
    color: '#0284c7',
    accentBg: '#f0f9ff',
    badgeClass: 'badge-blue',
    msp: 'bank-com',
    peer: 'peer1.bank.com',
    emailLabel: 'Bank Officer Email',
    emailPlaceholder: 'manager@bank.com',
    defaultEmail: 'manager@bank.com',
    allowRegister: false,
  },
  {
    id: 'sro',
    label: 'Sub-Registrar Office (SRO)',
    shortLabel: 'SRO',
    icon: Building2,
    color: '#4f46e5',
    accentBg: '#f5f3ff',
    badgeClass: 'badge-purple',
    msp: 'sro-com',
    peer: 'peer1.sro.com',
    emailLabel: 'Sub-Registrar Email',
    emailPlaceholder: 'registrar@sro.com',
    defaultEmail: 'registrar@sro.com',
    allowRegister: false,
  },
  {
    id: 'municipal',
    label: 'BBMP Urban Municipal',
    shortLabel: 'Municipal',
    icon: Building,
    color: '#0d9488',
    accentBg: '#f0fdfa',
    badgeClass: 'badge-green',
    msp: 'municipal-com',
    peer: 'peer1.municipal.com',
    emailLabel: 'Municipal Officer Email',
    emailPlaceholder: 'officer@municipal.com',
    defaultEmail: 'officer@municipal.com',
    allowRegister: false,
  },
  {
    id: 'revenue',
    label: 'Taluk Revenue (Bhoomi)',
    shortLabel: 'Revenue',
    icon: FileText,
    color: '#d97706',
    accentBg: '#fffbeb',
    badgeClass: 'badge-amber',
    msp: 'revenue-com',
    peer: 'peer1.revenue.com',
    emailLabel: 'Tahsildar / Revenue Officer Email',
    emailPlaceholder: 'tahsildar@revenue.com',
    defaultEmail: 'tahsildar@revenue.com',
    allowRegister: false,
  },
  {
    id: 'panchayat',
    label: 'Gram Panchayat (e-Swathu)',
    shortLabel: 'Panchayat',
    icon: Trees,
    color: '#16a34a',
    accentBg: '#f0fdf4',
    badgeClass: 'badge-green',
    msp: 'panchayat-com',
    peer: 'peer1.panchayat.com',
    emailLabel: 'Panchayat Development Officer (PDO) Email',
    emailPlaceholder: 'officer@panchayat.com',
    defaultEmail: 'officer@panchayat.com',
    allowRegister: false,
  },
];

export default function LoginPage({ onLogin }) {
  const [activeDept, setActiveDept] = useState('citizen');
  const [isRegister, setIsRegister] = useState(false);

  const currentDept = DEPARTMENTS.find((d) => d.id === activeDept) || DEPARTMENTS[0];
  const [email, setEmail] = useState(currentDept.defaultEmail);
  const [pass, setPass] = useState(PRESET_PASSWORDS[currentDept.defaultEmail.toLowerCase()] || 'Rahul@2024');
  const [showPass, setShowPass] = useState(false);

  // Register state (Citizen only)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeptChange = (deptId) => {
    setActiveDept(deptId);
    setError('');
    setSuccess('');
    setIsRegister(false);
    const dept = DEPARTMENTS.find((d) => d.id === deptId);
    if (dept) {
      setEmail(dept.defaultEmail);
      setPass(PRESET_PASSWORDS[dept.defaultEmail.toLowerCase()] || 'Cdac@123');
    }
  };

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
        setSuccess('Citizen identity registered! Enrolled with ca1.sro.com. You can now sign in.');
        setIsRegister(false);
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

  const DeptIcon = currentDept.icon;

  return (
    <div className="login-page">
      <div className="login-card animate-in">
        {/* Logo & Portal Branding */}
        <div className="login-logo">
          <div style={{ display: 'inline-flex', marginBottom: 10 }}>
            <PropChainMark size={44} />
          </div>
          <h1>PropChain Portal</h1>
          <p>National Blockchain Property Registry (NBF-Lite)</p>
        </div>

        {/* ── 1 Dropdown to select department / type ── */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Building2 size={13} color={currentDept.color} /> Select Department / Portal Type
          </label>
          <div style={{ position: 'relative' }}>
            <select
              className="form-input"
              value={activeDept}
              onChange={(e) => handleDeptChange(e.target.value)}
              style={{
                appearance: 'none',
                paddingRight: 36,
                fontWeight: 600,
                background: 'var(--bg-card)',
                borderColor: 'var(--border-strong)',
                cursor: 'pointer',
              }}
            >
              <option value="citizen">👤 Citizen (Public Land Registry)</option>
              <option value="judiciary">⚖️ Judiciary (Courts & Injunctions)</option>
              <option value="bank">🏦 Banks (Mortgage & Lien Authority)</option>
              <option value="sro">🏛️ Sub-Registrar Office (SRO Deeds)</option>
              <option value="municipal">🏙️ BBMP Municipal (e-Khata & Urban Cadastre)</option>
              <option value="revenue">📜 Taluk Revenue (Bhoomi RTC & Mutation)</option>
              <option value="panchayat">🏡 Gram Panchayat (e-Swathu Form 9 & 11)</option>
            </select>
            <ChevronDown
              size={15}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-400)',
              }}
            />
          </div>
        </div>

        {/* Citizen Sub-switch: Sign In vs Register */}
        {currentDept.allowRegister && (
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--r)',
              padding: 3,
              marginBottom: 16,
              gap: 3,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
                setSuccess('');
              }}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 'calc(var(--r) - 2px)',
                border: 'none',
                background: !isRegister ? '#fff' : 'transparent',
                boxShadow: !isRegister ? 'var(--shadow-xs)' : 'none',
                fontWeight: !isRegister ? 600 : 500,
                color: !isRegister ? 'var(--accent)' : 'var(--text-400)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'inherit',
              }}
            >
              <LogIn size={13} /> Citizen Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
                setSuccess('');
              }}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 'calc(var(--r) - 2px)',
                border: 'none',
                background: isRegister ? '#fff' : 'transparent',
                boxShadow: isRegister ? 'var(--shadow-xs)' : 'none',
                fontWeight: isRegister ? 600 : 500,
                color: isRegister ? 'var(--accent)' : 'var(--text-400)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'inherit',
              }}
            >
              <UserPlus size={13} /> Register Account
            </button>
          </div>
        )}

        {/* Feedback alerts */}
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
            <CheckCircle2 size={15} />
            <span>{success}</span>
          </div>
        )}

        {/* ── REGISTER FORM (Citizen only) ── */}
        {isRegister ? (
          <form onSubmit={handleRegister} className="flex flex-col gap-14">
            <div className="form-group">
              <label className="form-label">
                <User size={13} /> Full Legal Name
              </label>
              <input
                className="form-input"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Vikramaditya Singh"
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
                placeholder="e.g. vikram@cdac.in"
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
                placeholder="Re-enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ padding: '10px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 15, height: 15 }} />
                  <span>Enrolling Identity with Fabric CA...</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Create Citizen Account</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* ── LOGIN FORM ── */
          <form onSubmit={handleLogin} className="flex flex-col gap-14">
            <div className="form-group">
              <label className="form-label">
                <Mail size={13} /> {currentDept.emailLabel}
              </label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={currentDept.emailPlaceholder}
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

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{
                padding: '11px',
                marginTop: 4,
                background: currentDept.color,
                borderColor: currentDept.color,
                fontWeight: 600,
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 15, height: 15 }} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {currentDept.shortLabel}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {/* Minimal reference footnote */}
            <div
              style={{
                marginTop: 10,
                padding: '6px 10px',
                background: 'var(--bg-subtle)',
                border: '1px dashed var(--border-strong)',
                borderRadius: 'var(--r)',
                fontSize: '0.72rem',
                color: 'var(--text-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Demo Account: <strong>{currentDept.defaultEmail}</strong></span>
              <span>Pass: <strong>{PRESET_PASSWORDS[currentDept.defaultEmail.toLowerCase()]}</strong></span>
            </div>
          </form>
        )}

        {/* Minimal security footer */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.7rem',
            color: 'var(--text-400)',
          }}
        >
          <Shield size={12} color="var(--green)" />
          <span>Secured by NBF-Lite Hyperledger Fabric Network · X.509 PKI</span>
        </div>
      </div>
    </div>
  );
}
