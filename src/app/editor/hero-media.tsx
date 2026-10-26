"use client";
import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {Accessibility, Crop, Images, Layers, Play, X} from "lucide-react";
import {MediaPicker, MediaView, publishAsset, useMediaLibrary} from "../media/library";
import {mediaDefaults, normalizeMedia, type MediaSettings} from "../media/model";
import {ACCEPT} from "../media/store";
import type {BlockContent} from "../site/blocks";
import {Field, Fold, RangeControl} from "./fields";
import {HERO_ADD_LIMIT, SECTION_STAGE_LIMIT, collectionPatch, directMediaLink, heroSlides, moveItem, publishedStart, removalStart, reorderStart, restoreRemoved, selectionAfterRemove, selectionAfterRestore} from "./hero-collection";
import {useHeroFocus} from "./hero-focus";
import {MediaFramingControls, MediaVideoControls} from "./media-controls";
import {MediaImporter, mediaFileName} from "./media-importer";
import {useRemovalNotice} from "./use-removal-notice";
import type {MediaMode} from "../media/sequence";

const fileName = mediaFileName;
const ALL_STAGE_MODES = ["image", "video", "slideshow"] as const satisfies readonly MediaMode[];

export function HeroMediaEditor({content, layout, blockId, onChange, compact=false, modes=ALL_STAGE_MODES}:{compact?:boolean; modes?:readonly MediaMode[]; content: BlockContent; layout: string; blockId: string; onChange:(patch: Partial<BlockContent>)=>void}) {
  const latest=useRef({content,onChange}),alive=useRef(true),uploading=useRef(false);
  useLayoutEffect(()=>{latest.current={content,onChange};});
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const owner=compact?"section":"Hero";
  const addLimit = compact ? SECTION_STAGE_LIMIT : HERO_ADD_LIMIT;
  const stageModes = compact ? (modes.length ? modes : ALL_STAGE_MODES) : ALL_STAGE_MODES;
  const [library,setLibrary]=useState(false);
  const {assets, reload} = useMediaLibrary();
  const {setFocus} = useHeroFocus();
  const names = new Map(assets.map(asset => [asset.id, asset.name]));
  const items = heroSlides(content);
  const [index, setIndex] = useState(() => publishedStart(content.slideIndex, heroSlides(content).length));
  const requested=content.mediaMode||(content.media.kind==='image'?'image':'video');
  const mode=(stageModes.includes(requested)?requested:stageModes[0]) as MediaMode;
  const candidate=items.length?Math.min(Math.max(0,index),items.length-1):-1;
  const matches=(item:MediaSettings)=>mode==='slideshow'||(mode==='image'?item.kind==='image':item.kind!=='image');
  const selected=compact&&candidate>=0&&!matches(items[candidate])?items.findIndex(matches):candidate;
  const limitNote = items.length > addLimit ? `This ${owner.toLowerCase()} already has ${items.length} items, and they all stay. New items stop at ${addLimit}.` : `This ${owner.toLowerCase()} holds ${addLimit} items.`;
  useEffect(() => { setFocus(compact||selected < 0 ? null : {blockId, index: selected}); }, [blockId, selected, setFocus,compact]);
  useEffect(() => () => setFocus(null), [setFocus]);
  const stageModeKey = stageModes.join(",");
  useEffect(() => {
    if (!compact || !content.mediaMode || stageModes.includes(content.mediaMode)) return;
    onChange({mediaMode: mode});
  }, [compact, content.mediaMode, mode, onChange, stageModeKey, stageModes]);
  const media = selected >= 0 ? normalizeMedia(items[selected]) : null;
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState("");
  const [poster, setPoster] = useState(false);
  const [removed, setRemoved] = useRemovalNotice<{item: MediaSettings; index: number; slideIndex: number | undefined}>();
  const writeItems = (next: MediaSettings[], slideIndex=content.slideIndex) => onChange(collectionPatch(next,slideIndex));
  const select = (i: number) => {setIndex(i);if(compact)onChange({slideIndex:i,...(mode!=='slideshow'?{mediaMode:items[i]?.kind==='image'?'image':'video'}:{})});};
  const writeSelected = (patch: Partial<MediaSettings>) => { if (selected < 0) return; writeItems(items.map((item, i) => i === selected ? {...item, ...patch} : item)); };
  const addItem = (item: MediaSettings) => {
    if(uploading.current)return false;
    if (items.length >= addLimit) { setNotice(limitNote); return false; }
    if(compact)onChange({media:items[0]||item,slides:items.length?[...items.slice(1),item]:[],slideIndex:items.length,mediaMode:mode==='slideshow'?'slideshow':item.kind==='image'?'image':'video'});
    else writeItems([...items, item]);
    setIndex(items.length);
    setNotice("");
    return true;
  };
  const addLink = (value: string) => {
    const result = directMediaLink(value);
    if (!result.ok) { setNotice(result.error); return false; }
    return addItem({...mediaDefaults, src: result.src, kind: result.kind, title: fileName(result.src, names)});
  };
  const addFiles = async (files: File[]) => {
    if(uploading.current)return;
    const room = addLimit - items.length;
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
    const current=heroSlides(latest.current.content),next=[...current,...added.slice(0,Math.max(0,addLimit-current.length))];
    if(next.length>current.length){latest.current.onChange({media:next[0],slides:next.slice(1),slideIndex:compact?current.length:publishedStart(latest.current.content.slideIndex,next.length),...(compact?{mediaMode:stageModes.includes('slideshow')&&(latest.current.content.mediaMode==='slideshow'||added.length>1)?'slideshow':added[0].kind==='image'?'image':'video'}:{})});setIndex(current.length);}
    if(added.length>next.length-current.length)errors.push('Some files remain in the library because this collection is full.');
    setNotice(errors.join(" "));
  };
  const removeAt = (i: number) => {
    const next = items.filter((_, n) => n !== i);
    setRemoved({item: normalizeMedia(items[i]), index: i, slideIndex: content.slideIndex});
    setIndex(selectionAfterRemove(i, next.length));
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
    setIndex(next.length ? selectionAfterRestore(removed.index, current.length) : -1);
    setRemoved(null);
  };
  const shade = content.fade ? "bottom" : (content.darkness ?? 36) === 0 ? "none" : "solid";
  const color = /^#[0-9a-f]{6}$/i.test(content.background || "") ? content.background! : "#0b1420";
  const importerItems = items.map(item => ({
    name: fileName(item.src, names),
    kind: item.kind === "video" ? "video" as const : "image" as const,
    preview: <>{item.src && <MediaView value={{...item, controls: false, autoplay: false}} editable/>}{item.kind === "video" && <span className="hero-tile-play"><Play size={16} aria-hidden="true"/></span>}</>
  }));
  const importerStatus = progress || notice || (items.length >= addLimit ? limitNote : "");
  return <div className={compact?"list-editor section-media":"list-editor"}>
    {compact&&stageModes.length>1&&<div className="media-modes" role="group" aria-label="Media display">{stageModes.map(value=><button key={value} type="button" aria-pressed={mode===value} onClick={()=>{onChange({mediaMode:value});const first=items.findIndex(item=>value==='slideshow'||(value==='image'?item.kind==='image':item.kind!=='image'));setIndex(Math.max(0,first));}}>{value==='slideshow'?'Slideshow':value==='image'?'Image':'Video'}</button>)}</div>}
    {compact&&media&&<div className="section-media-preview"><MediaView value={{...media,autoplay:false,controls:media.kind!=='image'}}/>{items.length>1&&<span className="preview-badge">{selected+1} / {items.length}</span>}</div>}
    {compact&&media&&media.kind!=='image'&&<label className="switch-row"><span>Muted</span><input type="checkbox" role="switch" aria-label="Muted" checked={media.muted} onChange={event => writeSelected({muted: event.target.checked})}/></label>}
    <MediaImporter compact={compact} owner={owner} hint="Images and videos" accept={ACCEPT} placeholder="https://example.com/photo.jpg" items={importerItems} selected={selected} busy={!!progress} blocked={items.length >= addLimit} status={importerStatus} onFiles={files => void addFiles(files)} onLink={addLink} onLibrary={() => setLibrary(true)} onSelect={select} onRemove={removeAt} onReorder={reorder} />
    {!compact && <Fold icon={<Accessibility size={16} aria-hidden="true"/>} label="Link & accessibility" disabled={!media} note={media ? undefined : "Add media first"}>
      {media && <>
        {layout !== "story" && <Field label="Label on image (optional)" value={content.indexLabel || ""} onChange={indexLabel => onChange({indexLabel})}/>}
        <Field label="Description" value={media.alt} onChange={alt => writeSelected({alt})}/>
      </>}
    </Fold>}
    {compact&&mode==='slideshow'&&<>
      <label className="switch-row"><span>Autoplay slideshow</span><input type="checkbox" role="switch" aria-label="Autoplay slideshow" checked={!!content.slideAutoplay} onChange={event => onChange({slideAutoplay: event.target.checked})}/></label>
      <label className="switch-row"><span>Loop slideshow</span><input type="checkbox" role="switch" aria-label="Loop slideshow" checked={content.slideLoop!==false} onChange={event=>onChange({slideLoop:event.target.checked})}/></label>
      <label className="spacing-field"><span>Time per image</span><span className="unit-input"><input aria-label="Time per image" type="number" min={1} max={30} value={content.slideSeconds ?? 5} onChange={event => onChange({slideSeconds: Math.min(30, Math.max(1, Number(event.target.value) || 5))})}/><small>s</small></span></label>
    </>}
    {compact&&<Field label="Caption" value={content.note || ''} onChange={note=>onChange({note})}/>}
    <Fold icon={<Crop size={16} aria-hidden="true"/>} label="Framing" disabled={!media} note={media ? undefined : "Add media first"}>
      {media && <MediaFramingControls media={media} onChange={writeSelected}/>}
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
      <MediaVideoControls
        media={media}
        posterLabel={media.poster ? fileName(media.poster, names) : "No poster"}
        onChange={writeSelected}
        onChoosePoster={() => setPoster(true)}
        showMuted={!compact}
        showMobilePosterHint
      />
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
    {compact && <Fold icon={<Accessibility size={16} aria-hidden="true"/>} label="Accessibility" disabled={!media} note={media ? undefined : "Add media first"}>
      {media && <><Field label="Alternative text" value={media.alt} onChange={alt => writeSelected({alt})}/>{<><p className="helper-text">Describe the media for people who cannot see it. Leave empty only when decorative.</p><Field label="Media title" value={media.title} onChange={title=>writeSelected({title})}/><Field label="Media description" value={media.description} onChange={description=>writeSelected({description})}/>{media.kind!=='image'&&<><Field label="Captions link (.vtt)" value={media.captions} onChange={captions=>writeSelected({captions})}/><Field label="Caption language" value={media.captionLanguage} onChange={captionLanguage=>writeSelected({captionLanguage})}/></>}</>}</>}
    </Fold>}
    {compact && <p className="helper-text">X removes the {owner} item; originals and other sections remain intact.</p>}
    {removed && <p className="media-toast" role="status">Removed from {owner} <button type="button" onClick={undo}>Undo</button><button type="button" aria-label="Dismiss" onClick={() => setRemoved(null)}><X size={16} aria-hidden="true"/></button></p>}
    {library&&<MediaPicker label="Choose section media" onSelect={(src,kind)=>{addItem({...mediaDefaults,src,kind});setLibrary(false);}} onClose={()=>setLibrary(false)}/>}
    {poster && <MediaPicker label="Choose poster" imagesOnly onSelect={src => { writeSelected({poster: src}); setPoster(false); }} onClose={() => setPoster(false)}/>}
  </div>;
}
