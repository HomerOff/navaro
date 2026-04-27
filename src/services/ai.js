import { PA } from '../tokens.js';
import { storage } from './storage.js';

const ENDPOINT = 'https://gen.pollinations.ai/v1/chat/completions';

export async function generateTripAI(destination, days, interests = [], signal) {
  const interestNote = interests.length
    ? `\nUser interests (prioritize spots matching these): ${interests.join(', ')}.`
    : '';

  const prompt = `Create a detailed ${days}-day trip itinerary for ${destination}.${interestNote}
Return ONLY valid JSON (absolutely no markdown fences, no explanation), with this exact structure:
{
  "title": "${days}-Day [City], [Country] Trip",
  "city": "[city name only]",
  "country": "[country name]",
  "flag": "[country flag emoji]",
  "center": [latitude, longitude],
  "itinerary": [
    {
      "day": 1,
      "city": "[city]",
      "km": 9,
      "spots": [
        {
          "n": 1,
          "name": "Attraction Name",
          "cat": "Attractions",
          "catColor": "pink",
          "coord": [latitude, longitude],
          "desc": "Two to three sentence description of this place and why to visit.",
          "descFull": "Four to six sentence detailed description including history, tips, best time to visit.",
          "rating": 4.7,
          "ratings": "120,000",
          "hours": "9:00 AM – 6:00 PM",
          "address": "Full street address",
          "phone": "+XX XXX XXX XXXX",
          "imgQuery": "landmark name city travel photography"
        }
      ]
    }
  ]
}
Rules:
- 4-5 spots per day, ordered by a logical walking route
- catColor: use "pink" for Attractions/Landmarks/Museums, "blue" for Markets/Shopping/Food/Other
- Valid cat values: Attractions, Shopping, Food, Other
- Provide real, accurate GPS coordinates for every spot
- imgQuery: natural English phrase for image search (e.g. "Eiffel Tower Paris night view")
- km is a realistic total walking distance for that day
- All ratings between 4.0 and 4.9
- hours: real opening hours for the attraction, or "Open 24 hours" if applicable
- address: real street address
- phone: real phone number if publicly available, otherwise null
- descFull: longer description with history and visitor tips`;

  const token = storage.getToken();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    signal,
    body: JSON.stringify({
      model: 'openai-large',
      max_tokens: 6000,
      messages: [
        { role: 'system', content: 'You are a world-class travel expert. Always respond with valid JSON only — no markdown, no code fences, no prose.' },
        { role: 'user', content: prompt },
      ],
      seed: Math.floor(Math.random() * 99999),
    }),
  });

  if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text().catch(() => '')}`);

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
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
      trip = JSON.parse(raw.slice(start, end + 1));
    } else {
      throw new Error('AI returned invalid JSON. Please try again.');
    }
  }

  trip.id        = `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  trip.createdAt = Date.now();
  trip.cover     = pollinationsImageUrl(`${trip.city} travel city skyline aerial view`);
  trip.totalSpots = trip.itinerary.reduce((s, d) => s + d.spots.length, 0);
  trip.days      = trip.itinerary.length;
  trip.badge     = 'B';
  trip.dateRange = null;

  trip.itinerary = trip.itinerary.map((day, di) => ({
    ...day,
    color:     PA.dayColors[di % PA.dayColors.length],
    colorSoft: PA.daySofts[di % PA.daySofts.length],
    spots: day.spots.map((sp, si) => ({
      ...sp,
      img:    pollinationsImageUrl(sp.imgQuery, 400, 400),
      big:    pollinationsImageUrl(sp.imgQuery, 900, 520),
      travel: si < day.spots.length - 1
        ? { mode: 'walk', t: `${4 + si * 2}m`, d: `${(0.6 + si * 0.35).toFixed(1)}km` }
        : null,
    })),
  }));

  return trip;
}

/**
 * Re-generate a single day's itinerary with user wishes.
 */
export async function optimizeDayAI(trip, day, wishes, signal) {
  const token = storage.getToken();

  const prompt = `You are replanning Day ${day.day} of a trip to ${trip.city}, ${trip.country}.
Current spots: ${day.spots.map(s => s.name).join(', ')}.
User wishes: "${wishes}"

Return ONLY valid JSON for the updated day object (no markdown, no fences):
{
  "day": ${day.day},
  "city": "${day.city}",
  "km": <number>,
  "spots": [
    {
      "n": 1,
      "name": "...",
      "cat": "Attractions",
      "catColor": "pink",
      "coord": [lat, lng],
      "desc": "Two to three sentence description.",
      "descFull": "Four to six sentence detailed description.",
      "rating": 4.7,
      "ratings": "50,000",
      "hours": "9:00 AM – 6:00 PM",
      "address": "Full street address",
      "phone": "+XX XXX XXX XXXX",
      "imgQuery": "place name city travel"
    }
  ]
}
Rules: 4-5 spots, logical walking order, real GPS coords, catColor "pink" for Attractions/Museums, "blue" for Food/Shopping/Other.`;

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    signal,
    body: JSON.stringify({
      model: 'openai-large',
      max_tokens: 3000,
      messages: [
        { role: 'system', content: 'You are a world-class travel expert. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      seed: Math.floor(Math.random() * 99999),
    }),
  });

  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = await res.json();
  const raw_content = data.choices?.[0]?.message?.content;
  if (!raw_content) throw new Error('AI returned empty response. Please try again.');

  let raw = raw_content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  let newDay;
  try {
    newDay = JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) newDay = JSON.parse(raw.slice(start, end + 1));
    else throw new Error('AI returned invalid JSON. Please try again.');
  }

  newDay.color     = day.color;
  newDay.colorSoft = day.colorSoft;
  newDay.spots = newDay.spots.map((sp, si) => ({
    ...sp,
    img:    pollinationsImageUrl(sp.imgQuery, 400, 400),
    big:    pollinationsImageUrl(sp.imgQuery, 900, 520),
    travel: si < newDay.spots.length - 1
      ? { mode: 'walk', t: `${4 + si * 2}m`, d: `${(0.6 + si * 0.35).toFixed(1)}km` }
      : null,
  }));

  return newDay;
}

/**
 * Pollinations image generation URL.
 * Falls back to a neutral travel placeholder on error (handled via onError in <img>).
 */
export function pollinationsImageUrl(prompt, w = 400, h = 400) {
  const encoded = encodeURIComponent(prompt.trim());
  // nologo=true keeps images clean; model=flux for best quality
  return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&model=flux`;
}

// Keep for any legacy references
export function unsplashUrl(query, w = 400, h = 400) {
  return pollinationsImageUrl(query, w, h);
}

export function buildRoute(spots) {
  return spots.filter(s => Array.isArray(s.coord) && s.coord.length === 2).map(s => s.coord);
}
