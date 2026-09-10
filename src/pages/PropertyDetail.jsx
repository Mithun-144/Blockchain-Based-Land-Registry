import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ShieldAlert, History, FileText, Share2, ShoppingCart, Tag, MapPin } from 'lucide-react';
import { BlockchainAPI } from '../api/blockchain';

export default function PropertyDetail({ prop, user, setPage, setTransferProp }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const isOwner = prop?.owner === user?.email;

  useEffect(() => {
    if (prop?.id) {
      BlockchainAPI.getPropertyHistory(prop.id)
        .then((data) => setHistory(data || []))
        .catch((err) => console.error(err))
        .finally(() => setLoadingHistory(false));
    }
  }, [prop?.id]);

  if (!prop) {
    return (
      <div className="page container animate-in" style={{ paddingTop: 60, textAlign: 'center' }}>
        <h2>Property not selected</h2>
        <button className="btn btn-primary mt-16" onClick={() => setPage('dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="page animate-in">
      {/* Banner */}
      <div
        style={{
          height: '180px',
          background: 'linear-gradient(180deg, #1e40af 0%, #1d4ed8 48%, #1e3a8a 52%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderBottom: '3px solid #1d4ed8',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 80%)' }} />
      </div>

      <div className="container" style={{ marginTop: -60, position: 'relative', zIndex: 2 }}>
        <button className="btn btn-ghost btn-sm mb-16" onClick={() => setPage('marketplace')}>
          <ArrowLeft size={14} /> Back to Marketplace
        </button>

        <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
          <div>
            <div className="flex items-center gap-12 mb-8">
              <span className="badge badge-blue">{prop.type}</span>
              <span className="badge badge-green">
                <CheckCircle2 size={12} /> Fabric Verified Title
              </span>
              <span className="badge badge-purple">Block #{prop.blockNumber || 142}</span>
            </div>
            <h1>{prop.title}</h1>
            <p className="flex items-center gap-6 mt-4">
              <MapPin size={16} color="#94a3c4" />
              <span>{prop.address}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted">Asking Price</div>
            <div className="text-green font-700" style={{ fontSize: '2rem' }}>
              {prop.value}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid-2 gap-24 mb-32">
          <div className="card">
            <h3 className="mb-16 flex items-center gap-8">
              <FileText size={18} color="#4f9cf9" /> Title Details
            </h3>
            <div className="deed-row">
              <span className="deed-key">Blockchain Property ID</span>
              <span className="deed-val font-600" style={{ fontFamily: 'monospace' }}>
                {prop.id}
              </span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Total Built-Up Area</span>
              <span className="deed-val">{prop.area}</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Category</span>
              <span className="deed-val">{prop.type}</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Current Owner ID</span>
              <span className="deed-val">{prop.owner}</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Registration Date</span>
              <span className="deed-val">{prop.regDate || '2023-01-15'}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-16 flex items-center gap-8">
              <ShieldAlert size={18} color="#48d68a" /> Legal & Encumbrance Status
            </h3>
            <div className="deed-row">
              <span className="deed-key">Mortgage / Bank Liens</span>
              <span className="badge badge-green">Clear (No Liens)</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Legal Restrictions</span>
              <span className="badge badge-green">Unrestricted</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Property Tax Clearance</span>
              <span className="badge badge-green">Paid Up-To-Date</span>
            </div>
            <div className="deed-row">
              <span className="deed-key">Smart Contract State</span>
              <span className="badge badge-blue">Ready For Transfer</span>
            </div>

            <div className="divider" />

            {isOwner ? (
              <button
                className="btn btn-primary w-full"
                onClick={() => {
                  setTransferProp(prop);
                  setPage('transfer');
                }}
              >
                <Tag size={16} /> Manage Listing & Transfer
              </button>
            ) : (
              <button
                className="btn btn-green w-full"
                onClick={() => {
                  setTransferProp(prop);
                  setPage('transfer');
                }}
              >
                <ShoppingCart size={16} /> Initiate Purchase (7-Step Flow)
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & Specifications
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Blockchain Transaction History
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="card animate-in">
            <h3 className="mb-16">About this Property Record</h3>
            <p className="mb-16">
              This property title is registered on the National Blockchain Framework (NBF-Lite), powered by
              Hyperledger Fabric. All title deeds, encumbrance certificates, cadastral survey data, and ownership
              transfers are permanently committed to distributed ledger peers with CDAC MSP endorsement.
            </p>
            <p>
              When a transfer occurs, the automated smart contract runs title validation, encumbrance verification,
              stamp duty computation, dual X.509 cryptographic signing, digital deed issuance, and permanent ledger
              state update.
            </p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card animate-in">
            <h3 className="mb-24 flex items-center gap-8">
              <History size={18} color="#4f9cf9" /> On-Chain Provenance Log
            </h3>
            {loadingHistory ? (
              <div className="loading-box" style={{ padding: '30px 0' }}>
                <div className="spinner" />
                <p>Retrieving transaction history from blockchain ledger...</p>
              </div>
            ) : (
              <div className="timeline">
                {history.map((h, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot">{h.icon || '⛓️'}</div>
                    <div className="timeline-content">
                      <div className="timeline-event">{h.event}</div>
                      <div className="timeline-meta">
                        <span>Date: {h.date}</span> &nbsp;•&nbsp;
                        <span>Signer: {h.by}</span> &nbsp;•&nbsp;
                        <span style={{ fontFamily: 'monospace' }}>Tx: {h.txId}</span> &nbsp;•&nbsp;
                        <span>Block: {h.block}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
