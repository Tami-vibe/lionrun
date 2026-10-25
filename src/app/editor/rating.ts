export function scoreWarning(value: string): string {
  const text = value.trim();
  if (!text || /^(?:[0-4](?:\.\d)?|5(?:\.0)?)$/.test(text)) return "";
  return "Enter a score from 0 to 5.";
}

export function countWarning(value: string): string {
  const text = value.trim();
  if (!text || /^(?:0|[1-9]\d*)$/.test(text)) return "";
  return "Enter a whole number of reviews.";
}

export function ratingSummary(score: string, count: string): string {
  const shownScore = score.trim();
  const shownCount = count.trim();
  if (!shownScore || !shownCount || scoreWarning(shownScore) || countWarning(shownCount)) return "";
  return `${shownScore} · ${shownCount} reviews`;
}
