import { useCallback, useEffect, useMemo, useState } from 'react';

/** Defaults match previous hardcoded chart scales (temp left, humidity right). */
export const DEFAULT_CHART_AXIS_RANGES = Object.freeze({
  tempMin: 20,
  tempMax: 40,
  humMin: 0,
  humMax: 100,
});

function coerceNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Ensures finite numbers and min < max for each axis pair.
 */
export function normalizeChartAxisRanges(partial) {
  const base = { ...DEFAULT_CHART_AXIS_RANGES, ...partial };
  let tempMin = coerceNumber(base.tempMin, DEFAULT_CHART_AXIS_RANGES.tempMin);
  let tempMax = coerceNumber(base.tempMax, DEFAULT_CHART_AXIS_RANGES.tempMax);
  let humMin = coerceNumber(base.humMin, DEFAULT_CHART_AXIS_RANGES.humMin);
  let humMax = coerceNumber(base.humMax, DEFAULT_CHART_AXIS_RANGES.humMax);

  if (tempMax <= tempMin) {
    tempMax = tempMin + 0.5;
  }
  if (humMax <= humMin) {
    humMax = humMin + 0.5;
  }

  return { tempMin, tempMax, humMin, humMax };
}

function loadFromStorage(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {string} storageKey e.g. `iot-chart-axes-${deviceId}`
 */
export function usePersistedChartAxisRanges(storageKey) {
  const [ranges, setRangesState] = useState(() =>
    normalizeChartAxisRanges(loadFromStorage(storageKey) ?? {})
  );

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(ranges));
    } catch {
      /* ignore quota / private mode */
    }
  }, [storageKey, ranges]);

  const setRanges = useCallback((patch) => {
    setRangesState((prev) => normalizeChartAxisRanges({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setRangesState(normalizeChartAxisRanges({ ...DEFAULT_CHART_AXIS_RANGES }));
  }, []);

  const defaults = useMemo(() => ({ ...DEFAULT_CHART_AXIS_RANGES }), []);

  return { ranges, setRanges, reset, defaults };
}
