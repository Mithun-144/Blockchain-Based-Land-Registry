import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  History,
  FileText,
  Share2,
  ShoppingCart,
  Tag,
  MapPin,
  User,
  Shield,
  Scale,
  Landmark,
  Building,
  AlertTriangle,
  BadgeAlert,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { BlockchainAPI, normalizeUserEmail, PRESET_USERS } from '../api/blockchain';

export default function PropertyDetail({ prop: initialProp, user, setPage, setTransferProp }) {
  const [prop, setProp] = useState(initialProp);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history' | 'audit'

  // Refresh latest on-chain state if ID exists
  useEffect(() => {
    if (initialProp?.id) {
      BlockchainAPI.getProperty(initialProp.id)
        .then((fresh) => {
          if (fresh) setProp((prev) => ({ ...prev, ...fresh }));
        })
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

  const isOwner =
    user && normalizeUserEmail(prop.owner) === normalizeUserEmail(user.email);

  const ownerProfile = PRESET_USERS.find(
    (u) => normalizeUserEmail(u.email) === normalizeUserEmail(prop?.owner)
  );

  const isFrozen = prop.isFrozen || prop.frozen;
  const isEncumbered = prop.encumbered || prop.isEncumbered;
  const isVerified = prop.ownershipVerified;

  const freezeLogs = Array.isArray(prop.freezeLog) ? prop.freezeLog : [];
  const encumbranceLogs = Array.isArray(prop.encumbranceLog) ? prop.encumbranceLog : [];

  return (
    <div className="page animate-in">
      {/* Banner */}
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

        {/* ⚖️ Active Court Injunction Alert Banner */}
        {isFrozen && (
          <div
            className="animate-in"
            style={{
              background: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: 'var(--r-lg)',
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Scale size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#991b1b' }}>
                  Judicial Court Injunction Active (Title Restrained)
                </span>
                <span
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  Order #{prop.freezeCaseNumber || 'CIVIL-INJUNCTION'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7f1d1d', lineHeight: 1.5 }}>
                This property has been legally restrained by order of the City Civil Court (MSP: <code>judiciary-com</code>).
                All title deed mutations, sales, and listing transactions are permanently blocked by smart contract consensus
                until the order is formally vacated on the ledger.
              </p>
              {prop.freezeRemarks && (
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#b91c1c', fontStyle: 'italic' }}>
                  <strong>Court Remarks:</strong> "{prop.freezeRemarks}" (Date: {prop.freezeDate || 'Recent'})
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🏦 Bank Mortgage Lien Alert Banner */}
        {isEncumbered && !isFrozen && (
          <div
            className="animate-in"
            style={{
              background: '#fffbeb',
              border: '1.5px solid #f59e0b',
              borderRadius: 'var(--r-lg)',
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Landmark size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#92400e' }}>
                Bank Mortgage Lien Attached ({prop.encumbranceType || 'BANK_MORTGAGE'})
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b45309' }}>
                Lien registered by State Bank of India (MSP: <code>bank-com</code>). Remarks: "{prop.encumbranceRemarks || 'Active Housing Loan'}". SRO deed transfer requires bank NOC clearance.
              </div>
            </div>
          </div>
        )}

        {/* Header Title Section */}
        <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
          <div>
            <div className="flex items-center gap-12 mb-8 flex-wrap">
              <span className="badge badge-blue">{prop.type}</span>
              {isFrozen ? (
                <span
                  className="badge"
                  style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', fontWeight: 700 }}
                >
                  <Scale size={12} /> Court Injunction Active
                </span>
              ) : isVerified ? (
                <span className="badge badge-green">
                  <CheckCircle2 size={12} /> Cadastral Verified ({prop.jurisdiction?.toUpperCase() || 'BBMP'})
                </span>
              ) : (
                <span className="badge badge-amber">
                  ⏳ Verification Pending
                </span>
              )}
              <span className="badge badge-purple">Block #{prop.blockNumber || 142}</span>
              {prop.listedForSale ? (
                <span className="badge badge-amber font-700">
                  <Tag size={12} /> Listed for Sale
                </span>
              ) : (
                <span className="badge badge-neutral">Privately Held</span>
              )}
            </div>
            <h1>{prop.title}</h1>
            <p className="flex items-center gap-6 mt-4">
              <MapPin size={16} color="#94a3c4" />
              <span>{prop.address}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted">{prop.listedForSale ? 'Asking Price' : 'Registered Value'}</div>
            <div className="text-green font-700" style={{ fontSize: '2rem' }}>
              {prop.value}
            </div>
            {prop.guidelineValue && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: 2 }}>
                Govt Guideline: ₹{Number(prop.guidelineValue).toLocaleString('en-IN')}
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid-2 gap-24 mb-32">
          {/* Card 1: Title & Cadastral Details */}
          <div className="card">
            <h3 className="mb-16 flex items-center gap-8">
              <FileText size={18} color="#4f9cf9" /> Title & Cadastral Details
            </h3>
            <div className="deed-row">
              <span className="deed-key">Blockchain Property ID</span>
              <span className="deed-val font-600" style={{ fontFamily: 'monospace' }}>
                {prop.id}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Cadastral Jurisdiction</span>
              <span className="deed-val" style={{ textTransform: 'capitalize' }}>
                {prop.jurisdiction === 'municipal'
                  ? 'Urban Municipal (BBMP)'
                  : prop.jurisdiction === 'revenue'
                    ? 'Taluk Revenue (Tahsildar / Bhoomi)'
                    : prop.jurisdiction === 'panchayat'
                      ? 'Gram Panchayat (PDO)'
                      : prop.jurisdiction || 'Municipal Urban'}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Survey / Plot Number</span>
              <span className="deed-val font-600" style={{ fontFamily: 'monospace' }}>
                {prop.surveyNumber || 'SY-104/2B'}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">e-Khata / RTC Document ID</span>
              <span className="deed-val font-600" style={{ fontFamily: 'monospace' }}>
                {prop.eKhataNo || 'BBMP-A-88219'}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Total Built-Up Area</span>
              <span className="deed-val">{prop.area}</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Current Owner</span>
              <span className="deed-val font-600" style={{ color: isOwner ? 'var(--primary)' : 'inherit' }}>
                {isOwner ? 'You (Owner)' : ownerProfile ? `${ownerProfile.name} (${prop.owner})` : prop.owner}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Registration Date</span>
              <span className="deed-val">{prop.regDate || '2023-01-15'}</span>
            </div>
          </div>

          {/* Card 2: Legal, Encumbrance & Governance */}
          <div className="card">
            <h3 className="mb-16 flex items-center gap-8">
              <ShieldAlert size={18} color={isFrozen ? '#ef4444' : '#48d68a'} /> Legal & Encumbrance Status
            </h3>

            <div className="deed-row">
              <span className="deed-key">Court Restraints / Injunction</span>
              {isFrozen ? (
                <span
                  className="badge"
                  style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', fontWeight: 700 }}
                >
                  <Scale size={11} /> Case #{prop.freezeCaseNumber}
                </span>
              ) : (
                <span className="badge badge-green">Clear (No Stays)</span>
              )}
            </div>

            <div className="deed-row">
              <span className="deed-key">Mortgage / Bank Liens</span>
              {isEncumbered ? (
                <span
                  className="badge"
                  style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600 }}
                >
                  <Landmark size={11} /> {prop.encumbranceType || 'BANK_MORTGAGE'}
                </span>
              ) : (
                <span className="badge badge-green">Clear (No Liens)</span>
              )}
            </div>

            <div className="deed-row">
              <span className="deed-key">Cadastral Verification</span>
              {isVerified ? (
                <span className="badge badge-green">
                  ✓ Verified by {prop.verifiedBy || 'Authority'}
                </span>
              ) : (
                <span className="badge badge-amber">⏳ Pending Verification</span>
              )}
            </div>

            <div className="deed-row">
              <span className="deed-key">Guideline Valuation</span>
              <span className="deed-val font-600">
                {prop.guidelineValue ? `₹${Number(prop.guidelineValue).toLocaleString('en-IN')}` : 'Market Guideline'}
              </span>
            </div>

            <div className="deed-row">
              <span className="deed-key">Smart Contract State</span>
              <span className="badge badge-blue">
                {isFrozen ? 'Frozen by Court' : prop.listedForSale ? 'Open for Purchase' : 'Privately Registered'}
              </span>
            </div>

            <div className="divider" />

            {/* Action buttons */}
            {isFrozen ? (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--r)',
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '0.8125rem',
                  color: '#991b1b',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Scale size={16} />
                <span>Trading Disabled: Civil Court Injunction in effect</span>
              </div>
            ) : isOwner ? (
              prop.listedForSale ? (
                <button
                  className="btn btn-primary w-full"
                  onClick={() => {
                    setTransferProp(prop);
                    setPage('sell');
                  }}
                >
                  <Tag size={16} /> Manage Active Listing (SRO Verified)
                </button>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={() => {
                    setTransferProp(prop);
                    setPage('sell');
                  }}
                >
                  <Tag size={16} /> List Property for Sale (SRO & Tahsildar Consensus)
                </button>
              )
            ) : prop.listedForSale ? (
              <button
                className="btn btn-green w-full"
                onClick={() => {
                  setTransferProp(prop);
                  setPage('transfer');
                }}
              >
                <ShoppingCart size={16} /> Buy Property (SRO & Multi-Org Consensus)
              </button>
            ) : (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '0.86rem',
                  color: 'var(--text-muted)',
                }}
              >
                🔒 This title is privately held and not currently listed for sale.
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & Specifications
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Blockchain Transaction History
          </button>
          <button
            className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            ⚖️ Encumbrance & Legal Audit Logs ({freezeLogs.length + encumbranceLogs.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
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

        {/* Tab 2: Provenance History */}
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

        {/* Tab 3: Legal & Encumbrance Logs */}
        {activeTab === 'audit' && (
          <div className="card animate-in">
            <h3 className="mb-16 flex items-center gap-8">
              <ShieldAlert size={18} color="#dc2626" /> Regulatory & Legal State Audit Log
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-500)', marginBottom: 20 }}>
              Immutable audit history maintained directly inside the smart contract World State for legal disputes and mortgage encumbrance certificates (EC):
            </p>

            {/* Court Injunction History */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Scale size={16} color="#dc2626" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Judicial Stay & Injunction Log</span>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                  {freezeLogs.length} events
                </span>
              </div>

              {freezeLogs.length === 0 ? (
                <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--r)', fontSize: '0.8125rem', color: 'var(--text-400)' }}>
                  No judicial restraint orders have been registered against this property. Title is legally clear of stays.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {freezeLogs.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: log.action === 'FROZEN' ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${log.action === 'FROZEN' ? '#fecaca' : '#bbf7d0'}`,
                        borderRadius: 'var(--r)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className="badge"
                            style={{
                              background: log.action === 'FROZEN' ? '#dc2626' : '#16a34a',
                              color: '#fff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
                          >
                            {log.action}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            Order: {log.caseNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', marginTop: 4 }}>
                          "{log.remarks}" &nbsp;•&nbsp; Issued by: <strong>{log.by}</strong>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-400)', fontFamily: 'monospace' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bank Lien History */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Landmark size={16} color="#0284c7" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Bank Mortgage & Lien Audit Log</span>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                  {encumbranceLogs.length} events
                </span>
              </div>

              {encumbranceLogs.length === 0 ? (
                <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--r)', fontSize: '0.8125rem', color: 'var(--text-400)' }}>
                  No mortgage liens or financial encumbrances registered. Title is unencumbered.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {encumbranceLogs.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: log.action === 'PLACED' ? '#fffbeb' : '#f0fdf4',
                        border: `1px solid ${log.action === 'PLACED' ? '#fde68a' : '#bbf7d0'}`,
                        borderRadius: 'var(--r)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className="badge"
                            style={{
                              background: log.action === 'PLACED' ? '#d97706' : '#16a34a',
                              color: '#fff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
                          >
                            LIEN {log.action}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            Type: {log.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', marginTop: 4 }}>
                          "{log.remarks}" &nbsp;•&nbsp; Signer: <strong>{log.by}</strong>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-400)', fontFamily: 'monospace' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
