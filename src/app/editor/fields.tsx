"use client";
import {createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Accessibility, Copy, Crop, Eye, EyeOff, MoreVertical, Play, RefreshCw, Trash2} from 'lucide-react';
import {Plus} from 'lucide-react';
import {linkedPage} from '../site/settings';
import {ChevronDown, Link, Mail, Phone} from 'lucide-react';
import {IconName, icons} from '../site/blocks';
import {iconChoices, IconGlyph} from '../site/icons';
import {Icon} from '../site/icons';
import {destinationBody, destinationGuidance, destinationKind, destinationWarning, sectionAnchorName, sectionTargets, storedDestination, withDestinationKind, withLinkMode, type DestinationKind, type LinkMode} from './destination';
import {catalog as sections} from '../site/catalog';
import type {BlockItem} from '../site/blocks';
import {mediaDefaults, normalizeMedia, type MediaSettings} from '../media/model';
import {MediaPicker, MediaView} from '../media/library';
import {ACCEPT} from '../media/store';
import {MediaFramingControls, MediaVideoControls} from './media-controls';
import {MediaImporter, mediaFileName} from './media-importer';
import {serviceId} from '../site/service-model';
import {Field, SidebarSelect as Choice} from './components/fields';

export type {EditScope, EditScopeApi} from './components/edit-scope';
export {EditScopeContext, useEditScope} from './components/edit-scope';
import {useEditScope} from './components/edit-scope';
export {Field} from './components/fields';
export function Toggle({label,checked,change,hint}:{label:string;checked:boolean;change:(checked:boolean)=>void;hint?:string}) {
  return <label className="visibility-toggle">
    <div className="toggle-info">
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </div>
    <input type="checkbox" role="switch" checked={checked} onChange={e=>change(e.target.checked)}/>
  </label>;
}
export function Fold({icon, label, note, disabled, open, children}:{icon?: ReactNode; label: string; note?: string; disabled?: boolean; open?: boolean; children?: ReactNode}) {
  return (
    <details className={disabled ? 'editor-fold is-disabled' : 'editor-fold'} open={open || undefined}>
      <summary aria-disabled={disabled || undefined} onClick={disabled ? event => event.preventDefault() : undefined}>
        {icon}<span>{label}</span>{note && <span className="fold-note">{note}</span>}<ChevronDown size={16} className="fold-chevron" aria-hidden="true" />
      </summary>
      {!disabled && children}
    </details>
  );
}
export {SidebarSlider as RangeControl} from './components/fields';
const destinationKinds: {id: DestinationKind; label: string; icon: typeof Link; tip: string}[] = [{id:"link", label:"Link", icon:Link, tip:"Website address or section link"},{id:"phone", label:"Call", icon:Phone, tip:"Opens the visitor's calling app."},{id:"email", label:"Email", icon:Mail, tip:"Opens the visitor's email app."}];
export const DestinationPagesContext=createContext<{id:string;name:string;slug?:string}[]>([]);
export function Destination({label = "Destination", value, onChange, sections: pageSections, linksOnly = false}:{label?: string; value: string; onChange: (value: string) => void; sections?: {id: string; type: string}[]; linksOnly?: boolean}) {
  const scope = useEditScope();
  const pages=useContext(DestinationPagesContext);
  const selectedPage=linkedPage(pages,value);
  const helpId = useId();
  const warningId = useId();
  const labelId = useId();
  const [checked, setChecked] = useState(() => destinationWarning(value) !== "");
  const kind = linksOnly ? "link" : destinationKind(value);
  const targets = sectionTargets(pageSections?.length ? pageSections : sections.map(section => ({id: section.id, type: section.id})));
  const recognized = sectionAnchorName(value);
  const inferred: LinkMode | 'page' | null = kind !== "link" ? null : selectedPage ? "page" : recognized ? "section" : value.trim() ? "website" : null;
  const [chosenMode, setChosenMode] = useState<LinkMode | 'page' | null>(null);
  const linkChoice = inferred ?? chosenMode ?? "section";
  const guidance = linkChoice === "page" ? (selectedPage?`Opens ${selectedPage.name} on your website.`:"Choose a page on your website.") : destinationGuidance(value, kind === "link" ? linkChoice : undefined);
  const warning = destinationWarning(value);
  const showWarning = checked && warning !== "";
  const describedBy = showWarning ? `${helpId} ${warningId}` : helpId;
  const currentAnchor = value.trim();
  const known = targets.some(target => target.anchor.toLowerCase() === currentAnchor.toLowerCase());
  const options = recognized && !known ? [{anchor: currentAnchor, label: recognized}, ...targets] : targets;
  const selectedAnchor = targets.find(target => target.anchor.toLowerCase() === currentAnchor.toLowerCase())?.anchor ?? (recognized ? currentAnchor : "");
  const chooseKind = (nextKind: DestinationKind) => {
    setChecked(false);
    const next = withDestinationKind(value, nextKind);
    if (next !== value) onChange(next);
  };
  const chooseMode = (mode: LinkMode | 'page') => {
    setChecked(false);
    setChosenMode(mode);
    const next = mode === "page" ? "" : withLinkMode(value, mode);
    if (linksOnly && destinationKind(value) !== "link") onChange("");
    else if (next !== value) onChange(next);
  };
  const inputLabel = linksOnly ? "Review website" : kind === "phone" ? "Phone number" : kind === "email" ? "Email address" : "Website address";
  const incompatible = linksOnly && destinationKind(value) !== "link";
  return <div className="field">
    <span id={labelId}>{label}</span>
    {!linksOnly && <div className="segmented destination-kind" role="group" aria-labelledby={labelId}>{destinationKinds.map(item => { const Glyph = item.icon; return <button type="button" key={item.id} title={item.tip} aria-pressed={kind===item.id} onClick={() => chooseKind(item.id)}><Glyph size={16} strokeWidth={1.75} aria-hidden="true"/>{item.label}</button>; })}</div>}
    {kind === "link" && <div className="field destination-type-field"><label><span>Destination</span><select aria-label="Destination" value={linkChoice} onChange={event => chooseMode(event.target.value as LinkMode | "page")}>{pages.length>0&&<option value="page">Page on my website</option>}<option value="section">Section on this page</option><option value="website">Website address</option></select></label></div>}
    {kind === "link" && linkChoice === "page" && <label className="field"><span>Page</span><select aria-label="Page on my website" value={selectedPage?.id||''} onChange={e=>onChange(e.target.value?`/?page=${encodeURIComponent(e.target.value)}`:'')}><option value="">Choose a page</option>{pages.map(page=><option key={page.id} value={page.id}>{page.name}</option>)}</select></label>}
    {kind === "link" && linkChoice === "section"
      ? <div className="field destination-target-field"><label><span>Section</span><select aria-label="Section on this page" aria-describedby={describedBy} value={selectedAnchor} {...scope} onChange={event => { setChecked(false); onChange(event.target.value); }} onBlur={() => { scope.onBlur(); setChecked(true); }}><option value="">Choose a section</option>{options.map(option => <option key={option.anchor} value={option.anchor}>{option.label}</option>)}</select></label></div>
      : (kind === "phone" || kind === "email" || (kind === "link" && linkChoice === "website")) && <div className="field destination-input-field"><label><span>{inputLabel}</span><input aria-label={inputLabel} aria-describedby={describedBy} inputMode={kind==="phone" ? "tel" : kind==="email" ? "email" : "url"} value={incompatible ? value : destinationBody(value)} {...scope} onChange={event => { setChecked(false); onChange(incompatible || linksOnly ? event.target.value : storedDestination(kind, event.target.value)); }} onBlur={() => { scope.onBlur(); setChecked(true); }}/></label></div>}
    <p id={helpId} className="helper-text">{incompatible ? "Review links open a page or a section on this page." : linksOnly && linkChoice === "website" && value.trim() ? "Opens your customer reviews." : guidance}</p>
    {showWarning && <p id={warningId} className="helper-text" role="status">{warning}</p>}
  </div>;
}
export function IconPicker({label, value, onChange, options, compact = false}:{label:string; value:IconName; onChange:(icon:IconName)=>void; options:readonly IconName[]; compact?: boolean}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const allowed = new Set(options);
  const choices = iconChoices.filter(choice => allowed.has(choice.id));
  const current = choices.find(choice => choice.id === value) || iconChoices.find(choice => choice.id === value) || iconChoices[0];
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)&&!popover.current?.contains(event.target as Node)) setOpen(false); };
    const keys = (event: KeyboardEvent) => { if (event.key !== "Escape") return; event.preventDefault(); setOpen(false); trigger.current?.focus(); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", keys);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", keys); };
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const button = trigger.current;
      const panel = popover.current?.querySelector(".icon-picker-panel");
      if (!button || !(panel instanceof HTMLElement)) return;
      const bounds = button.closest(".panelbody")?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
      const box = button.getBoundingClientRect();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const left = Math.max(bounds.left + 8, Math.min(box.left, bounds.right - width - 8));
      const below = bounds.bottom - box.bottom;
      const top = below >= height + 8 || box.top - bounds.top < height + 8 ? box.bottom + 8 : box.top - height - 8;
      panel.style.left = `${left}px`;
      panel.style.top = `${Math.max(bounds.top + 8, Math.min(top, bounds.bottom - height - 8))}px`;
    };
    place();
    const scroller = trigger.current?.closest(".panelbody");
    scroller?.addEventListener("scroll", place);
    window.addEventListener("resize", place);
    return () => { scroller?.removeEventListener("scroll", place); window.removeEventListener("resize", place); };
  }, [open]);
  const addIcon = compact && value === "none";
  return <div className={compact ? "icon-picker is-compact" : "field icon-picker"} ref={root}>{!compact && <span>{label}</span>}<button ref={trigger} type="button" className={addIcon ? "icon-picker-trigger is-add" : "icon-picker-trigger"} title={addIcon ? "Add icon" : current.label} aria-label={addIcon ? "Add icon" : `${label}, ${current.label}`} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(shown=>!shown)}>{addIcon ? "Add icon" : <IconGlyph name={current.id} size={compact ? 16 : 18}/>}</button>{open&&createPortal(<div className="editor-popover-layer" ref={popover}><IconGrid label={label} choices={choices} value={value} onChange={icon=>{onChange(icon); setOpen(false); trigger.current?.focus();}}/></div>,document.body)}</div>;
}
function IconGrid({label, choices, value, onChange}:{label:string; choices:{id:IconName; label:string}[]; value:IconName; onChange:(icon:IconName)=>void}) {
  const selected = Math.max(0, choices.findIndex(choice => choice.id === value));
  const [cursor, setCursor] = useState(selected);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => { buttons.current[cursor]?.focus(); }, [cursor]);
  return <div className="icon-picker-panel" role="dialog" aria-label={label} onKeyDown={event => {
    const columns = 5;
    const step = {ArrowRight:1, ArrowLeft:-1, ArrowDown:columns, ArrowUp:-columns, Home:-cursor, End:choices.length - 1 - cursor}[event.key];
    if (step === undefined) return;
    event.preventDefault();
    setCursor(Math.max(0, Math.min(choices.length - 1, cursor + step)));
  }}>{choices.map((choice, index) => <button type="button" key={choice.id} ref={node => { buttons.current[index] = node; }} className="icon-picker-option" title={choice.label} aria-label={choice.label} aria-pressed={choice.id===value} tabIndex={index===cursor?0:-1} onClick={()=>onChange(choice.id)}><IconGlyph name={choice.id}/></button>)}</div>;
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
  onHref,
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

