import {ChevronDown, RefreshCw, Tag} from 'lucide-react';
import type {BlockItem} from '../site/blocks';
import {mediaDefaults, type MediaSettings} from '../media/model';
import {MediaPicker, publishAsset, useMediaLibrary} from '../media/library';
import {validateUpload} from '../media/store';
import {directMediaLink} from './hero-collection';
import {Destination, Field} from './fields';
import {logoDeliveryBlob} from './logo-asset';
import {MediaImporter, mediaFileName} from './media-importer';
import {useMediaCollection} from './use-media-collection';

const accept = 'image/jpeg,image/png,image/webp,image/avif,.svg,image/svg+xml';
const videoNote = 'Videos cannot be used as logos. Choose a JPEG, PNG, WebP, AVIF, or SVG image.';

function LogoThumb({src}: {src: string}) {
  return (
    // Object URLs from this browser’s library cannot go through next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" />
  );
}

function withImage(item: BlockItem, src: string): BlockItem {
  const media: MediaSettings = {...mediaDefaults, ...item.media, src, kind: 'image', fit: 'contain', alt: item.media?.alt || ''};
  return {...item, media, title: item.title, href: item.href, description: item.description};
}

export function LogosContent({items, sections, change}: {items: BlockItem[]; sections: {id: string; type: string}[]; change: (items: BlockItem[]) => void}) {
  const {assets, resolve, reload} = useMediaLibrary();
  const names = new Map(assets.map(asset => [asset.id, asset.name]));
  const {setSelected, current, notice, setNotice, busy, setBusy, library, setLibrary, removed, setRemoved, removeAt, reorder, undoRemoval} = useMediaCollection<BlockItem>(items.length, 0);

  async function storeImage(file: File) {
    const checked = await validateUpload(file);
    if (checked.kind !== 'image') throw Error(videoNote);
    const original = await publishAsset(file, reload);
    if (checked.mime === 'image/svg+xml') return `media:${original.id}`;
    const variant = await logoDeliveryBlob(checked.blob, checked.mime);
    if (variant === checked.blob) return `media:${original.id}`;
    const extension = variant.type === 'image/jpeg' ? '.jpg' : variant.type === 'image/webp' ? '.webp' : '.png';
    const delivered = await publishAsset(new File([variant], file.name.replace(/\.[^.]+$/, '') + extension, {type: variant.type}), reload);
    return `media:${delivered.id}`;
  }

  async function addFiles(list: File[], replaceAt: number | null) {
    setBusy(true);
    setNotice('');
    const next = items.slice();
    let first = replaceAt;
    let changed = false;
    const errors: string[] = [];
    for (const file of list) {
      try {
        const src = await storeImage(file);
        if (replaceAt !== null && file === list[0]) next[replaceAt] = withImage(next[replaceAt], src);
        else {
          if (first === null) first = next.length;
          next.push(withImage({title: file.name.replace(/\.[^.]+$/, ''), description: '', icon: 'none'}, src));
        }
        changed = true;
      } catch (reason) {
        errors.push(reason instanceof Error ? reason.message : 'That file could not be added.');
      }
    }
    if (changed) change(next);
    if (first !== null) setSelected(first);
    setNotice(errors[0] || '');
    setBusy(false);
  }

  function addLink(value: string) {
    const result = directMediaLink(value);
    if (!result.ok) { setNotice(result.error); return false; }
    if (result.kind !== 'image') { setNotice(videoNote); return false; }
    const leaf = mediaFileName(result.src, names).replace(/\.[^.]+$/, '');
    change([...items, withImage({title: leaf, description: '', icon: 'none'}, result.src)]);
    setSelected(items.length);
    setNotice('');
    return true;
  }

  const item = current < 0 ? null : items[current];
  const tiles = items.map((row, index) => {
    const src = row.media?.src ? resolve(row.media.src) : '';
    const name = row.media?.src ? mediaFileName(row.media.src, names) : (row.title.trim() || `Logo ${index + 1}`);
    return {name, kind: 'image' as const, preview: src ? <LogoThumb src={src} /> : <strong>{name.slice(0, 1)}</strong>};
  });

  return (
    <div className="logo-collection">
      <MediaImporter
        owner="Partner logos"
        hint="Images and SVG · sized automatically"
        accept={accept}
        placeholder="https://example.com/logo.svg"
        items={tiles}
        selected={current}
        busy={busy}
        blocked={false}
        status={busy ? 'Saving…' : notice}
        onFiles={files => void addFiles(files, null)}
        onLink={addLink}
        onLibrary={() => setLibrary(true)}
        onSelect={setSelected}
        onRemove={index => removeAt(items, index, change)}
        onReorder={(from, to) => reorder(items, from, to, change)}
      />
      {item && current >= 0 && (
        <>
          <details className="editor-fold" open>
            <summary><Tag size={16} aria-hidden="true" /><span>Logo name (optional)</span><ChevronDown size={16} className="fold-chevron" aria-hidden="true" /></summary>
            <Field label="Logo name" value={item.title} onChange={title => change(items.map((row, index) => index === current ? {...row, title} : row))} />
          </details>
          <label className="media-replace">
            <RefreshCw size={16} aria-hidden="true" />Replace
            <input type="file" accept={accept} disabled={busy} aria-label={`Replace ${tiles[current]?.name || 'logo'}`} onChange={event => { const list = event.target.files; event.target.value = ''; if (list?.length) void addFiles([...list], current); }} />
          </label>
          <details className="editor-fold">
            <summary><span>Accessibility</span><span className="fold-note">Originals stay unchanged. Logos fit automatically.</span><ChevronDown size={16} className="fold-chevron" aria-hidden="true" /></summary>
            <Destination label="Destination" value={item.href || ''} sections={sections} onChange={href => change(items.map((row, index) => index === current ? {...row, href: href.trim() || undefined} : row))} />
            <Field label="Accessible name" value={item.media?.alt || ''} onChange={alt => change(items.map((row, index) => index === current ? {...row, media: {...mediaDefaults, ...row.media, alt}} : row))} />
            <p className="helper-text">Leave the destination empty to show the logo without a link. A linked logo uses the accessible name.</p>
          </details>
        </>
      )}
      {removed && (
        <p className="media-toast" role="status">
          Removed from Partner logos
          <button type="button" onClick={() => undoRemoval(items, change)}>Undo</button>
          <button type="button" aria-label="Dismiss" onClick={() => setRemoved(null)}>×</button>
        </p>
      )}
      {library && <MediaPicker label="Choose from library" imagesOnly onClose={() => setLibrary(false)} onSelect={(src, kind) => {
        if (kind !== 'image') { setNotice(videoNote); return; }
        const row = withImage({title: mediaFileName(src, names).replace(/\.[^.]+$/, '') || 'Logo', description: '', icon: 'none'}, src);
        change([...items, row]);
        setSelected(items.length);
        setLibrary(false);
      }} />}
    </div>
  );
}
