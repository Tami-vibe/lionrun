import {mediaDefaults, mediaURL, normalizeMedia, type MediaSettings} from "../media/model";

export const HERO_ADD_LIMIT = 3;

export function directMediaLink(value: string): {ok: true; src: string; kind: "image" | "video"} | {ok: false; error: string} {
  const src = mediaURL(value.trim());
  if (!src) return {ok: false, error: "Use an HTTPS address or a file in this site’s media folder."};
  if (src.startsWith("media:")) return {ok: false, error: "Upload that file with Upload files. A library id is not a direct media link."};
  if (src.startsWith("data:image/")) return {ok: true, src, kind: "image"};
  const path = src.split("?")[0].split("#")[0].toLowerCase();
  if (/\.(mp4|webm|mov)$/.test(path)) return {ok: true, src, kind: "video"};
  if (/\.(jpg|jpeg|png|webp|avif|svg)$/.test(path)) return {ok: true, src, kind: "image"};
  return {ok: false, error: "That address is a web page, not an image or video file. Paste a direct file address ending in .jpg, .png, .webp, .mp4, or .webm."};
}
export function heroSlides(content: {media?: MediaSettings; slides?: MediaSettings[]}) {
  return [content.media, ...(content.slides || [])].filter((item): item is MediaSettings => !!item?.src);
}
export function collectionPatch(items:MediaSettings[],start?:number) {
  const filled=items.filter(item=>item.src).map(normalizeMedia);
  return {media:filled[0]||{...mediaDefaults},slides:filled.slice(1),slideIndex:publishedStart(start,filled.length)};
}
export function moveItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
export function slideAdvancePlan(input: {autoplay: boolean; count: number; reducedMotion: boolean; advance: string; kind: string; seconds: number}) {
  if (!input.autoplay || input.count < 2 || input.reducedMotion) return {mode: "off" as const, seconds: 0};
  const seconds = Number.isFinite(input.seconds) && input.seconds > 0 ? input.seconds : 5;
  if (input.advance === "end" && input.kind === "video") return {mode: "end" as const, seconds};
  return {mode: "timer" as const, seconds};
}
export function slideIndexAllowed(index: number | undefined, count: number) {
  return index === undefined || (Number.isInteger(index) && index >= 0 && (count === 0 ? index === 0 : index < count));
}
export function publishedStart(index: number | undefined, count: number) {
  if (count <= 0 || !Number.isInteger(index) || index! < 0) return 0;
  return Math.min(index!, count - 1);
}
export function removalStart(removedAt: number, index: number | undefined, countBefore: number) {
  const start = publishedStart(index, countBefore);
  if (countBefore <= 1 || removedAt < 0 || removedAt >= countBefore) return start;
  if (removedAt < start) return start - 1;
  if (removedAt > start) return start;
  return Math.min(removedAt, countBefore - 2);
}
export function restoreRemoved<T>(items: readonly T[], item: T, index: number) {
  const next = items.slice();
  next.splice(Math.min(Math.max(0, index), next.length), 0, item);
  return next;
}
export function reorderStart(from: number, to: number, index: number | undefined, count: number) {
  const start = publishedStart(index, count);
  if (from === to || from < 0 || to < 0 || from >= count || to >= count) return start;
  if (start === from) return to;
  if (from < start && to >= start) return start - 1;
  if (from > start && to <= start) return start + 1;
  return start;
}
