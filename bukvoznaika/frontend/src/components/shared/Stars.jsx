import React from 'react';

export function Stars({ count = 0, max = 3, size = 28, animate = false }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{
          fontSize: size,
          filter: i < count ? 'none' : 'grayscale(1) opacity(0.3)',
          animation: animate && i < count ? `starPop 0.3s ${i * 0.15}s both` : 'none',
          display: 'inline-block',
        }}>⭐</span>
      ))}
    </div>
  );
}

export function StarCounter({ total, size = 'md' }) {
  const fontSizes = { sm: '0.9rem', md: '1.1rem', lg: '1.4rem' };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#FEF3C7', borderRadius: 999, padding: '6px 14px',
      fontFamily: 'var(--font-main)', fontWeight: 800, color: '#92400E',
      fontSize: fontSizes[size],
    }}>
      ⭐ {total}
    </div>
  );
}

export function ProgressBar({ value, max, color = '#FFD93D', height = 14 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: '#E5E7EB', borderRadius: 999, height, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: color,
        borderRadius: 999, transition: 'width 0.6s ease',
        minWidth: pct > 0 ? 8 : 0,
      }} />
    </div>
  );
}
