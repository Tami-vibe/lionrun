import {assetStore} from './store';
import {https} from './model';
export const exportRuntime = `document.querySelectorAll('[data-load-embed]').forEach(function(button){button.addEventListener('click',function(){var box=button.closest('[data-embed-src]');var url=box&&box.getAttribute('data-embed-src');if(!url)return;var frame=document.createElement('iframe');frame.src=url;frame.title=button.textContent;frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');frame.setAttribute('allow','autoplay; encrypted-media; fullscreen; picture-in-picture');frame.setAttribute('allowfullscreen','');box.querySelector('.embed-consent').replaceWith(frame);});});document.querySelectorAll('.media-view').forEach(function(root){var video=root.querySelector('video');if(!video)return;var sync=function(){if((root.clientWidth<=560&&!root.classList.contains('mobile-media-same'))||matchMedia('(prefers-reduced-motion: reduce)').matches)video.pause();else if(video.autoplay&&video.muted)video.play().catch(function(){});};new ResizeObserver(sync).observe(root);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',sync);sync();});document.querySelectorAll('video[muted]').forEach(function(video){video.muted=true;});document.querySelectorAll('form').forEach(function(form){form.addEventListener('submit',function(e){e.preventDefault();alert('Demo form. Connect a submission service before publishing.');});});`;
export async function prepareMediaExport(root:HTMLElement,format:'html'|'wordpress'){
  const all=await assetStore('list'), html=root.outerHTML;
  const assets:{name:string;data:Uint8Array}[]=[], map=new Map<string,string>();
  for(const a of all.filter(a=>html.includes(`media:${a.id}`))){
    const extension:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','image/svg+xml':'svg','video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov','text/vtt':'vtt'};
    const name=`assets/${a.id}.${extension[a.mime]||'bin'}`;
    assets.push({name,data:new Uint8Array(await a.blob.arrayBuffer())});
    map.set(`media:${a.id}`,format==='wordpress'?`__BB_THEME_URI__/${name}`:name);
  }
  const mapped=(ref:string)=>{if(ref.startsWith('media:')&&!map.has(ref))throw Error('A referenced upload is missing from this browser. Restore or replace the media before exporting.');return map.get(ref)||ref;};
  root.querySelectorAll<HTMLElement>('[data-media-source]').forEach(el=>{
    const ref=el.dataset.mediaSource||'', poster=el.dataset.mediaPoster||'';
    const image=el.querySelector<HTMLElement>('.media-image');if(image)image.style.backgroundImage=`url("${mapped(ref)}")`;
    const mobile=el.querySelector<HTMLElement>('.mobile-poster');if(mobile)mobile.style.backgroundImage=`url("${mapped(poster)}")`;
  });
  root.querySelectorAll<HTMLElement>('[data-asset-background]').forEach(el=>{el.style.backgroundImage=`url("${mapped(el.dataset.assetBackground||'')}")`;});
  root.querySelectorAll<HTMLElement>('[data-asset-src]').forEach(el=>el.setAttribute('src',mapped(el.dataset.assetSrc||'')));
  root.querySelectorAll<HTMLElement>('[data-asset-poster]').forEach(el=>{const ref=el.dataset.assetPoster;if(ref)el.setAttribute('poster',mapped(ref));});
  root.querySelectorAll('iframe').forEach(el=>{const box=el.closest('[data-embed-src]');if(!box || box.getAttribute('data-embed-consent')==='false')return;const consent=document.createElement('div');consent.className='embed-consent';const button=document.createElement('button');button.type='button';button.textContent='Load external media';button.setAttribute('data-load-embed','');consent.append(button);el.replaceWith(consent);});
  root.querySelectorAll<HTMLElement>('*').forEach(el=>{
    el.style.pointerEvents='';
    for(const attr of Array.from(el.attributes)){
      let text=attr.value;for(const [ref,path] of map)text=text.replaceAll(ref,path);
      if(/blob:/.test(text))throw Error('Export found a temporary media URL. Replace the missing asset before exporting.');
      el.setAttribute(attr.name,text);
    }
    if(el.matches('[data-video-metadata]')){let text=el.textContent||'';for(const [ref,path] of map)text=text.replaceAll(ref,path);el.textContent=text;}
  });
  // React sets muted as a DOM property; serialize it explicitly for exported players.
  root.querySelectorAll('video').forEach((video,i)=>{const original=document.querySelectorAll('.site-preview video')[i] as HTMLVideoElement|undefined;if(original?.muted)video.setAttribute('muted','');});
  const references=Array.from(new Set(Array.from(root.querySelectorAll('*')).flatMap(el=>Array.from(el.attributes).flatMap(a=>a.value.match(/https:\/\/[^\s"'<>)]*/g)||[])))).filter(https);
  return {assets,references};
}
