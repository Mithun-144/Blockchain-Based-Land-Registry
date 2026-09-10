import React, { useState, useEffect } from 'react';
import { Home, PlusCircle, CheckCircle2, Shield } from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';
import PropertyCard from '../components/PropertyCard';

export default function MyProperties({ user, setPage, setTransferProp, onOpenRegisterModal }) {
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await BlockchainAPI.getMyProperties();
      setProps(data || []);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  return (
    <div className="page animate-in">
      <div className="container">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1>🏠 My Registered Properties</h1>
              <p>All land and residential titles immutably registered to your Gov e-ID on NBF-Lite</p>
            </div>
            <button className="btn btn-primary" onClick={onOpenRegisterModal}>
              <PlusCircle size={16} /> Register New Property
            </button>
          </div>
        </div>

        <div
          className="flex gap-12 items-center mb-24 flex-wrap"
          style={{
            padding: '12px 20px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          <Shield size={16} color="#48d68a" />
          <span className="text-sm text-secondary">
            Hyperledger Fabric channel: <strong style={{ color: 'var(--text-primary)' }}>localchannelone</strong> |
            Endorsement Policy: <strong style={{ color: 'var(--text-primary)' }}>AND('cdacMSP.peer')</strong>
          </span>
          <span className="badge badge-green">Zero Disputes</span>
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner" />
            <p className="pulse">Reading state database from Fabric peer...</p>
          </div>
        ) : props.length === 0 ? (
          <div className="result-box">
            <div className="result-icon">🏡</div>
            <h2>No Properties Registered Yet</h2>
            <p className="mb-24">Register your land or property deed to secure it on the blockchain.</p>
            <button className="btn btn-primary" onClick={onOpenRegisterModal}>
              <PlusCircle size={16} /> Register Property
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {props.map((p) => (
              <PropertyCard
                key={p.id}
                prop={p}
                onBuy={null}
                onSell={() => {
                  setTransferProp(p);
                  setPage('transfer');
                }}
                onView={() => {
                  setTransferProp(p);
                  setPage('property-detail');
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
