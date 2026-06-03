import React from 'react';

// Персонаж Лёни — загружается из public/leni.svg
export default function Lenya({ message, size = 'md' }) {
  const sizes = { sm: 70, md: 100, lg: 150 };
  const h = sizes[size];
  const w = Math.round(h * (100 / 180)); // сохраняем пропорции SVG 100×180

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className="animate-float" style={{ width: w, height: h }}>
        <img
          src="/leni.svg"
          alt="Лёни"
          width={w}
          height={h}
          style={{ display: 'block', width: '100%', height: '100%' }}
          draggable={false}
        />
      </div>
      {message && (
        <div className="animate-pop" style={{
          background: 'white',
          border: '3px solid #FFD93D',
          borderRadius: 20,
          padding: '10px 18px',
          maxWidth: 220,
          textAlign: 'center',
          fontFamily: 'var(--font-main)',
          fontWeight: 700,
          fontSize: '1rem',
          color: '#1E1B4B',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '12px solid #FFD93D',
          }} />
          <div style={{
            position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '10px solid white',
          }} />
          {message}
        </div>
      )}
    </div>
  );
}
