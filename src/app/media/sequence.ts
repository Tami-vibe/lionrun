import type {MediaSettings} from './model';

export type MediaMode = 'image' | 'video' | 'slideshow';
export function sequenceItems(content:{media:MediaSettings;slides?:MediaSettings[];mediaMode?:MediaMode;slideIndex?:number}) {
  const items=[content.media,...(content.slides||[])].filter(item=>item.src);
  if(content.mediaMode==='slideshow')return items;
  const candidates=items.filter(item=>!content.mediaMode||(content.mediaMode==='image'?item.kind==='image':item.kind!=='image'));
  const chosen=items[content.slideIndex??0];return chosen&&candidates.includes(chosen)?[chosen]:candidates.slice(0,1);
}
// The same controller runs in React and in the downloaded static website.
export function mountMediaSequence(root:HTMLElement) {
  const slides=Array.from(root.querySelectorAll<HTMLElement>('[data-sequence-slide]')),motion=matchMedia('(prefers-reduced-motion: reduce)');
  let index=Math.max(0,slides.findIndex(slide=>!slide.hidden)),timer=0,paused=false,hover=false,focused=false;
  const toggle=root.querySelector<HTMLButtonElement>('[data-sequence-toggle]');
  const auto=root.dataset.sequenceAutoplay==='true',loop=root.dataset.sequenceLoop!=='false';
  const schedule=()=>{window.clearTimeout(timer);if(!auto||paused||hover||focused||motion.matches||document.hidden||slides.length<2||(!loop&&index===slides.length-1))return;timer=window.setTimeout(()=>show(index+1),Number(root.dataset.sequenceSeconds||5)*1000);};
  const show=(next:number)=>{
    index=loop?(next+slides.length)%slides.length:Math.max(0,Math.min(slides.length-1,next));
    slides.forEach((slide,i)=>{slide.hidden=i!==index;slide.querySelectorAll('video').forEach(video=>{if(i!==index||document.hidden)video.pause();else if(!motion.matches&&video.dataset.autoplay==='true')void video.play().catch(()=>{});});});
    const label=root.querySelector('[data-sequence-count]');if(label)label.textContent=`${index+1} / ${slides.length}`;
    schedule();
  };
  const sync=()=>{if(document.hidden||motion.matches)root.querySelectorAll('video').forEach(video=>video.pause());schedule();};
  const click=(event:Event)=>{const button=(event.target as Element).closest<HTMLElement>('[data-sequence-step],[data-sequence-toggle]');if(!button)return;event.stopPropagation();if(button.hasAttribute('data-sequence-toggle')){paused=!paused;toggle!.textContent=paused?'Play slideshow':'Pause slideshow';toggle!.setAttribute('aria-pressed',String(paused));schedule();}else show(index+Number(button.dataset.sequenceStep));};
  const enter=()=>{hover=true;schedule();},leave=()=>{hover=false;schedule();},focus=()=>{focused=true;schedule();},blur=(event:FocusEvent)=>{if(!root.contains(event.relatedTarget as Node|null)){focused=false;schedule();}};
  root.addEventListener('click',click);root.addEventListener('pointerenter',enter);root.addEventListener('pointerleave',leave);root.addEventListener('focusin',focus);root.addEventListener('focusout',blur);motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  if(slides.length)show(index);
  return ()=>{window.clearTimeout(timer);root.removeEventListener('click',click);root.removeEventListener('pointerenter',enter);root.removeEventListener('pointerleave',leave);root.removeEventListener('focusin',focus);root.removeEventListener('focusout',blur);motion.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
}
