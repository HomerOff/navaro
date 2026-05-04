import { PA } from '../tokens.js';
import { storage } from './storage.js';
import {
  POLLINATIONS_API_URL,
  AI_MODEL_TRIP, AI_MODEL_TRIP_FALLBACK,
  AI_MODEL_OPTIMIZE, AI_MODEL_OPTIMIZE_FALLBACK,
  AI_MODEL_IMAGES,
  AI_TOKENS_TRIP, AI_TOKENS_OPTIMIZE,
} from '../config.js';

const ENDPOINT = POLLINATIONS_API_URL;

/* ── Retry fetch: 429 backoff, 5xx single retry ── */
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      const wait = (attempt + 1) * 1500;
      await new Promise(r => setTimeout(r, wait));
      lastErr = new Error('Too many requests — please wait a moment and try again.');
      continue;
    }
    if (res.status >= 500 && attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 2000));
      lastErr = new Error(`Server error ${res.status}`);
      continue;
    }
    return res;
  }
  throw lastErr;
}

/* ── Parse Pollinations error JSON into user-friendly message ── */
async function parseAIError(res) {
  const text = await res.text().catch(() => '');
  const { code, msg } = (() => {
    try {
      const json = JSON.parse(text);
      return { code: json.error?.code ?? '', msg: json.error?.message ?? text };
    } catch {
      return { code: '', msg: text || `HTTP ${res.status}` };
    }
  })();
  if (res.status === 402 || code === 'PAYMENT_REQUIRED')
    return new Error('Insufficient Pollinations balance. Top up your account at pollinations.ai to continue.');
  if (res.status === 504 || code === 'UPSTREAM_TIMEOUT')
    return new Error('AI request timed out. Try a faster model in Settings, or try again.');
  if (res.status === 400 && msg.includes('max_tokens'))
    return null; // signal: retry with lower tokens
  return new Error(`AI error (${res.status}): ${msg}`);
}

/* ── POST to AI with model fallback on 504, token retry on 400 ── */
async function fetchAI(body, signal, fallbackModel) {
  const token = storage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const post = (b) => fetchWithRetry(ENDPOINT, { method: 'POST', headers, signal, body: JSON.stringify(b) });

  const res = await post(body);

  // 504 timeout → fallback model
  if (res.status === 504 && fallbackModel && body.model !== fallbackModel)
    return post({ ...body, model: fallbackModel });

  // 400 max_tokens too high → retry capped at 4096
  if (res.status === 400 && body.max_tokens > 4096) {
    const text = await res.clone().text().catch(() => '');
    if (text.includes('max_tokens')) return post({ ...body, max_tokens: 4096 });
  }

  return res;
}

/* ── loremflickr (primary image source) ── */
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h) % 9999;
}

export function loremflickrUrl(query, w = 400, h = 400) {
  const keywords = query.replace(/\+/g, ',').split(/[,\s]+/).slice(0, 3).join(',');
  const lock = hashStr(query);
  return `https://loremflickr.com/${w}/${h}/${keywords}?lock=${lock}`;
}

// Keep alias for any legacy references
export { loremflickrUrl as unsplashUrl };

