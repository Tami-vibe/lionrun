"use client";
import {Fragment, useEffect, useRef, useState} from "react";
import type {PageEntry} from "../editor/navigation";
import {accentRamp, linkedPage, normalizeSettings, sectionVariables, type SectionSettings} from "../editor/settings";
import {fixedBlockOrder, type Block, type Site} from "../site/blocks";
import {MediaView} from "../media/library";
import {safeHref} from "./safe-href";
import {sectionComponents} from "./sections";
import {editorSticky, framePieces, type EditorScope} from "../editor/scope";
export function SitePreview({ site, select, selected, editable, changeSettings, pages, activeId, selectPage, region = "live" }: {
    site: Site;
    select: (id: string) => void;
    selected: string;
    editable: boolean;
    changeSettings?:(id:string,s:SectionSettings)=>void;
    pages:PageEntry<Site>[];
    activeId:string;
    selectPage?:(id:string,hash?:string)=>void;
    region?: EditorScope;
}) {
    const homeId=pages.find(p=>p.id==="home")?.id||pages[0].id;
    const menuHome=activeId===homeId?site:pages.find(p=>p.id===homeId)!.site,menuTheme=menuHome.theme==='midnight'?'theme-midnight':'shared-paper';
    const rootRef=useRef<HTMLDivElement>(null),[section,setSection]=useState('#top');
    useEffect(()=>{const root=rootRef.current;if(!root)return;const scrollRoot=root.closest('.canvas-area'),menu=root.querySelector<HTMLElement>('.menu-frame'),size=new ResizeObserver(()=>{if(!menu)return;const next=`${menu.offsetHeight}px`;if(root.style.getPropertyValue('--actual-menu-space')!==next)root.style.setProperty('--actual-menu-space',next);});if(menu)size.observe(menu);let frame=0;
      const track=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const edge=(scrollRoot?.getBoundingClientRect().top||0)+(root.querySelector('.menu-frame')?.getBoundingClientRect().height||0)+40;const visible=Array.from(root.querySelectorAll<HTMLElement>('section[id]')).filter(el=>el.getBoundingClientRect().top<=edge);const hash='#'+(visible.at(-1)?.id||'top');setSection(current=>current===hash?current:hash);});};
      (scrollRoot||window).addEventListener('scroll',track,{passive:true});track();return()=>{size.disconnect();cancelAnimationFrame(frame);(scrollRoot||window).removeEventListener('scroll',track);};
    },[activeId,site.headerSticky,site.headerStyle]);
    const pageFor=(href:string,id?:string|null)=>linkedPage(pages,href,id);
    const labelFor=(label:string,href:string,id?:string|null)=>pageFor(href,id)?.name||label;
    const menuLink=(href:string,id?:string|null,scope=homeId)=>{const page=pageFor(href,id),hash=href.startsWith('#')?href:'',targetId=page?.id||(hash?scope:undefined),current=page?page.id===activeId:activeId===scope&&href===section;return {href:page?`?preview=1&page=${encodeURIComponent(page.id)}`:hash&&activeId!==targetId?`?preview=1&page=${encodeURIComponent(targetId!)}${hash}`:safeHref(href),'data-link-page':targetId,'data-link-hash':hash||undefined,'aria-current':current?'page' as const:undefined,'data-current-page':page?.id===activeId?true:undefined,'data-site-href':page?.id===activeId?'#top':hash&&activeId!==homeId?`/${hash}`:safeHref(href),onClick:(e:React.MouseEvent<HTMLAnchorElement>)=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.currentTarget.closest('details')?.removeAttribute('open');if(targetId){e.preventDefault();e.stopPropagation();selectPage?.(targetId,hash);}else if(editable)e.preventDefault();}};};
    const parentIndex=site.navChildren?.findIndex(rows=>rows.some(l=>pageFor(l.href,l.pageId)?.id===activeId))??-1;
    const blocks=fixedBlockOrder(site.blocks),pieces=framePieces(blocks,region);
    const classFor=(b:Block)=>b.type==='header'?`site-menu ${menuTheme}`:b.type==='footer'?`site-footer ${menuTheme} ${site.footerStyle==='minimal'?'footer-minimal':''}`:b.type==='hero'?`hero hero-${b.layout} text-${b.content.align||'left'}`:'site-block';
    return <div ref={rootRef} data-editor-region={region==="live"?undefined:region} className={`site-preview theme-${site.theme==="midnight"?"midnight":"paper"}`} style={{'--menu-links':site.nav.length,'--menu-extra':(site.headerButtonCount??1)>0?1:0,'--accent':site.accent,...Object.fromEntries(Object.entries(accentRamp(site.accent)).map(([key,value])=>[`--accent-${key}`,value])),'--hero-ratio':blocks.find(b=>b.type==='hero')?.content.media.ratio||'16/9'} as React.CSSProperties}>
      {pieces.map(({block, context})=>{const Component=sectionComponents[block.type],Tag=block.type==='header'?'header':block.type==='footer'?'footer':'section',settings=block.settings;
        return <Fragment key={block.id}><Tag id={block.type==='hero'&&blocks.find(b=>b.type==='hero')?.id===block.id?'top':blocks.find(b=>b.type===block.type)?.id===block.id?block.type:block.id} data-section={block.id} data-block-type={block.type} data-layout={block.layout} data-height={block.content.height} data-align={block.content.align} data-custom-padding={settings.padding!==undefined||undefined} {...Object.fromEntries((['heading','body'] as const).flatMap(target=>Object.entries(normalizeSettings(settings)[target]!).filter(([,v])=>v!==undefined).map(([key])=>[`data-${target}-${key.toLowerCase()}`,true])))} style={{...sectionVariables(settings),...(block.type==='header'||block.type==='footer'?{'--accent':menuHome.accent}:{})} as React.CSSProperties} className={`${editable&&!context?'editable-section':''} ${editable&&!context&&selected===block.id?'selected-section':''} ${context?'editor-context':''} ${classFor(block)}`} inert={context||undefined} data-sticky={block.type==='header'&&editorSticky(region,!!site.headerSticky)||undefined} data-overlay={block.type==='header'&&site.headerOverlay&&blocks.some(b=>b.type==='hero'&&!b.hidden)||undefined} data-background={block.type==='header'?site.headerBackground!==false:undefined} onClick={editable&&!context?e=>{if((e.target as HTMLElement).closest('[data-editor-only]'))return;if((e.target as HTMLElement).closest('a'))e.preventDefault();select(block.id);}:undefined}>
          {block.content.media.src&&["services","pains","solutions","trust","reviews","faq","closing"].includes(block.type)&&!(block.type==='trust'&&block.layout==='Signals')&&<MediaView value={block.content.media} editable={editable}/>}<Component block={block} site={site} editable={editable} selected={selected===block.id} change={value=>changeSettings?.(block.id,value)} link={(href,id)=>menuLink(href,id,href.startsWith('#')&&!['header','footer'].includes(block.type)&&blocks.some(b=>!b.hidden&&(href==='#top'?b.type==='hero':`#${b.type}`===href))?activeId:homeId)} labelFor={labelFor} pages={pages} homeId={homeId} activeId={activeId} parentIndex={parentIndex}/>
        </Tag></Fragment>;
      })}
    </div>;
}
