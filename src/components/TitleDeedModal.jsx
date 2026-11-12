import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  PRESET_USERS,
  normalizeUserEmail,
  extractUserAadhar,
  resolvePropertyDimensions,
  getPropertyLegalStatus,
} from '../api/blockchain';

function formatInr(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '—';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

function numberToIndianWords(num) {
  const n = Math.floor(Number(num) || 0);
  if (n <= 0) return n === 0 ? 'Rupees Zero Only' : '';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const twoDigits = (val) => {
    if (val === 0) return '';
    if (val < 20) return ones[val];
    const t = Math.floor(val / 10);
    const o = val % 10;
    return o ? `${tens[t]}-${ones[o]}` : tens[t];
  };

  const threeDigits = (val) => {
    const h = Math.floor(val / 100);
    const rem = val % 100;
    const parts = [];
    if (h > 0) parts.push(`${ones[h]} Hundred`);
    if (rem > 0) parts.push(twoDigits(rem));
    return parts.join(' ');
  };

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  const segments = [];
  if (crore > 0) segments.push(`${numberToIndianWordsSegment(crore)} Crore`);
  if (lakh > 0) segments.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) segments.push(`${twoDigits(thousand)} Thousand`);
  if (rest > 0) segments.push(threeDigits(rest));

  return `Rupees ${segments.join(' ')} Only`;

  function numberToIndianWordsSegment(val) {
    if (val >= 100) return threeDigits(val);
    return twoDigits(val);
  }
}

function parseDateSafe(dateInput) {
  if (!dateInput) return new Date();
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return new Date(`${dateInput.trim()}T00:00:00`);
  }
  return new Date(dateInput);
}

function formatDateLong(dateInput) {
  const d = parseDateSafe(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput || '—');
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatEmailToName(email) {
  if (!email) return 'Registered Citizen';
  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function maskGovId(profile, email) {
  const rawAadhar = extractUserAadhar(profile);
  if (rawAadhar.length === 12) {
    return `AADHAAR XXXX-XXXX-${rawAadhar.slice(-4)}`;
  }
  if (profile?.govId) {
    return profile.govId;
  }
  return `REG-${String(email || 'USER').split('@')[0].toUpperCase().slice(0, 8)}`;
}

function resolvePartyProfile(emailOrObj, citizensList = [], fallbackUser = null) {
  const inputObj =
    emailOrObj && typeof emailOrObj === 'object' ? emailOrObj : null;
  const fallbackObj =
    fallbackUser && typeof fallbackUser === 'object' ? fallbackUser : null;

  const rawEmail = String(
    inputObj?.email || (typeof emailOrObj === 'string' ? emailOrObj : '') || ''
  )
    .trim()
    .toLowerCase();
  const normalized = normalizeUserEmail(rawEmail).toLowerCase();

  const citizenMatch = (citizensList || []).find(
    (c) =>
      c?.email &&
      (normalizeUserEmail(c.email).toLowerCase() === normalized ||
        c.email.toLowerCase() === rawEmail)
  );
  const presetMatch = PRESET_USERS.find(
    (u) =>
      normalizeUserEmail(u.email).toLowerCase() === normalized ||
      u.alias?.toLowerCase() === rawEmail
  );
  const fallbackMatch =
    fallbackObj?.email &&
    normalizeUserEmail(fallbackObj.email).toLowerCase() === normalized
      ? fallbackObj
      : null;

  const pickFirst = (...vals) => {
    for (const v of vals) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        return String(v).trim();
      }
    }
    return '';
  };

  const email =
    pickFirst(
      inputObj?.email ? normalizeUserEmail(inputObj.email).toLowerCase() : '',
      citizenMatch?.email ? normalizeUserEmail(citizenMatch.email).toLowerCase() : '',
      presetMatch?.email?.toLowerCase(),
      normalized,
      rawEmail
    ) || '—';

  const mergedProfile = {
    aadhar: pickFirst(
      inputObj?.aadhar,
      fallbackMatch?.aadhar,
      citizenMatch?.aadhar,
      presetMatch?.aadhar
    ),
    govId: pickFirst(
      inputObj?.govId,
      fallbackMatch?.govId,
      citizenMatch?.govId,
      presetMatch?.govId
    ),
  };

  return {
    name:
      pickFirst(
        inputObj?.name,
        inputObj?.citizenName,
        fallbackMatch?.name,
        fallbackMatch?.citizenName,
        citizenMatch?.name,
        presetMatch?.name
      ) || formatEmailToName(email),
    email,
    govId: maskGovId(mergedProfile, email),
    city:
      pickFirst(
        inputObj?.city,
        fallbackMatch?.city,
        citizenMatch?.city,
        presetMatch?.city
      ) || 'Karnataka, India',
  };
}

