import React, { useState, useEffect } from 'react';
import { Home, IndianRupee, Tag, Store, PlusCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { BlockchainAPI, normalizeUserEmail } from '../api/blockchain';
import PropertyCard from '../components/PropertyCard';

export default function Dashboard({ user, setPage, setTransferProp, onOpenRegisterModal }) {
  const [props, setProps] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myP, listP] = await Promise.all([
        BlockchainAPI.getMyProperties(user?.email),
        BlockchainAPI.getListings(),
      ]);
      setProps(myP || []);
      setListings(listP || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const totalValue = props.reduce((acc, p) => acc + (p.rawValue || 0), 0);
  const forSaleCount = props.filter((p) => p.listedForSale).length;

  const userEmail = normalizeUserEmail(user?.email);
  const otherListings = listings.filter((p) => normalizeUserEmail(p.owner) !== userEmail);

  return (
    <div className="page animate-in">
      <div className="container">
        {/* Page header */}
        <div className="page-header" style={{ marginTop: 28, marginBottom: 28 }}>
          <div className="page-header-row">
            <div>
              <h1>Welcome back, {user.name}</h1>
              <p className="text-sm" style={{ marginTop: 4, color: 'var(--text-500)' }}>
                Overview of your registered properties and blockchain title activity.
              </p>
            </div>

            <button className="btn btn-primary" onClick={onOpenRegisterModal}>
              <PlusCircle size={15} /> Register Property
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner" />
            <p className="pulse" style={{ fontSize: '0.875rem' }}>Querying Hyperledger Fabric peer nodes...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-row mb-32">
              <div className="stat-card blue">
                <div className="stat-icon">
                  <Home size={20} color="var(--accent)" />
                </div>
                <div className="stat-value">{props.length}</div>
                <div className="stat-label">Properties Owned</div>
              </div>

              <div className="stat-card green">
                <div className="stat-icon">
                  <IndianRupee size={20} color="var(--green)" />
                </div>
                <div className="stat-value">₹{(totalValue / 100000).toFixed(1)}L</div>
                <div className="stat-label">Portfolio Value</div>
              </div>

              <div className="stat-card amber">
                <div className="stat-icon">
                  <Tag size={20} color="var(--amber)" />
                </div>
                <div className="stat-value">{forSaleCount}</div>
                <div className="stat-label">Listed for Sale</div>
              </div>

              <div className="stat-card purple">
                <div className="stat-icon">
                  <Store size={20} color="var(--purple)" />
                </div>
                <div className="stat-value">{otherListings.length}</div>
                <div className="stat-label">Market Listings</div>
              </div>
            </div>

            {/* My Properties */}
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2>My Properties</h2>
                <p className="text-sm" style={{ marginTop: 2 }}>
                  Verified titles registered to {user.email}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('my-properties')}>
                View All ({props.length}) <ArrowRight size={13} />
              </button>
            </div>

            {props.length === 0 ? (
              <div className="result-box mb-32">
                <div className="result-icon">🏡</div>
                <h2 style={{ marginBottom: 8 }}>No properties yet</h2>
                <p className="mb-16">You have no registered titles under your account.</p>
                <button className="btn btn-primary" onClick={onOpenRegisterModal}>
                  <PlusCircle size={15} /> Register First Property
                </button>
              </div>
            ) : (
              <div className="grid-3 mb-32">
                {props.slice(0, 3).map((p) => (
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

            {/* Marketplace preview */}
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2>Featured Marketplace</h2>
                <p className="text-sm" style={{ marginTop: 2 }}>
                  Properties available for instant on-chain transfer
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('marketplace')}>
                Explore ({listings.length}) <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid-3">
              {(otherListings.length > 0 ? otherListings : listings).slice(0, 3).map((p) => (
                <PropertyCard
                  key={p.id}
                  prop={p}
                  currentUser={user}
                  onBuy={() => {
                    setTransferProp(p);
                    setPage('transfer');
                  }}
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
          </>
        )}
      </div>
    </div>
  );
}
