// ── Pollinations ────────────────────────────────────────────────
export const POLLINATIONS_CLIENT_ID  = 'pk_yNyOGutRnYEWF5T2';
export const POLLINATIONS_AUTH_URL   = 'https://enter.pollinations.ai/authorize';
export const POLLINATIONS_API_URL    = 'https://gen.pollinations.ai/v1/chat/completions';
export const POLLINATIONS_MODELS_URL = 'https://gen.pollinations.ai/v1/models';
export const AUTH_SCOPE              = 'usage';
export const AUTH_EXPIRY_DAYS        = '30';

// ── AI models ───────────────────────────────────────────────────
// openai-large = GPT-5.4 (best quality, may timeout) → fallback to openai = GPT-4o
export const AI_MODEL_TRIP           = 'openai-large';
export const AI_MODEL_TRIP_FALLBACK  = 'openai';
export const AI_MODEL_OPTIMIZE       = 'openai-large';
export const AI_MODEL_OPTIMIZE_FALLBACK = 'openai';
export const AI_MODEL_IMAGES         = 'gemini-fast';

// ── AI token limits ─────────────────────────────────────────────
export const AI_TOKENS_TRIP          = 6000;
export const AI_TOKENS_OPTIMIZE      = 3000;
export const AI_TOKENS_IMAGES        = 4000;

// ── Firebase ────────────────────────────────────────────────────
export const FIREBASE_DB_URL         = 'https://navaro-planner-default-rtdb.europe-west1.firebasedatabase.app';
export const SHARE_TTL_MS            = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── loremflickr ─────────────────────────────────────────────────
export const LOREMFLICKR_HOST        = 'loremflickr.com';
export const LOREMFLICKR_PLACEHOLDER = 'defaultImage';
