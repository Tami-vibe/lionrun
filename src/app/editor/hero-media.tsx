"use client";
import {useEffect, useLayoutEffect, useRef, useState, type ReactNode} from "react";
import {Accessibility, ChevronDown, ChevronLeft, ChevronRight, Crop, FolderOpen, Image as ImageIcon, Images, Layers, Link2, Play, Upload, X} from "lucide-react";
import {MediaPicker, MediaView, publishAsset, useMediaLibrary} from "../media/library";
import {mediaDefaults, normalizeMedia, type MediaSettings} from "../media/model";
import {ACCEPT} from "../media/store";
import type {BlockContent} from "../site/blocks";
import {useEditScope} from "./fields";
import {HERO_ADD_LIMIT, collectionPatch, directMediaLink, heroSlides, moveItem, publishedStart, removalStart, reorderStart, restoreRemoved} from "./hero-collection";
import {useHeroFocus} from "./hero-focus";

const fileName = (src: string, names: Map<string, string>) => {
  if (src.startsWith("media:")) return names.get(src.slice(6)) || "Uploaded file";
  const leaf = src.split("/").pop() || src;
  try { return decodeURIComponent(leaf.split("?")[0]); } catch { return leaf; }
};
const origin = (src: string) => src.startsWith("media:") ? "Uploaded" : src.startsWith("/") ? "Site file" : "Linked";

