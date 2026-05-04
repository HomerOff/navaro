import { PA } from '../tokens.js';
import { buildAuthUrl } from '../services/authUrl.js';

export function AuthPromptModal({ onClose }) {
  return (
    <div
      className="anim-fadeIn"
      style={{
        position: 'fixed', inset: 0, zIndex: 4000,
        background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', fontFamily: PA.font,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="anim-slideUp"
        style={{
          width: '100%', maxWidth: 360,
          background: '#fff', borderRadius: 24, padding: '32px 24px 24px',
          boxShadow: '0 24px 60px rgba(0,0,0,.18)',
        }}
      >
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>🌸</div>

        <div style={{ fontWeight: 800, fontSize: 20, textAlign: 'center', marginBottom: 10, color: PA.ink }}>
          Connect to create trips
        </div>

        <div style={{ color: PA.muted, fontSize: 14.5, textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>
          Creating AI-powered itineraries requires a free{' '}
          <strong style={{ color: PA.ink }}>Pollinations</strong> account.
          <br />
          Browsing and importing trips is always free.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href={buildAuthUrl()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px', borderRadius: 9999, fontWeight: 800, fontSize: 15,
              background: PA.black, color: '#fff', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,.20)',
            }}
          >
            <span style={{ fontSize: 20 }}>🌸</span> Connect with Pollinations
          </a>
          <button
            onClick={onClose}
            style={{
              all: 'unset', cursor: 'pointer', textAlign: 'center',
              padding: '13px', borderRadius: 9999, fontWeight: 600, fontSize: 14,
              color: PA.muted, border: `1.5px solid ${PA.hairline2}`,
            }}
          >
            Continue as Guest
          </button>
        </div>

        <div style={{ textAlign: 'center', color: PA.mutedSoft, fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>
          The key expires in 30 days and can be revoked anytime.
        </div>
      </div>
    </div>
  );
}
