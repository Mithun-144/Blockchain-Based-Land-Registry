import React, { useState } from 'react';
import {
  MapPin,
  Maximize2,
  User,
  ShoppingCart,
  Tag,
  CheckCircle2,
  Scale,
  Landmark,
  ShieldCheck,
  ShieldAlert,
  Building,
  Pencil,
  Trash2,
  X,
  IndianRupee,
  Printer,
} from 'lucide-react';
import { PRESET_USERS, normalizeUserEmail, getPropertyLegalStatus } from '../api/blockchain';

// Realistic property photos (served from /public/images/)
const propImages = {
  villa: '/images/prop_villa.jpg',
  apartment: '/images/prop_apartment.jpg',
  commercial: '/images/prop_commercial.jpg',
  plot: '/images/prop_plot.jpg',
};

// Fallback solid colors if image fails to load
const fallbackColors = {
  villa: '#d1d5db',
  apartment: '#d1d5db',
  commercial: '#d1d5db',
  plot: '#d1d5db',
};

// Encumbrance type chip — renders a typed, color-coded badge
function EncumbranceChip({ encumbrance, encumbranceType, remarks, frozen }) {
  if (frozen) {
    return (
      <span
        className="badge"
        style={{
          backdropFilter: 'blur(6px)',
          background: 'rgba(254,226,226,0.95)',
          color: '#dc2626',
          border: '1px solid #f87171',
          fontWeight: 700,
        }}
        title="Property under active court injunction"
      >
        <Scale size={10} /> Injunction Active
      </span>
    );
  }
  if (encumbrance) {
    const isCourt = encumbranceType === 'COURT_ORDER';
    return (
      <span
        className="badge"
        style={{
          backdropFilter: 'blur(6px)',
          background: isCourt ? 'rgba(254,226,226,0.95)' : 'rgba(254,243,199,0.95)',
          color: isCourt ? '#dc2626' : '#d97706',
          border: `1px solid ${isCourt ? '#f87171' : '#fde68a'}`,
          fontWeight: 600,
          fontSize: '0.7rem',
        }}
        title={remarks ? `${encumbranceType || 'BANK_MORTGAGE'}: ${remarks}` : `${encumbranceType || 'BANK_MORTGAGE'} lien attached`}
      >
        <Landmark size={9} /> {isCourt ? 'Court Order' : 'Bank Lien'}
      </span>
    );
  }
  return null;
}

