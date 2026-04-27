/**
 * Desktop two-column layout:
 *  Left panel (460px)  →  logo + nav, trip list / create form / trip detail
 *  Right panel (flex)  →  interactive Leaflet map + floating cards
 */
import { useState } from 'react';
import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { PathlyMap } from '../components/PathlyMap.jsx';
import { PathlyLogo } from '../components/ui/PathlyLogo.jsx';
import { Card, CircBtn, PillTab, CategoryPill, BronzeBadge, Stars } from '../components/ui/atoms.jsx';
import { buildRoute } from '../services/ai.js';
import { TRENDING } from '../data/static.js';

/* ────────────────────────────────────────
   Sidebar shell
──────────────────────────────────────── */
function Sidebar({ children, topbar }) {
  return (
    <div style={{
      width: 460, flexShrink: 0,
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${PA.hairline2}`,
      height: '100vh', overflow: 'hidden',
    }}>
      {topbar}
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
  );
}

function SidebarTopbar({ onNewTrip, onHome, showBack, onBack, title, onSettings }) {
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
        {onNewTrip && (
          <button
            onClick={onNewTrip}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
              background: PA.black, color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            <Ic.plus size={14} color="#fff" /> New trip
          </button>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   Map panel
──────────────────────────────────────── */
function MapPanel({ trips, currentTrip, selectedDay, selectedSpot, onSelectSpot }) {
  // Build combined spots + routes from all trips or current trip
  const showTrip = currentTrip;

  let spots = [], routes = [], dayPills = [], center = [20, 0], zoom = 2;

  if (showTrip) {
    center = showTrip.center;
    zoom = 12;
    const days = selectedDay !== null ? [showTrip.itinerary.find(d => d.day === selectedDay)].filter(Boolean) : showTrip.itinerary;
    spots = days.flatMap(d =>
      d.spots.filter(s => s.coord).map(s => ({ n: s.n, coord: s.coord, color: d.color, size: 30 }))
    );
    routes = days.map(d => ({ coords: buildRoute(d.spots), color: d.color, weight: 5 }));
    dayPills = days.map(d => ({
      at: d.spots[Math.floor(d.spots.length / 2)]?.coord ?? showTrip.center,
      day: d.day, km: d.km, color: d.color,
    }));
  } else if (trips.length) {
    // World overview — just markers for each trip center
    spots = trips.filter(t => t.center).map((t, i) => ({
      n: i + 1, coord: t.center, color: PA.blue, size: 28,
    }));
    if (spots.length) { center = spots[0].coord; zoom = 5; }
  }

  const sp = selectedSpot !== null && showTrip
    ? showTrip.itinerary.flatMap(d => d.spots)[selectedSpot]
    : null;

  const activeDay = selectedDay !== null && showTrip
    ? showTrip.itinerary.find(d => d.day === selectedDay)
    : null;

  return (
    <div style={{ flex: 1, position: 'relative', height: '100vh' }}>
      <PathlyMap
        key={`${currentTrip?.id ?? 'none'}-${selectedDay ?? 'all'}`}
        center={center} zoom={zoom}
        spots={spots} route={routes} dayPills={dayPills}
        interactive={true}
        selectedIdx={selectedSpot}
        onMarkerClick={onSelectSpot}
      />

      {/* Filter chips (when trip open) */}
      {showTrip && (
        <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8, flexWrap: 'wrap', zIndex: 10 }}>
          {[
            { label: 'All', color: PA.black, day: null },
            ...showTrip.itinerary.map(d => ({ label: `Day ${d.day}`, color: d.color, day: d.day })),
          ].map((c, i) => (
            <button
              key={i}
              onClick={() => onSelectSpot(null, c.day)}
              style={{
                padding: '8px 16px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
                background: selectedDay === c.day ? c.color : '#fff',
                color: selectedDay === c.day ? '#fff' : PA.ink,
                border: 'none', cursor: 'pointer',
                boxShadow: `0 4px 14px rgba(15,23,42,.10), 0 0 0 1px ${PA.hairline2}`,
              }}
            >{c.label}</button>
          ))}
        </div>
      )}

      {/* Selected spot popup */}
      {sp && activeDay && (
        <div
          className="anim-slideUp"
          style={{
            position: 'absolute', bottom: 24, right: 24, width: 340,
            background: '#fff', borderRadius: 20, padding: 14,
            boxShadow: `0 12px 40px rgba(15,23,42,.18), 0 0 0 1px ${PA.hairline}`,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
              <img src={sp.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em', lineHeight: 1.2 }}>{sp.name}</div>
              <div style={{ marginTop: 4 }}><Stars rating={sp.rating ?? 4.5} count={sp.ratings ?? '10,000'} size={12} /></div>
            </div>
            <button
              onClick={() => onSelectSpot(null)}
              style={{ all: 'unset', cursor: 'pointer', padding: 4 }}
            >
              <Ic.close size={16} color={PA.muted} />
            </button>
          </div>

          <div style={{ marginBottom: 10 }}><CategoryPill label={sp.cat} color={sp.catColor} /></div>
          <div style={{ color: PA.muted, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{sp.desc}</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
              background: '#fff', boxShadow: `0 0 0 1px ${PA.hairline2}`, border: 'none', cursor: 'pointer',
            }}>
              <Ic.bookmark size={14} /> Save
            </button>
            <button
              onClick={() => sp.coord && window.open(`https://www.google.com/maps/dir/?api=1&destination=${sp.coord[0]},${sp.coord[1]}`, '_blank')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px', borderRadius: 9999, fontWeight: 700, fontSize: 13,
                background: PA.black, color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              <Ic.route size={14} color="#fff" /> Directions
            </button>
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {!showTrip && !trips.length && (
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

/* ────────────────────────────────────────
   HOME panel (left side)
──────────────────────────────────────── */
function HomePanel({ trips, onOpenTrip, onCreateTrip, onDeleteTrip, favorites = [], onToggleFavorite }) {
  const [menuOpen, setMenuOpen] = useState(null);
  const [showFavs, setShowFavs] = useState(false);
  const favTrips = trips.filter(t => favorites.includes(t.id));
  const visibleTrips = showFavs ? favTrips : trips;

  return (
    <div style={{ padding: '22px 22px 40px' }}>
      {trips.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>✈️</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: PA.ink }}>Ready to explore?</div>
          <div style={{ color: PA.muted, fontSize: 15 }}>Create your first AI-powered trip itinerary.</div>
          <button
            onClick={onCreateTrip}
            style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 9999, fontWeight: 700, fontSize: 15,
              background: PA.black, color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,.16)',
            }}
          >
            <Ic.sparkle size={18} color="#fff" /> Create your first trip
          </button>
        </div>
      )}

      {trips.length > 0 && (
        <>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {visibleTrips.length === 0 && showFavs && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: PA.muted, fontSize: 14 }}>
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
                  <div style={{ width: 68, height: 68, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                    <img src={t.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25, letterSpacing: '-.01em' }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: PA.chip, padding: '3px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600, color: PA.chipText }}>
                        <Ic.cal size={12} /> {t.days}d
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: PA.chip, padding: '3px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600, color: PA.chipText }}>
                        <Ic.pinBlue size={12} /> {t.totalSpots} spots
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button
                      onClick={e => { e.stopPropagation(); onToggleFavorite?.(t.id); }}
                      style={{ all: 'unset', padding: 8, cursor: 'pointer' }}
                      title={favorites.includes(t.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Ic.bookmark size={16} color={favorites.includes(t.id) ? PA.blue : PA.muted} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === t.id ? null : t.id); }}
                      style={{ all: 'unset', padding: 8, cursor: 'pointer' }}
                    >
                      <Ic.menu3 size={18} color={PA.muted} />
                    </button>
                  </div>
                </Card>
                {menuOpen === t.id && (
                  <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,23,42,.12)', marginTop: 4 }}>
                    <button onClick={() => { onOpenTrip(t); setMenuOpen(null); }} style={{ all: 'unset', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: PA.ink, fontWeight: 600, fontSize: 14, cursor: 'pointer', borderBottom: `1px solid ${PA.hairline}` }}>
                      <Ic.map size={15} color={PA.blue} /> Open trip
                    </button>
                    <button onClick={() => { onDeleteTrip(t.id); setMenuOpen(null); }} style={{ all: 'unset', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: PA.red, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                      <Ic.trash size={15} color={PA.red} /> Delete trip
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Create new */}
            <button onClick={onCreateTrip} style={{
              all: 'unset', cursor: 'pointer',
              border: `1.5px dashed ${PA.hairline2}`, borderRadius: PA.rCard, padding: '18px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: PA.muted, fontWeight: 600, fontSize: 14,
            }}>
              <Ic.plus size={17} color={PA.muted} /> Create New Trip
            </button>
          </div>
        </>
      )}

      {/* Trending (photo cards) */}
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Trending</div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -22px', padding: '0 22px 8px', scrollbarWidth: 'none' }}>
        {TRENDING.map((t, i) => (
          <button
            key={i}
            onClick={() => onCreateTrip({ prefill: `${t.city}, ${t.country}`, flag: t.flag })}
            style={{
              all: 'unset', cursor: 'pointer',
              flexShrink: 0, width: 140, height: 180,
              borderRadius: 18, overflow: 'hidden', position: 'relative',
              boxShadow: '0 4px 14px rgba(15,23,42,.12)',
              display: 'block',
            }}
          >
            <img src={t.img} alt={t.city} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
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
    </div>
  );
}

/* ────────────────────────────────────────
   TRIP DETAIL panel (left side)
──────────────────────────────────────── */
function TripPanel({ trip, onOpenPlace, selectedDay, onSelectDay, selectedSpot, onSelectSpot }) {
  const day = trip.itinerary.find(d => d.day === selectedDay) ?? trip.itinerary[0];

  return (
    <div>
      {/* Trip header */}
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${PA.hairline}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 78, height: 78, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
            <img src={trip.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 6 }}>{trip.title}</div>
            <div style={{ color: PA.muted, fontSize: 13.5, fontWeight: 600 }}>{trip.days} days · {trip.totalSpots} spots</div>
            <div style={{ marginTop: 8 }}><BronzeBadge size={20} /></div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {trip.itinerary.map(d => (
            <PillTab key={d.day} active={selectedDay === d.day} color={d.color} onClick={() => onSelectDay(d.day)}>
              Day {d.day}
            </PillTab>
          ))}
        </div>
      </div>

      {/* Day timeline */}
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
                  background: selectedSpot === i ? day.color : '#F1F2EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12,
                  color: selectedSpot === i ? '#fff' : PA.muted,
                  transition: 'all .15s',
                }}>{sp.n}</div>

                <Card
                  padding={11}
                  onClick={() => { onSelectSpot(i); onOpenPlace && onOpenPlace(sp, day); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: `2px solid ${selectedSpot === i ? day.color : 'transparent'}`,
                    transition: 'border .15s',
                  }}
                >
                  <div style={{ width: 58, height: 58, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                    <img src={sp.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Ic.diamond size={13} /> {sp.name}
                    </div>
                    <CategoryPill label={sp.cat} color={sp.catColor} />
                  </div>
                </Card>
              </div>

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

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 9999, fontWeight: 700, fontSize: 13, color: PA.blue, border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer' }}>
              <Ic.routeAlt size={15} color={PA.blue} /> Optimize Route
            </button>
            <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 9999, fontWeight: 700, fontSize: 13, color: PA.muted, border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer' }}>
              <Ic.cal size={15} color={PA.muted} /> Choose Dates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   CREATE FLOW panel (left side)
──────────────────────────────────────── */
import { CreateWhere, CreateWhen, CreateInterests, BuildingScreen } from '../screens/CreateFlow.jsx';

function CreatePanel({ step, createData, onNext, onBack, onClose, onDone, onError }) {
  if (step === 'where') return (
    <CreateWhere prefill={createData.prefill ?? ''} onNext={onNext} onClose={onClose} />
  );
  if (step === 'when') return (
    <CreateWhen city={createData.city} flag={createData.flag} onBack={onBack} onClose={onClose}
      onNext={({ days, dateRange }) => onNext({ days, dateRange })} />
  );
  if (step === 'interests') return (
    <CreateInterests city={createData.city} flag={createData.flag} days={createData.days}
      onBack={onBack} onClose={onClose}
      onBuild={interests => onNext({ interests })} />
  );
  if (step === 'building') return (
    <BuildingScreen city={createData.city} days={createData.days} interests={createData.interests ?? []}
      onDone={onDone} onError={onError} />
  );
  return null;
}

/* ════════════════════════════════════════
   ROOT DESKTOP LAYOUT
════════════════════════════════════════ */
export function DesktopLayout({ trips, onSaveTrip, onDeleteTrip, onSettings, favorites = [], onToggleFavorite }) {
  // Navigation state
  const [view, setView] = useState('home');       // home | trip | create
  const [createStep, setCreateStep] = useState('where'); // where | when | interests | building
  const [createData, setCreateData] = useState({});
  const [currentTrip, setCurrentTrip] = useState(null);

  // Map interaction
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);

  const openTrip = trip => {
    setCurrentTrip(trip);
    setSelectedDay(trip.itinerary[0]?.day ?? null);
    setSelectedSpot(null);
    setView('trip');
  };

  const startCreate = (opts = {}) => {
    setCreateData({ prefill: opts.prefill ?? '', flag: opts.flag ?? '' });
    setCreateStep('where');
    setView('create');
  };

  const handleCreateNext = data => {
    setCreateData(d => ({ ...d, ...data }));
    if (createStep === 'where')     setCreateStep('when');
    else if (createStep === 'when') setCreateStep('interests');
    else if (createStep === 'interests') setCreateStep('building');
  };

  const handleCreateBack = () => {
    if (createStep === 'when')      setCreateStep('where');
    else if (createStep === 'interests') setCreateStep('when');
    else if (createStep === 'building')  setCreateStep('interests');
    else setView('home');
  };

  const handleTripDone = trip => {
    onSaveTrip(trip);
    openTrip(trip);
  };

  const handleError = _msg => {
    setView('home');
  };

  const handleSpotSelect = (idx, dayOverride) => {
    setSelectedSpot(idx);
    if (dayOverride !== undefined) setSelectedDay(dayOverride);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: PA.font, overflow: 'hidden' }}>
      {/* LEFT PANEL */}
      <Sidebar
        topbar={
          <SidebarTopbar
            showBack={view === 'trip' || view === 'create'}
            onBack={() => { setView('home'); setCurrentTrip(null); setSelectedSpot(null); }}
            onHome={() => { setView('home'); setCurrentTrip(null); setSelectedSpot(null); }}
            onNewTrip={view === 'home' ? startCreate : undefined}
            onSettings={onSettings}
            title={view === 'create' ? 'Create Trip' : view === 'trip' && currentTrip ? currentTrip.city : undefined}
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
          />
        )}
        {view === 'trip' && currentTrip && (
          <TripPanel
            trip={currentTrip}
            selectedDay={selectedDay}
            onSelectDay={d => { setSelectedDay(d); setSelectedSpot(null); }}
            selectedSpot={selectedSpot}
            onSelectSpot={idx => setSelectedSpot(idx)}
            onOpenPlace={null}
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
            onError={handleError}
          />
        )}
      </Sidebar>

      {/* RIGHT PANEL — MAP */}
      <MapPanel
        trips={trips}
        currentTrip={currentTrip}
        selectedDay={selectedDay}
        selectedSpot={selectedSpot}
        onSelectSpot={handleSpotSelect}
      />
    </div>
  );
}
