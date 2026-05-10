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

/** URL pública para partilha / QR (ex.: Cloud Run). */
const DEFAULT_PUBLIC_SITE = 'https://dht22-frontend-a4lmpozwka-tl.a.run.app';

/**
 * Base URL do site (sem barra final).
 * - Com `VITE_PUBLIC_APP_URL` no build: usa esse valor (fixa o QR p.ex. ao servir de outro host).
 * - No browser: usa `window.location.origin` (mantém o QR alinhado ao domínio actual).
 * - Caso contrário: URL de produção por defeito (testes / pré-render).
 */
export function getPublicSiteUrl() {
  const built = import.meta.env.VITE_PUBLIC_APP_URL;
  if (built !== undefined && built !== null && String(built).trim() !== '') {
    return String(built).trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return DEFAULT_PUBLIC_SITE;
}

/** URL completa para codificar no QR (início da app). */
export function getPublicSiteUrlForQr() {
  return `${getPublicSiteUrl()}/`;
}