/* ── Wikipedia REST API thumbnail (verified, always working) ── */
async function fetchWikiThumb(wikiTitle) {
  if (!wikiTitle) return null;
  try {
    const encoded = encodeURIComponent(wikiTitle.replace(/ /g, '_'));
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
      headers: { 'User-Agent': 'NavaroPWA/1.0 (contact@navaro.app)' },
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

/* ── Gemini: resolve spot names → Wikipedia titles → real thumbnail URLs ── */
// spots: array of { n, name, city, imgQuery } where n is globally sequential (1-based)
// Returns map: n -> url string
export async function fetchFallbackImages(spots, tripCity = '') {
  if (!spots.length) return {};

  const token = storage.getToken();
  const list = spots.map(s =>
    `${s.n}. ${s.name} in ${s.city || tripCity}`
  ).join('\n');

  const prompt = `For each place below, search Wikipedia and return the EXACT Wikipedia article title.
Return ONLY a compact JSON array — no markdown, no explanation.
If a place has no Wikipedia article, use null for "wiki".

FORMAT: [{"n":1,"wiki":"Exact Article Title"},{"n":2,"wiki":null},...]

PLACES:
${list}`;

  try {
    const res = await fetchWithRetry(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        model: AI_MODEL_IMAGES,
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return {};
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    // Parse JSON array from response
    const firstBracket = raw.indexOf('[');
    if (firstBracket === -1) return {};
    let arr = null;
    let searchFrom = raw.lastIndexOf(']');
    while (searchFrom > firstBracket) {
      try { arr = JSON.parse(raw.slice(firstBracket, searchFrom + 1)); break; }
      catch { searchFrom = raw.lastIndexOf(']', searchFrom - 1); }
    }
    if (!arr) return {};

    // Fetch Wikipedia thumbnails in parallel for all resolved titles
    const results = await Promise.all(
      arr.map(async item => {
        if (!item?.n || !item.wiki) return null;
        const url = await fetchWikiThumb(item.wiki);
        return url ? { n: item.n, url } : null;
      })
    );

    const map = {};
    results.forEach(r => { if (r) map[r.n] = r.url; });
    return map;
  } catch {
    return {};
  }
}

/* ── Main trip generation ── */
export async function generateTripAI(destination, days, interests = [], wishes = '', signal) {
  const hasInterests = interests.length > 0;
  const hasWishes    = wishes.trim().length > 0;

  const interestBlock = hasInterests
    ? `USER INTERESTS (critical — at least 70% of all spots must match these): ${interests.join(', ')}.`
    : '';
  const wishesBlock = hasWishes
    ? `ADDITIONAL USER REQUESTS (must be respected): ${wishes.trim()}`
    : '';
  const focusBlock = [interestBlock, wishesBlock].filter(Boolean).join('\n');

  const prompt = `Plan a ${days}-day trip to ${destination}.
${focusBlock ? focusBlock + '\n' : ''}
SPOT SELECTION RULES:
- 4-5 spots per day, arranged in logical walking order (minimize backtracking)
- Only real, well-known, currently operating venues — no tourist traps, no filler
- ${hasInterests ? `Heavily prioritize spots matching user interests: ${interests.join(', ')}` : "Curate a balanced mix of the city's best highlights"}
- Each spot must justify its inclusion — if it is not genuinely worth visiting, replace it

CONTENT QUALITY:
- coord: precise GPS for the actual entrance (not city center)
- hours: real-world schedule, not guessed
- rating: 4.0–4.9, calibrated to actual popularity
- ratings: realistic review count formatted like "8,400" or "142,000"
- address: real street address with number when applicable; null if address is not applicable
- phone: publicly listed number, or null
- desc: 2–3 vivid sentences — what makes this place special and worth visiting
- descFull: 4–6 sentences — history, insider tips, best time to visit, what to order/see/do
- imgQuery: 2–4 English keywords that would find a great specific photo of this place on a stock photo site (e.g. "Colosseum Rome interior", "Tsukiji market Tokyo seafood", "Sagrada Familia Barcelona tower")
- km: realistic total walking distance between spots for the day

CATEGORIES:
- cat: exactly one of — "Attractions" | "Food" | "Shopping" | "Other"
- catColor: "pink" for Attractions / Museums / Landmarks / Viewpoints; "blue" for Food / Markets / Shopping / Other

Return ONLY the following JSON — no markdown, no explanation, no extra keys:
{
  "title": "${days}-Day [City], [Country] Trip",
  "city": "[city name in English]",
  "country": "[country name in English]",
  "flag": "[country flag emoji]",
  "center": [latitude, longitude],
  "itinerary": [
    {
      "day": 1,
      "city": "[city name]",
      "km": 3.2,
      "spots": [
        {
          "n": 1,
          "name": "Place Name",
          "cat": "Attractions",
          "catColor": "pink",
          "coord": [latitude, longitude],
          "desc": "Two to three vivid sentences.",
          "descFull": "Four to six sentences with history, tips, and what makes it unmissable.",
          "rating": 4.7,
          "ratings": "12,400",
          "hours": "9:00 AM – 6:00 PM",
          "address": "Street Name 12, City",
          "phone": "+XX XXX XXX XXXX",
          "imgQuery": "place name city keyword"
        }
      ]
    }
  ]
}`;

  const systemMsg = `You are an award-winning travel curator and local insider with deep knowledge of cities worldwide. \
You build highly personalized itineraries using only real, currently operating places that genuinely merit a visit. \
You always respond with valid JSON only — no markdown, no code fences, no prose before or after.`;

  const settings = storage.getSettings();
  const tripModel = settings.tripModel || AI_MODEL_TRIP;
  const fallback = tripModel === AI_MODEL_TRIP ? AI_MODEL_TRIP_FALLBACK : null;

  const res = await fetchAI({
    model: tripModel,
    max_tokens: AI_TOKENS_TRIP,
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: prompt },
    ],
    seed: Math.floor(Math.random() * 99999),
  }, signal, fallback);

  if (!res.ok) { const err = await parseAIError(res); throw err ?? new Error(`AI error ${res.status}`); }

  const data = await res.json();
  const raw_content = data.choices?.[0]?.message?.content;
  if (!raw_content) {
    const reason = data.choices?.[0]?.finish_reason;
    throw new Error(reason === 'length'
      ? 'Try fewer days or simpler interests — the AI response was too long.'
      : 'AI returned an empty response. Please try again.');
  }

  let raw = raw_content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  let trip;
  try {
    trip = JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) trip = JSON.parse(raw.slice(start, end + 1));
    else throw new Error('AI returned invalid JSON. Please try again.');
  }

  trip.id         = `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  trip.createdAt  = Date.now();
  trip.cover      = loremflickrUrl(`${trip.city} travel`, 600, 600);
  trip.totalSpots = trip.itinerary.reduce((s, d) => s + d.spots.length, 0);
  trip.days       = trip.itinerary.length;
  trip.badge      = 'B';
  trip.dateRange  = null;

  // Assign sequential n across all days for Gemini batch
  let globalN = 1;
  trip.itinerary = trip.itinerary.map((day, di) => ({
    ...day,
    color:     PA.dayColors[di % PA.dayColors.length],
    colorSoft: PA.daySofts[di % PA.daySofts.length],
    spots: day.spots.map((sp, si) => ({
      ...sp,
      _n: globalN++,
      img:    loremflickrUrl(sp.imgQuery, 400, 400),
      big:    loremflickrUrl(sp.imgQuery, 400, 400),
      travel: si < day.spots.length - 1
        ? { mode: 'walk', t: `${4 + si * 2}m`, d: `${(0.6 + si * 0.35).toFixed(1)}km` }
        : null,
    })),
  }));

  // Fetch real images once at creation (if enabled in settings)
  if (settings.useGeminiImages) {
    const allSpots = trip.itinerary.flatMap(day =>
      day.spots.map(sp => ({ n: sp._n, name: sp.name, city: day.city, imgQuery: sp.imgQuery }))
    );
    const imgMap = await fetchFallbackImages(allSpots, trip.city);
    trip.itinerary = trip.itinerary.map(day => ({
      ...day,
      spots: day.spots.map(sp => {
        const resolved = imgMap[sp._n];
        const { _n, ...rest } = sp;
        return resolved ? { ...rest, img: resolved, big: resolved } : rest;
      }),
    }));
  } else {
    trip.itinerary = trip.itinerary.map(day => ({
      ...day,
      spots: day.spots.map(({ _n, ...rest }) => rest),
    }));
  }

  return trip;
}

/* ── Re-generate a single day ── */
export async function optimizeDayAI(trip, day, wishes, signal) {

  const prompt = `Replan Day ${day.day} of a trip to ${trip.city}, ${trip.country}.
Current spots: ${day.spots.map(s => s.name).join(', ')}.
User wishes: "${wishes}"

Return ONLY valid JSON for the updated day (no markdown):
{
  "day": ${day.day},
  "city": "${day.city}",
  "km": <number>,
  "spots": [
    {
      "n": 1, "name": "...", "cat": "Attractions", "catColor": "pink",
      "coord": [lat, lng],
      "desc": "Two to three sentences.",
      "descFull": "Four to six sentences with history and tips.",
      "rating": 4.7, "ratings": "50,000",
      "hours": "9:00 AM – 6:00 PM",
      "address": "Full street address",
      "phone": null,
      "imgQuery": "place name city"
    }
  ]
}
Rules: 4-5 spots, logical walking order, real GPS coords.`;

  const res = await fetchAI({
    model: AI_MODEL_OPTIMIZE,
    max_tokens: AI_TOKENS_OPTIMIZE,
    messages: [
      { role: 'system', content: 'You are a world-class travel expert. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    seed: Math.floor(Math.random() * 99999),
  }, signal, AI_MODEL_OPTIMIZE_FALLBACK);

  if (!res.ok) { const err = await parseAIError(res); throw err ?? new Error(`AI error ${res.status}`); }
  const data = await res.json();
  const raw_content = data.choices?.[0]?.message?.content;
  if (!raw_content) throw new Error('AI returned empty response. Please try again.');

  let raw = raw_content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  let newDay;
  try { newDay = JSON.parse(raw); }
  catch {
    const s = raw.indexOf('{'); const e = raw.lastIndexOf('}');
    if (s !== -1 && e > s) newDay = JSON.parse(raw.slice(s, e + 1));
    else throw new Error('AI returned invalid JSON. Please try again.');
  }

  newDay.color     = day.color;
  newDay.colorSoft = day.colorSoft;
  newDay.spots = newDay.spots.map((sp, si) => ({
    ...sp,
    img:    loremflickrUrl(sp.imgQuery, 400, 400),
    big:    loremflickrUrl(sp.imgQuery, 400, 400),
    travel: si < newDay.spots.length - 1
      ? { mode: 'walk', t: `${4 + si * 2}m`, d: `${(0.6 + si * 0.35).toFixed(1)}km` }
      : null,
  }));

  // Fetch real images once for the replanned day
  const daySpots = newDay.spots.map((sp, i) => ({ n: i + 1, name: sp.name, city: newDay.city, imgQuery: sp.imgQuery }));
  const imgMap = await fetchFallbackImages(daySpots, trip.city);
  newDay.spots = newDay.spots.map((sp, i) => {
    const resolved = imgMap[i + 1];
    return resolved ? { ...sp, img: resolved, big: resolved } : sp;
  });

  return newDay;
}

export function buildRoute(spots) {
  return spots.filter(s => Array.isArray(s.coord) && s.coord.length === 2).map(s => s.coord);
}
