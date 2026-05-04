import {
  POLLINATIONS_CLIENT_ID,
  POLLINATIONS_AUTH_URL,
  AUTH_SCOPE,
  AUTH_EXPIRY_DAYS,
} from '../config.js';

export function buildAuthUrl() {
  const redirectUri = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    client_id: POLLINATIONS_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: AUTH_SCOPE,
    expiry: AUTH_EXPIRY_DAYS,
    state: Math.random().toString(36).slice(2),
  });
  return `${POLLINATIONS_AUTH_URL}?${params}`;
}
