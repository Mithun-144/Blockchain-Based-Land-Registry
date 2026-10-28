import React, { useState, useEffect } from 'react';
import {
  Landmark,
  FileCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calculator,
  History,
  Layers,
  Shield,
  FileText,
  DollarSign,
  X,
  ExternalLink,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function SroDashboard({ user, setPage }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Duty Calculator modal
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcValue, setCalcValue] = useState('10000000');
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Deed Inspector modal
  const [inspectProp, setInspectProp] = useState(null);
  const [chainHistory, setChainHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const records = await BlockchainAPI.queryAllRecords();
      setProperties(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Failed to load SRO records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCalculateDuty = async (val) => {
    setCalcLoading(true);
    try {
      const res = await BlockchainAPI.calculateStampDuty(val || calcValue);
      setCalcResult(res);
    } catch (err) {
      console.error('Calc error:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  const openInspector = async (prop) => {
    setInspectProp(prop);
    setLoadingHistory(true);
    try {
      const hist = await BlockchainAPI.getPropertyHistory(prop.id);
      setChainHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setChainHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Metrics
  const totalStampDutyCollected = properties.reduce(
    (sum, p) => sum + (Number(p.stampDuty) || Math.round((Number(p.rawValue) || 0) * 0.05)),
    0
  );
  const totalRegFeeCollected = properties.reduce(
    (sum, p) => sum + (Number(p.registrationFee) || Math.round((Number(p.rawValue) || 0) * 0.01)),
    0
  );
  const encumberedCount = properties.filter((p) => p.encumbrance === true).length;
  const frozenCount = properties.filter((p) => p.frozen === true).length;

  const filtered = properties.filter((p) => {
    const matches =
      (p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.owner || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.jurisdiction || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'for_sale') return matches && p.listedForSale === true;
    if (statusFilter === 'encumbered') return matches && p.encumbrance === true;
    if (statusFilter === 'frozen') return matches && p.frozen === true;
    return matches;
  });

  return (
    <div className="page-container" style={{ padding: '24px 32px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)',
          color: '#fff',
          borderRadius: 16,
          padding: '28px 32px',
          marginBottom: 28,
          boxShadow: '0 8px 24px rgba(67, 56, 202, 0.25)',
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
                Sub-Registrar Office (SRO) Portal
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
                MSP: sro-com
              </span>
            </div>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
              Statutory Deed Registration, Stamp Duty Assessment & Master Ledger Explorer on channel1
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
          <button
            className="btn"
            style={{ background: '#fff', color: '#4338ca', fontWeight: 600, border: 'none' }}
            onClick={() => {
              handleCalculateDuty('10000000');
              setIsCalcOpen(true);
            }}
          >
            <Calculator size={15} />
            <span>Duty Calculator</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4f46e5' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Stamp Duty Revenue</span>
            <DollarSign size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            ₹{(totalStampDutyCollected / 100000).toFixed(2)} Lakh
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Statutory 5% Stamp Duty on ledger
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Registration Fee Collected</span>
            <FileCheck size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            ₹{(totalRegFeeCollected / 100000).toFixed(2)} Lakh
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Statutory 1% SRO Registration Fee
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Mortgages / Liens</span>
            <AlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {encumberedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Reported by Bank / Judiciary
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Court Stay Injunctions</span>
            <Shield size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {frozenCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Restrained by Judicial Order
          </div>
        </div>
      </div>

      {/* Ledger Table */}
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
                placeholder="Search All Registered Deeds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Records ({properties.length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'for_sale' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('for_sale')}
            >
              Marketplace ({properties.filter((p) => p.listedForSale).length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'encumbered' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('encumbered')}
            >
              Encumbered ({encumberedCount})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'frozen' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('frozen')}
            >
              Injunctions ({frozenCount})
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-400)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px' }}>Deed ID</th>
                <th style={{ padding: '12px 20px' }}>Property & Cadastral Record</th>
                <th style={{ padding: '12px 20px' }}>Registered Owner</th>
                <th style={{ padding: '12px 20px' }}>Stamp Duty (5%)</th>
                <th style={{ padding: '12px 20px' }}>Reg Fee (1%)</th>
                <th style={{ padding: '12px 20px' }}>Clearance & Encumbrance</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Deed Inspector</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const duty = p.stampDuty || Math.round((p.rawValue || 0) * 0.05);
                const regFee = p.registrationFee || Math.round((p.rawValue || 0) * 0.01);

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-900)' }}>
                      {p.id}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        Block: #{p.blockNumber || 104}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
                        Khata: {p.eKhataNo || 'PENDING'} · Survey: {p.surveyNumber || 'PENDING'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#4f46e5', textTransform: 'capitalize', marginTop: 2 }}>
                        {p.jurisdiction} jurisdiction
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem' }}>{p.owner}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        Registered: {p.regDate || '2023-01-15'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#4338ca' }}>
                      ₹{duty.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#059669' }}>
                      ₹{regFee.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {p.frozen ? (
                        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <XCircle size={12} /> Stay Order ({p.freezeCaseNo || 'Court'})
                        </span>
                      ) : p.encumbrance ? (
                        <div>
                          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <AlertTriangle size={12} /> {p.encumbranceType || 'Lien Active'}
                          </span>
                        </div>
                      ) : (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={12} /> SRO Cleared
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openInspector(p)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <History size={13} />
                        <span>Inspect Deed</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-400)' }}>
                    No deed records match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: Stamp Duty Calculator ── */}
      {isCalcOpen && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calculator size={20} color="#4338ca" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Statutory Duty & Fee Calculator
                </h3>
              </div>
              <button onClick={() => setIsCalcOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Calculates SRO duties via smart contract function <code style={{ color: '#4338ca' }}>calculateStampDuty</code>.
            </p>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Property Consideration / Market Value (₹)</label>
              <input
                className="form-input"
                type="number"
                value={calcValue}
                onChange={(e) => {
                  setCalcValue(e.target.value);
                  handleCalculateDuty(e.target.value);
                }}
              />
            </div>

            {calcResult && (
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: 18, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-600)' }}>Stamp Duty (5%):</span>
                  <span style={{ fontWeight: 700, color: '#4338ca' }}>
                    {calcResult.stampDutyFormatted || `₹${(calcResult.stampDuty || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-600)' }}>Registration Fee (1%):</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>
                    {calcResult.registrationFeeFormatted || `₹${(calcResult.registrationFee || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Total Govt. Duties Payable:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-900)' }}>
                    {calcResult.totalDutiesFormatted || `₹${(calcResult.totalDuties || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            )}

            <button className="btn btn-primary w-full" onClick={() => setIsCalcOpen(false)}>
              Close Calculator
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Deed & Chain-of-Title Inspector ── */}
      {inspectProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={20} color="#4338ca" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Chain-of-Title Deed Audit: {inspectProp.id}
                </h3>
              </div>
              <button onClick={() => setInspectProp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <div style={{ padding: 14, borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{inspectProp.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-600)', marginBottom: 8 }}>{inspectProp.address}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.78rem' }}>
                  <div>Current Owner: <strong>{inspectProp.owner}</strong></div>
                  <div>Assessed Rate: <strong>{inspectProp.value || '₹' + inspectProp.rawValue}</strong></div>
                  <div>Cadastral Survey: <strong>{inspectProp.surveyNumber || 'PENDING'}</strong></div>
                  <div>e-Khata Number: <strong>{inspectProp.eKhataNo || 'PENDING'}</strong></div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', margin: '0 0 10px', color: 'var(--text-600)' }}>
                Immutable Transfer History (Deed Transfers)
              </h4>
              {inspectProp.transferHistory && inspectProp.transferHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {inspectProp.transferHistory.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'var(--bg-subtle)',
                        borderLeft: '4px solid #4338ca',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: '#4338ca' }}>
                          Deed Transfer: {t.from} ➔ {t.to}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{t.date}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-600)', marginBottom: 4 }}>
                        Challan Reference: <code>{t.paymentRef}</code> | Consideration: ₹{(t.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        TxID: <code>{(t.txId || '').slice(0, 20)}...</code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
                  Initial allotment deed on record. No subsequent sale transfers executed yet.
                </p>
              )}

              <h4 style={{ fontSize: '0.9rem', margin: '0 0 10px', color: 'var(--text-600)' }}>
                Cryptographic Block State Transitions
              </h4>
              {loadingHistory ? (
                <p style={{ color: 'var(--text-400)' }}>Loading history from peers...</p>
              ) : chainHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chainHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        background: '#fff',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{item.event}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                          Committer: {item.by} · Tx: <code>{item.txId}</code>
                        </div>
                      </div>
                      <span className="badge badge-subtle">{item.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-400)', fontSize: '0.85rem' }}>No history records found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
