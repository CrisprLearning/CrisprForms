// Central config. Vite injects VITE_* env vars at build time; sensible
// defaults make the forms runtime work with zero setup inside the monorepo.

// Empty string => use same-origin (recommended in production; the forms app
// is served from the same host as the API). Override with VITE_API_BASE
// when developing the forms app standalone against a remote backend.
export const API_BASE = import.meta.env?.VITE_API_BASE || '';
export const MOUNT_ID = 'forms-root';

// Mock mode is opt-in. Set VITE_USE_MOCK=true to demo without a backend
// (no recipient lookup, submissions are echoed back locally). Default real API.
export const USE_MOCK = (import.meta.env?.VITE_USE_MOCK ?? 'false') === 'true';
