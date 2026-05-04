/**
 * Trip sharing service:
 * - Firebase Realtime Database for link sharing (CORS enabled, no auth needed)
 * - File export/import for offline sharing
 */

import { FIREBASE_DB_URL, SHARE_TTL_MS } from '../config.js';

const DB = FIREBASE_DB_URL;
const SHARE_VERSION = 1;

/* ── Prepare trip for sharing ── */
function prepareForShare(trip) {
  return {
    _navaro_share: SHARE_VERSION,
    _created: Date.now(),
    ...trip,
  };
}

/* ── Upload trip to Firebase, get share ID ── */
export async function uploadTripToBlob(trip) {
  const payload = prepareForShare(trip);
  const res = await fetch(`${DB}/shared_trips.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

  const data = await res.json();
  // Firebase POST returns { "name": "-OQ3xKj2abc" }
  if (!data.name) throw new Error('No ID returned from server.');
  return data.name;
}

/* ── Download trip by share ID ── */
export async function downloadTripFromBlob(shareId) {
  const res = await fetch(`${DB}/shared_trips/${shareId}.json`);

  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const data = await res.json();
  if (!data) throw new Error('Trip not found. The link may have expired.');
  if (!data._navaro_share) throw new Error('Invalid trip data.');

  if (data._created && Date.now() - data._created > SHARE_TTL_MS) {
    throw new Error('This shared trip link has expired (links last 30 days).');
  }

  const { _navaro_share, _created, ...trip } = data;
  return trip;
}

/* ── Build shareable URL ── */
export function buildShareUrl(shareId) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?share=${encodeURIComponent(shareId)}`;
}

/* ── Extract share ID from current URL ── */
export function extractShareId() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('share');
  return raw ? decodeURIComponent(raw) : null;
}

/* ── Clear share param from URL without reload ── */
export function clearShareParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  history.replaceState(null, '', url.pathname + (url.search !== '?' ? url.search : ''));
}

/* ── Export trip as .navaro file ── */
export function exportTripAsFile(trip) {
  const payload = prepareForShare(trip);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const name = trip.title
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
  a.download = `${name || 'trip'}.navaro`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Import trip from .navaro / .json file ── */
export function importTripFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.navaro,.json';
    input.onchange = async e => {
      const file = e.target.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data._navaro_share) { reject(new Error('Invalid .navaro file.')); return; }
        const { _navaro_share, _created, ...trip } = data;
        resolve(trip);
      } catch {
        reject(new Error("Could not read file. Make sure it's a valid .navaro file."));
      }
    };
    input.oncancel = () => reject(new Error('cancelled'));
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}
