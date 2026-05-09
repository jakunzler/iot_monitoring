/**
 * API base URL for backend requests.
 * - Production/Cloud Run behind nginx proxy: build with VITE_API_URL=__SAME_ORIGIN__
 *   so fetch uses /api/... (same origin); nginx forwards to BACKEND_PROXY_URL.
 * - Direct backend URL: VITE_API_URL=https://api.example.com (must have a valid browser-trusted TLS cert).
 * - Local dev: optional .env with VITE_API_URL, or fall back below.
 */
const DEFAULT_LOCAL_API = 'http://200.137.220.50:8080';
const SAME_ORIGIN = '__SAME_ORIGIN__';

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw !== undefined && raw !== null) {
    const s = String(raw).trim();
    if (s === SAME_ORIGIN) {
      return '';
    }
    if (s !== '') {
      return s.replace(/\/+$/, '');
    }
  }
  return DEFAULT_LOCAL_API;
}
