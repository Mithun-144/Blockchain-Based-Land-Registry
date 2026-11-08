import React from 'react';
import { Building, ShieldCheck, CheckSquare, Layers } from 'lucide-react';
import AuthorityBaseLayout from '../components/AuthorityBaseLayout';

export default function MunicipalDashboard({ user, setPage }) {
  const config = {
    title: 'BBMP Urban Municipal Corporation',
    subtitle: 'Urban Cadastral Validation, BBMP e-Khata (A-Khata / B-Khata), PID & Guideline Rate Management',
    msp: 'municipal-com',
    badgeColor: '#0d9488',
    icon: Building,
    docType: 'BBMP e-Khata (A-Khata / B-Khata)',
    docPlaceholder: 'e.g. BBMP-A-99201',
    surveyPlaceholder: 'e.g. SY-104/2B',
    stat1Label: 'Verified Urban Holdings',
    stat1Sub: 'BBMP e-Khata certified on-chain',
    stat2Label: 'Pending e-Khata Queue',
    stat2Sub: 'Requires municipal cadastral sign-off',
    stat3Label: 'Urban Guideline Valuation',
    stat3Sub: 'BBMP property tax assessment base',
    stat4Label: 'Municipal Ward Scope',
    stat4Sub: 'Urban East & West Circles',
  };

  const renderExtraVerifyFields = (selectedProp, extraData, setExtraData) => {
    return (
      <>
        <div className="form-group">
          <label className="form-label">Khata Classification</label>
          <select
            className="form-input"
            value={extraData.khataType || 'A-Khata'}
            onChange={(e) => setExtraData((p) => ({ ...p, khataType: e.target.value }))}
          >
            <option value="A-Khata">A-Khata (Fully Sanctioned & Title Approved)</option>
            <option value="B-Khata">B-Khata (Provisional / Betterment Due)</option>
            <option value="E-Khata">Digital e-Khata (BBMP Sahaya Certified)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">BBMP Property Tax PID Number</label>
          <input
            className="form-input"
            placeholder="e.g. PID-104-W22-881"
            value={extraData.pid || ''}
            onChange={(e) => setExtraData((p) => ({ ...p, pid: e.target.value }))}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input
            type="checkbox"
            id="bettermentCleared"
            checked={extraData.bettermentCleared !== false}
            onChange={(e) => setExtraData((p) => ({ ...p, bettermentCleared: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: '#0d9488', cursor: 'pointer' }}
          />
          <label htmlFor="bettermentCleared" style={{ fontSize: '0.8rem', color: 'var(--text-700)', cursor: 'pointer' }}>
            Verify Betterment Charges & Urban Development Cess cleared
          </label>
        </div>
      </>
    );
  };

  return (
    <AuthorityBaseLayout
      jurisdiction="municipal"
      user={user}
      setPage={setPage}
      config={config}
      renderExtraVerifyFields={renderExtraVerifyFields}
    />
  );
}
