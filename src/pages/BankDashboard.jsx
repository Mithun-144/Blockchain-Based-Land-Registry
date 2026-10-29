import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  History,
  X,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  FileSearch,
  Building,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function BankDashboard({ user, setPage }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mortgages'); // 'mortgages' | 'registry' | 'ec_search'

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'encumbered' | 'clear' | 'frozen'
  const [sortBy, setSortBy] = useState('id'); // 'id' | 'value' | 'title'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Modals state
  const [isLienModalOpen, setIsLienModalOpen] = useState(false);
  const [isNocModalOpen, setIsNocModalOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState(null);
  const [historyProp, setHistoryProp] = useState(null);

  // Form states for Lien
  const [loanAccount, setLoanAccount] = useState('');
  const [bankBranch, setBankBranch] = useState('Bangalore Main Branch (SBI-0081)');
  const [lienAmount, setLienAmount] = useState('');
  const [loanRemarks, setLoanRemarks] = useState('');

  // Form states for NOC
  const [nocRef, setNocRef] = useState('');
  const [checklist, setChecklist] = useState({
    debtCleared: true,
    chargesPaid: true,
    vaultRetrieved: true,
  });

  // State for EC search tool
  const [ecTargetId, setEcTargetId] = useState('');
  const [ecResult, setEcResult] = useState(null);
  const [ecLoading, setEcLoading] = useState(false);

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
      console.error('Failed to load properties for Bank dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Filtered properties
  const encumberedList = useMemo(
    () => properties.filter((p) => p.encumbrance === true),
    [properties]
  );
  const totalEncumberedVal = useMemo(
    () => encumberedList.reduce((sum, p) => sum + (Number(p.rawValue) || 0), 0),
    [encumberedList]
  );
  const courtRestrainedList = useMemo(
    () => properties.filter((p) => p.frozen === true),
    [properties]
  );
  const clearList = useMemo(
    () => properties.filter((p) => p.encumbrance !== true && p.frozen !== true),
    [properties]
  );

  const displayedProperties = useMemo(() => {
    let list = [...properties];

    if (activeTab === 'mortgages') {
      list = list.filter((p) => p.encumbrance === true);
    } else {
      if (filterType === 'encumbered') list = list.filter((p) => p.encumbrance === true);
      if (filterType === 'clear') list = list.filter((p) => p.encumbrance !== true && p.frozen !== true);
      if (filterType === 'frozen') list = list.filter((p) => p.frozen === true);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.id || '').toLowerCase().includes(q) ||
          (p.title || '').toLowerCase().includes(q) ||
          (p.owner || '').toLowerCase().includes(q) ||
          (p.address || '').toLowerCase().includes(q) ||
          (p.encumbranceRemarks || '').toLowerCase().includes(q)
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

  const handleApplyLien = async (e) => {
    e.preventDefault();
    if (!selectedProp || !loanAccount) return;

    if (selectedProp.frozen) {
      setTxMessage({
        type: 'error',
        text: `Cannot place mortgage on ${selectedProp.id}: This property is currently FROZEN under Court Order (${selectedProp.freezeCaseNo || 'Litigation'}). Financial liens cannot be recorded.`,
      });
      return;
    }

    setSubmitting(true);
    setTxMessage(null);
    try {
      const remarks = `SBI Home Loan A/C #${loanAccount} | Branch: ${bankBranch} | Sanctioned: ₹${Number(
        lienAmount || selectedProp.rawValue
      ).toLocaleString('en-IN')}${loanRemarks ? ' | ' + loanRemarks : ''}`;

      await BlockchainAPI.setEncumbranceStatus(
        selectedProp.id,
        true,
        remarks,
        'BANK_MORTGAGE'
      );

      setTxMessage({
        type: 'success',
        text: `Mortgage Lien successfully endorsed on ${selectedProp.id}! Title is now encumbered on channel1 under MSP bank-com.`,
      });
      setIsLienModalOpen(false);
      setLoanAccount('');
      setLienAmount('');
      setLoanRemarks('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Failed to record lien: ${err.message}` });
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
      const effectiveNocRef =
        nocRef.trim() || `NOC-SBI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const remarks = `NOC Issued - Loan Closed per Ref: ${effectiveNocRef}`;

      await BlockchainAPI.setEncumbranceStatus(
        selectedProp.id,
        false,
        remarks,
        'NONE'
      );

      setTxMessage({
        type: 'success',
        text: `Bank NOC [${effectiveNocRef}] issued! Mortgage encumbrance on ${selectedProp.id} has been discharged on the distributed ledger.`,
      });
      setIsNocModalOpen(false);
      setNocRef('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Failed to issue NOC: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunEcSearch = async (propId) => {
    const id = propId || ecTargetId;
    if (!id) return;
    setEcLoading(true);
    setEcResult(null);
    try {
      const result = await BlockchainAPI.generateEncumbranceCertificate(id);
      setEcResult(result);
    } catch (err) {
      setTxMessage({ type: 'error', text: `Failed to verify title/EC: ${err.message}` });
    } finally {
      setEcLoading(false);
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
          background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
          color: '#fff',
          borderRadius: 16,
          padding: '26px 30px',
          marginBottom: 24,
          boxShadow: '0 8px 24px rgba(3, 105, 161, 0.22)',
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
            <Landmark size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                State Bank Institutional Mortgage Portal
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
                MSP: bank-com
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                Peer: peer1.bank.com (channel1)
              </span>
            </div>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.875rem' }}>
              Authoritative Bank Peer for CERSAI Lien Hypothecation, Title Clearance, and Digital NOC Management
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
            style={{ background: '#fff', color: '#0369a1', fontWeight: 600, border: 'none' }}
            onClick={() => {
              const eligible = properties.find((p) => !p.encumbrance && !p.frozen) || properties[0] || null;
              setSelectedProp(eligible);
              setIsLienModalOpen(true);
            }}
          >
            <PlusCircle size={15} />
            <span>Record New Mortgage</span>
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
            setActiveTab('mortgages');
            setFilterType('all');
          }}
          style={{
            cursor: 'pointer',
            border: activeTab === 'mortgages' ? '2px solid #0284c7' : '1px solid var(--border)',
            transition: 'var(--ease)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Mortgaged Assets</span>
            <ShieldAlert size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {encumberedList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Lien Active (Transfer & Sale Gated)
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

        <div
          className="stat-card"
          onClick={() => {
            setActiveTab('registry');
            setFilterType('clear');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Clear & Eligible Titles</span>
            <ShieldCheck size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {clearList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Unencumbered & ready for hypothecation
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => {
            setActiveTab('registry');
            setFilterType('frozen');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Court-Restrained Titles</span>
            <AlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {courtRestrainedList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Litigation active · Injunction lock
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab ${activeTab === 'mortgages' ? 'active' : ''}`}
          onClick={() => setActiveTab('mortgages')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={16} />
            <span>Active Mortgages ({encumberedList.length})</span>
          </span>
        </button>

        <button
          className={`tab ${activeTab === 'registry' ? 'active' : ''}`}
          onClick={() => setActiveTab('registry')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={16} />
            <span>Master Property Registry ({properties.length})</span>
          </span>
        </button>

        <button
          className={`tab ${activeTab === 'ec_search' ? 'active' : ''}`}
          onClick={() => setActiveTab('ec_search')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSearch size={16} />
            <span>Root Title & EC Verification</span>
          </span>
        </button>
      </div>

      {/* ── TAB 1 & 2: Table Views ── */}
      {(activeTab === 'mortgages' || activeTab === 'registry') && (
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
                  placeholder="Search Property ID, Owner, Title, or Remarks..."
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
                  className={`btn btn-sm ${filterType === 'encumbered' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterType('encumbered')}
                >
                  Mortgaged ({encumberedList.length})
                </button>
                <button
                  className={`btn btn-sm ${filterType === 'clear' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterType('clear')}
                >
                  Clear Titles ({clearList.length})
                </button>
                <button
                  className={`btn btn-sm ${filterType === 'frozen' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterType('frozen')}
                >
                  Court Frozen ({courtRestrainedList.length})
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
                  <th style={{ padding: '12px 18px' }}>Borrower / Owner</th>
                  <th style={{ padding: '12px 18px', cursor: 'pointer' }} onClick={() => toggleSort('value')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Valuation</span>
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th style={{ padding: '12px 18px' }}>Lien / Title Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProperties.map((p) => {
                  const isEnc = p.encumbrance === true;
                  const isCourtFrozen = p.frozen === true;

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
                          {p.jurisdiction || 'Urban'} Authority
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                        {p.value || `₹${(p.rawValue || 0).toLocaleString('en-IN')}`}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {isCourtFrozen ? (
                          <div>
                            <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <XCircle size={12} /> Court Restrained
                            </span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: 4 }}>
                              Stay: {p.freezeCaseNo || 'Active Order'}
                            </div>
                          </div>
                        ) : isEnc ? (
                          <div>
                            <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <AlertTriangle size={12} /> Bank Lien Active
                            </span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: 4, maxWidth: 240 }}>
                              {p.encumbranceRemarks || 'Hypothecated to SBI'}
                            </div>
                          </div>
                        ) : (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle2 size={12} /> Clear Title
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {isEnc ? (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                setSelectedProp(p);
                                setIsNocModalOpen(true);
                              }}
                              title="Discharge mortgage upon loan closure"
                            >
                              Issue NOC
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-primary"
                              disabled={isCourtFrozen}
                              onClick={() => {
                                setSelectedProp(p);
                                setIsLienModalOpen(true);
                              }}
                              title={isCourtFrozen ? 'Cannot hypothecate court-restrained title' : 'Endorse mortgage lien'}
                              style={isCourtFrozen ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            >
                              Flag Lien
                            </button>
                          )}

                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--bg-subtle)' }}
                            onClick={() => {
                              setActiveTab('ec_search');
                              setEcTargetId(p.id);
                              handleRunEcSearch(p.id);
                            }}
                            title="Generate Encumbrance Certificate"
                          >
                            <FileSearch size={14} />
                          </button>

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

      {/* ── TAB 3: Root Title & Encumbrance Certificate (EC) Search ── */}
      {activeTab === 'ec_search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Search Box */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 26px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 600 }}>
              Encumbrance Certificate & Root Title Inspector
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: 'var(--text-400)' }}>
              Executes cryptographic verification across <code style={{ color: '#0369a1' }}>channel1</code> to issue
              <strong> Form 16 (Nil Encumbrance)</strong> or <strong>Form 15 (Encumbrance Statement)</strong>.
            </p>

            <div style={{ display: 'flex', gap: 10, maxWidth: 540 }}>
              <select
                className="form-input"
                style={{ flex: 1 }}
                value={ecTargetId}
                onChange={(e) => setEcTargetId(e.target.value)}
              >
                <option value="">-- Select Property to Inspect --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.title} ({p.owner})
                  </option>
                ))}
              </select>

              <button
                className="btn btn-primary"
                onClick={() => handleRunEcSearch(ecTargetId)}
                disabled={!ecTargetId || ecLoading}
              >
                {ecLoading ? <RefreshCw size={15} className="spin" /> : <FileSearch size={15} />}
                <span>Verify Title</span>
              </button>
            </div>
          </div>

          {/* EC Result Card */}
          {ecResult && (
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
                      color: ecResult.cleanTitle ? '#059669' : '#b45309',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Department of Stamps and Registration · Karnataka
                  </span>
                  <h2 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 700 }}>
                    {ecResult.formType}
                  </h2>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-400)' }}>Certificate No:</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{ecResult.certificateNo}</div>
                </div>
              </div>

              {/* Status Header Badge */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: ecResult.cleanTitle ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${ecResult.cleanTitle ? '#a7f3d0' : '#fde68a'}`,
                  color: ecResult.cleanTitle ? '#065f46' : '#92400e',
                }}
              >
                {ecResult.cleanTitle ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {ecResult.cleanTitle ? 'Clean Marketable Title Confirmed' : 'Active Encumbrances on Record'}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    Search Period: {ecResult.searchPeriod} · Cadastral Verified:{' '}
                    {ecResult.cadastralVerified ? 'YES (Valid Cadastral)' : 'PENDING'}
                  </div>
                </div>
              </div>

              {/* Property Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 18,
                  marginBottom: 24,
                  background: 'var(--bg-subtle)',
                  padding: 18,
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>Property Identifier</div>
                  <div style={{ fontWeight: 600 }}>{ecResult.propertyId}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>Asset Name</div>
                  <div style={{ fontWeight: 600 }}>{ecResult.title}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>Current Registered Owner</div>
                  <div style={{ fontWeight: 600 }}>{ecResult.owner}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>Location Address</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ecResult.address}</div>
                </div>
              </div>

              {/* Statement of Liens & Stays */}
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 600 }}>
                  Active Registered Encumbrances
                </h4>

                {ecResult.activeLiens?.length === 0 && ecResult.activeCourtOrders?.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      background: '#f9fafb',
                      borderRadius: 8,
                      border: '1px dashed var(--border)',
                      color: 'var(--text-400)',
                      fontSize: '0.875rem',
                    }}
                  >
                    No financial mortgages, hypothecations, or judicial injunctions registered against this title.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ecResult.activeLiens?.map((lien, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 8,
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#92400e', fontSize: '0.875rem' }}>
                            {lien.type} — {lien.holder}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-500)' }}>{lien.remarks}</div>
                        </div>
                        <span className="badge badge-amber">{lien.status}</span>
                      </div>
                    ))}

                    {ecResult.activeCourtOrders?.map((court, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 8,
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '0.875rem' }}>
                            Judicial Stay Order: {court.caseNo}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-500)' }}>{court.remarks}</div>
                        </div>
                        <span className="badge badge-red">{court.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: Flag Lien Modal ── */}
      {isLienModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 520 }}>
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
              <strong>bank-com</strong>. The title will be cryptographically locked against sale or transfer until cleared.
            </p>

            {selectedProp.frozen && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={18} />
                <span>
                  <strong>Notice:</strong> This asset is currently restrained under Court Case {selectedProp.freezeCaseNo}.
                  Mortgage lien cannot be committed while litigation stay is active.
                </span>
              </div>
            )}

            <form onSubmit={handleApplyLien} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Selected Property</label>
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
                      {p.id} — {p.title} ({p.owner}) [{p.value || '₹' + p.rawValue}]
                    </option>
                  ))}
                </select>
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
                  placeholder={`Asset Valuation: ₹${selectedProp.rawValue}`}
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

              <div className="form-group">
                <label className="form-label">Remarks / Hypothecation Note</label>
                <input
                  className="form-input"
                  placeholder="e.g. Equitable mortgage against original title deeds"
                  value={loanRemarks}
                  onChange={(e) => setLoanRemarks(e.target.value)}
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
                  disabled={submitting || selectedProp.frozen}
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
          <div className="modal-content animate-in" style={{ maxWidth: 500 }}>
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

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 18 }}>
              Verify loan closure and issue a Non-Objection Certificate. This removes the encumbrance lock on{' '}
              <strong>{selectedProp.id}</strong> on the distributed ledger.
            </p>

            <form onSubmit={handleReleaseLien} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property & Borrower</label>
                <input
                  className="form-input"
                  disabled
                  value={`${selectedProp.id} — ${selectedProp.title} (${selectedProp.owner})`}
                />
              </div>

              <div className="form-group">
                <label className="form-label">NOC Certificate Reference</label>
                <input
                  className="form-input"
                  required
                  placeholder={`e.g. NOC-SBI-${new Date().getFullYear()}-8841`}
                  value={nocRef}
                  onChange={(e) => setNocRef(e.target.value)}
                />
              </div>

              {/* Settlement Checklist */}
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: 14,
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-700)' }}>
                  Loan Settlement Verification
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checklist.debtCleared}
                    onChange={(e) => setChecklist({ ...checklist, debtCleared: e.target.checked })}
                  />
                  <span>Full loan balance, interest, and penalties reconciled to zero</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checklist.chargesPaid}
                    onChange={(e) => setChecklist({ ...checklist, chargesPaid: e.target.checked })}
                  />
                  <span>No lien claims or outstanding processing dues</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checklist.vaultRetrieved}
                    onChange={(e) => setChecklist({ ...checklist, vaultRetrieved: e.target.checked })}
                  />
                  <span>Original physical title deeds cleared for customer handover</span>
                </label>
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
                  disabled={submitting || !checklist.debtCleared || !checklist.chargesPaid}
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
                          Tx: <code>{(log.txId || '').slice(0, 16)}...</code>
                          <button
                            onClick={() => handleCopy(log.txId)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Copy full Transaction ID"
                          >
                            {copiedTxId === log.txId ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                          </button>
                        </span>
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
