import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  Mail,
  KeyRound,
  Timer,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingCart,
  Tag,
  User,
} from 'lucide-react';
import { BlockchainAPI, extractUserAadhar } from '../api/blockchain';

export default function TransactionOtpModal({
  isOpen,
  requestKey,
  action,
  prop,
  user,
  title,
  confirmLabel,
  amountLabel,
  amountDisplay,
  onVerified,
  onClose,
}) {
  const isBuy = action === 'buy';
  const rawAadhar = extractUserAadhar(user);
  const initialMaskedAadhar = rawAadhar ? `XXXX XXXX ${rawAadhar.slice(-4)}` : null;

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [maskedAadhar, setMaskedAadhar] = useState(initialMaskedAadhar);
  const [citizenName, setCitizenName] = useState(user?.name || 'Citizen');
  const [verificationKey, setVerificationKey] = useState('');
  const [usedLegacyFallback, setUsedLegacyFallback] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const otpInputRefs = useRef([]);
  const dispatchedKeyRef = useRef(null);
  const activeReqIdRef = useRef(0);

  const dispatchOtp = async (isResend = false) => {
    const reqId = ++activeReqIdRef.current;
    setSending(true);
    setError('');
    if (isResend) setSuccess('');
    setDevOtp('');

    try {
      const res = await BlockchainAPI.sendTransactionOtp({
        user,
        action,
        propertyId: prop?.id,
        propertyTitle: prop?.title,
      });

      if (activeReqIdRef.current !== reqId) return;

      if (res.ok) {
        setMaskedEmail(res.maskedEmail || user?.email || '');
        if (res.maskedAadhar) setMaskedAadhar(res.maskedAadhar);
        if (res.citizenName) setCitizenName(res.citizenName);
        setVerificationKey(res.verificationKey || '');
        setUsedLegacyFallback(Boolean(res.usedLegacyFallback));
        if (res.devOtp) setDevOtp(res.devOtp);
        setOtpDigits(['', '', '', '', '', '']);
        setCountdown(300);
        setResendCooldown(30);
        setSuccess(
          isResend
            ? `New OTP dispatched to ${res.maskedEmail}`
            : `OTP dispatched to your registered email ${res.maskedEmail}`
        );
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else {
        setError(res.error || 'Failed to send verification OTP.');
      }
    } catch {
      if (activeReqIdRef.current !== reqId) return;
      setError(
        'Could not connect to the OTP server. Please make sure the backend server is running on port 3001 (npm run server).'
      );
    } finally {
      if (activeReqIdRef.current === reqId) {
        setSending(false);
      }
    }
  };

  // Automatically send OTP on open (guarded against React StrictMode double invocation)
  useEffect(() => {
    if (!isOpen || !requestKey) return;
    if (dispatchedKeyRef.current === requestKey) return;
    dispatchedKeyRef.current = requestKey;
    dispatchOtp(false);
  }, [isOpen, requestKey]);

  // Countdown timers
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isOpen, countdown]);

  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isOpen, resendCooldown]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !verifying) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, verifying, onClose]);

  if (!isOpen) return null;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly && value !== '') return;

    if (digitsOnly.length > 1) {
      const next = [...otpDigits];
      for (let k = 0; k < 6 && index + k < 6 && k < digitsOnly.length; k++) {
        next[index + k] = digitsOnly[k];
      }
      setOtpDigits(next);
      const focusIdx = Math.min(5, index + digitsOnly.length);
      otpInputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = digitsOnly.slice(-1);
    setOtpDigits(next);

    if (digitsOnly && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setOtpDigits(next);
      otpInputRefs.current[Math.min(5, pasted.length - 1)]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setVerifying(true);
    try {
      const res = await BlockchainAPI.verifyTransactionOtp({
        verificationKey,
        user,
        otp,
        usedLegacyFallback,
      });
      if (res.ok) {
        onVerified();
      } else {
        setError(res.error || 'Incorrect OTP. Please check and try again.');
      }
    } catch {
      setError('Could not connect to the OTP server. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const accentColor = isBuy ? '#059669' : '#1d4ed8';
  const accentBg = isBuy ? '#ecfdf5' : '#eff6ff';
  const initials = (citizenName || 'C')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !verifying) onClose();
      }}
    >
      <div
        className="animate-in"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '470px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                className={`badge ${isBuy ? 'badge-green' : 'badge-blue'}`}
                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
              >
                {isBuy ? <ShoppingCart size={11} /> : <Tag size={11} />}
                {isBuy ? 'Purchase Verification' : 'Sale Listing Verification'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.125rem', margin: 0, color: 'var(--text-900)' }}>
              {title || (isBuy ? 'Verify OTP to Buy Property' : 'Verify OTP to Sell / List Property')}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={verifying}
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: '50%',
              width: 32,
              height: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleVerify} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Property Summary */}
          {prop && (
            <div
              style={{
                padding: '10px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-400)', fontFamily: "'Courier New', monospace" }}>
                  {prop.id} {prop.type ? `• ${prop.type}` : ''}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    color: 'var(--text-900)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {prop.title}
                </div>
              </div>
              {(amountDisplay || prop.value) && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {amountLabel && (
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {amountLabel}
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#059669' }}>
                    {amountDisplay || prop.value}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Citizen Identity Card (Pre-linked Aadhar — NO Aadhar entry required) */}
          <div
            style={{
              padding: '12px 14px',
              background: accentBg,
              borderRadius: 10,
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: accentColor,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials || <User size={14} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-900)', fontSize: '0.86rem', lineHeight: 1.2 }}>
                    {citizenName}
                  </div>
                  {maskedAadhar ? (
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-500)',
                        fontFamily: "'Courier New', monospace",
                        marginTop: 2,
                      }}
                    >
                      Aadhar: {maskedAadhar}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-500)', marginTop: 2 }}>
                      {user?.email}
                    </div>
                  )}
                </div>
              </div>

              <span
                className="badge badge-green"
                style={{ fontSize: '0.68rem', padding: '2px 8px', flexShrink: 0 }}
              >
                <ShieldCheck size={11} /> Verified ID
              </span>
            </div>

            <div
              style={{
                padding: '7px 10px',
                background: '#ffffff',
                borderRadius: 6,
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.78rem',
                color: 'var(--text-700)',
              }}
            >
              {sending && !maskedEmail ? (
                <>
                  <div className="spinner" style={{ width: 13, height: 13, flexShrink: 0 }} />
                  <span>Sending 6-digit OTP to your registered email…</span>
                </>
              ) : (
                <>
                  <Mail size={13} color={accentColor} style={{ flexShrink: 0 }} />
                  <span>
                    {maskedEmail
                      ? <>OTP dispatched to <strong>{maskedEmail}</strong></>
                      : 'Preparing OTP verification…'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="error-msg" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              {!verificationKey && !sending && (
                <div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => dispatchOtp(false)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    <RefreshCw size={12} /> Retry Sending OTP
                  </button>
                </div>
              )}
            </div>
          )}

          {success && !error && (
            <div
              style={{
                background: 'var(--green-light)',
                border: '1px solid var(--green-border)',
                borderRadius: 'var(--r)',
                padding: '9px 12px',
                color: 'var(--green)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* Dev / Test Mode auto-fill chip */}
          {devOtp && (
            <div style={{ textAlign: 'center' }}>
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

          {/* 6-Digit OTP Input */}
          <div className="form-group">
            <label
              className="form-label"
              style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
            >
              <KeyRound size={13} /> Enter 6-Digit Verification Code
            </label>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                margin: '4px 0',
              }}
              onPaste={handleOtpPaste}
            >
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpInputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={6}
                  value={digit}
                  disabled={verifying}
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
                      ? `2px solid ${accentColor}`
                      : '2px solid var(--border-strong)',
                    background: digit ? accentBg : 'var(--bg-card)',
                    color: 'var(--text-900)',
                    outline: 'none',
                    transition: 'border-color 0.15s, background 0.15s',
                    fontFamily: "'Courier New', monospace",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = accentColor;
                    e.target.style.boxShadow = `0 0 0 3px ${accentColor}22`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = digit ? accentColor : 'var(--border-strong)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>
          </div>

          {/* Expiry Countdown + Resend */}
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
                <Timer size={13} /> Expires in{' '}
                <strong style={{ color: countdown < 60 ? '#dc2626' : 'var(--text-700)' }}>
                  {formatTime(countdown)}
                </strong>
              </span>
            ) : (
              <span style={{ color: '#dc2626' }}>
                {sending ? 'Sending OTP…' : 'OTP expired'}
              </span>
            )}
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <button
              type="button"
              onClick={() => dispatchOtp(true)}
              disabled={sending || verifying || (resendCooldown > 0 && Boolean(verificationKey))}
              style={{
                background: 'none',
                border: 'none',
                cursor:
                  sending || verifying || (resendCooldown > 0 && Boolean(verificationKey))
                    ? 'not-allowed'
                    : 'pointer',
                color: 'var(--accent)',
                fontWeight: 600,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'inherit',
                padding: 0,
                opacity:
                  sending || verifying || (resendCooldown > 0 && Boolean(verificationKey))
                    ? 0.5
                    : 1,
              }}
            >
              <RefreshCw size={12} />
              {resendCooldown > 0 && verificationKey
                ? `Resend in ${resendCooldown}s`
                : 'Resend Code'}
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={verifying}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${isBuy ? 'btn-green' : 'btn-primary'}`}
              disabled={verifying || sending || otpDigits.join('').length !== 6 || !verificationKey}
              style={{ fontWeight: 600 }}
            >
              {verifying ? (
                <>
                  <div className="spinner" style={{ width: 15, height: 15 }} />
                  <span>Verifying OTP…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>{confirmLabel || (isBuy ? 'Verify & Proceed to Buy' : 'Verify & Proceed to Sell')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
