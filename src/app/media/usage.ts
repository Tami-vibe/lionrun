import {sectionName, type SectionId} from '../site/catalog';
import type {Block, BlockContent, Site} from '../site/blocks';
import type {MediaSettings} from './model';

type MediaUseField = 'image' | 'poster' | 'captions' | 'slide' | 'story' | 'before' | 'after' | 'item' | 'logo';

export type MediaUse = {
  pageId: string;
  pageName: string;
  blockId: string;
  sectionType: SectionId;
  sectionLabel: string;
  field: MediaUseField;
};

export type MediaUsageIndex = Map<string, MediaUse[]>;

export function mediaAssetId(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') return '';
  return /^media:[\w-]+$/.test(value) ? value.slice(6) : '';
}

function push(index: MediaUsageIndex, id: string, use: MediaUse) {
  if (!id) return;
  const rows = index.get(id);
  if (rows) rows.push(use);
  else index.set(id, [use]);
}

function scanMedia(
  index: MediaUsageIndex,
  media: Partial<MediaSettings> | undefined,
  base: Omit<MediaUse, 'field'>,
  field: MediaUseField = 'image'
) {
  if (!media) return;
  push(index, mediaAssetId(media.src), {...base, field});
  push(index, mediaAssetId(media.poster), {...base, field: 'poster'});
  push(index, mediaAssetId(media.captions), {...base, field: 'captions'});
}

function scanContent(index: MediaUsageIndex, block: Block, pageId: string, pageName: string) {
  const c: BlockContent = block.content;
  const base = {
    pageId,
    pageName,
    blockId: block.id,
    sectionType: block.type,
    sectionLabel: sectionName(block.type)
  };
  scanMedia(index, c.media, base, 'image');
  scanMedia(index, c.footer?.logo, base, 'logo');
  scanMedia(index, c.story, base, 'story');
  scanMedia(index, c.before, base, 'before');
  scanMedia(index, c.after, base, 'after');
  for (const slide of c.slides || []) scanMedia(index, slide, base, 'slide');
  for (const item of c.items || []) scanMedia(index, item.media, base, 'item');
}

export function collectMediaUsage(pages: {id: string; name: string; site: Site}[]): MediaUsageIndex {
  const index: MediaUsageIndex = new Map();
  for (const page of pages) {
    for (const block of page.site.blocks || []) scanContent(index, block, page.id, page.name);
  }
  return index;
}

export function usageLabels(index: MediaUsageIndex, assetId: string): string[] {
  return (index.get(assetId) || []).map(use => `${use.pageName} → ${use.sectionLabel} (${use.field})`);
}

export function isAssetUnused(index: MediaUsageIndex, assetId: string): boolean {
  return !(index.get(assetId)?.length);
}

export function libraryBytes(assets: {size: number}[]): number {
  return assets.reduce((sum, asset) => sum + (asset.size || 0), 0);
}
