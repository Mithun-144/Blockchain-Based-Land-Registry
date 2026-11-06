import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, ChevronDown, X, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { BlockchainAPI, normalizeUserEmail } from '../api/blockchain';
import PropertyCard from '../components/PropertyCard';
import {
  getAllDistricts,
  getTaluksForDistrict,
  getLocalitiesForTaluk,
} from '../data/locations';

// ── Listing Warning Badge ──────────────────────────────────────────────────
function ListingWarningBadge({ warning }) {
  if (!warning || warning === 'NONE') return null;
  const cfg = {
    COURT_FROZEN: { label: 'Court Frozen',  color: '#dc2626', bg: '#fef2f2', Icon: ShieldAlert },
    ENCUMBERED:   { label: 'Encumbered',    color: '#d97706', bg: '#fffbeb', Icon: AlertTriangle },
    UNVERIFIED:   { label: 'Unverified',    color: '#7c3aed', bg: '#f5f3ff', Icon: ShieldAlert },
  }[warning] || { label: warning, color: '#6b7280', bg: '#f9fafb', Icon: null };

  const { label, color, bg, Icon } = cfg;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px',
      borderRadius: 99, background: bg, color,
      border: `1px solid ${color}33`,
    }}>
      {Icon && <Icon size={11} />} {label}
    </span>
  );
}

// ── Select helper ─────────────────────────────────────────────────────────
function LocSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', appearance: 'none', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 'var(--r)',
            padding: '7px 32px 7px 10px', fontSize: '0.8125rem', color: 'var(--text-900)',
          }}
        >
          <option value="">Any</option>
          {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-400)' }} />
      </div>
    </div>
  );
}

