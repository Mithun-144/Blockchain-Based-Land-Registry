import React from 'react';
import { Home, Trees, Building, Warehouse, MapPin, Maximize2, User, ShoppingCart, Tag, CheckCircle2 } from 'lucide-react';
import { PRESET_USERS, normalizeUserEmail } from '../api/blockchain';

const propIcons = {
  villa: <Home size={44} color="#63b3ed" />,
  plot: <Trees size={44} color="#48d68a" />,
  apartment: <Building size={44} color="#a78bfa" />,
  commercial: <Warehouse size={44} color="#fbbf24" />,
};

export default function PropertyCard({ prop, currentUser, onBuy, onSell, onView }) {
  const icon = propIcons[prop.image] || <Home size={44} color="#63b3ed" />;

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
      <div
        className={`prop-thumb prop-thumb-${prop.image || 'villa'}`}
        onClick={onView}
        title="View property details on blockchain"
      >
        <div style={{ zIndex: 1 }}>{icon}</div>
      </div>

      <div className="prop-body">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <span className="badge badge-blue">{prop.type}</span>
          {isOwner ? (
            prop.listedForSale ? (
              <span className="badge badge-amber" style={{ fontWeight: 700 }}>
                <Tag size={11} /> Your Listing (For Sale)
              </span>
            ) : (
              <span className="badge badge-green">
                <CheckCircle2 size={11} /> Your Property
              </span>
            )
          ) : prop.listedForSale ? (
            <span className="badge badge-amber">
              <Tag size={11} /> For Sale
            </span>
          ) : (
            <span className="badge badge-green">✓ Registered</span>
          )}
        </div>

        <h3 className="prop-title" onClick={onView} style={{ cursor: 'pointer' }}>
          {prop.title}
        </h3>

        <div className="prop-addr">
          <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
          {prop.address}
        </div>

        <div className="prop-meta">
          <div className="prop-meta-item">
            <Maximize2 size={13} />
            <span>{prop.area}</span>
          </div>
          <div className="prop-meta-item" title={`Owner: ${prop.owner}`}>
            <User size={13} />
            <span style={{ fontWeight: isOwner ? 700 : 500, color: isOwner ? 'var(--primary)' : 'inherit' }}>
              {ownerDisplayName}
            </span>
          </div>
        </div>

        <div className="prop-value">{prop.value}</div>

        <div className="prop-actions">
          <button className="btn btn-ghost btn-sm" onClick={onView} style={{ flex: 1 }}>
            Details
          </button>

          {/* If the current user owns it, show Manage/List, NOT Buy! */}
          {isOwner ? (
            onSell && (
              <button
                className={`btn btn-sm ${prop.listedForSale ? 'btn-ghost' : 'btn-primary'}`}
                onClick={onSell}
                style={{ flex: 1 }}
              >
                <Tag size={14} /> {prop.listedForSale ? 'Manage' : 'List'}
              </button>
            )
          ) : (
            /* If another user owns it and it's for sale, show Buy! */
            onBuy &&
            prop.listedForSale && (
              <button className="btn btn-green btn-sm" onClick={onBuy} style={{ flex: 1 }}>
                <ShoppingCart size={14} /> Buy
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
