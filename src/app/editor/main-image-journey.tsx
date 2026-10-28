"use client";
import {useEffect, useRef, useState} from 'react';
import {Accessibility, ArrowLeft, Check, ChevronRight, Crop, ImagePlus, Images} from 'lucide-react';
import type {BlockContent} from '../site/blocks';
import {MediaManager, MediaPicker, MediaView, publishAsset, useMediaLibrary} from '../media/library';
import {ACCEPT} from '../media/store';
import {mediaDefaults, normalizeMedia, type MediaSettings} from '../media/model';
import {collectionPatch, directMediaLink, heroSlides, publishedStart} from '../site/hero-collection';
import {HeroMediaEditor} from './hero-media';
import {useHeroFocus} from '../site/hero-focus';
import {Field} from './fields';
import {MediaFramingControls} from './media-controls';
import {mediaFileName} from './media-importer';
import {MediaUpload} from './media-upload';

type Screen = 'overview' | 'choose' | 'adjust' | 'describe' | 'advanced';
const screenTitles: Record<Screen, string> = {
  overview: 'Your main image', choose: 'Choose media', adjust: 'Adjust framing',
  describe: 'Description', advanced: 'More options',
};

/** A task-focused entrance to the existing hero collection, not a new workspace. */
export function MainImageJourney({content, layout, blockId, onChange, usage}: {
  content: BlockContent; layout: string; blockId: string; usage: import('../media/usage').MediaUsageIndex;
  onChange: (patch: Partial<BlockContent>) => void;
}) {
  const [screen, setScreen] = useState<Screen>('overview');
  const [editing, setEditing] = useState<{target:'background'|'story';index:number}|null>(null);

  const [draft, setDraft] = useState<MediaSettings | null>(null);
  const [library, setLibrary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [applied, setApplied] = useState('');
  const [leaveTarget, setLeaveTarget] = useState<HTMLElement | null>(null);
  const allowLeave = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const uploading = useRef(false);
  const {assets, reload} = useMediaLibrary();
  const {focus, setFocus, select} = useHeroFocus();
  const activeTarget = layout === 'story' && focus?.blockId === blockId && focus.target === 'story' ? 'story' : 'background';
  const target = screen !== 'overview' && editing ? editing.target : activeTarget;
  const isStory = target === 'story';
  const items = isStory ? (content.story?.src ? [content.story] : []) : heroSlides(content);
  const selected = isStory ? 0 : publishedStart(screen !== 'overview' && editing ? editing.index : focus?.blockId === blockId ? focus.index : content.slideIndex, items.length);
  function selectItem(index: number) {
    if (select) select(blockId, index);
    else {onChange({slideIndex:index}); setFocus({blockId,index,target:'background'});}
    setFeedback('');
  }
  const media = items[selected] ? normalizeMedia(items[selected]) : null;
  const names = new Map(assets.map(asset => [asset.id, asset.name]));
  const preview = screen === 'overview' ? media : draft || media;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => () => setFocus(null), [setFocus]);
  useEffect(() => {
    root.current?.closest('.panelbody')?.scrollTo({top: 0});
    root.current?.querySelector<HTMLElement>('h3')?.focus();
  }, [screen]);

  const unsaved = screen !== 'overview' && screen !== 'advanced' && !!draft && JSON.stringify(draft) !== JSON.stringify(media);
  useEffect(() => {
    if (!unsaved) return;
    const unload = (event: BeforeUnloadEvent) => {event.preventDefault(); event.returnValue = '';};
    const leave = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (allowLeave.current) {allowLeave.current = false; return;}
      const control = target?.closest<HTMLElement>('.all-sections, .tabs button, .panelbottom button, .region-switch button, .toolbar-actions button, .image-journey-back');
      if (!control) return;
      if (root.current?.contains(target)) return;
      event.preventDefault(); event.stopPropagation(); setLeaveTarget(control);
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', leave, true);
    return () => {window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true);};
  }, [unsaved]);

  function open(next: Screen) {
    setEditing({target,index:selected});
    setDraft(media ? {...media} : null);
    setError(''); setFeedback(''); setScreen(next);
  }
  function back() { setEditing(null); setDraft(null); setError(''); setScreen('overview'); }
  function choose(src: string, kind: 'image' | 'video', name?: string) {
    if (isStory && kind !== 'video') {setError('Choose a video for your story.'); return;}
    setDraft(normalizeMedia({...mediaDefaults, src, kind, title: name || mediaFileName(src, names)}));
    setError('');
  }
  async function upload(file?: File) {
    if (!file || uploading.current) return;
    uploading.current = true; setBusy(true); setError('');
    try {
      const asset = await publishAsset(file, reload);
      if (alive.current) choose(`media:${asset.id}`, asset.kind === 'video' ? 'video' : 'image', asset.name);
    } catch (reason) {
      if (alive.current) setError(reason instanceof Error ? reason.message : 'The image could not be added. Try again.');
    } finally {
      uploading.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function apply() {
    if (!draft || busy) return;
    const next = items.length ? items.map((item, i) => i === selected ? draft : item) : [draft];
    onChange(isStory ? {story:draft} : collectionPatch(next, selected));
    setFocus({blockId,index:isStory ? publishedStart(content.slideIndex,heroSlides(content).length) : selected,target});
    setApplied(JSON.stringify(draft));
    setFeedback(screen === 'choose' ? 'Media updated.' : 'Changes saved.');
    setDraft(null); setScreen('overview');
  }
  const previewImage = <div className="image-journey-preview" data-empty={!preview || undefined}>
    {preview ? <MediaView value={{...preview, poster: preview.kind==='video'?'':preview.poster, controls: preview.kind==='video', autoplay: false}} editable={preview.kind!=='video'} /> :
      <div className="image-journey-empty"><ImagePlus size={30} aria-hidden="true"/><strong>Make it yours</strong><span>{isStory ? 'Add a video about your business.' : 'Add a photo or video of your business.'}</span></div>}
    {preview && <span className="image-journey-preview-label">{screen === 'choose' && draft?.src !== media?.src ? 'New media' : preview.kind === 'video' ? 'Video preview' : 'Image preview'}</span>}
  </div>;
  return <div className="image-journey" data-screen={screen} ref={root} aria-busy={busy}>
    {leaveTarget && <div className="image-journey-warning" role="alertdialog" aria-label="Unapplied image changes" aria-describedby={`${blockId}-leave-description`}>
      <strong>Keep your image changes?</strong><p id={`${blockId}-leave-description`}>Save this image task before leaving, or discard the changes you have not applied.</p>
      <button type="button" autoFocus onClick={() => setLeaveTarget(null)}>Keep editing</button>
      <button type="button" onClick={() => {const target = leaveTarget; setLeaveTarget(null); setDraft(null); allowLeave.current = true; target.click();}}>Discard changes and continue</button>
    </div>}
    {screen !== 'overview' && <button type="button" className="image-journey-back" disabled={busy} onClick={back}>
      <ArrowLeft size={16} aria-hidden="true"/>{screen === 'advanced' ? 'Your main image' : 'Cancel and go back'}
    </button>}
    <p className="image-journey-eyebrow">{layout.charAt(0).toUpperCase()+layout.slice(1)} · {isStory ? 'Story video' : 'Background'}{items.length > 1 ? ` · ${selected+1}/${items.length}` : ''}</p>
    {layout === 'story' && screen === 'overview' && <div className="image-journey-targets" role="group" aria-label="Story media">
      {(['background','story'] as const).map(role=><button key={role} type="button" aria-pressed={target===role} onClick={()=>{setFocus({blockId,index:publishedStart(content.slideIndex,heroSlides(content).length),target:role});setFeedback('');}}>{role==='story'?'Story video':'Background'}</button>)}
    </div>}
    <h3 tabIndex={-1}>{screen === 'overview' && isStory ? 'Your story video' : screenTitles[screen]}</h3>
    {screen === 'overview' && <p className="image-journey-help">{isStory ? 'Plays when visitors choose “Watch our story”.' : 'Choose what visitors see first.'}</p>}
    {feedback && applied === JSON.stringify(media) && <p className="image-journey-success" role="status"><Check size={17} aria-hidden="true"/>{feedback}</p>}
    {error && <p className="image-journey-error" id={`${blockId}-image-error`} role="alert">{error}</p>}
    {screen !== 'advanced' && screen !== 'choose' && previewImage}
    {screen === 'overview' && <>
      {media && <p className="image-journey-filename">{mediaFileName(media.src, names)}</p>}
      {items.length > 1 && <div className="image-journey-strip" role="group" aria-label="Choose an image to edit">
        {items.map((item, i) => <button key={`${item.src}-${i}`} type="button" aria-pressed={i === selected}
          aria-label={`Edit image ${i + 1}`} onClick={() => selectItem(i)}>
          <MediaView value={{...item,fit:'cover',zoom:1,x:50,y:50, poster:item.kind==='video'?'':item.poster, controls: false, autoplay: false}} editable/><span>{i + 1}</span>
        </button>)}
      </div>}
      <button type="button" className="image-journey-primary" onClick={() => open('choose')}>
        <ImagePlus size={18} aria-hidden="true"/>{media ? 'Change media' : 'Add media'}
      </button>
      <div className="image-journey-actions">
        <button type="button" disabled={!media} onClick={() => open('adjust')}><Crop size={19} aria-hidden="true"/>
          <span><strong>Adjust framing</strong></span><ChevronRight size={17} aria-hidden="true"/></button>
        <button type="button" disabled={!media} onClick={() => open('describe')}><Accessibility size={19} aria-hidden="true"/>
          <span><strong>Description</strong></span><ChevronRight size={17} aria-hidden="true"/></button>
        <button type="button" onClick={() => open('advanced')}><Images size={19} aria-hidden="true"/>
          <span><strong>More options</strong></span><ChevronRight size={17} aria-hidden="true"/></button>
      </div>
    </>}
    {screen === 'choose' && <>
      {draft && draft.src !== media?.src ? <div className="image-journey-selected"><MediaView value={{...draft,fit:'cover',zoom:1,poster:'',controls:false,autoplay:false}} editable/><span><strong>{mediaFileName(draft.src,names)}</strong><button type="button" onClick={()=>{setDraft(media?{...media}:null);setError('');}}>Change</button></span><Check size={17} aria-label="Ready to use"/></div> : <MediaUpload accept={isStory ? 'video/*' : ACCEPT} multiple={false} busy={busy} onFiles={files=>void upload(files[0])} onLibrary={()=>setLibrary(true)}
        onLink={value=>{const result=directMediaLink(value);if(!result.ok){setError(result.error);return false;}choose(result.src,result.kind);return true;}}/>}
      {draft && draft.src !== media?.src && <button type="button" className="image-journey-primary" disabled={busy} onClick={apply}>{draft.kind === 'video' ? 'Use video' : 'Use photo'}</button>}
      <small className="image-journey-help">Photos up to 10 MB · Videos up to 100 MB</small>
    </>}
    {screen === 'adjust' && draft && <>
      <p className="image-journey-help">Choose what stays in view.</p>
      <MediaFramingControls media={draft} onChange={patch => setDraft({...draft, ...patch})}/>
      <button type="button" className="image-journey-primary" onClick={apply}>Save image changes</button>
    </>}
    {screen === 'describe' && draft && <>
      <p className="image-journey-help">Describe the image for people using a screen reader. Leave blank if decorative.</p>
      <Field label="Image description" value={draft.alt} multiline onChange={alt => setDraft({...draft, alt})}/>
      <button type="button" className="image-journey-primary" onClick={apply}>Save description</button>
    </>}
    {screen === 'advanced' && <><p className="image-journey-help">These options apply immediately and save in this browser.</p>
      {isStory ? <MediaManager value={content.story || mediaDefaults} usage={usage} onChange={story=>onChange({story})}/> : <HeroMediaEditor content={content} layout={layout} blockId={blockId} onChange={onChange}/>}</>}
    {library && <MediaPicker label="Choose your main image" onClose={() => setLibrary(false)}
      onSelect={(src, kind) => {choose(src, kind); setLibrary(false);}}/>}
  </div>;
}
