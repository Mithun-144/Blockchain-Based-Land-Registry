import React from 'react';
import { Home, Trees, Building, Warehouse, MapPin, Maximize2, User, ArrowRight, ShoppingCart, Tag } from 'lucide-react';

const propIcons = {
  villa: <Home size={44} color="#63b3ed" />,
  plot: <Trees size={44} color="#48d68a" />,
  apartment: <Building size={44} color="#a78bfa" />,
  commercial: <Warehouse size={44} color="#fbbf24" />,
};

export default function PropertyCard({ prop, onBuy, onSell, onView }) {
  const icon = propIcons[prop.image] || <Home size={44} color="#63b3ed" />;

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
        <div className="flex justify-between items-center mb-8">
          <span className="badge badge-blue">{prop.type}</span>
          {prop.listedForSale ? (
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
          <div className="prop-meta-item">
            <User size={13} />
            <span>{prop.owner ? prop.owner.split('@')[0] : 'Owner'}</span>
          </div>
        </div>

        <div className="prop-value">{prop.value}</div>

        <div className="prop-actions">
          <button className="btn btn-ghost btn-sm" onClick={onView} style={{ flex: 1 }}>
            Details
          </button>
          {onBuy && (
            <button className="btn btn-green btn-sm" onClick={onBuy} style={{ flex: 1 }}>
              <ShoppingCart size={14} /> Buy
            </button>
          )}
          {onSell && !prop.listedForSale && (
            <button className="btn btn-primary btn-sm" onClick={onSell} style={{ flex: 1 }}>
              <Tag size={14} /> List
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
