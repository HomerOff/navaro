/**
 * Desktop two-column layout.
 * Left panel (460px): logo + nav, trip list / create / trip detail / place detail
 * Right panel (flex): interactive Leaflet map + floating spot popup
 */
import { useState } from 'react';
import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { PathlyMap } from '../components/PathlyMap.jsx';
import { PathlyLogo } from '../components/ui/PathlyLogo.jsx';
import {
  Card, CircBtn, PillTab, CategoryPill, DayPill,
  Stars, Spinner, DateBadge,
  ImgWithFallback, ConfirmDialog,
} from '../components/ui/atoms.jsx';
import { buildRoute, optimizeDayAI } from '../services/ai.js';
import { storage } from '../services/storage.js';
import { TRENDING } from '../data/static.js';
import { CreateWhere, CreateWhen, CreateInterests, BuildingScreen } from '../screens/CreateFlow.jsx';

/* ── Sidebar shell ─────────────────────── */
function Sidebar({ children, topbar }) {
  return (
    <div style={{
      width: 460, flexShrink: 0, background: '#fff',
      display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${PA.hairline2}`,
      height: '100vh', overflow: 'hidden',
    }}>
      {topbar}
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
  );
}

function SidebarTopbar({ onNewTrip, onHome, showBack, onBack, title, onSettings, onImport, onShare }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 22px', borderBottom: `1px solid ${PA.hairline}`,
      flexShrink: 0, height: 64,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showBack ? (
          <CircBtn size={34} shadow={false} style={{ background: PA.chip }} onClick={onBack}>
            <Ic.back size={16} color={PA.muted} />
          </CircBtn>
        ) : (
          <button onClick={onHome} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PathlyLogo size={26} />
            <span style={{ fontFamily: '"Caveat",cursive', fontWeight: 700, fontSize: 22, color: PA.ink }}>Navaro</span>
          </button>
        )}
        {title && <span style={{ fontWeight: 600, fontSize: 15, color: PA.muted, marginLeft: 8 }}>{title}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onSettings && (
          <CircBtn size={34} shadow={false} style={{ background: PA.chip }} onClick={onSettings} title="Settings">
            <Ic.menu3 size={16} color={PA.muted} />
          </CircBtn>
        )}
        {onImport && (
          <CircBtn size={34} shadow={false} style={{ background: PA.chip }} onClick={onImport} title="Import trip from file">
            <Ic.inbox size={16} color={PA.muted} />
          </CircBtn>
        )}
        {onShare && (
          <button onClick={onShare} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
            background: PA.chip, color: PA.ink, border: 'none', cursor: 'pointer',
          }}>
            <Ic.share size={14} color={PA.ink} /> Share
          </button>
        )}
        {onNewTrip && (
          <button onClick={onNewTrip} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
            background: PA.black, color: '#fff', border: 'none', cursor: 'pointer',
          }}>
            <Ic.plus size={14} color="#fff" /> New trip
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Map panel ─────────────────────────── */
function MapPanel({ trips, currentTrip, selectedDay, selectedSpotIdx, onMarkerClick }) {
  let spots = [], routes = [], dayPills = [], center = [20, 0], zoom = 2;

  if (currentTrip) {
    center = currentTrip.center;
    zoom = 12;
    const days = selectedDay !== null
      ? [currentTrip.itinerary.find(d => d.day === selectedDay)].filter(Boolean)
      : currentTrip.itinerary;

    spots = days.flatMap(d =>
      d.spots.filter(s => s.coord).map((s, _i) => ({
        n: s.n, coord: s.coord, color: d.color, size: 30,
      }))
    );
    routes = days.map(d => ({ coords: buildRoute(d.spots), color: d.color, weight: 5 }));
    dayPills = days.map(d => ({
      at: d.spots[Math.floor(d.spots.length / 2)]?.coord ?? currentTrip.center,
      day: d.day, km: d.km, color: d.color,
    }));
  } else if (trips.length) {
    spots = trips.filter(t => t.center).map((t, i) => ({
      n: i + 1, coord: t.center, color: PA.blue, size: 28,
    }));
    if (spots.length) { center = spots[0].coord; zoom = 5; }
  }

  return (
    <div style={{ flex: 1, position: 'relative', height: '100vh' }}>
      <PathlyMap
        key={`${currentTrip?.id ?? 'none'}-${selectedDay ?? 'all'}`}
        center={center} zoom={zoom}
        spots={spots} route={routes} dayPills={dayPills}
        interactive={true}
        autoFit={!!currentTrip}
        selectedIdx={selectedSpotIdx}
        onMarkerClick={onMarkerClick}
      />

      {/* Day filter chips removed — navigation is in the sidebar */}

      {/* Empty state */}
      {!currentTrip && !trips.length && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(8px)',
            padding: '24px 32px', borderRadius: 20, textAlign: 'center',
            boxShadow: '0 8px 32px rgba(15,23,42,.10)',
          }}>
            <Ic.map size={40} color={PA.muted} style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: 17, color: PA.ink }}>No trips yet</div>
            <div style={{ color: PA.muted, fontSize: 14, marginTop: 4 }}>Create your first trip to see it on the map</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Home panel ────────────────────────── */
function HomePanel({ trips, onOpenTrip, onCreateTrip, onDeleteTrip, favorites = [], onToggleFavorite, onOpenFavSpot, _onImport, onShareTrip, isGuest, onAuthPrompt }) {
  const [menuOpen, setMenuOpen]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showFavs, setShowFavs]         = useState(false);
  const [favTab, setFavTab]             = useState('trips'); // 'trips' | 'places'
  const favSpots  = storage.getFavoriteSpots();
  const favTrips  = trips.filter(t => favorites.includes(t.id));
  const visibleTrips = showFavs ? favTrips : trips;

  return (
    <div style={{ padding: '22px 22px 40px' }}>
      {trips.length === 0 && !showFavs && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>✈️</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: PA.ink }}>Ready to explore?</div>
          <div style={{ color: PA.muted, fontSize: 15 }}>Create your first AI-powered trip itinerary.</div>
          <button onClick={onCreateTrip} style={{
            marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 24px', borderRadius: 9999, fontWeight: 700, fontSize: 15,
            background: PA.black, color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,.16)',
          }}>
            <Ic.sparkle size={18} color="#fff" /> Create your first trip
          </button>
        </div>
      )}

      {(trips.length > 0 || showFavs) && (
        <>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: PA.muted, letterSpacing: '.04em', textTransform: 'uppercase', fontSize: 11 }}>
              {showFavs ? 'FAVORITES' : 'YOUR TRIPS'}
            </div>
            <button
              onClick={() => setShowFavs(v => !v)}
              style={{
                all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                background: showFavs ? PA.blue : PA.chip,
                color: showFavs ? '#fff' : PA.chipText,
              }}
            >
              <Ic.bookmark size={12} color={showFavs ? '#fff' : PA.muted} />
              {showFavs ? 'All trips' : `Favorites${favTrips.length ? ` (${favTrips.length})` : ''}`}
            </button>
          </div>

          {/* Favorites sub-tabs */}
          {showFavs && (
            <div style={{ display: 'flex', background: '#F4F5F2', borderRadius: 12, padding: 3, marginBottom: 14, gap: 3 }}>
              {[
                { id: 'trips',  icon: <Ic.map size={13} color={favTab === 'trips'  ? PA.blue : PA.muted} />, label: 'Trips'  },
                { id: 'places', icon: <Ic.pin size={13} color={favTab === 'places' ? PA.blue : PA.muted} />, label: 'Places' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setFavTab(tab.id)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13,
                  background: favTab === tab.id ? '#fff' : 'transparent',
                  color: favTab === tab.id ? PA.ink : PA.muted,
                  boxShadow: favTab === tab.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                  transition: 'all .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Favorite places */}
          {showFavs && favTab === 'places' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {favSpots.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: PA.muted, fontSize: 14 }}>
                  No saved places yet. Open a place and click Save.
                </div>
              )}
              {favSpots.map((sp, i) => (
                <div
                  key={sp._favId ?? i}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenFavSpot?.(sp)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpenFavSpot?.(sp)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: PA.card, borderRadius: 16, padding: 10, cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.05)',
                  }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                    <ImgWithFallback src={sp.img} alt={sp.name} imgQuery={sp.imgQuery} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{sp.name}</div>
                    <div style={{ color: PA.muted, fontSize: 12, marginTop: 2 }}>{sp._tripCity}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); storage.removeFavoriteSpot(sp._favId); setFavTab(t => t); }}
                    style={{ all: 'unset', cursor: 'pointer', padding: 6 }}
                    title="Remove"
                  >
                    <Ic.bookmark size={16} color={PA.blue} fill={PA.blue} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Trips list */}
          {(!showFavs || favTab === 'trips') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {visibleTrips.length === 0 && showFavs && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: PA.muted, fontSize: 14 }}>
                  No favorite trips yet. Bookmark a trip to save it here.
                </div>
              )}
              {visibleTrips.map(t => (
                <div key={t.id} style={{ position: 'relative' }}>
                  <div
                    role="button" tabIndex={0}
                    onClick={() => onOpenTrip(t)}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpenTrip(t)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: PA.card, borderRadius: PA.rCard, padding: 12, cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
                    }}
                  >
                    <div style={{ width: 68, height: 68, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                      <ImgWithFallback src={t.cover} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25, letterSpacing: '-.01em' }}>{t.title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: PA.chip, padding: '3px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600, color: PA.chipText }}>
                          <Ic.cal size={12} /> {t.days}d
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: PA.chip, padding: '3px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600, color: PA.chipText }}>
                          <Ic.pinBlue size={12} /> {t.totalSpots} spots
                        </span>
                        {t.dateRange?.start && <DateBadge dateRange={t.dateRange} />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button
                        onClick={e => { e.stopPropagation(); onToggleFavorite?.(t.id); }}
                        style={{ all: 'unset', padding: 8, cursor: 'pointer' }}
                        title={favorites.includes(t.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Ic.bookmark size={16} color={favorites.includes(t.id) ? PA.blue : PA.muted} fill={favorites.includes(t.id) ? PA.blue : 'none'} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === t.id ? null : t.id); }}
                        style={{ all: 'unset', padding: 8, cursor: 'pointer' }}
                      >
                        <Ic.menu3 size={18} color={PA.muted} />
                      </button>
                    </div>
                  </div>

                  {menuOpen === t.id && (
                    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,23,42,.12)', marginTop: 4 }}>
                      <button onClick={() => { onOpenTrip(t); setMenuOpen(null); }} style={{ all: 'unset', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: PA.ink, fontWeight: 600, fontSize: 14, cursor: 'pointer', borderBottom: `1px solid ${PA.hairline}`, boxSizing: 'border-box' }}>
                        <Ic.map size={15} color={PA.blue} /> Open trip
                      </button>
                      <button onClick={() => { onShareTrip?.(t); setMenuOpen(null); }} style={{ all: 'unset', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: PA.ink, fontWeight: 600, fontSize: 14, cursor: 'pointer', borderBottom: `1px solid ${PA.hairline}`, boxSizing: 'border-box' }}>
                        <Ic.share size={15} color={PA.muted} /> Share trip
                      </button>
                      <button onClick={() => { setMenuOpen(null); setConfirmDelete(t.id); }} style={{ all: 'unset', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: PA.red, fontWeight: 600, fontSize: 14, cursor: 'pointer', boxSizing: 'border-box' }}>
                        <Ic.trash size={15} color={PA.red} /> Delete trip
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {!showFavs && (
                <button
                  onClick={isGuest ? onAuthPrompt : onCreateTrip}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    border: `1.5px dashed ${PA.hairline2}`,
                    borderRadius: PA.rCard, padding: '18px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    color: PA.muted, fontWeight: 600, fontSize: 14,
                  }}
                >
                  <Ic.plus size={17} color={PA.muted} /> Create New Trip
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Trending */}
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Trending</div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -22px', padding: '0 22px 8px', scrollbarWidth: 'none' }}>
        {TRENDING.map((t, i) => (
          <button key={i} onClick={() => onCreateTrip({ prefill: `${t.city}, ${t.country}`, flag: t.flag })} style={{
            all: 'unset', cursor: 'pointer', flexShrink: 0, width: 140, height: 180,
            borderRadius: 18, overflow: 'hidden', position: 'relative',
            boxShadow: '0 4px 14px rgba(15,23,42,.12)', display: 'block',
          }}>
            <ImgWithFallback src={t.img} alt={t.city} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 35%,rgba(0,0,0,.68))' }} />
            <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ fontSize: 14 }}>{t.flag}</span>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{t.city}</div>
              </div>
              <div style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 9999, background: 'rgba(0,0,0,.38)', color: '#fff', fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                {t.country}
              </div>
            </div>
          </button>
        ))}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this trip?"
          message="This will permanently remove the trip and all its data."
          confirmLabel="Delete"
          confirmColor={PA.red}
          onConfirm={() => { onDeleteTrip(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

/* ── Trip panel (day timeline) ─────────── */
function TripPanel({ trip, selectedDay, onSelectDay, selectedSpotIdx, onSelectSpot, onOpenPlace, onTripUpdate, _onError }) {
  const [showOptimize, setShowOptimize] = useState(false);
  const [showDates, setShowDates]       = useState(false);
  const [optimizeWishes, setOptimizeWishes] = useState('');
  const [optimizing, setOptimizing]     = useState(false);
  const [optError, setOptError]         = useState('');

  const day = trip.itinerary.find(d => d.day === selectedDay) ?? trip.itinerary[0];

  const handleOptimize = async () => {
    if (!optimizeWishes.trim()) return;
    setOptimizing(true); setOptError('');
    try {
      const newDay = await optimizeDayAI(trip, day, optimizeWishes.trim());
      const updated = { ...trip, itinerary: trip.itinerary.map(d => d.day === newDay.day ? newDay : d) };
      storage.updateTrip(updated);
      onTripUpdate?.(updated);
      setShowOptimize(false);
      setOptimizeWishes('');
    } catch (e) {
      setOptError(e.message || 'Something went wrong.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleSaveDates = dateRange => {
    const updated = { ...trip, dateRange };
    storage.updateTrip(updated);
    onTripUpdate?.(updated);
    setShowDates(false);
  };

  return (
    <div>
      {/* Trip header */}
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${PA.hairline}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 78, height: 78, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
            <ImgWithFallback src={trip.cover} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 4 }}>{trip.title}</div>
            <div style={{ color: PA.muted, fontSize: 13.5, fontWeight: 600 }}>{trip.days} days · {trip.totalSpots} spots</div>
            {trip.dateRange?.start && <div style={{ marginTop: 6 }}><DateBadge dateRange={trip.dateRange} /></div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          <PillTab
            active={selectedDay === null}
            color={PA.black}
            icon={<Ic.map size={13} color={selectedDay === null ? '#fff' : PA.chipText} />}
            onClick={() => { onSelectDay(null); onSelectSpot(null); }}
          >Overview</PillTab>
          {trip.itinerary.length > 1 && trip.itinerary.map(d => (
            <PillTab key={d.day} active={selectedDay === d.day} color={d.color} onClick={() => { onSelectDay(d.day); onSelectSpot(null); }}>
              Day {d.day}
            </PillTab>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {selectedDay === null && (() => {
        const multiDay = trip.itinerary.length > 1;
        if (multiDay) {
          // Multi-day: show day cards (click → select that day)
          return (
            <div style={{ padding: '16px 22px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trip.itinerary.map(d => (
                <Card key={d.day} padding={14} onClick={() => { onSelectDay(d.day); onSelectSpot(null); }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <DayPill day={d.day} color={d.color} />
                      <div style={{ fontWeight: 700, fontSize: 15.5 }}>{d.city}</div>
                    </div>
                    <div style={{ color: PA.muted, fontSize: 13, fontWeight: 600 }}>{d.km}km · {d.spots.length} spots</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const s = d.spots[i];
                      return (
                        <div key={i} style={{ flex: '0 0 calc((100% - 24px) / 5)', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: PA.chip }}>
                          {s && <ImgWithFallback src={s.img} alt={s.name} imgQuery={s.imgQuery} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
              <button
                onClick={() => setShowDates(true)}
                style={{
                  marginTop: 4, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
                  color: PA.muted, border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer',
                }}
              >
                <Ic.cal size={15} color={PA.muted} /> {trip.dateRange?.start ? 'Edit Dates' : 'Choose Dates'}
              </button>
            </div>
          );
        }

        // Single-day: show first day's full timeline
        const firstDay = trip.itinerary[0];
        if (!firstDay) return null;
        return (
          <div style={{ padding: '16px 22px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ color: PA.muted, fontWeight: 700, fontSize: 14 }}>{firstDay.city}</div>
              <div style={{ color: PA.muted, fontSize: 13 }}>{firstDay.km}km · {firstDay.spots.length} spots</div>
            </div>
            <div style={{ position: 'relative', paddingLeft: 36 }}>
              <div style={{ position: 'absolute', left: 15, top: 16, bottom: 16, borderLeft: `2px dashed ${PA.hairline2}` }} />
              {firstDay.spots.map((sp, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: -36, top: 20,
                      width: 26, height: 26, borderRadius: '50%',
                      background: selectedSpotIdx === i ? firstDay.color : '#F1F2EE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12,
                      color: selectedSpotIdx === i ? '#fff' : PA.muted,
                      transition: 'all .15s',
                    }}>{sp.n}</div>
                    <Card
                      padding={11}
                      onClick={() => { onSelectSpot(i); onOpenPlace(sp, firstDay); }}
                      selected={selectedSpotIdx === i}
                      selectedColor={firstDay.color}
                      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <div style={{ width: 58, height: 58, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                        <ImgWithFallback src={sp.img} alt={sp.name} imgQuery={sp.imgQuery} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Ic.diamond size={13} /> {sp.name}
                        </div>
                        <CategoryPill label={sp.cat} color={sp.catColor} />
                      </div>
                      <Ic.chevR size={16} color={PA.muted} />
                    </Card>
                  </div>
                  {sp.travel && i < firstDay.spots.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff',
                        padding: '6px 12px', borderRadius: 9999, border: `1px solid ${PA.hairline2}`, fontSize: 12.5, fontWeight: 600,
                      }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: firstDay.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ic.walk size={12} color="#fff" />
                        </span>
                        {sp.travel.t} · {sp.travel.d}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowDates(true)}
              style={{
                marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '11px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
                color: PA.muted, border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer',
              }}
            >
              <Ic.cal size={15} color={PA.muted} /> {trip.dateRange?.start ? 'Edit Dates' : 'Choose Dates'}
            </button>
          </div>
        );
      })()}

      {/* Day timeline */}
      {selectedDay !== null && (
      <div style={{ padding: '16px 22px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ color: PA.muted, fontWeight: 700, fontSize: 14 }}>{day.city}</div>
          <div style={{ color: PA.muted, fontSize: 13 }}>{day.km}km · {day.spots.length} spots</div>
        </div>

        <div style={{ position: 'relative', paddingLeft: 36 }}>
          <div style={{ position: 'absolute', left: 15, top: 16, bottom: 16, borderLeft: `2px dashed ${PA.hairline2}` }} />

          {day.spots.map((sp, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -36, top: 20,
                  width: 26, height: 26, borderRadius: '50%',
                  background: selectedSpotIdx === i ? day.color : '#F1F2EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12,
                  color: selectedSpotIdx === i ? '#fff' : PA.muted,
                  transition: 'all .15s',
                }}>{sp.n}</div>

                <Card
                  padding={11}
                  onClick={() => { onSelectSpot(i); onOpenPlace(sp, day); }}
                  selected={selectedSpotIdx === i}
                  selectedColor={day.color}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div style={{ width: 58, height: 58, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                    <ImgWithFallback src={sp.img} alt={sp.name} imgQuery={sp.imgQuery} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Ic.diamond size={13} /> {sp.name}
                    </div>
                    <CategoryPill label={sp.cat} color={sp.catColor} />
                  </div>
                  <Ic.chevR size={16} color={PA.muted} />
                </Card>
              </div>

              {/* Travel pill */}
              {sp.travel && i < day.spots.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff',
                    padding: '6px 12px', borderRadius: 9999, border: `1px solid ${PA.hairline2}`, fontSize: 12.5, fontWeight: 600,
                  }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: day.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ic.walk size={12} color="#fff" />
                    </span>
                    {sp.travel.t} · {sp.travel.d}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              onClick={() => setShowOptimize(v => !v)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '11px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
                color: PA.blue, border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer',
              }}
            >
              <Ic.routeAlt size={15} color={PA.blue} /> Optimize Route
            </button>
            <button
              onClick={() => setShowDates(true)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '11px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
                color: PA.muted, border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer',
              }}
            >
              <Ic.cal size={15} color={PA.muted} /> {trip.dateRange?.start ? 'Edit Dates' : 'Choose Dates'}
            </button>
          </div>

          {/* Optimize inline form */}
          {showOptimize && (
            <div className="anim-slideDown" style={{ marginTop: 14, background: PA.blueSoft, borderRadius: 16, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: PA.blueDeep }}>
                How would you like to change Day {day.day}?
              </div>
              <textarea
                value={optimizeWishes}
                onChange={e => setOptimizeWishes(e.target.value)}
                placeholder="e.g. More food spots, skip museums, end near the waterfront…"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                  borderRadius: 12, resize: 'none', border: `1.5px solid ${PA.blue}55`,
                  fontSize: 14, fontFamily: PA.font, color: PA.ink, outline: 'none',
                  background: '#fff', marginBottom: 10,
                }}
              />
              {optError && <div style={{ color: PA.red, fontSize: 12, marginBottom: 8 }}>{optError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowOptimize(false); setOptimizeWishes(''); setOptError(''); }} style={{
                  flex: 1, padding: '9px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
                  background: '#fff', color: PA.muted, border: 'none', cursor: 'pointer',
                }}>Cancel</button>
                <button
                  onClick={handleOptimize}
                  disabled={!optimizeWishes.trim() || optimizing}
                  style={{
                    flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
                    background: optimizeWishes.trim() && !optimizing ? PA.black : PA.muted,
                    color: '#fff', border: 'none', cursor: optimizeWishes.trim() && !optimizing ? 'pointer' : 'default',
                  }}
                >
                  {optimizing ? <><Spinner size={14} color="#fff" /> Replanning…</> : <><Ic.sparkle size={14} color="#fff" /> Replan</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Choose Dates modal */}
      {showDates && (
        <ChooseDatesDesktop trip={trip} onSave={handleSaveDates} onClose={() => setShowDates(false)} />
      )}
    </div>
  );
}

/* ── Choose Dates (desktop modal) ──────── */
function ChooseDatesDesktop({ trip, onSave, onClose }) {
  const existing = trip.dateRange ?? {};
  const [start, setStart] = useState(existing.start ?? '');
  const [end,   setEnd]   = useState(existing.end   ?? '');
  const today = new Date().toISOString().split('T')[0];

  // Auto-compute end date from start + trip.days (timezone-safe)
  const autoEnd = (startVal) => {
    if (!startVal || !trip.days) return '';
    const [y, m, d] = startVal.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + trip.days - 1));
    return date.toISOString().split('T')[0];
  };

  const handleStartChange = (val) => {
    setStart(val);
    if (val) setEnd(autoEnd(val));
    else setEnd('');
  };

  return (
    <div className="anim-fadeIn" style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: PA.font,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="anim-slideUp" style={{
        width: 380, background: '#fff', borderRadius: 24, padding: '28px 24px 20px',
        boxShadow: '0 24px 60px rgba(0,0,0,.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Choose Dates</div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', padding: 4 }}>
            <Ic.close size={18} color={PA.muted} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: PA.muted, marginBottom: 5 }}>Start date</div>
            <input type="date" min={today} value={start}
              onChange={e => handleStartChange(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 12, border: `1.5px solid ${start ? PA.blue : PA.hairline2}`, fontSize: 14, fontFamily: PA.font, color: PA.ink, outline: 'none', background: '#fff' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: PA.muted, marginBottom: 5 }}>End date</div>
            <input type="date" min={start || today} value={end}
              onChange={e => setEnd(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 12, border: `1.5px solid ${end ? PA.blue : PA.hairline2}`, fontSize: 14, fontFamily: PA.font, color: PA.ink, outline: 'none', background: '#fff' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {trip.dateRange?.start && (
            <button onClick={() => onSave(null)} style={{ flex: 1, padding: '11px', borderRadius: 9999, fontWeight: 700, fontSize: 13, background: PA.chip, color: PA.muted, border: 'none', cursor: 'pointer' }}>Clear</button>
          )}
          <button onClick={() => onSave(start && end ? { start, end } : start ? { start } : null)} disabled={!start}
            style={{ flex: 2, padding: '11px', borderRadius: 9999, fontWeight: 700, fontSize: 13, background: start ? PA.black : PA.muted, color: '#fff', border: 'none', cursor: start ? 'pointer' : 'default' }}>
            Save Dates
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Place Detail panel (desktop) ──────── */
function PlacePanel({ spot, _day, trip, onBack, _onTripUpdate, onOpenLightbox }) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [isFav, setIsFav] = useState(() => storage.isSpotFavorite(trip.id, spot));

  const handleToggleFav = () => {
    const next = storage.toggleFavoriteSpot(spot, trip.id, trip.city);
    setIsFav(next);
  };

  const fullDesc  = spot.descFull || spot.desc;
  const shortDesc = spot.desc;
  const hasMore   = fullDesc && fullDesc !== shortDesc;

  const infoRows = [
    spot.hours && { icon: <Ic.cal size={16} color={PA.green} />, label: <span style={{ color: PA.green, fontWeight: 700 }}>Hours</span>, val: spot.hours },
    spot.address && { icon: <Ic.pin size={16} color={PA.muted} />, label: 'Address', val: spot.address, onClick: () => navigator.clipboard?.writeText(spot.address), end: <Ic.copy size={13} color={PA.muted} /> },
    { icon: <Ic.globe size={16} color={PA.muted} />, label: 'Website', val: 'Wikipedia', onClick: () => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(spot.name)}`, '_blank'), end: <Ic.externalLink size={13} color={PA.muted} /> },
    spot.phone && { icon: <Ic.phone size={16} color={PA.muted} />, label: 'Phone', val: spot.phone, onClick: () => navigator.clipboard?.writeText(spot.phone), end: <Ic.copy size={13} color={PA.muted} /> },
  ].filter(Boolean);

  return (
    <div className="anim-slideUp">
      {/* Back button */}
      <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <CircBtn size={32} shadow={false} style={{ background: PA.chip }} onClick={onBack}>
          <Ic.back size={15} color={PA.muted} />
        </CircBtn>
        <span style={{ fontWeight: 600, fontSize: 14, color: PA.muted }}>Back to day</span>
      </div>

      {/* Hero image — clickable for lightbox */}
      <div
        onClick={() => onOpenLightbox?.(spot.big, spot.name)}
        style={{ margin: '14px 22px 0', borderRadius: 18, overflow: 'hidden', height: 180, background: PA.chip, cursor: 'zoom-in', position: 'relative' }}
      >
        <ImgWithFallback src={spot.big} alt={spot.name} imgQuery={spot.imgQuery} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: 'rgba(0,0,0,.45)', borderRadius: 8, padding: '4px 8px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Ic.search size={13} color="#fff" />
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>View full</span>
        </div>
      </div>

      <div style={{ padding: '16px 22px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', lineHeight: 1.2 }}>{spot.name}</div>
            <div style={{ marginTop: 6 }}>
              <Stars rating={spot.rating ?? 4.5} count={spot.ratings ?? '10,000'} size={12} />
            </div>
          </div>
          <button
            onClick={handleToggleFav}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
              background: isFav ? PA.blueSoft : PA.chip,
              color: isFav ? PA.blueDeep : PA.ink,
              transition: 'background .2s',
            }}
          >
            <Ic.bookmark size={14} color={isFav ? PA.blue : PA.muted} fill={isFav ? PA.blue : 'none'} />
            {isFav ? 'Saved' : 'Save'}
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <CategoryPill label={spot.cat} color={spot.catColor} />
        </div>

        {/* Description */}
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>About this place</div>
          <div style={{ color: PA.muted, fontSize: 14, lineHeight: 1.6 }}>
            {descExpanded ? fullDesc : shortDesc}
          </div>
          {hasMore && (
            <button onClick={() => setDescExpanded(v => !v)} style={{
              all: 'unset', cursor: 'pointer', marginTop: 8,
              color: PA.blue, fontWeight: 700, fontSize: 13,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {descExpanded ? 'Show less' : 'Read more'}
              <Ic.chevD size={13} color={PA.blue} />
            </button>
          )}
        </Card>

        {/* Info rows */}
        {infoRows.length > 0 && (
          <Card padding={4} style={{ marginBottom: 12 }}>
            {infoRows.map((row, i) => (
              <div key={i} onClick={row.onClick} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
                borderTop: i ? `1px solid ${PA.hairline}` : 'none',
                cursor: row.onClick ? 'pointer' : 'default',
              }}>
                <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>{row.icon}</div>
                <div style={{ width: 64, color: PA.muted, fontWeight: 600, fontSize: 12 }}>{row.label}</div>
                <div style={{ flex: 1, color: PA.ink, fontSize: 12, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.val}</div>
                {row.end && <div style={{ flexShrink: 0 }}>{row.end}</div>}
              </div>
            ))}
          </Card>
        )}

        {/* Directions */}
        {spot.coord && (
          <button
            onClick={() => {
              const query = spot.address || `${spot.name}, ${trip.city}`;
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 9999, fontWeight: 700, fontSize: 14,
              background: PA.black, color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,.16)',
            }}
          >
            <Ic.route size={16} color="#fff" /> Open in Maps
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Create panel ──────────────────────── */
function CreatePanel({ step, createData, onNext, onBack, onClose, onDone, onError }) {
  if (step === 'where') return <CreateWhere prefill={createData.prefill ?? ''} onNext={onNext} onClose={onClose} />;
  if (step === 'when')  return <CreateWhen city={createData.city} flag={createData.flag} onBack={onBack} onClose={onClose} onNext={({ days, dateRange }) => onNext({ days, dateRange })} />;
  if (step === 'interests') return <CreateInterests city={createData.city} flag={createData.flag} days={createData.days} onBack={onBack} onClose={onClose} onBuild={(interests, wishes) => onNext({ interests, wishes })} />;
  if (step === 'building')  return (
    <BuildingScreen
      city={createData.city}
      days={createData.days}
      interests={createData.interests ?? []}
      wishes={createData.wishes ?? ''}
      onDone={trip => {
        // Apply dateRange chosen in CreateWhen step
        const tripWithDates = createData.dateRange
          ? { ...trip, dateRange: createData.dateRange }
          : trip;
        onDone(tripWithDates);
      }}
      onError={onError}
    />
  );
  return null;
}

/* ════════════════════════════════════════
   ROOT DESKTOP LAYOUT
════════════════════════════════════════ */
export function DesktopLayout({ trips, onSaveTrip, onUpdateTrip, onDeleteTrip, onSettings, onError, favorites = [], onToggleFavorite, onShare, onImport, isGuest, onAuthPrompt }) {
  const [view, setView]             = useState('home');
  const [createStep, setCreateStep] = useState('where');
  const [createData, setCreateData] = useState({});
  const [currentTrip, setCurrentTrip] = useState(null);
  const [currentPlace, setCurrentPlace] = useState(null);

  const [selectedDay, setSelectedDay]       = useState(null);
  const [selectedSpotIdx, setSelectedSpotIdx] = useState(null);

  // Lightbox lives here so it's outside Sidebar's overflow:hidden stacking context
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [lightboxName, setLightboxName] = useState('');

  const openTrip = trip => {
    setCurrentTrip(trip);
    setSelectedDay(null);
    setSelectedSpotIdx(null);
    setCurrentPlace(null);
    setView('trip');
  };

  const startCreate = (opts = {}) => {
    if (isGuest) { onAuthPrompt?.(); return; }
    setCreateData({ prefill: opts.prefill ?? '', flag: opts.flag ?? '' });
    setCreateStep('where');
    setView('create');
  };

  const handleCreateNext = data => {
    setCreateData(d => ({ ...d, ...data }));
    if (createStep === 'where')          setCreateStep('when');
    else if (createStep === 'when')      setCreateStep('interests');
    else if (createStep === 'interests') setCreateStep('building');
  };

  const handleCreateBack = () => {
    if (createStep === 'when')           setCreateStep('where');
    else if (createStep === 'interests') setCreateStep('when');
    else if (createStep === 'building')  setCreateStep('interests');
    else setView('home');
  };

  const handleTripDone = trip => {
    onSaveTrip(trip);
    openTrip(trip);
  };

  const handleTripUpdate = trip => {
    onUpdateTrip?.(trip);
    setCurrentTrip(trip);
  };

  const handleSpotSelect = (idx, dayOverride) => {
    if (dayOverride !== undefined) {
      setSelectedDay(dayOverride);
      setSelectedSpotIdx(null);
      setCurrentPlace(null);
      return;
    }
    // On home screen, markers represent trips — open the trip
    if (idx !== null && !currentTrip && trips[idx]) {
      openTrip(trips[idx]);
      return;
    }
    setSelectedSpotIdx(idx);
    if (idx !== null && currentTrip) {
      // Build the same flat spot list as MapPanel uses
      const days = selectedDay !== null
        ? [currentTrip.itinerary.find(d => d.day === selectedDay)].filter(Boolean)
        : currentTrip.itinerary;
      const flatSpots = days.flatMap(d =>
        d.spots.filter(s => s.coord).map(s => ({ spot: s, day: d }))
      );
      const item = flatSpots[idx];
      if (item) setCurrentPlace({ spot: item.spot, day: item.day });
    } else {
      setCurrentPlace(null);
    }
  };

  const handleOpenPlace = (sp, day) => {
    setCurrentPlace({ spot: sp, day });
    // Sync map selection
    const idx = day.spots.indexOf(sp);
    if (idx >= 0) setSelectedSpotIdx(idx);
  };

  const isShowingBack = view === 'trip' || view === 'create';
  const sidebarTitle  = view === 'create' ? 'Create Trip'
    : view === 'trip' && currentTrip ? currentTrip.city
    : undefined;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: PA.font, overflow: 'hidden' }}>
      {/* LEFT PANEL */}
      <Sidebar
        topbar={
          <SidebarTopbar
            showBack={isShowingBack}
            onBack={() => { setView('home'); setCurrentTrip(null); setSelectedSpotIdx(null); setCurrentPlace(null); }}
            onHome={() => { setView('home'); setCurrentTrip(null); setSelectedSpotIdx(null); setCurrentPlace(null); }}
            onNewTrip={view === 'home' ? startCreate : undefined}
            onImport={view === 'home' ? onImport : undefined}
            onShare={view === 'trip' && currentTrip ? () => onShare?.(currentTrip) : undefined}
            onSettings={onSettings}
            title={sidebarTitle}
          />
        }
      >
        {view === 'home' && (
          <HomePanel
            trips={trips}
            onOpenTrip={openTrip}
            onCreateTrip={startCreate}
            onDeleteTrip={onDeleteTrip}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onImport={onImport}
            onShareTrip={onShare}
            isGuest={isGuest}
            onAuthPrompt={onAuthPrompt}
            onOpenFavSpot={sp => {
              // Find the real trip for context
              const realTrip = trips.find(t => t.id === sp._tripId) ?? {
                id: sp._tripId ?? 'fav',
                city: sp._tripCity ?? '',
                center: sp.coord ?? [0, 0],
                itinerary: [],
              };
              setCurrentTrip(realTrip);
              setCurrentPlace({ spot: sp, day: { color: PA.blue, day: 0, spots: [] } });
              setView('trip');
            }}
          />
        )}

        {view === 'trip' && currentTrip && !currentPlace && (
          <TripPanel
            trip={currentTrip}
            selectedDay={selectedDay}
            onSelectDay={d => { setSelectedDay(d); setSelectedSpotIdx(null); setCurrentPlace(null); }}
            selectedSpotIdx={selectedSpotIdx}
            onSelectSpot={idx => setSelectedSpotIdx(idx)}
            onOpenPlace={handleOpenPlace}
            onTripUpdate={handleTripUpdate}
            onError={onError}
          />
        )}

        {view === 'trip' && currentTrip && currentPlace && (
          <PlacePanel
            key={currentPlace.spot.name}
            spot={currentPlace.spot}
            day={currentPlace.day}
            trip={currentTrip}
            onBack={() => { setCurrentPlace(null); setSelectedSpotIdx(null); }}
            onTripUpdate={handleTripUpdate}
            onOpenLightbox={(src, name) => { setLightboxSrc(src); setLightboxName(name); }}
          />
        )}

        {view === 'create' && (
          <CreatePanel
            step={createStep}
            createData={createData}
            onNext={handleCreateNext}
            onBack={handleCreateBack}
            onClose={() => setView('home')}
            onDone={handleTripDone}
            onError={msg => { onError(msg); setView('home'); }}
          />
        )}
      </Sidebar>

      {/* RIGHT PANEL — MAP */}
      <MapPanel
        trips={trips}
        currentTrip={currentTrip}
        selectedDay={selectedDay}
        selectedSpotIdx={selectedSpotIdx}
        onMarkerClick={handleSpotSelect}
      />

      {/* Lightbox — outside Sidebar so position:fixed covers full viewport */}
      {lightboxSrc && (
        <div
          className="anim-fadeIn"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#000',
            display: 'flex', flexDirection: 'column',
            fontFamily: PA.font,
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px 12px', flexShrink: 0,
          }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lightboxName}
            </div>
            <button
              onClick={() => { setLightboxSrc(null); setLightboxName(''); }}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,.15)',
                border: 'none', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ic.close size={20} color="#fff" />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
            <img
              src={lightboxSrc}
              alt={lightboxName}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12 }}
            />
          </div>
          <div style={{ height: 16, flexShrink: 0 }} />
        </div>
      )}
    </div>
  );
}
