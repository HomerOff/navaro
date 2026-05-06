import { useEffect } from 'react';
import { Ic } from '../icons.jsx';
import { PA } from '../tokens.js';

export function Toast({ message, type = 'error', onClose, duration = 4500 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const colors = {
    error:   { bg: '#1F2937', accent: PA.pink },
    success: { bg: '#14532D', accent: PA.green },
    info:    { bg: '#1E3A5F', accent: PA.blue },
  };
  const c = colors[type] ?? colors.error;

  return (
    <div
      className="anim-slideUp"
      style={{
        position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
        background: c.bg, color: '#fff',
        padding: '12px 18px 12px 14px',
        borderRadius: 14, fontWeight: 600, fontSize: 14,
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0,0,0,.28)',
        display: 'flex', alignItems: 'center', gap: 10,
        maxWidth: 'min(340px, calc(100vw - 32px))', width: 'max-content',
        borderLeft: `3px solid ${c.accent}`,
      }}
    >
      <Ic.info size={18} color={c.accent} />
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{ all: 'unset', cursor: 'pointer', opacity: 0.6, marginLeft: 6 }}
      >
        <Ic.close size={16} color="#fff" />
      </button>
    </div>
  );
}
