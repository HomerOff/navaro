const KEY        = 'navaro-trips-v1';
const FAV_KEY    = 'navaro-favorites';
const FAV_SPOTS  = 'navaro-fav-spots';
const TOKEN_KEY  = 'navaro-api-token';
const SETTINGS_KEY = 'navaro-settings';

const DEFAULT_SETTINGS = {
  tripModel:       'openai-large',
  useGeminiImages: true,
};

export const storage = {
  // ── Trips ──────────────────────────────────────────────────────
  getTrips() {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  },
  saveTrip(trip) {
    const trips = this.getTrips().filter(t => t.id !== trip.id);
    localStorage.setItem(KEY, JSON.stringify([trip, ...trips]));
  },
  updateTrip(trip) {
    // Replace in-place without moving to front
    const trips = this.getTrips().map(t => t.id === trip.id ? trip : t);
    localStorage.setItem(KEY, JSON.stringify(trips));
  },
  deleteTrip(id) {
    localStorage.setItem(KEY, JSON.stringify(this.getTrips().filter(t => t.id !== id)));
    this.setFavorites(this.getFavorites().filter(fid => fid !== id));
  },

  // ── Favorite trips ─────────────────────────────────────────────
  getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]'); }
    catch { return []; }
  },
  setFavorites(ids) {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  },
  isFavorite(id) { return this.getFavorites().includes(id); },
  toggleFavorite(id) {
    const favs = this.getFavorites();
    const idx  = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1); else favs.push(id);
    this.setFavorites(favs);
    return idx < 0;
  },

  // ── Favorite spots ─────────────────────────────────────────────
  getFavoriteSpots() {
    try { return JSON.parse(localStorage.getItem(FAV_SPOTS) ?? '[]'); }
    catch { return []; }
  },
  saveFavoriteSpot(spot, tripId, tripCity) {
    const spots = this.getFavoriteSpots().filter(s => s._favId !== `${tripId}-${spot.n}-${spot.name}`);
    spots.unshift({ ...spot, _favId: `${tripId}-${spot.n}-${spot.name}`, _tripId: tripId, _tripCity: tripCity });
    localStorage.setItem(FAV_SPOTS, JSON.stringify(spots));
  },
  removeFavoriteSpot(favId) {
    const spots = this.getFavoriteSpots().filter(s => s._favId !== favId);
    localStorage.setItem(FAV_SPOTS, JSON.stringify(spots));
  },
  isSpotFavorite(tripId, spot) {
    const id = `${tripId}-${spot.n}-${spot.name}`;
    return this.getFavoriteSpots().some(s => s._favId === id);
  },
  toggleFavoriteSpot(spot, tripId, tripCity) {
    const id = `${tripId}-${spot.n}-${spot.name}`;
    if (this.isSpotFavorite(tripId, spot)) {
      this.removeFavoriteSpot(id);
      return false;
    } else {
      this.saveFavoriteSpot(spot, tripId, tripCity);
      return true;
    }
  },

  // ── Token ──────────────────────────────────────────────────────
  getToken()      { return localStorage.getItem(TOKEN_KEY) || ''; },
  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token.trim());
    else localStorage.removeItem(TOKEN_KEY);
  },

  // ── Settings ───────────────────────────────────────────────────
  getSettings() {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }; }
    catch { return { ...DEFAULT_SETTINGS }; }
  },
  saveSettings(patch) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...this.getSettings(), ...patch }));
  },

  // ── Clear all user data ────────────────────────────────────────
  clearAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(FAV_KEY);
    localStorage.removeItem(FAV_SPOTS);
  },
};