export function HeroMediaEditor({content, layout, blockId, onChange, compact=false}:{compact?:boolean; content: BlockContent; layout: string; blockId: string; onChange:(patch: Partial<BlockContent>)=>void}) {
  const latest=useRef({content,onChange}),alive=useRef(true),uploading=useRef(false);
  useLayoutEffect(()=>{latest.current={content,onChange};});
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const owner=compact?"section":"Hero";
  const [library,setLibrary]=useState(false);
  const {assets, reload} = useMediaLibrary();
  const {setFocus} = useHeroFocus();
  const names = new Map(assets.map(asset => [asset.id, asset.name]));
  const items = heroSlides(content);
  const [index, setIndex] = useState(() => publishedStart(content.slideIndex, heroSlides(content).length));
  const mode=content.mediaMode||(content.media.kind==='image'?'image':'video');
  const candidate=items.length?Math.min(Math.max(0,index),items.length-1):-1;
  const matches=(item:MediaSettings)=>mode==='slideshow'||(mode==='image'?item.kind==='image':item.kind!=='image');
  const selected=compact&&candidate>=0&&!matches(items[candidate])?items.findIndex(matches):candidate;
  const limitNote = items.length > HERO_ADD_LIMIT ? `This ${owner.toLowerCase()} already has ${items.length} items, and they all stay. New items stop at ${HERO_ADD_LIMIT}.` : `This ${owner.toLowerCase()} holds ${HERO_ADD_LIMIT} items.`;
  useEffect(() => { setFocus(compact||selected < 0 ? null : {blockId, index: selected}); }, [blockId, selected, setFocus,compact]);
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
  const writeItems = (next: MediaSettings[], slideIndex=content.slideIndex) => onChange(collectionPatch(next,slideIndex));
  const select = (i: number) => {setIndex(i);if(compact)onChange({slideIndex:i,...(content.mediaMode!=='slideshow'?{mediaMode:items[i]?.kind==='image'?'image':'video'}:{})});};
  const writeSelected = (patch: Partial<MediaSettings>) => { if (selected < 0) return; writeItems(items.map((item, i) => i === selected ? {...item, ...patch} : item)); };
  const addItem = (item: MediaSettings) => {
    if(uploading.current)return false;
    if (items.length >= HERO_ADD_LIMIT) { setNotice(limitNote); return false; }
    if(compact)onChange({media:items[0]||item,slides:items.length?[...items.slice(1),item]:[],slideIndex:items.length,mediaMode:mode==='slideshow'?'slideshow':item.kind==='image'?'image':'video'});
    else writeItems([...items, item]);
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
    if(uploading.current)return;
    const room = HERO_ADD_LIMIT - items.length;
    if (room <= 0) { setNotice(limitNote); return; }
    const batch = [...files].slice(0, room);
    uploading.current=true;
    const added:MediaSettings[] = [];
    const errors: string[] = [];
    for (let i = 0; i < batch.length; i++) {
      setProgress(`Adding ${i + 1} of ${batch.length}…`);
      try {
        const asset = await publishAsset(batch[i], reload);
        if (asset.kind !== "image" && asset.kind !== "video") throw Error(`${batch[i].name} is not an image or video.`);
        added.push(normalizeMedia({...mediaDefaults, src: `media:${asset.id}`, kind: asset.kind, title: asset.name}));
      } catch (reason) { errors.push(reason instanceof Error ? reason.message : String(reason)); }
    }
    if (files.length > batch.length) errors.push(`${limitNote} Extra files were not added.`);
    uploading.current=false;
    if(!alive.current)return;
    setProgress("");
    const current=heroSlides(latest.current.content),next=[...current,...added.slice(0,Math.max(0,HERO_ADD_LIMIT-current.length))];
    if(next.length>current.length){latest.current.onChange({media:next[0],slides:next.slice(1),slideIndex:compact?current.length:publishedStart(latest.current.content.slideIndex,next.length),...(compact?{mediaMode:latest.current.content.mediaMode==='slideshow'||added.length>1?'slideshow':added[0].kind==='image'?'image':'video'}:{})});setIndex(current.length);}
    if(added.length>next.length-current.length)errors.push('Some files remain in the library because this collection is full.');
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
    const focus = reorderStart(from,to,selected,items.length);
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
    event.stopPropagation();
    event.preventDefault();
    setOver(false);
    if (event.dataTransfer.types.includes("application/x-hero-index")) return;
    const files = [...event.dataTransfer.files];
    if (files.length) { if (items.length >= HERO_ADD_LIMIT) setNotice(limitNote); else void addFiles(files); return; }
    const text = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
    if (text.trim()) addLink(text);
  };
  return <div className={compact?"list-editor section-media":"list-editor"} onDragOver={event=>{event.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)} onDrop={drop}>
    {compact&&<div className="media-modes" role="group" aria-label="Media display" style={{display:'none'}}>{(['image','video','slideshow'] as const).map(value=><button key={value} type="button" aria-pressed={mode===value} onClick={()=>{onChange({mediaMode:value});const first=items.findIndex(item=>value==='slideshow'||(value==='image'?item.kind==='image':item.kind!=='image'));setIndex(Math.max(0,first));}}>{value==='slideshow'?'Slideshow':value==='image'?'Image':'Video'}</button>)}</div>}
    {compact&&media&&<div className="section-media-header"><span className="preview-label">Selected {media.kind==='video'?'video':'image'}</span><div className="section-media-preview"><MediaView value={{...media,autoplay:false,controls:false}} editable/></div></div>}
    {!compact&&<div className={over ? "hero-drop is-over" : "hero-drop"} onDragOver={event => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}>
      {!items.length && <span className="hero-drop-mark" aria-hidden="true"><ImageIcon size={16}/><Play size={16}/></span>}
      <p>{items.length ? "Drop files or a media link" : "Drop images or videos here"}</p>
      {!items.length && <p className="helper-text">From your computer or a direct media link.</p>}
      <div className="hero-drop-actions">
        <label className="hero-upload" aria-disabled={!!progress||items.length>=HERO_ADD_LIMIT}><Upload size={16} aria-hidden="true"/>Upload files<input type="file" accept={ACCEPT} multiple disabled={!!progress||items.length >= HERO_ADD_LIMIT} onChange={event => { const files = event.target.files; event.target.value = ""; if (files?.length) void addFiles([...files]); }}/></label>
        <button type="button" className="hero-link" disabled={!!progress||items.length >= HERO_ADD_LIMIT} onClick={() => setLinking(open => !open)}><Link2 size={16} aria-hidden="true"/>Add link</button>
      </div>
    </div>}
    {compact&&!items.length&&<div className={over ? "hero-drop is-over" : "hero-drop"}>
      <span className="hero-drop-mark" aria-hidden="true"><ImageIcon size={16}/><Play size={16}/></span>
      <p>Drop images or videos here</p>
      <p className="helper-text">From your computer or a direct media link.</p>
    </div>}
    {!!items.length && <div className="hero-grid" role="list" aria-label={`${owner} media`}>
      {items.map((item, i) => {
        const name = fileName(item.src, names);
        return <div key={`${item.src}-${i}`} className="hero-tile" role="listitem" data-selected={i===selected} draggable onKeyDown={event => {
          if(!(event.target as HTMLElement).closest('.hero-tile-select'))return;
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const step = event.key === "ArrowRight" ? 1 : -1;
          if (event.altKey) reorder(i, i + step);
          else select(Math.min(items.length - 1, Math.max(0, i + step)));
        }} onDragStart={event => { event.dataTransfer.setData("application/x-hero-index", String(i)); event.dataTransfer.effectAllowed = "move"; }} onDragOver={event => event.preventDefault()} onDrop={event => { const payload=event.dataTransfer.getData("application/x-hero-index");if(!payload){drop(event);return;}event.preventDefault();event.stopPropagation(); const from = Number(payload); if (Number.isInteger(from)) reorder(from, i); }}>
          <button type="button" className="hero-tile-select" aria-pressed={i===selected} aria-label={`Select ${i+1}. ${name}`} onClick={()=>select(i)}><span className="hero-tile-frame">{item.src && <MediaView value={{...item, controls: false, autoplay: false}} editable/>}{item.kind === "video" && <span className="hero-tile-play"><Play size={16} aria-hidden="true"/></span>}</span></button>
          <button type="button" className="hero-tile-remove" aria-label={`Remove ${name} from this ${owner.toLowerCase()}`} onClick={event => { event.stopPropagation(); removeAt(i); }}><X size={12} aria-hidden="true"/></button>
          {!compact&&<span className="hero-tile-name">{name}</span>}
        </div>;
      })}
    </div>}
    {compact&&<div className="hero-drop-actions compact-actions">
      <label className="hero-upload" aria-disabled={!!progress||items.length>=HERO_ADD_LIMIT}><Upload size={16} aria-hidden="true"/>Upload<input type="file" accept={ACCEPT} multiple disabled={!!progress||items.length >= HERO_ADD_LIMIT} onChange={event => { const files = event.target.files; event.target.value = ""; if (files?.length) void addFiles([...files]); }}/></label>
      <button type="button" className="hero-link" disabled={!!progress||items.length >= HERO_ADD_LIMIT} onClick={() => setLinking(open => !open)}><Link2 size={16} aria-hidden="true"/>Add link</button>
      <button type="button" className="hero-link" disabled={!!progress||items.length>=HERO_ADD_LIMIT} onClick={()=>setLibrary(true)}><FolderOpen size={16} aria-hidden="true"/>Library</button>
    </div>}
    {linking && <form onSubmit={event => { event.preventDefault(); addLink(link); }}>
      <label className="field"><span>Direct media link</span><input aria-label="Direct media link" inputMode="url" value={link} onChange={event => { setLink(event.target.value); setNotice(""); }} placeholder="https://example.com/photo.jpg"/></label>
      <button type="submit" disabled={!link.trim()}>Add to {owner.toLowerCase()}</button>
    </form>}
    {(progress || notice || items.length >= HERO_ADD_LIMIT) && <p className="helper-text" role={notice ? "alert" : "status"}>{progress || notice || limitNote}</p>}
    {!items.length && !compact && <p className="helper-text">Only media added to this {owner} appears here.</p>}
    {!compact&&media && <div className="hero-selected">
      <p className="media-filename">Selected: {fileName(media.src, names)} · {origin(media.src)}</p>
      <button type="button" aria-label="Move earlier" aria-keyshortcuts="Alt+ArrowLeft" disabled={selected === 0} onClick={() => reorder(selected, selected - 1)}><ChevronLeft size={16} aria-hidden="true"/></button>
      <button type="button" aria-label="Move later" aria-keyshortcuts="Alt+ArrowRight" disabled={selected === items.length - 1} onClick={() => reorder(selected, selected + 1)}><ChevronRight size={16} aria-hidden="true"/></button>
    </div>}
    {!compact&&media && layout !== "story" && <TextControl label="Label on image (optional)" value={content.indexLabel || ""} onChange={indexLabel => onChange({indexLabel})}/>}
    {compact&&mode==='slideshow'&&<div className="compact-slideshow-section">
      <h4 className="compact-subsection-heading">Slideshow</h4>
      <label className="switch-row"><span>Autoplay slideshow</span><input type="checkbox" role="switch" aria-label="Autoplay slideshow" checked={!!content.slideAutoplay} onChange={event => onChange({slideAutoplay: event.target.checked})}/></label>
      <label className="switch-row"><span>Repeat slideshow</span><input type="checkbox" role="switch" aria-label="Repeat slideshow" checked={content.slideLoop!==false} onChange={event=>onChange({slideLoop:event.target.checked})}/></label>
      <label className="spacing-field"><span>Time per image</span><span className="unit-input"><input aria-label="Time per image" type="number" min={1} max={30} value={content.slideSeconds ?? 5} onChange={event => onChange({slideSeconds: Math.min(30, Math.max(1, Number(event.target.value) || 5))})}/><small>s</small></span></label>
      <p className="helper-text">Videos advance when playback ends.</p>
    </div>}
    {compact&&<TextControl label="Caption" value={content.note || ''} onChange={note=>onChange({note})}/>}
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
    {!compact&&<Fold icon={<Layers size={16} aria-hidden="true"/>} label="Overlay">
      <div className="overlay-tiles" role="group" aria-label="Overlay">{(["none", "solid", "bottom"] as const).map(mode => <button type="button" key={mode} className="overlay-tile" aria-pressed={shade === mode} onClick={() => onChange(mode === "none" ? {darkness: 0, fade: false} : mode === "bottom" ? {fade: true, fadeWidth: content.fadeWidth ?? 45, darkness: content.darkness || 36} : {fade: false, darkness: content.darkness || 36})}><span className={`overlay-swatch is-${mode}`} style={mode === "none" ? undefined : mode === "solid" ? {background: color} : {background: `linear-gradient(to top, ${color}, transparent)`}}/>{mode === "bottom" ? "Bottom" : mode[0].toUpperCase() + mode.slice(1)}</button>)}</div>
      {shade !== "none" && <>
        <label className="field"><span>Color</span><input aria-label="Overlay color" type="color" value={color} onChange={event => onChange({background: event.target.value})}/></label>
        <RangeControl label="Darkness" min={0} max={80} step={1} value={content.darkness ?? 36} text={String(content.darkness ?? 36)} onChange={darkness => onChange({darkness})}/>
        {shade === "bottom" && <RangeControl label="Coverage" min={0} max={100} step={1} value={Math.round(content.fadeWidth ?? 45)} text={`${Math.round(content.fadeWidth ?? 45)}%`} onChange={fadeWidth => onChange({fadeWidth})}/>}
      </>}
      <button type="button" onClick={() => onChange({fade: false, darkness: 64})}>Improve text readability</button>
    </Fold>}
    {media && media.kind !== "image" && <Fold icon={<Play size={16} aria-hidden="true"/>} label="Video settings">
      <label className="switch-row"><span>Muted</span><input type="checkbox" role="switch" checked={media.muted} onChange={event => writeSelected({muted: event.target.checked})}/></label>
      <label className="switch-row"><span>Loop</span><input type="checkbox" role="switch" checked={media.playback === "loop"} onChange={event => writeSelected({playback: event.target.checked ? "loop" : "once"})}/></label>
      <label className="switch-row"><span>Autoplay</span><input type="checkbox" role="switch" checked={media.autoplay} onChange={event => writeSelected({autoplay: event.target.checked})}/></label>
      <p className="media-filename">{media.poster ? fileName(media.poster, names) : "No poster"}</p>
      <button type="button" onClick={() => setPoster(true)}>Choose poster</button>
      <label className="field"><span>Mobile fallback</span><select aria-label="Mobile fallback" value={media.mobile} onChange={event => writeSelected({mobile: event.target.value as MediaSettings["mobile"]})}><option value="same">Same media</option><option value="poster">Poster image</option><option value="hide">Hide media</option></select></label>
      {media.mobile === "poster" && !media.poster && <p className="helper-text" role="status">Choose a poster image for the mobile fallback.</p>}
    </Fold>}
    {!compact&&<Fold icon={<Images size={16} aria-hidden="true"/>} label="Slideshow" disabled={items.length<2} note={items.length<2?"Add two items":undefined}>
      <label className="switch-row"><span>Play slideshow</span><input type="checkbox" role="switch" aria-label="Play slideshow" checked={!!content.slideAutoplay} onChange={event => onChange({slideAutoplay: event.target.checked})}/></label>
      <label className="field"><span>Image duration (seconds)</span><input aria-label="Image duration" type="number" min={1} max={30} value={content.slideSeconds ?? 5} onChange={event => onChange({slideSeconds: Math.min(30, Math.max(1, Number(event.target.value) || 5))})}/></label>
      <div className="overlay-tiles" role="group" aria-label="Video advance">
        <button type="button" aria-pressed={(content.slideAdvance ?? "time") === "time"} onClick={() => onChange({slideAdvance: "time"})}>Timer</button>
        <button type="button" aria-pressed={content.slideAdvance === "end"} onClick={() => onChange({slideAdvance: "end"})}>At clip end</button>
      </div>
      <label className="field"><span>Fade (milliseconds)</span><input aria-label="Fade" type="number" min={0} max={2000} step={50} value={content.slideFade ?? 0} onChange={event => onChange({slideFade: Math.min(2000, Math.max(0, Number(event.target.value) || 0))})}/></label>
    </Fold>}
    <Fold icon={<Accessibility size={16} aria-hidden="true"/>} label="Accessibility" disabled={!media} note={media ? undefined : "Add media first"}>
      {media && <><TextControl label={compact?"Alternative text":"Description"} value={media.alt} onChange={alt => writeSelected({alt})}/>{compact&&<><p className="helper-text">Describe the media for people who cannot see it. Leave empty only when decorative.</p><TextControl label="Media title" value={media.title} onChange={title=>writeSelected({title})}/><TextControl label="Media description" value={media.description} onChange={description=>writeSelected({description})}/>{media.kind!=='image'&&<><TextControl label="Captions link (.vtt)" value={media.captions} onChange={captions=>writeSelected({captions})}/><TextControl label="Caption language" value={media.captionLanguage} onChange={captionLanguage=>writeSelected({captionLanguage})}/></>}</>}</>}
    </Fold>
    <p className="helper-text">X removes the {owner} item; originals and other sections remain intact.</p>
    {removed && <p className="media-toast" role="status">Removed from {owner} <button type="button" onClick={undo}>Undo</button><button type="button" aria-label="Dismiss" onClick={() => setRemoved(null)}><X size={16} aria-hidden="true"/></button></p>}
    {library&&<MediaPicker label="Choose section media" onSelect={(src,kind)=>{addItem({...mediaDefaults,src,kind});setLibrary(false);}} onClose={()=>setLibrary(false)}/>}
    {poster && <MediaPicker label="Choose poster" imagesOnly onSelect={src => { writeSelected({poster: src}); setPoster(false); }} onClose={() => setPoster(false)}/>}
  </div>;
}

function Fold({icon, label, note, disabled, children}:{icon: ReactNode; label: string; note?: string; disabled?: boolean; children?: ReactNode}) {
  return <details className={disabled ? "editor-fold is-disabled" : "editor-fold"}>
    <summary aria-disabled={disabled || undefined} onClick={disabled ? event => event.preventDefault() : undefined}>{icon}<span>{label}</span>{note && <span className="fold-note">{note}</span>}<ChevronDown size={16} className="fold-chevron" aria-hidden="true"/></summary>
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
