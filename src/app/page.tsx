"use client";
import {flushSync} from "react-dom";
import { MediaProvider,MediaView } from "./media/library";
import { prepareMediaExport, exportRuntime } from "./media/export";
import { Navigation, EditorIcon, PageEntry, HeroLayouts, PagePlacement } from "./editor/navigation";
import { Account, AccountDetails } from "./editor/account";
import {ContentFields,Field,MediaFields,Toggle} from "./editor/fields";
import {sectionComponents} from "./site/sections";
import { LayoutControls, TypographyControls } from "./editor/inspector";
import { SectionSettings, FooterColumn, sectionVariables, accentRamp, normalizeSettings, defaultColumns, equalWidths, pageSlug, pageAddresses, headerLook, bindMenu, linkedPage, pageLocation, placePage } from "./editor/settings";
import { Fragment, Suspense, use, useEffect, useEffectEvent, useLayoutEffect, useReducer, useRef, useState } from "react";
import {catalog,SectionId} from "./site/catalog";
import {reviewLayout,reviewLayoutName,type ReviewLayout} from "./site/reviews";
import {SectionBadge} from "./editor/section-badge";
import {Site,IconName,ButtonData,initial,Block,BlockContent,migrateSite,validBlocks,makeBlock,blockLayouts,duplicateBlock,fixedBlockOrder,starterBlocks,syncServicePages,storyHeroMedia,proofReasonContent,logoBandContent,trustSignalContent} from "./site/blocks";
// Home owns these fields; page content and page SEO remain independent.
const menuKeys = ["brand","nav","navTargets","navPageIds","navChildren","headerStyle","headerSticky","headerOverlay","headerBackground","headerButtonCount","headerButtonPlace","headerButtons","footerStyle","footerColumns","phone","email","address","ownerName"] as const;
function sharedMenu(target:Site,home:Site):Site {
    const next={...target,...Object.fromEntries(menuKeys.map(key=>[key,home[key]]))} as Site;
    next.headerButtons=menuButtons(home);
    next.headerStyle=headerLook(home.headerStyle);
    next.sectionSettings={...target.sectionSettings,header:home.sectionSettings?.header,footer:home.sectionSettings?.footer};
    next.sectionStyle={...target.sectionStyle,header:home.sectionStyle?.header,footer:home.sectionStyle?.footer};
    next.sectionMedia={...target.sectionMedia,header:home.sectionMedia?.header,footer:home.sectionMedia?.footer};
    const shared=home.blocks.filter(b=>b.type==="header"||b.type==="footer");next.blocks=target.blocks.flatMap(b=>b.type==="header"||b.type==="footer"?shared.filter(v=>v.type===b.type):[b]);for(const block of shared)if(!next.blocks.some(b=>b.type===block.type)){if(block.type==="header")next.blocks.unshift(block);else next.blocks.push(block);}
    next.hidden=[...target.hidden.filter(id=>id!=="header"&&id!=="footer"),...home.hidden.filter(id=>id==="header"||id==="footer")];
    return next;
}
function pageSnapshot(pages:PageEntry<Site>[],activeId:string,site:Site) {
    const homeId=pages.find(p=>p.id==="home")?.id||pages[0].id;
    return pages.map(p=>({...p,site:p.id===homeId?sharedMenu(p.id===activeId?site:p.site,site):p.id===activeId?site:p.site})).map(p=>({...p,site:bindMenu(p.site,pages)}));
}
function footerContent(site:Site):FooterColumn[] {
    return site.footerColumns||[{title:site.brand,text:'Good work. Good people. A better way forward.',links:[]},{title:'Explore',text:'',links:sections.filter(s=>!site.hidden.includes(s.id)&&['services','proof','about','contact'].includes(s.id)).map(s=>({label:s.label,href:`#${s.id}`}))},{title:'Get in touch',text:[site.address,site.phone,site.email].join('\n'),links:[]}];
}
function menuButtons(site:Site):ButtonData[] {
    return [site.headerButtons?.[0]||{label:"Let's talk",href:`tel:${site.phone.replace(/[^+0-9]/g,'')}`,icon:"arrow"},site.headerButtons?.[1]||{...site.primary}];
}
const sections = catalog;
import {icons,safeHref} from "./site/sections/elements";
type History = {
    past: Site[];
    present: Site;
    future: Site[];
};
type Action = {
    type: "set";
    next: Site;
} | {
    type: "undo";
} | {
    type: "redo";
} | {
    type: "load";
    next: Site;
} | {
    type: "sync";
    next: Site;
};
function historyReducer(state: History, action: Action): History {
    if (action.type === "load")
        return { past: [], present: action.next, future: [] };
    if (action.type === "sync")
        return { ...state, present: action.next };
    if (action.type === "set")
        return { past: [...state.past.slice(-39), state.present], present: action.next, future: [] };
    if (action.type === "undo" && state.past.length)
        return { past: state.past.slice(0, -1), present: state.past.at(-1)!, future: [state.present, ...state.future] };
    if (action.type === "redo" && state.future.length)
        return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
    return state;
}
function validSite(value: unknown): value is Site {
    if (!value || typeof value !== "object")
        return false;
    const v = value as Partial<Site>;
    if(v.blocks!==undefined&&!validBlocks(v.blocks))return false;
    if(!Array.isArray(v.nav)||v.nav.length>5||!v.nav.every(n=>typeof n==="string")||(v.navTargets&&(!Array.isArray(v.navTargets)||!v.navTargets.every(n=>typeof n==="string"))))return false;
    if([v.headerSticky,v.headerOverlay,v.headerBackground].some(x=>x!==undefined&&typeof x!=="boolean"))return false;
    if(v.ownerName!==undefined&&typeof v.ownerName!=="string")return false;
    if(v.headerButtonCount!==undefined&&![0,1,2].includes(v.headerButtonCount))return false;
    if(v.headerButtons&&(!Array.isArray(v.headerButtons)||v.headerButtons.length>2||!v.headerButtons.every(b=>b&&typeof b.label==="string"&&typeof b.href==="string"&&icons.includes(b.icon))))return false;
    if(v.navPageIds&&(!Array.isArray(v.navPageIds)||v.navPageIds.length>5||!v.navPageIds.every(id=>id===null||typeof id==="string")))return false;
    if(v.navChildren&&(!Array.isArray(v.navChildren)||v.navChildren.length>5||!v.navChildren.every(rows=>Array.isArray(rows)&&rows.length<=24&&rows.every(l=>l&&typeof l.label==="string"&&typeof l.href==="string"&&(l.pageId===undefined||typeof l.pageId==="string")))))return false;
    if(v.sectionSettings&&(!Object.values(v.sectionSettings).every(s=>s&&typeof s==="object")))return false;
    if(v.footerColumns&&(!Array.isArray(v.footerColumns)||v.footerColumns.length>5||!v.footerColumns.every(c=>typeof c.title==="string"&&typeof c.text==="string"&&Array.isArray(c.links)&&c.links.every(l=>typeof l.label==="string"&&typeof l.href==="string"&&(l.pageId===undefined||typeof l.pageId==="string")))))return false;
    return typeof v.brand === "string" && typeof v.headline === "string" && typeof v.description === "string" &&
        Array.isArray(v.services) && Array.isArray(v.hidden) && typeof v.primary?.label === "string" && typeof v.secondary?.href === "string" &&
        typeof v.contactTitle === "string" && typeof v.accent === "string";
}
function SitePreview({ site, select, selected, editable, changeSettings, pages, activeId, selectPage }: {
    site: Site;
    select: (id: string) => void;
    selected: string;
    editable: boolean;
    changeSettings?:(id:string,s:SectionSettings)=>void;
    pages:PageEntry<Site>[];
    activeId:string;
    selectPage?:(id:string,hash?:string)=>void;
}) {
    const homeId=pages.find(p=>p.id==="home")?.id||pages[0].id;
    const menuHome=activeId===homeId?site:pages.find(p=>p.id===homeId)!.site,menuTheme=menuHome.theme==='paper'?'shared-paper':'theme-midnight';
    const rootRef=useRef<HTMLDivElement>(null),[section,setSection]=useState('#top');
    useEffect(()=>{const root=rootRef.current;if(!root)return;const scrollRoot=root.closest('.canvas-area'),menu=root.querySelector<HTMLElement>('.menu-frame'),size=new ResizeObserver(()=>{if(menu)root.style.setProperty('--actual-menu-space',`${menu.offsetHeight}px`);});if(menu)size.observe(menu);let frame=0;
      const track=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const edge=(scrollRoot?.getBoundingClientRect().top||0)+(root.querySelector('.menu-frame')?.getBoundingClientRect().height||0)+40;const visible=Array.from(root.querySelectorAll<HTMLElement>('section[id]')).filter(el=>el.getBoundingClientRect().top<=edge);setSection('#'+(visible.at(-1)?.id||'top'));});};
      (scrollRoot||window).addEventListener('scroll',track,{passive:true});track();return()=>{size.disconnect();cancelAnimationFrame(frame);(scrollRoot||window).removeEventListener('scroll',track);};
    },[activeId,site.headerSticky,site.headerStyle]);
    const pageFor=(href:string,id?:string|null)=>linkedPage(pages,href,id);
    const labelFor=(label:string,href:string,id?:string|null)=>pageFor(href,id)?.name||label;
    const menuLink=(href:string,id?:string|null,scope=homeId)=>{const page=pageFor(href,id),hash=href.startsWith('#')?href:'',targetId=page?.id||(hash?scope:undefined),current=page?page.id===activeId:activeId===scope&&href===section;return {href:page?`?preview=1&page=${encodeURIComponent(page.id)}`:hash&&activeId!==targetId?`?preview=1&page=${encodeURIComponent(targetId!)}${hash}`:safeHref(href),'data-link-page':targetId,'data-link-hash':hash||undefined,'aria-current':current?'page' as const:undefined,'data-current-page':page?.id===activeId?true:undefined,'data-site-href':page?.id===activeId?'#top':hash&&activeId!==homeId?`/${hash}`:safeHref(href),onClick:(e:React.MouseEvent<HTMLAnchorElement>)=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.currentTarget.closest('details')?.removeAttribute('open');if(targetId){e.preventDefault();e.stopPropagation();selectPage?.(targetId,hash);}else if(editable)e.preventDefault();}};};
    const parentIndex=site.navChildren?.findIndex(rows=>rows.some(l=>pageFor(l.href,l.pageId)?.id===activeId))??-1;
    const blocks=fixedBlockOrder(site.blocks);
    const classFor=(b:Block)=>b.type==='header'?`site-menu ${menuTheme}`:b.type==='footer'?`site-footer ${menuTheme} ${site.footerStyle==='minimal'?'footer-minimal':''}`:b.type==='hero'?`hero hero-${b.layout} text-${b.content.align||'left'}`:'site-block';
    return <div ref={rootRef} className={`site-preview theme-${site.theme??'midnight'}`} style={{'--menu-links':site.nav.length,'--menu-extra':(site.headerButtonCount??1)>0?1:0,'--accent':site.accent,...Object.fromEntries(Object.entries(accentRamp(site.accent)).map(([key,value])=>[`--accent-${key}`,value])),'--hero-ratio':blocks.find(b=>b.type==='hero')?.content.media.ratio||'16/9'} as React.CSSProperties}>
      {blocks.map((block,index)=>{if(block.hidden)return null;const Component=sectionComponents[block.type],Tag=block.type==='header'?'header':block.type==='footer'?'footer':'section',settings=block.settings;
        return <Fragment key={block.id}><Tag id={block.type==='hero'&&blocks.find(b=>b.type==='hero')?.id===block.id?'top':blocks.find(b=>b.type===block.type)?.id===block.id?block.type:block.id} data-section={block.id} data-block-type={block.type} data-layout={block.layout} data-height={block.content.height} data-align={block.content.align} data-custom-padding={settings.padding!==undefined||undefined} {...Object.fromEntries((['heading','body'] as const).flatMap(target=>Object.entries(normalizeSettings(settings)[target]!).filter(([,v])=>v!==undefined).map(([key])=>[`data-${target}-${key.toLowerCase()}`,true])))} style={{...sectionVariables(settings),...(block.type==='header'||block.type==='footer'?{'--accent':menuHome.accent}:{})} as React.CSSProperties} className={`${editable?'editable-section':''} ${editable&&selected===block.id?'selected-section':''} ${classFor(block)}`} data-sticky={block.type==='header'&&site.headerSticky||undefined} data-overlay={block.type==='header'&&site.headerOverlay&&blocks.some(b=>b.type==='hero'&&!b.hidden)||undefined} data-background={block.type==='header'?site.headerBackground!==false:undefined} onClick={editable?e=>{if((e.target as HTMLElement).closest('[data-editor-only]'))return;if((e.target as HTMLElement).closest('a'))e.preventDefault();select(block.id);}:undefined}>
          {editable&&<SectionBadge id={block.id} type={block.type} index={index} selected={selected===block.id} choose={select}/>} {block.content.media.src&&["services","pains","solutions","trust","reviews","faq","closing"].includes(block.type)&&!(block.type==='trust'&&block.layout==='Signals')&&<MediaView value={block.content.media} editable={editable}/>}<Component block={block} site={site} editable={editable} selected={selected===block.id} change={value=>changeSettings?.(block.id,value)} link={(href,id)=>menuLink(href,id,href.startsWith('#')&&!['header','footer'].includes(block.type)&&blocks.some(b=>!b.hidden&&(href==='#top'?b.type==='hero':`#${b.type}`===href))?activeId:homeId)} labelFor={labelFor} pages={pages} homeId={homeId} activeId={activeId} parentIndex={parentIndex}/>
        </Tag></Fragment>;
      })}
    </div>;
}

