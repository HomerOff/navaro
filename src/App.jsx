import { useState, useEffect } from 'react';
import { PA } from './tokens.js';
import { storage } from './services/storage.js';
import { AuthScreen } from './components/Auth.jsx';
import { DesktopLayout } from './layouts/DesktopLayout.jsx';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { CreateWhere, CreateWhen, CreateInterests, BuildingScreen } from './screens/CreateFlow.jsx';
import { TripOverview, DayDetail, PlaceDetail } from './screens/TripScreens.jsx';
import { Toast } from './components/Toast.jsx';
import { Settings } from './components/Settings.jsx';
import { ShareModal } from './components/ShareModal.jsx';
import { AuthPromptModal } from './components/AuthPromptModal.jsx';
import { extractShareId, downloadTripFromBlob, clearShareParam, importTripFromFile } from './services/share.js';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 960);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 960px)');
    const handler = e => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function MobileFrame({ children }) {
  return (
    <div style={{
      minHeight: '100dvh', maxWidth: 480, margin: '0 auto',
      position: 'relative', fontFamily: PA.font,
      background: 'transparent',
      // NOTE: no overflow:hidden here — it breaks position:fixed in children
    }}>
      {children}
    </div>
  );
}

function extractApiKey() {
  const hash = window.location.hash;
  const match = hash.match(/[#&]api_key=([^&]+)/);
  return match ? match[1] : null;
}

// View stack for Android back button support
const VIEW_BACK = {
  'favorites':        'home',
  'create-where':     'home',
  'create-when':      'create-where',
  'create-interests': 'create-when',
  'building':         'create-interests',
  'trip':             'home',
  'day':              'trip',
  'place':            'day',
};

const _isTestImages = new URLSearchParams(window.location.search).get('test') === 'images';

export default function App() {
  if (_isTestImages) return <ImageTest />;
  return <AppCore />;
}

function AppCore() {
  const isDesktop = useIsDesktop();

  const [apiKey, setApiKey] = useState(() => {
    const fromUrl = extractApiKey();
    if (fromUrl) {
      storage.setToken(fromUrl);
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return fromUrl;
    }
    return storage.getToken();
  });

  // Guest mode — can browse/import but not create trips
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const [trips, setTrips]           = useState(() => storage.getTrips());
  const [favorites, setFavorites]   = useState(() => storage.getFavorites());
  const [toast, setToast]           = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [shareTrip, setShareTrip]   = useState(null); // trip being shared
  const [incomingTrip, setIncomingTrip] = useState(null); // trip received via link

  const showToast = (message, type = 'error') => setToast({ message, type });

  // ── Handle incoming ?share= link ───────────────────────────────
  useEffect(() => {
    const shareId = extractShareId();
    if (!shareId) return;
    clearShareParam();
    downloadTripFromBlob(shareId)
      .then(trip => setIncomingTrip(trip))
      .catch(e => showToast(e.message || 'Could not load shared trip.'));
  }, []);

  const [view, setView]             = useState('home');
  const [createData, setCreateData] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [currentDay, setCurrentDay]   = useState(0);
  const [currentPlaceData, setCurrentPlaceData] = useState(null);
  // Track where to go back from PlaceDetail: 'day' | 'favorites'
  const [placeBackTarget, setPlaceBackTarget] = useState('day');

  const navigateTo = (v) => { setView(v); };

  // ── Android / browser back button ──────────────────────────────
  useEffect(() => {
    if (isDesktop) return;

    const handlePopState = () => {
      const back = VIEW_BACK[view];
      if (back) navigateTo(back);
    };

    window.history.pushState({ view }, '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, isDesktop]);

  // ── Trip CRUD ───────────────────────────────────────────────────
  const handleSaveTrip = trip => {
    storage.saveTrip(trip);
    setTrips(storage.getTrips());
  };

  const handleUpdateTrip = trip => {
    storage.updateTrip(trip);
    setTrips(storage.getTrips());
    // Also update currentTrip if it's the same one
    if (currentTrip?.id === trip.id) setCurrentTrip(trip);
  };

  const handleDeleteTrip = id => {
    storage.deleteTrip(id);
    setTrips(storage.getTrips());
    setFavorites(storage.getFavorites());
  };

  const handleToggleFavorite = id => {
    storage.toggleFavorite(id);
    setFavorites(storage.getFavorites());
  };

  const handleCreateTrip = (opts = {}) => {
    requireAuth(() => {
      setCreateData({ city: opts.prefill || '', flag: opts.flag || '', wishes: '' });
      setView('create-where');
    });
  };

  const handleOpenTrip = trip => {
    setCurrentTrip(trip);
    if (trip.itinerary.length === 1) {
      setCurrentDay(trip.itinerary[0].day);
      setView('day');
    } else {
      setCurrentDay(0);
      setView('trip');
    }
  };

  const handleImportFile = async () => {
    try {
      const trip = await importTripFromFile();
      const newTrip = {
        ...trip,
        id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      };
      handleSaveTrip(newTrip);
      showToast('Trip imported successfully!', 'success');
    } catch (e) {
      if (e.message !== 'cancelled') showToast(e.message || 'Import failed.', 'error');
    }
  };

  // ── Auth guard ──────────────────────────────────────────────────
  if (!apiKey && !isGuest) {
    return <AuthScreen onGuest={() => setIsGuest(true)} />;
  }

  // Helper: if guest tries to create — show auth prompt
  const requireAuth = (fn) => {
    if (!apiKey && isGuest) {
      setShowAuthPrompt(true);
      return;
    }
    fn();
  };

  // ── Desktop ─────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <>
        <DesktopLayout
          trips={trips}
          onSaveTrip={handleSaveTrip}
          onUpdateTrip={handleUpdateTrip}
          onDeleteTrip={handleDeleteTrip}
          onError={showToast}
          onSettings={() => setShowSettings(true)}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onShare={trip => setShareTrip(trip)}
          onImport={handleImportFile}
          isGuest={isGuest}
          onAuthPrompt={() => setShowAuthPrompt(true)}
        />
        {showSettings && (
          <Settings
            onClose={() => setShowSettings(false)}
            onLogout={() => { storage.setToken(''); setApiKey(''); setIsGuest(false); }}
            onImport={handleImportFile}
            isGuest={isGuest}
          />
        )}
        {shareTrip && (
          <ShareModal trip={shareTrip} onClose={() => setShareTrip(null)} />
        )}
        {incomingTrip && (
          <div
            className="anim-fadeIn"
            style={{
              position: 'fixed', inset: 0, zIndex: 4000,
              background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 24px', fontFamily: PA.font,
            }}
          >
            <div className="anim-slideUp" style={{
              width: '100%', maxWidth: 360,
              background: '#fff', borderRadius: 24, padding: '28px 24px 20px',
              boxShadow: '0 24px 60px rgba(0,0,0,.18)',
            }}>
              <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>✈️</div>
              <div style={{ fontWeight: 800, fontSize: 18, textAlign: 'center', marginBottom: 6 }}>Trip shared with you!</div>
              <div style={{ color: PA.muted, fontSize: 14, textAlign: 'center', marginBottom: 6 }}>{incomingTrip.title}</div>
              <div style={{ color: PA.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>{incomingTrip.days} days · {incomingTrip.totalSpots} spots</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setIncomingTrip(null)} style={{ flex: 1, padding: '12px', borderRadius: 9999, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: PA.chip, color: PA.ink, border: 'none' }}>Dismiss</button>
                <button
                  onClick={() => {
                    const newTrip = { ...incomingTrip, id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now() };
                    handleSaveTrip(newTrip);
                    setIncomingTrip(null);
                    showToast('Trip saved!', 'success');
                  }}
                  style={{ flex: 2, padding: '12px', borderRadius: 9999, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: PA.black, color: '#fff', border: 'none' }}
                >Save Trip</button>
              </div>
            </div>
          </div>
        )}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {/* Auth prompt for desktop guest mode */}
        {showAuthPrompt && (
          <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />
        )}
      </>
    );
  }

  // ── Mobile ──────────────────────────────────────────────────────
  return (
    <>
      <MobileFrame>
        {(view === 'home' || view === 'favorites') && (
          <HomeScreen
            trips={trips}
            onCreateTrip={handleCreateTrip}
            onOpenTrip={handleOpenTrip}
            onDeleteTrip={handleDeleteTrip}
            onSettings={() => setShowSettings(true)}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            favoritesOnly={view === 'favorites'}
            onFavorites={() => setView(view === 'favorites' ? 'home' : 'favorites')}
            onImport={handleImportFile}
            onShareTrip={trip => setShareTrip(trip)}
            onOpenFavoriteSpot={spot => {
              // Build a minimal trip context so PlaceDetail doesn't crash
              const realTrip = trips.find(t => t.id === spot._tripId);
              const fakeDay  = { color: PA.blue, day: 0, spots: [] };
              setCurrentPlaceData({ spot, day: fakeDay });
              setCurrentTrip(realTrip ?? {
                id: spot._tripId ?? 'fav',
                city: spot._tripCity ?? '',
                center: spot.coord ?? [0, 0],
                itinerary: [],
              });
              setPlaceBackTarget('favorites');
              setView('place');
            }}
          />
        )}

        {view === 'create-where' && (
          <CreateWhere
            prefill={createData?.city || ''}
            onNext={({ city, flag }) => {
              setCreateData(d => ({ ...d, city, flag }));
              setView('create-when');
            }}
            onClose={() => setView('home')}
          />
        )}

        {view === 'create-when' && (
          <CreateWhen
            city={createData.city}
            flag={createData.flag}
            onBack={() => setView('create-where')}
            onClose={() => setView('home')}
            onNext={({ days, dateRange }) => {
              setCreateData(d => ({ ...d, days, dateRange }));
              setView('create-interests');
            }}
          />
        )}

        {view === 'create-interests' && (
          <CreateInterests
            city={createData.city}
            flag={createData.flag}
            days={createData.days}
            onBack={() => setView('create-when')}
            onClose={() => setView('home')}
            onBuild={(interests, wishes) => {
              setCreateData(d => ({ ...d, interests, wishes }));
              setView('building');
            }}
          />
        )}

        {view === 'building' && (
          <BuildingScreen
            city={createData.city}
            days={createData.days}
            interests={createData.interests || []}
            wishes={createData.wishes || ''}
            onDone={trip => {
              // Apply dateRange chosen in CreateWhen step
              const tripWithDates = createData.dateRange
                ? { ...trip, dateRange: createData.dateRange }
                : trip;
              handleSaveTrip(tripWithDates);
              setCurrentTrip(tripWithDates);
              setCurrentDay(0);
              setView('trip');
            }}
            onError={msg => {
              showToast(msg);
              setView('home');
            }}
          />
        )}

        {view === 'trip' && currentTrip && (
          <TripOverview
            trip={currentTrip}
            onBack={() => setView('home')}
            onHome={() => setView('home')}
            onOpenDay={dayIdx => {
              setCurrentDay(dayIdx);
              setView('day');
            }}
            onOpenPlace={(sp, day) => {
              setCurrentPlaceData({ spot: sp, day });
              setPlaceBackTarget('trip');
              setView('place');
            }}
            onTripUpdate={handleUpdateTrip}
            onShare={() => setShareTrip(currentTrip)}
          />
        )}

        {view === 'day' && currentTrip && (
          <DayDetail
            trip={currentTrip}
            day={currentTrip.itinerary.find(d => d.day === currentDay) ?? currentTrip.itinerary[0]}
            onBack={() => currentTrip?.itinerary.length === 1 ? setView('home') : setView('trip')}
            onHome={() => setView('home')}
            onOpenPlace={(sp, day) => {
              setCurrentPlaceData({ spot: sp, day });
              setPlaceBackTarget('day');
              setView('place');
            }}
            onOpenDay={dayIdx => {
              setCurrentDay(dayIdx);
              setView('day');
            }}
            onTripUpdate={handleUpdateTrip}
          />
        )}

        {view === 'place' && currentPlaceData && (
          <PlaceDetail
            spot={currentPlaceData.spot}
            day={currentPlaceData.day}
            trip={currentTrip}
            onHome={() => setView('home')}
            onBack={() => {
              if (placeBackTarget === 'favorites') {
                setView('favorites');
              } else if (placeBackTarget === 'trip') {
                setView('trip');
              } else {
                setView('day');
              }
            }}
          />
        )}
      </MobileFrame>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onLogout={() => { storage.setToken(''); setApiKey(''); setIsGuest(false); }}
          onImport={handleImportFile}
          isGuest={isGuest}
        />
      )}
      {shareTrip && (
        <ShareModal trip={shareTrip} onClose={() => setShareTrip(null)} />
      )}

      {/* Incoming shared trip dialog */}
      {incomingTrip && (
        <div
          className="anim-fadeIn"
          style={{
            position: 'fixed', inset: 0, zIndex: 4000,
            background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 24px', fontFamily: PA.font,
          }}
        >
          <div className="anim-slideUp" style={{
            width: '100%', maxWidth: 360,
            background: '#fff', borderRadius: 24, padding: '28px 24px 20px',
            boxShadow: '0 24px 60px rgba(0,0,0,.18)',
          }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>✈️</div>
            <div style={{ fontWeight: 800, fontSize: 18, textAlign: 'center', marginBottom: 6 }}>
              Trip shared with you!
            </div>
            <div style={{ color: PA.muted, fontSize: 14, textAlign: 'center', marginBottom: 6 }}>
              {incomingTrip.title}
            </div>
            <div style={{ color: PA.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
              {incomingTrip.days} days · {incomingTrip.totalSpots} spots
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setIncomingTrip(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 9999,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  background: PA.chip, color: PA.ink, border: 'none',
                }}
              >Dismiss</button>
              <button
                onClick={() => {
                  // Give new ID to avoid conflicts
                  const newTrip = {
                    ...incomingTrip,
                    id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    createdAt: Date.now(),
                  };
                  handleSaveTrip(newTrip);
                  setIncomingTrip(null);
                  showToast('Trip saved to your collection!', 'success');
                }}
                style={{
                  flex: 2, padding: '12px', borderRadius: 9999,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  background: PA.black, color: '#fff', border: 'none',
                }}
              >Save Trip</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Auth prompt — shown when guest tries to create a trip */}
      {showAuthPrompt && (
        <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />
      )}
    </>
  );
}
