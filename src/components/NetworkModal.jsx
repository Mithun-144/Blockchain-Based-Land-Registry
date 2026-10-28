import React, { useState } from 'react';
import { X, Server, Check, HelpCircle } from 'lucide-react';
import { getNetworkConfig, saveNetworkConfig } from '../api/blockchain';

export default function NetworkModal({ isOpen, onClose, onConfigUpdated }) {
  const [config, setConfig] = useState(getNetworkConfig());

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveNetworkConfig(config);
    onConfigUpdated(config);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-12">
            <Server size={22} color="#ffffff" />
            <h2 style={{ fontSize: '1.15rem', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>NBF-Lite Blockchain Configuration</h2>
          </div>
          <button className="modal-close" onClick={onClose} title="Close window">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSave} className="flex flex-col gap-16">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Blockchain Operating Mode
              </label>
              <select
                className="form-input"
                value={config.mockMode ? 'simulated' : 'live'}
                onChange={(e) => setConfig({ ...config, mockMode: e.target.value === 'simulated' })}
                style={{
                  background: config.mockMode ? '#fef3c7' : '#ecfdf5',
                  borderColor: config.mockMode ? '#fcd34d' : '#6ee7b7',
                  color: config.mockMode ? '#92400e' : '#065f46',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="simulated">⚡ Simulated Blockchain Mode (Local Browser Storage)</option>
                <option value="live">🌐 Live Fabric Node Connection (NBF-Lite REST Peer)</option>
              </select>
              <div
                className="text-xs mt-6"
                style={{ color: config.mockMode ? '#b45309' : '#047857' }}
              >
                {config.mockMode
                  ? 'State is persisted locally in browser with complete 7-step cryptographic simulation.'
                  : 'All invoke and query requests are dispatched via REST to your NBF-Lite Fabric peer.'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">NBF-Lite REST Endpoint URL</label>
              <input
                className="form-input"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="http://192.168.231.128:4000"
              />
            </div>

            <div className="grid-2 gap-12">
              <div className="form-group">
                <label className="form-label">Channel Name</label>
                <input
                  className="form-input"
                  value={config.channel}
                  onChange={(e) => setConfig({ ...config, channel: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Chaincode Name</label>
                <input
                  className="form-input"
                  value={config.chaincode}
                  onChange={(e) => setConfig({ ...config, chaincode: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Organization MSP ID</label>
              <input
                className="form-input"
                value={config.mspId}
                onChange={(e) => setConfig({ ...config, mspId: e.target.value })}
              />
            </div>

            <div className="flex gap-12 mt-12 justify-between">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Check size={16} /> Save Configuration
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

