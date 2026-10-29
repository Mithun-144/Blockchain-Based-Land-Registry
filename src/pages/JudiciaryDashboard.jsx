import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  Check,
  ArrowUpDown,
  Building,
  Info,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function JudiciaryDashboard({ user, setPage }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('docket'); // 'docket' | 'registry' | 'forensic'

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'frozen' | 'clear'
  const [sortBy, setSortBy] = useState('id'); // 'id' | 'value' | 'title'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Modals state
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [isUnfreezeModalOpen, setIsUnfreezeModalOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState(null);
  const [historyProp, setHistoryProp] = useState(null);
  const [fullHistory, setFullHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states for Freeze / Injunction
  const [caseNo, setCaseNo] = useState('');
  const [courtName, setCourtName] = useState('City Civil Court Bangalore (Court Hall 4)');
  const [injunctionCategory, setInjunctionCategory] = useState('Interim Injunction (Order 39 Rule 1 & 2 CPC)');
  const [freezeRemarks, setFreezeRemarks] = useState('');

  // Form states for Unfreeze / Vacation
  const [orderRef, setOrderRef] = useState('');
  const [vacationReason, setVacationReason] = useState('Final Decree Passed');
  const [unfreezeRemarks, setUnfreezeRemarks] = useState('');

  // Forensic search target
  const [forensicTargetId, setForensicTargetId] = useState('');
  const [forensicProp, setForensicProp] = useState(null);

  // UI feedback & tx status
  const [submitting, setSubmitting] = useState(false);
  const [txMessage, setTxMessage] = useState(null);
  const [copiedTxId, setCopiedTxId] = useState(null);

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

  const frozenList = useMemo(
    () => properties.filter((p) => p.frozen === true),
    [properties]
  );
  const totalFrozenVal = useMemo(
    () => frozenList.reduce((sum, p) => sum + (Number(p.rawValue) || 0), 0),
    [frozenList]
  );
  const clearList = useMemo(
    () => properties.filter((p) => p.frozen !== true),
    [properties]
  );

  const displayedProperties = useMemo(() => {
    let list = [...properties];

    if (activeTab === 'docket') {
      list = list.filter((p) => p.frozen === true);
    } else {
      if (filterType === 'frozen') list = list.filter((p) => p.frozen === true);
      if (filterType === 'clear') list = list.filter((p) => p.frozen !== true);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.id || '').toLowerCase().includes(q) ||
          (p.title || '').toLowerCase().includes(q) ||
          (p.owner || '').toLowerCase().includes(q) ||
          (p.freezeCaseNo || '').toLowerCase().includes(q) ||
          (p.freezeRemarks || '').toLowerCase().includes(q) ||
          (p.address || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'id') comparison = (a.id || '').localeCompare(b.id || '');
      else if (sortBy === 'title') comparison = (a.title || '').localeCompare(b.title || '');
      else if (sortBy === 'value') comparison = (Number(a.rawValue) || 0) - (Number(b.rawValue) || 0);

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [properties, activeTab, filterType, searchTerm, sortBy, sortOrder]);

  const handleFreeze = async (e) => {
    e.preventDefault();
    if (!selectedProp || !caseNo.trim()) return;

    setSubmitting(true);
    setTxMessage(null);
    try {
      const formattedRemarks = `[${injunctionCategory}] ${freezeRemarks || 'Civil stay order against alienation'} | Bench: ${courtName}`;
      await BlockchainAPI.freezeProperty(selectedProp.id, caseNo.trim(), formattedRemarks);

      setTxMessage({
        type: 'success',
        text: `Judicial Injunction granted! Property ${selectedProp.id} is officially FROZEN under Case ${caseNo}. Marketplace listings & title transfers are restrained.`,
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
    if (!selectedProp || !orderRef.trim()) return;

    setSubmitting(true);
    setTxMessage(null);
    try {
      const formattedRemarks = `[${vacationReason}] ${unfreezeRemarks || 'Injunction vacated upon final decree / settlement'}`;
      await BlockchainAPI.unfreezeProperty(selectedProp.id, orderRef.trim(), formattedRemarks);

      setTxMessage({
        type: 'success',
        text: `Injunction vacated! Property ${selectedProp.id} unfrozen under Order Ref ${orderRef}. Restraint order lifted on channel1.`,
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

  const handleInspectForensic = async (propId) => {
    const id = propId || forensicTargetId;
    if (!id) return;
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;
    setForensicProp(prop);
    setLoadingHistory(true);
    try {
      const hist = await BlockchainAPI.getPropertyHistory(prop.id);
      setFullHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      console.error('Failed to load forensic history:', err);
      setFullHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedTxId(text);
    setTimeout(() => setCopiedTxId(null), 2500);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px 32px' }}>
      {/* ── Institution Header Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
          color: '#fff',
          borderRadius: 16,
          padding: '26px 30px',
          marginBottom: 24,
          boxShadow: '0 8px 24px rgba(153, 27, 27, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Gavel size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                Judiciary & Court Orders Portal
              </h1>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.22)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                MSP: judiciary-com
              </span>
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }} />
                Peer: peer1.judiciary.com (channel1)
              </span>
            </div>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.875rem' }}>
              Civil Injunctions, Asset Attachments, Title Restraints, and Decrees on Hyperledger Fabric
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn"
            onClick={fetchProperties}
            style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: 'none' }}
            title="Reload World State from Fabric channel"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh Ledger</span>
          </button>
          <button
            className="btn"
            style={{ background: '#fff', color: '#991b1b', fontWeight: 600, border: 'none' }}
            onClick={() => {
              const eligible = properties.find((p) => !p.frozen) || properties[0] || null;
              setSelectedProp(eligible);
              setIsFreezeModalOpen(true);
            }}
          >
            <PlusCircle size={15} />
            <span>Issue Court Injunction</span>
          </button>
        </div>
      </div>

      {/* ── Transaction Feedback Alert ── */}
      {txMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            marginBottom: 20,
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
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{txMessage.text}</span>
          </div>
          <button
            onClick={() => setTxMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Interactive Metric Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          className="stat-card"
          onClick={() => {
            setActiveTab('docket');
            setFilterType('all');
          }}
          style={{
            cursor: 'pointer',
            border: activeTab === 'docket' ? '2px solid #dc2626' : '1px solid var(--border)',
            transition: 'var(--ease)',
          }}
        >
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

        <div
          className="stat-card"
          onClick={() => {
            setActiveTab('registry');
            setFilterType('clear');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Clear Titles (No Injunctions)</span>
            <ShieldCheck size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {clearList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Free from active legal restraints
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => {
            setActiveTab('registry');
            setFilterType('all');
          }}
          style={{ cursor: 'pointer' }}
        >
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

      {/* ── Navigation Tabs ── */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab ${activeTab === 'docket' ? 'active' : ''}`}
          onClick={() => setActiveTab('docket')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertOctagon size={16} />
            <span>Restrained Asset Docket ({frozenList.length})</span>
          </span>
        </button>

        <button
          className={`tab ${activeTab === 'registry' ? 'active' : ''}`}
          onClick={() => setActiveTab('registry')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={16} />
            <span>Master Jurisdictional Registry ({properties.length})</span>
          </span>
        </button>

        <button
          className={`tab ${activeTab === 'forensic' ? 'active' : ''}`}
          onClick={() => setActiveTab('forensic')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={16} />
            <span>Forensic Evidence & Chain-of-Title</span>
          </span>
        </button>
      </div>

      {/* ── TAB 1 & 2: Table Views ── */}
      {(activeTab === 'docket' || activeTab === 'registry') && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Controls Bar */}
          <div
            style={{
              padding: '16px 22px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }}
                />
                <input
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="Search Property ID, Case No, Owner, or Grounds..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {activeTab === 'registry' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterType('all')}
                >
                  All ({properties.length})
                </button>
                <button
                  className={`btn btn-sm ${filterType === 'frozen' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterType('frozen')}
                >
                  Frozen / Stayed ({frozenList.length})
                </button>
                <button
                  className={`btn btn-sm ${filterType === 'clear' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterType('clear')}
                >
                  Clear ({clearList.length})
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-500)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 18px', cursor: 'pointer' }} onClick={() => toggleSort('id')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Property ID</span>
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th style={{ padding: '12px 18px', cursor: 'pointer' }} onClick={() => toggleSort('title')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Asset & Location</span>
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th style={{ padding: '12px 18px' }}>Owner / Defendant</th>
                  <th style={{ padding: '12px 18px', cursor: 'pointer' }} onClick={() => toggleSort('value')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Valuation</span>
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th style={{ padding: '12px 18px' }}>Judicial Status & Order</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProperties.map((p) => {
                  const isFrozen = p.frozen === true;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-900)' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{p.id}</span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{p.address}</div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.owner}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', textTransform: 'capitalize' }}>
                          {p.jurisdiction || 'Urban'} Jurisdiction
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                        {p.value || `₹${(p.rawValue || 0).toLocaleString('en-IN')}`}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {isFrozen ? (
                          <div>
                            <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <AlertOctagon size={12} /> Stay Order: {p.freezeCaseNo || 'Active'}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: 4, maxWidth: 240 }}>
                              {p.freezeRemarks || 'Court restraint order active'}
                            </div>
                          </div>
                        ) : (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle2 size={12} /> No Legal Injunction
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {isFrozen ? (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                setSelectedProp(p);
                                setIsUnfreezeModalOpen(true);
                              }}
                              title="Vacate injunction upon decree or settlement"
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
                              title="Issue judicial stay order"
                            >
                              Issue Injunction
                            </button>
                          )}

                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--bg-subtle)' }}
                            onClick={() => {
                              setActiveTab('forensic');
                              setForensicTargetId(p.id);
                              handleInspectForensic(p.id);
                            }}
                            title="Inspect Chain-of-Title Audit"
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayedProperties.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-400)' }}>
                      No properties found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Forensic Chain-of-Title & Evidence Hub ── */}
      {activeTab === 'forensic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Selector Card */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 26px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 600 }}>
              Judicial Forensic Evidence & Chain-of-Title Inspector
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: 'var(--text-400)' }}>
              Verifies immutable cryptographic state transitions on Hyperledger Fabric <code style={{ color: '#991b1b' }}>channel1</code> to
              reconstruct complete title provenance for litigation proceedings.
            </p>

            <div style={{ display: 'flex', gap: 10, maxWidth: 540 }}>
              <select
                className="form-input"
                style={{ flex: 1 }}
                value={forensicTargetId}
                onChange={(e) => setForensicTargetId(e.target.value)}
              >
                <option value="">-- Select Property for Forensic Inspection --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.title} ({p.owner}) {p.frozen ? '[FROZEN]' : ''}
                  </option>
                ))}
              </select>

              <button
                className="btn btn-primary"
                style={{ background: '#991b1b' }}
                onClick={() => handleInspectForensic(forensicTargetId)}
                disabled={!forensicTargetId || loadingHistory}
              >
                {loadingHistory ? <RefreshCw size={15} className="spin" /> : <History size={15} />}
                <span>Inspect Evidence</span>
              </button>
            </div>
          </div>

          {/* Forensic Evidence Detail */}
          {forensicProp && (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid var(--border)',
                padding: '28px 32px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid var(--border)',
                  paddingBottom: 16,
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: forensicProp.frozen ? '#dc2626' : '#059669',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Forensic Chain-of-Title Audit Dossier
                  </span>
                  <h2 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 700 }}>
                    {forensicProp.id} — {forensicProp.title}
                  </h2>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-400)' }}>Current Status:</div>
                  <div style={{ fontWeight: 600 }}>
                    {forensicProp.frozen ? (
                      <span className="badge badge-red">FROZEN (Stay: {forensicProp.freezeCaseNo})</span>
                    ) : (
                      <span className="badge badge-green">NO ACTIVE INJUNCTION</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Asset Snapshot Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
                  background: 'var(--bg-subtle)',
                  padding: 18,
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>Registered Owner</div>
                  <div style={{ fontWeight: 600 }}>{forensicProp.owner}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>Valuation</div>
                  <div style={{ fontWeight: 600 }}>{forensicProp.value || '₹' + forensicProp.rawValue}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>Cadastral Status</div>
                  <div style={{ fontWeight: 600 }}>
                    {forensicProp.ownershipVerified ? 'Verified by Local Authority' : 'Pending Verification'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>Location</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{forensicProp.address}</div>
                </div>
              </div>

              {/* Court Orders & Injunction Log */}
              <div style={{ marginBottom: 28 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, color: '#991b1b' }}>
                  Court Orders & Injunction Trail (Immutable Ledger Log)
                </h4>

                {forensicProp.freezeLog && forensicProp.freezeLog.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {forensicProp.freezeLog.map((log, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          background: 'var(--bg-subtle)',
                          borderLeft: `4px solid ${log.action === 'FROZEN' ? '#dc2626' : '#10b981'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: log.action === 'FROZEN' ? '#b91c1c' : '#047857',
                              fontSize: '0.875rem',
                            }}
                          >
                            {log.action} · Case: {log.caseNo || log.orderRef}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{log.date}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>{log.remarks}</div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-500)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <span>
                            Signer: <code>{log.mspId}</code>
                          </span>
                          <span>·</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            TxID: <code>{(log.txId || '').slice(0, 16)}...</code>
                            <button
                              onClick={() => handleCopy(log.txId)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              title="Copy Transaction ID"
                            >
                              {copiedTxId === log.txId ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                            </button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-400)', fontSize: '0.85rem' }}>
                    No judicial restraint orders or stay vacations recorded against this title.
                  </p>
                )}
              </div>

              {/* Fabric State Transition History */}
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600 }}>
                  Cryptographic State Transition Provenance
                </h4>

                {fullHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {fullHistory.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          background: '#f8fafc',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.event}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-500)' }}>
                            Committer: <strong>{item.by}</strong> · Block: <code>{item.block}</code>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                            {item.date}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <code style={{ fontSize: '0.72rem' }}>{item.txId}</code>
                            <button
                              onClick={() => handleCopy(item.txId)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              title="Copy Transaction ID"
                            >
                              {copiedTxId === item.txId ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                            </button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-400)', fontSize: '0.85rem' }}>
                    No historical block state transitions retrieved.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: Issue Injunction / Freeze ── */}
      {isFreezeModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 520 }}>
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

            {/* High-gravity warning callout */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.85rem',
                marginBottom: 16,
                display: 'flex',
                gap: 10,
              }}
            >
              <AlertOctagon size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>High-Gravity Restraint Order:</strong> Freezing this asset on <code>channel1</code> halts all
                subsequent sale listings, title conveyances, and mortgage disbursements across all 7 participating organizations.
              </div>
            </div>

            <form onSubmit={handleFreeze} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property to Restrain</label>
                <select
                  className="form-input"
                  value={selectedProp.id}
                  onChange={(e) => {
                    const match = properties.find((p) => p.id === e.target.value);
                    if (match) setSelectedProp(match);
                  }}
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.title} ({p.owner}) {p.frozen ? '[ALREADY FROZEN]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Injunction Legal Category</label>
                <select
                  className="form-input"
                  value={injunctionCategory}
                  onChange={(e) => setInjunctionCategory(e.target.value)}
                >
                  <option value="Interim Injunction (Order 39 Rule 1 & 2 CPC)">
                    Interim Injunction (Order 39 Rule 1 & 2 CPC)
                  </option>
                  <option value="Status Quo Order">Status Quo Order</option>
                  <option value="Attachment Before Judgment (Order 38 Rule 5 CPC)">
                    Attachment Before Judgment (Order 38 Rule 5 CPC)
                  </option>
                  <option value="Lis Pendens Restraint (Section 52 TPA)">
                    Lis Pendens Restraint (Section 52 TPA)
                  </option>
                  <option value="Recovery / Execution Injunction (DRT Order)">
                    Recovery / Execution Injunction (DRT Order)
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Court Case Number</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. OS-4482/2026 or WP-19022/2026"
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Issuing Bench / Court Hall</label>
                <input
                  className="form-input"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Injunction Order Details / Grounds</label>
                <textarea
                  className="form-input"
                  rows={3}
                  required
                  placeholder="e.g. Interim restraint order granted in civil partition suit. Alienation prohibited pending disposal."
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
                  disabled={submitting || selectedProp.frozen}
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
          <div className="modal-content animate-in" style={{ maxWidth: 500 }}>
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

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 18 }}>
              Lifting the injunction restores property state to <code>frozen: false</code> on the distributed ledger.
              The owner will be permitted to resume marketplace operations and deed transfers.
            </p>

            <form onSubmit={handleUnfreeze} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property & Case Reference</label>
                <input
                  className="form-input"
                  disabled
                  value={`${selectedProp.id} (Active Stay: ${selectedProp.freezeCaseNo || 'Litigation'})`}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Disposal / Vacation Reason</label>
                <select
                  className="form-input"
                  value={vacationReason}
                  onChange={(e) => setVacationReason(e.target.value)}
                >
                  <option value="Final Decree Passed">Final Decree Passed</option>
                  <option value="Suit Dismissed / Abated">Suit Dismissed / Abated</option>
                  <option value="Compromise / Out-of-Court Settlement">
                    Compromise / Out-of-Court Settlement
                  </option>
                  <option value="Interlocutory Injunction Vacated">Interlocutory Injunction Vacated</option>
                  <option value="Appeal Allowed / Stay Set Aside">Appeal Allowed / Stay Set Aside</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vacation Decree / Order Reference</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. ORDER-VACATE-4482/2026"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Disposal Remarks</label>
                <input
                  className="form-input"
                  placeholder="e.g. Injunction vacated pursuant to compromise deed recorded before Lok Adalat"
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

      {/* ── MODAL 3: Audit Trail Inspector ── */}
      {historyProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 660 }}>
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
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-500)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <span>
                          Signer: <code>{log.mspId}</code>
                        </span>
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          TxID: <code>{(log.txId || '').slice(0, 16)}...</code>
                          <button
                            onClick={() => handleCopy(log.txId)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Copy Transaction ID"
                          >
                            {copiedTxId === log.txId ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                          </button>
                        </span>
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
                      <span className="badge badge-neutral">{item.date}</span>
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
