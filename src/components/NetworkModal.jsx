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
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: config.mockMode ? '#fef3c7' : '#d1fae5',
                border: `1px solid ${config.mockMode ? '#fcd34d' : '#6ee7b7'}`,
              }}
            >
              <label className="flex items-center gap-12" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.mockMode}
                  onChange={(e) => setConfig({ ...config, mockMode: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <div>
                  <div className="font-700 text-sm" style={{ color: config.mockMode ? '#92400e' : '#065f46' }}>
                    {config.mockMode ? '⚡ Simulated Blockchain Mode (Active)' : '🌐 Live Fabric Node Connection'}
                  </div>
                  <div className="text-xs mt-4" style={{ color: config.mockMode ? '#b45309' : '#047857' }}>
                    {config.mockMode
                      ? 'State is persisted locally in browser with complete 7-step cryptographic simulation.'
                      : 'All invoke and query requests are dispatched via REST to your NBF-Lite Fabric peer.'}
                  </div>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">NBF-Lite REST Endpoint URL</label>
              <input
                className="form-input"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="http://localhost:3000 or http://<VM-IP>:3000"
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