function ServiceDetailsPanel({
  item,
  pages,
  listLocked,
  writeSelected,
  onOpenPage,
}: {
  item: BlockItem;
  pages: {id: string; name: string}[];
  listLocked: boolean;
  writeSelected: (patch: Partial<BlockItem>) => void;
  onOpenPage?: (id: string) => void;
}) {
  return <div className="service-panel" role="tabpanel">
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
  </div>;
}

function ServiceMediaPanel({
  item,
  media,
  mediaKind,
  busy,
  notice,
  names,
  listLocked,
  writeSelected,
  writeMedia,
  setMediaKind,
  setNotice,
  setLibrary,
  setPoster,
  setFiles,
  addLink,
}: {
  item: BlockItem;
  media: MediaSettings | null;
  mediaKind: 'icon' | 'media';
  busy: boolean;
  notice: string;
  names: Map<string, string>;
  listLocked: boolean;
  writeSelected: (patch: Partial<BlockItem>) => void;
  writeMedia: (patch: Partial<MediaSettings>) => void;
  setMediaKind: (value: 'icon' | 'media') => void;
  setNotice: (notice: string) => void;
  setLibrary: (value: boolean) => void;
  setPoster: (value: boolean) => void;
  setFiles: (files: File[], replace: boolean) => void;
  addLink: (value: string) => boolean;
}) {
  const importerItems = media?.src ? [{
    name: mediaFileName(media.src, names),
    kind: media.kind === 'video' ? 'video' as const : 'image' as const,
    preview: (
      <>
        <MediaView value={{...media, controls: false, autoplay: false}} editable />
        {media.kind === 'video' && <span className="hero-tile-play"><Play size={16} aria-hidden="true" /></span>}
      </>
    )
  }] : [];
  return <div className="service-panel" role="tabpanel">
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
                  <input
                    type="file"
                    accept={ACCEPT}
                    disabled={busy}
                    aria-label={`Replace ${importerItems[0]?.name || 'media'}`}
                    onChange={event => {
                      const files = event.target.files;
                      event.target.value = '';
                      if (files?.length) void setFiles([...files], true);
                    }}
                  />
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
                      showMuted={!listLocked}
                      showMobileFallback
                    />
                  </Fold>
                )}
              </>
            )}
          </>
        )}
      </>
    )}
  </div>;
}

