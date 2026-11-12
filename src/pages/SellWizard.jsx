import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Landmark,
  Building2,
  Check,
  Building,
  MapPin,
  ShieldCheck,
  Copy,
  Store,
  Sparkles,
  Printer,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';
import TransactionOtpModal from '../components/TransactionOtpModal';
import TitleDeedModal from '../components/TitleDeedModal';

const STAGES = [
  { id: 'endorsement', label: 'Endorsement' },
  { id: 'price_terms', label: 'Listing Terms' },
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
  const shouldAutoVerifyOnMount = Boolean(prop?.id);
  const [currentStage, setCurrentStage] = useState(0);
  const [loading, setLoading] = useState(shouldAutoVerifyOnMount);
  const [copiedField, setCopiedField] = useState(null);

  // Listing Price & Terms
  const [askingPrice, setAskingPrice] = useState(prop?.rawValue || 5000000);
  const [saleTerms, setSaleTerms] = useState({
    immediateRegistration: true,
    possessionTimeline: 'Immediate upon full settlement',
    buyerKycRequired: true,
  });

  // Stage 1: Endorsements
  const [sroStatus, setSroStatus] = useState(shouldAutoVerifyOnMount ? 'verifying' : 'idle'); // idle | verifying | endorsed | failed
  const [sroData, setSroData] = useState(null);
  const [sroError, setSroError] = useState(null);
  const [tahsildarStatus, setTahsildarStatus] = useState(shouldAutoVerifyOnMount ? 'verifying' : 'idle'); // idle | verifying | endorsed | failed | blocked
  const [tahsildarData, setTahsildarData] = useState(null);

  // Finalization & Completion
  const [ordererData, setOrdererData] = useState(null);
  const [commitData, setCommitData] = useState(null);
  const [listingDutyCalc, setListingDutyCalc] = useState(null);
  const [listingRef, setListingRef] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDeedModal, setShowDeedModal] = useState(false);
  const [otpRequestKey, setOtpRequestKey] = useState(null);
  const [citizens, setCitizens] = useState([]);

  const sellerId = prop?.owner || user?.email || 'citizen@cdac.in';

  useEffect(() => {
    let cancelled = false;
    BlockchainAPI.getRegisteredCitizens()
      .then((list) => {
        if (!cancelled && Array.isArray(list)) {
          setCitizens(list);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const runDualNodeVerification = useCallback(async (isCancelled = () => false) => {
    if (!prop?.id) return;
    setLoading(true);
    setSroStatus('verifying');
    setTahsildarStatus('verifying');
    setSroError(null);

    try {
      let sroRes;
      try {
        sroRes = await BlockchainAPI.verifySroNode(prop.id);
      } catch (sroErr) {
        if (isCancelled()) return;
        const raw = sroErr.message || '';
        const match = raw.match(/Error:\s*(.+)/);
        const reason = match ? match[1].trim() : raw;
        setSroStatus('failed');
        setSroError(reason);
        setTahsildarStatus('blocked');
        return;
      }

      if (isCancelled()) return;
      setSroData(sroRes);
      setSroStatus('endorsed');

      try {
        const tahsildarRes = await BlockchainAPI.verifyTahsildarNode(prop.id, sellerId);
        if (isCancelled()) return;
        setTahsildarData(tahsildarRes);
        setTahsildarStatus('endorsed');
      } catch (tahErr) {
        if (isCancelled()) return;
        const raw = tahErr.message || '';
        const match = raw.match(/Error:\s*(.+)/);
        const reason = match ? match[1].trim() : raw;
        setSroError(reason);
        setTahsildarStatus('failed');
      }
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }, [prop?.id, sellerId]);

  // Automatically send endorsement proposal as soon as the user clicks Sell
  useEffect(() => {
    if (!prop?.id) return undefined;

    let cancelled = false;
    runDualNodeVerification(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [prop?.id, runDualNodeVerification]);

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

  // ── Stage 1: Manual retry wrapper ──
  const executeDualNodeVerification = () => {
    runDualNodeVerification();
  };

  // ── Stage 2 Finalize: OTP Verification -> Orderer & Ledger Commit ──
  const handleFinalizeClick = () => {
    setOtpRequestKey(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  };

  const handleOtpVerified = () => {
    setOtpRequestKey(null);
    executeFinalizeListing();
  };

  const executeFinalizeListing = async () => {
    setLoading(true);
    try {
      const numericPrice = Number(askingPrice || prop.rawValue || 0);
      const [ordererRes, dutyRes] = await Promise.all([
        BlockchainAPI.sendListingToOrderer({
          propertyId: prop.id,
          askingPrice: numericPrice,
          sroSig: sroData?.endorsementSignature,
          tahsildarSig: tahsildarData?.endorsementSignature,
          seller: sellerId,
        }),
        BlockchainAPI.calculateStampDuty(prop.id, numericPrice).catch(() => null),
      ]);

      const commitRes = await BlockchainAPI.broadcastAndCommitListing({
        propertyId: prop.id,
        askingPrice: numericPrice,
        blockData: ordererRes,
        seller: sellerId,
      });

      const stableRef = `LIST-${prop.id}-${
        String(ordererRes?.txId || Date.now())
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(-6)
          .toUpperCase() || 'VERIFIED'
      }`;

      setOrdererData(ordererRes);
      setListingDutyCalc(dutyRes);
      setCommitData(commitRes);
      setListingRef(stableRef);
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

  // ── Completed Screen ──
  if (isCompleted) {
    const couchDoc = commitData?.couchDbState || {};
    const listedValue = Number(askingPrice || prop.rawValue || 0);
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
              <span style={s.val}>{listingRef || `LIST-${prop.id}`}</span>
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
                ₹{listedValue.toLocaleString('en-IN')}
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowDeedModal(true)}>
              <Printer size={15} /> Print Deed
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('marketplace')}>
              <Store size={15} /> View in Marketplace
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('my-properties')}>
              <Building size={15} /> Go to My Properties
            </button>
          </div>
        </div>

        {/* Official Print-Ready Sale Deed Modal */}
        <TitleDeedModal
          isOpen={showDeedModal}
          onClose={() => setShowDeedModal(false)}
          prop={{
            ...prop,
            listedForSale: true,
            status: 'for_sale',
            rawValue: listedValue,
            value: `₹${listedValue.toLocaleString('en-IN')}`,
            askingPrice: listedValue,
            blockNumber: ordererData?.blockNumber || prop.blockNumber,
            lastTxId: ordererData?.txId || prop.lastTxId,
            stampDuty: listingDutyCalc?.baseStampDuty ?? prop.stampDuty,
            registrationFee: listingDutyCalc?.registrationFee ?? prop.registrationFee,
          }}
          currentUser={user}
          citizens={citizens}
          deedDate={commitData?.couchDbState?.updatedAt || ordererData?.packedAt}
          govtValue={Number(prop.guidelineValue || prop.rawValue || listedValue)}
          saleValue={listedValue}
          dutyCalc={listingDutyCalc}
          sroData={sroData}
          tahsildarData={tahsildarData}
          ordererData={ordererData}
          commitData={commitData}
        />
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
                    Pending verification…
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
                    {tahsildarStatus === 'blocked' ? 'Awaiting SRO clearance…' : 'Pending verification…'}
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
              {!loading && (sroStatus !== 'endorsed' || tahsildarStatus !== 'endorsed') && (
                <button className="btn btn-ghost" onClick={executeDualNodeVerification}>
                  Retry
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={() => setCurrentStage(1)}
                disabled={loading || sroStatus !== 'endorsed' || tahsildarStatus !== 'endorsed'}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
                    Next <ArrowRight size={15} />
                  </>
                ) : (
                  <>
                    Next <ArrowRight size={15} />
                  </>
                )}
              </button>
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
              <button
                className="btn btn-ghost"
                onClick={() => setCurrentStage(0)}
                disabled={loading || Boolean(otpRequestKey)}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleFinalizeClick}
                disabled={loading || Boolean(otpRequestKey) || !askingPrice || Number(askingPrice) <= 0}
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
