import React from 'react';
import { MapPin, Maximize2, User, ShoppingCart, Tag, CheckCircle2 } from 'lucide-react';
import { PRESET_USERS, normalizeUserEmail } from '../api/blockchain';

// Realistic property photos (served from /public/images/)
const propImages = {
  villa:      '/images/prop_villa.jpg',
  apartment:  '/images/prop_apartment.jpg',
  commercial: '/images/prop_commercial.jpg',
  plot:       '/images/prop_plot.jpg',
};

// Fallback solid colors if image fails to load
const fallbackColors = {
  villa:      '#d1d5db',
  apartment:  '#d1d5db',
  commercial: '#d1d5db',
  plot:       '#d1d5db',
};

export default function PropertyCard({ prop, currentUser, onBuy, onSell, onView }) {
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

  return (
    <div className="prop-card animate-in">
      {/* Thumbnail — real photo */}
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
        {/* Subtle bottom gradient for badge legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.32) 0%, transparent 55%)',
            pointerEvents: 'none',
          }}
        />
        {/* Status chip overlaid on photo */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          {isOwner ? (
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
        </div>
      </div>

      {/* Card body */}
      <div className="prop-body">
        {/* Type label */}
        <span
          className="badge badge-neutral"
          style={{ textTransform: 'capitalize', marginBottom: 10, display: 'inline-flex' }}
        >
          {prop.type}
        </span>

        {/* Title */}
        <h3 className="prop-title" onClick={onView}>
          {prop.title}
        </h3>

        {/* Address */}
        <div className="prop-addr">
          <MapPin size={12} style={{ flexShrink: 0 }} />
          {prop.address}
        </div>

        {/* Meta strip */}
        <div className="prop-meta">
          <div className="prop-meta-item">
            <Maximize2 size={12} />
            <span>{prop.area}</span>
          </div>
          <div className="prop-meta-item" title={`Owner: ${prop.owner}`}>
            <User size={12} />
            <span style={{
              fontWeight: isOwner ? 600 : 400,
              color: isOwner ? 'var(--accent)' : 'inherit',
            }}>
              {ownerDisplayName}
            </span>
          </div>
        </div>

        {/* Value */}
        <div className="prop-value">{prop.value}</div>

        {/* Actions */}
        <div className="prop-actions">
          <button className="btn btn-ghost btn-sm" onClick={onView} style={{ flex: 1 }}>
            Details
          </button>

          {isOwner ? (
            onSell && (
              <button
                className={`btn btn-sm ${prop.listedForSale ? 'btn-ghost' : 'btn-primary'}`}
                onClick={onSell}
                style={{ flex: 1 }}
              >
                <Tag size={13} /> {prop.listedForSale ? 'Manage' : 'List'}
              </button>
            )
          ) : (
            onBuy &&
            prop.listedForSale && (
              <button className="btn btn-green btn-sm" onClick={onBuy} style={{ flex: 1 }}>
                <ShoppingCart size={13} /> Buy
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
