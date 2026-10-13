import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
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
              <h1>Property Marketplace</h1>
              <p style={{ marginTop: 4 }}>
                Verified real estate titles available for on-chain transfer via NBF-Lite.
              </p>
            </div>

            {user && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.8125rem',
                color: 'var(--text-500)',
                flexShrink: 0,
              }}>
                <span>
                  Viewing as <strong style={{ color: 'var(--text-900)' }}>{user.name}</strong>
                </span>
                <span className="badge badge-blue">{availableToBuyCount} Available</span>
                {myListingCount > 0 && (
                  <span className="badge badge-amber">{myListingCount} Your Listings</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filter + Search */}
        <div className="flex justify-between items-center flex-wrap gap-12 mb-24">
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

          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-400)',
                pointerEvents: 'none',
              }}
            />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner" />
            <p className="pulse" style={{ fontSize: '0.875rem' }}>Fetching listings from smart contracts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="result-box">
            <div className="result-icon">🔍</div>
            <h2 style={{ marginBottom: 8 }}>No listings found</h2>
            <p>
              {filter === 'My Active Listings'
                ? "You don't have any properties currently listed for sale."
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {filter === 'My Active Listings' && (
              <button className="btn btn-primary mt-16" onClick={() => setPage('my-properties')}>
                Go to My Properties
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
