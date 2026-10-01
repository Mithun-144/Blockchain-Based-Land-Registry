import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Landmark,
  CreditCard,
  Layers,
  Database,
  Check,
  Building,
  MapPin,
  ShieldCheck,
  FileCheck,
  Cpu,
  Hash,
  Download,
  Printer,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

const STAGES = [
  { id: 'endorsement', label: '1. SRO & Tahsildar Endorsement', icon: Landmark },
  { id: 'stamp_duty', label: '2. Stamp Duty & Fees', icon: CreditCard },
  { id: 'orderer', label: '3. Orderer Block Packing', icon: Layers },
  { id: 'commit', label: '4. CouchDB Ledger Update', icon: Database },
];

export default function TransferWizard({ prop, user, setPage }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Stage 1 State: Node Endorsements
  const [sroStatus, setSroStatus] = useState('idle'); // idle | verifying | endorsed
  const [sroData, setSroData] = useState(null);
  const [tahsildarStatus, setTahsildarStatus] = useState('idle'); // idle | verifying | endorsed
  const [tahsildarData, setTahsildarData] = useState(null);

  // Stage 2 State: Stamp Duty Payment
  const [dutyCalc, setDutyCalc] = useState(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState('cyber_treasury');
  const [paymentData, setPaymentData] = useState(null);

  // Stage 3 State: Orderer Block
  const [ordererData, setOrdererData] = useState(null);

  // Stage 4 State: Commit & CouchDB
  const [commitData, setCommitData] = useState(null);

  // Stage 5 State: Final Complete
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDeedModal, setShowDeedModal] = useState(false);

  const buyerId = user?.email || 'citizen@cdac.in';
  const sellerId = prop?.owner || 'seller@cdac.in';
  const rawAmount = prop?.rawValue || 6200000;

  // Auto-calculate stamp duty on mount
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

  // ── Stage 1: Simultaneous Dual-Node Check ──
  const executeDualNodeVerification = async () => {
    setLoading(true);
    setSroStatus('verifying');
    setTahsildarStatus('verifying');

    try {
      // Execute both node checks concurrently as requested
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

  // ── Stage 2: Pay Stamp Duty ──
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
      setCurrentStage(2); // Proceed to Orderer stage
    } catch (err) {
      alert(`Payment Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Stage 3: Submit to Orderer Node ──
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
      setCurrentStage(3); // Proceed to Peer Broadcast & CouchDB stage
    } catch (err) {
      alert(`Orderer Packaging Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Stage 4: Broadcast & CouchDB Ledger Commit ──
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

  // ── Stage 5: Final "Transaction Successful" Screen ──
  if (isCompleted) {
    const couchDoc = commitData?.couchDbState || {};
    return (
      <div className="page container animate-in" style={{ paddingTop: 40, maxWidth: 900 }}>
        <div className="card" style={{ padding: '36px 32px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: 20,
              borderRadius: '50%',
              background: '#ecfdf5',
              border: '2px solid #a7f3d0',
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={56} color="#059669" />
          </div>

          <span className="badge badge-green mb-12" style={{ fontSize: '0.82rem', padding: '5px 14px' }}>
            ✓ Hyperledger Fabric Block Committed
          </span>

          <h1 style={{ color: '#0f172a', marginBottom: 8, fontSize: '2rem' }}>
            Transaction Successful
          </h1>
          <p style={{ color: '#475569', maxWidth: 640, margin: '0 auto 28px', fontSize: '0.95rem' }}>
            Title ownership of <strong>{prop.title}</strong> has been legally transferred, endorsed by SRO &
            Tahsildar nodes, ordered, and immutably written to the distributed ledger and CouchDB world state.
          </p>

          {/* Blockchain Provenance Certificate Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              textAlign: 'left',
              marginBottom: 28,
            }}
          >
            <div className="flex justify-between items-center mb-16 pb-12" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-8">
                <FileCheck size={20} color="#2563eb" />
                <span className="font-700" style={{ color: '#0f172a' }}>
                  On-Chain Title Transfer Receipt
                </span>
              </div>
              <span className="badge badge-purple">Block #{ordererData?.blockNumber || 348}</span>
            </div>

            <div className="deed-row">
              <span className="deed-key">Property Asset ID</span>
              <span className="deed-val font-600" style={{ fontFamily: 'monospace' }}>
                {prop.id}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Transferee / New Rightful Owner</span>
              <span className="deed-val text-green font-700">{buyerId} (Gov ID: {user?.govId || 'AADHAR-8821-4521'})</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Transferor / Previous Owner</span>
              <span className="deed-val">{sellerId}</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">State Treasury Challan Ref</span>
              <span className="deed-val font-600" style={{ color: '#d97706' }}>
                {paymentData?.challanNo}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Fabric Transaction Hash (TxID)</span>
              <span className="deed-val" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {ordererData?.txId?.slice(0, 24)}...
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 6px', marginLeft: 6 }}
                  onClick={() => copyToClipboard(ordererData?.txId, 'txId')}
                >
                  {copiedField === 'txId' ? 'Copied!' : <Copy size={12} />}
                </button>
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">CouchDB Document Revision</span>
              <span className="deed-val" style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#7c3aed' }}>
                {couchDoc._rev || '2-98ab42c...'}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Peer Consensus Endorsements</span>
              <span className="deed-val text-green">
                ✓ SRO Peer (Port 7051) &nbsp;•&nbsp; ✓ Tahsildar Peer (Port 8051)
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-16 justify-center flex-wrap">
            <button className="btn btn-ghost" onClick={() => setShowDeedModal(true)}>
              <Printer size={16} /> View & Print Title Deed
            </button>
            <button className="btn btn-primary" onClick={() => setPage('my-properties')}>
              <Building size={16} /> Go to My Properties →
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('marketplace')}>
              Browse Marketplace
            </button>
          </div>
        </div>

        {/* Digital Deed Modal */}
        {showDeedModal && (
          <div className="modal-overlay animate-in" onClick={() => setShowDeedModal(false)}>
            <div className="modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex items-center gap-8">
                  <Landmark size={20} color="#2563eb" />
                  <span className="font-700">Digital Land Conveyance Certificate</span>
                </div>
                <button className="modal-close" onClick={() => setShowDeedModal(false)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="deed-preview">
                  <div className="deed-title">GOVERNMENT OF INDIA & STATE REVENUE DEPARTMENT</div>
                  <div className="deed-sub">
                    NATIONAL BLOCKCHAIN FRAMEWORK (NBF-LITE) • TITLE DEED CERTIFICATE
                  </div>

                  <div className="deed-row">
                    <span className="deed-key">Deed Reference</span>
                    <span className="deed-val font-600">DEED-{prop.id}-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Property Title & Address</span>
                    <span className="deed-val">{prop.title}, {prop.address}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Built-Up / Plot Area</span>
                    <span className="deed-val">{prop.area} ({prop.type})</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Buyer / Registered Owner</span>
                    <span className="deed-val text-green font-700">{buyerId}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Seller / Prior Owner</span>
                    <span className="deed-val">{sellerId}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Consideration Paid</span>
                    <span className="deed-val font-700">{prop.value}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Stamp Duty Treasury Challan</span>
                    <span className="deed-val">{paymentData?.challanNo}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Block Ledger Height</span>
                    <span className="deed-val">Block #{ordererData?.blockNumber}</span>
                  </div>

                  <div className="proof-box mt-16 text-left">
                    🔐 SRO Endorsement Sig: {sroData?.endorsementSignature?.slice(0, 36)}...<br />
                    🔐 Tahsildar Endorsement Sig: {tahsildarData?.endorsementSignature?.slice(0, 36)}...<br />
                    📦 Merkle Root: {ordererData?.merkleRoot}
                  </div>
                </div>

                <div className="flex justify-end gap-12 mt-20">
                  <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} /> Print Official Deed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page animate-in">
      <div className="wizard-container">
        <button className="btn btn-ghost btn-sm mb-20" onClick={() => setPage('marketplace')}>
          <ArrowLeft size={14} /> Back to Marketplace
        </button>

        {/* Selected Property Header */}
        <div className="card mb-24">
          <div className="flex gap-16 items-center flex-wrap">
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 'var(--radius)',
                background: 'var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building size={30} color="#2563eb" />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="flex items-center gap-8 mb-4">
                <span className="badge badge-blue">{prop.type}</span>
                <span className="badge badge-purple" style={{ fontFamily: 'monospace' }}>
                  {prop.id}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{prop.title}</h3>
              <p className="text-sm flex items-center gap-4 mt-2">
                <MapPin size={14} color="#64748b" /> {prop.address}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted font-600 uppercase">Consideration Price</div>
              <div className="text-green font-700" style={{ fontSize: '1.45rem' }}>
                {prop.value}
              </div>
            </div>
          </div>
        </div>

        {/* Top 4-Stage Tracker */}
        <div className="step-indicator mb-28">
          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            const isDone = idx < currentStage;
            const isActive = idx === currentStage;
            return (
              <React.Fragment key={s.id}>
                <div className="step-item">
                  <div className={`step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                    {isDone ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span className="step-label">{s.label}</span>
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`step-line ${idx < currentStage ? 'done' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STAGE 1: SIMULTANEOUS DUAL-NODE ENDORSEMENT (SRO & TAHSILDAR)
           ───────────────────────────────────────────────────────────── */}
        {currentStage === 0 && (
          <div className="card animate-in">
            <div className="flex items-center justify-between mb-16 flex-wrap gap-12">
              <div>
                <span className="badge badge-blue mb-6">Stage 1 of 4: Peer Endorsement</span>
                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
                  Simultaneous SRO & Tahsildar Node Verification
                </h2>
                <p className="text-sm text-secondary mt-4">
                  The transaction proposal is sent concurrently to the <strong>SRO Node</strong> and the <strong>Record of Rights Department Node</strong>.
                </p>
              </div>
            </div>

            {/* Side-by-Side Dual Node Visualizer */}
            <div className="node-grid">
              {/* SRO Node Box */}
              <div
                className={`node-box ${sroStatus === 'verifying' ? 'active' : sroStatus === 'endorsed' ? 'verified' : ''
                  }`}
              >
                <div className="node-header">
                  <div className="node-title">
                    <Landmark size={18} color="#2563eb" />
                    <span>SRO Node</span>
                  </div>
                  <span className="node-endpoint">peer0.sro.gov.in:7051</span>
                </div>

                <div className="text-xs text-muted mb-8">
                  <strong>Duty:</strong> Verifies if the property has any registered bank loans, mortgages, or court orders.
                </div>

                {sroStatus === 'idle' && (
                  <div className="p-12 text-center text-sm text-muted" style={{ padding: '24px 0' }}>
                    Waiting for proposal trigger...
                  </div>
                )}

                {sroStatus === 'verifying' && (
                  <div className="loading-box" style={{ padding: '20px 0' }}>
                    <div className="spinner" />
                    <p className="text-xs pulse">Scanning CERSAI & Sub-Registrar mortgage registers...</p>
                  </div>
                )}

                {sroStatus === 'endorsed' && sroData && (
                  <div className="animate-in">
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> Identity Verification
                      </span>
                      <span className="badge badge-green">PASSED</span>
                    </div>
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> Stamp Duty & Fee Calculation
                      </span>
                      <span className="badge badge-green">PASSED </span>
                    </div>
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> Encumbrance Check
                      </span>
                      <span className="badge badge-green">CLEAR</span>
                    </div>

                    <div className="sig-pill">
                      <strong>SRO Endorsement Signature:</strong><br />
                      {sroData.endorsementSignature?.slice(0, 42)}...
                    </div>
                  </div>
                )}
              </div>

              {/* Tahsildar Node Box */}
              <div
                className={`node-box ${tahsildarStatus === 'verifying' ? 'active' : tahsildarStatus === 'endorsed' ? 'verified' : ''
                  }`}
              >
                <div className="node-header">
                  <div className="node-title">
                    <Building2 size={18} color="#7c3aed" />
                    <span>RoR Node</span>
                  </div>
                  <span className="node-endpoint">peer0.tahsildar.gov.in:8051</span>
                </div>

                <div className="text-xs text-muted mb-8">
                  <strong>Duty:</strong> Verifies if the seller is the one paying taxes for that property.
                </div>

                {tahsildarStatus === 'idle' && (
                  <div className="p-12 text-center text-sm text-muted" style={{ padding: '24px 0' }}>
                    Waiting for proposal trigger...
                  </div>
                )}

                {tahsildarStatus === 'verifying' && (
                  <div className="loading-box" style={{ padding: '20px 0' }}>
                    <div className="spinner" />
                    <p className="text-xs pulse">Querying Bhoomi RoR records & cadastral mapping...</p>
                  </div>
                )}

                {tahsildarStatus === 'endorsed' && tahsildarData && (
                  <div className="animate-in">
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> Ownership Check
                      </span>
                      <span className="badge badge-green">CONFIRMED</span>
                    </div>
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> {tahsildarData.portalDetails?.recordType || 'Record'}
                      </span>
                      <span className="badge badge-green">{tahsildarData.portalDetails?.badge || 'VERIFIED'}</span>
                    </div>
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> Survey Verification
                      </span>
                      <span className="badge badge-green">PASSED</span>
                    </div>

                    <div className="sig-pill">
                      <strong>Tahsildar Endorsement Signature:</strong><br />
                      {tahsildarData.endorsementSignature?.slice(0, 42)}...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Endorsement Policy Banner */}
            {sroStatus === 'endorsed' && tahsildarStatus === 'endorsed' && (
              <div
                className="animate-in"
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginTop: 16,
                }}
              >
                <div className="flex items-center gap-10">
                  <ShieldCheck size={20} color="#059669" />
                  <span className="text-sm" style={{ color: '#047857' }}>
                    <strong>Endorsement Successful:</strong>
                  </span>
                </div>
                <span className="badge badge-green">2/2 Signatures Ready</span>
              </div>
            )}

            {/* Actions */}
            <div className="wizard-actions">
              {sroStatus !== 'endorsed' ? (
                <button
                  className="btn btn-primary"
                  onClick={executeDualNodeVerification}
                  disabled={loading}
                  style={{ minWidth: 220 }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                      Querying Nodes Concurrently...
                    </>
                  ) : (
                    <>
                      <Landmark size={16} /> Send Proposal to SRO & Tahsildar Nodes
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-green"
                  onClick={() => setCurrentStage(1)}
                  style={{ minWidth: 240 }}
                >
                  <span>Proceed to Stamp Duty Payment</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 2: STAMP DUTY & REGISTRATION FEE PAYMENT PROMPT
           ───────────────────────────────────────────────────────────── */}
        {currentStage === 1 && (
          <div className="card animate-in">
            <span className="badge badge-amber mb-6">Stage 2 of 4: Statutory Dues</span>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
              State Stamp Duty & Registration Fee Assessment
            </h2>
            <p className="text-sm text-secondary mt-4 mb-20">
              State revenue regulations require payment of Stamp Duty (5%) and Sub-Registrar Processing Fee (1%) before the transaction proposal can be submitted to the Orderer.
            </p>

            {/* Duty Breakdown Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius)',
                padding: 20,
                marginBottom: 24,
              }}
            >
              <div className="deed-row">
                <span className="deed-key">Assessed Property Consideration</span>
                <span className="deed-val font-600">{prop.value}</span>
              </div>
              <div className="deed-row">
                <span className="deed-key">State Stamp Duty (5%)</span>
                <span className="deed-val font-600">₹{dutyCalc?.stampDuty?.toLocaleString('en-IN')}</span>
              </div>
              <div className="deed-row">
                <span className="deed-key">Sub-Registrar Registration Fee (1%)</span>
                <span className="deed-val font-600">₹{dutyCalc?.regFee?.toLocaleString('en-IN')}</span>
              </div>
              <div className="deed-row">
                <span className="deed-key">Cadastral Digital Mutation Cess</span>
                <span className="deed-val font-600">₹{dutyCalc?.mutationCess?.toLocaleString('en-IN')}</span>
              </div>
              <div className="deed-row" style={{ borderTop: '2px solid #cbd5e1', paddingTop: 12 }}>
                <span className="deed-key font-700" style={{ color: '#0f172a', fontSize: '1rem' }}>
                  Total Statutory Revenue Payable
                </span>
                <span className="deed-val font-700" style={{ color: '#2563eb', fontSize: '1.25rem' }}>
                  ₹{dutyCalc?.total?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <h3 className="mb-12" style={{ fontSize: '0.98rem' }}>Select Cyber Treasury Payment Method:</h3>
            <div className="payment-grid">
              <div
                className={`payment-card ${selectedPayMethod === 'cyber_treasury' ? 'selected' : ''}`}
                onClick={() => setSelectedPayMethod('cyber_treasury')}
              >
                <div className="flex items-center gap-8 mb-6">
                  <Landmark size={20} color="#2563eb" />
                  <span className="font-700 text-sm">State Treasury e-Challan</span>
                </div>
                <p className="text-xs text-muted">Direct IFMS / K2 Treasury payment with instant digital receipt.</p>
              </div>

              <div
                className={`payment-card ${selectedPayMethod === 'upi' ? 'selected' : ''}`}
                onClick={() => setSelectedPayMethod('upi')}
              >
                <div className="flex items-center gap-8 mb-6">
                  <CreditCard size={20} color="#059669" />
                  <span className="font-700 text-sm">Bharat QR / UPI</span>
                </div>
                <p className="text-xs text-muted">Instant transfer via verified Treasury VPA (gov.treasury@sbi).</p>
              </div>

              <div
                className={`payment-card ${selectedPayMethod === 'netbanking' ? 'selected' : ''}`}
                onClick={() => setSelectedPayMethod('netbanking')}
              >
                <div className="flex items-center gap-8 mb-6">
                  <Building size={20} color="#7c3aed" />
                  <span className="font-700 text-sm">Bank Consortium</span>
                </div>
                <p className="text-xs text-muted">Authorized state banking portal (SBI, Canara, PNB).</p>
              </div>
            </div>

            <div className="wizard-actions">
              <button className="btn btn-ghost" onClick={() => setCurrentStage(0)} disabled={loading}>
                <ArrowLeft size={16} /> Back
              </button>

              <button
                className="btn btn-primary"
                onClick={executePayment}
                disabled={loading}
                style={{ minWidth: 240 }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                    Generating Cyber Challan & Receipt...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} /> Authorize & Pay ₹{dutyCalc?.total?.toLocaleString('en-IN')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 3: SUBMIT TO ORDERER NODE (BLOCK PACKAGING)
           ───────────────────────────────────────────────────────────── */}
        {currentStage === 2 && (
          <div className="card animate-in">
            <span className="badge badge-purple mb-6">Stage 3 of 4: Consensus & Ordering</span>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
              Transaction Packaging & Orderer Block Formation
            </h2>
            <p className="text-sm text-secondary mt-4 mb-20">
              The Client application aggregates the Dual Node Endorsement Signatures (SRO + Tahsildar) and the Cyber Treasury Payment Proof, and submits the envelope to the <strong>Fabric Orderer Node (Raft Consensus)</strong>.
            </p>

            {/* Orderer Visualizer */}
            <div className="block-visual">
              <div className="flex justify-between items-center mb-16 flex-wrap gap-8">
                <div className="flex items-center gap-10">
                  <Cpu size={22} color="#38bdf8" />
                  <span className="font-700">Hyperledger Fabric Orderer Node (Raft Leader)</span>
                </div>
                <span className="badge badge-purple">Port: orderer.cdac.in:7050</span>
              </div>

              <div className="grid-2 gap-16 mb-16">
                <div>
                  <div className="text-xs text-muted mb-4">Payload Envelopes Included:</div>
                  <div className="flex flex-col gap-6 text-xs">
                    <div>✓ SRO Encumbrance Endorsement ({sroData?.endorsementSignature?.slice(0, 16)}...)</div>
                    <div>✓ Tahsildar Title Endorsement ({tahsildarData?.endorsementSignature?.slice(0, 16)}...)</div>
                    <div>✓ State Treasury Challan ({paymentData?.challanNo})</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted mb-4">Consensus Algorithm:</div>
                  <div className="text-xs">
                    <strong>Raft Consensus Group (3-Node Cluster)</strong><br />
                    Channel: <code>localchannelone</code>
                  </div>
                </div>
              </div>

              {ordererData && (
                <div className="animate-in" style={{ borderTop: '1px solid #334155', paddingTop: 14 }}>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs text-muted">Newly Minted Block:</span>
                    <span className="badge badge-green">Block #{ordererData.blockNumber} Minted</span>
                  </div>
                  <div className="block-hash-text mb-4">Block Hash: {ordererData.blockHash}</div>
                  <div className="block-hash-text">TxID: {ordererData.txId}</div>
                </div>
              )}
            </div>

            <div className="wizard-actions">
              <button className="btn btn-ghost" onClick={() => setCurrentStage(1)} disabled={loading}>
                <ArrowLeft size={16} /> Back
              </button>

              {!ordererData ? (
                <button
                  className="btn btn-primary"
                  onClick={executeOrdererPacking}
                  disabled={loading}
                  style={{ minWidth: 220 }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                      Ordering & Packaging Block...
                    </>
                  ) : (
                    <>
                      <Layers size={16} /> Submit to Orderer & Pack Block
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-green"
                  onClick={() => setCurrentStage(3)}
                  style={{ minWidth: 240 }}
                >
                  <span>Broadcast Block to Peer Nodes</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 4: BROADCAST TO PEERS & LEDGER / COUCHDB COMMIT
           ───────────────────────────────────────────────────────────── */}
        {currentStage === 3 && (
          <div className="card animate-in">
            <span className="badge badge-blue mb-6">Stage 4 of 4: Ledger & CouchDB Update</span>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
              Broadcast to Distributed Nodes & World State Ledger Update
            </h2>
            <p className="text-sm text-secondary mt-4 mb-20">
              The Orderer node delivers <strong>Block #{ordererData?.blockNumber || 348}</strong> to all committing peer nodes. Each peer verifies VSCC, commits the block to the ledger, and mutates the <strong>CouchDB World State</strong> document.
            </p>

            {/* Committing Peers Table */}
            <div className="mb-20">
              <div className="check-row">
                <span className="check-row-label">
                  <CheckCircle2 size={16} color="#059669" /> SRO Committing Node (peer0.sro.gov.in:7051)
                </span>
                <span className="badge badge-green">Ledger Committed</span>
              </div>
              <div className="check-row">
                <span className="check-row-label">
                  <CheckCircle2 size={16} color="#059669" /> Tahsildar Committing Node (peer0.tahsildar.gov.in:8051)
                </span>
                <span className="badge badge-green">Ledger Committed</span>
              </div>
              <div className="check-row">
                <span className="check-row-label">
                  <CheckCircle2 size={16} color="#059669" /> Central Registry & Bank Peer (peer0.cdac.gov.in:9051)
                </span>
                <span className="badge badge-green">Ledger Committed</span>
              </div>
            </div>

            {/* CouchDB World State Viewer */}
            <div className="couch-container mb-24">
              <div className="couch-header">
                <div className="flex items-center gap-8">
                  <Database size={16} color="#38bdf8" />
                  <span>CouchDB World State Index — Database: <code>localchannelone_property</code></span>
                </div>
                <span>JSON Document View</span>
              </div>
              <pre style={{ margin: 0, lineHeight: 1.5, color: '#38bdf8' }}>
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
                    lastTxId: ordererData?.txId || '0x9928f...',
                    updatedAt: new Date().toISOString(),
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="wizard-actions">
              <button
                className="btn btn-green"
                onClick={executeBroadcastAndCommit}
                disabled={loading}
                style={{ minWidth: 260 }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                    Updating CouchDB World State...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Finalize & Show Transaction Result
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