function formatJurisdiction(j) {
  const val = String(j || 'municipal').toLowerCase();
  if (val === 'municipal') return 'Urban Municipal (BBMP / ULB)';
  if (val === 'revenue') return 'Taluk Revenue (Tahsildar / Bhoomi)';
  if (val === 'panchayat') return 'Gram Panchayat (PDO / e-Swathu)';
  return j || 'Municipal Division';
}

function compactHash(hash, head = 20, tail = 10) {
  if (!hash || typeof hash !== 'string') return '—';
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export default function TitleDeedModal({
  isOpen,
  onClose,
  prop,
  currentUser,
  buyer,
  seller,
  citizens = [],
  deedDate,
  deedRef,
  govtValue,
  saleValue,
  dutyCalc,
  paymentData,
  sroData,
  tahsildarData,
  ordererData,
  commitData,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.classList.add('printing-title-deed');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('printing-title-deed');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !prop) return null;

  const transferList = Array.isArray(prop.transferHistory) ? prop.transferHistory : [];
  const latestTransfer = transferList.length > 0 ? transferList[transferList.length - 1] : null;
  const resolvedSellerInput = seller || latestTransfer?.from || prop.previousOwner || null;
  const isConveyanceSale = Boolean(resolvedSellerInput);
  const resolvedBuyerInput = buyer || prop.owner;

  const executionTimestamp =
    deedDate ||
    commitData?.couchDbState?.updatedAt ||
    ordererData?.packedAt ||
    paymentData?.receiptTimestamp ||
    latestTransfer?.date ||
    prop.lastTransferDate ||
    prop.regDate ||
    prop.verificationDate ||
    new Date().toISOString();

  const executionDateText = formatDateLong(executionTimestamp);

  const txSuffix = (
    ordererData?.txId ||
    paymentData?.challanNo ||
    commitData?.couchDbState?._rev ||
    latestTransfer?.txId ||
    latestTransfer?.paymentRef ||
    prop.challanNo ||
    prop.lastTxId ||
    prop.verificationTxId ||
    `BLK${prop.blockNumber || '104'}`
  )
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-6)
    .toUpperCase() || 'VERIFIED';

  const execDateObj = parseDateSafe(executionTimestamp);
  const execYear = Number.isNaN(execDateObj.getTime())
    ? new Date().getFullYear()
    : execDateObj.getFullYear();

  const resolvedDeedRef =
    deedRef ||
    `DEED-${prop.id}-${execYear}-${txSuffix}`;

  const buyerProfile = resolvePartyProfile(
    resolvedBuyerInput,
    citizens,
    typeof resolvedBuyerInput === 'object' ? resolvedBuyerInput : currentUser
  );
  const sellerProfile = resolvePartyProfile(
    isConveyanceSale ? resolvedSellerInput : (prop.registeredBy || 'registrar@sro.com'),
    citizens
  );

  const legal = getPropertyLegalStatus(prop);
  const hasRestraints = legal.isFrozen || legal.hasBankLien || legal.isEncumbered;
  const encumbranceClauseText = (() => {
    if (!hasRestraints && prop.ownershipVerified !== false) {
      return 'certified free from encumbrances (NIL Form-16)';
    }
    const notices = [];
    if (legal.isFrozen) {
      notices.push(`Judicial Court Injunction Case #${prop.freezeCaseNo || 'ACTIVE'}`);
    }
    if (legal.hasBankLien || legal.isEncumbered) {
      notices.push(
        `Bank Mortgage Lien (${legal.bankLienType || 'BANK_MORTGAGE'}${
          legal.bankLienRemarks ? `: ${legal.bankLienRemarks}` : ''
        })`
      );
    }
    if (prop.ownershipVerified === false) {
      notices.push('Pending Cadastral Verification');
    }
    return `recorded subject to active statutory notice(s): ${notices.join('; ')}`;
  })();

  const resolvedSaleValue = Number(
    saleValue ??
      (isConveyanceSale && latestTransfer?.amount ? latestTransfer.amount : null) ??
      prop.rawValue ??
      prop.askingPrice ??
      0
  );
  const resolvedGovtValue = Number(govtValue ?? prop.guidelineValue ?? resolvedSaleValue);
  const dimensionsText = resolvePropertyDimensions(prop);

  const structuredLocation = [
    prop.locality && `Locality: ${prop.locality}`,
    prop.taluk && `Taluk: ${prop.taluk}`,
    prop.district && `District: ${prop.district}`,
    `State: ${prop.state || 'Karnataka'}`,
    prop.pincode && `PIN: ${prop.pincode}`,
  ]
    .filter(Boolean)
    .join(', ');

  const addressLine =
    prop.address ||
    [prop.doorStreet, prop.locality, prop.taluk, prop.district, prop.state, prop.pincode]
      .filter(Boolean)
      .join(', ');

  const defaultRateNum =
    resolvedSaleValue < 2000000 ? 0.02 : resolvedSaleValue <= 4500000 ? 0.03 : 0.05;
  const defaultSlabName =
    resolvedSaleValue < 2000000
      ? 'Below ₹20 Lakhs (2%)'
      : resolvedSaleValue <= 4500000
        ? '₹20 Lakhs to ₹45 Lakhs (3%)'
        : 'Above ₹45 Lakhs (5%)';

  const recordedBaseDuty =
    dutyCalc?.baseStampDuty ??
    dutyCalc?.stampDuty ??
    (isConveyanceSale && latestTransfer?.stampDuty != null ? latestTransfer.stampDuty : prop.stampDuty);
  const hasRecordedDuty = recordedBaseDuty != null && Number(recordedBaseDuty) > 0;

  const baseStampDuty = Number(
    hasRecordedDuty ? recordedBaseDuty : Math.round(resolvedSaleValue * defaultRateNum)
  );
  const effectiveRateNum =
    dutyCalc?.stampDutyRate != null
      ? Number(dutyCalc.stampDutyRate)
      : hasRecordedDuty && resolvedSaleValue > 0
        ? baseStampDuty / resolvedSaleValue
        : defaultRateNum;
  const rawPct = Number((effectiveRateNum * 100).toFixed(2));
  const stampDutyRatePct = `${Number.isInteger(rawPct) ? rawPct : rawPct}%`;
  const effectiveSlabName =
    dutyCalc?.slabName ||
    (Math.abs(effectiveRateNum - 0.05) < 0.002 && resolvedSaleValue <= 4500000
      ? 'Standard Statutory Assessment (5%)'
      : defaultSlabName);

  const cessAmount = Number(dutyCalc?.cess ?? Math.round(baseStampDuty * 0.1));
  const surchargePct = dutyCalc?.areaType === 'Rural' ? '3%' : '2%';
  const surchargeAmount = Number(
    dutyCalc?.surcharge ?? Math.round(baseStampDuty * (dutyCalc?.areaType === 'Rural' ? 0.03 : 0.02))
  );
  const regFeeSchedule = Number(
    dutyCalc?.registrationFee ??
      latestTransfer?.registrationFee ??
      prop.registrationFee ??
      Math.round(resolvedSaleValue * 0.01)
  );
  const totalInrAssessed = Number(
    dutyCalc?.total ??
      dutyCalc?.totalDuties ??
      paymentData?.originalInrAmount ??
      baseStampDuty + cessAmount + surchargeAmount
  );

  const resolvedChallanNo =
    paymentData?.challanNo ||
    latestTransfer?.paymentRef ||
    prop.challanNo ||
    prop.verificationTxId ||
    `CHLN-REG-${prop.id}-${execYear}`;
  const resolvedPaymentMethod =
    paymentData?.paymentMethod ||
    (String(resolvedChallanNo).toUpperCase().startsWith('STRIPE')
      ? 'Stripe Platform / State Treasury'
      : 'Cyber Treasury e-Challan (K2/IFMS)');
  const resolvedPaymentStatus = paymentData?.status
    ? `${paymentData.status} (Verified)`
    : isConveyanceSale
      ? 'PAID (Verified)'
      : 'PAID / ASSESSED (Initial Registration)';

  const gatewayCurrency = String(paymentData?.currency || 'INR').toUpperCase();
  const gatewayAmountPaid = Number(paymentData?.amountPaid ?? totalInrAssessed);
  const settledDisplay =
    gatewayCurrency !== 'INR' && paymentData?.amountPaid
      ? `${gatewayCurrency} ${gatewayAmountPaid.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} (Eqv. ${formatInr(totalInrAssessed)})`
      : formatInr(gatewayAmountPaid || totalInrAssessed);

  const gatewayRef = paymentData?.stripePaymentIntent || paymentData?.stripeSessionId;
  const blockNumber = ordererData?.blockNumber || prop.blockNumber || 104;
  const txId =
    ordererData?.txId ||
    commitData?.couchDbState?.lastTxId ||
    latestTransfer?.txId ||
    prop.lastTxId ||
    prop.verificationTxId ||
    '—';
  const hasLiveEndorsementSigs = Boolean(sroData?.endorsementSignature || tahsildarData?.endorsementSignature);

  return createPortal(
    <div
      className="modal-overlay deed-print-portal animate-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sale Deed"
    >
      <div
        className="modal deed-print-modal"
        style={{ maxWidth: 840 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Single Screen-Only Preview Toolbar with ONE Print Button */}
        <div className="modal-header no-print deed-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <FileText size={18} color="var(--accent)" />
            <span className="font-700" style={{ fontSize: '0.95rem', color: 'var(--text-900)' }}>
              Sale Deed
            </span>
            <span className="badge badge-blue" style={{ fontFamily: "'Courier New', monospace", fontSize: '0.72rem' }}>
              {resolvedDeedRef}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => window.print()}
            >
              <Printer size={14} /> Print Official Deed
            </button>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close deed preview"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Printable Formal Sale Deed */}
        <div className="modal-body deed-modal-body">
          <article className="deed-doc">
            <div className="deed-doc-inner">
              <header className="deed-doc-header">
                <div className="deed-doc-kicker">
                  GOVERNMENT OF {String(prop.state || 'KARNATAKA').toUpperCase()} &bull; DEPARTMENT OF STAMPS &amp; REGISTRATION
                </div>
                <h1 className="deed-doc-title">SALE DEED</h1>
                <div className="deed-doc-sub">
                  Office of the Sub-Registrar ({prop.district || 'Bangalore Urban'})
                </div>
                {(legal.isFrozen || legal.hasBankLien || legal.isEncumbered) && (
                  <div className="deed-doc-seal-row">
                    <span
                      className={`deed-stamp-badge ${
                        legal.isFrozen ? 'deed-stamp-badge--danger' : 'deed-stamp-badge--warn'
                      }`}
                    >
                      <ShieldCheck size={13} />{' '}
                      {legal.isFrozen ? 'COURT INJUNCTION ACTIVE' : 'MORTGAGE LIEN NOTED'}
                    </span>
                  </div>
                )}
                <p className="deed-doc-refline">
                  <span><strong>Deed Ref:</strong> <span className="deed-mono">{resolvedDeedRef}</span></span>
                  <span><strong>Block:</strong> <span className="deed-mono">#{blockNumber}</span></span>
                </p>
              </header>

              <div className="deed-prose">
                {/* Date, Seller & Buyer */}
                <p className="deed-paragraph">
                  {isConveyanceSale ? (
                    <>
                      This Sale Deed is made, executed, and registered on{' '}
                      <strong>{executionDateText}</strong> under the jurisdiction of{' '}
                      <strong>{formatJurisdiction(prop.jurisdiction)}</strong>, between{' '}
                      <strong>{sellerProfile.name}</strong> (Email / Registry ID:{' '}
                      <span className="deed-mono">{sellerProfile.email}</span>, Identity Reference:{' '}
                      <span className="deed-mono">{sellerProfile.govId}</span>), hereinafter called the{' '}
                      <strong>Seller</strong> of the First Part, and{' '}
                      <strong>{buyerProfile.name}</strong> (Email / Registry ID:{' '}
                      <span className="deed-mono">{buyerProfile.email}</span>, Identity Reference:{' '}
                      <span className="deed-mono">{buyerProfile.govId}</span>), hereinafter called the{' '}
                      <strong>Buyer</strong> of the Second Part.
                    </>
                  ) : (
                    <>
                      This Sale Deed record is issued for the property originally registered on{' '}
                      <strong>{executionDateText}</strong> under the jurisdiction of{' '}
                      <strong>{formatJurisdiction(prop.jurisdiction)}</strong>, conveyed through{' '}
                      <strong>{sellerProfile.name}</strong> (Registry ID:{' '}
                      <span className="deed-mono">{sellerProfile.email}</span>, Reference:{' '}
                      <span className="deed-mono">{sellerProfile.govId}</span>), hereinafter called the{' '}
                      <strong>Registering Authority / Transferor</strong> of the First Part, in favour of{' '}
                      <strong>{buyerProfile.name}</strong> (Email / Registry ID:{' '}
                      <span className="deed-mono">{buyerProfile.email}</span>, Identity Reference:{' '}
                      <span className="deed-mono">{buyerProfile.govId}</span>), hereinafter called the{' '}
                      <strong>Buyer / Registered Owner</strong> of the Second Part, with no subsequent
                      secondary sale transfer recorded since initial registration.
                    </>
                  )}
                </p>

                {/* Property ID (PID), Address & Dimensions */}
                <p className="deed-paragraph">
                  {isConveyanceSale ? (
                    <>
                      The Seller doth hereby absolutely sell, transfer, and convey unto the Buyer all right,
                      title, and interest in the immovable <strong>{prop.type || 'Property'}</strong> known as{' '}
                      <strong>&ldquo;{prop.title}&rdquo;</strong>
                    </>
                  ) : (
                    <>
                      The Buyer / Registered Owner holds lawful, recorded title and proprietary interest in
                      the immovable <strong>{prop.type || 'Property'}</strong> known as{' '}
                      <strong>&ldquo;{prop.title}&rdquo;</strong>
                    </>
                  )}
                  , bearing{' '}
                  <strong>
                    Property ID (PID) <span className="deed-mono">{prop.id}</span>
                    {prop.pid && prop.pid !== prop.id ? ` (Alt. PID: ${prop.pid})` : ''}
                  </strong>
                  , recorded under Survey / Plot No.{' '}
                  <strong className="deed-mono">{prop.surveyNumber || 'PENDING'}</strong> and e-Khata / RTC Document ID{' '}
                  <strong className="deed-mono">{prop.eKhataNo || 'PENDING'}</strong>,{' '}
                  {encumbranceClauseText}. The said property is situated at{' '}
                  <strong>{addressLine || '—'}</strong> ({structuredLocation}), and measures{' '}
                  <strong>{dimensionsText}</strong> in dimensions with a total extent / built-up area of{' '}
                  <strong>{prop.area || '—'}</strong>.
                </p>

                {/* Government Value & Sale Value */}
                <p className="deed-paragraph">
                  For the purpose of statutory registration and Ready Reckoner verification, the official{' '}
                  <strong>Government Value</strong> (Guideline / Circle Valuation) of the scheduled property is
                  assessed at <strong>{formatInr(resolvedGovtValue)}</strong> (
                  <em>{numberToIndianWords(resolvedGovtValue)}</em>).{' '}
                  {isConveyanceSale ? (
                    <>
                      In lawful consideration for the absolute conveyance of the property, the Seller and the
                      Buyer have mutually agreed upon and settled the transaction at a total{' '}
                      <strong>Sale Value</strong> of <strong>{formatInr(resolvedSaleValue)}</strong> (
                      <em>{numberToIndianWords(resolvedSaleValue)}</em>)
                    </>
                  ) : (
                    <>
                      For statutory registration assessment, the recorded <strong>Sale Value</strong> stands at{' '}
                      <strong>{formatInr(resolvedSaleValue)}</strong> (
                      <em>{numberToIndianWords(resolvedSaleValue)}</em>)
                    </>
                  )}
                  , evaluated under statutory assessment slab <strong>{effectiveSlabName}</strong>.
                </p>

                {/* Payment Details */}
                <p className="deed-paragraph">
                  Regarding statutory payment details, payment stands{' '}
                  <strong>{resolvedPaymentStatus}</strong> via <strong>{resolvedPaymentMethod}</strong> under
                  Challan / Treasury Reference <strong className="deed-mono">{resolvedChallanNo}</strong>. The
                  total statutory stamp duty and levies amount to <strong>{settledDisplay}</strong>, consisting of
                  Base Stamp Duty of <strong>{formatInr(baseStampDuty)}</strong> ({stampDutyRatePct} of assessed
                  consideration), Infrastructure &amp; Statutory Cess of <strong>{formatInr(cessAmount)}</strong>{' '}
                  (10% on base stamp duty), and {dutyCalc?.areaType || 'Urban'} Regional Surcharge of{' '}
                  <strong>{formatInr(surchargeAmount)}</strong> ({surchargePct} on base stamp duty), with Schedule
                  Registration Fee reference (1%) noted at <strong>{formatInr(regFeeSchedule)}</strong>
                  {gatewayRef ? (
                    <>
                      ; Gateway Reference: <span className="deed-mono">{gatewayRef}</span>
                    </>
                  ) : null}
                  {paymentData?.paymentHash ? (
                    <>
                      ; Payment Proof Hash:{' '}
                      <span className="deed-mono">{compactHash(paymentData.paymentHash, 18, 10)}</span>
                    </>
                  ) : null}
                  .
                </p>

                {/* Covenants & Attestation */}
                <p className="deed-paragraph">
                  {hasRestraints ? (
                    <>
                      As reflected on the current title record, this property carries active statutory
                      notice(s) ({legal.isFrozen ? `Judicial Stay Case #${prop.freezeCaseNo || 'ACTIVE'}` : ''}
                      {legal.isFrozen && legal.hasBankLien ? ' and ' : ''}
                      {legal.hasBankLien
                        ? `${legal.bankLienType || 'Bank Mortgage Lien'}${
                            legal.bankLienRemarks ? ` — ${legal.bankLienRemarks}` : ''
                          }`
                        : ''}
                      ) and remains restricted from transfer until formally discharged.{' '}
                    </>
                  ) : isConveyanceSale ? (
                    <>
                      The Seller affirms peaceful delivery of possession free of all liens, mortgages, or court
                      injunctions.{' '}
                    </>
                  ) : (
                    <>
                      The official record confirms an unencumbered title free of all active bank liens,
                      mortgages, or judicial injunctions (Form-16 clear status).{' '}
                    </>
                  )}
                  {hasLiveEndorsementSigs ? (
                    <>
                      This deed has been endorsed by the Sub-Registrar Office node (Signature:{' '}
                      <span className="deed-mono">{compactHash(sroData?.endorsementSignature, 16, 10)}</span>) and the
                      Revenue Authority node (Signature:{' '}
                      <span className="deed-mono">{compactHash(tahsildarData?.endorsementSignature, 16, 10)}</span>),
                      and committed to channel <strong>{commitData?.channel || 'channel1'}</strong> at Block{' '}
                      <strong className="deed-mono">#{blockNumber}</strong> (TxID:{' '}
                      <span className="deed-mono">{compactHash(txId, 18, 10)}</span>
                      {ordererData?.blockHash ? (
                        <>
                          , Block Hash: <span className="deed-mono">{compactHash(ordererData.blockHash, 16, 10)}</span>
                        </>
                      ) : null}
                      {ordererData?.merkleRoot ? (
                        <>
                          , Merkle Root: <span className="deed-mono">{compactHash(ordererData.merkleRoot, 16, 10)}</span>
                        </>
                      ) : null}
                      {commitData?.couchDbState?._rev ? (
                        <>
                          , CouchDB Rev: <span className="deed-mono">{commitData.couchDbState._rev}</span>
                        </>
                      ) : null}
                      ).
                    </>
                  ) : (
                    <>
                      This title record is endorsed by the Sub-Registrar Office (MSP: <strong>sro-com</strong>)
                      and cadastral verifying authority (<strong>{prop.verifiedBy || 'municipal-com'}</strong>
                      {prop.verificationTxId ? (
                        <>
                          , Verification Ref:{' '}
                          <span className="deed-mono">{compactHash(prop.verificationTxId, 16, 8)}</span>
                        </>
                      ) : null}
                      ) at Block <strong className="deed-mono">#{blockNumber}</strong>
                      {txId && txId !== '—' ? (
                        <>
                          {' '}
                          (TxID: <span className="deed-mono">{compactHash(txId, 18, 10)}</span>)
                        </>
                      ) : null}
                      .
                    </>
                  )}{' '}
                  In witness whereof, this Sale Deed stands executed and attested on the date first written
                  above.
                </p>
              </div>

              {/* Clean Execution Signature Rules */}
              <div className="deed-signatures">
                <div className="deed-sig-item">
                  <div className="deed-sig-seal">
                    {isConveyanceSale ? 'ENDORSED ELECTRONICALLY' : 'SRO GRANTOR SEAL'}
                  </div>
                  <div className="deed-sig-name">{sellerProfile.name}</div>
                  <div className="deed-sig-caption">
                    {isConveyanceSale ? 'Signature of Seller' : 'Registering Authority'}
                  </div>
                </div>
                <div className="deed-sig-item">
                  <div className="deed-sig-seal">AADHAAR OTP VERIFIED</div>
                  <div className="deed-sig-name">{buyerProfile.name}</div>
                  <div className="deed-sig-caption">
                    {isConveyanceSale ? 'Signature of Buyer' : 'Buyer / Registered Owner'}
                  </div>
                </div>
                <div className="deed-sig-item">
                  <div className="deed-sig-seal">SRO DIGITAL SEAL</div>
                  <div className="deed-sig-name">Sub-Registrar Office</div>
                  <div className="deed-sig-caption">Department of Stamps &amp; Registration</div>
                </div>
              </div>

              <footer className="deed-doc-footer">
                Official Sale Deed &bull; Department of Stamps &amp; Registration &bull; Deed Ref: {resolvedDeedRef}
              </footer>
            </div>
          </article>
        </div>
      </div>
    </div>,
    document.body
  );
}
