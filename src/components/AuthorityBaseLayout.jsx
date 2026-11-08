import React, { useState, useEffect, useMemo } from 'react';
import {
  Building,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  FileCheck,
  FileX,
  TrendingUp,
  MapPin,
  X,
  Sliders,
  DollarSign,
  ChevronDown,
  Calculator,
} from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';
import {
  getAllDistricts,
  getTaluksForDistrict,
  getLocalitiesForTaluk,
} from '../data/locations';

function LocSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-500)', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            appearance: 'none',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r)',
            padding: '6px 28px 6px 8px',
            fontSize: '0.78rem',
            color: 'var(--text-900)',
          }}
        >
          <option value="">All</option>
          {(options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-400)',
          }}
        />
      </div>
    </div>
  );
}

export default function AuthorityBaseLayout({
  jurisdiction = 'municipal',
  user,
  setPage,
  config = {},
  renderExtraVerifyFields,
  renderCustomBadge,
}) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'verified'

  // Location filter state
  const [locationOptions, setLocationOptions] = useState({ districts: [], taluks: [], localities: [], pincodes: [] });
  const [locFilters, setLocFilters] = useState({ district: '', taluk: '', locality: '', pincode: '' });
  const [showLocFilter, setShowLocFilter] = useState(false);

  // Modals
  const [selectedProp, setSelectedProp] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [docNumber, setDocNumber] = useState('');
  const [surveyNo, setSurveyNo] = useState('');
  const [extraVerifyData, setExtraVerifyData] = useState({});

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);
  const [newGuidelineVal, setNewGuidelineVal] = useState('');
  const [valRef, setValRef] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [txMessage, setTxMessage] = useState(null);

  const meta = {
    title: config.title || 'Cadastral Land Governance Authority',
    subtitle: config.subtitle || 'Statutory Cadastral Validation & Guideline Valuation Node',
    msp: config.msp || user?.org || `${jurisdiction}-com`,
    badgeColor: config.badgeColor || '#0d9488',
    Icon: config.icon || Building,
    docType: config.docType || 'Cadastral Document',
    docPlaceholder: config.docPlaceholder || 'e.g. DOC-99201',
    surveyPlaceholder: config.surveyPlaceholder || 'e.g. SY-104/2B',
    stat1Label: config.stat1Label || 'Verified Parcels',
    stat1Sub: config.stat1Sub || 'Certified on-chain',
    stat2Label: config.stat2Label || 'Pending Queue',
    stat2Sub: config.stat2Sub || 'Requires survey sign-off',
    stat3Label: config.stat3Label || 'Base Valuation',
    stat3Sub: config.stat3Sub || 'Guideline rate assessment base',
    stat4Label: config.stat4Label || 'Jurisdiction Scope',
    stat4Sub: config.stat4Sub || 'Strict MSP barrier active',
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const records = await BlockchainAPI.queryByJurisdiction(jurisdiction);
      setProperties(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error(`Failed to load ${jurisdiction} properties:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    BlockchainAPI.getDistinctLocations()
      .then((locs) => setLocationOptions(locs || {}))
      .catch((err) => console.warn(err));
  }, [jurisdiction]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!selectedProp) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      const finalDocNo = docNumber || selectedProp.eKhataNo || 'CERTIFIED';
      const finalSurveyNo = surveyNo || selectedProp.surveyNumber || 'SY-VERIFIED';

      await BlockchainAPI.verifyAuthorityDetails(selectedProp.id, finalDocNo, finalSurveyNo);

      setTxMessage({
        type: 'success',
        text: `Authority verified! ${selectedProp.id} is now endorsed under ${meta.msp}. Document: ${finalDocNo}.`,
      });
      setIsVerifyModalOpen(false);
      setDocNumber('');
      setSurveyNo('');
      setExtraVerifyData({});
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Verification failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!selectedProp || !revokeReason) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      await BlockchainAPI.revokeOwnershipVerification(selectedProp.id, revokeReason);
      setTxMessage({
        type: 'success',
        text: `Ownership verification revoked for ${selectedProp.id}. Property delisted pending dispute hearing.`,
      });
      setIsRevokeModalOpen(false);
      setRevokeReason('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Revocation failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateValuation = async (e) => {
    e.preventDefault();
    if (!selectedProp || !newGuidelineVal) return;
    setSubmitting(true);
    setTxMessage(null);
    try {
      const ref = valRef || `${jurisdiction.toUpperCase()}-${new Date().getFullYear()}-VAL`;
      await BlockchainAPI.updateValuation(selectedProp.id, Number(newGuidelineVal), ref);
      setTxMessage({
        type: 'success',
        text: `Govt. guideline valuation updated to ₹${Number(newGuidelineVal).toLocaleString('en-IN')} for ${selectedProp.id}.`,
      });
      setIsValuationModalOpen(false);
      setNewGuidelineVal('');
      setValRef('');
      await fetchProperties();
    } catch (err) {
      setTxMessage({ type: 'error', text: `Valuation update failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingList = properties.filter((p) => p.ownershipVerified === false);
  const verifiedList = properties.filter((p) => p.ownershipVerified !== false);
  const totalBaseVal = properties.reduce(
    (sum, p) => sum + (Number(p.guidelineValue || p.rawValue) || 0),
    0
  );

  const hasLocFilter = Object.values(locFilters).some(Boolean);

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

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.owner || '').toLowerCase().includes(q) ||
        (p.eKhataNo || '').toLowerCase().includes(q) ||
        (p.surveyNumber || '').toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q) ||
        (p.locality || '').toLowerCase().includes(q);

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && p.ownershipVerified === false) ||
        (activeTab === 'verified' && p.ownershipVerified !== false);

      const matchesLoc =
        (!locFilters.district || (p.district || '').toLowerCase() === locFilters.district.toLowerCase()) &&
        (!locFilters.taluk || (p.taluk || '').toLowerCase() === locFilters.taluk.toLowerCase()) &&
        (!locFilters.locality || (p.locality || '').toLowerCase() === locFilters.locality.toLowerCase()) &&
        (!locFilters.pincode || String(p.pincode || '') === locFilters.pincode);

      return matchesSearch && matchesTab && matchesLoc;
    });
  }, [properties, searchTerm, activeTab, locFilters]);

  // Preview recalculated stamp duty for the valuation modal
  const enteredNum = Number(newGuidelineVal) || 0;
  const previewStampDuty = Math.round(enteredNum * 0.05);
  const previewRegFee = Math.round(enteredNum * 0.01);
  const previewTotal = previewStampDuty + previewRegFee;

  return (
    <div className="page-container" style={{ padding: '24px 32px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: `${meta.badgeColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <meta.Icon size={22} color={meta.badgeColor} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-900)' }}>
                {meta.title}
              </h1>
              <span
                className="badge"
                style={{
                  background: `${meta.badgeColor}18`,
                  color: meta.badgeColor,
                  fontWeight: 600,
                  border: `1px solid ${meta.badgeColor}40`,
                }}
              >
                MSP: {meta.msp}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-500)' }}>
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchProperties}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {txMessage && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: 10,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: txMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${txMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: txMessage.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {txMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{txMessage.text}</span>
          </div>
          <button
            onClick={() => setTxMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: meta.badgeColor }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{meta.stat1Label}</span>
            <FileCheck size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {verifiedList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{meta.stat1Sub}</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{meta.stat2Label}</span>
            <AlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {pendingList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{meta.stat2Sub}</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{meta.stat3Label}</span>
            <DollarSign size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            ₹{(totalBaseVal / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{meta.stat3Sub}</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7c3aed' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{meta.stat4Label}</span>
            <MapPin size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', textTransform: 'capitalize' }}>
            {jurisdiction}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{meta.stat4Sub}</div>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-400)',
                }}
              />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder={`Search ${jurisdiction} records, survey or document...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowLocFilter((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 'var(--r)',
                border: '1px solid var(--border)',
                background: hasLocFilter ? meta.badgeColor : 'var(--bg-card)',
                color: hasLocFilter ? '#fff' : 'var(--text-700)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <MapPin size={13} /> Location
              {hasLocFilter && <span>•</span>}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : ''}`}
              style={activeTab === 'all' ? { background: meta.badgeColor } : {}}
              onClick={() => setActiveTab('all')}
            >
              All ({properties.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : ''}`}
              style={activeTab === 'pending' ? { background: meta.badgeColor } : {}}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingList.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'verified' ? 'btn-primary' : ''}`}
              style={activeTab === 'verified' ? { background: meta.badgeColor } : {}}
              onClick={() => setActiveTab('verified')}
            >
              Verified ({verifiedList.length})
            </button>
          </div>
        </div>

        {/* Location Filter Sub-panel */}
        {showLocFilter && (
          <div
            style={{
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border)',
              padding: '12px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
              alignItems: 'flex-end',
            }}
          >
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
              onChange={(v) => setLocFilters((p) => ({ ...p, pincode: v }))}
            />
            {hasLocFilter && (
              <button
                onClick={() => setLocFilters({ district: '', taluk: '', locality: '', pincode: '' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: '6px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <X size={12} /> Clear Filter
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-400)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <th style={{ padding: '12px 20px' }}>Property ID</th>
                <th style={{ padding: '12px 20px' }}>Cadastral Identifiers & Location</th>
                <th style={{ padding: '12px 20px' }}>Owner</th>
                <th style={{ padding: '12px 20px' }}>Guideline Value</th>
                <th style={{ padding: '12px 20px' }}>Verification Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isVerified = p.ownershipVerified !== false;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-900)' }}>
                      {p.id}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>{p.type}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-600)', marginTop: 2 }}>
                        Survey: <code>{p.surveyNumber || 'PENDING'}</code> | Record: <code>{p.eKhataNo || 'PENDING'}</code>
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-400)',
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MapPin size={11} /> {p.locality || p.area}, {p.taluk || ''}, {p.district || ''}{' '}
                        {p.pincode ? `(${p.pincode})` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem' }}>{p.owner}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>{p.address}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>
                        ₹{(p.guidelineValue || p.rawValue || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        Market: {p.value || '₹' + p.rawValue}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {isVerified ? (
                        <div>
                          <span
                            className="badge badge-green"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <CheckCircle2 size={12} /> Verified by {p.verifiedBy || meta.msp}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: 3 }}>
                            Date: {p.verificationDate || 'Active'}
                          </div>
                          {p.verificationTxId && (
                            <div
                              style={{
                                fontSize: '0.68rem',
                                color: 'var(--text-400)',
                                fontFamily: 'monospace',
                              }}
                            >
                              Tx: {p.verificationTxId.slice(0, 14)}...
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span
                            className="badge badge-amber"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <AlertTriangle size={12} /> Pending Sign-off
                          </span>
                          {p.ownershipRevokedReason && (
                            <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: 3 }}>
                              Revoked: {p.ownershipRevokedReason}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        {!isVerified ? (
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ background: meta.badgeColor }}
                            onClick={() => {
                              setSelectedProp(p);
                              setDocNumber(p.eKhataNo !== 'PENDING' ? p.eKhataNo : '');
                              setSurveyNo(p.surveyNumber !== 'PENDING' ? p.surveyNumber : '');
                              setIsVerifyModalOpen(true);
                            }}
                          >
                            Verify Details
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                setSelectedProp(p);
                                setIsRevokeModalOpen(true);
                              }}
                              title="Revoke verification on title challenge"
                            >
                              Revoke
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--bg-subtle)' }}
                              onClick={() => {
                                setSelectedProp(p);
                                setNewGuidelineVal(String(p.guidelineValue || p.rawValue));
                                setIsValuationModalOpen(true);
                              }}
                              title="Revise Govt Guideline Rate"
                            >
                              <TrendingUp size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-400)' }}>
                    No properties match your search and filter criteria in the {jurisdiction} cadastre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: Verify Authority Details ── */}
      {isVerifyModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileCheck size={20} color={meta.badgeColor} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Endorse {meta.docType}
                </h3>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Invokes <code style={{ color: meta.badgeColor }}>verifyAuthorityDetails</code> under MSP identity{' '}
              <strong>{meta.msp}</strong>. This satisfies the statutory cadastral gate on the Hyperledger Fabric ledger.
            </p>

            <form onSubmit={handleVerify} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property ID</label>
                <input className="form-input" disabled value={`${selectedProp.id} — ${selectedProp.title}`} />
              </div>

              <div className="form-group">
                <label className="form-label">{meta.docType} Number</label>
                <input
                  className="form-input"
                  required
                  placeholder={meta.docPlaceholder}
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cadastral Survey Number</label>
                <input
                  className="form-input"
                  required
                  placeholder={meta.surveyPlaceholder}
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                />
              </div>

              {renderExtraVerifyFields &&
                renderExtraVerifyFields(selectedProp, extraVerifyData, setExtraVerifyData)}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsVerifyModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: meta.badgeColor }}
                  disabled={submitting}
                >
                  {submitting ? 'Signing on Blockchain...' : 'Sign & Endorse Cadastral Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Revoke Verification ── */}
      {isRevokeModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileX size={20} color="#b91c1c" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Revoke Cadastral Verification
                </h3>
              </div>
              <button
                onClick={() => setIsRevokeModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Invokes <code style={{ color: '#b91c1c' }}>revokeOwnershipVerification</code>. This delists the asset and blocks any future sale until the dispute is resolved.
            </p>

            <form onSubmit={handleRevoke} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property ID</label>
                <input className="form-input" disabled value={`${selectedProp.id} (${selectedProp.owner})`} />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Revocation / Challenge</label>
                <textarea
                  className="form-input"
                  required
                  rows={3}
                  placeholder="e.g. Boundary dispute reported by neighboring khata holder. Survey pending."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsRevokeModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#b91c1c' }}
                  disabled={submitting}
                >
                  {submitting ? 'Revoking...' : 'Revoke Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Guideline Valuation Update ── */}
      {isValuationModalOpen && selectedProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Revise Govt. Guideline Rate
                </h3>
              </div>
              <button
                onClick={() => setIsValuationModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Invokes <code style={{ color: '#2563eb' }}>updateValuation</code>. Updates the statutory baseline valuation used for stamp duty & tax assessments.
            </p>

            <form onSubmit={handleUpdateValuation} className="flex flex-col gap-14">
              <div className="form-group">
                <label className="form-label">Property ID</label>
                <input
                  className="form-input"
                  disabled
                  value={`${selectedProp.id} — Current Rate: ₹${(
                    selectedProp.guidelineValue ||
                    selectedProp.rawValue ||
                    0
                  ).toLocaleString('en-IN')}`}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Revised Guideline Value (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  required
                  placeholder="e.g. 9500000"
                  value={newGuidelineVal}
                  onChange={(e) => setNewGuidelineVal(e.target.value)}
                />
              </div>

              {enteredNum > 0 && (
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--r)',
                    padding: '12px 14px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--text-700)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Calculator size={13} /> Recalculated Statutory Dues (Smart Contract)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-600)' }}>
                    <span>Stamp Duty (5%):</span>
                    <strong style={{ color: '#2563eb' }}>₹{previewStampDuty.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-600)' }}>
                    <span>Registration Fee (1%):</span>
                    <strong style={{ color: '#059669' }}>₹{previewRegFee.toLocaleString('en-IN')}</strong>
                  </div>
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                    }}
                  >
                    <span>Total Duties:</span>
                    <span>₹{previewTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Gazette / Revision Order Reference</label>
                <input
                  className="form-input"
                  placeholder={`e.g. GAZETTE-${jurisdiction.toUpperCase()}-2026-VAL-882`}
                  value={valRef}
                  onChange={(e) => setValRef(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsValuationModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#2563eb' }}
                  disabled={submitting}
                >
                  {submitting ? 'Updating Valuation...' : 'Commit Revised Valuation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
