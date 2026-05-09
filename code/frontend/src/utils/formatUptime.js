/**
 * Formats uptime seconds into a short pt-BR friendly string.
 */
export function formatUptimeSeconds(sec) {
  if (sec === null || sec === undefined || sec === '') {
    return '—';
  }
  const s = Number(sec);
  if (!Number.isFinite(s) || s < 0) {
    return '—';
  }
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  if (mins > 0) {
    return `${mins}min`;
  }
  return `${Math.floor(s)}s`;
}
