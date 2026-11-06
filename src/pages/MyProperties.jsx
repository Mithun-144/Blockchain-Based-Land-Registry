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
        <div className="page-header" style={{ marginTop: 28, marginBottom: 28 }}>
          <div className="page-header-row">
            <div>
              <h1>My Properties</h1>
              <p className="text-sm" style={{ marginTop: 4, color: 'var(--text-500)' }}>
                Land and residential titles registered to <strong style={{ color: 'var(--text-700)' }}>{user.name}</strong> ({user.govId})
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <button className="btn btn-primary" onClick={onOpenRegisterModal}>
                <PlusCircle size={15} /> Register Property
              </button>
              <span
                className="badge badge-green"
                style={{ fontSize: '0.78rem', padding: '4px 10px', fontWeight: 600 }}
              >
                {props.length} {props.length === 1 ? 'Property' : 'Properties'} in Portfolio
              </span>
            </div>
          </div>
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
