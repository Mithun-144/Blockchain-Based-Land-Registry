import React from 'react';
import { Trees, CheckSquare, Layers, ShieldCheck } from 'lucide-react';
import AuthorityBaseLayout from '../components/AuthorityBaseLayout';

export default function PanchayatDashboard({ user, setPage }) {
  const config = {
    title: 'Gram Panchayat Land Administration',
    subtitle: 'Rural Non-Agricultural Property Validation, e-Swathu Form 9 & Form 11, Village Demarcation',
    msp: 'panchayat-com',
    badgeColor: '#16a34a',
    icon: Trees,
    docType: 'Form 9 / Form 11 (e-Swathu)',
    docPlaceholder: 'e.g. PANCH-F9-4412',
    surveyPlaceholder: 'e.g. SY-56/4A',
    stat1Label: 'e-Swathu Certified Holdings',
    stat1Sub: 'Form 9 / 11 validated on-chain',
    stat2Label: 'Pending Grama Tana Queue',
    stat2Sub: 'Requires PDO field verification',
    stat3Label: 'Rural Assessment Valuation',
    stat3Sub: 'Panchayat guideline & tax assessment',
    stat4Label: 'Gram Panchayat Scope',
    stat4Sub: 'Electronic City & Anekal Rural Circle',
  };

  const renderExtraVerifyFields = (selectedProp, extraData, setExtraData) => {
    return (
      <>
        <div className="form-group">
          <label className="form-label">Form 11 (Tax Demand Register) Number</label>
          <input
            className="form-input"
            placeholder="e.g. F11-TAX-DEMAND-8821"
            value={extraData.form11No || ''}
            onChange={(e) => setExtraData((p) => ({ ...p, form11No: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Panchayat Boundary Demarcation</label>
          <select
            className="form-input"
            value={extraData.settlementType || 'GramaTana'}
            onChange={(e) => setExtraData((p) => ({ ...p, settlementType: e.target.value }))}
          >
            <option value="GramaTana">Inside Approved Grama Tana (Old Village Abadi)</option>
            <option value="ApprovedLayout">Panchayat Approved Layout (11B Certified)</option>
            <option value="RuralCommercial">Rural Commercial / Warehouse Zone</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input
            type="checkbox"
            id="gramaTanaConfirmed"
            checked={extraData.gramaTanaConfirmed !== false}
            onChange={(e) => setExtraData((p) => ({ ...p, gramaTanaConfirmed: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: '#16a34a', cursor: 'pointer' }}
          />
          <label htmlFor="gramaTanaConfirmed" style={{ fontSize: '0.8rem', color: 'var(--text-700)', cursor: 'pointer' }}>
            Confirmed by Panchayat Development Officer (PDO) resolution
          </label>
        </div>
      </>
    );
  };

  return (
    <AuthorityBaseLayout
      jurisdiction="panchayat"
      user={user}
      setPage={setPage}
      config={config}
      renderExtraVerifyFields={renderExtraVerifyFields}
    />
  );
}
