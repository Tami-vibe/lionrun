import type {BlockItem} from './blocks';
import type {MediaSettings} from '../media/model';

export type ReviewOrigin = 'manual' | 'demo' | 'plugin';
export type ReviewLayout = 'featured' | 'grid' | 'carousel';
export type ReviewRecord = {
  id: string;
  name: string;
  quote: string;
  stars?: number;
  date?: string;
  service?: string;
  source?: string;
  avatar?: MediaSettings;
  details?: string;
  origin: ReviewOrigin;
};
export type ReviewFeed = {origin: ReviewOrigin; reviews: ReviewRecord[]};

const text = (value?: string) => value?.trim() || undefined;
export function reviewOrigin(group?: string): ReviewOrigin {
  return group==='demo'||group==='plugin' ? group : 'manual';
}
export function reviewsFromItems(items: BlockItem[]): ReviewRecord[] {
  return items.map((item, index) => ({
    id: String(index),
    name: item.title.trim(),
    quote: item.description.trim(),
    stars: item.stars,
    date: text(item.when),
    service: text(item.tag),
    source: text(item.source),
    avatar: item.media?.src ? item.media : undefined,
    details: text(item.note),
    origin: reviewOrigin(item.group),
  }));
}
// ponytail: one adapter, a Reviews Plugin calls this and the same cards render.
export function reviewsFromPlugin(reviews: ReviewRecord[]): ReviewFeed {
  return {origin: 'plugin', reviews: reviews.map(review => ({...review, origin: 'plugin' as const}))};
}
export function reviewLayout(layout: string): ReviewLayout {
  if (layout==='One large quote') return 'featured';
  if (layout==='Carousel') return 'carousel';
  return 'grid';
}
export function reviewLayoutName(layout: ReviewLayout) {
  return layout==='featured' ? 'One large quote' : layout==='carousel' ? 'Carousel' : 'Review cards';
}
export function reviewInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length===1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase();
}
