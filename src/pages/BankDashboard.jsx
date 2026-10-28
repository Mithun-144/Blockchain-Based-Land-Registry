import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Landmark,
  PlusCircle,
  KeyRound,
  History,
  X,
  ExternalLink,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function BankDashboard({ user, setPage }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'encumbered' | 'clear'

  // Modal states
  const [isLienModalOpen, setIsLienModalOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState(null);
  const [loanAccount, setLoanAccount] = useState('');
  const [bankBranch, setBankBranch] = useState('Bangalore Main Branch (SBI-0081)');
  const [lienAmount, setLienAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txMessage, setTxMessage] = useState(null);

  // Release NOC modal
  const [isNocModalOpen, setIsNocModalOpen] = useState(false);
  const [nocRef, setNocRef] = useState('');

  // History modal
  const [historyProp, setHistoryProp] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const records = await BlockchainAPI.queryAllRecords();
      setProperties(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Failed to load bank properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleApplyLien = async (e) => {
    e.preventDefault();
    if (!selectedProp || !loanAccount) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      const remarks = `SBI Home Loan A/C #${loanAccount} | Branch: ${bankBranch} | Lien: ₹${Number(lienAmount || selectedProp.rawValue).toLocaleString('en-IN')}`;
      const res = await BlockchainAPI.setEncumbranceStatus(
        selectedProp.id,
        true,
        remarks,
        'BANK_MORTGAGE'
      );
      setTxMessage({
        type: 'success',
        text: `Lien placed successfully on ${selectedProp.id}! SBI mortgage is active on the distributed ledger.`,
      });
      setIsLienModalOpen(false);
      setLoanAccount('');
      setLienAmount('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Failed to place lien: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseLien = async (e) => {
    e.preventDefault();
    if (!selectedProp) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      const remarks = `NOC Issued - Loan Closed per Ref: ${nocRef || 'NOC-SBI-' + Math.floor(1000 + Math.random() * 9000)}`;
      await BlockchainAPI.setEncumbranceStatus(
        selectedProp.id,
        false,
        remarks,
        'NONE'
      );
      setTxMessage({
        type: 'success',
        text: `NOC Issued! Lien cleared for ${selectedProp.id}. Property is now free from encumbrance.`,
      });
      setIsNocModalOpen(false);
      setNocRef('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Failed to clear lien: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const encumberedList = properties.filter((p) => p.encumbrance === true);
  const totalEncumberedVal = encumberedList.reduce((sum, p) => sum + (Number(p.rawValue) || 0), 0);

  const filtered = properties.filter((p) => {
    const matchesSearch =
      (p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.owner || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'encumbered') return matchesSearch && p.encumbrance === true;
    if (filterType === 'clear') return matchesSearch && p.encumbrance !== true;
    return matchesSearch;
  });

  return (
    <div className="page-container" style={{ padding: '24px 32px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
          color: '#fff',
          borderRadius: 16,
          padding: '28px 32px',
          marginBottom: 28,
          boxShadow: '0 8px 24px rgba(3, 105, 161, 0.2)',
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
            <Landmark size={30} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700 }}>
                SBI Institutional Mortgage Portal
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
                MSP: bank-com
              </span>
            </div>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
              Authoritative Bank Peer for CERSAI Lien Endorsement & Mortgage Tracking on channel1
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
            <span>Refresh Ledger</span>
          </button>
          <button
            className="btn btn-primary"
            style={{ background: '#fff', color: '#0369a1', fontWeight: 600 }}
            onClick={() => {
              setSelectedProp(properties[0] || null);
              setIsLienModalOpen(true);
            }}
          >
            <PlusCircle size={15} />
            <span>Record New Mortgage</span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Mortgaged Assets</span>
            <ShieldAlert size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {encumberedList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Lien Active (Sale & Transfer Gated)
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Encumbered Collateral</span>
            <Landmark size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            ₹{(totalEncumberedVal / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Across all active loan accounts
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Clear / Eligible Properties</span>
            <ShieldCheck size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {properties.length - encumberedList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Available for mortgage disbursement
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6366f1' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Ledger Registrations</span>
            <Building2 size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {properties.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Synchronized on channel1
          </div>
        </div>
      </div>

      {/* Table & Controls Section */}
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
                placeholder="Search Property ID, Title, or Owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({properties.length})
            </button>
            <button
              className={`btn btn-sm ${filterType === 'encumbered' ? 'btn-primary' : ''}`}
              onClick={() => setFilterType('encumbered')}
            >
              Mortgaged ({encumberedList.length})
            </button>
            <button
              className={`btn btn-sm ${filterType === 'clear' ? 'btn-primary' : ''}`}
              onClick={() => setFilterType('clear')}
            >
              Clear ({properties.length - encumberedList.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-400)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px' }}>Property ID</th>
                <th style={{ padding: '12px 20px' }}>Asset Details</th>
                <th style={{ padding: '12px 20px' }}>Owner</th>
                <th style={{ padding: '12px 20px' }}>Valuation</th>
                <th style={{ padding: '12px 20px' }}>Mortgage / Lien Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isEnc = p.encumbrance === true;
                const isBankLien = p.encumbranceType === 'BANK_MORTGAGE';
                const isCourtFrozen = p.frozen === true || p.encumbranceType === 'COURT_ORDER';

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-900)' }}>
                      {p.id}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{p.address}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem' }}>{p.owner}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-400)', textTransform: 'capitalize' }}>
                        {p.jurisdiction} Authority
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                      {p.value || `₹${(p.rawValue || 0).toLocaleString('en-IN')}`}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {isCourtFrozen ? (
                        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <XCircle size={12} /> Court Injunction ({p.freezeCaseNo || 'Frozen'})
                        </span>
                      ) : isEnc ? (
                        <div>
                          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <AlertTriangle size={12} /> Bank Lien Active
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: 4, maxWidth: 220 }}>
                            {p.encumbranceRemarks || 'Mortgaged'}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={12} /> Clear Title
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        {isEnc ? (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setSelectedProp(p);
                              setIsNocModalOpen(true);
                            }}
                            title="Release mortgage lien upon settlement"
                          >
                            Issue NOC
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedProp(p);
                              setIsLienModalOpen(true);
                            }}
                          >
                            Flag Lien
                          </button>
                        )}
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--bg-subtle)' }}
                          onClick={() => setHistoryProp(p)}
                          title="View Encumbrance Log"
                        >
                          <History size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-400)' }}>
                    No properties match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: Flag Lien Modal ── */}
      {isLienModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Landmark size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Record Mortgage Lien</h3>
              </div>
              <button
                onClick={() => setIsLienModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Invokes <code style={{ color: '#0284c7' }}>setEncumbranceStatus</code> on channel1 under MSP identity{' '}
              <strong>bank-com</strong>. This cryptographically prevents the owner from listing or transferring the property until cleared.
            </p>

            <form onSubmit={handleApplyLien} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Selected Property</label>
                <input
                  className="form-input"
                  disabled
                  value={`${selectedProp.id} — ${selectedProp.title} (${selectedProp.value || '₹' + selectedProp.rawValue})`}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Loan Account Number</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. SBI-HL-9920193"
                  value={loanAccount}
                  onChange={(e) => setLoanAccount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sanctioned Lien Amount (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder={`Default: ₹${selectedProp.rawValue}`}
                  value={lienAmount}
                  onChange={(e) => setLienAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bank Branch / Division</label>
                <input
                  className="form-input"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsLienModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#0284c7' }}
                  disabled={submitting}
                >
                  {submitting ? 'Signing on Blockchain...' : 'Commit Mortgage Lien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Issue NOC / Release Lien ── */}
      {isNocModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Issue Bank NOC & Clear Lien</h3>
              </div>
              <button
                onClick={() => setIsNocModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Verify full loan closure and issue a Non-Objection Certificate. This removes the encumbrance lock on{' '}
              <strong>{selectedProp.id}</strong> on the distributed ledger.
            </p>

            <form onSubmit={handleReleaseLien} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property ID</label>
                <input className="form-input" disabled value={selectedProp.id} />
              </div>

              <div className="form-group">
                <label className="form-label">NOC Certificate Reference</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. NOC-SBI-2024-8841"
                  value={nocRef}
                  onChange={(e) => setNocRef(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsNocModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#059669' }}
                  disabled={submitting}
                >
                  {submitting ? 'Signing NOC...' : 'Release Lien & Issue NOC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Audit Trail Inspector ── */}
      {historyProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={20} color="#6366f1" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Encumbrance Audit Trail: {historyProp.id}
                </h3>
              </div>
              <button
                onClick={() => setHistoryProp(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {historyProp.encumbranceLog && historyProp.encumbranceLog.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {historyProp.encumbranceLog.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        background: 'var(--bg-subtle)',
                        borderLeft: `4px solid ${log.action === 'FLAGGED' ? '#ef4444' : '#10b981'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: log.action === 'FLAGGED' ? '#b91c1c' : '#047857',
                            fontSize: '0.85rem',
                          }}
                        >
                          {log.action} · {log.type}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{log.date}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>{log.remarks}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        Signer MSP: <code>{log.mspId}</code> | TxID:{' '}
                        <code title={log.txId}>{(log.txId || '').slice(0, 16)}...</code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-400)' }}>
                  No historical encumbrances recorded for this property yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
