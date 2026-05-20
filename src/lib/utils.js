export function daysSince(ts) {
  return Math.floor((Date.now() - ts) / 86_400_000);
}

export function targetDate(startedAt, offsetDays) {
  const d = new Date(startedAt + offsetDays * 86_400_000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function targetDateLong(startedAt, offsetDays) {
  const d = new Date(startedAt + offsetDays * 86_400_000);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
