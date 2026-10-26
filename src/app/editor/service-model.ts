import type {BlockItem} from '../site/blocks';

export type ServiceMediaKind = 'icon' | 'media';

export function newServiceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `svc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureServiceIds(items: readonly BlockItem[]): BlockItem[] {
  const seen = new Set<string>();
  let changed = false;
  const next = items.map((item) => {
    let id = item.id?.trim() || '';
    if (!id || seen.has(id)) {
      id = newServiceId();
      changed = true;
    }
    seen.add(id);
    return item.id === id ? item : {...item, id};
  });
  return changed ? next : (items as BlockItem[]);
}

export function serviceId(item: BlockItem, index: number) {
  return item.id?.trim() || `svc-fallback-${index}`;
}

export function serviceMediaKind(item: BlockItem): ServiceMediaKind {
  return item.media?.src ? 'media' : 'icon';
}

export function servicePreviewCap(total: number, open: boolean, limit = 4) {
  if (open || total <= limit) return total;
  return limit;
}
