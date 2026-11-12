import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Landmark,
  CreditCard,
  Check,
  Building2,
  MapPin,
  ShieldCheck,
  Copy,
  Printer,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';
import TransactionOtpModal from '../components/TransactionOtpModal';
import TitleDeedModal from '../components/TitleDeedModal';

const STAGES = [
  { id: 'endorsement', label: 'Endorsement' },
  { id: 'stamp_duty', label: 'Payment' },
];

// Deduplicate post-payment ledger finalization across React StrictMode remounts
const pendingStripeFinalizations = new Map();

export default function TransferWizard({ prop, user, setPage, stripePaymentResult }) {
  const isPaidStripeReturn = Boolean(stripePaymentResult?.success && stripePaymentResult?.paid);
  const shouldAutoVerifyOnMount = Boolean(prop?.id && !stripePaymentResult);
  const [currentStage, setCurrentStage] = useState(isPaidStripeReturn ? 1 : 0);
  const [loading, setLoading] = useState(shouldAutoVerifyOnMount);
  const [finalizing, setFinalizing] = useState(isPaidStripeReturn);
  const [finalizeError, setFinalizeError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const [sroStatus, setSroStatus] = useState(shouldAutoVerifyOnMount ? 'verifying' : 'idle');
  const [sroData, setSroData] = useState(null);
  const [tahsildarStatus, setTahsildarStatus] = useState(shouldAutoVerifyOnMount ? 'verifying' : 'idle');
  const [tahsildarData, setTahsildarData] = useState(null);
  const [endorsementError, setEndorsementError] = useState(null);

  const [dutyCalc, setDutyCalc] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [stripeNotice, setStripeNotice] = useState(null);

  const [ordererData, setOrdererData] = useState(null);
  const [commitData, setCommitData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDeedModal, setShowDeedModal] = useState(false);
  const [otpRequestKey, setOtpRequestKey] = useState(null);
  const [citizens, setCitizens] = useState([]);
  const [deedDate, setDeedDate] = useState(null);

  const latestContextRef = useRef({ sroData: null, tahsildarData: null, dutyCalc: null });
  latestContextRef.current = { sroData, tahsildarData, dutyCalc };

  const buyerId = user?.email || 'citizen@cdac.in';
  const sellerId = prop?.owner || 'seller@cdac.in';
  const rawAmount = Number(prop?.askingPrice || prop?.rawValue || 6200000);
  const govtValue = Number(prop?.guidelineValue || prop?.rawValue || rawAmount);

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

  useEffect(() => {
    let cancelled = false;
    if (prop) {
      BlockchainAPI.calculateStampDuty(prop.id, rawAmount).then((calc) => {
        if (!cancelled) {
          setDutyCalc(calc);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [prop, rawAmount]);

  // Restore saved state if returning after Stripe redirection
  useEffect(() => {
    if (!stripePaymentResult) return;
    const savedPending = sessionStorage.getItem('propchain_pending_transfer');
    if (savedPending) {
      try {
        const parsed = JSON.parse(savedPending);
        if (parsed && (!prop || parsed.property?.id === prop?.id)) {
          if (parsed.sroData) {
            setSroData(parsed.sroData);
            setSroStatus('endorsed');
          }
          if (parsed.tahsildarData) {
            setTahsildarData(parsed.tahsildarData);
            setTahsildarStatus('endorsed');
          }
          if (parsed.dutyCalc) {
            setDutyCalc(parsed.dutyCalc);
          }
        }
      } catch (e) {
        console.warn('Could not restore pending transfer session:', e);
      }
    }
  }, [prop, stripePaymentResult]);

  const runStripeAutoFinalization = useCallback(async () => {
    if (!prop || !stripePaymentResult?.success || !stripePaymentResult?.paid) {
      return null;
    }

    const challan =
      stripePaymentResult.challanNo ||
      `STRIPE-${(stripePaymentResult.paymentIntent || stripePaymentResult.sessionId || '').slice(-8).toUpperCase()}`;

    const finalizationKey =
      stripePaymentResult.sessionId ||
      stripePaymentResult.paymentIntent ||
      `${prop.id}:${challan}`;

    if (pendingStripeFinalizations.has(finalizationKey)) {
      return pendingStripeFinalizations.get(finalizationKey);
    }

    const promise = (async () => {
      let restoredPending = null;
      const savedPending = sessionStorage.getItem('propchain_pending_transfer');
      if (savedPending) {
        try {
          const parsed = JSON.parse(savedPending);
          if (parsed && (!parsed.property?.id || parsed.property.id === prop.id)) {
            restoredPending = parsed;
          }
        } catch (e) {
          console.warn('Could not restore pending transfer session:', e);
        }
      }

      const resolvedSro = restoredPending?.sroData || latestContextRef.current.sroData;
      const resolvedTahsildar = restoredPending?.tahsildarData || latestContextRef.current.tahsildarData;
      let resolvedDuty = restoredPending?.dutyCalc || latestContextRef.current.dutyCalc;
      if (!resolvedDuty) {
        try {
          resolvedDuty = await BlockchainAPI.calculateStampDuty(prop.id, rawAmount);
        } catch (e) {
          console.warn('Could not recalculate stamp duty during finalization:', e);
        }
      }

      const origInr = Number(stripePaymentResult.metadata?.originalAmount) || resolvedDuty?.total || 0;
      const resolvedPayment = {
        status: 'PAID',
        challanNo: challan,
        paymentMethod: `Stripe Platform (${stripePaymentResult.currency || 'INR'})`,
        currency: stripePaymentResult.currency || 'INR',
        amountPaid: stripePaymentResult.amountTotal || origInr || 373500,
        originalInrAmount: origInr,
        customerEmail: stripePaymentResult.customerEmail || buyerId,
        paymentHash: stripePaymentResult.paymentHash || `0x${Date.now().toString(16)}`,
        receiptTimestamp: stripePaymentResult.receiptTimestamp || new Date().toISOString(),
        stripeSessionId: stripePaymentResult.sessionId,
        stripePaymentIntent: stripePaymentResult.paymentIntent,
      };

      const ordererRes = await BlockchainAPI.sendToOrderer({
        propertyId: prop.id,
        sroSig: resolvedSro?.endorsementSignature,
        tahsildarSig: resolvedTahsildar?.endorsementSignature,
        challanNo: resolvedPayment.challanNo,
        buyer: buyerId,
        seller: sellerId,
      });

      const commitRes = await BlockchainAPI.broadcastAndCommitLedger({
        propertyId: prop.id,
        fromOwner: sellerId,
        toOwner: buyerId,
        blockData: ordererRes,
        challanNo: resolvedPayment.challanNo,
        dutyCalc: resolvedDuty,
      });

      const resolvedDeedDate =
        commitRes?.couchDbState?.updatedAt || ordererRes?.packedAt || new Date().toISOString();

      sessionStorage.removeItem('propchain_pending_transfer');

      return {
        sroData: resolvedSro,
        tahsildarData: resolvedTahsildar,
        dutyCalc: resolvedDuty,
        paymentData: resolvedPayment,
        ordererData: ordererRes,
        commitData: commitRes,
        deedDate: resolvedDeedDate,
      };
    })();

    pendingStripeFinalizations.set(finalizationKey, promise);
    try {
      return await promise;
    } catch (err) {
      pendingStripeFinalizations.delete(finalizationKey);
      throw err;
    }
  }, [prop, stripePaymentResult, buyerId, sellerId, rawAmount]);

  // Automatically finalize ledger commit and go directly to Transfer Complete after Stripe payment succeeds
  useEffect(() => {
    if (!stripePaymentResult) return undefined;

    let cancelled = false;

    if (stripePaymentResult.success && stripePaymentResult.paid) {
      setFinalizeError(null);
      setFinalizing(true);
      setCurrentStage(1);

      runStripeAutoFinalization()
        .then((res) => {
          if (cancelled || !res) return;
          if (res.sroData) {
            setSroData(res.sroData);
            setSroStatus('endorsed');
          }
          if (res.tahsildarData) {
            setTahsildarData(res.tahsildarData);
            setTahsildarStatus('endorsed');
          }
          if (res.dutyCalc) {
            setDutyCalc(res.dutyCalc);
          }
          setPaymentData(res.paymentData);
          setOrdererData(res.ordererData);
          setCommitData(res.commitData);
          setDeedDate(res.deedDate);
          setFinalizing(false);
          setIsCompleted(true);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('Post-payment finalization failed:', err);
          setFinalizeError(err.message || 'Failed to finalize transfer on ledger.');
          setFinalizing(false);
        });
    } else if (stripePaymentResult.cancelled || (stripePaymentResult.success && !stripePaymentResult.paid)) {
      setFinalizing(false);
      setStripeNotice({
        type: 'warning',
        message: 'Payment on Stripe platform was cancelled or incomplete. You can retry paying whenever you are ready.',
      });
      setCurrentStage(1);
    } else if (stripePaymentResult.error) {
      setFinalizing(false);
      setStripeNotice({
        type: 'error',
        message: `Stripe verification issue: ${stripePaymentResult.error}`,
      });
      setCurrentStage(1);
    }

    return () => {
      cancelled = true;
    };
  }, [stripePaymentResult, runStripeAutoFinalization]);

  const runDualNodeVerification = useCallback(async (isCancelled = () => false) => {
    if (!prop?.id) return;
    setLoading(true);
    setEndorsementError(null);
    setSroStatus('verifying');
    setTahsildarStatus('verifying');

    try {
      const [sroResult, tahResult] = await Promise.allSettled([
        BlockchainAPI.verifySroNode(prop.id),
        BlockchainAPI.verifyTahsildarNode(prop.id, sellerId),
      ]);

      if (isCancelled()) return;

      let firstError = null;

      if (sroResult.status === 'fulfilled') {
        setSroData(sroResult.value);
        setSroStatus('endorsed');
      } else {
        setSroStatus('failed');
        firstError = sroResult.reason?.message || 'SRO node endorsement failed.';
      }

      if (tahResult.status === 'fulfilled') {
        setTahsildarData(tahResult.value);
        setTahsildarStatus('endorsed');
      } else {
        setTahsildarStatus('failed');
        firstError = firstError || tahResult.reason?.message || 'Revenue Dept node endorsement failed.';
      }

      if (firstError) {
        setEndorsementError(firstError);
      }
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }, [prop?.id, sellerId]);

  // Automatically send endorsement proposal as soon as the user clicks Buy
  useEffect(() => {
    if (!prop?.id || stripePaymentResult) return undefined;

    let cancelled = false;
    runDualNodeVerification(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [prop?.id, stripePaymentResult, runDualNodeVerification]);

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
  const executeDualNodeVerification = () => {
    runDualNodeVerification();
  };

  const handlePayClick = () => {
    setStripeNotice(null);
    setOtpRequestKey(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  };

  const handleOtpVerified = () => {
    setOtpRequestKey(null);
    executePayment();
  };

  const executePayment = async () => {
    setLoading(true);
    setStripeNotice(null);
    try {
      // 1. Save transfer session state in sessionStorage to resume seamlessly upon returning from Stripe
      const pendingState = {
        property: prop,
        sroData,
        tahsildarData,
        dutyCalc,
        buyerId,
        sellerId,
        timestamp: Date.now(),
      };
      sessionStorage.setItem('propchain_pending_transfer', JSON.stringify(pendingState));

      // 2. Call backend to create Stripe Checkout session
      const totalAmount = dutyCalc?.total || 373500;
      const res = await BlockchainAPI.createStripeCheckoutSession({
        propertyId: prop.id,
        propertyTitle: prop.title,
        amount: totalAmount,
        currency: 'inr',
        buyerEmail: user?.email || buyerId,
        buyerName: user?.name || user?.citizenName || 'Property Buyer',
        seller: sellerId,
      });

      if (!res.url) {
        throw new Error(res.error || 'Did not receive Stripe checkout redirect URL');
      }

      // 3. Redirect to Stripe's hosted platform
      window.location.href = res.url;
    } catch (err) {
      console.error('Stripe Payment Redirect Error:', err);
      alert(`Stripe Payment Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleRetryFinalization = async () => {
    setFinalizeError(null);
    setFinalizing(true);
    try {
      const res = await runStripeAutoFinalization();
      if (!res) return;
      if (res.sroData) {
        setSroData(res.sroData);
        setSroStatus('endorsed');
      }
      if (res.tahsildarData) {
        setTahsildarData(res.tahsildarData);
        setTahsildarStatus('endorsed');
      }
      if (res.dutyCalc) {
        setDutyCalc(res.dutyCalc);
      }
      setPaymentData(res.paymentData);
      setOrdererData(res.ordererData);
      setCommitData(res.commitData);
      setDeedDate(res.deedDate);
      setIsCompleted(true);
    } catch (err) {
      setFinalizeError(err.message || 'Failed to finalize transfer on ledger.');
    } finally {
      setFinalizing(false);
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
            <button className="btn btn-primary" onClick={() => setShowDeedModal(true)}>
              <Printer size={15} /> Print Deed
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('my-properties')}>
              My Properties →
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('marketplace')}>
              Marketplace
            </button>
          </div>
        </div>

        {/* Official Print-Ready Sale Deed Modal */}
        <TitleDeedModal
          isOpen={showDeedModal}
          onClose={() => setShowDeedModal(false)}
          prop={{
            ...prop,
            owner: buyerId,
            previousOwner: sellerId,
            blockNumber: ordererData?.blockNumber || prop.blockNumber,
            lastTxId: ordererData?.txId || prop.lastTxId,
            challanNo: paymentData?.challanNo || prop.challanNo,
          }}
          currentUser={user}
          buyer={user || buyerId}
          seller={sellerId}
          citizens={citizens}
          deedDate={deedDate || commitData?.couchDbState?.updatedAt || ordererData?.packedAt}
          govtValue={govtValue}
          saleValue={rawAmount}
          dutyCalc={dutyCalc}
          paymentData={paymentData}
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
            const isDone = idx < currentStage || isCompleted || finalizing || Boolean(finalizeError);
            const isActive = idx === currentStage && !isCompleted && !finalizing && !finalizeError;
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
                    background: isDone ? 'var(--green)' : 'var(--border)',
                    transition: 'background 0.2s ease',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── POST-PAYMENT AUTOMATIC FINALIZATION ── */}
        {(finalizing || finalizeError) ? (
          <div className="animate-in" style={{ ...s.sectionCard, padding: '32px 24px', textAlign: 'center' }}>
            {finalizing ? (
              <>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '1.15rem', marginBottom: 6 }}>Payment Verified — Finalizing Transfer</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-500)', maxWidth: 480, margin: '0 auto 12px', lineHeight: 1.6 }}>
                  Your stamp duty payment has been confirmed. Committing ownership transfer to the ledger and preparing your Sale Deed…
                </p>
                {stripePaymentResult?.challanNo && (
                  <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                    ✓ Challan: {stripePaymentResult.challanNo}
                  </span>
                )}
              </>
            ) : (
              <>
                <AlertCircle size={36} color="#dc2626" style={{ marginBottom: 12 }} />
                <h2 style={{ fontSize: '1.15rem', marginBottom: 6, color: '#dc2626' }}>Ledger Finalization Interrupted</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-500)', maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Your Stripe payment was verified, but recording the transfer encountered an issue: {finalizeError}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={handleRetryFinalization}>
                    Retry Finalization
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setFinalizeError(null);
                      setCurrentStage(1);
                    }}
                  >
                    Back to Payment
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
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
                  </div>
                )}
              </div>

              {/* Tahsildar Node */}
              <div style={{
                ...s.sectionCard, marginBottom: 0,
                borderColor: tahsildarStatus === 'endorsed' ? 'var(--green)' : tahsildarStatus === 'verifying' ? 'var(--accent)' : tahsildarStatus === 'failed' ? '#ef4444' : 'var(--border)',
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
                    Pending verification…
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
            {endorsementError && (
              <div className="animate-in" style={{
                padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 6, marginBottom: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 600, fontSize: '0.82rem', marginBottom: 4 }}>
                  <AlertCircle size={15} /> Endorsement Verification Failed
                </div>
                <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                  {endorsementError}
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

        {/* ── STAGE 2: Stamp Duty & Payment via Stripe ── */}
        {currentStage === 1 && (
          <div className="animate-in">
            <h2 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Stamp Duty & Payment</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-500)', marginBottom: 20 }}>
              Official stamp duty assessment and payment.
            </p>

            {stripeNotice && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background:
                    stripeNotice.type === 'success'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : stripeNotice.type === 'warning'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                  color:
                    stripeNotice.type === 'success'
                      ? '#059669'
                      : stripeNotice.type === 'warning'
                        ? '#d97706'
                        : '#dc2626',
                  border: `1px solid ${stripeNotice.type === 'success'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : stripeNotice.type === 'warning'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                    }`,
                }}
              >
                {stripeNotice.type === 'warning' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{stripeNotice.message}</span>
              </div>
            )}

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
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6366f1' }}>
                  ₹{dutyCalc?.total?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={s.actions}>
              <button className="btn btn-ghost" onClick={() => setCurrentStage(0)} disabled={loading || Boolean(otpRequestKey)}>
                <ArrowLeft size={14} /> Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePayClick}
                disabled={loading || Boolean(otpRequestKey)}
                style={{
                  background: '#6366f1',
                  borderColor: '#6366f1',
                  padding: '10px 22px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    <CreditCard size={15} /> Pay ₹{dutyCalc?.total?.toLocaleString('en-IN')} <ExternalLink size={14} style={{ marginLeft: 4 }} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {otpRequestKey && (
        <TransactionOtpModal
          key={otpRequestKey}
          isOpen={Boolean(otpRequestKey)}
          requestKey={otpRequestKey}
          action="buy"
          prop={prop}
          user={user}
          title="Verify OTP to Pay via Stripe"
          confirmLabel="Verify & Redirect to Stripe"
          amountLabel="Total Payable"
          amountDisplay={`₹${Number(dutyCalc?.total || 373500).toLocaleString('en-IN')}`}
          onVerified={handleOtpVerified}
          onClose={() => setOtpRequestKey(null)}
        />
      )}
    </div>
  );
}