function DeviceIcon({ type }: {
    type: "desktop" | "tablet" | "mobile";
}) {
    return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{type === "desktop" ? <><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 22h8M12 18v4"/></> : type === "tablet" ? <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 19h2"/></> : <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 19h2"/></>}</svg>;
}
function Choice<T extends string>({ label, value, options, onChange }: {
    label: string;
    value: T;
    options: {
        value: T;
        label: string;
    }[];
    onChange: (v: T) => void;
}) {
    return <div className="field" role="group" aria-label={label}><span>{label}</span><div className="choice-group">{options.map(o => <button type="button" key={o.value} className={value === o.value ? "choice-active" : ""} aria-pressed={value===o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div></div>;
}
// ZIP (stored entries, no external dependency). All file names are fixed by this exporter.
function zipFiles(files: {
    name: string;
    data: Uint8Array;
}[]): Blob {
    const chunks: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    const encoder = new TextEncoder();
    let offset = 0;
    const u16 = (v: DataView, o: number, n: number) => v.setUint16(o, n, true);
    const u32 = (v: DataView, o: number, n: number) => v.setUint32(o, n >>> 0, true);
    const crc = (bytes: Uint8Array) => { let c = 0xffffffff; for (const b of bytes) {
        c ^= b;
        for (let k = 0; k < 8; k++)
            c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
    } return (c ^ 0xffffffff) >>> 0; };
    for (const f of files) {
        const name = encoder.encode(f.name), c = crc(f.data), n = f.data.length;
        const local = new Uint8Array(30 + name.length);
        const v = new DataView(local.buffer);
        u32(v, 0, 0x04034b50);
        u16(v, 4, 20);
        u16(v, 6, 0x800);
        u32(v, 14, c);
        u32(v, 18, n);
        u32(v, 22, n);
        u16(v, 26, name.length);
        local.set(name, 30);
        chunks.push(local, f.data);
        const dir = new Uint8Array(46 + name.length);
        const d = new DataView(dir.buffer);
        u32(d, 0, 0x02014b50);
        u16(d, 4, 20);
        u16(d, 6, 20);
        u16(d, 8, 0x800);
        u32(d, 16, c);
        u32(d, 20, n);
        u32(d, 24, n);
        u16(d, 28, name.length);
        u32(d, 42, offset);
        dir.set(name, 46);
        central.push(dir);
        offset += local.length + n;
    }
    const centralSize = central.reduce((n, b) => n + b.length, 0);
    const end = new Uint8Array(22);
    const e = new DataView(end.buffer);
    u32(e, 0, 0x06054b50);
    u16(e, 8, files.length);
    u16(e, 10, files.length);
    u32(e, 12, centralSize);
    u32(e, 16, offset);
    return new Blob([...chunks, ...central, end] as BlobPart[], { type: 'application/zip' });
}
function downloadFile(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
const htmlEscape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const menuRuntime = `document.querySelectorAll('.menu-dropdown a').forEach(function(a){a.addEventListener('click',function(){a.closest('details').removeAttribute('open');});});var menuBox=document.querySelector('.menu-frame');if(menuBox)new ResizeObserver(function(){document.querySelector('.site-preview').style.setProperty('--actual-menu-space',menuBox.offsetHeight+'px');}).observe(menuBox);var menuTick=false;function markMenu(){menuTick=false;var sections=Array.from(document.querySelectorAll('.site-preview section[id]')),header=document.querySelector('.menu-frame'),edge=(header?header.getBoundingClientRect().height:0)+40,current='#top';sections.forEach(function(s){if(s.getBoundingClientRect().top<=edge)current='#'+s.id;});document.querySelectorAll('.site-menu nav a[href^="#"]:not([data-current-page])').forEach(function(a){if(a.getAttribute('href')===current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.querySelectorAll('.menu-dropdown').forEach(function(d){var summary=d.querySelector('summary');if(d.querySelector('[aria-current="page"]:not(summary)'))summary.setAttribute('aria-current','page');else summary.removeAttribute('aria-current');});}window.addEventListener('scroll',function(){if(!menuTick){menuTick=true;requestAnimationFrame(markMenu);}},{passive:true});markMenu();`;
async function packageWebsite(pages:PageEntry<Site>[],format:'html'|'wordpress') {
    const home=pages.find(p=>p.id==='home')||pages[0],encoder=new TextEncoder();
    const files=new Map<string,Uint8Array>(),references=new Set<string>();
    const write=(name:string,content:string)=>files.set(name,encoder.encode(content));
    let css='';
    for(const sheet of Array.from(document.styleSheets))try{css+='\n'+Array.from(sheet.cssRules).map(rule=>rule.cssText).join('\n');}catch{}
    const fontUrls=Array.from(new Set(Array.from(css.matchAll(/url\(["']?([^"')]+\.woff2?)["']?\)/g),match=>match[1])));
    for(const source of fontUrls){const url=new URL(source,window.location.origin);if(url.origin!==window.location.origin||!url.pathname.startsWith('/_next/static/media/'))continue;
      const name=`assets/fonts/${url.pathname.split('/').at(-1)}`,response=await fetch(url);if(!response.ok)throw Error('A website font could not be packaged. Try exporting again.');files.set(name,new Uint8Array(await response.arrayBuffer()));css=css.replaceAll(source,format==='html'?name.slice(7):name);
    }
    const textFont=getComputedStyle(document.body).getPropertyValue('--font-text'),displayFont=getComputedStyle(document.body).getPropertyValue('--font-display');
    css+=`\n:root{--font-text:${textFont};--font-display:${displayFont}}body{margin:0}.site-preview{width:100%;min-height:100vh}`;
    const reviewRuntime=`document.querySelectorAll('[data-review-more]').forEach(function(button){button.addEventListener('click',function(){var card=button.closest('.review-card');if(!card)return;var open=card.classList.toggle('is-open');button.textContent=open?'Show less':'Read more';button.setAttribute('aria-expanded',String(open));});});document.querySelectorAll('[data-review-step]').forEach(function(button){button.addEventListener('click',function(){var board=button.closest('.review-wrap').querySelector('.review-board'),card=board&&board.querySelector('.review-card');if(!board||!card)return;var gap=parseFloat(getComputedStyle(board).columnGap||getComputedStyle(board).gap)||0;board.scrollBy({left:Number(button.dataset.reviewStep)*(card.offsetWidth+gap),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});});`;
    const script=exportRuntime+menuRuntime+reviewRuntime+`document.querySelectorAll('[data-demo-submit]').forEach(function(button){button.addEventListener('click',function(){var root=button.closest('[role=form]'),fields=Array.from(root.querySelectorAll('input,textarea'));if(fields.every(function(field){return field.reportValidity();})){var output=root.querySelector('output');if(output)output.setAttribute('role','status');}});});document.querySelectorAll('[data-scroll-next]').forEach(function(button){button.addEventListener('click',function(){var next=button.closest('section');next=next&&next.nextElementSibling;if(next)next.scrollIntoView({behavior:'smooth',block:'start'});});});document.querySelectorAll('[data-logo-step]').forEach(function(button){button.addEventListener('click',function(){var band=button.closest('.logo-band'),nudge=band&&band.querySelector('.logo-nudge'),row=nudge&&nudge.querySelector('.logo-set'),item=row&&row.querySelector('.logo-item');if(!nudge||!item)return;var next=(Number(nudge.dataset.nudge)||0)+Number(button.dataset.logoStep)*(item.offsetWidth+(parseFloat(getComputedStyle(row).columnGap)||0));nudge.dataset.nudge=String(next);nudge.style.transform='translateX('+next+'px)';});});document.querySelectorAll('[data-slideshow]').forEach(function(root){var slides=Array.from(root.querySelectorAll('[data-slide]'));root.querySelectorAll('[data-slide-step]').forEach(function(button){button.addEventListener('click',function(){var current=slides.findIndex(function(slide){return !slide.hidden;}),next=(current+Number(button.dataset.slideStep)+slides.length)%slides.length;slides.forEach(function(slide,index){slide.hidden=index!==next;});var label=root.querySelector('[aria-live]');if(label)label.textContent=(next+1)+' / '+slides.length;});});});document.querySelectorAll('[data-gallery]').forEach(function(root){root.querySelectorAll('[data-gallery-filter]').forEach(function(button){button.addEventListener('click',function(){var group=button.dataset.galleryFilter;root.querySelectorAll('[data-gallery-group]').forEach(function(photo){photo.hidden=!!group&&photo.dataset.galleryGroup!==group;});root.querySelectorAll('[data-gallery-filter]').forEach(function(option){option.setAttribute('aria-pressed',String(option===button));});});});});`;
    for(const page of pages){
      const source=document.querySelector<HTMLElement>(`[data-export-page="${CSS.escape(page.id)}"] .site-preview`);if(!source)throw Error(`Could not prepare ${page.name} for export.`);
      const cloned=source.cloneNode(true) as HTMLElement,base=page.id===home.id?'':'../';
      const row=source.querySelector<HTMLElement>('.menu-frame');if(row)cloned.style.setProperty('--actual-menu-space',`${row.offsetHeight}px`);
      cloned.querySelectorAll('[data-editor-only]').forEach(element=>element.remove());
      cloned.querySelectorAll('[data-section]').forEach(element=>element.classList.remove('editable-section','selected-section'));
      cloned.querySelectorAll('details[open]').forEach(element=>element.removeAttribute('open'));
      cloned.querySelectorAll('input,textarea,button[type=submit]').forEach(element=>{(element as HTMLInputElement).disabled=false;});
      cloned.querySelectorAll<HTMLAnchorElement>('[data-site-href]').forEach(anchor=>{
        const target=pages.find(p=>p.id===anchor.dataset.linkPage),hash=anchor.dataset.linkHash||'',stored=anchor.dataset.siteHref||'';
        let href=safeHref(stored);
        if(target){href=target.id===page.id?(hash||'#top'):format==='wordpress'?`__BB_PAGE_${target.slug}__${hash}`:`${base}${target.id===home.id?'index.html':`${target.slug}/index.html`}${hash}`;}
        anchor.setAttribute('href',href);for(const key of ['data-site-href','data-link-page','data-link-hash'])anchor.removeAttribute(key);
      });
      const muted=Array.from(source.querySelectorAll('video')).map(video=>video.muted);
      const media=await prepareMediaExport(cloned,format);for(const asset of media.assets)files.set(asset.name,asset.data);for(const reference of media.references)references.add(reference);
      cloned.querySelectorAll('video').forEach((video,index)=>{if(muted[index])video.setAttribute('muted','');else video.removeAttribute('muted');});
      let content=cloned.outerHTML;
      if(format==='html'&&base)for(const asset of media.assets)content=content.replaceAll(asset.name,base+asset.name);
      if(format==='wordpress'){
        content=content.replaceAll('__BB_THEME_URI__',"<?php echo esc_url(get_template_directory_uri()); ?>");
        for(const target of pages)content=content.replaceAll(`__BB_PAGE_${target.slug}__`,`<?php echo esc_url(home_url('${target.id===home.id?'/':`/${target.slug}/`}')); ?>`);
      }
      const title=htmlEscape(page.site.seoTitle||page.name),description=htmlEscape(page.site.seoDescription||'');
      const styleHref=format==='wordpress'?"<?php echo esc_url(get_stylesheet_uri()); ?>":base+'assets/style.css',scriptHref=format==='wordpress'?"<?php echo esc_url(get_template_directory_uri()); ?>/assets/media.js":base+'assets/media.js';
      const html=`${format==='wordpress'?"<?php if (!defined('ABSPATH')) exit; ?>":''}<!doctype html><html ${format==='wordpress'?"<?php language_attributes(); ?>":'lang="en"'}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="stylesheet" href="${styleHref}">${format==='wordpress'?'<?php wp_head(); ?>':''}</head><body>${content}<script src="${scriptHref}"></script>${format==='wordpress'?'<?php wp_footer(); ?>':''}</body></html>`;
      write(format==='wordpress'?`pages/${page.slug}.php`:page.id===home.id?'index.html':`${page.slug}/index.html`,html);
    }
    write(format==='wordpress'?'style.css':'assets/style.css',(format==='wordpress'?'/*\nTheme Name: Business Builder\nVersion: 1.0.0\nRequires at least: 6.0\nText Domain: business-builder\n*/\n':'')+css);
    write('assets/media.js',script);write('media-references.json',JSON.stringify([...references],null,2));
    if(format==='wordpress'){
      const pageData=encoder.encode(JSON.stringify(pages.map(p=>({name:p.name,slug:p.slug,home:p.id===home.id}))));
      const payload=btoa(Array.from(pageData,byte=>String.fromCharCode(byte)).join(''));
      write('index.php',`<?php\nif (!defined('ABSPATH')) exit;\n$bb_slug = get_post_meta(get_queried_object_id(), '_bb_page', true);\n$bb_allowed = array(${pages.map(p=>`'${p.slug}'`).join(',')});\nif (!in_array($bb_slug, $bb_allowed, true)) $bb_slug = '${home.slug}';\ninclude __DIR__ . '/pages/' . $bb_slug . '.php';\n`);
      write('functions.php',`<?php\nif (!defined('ABSPATH')) exit;\nadd_action('after_setup_theme', function(){ add_theme_support('post-thumbnails'); });\nadd_action('after_switch_theme', function(){\n  $pages = json_decode(base64_decode('${payload}'), true);\n  foreach ($pages as $page) {\n    $existing = get_page_by_path($page['slug']);\n    $id = $existing ? $existing->ID : wp_insert_post(wp_slash(array('post_type'=>'page','post_status'=>'publish','post_title'=>$page['name'],'post_name'=>$page['slug'])));\n    if (is_wp_error($id) || !$id) continue;\n    update_post_meta($id, '_bb_page', $page['slug']);\n    if ($page['home']) { update_option('show_on_front', 'page'); update_option('page_on_front', $id); }\n  }\n});\n`);
    }
    write('README.txt',format==='wordpress'?'Install this ZIP from Appearance > Themes. Activation creates the included pages and sets Home as the front page. Existing page content is retained in WordPress. Test on staging before activation. Forms are demonstrations and do not submit or store data. Uploaded media and fonts are bundled; remote media remains linked.':'Upload the complete folder. Home is index.html; each page has its own folder and index.html. Keep assets/ beside the home file. Forms are demonstrations and do not submit or store data. Uploaded media and fonts are bundled; remote media remains linked.');
    return zipFiles(Array.from(files,([name,data])=>({name:format==='wordpress'?`business-builder/${name}`:name,data})));
}
type RequestQuery=Promise<{[key:string]:string|string[]|undefined}>;
export default function Home({searchParams}:{searchParams:RequestQuery}) { return <Suspense fallback={<div className="preview-loading"/>}><RequestedEditor searchParams={searchParams}/></Suspense>; }
function RequestedEditor({searchParams}:{searchParams:RequestQuery}) { const query=use(searchParams);return <MediaProvider><Editor initialPreview={query.preview==='1'} requestedPage={typeof query.page==='string'?query.page:undefined}/></MediaProvider>; }
function Editor({initialPreview,requestedPage}:{initialPreview:boolean;requestedPage?:string}) {
    const [history, dispatch] = useReducer(historyReducer, { past: [], present: initial, future: [] });
    const site = history.present;
    const [pages,setPages]=useState<PageEntry<Site>[]>([{id:"home",name:"Home",slug:"home",site:initial}]);
    const [activeId,setActiveId]=useState(requestedPage||"home");
    const [navigationMode,setNavigationMode]=useState<"layouts"|"pages">("layouts");
    const [saveError,setSaveError]=useState("");
    const [dirty,setDirty]=useState(false);
    const homeId=pages.find(p=>p.id==="home")?.id||pages[0].id;
    const snapshot=()=>pageSnapshot(pages,activeId,site);
    const mergeWorkspace=()=>{const raw=localStorage.getItem("business-builder-workspace-v2");const saved=raw?JSON.parse(raw):null;const records:PageEntry<Site>[]=[2,3].includes(saved?.schemaVersion)&&Array.isArray(saved.pages)?saved.pages:[];const map=new Map(records.map(p=>[p.id,{...p,site:migrateSite(p.site)}]));for(const p of snapshot())map.set(p.id,p);return pageAddresses(Array.from(map.values()));};
    const saveWorkspace=()=>{localStorage.setItem("business-builder-workspace-v2",JSON.stringify({schemaVersion:3,activeId,pages:mergeWorkspace()}));setDirty(false);};
    const [selected, setSelected] = useState<string>("hero");
    const [tab, setTab] = useState<"content" | "design" | "typography" | "actions" | "media">("content");
    const [textTarget,setTextTarget]=useState<"heading"|"body">("heading");
    const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
    const [availableWidth, setAvailableWidth] = useState(1000);
    const [canvasWidth, setCanvasWidth] = useState(1100);
    const [preview, setPreview] = useState(initialPreview);
    const [accountOpen,setAccountOpen]=useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportBusy, setExportBusy] = useState(false);
    const [exportPages,setExportPages]=useState<PageEntry<Site>[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [ready, setReady] = useState(false);
    const [pendingHash,setPendingHash]=useState<string|null>(null);
    const [navigation,setNavigation]=useState(0);
    const canvasRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const root = canvasRef.current;
        if (!root)
            return;
        const observer = new ResizeObserver(([entry]) => setAvailableWidth(Math.max(160, entry.contentRect.width)));
        observer.observe(root);
        return () => observer.disconnect();
    }, [ready]);
    const [notice, setNotice] = useState("");

    useEffect(()=>{const timer=window.setTimeout(()=>{try{
      setSidebarOpen(window.innerWidth>1100);
      if(window.innerWidth<=700)setDevice("mobile");
      const raw=localStorage.getItem("business-builder-workspace-v2");
      if(raw){const workspace=JSON.parse(raw);if([2,3].includes(workspace.schemaVersion)&&Array.isArray(workspace.pages)&&workspace.pages.length&&workspace.pages.length<=30&&workspace.pages.every((p:PageEntry<Site>)=>typeof p.id==="string"&&typeof p.name==="string"&&validSite(p.site))){const list=pageAddresses((workspace.pages as PageEntry<Site>[]).map(p=>({...p,site:migrateSite(p.site)})));const requested=requestedPage||workspace.activeId;const page=list.find(p=>p.id===requested)||list[0];if(workspace.schemaVersion===2){if(!localStorage.getItem("business-builder-workspace-v2-backup"))localStorage.setItem("business-builder-workspace-v2-backup",raw);localStorage.setItem("business-builder-workspace-v2",JSON.stringify({schemaVersion:3,activeId:page.id,pages:list}));}setPages(list);setActiveId(page.id);setSelected(page.site.blocks.find(b=>b.type==="hero")?.id||page.site.blocks[0]?.id||"");dispatch({type:"load",next:bindMenu(sharedMenu({...initial,...page.site},(list.find(p=>p.id==="home")||list[0]).site),list)});setReady(true);return;}if(!localStorage.getItem("business-builder-workspace-v2-unreadable"))localStorage.setItem("business-builder-workspace-v2-unreadable",raw);localStorage.removeItem("business-builder-workspace-v2");}
      setActiveId("home");setDirty(!initialPreview);
      const legacy=localStorage.getItem("business-builder-demo-v1");if(legacy){const parsed:unknown=JSON.parse(legacy);if(validSite(parsed)){const next=migrateSite({...initial,...parsed,blocks:undefined,extras:{...initial.extras,...parsed.extras},contactSecondary:parsed.contactSecondary??initial.contactSecondary});setPages([{id:"home",name:"Home",slug:"home",site:sharedMenu(next,next)}]);dispatch({type:"load",next:sharedMenu(next,next)});}}
    }catch{try{const broken=localStorage.getItem("business-builder-workspace-v2");if(broken&&!localStorage.getItem("business-builder-workspace-v2-unreadable"))localStorage.setItem("business-builder-workspace-v2-unreadable",broken);localStorage.removeItem("business-builder-workspace-v2");}catch{}setActiveId("home");setDirty(!initialPreview);}setReady(true);},0);return()=>window.clearTimeout(timer);},[requestedPage,initialPreview]);
    useEffect(()=>{if(!ready||saveError||!dirty)return;const timer=window.setTimeout(()=>{try{const raw=localStorage.getItem("business-builder-workspace-v2"),saved=raw?JSON.parse(raw):null;const map=new Map<string,PageEntry<Site>>((saved?.pages||[]).map((p:PageEntry<Site>)=>[p.id,p]));for(const p of pageSnapshot(pages,activeId,site))map.set(p.id,p);localStorage.setItem("business-builder-workspace-v2",JSON.stringify({schemaVersion:3,activeId,pages:pageAddresses(Array.from(map.values()))}));setDirty(false);}catch{setSaveError("Changes could not be saved. Export your project as a backup.");}},250);return()=>window.clearTimeout(timer);},[site,pages,activeId,homeId,ready,saveError,dirty]);
    useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key!=="business-builder-workspace-v2"||!e.newValue)return;try{const saved=JSON.parse(e.newValue);if([2,3].includes(saved.schemaVersion)&&Array.isArray(saved.pages)&&saved.pages.every((p:PageEntry<Site>)=>validSite(p.site)))setPages(old=>pageAddresses((saved.pages as PageEntry<Site>[]).map(p=>({...p,site:migrateSite(p.site)}))).map((p:PageEntry<Site>)=>p.id===activeId?old.find(v=>v.id===activeId)||p:p));}catch{}};window.addEventListener("storage",sync);return()=>window.removeEventListener("storage",sync);},[activeId]);
    useEffect(()=>{if(!ready||saveError)return;const next=syncServicePages(pageSnapshot(pages,activeId,site),homeId);if(!next)return;const home=next.find(p=>p.id===homeId)!;const linked=next.map(p=>p.id===homeId?p:{...p,site:sharedMenu(p.site,home.site)});setPages(linked);dispatch({type:'sync',next:(linked.find(p=>p.id===activeId)||home).site});setDirty(true);},[ready,saveError,site,pages,activeId,homeId]);
    const switchPage=(id:string,hash='',push=true)=>{const list=mergeWorkspace(),page=list.find(p=>p.id===id);if(!page)return;
      if(preview){setNavigation(n=>n+1);setPendingHash(hash);if(push)window.history.pushState(null,'',`?preview=1&page=${encodeURIComponent(id)}${hash}`);}
      if(id===activeId)return;if(window.innerWidth<=1100)setSidebarOpen(false);if(dirty)saveWorkspace();setDirty(!preview);setPages(list);setActiveId(id);dispatch({type:'load',next:bindMenu(sharedMenu(page.site,(list.find(p=>p.id===homeId)||list[0]).site),list)});setSelected(page.site.blocks.find(b=>b.type==='hero')?.id||page.site.blocks[0]?.id||'');setTab('content');canvasRef.current?.scrollTo({top:0,behavior:'instant'});
    };
    const scrollPreview=useEffectEvent((hash:string)=>{const root=canvasRef.current;if(!root)return;const target=hash?root.querySelector<HTMLElement>(`[id="${CSS.escape(hash.slice(1))}"]`):null;root.scrollTo({top:target?target.getBoundingClientRect().top-root.getBoundingClientRect().top+root.scrollTop:0,behavior:'instant'});});
    useLayoutEffect(()=>{if(preview&&ready)scrollPreview(pendingHash??window.location.hash);},[activeId,pendingHash,preview,ready,navigation]);
    const restorePreview=useEffectEvent(()=>{const query=new URLSearchParams(window.location.search);switchPage(query.get('page')||homeId,window.location.hash,false);});
    useEffect(()=>{if(!preview||!ready)return;window.addEventListener('popstate',restorePreview);return()=>window.removeEventListener('popstate',restorePreview);},[preview,ready]);
    const addPage=(name:string,placement:PagePlacement)=>{
      if(pages.length>=30||saveError)return;
      const list=mergeWorkspace(),home=list.find(p=>p.id===homeId)!,id=crypto.randomUUID(),slug=pageSlug(name,list.map(p=>p.slug||pageSlug(p.name)));
      const shared=placePage({...home.site,footerColumns:footerContent(home.site)},{id,name,slug},placement.where,placement.parent);
      shared.hidden=shared.hidden.filter(section=>section!==(pageLocation(shared,{id,name,slug}).where==='bottom'?'footer':'header'));
      const next=sharedMenu({...site,blocks:starterBlocks(placement.kind||'service',name,shared),theme:site.theme,accent:site.accent,headline:name,seoTitle:placement.title.trim()||`${name} | ${shared.brand}`,seoDescription:placement.description.trim(),hidden:sections.map(s=>s.id).filter(id=>!['header','hero','about','contact','footer'].includes(id))},shared);
      setDirty(true);setPages([...list.map(p=>p.id===homeId?{...p,site:shared}:p),{id,name,slug,site:next}]);setActiveId(id);dispatch({type:'load',next});setSelected(next.blocks.find(b=>b.type==='hero')?.id||next.blocks[0]?.id||'');setTab('content');canvasRef.current?.scrollTo({top:0});if(window.innerWidth<=1100)setSidebarOpen(false);
    };
    const placeCurrent=(where:'top'|'bottom'|'under'|'none',parent:number)=>{const page=pages.find(p=>p.id===activeId)!;const shared=placePage({...site,footerColumns:footerContent(site)},page,where,parent);shared.hidden=shared.hidden.filter(id=>id!==(where==='bottom'?'footer':'header'));update(shared);};
    const renamePage=(name:string)=>{const old=pages.find(p=>p.id===activeId)!;const seoTitle=site.seoTitle===`${old.name} | ${site.brand}`?`${name} | ${site.brand}`:site.seoTitle===old.name?name:site.seoTitle;const next={...site,seoTitle,blocks:site.blocks.map(b=>b.type==='hero'&&b.content.title===old.name?{...b,content:{...b.content,title:name}}:b)};setDirty(true);dispatch({type:'set',next});setPages(snapshot().map(p=>p.id===activeId?{...p,name,site:next}:p));};
    const update = (patch: Partial<Site>) => {if(patch.footerColumns)patch.footerColumns=patch.footerColumns.map(c=>({...c,links:c.links.map(l=>({...l,pageId:linkedPage(pages,l.href)?.id}))}));if(patch.navTargets)patch.navPageIds=patch.navTargets.map(href=>linkedPage(pages,href)?.id||null);setDirty(true);dispatch({ type: "set", next: { ...site, ...patch, blocks:fixedBlockOrder(patch.blocks||site.blocks).map(b=>b.type==='header'?{...b,layout:headerLook(patch.headerStyle||site.headerStyle)}:b.type==='footer'?{...b,layout:patch.footerStyle||site.footerStyle}:b) } });};
    const saveAccount=(next:AccountDetails)=>{const apply=(source:Site):Site=>({...source,ownerName:next.ownerName,brand:next.brand,address:next.address,phone:next.phone,email:next.email,blocks:source.blocks.map(b=>b.type==='contact'?{...b,content:{...b.content,address:next.address,phone:next.phone,email:next.email,hours:next.hours}}:b)});setDirty(true);setPages(list=>list.map(p=>({...p,site:apply(p.id===activeId?site:p.site)})));dispatch({type:"set",next:apply(site)});};
    const extraUpdate = (id:string,patch:Partial<BlockContent>) => update({blocks:site.blocks.map(b=>b.id===id?{...b,content:{...b.content,...patch}}:b)});
    const buttonUpdate = (which:"primary"|"secondary",patch:Partial<ButtonData>)=>extraUpdate(selected,{buttons:selectedBlock.content.buttons.map((b,i)=>i===(which==="primary"?0:1)?{...b,...patch}:b)});
    const flash = (message: string) => { setNotice(message); };
    const chooseSection = (id:string) => {
        setSelected(id);
        if(window.innerWidth<=1100)setSidebarOpen(false);
        setTab("content");
        setPreview(false);
        requestAnimationFrame(() => {
            const root = canvasRef.current;
            const target = root?.querySelector<HTMLElement>(`[data-section="${CSS.escape(id)}"]`);
            if (root && target)
                root.scrollTo({ top: target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 18 - (site.headerSticky&&id!==site.blocks.find(b=>b.type==='header')?.id?(root.querySelector('.menu-frame')?.getBoundingClientRect().height||0):0), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        });
    };
    const openPreview = () => { if(saveError){flash(saveError);return;}try{saveWorkspace();window.open(`${window.location.origin}/?preview=1&page=${encodeURIComponent(activeId)}`,"_blank","noopener,noreferrer");}catch{flash("Preview could not be saved. Check browser storage permissions.");} };
    const exportConfig=()=>{const records=mergeWorkspace(),home=records.find(p=>p.id===homeId)!;downloadFile(new Blob([JSON.stringify({schemaVersion:3,activeId,pages:records.map(p=>({...p,site:sharedMenu(p.site,home.site)}))},null,2)],{type:'application/json'}),'business-website-config.json');flash('Configuration exported');};
    const exportPackage=async(format:'html'|'wordpress')=>{
      setExportOpen(false);const records=mergeWorkspace(),home=records.find(p=>p.id===homeId)!;
      const prepared=records.map(p=>({...p,site:sharedMenu(p.site,home.site)}));
      try{flushSync(()=>{setExportBusy(true);setExportPages(prepared);});downloadFile(await packageWebsite(prepared,format),`business-${format==='html'?'website':'wordpress-theme'}.zip`);flash(`${format.toUpperCase()} website exported`);}
      catch(error){flash(`Export failed: ${String(error)}`);}
      finally{setExportBusy(false);setExportPages([]);}
    };
    const changeSectionSettings=(id:string,value:SectionSettings)=>update({blocks:site.blocks.map(b=>b.id===id?{...b,settings:value}:b)});
    const footerDefaults=footerContent({...site,hidden:activeId===homeId?site.hidden:pages.find(p=>p.id===homeId)!.site.hidden});
    const selectedBlock=site.blocks.find(b=>b.id===selected)||site.blocks[0],selectedType=selectedBlock?.type||'hero';
    const changeLayout=(value:SectionSettings)=>{if(selectedType==='footer'){const columns=site.footerColumns||footerDefaults;update({footerStyle:'columns',blocks:site.blocks.map(b=>b.id===selected?{...b,settings:value}:b),footerColumns:Array.from({length:Math.max(columns.length,value.columns||3)},(_,i)=>columns[i]||{title:`Column ${i+1}`,text:'',links:[]})});return;}if(selectedType==='solutions'&&selectedBlock?.layout==='Numbered steps'){const count=Math.min(5,Math.max(3,value.columns||5)),items=selectedBlock.content.items,next=items.length>=count?items:[...items,...Array.from({length:count-items.length},()=>({title:'',description:'',icon:'check' as const}))];update({blocks:site.blocks.map(b=>b.id===selected?{...b,settings:{...value,columns:count,widths:equalWidths(count)},content:{...b.content,items:next}}:b)});return;}changeSectionSettings(selected,value);};
    const settings=selectedBlock?.settings||{columns:defaultColumns(selectedType)};
    const singleLayout=['Price list','Promise band','One message','One large quote','Accordion','Scrolling row','Heading and slider','Signals'].includes(selectedBlock?.layout||'');
    const gridSection=!singleLayout&&!['header','hero','promo'].includes(selectedType);
    const section=sections.find(s=>s.id===selectedType)!;
    const changeBlock=(patch:Partial<Block>)=>{if(patch.layout){if(selectedType==='hero'&&patch.layout==='story')patch.content={...selectedBlock.content,...(selectedBlock.id==='hero'?storyHeroMedia(selectedBlock.content):{}),showSecondary:true,factIcons:selectedBlock.content.factIcons?.length?selectedBlock.content.factIcons:['shield','gear','star']};else if(selectedType==='hero'&&!['short','center'].includes(patch.layout))patch.content={...selectedBlock.content,showSecondary:true};else if(selectedType==='proof'&&patch.layout==='Photo and reasons')patch.content=proofReasonContent(selectedBlock.content);else if(selectedType==='logos'&&patch.layout==='Heading and slider')patch.content=logoBandContent(selectedBlock.content);else if(selectedType==='trust'&&patch.layout==='Signals')patch.content=trustSignalContent(selectedBlock.content);const count=['Price list','Promise band','One message','One large quote','Accordion','Scrolling row','Heading and slider','Signals'].includes(patch.layout)?1:patch.layout==='Two columns'?2:defaultColumns(selectedType);patch.settings={...settings,columns:count,widths:Array.from({length:count},()=>100/count)};}update({blocks:site.blocks.map(b=>b.id===selected?{...b,...patch}:b)});};
    const editBlocks=(operation:'add'|'duplicate'|'delete'|'visibility',id:string,type?:SectionId)=>{const block=site.blocks.find(b=>b.id===id),index=site.blocks.findIndex(b=>b.id===id);if(!block&&operation!=='add')return;if(block&&['header','footer'].includes(block.type)&&operation==='delete'&&!window.confirm('Delete this shared section from every page?'))return;
      if(operation==='visibility'){update({blocks:site.blocks.map(b=>b.id===id?{...b,hidden:!b.hidden}:b)});return;}if(operation==='delete'){update({blocks:site.blocks.filter(b=>b.id!==id)});setSelected(site.blocks.find(b=>b.id!==id)?.id||'');return;}
      if(site.blocks.length>=80)return;const added=operation==='duplicate'?duplicateBlock(block!):makeBlock(type!);if(['header','footer'].includes(added.type)&&site.blocks.some(b=>b.type===added.type))return;const next=[...site.blocks];next.splice(Math.max(0,index+1),0,added);update({blocks:next});setSelected(added.id);setTab('content');
    };
    if(preview&&!ready)return <div className="preview-loading"/>;
    return <main className={`builder-shell studio-editor ${sidebarOpen ? "" : "sidebar-collapsed"} ${preview ? "standalone-preview" : ""}`}>
    {accountOpen ? <Account value={{ownerName:(activeId===homeId?site:pages.find(p=>p.id===homeId)?.site||site).ownerName||'',email:(activeId===homeId?site:pages.find(p=>p.id===homeId)?.site||site).email,brand:(activeId===homeId?site:pages.find(p=>p.id===homeId)?.site||site).brand,address:(activeId===homeId?site:pages.find(p=>p.id===homeId)?.site||site).address,phone:(activeId===homeId?site:pages.find(p=>p.id===homeId)?.site||site).phone,hours:((activeId===homeId?site:pages.find(p=>p.id===homeId)?.site||site).blocks.find(b=>b.type==='contact')?.content.hours)||''}} onClose={()=>setAccountOpen(false)} onSave={saveAccount}/> : <Navigation site={site} pages={pages} activeId={activeId} mode={navigationMode} setMode={setNavigationMode} sections={site.blocks.map(b=>({id:b.id,label:catalog.find(s=>s.id===b.type)!.label}))} blocks={site.blocks} editBlocks={editBlocks} hidden={site.blocks.filter(b=>b.hidden).map(b=>b.id)} selected={selected} choose={chooseSection} switchPage={switchPage} addPage={addPage} renamePage={renamePage} editSEO={update} placeCurrent={placeCurrent}/>}
    <div className="workspace"><div className="workspace-toolbar"><button className="navigation-toggle" aria-expanded={sidebarOpen} onClick={()=>setSidebarOpen(v=>!v)}>☰ <span>Pages & sections</span></button><select className="mobile-sections" aria-label="Select section" value={selected} onChange={e => chooseSection(e.target.value as SectionId)}>{site.blocks.map(b=><option key={b.id} value={b.id}>{catalog.find(s=>s.id===b.type)!.label}</option>)}</select><div className="toolbar-left"><span className="breadcrumb">My website</span><span className="crumb-separator">/</span><strong>{pages.find(p=>p.id===activeId)?.name||"Home"}</strong><span className="draft-badge">Draft</span></div><div className="toolbar-middle" role="group" aria-label="Preview size"><button className={device === "desktop" ? "tool-active" : ""} onClick={() => setDevice("desktop")} title="Desktop" aria-label="Desktop preview"><DeviceIcon type="desktop"/></button><button className={device === "tablet" ? "tool-active" : ""} onClick={() => setDevice("tablet")} title="Tablet" aria-label="Tablet preview"><DeviceIcon type="tablet"/></button><button className={device === "mobile" ? "tool-active" : ""} onClick={() => setDevice("mobile")} title="Mobile" aria-label="Mobile preview"><DeviceIcon type="mobile"/></button></div><label className="canvas-width"><span title="Canvas scales to fit the workspace">{Math.round(Math.min(1, availableWidth / (device === "desktop" ? canvasWidth : device === "tablet" ? 768 : 390)) * 100)}% · </span>Canvas <input aria-label="Canvas width" type="number" min="320" max="1920" step="10" value={canvasWidth} onChange={e => { setCanvasWidth(Math.max(320, Math.min(1920, Number(e.target.value) || 320))); setDevice("desktop"); }}/> px</label><div className="theme-switch" role="group" aria-label="Page appearance"><button aria-pressed={site.theme==="paper"} title="Light website theme" onClick={()=>update({theme:"paper"})}><EditorIcon name="sun"/><span>Light</span></button><button aria-pressed={site.theme!=="paper"} title="Dark website theme" onClick={()=>update({theme:"midnight"})}><EditorIcon name="moon"/><span>Dark</span></button></div><div className="toolbar-right"><button className="account-button" type="button" aria-pressed={accountOpen} aria-label="Account" title="Account" onClick={()=>{setSidebarOpen(true);setAccountOpen(v=>!v);}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg></button><button onClick={() => {setDirty(true);dispatch({ type: "undo" });}} disabled={!history.past.length} title="Undo">↶</button><button onClick={() => {setDirty(true);dispatch({ type: "redo" });}} disabled={!history.future.length} title="Redo">↷</button><button onClick={openPreview} className="preview-toggle">Live preview ↗</button><div className="export-menu" onKeyDown={e => { if (e.key === "Escape")
        setExportOpen(false); }}><button className="publish-btn" aria-expanded={exportOpen} aria-haspopup="menu" disabled={exportBusy} onClick={() => setExportOpen(v => !v)}>{exportBusy ? 'Preparing…' : 'Export ▾'}</button>{exportOpen && <div className="export-options" role="menu"><button role="menuitem" onClick={() => void exportPackage('html')}>HTML website (.zip)</button><button role="menuitem" onClick={() => void exportPackage('wordpress')}>WordPress website theme (.zip)</button><button role="menuitem" onClick={() => { setExportOpen(false); exportConfig(); }}>All pages (.json)</button></div>}</div></div></div>
      <div ref={canvasRef} className={`canvas-area ${preview ? "canvas-preview" : ""}`}><div className={`canvas-frame frame-${device}`} style={{ width: `${device === "desktop" ? canvasWidth : device === "tablet" ? 768 : 390}px`, maxWidth: "none", zoom: preview ? 1 : Math.min(1, availableWidth / (device === "desktop" ? canvasWidth : device === "tablet" ? 768 : 390)) }}><div className="canvas-top"><span className="canvas-live-dot"/> {pages.find(p=>p.id===activeId)?.name||"Home"}<span className="canvas-url">northline.example</span></div><SitePreview selectPage={switchPage} site={site} selected={selected} select={chooseSection} editable={!preview} changeSettings={changeSectionSettings} pages={pages} activeId={activeId}/></div></div>
    </div>
    {!preview && <aside className="inspector"><div className="inspector-top"><div><span className="inspector-overline">EDIT SECTION</span><h2>{section.label}</h2>{["header","footer"].includes(selectedType)&&<small>Shared across all pages</small>}</div><span className="inspector-status">● Live</span></div><div className="inspector-tabs" role="group" aria-label="Section settings">{([{id:"content",label:"Content",icon:"content"},{id:"design",label:"Layout",icon:"layouts"},{id:"typography",label:"Typography",icon:"content"},{id:"actions",label:"Actions",icon:"buttons"},{id:"media",label:"Media",icon:"media"}] as const).map(t=><button key={t.id} aria-pressed={tab===t.id} className={tab===t.id?"tab-active":""} onClick={()=>setTab(t.id)}><EditorIcon name={t.icon}/><span>{t.label}</span></button>)}</div>
      <div className="inspector-body" key={`${selected}-${tab}`}>
        <label className="visibility-toggle"><span>Show this section</span><input type="checkbox" checked={!selectedBlock?.hidden} onChange={e=>changeBlock({hidden:!e.target.checked})}/></label>
        {selectedBlock&&tab==='media'&&<MediaFields key={selected} block={selectedBlock} used={JSON.stringify({history,pages:snapshot()})} change={patch=>extraUpdate(selected,patch)}/>}
        {selectedBlock&&tab==='content'&&<ContentFields block={selectedBlock} site={site} pages={pages} update={update} change={patch=>extraUpdate(selected,patch)} footerDefaults={footerDefaults}/>}
        {tab === "typography" && <TypographyControls value={settings} change={s=>changeSectionSettings(selected,s)} target={textTarget} setTarget={setTextTarget}/>}
        {tab === "design" && <>
          {selectedType === "header" && <>
            <Choice label="Menu look" value={site.headerStyle} onChange={headerStyle=>update({headerStyle})} options={[{value:'pill',label:'Rounded menu'},{value:'rounded',label:'Soft corners'},{value:'standard',label:'Standard bar'}]}/>
            <Choice label="Stays on screen" value={site.headerSticky?'yes':'no'} onChange={v=>update({headerSticky:v==='yes'})} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}/>
            <Choice label="Photo behind the menu" value={site.headerOverlay?'yes':'no'} onChange={v=>update({headerOverlay:v==='yes'})} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}/>
            <Choice label="Menu background" value={site.headerBackground!==false?'yes':'no'} onChange={v=>update({headerBackground:v==='yes'})} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}/>
            <Choice label="Extra buttons" value={String(site.headerButtonCount??1)} onChange={v=>update({headerButtonCount:Number(v) as 0|1|2})} options={[{value:'0',label:'None'},{value:'1',label:'One'},{value:'2',label:'Two'}]}/>
            {site.headerStyle!=='standard'&&<Choice label="Where those buttons sit" value={site.headerButtonPlace||'inside'} onChange={headerButtonPlace=>update({headerButtonPlace})} options={[{value:'inside',label:'Inside the menu'},{value:'beside',label:'Beside the menu'}]}/>}
            {menuButtons(site).slice(0,site.headerButtonCount??1).map((button,i)=><div className="action-editor" key={i}><h3>Extra button {i+1}</h3><Field label={`Button ${i+1} text`} value={button.label} onChange={label=>update({headerButtons:menuButtons(site).map((b,j)=>i===j?{...b,label}:b)})}/><Field label={`Button ${i+1} destination`} value={button.href} onChange={href=>update({headerButtons:menuButtons(site).map((b,j)=>i===j?{...b,href}:b)})}/></div>)}
            <p className="helper-text">Photo behind the menu puts the menu over the hero. Turn off Menu background to let the photo show through.</p>
          </>}
{selectedType!=="header"&&<><LayoutControls value={settings} change={changeLayout} max={gridSection?(["proof","contact","quote"].includes(selectedType)?2:5):1} min={selectedType==='solutions'&&selectedBlock?.layout==='Numbered steps'?3:1} legend={selectedType==='solutions'&&selectedBlock?.layout==='Numbered steps'?'Steps':'Columns'}/><button className="reset-style" onClick={()=>changeSectionSettings(selected,{columns:singleLayout?1:['proof','contact','quote','closing'].includes(selectedType)?2:defaultColumns(selectedType)})}>Reset section layout</button><div className="editor-divider"/></>}{["header","footer"].includes(selectedType)&&activeId!==homeId&&<p className="helper-text">Menu colors come from Home. Page appearance below changes this page only.</p>}<Choice label="Page appearance" value={site.theme ?? "midnight"} onChange={theme => update({ theme })} options={[{ value: "paper", label: "Light" }, { value: "midnight", label: "Dark" }]}/><label className="field"><span>Page accent</span><div className="color-input"><input type="color" value={/^#[0-9a-f]{6}$/i.test(site.accent) ? site.accent : "#5878f5"} onChange={e => update({ accent: e.target.value })}/><code>{site.accent}</code></div></label>
          {selectedType === "footer" && <Choice label="Footer style" value={site.footerStyle} onChange={footerStyle => update({ footerStyle,blocks:site.blocks.map(b=>b.id===selected?{...b,settings:{...settings,columns:footerStyle==='minimal'?1:3,widths:footerStyle==='minimal'?[100]:[100/3,100/3,100/3]}}:b) })} options={[{ value: "columns", label: "Columns" }, { value: "minimal", label: "Minimal" }]}/>}
          {selectedBlock&&selectedType==='hero'&&<><HeroLayouts site={{...site,layout:selectedBlock.layout as 'split'|'center'|'image'|'short'|'story'}} change={layout=>changeBlock({layout})}/><Choice label="Height" value={selectedBlock.content.height||'standard'} onChange={height=>extraUpdate(selected,{height})} options={[{value:'standard',label:'Standard'},{value:'full',label:'Full screen'}]}/><Choice label="Text alignment" value={selectedBlock.content.align||'left'} onChange={align=>extraUpdate(selected,{align})} options={[{value:'left',label:'Left'},{value:'center',label:'Center'}]}/>{selectedBlock.id==='hero'&&activeId===homeId&&<Choice label="Business details" value={selectedBlock.content.showBusiness?'bottom':'off'} onChange={v=>extraUpdate(selected,{showBusiness:v==='bottom'})} options={[{value:'off',label:'Off'},{value:'bottom',label:'Bottom'}]}/>}<label className="field"><span>Image darkness</span><input aria-label="Image darkness" type="range" min="0" max="80" value={selectedBlock.content.darkness??36} onChange={e=>extraUpdate(selected,{darkness:Number(e.target.value)})}/></label></>}
          {selectedBlock&&selectedType==='reviews'&&<><Choice label="Layout" value={reviewLayout(selectedBlock.layout)} onChange={(value:ReviewLayout)=>changeBlock({layout:reviewLayoutName(value)})} options={[{value:'featured',label:'Featured'},{value:'grid',label:'Grid'},{value:'carousel',label:'Carousel'},{value:'auto',label:'Auto'}]}/><Choice label="Review text" value={selectedBlock.content.reviewText==='full'?'full':'excerpt'} onChange={value=>extraUpdate(selected,{reviewText:value as 'full'|'excerpt'})} options={[{value:'excerpt',label:'Excerpt'},{value:'full',label:'Full'}]}/><Choice label="Avatars" value={selectedBlock.content.avatar||'circle'} onChange={value=>extraUpdate(selected,{avatar:value as 'off'|'circle'|'square'})} options={[{value:'circle',label:'Circles'},{value:'square',label:'Squares'},{value:'off',label:'Hidden'}]}/><Choice label="Names" value={selectedBlock.content.namePrivacy?'initials':'full'} onChange={value=>extraUpdate(selected,{namePrivacy:value==='initials'})} options={[{value:'full',label:'Full name'},{value:'initials',label:'Initials'}]}/><Choice label="Card surface" value={selectedBlock.content.cardFace==='plain'?'plain':'filled'} onChange={value=>extraUpdate(selected,{cardFace:value as 'filled'|'plain'})} options={[{value:'filled',label:'Filled'},{value:'plain',label:'Plain'}]}/><Choice label="Card padding" value={selectedBlock.content.cardPad==='compact'?'compact':'comfortable'} onChange={value=>extraUpdate(selected,{cardPad:value as 'comfortable'|'compact'})} options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'}]}/><Toggle label="Show stars" checked={selectedBlock.content.showRating!==false} change={showRating=>extraUpdate(selected,{showRating})}/><Toggle label="Show date" checked={selectedBlock.content.showDate!==false} change={showDate=>extraUpdate(selected,{showDate})}/><Toggle label="Show service" checked={selectedBlock.content.showService!==false} change={showService=>extraUpdate(selected,{showService})}/><Toggle label="Show source" checked={selectedBlock.content.showSource!==false} change={showSource=>extraUpdate(selected,{showSource})}/><p className="helper-text">Column count and spacing are above. Text size and color are in Typography. A wide layout steps down to two cards, then one, when the section gets narrow. Five columns scroll sideways instead of squeezing.</p></>}
          {selectedBlock&&selectedType!=='header'&&selectedType!=='footer'&&selectedType!=='hero'&&selectedType!=='reviews'&&<label className="field"><span>Section layout</span><select aria-label="Section layout" value={selectedBlock.layout} onChange={e=>changeBlock({layout:e.target.value})}>{blockLayouts[selectedType].map(layout=><option key={layout}>{layout}</option>)}</select></label>}
          {selectedBlock&&selectedType==='services'&&selectedBlock.layout==='Photo cards'&&<><label className="field"><span>Gradient</span><input aria-label="Gradient" type="range" min="0" max="80" value={selectedBlock.content.darkness??64} onChange={e=>extraUpdate(selected,{darkness:Number(e.target.value)})}/></label><Choice label="Arrow" value={selectedBlock.content.arrowCircle===false?'plain':'circle'} onChange={v=>extraUpdate(selected,{arrowCircle:v==='circle'})} options={[{value:'circle',label:'Circle'},{value:'plain',label:'Plain'}]}/></>}
          {selectedBlock&&selectedType==='logos'&&selectedBlock.layout==='Heading and slider'&&<Choice label="Heading" value={selectedBlock.content.showHeading===false?'hide':'show'} onChange={v=>extraUpdate(selected,{showHeading:v==='show'})} options={[{value:'show',label:'Show'},{value:'hide',label:'Hide'}]}/>}
          {selectedBlock&&selectedType==='trust'&&selectedBlock.layout==='Signals'&&<><Choice label="Background" value={selectedBlock.content.showMedia===false?'none':(selectedBlock.content.showMedia||selectedBlock.content.media.src)?'photo':'none'} onChange={v=>extraUpdate(selected,{showMedia:v==='photo'})} options={[{value:'none',label:'None'},{value:'photo',label:'Photo'}]}/><Choice label="Photo side" value={selectedBlock.content.photoSide==='left'?'left':'right'} onChange={v=>extraUpdate(selected,{photoSide:v as 'left'|'right'})} options={[{value:'right',label:'Right'},{value:'left',label:'Left'}]}/></>}
          {selectedBlock&&selectedType==='trust'&&selectedBlock.layout==='Signals'&&selectedBlock.content.showMedia!==false&&(!!selectedBlock.content.showMedia||!!selectedBlock.content.media.src)&&<><Choice label="Fit" value={selectedBlock.content.media.fit==='contain'?'contain':'cover'} onChange={v=>extraUpdate(selected,{media:{...selectedBlock.content.media,fit:v as 'cover'|'contain'}})} options={[{value:'cover',label:'Cover'},{value:'contain',label:'Contain'}]}/><label className="field"><span>Image position, horizontal: {selectedBlock.content.media.x??50}%</span><input aria-label="Image position, horizontal" type="range" min="0" max="100" value={selectedBlock.content.media.x??50} onChange={e=>extraUpdate(selected,{media:{...selectedBlock.content.media,x:Number(e.target.value)}})}/></label><label className="field"><span>Image position, vertical: {selectedBlock.content.media.y??50}%</span><input aria-label="Image position, vertical" type="range" min="0" max="100" value={selectedBlock.content.media.y??50} onChange={e=>extraUpdate(selected,{media:{...selectedBlock.content.media,y:Number(e.target.value)}})}/></label><label className="field"><span>Section color</span><input aria-label="Section color" type="color" value={/^#[0-9a-f]{6}$/i.test(selectedBlock.content.background||'')?selectedBlock.content.background!:'#141922'} onChange={e=>extraUpdate(selected,{background:e.target.value})}/></label><Choice label="Fade" value={selectedBlock.content.fade===false?'off':'on'} onChange={v=>extraUpdate(selected,{fade:v==='on'})} options={[{value:'on',label:'On'},{value:'off',label:'Off'}]}/><Choice label="Direction" value={selectedBlock.content.fadeDirection==='rtl'?'rtl':'ltr'} onChange={v=>extraUpdate(selected,{fadeDirection:v as 'ltr'|'rtl'})} options={[{value:'ltr',label:'Left to right'},{value:'rtl',label:'Right to left'}]}/><label className="field"><span>Fade width: {Math.round(selectedBlock.content.fadeWidth??35)}%</span><input aria-label="Fade width" type="range" min="0" max="100" value={selectedBlock.content.fadeWidth??35} onChange={e=>extraUpdate(selected,{fadeWidth:Number(e.target.value)})}/></label><label className="field"><span>Fade strength: {Math.round(selectedBlock.content.fadeStrength??100)}%</span><input aria-label="Fade strength" type="range" min="0" max="100" value={selectedBlock.content.fadeStrength??100} onChange={e=>extraUpdate(selected,{fadeStrength:Number(e.target.value)})}/></label><label className="field"><span>Gradient</span><input aria-label="Gradient" type="range" min="0" max="80" value={selectedBlock.content.darkness??64} onChange={e=>extraUpdate(selected,{darkness:Number(e.target.value)})}/></label></>}
          {selectedBlock&&selectedType==='proof'&&selectedBlock.layout==='Photo and reasons'&&<><Choice label="Buttons" value={String(selectedBlock.content.buttonCount??2)} onChange={v=>extraUpdate(selected,{buttonCount:Number(v) as 0|1|2})} options={[{value:'2',label:'Both'},{value:'1',label:'One'},{value:'0',label:'None'}]}/><Choice label="Intro alignment" value={selectedBlock.content.headAlign||'center'} onChange={v=>extraUpdate(selected,{headAlign:v as 'top'|'center'|'bottom'})} options={[{value:'top',label:'Top'},{value:'center',label:'Center'},{value:'bottom',label:'Bottom'}]}/><Choice label="Photo side" value={selectedBlock.content.photoSide||'left'} onChange={v=>extraUpdate(selected,{photoSide:v as 'left'|'right'})} options={[{value:'left',label:'Left'},{value:'right',label:'Right'}]}/></>}

          {!["header", "hero", "footer"].includes(selectedType) && <p className="helper-text">Use Typography to style text. Keep one clear main action for visitors.</p>}
        </>}
        {tab==='actions'&&selectedBlock&&<>{selectedType==='hero'&&['short','center'].includes(selectedBlock.layout)&&<Toggle label="Show secondary button" checked={selectedBlock.content.showSecondary!==false} change={showSecondary=>extraUpdate(selected,{showSecondary})}/>}{!selectedBlock.content.buttons.length&&<p className="helper-text">{selectedType==='header'?'Edit the menu buttons in Layout.':selectedType==='footer'?'Edit links in Content.':selectedType==='quote'?'Edit the form button in Content.':'This section has no separate buttons.'}</p>}{selectedBlock.content.buttons.filter((_,i)=>i===0||selectedBlock.content.showSecondary!==false).map((button,i)=><div className="action-editor" key={i}><h3>{i?'Secondary button':'Primary button'}</h3><Field label="Button text" value={button.label} onChange={label=>buttonUpdate(i?'secondary':'primary',{label})}/><Field label="Link / phone / email" value={button.href} onChange={href=>buttonUpdate(i?'secondary':'primary',{href})}/><label className="field"><span>Optional button icon</span><select value={button.icon} onChange={e=>buttonUpdate(i?'secondary':'primary',{icon:e.target.value as IconName})}>{icons.map(icon=><option key={icon}>{icon}</option>)}</select></label></div>)}</>}
      </div><div className="inspector-bottom"><span role="status">{saveError||(dirty?"Saving…":"✓ Saved in this browser")}</span><button onClick={() => { if (window.confirm("Reset this page to its starter content? Other pages and uploaded media will remain."))
            update(sharedMenu({...initial,brand:site.brand,theme:site.theme},site)); }}>Reset page</button></div>
    </aside>}
    {exportPages.length>0&&<div className="export-stage" data-editor-only="true">{exportPages.map(page=><div key={page.id} data-export-page={page.id}><SitePreview site={page.site} pages={exportPages} activeId={page.id} editable={false} selected="" select={()=>{}}/></div>)}</div>}
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
  </main>;
}