export default function Marketplace({ user, setPage, setTransferProp }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // ── Location filter state ──────────────────────────────────────────────
  const [locationOptions, setLocationOptions] = useState({ states: [], districts: [], taluks: [], cities: [], localities: [], pincodes: [] });
  const [locFilters, setLocFilters] = useState({ district: '', taluk: '', locality: '', pincode: '' });
  const [showLocPanel, setShowLocPanel] = useState(false);

  const types = ['All', 'Available to Buy', 'My Active Listings', 'Residential', 'Apartment', 'Commercial', 'Plot', 'Agricultural'];

  const loadListings = () => {
    setLoading(true);
    BlockchainAPI.getListings()
      .then((l) => setListings(l || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadListings();
    // Populate location dropdowns from live ledger / local store
    BlockchainAPI.getDistinctLocations()
      .then((locs) => setLocationOptions(locs || {}))
      .catch((err) => console.warn('[Marketplace] getDistinctLocations notice:', err));
  }, [user]);

  const setLocFilter = (key, val) => {
    setLocFilters((prev) => {
      const updated = { ...prev, [key]: val };
      if (key === 'district') {
        updated.taluk = '';
        updated.locality = '';
      } else if (key === 'taluk') {
        updated.locality = '';
      }
      return updated;
    });
  };
  const clearLocFilters = () => setLocFilters({ district: '', taluk: '', locality: '', pincode: '' });
  const hasLocFilter = Object.values(locFilters).some(Boolean);

  // Cascading options derived from Karnataka data + ledger records
  const availableDistricts = useMemo(() => {
    return Array.from(new Set([...getAllDistricts(), ...(locationOptions.districts || [])])).sort();
  }, [locationOptions.districts]);

  const availableTaluks = useMemo(() => {
    if (locFilters.district) return getTaluksForDistrict(locFilters.district);
    return locationOptions.taluks || [];
  }, [locFilters.district, locationOptions.taluks]);

  const availableLocalities = useMemo(() => {
    if (locFilters.district && locFilters.taluk) return getLocalitiesForTaluk(locFilters.district, locFilters.taluk);
    return locationOptions.localities || [];
  }, [locFilters.district, locFilters.taluk, locationOptions.localities]);

  const userEmail = normalizeUserEmail(user?.email);

  const filtered = useMemo(() => {
    return listings.filter((p) => {
      const isOwner = normalizeUserEmail(p.owner) === userEmail;

      // Type / ownership filter
      let matchesFilter = true;
      if (filter === 'Available to Buy') matchesFilter = !isOwner;
      else if (filter === 'My Active Listings') matchesFilter = isOwner;
      else if (filter !== 'All') matchesFilter = p.type === filter;

      // Text search — also searches district, locality, pincode
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q) ||
        (p.owner || '').toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q) ||
        (p.locality || '').toLowerCase().includes(q) ||
        String(p.pincode || '').includes(search.trim());

      // Location filters (dropdown selections)
      const matchesLoc =
        (!locFilters.district || (p.district || '').toLowerCase() === locFilters.district.toLowerCase()) &&
        (!locFilters.taluk    || (p.taluk    || '').toLowerCase() === locFilters.taluk.toLowerCase()) &&
        (!locFilters.locality || (p.locality || '').toLowerCase() === locFilters.locality.toLowerCase()) &&
        (!locFilters.pincode  || String(p.pincode || '') === locFilters.pincode);

      return matchesFilter && matchesSearch && matchesLoc;
    });
  }, [listings, filter, search, locFilters, userEmail]);

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

        {/* Filter + Search Row */}
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

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Location filter toggle */}
            <button
              onClick={() => setShowLocPanel((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 'var(--r)',
                border: '1px solid var(--border)',
                background: hasLocFilter ? 'var(--accent)' : 'var(--bg-card)',
                color: hasLocFilter ? '#fff' : 'var(--text-700)',
                fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
              }}
            >
              <MapPin size={14} />
              Location
              {hasLocFilter && (
                <span style={{
                  background: '#fff3', borderRadius: 99, padding: '0 6px',
                  fontSize: '0.7rem', fontWeight: 700,
                }}>
                  {Object.values(locFilters).filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Text search */}
            <div style={{ position: 'relative', width: '240px' }}>
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
                placeholder="Search title, district, locality..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Location Filter Panel */}
        {showLocPanel && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r)',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px 16px',
          }}>
            <LocSelect
              label="District"
              value={locFilters.district}
              options={availableDistricts}
              onChange={(v) => setLocFilter('district', v)}
            />
            <LocSelect
              label="Taluk"
              value={locFilters.taluk}
              options={availableTaluks}
              onChange={(v) => setLocFilter('taluk', v)}
            />
            <LocSelect
              label="Locality"
              value={locFilters.locality}
              options={availableLocalities}
              onChange={(v) => setLocFilter('locality', v)}
            />
            <LocSelect
              label="Pincode"
              value={locFilters.pincode}
              options={locationOptions.pincodes}
              onChange={(v) => setLocFilter('pincode', v)}
            />
            {hasLocFilter && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={clearLocFilters}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: '0.8rem', color: '#dc2626', cursor: 'pointer',
                    background: 'none', border: 'none', padding: '7px 0',
                  }}
                >
                  <X size={13} /> Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active location filter chips */}
        {hasLocFilter && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.entries(locFilters).filter(([, v]) => v).map(([key, val]) => (
              <span
                key={key}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: '0.78rem', padding: '3px 10px',
                  background: 'var(--accent-soft, #eff6ff)',
                  color: 'var(--accent, #2563eb)',
                  borderRadius: 99,
                  border: '1px solid var(--accent-border, #bfdbfe)',
                }}
              >
                <MapPin size={11} />
                {key.charAt(0).toUpperCase() + key.slice(1)}: <strong>{val}</strong>
                <button
                  onClick={() => setLocFilter(key, '')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: 'inherit' }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

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
                : hasLocFilter
                  ? 'No properties found in the selected location. Try broadening your filter.'
                  : 'Try adjusting your search or filter criteria.'}
            </p>
            {hasLocFilter && (
              <button className="btn btn-secondary mt-16" onClick={clearLocFilters}>
                Clear Location Filters
              </button>
            )}
            {filter === 'My Active Listings' && (
              <button className="btn btn-primary mt-16" onClick={() => setPage('my-properties')}>
                Go to My Properties
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Result count line */}
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-500)', marginBottom: 16 }}>
              Showing <strong>{filtered.length}</strong> of <strong>{listings.length}</strong> listing{listings.length !== 1 ? 's' : ''}
              {hasLocFilter && ' (location-filtered)'}
            </p>

            <div className="grid-3">
              {filtered.map((p) => (
                <div key={p.id} style={{ position: 'relative' }}>
                  {/* Listing warning overlay badge */}
                  {p.listingWarning && p.listingWarning !== 'NONE' && (
                    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                      <ListingWarningBadge warning={p.listingWarning} />
                    </div>
                  )}
                  <PropertyCard
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
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
