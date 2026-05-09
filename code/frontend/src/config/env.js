/**
 * API base URL for backend requests.
 * - Production/Cloud Run: set at build time (Docker --build-arg VITE_API_URL=...).
 * - Local dev: optional .env in frontend/ with VITE_API_URL, or fall back below.
 */
const DEFAULT_LOCAL_API = 'http://200.137.220.50:8080';

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/+$/, '');
  }
  return DEFAULT_LOCAL_API;
}
