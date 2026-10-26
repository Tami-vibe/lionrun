"use client";
import {catalog,SectionId} from '../site/catalog';
import {Block,pageStarters} from '../site/blocks';
import {pageLocation,linkedPage} from './settings';
import {useEffect,useId,useState} from 'react';
import {useMediaLibrary} from '../media/library';
import {PanelsTopLeft,PanelBottom,Sunrise,BadgeCheck,LayoutGrid,Sparkles,Images,ShieldQuestion,Route,CircleCheck,Quote,ClipboardList,CircleHelp,Tag,Mail,CircleArrowRight,EllipsisVertical,Plus,Copy,Trash2,EyeOff,Eye} from 'lucide-react';
export const sectionIcons={header:PanelsTopLeft,hero:Sunrise,logos:BadgeCheck,services:LayoutGrid,proof:Sparkles,about:Images,pains:ShieldQuestion,solutions:Route,trust:CircleCheck,reviews:Quote,quote:ClipboardList,faq:CircleHelp,promo:Tag,contact:Mail,closing:CircleArrowRight,footer:PanelBottom};
export type PageEntry<T>={id:string;name:string;slug?:string;site:T};
export type PagePlacement={where:'top'|'bottom'|'under';parent:number;title:string;description:string;kind?:keyof typeof pageStarters};
type PreviewSite={nav:string[];navTargets?:string[];navPageIds?:(string|null)[];navChildren?:{label:string;href:string;pageId?:string}[][];footerColumns?:import('./settings').FooterColumn[];seoTitle:string;seoDescription:string;brand:string;headline:string;image:string;theme?:'midnight'|'paper';eyebrowStyle?:'pill'|'line';accent?:string;layout:'split'|'center'|'image'|'short'|'story';blocks?:Block[];heroMedia?:{src:string;poster:string;kind:string}};
function MiniPage({site,layout=(site.blocks?.find(b=>b.type==='hero')?.layout||site.layout) as PreviewSite['layout']}:{site:PreviewSite;layout?:PreviewSite['layout']}){
  const hero=site.blocks?.find(b=>b.type==='hero'),media=hero?.content.media||site.heroMedia;
  const {resolve}=useMediaLibrary(),photo=resolve(media?(media.kind==='image'?media.src:media.poster):site.image);
  return <div className={`mini-page mini-${layout} mini-${site.theme==="midnight"?"midnight":"paper"}`} aria-hidden="true"><div className="mini-nav"><b>{site.brand}</b><i/><i/><i/></div><div className="mini-hero"><div className="mini-photo" data-video={media&&media.kind!=='image'?true:undefined} style={{backgroundImage:photo?`url("${photo}")`:undefined}}/><div className="mini-copy"><b>{hero?.content.title||site.headline}</b><span/><em/></div></div><div className="mini-body"><i/><i/><i/></div></div>;
}
export function HeroLayouts({site,change}:{site:PreviewSite;change:(layout:PreviewSite['layout'])=>void}) {
  return <div className="layout-gallery" role="group" aria-label="Hero layout">{([{id:'split',label:'Side by side'},{id:'center',label:'Centered'},{id:'image',label:'Image cover'},{id:'short',label:'Short page header'},{id:'story',label:'Story'}] as const).map(l=><button type="button" key={l.id} className="layout-card" aria-pressed={site.layout===l.id} onClick={()=>change(l.id)}><MiniPage site={site} layout={l.id}/><span>{l.label}</span></button>)}</div>;
}
export function SectionMenu({block,index,blocks,editBlocks,onAdd}:{block:Block;index:number;blocks:Block[];editBlocks:(operation:'add'|'duplicate'|'delete'|'visibility',id:string,type?:SectionId)=>void;onAdd:(anchorId:string)=>void}) {
  const [open,setOpen]=useState(false),menuId=useId(),name=catalog.find(s=>s.id===block.type)!.label;
  useEffect(()=>{
    if(!open)return;
    const menu=document.getElementById(menuId);
    menu?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const close=(event:PointerEvent)=>{if(!(event.target as Element).closest(`[data-menu-for="${CSS.escape(block.id)}"]`))setOpen(false);};
    document.addEventListener('pointerdown',close);
    return()=>document.removeEventListener('pointerdown',close);
  },[open,menuId,block.id]);
  function apply(operation:'duplicate'|'delete'|'visibility') {
    setOpen(false);
    editBlocks(operation,block.id);
    requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(operation==='visibility'?`.navrow[data-block-id="${CSS.escape(block.id)}"] .section-more`:'#premium-studio .all-sections, #premium-studio .panelbody button')?.focus());
  }
  return <div className="section-actions" data-menu-for={block.id} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
    <button type="button" className="section-more quiet" aria-label={`Actions for ${name}, section ${index+1}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open?menuId:undefined} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);}}} onClick={()=>setOpen(v=>!v)}><EllipsisVertical size={16} strokeWidth={1.75} aria-hidden="true"/></button>
    {open&&<div className="section-action-menu" id={menuId} role="menu" aria-label={`${name} actions`} onKeyDown={e=>{
      const items=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')),at=items.indexOf(document.activeElement as HTMLButtonElement);
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}
      if(e.key==='Escape'||e.key==='Tab'){if(e.key==='Escape')e.preventDefault();setOpen(false);e.currentTarget.parentElement?.querySelector<HTMLButtonElement>('.section-more')?.focus();}
    }}>
      <button type="button" role="menuitem" tabIndex={-1} onClick={()=>apply('visibility')}>{block.hidden?<Eye size={16} strokeWidth={1.75} aria-hidden="true"/>:<EyeOff size={16} strokeWidth={1.75} aria-hidden="true"/>}<span>{block.hidden?'Show section':'Hide section'}</span></button>
      <button type="button" role="menuitem" tabIndex={-1} disabled={blocks.length>=80} onClick={()=>{setOpen(false);onAdd(block.id);}}><Plus size={16} strokeWidth={1.75} aria-hidden="true"/><span>Add section</span></button>
      <button type="button" role="menuitem" tabIndex={-1} disabled={block.type==='header'||block.type==='footer'||blocks.length>=80} title={block.type==='header'||block.type==='footer'?'Shared sections cannot be duplicated':undefined} onClick={()=>apply('duplicate')}><Copy size={16} strokeWidth={1.75} aria-hidden="true"/><span>Duplicate</span></button>
      <button type="button" role="menuitem" tabIndex={-1} className="section-delete" onClick={()=>apply('delete')}><Trash2 size={16} strokeWidth={1.75} aria-hidden="true"/><span>Delete</span></button>
    </div>}
  </div>;
}
export function PageSettings<T extends PreviewSite>({site,pages,activeId,homeId,renamePage,setSlug,placeCurrent,editSEO,setBreadcrumbs,onEditService,home}:{
  site:T;pages:PageEntry<T>[];activeId:string;homeId:string;renamePage:(name:string)=>void;setSlug:(slug:string)=>void;
  placeCurrent:(where:'top'|'bottom'|'under'|'none',parent:number)=>void;editSEO:(patch:{seoTitle?:string;seoDescription?:string})=>void;
  setBreadcrumbs:(show:boolean)=>void;onEditService?:()=>void;home:boolean;
}) {
  const [tab,setTab]=useState<'page'|'navigation'|'seo'>('page');
  const [crumbsOpen,setCrumbsOpen]=useState(true);
  const current=pages.find(p=>p.id===activeId)!,location=pageLocation(site,current),menuNames=site.nav.map((label,i)=>linkedPage(pages,site.navTargets?.[i]||'',site.navPageIds?.[i])?.name||label);
  const homePage=pages.find(p=>p.id===homeId);
  const services=homePage?.site.blocks?.find(b=>b.type==='services');
  const linkedService=services?.content.items.find(item=>item.pageId===activeId);
  const catalog=pages.find(p=>p.id===services?.content.catalogPageId);
  const onService=!!linkedService,onCatalog=catalog?.id===activeId;
  const hero=site.blocks?.find(b=>b.type==='hero');
  const showCrumbs=hero?.content.showBreadcrumbs!==false;
  const parentName=catalog?.name||'Services';
  const slugValue=current.slug||'home';
  return <>
    {!home&&<p className="helper-text">Menu and website brand come from Home. Name, address, and SEO below are for this page only.</p>}
    <div className="tabs" role="tablist" aria-label="Page settings">
      <button type="button" role="tab" aria-selected={tab==='page'} onClick={()=>setTab('page')}>Page</button>
      <button type="button" role="tab" aria-selected={tab==='navigation'} onClick={()=>setTab('navigation')}>Navigation</button>
      <button type="button" role="tab" aria-selected={tab==='seo'} onClick={()=>setTab('seo')}>SEO</button>
    </div>
    {tab==='page'&&<>
      <label className="field"><span>Page name</span><input maxLength={60} value={current.name} onChange={e=>renamePage(e.target.value)}/></label>
      <label className="field"><span>Page address</span>
        <span className="page-address"><span className="page-address-prefix">/</span>
          <input aria-label="Page address slug" maxLength={48} value={slugValue} disabled={home} onChange={e=>setSlug(e.target.value)}/>
        </span>
      </label>
      {linkedService&&<div className="linked-service">
        <span>Linked service</span>
        <strong>{linkedService.title||current.name}</strong>
        {onEditService&&<button type="button" className="quiet" onClick={onEditService}>Edit service</button>}
      </div>}
      {(onService||onCatalog)&&<div className="accordion" data-open={crumbsOpen||undefined}>
        <button type="button" className="accordion-toggle" aria-expanded={crumbsOpen} onClick={()=>setCrumbsOpen(v=>!v)}><b>Breadcrumbs</b></button>
        {crumbsOpen&&<div className="accordion-panel">
          <label className="choice-row"><span>Show breadcrumbs</span>
            <button type="button" role="switch" aria-checked={showCrumbs} className={showCrumbs?'choice-active':''} onClick={()=>setBreadcrumbs(!showCrumbs)}>{showCrumbs?'On':'Off'}</button>
          </label>
          {showCrumbs&&<p className="breadcrumb-preview" aria-hidden="true">Home{onService?` › ${parentName}`:''} › {current.name}</p>}
          {onService&&<p className="hint">Parent page: {parentName}</p>}
        </div>}
      </div>}
    </>}
    {tab==='navigation'&&<>
      <p className="hint">Choose whether this page appears in your menu.</p>
      <label className="field"><span>Menu placement</span><select aria-label="Current page placement" value={location.where} onChange={e=>placeCurrent(e.target.value as typeof location.where,location.parent)}><option value="none">Not in a menu</option><option value="top" disabled={location.where!=='top'&&site.nav.length>=5}>Top menu</option><option value="bottom">Bottom menu</option><option value="under" disabled={!site.nav.length||site.nav.length===1&&location.where==='top'}>Under a menu button</option></select></label>
      {location.where==='under'&&<label className="field"><span>Under which menu button?</span><select aria-label="Current parent menu button" value={location.parent} onChange={e=>placeCurrent('under',Number(e.target.value))}>{menuNames.map((label,i)=><option key={i} value={i}>{label}</option>)}</select></label>}
      {location.where!=='top'&&site.nav.length>=5&&<p className="hint">The top menu has five links. Remove a link to make room.</p>}
    </>}
    {tab==='seo'&&<>
      <label className="field"><span>Name in Google</span><input maxLength={120} value={site.seoTitle} onChange={e=>editSEO({seoTitle:e.target.value})}/></label>
      <label className="field"><span>One sentence for Google</span><textarea maxLength={320} value={site.seoDescription} onChange={e=>editSEO({seoDescription:e.target.value})}/></label>
    </>}
  </>;
}
export function CreatePageForm({site,pages,disabled,addPage}:{site:PreviewSite;pages:PageEntry<PreviewSite>[];disabled:boolean;addPage:(name:string,placement:PagePlacement)=>void}) {
  const [name,setName]=useState(''),[where,setWhere]=useState<PagePlacement['where']>('top'),[parent,setParent]=useState(0),[title,setTitle]=useState<string|null>(null),[description,setDescription]=useState(''),[kind,setKind]=useState<keyof typeof pageStarters>('service');
  const menuNames=site.nav.map((label,i)=>linkedPage(pages,site.navTargets?.[i]||'',site.navPageIds?.[i])?.name||label);
  return <form className="new-page" onSubmit={e=>{e.preventDefault();if(!name.trim()||disabled)return;addPage(name.trim(),{where,parent:Math.min(parent,Math.max(0,site.nav.length-1)),title:title??`${name.trim()} | ${site.brand}`,description,kind});setName('');setTitle(null);setDescription('');}}>
    <label className="field"><span>What kind of page?</span><select aria-label="What kind of page?" value={kind} onChange={e=>setKind(e.target.value as keyof typeof pageStarters)}><option value="service">Service page</option><option value="offer">Offer page</option><option value="story">Story page</option><option value="empty">Empty page</option></select></label>
    <label className="field"><span>Page name</span><input required maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. About us"/></label>
    <label className="field"><span>Where should people find this page?</span><select value={where} onChange={e=>setWhere(e.target.value as PagePlacement['where'])}><option value="top">Top menu</option><option value="bottom">Bottom menu</option><option value="under">Under a menu button</option></select></label>
    {where==='under'&&(site.nav.length?<label className="field"><span>Under which menu button?</span><select value={Math.min(parent,site.nav.length-1)} onChange={e=>setParent(Number(e.target.value))}>{menuNames.map((label,i)=><option key={i} value={i}>{label}</option>)}</select></label>:<p className="hint">No menu buttons yet. Choose Top menu instead; this page will go there.</p>)}
    {where==='top'&&site.nav.length>=5&&<p className="hint">The top menu has five links. This page will go in the Bottom menu.</p>}
    <label className="field"><span>Name in Google</span><input maxLength={120} value={title??(name?`${name} | ${site.brand}`:'')} onChange={e=>setTitle(e.target.value)}/></label>
    <label className="field"><span>One sentence for Google</span><textarea maxLength={320} placeholder="Example: Meet the team and see how the work gets done." value={description} onChange={e=>setDescription(e.target.value)}/></label>
    <button className="wide" disabled={disabled} type="submit"><Plus aria-hidden="true"/>Create page</button>
    <p className="hint">Up to 30 pages. A service card can create its page. Rename any page in Page settings.</p>
  </form>;
}
export function AddSectionForm({blocks,onAdd}:{blocks:Block[];onAdd:(type:SectionId)=>void}) {
  const [addType,setAddType]=useState<SectionId>('services');
  return <div className="section-add-picker"><label className="field"><span>Section to add</span><select aria-label="Section to add" value={addType} onChange={e=>setAddType(e.target.value as SectionId)}>{catalog.filter(s=>!['header','footer'].includes(s.id)||!blocks.some(b=>b.type===s.id)).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><p className="hint">New sections stay in the page’s fixed order.</p><button type="button" className="wide" disabled={blocks.length>=80} onClick={()=>onAdd(addType)}>Add to page</button></div>;
}
