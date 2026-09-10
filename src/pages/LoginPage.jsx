import React, { useState } from 'react';
import { Building2, ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('citizen@cdac.in');
  const [pass, setPass] = useState('Cdac@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="login-page">
      <div className="login-card animate-in">
        <div className="login-logo">
          <div className="flex items-center justify-center gap-12 mb-8">
            <Building2 size={42} color="#4f9cf9" />
          </div>
          <h1>PropChain</h1>
          <p>National Blockchain Framework Property Registry</p>
          <p className="text-xs text-muted" style={{ marginTop: 6 }}>
            Powered by NBF-Lite · Hyperledger Fabric Architecture
          </p>
        </div>

        <div className="gov-banner">
          <ShieldCheck size={28} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Citizen Portal — Gov e-ID Auth</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
              Cryptographically verified against NBF-Lite identity records
            </div>
          </div>
        </div>

        {error && (
          <div className="error-msg flex items-center gap-8">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-16">
          <div className="form-group">
            <label className="form-label flex items-center gap-6">
              <Mail size={14} /> Citizen Government ID / Email
            </label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. citizen@cdac.in"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-6">
              <Lock size={14} /> Password / Passcode
            </label>
            <input
              className="form-input"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ padding: '14px', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                Authenticating with Fabric MSP...
              </>
            ) : (
              <>
                <span>Sign In via Gov e-ID</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="divider" />
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Default Credentials: <br />
          <code style={{ color: 'var(--primary)' }}>citizen@cdac.in</code> &nbsp;|&nbsp;
          <code style={{ color: 'var(--primary)' }}>Cdac@123</code>
        </div>
      </div>
    </div>
  );
}
