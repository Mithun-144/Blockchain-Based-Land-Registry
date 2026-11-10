import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  FileCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calculator,
  History,
  Layers,
  Shield,
  FileText,
  DollarSign,
  X,
  ExternalLink,
  MapPin,
  ChevronDown,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Printer,
  FileSearch,
} from 'lucide-react';
import { BlockchainAPI, getPropertyLegalStatus } from '../api/blockchain';

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
            width: '100%', appearance: 'none', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 'var(--r)',
            padding: '6px 28px 6px 8px', fontSize: '0.78rem', color: 'var(--text-900)',
          }}
        >
          <option value="">All</option>
          {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-400)' }} />
      </div>
    </div>
  );
}

export default function SroDashboard({ user, setPage }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Location filter state
  const [locationOptions, setLocationOptions] = useState({ districts: [], taluks: [], localities: [], pincodes: [] });
  const [locFilters, setLocFilters] = useState({ district: '', locality: '', pincode: '' });
  const [showLocFilter, setShowLocFilter] = useState(false);

  // Duty Calculator modal
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcValue, setCalcValue] = useState('8500000');
  const [calcAreaType, setCalcAreaType] = useState('Urban');
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Deed Inspector modal
  const [inspectProp, setInspectProp] = useState(null);
  const [chainHistory, setChainHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // EC Modal
  const [ecModalProp, setEcModalProp] = useState(null);
  const [ecData, setEcData] = useState(null);
  const [ecLoading, setEcLoading] = useState(false);

  // Root Title Modal
  const [rootTitleProp, setRootTitleProp] = useState(null);
  const [rootTitleData, setRootTitleData] = useState(null);
  const [rootTitleLoading, setRootTitleLoading] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const records = await BlockchainAPI.queryAllRecords();
      setProperties(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Failed to load SRO records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    BlockchainAPI.getDistinctLocations()
      .then((locs) => setLocationOptions(locs || {}))
      .catch((err) => console.warn(err));
  }, []);

  const handleCalculateDuty = async (val, area = calcAreaType) => {
    setCalcLoading(true);
    try {
      const res = await BlockchainAPI.calculateStampDuty(null, val || calcValue, area);
      setCalcResult(res);
    } catch (err) {
      console.error('Calc error:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  const openInspector = async (prop) => {
    setInspectProp(prop);
    setLoadingHistory(true);
    try {
      const hist = await BlockchainAPI.getPropertyHistory(prop.id);
      setChainHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setChainHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerateEC = async (prop) => {
    setEcModalProp(prop);
    setEcLoading(true);
    setEcData(null);
    try {
      const data = await BlockchainAPI.generateEncumbranceCertificate(prop.id);
      setEcData(data);
    } catch (err) {
      console.error('EC Gen failed:', err);
    } finally {
      setEcLoading(false);
    }
  };

  const handleVerifyRootTitle = async (prop) => {
    setRootTitleProp(prop);
    setRootTitleLoading(true);
    setRootTitleData(null);
    try {
      const data = await BlockchainAPI.verifyRootTitle(prop.id);
      setRootTitleData(data);
    } catch (err) {
      console.error('Root title verify failed:', err);
    } finally {
      setRootTitleLoading(false);
    }
  };

  // Metrics
  const totalStampDutyCollected = properties.reduce(
    (sum, p) => sum + (Number(p.stampDuty) || Math.round((Number(p.rawValue) || 0) * 0.05)),
    0
  );
  const totalRegFeeCollected = properties.reduce(
    (sum, p) => sum + (Number(p.registrationFee) || Math.round((Number(p.rawValue) || 0) * 0.01)),
    0
  );
  const encumberedCount = properties.filter((p) => p.encumbrance === true).length;
  const frozenCount = properties.filter((p) => p.frozen === true).length;
  const hasLocFilter = Object.values(locFilters).some(Boolean);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.owner || '').toLowerCase().includes(q) ||
        (p.jurisdiction || '').toLowerCase().includes(q) ||
        (p.surveyNumber || '').toLowerCase().includes(q) ||
        (p.eKhataNo || '').toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q) ||
        (p.locality || '').toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === 'for_sale') matchesStatus = p.listedForSale === true;
      else if (statusFilter === 'encumbered') matchesStatus = p.encumbrance === true;
      else if (statusFilter === 'frozen') matchesStatus = p.frozen === true;
      else if (statusFilter === 'verified') matchesStatus = p.ownershipVerified !== false;

      const matchesLoc =
        (!locFilters.district || (p.district || '').toLowerCase() === locFilters.district.toLowerCase()) &&
        (!locFilters.locality || (p.locality || '').toLowerCase() === locFilters.locality.toLowerCase()) &&
        (!locFilters.pincode || String(p.pincode || '') === locFilters.pincode);

      return matchesSearch && matchesStatus && matchesLoc;
    });
  }, [properties, searchTerm, statusFilter, locFilters]);

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
              background: '#f5f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Landmark size={22} color="#4f46e5" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-900)' }}>
                Sub-Registrar Office (SRO) Portal
              </h1>
              <span className="badge badge-purple">MSP: sro-com</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-500)' }}>
              Statutory Deed Registration, Stamp Duty Assessment, Root Title Audit & Form 15/16 Encumbrance Certificates
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchProperties}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Sync Ledger</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
            onClick={() => {
              handleCalculateDuty('8500000');
              setIsCalcOpen(true);
            }}
          >
            <Calculator size={14} />
            <span>Duty Calculator</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4f46e5' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Stamp Duty Revenue</span>
            <DollarSign size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            ₹{(totalStampDutyCollected / 100000).toFixed(2)} Lakh
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Statutory 5% Stamp Duty on ledger
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Registration Fee Collected</span>
            <FileCheck size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            ₹{(totalRegFeeCollected / 100000).toFixed(2)} Lakh
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Statutory 1% SRO Registration Fee
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Mortgages / Liens</span>
            <AlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {encumberedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Reported by Bank / Judiciary
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Court Stay Injunctions</span>
            <Shield size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px' }}>
            {frozenCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
            Restrained by Judicial Order
          </div>
        </div>
      </div>

      {/* Ledger Table Section */}
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
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }}
              />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Search All Registered Deeds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowLocFilter((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 'var(--r)',
                border: '1px solid var(--border)',
                background: hasLocFilter ? '#4338ca' : 'var(--bg-card)',
                color: hasLocFilter ? '#fff' : 'var(--text-700)',
                fontSize: '0.8rem', cursor: 'pointer',
              }}
            >
              <MapPin size={13} /> Location
              {hasLocFilter && <span>•</span>}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Records ({properties.length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'for_sale' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('for_sale')}
            >
              Marketplace ({properties.filter((p) => p.listedForSale).length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'encumbered' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('encumbered')}
            >
              Encumbered ({encumberedCount})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'frozen' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('frozen')}
            >
              Injunctions ({frozenCount})
            </button>
          </div>
        </div>

        {/* Location Filter Sub-panel */}
        {showLocFilter && (
          <div style={{
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            alignItems: 'flex-end',
          }}>
            <LocSelect
              label="District"
              value={locFilters.district}
              options={locationOptions.districts}
              onChange={(v) => setLocFilters((p) => ({ ...p, district: v }))}
            />
            <LocSelect
              label="Locality"
              value={locFilters.locality}
              options={locationOptions.localities}
              onChange={(v) => setLocFilters((p) => ({ ...p, locality: v }))}
            />
            <LocSelect
              label="Pincode"
              value={locFilters.pincode}
              options={locationOptions.pincodes}
              onChange={(v) => setLocFilters((p) => ({ ...p, pincode: v }))}
            />
            {hasLocFilter && (
              <button
                onClick={() => setLocFilters({ district: '', locality: '', pincode: '' })}
                style={{
                  background: 'none', border: 'none', color: '#dc2626',
                  fontSize: '0.78rem', cursor: 'pointer', padding: '6px 0',
                  display: 'flex', alignItems: 'center', gap: 4,
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
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-400)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px' }}>Deed ID</th>
                <th style={{ padding: '12px 20px' }}>Property & Cadastral Record</th>
                <th style={{ padding: '12px 20px' }}>Registered Owner</th>
                <th style={{ padding: '12px 20px' }}>Guideline / Consideration</th>
                <th style={{ padding: '12px 20px' }}>Duties (Stamp + Reg)</th>
                <th style={{ padding: '12px 20px' }}>Clearance & Encumbrance</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const duty = p.stampDuty || Math.round((p.rawValue || 0) * 0.05);
                const regFee = p.registrationFee || Math.round((p.rawValue || 0) * 0.01);

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-900)' }}>
                      {p.id}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        Block: #{p.blockNumber || 104}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>
                        Khata: {p.eKhataNo || 'PENDING'} · Survey: {p.surveyNumber || 'PENDING'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {p.locality || p.area}, {p.district || ''} {p.pincode ? `(${p.pincode})` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem' }}>{p.owner}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        Registered: {p.regDate || '2023-01-15'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{p.value || `₹${p.rawValue}`}</div>
                      {p.guidelineValue && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                          Govt: ₹{Number(p.guidelineValue).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#4338ca' }}>
                        ₹{duty.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#059669' }}>
                        + Reg: ₹{regFee.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {(() => {
                        const legal = getPropertyLegalStatus(p);
                        if (legal.isFrozen || legal.hasBankLien || legal.isEncumbered) {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                              {legal.isFrozen && (
                                <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <XCircle size={12} /> Stay Order ({p.freezeCaseNo || 'Court'})
                                </span>
                              )}
                              {(legal.hasBankLien || (!legal.isFrozen && legal.isEncumbered)) && (
                                <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <AlertTriangle size={12} /> {legal.bankLienType || legal.encType || 'Lien Active'}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle2 size={12} /> SRO Cleared
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleGenerateEC(p)}
                          title="Generate Form 15 / Form 16 Encumbrance Certificate"
                        >
                          <FileText size={12} />
                          <span>EC</span>
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleVerifyRootTitle(p)}
                          title="Verify Root Title & Cadastral Compliance"
                        >
                          <ShieldCheck size={12} />
                          <span>Root Check</span>
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--bg-subtle)' }}
                          onClick={() => openInspector(p)}
                          title="Inspect Deed History"
                        >
                          <History size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-400)' }}>
                    No deed records match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: Stamp Duty Calculator ── */}
      {isCalcOpen && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calculator size={20} color="#4338ca" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Statutory Duty & Fee Calculator
                </h3>
              </div>
              <button onClick={() => setIsCalcOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
              Calculates SRO duties via smart contract function <code style={{ color: '#4338ca' }}>calculateStampDuty</code>, including cess, municipal surcharge & registration fees.
            </p>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Property Consideration / Market Value (₹)</label>
              <input
                className="form-input"
                type="number"
                value={calcValue}
                onChange={(e) => {
                  setCalcValue(e.target.value);
                  handleCalculateDuty(e.target.value, calcAreaType);
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Jurisdictional Zone (Surcharge Assessment)</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Urban', 'Rural'].map((area) => (
                  <button
                    key={area}
                    type="button"
                    className={`btn btn-sm ${calcAreaType === area ? 'btn-primary' : 'btn-outline'}`}
                    style={calcAreaType === area ? { background: '#4338ca' } : {}}
                    onClick={() => {
                      setCalcAreaType(area);
                      handleCalculateDuty(calcValue, area);
                    }}
                  >
                    {area} Zone ({area === 'Rural' ? '3% Surcharge' : '2% Surcharge'})
                  </button>
                ))}
              </div>
            </div>

            {calcResult && (
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-500)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Assessment Slab:</span>
                  <strong style={{ color: '#4338ca' }}>{calcResult.slabName || 'Karnataka Real Estate Standard'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-600)' }}>Base Stamp Duty:</span>
                  <span style={{ fontWeight: 600 }}>
                    {calcResult.stampDutyFormatted || `₹${(calcResult.stampDuty || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>

                {calcResult.cess !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-600)' }}>Infrastructure Cess (10% on Duty):</span>
                    <span style={{ fontWeight: 600 }}>₹{(calcResult.cess || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {calcResult.surcharge !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-600)' }}>Local Body Surcharge ({calcAreaType}):</span>
                    <span style={{ fontWeight: 600 }}>₹{(calcResult.surcharge || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-600)' }}>SRO Registration Fee (1%):</span>
                  <span style={{ fontWeight: 600, color: '#059669' }}>
                    {calcResult.registrationFeeFormatted || `₹${(calcResult.registrationFee || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700 }}>Total Statutory Dues:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-900)' }}>
                    {calcResult.totalDutiesFormatted || `₹${(calcResult.totalDuties || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            )}

            <button className="btn btn-primary w-full" onClick={() => setIsCalcOpen(false)}>
              Close Calculator
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Encumbrance Certificate (Form 15 / Form 16) ── */}
      {ecModalProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={22} color="#4338ca" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Cryptographic Encumbrance Certificate
                </h3>
              </div>
              <button onClick={() => setEcModalProp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {ecLoading ? (
              <div className="loading-box" style={{ padding: '40px 0' }}>
                <div className="spinner" />
                <p>Auditing root title & generating signed Encumbrance Certificate...</p>
              </div>
            ) : ecData ? (
              <div>
                <div style={{
                  padding: '16px 20px',
                  borderRadius: 10,
                  marginBottom: 20,
                  background: ecData.cleanTitle ? '#ecfdf5' : '#fef2f2',
                  border: `2px solid ${ecData.cleanTitle ? '#10b981' : '#ef4444'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: ecData.cleanTitle ? '#065f46' : '#991b1b' }}>
                        {ecData.certificateTitle || ecData.formType}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-600)', marginTop: 2 }}>
                        Certificate No: <code>{ecData.certificateNo}</code> · Period: {ecData.searchPeriod?.from} to {ecData.searchPeriod?.to || 'Present'}
                      </div>
                    </div>
                    <span className={`badge ${ecData.cleanTitle ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                      {ecData.cleanTitle ? 'NIL ENCUMBRANCE' : 'ENCUMBERED TITLE'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem', marginBottom: 20 }}>
                  <div><strong>Property ID:</strong> {ecData.propertyId}</div>
                  <div><strong>Owner:</strong> {ecData.currentOwner || ecData.owner}</div>
                  <div><strong>Survey Number:</strong> {ecData.surveyNumber || 'PENDING'}</div>
                  <div><strong>e-Khata Number:</strong> {ecData.eKhataNo || 'PENDING'}</div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Address:</strong> {ecData.propertyAddress || ecData.address}
                  </div>
                </div>

                {/* Audit summary */}
                <div style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.8125rem', marginBottom: 20 }}>
                  <strong>Smart Contract Audit Summary:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-600)' }}>
                    {ecData.summary}
                  </p>
                </div>

                {/* Active Liens & Court Orders */}
                {ecData.activeLiens && ecData.activeLiens.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#d97706', marginBottom: 8 }}>
                      Active Financial Charges / Mortgages ({ecData.activeLiens.length})
                    </div>
                    {ecData.activeLiens.map((l, idx) => (
                      <div key={idx} style={{ padding: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: '0.8rem', marginBottom: 6 }}>
                        <div><strong>Type:</strong> {l.type} · <strong>Signer:</strong> {l.flaggedBy || l.holder}</div>
                        <div style={{ color: 'var(--text-600)', marginTop: 2 }}>"{l.remarks}"</div>
                      </div>
                    ))}
                  </div>
                )}

                {ecData.activeCourtOrders && ecData.activeCourtOrders.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#dc2626', marginBottom: 8 }}>
                      Active Judicial Injunctions ({ecData.activeCourtOrders.length})
                    </div>
                    {ecData.activeCourtOrders.map((o, idx) => (
                      <div key={idx} style={{ padding: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.8rem', marginBottom: 6 }}>
                        <div><strong>Case Number:</strong> {o.caseNo}</div>
                        <div style={{ color: 'var(--text-600)', marginTop: 2 }}>"{o.remarks}"</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                  {ecData.disclaimer || 'This Encumbrance Certificate is cryptographically audited on Hyperledger Fabric consensus.'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-outline" onClick={() => window.print()}>
                    <Printer size={14} /> Print Certificate
                  </button>
                  <button className="btn btn-primary" onClick={() => setEcModalProp(null)}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-400)' }}>Failed to load certificate data.</p>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 3: Root Title Verification ── */}
      {rootTitleProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={22} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Root Title Sanity Check
                </h3>
              </div>
              <button onClick={() => setRootTitleProp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {rootTitleLoading ? (
              <div className="loading-box" style={{ padding: '30px 0' }}>
                <div className="spinner" />
                <p>Verifying root deed provenance...</p>
              </div>
            ) : rootTitleData ? (
              <div>
                <div style={{
                  padding: 16,
                  borderRadius: 10,
                  marginBottom: 16,
                  background: rootTitleData.cleanTitle ? '#ecfdf5' : '#fef2f2',
                  border: `1.5px solid ${rootTitleData.cleanTitle ? '#10b981' : '#ef4444'}`,
                }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: rootTitleData.cleanTitle ? '#065f46' : '#991b1b', marginBottom: 4 }}>
                    {rootTitleData.cleanTitle ? '✓ Marketable Clear Title' : '⚠ Defective / Encumbered Title'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-600)' }}>
                    Form Status: <strong>{rootTitleData.formType}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Active Mortgage Liens:</span>
                    <strong>{rootTitleData.activeLiensCount || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Active Court Restraints:</span>
                    <strong>{rootTitleData.activeCourtOrdersCount || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cadastral Survey Verified:</span>
                    <strong style={{ color: rootTitleData.cadastralVerified ? '#059669' : '#d97706' }}>
                      {rootTitleData.cadastralVerified ? 'Verified' : 'Pending'}
                    </strong>
                  </div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-600)', marginBottom: 20 }}>
                  {rootTitleData.summary}
                </div>

                <button className="btn btn-primary w-full" onClick={() => setRootTitleProp(null)}>
                  Close Inspection
                </button>
              </div>
            ) : (
              <p style={{ color: 'var(--text-400)' }}>No verification data returned.</p>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 4: Deed & Chain-of-Title Inspector ── */}
      {inspectProp && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={20} color="#4338ca" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Chain-of-Title Deed Audit: {inspectProp.id}
                </h3>
              </div>
              <button onClick={() => setInspectProp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <div style={{ padding: 14, borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{inspectProp.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-600)', marginBottom: 8 }}>{inspectProp.address}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.78rem' }}>
                  <div>Current Owner: <strong>{inspectProp.owner}</strong></div>
                  <div>Assessed Rate: <strong>{inspectProp.value || '₹' + inspectProp.rawValue}</strong></div>
                  <div>Cadastral Survey: <strong>{inspectProp.surveyNumber || 'PENDING'}</strong></div>
                  <div>e-Khata Number: <strong>{inspectProp.eKhataNo || 'PENDING'}</strong></div>
                  <div>District: <strong>{inspectProp.district || '—'}</strong></div>
                  <div>Pincode: <strong>{inspectProp.pincode || '—'}</strong></div>
                </div>
              </div>

              {/* Transfer history */}
              <h4 style={{ fontSize: '0.9rem', margin: '0 0 10px', color: 'var(--text-600)' }}>
                Immutable Transfer History (Deed Transfers)
              </h4>
              {inspectProp.transferHistory && inspectProp.transferHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {inspectProp.transferHistory.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'var(--bg-subtle)',
                        borderLeft: '4px solid #4338ca',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: '#4338ca' }}>
                          Deed Transfer: {t.from} ➔ {t.to}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-400)' }}>{t.date}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-600)', marginBottom: 4 }}>
                        Challan Reference: <code>{t.paymentRef}</code> | Consideration: ₹{(t.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                        TxID: <code>{(t.txId || '').slice(0, 20)}...</code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginBottom: 20 }}>
                  Initial allotment deed on record. No subsequent sale transfers executed yet.
                </p>
              )}

              {/* Audit history from couchdb */}
              <h4 style={{ fontSize: '0.9rem', margin: '0 0 10px', color: 'var(--text-600)' }}>
                Cryptographic Block State Transitions
              </h4>
              {loadingHistory ? (
                <p style={{ color: 'var(--text-400)' }}>Loading history from peers...</p>
              ) : chainHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chainHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        background: '#fff',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{item.event}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-400)' }}>
                          Committer: {item.by} · Tx: <code>{item.txId}</code>
                        </div>
                      </div>
                      <span className="badge badge-subtle">{item.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-400)', fontSize: '0.85rem' }}>No history records found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
