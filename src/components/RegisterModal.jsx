import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle2, Building2 } from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function RegisterModal({ isOpen, onClose, user, onRegistered }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    area: '',
    type: 'Residential',
    rawValue: 5000000,
    image: 'villa',
  });
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await BlockchainAPI.registerProperty({
        ...formData,
        owner: user?.email || 'citizen@cdac.in',
      });
      setSuccess(created);
      onRegistered(created);
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-12">
            <Building2 size={22} color="#ffffff" />
            <h2 style={{ fontSize: '1.15rem', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Register New Property</h2>
          </div>
          <button className="modal-close" onClick={handleClose} title="Close window">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
        {success ? (
          <div className="result-box check-anim" style={{ padding: '24px 0' }}>
            <CheckCircle2 size={56} color="#48d68a" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--green)', marginBottom: 8 }}>Registered on Blockchain!</h3>
            <p style={{ fontSize: '0.88rem', marginBottom: 20 }}>
              Property <strong>{success.id}</strong> has been committed to the NBF-Lite ledger with block #{success.blockNumber}.
            </p>
            <button className="btn btn-primary w-full" onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-16">
            <div className="form-group">
              <label className="form-label">Property Title</label>
              <input
                className="form-input"
                required
                placeholder="e.g. Royal Palms Residency - Flat 402"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Complete Address</label>
              <input
                className="form-input"
                required
                placeholder="Plot / Survey No, Street, City - Pincode"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid-2 gap-12">
              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select
                  className="form-input"
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    const imgMap = { Residential: 'villa', Apartment: 'apartment', Plot: 'plot', Commercial: 'commercial' };
                    setFormData({ ...formData, type, image: imgMap[type] || 'villa' });
                  }}
                >
                  <option value="Residential">Residential</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Plot">Plot</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Area (sq.ft / acres)</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. 1850 sq.ft"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Market Value (₹)</label>
              <input
                className="form-input"
                type="number"
                required
                min="100000"
                step="50000"
                value={formData.rawValue}
                onChange={(e) => setFormData({ ...formData, rawValue: e.target.value })}
              />
            </div>

            <div className="flex gap-12 mt-16 justify-between">
              <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16 }} />
                    Submitting to Fabric...
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    Register to Blockchain
                  </>
                )}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}

