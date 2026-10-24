const defaultHours = 'Monday–Friday  8:00–20:00\nSaturday  10:00–13:00\nSunday  Closed';
const legacyHours = /^8:00\s*[–-]\s*20:00$/;

export function contactHours(value: string | undefined): string {
  const hours = (value ?? '').trim();
  if (!hours || legacyHours.test(hours)) return defaultHours;
  return value ?? hours;
}
