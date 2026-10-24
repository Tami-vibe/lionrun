"use client";
import {catalog,stages,sectionName,SectionId} from '../site/catalog';
import {Block,pageStarters} from '../site/blocks';
import {pageLocation,linkedPage} from './settings';
import {useEffect,useId,useState} from 'react';
import {useMediaLibrary} from '../media/library';
import {PanelsTopLeft,PanelBottom,Files,Sunrise,BadgeCheck,LayoutGrid,Sparkles,Images,ShieldQuestion,Route,CircleCheck,Quote,ClipboardList,CircleHelp,Tag,Mail,CircleArrowRight,EllipsisVertical,Plus,Copy,Trash2,EyeOff,Eye} from 'lucide-react';
const sectionIcons={header:PanelsTopLeft,hero:Sunrise,logos:BadgeCheck,services:LayoutGrid,proof:Sparkles,about:Images,pains:ShieldQuestion,solutions:Route,trust:CircleCheck,reviews:Quote,quote:ClipboardList,faq:CircleHelp,promo:Tag,contact:Mail,closing:CircleArrowRight,footer:PanelBottom};
export type PageEntry<T>={id:string;name:string;slug?:string;site:T};
export type PagePlacement={where:'top'|'bottom'|'under';parent:number;title:string;description:string;kind?:keyof typeof pageStarters};
export function EditorIcon({name}:{name:'layouts'|'pages'|'content'|'design'|'buttons'|'media'|'sun'|'moon'}) {
  const paths={layouts:<><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M10 9v12"/></>,pages:<><path d="M8 3h9l4 4v13H8Z"/><path d="M17 3v5h4M4 7v16h13"/></>,content:<><path d="M4 5h16M12 5v16M8 21h8"/></>,design:<><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></>,buttons:<><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M7 12h10m-3-3 3 3-3 3"/></>,media:<><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m4 18 6-6 4 4 3-3 4 5"/></>,sun:<><circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,moon:<path d="M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13Z"/>};
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
type PreviewSite={nav:string[];navTargets?:string[];navPageIds?:(string|null)[];navChildren?:{label:string;href:string;pageId?:string}[][];footerColumns?:import('./settings').FooterColumn[];seoTitle:string;seoDescription:string;brand:string;headline:string;image:string;theme?:'midnight'|'paper';layout:'split'|'center'|'image'|'short'|'story';blocks?:Block[];heroMedia?:{src:string;poster:string;kind:string}};
function MiniPage({site,layout=(site.blocks?.find(b=>b.type==='hero')?.layout||site.layout) as PreviewSite['layout']}:{site:PreviewSite;layout?:PreviewSite['layout']}){
  const hero=site.blocks?.find(b=>b.type==='hero'),media=hero?.content.media||site.heroMedia;
  const {resolve}=useMediaLibrary(),photo=resolve(media?(media.kind==='image'?media.src:media.poster):site.image);
  return <div className={`mini-page mini-${layout} mini-${site.theme||'midnight'}`} aria-hidden="true"><div className="mini-nav"><b>{site.brand}</b><i/><i/><i/></div><div className="mini-hero"><div className="mini-photo" data-video={media&&media.kind!=='image'?true:undefined} style={{backgroundImage:photo?`url("${photo}")`:undefined}}/><div className="mini-copy"><b>{hero?.content.title||site.headline}</b><span/><em/></div></div><div className="mini-body"><i/><i/><i/></div></div>;
}
export function HeroLayouts({site,change}:{site:PreviewSite;change:(layout:PreviewSite['layout'])=>void}) {
  return <div className="layout-gallery" role="group" aria-label="Hero layout">{([{id:'split',label:'Side by side'},{id:'center',label:'Centered'},{id:'image',label:'Image cover'},{id:'short',label:'Short page header'},{id:'story',label:'Story'}] as const).map(l=><button key={l.id} className="layout-card" aria-pressed={site.layout===l.id} onClick={()=>change(l.id)}><MiniPage site={site} layout={l.id}/><span>{l.label}<i>{site.layout===l.id?'✓':''}</i></span></button>)}</div>;
}
export function Navigation<T extends PreviewSite>({site,pages,activeId,mode,setMode,sections,selected,choose,switchPage,addPage,renamePage,editSEO,placeCurrent,blocks,editBlocks}:{blocks:Block[];editBlocks:(operation:'add'|'duplicate'|'delete'|'visibility',id:string,type?:SectionId)=>void;site:T;pages:PageEntry<T>[];activeId:string;mode:'layouts'|'pages';setMode:(v:'layouts'|'pages')=>void;sections:readonly {id:string;label:string}[];hidden:string[];selected:string;choose:(id:string)=>void;switchPage:(id:string)=>void;addPage:(name:string,placement:PagePlacement)=>void;renamePage:(name:string)=>void;placeCurrent:(where:'top'|'bottom'|'under'|'none',parent:number)=>void;editSEO:(patch:{seoTitle?:string;seoDescription?:string})=>void}){
  const [query,setQuery]=useState(''),[name,setName]=useState(''),[where,setWhere]=useState<PagePlacement['where']>('top'),[parent,setParent]=useState(0),[title,setTitle]=useState<string|null>(null),[description,setDescription]=useState(''),[kind,setKind]=useState<keyof typeof pageStarters>('service'),[addType,setAddType]=useState<SectionId>('services');
  const [openMenu,setOpenMenu]=useState<string|null>(null),[addOpen,setAddOpen]=useState(false),[addAnchor,setAddAnchor]=useState<string|null>(null);
  const menuId=useId(),keyFor=(id:string)=>`${activeId}:${id}`;
  useEffect(()=>{
    if(!openMenu)return;
    const menu=document.getElementById(menuId);
    menu?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    menu?.scrollIntoView({block:'nearest'});
    const close=(event:PointerEvent)=>{if(!(event.target as Element).closest('.section-actions'))setOpenMenu(null);};
    document.addEventListener('pointerdown',close);
    return()=>document.removeEventListener('pointerdown',close);
  },[openMenu,menuId]);
  function applyAction(operation:'add'|'duplicate'|'delete'|'visibility',id:string) {
    setOpenMenu(null);
    editBlocks(operation,id,operation==='add'?addType:undefined);
    requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(operation==='visibility'?`.section-row-tools[data-block-id="${CSS.escape(id)}"] .section-more`:'.builder-sidebar .section-row[aria-pressed=true]')?.focus());
  }
  const current=pages.find(p=>p.id===activeId)!,location=pageLocation(site,current),menuNames=site.nav.map((label,i)=>linkedPage(pages,site.navTargets?.[i]||'',site.navPageIds?.[i])?.name||label);
  return <aside className="builder-sidebar"><div className="sidebar-heading"><span className="sidebar-overline">YOUR WEBSITE</span><strong>{site.brand}</strong><span className="local-tag">Local draft</span></div>
    <div className="navigation-tabs" role="group" aria-label="Browse website"><button aria-pressed={mode==='layouts'} onClick={()=>setMode('layouts')}><PanelsTopLeft size={20} strokeWidth={1.7} aria-hidden="true"/>Sections</button><button aria-pressed={mode==='pages'} onClick={()=>setMode('pages')}><Files size={20} strokeWidth={1.7} aria-hidden="true"/>Pages <small>{pages.length}</small></button></div>
    <div className="navigation-scroll">{mode==='layouts'?<><div className="panel-caption"><strong>Your page</strong></div><input className="section-search" aria-label="Find a section" placeholder="Find a section…" value={query} onChange={e=>setQuery(e.target.value)}/>
      <button className="sidebar-add-section" aria-expanded={addOpen} aria-controls={`${menuId}-add`} disabled={blocks.length>=80} onClick={()=>{setAddAnchor(selected);setAddOpen(v=>!v);}}><Plus size={20} strokeWidth={1.7} aria-hidden="true"/>Add section</button>
      {addOpen&&<div className="section-add-picker" id={`${menuId}-add`}><label className="field"><span>Section to add</span><select aria-label="Section to add" value={addType} onChange={e=>setAddType(e.target.value as SectionId)}>{catalog.filter(s=>!['header','footer'].includes(s.id)||!blocks.some(b=>b.type===s.id)).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><p>New sections stay in the page’s fixed order.</p><button className="add-service" disabled={blocks.length>=80} onClick={()=>{applyAction('add',addAnchor||selected);setAddOpen(false);}}>Add to page</button></div>}
      <div className="section-list-rows">{stages.map((stage,stageIndex)=>{
        const group=blocks.filter(b=>catalog.find(s=>s.id===b.type)!.stage===stageIndex&&sectionName(b.type).toLowerCase().includes(query.toLowerCase()));
        return <section className="section-stage" key={stage} aria-labelledby={`${menuId}-stage-${stageIndex}`}><h3 id={`${menuId}-stage-${stageIndex}`}>{stage}</h3>{group.map(b=>{
          const i=blocks.findIndex(v=>v.id===b.id),entry=catalog.find(s=>s.id===b.type)!,name=entry.label,isOpen=openMenu===keyFor(b.id),SectionIcon=sectionIcons[b.type];
          return <div key={b.id} className="section-row-tools" data-block-id={b.id} data-hidden={b.hidden||undefined}>
            <button className="section-row" aria-label={`${name}${b.hidden?', Hidden':''}`} aria-pressed={selected===b.id} aria-describedby={selected===b.id?`${menuId}-purpose-${i}`:undefined} onClick={()=>choose(b.id)} onKeyDown={e=>{
              if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();const rows=Array.from(e.currentTarget.closest('.section-list-rows')!.querySelectorAll<HTMLButtonElement>('.section-row')),index=rows.indexOf(e.currentTarget);rows[e.key==='Home'?0:e.key==='End'?rows.length-1:(index+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length]?.focus();}
            }}><SectionIcon size={20} strokeWidth={1.7} aria-hidden="true"/><span className="section-row-label">{name}{selected===b.id&&<small id={`${menuId}-purpose-${i}`}>{entry.detail}</small>}{b.hidden&&<span className="section-hidden-label">Hidden</span>}</span></button>
            <div className="section-actions" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpenMenu(null);}}>
              <button className="section-more" aria-label={`Actions for ${name}, section ${i+1}`} aria-haspopup="menu" aria-expanded={isOpen} aria-controls={isOpen?menuId:undefined} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpenMenu(keyFor(b.id));}}} onClick={()=>setOpenMenu(isOpen?null:keyFor(b.id))}><EllipsisVertical size={20} strokeWidth={1.7} aria-hidden="true"/></button>
              {isOpen&&<div className="section-action-menu" id={menuId} role="menu" aria-label={`${name} actions`} onKeyDown={e=>{
                const items=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')),index=items.indexOf(document.activeElement as HTMLButtonElement);
                if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}
                if(e.key==='Escape'||e.key==='Tab'){if(e.key==='Escape')e.preventDefault();setOpenMenu(null);e.currentTarget.parentElement?.querySelector<HTMLButtonElement>('.section-more')?.focus();}
              }}>
                <button role="menuitem" tabIndex={-1} onClick={()=>applyAction('visibility',b.id)}>{b.hidden?<Eye size={20} strokeWidth={1.7} aria-hidden="true"/>:<EyeOff size={20} strokeWidth={1.7} aria-hidden="true"/>}<span>{b.hidden?'Show section':'Hide section'}</span></button>
                <button role="menuitem" tabIndex={-1} disabled={blocks.length>=80} onClick={()=>{setOpenMenu(null);setAddAnchor(b.id);setAddOpen(true);requestAnimationFrame(()=>document.getElementById(`${menuId}-add`)?.querySelector('select')?.focus());}}><Plus size={20} strokeWidth={1.7} aria-hidden="true"/><span>Add section</span></button>
                <button role="menuitem" tabIndex={-1} disabled={b.type==='header'||b.type==='footer'||blocks.length>=80} title={b.type==='header'||b.type==='footer'?'Shared sections cannot be duplicated':undefined} onClick={()=>applyAction('duplicate',b.id)}><Copy size={20} strokeWidth={1.7} aria-hidden="true"/><span>Duplicate</span></button>
                <button role="menuitem" tabIndex={-1} className="section-delete" onClick={()=>applyAction('delete',b.id)}><Trash2 size={20} strokeWidth={1.7} aria-hidden="true"/><span>Delete</span></button>
              </div>}
            </div>
          </div>;
        })}</section>;
      })}</div>{!sections.some(s=>s.label.toLowerCase().includes(query.toLowerCase()))&&<p className="panel-caption">No matching sections.</p>}</>:<><div className="panel-caption"><strong>Your pages</strong><p>Choose a page to edit or preview it.</p></div>{pages.map(p=><button key={p.id} className="page-card" data-page-id={p.id} aria-pressed={p.id===activeId} onClick={()=>switchPage(p.id)}><MiniPage site={p.id===activeId?site:p.site}/><span><Files size={20} strokeWidth={1.7} aria-hidden="true"/><strong>{p.name}</strong><small>{p.id===activeId?'Editing':'Open'}</small></span></button>)}
      <label className="field"><span>Current page name</span><input maxLength={60} value={pages.find(p=>p.id===activeId)?.name||''} onChange={e=>renamePage(e.target.value)}/></label>
      <label className="field"><span>Where should people find this page?</span><select aria-label="Current page placement" value={location.where} onChange={e=>placeCurrent(e.target.value as typeof location.where,location.parent)}><option value="none">Not in a menu</option><option value="top" disabled={location.where!=='top'&&site.nav.length>=5}>Top menu</option><option value="bottom">Bottom menu</option><option value="under" disabled={!site.nav.length||site.nav.length===1&&location.where==='top'}>Under a menu button</option></select></label>
      {location.where==='under'&&<label className="field"><span>Under which menu button?</span><select aria-label="Current parent menu button" value={location.parent} onChange={e=>placeCurrent('under',Number(e.target.value))}>{menuNames.map((label,i)=><option key={i} value={i}>{label}</option>)}</select></label>}
      {location.where!=='top'&&site.nav.length>=5&&<small>The top menu has five links. Remove a link to make room.</small>}
      <small>Page address: /{pages.find(p=>p.id===activeId)?.slug||'home'}</small>
      <label className="field"><span>Name in Google</span><input maxLength={120} value={site.seoTitle} onChange={e=>editSEO({seoTitle:e.target.value})}/></label>
      <label className="field"><span>One sentence for Google</span><textarea maxLength={320} value={site.seoDescription} onChange={e=>editSEO({seoDescription:e.target.value})}/></label>
      <form className="new-page" onSubmit={e=>{e.preventDefault();if(name.trim()){addPage(name.trim(),{where,parent:Math.min(parent,Math.max(0,site.nav.length-1)),title:title??`${name.trim()} | ${site.brand}`,description,kind});setName('');setTitle(null);setDescription('');}}}>
        <label className="field"><span>What kind of page?</span><select aria-label="What kind of page?" value={kind} onChange={e=>setKind(e.target.value as keyof typeof pageStarters)}><option value="service">Service page</option><option value="offer">Offer page</option><option value="story">Story page</option><option value="empty">Empty page</option></select></label><label className="field"><span>Add a page</span><input required maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. About us"/></label>
        <label className="field"><span>Where should people find this page?</span><select value={where} onChange={e=>setWhere(e.target.value as PagePlacement['where'])}><option value="top">Top menu</option><option value="bottom">Bottom menu</option><option value="under">Under a menu button</option></select></label>
        {where==='under'&&(site.nav.length?<label className="field"><span>Under which menu button?</span><select value={Math.min(parent,site.nav.length-1)} onChange={e=>setParent(Number(e.target.value))}>{menuNames.map((label,i)=><option key={i} value={i}>{label}</option>)}</select></label>:<p>No menu buttons yet. Choose Top menu instead; we will put this page there.</p>)}
        {where==='top'&&site.nav.length>=5&&<p>The top menu has five links. This page will go in the Bottom menu.</p>}
        <label className="field"><span>Name in Google</span><input maxLength={120} value={title??(name?`${name} | ${site.brand}`:'')} onChange={e=>setTitle(e.target.value)}/></label>
        <label className="field"><span>One sentence for Google</span><textarea maxLength={320} placeholder="Example: Meet our team and learn how we can help." value={description} onChange={e=>setDescription(e.target.value)}/></label>
        <button disabled={pages.length>=30} type="submit">＋ Create page</button><p>Up to 30 pages. A service card creates its page automatically. Rename any page here.</p>
      </form></>}

    </div><div className="navigation-help"><CircleHelp size={20} strokeWidth={1.7} aria-hidden="true"/><span>1. Choose a section. 2. Edit its settings on the right.</span></div></aside>;
}