function ServiceRowActions({
  hidden,
  allowClone,
  onClone,
  onToggleHidden,
  onRemove,
}: {
  hidden: boolean;
  allowClone: boolean;
  onClone: () => void;
  onToggleHidden: () => void;
  onRemove: () => void;
}) {
  return <div className="service-row-actions" role="menu">
    <button type="button" role="menuitem" disabled={!allowClone} onClick={onClone}>
      <Copy size={16} strokeWidth={1.75} aria-hidden="true" /><span>Clone</span>
    </button>
    <button type="button" role="menuitem" onClick={onToggleHidden}>
      {hidden
        ? <><Eye size={16} strokeWidth={1.75} aria-hidden="true" /><span>Show</span></>
        : <><EyeOff size={16} strokeWidth={1.75} aria-hidden="true" /><span>Hide</span></>}
    </button>
    <button type="button" role="menuitem" className="is-danger" onClick={onRemove}>
      <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" /><span>Delete</span>
    </button>
  </div>;
}

export function ServicesContentView({
  list,
  pages,
  homePreviewNote,
  listLocked = false,
  visible,
  hiddenCount,
  current,
  item,
  media,
  mediaKind,
  panel,
  busy,
  notice,
  names,
  menu,
  library,
  poster,
  removed,
  setExpanded,
  setMenu,
  setPanel,
  setMediaKind,
  setNotice,
  setLibrary,
  setPoster,
  selectAt,
  cloneAt,
  toggleHidden,
  removeAt,
  reorder,
  addService,
  writeSelected,
  writeMedia,
  setFiles,
  addLink,
  onOpenPage,
  onUndoRemoval,
  onDismissRemoval,
}: {
  list: BlockItem[];
  pages: {id: string; name: string}[];
  homePreviewNote?: string;
  listLocked?: boolean;
  visible: number;
  hiddenCount: number;
  current: number;
  item: BlockItem | null;
  media: MediaSettings | null;
  mediaKind: 'icon' | 'media';
  panel: 'details' | 'media';
  busy: boolean;
  notice: string;
  names: Map<string, string>;
  menu: number | null;
  expanded: boolean;
  library: boolean;
  poster: boolean;
  removed: boolean;
  setExpanded: (value: boolean) => void;
  setMenu: (value: number | null) => void;
  setPanel: (value: 'details' | 'media') => void;
  setMediaKind: (value: 'icon' | 'media') => void;
  setNotice: (notice: string) => void;
  setLibrary: (value: boolean) => void;
  setPoster: (value: boolean) => void;
  selectAt: (index: number) => void;
  cloneAt: (index: number) => void;
  toggleHidden: (index: number) => void;
  removeAt: (index: number) => void;
  reorder: (from: number, to: number) => void;
  addService: () => void;
  writeSelected: (patch: Partial<BlockItem>) => void;
  writeMedia: (patch: Partial<MediaSettings>) => void;
  setFiles: (files: File[], replace: boolean) => void;
  addLink: (value: string) => boolean;
  onOpenPage?: (id: string) => void;
  onUndoRemoval: () => void;
  onDismissRemoval: () => void;
}) {
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
                reorder(from, index);
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
                    <ServiceRowActions
                      hidden={!!row.hidden}
                      allowClone={list.length < 60}
                      onClone={() => cloneAt(index)}
                      onToggleHidden={() => toggleHidden(index)}
                      onRemove={() => removeAt(index)}
                    />
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
            <ServiceDetailsPanel
              item={item}
              pages={pages}
              listLocked={listLocked}
              writeSelected={writeSelected}
              onOpenPage={onOpenPage}
            />
          )}
          {panel === 'media' && (
            <ServiceMediaPanel
              item={item}
              media={media}
              mediaKind={mediaKind}
              busy={busy}
              notice={notice}
              names={names}
              listLocked={listLocked}
              writeSelected={writeSelected}
              writeMedia={writeMedia}
              setMediaKind={setMediaKind}
              setNotice={setNotice}
              setLibrary={setLibrary}
              setPoster={setPoster}
              setFiles={setFiles}
              addLink={addLink}
            />
          )}
        </div>
      )}

      {removed && (
        <p className="media-toast" role="status">
          Removed from Services
          <button type="button" onClick={onUndoRemoval}>Undo</button>
          <button type="button" aria-label="Dismiss" onClick={onDismissRemoval}>×</button>
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
