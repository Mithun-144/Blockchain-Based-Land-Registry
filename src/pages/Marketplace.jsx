import React, { useState, useEffect } from 'react';
import { Search, Filter, Store } from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';
import PropertyCard from '../components/PropertyCard';

export default function Marketplace({ setPage, setTransferProp }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const types = ['All', 'Residential', 'Apartment', 'Commercial', 'Plot'];

  useEffect(() => {
    BlockchainAPI.getListings()
      .then((l) => setListings(l || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter((p) => {
    const matchesType = filter === 'All' || p.type === filter;
    const matchesSearch =
      search.trim() === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="page animate-in">
      <div className="container">
        <div className="page-header">
          <h1>🏪 Blockchain Property Marketplace</h1>
          <p>Browse verified real estate titles available for immediate on-chain transfer.</p>
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
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              className="form-input"
              style={{ paddingLeft: 38, width: '100%' }}
              placeholder="Search by name or city..."
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
            <p>Try adjusting your search criteria or category filter.</p>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((p) => (
              <PropertyCard
                key={p.id}
                prop={p}
                onBuy={() => {
                  setTransferProp(p);
                  setPage('transfer');
                }}
                onSell={null}
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
