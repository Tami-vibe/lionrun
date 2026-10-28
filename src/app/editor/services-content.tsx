import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Accessibility, Copy, Crop, Eye, EyeOff, MoreVertical, Play, Plus, RefreshCw, Trash2} from 'lucide-react';
import type {BlockItem} from '../site/blocks';
import {icons, type IconName} from '../site/blocks';
import {Icon} from '../site/icons';
import {mediaDefaults, normalizeMedia, type MediaSettings} from '../media/model';
import {MediaPicker, MediaView, publishAsset, useMediaLibrary} from '../media/library';
import {ACCEPT} from '../media/store';
import {directMediaLink} from '../site/hero-collection';
import {Choice, Field, Fold, IconPicker} from './fields';
import {MediaFramingControls, MediaVideoControls} from './media-controls';
import {MediaImporter, mediaFileName} from './media-importer';
import {ensureServiceIds, newServiceId, serviceId, serviceMediaKind, servicePreviewCap} from '../site/service-model';
import {useMediaCollection} from './use-media-collection';

const previewLimit = 4;

function withMedia(item: BlockItem, src: string, kind: 'image' | 'video'): BlockItem {
  const media: MediaSettings = {...mediaDefaults, ...item.media, src, kind, alt: item.media?.alt || item.title || ''};
  return {...item, media};
}

function ServiceThumb({item}: {item: BlockItem}) {
  const media = item.media?.src ? normalizeMedia(item.media) : null;
  if (media?.src) {
    const still = media.kind === 'video' && media.poster
      ? {...media, kind: 'image' as const, src: media.poster}
      : media.kind === 'video'
        ? null
        : media;
    return (
      <span className="service-row-thumb">
        {still?.src ? <MediaView value={{...still, controls: false, autoplay: false}} editable /> : <span className="service-row-fallback" />}
        {media.kind === 'video' && <span className="service-row-play"><Play size={12} aria-hidden="true" /></span>}
      </span>
    );
  }
  return (
    <span className="service-row-thumb is-icon">
      {item.icon !== 'none' ? <Icon name={item.icon} size={20} /> : <span className="service-row-fallback" aria-hidden="true" />}
    </span>
  );
}

function ServicePageLink({
  item,
  pages,
  onOpenPage,
  onHref
}: {
  item: BlockItem;
  pages: {id: string; name: string}[];
  onOpenPage?: (id: string) => void;
  onHref: (href: string | undefined) => void;
}) {
  const title = item.title.trim();
  const page = item.pageId ? pages.find(entry => entry.id === item.pageId) : undefined;
  return (
    <div className="service-page-link">
      {!title && <p className="helper-text">Name the service to make its page.</p>}
      {title && !page && <p className="helper-text">Saving creates this page.</p>}
      {page && (
        <div className="service-page-row">
          <p className="helper-text">Opens: {page.name}</p>
          <button type="button" className="subtle-action" onClick={() => onOpenPage?.(page.id)}>
            Edit this page
          </button>
        </div>
      )}
      <Fold label="Other link" note={item.href?.trim() ? 'Set' : undefined}>
        <Field
          label="Call, email, or website"
          value={item.href || ''}
          onChange={value => onHref(value.trim() || undefined)}
        />
        <p className="helper-text">Optional. Use a phone, email, or website instead of the service page.</p>
      </Fold>
    </div>
  );
}

