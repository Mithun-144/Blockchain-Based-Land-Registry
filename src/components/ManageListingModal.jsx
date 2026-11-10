import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Tag,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building,
  MapPin,
  Maximize2,
  FileText,
  IndianRupee,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

const propImages = {
  villa: '/images/prop_villa.jpg',
  apartment: '/images/prop_apartment.jpg',
  commercial: '/images/prop_commercial.jpg',
  plot: '/images/prop_plot.jpg',
};

export default function ManageListingModal({ prop, isOpen, onClose, onPriceUpdated, onDelist }) {
  if (!isOpen || !prop) return null;

  const [priceInput, setPriceInput] = useState(prop?.rawValue || 0);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingDelist, setLoadingDelist] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (prop) {
      setPriceInput(prop.rawValue || 0);
      setNotice(null);
    }
  }, [prop?.id, prop?.rawValue]);

  const imgSrc = propImages[prop.image] || propImages.villa;
  const currentPrice = prop.rawValue || 0;
  const numInput = Number(priceInput) || 0;
  const isPriceChanged = numInput > 0 && numInput !== currentPrice;

  const handleUpdatePrice = async () => {
    if (!numInput || numInput <= 0) {
      setNotice({ type: 'error', message: 'Please enter a valid asking price.' });
      return;
    }
    setLoadingPrice(true);
    setNotice(null);
    try {
      const res = await BlockchainAPI.updateListingPrice(prop.id, numInput);
      setNotice({ type: 'success', message: `Listing price updated to ₹${numInput.toLocaleString('en-IN')}` });
      if (onPriceUpdated) onPriceUpdated(prop.id, numInput);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to update price' });
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleDelist = async () => {
    if (!window.confirm(`Are you sure you want to delete the listing for "${prop.title}"?\n\nThis will withdraw the property from the public Marketplace. You remain the verified owner on the ledger.`)) {
      return;
    }
    setLoadingDelist(true);
    setNotice(null);
    try {
      await BlockchainAPI.delistProperty(prop.id);
      setNotice({ type: 'success', message: 'Listing deleted successfully. Property withdrawn from sale.' });
      if (onDelist) onDelist(prop.id);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete listing' });
    } finally {
      setLoadingDelist(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-in"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
          border: '1px solid #e2e8f0',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: '#ffffff',
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span className="badge badge-amber" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                <Tag size={11} /> Manage Listing
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                {prop.id}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#0f172a' }}>
              {prop.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: '50%', width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {notice && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: notice.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: notice.type === 'success' ? '#047857' : '#b91c1c',
                border: `1px solid ${notice.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
              }}
            >
              {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{notice.message}</span>
            </div>
          )}

          {/* Property Overview Card */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              alignItems: 'center',
            }}
          >
            <img
              src={imgSrc}
              alt={prop.title}
              style={{
                width: 90,
                height: 70,
                objectFit: 'cover',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} /> {prop.address || `${prop.locality}, ${prop.district}`}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '0.78rem', color: '#475569', flexWrap: 'wrap' }}>
                <span><strong>Area:</strong> {prop.area}</span>
                <span>•</span>
                <span><strong>Type:</strong> {prop.type}</span>
                <span>•</span>
                <span><strong>Jurisdiction:</strong> {prop.jurisdiction?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Property Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Survey / Plot No.</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', fontFamily: 'monospace', marginTop: 2 }}>
                {prop.surveyNumber || 'PENDING'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>e-Khata / RTC No.</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', fontFamily: 'monospace', marginTop: 2 }}>
                {prop.eKhataNo || 'PENDING'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Govt. Guideline Value</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', marginTop: 2 }}>
                ₹{Number(prop.guidelineValue || prop.rawValue || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Current Asking Price</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#059669', marginTop: 2 }}>
                {prop.value || `₹${Number(currentPrice).toLocaleString('en-IN')}`}
              </div>
            </div>
          </div>

          {/* Section 1: Edit Price */}
          <div
            style={{
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              padding: '18px 20px',
              marginBottom: 20,
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Tag size={18} color="#2563eb" />
              <h3 style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                Edit Asking Price
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 14px' }}>
              Change the published consideration price visible to buyers on the marketplace.
            </p>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 700,
                    color: '#64748b',
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  className="form-input"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="e.g. 5000000"
                  style={{ paddingLeft: 28, fontSize: '0.92rem', fontWeight: 600 }}
                  disabled={loadingPrice || loadingDelist}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleUpdatePrice}
                disabled={loadingPrice || loadingDelist || !isPriceChanged}
                style={{ padding: '9px 18px', minWidth: 120 }}
              >
                {loadingPrice ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
                    Saving…
                  </>
                ) : (
                  'Update Price'
                )}
              </button>
            </div>

            {prop.guidelineValue && numInput > 0 && numInput < prop.guidelineValue && (
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '6px 10px', borderRadius: 6 }}>
                ⚠️ Notice: Asking price is below Govt Guideline Value (₹{Number(prop.guidelineValue).toLocaleString('en-IN')}). Stamp duty will be levied on the minimum guideline base.
              </div>
            )}
          </div>

          {/* Section 2: Delete Listing */}
          <div
            style={{
              border: '1.5px solid #fee2e2',
              background: '#fff5f5',
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>
                  <Trash2 size={16} /> Delete Listing from Marketplace
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#7f1d1d', lineHeight: 1.4 }}>
                  Withdraw this property from active sale. You remain the verified owner on the ledger.
                </p>
              </div>

              <button
                className="btn"
                onClick={handleDelist}
                disabled={loadingPrice || loadingDelist}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  borderColor: '#dc2626',
                  padding: '9px 18px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                }}
              >
                {loadingDelist ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
                    Deleting…
                  </>
                ) : (
                  'Delete Listing'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}

