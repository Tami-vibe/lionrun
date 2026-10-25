"use client";
import {useEffect, useState, type ReactNode} from "react";
import {Accessibility, ChevronLeft, ChevronRight, Crop, Image as ImageIcon, Images, Layers, Link2, Play, Upload, X} from "lucide-react";
import {MediaPicker, MediaView, publishAsset, useMediaLibrary} from "../media/library";
import {mediaDefaults, normalizeMedia, type MediaSettings} from "../media/model";
import {ACCEPT} from "../media/store";
import type {BlockContent} from "../site/blocks";
import {useEditScope} from "./fields";
import {HERO_ADD_LIMIT, directMediaLink, heroSlides, moveItem, publishedStart, removalStart, reorderStart, restoreRemoved} from "./hero-collection";
import {useHeroFocus} from "./hero-focus";

const fileName = (src: string, names: Map<string, string>) => {
  if (src.startsWith("media:")) return names.get(src.slice(6)) || "Uploaded file";
  const leaf = src.split("/").pop() || src;
  try { return decodeURIComponent(leaf.split("?")[0]); } catch { return leaf; }
};
const origin = (src: string) => src.startsWith("media:") ? "Uploaded" : src.startsWith("/") ? "Site file" : "Linked";

export function HeroMediaEditor({content, layout, blockId, onChange}:{content: BlockContent; layout: string; blockId: string; onChange:(patch: Partial<BlockContent>)=>void}) {
  const {assets, reload} = useMediaLibrary();
  const {setFocus} = useHeroFocus();
  const names = new Map(assets.map(asset => [asset.id, asset.name]));
  const items = heroSlides(content);
  const [index, setIndex] = useState(() => publishedStart(content.slideIndex, heroSlides(content).length));
  const selected = items.length ? Math.min(Math.max(0, index), items.length - 1) : -1;
  const limitNote = items.length > HERO_ADD_LIMIT ? `This hero already has ${items.length} items, and they all stay. New items stop at ${HERO_ADD_LIMIT}.` : `This hero holds ${HERO_ADD_LIMIT} items.`;
  useEffect(() => { setFocus(selected < 0 ? null : {blockId, index: selected}); }, [blockId, selected, setFocus]);
  useEffect(() => () => setFocus(null), [setFocus]);
  const media = selected >= 0 ? normalizeMedia(items[selected]) : null;
  const [linking, setLinking] = useState(false);
  const [link, setLink] = useState("");
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState("");
  const [over, setOver] = useState(false);
  const [poster, setPoster] = useState(false);
  const [removed, setRemoved] = useState<null | {item: MediaSettings; index: number; slideIndex: number | undefined}>(null);
  useEffect(() => { if (!removed) return; const id = window.setTimeout(() => setRemoved(null), 8000); return () => window.clearTimeout(id); }, [removed]);
  const writeItems = (next: MediaSettings[], slideIndex?: number) => {
    const filled = next.filter(item => item.src).map(item => normalizeMedia(item));
    const patch: Partial<BlockContent> = {media: filled[0] || {...mediaDefaults}, slides: filled.slice(1)};
    if (slideIndex !== undefined && slideIndex !== publishedStart(content.slideIndex, filled.length)) patch.slideIndex = slideIndex;
    onChange(patch);
  };
  const select = (i: number) => setIndex(i);
  const writeSelected = (patch: Partial<MediaSettings>) => { if (selected < 0) return; writeItems(items.map((item, i) => i === selected ? {...item, ...patch} : item)); };
  const addItem = (item: MediaSettings) => {
    if (items.length >= HERO_ADD_LIMIT) { setNotice(limitNote); return false; }
    writeItems([...items, item]);
    setIndex(items.length);
    setNotice("");
    return true;
  };
  const addLink = (value: string) => {
    const result = directMediaLink(value);
    if (!result.ok) { setNotice(result.error); return; }
    if (addItem({...mediaDefaults, src: result.src, kind: result.kind, title: fileName(result.src, names)})) { setLink(""); setLinking(false); }
  };
  const addFiles = async (files: File[]) => {
    const room = HERO_ADD_LIMIT - items.length;
    if (room <= 0) { setNotice(limitNote); return; }
    const batch = [...files].slice(0, room);
    const next = [...items];
    const errors: string[] = [];
    for (let i = 0; i < batch.length; i++) {
      setProgress(`Adding ${i + 1} of ${batch.length}…`);
      try {
        const asset = await publishAsset(batch[i], reload);
        if (asset.kind !== "image" && asset.kind !== "video") throw Error(`${batch[i].name} is not an image or video.`);
        next.push(normalizeMedia({...mediaDefaults, src: `media:${asset.id}`, kind: asset.kind, title: asset.name}));
      } catch (reason) { errors.push(reason instanceof Error ? reason.message : String(reason)); }
    }
    if (files.length > batch.length) errors.push(`${limitNote} Extra files were not added.`);
    setProgress("");
    if (next.length > items.length) { writeItems(next); setIndex(items.length); }
    setNotice(errors.join(" "));
  };
  const removeAt = (i: number) => {
    const next = items.filter((_, n) => n !== i);
    const focus = next.length ? Math.min(i, next.length - 1) : 0;
    setRemoved({item: normalizeMedia(items[i]), index: i, slideIndex: content.slideIndex});
    setIndex(next.length ? focus : -1);
    writeItems(next, removalStart(i, content.slideIndex, items.length));
  };
  const reorder = (from: number, to: number) => {
    const next = moveItem(items, from, to);
    const focus = selected === from ? to : selected;
    writeItems(next, reorderStart(from, to, content.slideIndex, items.length));
    setIndex(Math.max(0, focus));
  };
  const undo = () => {
    if (!removed) return;
    const current = heroSlides(content);
    const next = restoreRemoved(current, removed.item, removed.index);
    const adjusted = removalStart(removed.index, removed.slideIndex, next.length);
    const slideIndex = publishedStart(content.slideIndex, current.length) === adjusted ? removed.slideIndex : undefined;
    writeItems(next, slideIndex);
    setIndex(next.length ? Math.min(removed.index, next.length - 1) : -1);
    setRemoved(null);
  };
  const shade = content.fade ? "bottom" : (content.darkness ?? 36) === 0 ? "none" : "solid";
  const color = /^#[0-9a-f]{6}$/i.test(content.background || "") ? content.background! : "#0b1420";
  const drop = (event: React.DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (event.dataTransfer.types.includes("application/x-hero-index")) return;
    const files = [...event.dataTransfer.files];
    if (files.length) { if (items.length >= HERO_ADD_LIMIT) setNotice(limitNote); else void addFiles(files); return; }
    const text = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
    if (text.trim()) addLink(text);
  };
  return <div className="list-editor">
    <div className={over ? "hero-drop is-over" : "hero-drop"} onDragOver={event => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}>
      {!items.length && <span className="hero-drop-mark" aria-hidden="true"><ImageIcon size={16}/><Play size={16}/></span>}
      <p>{items.length ? "Drop files or a media link" : "Drop images or videos here"}</p>
      {!items.length && <p className="helper-text">From your computer or a direct media link.</p>}
      <div className="hero-drop-actions">
        <label className="hero-upload"><Upload size={16} aria-hidden="true"/>Upload files<input type="file" accept={ACCEPT} multiple disabled={items.length >= HERO_ADD_LIMIT} onChange={event => { const files = event.target.files; event.target.value = ""; if (files?.length) void addFiles([...files]); }}/></label>
        <button type="button" className="hero-link" disabled={items.length >= HERO_ADD_LIMIT} onClick={() => setLinking(open => !open)}><Link2 size={16} aria-hidden="true"/>Add link</button>
      </div>
    </div>
    {linking && <form onSubmit={event => { event.preventDefault(); addLink(link); }}>
      <label className="field"><span>Direct media link</span><input aria-label="Direct media link" inputMode="url" value={link} onChange={event => { setLink(event.target.value); setNotice(""); }} placeholder="https://example.com/photo.jpg"/></label>
      <button type="submit" disabled={!link.trim()}>Add to hero</button>
    </form>}
    {(progress || notice || items.length >= HERO_ADD_LIMIT) && <p className="helper-text" role={notice ? "alert" : "status"}>{progress || notice || limitNote}</p>}
    {!items.length && <p className="helper-text">Only media added to this Hero appears here.</p>}
    {!!items.length && <div className="hero-grid" role="list" aria-label="Hero media">
      {items.map((item, i) => {
        const name = fileName(item.src, names);
        return <div key={`${item.src}-${i}`} className="hero-tile" role="button" tabIndex={0} aria-pressed={i === selected} aria-label={`${i + 1}. ${name}, ${origin(item.src)}`} draggable onClick={() => select(i)} onKeyDown={event => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const step = event.key === "ArrowRight" ? 1 : -1;
          if (event.altKey) reorder(i, i + step);
          else select(Math.min(items.length - 1, Math.max(0, i + step)));
        }} onDragStart={event => { event.dataTransfer.setData("application/x-hero-index", String(i)); event.dataTransfer.effectAllowed = "move"; }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); event.stopPropagation(); const from = Number(event.dataTransfer.getData("application/x-hero-index")); if (Number.isInteger(from)) reorder(from, i); }}>
          <span className="hero-tile-frame">{item.src && <MediaView value={{...item, controls: false, autoplay: false}} editable/>}<span className="hero-tile-index">{i + 1}</span>{item.kind === "video" && <span className="hero-tile-play"><Play size={16} aria-hidden="true"/></span>}</span>
          <button type="button" className="hero-tile-remove" aria-label={`Remove ${name} from this hero`} onClick={event => { event.stopPropagation(); removeAt(i); }}><X size={12} aria-hidden="true"/></button>
          <span className="hero-tile-name">{name}</span>
        </div>;
      })}
    </div>}
    {media && <div className="hero-selected">
      <p className="media-filename">Selected: {fileName(media.src, names)} · {origin(media.src)}</p>
      <button type="button" aria-label="Move earlier" aria-keyshortcuts="Alt+ArrowLeft" disabled={selected === 0} onClick={() => reorder(selected, selected - 1)}><ChevronLeft size={16} aria-hidden="true"/></button>
      <button type="button" aria-label="Move later" aria-keyshortcuts="Alt+ArrowRight" disabled={selected === items.length - 1} onClick={() => reorder(selected, selected + 1)}><ChevronRight size={16} aria-hidden="true"/></button>
    </div>}
    {media && layout !== "story" && <TextControl label="Label on image (optional)" value={content.indexLabel || ""} onChange={indexLabel => onChange({indexLabel})}/>}
    <Fold icon={<Crop size={16} aria-hidden="true"/>} label="Framing" disabled={!media} note={media ? undefined : "Add media first"}>
      {media && <>
        <div className="stat-table"><span className="col">Shape</span><span className="col">Display</span>
          <select aria-label="Shape" value={media.ratio} onChange={event => writeSelected({ratio: event.target.value})}>{["16/9", "4/3", "1/1", "9/16", "21/9"].map(ratio => <option key={ratio}>{ratio}</option>)}</select>
          <select aria-label="Display" value={media.fit} onChange={event => writeSelected({fit: event.target.value as MediaSettings["fit"]})}><option value="cover">Fill frame</option><option value="contain">Fit inside</option></select>
        </div>
        <RangeControl label="Zoom" min={0.25} max={4} step={0.05} value={media.zoom} text={`${Math.round(media.zoom * 100)}%`} onChange={zoom => writeSelected({zoom})}/>
        <RangeControl label="Horizontal position" min={0} max={100} step={1} value={media.x} text={`${media.x}%`} onChange={x => writeSelected({x})}/>
        <RangeControl label="Vertical position" min={0} max={100} step={1} value={media.y} text={`${media.y}%`} onChange={y => writeSelected({y})}/>
        <button type="button" onClick={() => writeSelected({zoom: 1, x: 50, y: 50})}>Reset framing</button>
      </>}
    </Fold>
    <Fold icon={<Layers size={16} aria-hidden="true"/>} label="Overlay">
      <div className="overlay-tiles" role="group" aria-label="Overlay">{(["none", "solid", "bottom"] as const).map(mode => <button type="button" key={mode} className="overlay-tile" aria-pressed={shade === mode} onClick={() => onChange(mode === "none" ? {darkness: 0, fade: false} : mode === "bottom" ? {fade: true, fadeWidth: content.fadeWidth ?? 45, darkness: content.darkness || 36} : {fade: false, darkness: content.darkness || 36})}><span className={`overlay-swatch is-${mode}`} style={mode === "none" ? undefined : mode === "solid" ? {background: color} : {background: `linear-gradient(to top, ${color}, transparent)`}}/>{mode === "bottom" ? "Bottom" : mode[0].toUpperCase() + mode.slice(1)}</button>)}</div>
      {shade !== "none" && <>
        <label className="field"><span>Color</span><input aria-label="Overlay color" type="color" value={color} onChange={event => onChange({background: event.target.value})}/></label>
        <RangeControl label="Darkness" min={0} max={80} step={1} value={content.darkness ?? 36} text={String(content.darkness ?? 36)} onChange={darkness => onChange({darkness})}/>
        {shade === "bottom" && <RangeControl label="Coverage" min={0} max={100} step={1} value={Math.round(content.fadeWidth ?? 45)} text={`${Math.round(content.fadeWidth ?? 45)}%`} onChange={fadeWidth => onChange({fadeWidth})}/>}
      </>}
      <button type="button" onClick={() => onChange({fade: false, darkness: 64})}>Improve text readability</button>
    </Fold>
    <Fold icon={<Play size={16} aria-hidden="true"/>} label="Video settings" disabled={!media || media.kind === "image"} note={!media ? "Add media first" : media.kind === "image" ? "Disabled for selected image" : undefined}>
      {media && media.kind !== "image" && <>
        <label className="switch-row"><span>Muted</span><input type="checkbox" role="switch" checked={media.muted} onChange={event => writeSelected({muted: event.target.checked})}/></label>
        <label className="switch-row"><span>Loop</span><input type="checkbox" role="switch" checked={media.playback === "loop"} onChange={event => writeSelected({playback: event.target.checked ? "loop" : "once"})}/></label>
        <label className="switch-row"><span>Autoplay</span><input type="checkbox" role="switch" checked={media.autoplay} onChange={event => writeSelected({autoplay: event.target.checked})}/></label>
        <p className="media-filename">{media.poster ? fileName(media.poster, names) : "No poster"}</p>
        <button type="button" onClick={() => setPoster(true)}>Choose poster</button>
        <label className="field"><span>Mobile fallback</span><select aria-label="Mobile fallback" value={media.mobile} onChange={event => writeSelected({mobile: event.target.value as MediaSettings["mobile"]})}><option value="same">Same media</option><option value="poster">Poster image</option><option value="hide">Hide media</option></select></label>
        {media.mobile === "poster" && !media.poster && <p className="helper-text" role="status">Choose a poster image for the mobile fallback.</p>}
      </>}
    </Fold>
    <Fold icon={<Images size={16} aria-hidden="true"/>} label="Slideshow">
      <label className="switch-row"><span>Play slideshow</span><input type="checkbox" role="switch" aria-label="Play slideshow" checked={!!content.slideAutoplay} onChange={event => onChange({slideAutoplay: event.target.checked})}/></label>
      <label className="field"><span>Image duration (seconds)</span><input aria-label="Image duration" type="number" min={1} max={30} value={content.slideSeconds ?? 5} onChange={event => onChange({slideSeconds: Math.min(30, Math.max(1, Number(event.target.value) || 5))})}/></label>
      <div className="overlay-tiles" role="group" aria-label="Video advance">
        <button type="button" aria-pressed={(content.slideAdvance ?? "time") === "time"} onClick={() => onChange({slideAdvance: "time"})}>Timer</button>
        <button type="button" aria-pressed={content.slideAdvance === "end"} onClick={() => onChange({slideAdvance: "end"})}>At clip end</button>
      </div>
      <label className="field"><span>Fade (milliseconds)</span><input aria-label="Fade" type="number" min={0} max={2000} step={50} value={content.slideFade ?? 0} onChange={event => onChange({slideFade: Math.min(2000, Math.max(0, Number(event.target.value) || 0))})}/></label>
    </Fold>
    <Fold icon={<Accessibility size={16} aria-hidden="true"/>} label="Accessibility" disabled={!media} note={media ? undefined : "Add media first"}>
      {media && <TextControl label="Description" value={media.alt} onChange={alt => writeSelected({alt})}/>}
    </Fold>
    <p className="helper-text">X removes the Hero item; originals and other sections remain intact.</p>
    {removed && <p className="media-toast" role="status">Removed from Hero <button type="button" onClick={undo}>Undo</button><button type="button" aria-label="Dismiss" onClick={() => setRemoved(null)}><X size={16} aria-hidden="true"/></button></p>}
    {poster && <MediaPicker label="Choose poster" imagesOnly onSelect={src => { writeSelected({poster: src}); setPoster(false); }} onClose={() => setPoster(false)}/>}
  </div>;
}

function Fold({icon, label, note, disabled, children}:{icon: ReactNode; label: string; note?: string; disabled?: boolean; children?: ReactNode}) {
  return <details className={disabled ? "editor-fold is-disabled" : "editor-fold"}>
    <summary aria-disabled={disabled || undefined} onClick={disabled ? event => event.preventDefault() : undefined}>{icon}<span>{label}</span>{note && <span className="fold-note">{note}</span>}</summary>
    {!disabled && children}
  </details>;
}
function TextControl({label, value, onChange}:{label: string; value: string; onChange:(value: string)=>void}) {
  const scope = useEditScope();
  return <label className="field"><span>{label}</span><input aria-label={label} value={value} {...scope} onChange={event => onChange(event.target.value)}/></label>;
}
function RangeControl({label, min, max, step, value, text, onChange}:{label: string; min: number; max: number; step: number; value: number; text: string; onChange:(value: number)=>void}) {
  const scope = useEditScope();
  return <label className="field"><span>{label}: {text}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} {...scope} onChange={event => onChange(Number(event.target.value))}/></label>;
}