export function ServicesContent({
  items,
  pages,
  homePreviewNote,
  listLocked = false,
  change,
  onFocusItem,
  onOpenPage
}: {
  items: BlockItem[];
  pages: {id: string; name: string}[];
  homePreviewNote?: string;
  listLocked?: boolean;
  change: (items: BlockItem[]) => void;
  onFocusItem?: (id: string | null) => void;
  onOpenPage?: (id: string) => void;
}) {
  const list = ensureServiceIds(items);
  const {assets, reload} = useMediaLibrary();
  const names = new Map(assets.map(asset => [asset.id, asset.name]));
  const {setSelected, current, notice, setNotice, busy, setBusy, library, setLibrary, poster, setPoster, removed, setRemoved, removeAt: removeCollection, reorder, undoRemoval} = useMediaCollection<BlockItem>(list.length);
  const [panel, setPanel] = useState<'details' | 'media'>('details');
  const [mediaKind, setMediaKind] = useState<'icon' | 'media'>('icon');
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  const item = current >= 0 ? list[current] : null;
  const media = item?.media?.src ? normalizeMedia(item.media) : null;
  const listExpanded = expanded || current >= previewLimit;
  const visible = servicePreviewCap(list.length, listExpanded, previewLimit);
  const hiddenCount = Math.max(0, list.length - visible);
  const latest = useRef({list, current, change, reload});
  const uploading = useRef(false);

  useLayoutEffect(() => {
    latest.current = {list, current, change, reload};
  });

  useEffect(() => {
    if (!items.some(row => !row.id?.trim())) return;
    change(ensureServiceIds(items));
  }, [items, change]);

  useEffect(() => {
    onFocusItem?.(item ? serviceId(item, current) : null);
    return () => onFocusItem?.(null);
  }, [item, current, onFocusItem]);

  function write(next: BlockItem[]) {
    change(ensureServiceIds(next));
  }

  function writeSelected(patch: Partial<BlockItem>) {
    if (current < 0) return;
    write(list.map((row, index) => index === current ? {...row, ...patch} : row));
  }

  function writeMedia(patch: Partial<MediaSettings>) {
    if (current < 0 || !list[current]?.media?.src) return;
    const base = normalizeMedia(list[current].media!);
    writeSelected({media: {...base, ...patch}});
  }

  function selectAt(index: number) {
    setSelected(index);
    setMenu(null);
    setPanel('details');
    const row = list[index];
    if (row) setMediaKind(serviceMediaKind(row));
  }

  function addService() {
    if (listLocked || list.length >= 60) return;
    const next = [...list, {id: newServiceId(), title: '', description: '', icon: 'none' as IconName}];
    write(next);
    setSelected(next.length - 1);
    setExpanded(true);
    setPanel('details');
    setMediaKind('icon');
    setNotice('');
  }

  function removeAt(index: number) {
    if (listLocked) return;
    removeCollection(list, index, write);
    setMenu(null);
  }

  function cloneAt(index: number) {
    if (listLocked || list.length >= 60) return;
    const row = list[index];
    if (!row) return;
    const copy: BlockItem = {
      ...structuredClone(row),
      id: newServiceId(),
      title: row.title.trim() ? `${row.title} (copy)` : '',
      pageId: undefined
    };
    const next = [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
    write(next);
    setSelected(index + 1);
    setExpanded(true);
    setMenu(null);
    setNotice('');
  }

  function toggleHidden(index: number) {
    if (listLocked) return;
    const row = list[index];
    if (!row) return;
    write(list.map((entry, i) => i === index ? {...entry, hidden: row.hidden ? undefined : true} : entry));
    setMenu(null);
  }

  async function setFiles(files: File[], replace: boolean) {
    if (uploading.current) return;
    const start = latest.current;
    const startItem = start.current >= 0 ? start.list[start.current] : null;
    if (!startItem) return;
    const targetId = serviceId(startItem, start.current);
    uploading.current = true;
    setBusy(true);
    setNotice(replace || startItem.media?.src ? 'Replacing…' : 'Saving…');
    const errors: string[] = [];
    let published: {src: string; kind: 'image' | 'video'} | null = null;
    for (const file of files.slice(0, 1)) {
      try {
        const asset = await publishAsset(file, latest.current.reload);
        if (asset.kind !== 'image' && asset.kind !== 'video') throw Error(`${file.name} is not an image or video.`);
        published = {src: `media:${asset.id}`, kind: asset.kind};
      } catch (reason) {
        errors.push(reason instanceof Error ? reason.message : 'That file could not be added.');
      }
    }
    uploading.current = false;
    if (!published) {
      setNotice(errors[0] || 'That file could not be added.');
      setBusy(false);
      return;
    }
    const live = latest.current;
    const at = live.list.findIndex((row, index) => serviceId(row, index) === targetId);
    if (at < 0) {
      setNotice('Service was removed before the upload finished. The file is in the library.');
      setBusy(false);
      return;
    }
    live.change(ensureServiceIds(live.list.map((row, index) => index === at ? withMedia(row, published!.src, published!.kind) : row)));
    setSelected(at);
    setMediaKind('media');
    setPanel('media');
    setNotice(errors[0] || '');
    setBusy(false);
  }

  function addLink(value: string) {
    if (!item || current < 0) return false;
    const result = directMediaLink(value);
    if (!result.ok) { setNotice(result.error); return false; }
    if (result.kind !== 'image' && result.kind !== 'video') { setNotice('Use an image or video link.'); return false; }
    writeSelected({media: {...mediaDefaults, ...item.media, src: result.src, kind: result.kind, alt: item.media?.alt || item.title || ''}});
    setMediaKind('media');
    setNotice('');
    return true;
  }

  const importerItems = media?.src
    ? [{
        name: mediaFileName(media.src, names),
        kind: media.kind === 'video' ? 'video' as const : 'image' as const,
        preview: (
          <>
            <MediaView value={{...media, controls: false, autoplay: false}} editable />
            {media.kind === 'video' && <span className="hero-tile-play"><Play size={16} aria-hidden="true" /></span>}
          </>
        )
      }]
    : [];

  return (
    <div className="service-collection">
      {homePreviewNote && <p className="hint">{homePreviewNote}</p>}
      <div className="service-rows" role="list" aria-label="Services">
        {list.slice(0, visible).map((row, index) => {
          const active = index === current;
          const label = row.title.trim() || `Service ${index + 1}`;
          return (
            <div
              key={serviceId(row, index)}
              className={`service-row${row.hidden ? ' is-hidden' : ''}`}
              role="listitem"
              data-selected={active || undefined}
              data-hidden={row.hidden || undefined}
              draggable={!listLocked}
              onDragStart={event => { if (listLocked) { event.preventDefault(); return; } event.dataTransfer.setData('application/x-service-index', String(index)); event.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={event => { if (!listLocked) event.preventDefault(); }}
              onDrop={event => {
                if (listLocked) return;
                const from = Number(event.dataTransfer.getData('application/x-service-index'));
                if (!Number.isInteger(from) || from === index) return;
                event.preventDefault();
                reorder(list, from, index, write);
              }}
            >
              <button type="button" className="service-row-select" aria-pressed={active} onClick={() => selectAt(index)}>
                <ServiceThumb item={row} />
                <span className="service-row-label">{label}{row.hidden ? ' (hidden)' : ''}</span>
              </button>
              {!listLocked && (
                <div className="service-row-menu">
                  <button type="button" className="service-row-more" aria-label={`Actions for ${label}`} aria-expanded={menu === index} onClick={() => setMenu(menu === index ? null : index)}>
                    <MoreVertical size={16} aria-hidden="true" />
                  </button>
                  {menu === index && (
                    <div className="service-row-actions" role="menu">
                      <button type="button" role="menuitem" disabled={list.length >= 60} onClick={() => cloneAt(index)}>
                        <Copy size={16} strokeWidth={1.75} aria-hidden="true" /><span>Clone</span>
                      </button>
                      <button type="button" role="menuitem" onClick={() => toggleHidden(index)}>
                        {row.hidden
                          ? <><Eye size={16} strokeWidth={1.75} aria-hidden="true" /><span>Show</span></>
                          : <><EyeOff size={16} strokeWidth={1.75} aria-hidden="true" /><span>Hide</span></>}
                      </button>
                      <button type="button" role="menuitem" className="is-danger" onClick={() => removeAt(index)}>
                        <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" /><span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hiddenCount > 0 && <button type="button" className="subtle-action" onClick={() => setExpanded(true)}>Show {hiddenCount} more</button>}
      {!listLocked && <button type="button" className="wide service-add" disabled={list.length >= 60} onClick={addService}><Plus size={16} aria-hidden="true" />Add service</button>}
      {!listLocked && list.length >= 60 && <p className="hint">This section has as many items as it can hold.</p>}

      {item && current >= 0 && (
        <div className="service-selected">
          <div className="service-tabs" role="tablist" aria-label="Selected service">
            <button type="button" role="tab" aria-selected={panel === 'details'} onClick={() => setPanel('details')}>Details</button>
            <button type="button" role="tab" aria-selected={panel === 'media'} onClick={() => setPanel('media')}>Media</button>
          </div>
          {panel === 'details' && (
            <div className="service-panel" role="tabpanel">
              {listLocked ? (
                <>
                  <p className="field"><span>Title</span><strong>{item.title.trim() || 'Untitled service'}</strong></p>
                  {item.description.trim() && <p className="helper-text">{item.description}</p>}
                  {item.price?.trim() && <p className="helper-text">Price: {item.price}</p>}
                </>
              ) : (
                <>
                  <Field label="Title" value={item.title} onChange={title => writeSelected({title})} />
                  <Field label="Description" value={item.description} multiline onChange={description => writeSelected({description})} />
                  <Field label="Price" value={item.price || ''} onChange={price => writeSelected({price: price.trim() || undefined})} />
                  <ServicePageLink
                    item={item}
                    pages={pages}
                    onOpenPage={onOpenPage}
                    onHref={href => writeSelected({href})}
                  />
                </>
              )}
            </div>
          )}
          {panel === 'media' && (
            <div className="service-panel" role="tabpanel">
              {listLocked ? (
                <p className="helper-text">Icons and media are edited on Home. This page only chooses how the synced list is laid out.</p>
              ) : (
              <>
              <Choice
                label="Media type"
                value={mediaKind}
                onChange={value => {
                  setMediaKind(value);
                  setNotice(value === 'media' && !item.media?.src ? 'Upload, paste a link, or choose from the library.' : '');
                }}
                options={[{value: 'icon', label: 'Icon'}, {value: 'media', label: 'Image / Video'}]}
              />
              {mediaKind === 'icon' && <IconPicker label="Icon" value={item.icon} onChange={icon => writeSelected({icon})} options={icons} />}
              {mediaKind === 'media' && (
                <>
                  <MediaImporter
                    owner="Service"
                    hint="One image or video for this service"
                    accept={ACCEPT}
                    placeholder="https://example.com/photo.jpg"
                    items={importerItems}
                    selected={importerItems.length ? 0 : -1}
                    busy={busy}
                    blocked={false}
                    status={busy ? notice || 'Saving…' : notice || (media?.src ? 'Upload replaces the current media.' : '')}
                    onFiles={files => void setFiles(files, !!media?.src)}
                    onLink={addLink}
                    onLibrary={() => setLibrary(true)}
                    onSelect={() => undefined}
                    onRemove={() => writeSelected({media: undefined})}
                    onReorder={() => undefined}
                  />
                  {media?.src && (
                    <>
                      <label className="media-replace">
                        <RefreshCw size={16} aria-hidden="true" />Replace
                        <input type="file" accept={ACCEPT} disabled={busy} aria-label={`Replace ${importerItems[0]?.name || 'media'}`} onChange={event => { const files = event.target.files; event.target.value = ''; if (files?.length) void setFiles([...files], true); }} />
                      </label>
                      <Fold icon={<Crop size={16} aria-hidden="true" />} label="Details" note="Framing and layout options">
                        <MediaFramingControls media={media} onChange={writeMedia} />
                      </Fold>
                      <Fold icon={<Accessibility size={16} aria-hidden="true" />} label="Accessibility" note="Alt text and screen reader support">
                        <Field label="Alternative text" value={media.alt || ''} onChange={alt => writeMedia({alt})} />
                        <p className="helper-text">Describe the media for people who cannot see it.</p>
                        {media.kind !== 'image' && (
                          <>
                            <Field label="Captions link (.vtt)" value={media.captions} onChange={captions => writeMedia({captions})} />
                            <Field label="Caption language" value={media.captionLanguage} onChange={captionLanguage => writeMedia({captionLanguage})} />
                          </>
                        )}
                      </Fold>
                      {media.kind !== 'image' && (
                        <Fold icon={<Play size={16} aria-hidden="true" />} label="Video settings">
                          <MediaVideoControls
                            media={media}
                            posterLabel={media.poster ? mediaFileName(media.poster, names) : 'No poster'}
                            onChange={writeMedia}
                            onChoosePoster={() => setPoster(true)}
                            showMobileFallback={false}
                          />
                        </Fold>
                      )}
                    </>
                  )}
                </>
              )}
              </>
              )}
            </div>
          )}
        </div>
      )}

      {removed && (
        <p className="media-toast" role="status">
          Removed from Services
          <button type="button" onClick={() => undoRemoval(list, write)}>Undo</button>
          <button type="button" aria-label="Dismiss" onClick={() => setRemoved(null)}>×</button>
        </p>
      )}
      {library && <MediaPicker label="Choose from library" onClose={() => setLibrary(false)} onSelect={(src, kind) => {
        if (kind !== 'image' && kind !== 'video') { setNotice('Choose an image or video.'); return; }
        writeSelected({media: {...mediaDefaults, ...item?.media, src, kind, alt: item?.media?.alt || item?.title || ''}});
        setMediaKind('media');
        setLibrary(false);
        setNotice('');
      }} />}
      {poster && <MediaPicker label="Choose poster" imagesOnly onSelect={src => { writeMedia({poster: src}); setPoster(false); }} onClose={() => setPoster(false)} />}
    </div>
  );
}
