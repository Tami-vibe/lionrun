import {useState} from 'react';
import {Accessibility, Crop, Play, RefreshCw, Tag} from 'lucide-react';
import type {BlockContent, BlockItem} from '../site/blocks';
import {mediaDefaults, normalizeMedia, type MediaSettings} from '../media/model';
import {MediaPicker, MediaView, publishAsset, useMediaLibrary} from '../media/library';
import {ACCEPT} from '../media/store';
import {directMediaLink} from '../site/hero-collection';
import {Field, Fold} from './fields';
import {MediaFramingControls, MediaVideoControls} from './media-controls';
import {MediaImporter, mediaFileName} from './media-importer';
import {useMediaCollection} from './use-media-collection';

const previewLimit = 4;

function withMedia(item: BlockItem, src: string, kind: 'image' | 'video'): BlockItem {
  const media: MediaSettings = {...mediaDefaults, ...item.media, src, kind, alt: item.media?.alt || ''};
  return {...item, media};
}

export function AboutContent({content, change}: {content: BlockContent; change: (patch: Partial<BlockContent>) => void}) {
  const items = content.items;
  const {assets, reload} = useMediaLibrary();
  const names = new Map(assets.map(asset => [asset.id, asset.name]));
  const {setSelected, current, notice, setNotice, busy, setBusy, library, setLibrary, poster, setPoster, removed, setRemoved, removeAt, reorder, undoRemoval} = useMediaCollection<BlockItem>(items.length);
  const [expanded, setExpanded] = useState(false);
  const media = current >= 0 && items[current]?.media?.src ? normalizeMedia(items[current].media) : null;
  const listExpanded = expanded || current >= previewLimit;
  const visibleCount = listExpanded || items.length <= previewLimit ? items.length : previewLimit;
  const hidden = Math.max(0, items.length - visibleCount);

  function writeItems(next: BlockItem[]) {
    change({items: next});
  }

  function writeSelected(patch: Partial<BlockItem>) {
    if (current < 0) return;
    writeItems(items.map((item, index) => index === current ? {...item, ...patch} : item));
  }

  function writeMedia(patch: Partial<MediaSettings>) {
    if (current < 0 || !items[current]?.media?.src) return;
    const base = normalizeMedia(items[current].media!);
    writeSelected({media: {...base, ...patch}});
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
        if (next.length >= 60 && replaceAt === null) {
          errors.push('This gallery holds 60 items.');
          break;
        }
        const asset = await publishAsset(file, reload);
        if (asset.kind !== 'image' && asset.kind !== 'video') throw Error(`${file.name} is not an image or video.`);
        const src = `media:${asset.id}`;
        if (replaceAt !== null && file === list[0]) next[replaceAt] = withMedia(next[replaceAt], src, asset.kind);
        else {
          if (first === null) first = next.length;
          next.push(withMedia({title: '', description: '', icon: 'none', caption: asset.name.replace(/\.[^.]+$/, '')}, src, asset.kind));
        }
        changed = true;
      } catch (reason) {
        errors.push(reason instanceof Error ? reason.message : 'That file could not be added.');
      }
    }
    if (changed) writeItems(next);
    if (first !== null) setSelected(first);
    if (next.length > previewLimit) setExpanded(true);
    setNotice(errors[0] || '');
    setBusy(false);
  }

  function addLink(value: string) {
    const result = directMediaLink(value);
    if (!result.ok) { setNotice(result.error); return false; }
    if (items.length >= 60) { setNotice('This gallery holds 60 items.'); return false; }
    const leaf = mediaFileName(result.src, names).replace(/\.[^.]+$/, '');
    writeItems([...items, withMedia({title: '', description: '', icon: 'none', caption: leaf}, result.src, result.kind)]);
    setSelected(items.length);
    setExpanded(true);
    setNotice('');
    return true;
  }

  const tiles = items.slice(0, visibleCount).map((row, index) => {
    const src = row.media?.src || '';
    const name = src ? mediaFileName(src, names) : (row.caption?.trim() || row.title.trim() || `Photo ${index + 1}`);
    const kind = row.media?.kind === 'video' ? 'video' as const : 'image' as const;
    const preview = src ? (
      <>
        <MediaView value={{...mediaDefaults, ...row.media, src, controls: false, autoplay: false}} editable />
        {kind === 'video' && <span className="hero-tile-play"><Play size={16} aria-hidden="true" /></span>}
      </>
    ) : <strong>{name.slice(0, 1)}</strong>;
    return {name, kind, preview};
  });

  return (
    <div className="about-collection">
      <MediaImporter
        owner="About & gallery"
        hint="Images and videos"
        accept={ACCEPT}
        placeholder="https://example.com/photo.jpg"
        items={tiles}
        selected={current < visibleCount ? current : -1}
        busy={busy}
        blocked={items.length >= 60}
        status={busy ? 'Saving…' : notice || (items.length >= 60 ? 'This gallery holds 60 items.' : '')}
        onFiles={files => void addFiles(files, null)}
        onLink={addLink}
        onLibrary={() => setLibrary(true)}
        onSelect={setSelected}
        onRemove={index => removeAt(items, index, writeItems)}
        onReorder={(from, to) => reorder(items, from, to, writeItems)}
      />
      {hidden > 0 && (
        <button type="button" className="subtle-action" onClick={() => setExpanded(true)}>Show {hidden} more</button>
      )}
      {current >= 0 && items[current] && (
        <>
          <Fold icon={<Crop size={16} aria-hidden="true" />} label="Details" note="Framing and layout options" open>
            <Field label="Title" value={items[current].title} onChange={title => writeSelected({title})} />
            <Field label="Description" value={items[current].description} multiline onChange={description => writeSelected({description})} />
            <Field label="Caption" value={items[current].caption || ''} onChange={caption => writeSelected({caption})} />
            {media && <MediaFramingControls media={media} onChange={writeMedia} />}
          </Fold>
          <label className="media-replace">
            <RefreshCw size={16} aria-hidden="true" />Replace
            <input type="file" accept={ACCEPT} disabled={busy} aria-label={`Replace ${tiles[current]?.name || 'photo'}`} onChange={event => { const list = event.target.files; event.target.value = ''; if (list?.length) void addFiles([...list], current); }} />
          </label>
          <Fold icon={<Accessibility size={16} aria-hidden="true" />} label="Accessibility" note="Alt text and screen reader support">
            <Field label="Alternative text" value={media?.alt || ''} onChange={alt => writeMedia({alt})} />
            <p className="helper-text">Describe the media for people who cannot see it. Leave empty only when decorative.</p>
            {media && media.kind !== 'image' && (
              <>
                <Field label="Captions link (.vtt)" value={media.captions} onChange={captions => writeMedia({captions})} />
                <Field label="Caption language" value={media.captionLanguage} onChange={captionLanguage => writeMedia({captionLanguage})} />
              </>
            )}
          </Fold>
          <Fold icon={<Tag size={16} aria-hidden="true" />} label="Categories" note="Organize and filter gallery items">
            <Field label="Category" value={items[current].group || ''} onChange={group => writeSelected({group})} />
            <Field label="All photos label" value={content.allPhotosLabel || 'All photos'} onChange={allPhotosLabel => change({allPhotosLabel})} />
            <p className="helper-text">Category names become the filter pills on the page.</p>
          </Fold>
          {media && media.kind !== 'image' && (
            <Fold icon={<Play size={16} aria-hidden="true" />} label="Video settings">
              <MediaVideoControls
                media={media}
                posterLabel={media.poster ? mediaFileName(media.poster, names) : 'No poster'}
                onChange={writeMedia}
                onChoosePoster={() => setPoster(true)}
              />
            </Fold>
          )}
        </>
      )}
      {removed && (
        <p className="media-toast" role="status">
          Removed from About & gallery
          <button type="button" onClick={() => undoRemoval(items, writeItems)}>Undo</button>
          <button type="button" aria-label="Dismiss" onClick={() => setRemoved(null)}>×</button>
        </p>
      )}
      {library && <MediaPicker label="Choose from library" onClose={() => setLibrary(false)} onSelect={(src, kind) => {
        if (kind !== 'image' && kind !== 'video') { setNotice('Choose an image or video.'); return; }
        if (items.length >= 60) { setNotice('This gallery holds 60 items.'); return; }
        const leaf = mediaFileName(src, names).replace(/\.[^.]+$/, '') || 'Photo';
        writeItems([...items, withMedia({title: '', description: '', icon: 'none', caption: leaf}, src, kind)]);
        setSelected(items.length);
        setExpanded(true);
        setLibrary(false);
      }} />}
      {poster && <MediaPicker label="Choose poster" imagesOnly onSelect={src => { writeMedia({poster: src}); setPoster(false); }} onClose={() => setPoster(false)} />}
    </div>
  );
}
