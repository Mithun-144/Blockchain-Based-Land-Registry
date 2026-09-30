import React, { useState, useEffect } from 'react';
import { Search, Filter, Store, UserCheck, ShoppingCart, Tag } from 'lucide-react';
import { BlockchainAPI, normalizeUserEmail } from '../api/blockchain';
import PropertyCard from '../components/PropertyCard';

export default function Marketplace({ user, setPage, setTransferProp }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const types = ['All', 'Available to Buy', 'My Active Listings', 'Residential', 'Apartment', 'Commercial', 'Plot'];

  const loadListings = () => {
    setLoading(true);
    BlockchainAPI.getListings()
      .then((l) => setListings(l || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadListings();
  }, [user]);

  const userEmail = normalizeUserEmail(user?.email);

  const filtered = listings.filter((p) => {
    const isOwner = normalizeUserEmail(p.owner) === userEmail;

    let matchesFilter = true;
    if (filter === 'Available to Buy') {
      matchesFilter = !isOwner;
    } else if (filter === 'My Active Listings') {
      matchesFilter = isOwner;
    } else if (filter !== 'All') {
      matchesFilter = p.type === filter;
    }

    const matchesSearch =
      search.trim() === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.owner.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const myListingCount = listings.filter((p) => normalizeUserEmail(p.owner) === userEmail).length;
  const availableToBuyCount = listings.filter((p) => normalizeUserEmail(p.owner) !== userEmail).length;

  return (
    <div className="page animate-in">
      <div className="container">
        <div className="page-header">
          <div className="flex justify-between items-start flex-wrap gap-12">
            <div>
              <h1>🏪 Blockchain Property Marketplace</h1>
              <p>Browse verified real estate titles available for immediate on-chain transfer on NBF-Lite.</p>
            </div>

            {user && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: '0.84rem',
                }}
              >
                <span>Viewing as: <strong>{user.name}</strong></span>
                <span className="badge badge-blue">{availableToBuyCount} Available to Buy</span>
                {myListingCount > 0 && (
                  <span className="badge badge-amber">{myListingCount} Listed by You</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex justify-between items-center flex-wrap gap-16 mb-24">
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {types.map((t) => (
              <button
                key={t}
                className={`filter-chip ${filter === t ? 'active' : ''}`}
                onClick={() => setFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              className="form-input"
              style={{ paddingLeft: 38, width: '100%' }}
              placeholder="Search by name, city, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner" />
            <p className="pulse">Fetching live listings from smart contracts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="result-box">
            <div className="result-icon">🔍</div>
            <h2>No listings found</h2>
            <p>
              {filter === 'My Active Listings'
                ? "You don't have any properties currently listed for sale."
                : 'Try adjusting your search criteria or category filter.'}
            </p>
            {filter === 'My Active Listings' && (
              <button className="btn btn-primary mt-16" onClick={() => setPage('my-properties')}>
                Go to My Properties & List One
              </button>
            )}
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((p) => (
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
        )}
      </div>
    </div>
  );
}
