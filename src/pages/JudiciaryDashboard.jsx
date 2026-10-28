import React, { useState, useEffect } from 'react';
import {
  Scale,
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Gavel,
  History,
  RefreshCw,
  PlusCircle,
  FileText,
  X,
  AlertOctagon,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function JudiciaryDashboard({ user, setPage }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'frozen' | 'clear'

  // Modal states
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState(null);
  const [caseNo, setCaseNo] = useState('');
  const [courtName, setCourtName] = useState('City Civil Court Bangalore (Court Hall 4)');
  const [freezeRemarks, setFreezeRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txMessage, setTxMessage] = useState(null);

  // Unfreeze modal
  const [isUnfreezeModalOpen, setIsUnfreezeModalOpen] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [unfreezeRemarks, setUnfreezeRemarks] = useState('');

  // History modal
  const [historyProp, setHistoryProp] = useState(null);
  const [fullHistory, setFullHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const records = await BlockchainAPI.queryAllRecords();
      setProperties(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Failed to load judiciary properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleFreeze = async (e) => {
    e.preventDefault();
    if (!selectedProp || !caseNo) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      const remarks = `${freezeRemarks || 'Interim Injunction Order'} | Bench: ${courtName}`;
      await BlockchainAPI.freezeProperty(selectedProp.id, caseNo, remarks);
      setTxMessage({
        type: 'success',
        text: `Judicial Injunction granted! Property ${selectedProp.id} is officially FROZEN under Case ${caseNo}. Title transfers & listings are blocked.`,
      });
      setIsFreezeModalOpen(false);
      setCaseNo('');
      setFreezeRemarks('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Failed to issue stay order: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnfreeze = async (e) => {
    e.preventDefault();
    if (!selectedProp || !orderRef) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      const remarks = unfreezeRemarks || 'Injunction vacated upon final decree';
      await BlockchainAPI.unfreezeProperty(selectedProp.id, orderRef, remarks);
      setTxMessage({
        type: 'success',
        text: `Injunction vacated! Property ${selectedProp.id} unfrozen under ${orderRef}. Restraint order lifted.`,
      });
      setIsUnfreezeModalOpen(false);
      setOrderRef('');
      setUnfreezeRemarks('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Failed to vacate stay: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const inspectHistory = async (prop) => {
    setHistoryProp(prop);
    setLoadingHistory(true);
    try {
      const hist = await BlockchainAPI.getPropertyHistory(prop.id);
      setFullHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      console.error('Failed to load history:', err);
      setFullHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const frozenList = properties.filter((p) => p.frozen === true);
  const totalFrozenVal = frozenList.reduce((sum, p) => sum + (Number(p.rawValue) || 0), 0);

  const filtered = properties.filter((p) => {
    const matchesSearch =
      (p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.owner || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.freezeCaseNo || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'frozen') return matchesSearch && p.frozen === true;
    if (filterType === 'clear') return matchesSearch && p.frozen !== true;
    return matchesSearch;
  });

  return (
    <div className="page-container" style={{ padding: '24px 32px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
          color: '#fff',
          borderRadius: 16,
          padding: '28px 32px',
          marginBottom: 28,
          boxShadow: '0 8px 24px rgba(153, 27, 27, 0.25)',
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
            <Gavel size={30} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700 }}>
                Judiciary & Court Orders Portal
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
                MSP: judiciary-com
              </span>
            </div>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
              Civil Injunctions, Asset Attachments & Title Restraint Orders on Hyperledger Fabric
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
            className="btn"
            style={{ background: '#fff', color: '#991b1b', fontWeight: 600, border: 'none' }}
            onClick={() => {
              setSelectedProp(properties[0] || null);
              setIsFreezeModalOpen(true);
            }}
          >
            <PlusCircle size={15} />
            <span>Issue Court Injunction</span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Court Freezes</span>
            <AlertOctagon size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {frozenList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Restrained under judicial stay orders
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Restrained Assets Valuation</span>
            <Scale size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            ₹{(totalFrozenVal / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Total property valuation in dispute
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Clear Titles (No Injunctions)</span>
            <ShieldCheck size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {properties.length - frozenList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Free from active legal restraints
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6366f1' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Channel Registrations</span>
            <FileText size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {properties.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Properties tracked under jurisdiction
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
                placeholder="Search Property ID, Case No, Owner..."
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
              className={`btn btn-sm ${filterType === 'frozen' ? 'btn-primary' : ''}`}
              onClick={() => setFilterType('frozen')}
            >
              Frozen ({frozenList.length})
            </button>
            <button
              className={`btn btn-sm ${filterType === 'clear' ? 'btn-primary' : ''}`}
              onClick={() => setFilterType('clear')}
            >
              Clear ({properties.length - frozenList.length})
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
                <th style={{ padding: '12px 20px' }}>Judicial Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isFrozen = p.frozen === true;

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
                      {isFrozen ? (
                        <div>
                          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <AlertOctagon size={12} /> Stay Order: {p.freezeCaseNo || 'Active'}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: 4, maxWidth: 220 }}>
                            {p.freezeRemarks || 'Court restraint order'}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={12} /> No Legal Injunction
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        {isFrozen ? (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setSelectedProp(p);
                              setIsUnfreezeModalOpen(true);
                            }}
                          >
                            Vacate Stay
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm"
                            style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
                            onClick={() => {
                              setSelectedProp(p);
                              setIsFreezeModalOpen(true);
                            }}
                          >
                            Issue Injunction
                          </button>
                        )}
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--bg-subtle)' }}
                          onClick={() => inspectHistory(p)}
                          title="Inspect Chain-of-Title Audit Log"
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

      {/* ── MODAL 1: Issue Injunction / Freeze ── */}
      {isFreezeModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Gavel size={20} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Issue Judicial Injunction</h3>
              </div>
              <button
                onClick={() => setIsFreezeModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Invokes <code style={{ color: '#dc2626' }}>freezeProperty</code> under MSP identity{' '}
              <strong>judiciary-com</strong>. The distributed ledger will immediately lock this asset, halting any marketplace listings or sale transfers.
            </p>

            <form onSubmit={handleFreeze} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property to Restrain</label>
                <input
                  className="form-input"
                  disabled
                  value={`${selectedProp.id} — ${selectedProp.title} (${selectedProp.owner})`}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Court Case Number</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. OS-4482/2024 or WP-19022/2024"
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Issuing Bench / Court</label>
                <input
                  className="form-input"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Injunction Order Details / Remarks</label>
                <textarea
                  className="form-input"
                  rows={3}
                  required
                  placeholder="e.g. Interim restraint order granted in civil partition suit. Alienation prohibited."
                  value={freezeRemarks}
                  onChange={(e) => setFreezeRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsFreezeModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#dc2626' }}
                  disabled={submitting}
                >
                  {submitting ? 'Executing Court Order...' : 'Sign & Issue Injunction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Vacate Injunction / Unfreeze ── */}
      {isUnfreezeModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Vacate Judicial Stay Order</h3>
              </div>
              <button
                onClick={() => setIsUnfreezeModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Invokes <code style={{ color: '#059669' }}>unfreezeProperty</code>. Lifting the stay allows the owner to resume normal property operations.
            </p>

            <form onSubmit={handleUnfreeze} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property ID</label>
                <input className="form-input" disabled value={`${selectedProp.id} (Stay: ${selectedProp.freezeCaseNo})`} />
              </div>

              <div className="form-group">
                <label className="form-label">Vacation Decree / Order Reference</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. ORDER-VACATE-4482/2024"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Disposal Remarks</label>
                <input
                  className="form-input"
                  placeholder="e.g. Suit settled out of court / Final decree passed"
                  value={unfreezeRemarks}
                  onChange={(e) => setUnfreezeRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsUnfreezeModalOpen(false)}
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
                  {submitting ? 'Vacating Stay...' : 'Vacate Injunction & Unfreeze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Evidence & History Inspector ── */}
      {historyProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Scale size={20} color="#b91c1c" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Judicial Audit Trail: {historyProp.id}
                </h3>
              </div>
              <button
                onClick={() => setHistoryProp(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <h4 style={{ fontSize: '0.9rem', margin: '0 0 10px', color: 'var(--text-600)' }}>
                Court Orders & Injunction Log (Immutable)
              </h4>
              {historyProp.freezeLog && historyProp.freezeLog.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {historyProp.freezeLog.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'var(--bg-subtle)',
                        borderLeft: `4px solid ${log.action === 'FROZEN' ? '#dc2626' : '#10b981'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: log.action === 'FROZEN' ? '#b91c1c' : '#047857' }}>
                          {log.action} · Case: {log.caseNo || log.orderRef}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{log.date}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', marginBottom: 4 }}>{log.remarks}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        Signer: <code>{log.mspId}</code> | TxID: <code>{(log.txId || '').slice(0, 16)}...</code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
                  No judicial restraint orders on record.
                </p>
              )}

              <h4 style={{ fontSize: '0.9rem', margin: '0 0 10px', color: 'var(--text-600)' }}>
                Chaincode State Transition History
              </h4>
              {loadingHistory ? (
                <p style={{ color: 'var(--text-400)' }}>Fetching cryptographic block history...</p>
              ) : fullHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {fullHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        background: '#f8fafc',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{item.event}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                          By: {item.by} · Tx: <code>{item.txId}</code>
                        </div>
                      </div>
                      <span className="badge badge-subtle">{item.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-400)', fontSize: '0.85rem' }}>No historical state transitions found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
