import {type ReactNode} from 'react';
import {MediaUpload} from './media-upload';
import {ChevronLeft, ChevronRight, X} from 'lucide-react';

export function mediaFileName(src: string, names: Map<string, string>) {
  if (src.startsWith('media:')) return names.get(src.slice(6)) || 'Uploaded file';
  const leaf = src.split('/').pop() || src;
  try { return decodeURIComponent(leaf.split('?')[0]); } catch { return leaf; }
}

export function MediaImporter({
  owner, accept, items, selected, busy, blocked, status, limitNote,
  onFiles, onLink, onLibrary, onSelect, onRemove, onReorder, compact = false,
}: {
  owner: string; hint?: string; accept: string; placeholder: string;
  items: {name: string; kind: 'image' | 'video'; preview: ReactNode}[];
  selected: number; busy: boolean; blocked: boolean; status: string; limitNote?: string;
  onFiles: (files: File[]) => void; onLink: (value: string) => boolean; onLibrary: () => void;
  onSelect: (index: number) => void; onRemove: (index: number) => void; onReorder: (from: number, to: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'media-import is-compact' : 'media-import'}>
      <MediaUpload label={(accept.includes("video")||accept.includes(".mp4"))?"Add images or videos":"Add images"} accept={accept} onFiles={onFiles} onLink={onLink} onLibrary={onLibrary} busy={busy} blocked={blocked} status={limitNote||status}/>
      {!!items.length && <span className="media-section-subhead">Images and videos</span>}
      {!!items.length && (
        <div className="hero-grid" role="list" aria-label={`${owner} media`}>
          {items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="hero-tile"
              role="listitem"
              data-selected={index === selected}
              draggable
              onDragStart={event => { event.dataTransfer.setData('application/x-hero-index', String(index)); event.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={event => event.preventDefault()}
              onDrop={event => {
                const payload = event.dataTransfer.getData('application/x-hero-index');
                if (!payload) return;
                event.preventDefault();
                event.stopPropagation();
                const from = Number(payload);
                if (Number.isInteger(from)) onReorder(from, index);
              }}
              onKeyDown={event => {
                if (!(event.target as HTMLElement).closest('.hero-tile-select')) return;
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                const step = event.key === 'ArrowRight' ? 1 : -1;
                if (event.altKey) onReorder(index, index + step);
                else onSelect(Math.min(items.length - 1, Math.max(0, index + step)));
              }}
            >
              <button type="button" className="hero-tile-select" aria-pressed={index === selected} aria-label={`Select ${index + 1}. ${item.name}`} onClick={() => onSelect(index)}>
                <span className="hero-tile-frame">{item.preview}</span>
              </button>
              <button type="button" className="hero-tile-remove" aria-label={`Remove ${item.name} from this ${owner.toLowerCase()}`} onClick={event => { event.stopPropagation(); onRemove(index); }}><X size={12} aria-hidden="true" /></button>
              <span className="hero-tile-name">{item.name}</span>
            </div>
          ))}
        </div>
      )}
      {selected >= 0 && items[selected] && (
        <div className="hero-selected">
          <div className="hero-selected-meta">
            <span className="hero-selected-heading">Selected media</span>
            <span className="media-filename">{items[selected].name}</span>
          </div>
          <div className="hero-selected-actions">
            <button type="button" className="hero-reorder-btn" title="Move earlier" aria-label="Move earlier" aria-keyshortcuts="Alt+ArrowLeft" disabled={selected === 0} onClick={() => onReorder(selected, selected - 1)}><ChevronLeft size={16} aria-hidden="true" /></button>
            <button type="button" className="hero-reorder-btn" title="Move later" aria-label="Move later" aria-keyshortcuts="Alt+ArrowRight" disabled={selected === items.length - 1} onClick={() => onReorder(selected, selected + 1)}><ChevronRight size={16} aria-hidden="true" /></button>
          </div>
        </div>
      )}

    </div>
  );
}
