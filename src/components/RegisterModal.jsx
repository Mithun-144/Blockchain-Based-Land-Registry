import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CheckCircle2, Building2, MapPin, ChevronDown, Sparkles, ShieldCheck } from 'lucide-react';
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
  const [type, setType] = useState('Residential');
  const [rawValue, setRawValue] = useState(8500000);
  const [guidelineValue, setGuidelineValue] = useState(8500000);
  const [image, setImage] = useState('villa');

  const [success, setSuccess] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        type,
        jurisdiction,
        surveyNumber: surveyNumber.trim() || `SY-${Math.floor(10 + Math.random() * 900)}/${Math.floor(1 + Math.random() * 9)}A`,
        eKhataNo: eKhataNo.trim() || (jurisdiction === 'municipal' ? `BBMP-A-${Math.floor(10000 + Math.random() * 90000)}` : `RTC-BHOOMI-${Math.floor(1000 + Math.random() * 9000)}`),
        rawValue: Number(rawValue),
        guidelineValue: Number(guidelineValue || rawValue),
        image,
        owner: user?.email || 'citizen@cdac.in',
      };

      const created = await BlockchainAPI.registerProperty(payload);
      setSuccess(created);
      onRegistered(created);
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal animate-in" style={{ maxWidth: 640, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-12">
            <Building2 size={22} color="#ffffff" />
            <h2 style={{ fontSize: '1.15rem', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.5)', margin: 0 }}>
              Register Land / Property Asset
            </h2>
          </div>
          <button className="modal-close" onClick={handleClose} title="Close window">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {success ? (
            <div className="result-box check-anim" style={{ padding: '24px 0' }}>
              <CheckCircle2 size={56} color="#48d68a" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ color: 'var(--green)', marginBottom: 8 }}>Registered on National Blockchain Framework!</h3>
              <p style={{ fontSize: '0.88rem', marginBottom: 16 }}>
                Property <strong>{success.id}</strong> has been initialized into the World State on channel1 with block #{success.blockNumber || 104}.
              </p>
              <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 8, fontSize: '0.8rem', textAlign: 'left', marginBottom: 20 }}>
                <div><strong>Location:</strong> {success.address}</div>
                <div><strong>Survey No:</strong> {success.surveyNumber} · <strong>Khata:</strong> {success.eKhataNo}</div>
                <div><strong>Jurisdiction:</strong> <span style={{ textTransform: 'capitalize' }}>{success.jurisdiction}</span></div>
              </div>
              <button className="btn btn-primary w-full" onClick={handleClose}>
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-16">
              {/* Header Note */}
              <div style={{
                background: 'var(--accent-soft, #eff6ff)',
                border: '1px solid var(--accent-border, #bfdbfe)',
                padding: '10px 14px',
                borderRadius: 'var(--r)',
                fontSize: '0.78rem',
                color: 'var(--accent, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <ShieldCheck size={16} />
                <span>Smart contract compliant: validates cadastral boundaries against Karnataka Revenue & BBMP guidelines.</span>
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
              <div className="grid-2 gap-12">
                <div className="form-group">
                  <label className="form-label">Estimated Market Value (₹) *</label>
                  <input
                    className="form-input"
                    type="number"
                    required
                    min="100000"
                    step="50000"
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
                    step="50000"
                    value={guidelineValue}
                    onChange={(e) => setGuidelineValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-12 mt-16 justify-between">
                <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16 }} />
                      Committing to Fabric...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      Register to Blockchain
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
