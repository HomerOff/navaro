/**
 * TripOverview, DayDetail, PlaceDetail — all trip-level screens.
 */
import { useState } from 'react';
import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { PathlyMap } from '../components/PathlyMap.jsx';
import { Card, CircBtn, PillTab, DayPill, CategoryPill, BronzeBadge, Stars } from '../components/ui/atoms.jsx';
import { buildRoute } from '../services/ai.js';

/* ── shared trip header (used in overview & day detail) ── */
function TripHeader({ trip, activeTab, onTabChange }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 68, height: 68, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
          <img src={trip.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em', lineHeight: 1.2 }}>{trip.title}</div>
          <div style={{ color: PA.muted, fontSize: 13.5, fontWeight: 600, marginTop: 5 }}>
            {trip.days} days · {trip.totalSpots} spots
          </div>
          <div style={{ marginTop: 6 }}><BronzeBadge size={20} /></div>
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        <PillTab
          active={activeTab === -1} onClick={() => onTabChange(-1)}
          icon={<Ic.map size={14} color={activeTab === -1 ? '#fff' : PA.chipText} />}
        >Overview</PillTab>
        {trip.itinerary.map(d => (
          <PillTab key={d.day} active={activeTab === d.day} color={d.color} onClick={() => onTabChange(d.day)}>
            Day {d.day}
          </PillTab>
        ))}
      </div>
    </>
  );
}

