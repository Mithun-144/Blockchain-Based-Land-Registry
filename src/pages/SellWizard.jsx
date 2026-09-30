import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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
  IndianRupee,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

const STAGES = [
  { id: 'endorsement', label: '1. SRO & Tahsildar Verification', icon: Landmark },
  { id: 'price_terms', label: '2. Marketplace Terms & Price', icon: Tag },
  { id: 'orderer', label: '3. Orderer Block Packing', icon: Layers },
  { id: 'commit', label: '4. CouchDB Listing Update', icon: Database },
];

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
  const [sroStatus, setSroStatus] = useState('idle'); // idle | verifying | endorsed
  const [sroData, setSroData] = useState(null);
  const [tahsildarStatus, setTahsildarStatus] = useState('idle');
  const [tahsildarData, setTahsildarData] = useState(null);

  // Stage 3: Orderer
  const [ordererData, setOrdererData] = useState(null);

  // Stage 4: Commit & CouchDB
  const [commitData, setCommitData] = useState(null);

  // Stage 5: Complete
  const [isCompleted, setIsCompleted] = useState(false);

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
      setCurrentStage(3); // Proceed to CouchDB commit stage
    } catch (err) {
      alert(`Orderer Packaging Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Stage 4: Broadcast to Peers & CouchDB State Update ──
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

  // ── Stage 5: "Property Registered for Sale" Result Screen ──
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
            ✓ Listing Block Sealed on Fabric
          </span>

          <h1 style={{ color: '#0f172a', marginBottom: 8, fontSize: '2rem' }}>
            Property Registered for Sale
          </h1>
          <p style={{ color: '#475569', maxWidth: 640, margin: '0 auto 28px', fontSize: '0.95rem' }}>
            Your property <strong>{prop.title}</strong> has been verified clear of encumbrances by the SRO node,
            confirmed by the Tahsildar node, ordered via Raft consensus, and published to the <strong>PropChain Marketplace</strong>.
          </p>

          {/* Listing Provenance Certificate Box */}
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
                  Marketplace Smart Contract Listing Receipt
                </span>
              </div>
              <span className="badge badge-purple">Block #{ordererData?.blockNumber || 350}</span>
            </div>

            <div className="deed-row">
              <span className="deed-key">Property Asset ID</span>
              <span className="deed-val font-600" style={{ fontFamily: 'monospace' }}>
                {prop.id}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Registered Owner / Seller</span>
              <span className="deed-val font-600">{sellerId} (Gov ID: {user?.govId || 'AADHAR-8821-4521'})</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Published Asking Price</span>
              <span className="deed-val text-green font-700" style={{ fontSize: '1.1rem' }}>
                ₹{Number(askingPrice).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Marketplace Listing Status</span>
              <span className="badge badge-amber">🏷️ Active For Sale</span>
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
                {couchDoc._rev || '2-9a8b1c...'}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Dual-Node Listing Endorsements</span>
              <span className="deed-val text-green">
                ✓ SRO Peer (Mortgage Check: Clear) &nbsp;•&nbsp; ✓ Tahsildar Peer (RoR Title: Confirmed)
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-16 justify-center flex-wrap">
            <button className="btn btn-primary" onClick={() => setPage('marketplace')}>
              <Store size={16} /> View in Marketplace →
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('my-properties')}>
              <Building size={16} /> Go to My Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page animate-in">
      <div className="wizard-container">
        <button className="btn btn-ghost btn-sm mb-20" onClick={() => setPage('my-properties')}>
          <ArrowLeft size={14} /> Back to My Properties
        </button>

        {/* Selected Property Header */}
        <div className="card mb-24">
          <div className="flex gap-16 items-center flex-wrap">
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 'var(--radius)',
                background: 'var(--amber-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag size={30} color="#d97706" />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="flex items-center gap-8 mb-4">
                <span className="badge badge-amber">Listing for Sale</span>
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
              <div className="text-xs text-muted font-600 uppercase">Valuation Baseline</div>
              <div className="text-primary font-700" style={{ fontSize: '1.35rem' }}>
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
            STAGE 1: SIMULTANEOUS DUAL-NODE LISTING ENDORSEMENT
           ───────────────────────────────────────────────────────────── */}
        {currentStage === 0 && (
          <div className="card animate-in">
            <div className="flex items-center justify-between mb-16 flex-wrap gap-12">
              <div>
                <span className="badge badge-amber mb-6">Stage 1 of 4: Pre-Listing Node Checks</span>
                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
                  Encumbrance & Ownership Check for Sale Listing
                </h2>
                <p className="text-sm text-secondary mt-4">
                  Before a title can be published to the Marketplace, the proposal is verified simultaneously by the <strong>SRO Node</strong> (to confirm no mortgages or bank liens prevent the sale) and the <strong>Tahsildar Node</strong> (to verify rightful owner and authority to sell).
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
                    <span>SRO Node (Encumbrance Check)</span>
                  </div>
                  <span className="node-endpoint">peer0.sro.gov.in:7051</span>
                </div>

                <div className="text-xs text-muted mb-8">
                  <strong>Verification:</strong> Ensures no active mortgage, loan charge, or bank lien exists that blocks listing.
                </div>

                {sroStatus === 'idle' && (
                  <div className="p-12 text-center text-sm text-muted" style={{ padding: '24px 0' }}>
                    Click below to trigger SRO & Tahsildar pre-listing checks...
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
                        <CheckCircle2 size={16} color="#059669" /> Identity & Authentication Verification
                      </span>
                      <span className="badge badge-green">PASSED (Dual e-Sign Validated)</span>
                    </div>
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> Stamp Duty & Fee Calculus
                      </span>
                      <span className="badge badge-green">PASSED (Guideline Compliant)</span>
                    </div>
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> Encumbrance & History Scrutiny
                      </span>
                      <span className="badge badge-green">CLEAR (0 Liens / Injunctions)</span>
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
                    <span>Tahsildar Node (Title & RoR)</span>
                  </div>
                  <span className="node-endpoint">peer0.tahsildar.gov.in:8051</span>
                </div>

                <div className="text-xs text-muted mb-8">
                  <strong>Verification:</strong> Confirms applicant ({sellerId}) is the legitimate legal owner authorized to sell.
                </div>

                {tahsildarStatus === 'idle' && (
                  <div className="p-12 text-center text-sm text-muted" style={{ padding: '24px 0' }}>
                    Click below to trigger SRO & Tahsildar pre-listing checks...
                  </div>
                )}

                {tahsildarStatus === 'verifying' && (
                  <div className="loading-box" style={{ padding: '20px 0' }}>
                    <div className="spinner" />
                    <p className="text-xs pulse">Verifying Khata, RoR records & cadastral mapping...</p>
                  </div>
                )}

                {tahsildarStatus === 'endorsed' && tahsildarData && (
                  <div className="animate-in">
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> Unambiguous Ownership Check
                      </span>
                      <span className="badge badge-green">CONFIRMED ({sellerId ? sellerId.split('@')[0] : 'Owner'})</span>
                    </div>
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> {tahsildarData.portalDetails?.recordType || 'Record'}
                      </span>
                      <span className="badge badge-green">{tahsildarData.portalDetails?.badge || 'VERIFIED'}</span>
                    </div>
                    <div className="check-row">
                      <span className="check-row-label">
                        <CheckCircle2 size={16} color="#059669" /> Cadastral Boundary & Survey Verification
                      </span>
                      <span className="badge badge-green">COMPLIANT</span>
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
                    <strong>Pre-Listing Endorsement Policy Satisfied:</strong> <code>AND('SroMSP.peer', 'TahsildarMSP.peer')</code> — Both signatures returned to Seller Client.
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
                  style={{ minWidth: 240 }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                      Verifying on SRO & Tahsildar Nodes...
                    </>
                  ) : (
                    <>
                      <Landmark size={16} /> Request SRO & Tahsildar Endorsement
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-green"
                  onClick={() => setCurrentStage(1)}
                  style={{ minWidth: 240 }}
                >
                  <span>Set Marketplace Terms & Price</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 2: MARKETPLACE TERMS & ASKING PRICE
           ───────────────────────────────────────────────────────────── */}
        {currentStage === 1 && (
          <div className="card animate-in">
            <span className="badge badge-blue mb-6">Stage 2 of 4: Listing Parameters</span>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
              Set Marketplace Listing Terms & Asking Price
            </h2>
            <p className="text-sm text-secondary mt-4 mb-20">
              Specify your agreed asking price and sale conveyance terms for the smart contract listing.
            </p>

            <div className="grid-2 gap-20 mb-20">
              <div className="form-group">
                <label className="form-label">Asking Consideration Price (INR ₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(Number(e.target.value))}
                  placeholder="e.g. 5000000"
                />
                <span className="text-xs text-muted mt-2">
                  Display Price on Marketplace: <strong>₹{Number(askingPrice || 0).toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Possession Timeline</label>
                <input
                  type="text"
                  className="form-input"
                  value={saleTerms.possessionTimeline}
                  onChange={(e) => setSaleTerms({ ...saleTerms, possessionTimeline: e.target.value })}
                />
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius)',
                padding: 16,
                marginBottom: 20,
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem' }}>Smart Contract Sale Conditions:</h4>
              <div className="flex flex-col gap-6 text-xs text-secondary">
                <div>✓ Immediate automatic title conveyance upon buyer payment of consideration + stamp duty.</div>
                <div>✓ Both SRO encumbrance clearance and Tahsildar ownership certificates embedded in listing.</div>
                <div>✓ Buyer DigiLocker / Aadhaar identity verification required.</div>
              </div>
            </div>

            <div className="wizard-actions">
              <button className="btn btn-ghost" onClick={() => setCurrentStage(0)} disabled={loading}>
                <ArrowLeft size={16} /> Back
              </button>

              <button
                className="btn btn-primary"
                onClick={() => setCurrentStage(2)}
                disabled={loading || !askingPrice}
                style={{ minWidth: 220 }}
              >
                <span>Proceed to Orderer Packaging</span>
                <ArrowRight size={16} />
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
              Listing Proposal Packaging & Orderer Block Formation
            </h2>
            <p className="text-sm text-secondary mt-4 mb-20">
              The Client application aggregates the Dual Endorsement Signatures (SRO + Tahsildar) and the Marketplace Listing Terms, submitting the transaction envelope to the <strong>Fabric Orderer Node (Raft Consensus)</strong>.
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
                  <div className="text-xs text-muted mb-4">Listing Envelopes Bundled:</div>
                  <div className="flex flex-col gap-6 text-xs">
                    <div>✓ SRO Pre-Listing Endorsement ({sroData?.endorsementSignature?.slice(0, 16)}...)</div>
                    <div>✓ Tahsildar Ownership Endorsement ({tahsildarData?.endorsementSignature?.slice(0, 16)}...)</div>
                    <div>✓ Target Asset: {prop.id} • Asking: ₹{Number(askingPrice).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted mb-4">Consensus Group:</div>
                  <div className="text-xs">
                    <strong>Raft Consensus Group (Channel: localchannelone)</strong><br />
                    Action: <code>listPropertyForSale</code>
                  </div>
                </div>
              </div>

              {ordererData && (
                <div className="animate-in" style={{ borderTop: '1px solid #334155', paddingTop: 14 }}>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs text-muted">Newly Minted Listing Block:</span>
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
                      Packaging Listing Block...
                    </>
                  ) : (
                    <>
                      <Layers size={16} /> Send to Orderer & Pack Block
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-green"
                  onClick={() => setCurrentStage(3)}
                  style={{ minWidth: 240 }}
                >
                  <span>Broadcast to Peer Nodes</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 4: BROADCAST TO PEERS & COUCHDB WORLD STATE UPDATE
           ───────────────────────────────────────────────────────────── */}
        {currentStage === 3 && (
          <div className="card animate-in">
            <span className="badge badge-blue mb-6">Stage 4 of 4: Ledger & CouchDB Update</span>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
              Broadcast to Distributed Nodes & Marketplace CouchDB Update
            </h2>
            <p className="text-sm text-secondary mt-4 mb-20">
              The Orderer node delivers <strong>Block #{ordererData?.blockNumber || 350}</strong> to all committing peer nodes. Each peer executes VSCC validation and marks the asset as <code>FOR_SALE</code> in the <strong>CouchDB World State</strong> index.
            </p>

            {/* Committing Peers Table */}
            <div className="mb-20">
              <div className="check-row">
                <span className="check-row-label">
                  <CheckCircle2 size={16} color="#059669" /> SRO Peer Node (peer0.sro.gov.in:7051)
                </span>
                <span className="badge badge-green">Listing Committed</span>
              </div>
              <div className="check-row">
                <span className="check-row-label">
                  <CheckCircle2 size={16} color="#059669" /> Tahsildar Peer Node (peer0.tahsildar.gov.in:8051)
                </span>
                <span className="badge badge-green">Listing Committed</span>
              </div>
              <div className="check-row">
                <span className="check-row-label">
                  <CheckCircle2 size={16} color="#059669" /> Marketplace Registry Node (peer0.cdac.gov.in:9051)
                </span>
                <span className="badge badge-green">Listing Committed</span>
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
                    Publishing Listing on CouchDB...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Finalize Listing & Publish to Marketplace
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
