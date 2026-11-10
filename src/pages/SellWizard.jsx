import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Landmark,
  Building2,
  Tag,
  Layers,
  Database,
  Check,
  Building,
  MapPin,
  ShieldCheck,
  FileCheck,
  Cpu,
  Copy,
  Store,
  Sparkles,
  Printer,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';
import TransactionOtpModal from '../components/TransactionOtpModal';

const STAGES = [
  { id: 'endorsement', label: 'Endorsement' },
  { id: 'price_terms', label: 'Listing Terms' },
  { id: 'orderer', label: 'Block Packing' },
  { id: 'commit', label: 'Ledger Commit' },
];

const s = {
  sectionCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    padding: '20px 24px',
    marginBottom: 20,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '7px 0',
    fontSize: '0.8125rem',
    borderBottom: '1px solid var(--border)',
  },
  rowLast: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '7px 0',
    fontSize: '0.8125rem',
  },
  label: { color: 'var(--text-400)' },
  val: { fontWeight: 500, color: 'var(--text-900)' },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 24,
  },
};

export default function SellWizard({ prop, user, setPage }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Listing Price & Terms
  const [askingPrice, setAskingPrice] = useState(prop?.rawValue || 5000000);
  const [saleTerms, setSaleTerms] = useState({
    immediateRegistration: true,
    possessionTimeline: 'Immediate upon full settlement',
    buyerKycRequired: true,
  });

  // Stage 1: Endorsements
  const [sroStatus, setSroStatus] = useState('idle'); // idle | verifying | endorsed | failed
  const [sroData, setSroData] = useState(null);
  const [sroError, setSroError] = useState(null);
  const [tahsildarStatus, setTahsildarStatus] = useState('idle'); // idle | verifying | endorsed | failed | blocked
  const [tahsildarData, setTahsildarData] = useState(null);

  // Stage 3: Orderer
  const [ordererData, setOrdererData] = useState(null);

  // Stage 4: Commit & CouchDB
  const [commitData, setCommitData] = useState(null);

  // Stage 5: Complete
  const [isCompleted, setIsCompleted] = useState(false);
  const [otpRequestKey, setOtpRequestKey] = useState(null);

  const sellerId = prop?.owner || user?.email || 'citizen@cdac.in';

  if (!prop) {
    return (
      <div className="page container animate-in" style={{ paddingTop: 60, textAlign: 'center' }}>
        <h2>No property selected for listing</h2>
        <button className="btn btn-primary mt-16" onClick={() => setPage('my-properties')}>
          Go to My Properties
        </button>
      </div>
    );
  }

  // ── Stage 1: Dual-Node Listing Endorsement ──
  const executeDualNodeVerification = async () => {
    setLoading(true);
    setSroStatus('verifying');
    setTahsildarStatus('verifying');
    setSroError(null);

    try {
      let sroRes;
      try {
        sroRes = await BlockchainAPI.verifySroNode(prop.id);
      } catch (sroErr) {
        const raw = sroErr.message || '';
        const match = raw.match(/Error:\s*(.+)/);
        const reason = match ? match[1].trim() : raw;
        setSroStatus('failed');
        setSroError(reason);
        setTahsildarStatus('blocked');
        setLoading(false);
        return;
      }

      setSroData(sroRes);
      setSroStatus('endorsed');

      try {
        const tahsildarRes = await BlockchainAPI.verifyTahsildarNode(prop.id, sellerId);
        setTahsildarData(tahsildarRes);
        setTahsildarStatus('endorsed');
      } catch (tahErr) {
        const raw = tahErr.message || '';
        const match = raw.match(/Error:\s*(.+)/);
        const reason = match ? match[1].trim() : raw;
        setSroError(reason);
        setTahsildarStatus('failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Stage 3: Submit Listing to Orderer ──
  const executeOrdererPacking = async () => {
    setLoading(true);
    try {
      const res = await BlockchainAPI.sendListingToOrderer({
        propertyId: prop.id,
        askingPrice,
        sroSig: sroData?.endorsementSignature,
        tahsildarSig: tahsildarData?.endorsementSignature,
        seller: sellerId,
      });
      setOrdererData(res);
      setCurrentStage(3);
    } catch (err) {
      alert(`Orderer Packaging Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Stage 4: Broadcast to Peers & CouchDB State Update ──
  const handleFinalizeClick = () => {
    setOtpRequestKey(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  };

  const handleOtpVerified = () => {
    setOtpRequestKey(null);
    executeBroadcastAndCommit();
  };

  const executeBroadcastAndCommit = async () => {
    setLoading(true);
    try {
      const res = await BlockchainAPI.broadcastAndCommitListing({
        propertyId: prop.id,
        askingPrice,
        blockData: ordererData,
        seller: sellerId,
      });
      setCommitData(res);
      setIsCompleted(true);
    } catch (err) {
      alert(`Listing Commit Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Stage 5: Completed Screen ──
  if (isCompleted) {
    const couchDoc = commitData?.couchDbState || {};
    return (
      <div className="page animate-in">
        <div style={{ maxWidth: 640, margin: '40px auto 60px', padding: '0 20px', textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={32} color="#059669" />
          </div>

          <span className="badge badge-green mb-8" style={{ fontSize: '0.75rem' }}>✓ Listing Block Sealed</span>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 6 }}>Property Registered for Sale</h1>
          <p style={{ color: 'var(--text-500)', fontSize: '0.85rem', marginBottom: 24 }}>
            Listing receipt sealed on Fabric ledger and published to PropChain Marketplace.
          </p>

          {/* Receipt Card */}
          <div style={{ ...s.sectionCard, textAlign: 'left', marginBottom: 24 }}>
            <div style={s.row}>
              <span style={s.label}>Listing Reference</span>
              <span style={s.val}>LIST-{prop.id}-{Date.now().toString().slice(-6)}</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Property</span>
              <span style={s.val}>{prop.title}</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Area</span>
              <span style={s.val}>{prop.area} ({prop.type})</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Owner / Seller</span>
              <span style={s.val}>{sellerId}</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Published Asking Price</span>
              <span style={{ ...s.val, color: 'var(--green)', fontWeight: 700, fontSize: '0.95rem' }}>
                ₹{Number(askingPrice).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Block Height</span>
              <span style={s.val}>#{ordererData?.blockNumber || 350}</span>
            </div>
            <div style={s.rowLast}>
              <span style={s.label}>TxID</span>
              <span style={{ ...s.val, fontFamily: "'Courier New', monospace", fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {ordererData?.txId?.slice(0, 20)}…
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 5px', height: 'auto', minHeight: 'unset' }}
                  onClick={() => copyToClipboard(ordererData?.txId, 'txId')}
                >
                  {copiedField === 'txId' ? 'Copied!' : <Copy size={11} />}
                </button>
              </span>
            </div>

            <div style={{ marginTop: 14, padding: 10, background: 'var(--bg-subtle)', borderRadius: 6, fontSize: '0.72rem', fontFamily: "'Courier New', monospace", color: 'var(--text-500)', lineHeight: 1.6, wordBreak: 'break-all' }}>
              SRO Sig: {sroData?.endorsementSignature?.slice(0, 36)}…<br />
              Tahsildar Sig: {tahsildarData?.endorsementSignature?.slice(0, 36)}…<br />
              CouchDB Rev: {couchDoc._rev || '2-9a8b1c…'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => setPage('marketplace')}>
              <Store size={15} /> View in Marketplace
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('my-properties')}>
              <Building size={15} /> Go to My Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── WIZARD MAIN ──
  return (
    <div className="page animate-in">
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px 60px' }}>
        <button className="btn btn-ghost btn-sm mb-16" onClick={() => setPage('my-properties')}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* Property Summary Bar */}
        <div style={{ ...s.sectionCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginBottom: 2 }}>{prop.type} • {prop.id}</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{prop.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <MapPin size={12} /> {prop.address}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Registered Value</div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--green)' }}>{prop.value}</div>
          </div>
        </div>

        {/* Step Indicator — minimal numbered pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
          {STAGES.map((stg, idx) => {
            const isDone = idx < currentStage || isCompleted;
            const isActive = idx === currentStage && !isCompleted;
            return (
              <React.Fragment key={stg.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700,
                    background: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--bg-subtle)',
                    color: isDone || isActive ? '#fff' : 'var(--text-400)',
                    border: isDone || isActive ? 'none' : '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                  }}>
                    {isDone ? <Check size={13} /> : idx + 1}
                  </div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: isActive ? 600 : 400,
                    color: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--text-400)',
                  }}>
                    {stg.label}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <div style={{
                    flex: 1, height: 1, margin: '0 10px',
                    background: idx < currentStage ? 'var(--green)' : 'var(--border)',
                    transition: 'background 0.2s ease',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STAGE 1: Endorsement ── */}
        {currentStage === 0 && (
          <div className="animate-in">
            <h2 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Node Endorsement</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-500)', marginBottom: 20, lineHeight: 1.5 }}>
              Proposal sent concurrently to SRO and Revenue Department nodes for verification.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
              {/* SRO Node */}
              <div style={{
                ...s.sectionCard, marginBottom: 0,
                borderColor: sroStatus === 'endorsed' ? 'var(--green)' : sroStatus === 'verifying' ? 'var(--accent)' : sroStatus === 'failed' ? '#ef4444' : 'var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Landmark size={16} color="#2563eb" />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>SRO Node</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontFamily: "'Courier New', monospace", color: 'var(--text-400)' }}>:7051</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-500)', marginBottom: 10 }}>
                  Encumbrance & mortgage register check
                </div>

                {sroStatus === 'idle' && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', padding: '12px 0', textAlign: 'center' }}>
                    Awaiting trigger…
                  </div>
                )}
                {sroStatus === 'verifying' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>Scanning registers…</span>
                  </div>
                )}
                {sroStatus === 'endorsed' && sroData && (
                  <div className="animate-in">
                    {['Identity Verification', 'Stamp Duty Calculation', 'Encumbrance Check'].map((c) => (
                      <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '0.78rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-700)' }}>
                          <CheckCircle2 size={13} color="#059669" /> {c}
                        </span>
                        <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.7rem' }}>PASS</span>
                      </div>
                    ))}
                  </div>
                )}
                {sroStatus === 'failed' && (
                  <div className="animate-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '0.78rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626' }}>
                        <XCircle size={13} color="#dc2626" /> Encumbrance Check
                      </span>
                      <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.7rem' }}>BLOCKED</span>
                    </div>
                    <div style={{ marginTop: 8, padding: '6px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, fontSize: '0.72rem', color: '#991b1b', lineHeight: 1.4 }}>
                      {sroError || 'Encumbrance check failed.'}
                    </div>
                  </div>
                )}
              </div>

              {/* Tahsildar Node */}
              <div style={{
                ...s.sectionCard, marginBottom: 0,
                borderColor: tahsildarStatus === 'endorsed' ? 'var(--green)' : tahsildarStatus === 'verifying' ? 'var(--accent)' : tahsildarStatus === 'failed' ? '#ef4444' : 'var(--border)',
                opacity: tahsildarStatus === 'blocked' ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={16} color="#7c3aed" />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Revenue Dept Node</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontFamily: "'Courier New', monospace", color: 'var(--text-400)' }}>:8051</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-500)', marginBottom: 10 }}>
                  Title authenticity & ownership verification
                </div>

                {(tahsildarStatus === 'idle' || tahsildarStatus === 'blocked') && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', padding: '12px 0', textAlign: 'center' }}>
                    {tahsildarStatus === 'blocked' ? 'Awaiting SRO clearance…' : 'Awaiting trigger…'}
                  </div>
                )}
                {tahsildarStatus === 'verifying' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: '#7c3aed' }}>Querying RoR records…</span>
                  </div>
                )}
                {tahsildarStatus === 'endorsed' && tahsildarData && (
                  <div className="animate-in">
                    {[
                      { label: 'Ownership Check', badge: 'CONFIRMED' },
                      { label: tahsildarData.portalDetails?.recordType || 'Record Verification', badge: tahsildarData.portalDetails?.badge || 'VERIFIED' },
                      { label: 'Survey Verification', badge: 'PASS' },
                    ].map((c) => (
                      <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '0.78rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-700)' }}>
                          <CheckCircle2 size={13} color="#059669" /> {c.label}
                        </span>
                        <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.7rem' }}>{c.badge}</span>
                      </div>
                    ))}
                  </div>
                )}
                {tahsildarStatus === 'failed' && (
                  <div className="animate-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '0.78rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626' }}>
                        <XCircle size={13} color="#dc2626" /> Title Verification
                      </span>
                      <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.7rem' }}>REJECTED</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Endorsement success banner */}
            {sroStatus === 'endorsed' && tahsildarStatus === 'endorsed' && (
              <div className="animate-in" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0',
                borderRadius: 6, marginBottom: 4, flexWrap: 'wrap', gap: 8,
              }}>
                <span style={{ fontSize: '0.8rem', color: '#047857', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} color="#059669" /> Both nodes endorsed successfully
                </span>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>2/2 Signatures</span>
              </div>
            )}

            {/* Endorsement failure banner */}
            {(sroStatus === 'failed' || tahsildarStatus === 'failed') && (
              <div className="animate-in" style={{
                padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 6, marginBottom: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 600, fontSize: '0.82rem', marginBottom: 4 }}>
                  <AlertTriangle size={15} /> Endorsement Policy Failed
                </div>
                <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                  The proposal was rejected by an endorsing peer. Active encumbrance must be cleared before listing.
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={s.actions}>
              {sroStatus === 'failed' || tahsildarStatus === 'failed' ? (
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSroStatus('idle');
                    setSroError(null);
                    setTahsildarStatus('idle');
                  }}
                >
                  Reset & Retry
                </button>
              ) : sroStatus !== 'endorsed' ? (
                <button className="btn btn-primary" onClick={executeDualNodeVerification} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
                      Querying…
                    </>
                  ) : (
                    <><Landmark size={15} /> Send Proposal</>
                  )}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setCurrentStage(1)}>
                  Continue <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STAGE 2: Marketplace Terms & Price ── */}
        {currentStage === 1 && (
          <div className="animate-in">
            <h2 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Listing Terms & Price</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-500)', marginBottom: 20 }}>
              Specify your agreed asking price and sale terms.
            </p>

            <div style={{ ...s.sectionCard, marginBottom: 20 }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-700)', display: 'block', marginBottom: 6 }}>
                  Asking Consideration Price (₹ INR)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-400)' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    className="form-input"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(Number(e.target.value))}
                    placeholder="e.g. 5000000"
                    style={{ paddingLeft: 28, fontSize: '0.92rem', fontWeight: 600 }}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: 4 }}>
                  Display price: <strong>₹{Number(askingPrice || 0).toLocaleString('en-IN')}</strong>
                </div>

                {prop?.guidelineValue && askingPrice < prop.guidelineValue && (
                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '6px 10px', borderRadius: 6 }}>
                    ⚠️ Notice: Asking price is below Govt Guideline Value (₹{Number(prop.guidelineValue).toLocaleString('en-IN')}). Stamp duty will be levied on the minimum guideline base.
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-700)', display: 'block', marginBottom: 6 }}>
                  Possession Timeline
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={saleTerms.possessionTimeline}
                  onChange={(e) => setSaleTerms({ ...saleTerms, possessionTimeline: e.target.value })}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-900)', marginBottom: 6 }}>Sale Conditions:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', color: 'var(--text-500)' }}>
                  <div>✓ Automatic title conveyance upon buyer payment of consideration + stamp duty.</div>
                  <div>✓ Encumbrance clearance and ownership certificates embedded in listing.</div>
                  <div>✓ Buyer Aadhaar / digital identity verification required.</div>
                </div>
              </div>
            </div>

            <div style={s.actions}>
              <button className="btn btn-ghost" onClick={() => setCurrentStage(0)} disabled={loading}>
                <ArrowLeft size={14} /> Back
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentStage(2)}
                disabled={loading || !askingPrice}
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 3: Orderer ── */}
        {currentStage === 2 && (
          <div className="animate-in">
            <h2 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Orderer Block Packing</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-500)', marginBottom: 20, lineHeight: 1.5 }}>
              Aggregating endorsement signatures and listing terms for block formation.
            </p>

            <div style={{ ...s.sectionCard, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Cpu size={16} color="#38bdf8" />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Orderer Node (Raft)</span>
                </div>
                <span style={{ fontSize: '0.68rem', fontFamily: "'Courier New', monospace", color: '#64748b' }}>orderer.cdac.in:7050</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.75rem', marginBottom: 14 }}>
                <div>
                  <div style={{ color: '#64748b', marginBottom: 4, fontWeight: 500 }}>Payload</div>
                  <div style={{ lineHeight: 1.7 }}>
                    ✓ SRO Endorsement<br />
                    ✓ Tahsildar Endorsement<br />
                    ✓ Asking: ₹{Number(askingPrice).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', marginBottom: 4, fontWeight: 500 }}>Consensus</div>
                  <div style={{ lineHeight: 1.7 }}>
                    Raft (3-Node Cluster)<br />
                    Channel: <code style={{ color: '#38bdf8' }}>localchannelone</code>
                  </div>
                </div>
              </div>

              {ordererData && (
                <div className="animate-in" style={{ borderTop: '1px solid #1e293b', paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Block minted</span>
                    <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>Block #{ordererData.blockNumber}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontFamily: "'Courier New', monospace", color: '#38bdf8', wordBreak: 'break-all', lineHeight: 1.6 }}>
                    Hash: {ordererData.blockHash}<br />
                    TxID: {ordererData.txId}
                  </div>
                </div>
              )}
            </div>

            <div style={s.actions}>
              <button className="btn btn-ghost" onClick={() => setCurrentStage(1)} disabled={loading}>
                <ArrowLeft size={14} /> Back
              </button>
              {!ordererData ? (
                <button className="btn btn-primary" onClick={executeOrdererPacking} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
                      Packing…
                    </>
                  ) : (
                    <><Layers size={15} /> Submit to Orderer</>
                  )}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setCurrentStage(3)}>
                  Continue <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STAGE 4: Commit ── */}
        {currentStage === 3 && (
          <div className="animate-in">
            <h2 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Ledger Commit</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-500)', marginBottom: 20, lineHeight: 1.5 }}>
              Broadcasting block to all peer nodes and updating CouchDB world state.
            </p>

            {/* Peer commit list */}
            <div style={{ ...s.sectionCard, marginBottom: 16 }}>
              {[
                { name: 'SRO Peer', port: 'peer0.sro.gov.in:7051' },
                { name: 'Revenue Dept Peer', port: 'peer0.tahsildar.gov.in:8051' },
                { name: 'Marketplace Registry Peer', port: 'peer0.cdac.gov.in:9051' },
              ].map((peer, idx, arr) => (
                <div key={peer.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: '0.82rem',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-700)' }}>
                    <CheckCircle2 size={14} color="#059669" /> {peer.name}
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-400)', fontFamily: "'Courier New', monospace" }}>({peer.port})</span>
                  </span>
                  <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.72rem' }}>Committed</span>
                </div>
              ))}
            </div>

            {/* CouchDB preview */}
            <div style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #1e293b', fontSize: '0.72rem', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Database size={13} color="#38bdf8" /> CouchDB World State
                </span>
                <span>JSON</span>
              </div>
              <pre style={{ margin: 0, lineHeight: 1.5, color: '#38bdf8', fontSize: '0.75rem' }}>
                {JSON.stringify(
                  {
                    _id: prop.id,
                    _rev: commitData?.couchDbState?._rev || '2-9a8b1c4e72',
                    docType: 'LandTitleAsset',
                    title: prop.title,
                    owner: sellerId,
                    status: 'FOR_SALE',
                    listedForSale: true,
                    askingPrice: `₹${Number(askingPrice).toLocaleString('en-IN')}`,
                    lastBlockNumber: ordererData?.blockNumber || 350,
                    lastTxId: ordererData?.txId || '0x882fa...',
                    updatedAt: new Date().toISOString(),
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div style={s.actions}>
              <button
                className="btn btn-primary"
                onClick={handleFinalizeClick}
                disabled={loading || Boolean(otpRequestKey)}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
                    Publishing…
                  </>
                ) : (
                  <><Sparkles size={15} /> Finalize Listing</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {otpRequestKey && (
        <TransactionOtpModal
          key={otpRequestKey}
          isOpen={Boolean(otpRequestKey)}
          requestKey={otpRequestKey}
          action="sell"
          prop={prop}
          user={user}
          title="Verify OTP to Finalize Sale Listing"
          confirmLabel="Verify & Finalize Listing"
          amountLabel="Asking Price"
          amountDisplay={`₹${Number(askingPrice || 0).toLocaleString('en-IN')}`}
          onVerified={handleOtpVerified}
          onClose={() => setOtpRequestKey(null)}
        />
      )}
    </div>
  );
}
