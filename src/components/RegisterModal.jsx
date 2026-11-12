import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CheckCircle2, Building2, MapPin, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';
import {
  getAllDistricts,
  getTaluksForDistrict,
  getLocalitiesForTaluk,
  getTalukMetadata,
} from '../data/locations';

export default function RegisterModal({ isOpen, onClose, user, onRegistered }) {
  const [loading, setLoading] = useState(false);
  const allDistricts = getAllDistricts();

  // Registered Citizen Owner State
  const [citizens, setCitizens] = useState([]);
  const [loadingCitizens, setLoadingCitizens] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [customOwnerEmail, setCustomOwnerEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Location Hierarchy State
  const [state] = useState('Karnataka');
  const [district, setDistrict] = useState('Bangalore Urban');
  const [taluk, setTaluk] = useState('Bangalore North');
  const [locality, setLocality] = useState('MG Road');
  const [customLocality, setCustomLocality] = useState('');
  const [pincode, setPincode] = useState('560001');
  const [doorStreet, setDoorStreet] = useState('');
  const [jurisdiction, setJurisdiction] = useState('municipal');
  const [surveyNumber, setSurveyNumber] = useState('');
  const [eKhataNo, setEKhataNo] = useState('');

  // General Details State
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('2400 sq.ft');
  const [dimensions, setDimensions] = useState('40 ft × 60 ft');
  const [type, setType] = useState('Residential');
  const [rawValue, setRawValue] = useState(8500000);
  const [guidelineValue, setGuidelineValue] = useState(8500000);
  const [image, setImage] = useState('villa');

  const [success, setSuccess] = useState(null);

  const resetFormFields = () => {
    setSelectedOwner('');
    setCustomOwnerEmail('');
    setErrorMsg('');
    setDistrict('Bangalore Urban');
    setTaluk('Bangalore North');
    setLocality('MG Road');
    setCustomLocality('');
    setPincode('560001');
    setDoorStreet('');
    setJurisdiction('municipal');
    setSurveyNumber('');
    setEKhataNo('');
    setTitle('');
    setArea('2400 sq.ft');
    setDimensions('40 ft × 60 ft');
    setType('Residential');
    setRawValue(8500000);
    setGuidelineValue(8500000);
    setImage('villa');
    setSuccess(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setErrorMsg('');
    setLoadingCitizens(true);
    BlockchainAPI.getRegisteredCitizens()
      .then((list) => {
        if (!cancelled) setCitizens(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.warn('Could not load registered citizens:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingCitizens(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Available taluks & localities based on parent selection
  const availableTaluks = getTaluksForDistrict(district);
  const availableLocalities = getLocalitiesForTaluk(district, taluk);

  // When District changes, auto-select first taluk
  const handleDistrictChange = (newDist) => {
    setDistrict(newDist);
    const taluks = getTaluksForDistrict(newDist);
    const firstTaluk = taluks[0] || '';
    setTaluk(firstTaluk);

    const locs = getLocalitiesForTaluk(newDist, firstTaluk);
    setLocality(locs[0] || 'Central');
    setCustomLocality('');

    const meta = getTalukMetadata(newDist, firstTaluk);
    if (meta) {
      setPincode(meta.pincode || '');
      setJurisdiction(meta.jurisdiction || 'municipal');
    }
  };

  // When Taluk changes, auto-select first locality and meta
  const handleTalukChange = (newTaluk) => {
    setTaluk(newTaluk);
    const locs = getLocalitiesForTaluk(district, newTaluk);
    setLocality(locs[0] || 'Central');
    setCustomLocality('');

    const meta = getTalukMetadata(district, newTaluk);
    if (meta) {
      setPincode(meta.pincode || '');
      setJurisdiction(meta.jurisdiction || 'municipal');
    }
  };

  if (!isOpen) return null;

  const effectiveLocality = locality === 'OTHER' ? (customLocality.trim() || 'Central') : locality;
  const fullAddress = `${doorStreet ? doorStreet + ', ' : ''}${effectiveLocality}, ${taluk}, ${district}, Karnataka - ${pincode}`;
  const effectiveOwner = (selectedOwner === '__OTHER__' ? customOwnerEmail : selectedOwner).trim().toLowerCase();
  const numericValue = Number(rawValue) || 0;
  const estimatedStampDuty = Math.round(numericValue * 0.05);
  const estimatedRegFee = Math.round(numericValue * 0.01);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!effectiveOwner || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveOwner)) {
      setErrorMsg('Please select a registered citizen or enter a valid citizen email address for ownership allotment.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim() || `${effectiveLocality} Property`,
        state: 'Karnataka',
        district,
        taluk,
        city: district.replace(' Urban', '').replace(' Rural', ''),
        locality: effectiveLocality,
        pincode,
        doorStreet,
        address: fullAddress,
        area: area.trim(),
        dimensions: dimensions.trim(),
        type,
        jurisdiction,
        surveyNumber: surveyNumber.trim() || `SY-${Math.floor(10 + Math.random() * 900)}/${Math.floor(1 + Math.random() * 9)}A`,
        eKhataNo: eKhataNo.trim() || (jurisdiction === 'municipal' ? `BBMP-A-${Math.floor(10000 + Math.random() * 90000)}` : `RTC-BHOOMI-${Math.floor(1000 + Math.random() * 9000)}`),
        rawValue: Number(rawValue),
        guidelineValue: Number(guidelineValue || rawValue),
        image,
        owner: effectiveOwner,
        registeredBy: user?.email || 'registrar@sro.com',
      };

      const created = await BlockchainAPI.registerProperty(payload);
      setSuccess(created);
      if (onRegistered) {
        onRegistered(created);
      }
    } catch (err) {
      setErrorMsg(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetFormFields();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal animate-in" style={{ maxWidth: 660, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div
          className="modal-header"
          style={{
            background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)',
            borderBottom: 'none',
          }}
        >
          <div className="flex items-center gap-12">
            <Building2 size={22} color="#ffffff" />
            <h2 style={{ fontSize: '1.15rem', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.35)', margin: 0 }}>
              SRO Deed & Property Registration
            </h2>
          </div>
          <button
            className="modal-close"
            onClick={handleClose}
            title="Close window"
            style={{
              background: 'rgba(255, 255, 255, 0.16)',
              borderColor: 'rgba(255, 255, 255, 0.28)',
              color: '#ffffff',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {success ? (
            <div className="result-box check-anim" style={{ padding: '24px 0', border: 'none' }}>
              <CheckCircle2 size={56} color="#059669" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ color: 'var(--green)', marginBottom: 8 }}>Registered on National Blockchain Framework!</h3>
              <p style={{ fontSize: '0.88rem', marginBottom: 16 }}>
                Deed <strong>{success.id}</strong> has been initialized into the World State on channel1 and allotted to <strong>{success.owner}</strong>.
              </p>
              <div style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 8, fontSize: '0.82rem', textAlign: 'left', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><strong>Registered Owner:</strong> {success.owner}</div>
                <div><strong>Location:</strong> {success.address}</div>
                <div><strong>Survey No:</strong> {success.surveyNumber} · <strong>Khata:</strong> {success.eKhataNo}</div>
                <div><strong>Jurisdiction:</strong> <span style={{ textTransform: 'capitalize' }}>{success.jurisdiction}</span></div>
                <div>
                  <strong>Statutory Assessment:</strong> Stamp Duty ₹{(success.stampDuty || estimatedStampDuty).toLocaleString('en-IN')} · Reg Fee ₹{(success.registrationFee || estimatedRegFee).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="flex gap-12">
                <button type="button" className="btn btn-outline w-full" onClick={resetFormFields}>
                  <PlusCircle size={15} /> Register Another
                </button>
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  onClick={handleClose}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-16">
              {/* Header Note */}
              <div style={{
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                padding: '10px 14px',
                borderRadius: 'var(--r)',
                fontSize: '0.78rem',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                <span>Sub-Registrar Office (SRO) Statutory Registration: initializes a new property deed on Fabric and allots ownership to the verified citizen.</span>
              </div>

              {errorMsg && (
                <div className="error-msg flex items-center gap-8">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ── SECTION: Citizen Owner Allotment ── */}
              <div style={{
                border: '1px solid #ddd6fe',
                borderRadius: 'var(--r)',
                padding: '14px 16px',
                background: '#faf5ff',
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: '#312e81' }}>
                  <UserCheck size={15} color="#4f46e5" />
                  <span>Citizen Owner Allotment</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Property Owner (Registered Citizen) *</label>
                  <select
                    className="form-input"
                    required
                    value={selectedOwner}
                    onChange={(e) => {
                      setSelectedOwner(e.target.value);
                      setErrorMsg('');
                    }}
                    disabled={loadingCitizens}
                  >
                    <option value="">
                      {loadingCitizens ? 'Loading registered citizens...' : '-- Select Registered Citizen Owner --'}
                    </option>
                    {citizens.map((c) => (
                      <option key={c.email} value={c.email}>
                        {c.name} ({c.email}){c.aadhar ? ` · Aadhar XXXX-${c.aadhar.slice(-4)}` : ''}
                      </option>
                    ))}
                    <option value="__OTHER__">+ Enter Custom Citizen Email</option>
                  </select>
                </div>

                {selectedOwner === '__OTHER__' && (
                  <div className="form-group mt-12">
                    <label className="form-label">Citizen Owner Email Address *</label>
                    <input
                      className="form-input"
                      type="email"
                      required
                      placeholder="e.g. citizen@example.com"
                      value={customOwnerEmail}
                      onChange={(e) => {
                        setCustomOwnerEmail(e.target.value);
                        setErrorMsg('');
                      }}
                    />
                  </div>
                )}

                <div style={{ fontSize: '0.73rem', color: 'var(--text-500)', marginTop: 8 }}>
                  Title ownership on the ledger will be assigned to the selected citizen account (visible in their Citizen Portal under My Properties).
                </div>
              </div>

              {/* Title & Type */}
              <div className="form-group">
                <label className="form-label">Property Title / Name *</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. Sunrise Villa or Green Meadows Plot"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid-2 gap-12">
                <div className="form-group">
                  <label className="form-label">Property Type</label>
                  <select
                    className="form-input"
                    value={type}
                    onChange={(e) => {
                      const t = e.target.value;
                      setType(t);
                      const imgMap = { Residential: 'villa', Apartment: 'apartment', Plot: 'plot', Commercial: 'commercial', Agricultural: 'plot' };
                      setImage(imgMap[t] || 'villa');
                    }}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Plot">Plot</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Agricultural">Agricultural Farmland</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Area (sq.ft / acres) *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. 2400 sq.ft or 2 Acres"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dimensions (L × W)</label>
                <input
                  className="form-input"
                  placeholder="e.g. 40 ft × 60 ft"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                />
              </div>

              {/* ── SECTION: Cascading Karnataka Location ── */}
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '14px 16px',
                background: 'var(--bg-subtle)',
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-900)' }}>
                  <MapPin size={15} color="var(--accent)" />
                  <span>Cadastral Location Hierarchy (Karnataka)</span>
                </div>

                <div className="grid-2 gap-12 mb-12">
                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <select
                      className="form-input"
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                    >
                      {allDistricts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Taluk *</label>
                    <select
                      className="form-input"
                      value={taluk}
                      onChange={(e) => handleTalukChange(e.target.value)}
                    >
                      {availableTaluks.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2 gap-12 mb-12">
                  <div className="form-group">
                    <label className="form-label">Locality / Hobli / Layout *</label>
                    <select
                      className="form-input"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                    >
                      {availableLocalities.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                      <option value="OTHER">+ Other / Custom Locality</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input
                      className="form-input"
                      required
                      placeholder="e.g. 560001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                    />
                  </div>
                </div>

                {locality === 'OTHER' && (
                  <div className="form-group mb-12">
                    <label className="form-label">Custom Locality / Village Name *</label>
                    <input
                      className="form-input"
                      required
                      placeholder="Enter custom layout, village, or town name"
                      value={customLocality}
                      onChange={(e) => setCustomLocality(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Door / Plot / Street Address (Optional)</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Flat 302, 12th Cross, 4th Main"
                    value={doorStreet}
                    onChange={(e) => setDoorStreet(e.target.value)}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-500)', marginTop: 4 }}>
                    Preview: <em>{fullAddress}</em>
                  </div>
                </div>
              </div>

              {/* ── SECTION: Cadastral Identifiers & Jurisdiction ── */}
              <div className="grid-2 gap-12">
                <div className="form-group">
                  <label className="form-label">Survey / Plot Number</label>
                  <input
                    className="form-input"
                    placeholder="e.g. SY-104/2B (or leave blank to auto-generate)"
                    value={surveyNumber}
                    onChange={(e) => setSurveyNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">e-Khata / RTC / Form 9 No.</label>
                  <input
                    className="form-input"
                    placeholder={jurisdiction === 'municipal' ? 'e.g. BBMP-A-99201' : 'e.g. RTC-BHOOMI-7741'}
                    value={eKhataNo}
                    onChange={(e) => setEKhataNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Governing Cadastral Jurisdiction</label>
                <select
                  className="form-input"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                >
                  <option value="municipal">Urban Municipal (BBMP / City Corporation)</option>
                  <option value="revenue">Revenue Authority (Tahsildar / Bhoomi RTC)</option>
                  <option value="panchayat">Gram Panchayat (Form 9 & Form 11 / e-Swathu)</option>
                </select>
              </div>

              {/* ── SECTION: Financial Valuation ── */}
              <div>
                <div className="grid-2 gap-12">
                  <div className="form-group">
                    <label className="form-label">Consideration / Market Value (₹) *</label>
                    <input
                      className="form-input"
                      type="number"
                      required
                      min="100000"
                      step="any"
                      value={rawValue}
                      onChange={(e) => setRawValue(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Govt. Guideline Value (₹)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="100000"
                      step="any"
                      value={guidelineValue}
                      onChange={(e) => setGuidelineValue(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--bg-subtle)',
                  fontSize: '0.76rem',
                  color: 'var(--text-600)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  <span>Stamp Duty (5%): <strong style={{ color: '#4338ca' }}>₹{estimatedStampDuty.toLocaleString('en-IN')}</strong></span>
                  <span>Reg Fee (1%): <strong style={{ color: '#059669' }}>₹{estimatedRegFee.toLocaleString('en-IN')}</strong></span>
                  <span>Total SRO Dues: <strong>₹{(estimatedStampDuty + estimatedRegFee).toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              <div className="flex gap-12 mt-16 justify-between">
                <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16 }} />
                      Committing Deed to Fabric...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      Register Property Deed
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
