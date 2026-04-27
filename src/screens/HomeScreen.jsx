import { useState } from 'react';
import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { PathlyBg } from '../components/ui/PathlyBg.jsx';
import { PathlyLogo } from '../components/ui/PathlyLogo.jsx';
import { Card, CircBtn, BronzeBadge, BottomBar } from '../components/ui/atoms.jsx';
import { TRENDING } from '../data/static.js';

export function HomeScreen({ trips, onCreateTrip, onOpenTrip, onDeleteTrip, onSettings, favorites = [], onToggleFavorite, favoritesOnly = false, onFavorites }) {
  const [menuOpen, setMenuOpen] = useState(null);
  const visibleTrips = favoritesOnly ? trips.filter(t => favorites.includes(t.id)) : trips;

  return (
    <div style={{ minHeight: '100%', fontFamily: PA.font, color: PA.ink, position: 'relative' }}>
      <PathlyBg tone="mint" />
      <div style={{ position: 'relative', zIndex: 1, padding: '56px 18px 130px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <PathlyLogo size={30} />
            <span style={{
              fontFamily: '"Caveat", cursive', fontWeight: 700,
              fontSize: 26, color: PA.ink, letterSpacing: '-.01em',
            }}>Navaro</span>
          </div>
          <CircBtn size={38} shadow={false} style={{ background: 'rgba(255,255,255,.75)' }} onClick={onSettings} title="Settings">
            <Ic.menu3 size={18} color={PA.muted} />
          </CircBtn>
        </div>

        {/* ── Hero text ── */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-.025em', lineHeight: 1.2 }}>
            {favoritesOnly ? 'Favorites' : 'Your Trips'}
          </div>
          <div style={{ color: PA.muted, fontSize: 15, fontWeight: 500, marginTop: 4 }}>
            {favoritesOnly ? 'Saved trips you love' : 'Plan your next adventure'}
          </div>
        </div>

        {/* ── Trips list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleTrips.length === 0 && favoritesOnly && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: PA.muted, fontSize: 15 }}>
              No favorites yet. Bookmark a trip to save it here.
            </div>
          )}
          {visibleTrips.map(t => (
            <div key={t.id} style={{ position: 'relative' }}>
              <Card
                padding={12}
                onClick={() => onOpenTrip(t)}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{
                  width: 76, height: 76, borderRadius: 14,
                  overflow: 'hidden', flexShrink: 0, background: PA.chip,
                }}>
                  <img src={t.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.25, letterSpacing: '-.01em' }}>
                    {t.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: PA.chip, padding: '4px 10px', borderRadius: 9999,
                      fontSize: 12.5, fontWeight: 600, color: PA.chipText,
                    }}>
                      <Ic.cal size={13} /> {t.days}d
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: PA.chip, padding: '4px 10px', borderRadius: 9999,
                      fontSize: 12.5, fontWeight: 600, color: PA.chipText,
                    }}>
                      <Ic.pinBlue size={13} /> {t.totalSpots} spots
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}><BronzeBadge size={22} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                  <button
                    onClick={e => { e.stopPropagation(); onToggleFavorite?.(t.id); }}
                    style={{ all: 'unset', padding: 8, cursor: 'pointer' }}
                    title={favorites.includes(t.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Ic.bookmark size={20} color={favorites.includes(t.id) ? PA.blue : PA.muted} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === t.id ? null : t.id); }}
                    style={{ all: 'unset', padding: 8, cursor: 'pointer' }}
                  >
                    <Ic.menu3 size={20} color={PA.muted} />
                  </button>
                </div>
              </Card>

              {menuOpen === t.id && (
                <div style={{
                  background: '#fff', borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(15,23,42,.12)', marginTop: 4,
                }}>
                  <button
                    onClick={() => { onOpenTrip(t); setMenuOpen(null); }}
                    style={{
                      all: 'unset', width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '13px 16px', color: PA.ink, fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
                      borderBottom: `1px solid ${PA.hairline}`,
                    }}
                  >
                    <Ic.map size={16} color={PA.blue} /> Open trip
                  </button>
                  <button
                    onClick={() => { onDeleteTrip(t.id); setMenuOpen(null); }}
                    style={{
                      all: 'unset', width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '13px 16px', color: PA.red, fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
                    }}
                  >
                    <Ic.trash size={16} color={PA.red} /> Delete trip
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Create new */}
          <button
            onClick={onCreateTrip}
            style={{
              all: 'unset', cursor: 'pointer',
              border: `1.5px dashed ${PA.hairline2}`,
              borderRadius: PA.rCard, padding: '22px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: PA.muted, fontWeight: 600, fontSize: 15,
            }}
          >
            <Ic.plus size={18} color={PA.muted} /> Create New Trip
          </button>
        </div>

        {/* ── Trending (photo cards) ── */}
        {!favoritesOnly && (<div style={{ marginTop: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.01em', marginBottom: 14 }}>
            Trending
          </div>
          <div style={{
            display: 'flex', gap: 12,
            overflowX: 'auto', margin: '0 -18px', padding: '0 18px 8px',
            scrollbarWidth: 'none',
          }}>
            {TRENDING.map((t, i) => (
              <button
                key={i}
                onClick={() => onCreateTrip({ prefill: `${t.city}, ${t.country}`, flag: t.flag })}
                style={{
                  all: 'unset',
                  flexShrink: 0, width: 150, height: 200,
                  borderRadius: 20, overflow: 'hidden', position: 'relative',
                  boxShadow: '0 4px 16px rgba(15,23,42,.12)', cursor: 'pointer',
                  display: 'block',
                }}
              >
                <img
                  src={t.img} alt={t.city}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 35%,rgba(0,0,0,.68))' }} />
                <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: 16 }}>{t.flag}</span>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{t.city}</div>
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '3px 8px', borderRadius: 9999,
                    background: 'rgba(0,0,0,.38)', color: '#fff',
                    fontSize: 11.5, fontWeight: 600, backdropFilter: 'blur(4px)',
                  }}>{t.country}</div>
                </div>
              </button>
            ))}
          </div>
        </div>)}
      </div>

      <BottomBar onNewTrip={onCreateTrip} onFavorites={onFavorites} favoritesActive={favoritesOnly} />
    </div>
  );
}
