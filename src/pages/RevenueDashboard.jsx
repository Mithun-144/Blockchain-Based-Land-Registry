import React from 'react';
import { FileText, CheckSquare, Layers, ShieldCheck } from 'lucide-react';
import AuthorityBaseLayout from '../components/AuthorityBaseLayout';

export default function RevenueDashboard({ user, setPage }) {
  const config = {
    title: 'Taluk Revenue & Bhoomi Department',
    subtitle: 'Bhoomi Cadastral RoR (Record of Rights), RTC / Pahani, Mutation & Section 95 Land Conversion',
    msp: 'revenue-com',
    badgeColor: '#d97706',
    icon: FileText,
    docType: 'RTC / Pahani (Bhoomi RoR)',
    docPlaceholder: 'e.g. RTC-BHOOMI-7741',
    surveyPlaceholder: 'e.g. SY-23/A1',
    stat1Label: 'Verified RoR & Farmland',
    stat1Sub: 'Bhoomi Pahani validated on-chain',
    stat2Label: 'Pending Mutation Queue',
    stat2Sub: 'Awaiting Tahsildar sign-off (135D notice)',
    stat3Label: 'Taluk Base Valuation',
    stat3Sub: 'Agricultural & converted guideline rate',
    stat4Label: 'Taluk Revenue Scope',
    stat4Sub: 'Ramanagara, Kasaba & Mysore Hobli',
  };

  const renderExtraVerifyFields = (selectedProp, extraData, setExtraData) => {
    return (
      <>
        <div className="form-group">
          <label className="form-label">Bhoomi Mutation Register (MR) Number</label>
          <input
            className="form-input"
            placeholder="e.g. MR-2024-T991"
            value={extraData.mutationNo || ''}
            onChange={(e) => setExtraData((p) => ({ ...p, mutationNo: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Land Classification & Section 95 Conversion</label>
          <select
            className="form-input"
            value={extraData.conversionStatus || 'Converted'}
            onChange={(e) => setExtraData((p) => ({ ...p, conversionStatus: e.target.value }))}
          >
            <option value="Converted">Section 95 DC Converted (Non-Agricultural Approved)</option>
            <option value="Agricultural">Agricultural Land (Pahani Dry/Wet Cultivation)</option>
            <option value="PTCL_Clear">Inam / Grant Land (PTCL Non-Alienation Clearance)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input
            type="checkbox"
            id="tenancyClearance"
            checked={extraData.tenancyClearance !== false}
            onChange={(e) => setExtraData((p) => ({ ...p, tenancyClearance: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: '#d97706', cursor: 'pointer' }}
          />
          <label htmlFor="tenancyClearance" style={{ fontSize: '0.8rem', color: 'var(--text-700)', cursor: 'pointer' }}>
            Verify no Land Reforms Tribunal stay or pending Form 7 dispute
          </label>
        </div>
      </>
    );
  };

  return (
    <AuthorityBaseLayout
      jurisdiction="revenue"
      user={user}
      setPage={setPage}
      config={config}
      renderExtraVerifyFields={renderExtraVerifyFields}
    />
  );
}
