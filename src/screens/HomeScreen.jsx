import { useState } from 'react';
import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { PathlyBg } from '../components/ui/PathlyBg.jsx';
import { PathlyLogo } from '../components/ui/PathlyLogo.jsx';
import { CircBtn, BottomBar, DateBadge, ImgWithFallback, ConfirmDialog } from '../components/ui/atoms.jsx';
import { TRENDING } from '../data/static.js';
import { storage } from '../services/storage.js';

export function HomeScreen({
  trips, onCreateTrip, onOpenTrip, onDeleteTrip, onSettings,
  favorites = [], onToggleFavorite,
  favoritesOnly = false, onFavorites,
  onOpenFavoriteSpot, _onImport, onShareTrip,
}) {
  const [menuOpen, setMenuOpen]           = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [favTab, setFavTab]               = useState('trips');
  // Re-render trigger for fav spots list
  const [_favSpotsVersion, setFavSpotsVersion] = useState(0);

  const favSpots   = storage.getFavoriteSpots();
  const visibleTrips = favoritesOnly
    ? trips.filter(t => favorites.includes(t.id))
    : trips;

  return (
    <div style={{ minHeight: '100dvh', fontFamily: PA.font, color: PA.ink, position: 'relative' }}>
      <PathlyBg tone="mint" />

      {/* Sticky header — frosted glass effect */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: 'max(16px,env(safe-area-inset-top)) 18px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(234,242,221,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
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

      <div style={{ position: 'relative', zIndex: 1, padding: '8px 18px 130px' }}>

        {/* ── Hero text ── */}
        <div style={{ marginBottom: 18, marginTop: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-.025em', lineHeight: 1.2 }}>
            {favoritesOnly ? 'Favorites' : 'Your Trips'}
          </div>
          <div style={{ color: PA.muted, fontSize: 15, fontWeight: 500, marginTop: 4 }}>
            {favoritesOnly ? 'Saved trips and places you love' : 'Plan your next adventure'}
          </div>
        </div>

        {/* ── Favorites sub-tabs ── */}
        {favoritesOnly && (
          <div style={{ display: 'flex', background: '#F4F5F2', borderRadius: 14, padding: 4, marginBottom: 18, gap: 4 }}>
            {[
              { id: 'trips',  icon: <Ic.map  size={15} color={favTab === 'trips'  ? PA.blue : PA.muted} />, label: 'Trips'  },
              { id: 'places', icon: <Ic.pin  size={15} color={favTab === 'places' ? PA.blue : PA.muted} />, label: 'Places' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFavTab(tab.id)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14,
                  background: favTab === tab.id ? '#fff' : 'transparent',
                  color: favTab === tab.id ? PA.ink : PA.muted,
                  boxShadow: favTab === tab.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                  transition: 'all .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Favorite Places list ── */}
        {favoritesOnly && favTab === 'places' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {favSpots.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: PA.muted, fontSize: 15 }}>
                No saved places yet. Open a place and tap Save.
              </div>
            )}
            {favSpots.map((sp, i) => (
              <div
                key={sp._favId ?? i}
                role="button" tabIndex={0}
                onClick={() => onOpenFavoriteSpot?.(sp)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpenFavoriteSpot?.(sp)}
                style={{
                  background: PA.card, borderRadius: PA.rCard, padding: 12, cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                  <ImgWithFallback src={sp.img} alt={sp.name} imgQuery={sp.imgQuery} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25 }}>{sp.name}</div>
                  <div style={{ color: PA.muted, fontSize: 12.5, marginTop: 3 }}>{sp._tripCity}</div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: PA.chip, padding: '3px 9px', borderRadius: 9999,
                      fontSize: 12, fontWeight: 600, color: PA.chipText,
                    }}>
                      {sp.cat}
                    </span>
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    storage.removeFavoriteSpot(sp._favId);
                    setFavSpotsVersion(v => v + 1);
                  }}
                  style={{ all: 'unset', cursor: 'pointer', padding: 8 }}
                  title="Remove from saved"
                >
                  <Ic.bookmark size={20} color={PA.blue} fill={PA.blue} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Trips list ── */}
        {(!favoritesOnly || favTab === 'trips') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visibleTrips.length === 0 && favoritesOnly && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: PA.muted, fontSize: 15 }}>
                No favorite trips yet. Bookmark a trip to save it here.
              </div>
            )}

            {visibleTrips.map(t => (
              <div key={t.id} style={{ position: 'relative' }}>
                {/* Trip card — using div to avoid nested button */}
                <div
                  style={{
                    background: PA.card, borderRadius: PA.rCard, padding: 12,
                    boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => onOpenTrip(t)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpenTrip(t)}
                >
                  <div style={{ width: 76, height: 76, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                    <ImgWithFallback src={t.cover} alt={t.title} imgQuery={`${t.city} travel`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.25, letterSpacing: '-.01em' }}>
                      {t.title}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
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
                      {t.dateRange?.start && <DateBadge dateRange={t.dateRange} />}
                    </div>
                  </div>

                  {/* Action buttons — siblings, not nested */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                    <button
                      onClick={e => { e.stopPropagation(); onToggleFavorite?.(t.id); }}
                      style={{ all: 'unset', padding: 8, cursor: 'pointer' }}
                      title={favorites.includes(t.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Ic.bookmark size={20} color={favorites.includes(t.id) ? PA.blue : PA.muted} fill={favorites.includes(t.id) ? PA.blue : 'none'} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === t.id ? null : t.id); }}
                      style={{ all: 'unset', padding: 8, cursor: 'pointer' }}
                    >
                      <Ic.menu3 size={20} color={PA.muted} />
                    </button>
                  </div>
                </div>

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
                        borderBottom: `1px solid ${PA.hairline}`, boxSizing: 'border-box',
                      }}
                    >
                      <Ic.map size={16} color={PA.blue} /> Open trip
                    </button>
                    <button
                      onClick={() => { onShareTrip?.(t); setMenuOpen(null); }}
                      style={{
                        all: 'unset', width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '13px 16px', color: PA.ink, fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
                        borderBottom: `1px solid ${PA.hairline}`, boxSizing: 'border-box',
                      }}
                    >
                      <Ic.share size={16} color={PA.muted} /> Share trip
                    </button>
                    <button
                      onClick={() => { setMenuOpen(null); setConfirmDelete(t.id); }}
                      style={{
                        all: 'unset', width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '13px 16px', color: PA.red, fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <Ic.trash size={16} color={PA.red} /> Delete trip
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Create new */}
            {!favoritesOnly && (
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
            )}
          </div>
        )}

        {/* ── Trending ── */}
        {!favoritesOnly && (
          <div style={{ marginTop: 28 }}>
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
                    all: 'unset', flexShrink: 0, width: 150, height: 200,
                    borderRadius: 20, overflow: 'hidden', position: 'relative',
                    boxShadow: '0 4px 16px rgba(15,23,42,.12)', cursor: 'pointer', display: 'block',
                  }}
                >
                  <ImgWithFallback
                    src={t.img} alt={t.city}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 35%,rgba(0,0,0,.68))' }} />
                  <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span style={{ fontSize: 16 }}>{t.flag}</span>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{t.city}</div>
                    </div>
                    <div style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 9999,
                      background: 'rgba(0,0,0,.38)', color: '#fff',
                      fontSize: 11.5, fontWeight: 600, backdropFilter: 'blur(4px)',
                    }}>{t.country}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomBar
        onNewTrip={onCreateTrip}
        onFavorites={onFavorites}
        onHome={() => { if (favoritesOnly) onFavorites(); }}
        homeActive={!favoritesOnly}
        favoritesActive={favoritesOnly}
      />

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this trip?"
          message="This will permanently remove the trip and all its data. This cannot be undone."
          confirmLabel="Delete"
          confirmColor={PA.red}
          onConfirm={() => { onDeleteTrip(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
