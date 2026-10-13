import React from 'react';

/**
 * PropChain Official Logomark
 * Professional isometric land parcel & cryptographic ledger emblem.
 * Clean, modern, realistic brand identity.
 */
export function PropChainMark({ size = 32, className = '' }) {
  // Unique gradient IDs to prevent collisions if multiple instances are rendered
  const id = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PropChain logo"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="60%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`top-${id}`} x1="11" y1="9.5" x2="29" y2="19.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id={`left-${id}`} x1="10.5" y1="15.8" x2="19.5" y2="30.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={`right-${id}`} x1="20.5" y1="15.8" x2="29.5" y2="30.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Rounded squircle container with subtle inner border */}
      <rect width="40" height="40" rx="9" fill={`url(#bg-${id})`} />
      <rect x="0.5" y="0.5" width="39" height="39" rx="8.5" stroke="rgba(255,255,255,0.12)" fill="none" />

      {/* Isometric Land Parcel Face (Top) */}
      <path
        d="M20 9.5L29 14.5L20 19.5L11 14.5Z"
        fill={`url(#top-${id})`}
      />

      {/* Left Block Face (Ledger Record) */}
      <path
        d="M10.5 15.6L19.5 20.6V30.5L10.5 25.5Z"
        fill={`url(#left-${id})`}
      />

      {/* Right Block Face (Consensus State) */}
      <path
        d="M20.5 20.6L29.5 15.6V25.5L20.5 30.5Z"
        fill={`url(#right-${id})`}
      />

      {/* Central Node & Precision Grid Intersections */}
      <path
        d="M15.5 12L20 14.5L24.5 12"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.85"
      />
      <path
        d="M20 14.5V18.2"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
      <circle cx="20" cy="14.5" r="1.6" fill="#ffffff" />
    </svg>
  );
}

/**
 * PropChain Wordmark
 * Pair the emblem with high-authority typography
 */
export function PropChainWordmark({ markSize = 36, className = '', showSubtitle = true }) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        userSelect: 'none',
      }}
    >
      <PropChainMark size={markSize} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontSize: Math.round(markSize * 0.52),
              fontWeight: 750,
              color: 'var(--text-900, #0f172a)',
              letterSpacing: '-0.025em',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            PropChain
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              color: '#2563eb',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '1px 6px',
              borderRadius: '999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Registry
          </span>
        </div>
        {showSubtitle && (
          <span
            style={{
              fontSize: Math.round(markSize * 0.3),
              fontWeight: 500,
              color: 'var(--text-400, #64748b)',
              letterSpacing: '0.02em',
              fontFamily: "'Inter', -apple-system, sans-serif",
              marginTop: 2,
            }}
          >
            National Land Registry Platform
          </span>
        )}
      </div>
    </div>
  );
}

export default PropChainMark;
