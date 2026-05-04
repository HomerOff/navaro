import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { PathlyLogo } from './ui/PathlyLogo.jsx';
import { PathlyBg } from './ui/PathlyBg.jsx';
import { buildAuthUrl } from '../services/authUrl.js';

export function AuthScreen({ onGuest }) {
  return (
    <div style={{ minHeight: '100dvh', fontFamily: PA.font, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <PathlyBg tone="mint" />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <PathlyLogo size={48} />
          <span style={{
            fontFamily: '"Caveat", cursive', fontWeight: 700,
            fontSize: 40, color: PA.ink, letterSpacing: '-.01em',
          }}>Navaro</span>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 380,
          background: '#fff', borderRadius: 28,
          padding: '32px 28px',
          boxShadow: '0 8px 40px rgba(15,23,42,.10), 0 0 0 1px rgba(15,23,42,.05)',
        }}>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-.025em', marginBottom: 10 }}>
            Connect to start
          </div>
          <div style={{ color: PA.muted, fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
            Navaro uses <strong style={{ color: PA.ink }}>Pollinations AI</strong> to build your trip itineraries. Connect your free account to get started — you pay for your own usage, no subscription needed.
          </div>

          {/* Steps */}
          {[
            { icon: <Ic.key   size={18} color={PA.ink} />, text: 'Free Pollinations account required' },
            { icon: <Ic.map   size={18} color={PA.ink} />, text: 'AI builds personalized itineraries' },
            { icon: <Ic.lock  size={18} color={PA.ink} />, text: 'Your key is stored only in this browser' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: '#F4F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: PA.ink }}>{s.text}</div>
            </div>
          ))}

          <a
            href={buildAuthUrl()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', boxSizing: 'border-box',
              marginTop: 24, padding: '16px',
              borderRadius: 9999, fontWeight: 800, fontSize: 16,
              background: PA.black, color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,.22)',
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 20 }}>🌸</span>
            Connect with Pollinations
          </a>

          {onGuest && (
            <button
              onClick={onGuest}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', boxSizing: 'border-box',
                marginTop: 12, padding: '14px',
                borderRadius: 9999, fontWeight: 700, fontSize: 15,
                color: PA.muted, border: `1.5px solid ${PA.hairline2}`,
                background: '#fff',
              }}
            >
              Continue as Guest
            </button>
          )}

          <div style={{ textAlign: 'center', color: PA.muted, fontSize: 12.5, marginTop: 16, lineHeight: 1.5 }}>
            You'll be redirected to Pollinations to approve access.<br />
            The key expires in 30 days and can be revoked anytime.
          </div>

          {onGuest && (
            <div style={{ textAlign: 'center', color: PA.mutedSoft, fontSize: 11.5, marginTop: 8, lineHeight: 1.5 }}>
              Guest mode: browse and import trips. Creating new trips requires a Pollinations account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
