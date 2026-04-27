/**
 * Small reusable UI atoms — Card, CircBtn, PillTab, DayPill,
 * CategoryPill, BronzeBadge, Stars, Spinner, Skeleton.
 */
import { PA } from '../../tokens.js';
import { Ic } from '../../icons.jsx';

/* ── Card ──────────────────────────────── */
export function Card({ children, style, padding = 16, radius = PA.rCard, onClick }) {
  const base = {
    background: PA.card,
    borderRadius: radius,
    padding,
    boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
    ...style,
  };
  if (onClick) {
    return (
      <button onClick={onClick} style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}>
        <div style={base}>{children}</div>
      </button>
    );
  }
  return <div style={base}>{children}</div>;
}

/* ── CircBtn ───────────────────────────── */
export function CircBtn({ children, size = 42, style, shadow = true, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: shadow ? '0 2px 8px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.05)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#111', flexShrink: 0, border: 'none', cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ── PillTab ───────────────────────────── */
export function PillTab({ active, children, color = PA.black, size = 'md', icon, onClick }) {
  const py = size === 'sm' ? 7 : 10;
  const px = size === 'sm' ? 14 : 18;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: `${py}px ${px}px`,
        borderRadius: 9999,
        background: active ? color : PA.chip,
        color: active ? '#fff' : PA.chipText,
        fontWeight: 600, fontSize: 14,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        border: 'none', cursor: 'pointer',
        transition: 'background .15s, color .15s',
        flexShrink: 0,
      }}
    >
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </button>
  );
}

/* ── DayPill ───────────────────────────── */
export function DayPill({ day, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '5px 12px', borderRadius: 9999,
      background: color, color: '#fff',
      fontWeight: 700, fontSize: 13,
    }}>
      Day {day}
    </div>
  );
}

/* ── CategoryPill ──────────────────────── */
const CAT_COLORS = {
  pink: { bg: PA.pinkSoft,  fg: '#E11D48', dot: PA.pink },
  blue: { bg: PA.blueSoft,  fg: PA.blueDeep, dot: PA.blue },
};

export function CategoryPill({ label, color = 'pink' }) {
  const c = CAT_COLORS[color] ?? CAT_COLORS.pink;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px 4px 8px', borderRadius: 9999,
      background: c.bg, color: c.fg, fontWeight: 600, fontSize: 12.5,
    }}>
      <Ic.pinFill size={13} color={c.dot} />
      {label}
    </div>
  );
}

/* ── BronzeBadge ───────────────────────── */
export function BronzeBadge({ size = 28 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="16" cy="16" r="13" fill="none" stroke="#E5E7EB" strokeWidth="2" />
        <circle
          cx="16" cy="16" r="13"
          fill="none" stroke="#16A34A" strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="60 100"
          transform="rotate(-90 16 16)"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 4, borderRadius: '50%', background: '#A47148',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: size * 0.44,
      }}>B</div>
      <div style={{ position: 'absolute', left: -2, top: -2 }}>
        <Ic.star size={12} color="#F5B81A" />
      </div>
    </div>
  );
}

/* ── Stars ─────────────────────────────── */
export function Stars({ rating = 4.7, count = '10,000', size = 13 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.4;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'inline-flex', gap: 1 }}>
        {[0, 1, 2, 3, 4].map(i => {
          const isFull = i < full;
          const isHalf = !isFull && i === full && half;
          return (
            <div key={i} style={{ position: 'relative', width: size, height: size }}>
              <Ic.star size={size} color="#E5E7EB" />
              {(isFull || isHalf) && (
                <div style={{ position: 'absolute', inset: 0, width: isHalf ? size / 2 : size, overflow: 'hidden' }}>
                  <Ic.star size={size} color="#F5B81A" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span style={{ fontWeight: 700, fontSize: size + 0.5, color: PA.ink }}>{rating}</span>
      <span style={{ fontSize: size, color: PA.muted }}>({count})</span>
    </div>
  );
}

/* ── Spinner ───────────────────────────── */
export function Spinner({ size = 22, color = PA.blue }) {
  return (
    <div className="anim-spin" style={{ width: size, height: size, flexShrink: 0 }}>
      <Ic.loading size={size} color={color} />
    </div>
  );
}

/* ── Skeleton block ────────────────────── */
export function Skeleton({ width, height, radius = 8, style }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }}
    />
  );
}

/* ── BottomBar (home nav) ──────────────── */
export function BottomBar({ onNewTrip, onFavorites, favoritesActive = false }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      display: 'flex', justifyContent: 'center',
      paddingBottom: 'max(18px,env(safe-area-inset-bottom))',
      pointerEvents: 'none',
      zIndex: 50,
    }}>
      <div style={{
        pointerEvents: 'all',
        background: '#fff', borderRadius: 9999, padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: 20,
        boxShadow: '0 8px 24px rgba(15,23,42,.10), 0 0 0 1px rgba(15,23,42,.04)',
      }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic.bag size={22} color={PA.blue} />
        </div>
        <button
          onClick={onNewTrip}
          style={{
            width: 50, height: 50, borderRadius: '50%',
            background: PA.black, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(0,0,0,.22)',
          }}
        >
          <Ic.plus size={22} color="#fff" />
        </button>
        <button
          onClick={onFavorites}
          style={{
            all: 'unset', cursor: 'pointer',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ic.bookmark size={22} color={favoritesActive ? PA.blue : PA.muted} />
        </button>
      </div>
    </div>
  );
}
