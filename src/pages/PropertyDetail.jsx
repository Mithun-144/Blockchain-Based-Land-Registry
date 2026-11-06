import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  History,
  FileText,
  MapPin,
  User,
  Shield,
  Scale,
  Landmark,
  Building,
  AlertTriangle,
  FileCheck,
  Calendar,
  Tag,
  ShoppingCart,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Hash,
  BadgeCheck,
} from 'lucide-react';
import { BlockchainAPI, normalizeUserEmail, PRESET_USERS } from '../api/blockchain';

// ── Small helpers ────────────────────────────────────────────────────────────

function DeedRow({ label, children }) {
  return (
    <div className="deed-row">
      <span className="deed-key">{label}</span>
      <span className="deed-val">{children}</span>
    </div>
  );
}

function SectionLabel({ icon: Icon, color, children, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {Icon && <Icon size={15} color={color || 'var(--text-500)'} />}
      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{children}</span>
      {count !== undefined && (
        <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>{count} events</span>
      )}
    </div>
  );
}

// Action badge for encumbrance / freeze log entries
function ActionBadge({ action }) {
  const cfg = {
    FLAGGED:  { bg: '#d97706', label: 'FLAGGED' },
    CLEARED:  { bg: '#16a34a', label: 'CLEARED' },
    FROZEN:   { bg: '#dc2626', label: 'FROZEN' },
    UNFROZEN: { bg: '#16a34a', label: 'UNFROZEN' },
    VACATED:  { bg: '#16a34a', label: 'VACATED' },
  }[action] || { bg: '#6b7280', label: action || '—' };
  return (
    <span
      className="badge"
      style={{ background: cfg.bg, color: '#fff', fontSize: '0.68rem', fontWeight: 700 }}
    >
      {cfg.label}
    </span>
  );
}

