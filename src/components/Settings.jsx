import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';

export function Settings({ onClose, onLogout }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
        fontFamily: PA.font,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '0 0 max(24px,env(safe-area-inset-bottom))',
        }}
        className="anim-slideUp"
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: '#E5E7EB' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 20px' }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>Settings</div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', padding: 6 }}>
            <Ic.close size={20} color={PA.muted} />
          </button>
        </div>

        <div style={{ padding: '0 20px 8px' }}>
          {/* Pollinations info */}
          <div style={{
            background: '#F8F9FA', borderRadius: 16, padding: '14px 16px',
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🌸</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: PA.ink }}>Connected to Pollinations</div>
              <div style={{ fontSize: 12.5, color: PA.muted, marginTop: 2 }}>AI key stored in this browser only. Expires in 30 days.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => {
                if (window.confirm('Disconnect Pollinations? You will need to log in again.')) {
                  onLogout?.();
                  onClose();
                }
              }}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 16px', borderRadius: 14,
                border: `1px solid ${PA.hairline2}`, width: '100%', boxSizing: 'border-box',
                color: PA.ink, fontWeight: 600, fontSize: 14,
              }}
            >
              <span style={{ fontSize: 16 }}>🔓</span>
              Disconnect Pollinations
            </button>

            <button
              onClick={() => {
                if (window.confirm('Delete all saved trips? This cannot be undone.')) {
                  localStorage.removeItem('navaro-trips-v1');
                  window.location.reload();
                }
              }}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 16px', borderRadius: 14,
                border: `1px solid ${PA.hairline2}`, width: '100%', boxSizing: 'border-box',
                color: PA.red, fontWeight: 600, fontSize: 14,
              }}
            >
              <Ic.trash size={16} color={PA.red} />
              Clear all saved trips
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
