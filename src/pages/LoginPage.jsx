import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
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
  CreditCard,
  KeyRound,
  RefreshCw,
  Timer,
  Fingerprint,
  Sparkles,
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

  const currentDept = DEPARTMENTS.find((d) => d.id === activeDept) || DEPARTMENTS[0];
  const [email, setEmail] = useState(currentDept.defaultEmail);
  const [pass, setPass] = useState(PRESET_PASSWORDS[currentDept.defaultEmail.toLowerCase()] || 'Rahul@2024');
  const [showPass, setShowPass] = useState(false);

  // Register state (Citizen only)
  const [isRegister, setIsRegister] = useState(false);
  const [regName, setRegName] = useState('');
  const [regAadhar, setRegAadhar] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  // ── Aadhar OTP state (Citizen only) ──
  const [aadharNumber, setAadharNumber] = useState('');
  const [otpStep, setOtpStep] = useState('aadhar'); // 'aadhar' | 'otp'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const otpInputRefs = useRef([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Countdown timer for resend OTP ──
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDeptChange = (deptId) => {
    setActiveDept(deptId);
    setError('');
    setSuccess('');
    setIsRegister(false);
    // Reset OTP state when switching departments
    setOtpStep('aadhar');
    setAadharNumber('');
    setOtpDigits(['', '', '', '', '', '']);
    setMaskedEmail('');
    setCitizenName('');
    setDevOtp('');
    setCountdown(0);
    const dept = DEPARTMENTS.find((d) => d.id === deptId);
    if (dept) {
      setEmail(dept.defaultEmail);
      setPass(PRESET_PASSWORDS[dept.defaultEmail.toLowerCase()] || 'Cdac@123');
    }
  };

  // ── Format Aadhar as XXXX XXXX XXXX ──
  const formatAadhar = (value) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleAadharChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadharNumber(raw);
  };

  // ── Send OTP ──
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setDevOtp('');

    if (aadharNumber.length !== 12) {
      setError('Please enter a valid 12-digit Aadhar number.');
      return;
    }

    setLoading(true);
    try {
      const res = await BlockchainAPI.sendOtp(aadharNumber);
      if (res.ok) {
        setMaskedEmail(res.maskedEmail);
        setCitizenName(res.citizenName);
        if (res.devOtp) setDevOtp(res.devOtp);
        setOtpStep('otp');
        setOtpDigits(['', '', '', '', '', '']);
        setCountdown(300); // 5 minute countdown
        setSuccess(`OTP sent to registered email ${res.maskedEmail}`);
        // Focus first OTP input after render
        setTimeout(() => otpInputRefs.current[0]?.focus(), 120);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Could not connect to the OTP server. Please make sure the backend server is running on port 3001 (npm run server).');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ──
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpInputRefs.current[5]?.focus();
    }
  };

  // ── Verify OTP ──
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await BlockchainAPI.verifyOtp(aadharNumber, otp);
      if (res.ok) {
        onLogin(res.user);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Could not connect to the OTP server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await BlockchainAPI.sendOtp(aadharNumber);
      if (res.ok) {
        if (res.devOtp) setDevOtp(res.devOtp);
        setOtpDigits(['', '', '', '', '', '']);
        setCountdown(300);
        setSuccess(`New OTP sent to ${res.maskedEmail}`);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 120);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Could not resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Go back to Aadhar step ──
  const handleBackToAadhar = () => {
    setOtpStep('aadhar');
    setOtpDigits(['', '', '', '', '', '']);
    setDevOtp('');
    setError('');
    setSuccess('');
    setCountdown(0);
  };

  // ── Standard email+password login (for non-citizen departments) ──
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

    const cleanRegAadhar = regAadhar.replace(/\D/g, '');
    if (cleanRegAadhar.length !== 12) {
      setError('Please provide a valid 12-digit Aadhar number.');
      return;
    }
    if (regPass !== regPassConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await BlockchainAPI.registerUser(regEmail, regPass, regName, cleanRegAadhar);
      if (res.ok) {
        setSuccess('Citizen identity registered! You can now log in using your Aadhar card.');
        setIsRegister(false);
        setAadharNumber(cleanRegAadhar);
        setRegName('');
        setRegAadhar('');
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
  const isCitizen = activeDept === 'citizen';

  // Format countdown as M:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

        {/* Citizen Sub-switch: Aadhar Login vs Register */}
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
              <Fingerprint size={13} /> Aadhar OTP Sign In
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
              <UserPlus size={13} /> Register New Citizen
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

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── CITIZEN REGISTER FORM ── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {isCitizen && isRegister ? (
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
                <CreditCard size={13} /> 12-Digit Aadhar Card Number
              </label>
              <input
                className="form-input"
                type="text"
                value={formatAadhar(regAadhar)}
                onChange={(e) => setRegAadhar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="XXXX XXXX XXXX"
                required
                maxLength={14}
                style={{ letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={13} /> Registered Email Address
              </label>
              <input
                className="form-input"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. vikram@cdac.in or your-email@gmail.com"
                required
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-400)', margin: '4px 0 0' }}>
                Your OTP will be sent to this email through Resend during login.
              </p>
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
        ) : isCitizen && !isRegister ? (
          /* ════════════════════════════════════════════════════════════ */
          /* ── CITIZEN AADHAR + OTP LOGIN ── */
          /* ════════════════════════════════════════════════════════════ */
          <>
            {otpStep === 'aadhar' ? (
              /* ── Step 1: Enter Aadhar Number ── */
              <form onSubmit={handleSendOtp} className="flex flex-col gap-14">
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={13} /> Aadhar Card Number
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    value={formatAadhar(aadharNumber)}
                    onChange={handleAadharChange}
                    placeholder="XXXX XXXX XXXX"
                    required
                    style={{
                      textAlign: 'center',
                      fontSize: '1.15rem',
                      letterSpacing: '2px',
                      fontWeight: 600,
                      fontFamily: "'Courier New', monospace",
                    }}
                    maxLength={14} /* 12 digits + 2 spaces */
                    autoFocus
                  />
                  {aadharNumber && aadharNumber.length < 12 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-400)', margin: '4px 0 0', textAlign: 'center' }}>
                      {12 - aadharNumber.length} digits remaining
                    </p>
                  )}
                  {aadharNumber.length === 12 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--green)', margin: '4px 0 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> Valid 12-digit Aadhar format
                    </p>
                  )}
                </div>

                <div
                  style={{
                    padding: '10px 14px',
                    background: currentDept.accentBg,
                    borderRadius: 'var(--r)',
                    border: '1px solid var(--border)',
                    fontSize: '0.76rem',
                    color: 'var(--text-500)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <Shield size={14} color={currentDept.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    A secure 6-digit OTP will be dispatched via <strong>Resend Email Service</strong> to the address registered with this Aadhar card.
                  </span>
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
                  disabled={loading || aadharNumber.length !== 12}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 15, height: 15 }} />
                      <span>Sending OTP via Resend...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP to Email</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {/* Clickable Demo Aadhar numbers */}
                <div
                  style={{
                    marginTop: 2,
                    padding: '10px',
                    background: 'var(--bg-subtle)',
                    border: '1px dashed var(--border-strong)',
                    borderRadius: 'var(--r)',
                    fontSize: '0.7rem',
                    color: 'var(--text-500)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Fingerprint size={12} /> Registered Demo Citizens (Click to Auto-fill):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    {[
                      { name: 'Rahul Sharma', aadhar: '882145214521', email: 'rahul@cdac.in' },
                      { name: 'Priya Patel', aadhar: '992011231123', email: 'priya@cdac.in' },
                      { name: 'Amit Kumar', aadhar: '445188908890', email: 'amit@cdac.in' },
                      { name: 'Sunita Rao', aadhar: '671233493349', email: 'sunita@cdac.in' },
                    ].map((d) => (
                      <button
                        key={d.aadhar}
                        type="button"
                        onClick={() => setAadharNumber(d.aadhar)}
                        style={{
                          background: aadharNumber === d.aadhar ? currentDept.color : 'var(--bg-card)',
                          color: aadharNumber === d.aadhar ? '#fff' : 'var(--text-600)',
                          border: `1px solid ${aadharNumber === d.aadhar ? currentDept.color : 'var(--border-strong)'}`,
                          borderRadius: 'var(--r)',
                          padding: '6px 8px',
                          fontSize: '0.69rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{d.name}</div>
                        <div style={{ opacity: 0.85, fontSize: '0.65rem' }}>{formatAadhar(d.aadhar)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              /* ── Step 2: Enter OTP ── */
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-14">
                {/* Back button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: -4 }}>
                  <button
                    type="button"
                    onClick={handleBackToAadhar}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--accent)',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    <ArrowLeft size={14} /> Change Aadhar Number
                  </button>
                </div>

                {/* Info box showing recipient */}
                <div
                  style={{
                    padding: '12px 14px',
                    background: currentDept.accentBg,
                    borderRadius: 'var(--r)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <User size={14} color={currentDept.color} />
                    <strong style={{ color: 'var(--text-600)' }}>{citizenName}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-400)' }}>({formatAadhar(aadharNumber)})</span>
                  </div>
                  <div style={{ color: 'var(--text-500)', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={12} color={currentDept.color} />
                    OTP dispatched to <strong>{maskedEmail}</strong>
                  </div>
                </div>

                {/* Instant Dev Helper Chip if OTP generated */}
                {devOtp && (
                  <div style={{ textAlign: 'center', margin: '-4px 0' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpDigits(devOtp.split(''));
                        otpInputRefs.current[5]?.focus();
                      }}
                      style={{
                        fontSize: '0.74rem',
                        padding: '5px 12px',
                        background: '#eff6ff',
                        border: '1px dashed #3b82f6',
                        borderRadius: 20,
                        color: '#1d4ed8',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: 'inherit',
                      }}
                    >
                      <Sparkles size={12} /> Test Mode OTP: <strong style={{ letterSpacing: '2px' }}>{devOtp}</strong> (Click to auto-fill)
                    </button>
                  </div>
                )}

                {/* OTP Input Grid */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <KeyRound size={13} /> Enter 6-Digit Verification Code
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 8,
                      margin: '6px 0',
                    }}
                    onPaste={handleOtpPaste}
                  >
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpInputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        style={{
                          width: 44,
                          height: 50,
                          textAlign: 'center',
                          fontSize: '1.3rem',
                          fontWeight: 700,
                          borderRadius: 'var(--r)',
                          border: digit
                            ? `2px solid ${currentDept.color}`
                            : '2px solid var(--border-strong)',
                          background: digit ? currentDept.accentBg : 'var(--bg-card)',
                          color: 'var(--text-600)',
                          outline: 'none',
                          transition: 'border-color 0.15s, background 0.15s',
                          fontFamily: "'Courier New', monospace",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = currentDept.color;
                          e.target.style.boxShadow = `0 0 0 3px ${currentDept.color}22`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = digit ? currentDept.color : 'var(--border-strong)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Countdown + Resend */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    fontSize: '0.78rem',
                    color: 'var(--text-400)',
                  }}
                >
                  {countdown > 0 ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Timer size={13} /> Expires in <strong style={{ color: countdown < 60 ? '#dc2626' : 'var(--text-500)' }}>{formatTime(countdown)}</strong>
                    </span>
                  ) : (
                    <span style={{ color: '#dc2626' }}>OTP expired</span>
                  )}
                  <span style={{ color: 'var(--border-strong)' }}>|</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      color: 'var(--accent)',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'inherit',
                      padding: 0,
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    <RefreshCw size={12} /> Resend Code
                  </button>
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
                  disabled={loading || otpDigits.join('').length !== 6}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 15, height: 15 }} />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Verify OTP & Sign In</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        ) : (
          /* ════════════════════════════════════════════════════════════ */
          /* ── NON-CITIZEN LOGIN FORM (email + password, unchanged) ── */
          /* ════════════════════════════════════════════════════════════ */
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
