import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Accessibility, Copy, Crop, Eye, EyeOff, MoreVertical, Play, Plus, RefreshCw, Trash2} from 'lucide-react';
import type {BlockItem} from '../site/blocks';
import {icons, type IconName} from '../site/blocks';
import {Icon} from '../site/icons';
import {mediaDefaults, normalizeMedia, type MediaSettings} from '../media/model';
import {MediaPicker, MediaView, publishAsset, useMediaLibrary} from '../media/library';
import {ACCEPT} from '../media/store';
import {directMediaLink} from '../site/hero-collection';
import {ServicesContentView} from './fields';
import {MediaFramingControls, MediaVideoControls} from './media-controls';
import {MediaImporter, mediaFileName} from './media-importer';
import {ensureServiceIds, newServiceId, serviceId, serviceMediaKind, servicePreviewCap} from '../site/service-model';
import {useMediaCollection} from './use-media-collection';

const previewLimit = 4;

function withMedia(item: BlockItem, src: string, kind: 'image' | 'video'): BlockItem {
  const media: MediaSettings = {...mediaDefaults, ...item.media, src, kind, alt: item.media?.alt || item.title || ''};
  return {...item, media};
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

  return <ServicesContentView
    list={list}
    pages={pages}
    homePreviewNote={homePreviewNote}
    listLocked={listLocked}
    visible={visible}
    hiddenCount={hiddenCount}
    current={current}
    item={item}
    media={media}
    mediaKind={mediaKind}
    panel={panel}
    busy={busy}
    notice={notice}
    names={names}
    menu={menu}
    expanded={expanded}
    library={library}
    poster={poster}
    removed={!!removed}
    setExpanded={setExpanded}
    setMenu={setMenu}
    setPanel={setPanel}
    setMediaKind={setMediaKind}
    setNotice={setNotice}
    setLibrary={setLibrary}
    setPoster={setPoster}
    selectAt={selectAt}
    cloneAt={cloneAt}
    toggleHidden={toggleHidden}
    removeAt={removeAt}
    reorder={(from, to) => reorder(list, from, to, write)}
    addService={addService}
    writeSelected={writeSelected}
    writeMedia={writeMedia}
    setFiles={setFiles}
    addLink={addLink}
    onOpenPage={onOpenPage}
    onUndoRemoval={() => undoRemoval(list, write)}
    onDismissRemoval={() => setRemoved(null)}
  />;
}