/* ════════════════════════════════════════
   TRIP OVERVIEW
════════════════════════════════════════ */
export function TripOverview({ trip, onBack, onOpenDay, activeTab, onTabChange }) {
  const allSpots = trip.itinerary.flatMap(d =>
    d.spots.filter(s => s.coord).map(s => ({ n: s.n, coord: s.coord, color: d.color, size: 28 }))
  );
  const allRoutes = trip.itinerary.map(d => ({ coords: buildRoute(d.spots), color: d.color }));
  const dayPills = trip.itinerary.map(d => ({
    at: d.spots[Math.floor(d.spots.length / 2)]?.coord ?? trip.center,
    day: d.day, km: d.km, color: d.color,
  }));

  return (
    <div style={{ minHeight: '100%', fontFamily: PA.font, color: PA.ink, background: '#fff' }} className="anim-slideUp">
      {/* Map */}
      <div style={{ position: 'relative', height: 340, overflow: 'hidden', background: '#E8ECEA' }}>
        <PathlyMap center={trip.center} zoom={12} spots={allSpots} route={allRoutes} dayPills={dayPills} interactive={true} />
        <div style={{ position: 'absolute', top: 'max(52px,env(safe-area-inset-top))', left: 16 }}>
          <CircBtn size={42} onClick={onBack}><Ic.back size={20} /></CircBtn>
        </div>
        <div style={{ position: 'absolute', top: 'max(52px,env(safe-area-inset-top))', right: 16 }}>
          <CircBtn size={42}><Ic.share size={18} /></CircBtn>
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 44, height: 5, borderRadius: 9999, background: 'rgba(0,0,0,.18)' }} />
      </div>

      {/* Sheet */}
      <div style={{ background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -18, padding: '16px 16px 100px' }}>
        <TripHeader trip={trip} activeTab={activeTab} onTabChange={onTabChange} />

        {/* Day cards */}
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
                    <img src={s.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 9999, fontWeight: 700, fontSize: 14, color: PA.blue,
            border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer',
          }}>
            <Ic.routeAlt size={17} color={PA.blue} /> Optimize Route
          </button>
          <button style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 9999, fontWeight: 700, fontSize: 14, color: PA.muted,
            border: `1.5px dashed ${PA.hairline2}`, background: '#fff', cursor: 'pointer',
          }}>
            <Ic.cal size={17} color={PA.muted} /> Choose Dates
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   DAY DETAIL
════════════════════════════════════════ */
export function DayDetail({ trip, day, onBack, onOpenPlace, activeTab, onTabChange }) {
  const spots = day.spots.filter(s => s.coord).map(s => ({ n: s.n, coord: s.coord, color: day.color, size: 30 }));
  const route = [{ coords: buildRoute(day.spots), color: day.color, weight: 6 }];

  return (
    <div style={{ minHeight: '100%', fontFamily: PA.font, color: PA.ink, background: '#fff' }} className="anim-slideUp">
      {/* Map */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden', background: '#E8ECEA' }}>
        <PathlyMap center={day.spots[0]?.coord ?? trip.center} zoom={13} spots={spots} route={route} interactive={true} />
        <div style={{ position: 'absolute', top: 'max(52px,env(safe-area-inset-top))', left: 16 }}>
          <CircBtn size={42} onClick={onBack}><Ic.back size={20} /></CircBtn>
        </div>
        <div style={{ position: 'absolute', top: 'max(52px,env(safe-area-inset-top))', right: 16 }}>
          <CircBtn size={42}><Ic.share size={18} /></CircBtn>
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 44, height: 5, borderRadius: 9999, background: 'rgba(0,0,0,.18)' }} />
      </div>

      {/* Sheet */}
      <div style={{ background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -18, padding: '16px 16px 40px' }}>
        <TripHeader trip={trip} activeTab={activeTab} onTabChange={onTabChange} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 2px 12px' }}>
          <div style={{ color: PA.muted, fontWeight: 700, fontSize: 15 }}>{day.city}</div>
          <div style={{ color: PA.muted, fontSize: 13 }}>{day.km}km · {day.spots.length} spots</div>
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: 34 }}>
          <div style={{ position: 'absolute', left: 13, top: 18, bottom: 18, borderLeft: `2px dashed ${PA.hairline2}` }} />

          {day.spots.map((sp, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              {/* Number node */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -34, top: 18,
                  width: 24, height: 24, borderRadius: '50%', background: '#F1F2EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12, color: PA.muted,
                }}>{sp.n}</div>

                <Card padding={10} onClick={() => onOpenPlace(sp, day)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
                    <img src={sp.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15.5, marginBottom: 6 }}>
                      <Ic.diamond size={13} /> {sp.name}
                    </div>
                    <CategoryPill label={sp.cat} color={sp.catColor} />
                  </div>
                  <Ic.chevR size={16} color={PA.muted} />
                </Card>
              </div>

              {/* Travel pill */}
              {sp.travel && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff',
                    padding: '7px 12px', borderRadius: 9999,
                    border: `1px solid ${PA.hairline2}`, fontSize: 13, fontWeight: 600,
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%', background: day.color,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ic.walk size={13} color="#fff" />
                    </span>
                    {sp.travel.t} · {sp.travel.d}
                  </div>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: day.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 10px ${day.color}55`,
                  }}>
                    <Ic.headph size={17} color="#fff" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   PLACE DETAIL
════════════════════════════════════════ */
export function PlaceDetail({ spot, day, trip, onBack }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => setSaved(s => !s);
  const handleDirection = () => {
    if (spot.coord) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.coord[0]},${spot.coord[1]}`, '_blank');
    }
  };

  return (
    <div style={{ minHeight: '100%', fontFamily: PA.font, color: PA.ink, background: '#fff' }} className="anim-slideUp">
      {/* Map */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden', background: '#E8ECEA' }}>
        {spot.coord && (
          <PathlyMap
            center={spot.coord} zoom={15}
            spots={[{ n: spot.n, coord: spot.coord, color: day.color, size: 32 }]}
          />
        )}
        <div style={{ position: 'absolute', top: 'max(52px,env(safe-area-inset-top))', left: 16 }}>
          <CircBtn size={42} onClick={onBack}><Ic.back size={20} /></CircBtn>
        </div>
      </div>

      {/* Sheet */}
      <div style={{ background: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -22, padding: '18px 16px 110px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: PA.chip }}>
            <img src={spot.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', lineHeight: 1.15 }}>{spot.name}</div>
            <div style={{ marginTop: 6, display: 'inline-flex', padding: '4px 10px', background: '#F4F5F2', borderRadius: 9999 }}>
              <Stars rating={spot.rating ?? 4.5} count={spot.ratings ?? '10,000'} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <CategoryPill label={spot.cat} color={spot.catColor} />
        </div>

        {/* Photo + about */}
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div style={{ borderRadius: 14, overflow: 'hidden', height: 172, marginBottom: 12, background: PA.chip }}>
            <img src={spot.big} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          </div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em', marginBottom: 6 }}>About this place</div>
          <div style={{ color: PA.muted, fontSize: 14.5, lineHeight: 1.5 }}>{spot.desc}</div>
        </Card>

        {/* Community notes */}
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              background: PA.amber, color: '#fff', fontWeight: 700, fontSize: 13,
              padding: '4px 10px', borderRadius: 8,
            }}>Notes</div>
            <span style={{ color: PA.amber, fontWeight: 700, fontSize: 15 }}>from the Community</span>
          </div>
          <div style={{ color: PA.inkSoft, fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
            Best visited in the morning to avoid crowds. Check entry requirements before your visit and consider booking tickets in advance for popular times.
          </div>
          <div style={{
            marginTop: 10, color: PA.muted, fontWeight: 700, fontSize: 13,
            display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          }}>
            Read More <Ic.chevR size={13} color={PA.muted} />
          </div>
        </Card>

        {/* Info rows */}
        <Card padding={4} style={{ marginBottom: 12 }}>
          {[
            { icon: <Ic.cal size={18} color={PA.green} />, label: <span style={{ color: PA.green, fontWeight: 700 }}>Open</span>, val: 'Closes at 6 PM', end: <Ic.chevR size={14} color={PA.muted} /> },
            { icon: <Ic.pin size={18} color={PA.muted} />, label: 'Location', val: `${spot.name}, ${trip.city}`, end: <Ic.copy size={14} color={PA.muted} /> },
            { icon: <Ic.globe size={18} color={PA.muted} />, label: 'Website', val: 'Visit website', end: <Ic.externalLink size={14} color={PA.muted} />, onClick: () => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(spot.name)}`, '_blank') },
            { icon: <Ic.phone size={18} color={PA.muted} />, label: 'Phone', val: 'View contact', end: <Ic.chevR size={14} color={PA.muted} /> },
          ].map((row, i) => (
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
              <div style={{ flex: 1, color: PA.ink, fontSize: 13, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.val}</div>
              {row.end}
            </div>
          ))}
        </Card>
      </div>

      {/* Floating bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '12px 16px', paddingBottom: 'max(18px,env(safe-area-inset-bottom))',
        background: 'linear-gradient(to top,rgba(255,255,255,1) 65%,rgba(255,255,255,0))',
        pointerEvents: 'none', zIndex: 50,
      }}>
        <button
          onClick={handleSave}
          style={{
            pointerEvents: 'all',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 9999, fontWeight: 700, fontSize: 14,
            background: '#fff',
            boxShadow: `0 6px 14px rgba(0,0,0,.10), 0 0 0 1px ${PA.hairline2}`,
            border: 'none', cursor: 'pointer',
            color: saved ? PA.blue : PA.ink,
          }}
        >
          <Ic.bookmark size={16} color={saved ? PA.blue : 'currentColor'} />
          {saved ? 'Saved' : 'Save'}
        </button>

        <button
          onClick={handleDirection}
          style={{
            pointerEvents: 'all',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 9999, fontWeight: 700, fontSize: 14,
            background: '#fff',
            boxShadow: `0 6px 14px rgba(0,0,0,.10), 0 0 0 1px ${PA.hairline2}`,
            border: 'none', cursor: 'pointer', color: PA.ink,
          }}
        >
          <Ic.route size={16} /> Directions
        </button>

        <button
          style={{
            pointerEvents: 'all',
            width: 48, height: 48, borderRadius: '50%', background: PA.black,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 18px rgba(0,0,0,.25)', border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Ic.plus size={20} color="#fff" />
        </button>
      </div>
    </div>
  );
}
