import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Search,
  Scale,
  ShieldCheck,
  CreditCard,
  PenTool,
  FileText,
  Link2,
  Check,
  Building,
  MapPin,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

const STEPS = [
  { id: 'auto', label: 'Automated Check', icon: Search },
  { id: 'enc', label: 'Encumbrance Check', icon: Scale },
  { id: 'rest', label: 'Restrictions Check', icon: ShieldCheck },
  { id: 'stamp', label: 'Stamp Duty & Pay', icon: CreditCard },
  { id: 'sign', label: 'Digital Signatures', icon: PenTool },
  { id: 'deed', label: 'Digital Sale Deed', icon: FileText },
  { id: 'transfer', label: 'Ownership Transfer', icon: Link2 },
];

export default function TransferWizard({ prop, user, setPage }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stepData, setStepData] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);

  const buyerId = user?.email || 'citizen@cdac.in';
  const sellerId = prop?.owner || 'seller@cdac.in';

  if (!prop) {
    return (
      <div className="page container" style={{ paddingTop: 60, textAlign: 'center' }}>
        <h2>No property selected for transfer</h2>
        <button className="btn btn-primary mt-16" onClick={() => setPage('marketplace')}>
          Go to Marketplace
        </button>
      </div>
    );
  }

  const runCurrentStep = async () => {
    setLoading(true);
    try {
      let res;
      if (step === 0) {
        res = await BlockchainAPI.automatedCheck(prop.id);
      } else if (step === 1) {
        res = await BlockchainAPI.encumbranceCheck(prop.id);
      } else if (step === 2) {
        res = await BlockchainAPI.restrictionsCheck(prop.id);
      } else if (step === 3) {
        res = await BlockchainAPI.calculateStampDuty(prop.id, prop.rawValue || 5000000);
      } else if (step === 4) {
        const buyerSig = await BlockchainAPI.digitalSign(prop.id, 'Buyer', buyerId);
        const sellerSig = await BlockchainAPI.digitalSign(prop.id, 'Seller', sellerId);
        res = { buyerSig, sellerSig };
      } else if (step === 5) {
        res = await BlockchainAPI.generateDeed(prop.id, buyerId, sellerId, prop.rawValue || 5000000);
      } else if (step === 6) {
        const deedId = stepData.deed?.deedId || `DEED-${prop.id}-001`;
        res = await BlockchainAPI.transferOwnership(prop.id, sellerId, buyerId, deedId);
        setIsCompleted(true);
      }

      setStepData((prev) => ({ ...prev, [STEPS[step].id]: res }));

      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      }
    } catch (err) {
      alert(`Step execution error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted) {
    const transferResult = stepData.transfer || {};
    return (
      <div className="page container animate-in" style={{ paddingTop: 50 }}>
        <div className="result-box check-anim">
          <div style={{ display: 'inline-flex', padding: 20, borderRadius: '50%', background: 'var(--green-glow)', marginBottom: 20 }}>
            <CheckCircle2 size={64} color="#48d68a" />
          </div>
          <h2 style={{ color: 'var(--green)', marginBottom: 8, fontSize: '1.8rem' }}>
            Ownership Transferred Successfully!
          </h2>
          <p style={{ marginBottom: 24 }}>
            The title deed for <strong>{prop.title}</strong> has been committed to the NBF-Lite Hyperledger Fabric
            blockchain ledger and registered to <strong>{buyerId}</strong>.
          </p>

          <div className="proof-box mb-24" style={{ textAlign: 'left' }}>
            <div>⛓️ Transaction Hash: <strong>{transferResult.txId || '0x992...'}</strong></div>
            <div>📦 Block Height: <strong>#{transferResult.blockNumber || 342}</strong></div>
            <div>🌐 Channel: <strong>{transferResult.channel || 'localchannelone'}</strong></div>
            <div>📜 Digital Deed ID: <strong>{stepData.deed?.deedId}</strong></div>
            <div>👤 New Owner Gov ID: <strong>{user?.govId || 'AADHAR-8821-4521'}</strong></div>
            <div>🕐 Timestamp: <strong>{transferResult.timestamp || new Date().toISOString()}</strong></div>
          </div>

          <div className="flex gap-16 justify-center">
            <button className="btn btn-ghost" onClick={() => setPage('marketplace')}>
              Browse Marketplace
            </button>
            <button className="btn btn-primary" onClick={() => setPage('my-properties')}>
              View in My Properties →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CurrentIcon = STEPS[step].icon;

  return (
    <div className="page animate-in">
      <div className="wizard-container">
        <button className="btn btn-ghost btn-sm mb-24" onClick={() => setPage('marketplace')}>
          <ArrowLeft size={14} /> Back to Marketplace
        </button>

        {/* Selected Property Header */}
        <div className="card mb-24">
          <div className="flex gap-16 items-center flex-wrap">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius)',
                background: 'var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building size={32} color="#4f9cf9" />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="flex items-center gap-8 mb-4">
                <span className="badge badge-blue">{prop.type}</span>
                <span className="badge badge-purple">{prop.id}</span>
              </div>
              <h3 style={{ margin: 0 }}>{prop.title}</h3>
              <p className="text-sm">{prop.address}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Agreed Consideration</div>
              <div className="text-green font-700" style={{ fontSize: '1.4rem' }}>
                {prop.value}
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          {STEPS.map((s, i) => {
            const IconComponent = s.icon;
            const isDone = i < step;
            const isActive = i === step;
            return (
              <React.Fragment key={s.id}>
                <div className="step-item">
                  <div className={`step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                    {isDone ? <Check size={18} /> : <IconComponent size={18} />}
                  </div>
                  <span className="step-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`step-line ${i < step ? 'done' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Active Step Content */}
        <div className="card animate-in">
          <div className="flex items-center gap-12 mb-8">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CurrentIcon size={20} color="#4f9cf9" />
            </div>
            <div>
              <div className="text-xs text-muted uppercase">Step {step + 1} of 7</div>
              <div className="wizard-step-title" style={{ margin: 0 }}>
                {STEPS[step].label}
              </div>
            </div>
          </div>

          {/* Step 1: Automated Check */}
          {step === 0 && (
            <div>
              <p className="wizard-step-sub">
                Automated smart contract check verifies ownership records, cadastral surveys, geo-coordinates,
                and local municipal tax clearances.
              </p>
              {stepData.auto && (
                <div className="animate-in">
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Ownership Authenticity & Hash Match
                    </span>
                    <span className="badge badge-green">Passed</span>
                  </div>
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Cadastral Survey & Boundary Coordinates
                    </span>
                    <span className="badge badge-green">Verified</span>
                  </div>
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Municipal Property Tax Clearance
                    </span>
                    <span className="badge badge-green">Paid Up-To-Date</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Encumbrance Check */}
          {step === 1 && (
            <div>
              <p className="wizard-step-sub">
                Querying banking consortium & sub-registrar lien registries to ensure no loans, mortgages, or financial
                claims are registered on the property.
              </p>
              {stepData.enc && (
                <div className="animate-in">
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Banking Consortium Mortgage Registry
                    </span>
                    <span className="badge badge-green">No Liens Found</span>
                  </div>
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Pending Utility / Statutory Dues
                    </span>
                    <span className="badge badge-green">Zero Liability</span>
                  </div>
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Overall Encumbrance Certificate Status
                    </span>
                    <span className="badge badge-green">Certificate Issued (Nil)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Restrictions Check */}
          {step === 2 && (
            <div>
              <p className="wizard-step-sub">
                Ensures there are no pending court injunctions, government acquisitions, land reform ceilings, or zoning
                violations.
              </p>
              {stepData.rest && (
                <div className="animate-in">
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> High Court & Civil Court Litigation Registry
                    </span>
                    <span className="badge badge-green">Clear</span>
                  </div>
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Government Eminent Domain Acquisition Status
                    </span>
                    <span className="badge badge-green">No Notification</span>
                  </div>
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Master Plan / Zoning Master Compliance
                    </span>
                    <span className="badge badge-green">Fully Compliant</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Stamp Duty */}
          {step === 3 && (
            <div>
              <p className="wizard-step-sub">
                Automated calculation of state revenue stamp duty (5%) and registration fee (1%) based on blockchain valuation.
              </p>
              {stepData.stamp ? (
                <div className="animate-in">
                  <div
                    style={{
                      background: 'rgba(251,191,36,0.06)',
                      border: '1px solid rgba(251,191,36,0.25)',
                      borderRadius: 'var(--radius)',
                      padding: 20,
                    }}
                  >
                    <div className="deed-row">
                      <span className="deed-key">Property Consideration</span>
                      <span className="deed-val">{prop.value}</span>
                    </div>
                    <div className="deed-row">
                      <span className="deed-key">State Stamp Duty (5%)</span>
                      <span className="deed-val font-600">₹{stepData.stamp.stampDuty?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="deed-row">
                      <span className="deed-key">Sub-Registrar Processing Fee (1%)</span>
                      <span className="deed-val font-600">₹{stepData.stamp.regFee?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="deed-row">
                      <span className="deed-key font-700" style={{ color: 'var(--text-primary)' }}>
                        Total Revenue Paid
                      </span>
                      <span className="deed-val text-amber font-700" style={{ fontSize: '1.1rem' }}>
                        ₹{stepData.stamp.total?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="proof-box mt-16">
                      💳 State Treasury Challan: {stepData.stamp.receiptId} • STATUS: PAID
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: 20,
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p className="text-sm">Click "Calculate & Process Payment" to execute treasury smart contract.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Digital Signatures */}
          {step === 4 && (
            <div>
              <p className="wizard-step-sub">
                Both Buyer and Seller cryptographically sign the conveyance instrument using NBF-Lite X.509 digital certificates.
              </p>
              {stepData.sign ? (
                <div className="animate-in flex flex-col gap-12">
                  <div className="check-row">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Buyer Digital Signature ({buyerId})
                    </span>
                    <span className="badge badge-green">Signed with X.509</span>
                  </div>
                  <div className="proof-box text-xs">
                    Buyer Signature Hash: {stepData.sign.buyerSig?.signatureHash?.slice(0, 32)}...
                  </div>

                  <div className="check-row mt-12">
                    <span className="check-row-label">
                      <CheckCircle2 size={16} color="#48d68a" /> Seller Digital Signature ({sellerId})
                    </span>
                    <span className="badge badge-green">Signed with X.509</span>
                  </div>
                  <div className="proof-box text-xs">
                    Seller Signature Hash: {stepData.sign.sellerSig?.signatureHash?.slice(0, 32)}...
                  </div>
                </div>
              ) : (
                <p className="text-sm text-secondary">
                  Ready to generate dual cryptographic signatures for Buyer (<strong>{buyerId}</strong>) and Seller (
                  <strong>{sellerId}</strong>).
                </p>
              )}
            </div>
          )}

          {/* Step 6: Digital Sale Deed */}
          {step === 5 && (
            <div>
              <p className="wizard-step-sub">
                The smart contract compiles the digital sale deed instrument, embeds the parties' signatures, and generates
                the cryptographic deed hash.
              </p>
              {stepData.deed ? (
                <div className="deed-preview animate-in">
                  <div className="deed-title">STATE REVENUE DEPARTMENT — DIGITAL CONVEYANCE DEED</div>
                  <div className="deed-sub">Immutably Recorded on Hyperledger Fabric</div>

                  <div className="deed-row">
                    <span className="deed-key">Deed Reference ID</span>
                    <span className="deed-val font-600">{stepData.deed.deedId}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Property ID</span>
                    <span className="deed-val">{prop.id}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Transferor (Seller)</span>
                    <span className="deed-val">{sellerId}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Transferee (Buyer)</span>
                    <span className="deed-val text-green font-600">{buyerId}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Consideration Amount</span>
                    <span className="deed-val">{prop.value}</span>
                  </div>
                  <div className="deed-row">
                    <span className="deed-key">Execution Date</span>
                    <span className="deed-val">{new Date().toLocaleDateString('en-IN')}</span>
                  </div>

                  <div className="proof-box mt-16">
                    Deed Cryptographic Hash: {stepData.deed.deedHash}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-secondary">
                  Click "Generate Digital Deed" to compile the blockchain legal instrument.
                </p>
              )}
            </div>
          )}

          {/* Step 7: Ownership Transfer */}
          {step === 6 && (
            <div>
              <p className="wizard-step-sub">
                Final Step: Updating the World State database in Hyperledger Fabric and broadcasting endorsed transaction to
                orderer nodes.
              </p>
              <div
                style={{
                  padding: 24,
                  background: 'rgba(79,156,249,0.06)',
                  border: '1px solid rgba(79,156,249,0.25)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div className="flex gap-16 items-center">
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: 'var(--primary-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Link2 size={26} color="#4f9cf9" />
                  </div>
                  <div>
                    <h3 style={{ marginBottom: 4 }}>Writing Final State to Blockchain</h3>
                    <p className="text-sm">
                      This will commit block endorsement to CDAC peer nodes and permanently assign title ownership of{' '}
                      <strong>{prop.id}</strong> to <strong>{buyerId}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="wizard-actions">
            {step > 0 && (
              <button
                className="btn btn-ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={loading}
              >
                <ArrowLeft size={16} /> Previous
              </button>
            )}

            <button className="btn btn-primary" onClick={runCurrentStep} disabled={loading} style={{ minWidth: 160 }}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                  Processing on Chain...
                </>
              ) : step === STEPS.length - 1 ? (
                <>
                  <Link2 size={16} /> Execute Ownership Transfer
                </>
              ) : (
                <>
                  <span>Execute {STEPS[step].label}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
