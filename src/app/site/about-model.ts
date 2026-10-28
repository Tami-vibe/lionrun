export type GalleryMotion = 'still' | 'loop';
export type GalleryWidth = 'boxed' | 'full';

export function galleryMotion(value: unknown): GalleryMotion {
  return value === 'still' ? 'still' : 'loop';
}

export function galleryWidth(value: unknown): GalleryWidth {
  return value === 'full' ? 'full' : 'boxed';
}

/** Image scale multiplier, 1–2 in tenths. */
export function galleryScale(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
  return Math.round(Math.max(1, Math.min(2, value)) * 10) / 10;
}

export function gallerySpeed(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 3;
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function galleryDuration(value: unknown) {
  return 56 - gallerySpeed(value) * 8;
}

export function galleryPauseHover(value: unknown) {
  return value !== false;
}

/** Split items across the two marquee rows (first half / second half). */
export function galleryRows<T>(items: readonly T[]) {
  if (!items.length) return [[], []] as [T[], T[]];
  if (items.length === 1) return [[items[0]], [items[0]]] as [T[], T[]];
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)] as [T[], T[]];
}

/** Visible grid rows for Photos only (1–4). */
export function galleryGridRows(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value)) return 2;
  return Math.max(1, Math.min(4, value));
}

/** Story layout shows 1–2 featured frames from the collection. */
export function galleryFeaturedCount(value: unknown) {
  return value === 1 ? 1 : 2;
}

/** Repeat a row until it has enough frames to fill a desktop marquee. */
export function galleryTrack<T>(items: readonly T[], min = 5): T[] {
  if (!items.length) return [];
  if (items.length >= min) return [...items];
  const out: T[] = [];
  while (out.length < min) out.push(...items);
  return out;
}
