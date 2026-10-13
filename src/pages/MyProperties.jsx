import React, { useState, useEffect } from 'react';
import { PlusCircle, Shield } from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';
import PropertyCard from '../components/PropertyCard';

export default function MyProperties({ user, setPage, setTransferProp, onOpenRegisterModal }) {
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await BlockchainAPI.getMyProperties(user?.email);
      setProps(data || []);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [user]);

  return (
    <div className="page animate-in">
      <div className="container">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1>My Properties</h1>
              <p style={{ marginTop: 4 }}>
                Land and residential titles registered to <strong style={{ color: 'var(--text-700)' }}>{user.name}</strong> ({user.govId}) on NBF-Lite.
              </p>
            </div>
            <button className="btn btn-primary" onClick={onOpenRegisterModal}>
              <PlusCircle size={15} /> Register Property
            </button>
          </div>
        </div>

        {/* Channel info strip */}
        <div
          className="flex gap-10 items-center mb-24"
          style={{
            padding: '10px 16px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--r)',
            border: '1px solid var(--border)',
            fontSize: '0.8125rem',
            color: 'var(--text-500)',
          }}
        >
          <Shield size={14} color="var(--green)" />
          <span>
            Channel: <strong style={{ color: 'var(--text-700)' }}>localchannelone</strong>
            &nbsp;·&nbsp;
            MSP: <strong style={{ color: 'var(--text-700)' }}>{user.org || 'cdacMSP'}</strong>
            &nbsp;·&nbsp;
            {user.email}
          </span>
          <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
            {props.length} in Portfolio
          </span>
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner" />
            <p className="pulse" style={{ fontSize: '0.875rem' }}>Reading state database from Fabric peer...</p>
          </div>
        ) : props.length === 0 ? (
          <div className="result-box">
            <div className="result-icon">🏡</div>
            <h2 style={{ marginBottom: 8 }}>No Properties Registered</h2>
            <p className="mb-24">
              You have no registered titles under <strong>{user.email}</strong>. Register your land or buy from the Marketplace.
            </p>
            <div className="flex gap-12 justify-center">
              <button className="btn btn-primary" onClick={onOpenRegisterModal}>
                <PlusCircle size={15} /> Register Property
              </button>
              <button className="btn btn-ghost" onClick={() => setPage('marketplace')}>
                Explore Marketplace
              </button>
            </div>
          </div>
        ) : (
          <div className="grid-3">
            {props.map((p) => (
              <PropertyCard
                key={p.id}
                prop={p}
                currentUser={user}
                onBuy={null}
                onSell={() => {
                  setTransferProp(p);
                  setPage('sell');
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