export default function PropertyCard({ prop, currentUser, onBuy, onSell, onView, onManage, onPrintDeed }) {
  const imgSrc = propImages[prop.image] || propImages.villa;

  const isOwner =
    currentUser &&
    normalizeUserEmail(prop.owner) === normalizeUserEmail(currentUser.email);

  const ownerProfile = PRESET_USERS.find(
    (u) => normalizeUserEmail(u.email) === normalizeUserEmail(prop.owner)
  );

  const ownerDisplayName = isOwner
    ? 'You (Owner)'
    : ownerProfile
    ? ownerProfile.name
    : prop.owner
    ? prop.owner.split('@')[0]
    : 'Registered Owner';

  // ── Correct field names from smart contract (both court stay & bank lien supported) ──
  const { isFrozen, isEncumbered, encType, hasBankLien, bankLienType, bankLienRemarks } =
    getPropertyLegalStatus(prop);
  const isVerified = prop.ownershipVerified !== false;

  // Structured location: prefer structured fields, fall back to address
  const locationLine = [prop.locality, prop.district].filter(Boolean).join(', ')
    || prop.address
    || '';

  return (
    <div className="prop-card animate-in">
      {/* Thumbnail */}
      <div
        className="prop-thumb"
        onClick={onView}
        title="View property details"
        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', height: 160 }}
      >
        <img
          src={imgSrc}
          alt={prop.type}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.style.background = fallbackColors[prop.image] || '#d1d5db';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.36) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top-right: status + encumbrance badges */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          {/* Primary status badge */}
          {isFrozen ? (
            <span
              className="badge"
              style={{
                backdropFilter: 'blur(6px)',
                background: 'rgba(254,226,226,0.95)',
                color: '#dc2626',
                border: '1px solid #f87171',
                fontWeight: 700,
              }}
              title={`Frozen under case: ${prop.freezeCaseNo || 'CIVIL-ORDER'}`}
            >
              <Scale size={10} /> Injunction Active
            </span>
          ) : isOwner ? (
            prop.listedForSale ? (
              <span className="badge badge-amber" style={{ backdropFilter: 'blur(6px)', background: 'rgba(255,251,235,0.92)' }}>
                <Tag size={10} /> For Sale
              </span>
            ) : (
              <span className="badge badge-green" style={{ backdropFilter: 'blur(6px)', background: 'rgba(236,253,245,0.92)' }}>
                <CheckCircle2 size={10} /> Owned
              </span>
            )
          ) : prop.listedForSale ? (
            <span className="badge badge-blue" style={{ backdropFilter: 'blur(6px)', background: 'rgba(239,246,255,0.92)' }}>
              <Tag size={10} /> Available
            </span>
          ) : (
            <span className="badge badge-neutral" style={{ backdropFilter: 'blur(6px)', background: 'rgba(249,250,251,0.92)' }}>
              Registered
            </span>
          )}

          {/* Encumbrance / Bank Lien chip — displayed even when court injunction is also active */}
          {(hasBankLien || (!isFrozen && isEncumbered)) && (
            <EncumbranceChip
              encumbrance={true}
              encumbranceType={hasBankLien ? (bankLienType || 'BANK_MORTGAGE') : encType}
              remarks={bankLienRemarks || prop.encumbranceRemarks}
              frozen={false}
            />
          )}
        </div>

        {/* Top-left: jurisdiction tag */}
        {prop.jurisdiction && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span
              className="badge"
              style={{
                backdropFilter: 'blur(6px)',
                background: 'rgba(15,23,42,0.75)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
              }}
            >
              {prop.jurisdiction}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="prop-body">
        {/* Type label & verification strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
            {prop.type}
          </span>

          {isVerified ? (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--green)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 600,
              }}
              title={`Verified by ${prop.verifiedBy || 'Cadastral Authority'} on ${prop.verificationDate || ''}`}
            >
              <ShieldCheck size={12} /> e-Khata Verified
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-400)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ShieldAlert size={11} /> Pending Validation
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="prop-title" onClick={onView}>
          {prop.title}
        </h3>

        {/* Structured location: Locality → District */}
        <div className="prop-addr" title={prop.address}>
          <MapPin size={12} style={{ flexShrink: 0 }} />
          <span>{locationLine}</span>
          {prop.pincode && (
            <span style={{ marginLeft: 4, color: 'var(--text-400)', fontSize: '0.72rem' }}>
              {prop.pincode}
            </span>
          )}
        </div>

        {/* Meta strip */}
        <div className="prop-meta">
          <div className="prop-meta-item">
            <Maximize2 size={12} />
            <span>{prop.area}</span>
          </div>
          <div className="prop-meta-item" title={`Owner: ${prop.owner}`}>
            <User size={12} />
            <span
              style={{
                fontWeight: isOwner ? 600 : 400,
                color: isOwner ? 'var(--accent)' : 'inherit',
              }}
            >
              {ownerDisplayName}
            </span>
          </div>
        </div>

        {/* Value row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
          <div className="prop-value">{prop.value}</div>
          {prop.guidelineValue && Number(prop.guidelineValue) !== Number(prop.rawValue) && (
            <div
              style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}
              title="Govt. Guideline Valuation"
            >
              Govt: ₹{Number(prop.guidelineValue).toLocaleString('en-IN')}
            </div>
          )}
        </div>

        {/* Survey / e-Khata microline */}
        {(prop.surveyNumber || prop.eKhataNo) && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-400)', marginTop: 4, display: 'flex', gap: 10 }}>
            {prop.surveyNumber && prop.surveyNumber !== 'PENDING' && (
              <span title="Survey Number">📐 {prop.surveyNumber}</span>
            )}
            {prop.eKhataNo && prop.eKhataNo !== 'PENDING' && (
              <span title="e-Khata / RTC No.">📋 {prop.eKhataNo}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="prop-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={onView} style={{ flex: 1 }}>
            Details
          </button>

          {isFrozen ? (
            <button
              className="btn btn-sm"
              disabled
              style={{
                flex: 1,
                background: '#fee2e2',
                color: '#dc2626',
                borderColor: '#fca5a5',
                cursor: 'not-allowed',
                fontSize: '0.75rem',
              }}
              title={`Court Restraint Active — Case: ${prop.freezeCaseNo || 'CIVIL-ORDER'}${hasBankLien ? ' | Bank Lien Also Active' : ''}`}
            >
              <Scale size={12} /> Court Frozen
            </button>
          ) : isOwner ? (
            prop.listedForSale ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onManage && onManage(prop)}
                style={{ flex: 1 }}
              >
                <Tag size={13} /> Manage Listing
              </button>
            ) : (
              onSell && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onSell}
                  style={{ flex: 1 }}
                >
                  <Tag size={13} /> List for Sale
                </button>
              )
            )
          ) : (
            onBuy &&
            prop.listedForSale && (
              <button className="btn btn-green btn-sm" onClick={onBuy} style={{ flex: 1 }}>
                <ShoppingCart size={13} /> Buy
              </button>
            )
          )}

          {isOwner && onPrintDeed && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onPrintDeed(prop)}
              style={{ flexBasis: '100%', width: '100%' }}
              title="Preview and print official blockchain Title Deed Certificate"
            >
              <Printer size={13} /> Print Deed Certificate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
