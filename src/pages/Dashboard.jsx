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
        {/* Modern Clean Alert Ribbon */}
        <div className="ticker-box mt-16">
          <span style={{ background: '#2563eb', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>SYSTEM STATUS</span>
          <span>ℹ️ <strong>NBF-Lite Network Active:</strong> SRO & Tahsildar dual-node peer endorsement with Raft consensus and CouchDB World State ledger sync active.</span>
        </div>

        <div className="page-header" style={{ marginTop: 12 }}>
          <div className="page-header-row">
            <div>
              <h1>Welcome back, {user.name} 👋</h1>
              <p>Your property portfolio on the NBF-Lite blockchain — secure, immutable, and transparent.</p>
              <div className="flex gap-12 items-center mt-12 flex-wrap">
                <span className="badge badge-green">
                  <ShieldCheck size={12} /> Fabric Ledger Sync: OK
                </span>
                <span className="badge badge-blue" style={{ fontFamily: 'monospace' }}>
                  {user.govId}
                </span>
                <span className="badge badge-purple">{user.org} ({user.role})</span>
              </div>
            </div>

            <div className="flex gap-12">
              <button className="btn btn-primary" onClick={onOpenRegisterModal}>
                <PlusCircle size={16} /> Register Property
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner" />
            <p className="pulse">Querying Hyperledger Fabric peer nodes...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-row mb-32">
              <div className="stat-card blue">
                <div className="stat-icon">
                  <Home size={24} color="#4f9cf9" />
                </div>
                <div className="stat-value">{props.length}</div>
                <div className="stat-label">Properties Owned by You</div>
              </div>

              <div className="stat-card green">
                <div className="stat-icon">
                  <IndianRupee size={24} color="#48d68a" />
                </div>
                <div className="stat-value">₹{(totalValue / 100000).toFixed(1)}L</div>
                <div className="stat-label">Your Portfolio Valuation</div>
              </div>

              <div className="stat-card amber">
                <div className="stat-icon">
                  <Tag size={24} color="#fbbf24" />
                </div>
                <div className="stat-value">{forSaleCount}</div>
                <div className="stat-label">Your Properties on Sale</div>
              </div>

              <div className="stat-card purple">
                <div className="stat-icon">
                  <Store size={24} color="#a78bfa" />
                </div>
                <div className="stat-value">{otherListings.length}</div>
                <div className="stat-label">Marketplace Opportunities</div>
              </div>
            </div>

            {/* My Properties Preview */}
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2>My Properties</h2>
                <p className="text-sm">Verified real estate titles registered to your Gov e-ID ({user.email})</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('my-properties')}>
                View All ({props.length}) <ArrowRight size={14} />
              </button>
            </div>

            {props.length === 0 ? (
              <div className="card mb-32 text-center" style={{ padding: '36px 20px' }}>
                <p className="mb-16">You do not own any registered titles in your account yet.</p>
                <button className="btn btn-primary" onClick={onOpenRegisterModal}>
                  <PlusCircle size={16} /> Register First Property
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

            {/* Featured Marketplace Preview */}
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2>Featured Marketplace Listings</h2>
                <p className="text-sm">Properties open for purchase with instant SRO & Tahsildar consensus transfer</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('marketplace')}>
                Explore Market ({listings.length}) <ArrowRight size={14} />
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
