import React from 'react';
import MunicipalDashboard from './MunicipalDashboard';
import RevenueDashboard from './RevenueDashboard';
import PanchayatDashboard from './PanchayatDashboard';

/**
 * Backward-compatibility wrapper for legacy 'authority-dashboard' route.
 * Automatically delegates to the appropriate specialized cadastral portal.
 */
export default function AuthorityDashboard({ user, setPage }) {
  const jurisdiction = (user?.jurisdiction || '').toLowerCase();

  if (jurisdiction === 'revenue') {
    return <RevenueDashboard user={user} setPage={setPage} />;
  }

  if (jurisdiction === 'panchayat') {
    return <PanchayatDashboard user={user} setPage={setPage} />;
  }

  return <MunicipalDashboard user={user} setPage={setPage} />;
}
