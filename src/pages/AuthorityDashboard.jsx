import React, { useState, useEffect } from 'react';
import {
  Building,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  FileCheck,
  FileX,
  TrendingUp,
  MapPin,
  X,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function AuthorityDashboard({ user, setPage }) {
  const jurisdiction = (user?.jurisdiction || 'municipal').toLowerCase();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'verified'

  // Modals
  const [selectedProp, setSelectedProp] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [eKhataNo, setEKhataNo] = useState('');
  const [surveyNo, setSurveyNo] = useState('');

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);
  const [newGuidelineVal, setNewGuidelineVal] = useState('');
  const [valRef, setValRef] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [txMessage, setTxMessage] = useState(null);

  const jurisdictionMeta = {
    municipal: {
      title: 'BBMP Urban Municipal Corporation',
      msp: 'municipal-com',
      badgeColor: '#0d9488',
      docType: 'BBMP e-Khata (A-Khata / B-Khata)',
      docPlaceholder: 'e.g. BBMP-A-99201',
      surveyPlaceholder: 'e.g. SY-104/2B',
      gradient: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
    },
    revenue: {
      title: 'Taluk Revenue & Bhoomi Department',
      msp: 'revenue-com',
      badgeColor: '#d97706',
      docType: 'RTC / Pahani (Bhoomi RoR)',
      docPlaceholder: 'e.g. RTC-BHOOMI-7741',
      surveyPlaceholder: 'e.g. SY-23/A1',
      gradient: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
    },
    panchayat: {
      title: 'Gram Panchayat Land Administration',
      msp: 'panchayat-com',
      badgeColor: '#16a34a',
      docType: 'Form 9 / Form 11 (Panchayat Khata)',
      docPlaceholder: 'e.g. PANCH-F9-4412',
      surveyPlaceholder: 'e.g. SY-56/4A',
      gradient: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
    },
  }[jurisdiction] || {
    title: 'Local Land Governance Authority',
    msp: user?.org || 'municipal-com',
    badgeColor: '#0d9488',
    docType: 'Title & Survey Record',
    docPlaceholder: 'Document No.',
    surveyPlaceholder: 'Survey No.',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const records = await BlockchainAPI.queryByJurisdiction(jurisdiction);
      setProperties(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Failed to load jurisdictional properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [jurisdiction]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!selectedProp) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      await BlockchainAPI.verifyAuthorityDetails(
        selectedProp.id,
        eKhataNo || selectedProp.eKhataNo,
        surveyNo || selectedProp.surveyNumber
      );
      setTxMessage({
        type: 'success',
        text: `Authority verified! ${selectedProp.id} is now endorsed under ${jurisdictionMeta.msp}. Document: ${eKhataNo || selectedProp.eKhataNo}.`,
      });
      setIsVerifyModalOpen(false);
      setEKhataNo('');
      setSurveyNo('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Verification failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!selectedProp || !revokeReason) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      await BlockchainAPI.revokeOwnershipVerification(selectedProp.id, revokeReason);
      setTxMessage({
        type: 'success',
        text: `Ownership verification revoked for ${selectedProp.id}. Property delisted pending dispute hearing.`,
      });
      setIsRevokeModalOpen(false);
      setRevokeReason('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Revocation failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateValuation = async (e) => {
    e.preventDefault();
    if (!selectedProp || !newGuidelineVal) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      const ref = valRef || `REV-${new Date().getFullYear()}-01`;
      await BlockchainAPI.updateValuation(selectedProp.id, Number(newGuidelineVal), ref);
      setTxMessage({
        type: 'success',
        text: `Govt. guideline valuation updated to ₹${Number(newGuidelineVal).toLocaleString('en-IN')} for ${selectedProp.id}.`,
      });
      setIsValuationModalOpen(false);
      setNewGuidelineVal('');
      setValRef('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Valuation update failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingList = properties.filter((p) => p.ownershipVerified === false);
  const verifiedList = properties.filter((p) => p.ownershipVerified !== false);
  const totalBaseVal = properties.reduce((sum, p) => sum + (Number(p.guidelineValue || p.rawValue) || 0), 0);

  const filtered = properties.filter((p) => {
    const matchesSearch =
      (p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.owner || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.eKhataNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.surveyNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'pending') return matchesSearch && p.ownershipVerified === false;
    if (activeTab === 'verified') return matchesSearch && p.ownershipVerified !== false;
    return matchesSearch;
  });

  return (
    <div className="page-container" style={{ padding: '24px 32px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: jurisdictionMeta.gradient,
          color: '#fff',
          borderRadius: 16,
          padding: '28px 32px',
          marginBottom: 28,
          boxShadow: '0 8px 24px rgba(15, 118, 110, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Building size={30} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700 }}>
                {jurisdictionMeta.title}
              </h1>
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                MSP: {jurisdictionMeta.msp}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
              Statutory Cadastral Validation, {jurisdictionMeta.docType} & Guideline Valuation Node
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn"
            onClick={fetchProperties}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {txMessage && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: 10,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: txMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${txMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: txMessage.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {txMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{txMessage.text}</span>
          </div>
          <button
            onClick={() => setTxMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0d9488' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Verified Parcels</span>
            <FileCheck size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {verifiedList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            e-Khata & Survey certified on-chain
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pending Verification Queue</span>
            <AlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {pendingList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Requires cadastral survey sign-off
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Jurisdictional Base Valuation</span>
            <DollarSign size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            ₹{(totalBaseVal / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Guideline rate assessment base
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7c3aed' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Jurisdiction Scope</span>
            <MapPin size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', textTransform: 'capitalize' }}>
            {jurisdiction}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Strict MSP barrier active
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }}
              />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder={`Search ${jurisdiction} records, survey or e-Khata...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({properties.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingList.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'verified' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('verified')}
            >
              Verified ({verifiedList.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-400)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px' }}>Property ID</th>
                <th style={{ padding: '12px 20px' }}>Cadastral Identifiers</th>
                <th style={{ padding: '12px 20px' }}>Owner</th>
                <th style={{ padding: '12px 20px' }}>Guideline Value</th>
                <th style={{ padding: '12px 20px' }}>Verification Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isVerified = p.ownershipVerified !== false;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-900)' }}>
                      {p.id}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>{p.type}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-600)', marginTop: 2 }}>
                        Survey: <code>{p.surveyNumber || 'PENDING'}</code> | Khata: <code>{p.eKhataNo || 'PENDING'}</code>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem' }}>{p.owner}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>{p.address}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>
                        ₹{(p.guidelineValue || p.rawValue || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        Market: {p.value || '₹' + p.rawValue}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {isVerified ? (
                        <div>
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle2 size={12} /> Verified by {p.verifiedBy || jurisdictionMeta.msp}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: 3 }}>
                            Date: {p.verificationDate || 'Active'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <AlertTriangle size={12} /> Pending Sign-off
                          </span>
                          {p.ownershipRevokedReason && (
                            <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: 3 }}>
                              Revoked: {p.ownershipRevokedReason}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        {!isVerified ? (
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ background: jurisdictionMeta.badgeColor }}
                            onClick={() => {
                              setSelectedProp(p);
                              setEKhataNo(p.eKhataNo !== 'PENDING' ? p.eKhataNo : '');
                              setSurveyNo(p.surveyNumber !== 'PENDING' ? p.surveyNumber : '');
                              setIsVerifyModalOpen(true);
                            }}
                          >
                            Verify Details
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                setSelectedProp(p);
                                setIsRevokeModalOpen(true);
                              }}
                              title="Revoke verification on title challenge"
                            >
                              Revoke
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--bg-subtle)' }}
                              onClick={() => {
                                setSelectedProp(p);
                                setNewGuidelineVal(String(p.guidelineValue || p.rawValue));
                                setIsValuationModalOpen(true);
                              }}
                              title="Revise Govt Guideline Rate"
                            >
                              <TrendingUp size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-400)' }}>
                    No properties in this jurisdiction queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: Verify Authority Details ── */}
      {isVerifyModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileCheck size={20} color={jurisdictionMeta.badgeColor} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Endorse {jurisdictionMeta.docType}
                </h3>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Invokes <code style={{ color: jurisdictionMeta.badgeColor }}>verifyAuthorityDetails</code> under MSP identity{' '}
              <strong>{jurisdictionMeta.msp}</strong>. This satisfies the Tahsildar / Municipal gate in smart contract transactions.
            </p>

            <form onSubmit={handleVerify} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property ID</label>
                <input className="form-input" disabled value={`${selectedProp.id} — ${selectedProp.title}`} />
              </div>

              <div className="form-group">
                <label className="form-label">{jurisdictionMeta.docType} Number</label>
                <input
                  className="form-input"
                  required
                  placeholder={jurisdictionMeta.docPlaceholder}
                  value={eKhataNo}
                  onChange={(e) => setEKhataNo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cadastral Survey Number</label>
                <input
                  className="form-input"
                  required
                  placeholder={jurisdictionMeta.surveyPlaceholder}
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsVerifyModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: jurisdictionMeta.badgeColor }}
                  disabled={submitting}
                >
                  {submitting ? 'Signing on Blockchain...' : 'Sign & Endorse Ownership'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Revoke Verification ── */}
      {isRevokeModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileX size={20} color="#b91c1c" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Revoke Cadastral Verification
                </h3>
              </div>
              <button
                onClick={() => setIsRevokeModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Invokes <code style={{ color: '#b91c1c' }}>revokeOwnershipVerification</code>. This delists the asset and blocks any future sale until the dispute is resolved.
            </p>

            <form onSubmit={handleRevoke} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property ID</label>
                <input className="form-input" disabled value={`${selectedProp.id} (${selectedProp.owner})`} />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Revocation / Challenge</label>
                <textarea
                  className="form-input"
                  required
                  rows={3}
                  placeholder="e.g. Boundary dispute reported by neighboring khata holder. Survey pending."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsRevokeModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#b91c1c' }}
                  disabled={submitting}
                >
                  {submitting ? 'Revoking...' : 'Revoke Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Guideline Valuation Update ── */}
      {isValuationModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Revise Govt. Guideline Rate
                </h3>
              </div>
              <button
                onClick={() => setIsValuationModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Invokes <code style={{ color: '#2563eb' }}>updateValuation</code>. Updates the statutory baseline valuation used for stamp duty & tax assessments.
            </p>

            <form onSubmit={handleUpdateValuation} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property ID</label>
                <input className="form-input" disabled value={`${selectedProp.id} — Current Rate: ₹${selectedProp.rawValue}`} />
              </div>

              <div className="form-group">
                <label className="form-label">Revised Guideline Value (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  required
                  placeholder="e.g. 9500000"
                  value={newGuidelineVal}
                  onChange={(e) => setNewGuidelineVal(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gazette / Revision Order Reference</label>
                <input
                  className="form-input"
                  placeholder="e.g. GAZETTE-BLR-2026-VAL-882"
                  value={valRef}
                  onChange={(e) => setValRef(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsValuationModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#2563eb' }}
                  disabled={submitting}
                >
                  {submitting ? 'Updating Valuation...' : 'Commit Revised Valuation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
