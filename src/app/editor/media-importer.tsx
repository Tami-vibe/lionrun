import {useId, useState, type ClipboardEvent, type DragEvent, type ReactNode} from 'react';
import {ChevronLeft, ChevronRight, FolderOpen, Image as ImageIcon, Link2, Play, Upload, X} from 'lucide-react';

export function mediaFileName(src: string, names: Map<string, string>) {
  if (src.startsWith('media:')) return names.get(src.slice(6)) || 'Uploaded file';
  const leaf = src.split('/').pop() || src;
  try { return decodeURIComponent(leaf.split('?')[0]); } catch { return leaf; }
}

export function MediaImporter({
  owner, hint, accept, placeholder, items, selected, busy, blocked, status,
  onFiles, onLink, onLibrary, onSelect, onRemove, onReorder, compact = false,
}: {
  owner: string; hint: string; accept: string; placeholder: string;
  items: {name: string; kind: 'image' | 'video'; preview: ReactNode}[];
  selected: number; busy: boolean; blocked: boolean; status: string;
  onFiles: (files: File[]) => void; onLink: (value: string) => boolean; onLibrary: () => void;
  onSelect: (index: number) => void; onRemove: (index: number) => void; onReorder: (from: number, to: number) => void;
  compact?: boolean;
}) {
  const titleId = useId();
  const [over, setOver] = useState(false);
  const [linking, setLinking] = useState(false);
  const [link, setLink] = useState('');
  const shut = busy || blocked;
  const take = (files: File[], text: string) => {
    if (shut) return;
    if (files.length) onFiles(files);
    else if (text.trim() && onLink(text)) { setLink(''); setLinking(false); }
  };
  const fromDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (!shut) take([...event.dataTransfer.files], event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain'));
  };
  const dropProps = {
    className: over ? 'hero-drop is-over' : 'hero-drop',
    onDragOver: (event: DragEvent) => { event.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: fromDrop,
    onPaste: (event: ClipboardEvent) => { const text = event.clipboardData.getData('text/plain'); if (text.trim()) { event.preventDefault(); take([], text); } },
  };
  const upload = (
    <label className="hero-upload" aria-disabled={shut || undefined}>
      <Upload size={16} aria-hidden="true" />{compact ? 'Upload' : 'Upload files'}
      <input type="file" accept={accept} multiple disabled={shut} onChange={event => { const files = event.target.files; event.target.value = ''; if (files?.length) onFiles([...files]); }} />
    </label>
  );
  const linkBtn = <button type="button" className="hero-link" disabled={shut} onClick={() => setLinking(open => !open)}><Link2 size={16} aria-hidden="true" />Add link</button>;
  return (
    <div className={compact ? 'media-import is-compact' : 'media-import'}>
      {compact ? !items.length && (
        <div {...dropProps}>
          <span className="hero-drop-mark" aria-hidden="true"><ImageIcon size={16} /><Play size={16} /></span>
          <p>Drop images or videos here</p>
          <p className="helper-text">From your computer or a direct media link.</p>
        </div>
      ) : (
        <div {...dropProps}>
          <p>Drop files or paste a link</p>
          <div className="hero-drop-actions">{upload}{linkBtn}</div>
          <button type="button" className="media-import-library" disabled={shut} onClick={onLibrary}><FolderOpen size={16} aria-hidden="true" />Choose from library</button>
        </div>
      )}
      {!compact && <p className="media-import-hint">{hint}</p>}
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
                if (!payload) { fromDrop(event); return; }
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
              {!compact && <span className="hero-tile-name">{item.name}</span>}
            </div>
          ))}
        </div>
      )}
      {compact && <div className="hero-drop-actions compact-actions">{upload}{linkBtn}<button type="button" className="hero-link" disabled={shut} onClick={onLibrary}><FolderOpen size={16} aria-hidden="true" />Library</button></div>}
      {linking && (compact ? (
        <form onSubmit={event => { event.preventDefault(); if (onLink(link)) { setLink(''); setLinking(false); } }}>
          <label className="field"><span>Direct media link</span><input aria-label="Direct media link" inputMode="url" value={link} onChange={event => setLink(event.target.value)} placeholder={placeholder} /></label>
          <button type="submit" disabled={!link.trim()}>Add to {owner.toLowerCase()}</button>
        </form>
      ) : (
        <form className="media-link-dialog" role="dialog" aria-labelledby={titleId} onSubmit={event => { event.preventDefault(); if (onLink(link)) { setLink(''); setLinking(false); } }}>
          <div className="media-link-dialog-head">
            <strong id={titleId}>Add link</strong>
            <button type="button" aria-label="Close" onClick={() => setLinking(false)}><X size={16} aria-hidden="true" /></button>
          </div>
          <label className="field"><span>Media link</span><input aria-label="Media link" inputMode="url" value={link} placeholder={placeholder} onChange={event => setLink(event.target.value)} /></label>
          <p className="helper-text">Use a public file link. Private folders: download files, then upload.</p>
          <div className="media-link-dialog-actions">
            <button type="button" onClick={() => setLinking(false)}>Cancel</button>
            <button type="submit" className="media-link-submit" disabled={!link.trim()}>Add media</button>
          </div>
        </form>
      ))}
      {!compact && selected >= 0 && items[selected] && (
        <div className="hero-selected">
          <p className="media-filename">Selected: {items[selected].name}</p>
          <button type="button" aria-label="Move earlier" aria-keyshortcuts="Alt+ArrowLeft" disabled={selected === 0} onClick={() => onReorder(selected, selected - 1)}><ChevronLeft size={16} aria-hidden="true" /></button>
          <button type="button" aria-label="Move later" aria-keyshortcuts="Alt+ArrowRight" disabled={selected === items.length - 1} onClick={() => onReorder(selected, selected + 1)}><ChevronRight size={16} aria-hidden="true" /></button>
        </div>
      )}
      {status && <p className="helper-text" role={compact && (busy || blocked) ? 'status' : 'alert'}>{status}</p>}
      {!compact && <p className="helper-text">X removes the selected item from this section. Undo is available.</p>}
    </div>
  );
}
