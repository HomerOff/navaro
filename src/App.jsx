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
      background: 'transparent', overflowX: 'hidden',
    }}>
      {children}
    </div>
  );
}

// Read #api_key=sk_xxx from URL fragment after Pollinations redirect
function extractApiKey() {
  const hash = window.location.hash;
  const match = hash.match(/[#&]api_key=([^&]+)/);
  return match ? match[1] : null;
}

export default function App() {
  const isDesktop = useIsDesktop();
  const [apiKey, setApiKey] = useState(() => {
    // Check URL fragment first (returning from Pollinations OAuth)
    const fromUrl = extractApiKey();
    if (fromUrl) {
      storage.setToken(fromUrl);
      // Clean hash without triggering a reload
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return fromUrl;
    }
    return storage.getToken();
  });

  const [trips, setTrips]           = useState(() => storage.getTrips());
  const [favorites, setFavorites]   = useState(() => storage.getFavorites());
  const [toast, setToast]           = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Mobile state machine
  const [view, setView]             = useState('home');
  const [createData, setCreateData] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [currentDay, setCurrentDay]   = useState(0);
  const [currentPlaceData, setCurrentPlaceData] = useState(null); // { spot, day }

  const showToast = (message, type = 'error') => setToast({ message, type });

  const handleSaveTrip = trip => {
    storage.saveTrip(trip);
    setTrips(storage.getTrips());
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
    setCreateData({ city: opts.prefill || '', flag: opts.flag || '' });
    setView('create-where');
  };

  const handleOpenTrip = trip => {
    setCurrentTrip(trip);
    setCurrentDay(0);
    setView('trip');
  };

  // No API key → show auth screen
  if (!apiKey) {
    return <AuthScreen />;
  }

  if (!isDesktop) {
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
              onBuild={interests => {
                setCreateData(d => ({ ...d, interests }));
                setView('building');
              }}
            />
          )}

          {view === 'building' && (
            <BuildingScreen
              city={createData.city}
              days={createData.days}
              interests={createData.interests || []}
              onDone={trip => {
                handleSaveTrip(trip);
                setCurrentTrip(trip);
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
              onOpenDay={dayIdx => {
                setCurrentDay(dayIdx);
                setView('day');
              }}
            />
          )}

          {view === 'day' && currentTrip && (
            <DayDetail
              trip={currentTrip}
              day={currentTrip.itinerary.find(d => d.day === currentDay) ?? currentTrip.itinerary[0]}
              onBack={() => setView('trip')}
              onOpenPlace={(sp, day) => {
                setCurrentPlaceData({ spot: sp, day });
                setView('place');
              }}
            />
          )}

          {view === 'place' && currentPlaceData && (
            <PlaceDetail
              spot={currentPlaceData.spot}
              day={currentPlaceData.day}
              trip={currentTrip}
              onBack={() => setView('day')}
            />
          )}
        </MobileFrame>

        {showSettings && (
          <Settings
            onClose={() => setShowSettings(false)}
            onLogout={() => { storage.setToken(''); setApiKey(''); }}
          />
        )}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <DesktopLayout
        trips={trips}
        onSaveTrip={handleSaveTrip}
        onDeleteTrip={handleDeleteTrip}
        onError={showToast}
        onSettings={() => setShowSettings(true)}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onLogout={() => { storage.setToken(''); setApiKey(''); }}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
