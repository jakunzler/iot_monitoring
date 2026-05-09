/**
 * Converte timestamp da API (geralmente segundos Unix) para milissegundos Date.
 */
export function toEpochMs(ts) {
  if (ts == null || ts === '') return null;
  const n = Number(ts);
  if (!Number.isFinite(n)) return null;
  return n < 1e12 ? n * 1000 : n;
}

/**
 * Rótulo de conexão alinhado ao módulo (fallback quando connection_type vem vazio/N/A).
 */
export function resolveConnectionLabel(metadata, deviceId = '') {
  const rawConn = String(metadata?.connection_type ?? '').trim();
  if (rawConn && !/^n\/?a$/i.test(rawConn) && rawConn !== '—') {
    return rawConn;
  }

  const resolvedMod = resolveModuleLabel(metadata, deviceId);
  const ml = resolvedMod.toLowerCase();

  if (ml.includes('rm520') || ml.includes('quectel') || ml.includes('520n')) {
    return '5G';
  }
  if (ml === 'wi-fi' || ml === 'wifi' || ml.includes('esp32')) {
    return 'Wi-Fi';
  }

  const rawMod = String(metadata?.module_type ?? '').trim().toLowerCase();
  if (rawMod.includes('rm520') || rawMod.includes('quectel')) return '5G';
  if (deviceId.includes('PiCarX-RM520') || deviceId.includes('RM520')) return '5G';

  return '—';
}

/**
 * Rótulo do módulo (corrige linhas antigas em que a API devolvia o tipo de ligação na coluna errada).
 */
export function resolveModuleLabel(metadata, deviceId = '') {
  const raw = String(metadata?.module_type ?? '').trim();
  const rl = raw.toLowerCase();

  if (rl && !/^n\/?a$/i.test(raw) && rl !== 'esp32') {
    if (rl === 'wi-fi' || rl === 'wifi') {
      if (deviceId.includes('PiCarX-RM520')) {
        return 'Quectel RM520N-GL';
      }
      return raw;
    }
    return raw;
  }

  if (deviceId.includes('PiCarX-RM520')) {
    return 'Quectel RM520N-GL';
  }

  return raw || '—';
}
