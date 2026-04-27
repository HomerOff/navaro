/**
 * CreateFlow — four sub-screens:
 *   CreateWhere → CreateWhen → CreateInterests → BuildingScreen
 */
import { useState, useEffect, useRef } from 'react';
import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { PathlyBg } from '../components/ui/PathlyBg.jsx';
import { Card, CircBtn, Spinner } from '../components/ui/atoms.jsx';
import { TRENDING } from '../data/static.js';
import { generateTripAI } from '../services/ai.js';

/* ════════════════════════════════════════
   STEP 1: WHERE
════════════════════════════════════════ */
export function CreateWhere({ prefill = '', onNext, onClose }) {
  const [query, setQuery] = useState(prefill);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.trim().toLowerCase();
  const filtered = q.length
    ? TRENDING.filter(t => t.city.toLowerCase().includes(q) || t.country.toLowerCase().includes(q))
    : TRENDING;

  const choose = (city, country, flag) => onNext({ city: `${city}, ${country}`, flag });

  // Custom destination when query doesn't match any trending city
  const hasExactMatch = filtered.some(t => t.city.toLowerCase() === q);
  const showCustom = q.length >= 2 && !hasExactMatch;

  return (
    <div style={{ minHeight: '100%', fontFamily: PA.font, color: PA.ink, position: 'relative' }} className="anim-slideUp">
      <PathlyBg tone="mint" />
      <div style={{ position: 'relative', zIndex: 1, padding: '60px 18px 32px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 44, marginBottom: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Create Trip</div>
          <div style={{ position: 'absolute', right: 0 }}>
            <CircBtn size={38} onClick={onClose}><Ic.close size={18} /></CircBtn>
          </div>
        </div>

        <Card padding={20} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-.01em', marginBottom: 14 }}>Where?</div>

          {/* Search input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 14, background: '#F4F5F2', marginBottom: 14,
          }}>
            <Ic.search size={18} color={PA.muted} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && query.trim().length >= 2) {
                  onNext({ city: query.trim(), flag: '🌍' });
                }
              }}
              placeholder="Search any destination..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 15, color: PA.ink, outline: 'none',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ all: 'unset', cursor: 'pointer' }}>
                <Ic.close size={16} color={PA.muted} />
              </button>
            )}
          </div>

          {/* Custom destination CTA */}
          {showCustom && (
            <button
              onClick={() => onNext({ city: query.trim(), flag: '🌍' })}
              style={{
                all: 'unset', width: '100%', cursor: 'pointer', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                background: PA.blueSoft,
                border: `1.5px solid ${PA.blue}55`,
                marginBottom: 14,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: PA.blue,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>✈️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: PA.blueDeep }}>Plan a trip to "{query.trim()}"</div>
                <div style={{ color: PA.blue, fontSize: 13 }}>Use this as my destination</div>
              </div>
              <Ic.chevR size={18} color={PA.blue} />
            </button>
          )}

          {/* List label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: PA.muted, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            <Ic.fire size={14} color={PA.muted} />
            {q ? 'Matching destinations' : 'Trending destinations'}
          </div>

          {/* Destination list */}
          {filtered.map((t, i) => (
            <button
              key={i}
              onClick={() => choose(t.city, t.country, t.flag)}
              style={{
                all: 'unset', width: '100%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderTop: i > 0 ? `1px solid ${PA.hairline}` : 'none',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9, background: '#F4F5F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{t.flag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t.city}</div>
                <div style={{ color: PA.muted, fontSize: 13 }}>{t.country}</div>
              </div>
              <Ic.chevR size={16} color={PA.mutedSoft} />
            </button>
          ))}

          {filtered.length === 0 && !showCustom && (
            <div style={{ textAlign: 'center', color: PA.muted, fontSize: 14, padding: '16px 0' }}>
              No matching cities. Type any destination above.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   STEP 2: WHEN
════════════════════════════════════════ */
export function CreateWhen({ city, flag, onBack, onClose, onNext }) {
  const [mode, setMode] = useState('days'); // 'days' | 'dates'
  const [numDays, setNumDays] = useState(3);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const computedDays = (() => {
    if (mode === 'dates' && startDate && endDate) {
      const diff = Math.round((new Date(endDate) - new Date(startDate)) / 86400000);
      return Math.max(1, Math.min(14, diff + 1));
    }
    return numDays;
  })();

  const canProceed = mode === 'days' || (startDate && endDate && endDate >= startDate);

  const handleNext = () => {
    onNext({ days: computedDays, dateRange: mode === 'dates' ? { start: startDate, end: endDate } : null });
  };

  return (
    <div style={{ minHeight: '100%', fontFamily: PA.font, color: PA.ink, position: 'relative' }} className="anim-slideUp">
      <PathlyBg tone="mint" />
      <div style={{ position: 'relative', zIndex: 1, padding: '60px 18px 32px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, marginBottom: 22 }}>
          <CircBtn size={38} onClick={onBack}><Ic.back size={18} /></CircBtn>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Create Trip</div>
          <CircBtn size={38} onClick={onClose}><Ic.close size={18} /></CircBtn>
        </div>

        {/* Where summary */}
        <Card padding={16} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>Where</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{flag}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{city.split(',')[0]}</div>
              <div style={{ color: PA.muted, fontSize: 12.5 }}>{city.split(',')[1]?.trim()}</div>
            </div>
          </div>
        </Card>

        {/* Mode tabs */}
        <Card padding={24}>
          <div style={{ display: 'flex', background: '#F4F5F2', borderRadius: 14, padding: 4, marginBottom: 24, gap: 4 }}>
            {['days', 'dates'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14,
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? PA.ink : PA.muted,
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                  transition: 'all .15s',
                }}
              >
                {m === 'days' ? '# Days' : '📅 Dates'}
              </button>
            ))}
          </div>

          {mode === 'days' && (
            <>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, textAlign: 'center' }}>How many days?</div>

              {/* Big counter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
                <button
                  onClick={() => setNumDays(d => Math.max(1, d - 1))}
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: numDays <= 1 ? PA.chip : PA.black,
                    border: 'none', cursor: numDays <= 1 ? 'default' : 'pointer',
                    fontSize: 24, color: numDays <= 1 ? PA.muted : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}
                >−</button>

                <div style={{ textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-.04em', color: PA.ink, lineHeight: 1 }}>
                    {numDays}
                  </div>
                  <div style={{ color: PA.muted, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                    {numDays === 1 ? 'day' : 'days'}
                  </div>
                </div>

                <button
                  onClick={() => setNumDays(d => Math.min(14, d + 1))}
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: numDays >= 14 ? PA.chip : PA.black,
                    border: 'none', cursor: numDays >= 14 ? 'default' : 'pointer',
                    fontSize: 24, color: numDays >= 14 ? PA.muted : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}
                >+</button>
              </div>

            </>
          )}

          {mode === 'dates' && (
            <>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Pick your dates</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: PA.muted, marginBottom: 6 }}>Start date</div>
                  <input
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value > endDate) setEndDate('');
                    }}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '13px 14px', borderRadius: 14,
                      border: `1.5px solid ${startDate ? PA.blue : PA.hairline2}`,
                      fontSize: 15, fontFamily: PA.font, color: PA.ink,
                      outline: 'none', background: '#fff',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: PA.muted, marginBottom: 6 }}>End date</div>
                  <input
                    type="date"
                    min={startDate || today}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '13px 14px', borderRadius: 14,
                      border: `1.5px solid ${endDate ? PA.blue : PA.hairline2}`,
                      fontSize: 15, fontFamily: PA.font, color: PA.ink,
                      outline: 'none', background: '#fff',
                    }}
                  />
                </div>
              </div>

              {computedDays > 1 && startDate && endDate && (
                <div style={{
                  marginTop: 14, padding: '10px 14px', borderRadius: 12,
                  background: PA.blueSoft, color: PA.blueDeep,
                  fontWeight: 700, fontSize: 14, textAlign: 'center',
                }}>
                  {computedDays} days selected
                </div>
              )}
            </>
          )}
        </Card>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1, padding: '14px', borderRadius: 9999, fontWeight: 700, fontSize: 15,
              color: PA.muted, background: '#fff',
              border: `1px solid ${PA.hairline2}`, cursor: 'pointer',
            }}
          >Back</button>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 9999, fontWeight: 700, fontSize: 15,
              color: '#fff', background: canProceed ? PA.black : PA.muted,
              boxShadow: canProceed ? '0 4px 12px rgba(0,0,0,.18)' : 'none',
              border: 'none', cursor: canProceed ? 'pointer' : 'default',
              transition: 'background .15s',
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   STEP 3: INTERESTS
════════════════════════════════════════ */
const INTERESTS = [
  { id: 'culture',     emoji: '🏛',  label: 'Culture & History' },
  { id: 'food',        emoji: '🍽',  label: 'Food & Dining' },
  { id: 'shopping',    emoji: '🛍',  label: 'Shopping' },
  { id: 'nature',      emoji: '🌿',  label: 'Nature & Parks' },
  { id: 'nightlife',   emoji: '🎭',  label: 'Nightlife' },
  { id: 'beach',       emoji: '🏖',  label: 'Beaches' },
  { id: 'art',         emoji: '🎨',  label: 'Art & Museums' },
  { id: 'adventure',   emoji: '🏃',  label: 'Adventure & Sports' },
  { id: 'local',       emoji: '🏘',  label: 'Local Experience' },
  { id: 'photography', emoji: '📸',  label: 'Photo Spots' },
];

export function CreateInterests({ city, flag, days, onBack, onClose, onBuild }) {
  const [selected, setSelected] = useState([]);

  const toggle = id => setSelected(s =>
    s.includes(id) ? s.filter(x => x !== id) : [...s, id]
  );

  return (
    <div style={{ minHeight: '100%', fontFamily: PA.font, color: PA.ink, position: 'relative' }} className="anim-slideUp">
      <PathlyBg tone="mint" />
      <div style={{ position: 'relative', zIndex: 1, padding: '60px 18px 32px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, marginBottom: 22 }}>
          <CircBtn size={38} onClick={onBack}><Ic.back size={18} /></CircBtn>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Create Trip</div>
          <CircBtn size={38} onClick={onClose}><Ic.close size={18} /></CircBtn>
        </div>

        {/* Summary card */}
        <Card padding={16} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{city.split(',')[0]}</div>
            <div style={{ color: PA.muted, fontSize: 12.5 }}>{days} {days === 1 ? 'day' : 'days'}</div>
          </div>
          <span style={{ fontSize: 28 }}>{flag}</span>
        </Card>

        <Card padding={20}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>What are you into?</div>
          <div style={{ color: PA.muted, fontSize: 13.5, marginBottom: 18 }}>
            Select interests and AI will personalize your itinerary. Skip to use defaults.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {INTERESTS.map(({ id, emoji, label }) => {
              const active = selected.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 9999,
                    background: active ? PA.black : PA.chip,
                    color: active ? '#fff' : PA.chipText,
                    fontWeight: 600, fontSize: 14,
                    border: `1.5px solid ${active ? PA.black : 'transparent'}`,
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{emoji}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 12,
              background: '#F0FDF4', color: '#15803D',
              fontSize: 13, fontWeight: 600,
            }}>
              ✓ {selected.length} interest{selected.length > 1 ? 's' : ''} selected
            </div>
          )}
        </Card>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1, padding: '14px', borderRadius: 9999, fontWeight: 700, fontSize: 15,
              color: PA.muted, background: '#fff',
              border: `1px solid ${PA.hairline2}`, cursor: 'pointer',
            }}
          >Back</button>
          <button
            onClick={() => onBuild(selected.map(id => INTERESTS.find(i => i.id === id)?.label).filter(Boolean))}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 9999, fontWeight: 700, fontSize: 15,
              color: '#fff', background: PA.black,
              boxShadow: '0 4px 12px rgba(0,0,0,.18)', border: 'none', cursor: 'pointer',
            }}
          >
            <Ic.sparkle size={18} color="#fff" />
            {selected.length ? 'Plan it for me!' : 'Plan with defaults'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   STEP 4: BUILDING (AI)
════════════════════════════════════════ */
const STEP_DEFS = [
  { icon: 'sparkle', label: 'Starting trip planning',        sub: 'Initializing AI engine'    },
  { icon: 'search',  label: 'Searching for top attractions', sub: 'Scanning travel databases'  },
  { icon: 'map',     label: 'Building your itinerary',       sub: 'Optimizing route order'     },
  { icon: 'route',   label: 'Calculating walking distances', sub: 'Adding travel info'         },
  { icon: 'check',   label: 'Finishing up',                  sub: 'Almost ready!'              },
];

export function BuildingScreen({ city, days, interests = [], onDone, onError }) {
  const [activeStep, setActiveStep] = useState(0);
  const abortRef = useRef(null);

  useEffect(() => {
    const delays = [0, 900, 2400, 4200, 6000];
    const timers = delays.map((d, i) => setTimeout(() => setActiveStep(i), d));

    abortRef.current = new AbortController();

    generateTripAI(city, days, interests, abortRef.current.signal)
      .then(trip => {
        setActiveStep(STEP_DEFS.length);
        setTimeout(() => onDone(trip), 500);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error(err);
        onError(err.message || 'Could not generate itinerary — please try again.');
      });

    return () => {
      timers.forEach(clearTimeout);
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div style={{ minHeight: '100%', fontFamily: PA.font, color: PA.ink, background: '#fff' }} className="anim-fadeIn">

      {/* Hero gradient */}
      <div style={{
        height: 200, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg,#BFE0FF 0%,#D7E8B7 60%,#F8E1B0 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ic.map size={130} color={PA.blue} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 40%,#fff)' }} />
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-.02em', color: PA.ink }}>
            Planning {city.split(',')[0]}
          </div>
          <div style={{ color: PA.muted, fontSize: 14, fontWeight: 500, marginTop: 3 }}>
            {days} {days === 1 ? 'day' : 'days'} · AI powered
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: '20px 18px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEP_DEFS.map((step, i) => {
          const done    = i < activeStep;
          const active  = i === activeStep;
          const pending = i > activeStep;
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px', borderRadius: 16,
                background: done ? '#F0FDF4' : active ? PA.blueSoft : '#F8F9FA',
                border: `1px solid ${done ? '#BBF7D0' : active ? PA.blue + '55' : PA.hairline}`,
                transition: 'all .3s ease',
                opacity: pending ? 0.55 : 1,
              }}
            >
              <div style={{ paddingTop: 1, flexShrink: 0 }}>
                {done   && <Ic.check size={22} />}
                {active && <Spinner size={22} />}
                {pending && (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${PA.hairline2}`,
                  }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: done || active ? PA.ink : PA.muted }}>
                  {step.label}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 500, marginTop: 3,
                  color: done ? PA.green : active ? PA.blue : PA.muted,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {done && <span>✓</span>}
                  {active && <span className="anim-pulse">●</span>}
                  {step.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
