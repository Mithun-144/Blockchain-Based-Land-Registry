import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Landmark,
  CreditCard,
  Layers,
  Database,
  Check,
  Building,
  Building2,
  MapPin,
  ShieldCheck,
  FileCheck,
  Cpu,
  Copy,
  Printer,
  Sparkles,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

const STAGES = [
  { id: 'endorsement', label: 'Endorsement' },
  { id: 'stamp_duty',  label: 'Stamp Duty' },
  { id: 'orderer',     label: 'Block Packing' },
  { id: 'commit',      label: 'Ledger Commit' },
];

export default function TransferWizard({ prop, user, setPage }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const [sroStatus, setSroStatus] = useState('idle');
  const [sroData, setSroData] = useState(null);
  const [tahsildarStatus, setTahsildarStatus] = useState('idle');
  const [tahsildarData, setTahsildarData] = useState(null);

  const [dutyCalc, setDutyCalc] = useState(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState('cyber_treasury');
  const [paymentData, setPaymentData] = useState(null);

  const [ordererData, setOrdererData] = useState(null);
  const [commitData, setCommitData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDeedModal, setShowDeedModal] = useState(false);

  const buyerId = user?.email || 'citizen@cdac.in';
  const sellerId = prop?.owner || 'seller@cdac.in';
  const rawAmount = prop?.rawValue || 6200000;

  useEffect(() => {
    if (prop) {
      BlockchainAPI.calculateStampDuty(prop.id, rawAmount).then((calc) => {
        setDutyCalc(calc);
      });
    }
  }, [prop, rawAmount]);

  if (!prop) {
    return (
      <div className="page container animate-in" style={{ paddingTop: 60, textAlign: 'center' }}>
        <h2>No property selected for purchase</h2>
        <button className="btn btn-primary mt-16" onClick={() => setPage('marketplace')}>
          Browse Marketplace
        </button>
      </div>
    );
  }

  // ── Handlers ──
  const executeDualNodeVerification = async () => {
    setLoading(true);
    setSroStatus('verifying');
    setTahsildarStatus('verifying');
    try {
      const [sroRes, tahsildarRes] = await Promise.all([
        BlockchainAPI.verifySroNode(prop.id),
        BlockchainAPI.verifyTahsildarNode(prop.id, sellerId),
      ]);
      setSroData(sroRes);
      setSroStatus('endorsed');
      setTahsildarData(tahsildarRes);
      setTahsildarStatus('endorsed');
    } catch (err) {
      alert(`Node Endorsement Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executePayment = async () => {
    setLoading(true);
    try {
      const payMethodLabel =
        selectedPayMethod === 'cyber_treasury'
          ? 'State Cyber Treasury e-Challan (IFMS / K2 Portal)'
          : selectedPayMethod === 'upi'
            ? 'Bharat QR / UPI (gov.treasury@sbi)'
            : 'National Bank Consortium NetBanking';
      const res = await BlockchainAPI.payStampDuty(prop.id, dutyCalc?.total || 373500, payMethodLabel);
      setPaymentData(res);
      setCurrentStage(2);
    } catch (err) {
      alert(`Payment Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeOrdererPacking = async () => {
    setLoading(true);
    try {
      const res = await BlockchainAPI.sendToOrderer({
        propertyId: prop.id,
        sroSig: sroData?.endorsementSignature,
        tahsildarSig: tahsildarData?.endorsementSignature,
        challanNo: paymentData?.challanNo,
        buyer: buyerId,
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

  const executeBroadcastAndCommit = async () => {
    setLoading(true);
    try {
      const res = await BlockchainAPI.broadcastAndCommitLedger({
        propertyId: prop.id,
        fromOwner: sellerId,
        toOwner: buyerId,
        blockData: ordererData,
        challanNo: paymentData?.challanNo,
      });
      setCommitData(res);
      setIsCompleted(true);
    } catch (err) {
      alert(`Commit Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Inline styles ──
  const s = {
    label: { fontSize: '0.75rem', color: 'var(--text-400)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 },
    val: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-900)' },
    mono: { fontFamily: "'Courier New', monospace", fontSize: '0.8rem' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' },
    rowLast: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' },
    sectionCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 16 },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  };

  // ── COMPLETED SCREEN ──
  if (isCompleted) {
    const couchDoc = commitData?.couchDbState || {};
    return (
      <div className="page container animate-in" style={{ paddingTop: 40, maxWidth: 720 }}>
        <div style={{ ...s.sectionCard, padding: '32px 28px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="#059669" style={{ marginBottom: 12 }} />

          <h2 style={{ margin: '0 0 6px', fontSize: '1.5rem', color: 'var(--text-900)' }}>
            Transfer Complete
          </h2>
          <p style={{ color: 'var(--text-500)', maxWidth: 520, margin: '0 auto 24px', fontSize: '0.875rem', lineHeight: 1.6 }}>
            Ownership of <strong>{prop.title}</strong> has been transferred, endorsed, and committed to the blockchain ledger.
          </p>

          {/* Receipt */}
          <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Transfer Receipt</span>
              <span className="badge badge-purple">Block #{ordererData?.blockNumber || 348}</span>
            </div>

            <div style={s.row}>
              <span style={s.label}>Property ID</span>
              <span style={{ ...s.val, ...s.mono }}>{prop.id}</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>New Owner</span>
              <span style={{ ...s.val, color: 'var(--green)' }}>{buyerId}</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Previous Owner</span>
              <span style={s.val}>{sellerId}</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Challan Ref</span>
              <span style={{ ...s.val, color: '#d97706' }}>{paymentData?.challanNo}</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Transaction ID</span>
              <span style={{ ...s.val, ...s.mono, fontSize: '0.75rem' }}>
                {ordererData?.txId?.slice(0, 24)}…
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 6px', marginLeft: 6 }}
                  onClick={() => copyToClipboard(ordererData?.txId, 'txId')}
                >
                  {copiedField === 'txId' ? 'Copied!' : <Copy size={11} />}
                </button>
              </span>
            </div>
            <div style={s.row}>
              <span style={s.label}>CouchDB Revision</span>
              <span style={{ ...s.val, ...s.mono, color: '#7c3aed', fontSize: '0.78rem' }}>
                {couchDoc._rev || '2-98ab42c…'}
              </span>
            </div>
            <div style={s.rowLast}>
              <span style={s.label}>Peer Endorsements</span>
              <span style={{ ...s.val, fontSize: '0.8rem', color: 'var(--green)' }}>
                ✓ SRO  •  ✓ Tahsildar
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => setShowDeedModal(true)}>
              <Printer size={15} /> Print Deed
            </button>
            <button className="btn btn-primary" onClick={() => setPage('my-properties')}>
              My Properties →
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('marketplace')}>
              Marketplace
            </button>
          </div>
        </div>

        {/* Deed Modal */}
        {showDeedModal && (
          <div className="modal-overlay animate-in" onClick={() => setShowDeedModal(false)}>
            <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span className="font-700">Title Deed Certificate</span>
                <button className="modal-close" onClick={() => setShowDeedModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>GOVERNMENT OF INDIA & STATE REVENUE DEPARTMENT</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-400)' }}>NBF-LITE • TITLE DEED CERTIFICATE</div>
                </div>

                <div style={s.row}>
                  <span style={s.label}>Deed Reference</span>
                  <span style={s.val}>DEED-{prop.id}-{Date.now().toString().slice(-6)}</span>
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
                  <span style={s.label}>Buyer</span>
                  <span style={{ ...s.val, color: 'var(--green)' }}>{buyerId}</span>
                </div>
                <div style={s.row}>
                  <span style={s.label}>Seller</span>
                  <span style={s.val}>{sellerId}</span>
                </div>
                <div style={s.row}>
                  <span style={s.label}>Consideration</span>
                  <span style={s.val}>{prop.value}</span>
                </div>
                <div style={s.row}>
                  <span style={s.label}>Challan</span>
                  <span style={s.val}>{paymentData?.challanNo}</span>
                </div>
                <div style={s.rowLast}>
                  <span style={s.label}>Block Height</span>
                  <span style={s.val}>#{ordererData?.blockNumber}</span>
                </div>

                <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-subtle)', borderRadius: 6, fontSize: '0.72rem', fontFamily: "'Courier New', monospace", color: 'var(--text-500)', lineHeight: 1.7, wordBreak: 'break-all' }}>
                  SRO Sig: {sroData?.endorsementSignature?.slice(0, 36)}…<br />
                  Tahsildar Sig: {tahsildarData?.endorsementSignature?.slice(0, 36)}…<br />
                  Merkle Root: {ordererData?.merkleRoot}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── WIZARD MAIN ──
  return (
    <div className="page animate-in">
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px 60px' }}>
        <button className="btn btn-ghost btn-sm mb-16" onClick={() => setPage('marketplace')}>
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
            <div style={{ fontSize: '0.68rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600 }}>Price</div>
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
                borderColor: sroStatus === 'endorsed' ? 'var(--green)' : sroStatus === 'verifying' ? 'var(--accent)' : 'var(--border)',
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
                    <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--bg-subtle)', borderRadius: 4, fontSize: '0.68rem', fontFamily: "'Courier New', monospace", color: 'var(--green)', wordBreak: 'break-all' }}>
                      Sig: {sroData.endorsementSignature?.slice(0, 40)}…
                    </div>
                  </div>
                )}
              </div>

              {/* Tahsildar Node */}
              <div style={{
                ...s.sectionCard, marginBottom: 0,
                borderColor: tahsildarStatus === 'endorsed' ? 'var(--green)' : tahsildarStatus === 'verifying' ? 'var(--accent)' : 'var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={16} color="#7c3aed" />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Revenue Dept Node</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontFamily: "'Courier New', monospace", color: 'var(--text-400)' }}>:8051</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-500)', marginBottom: 10 }}>
                  Title authenticity & tax verification
                </div>

                {tahsildarStatus === 'idle' && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', padding: '12px 0', textAlign: 'center' }}>
                    Awaiting trigger…
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
                    <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--bg-subtle)', borderRadius: 4, fontSize: '0.68rem', fontFamily: "'Courier New', monospace", color: 'var(--green)', wordBreak: 'break-all' }}>
                      Sig: {tahsildarData.endorsementSignature?.slice(0, 40)}…
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

            {/* Actions */}
            <div style={s.actions}>
              {sroStatus !== 'endorsed' ? (
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

        {/* ── STAGE 2: Stamp Duty ── */}
        {currentStage === 1 && (
          <div className="animate-in">
            <h2 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Stamp Duty & Fees</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-500)', marginBottom: 20 }}>
              State stamp duty assessment and payment.
            </p>

            {/* Duty breakdown */}
            <div style={{ ...s.sectionCard, marginBottom: 20 }}>
              <div style={s.row}>
                <span style={s.label}>Assessed Value</span>
                <span style={s.val}>{prop.value}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Slab & Rate</span>
                <span style={{ ...s.val, color: '#0284c7' }}>{dutyCalc?.slabName}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Base Stamp Duty</span>
                <span style={s.val}>₹{dutyCalc?.baseStampDuty?.toLocaleString('en-IN')}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Cess (10%)</span>
                <span style={s.val}>₹{dutyCalc?.cess?.toLocaleString('en-IN')}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Surcharge (2%)</span>
                <span style={s.val}>₹{dutyCalc?.surcharge?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ ...s.rowLast, paddingTop: 14, borderTop: '2px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-900)' }}>Total Payable</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent)' }}>
                  ₹{dutyCalc?.total?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment methods */}
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 10 }}>Payment Method</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'cyber_treasury', label: 'State Treasury e-Challan', sub: 'IFMS / K2 Portal' },
                { id: 'upi', label: 'Bharat QR / UPI', sub: 'gov.treasury@sbi' },
                { id: 'netbanking', label: 'Bank Consortium', sub: 'SBI, Canara, PNB' },
              ].map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedPayMethod(pm.id)}
                  style={{
                    flex: '1 1 180px',
                    padding: '12px 14px',
                    background: selectedPayMethod === pm.id ? 'var(--accent-light)' : 'var(--bg-card)',
                    border: `1.5px solid ${selectedPayMethod === pm.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-900)' }}>{pm.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-400)', marginTop: 2 }}>{pm.sub}</div>
                </button>
              ))}
            </div>

            <div style={s.actions}>
              <button className="btn btn-ghost" onClick={() => setCurrentStage(0)} disabled={loading}>
                <ArrowLeft size={14} /> Back
              </button>
              <button className="btn btn-primary" onClick={executePayment} disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
                    Processing…
                  </>
                ) : (
                  <><CreditCard size={15} /> Pay ₹{dutyCalc?.total?.toLocaleString('en-IN')}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 3: Orderer ── */}
        {currentStage === 2 && (
          <div className="animate-in">
            <h2 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Orderer Block Packing</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-500)', marginBottom: 20, lineHeight: 1.5 }}>
              Aggregating endorsement signatures and payment proof for block formation.
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
                    ✓ Payment Proof
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
                { name: 'Bank & Judiciary Peer', port: 'peer0.cdac.gov.in:9051' },
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
                    _rev: commitData?.couchDbState?._rev || '2-98ab42cf8912e',
                    docType: 'LandTitleAsset',
                    title: prop.title,
                    owner: buyerId,
                    previousOwner: sellerId,
                    status: 'REGISTERED_OWNER',
                    stampChallan: paymentData?.challanNo,
                    lastBlockNumber: ordererData?.blockNumber || 348,
                    lastTxId: ordererData?.txId || '0x9928f…',
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
                onClick={executeBroadcastAndCommit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
                    Committing…
                  </>
                ) : (
                  <><Sparkles size={15} /> Finalize Transfer</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
