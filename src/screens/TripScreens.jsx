/**
 * TripOverview, DayDetail, PlaceDetail — all trip-level screens.
 */
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { PathlyMap } from '../components/PathlyMap.jsx';
import { Card, PillTab, DayPill, CategoryPill, Stars, Spinner, DateBadge, ImgWithFallback } from '../components/ui/atoms.jsx';
import { buildRoute, optimizeDayAI } from '../services/ai.js';
import { storage } from '../services/storage.js';

/* ── Floating back bar — rendered via portal to escape all stacking contexts ── */
function FloatingBackBar({ onBack, children }) {
  return createPortal(
    <div style={{
      position: 'fixed',
      top: 'max(12px,env(safe-area-inset-top))',
      left: 16,
      right: 16,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      pointerEvents: 'none',
    }}>
      <button
        onClick={onBack}
        style={{
          pointerEvents: 'all',
          width: 42, height: 42, borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 12px rgba(15,23,42,0.15), 0 0 0 1px rgba(15,23,42,0.06)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ic.back size={20} color="#111" />
      </button>
      {children && (
        <div style={{
          pointerEvents: 'all',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 9999,
          padding: '8px 14px',
          boxShadow: '0 2px 12px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.06)',
          flex: 1, minWidth: 0,
        }}>
          {children}
        </div>
      )}
    </div>,
    document.body
  );
}

/* ── Shared trip header ───────────────── */
function TripHeader({ trip, activeTab, onTabChange, _onOpenDay, hideInfo }) {
  const singleDay = trip.itinerary.length === 1;
  return (
    <>
      {!hideInfo && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 68, height: 68, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
            <ImgWithFallback src={trip.cover} alt={trip.title} imgQuery={`${trip.city} travel`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em', lineHeight: 1.2 }}>{trip.title}</div>
            <div style={{ color: PA.muted, fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>
              {trip.days} days · {trip.totalSpots} spots
            </div>
            {trip.dateRange?.start && (
              <div style={{ marginTop: 5 }}>
                <DateBadge dateRange={trip.dateRange} />
              </div>
            )}
          </div>
        </div>
      )}
      {/* Hide day tabs when there's only one day — Overview is the only option */}
      {!singleDay && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <PillTab
            active={activeTab === -1} onClick={() => onTabChange(-1)}
            icon={<Ic.map size={14} color={activeTab === -1 ? '#fff' : PA.chipText} />}
          >Overview</PillTab>
          {trip.itinerary.map(d => (
            <PillTab
              key={d.day}
              active={activeTab === d.day}
              color={d.color}
              onClick={() => onTabChange(d.day)}
            >
              Day {d.day}
            </PillTab>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Choose Dates modal ───────────────── */
function ChooseDatesModal({ trip, onSave, onClose }) {
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
    if (val) {
      // Auto-set end date, but only if end is empty or was previously auto-set
      setEnd(autoEnd(val));
    } else {
      setEnd('');
    }
  };

  const computedDays = (() => {
    if (start && end) {
      const diff = Math.round((new Date(end) - new Date(start)) / 86400000);
      return Math.max(1, diff + 1);
    }
    return null;
  })();

  return (
    <div
      className="anim-fadeIn"
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', fontFamily: PA.font,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="anim-slideUp"
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '0 20px max(28px,env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: '#E5E7EB' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Choose Dates</div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', padding: 6 }}>
            <Ic.close size={20} color={PA.muted} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: PA.muted, marginBottom: 6 }}>Start date</div>
            <input
              type="date" min={today} value={start}
              onChange={e => { handleStartChange(e.target.value); }}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 14,
                border: `1.5px solid ${start ? PA.blue : PA.hairline2}`,
                fontSize: 16, fontFamily: PA.font, color: PA.ink, outline: 'none', background: '#fff',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: PA.muted, marginBottom: 6 }}>End date</div>
            <input
              type="date" min={start || today} value={end}
              onChange={e => setEnd(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 14,
                border: `1.5px solid ${end ? PA.blue : PA.hairline2}`,
                fontSize: 16, fontFamily: PA.font, color: PA.ink, outline: 'none', background: '#fff',
              }}
            />
          </div>
          {computedDays && (
            <div style={{
              padding: '10px 14px', borderRadius: 12, background: PA.blueSoft,
              color: PA.blueDeep, fontWeight: 700, fontSize: 14, textAlign: 'center',
            }}>
              {computedDays} days selected
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {trip.dateRange?.start && (
            <button
              onClick={() => onSave(null)}
              style={{
                flex: 1, padding: '13px', borderRadius: 9999, fontWeight: 700, fontSize: 14,
                background: PA.chip, color: PA.muted, border: 'none', cursor: 'pointer',
              }}
            >Clear</button>
          )}
          <button
            onClick={() => onSave(start && end ? { start, end } : start ? { start } : null)}
            disabled={!start}
            style={{
              flex: 2, padding: '13px', borderRadius: 9999, fontWeight: 700, fontSize: 14,
              background: start ? PA.black : PA.muted, color: '#fff', border: 'none',
              cursor: start ? 'pointer' : 'default',
            }}
          >Save Dates</button>
        </div>
      </div>
    </div>
  );
}

/* ── Optimize Route modal ─────────────── */
function OptimizeModal({ trip, day, onDone, onClose }) {
  const [wishes, setWishes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const handleOptimize = async () => {
    if (!wishes.trim()) return;
    setLoading(true);
    setError('');
    abortRef.current = new AbortController();
    try {
      const newDay = await optimizeDayAI(trip, day, wishes.trim(), abortRef.current.signal);
      onDone(newDay);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="anim-fadeIn"
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', fontFamily: PA.font,
      }}
      onClick={e => { if (e.target === e.currentTarget) { abortRef.current?.abort(); onClose(); } }}
    >
      <div
        className="anim-slideUp"
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '0 20px max(28px,env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: '#E5E7EB' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Optimize Day {day.day}</div>
          <button onClick={() => { abortRef.current?.abort(); onClose(); }} style={{ all: 'unset', cursor: 'pointer', padding: 6 }}>
            <Ic.close size={20} color={PA.muted} />
          </button>
        </div>

        <div style={{ color: PA.muted, fontSize: 14, marginBottom: 14, lineHeight: 1.5 }}>
          Tell the AI how you'd like to change this day's plan — swap places, add a theme, change the pace, etc.
        </div>

        <textarea
          value={wishes}
          onChange={e => setWishes(e.target.value)}
          placeholder="e.g. More food spots, skip museums, end near the waterfront…"
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '13px 14px', borderRadius: 14, resize: 'none',
            border: `1.5px solid ${wishes ? PA.blue : PA.hairline2}`,
            fontSize: 15, fontFamily: PA.font, color: PA.ink,
            outline: 'none', background: '#fff', marginBottom: 14,
          }}
        />

        {error && (
          <div style={{ color: PA.red, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={handleOptimize}
          disabled={!wishes.trim() || loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 9999, fontWeight: 700, fontSize: 15,
            background: wishes.trim() && !loading ? PA.black : PA.muted,
            color: '#fff', border: 'none',
            cursor: wishes.trim() && !loading ? 'pointer' : 'default',
            marginBottom: 4,
          }}
        >
          {loading ? <><Spinner size={18} color="#fff" /> Replanning…</> : <><Ic.sparkle size={18} color="#fff" /> Replan this day</>}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   TRIP OVERVIEW
════════════════════════════════════════ */
export function TripOverview({ trip, onBack, onOpenDay, onTripUpdate, onOpenPlace, _onHome, onShare }) {
  const [activeTab, setActiveTab] = useState(-1);
  const [showDates, setShowDates] = useState(false);
  const [selectedSpotIdx, setSelectedSpotIdx] = useState(null);

  // Flat list of all spots with day reference for marker click
  const allSpotsFlat = trip.itinerary.flatMap(d =>
    d.spots.filter(s => s.coord).map(s => ({ spot: s, day: d }))
  );

  const allSpots = allSpotsFlat.map(({ spot, day }) => ({
    n: spot.n, coord: spot.coord, color: day.color, size: 28,
  }));
  const allRoutes = trip.itinerary.map(d => ({ coords: buildRoute(d.spots), color: d.color }));
  const dayPills = trip.itinerary.map(d => ({
    at: d.spots[Math.floor(d.spots.length / 2)]?.coord ?? trip.center,
    day: d.day, km: d.km, color: d.color,
  }));

  const handleTabChange = tab => {
    setActiveTab(tab);
    setSelectedSpotIdx(null);
  };

  const handleMarkerClick = idx => {
    if (idx === null) return;
    setSelectedSpotIdx(idx === selectedSpotIdx ? null : idx);
    // Open the place detail for this marker
    const item = allSpotsFlat[idx];
    if (item && onOpenPlace) {
      onOpenPlace(item.spot, item.day);
    }
  };

  const handleSaveDates = dateRange => {
    const updated = { ...trip, dateRange };
    storage.updateTrip(updated);
    onTripUpdate?.(updated);
    setShowDates(false);
  };

  // Filtered spots/routes for active tab
  const visibleSpots = activeTab === -1 ? allSpots : (() => {
    const d = trip.itinerary.find(d => d.day === activeTab);
    return d ? d.spots.filter(s => s.coord).map(s => ({ n: s.n, coord: s.coord, color: d.color, size: 28 })) : [];
  })();
  const visibleRoutes = activeTab === -1 ? allRoutes : (() => {
    const d = trip.itinerary.find(d => d.day === activeTab);
    return d ? [{ coords: buildRoute(d.spots), color: d.color }] : [];
  })();

  return (
    <>
      {/* Floating back button via portal — above everything including map */}
      <FloatingBackBar onBack={onBack} />

      <div style={{ minHeight: '100dvh', fontFamily: PA.font, color: PA.ink, background: '#fff' }} className="anim-slideUp">
        {/* Map */}
        <div style={{ position: 'relative', height: 320, background: '#E8ECEA' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <PathlyMap
              center={trip.center} zoom={12}
              spots={visibleSpots}
              route={visibleRoutes}
              dayPills={activeTab === -1 ? dayPills : []}
              interactive={true}
              autoFit={true}
              selectedIdx={selectedSpotIdx}
              onMarkerClick={handleMarkerClick}
            />
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 44, height: 5, borderRadius: 9999, background: 'rgba(0,0,0,.18)' }} />
        </div>

        {/* Sheet */}
        <div style={{ background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '0 16px 32px', boxShadow: '0 -4px 20px rgba(0,0,0,.06)' }}>
          {/* Sticky tabs */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '24px 24px 0 0',
            padding: '16px 0 10px',
          }}>
            <TripHeader trip={trip} activeTab={activeTab} onTabChange={handleTabChange} onOpenDay={null} />
          </div>

          {/* Overview: all day cards */}
          {activeTab === -1 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trip.itinerary.map(d => (
                <Card key={d.day} padding={14} onClick={() => onOpenDay(d.day)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <DayPill day={d.day} color={d.color} />
                      <div style={{ fontWeight: 700, fontSize: 15.5 }}>{d.city}</div>
                    </div>
                    <div style={{ color: PA.muted, fontSize: 13, fontWeight: 600 }}>{d.km}km · {d.spots.length} spots</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {d.spots.slice(0, 5).map((s, i) => (
                      <div key={i} style={{ flex: 1, aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: PA.chip }}>
                        <ImgWithFallback src={s.img} alt={s.name} imgQuery={s.imgQuery} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Day view: timeline for selected day */}
          {activeTab !== -1 && (() => {
            const d = trip.itinerary.find(day => day.day === activeTab);
            if (!d) return null;
            return (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ color: PA.muted, fontWeight: 700, fontSize: 15 }}>{d.city}</div>
                  <div style={{ color: PA.muted, fontSize: 13 }}>{d.km}km · {d.spots.length} spots</div>
                </div>

                {/* Timeline */}
                <div style={{ position: 'relative', paddingLeft: 34 }}>
                  <div style={{ position: 'absolute', left: 13, top: 18, bottom: 18, borderLeft: `2px dashed ${PA.hairline2}` }} />
                  {d.spots.map((sp, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: -34, top: 18,
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#F1F2EE',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 12, color: PA.muted,
                        }}>{sp.n}</div>
                        <Card
                          padding={10}
                          onClick={() => onOpenPlace ? onOpenPlace(sp, d) : onOpenDay(d.day)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                        >
                          <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                            <ImgWithFallback src={sp.img} alt={sp.name} imgQuery={sp.imgQuery} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                              <Ic.diamond size={13} /> {sp.name}
                            </div>
                            <CategoryPill label={sp.cat} color={sp.catColor} />
                          </div>
                          <Ic.chevR size={16} color={PA.muted} />
                        </Card>
                      </div>
                      {sp.travel && (
                        <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff',
                            padding: '7px 12px', borderRadius: 9999,
                            border: `1px solid ${PA.hairline2}`, fontSize: 13, fontWeight: 600,
                          }}>
                            <span style={{ width: 24, height: 24, borderRadius: '50%', background: d.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Ic.walk size={14} color="#fff" sw={2.2} />
                            </span>
                            {sp.travel.t} · {sp.travel.d}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onOpenDay(d.day)}
                  style={{
                    marginTop: 14, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 9999, fontWeight: 700, fontSize: 14,
                    color: d.color, border: `1.5px solid ${d.color}44`,
                    background: `${d.color}11`, cursor: 'pointer',
                  }}
                >
                  Open Day {d.day} <Ic.chevR size={16} color={d.color} />
                </button>
              </div>
            );
          })()}

          {/* Bottom actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              onClick={() => setShowDates(true)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px', borderRadius: 9999, fontWeight: 700, fontSize: 14, color: PA.blue,
                border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer',
              }}
            >
              <Ic.cal size={17} color={PA.blue} /> {trip.dateRange?.start ? 'Edit Dates' : 'Choose Dates'}
            </button>
            {onShare && (
              <button
                onClick={onShare}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: 9999, fontWeight: 700, fontSize: 14, color: PA.muted,
                  border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer',
                }}
              >
                <Ic.share size={17} color={PA.muted} /> Share
              </button>
            )}
          </div>
        </div>
      </div>

      {showDates && (
        <ChooseDatesModal trip={trip} onSave={handleSaveDates} onClose={() => setShowDates(false)} />
      )}
    </>
  );
}

/* ════════════════════════════════════════
   DAY DETAIL
════════════════════════════════════════ */
export function DayDetail({ trip, day, onBack, onOpenPlace, onTripUpdate, onOpenDay, _onHome }) {
  const [selectedSpotIdx, setSelectedSpotIdx] = useState(null);
  const [showOptimize, setShowOptimize] = useState(false);

  const spots = day.spots.filter(s => s.coord).map((s, i) => ({
    n: s.n, coord: s.coord, color: day.color, size: 30, _si: i,
  }));
  const route = [{ coords: buildRoute(day.spots), color: day.color, weight: 6 }];

  const handleMarkerClick = idx => {
    setSelectedSpotIdx(idx === selectedSpotIdx ? null : idx);
    if (idx !== null && day.spots[idx]) {
      onOpenPlace?.(day.spots[idx], day);
    }
  };

  const handleOptimizeDone = newDay => {
    const updated = {
      ...trip,
      itinerary: trip.itinerary.map(d => d.day === newDay.day ? newDay : d),
    };
    storage.updateTrip(updated);
    onTripUpdate?.(updated);
    setShowOptimize(false);
  };

  return (
    <>
      {/* Floating back button via portal */}
      <FloatingBackBar onBack={onBack} />

      <div style={{ minHeight: '100dvh', fontFamily: PA.font, color: PA.ink, background: '#fff' }} className="anim-slideUp">
        {/* Map */}
        <div style={{ position: 'relative', height: 300, background: '#E8ECEA' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <PathlyMap
              center={day.spots[0]?.coord ?? trip.center} zoom={13}
              spots={spots} route={route}
              interactive={true}
              autoFit={true}
              selectedIdx={selectedSpotIdx}
              onMarkerClick={handleMarkerClick}
            />
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 44, height: 5, borderRadius: 9999, background: 'rgba(0,0,0,.18)' }} />
        </div>

        {/* Sheet */}
        <div style={{ background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '0 16px 40px', boxShadow: '0 -4px 20px rgba(0,0,0,.06)' }}>
          {/* Sticky tabs */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '24px 24px 0 0',
            padding: '16px 0 10px',
          }}>
            {/* Overview tab goes back to TripOverview; Day tabs switch days */}
            <TripHeader
              trip={trip}
              activeTab={day.day}
              onTabChange={tab => tab === -1 ? onBack() : onOpenDay(tab)}
              onOpenDay={null}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 2px 12px' }}>
            <div style={{ color: PA.muted, fontWeight: 700, fontSize: 15 }}>{day.city}</div>
            <div style={{ color: PA.muted, fontSize: 13 }}>{day.km}km · {day.spots.length} spots</div>
          </div>

          {/* Timeline */}
          <div style={{ position: 'relative', paddingLeft: 34 }}>
            <div style={{ position: 'absolute', left: 13, top: 18, bottom: 18, borderLeft: `2px dashed ${PA.hairline2}` }} />

            {day.spots.map((sp, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: -34, top: 18,
                    width: 24, height: 24, borderRadius: '50%',
                    background: selectedSpotIdx === i ? day.color : '#F1F2EE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 12,
                    color: selectedSpotIdx === i ? '#fff' : PA.muted,
                    transition: 'background .2s, color .2s',
                  }}>{sp.n}</div>

                  <Card
                    padding={10}
                    onClick={() => {
                      setSelectedSpotIdx(i === selectedSpotIdx ? null : i);
                      onOpenPlace(sp, day);
                    }}
                    selected={selectedSpotIdx === i}
                    selectedColor={day.color}
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                      <ImgWithFallback src={sp.img} alt={sp.name} imgQuery={sp.imgQuery} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                        <Ic.diamond size={13} /> {sp.name}
                      </div>
                      <CategoryPill label={sp.cat} color={sp.catColor} />
                    </div>
                    <Ic.chevR size={16} color={PA.muted} />
                  </Card>
                </div>

                {/* Travel pill — no headphones icon */}
                {sp.travel && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff',
                      padding: '7px 12px', borderRadius: 9999,
                      border: `1px solid ${PA.hairline2}`, fontSize: 13, fontWeight: 600,
                    }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%', background: day.color,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ic.walk size={14} color="#fff" sw={2.2} />
                      </span>
                      {sp.travel.t} · {sp.travel.d}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Optimize Route */}
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => setShowOptimize(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px', borderRadius: 9999, fontWeight: 700, fontSize: 14, color: PA.blue,
                border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer',
              }}
            >
              <Ic.routeAlt size={17} color={PA.blue} /> Optimize Route
            </button>
          </div>
        </div>
      </div>

      {showOptimize && (
        <OptimizeModal
          trip={trip}
          day={day}
          onDone={handleOptimizeDone}
          onClose={() => setShowOptimize(false)}
        />
      )}
    </>
  );
}

/* ════════════════════════════════════════
/* ════════════════════════════════════════
   PLACE DETAIL
════════════════════════════════════════ */
export function PlaceDetail({ spot, day, trip, onBack, _onHome }) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [isFav, setIsFav] = useState(() => storage.isSpotFavorite(trip.id, spot));
  const [lightbox, setLightbox] = useState(false);

  const handleToggleFav = () => {
    const next = storage.toggleFavoriteSpot(spot, trip.id, trip.city);
    setIsFav(next);
  };

  const handleDirection = () => {
    if (spot.coord) {
      // Use address directly — most precise for Google Maps
      const query = spot.address || `${spot.name}, ${trip.city}`;
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
        '_blank'
      );
    }
  };

  const handleWebsite = () => {
    window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(spot.name)}`, '_blank');
  };

  const infoRows = [
    spot.hours && {
      icon: <Ic.cal size={18} color={PA.green} />,
      label: <span style={{ color: PA.green, fontWeight: 700 }}>Hours</span>,
      val: spot.hours,
    },
    spot.address && {
      icon: <Ic.pin size={18} color={PA.muted} />,
      label: 'Address',
      val: spot.address,
      end: <Ic.copy size={14} color={PA.muted} />,
      onClick: () => navigator.clipboard?.writeText(spot.address),
    },
    {
      icon: <Ic.globe size={18} color={PA.muted} />,
      label: 'Website',
      val: 'Wikipedia',
      end: <Ic.externalLink size={14} color={PA.muted} />,
      onClick: handleWebsite,
    },
    spot.phone && {
      icon: <Ic.phone size={18} color={PA.muted} />,
      label: 'Phone',
      val: spot.phone,
      end: <Ic.copy size={14} color={PA.muted} />,
      onClick: () => navigator.clipboard?.writeText(spot.phone),
    },
  ].filter(Boolean);

  const fullDesc = spot.descFull || spot.desc;
  const shortDesc = spot.desc;
  const hasMore = fullDesc && fullDesc !== shortDesc;

  // Lightbox — rendered as sibling to avoid stacking context issues
  if (lightbox) {
    return (
      <div
        className="anim-fadeIn"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#000',
          display: 'flex', flexDirection: 'column',
          fontFamily: PA.font,
        }}
      >
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'max(16px,env(safe-area-inset-top)) 16px 12px',
          flexShrink: 0,
        }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {spot.name}
          </div>
          <button
            onClick={() => setLightbox(false)}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,.15)',
              border: 'none', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ic.close size={22} color="#fff" />
          </button>
        </div>

        {/* Image */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
          <img
            src={spot.big}
            alt={spot.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12 }}
          />
        </div>

        <div style={{ height: 'max(16px,env(safe-area-inset-bottom))', flexShrink: 0 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', fontFamily: PA.font, color: PA.ink, background: '#fff' }} className="anim-slideUp">
      {/* Floating back button via portal */}
      <FloatingBackBar onBack={onBack} />

      {/* Map */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: '#E8ECEA' }}>
        {spot.coord && (
          <PathlyMap
            center={spot.coord} zoom={15}
            spots={[{ n: spot.n, coord: spot.coord, color: day.color, size: 32 }]}
            interactive={true}
          />
        )}
      </div>

      {/* Sheet */}
      <div style={{
        background: '#fff',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '20px 16px 20px',
        boxShadow: '0 -4px 20px rgba(0,0,0,.06)',
      }}>
        {/* Place name + rating */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: 8 }}>
            {spot.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', padding: '4px 10px', background: '#F4F5F2', borderRadius: 9999 }}>
              <Stars rating={spot.rating ?? 4.5} count={spot.ratings ?? '10,000'} />
            </div>
            <CategoryPill label={spot.cat} color={spot.catColor} />
          </div>
        </div>

        {/* Photo + about */}
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div
            onClick={() => setLightbox(true)}
            style={{ borderRadius: 14, overflow: 'hidden', height: 172, marginBottom: 12, background: PA.chip, cursor: 'zoom-in', position: 'relative' }}
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
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em', marginBottom: 6 }}>About this place</div>
          <div style={{ color: PA.muted, fontSize: 14.5, lineHeight: 1.6 }}>
            {descExpanded ? fullDesc : shortDesc}
          </div>
          {hasMore && (
            <button
              onClick={() => setDescExpanded(v => !v)}
              style={{
                all: 'unset', cursor: 'pointer',
                marginTop: 8, color: PA.blue, fontWeight: 700, fontSize: 13,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {descExpanded ? 'Show less' : 'Read more'}
              <Ic.chevD size={13} color={PA.blue} style={{ transform: descExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>
          )}
        </Card>

        {/* Info rows */}
        {infoRows.length > 0 && (
          <Card padding={4} style={{ marginBottom: 16 }}>
            {infoRows.map((row, i) => (
              <div
                key={i}
                onClick={row.onClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 12px',
                  borderTop: i ? `1px solid ${PA.hairline}` : 'none',
                  cursor: row.onClick ? 'pointer' : 'default',
                }}
              >
                <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}>{row.icon}</div>
                <div style={{ width: 72, color: PA.muted, fontWeight: 600, fontSize: 13 }}>{row.label}</div>
                <div style={{
                  flex: 1, color: PA.ink, fontSize: 13, textAlign: 'right',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{row.val}</div>
                {row.end && <div style={{ flexShrink: 0 }}>{row.end}</div>}
              </div>
            ))}
          </Card>
        )}

        {/* Action buttons — inline, right below info, not floating */}
        <div style={{
          display: 'flex', gap: 10,
          paddingBottom: 'max(20px,env(safe-area-inset-bottom))',
        }}>
          <button
            onClick={handleToggleFav}
            style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px', borderRadius: 9999, fontWeight: 700, fontSize: 14,
              background: isFav ? PA.blueSoft : '#fff',
              boxShadow: `0 2px 8px rgba(0,0,0,.08), 0 0 0 1px ${PA.hairline2}`,
              border: 'none', cursor: 'pointer',
              color: isFav ? PA.blueDeep : PA.ink,
              transition: 'background .2s, color .2s',
            }}
          >
            <Ic.bookmark size={16} color={isFav ? PA.blue : 'currentColor'} fill={isFav ? PA.blue : 'none'} />
            {isFav ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={handleDirection}
            style={{
              flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px', borderRadius: 9999, fontWeight: 700, fontSize: 14,
              background: PA.black, color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,.18)',
              border: 'none', cursor: 'pointer',
            }}
          >
            <Ic.route size={16} color="#fff" /> Open in Maps
          </button>
        </div>
      </div>
    </div>
  );
}