// Encumbrance type typed chip
function EncTypeChip({ type }) {
  if (!type || type === 'NONE') return <span className="badge badge-green">NONE — Clear Title</span>;
  const cfg = {
    BANK_MORTGAGE: { label: 'Bank Mortgage', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    COURT_ORDER:   { label: 'Court Order',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  }[type] || { label: type, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
  return (
    <span
      className="badge"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 600 }}
    >
      {cfg.label}
    </span>
  );
}

// Collapsible log section wrapper
function LogSection({ title, icon: Icon, iconColor, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '10px 0', borderBottom: '1px solid var(--border)',
          marginBottom: open ? 12 : 0,
        }}
      >
        {Icon && <Icon size={15} color={iconColor || 'var(--text-500)'} />}
        <span style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1, textAlign: 'left' }}>{title}</span>
        {count !== undefined && (
          <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>{count}</span>
        )}
        {open ? <ChevronDown size={14} color="var(--text-400)" /> : <ChevronRight size={14} color="var(--text-400)" />}
      </button>
      {open && children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PropertyDetail({ prop: initialProp, user, setPage, setTransferProp }) {
  const [prop, setProp] = useState(initialProp);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  // tabs: 'overview' | 'location' | 'history' | 'audit' | 'transfer'
  const [activeTab, setActiveTab] = useState('overview');

  // Refresh latest on-chain state
  useEffect(() => {
    if (initialProp?.id) {
      BlockchainAPI.getProperty(initialProp.id)
        .then((fresh) => { if (fresh) setProp((prev) => ({ ...prev, ...fresh })); })
        .catch((err) => console.warn('Could not refresh prop detail:', err));

      BlockchainAPI.getPropertyHistory(initialProp.id)
        .then((data) => setHistory(data || []))
        .catch((err) => console.error(err))
        .finally(() => setLoadingHistory(false));
    }
  }, [initialProp?.id]);

  if (!prop) {
    return (
      <div className="page container animate-in" style={{ paddingTop: 60, textAlign: 'center' }}>
        <h2>Property not selected</h2>
        <button className="btn btn-primary mt-16" onClick={() => setPage('dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isOwner = user && normalizeUserEmail(prop.owner) === normalizeUserEmail(user.email);
  const ownerProfile = PRESET_USERS.find((u) => normalizeUserEmail(u.email) === normalizeUserEmail(prop?.owner));

  // ── Correct field names from smart contract ──────────────────────────────
  const isFrozen     = prop.frozen === true;
  const isEncumbered = prop.encumbrance === true;
  const isVerified   = prop.ownershipVerified !== false;
  const encType      = prop.encumbranceType || (isEncumbered ? 'BANK_MORTGAGE' : 'NONE');

  const freezeLogs       = Array.isArray(prop.freezeLog)       ? prop.freezeLog       : [];
  const encumbranceLogs  = Array.isArray(prop.encumbranceLog)  ? prop.encumbranceLog  : [];
  const transferHistory  = Array.isArray(prop.transferHistory) ? prop.transferHistory  : [];

  const totalAuditEvents = freezeLogs.length + encumbranceLogs.length;

  // Location breadcrumb
  const locationCrumbs = [prop.state, prop.district, prop.taluk, prop.city, prop.locality]
    .filter(Boolean);

  return (
    <div className="page animate-in">
      {/* Hero Banner */}
      <div
        style={{
          height: '180px',
          background: isFrozen
            ? 'linear-gradient(180deg, #991b1b 0%, #b91c1c 48%, #7f1d1d 52%, #0f172a 100%)'
            : 'linear-gradient(180deg, #1e40af 0%, #1d4ed8 48%, #1e3a8a 52%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderBottom: isFrozen ? '3px solid #dc2626' : '3px solid #1d4ed8',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 80%)' }} />
      </div>

      <div className="container" style={{ marginTop: -60, position: 'relative', zIndex: 2 }}>
        <button className="btn btn-ghost btn-sm mb-16" onClick={() => setPage('marketplace')}>
          <ArrowLeft size={14} /> Back to Marketplace
        </button>

        {/* ⚖️ Court Injunction Alert */}
        {isFrozen && (
          <div
            className="animate-in"
            style={{
              background: '#fef2f2', border: '2px solid #ef4444',
              borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 20,
              display: 'flex', alignItems: 'flex-start', gap: 14,
              boxShadow: '0 4px 14px rgba(239,68,68,0.15)',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Scale size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#991b1b' }}>
                  Judicial Court Injunction Active (Title Restrained)
                </span>
                <span style={{ background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>
                  Case #{prop.freezeCaseNo || 'CIVIL-INJUNCTION'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7f1d1d', lineHeight: 1.5 }}>
                This property has been legally restrained by order of the City Civil Court (MSP: <code>judiciary-com</code>).
                All title deed mutations, sales, and listing transactions are blocked by smart contract consensus
                until the order is formally vacated on the ledger.
              </p>
              {prop.freezeRemarks && (
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#b91c1c', fontStyle: 'italic' }}>
                  <strong>Court Remarks:</strong> "{prop.freezeRemarks}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🏦 Bank Mortgage Alert */}
        {isEncumbered && !isFrozen && (
          <div
            className="animate-in"
            style={{
              background: '#fffbeb', border: '1.5px solid #f59e0b',
              borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Landmark size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#92400e' }}>
                Bank Mortgage Lien Attached — <EncTypeChip type={encType} />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 2 }}>
                {prop.encumbranceRemarks || 'Active mortgage registered. SRO deed transfer requires bank NOC clearance.'}
              </div>
            </div>
          </div>
        )}

        {/* Header: Title + Value */}
        <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
          <div>
            <div className="flex items-center gap-12 mb-8 flex-wrap">
              <span className="badge badge-blue">{prop.type}</span>
              {isFrozen ? (
                <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', fontWeight: 700 }}>
                  <Scale size={12} /> Court Injunction Active
                </span>
              ) : isVerified ? (
                <span className="badge badge-green">
                  <CheckCircle2 size={12} /> Cadastral Verified ({prop.jurisdiction?.toUpperCase() || 'BBMP'})
                </span>
              ) : (
                <span className="badge badge-amber">⏳ Verification Pending</span>
              )}
              <span className="badge badge-purple">Block #{prop.blockNumber || 142}</span>
              {prop.listedForSale ? (
                <span className="badge badge-amber font-700"><Tag size={12} /> Listed for Sale</span>
              ) : (
                <span className="badge badge-neutral">Privately Held</span>
              )}
            </div>
            <h1>{prop.title}</h1>
            {/* Location breadcrumb */}
            {locationCrumbs.length > 0 && (
              <p className="flex items-center gap-6 mt-4" style={{ fontSize: '0.8125rem', color: 'var(--text-500)', flexWrap: 'wrap' }}>
                <MapPin size={14} color="#94a3c4" />
                {locationCrumbs.map((c, i) => (
                  <span key={i}>
                    {c}
                    {i < locationCrumbs.length - 1 && <span style={{ margin: '0 4px', opacity: 0.4 }}>›</span>}
                  </span>
                ))}
                {prop.pincode && <span style={{ marginLeft: 4, fontFamily: 'monospace', background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4 }}>{prop.pincode}</span>}
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="text-sm text-muted">{prop.listedForSale ? 'Asking Price' : 'Registered Value'}</div>
            <div className="text-green font-700" style={{ fontSize: '2rem' }}>{prop.value}</div>
            {prop.guidelineValue && Number(prop.guidelineValue) !== Number(prop.rawValue) && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: 2 }}>
                Govt Guideline: ₹{Number(prop.guidelineValue).toLocaleString('en-IN')}
              </div>
            )}
            {(prop.stampDuty || prop.registrationFee) && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: 4 }}>
                Stamp Duty: ₹{Number(prop.stampDuty || 0).toLocaleString('en-IN')} &nbsp;+&nbsp;
                Reg Fee: ₹{Number(prop.registrationFee || 0).toLocaleString('en-IN')}
              </div>
            )}
          </div>
        </div>

        {/* Top Info Grid */}
        <div className="grid-2 gap-24 mb-32">

          {/* Card 1: Title & Cadastral */}
          <div className="card">
            <h3 className="mb-16 flex items-center gap-8">
              <FileText size={18} color="#4f9cf9" /> Title & Cadastral Details
            </h3>
            <DeedRow label="Blockchain Property ID">
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{prop.id}</span>
            </DeedRow>
            <DeedRow label="Cadastral Jurisdiction">
              <span style={{ textTransform: 'capitalize' }}>
                {prop.jurisdiction === 'municipal' ? 'Urban Municipal (BBMP)'
                  : prop.jurisdiction === 'revenue' ? 'Taluk Revenue (Tahsildar / Bhoomi)'
                  : prop.jurisdiction === 'panchayat' ? 'Gram Panchayat (PDO)'
                  : prop.jurisdiction || 'Municipal Urban'}
              </span>
            </DeedRow>
            <DeedRow label="Survey / Plot Number">
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{prop.surveyNumber || 'PENDING'}</span>
            </DeedRow>
            <DeedRow label="e-Khata / RTC Document ID">
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{prop.eKhataNo || 'PENDING'}</span>
            </DeedRow>
            <DeedRow label="Total Built-Up Area">{prop.area}</DeedRow>
            <DeedRow label="Current Owner">
              <span style={{ fontWeight: 600, color: isOwner ? 'var(--primary)' : 'inherit' }}>
                {isOwner ? 'You (Owner)' : ownerProfile ? `${ownerProfile.name} (${prop.owner})` : prop.owner}
              </span>
            </DeedRow>
            <DeedRow label="Registration Date">{prop.regDate || '—'}</DeedRow>
            {prop.lastTxId && (
              <DeedRow label="Last Tx ID">
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {prop.lastTxId.slice(0, 18)}…
                </span>
              </DeedRow>
            )}
          </div>

          {/* Card 2: Legal & Encumbrance */}
          <div className="card">
            <h3 className="mb-16 flex items-center gap-8">
              <ShieldAlert size={18} color={isFrozen ? '#ef4444' : '#48d68a'} /> Legal & Encumbrance Status
            </h3>

            <DeedRow label="Court Restraints / Injunction">
              {isFrozen
                ? <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', fontWeight: 700 }}>
                    <Scale size={11} /> Case #{prop.freezeCaseNo || '—'}
                  </span>
                : <span className="badge badge-green">Clear (No Stays)</span>
              }
            </DeedRow>

            <DeedRow label="Encumbrance Type">
              <EncTypeChip type={encType} />
            </DeedRow>

            <DeedRow label="Mortgage / Bank Liens">
              {isEncumbered
                ? <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600 }}>
                    <Landmark size={11} /> {encType}
                  </span>
                : <span className="badge badge-green">Clear (No Liens)</span>
              }
            </DeedRow>

            <DeedRow label="Cadastral Verification">
              {isVerified
                ? <span className="badge badge-green"><BadgeCheck size={11} /> Verified by {prop.verifiedBy || 'Authority'}</span>
                : <span className="badge badge-amber">⏳ Pending Verification</span>
              }
            </DeedRow>

            {isVerified && prop.verificationDate && (
              <DeedRow label="Verification Date">{prop.verificationDate}</DeedRow>
            )}

            {isVerified && prop.verificationTxId && (
              <DeedRow label="Verification Tx ID">
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {prop.verificationTxId.slice(0, 18)}…
                </span>
              </DeedRow>
            )}

            {!isVerified && prop.ownershipRevokedReason && (
              <DeedRow label="Revocation Reason">
                <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{prop.ownershipRevokedReason}</span>
              </DeedRow>
            )}

            <DeedRow label="Guideline Valuation">
              <span style={{ fontWeight: 600 }}>
                {prop.guidelineValue ? `₹${Number(prop.guidelineValue).toLocaleString('en-IN')}` : '—'}
              </span>
            </DeedRow>

            <DeedRow label="Smart Contract State">
              <span className="badge badge-blue">
                {isFrozen ? 'Frozen by Court' : prop.listedForSale ? 'Open for Purchase' : 'Privately Registered'}
              </span>
            </DeedRow>

            <div className="divider" />

            {/* Action buttons */}
            {isFrozen ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r)', padding: '12px', textAlign: 'center', fontSize: '0.8125rem', color: '#991b1b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Scale size={16} />
                <span>Trading Disabled: Civil Court Injunction in effect</span>
              </div>
            ) : isOwner ? (
              <button
                className="btn btn-primary w-full"
                onClick={() => { setTransferProp(prop); setPage('sell'); }}
              >
                <Tag size={16} /> {prop.listedForSale ? 'Manage Active Listing (SRO Verified)' : 'List Property for Sale (SRO & Tahsildar Consensus)'}
              </button>
            ) : prop.listedForSale ? (
              <button
                className="btn btn-green w-full"
                onClick={() => { setTransferProp(prop); setPage('transfer'); }}
              >
                <ShoppingCart size={16} /> Buy Property (SRO & Multi-Org Consensus)
              </button>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                🔒 This title is privately held and not currently listed for sale.
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { id: 'overview',  label: 'Overview' },
            { id: 'location',  label: '📍 Location' },
            { id: 'history',   label: '⛓ Blockchain History' },
            { id: 'audit',     label: `⚖️ Audit Logs (${totalAuditEvents})` },
            { id: 'transfer',  label: `🔄 Transfer Chain (${transferHistory.length})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              className={`tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="card animate-in">
            <h3 className="mb-16">About this Property Record</h3>
            <p className="mb-16">
              This property title is registered on the National Blockchain Framework (NBF-Lite), powered by
              Hyperledger Fabric. All title deeds, encumbrance certificates, cadastral survey data, and ownership
              transfers are permanently committed to distributed ledger peers with CDAC MSP endorsement.
            </p>
            <p>
              When a citizen initiates a purchase, transaction proposals are dispatched concurrently to the SRO Node
              (mortgage/encumbrance check) and the Tahsildar Office Node (title authenticity check). Following 4-peer
              MAJORITY consensus and stamp duty payment, the orderer commits the transaction into a block and updates
              the World State in CouchDB.
            </p>
          </div>
        )}

        {/* ── Tab: Location ─────────────────────────────────────────────── */}
        {activeTab === 'location' && (
          <div className="card animate-in">
            <h3 className="mb-20 flex items-center gap-8">
              <MapPin size={18} color="#4f9cf9" /> Structured Location Details
            </h3>

            {/* Breadcrumb hierarchy */}
            {locationCrumbs.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
                background: 'var(--bg-subtle)', borderRadius: 'var(--r)',
                padding: '10px 16px', marginBottom: 20, fontSize: '0.875rem',
              }}>
                <MapPin size={13} color="#94a3c4" />
                {locationCrumbs.map((c, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: i === locationCrumbs.length - 1 ? 700 : 400 }}>{c}</span>
                    {i < locationCrumbs.length - 1 && <ChevronRight size={12} color="var(--text-300)" />}
                  </span>
                ))}
                {prop.pincode && (
                  <span style={{ marginLeft: 8, fontFamily: 'monospace', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                    {prop.pincode}
                  </span>
                )}
              </div>
            )}

            <div className="grid-2 gap-16">
              <div>
                <DeedRow label="State">{prop.state || '—'}</DeedRow>
                <DeedRow label="District">{prop.district || '—'}</DeedRow>
                <DeedRow label="Taluk">{prop.taluk || '—'}</DeedRow>
              </div>
              <div>
                <DeedRow label="City">{prop.city || '—'}</DeedRow>
                <DeedRow label="Locality">{prop.locality || '—'}</DeedRow>
                <DeedRow label="Pincode">
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{prop.pincode || '—'}</span>
                </DeedRow>
              </div>
            </div>

            <div className="divider" style={{ margin: '16px 0' }} />

            <DeedRow label="Full Address">
              <span style={{ fontStyle: 'italic' }}>{prop.address || '—'}</span>
            </DeedRow>
            <DeedRow label="Jurisdiction Type">
              <span style={{ textTransform: 'capitalize' }}>{prop.jurisdiction || '—'}</span>
            </DeedRow>
            <DeedRow label="Survey Number">
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{prop.surveyNumber || 'PENDING'}</span>
            </DeedRow>
            <DeedRow label="e-Khata / RTC No.">
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{prop.eKhataNo || 'PENDING'}</span>
            </DeedRow>
          </div>
        )}

        {/* ── Tab: Blockchain History ───────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="card animate-in">
            <h3 className="mb-24 flex items-center gap-8">
              <History size={18} color="#4f9cf9" /> On-Chain Provenance Log
            </h3>
            {loadingHistory ? (
              <div className="loading-box" style={{ padding: '30px 0' }}>
                <div className="spinner" />
                <p>Retrieving transaction history from blockchain ledger...</p>
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-400)', fontSize: '0.875rem' }}>
                No transaction history available.
              </div>
            ) : (
              <div className="timeline">
                {history.map((h, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot">{h.icon || '⛓️'}</div>
                    <div className="timeline-content">
                      <div className="timeline-event">{h.event}</div>
                      <div className="timeline-meta">
                        <span>Date: {h.date}</span> &nbsp;•&nbsp;
                        <span>Signer: {h.by}</span> &nbsp;•&nbsp;
                        <span style={{ fontFamily: 'monospace' }}>Tx: {h.txId}</span> &nbsp;•&nbsp;
                        <span>Block: {h.block}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Audit Logs ───────────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="card animate-in">
            <h3 className="mb-4 flex items-center gap-8">
              <ShieldAlert size={18} color="#dc2626" /> Regulatory & Legal State Audit Log
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-500)', marginBottom: 20 }}>
              Immutable audit history maintained directly inside the smart contract World State.
            </p>

            {/* Freeze / Judicial Log */}
            <LogSection
              title="Judicial Stay & Injunction Log"
              icon={Scale}
              iconColor="#dc2626"
              count={freezeLogs.length}
              defaultOpen={isFrozen || freezeLogs.length > 0}
            >
              {freezeLogs.length === 0 ? (
                <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--r)', fontSize: '0.8125rem', color: 'var(--text-400)' }}>
                  No judicial restraint orders registered against this property.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {freezeLogs.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: (log.action === 'FROZEN') ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${(log.action === 'FROZEN') ? '#fecaca' : '#bbf7d0'}`,
                        borderRadius: 'var(--r)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <ActionBadge action={log.action} />
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {log.caseNo ? `Case #${log.caseNo}` : log.orderRef ? `Order Ref: ${log.orderRef}` : 'Court Order'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-500)' }}>
                        {log.remarks && <span>"{log.remarks}" &nbsp;•&nbsp; </span>}
                        Issued by: <strong>{log.mspId || '—'}</strong>
                        {log.date && <span> &nbsp;•&nbsp; {log.date}</span>}
                      </div>
                      {log.txId && (
                        <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-400)', marginTop: 4 }}>
                          Tx: {log.txId.slice(0, 20)}…
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </LogSection>

            {/* Encumbrance / Bank Lien Log */}
            <LogSection
              title="Bank Mortgage & Lien Audit Log"
              icon={Landmark}
              iconColor="#0284c7"
              count={encumbranceLogs.length}
              defaultOpen={isEncumbered || encumbranceLogs.length > 0}
            >
              {encumbranceLogs.length === 0 ? (
                <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--r)', fontSize: '0.8125rem', color: 'var(--text-400)' }}>
                  No mortgage liens or financial encumbrances registered.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {encumbranceLogs.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: log.action === 'FLAGGED' ? '#fffbeb' : '#f0fdf4',
                        border: `1px solid ${log.action === 'FLAGGED' ? '#fde68a' : '#bbf7d0'}`,
                        borderRadius: 'var(--r)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <ActionBadge action={log.action} />
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {log.type || 'BANK_MORTGAGE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-500)' }}>
                        {log.remarks && <span>"{log.remarks}" &nbsp;•&nbsp; </span>}
                        Signer MSP: <strong>{log.mspId || '—'}</strong>
                        {log.date && <span> &nbsp;•&nbsp; {log.date}</span>}
                      </div>
                      {log.txId && (
                        <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-400)', marginTop: 4 }}>
                          Tx: {log.txId.slice(0, 20)}…
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </LogSection>
          </div>
        )}

        {/* ── Tab: Transfer Chain ───────────────────────────────────────── */}
        {activeTab === 'transfer' && (
          <div className="card animate-in">
            <h3 className="mb-20 flex items-center gap-8">
              <ArrowRightLeft size={18} color="#4f9cf9" /> On-Chain Transfer & Deed History
            </h3>

            {transferHistory.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--r)', color: 'var(--text-400)', fontSize: '0.875rem' }}>
                No transfer history recorded — this property has not changed ownership since initial registration.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {transferHistory.map((tx, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r)',
                      borderLeft: '3px solid #4f9cf9',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>Transfer #{transferHistory.length - idx}</span>
                        {tx.date && <span style={{ fontSize: '0.78rem', color: 'var(--text-500)' }}>{tx.date}</span>}
                      </div>
                      {tx.amount && (
                        <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>
                          ₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r)', padding: '8px 10px', fontSize: '0.78rem' }}>
                        <div style={{ color: 'var(--text-400)', fontSize: '0.68rem', marginBottom: 2 }}>FROM</div>
                        <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{tx.from || '—'}</div>
                      </div>
                      <ArrowRightLeft size={16} color="var(--text-300)" />
                      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r)', padding: '8px 10px', fontSize: '0.78rem' }}>
                        <div style={{ color: 'var(--text-400)', fontSize: '0.68rem', marginBottom: 2 }}>TO</div>
                        <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{tx.to || '—'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.75rem', color: 'var(--text-500)' }}>
                      {tx.stampDuty && <span>Stamp Duty: ₹{Number(tx.stampDuty).toLocaleString('en-IN')}</span>}
                      {tx.registrationFee && <span>Reg Fee: ₹{Number(tx.registrationFee).toLocaleString('en-IN')}</span>}
                      {tx.paymentRef && <span style={{ fontFamily: 'monospace' }}>Challan: {tx.paymentRef}</span>}
                      {tx.jurisdiction && <span style={{ textTransform: 'capitalize' }}>Jurisdiction: {tx.jurisdiction}</span>}
                    </div>

                    {tx.txId && (
                      <div style={{ marginTop: 6, fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-400)' }}>
                        Tx: {tx.txId.slice(0, 24)}…
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
