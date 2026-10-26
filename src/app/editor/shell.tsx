"use client";
import {useId,useMemo,useState,type ReactNode} from 'react';
import {ArrowLeft,Building2,ChevronDown,EllipsisVertical,Eye,EyeOff,FileText,FolderClosed,House,Mail,Plus,Search,Wrench} from 'lucide-react';
import {stages} from '../site/catalog';
import {classifyPages, type PageGroup} from './settings';

export type EditorLocation = 'pages' | 'sections' | 'inspector' | 'page-settings' | 'library' | 'create-page' | 'add-section';
export type ShellPage = {id: string; name: string; slug?: string};
export type ShellSection = {id: string; name: string; hidden: boolean; shared: boolean; stage: 0 | 1 | 2 | 3; icon: ReactNode; menu: ReactNode};
export type ShellHomeSite = {blocks:{type:string;content:{items:{pageId?:string}[];catalogPageId?:string}}[];navPageIds?:(string|null)[]};

const SERVICE_PREVIEW = 5;
const groupMeta: Record<PageGroup,{label:string;hint?:string}> = {
  main:{label:'Main pages'},
  service:{label:'Service pages',hint:'Each page describes one service.'},
  other:{label:'Other pages',hint:'Unassigned pages stay here until you link them.'},
};

function pageIcon(page:ShellPage,homeId:string,group:PageGroup) {
  if(page.id===homeId)return <House size={16} strokeWidth={1.75} aria-hidden="true"/>;
  if(group==='service')return <Wrench size={16} strokeWidth={1.75} aria-hidden="true"/>;
  if(/contact/i.test(page.name))return <Mail size={16} strokeWidth={1.75} aria-hidden="true"/>;
  return <FileText size={16} strokeWidth={1.75} aria-hidden="true"/>;
}

function PageMenu({pageId,pageName,onSettings,onReset,isCurrent}:{pageId:string;pageName:string;onSettings:(id:string)=>void;onReset?:()=>void;isCurrent?:boolean}) {
  const [open,setOpen]=useState(false),menuId=useId();
  return <div className="section-actions" data-menu-for={pageId} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
    <button type="button" className="section-more quiet" aria-label={`Actions for ${pageName}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open?menuId:undefined} onClick={e=>{e.stopPropagation();setOpen(v=>!v)}}><EllipsisVertical size={16} strokeWidth={1.75} aria-hidden="true"/></button>
    {open&&<div className="section-action-menu" id={menuId} role="menu" aria-label={`${pageName} actions`} onKeyDown={e=>{
      const items=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')),at=items.indexOf(document.activeElement as HTMLButtonElement);
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}
      if(e.key==='Escape'){e.preventDefault();setOpen(false);(e.currentTarget.parentElement?.querySelector('button') as HTMLButtonElement|null)?.focus();}
    }}>
      <button type="button" role="menuitem" onClick={()=>{setOpen(false);onSettings(pageId);}}>Page settings</button>
      {isCurrent&&onReset&&<button type="button" role="menuitem" className="reset-page" onClick={()=>{setOpen(false);onReset();}}>Reset page</button>}
    </div>}
  </div>;
}

function PageGroupList({group,pages,homeId,pageId,query,expanded,onExpand,onSelectPage,onPageMenu,onReset}:{
  group:PageGroup;pages:ShellPage[];homeId:string;pageId:string;query:string;expanded:boolean;onExpand:()=>void;
  onSelectPage:(id:string)=>void;onPageMenu:(id:string)=>void;onReset?:()=>void;
}) {
  const filtered=pages.filter(page=>page.name.toLowerCase().includes(query.trim().toLowerCase()));
  if(!filtered.length&&query.trim())return null;
  const visible=group==='service'&&!expanded&&!query.trim()?filtered.slice(0,SERVICE_PREVIEW):filtered;
  const hidden=Math.max(0,filtered.length-visible.length);
  const meta=groupMeta[group];
  return <section aria-label={meta.label}>
    <h3 className="section-label">{meta.label}{filtered.length>0&&group!=='main'&&<span className="page-group-count">{filtered.length}</span>}</h3>
    {meta.hint&&<p className="hint page-group-hint">{meta.hint}</p>}
    {!filtered.length&&!query.trim()&&<p className="hint">Nothing in this group yet.</p>}
    {visible.map(page=><div key={page.id} className="navrow" data-page-id={page.id}>
      <button type="button" className="choose" title={page.name} aria-pressed={page.id===pageId} aria-label={page.name} onClick={()=>onSelectPage(page.id)} onKeyDown={event=>{
        if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
        event.preventDefault();
        const rows=Array.from(event.currentTarget.closest('.panelbody')!.querySelectorAll<HTMLButtonElement>('.choose'));
        const at=rows.indexOf(event.currentTarget);
        rows[event.key==='Home'?0:event.key==='End'?rows.length-1:(at+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length]?.focus();
      }}>{pageIcon(page,homeId,group)}<span className="grow">{page.name}</span></button>
      <PageMenu pageId={page.id} pageName={page.name} onSettings={onPageMenu} onReset={onReset} isCurrent={page.id===pageId}/>
    </div>)}
    {hidden>0&&<button type="button" className="quiet wide page-show-more" onClick={onExpand}>Show {hidden} more</button>}
  </section>;
}

function PageSettingsMenu({onOpen,onReset}:{onOpen:()=>void;onReset?:()=>void}) {
  const [open,setOpen]=useState(false),menuId=useId();
  return <div className="section-actions heading-menu" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
    <button type="button" className="quiet" aria-label="Page settings" aria-haspopup="menu" aria-expanded={open} aria-controls={open?menuId:undefined} onClick={()=>setOpen(v=>!v)}><EllipsisVertical size={16} strokeWidth={1.75} aria-hidden="true"/></button>
    {open&&<div className="section-action-menu" id={menuId} role="menu" aria-label="Page settings" onKeyDown={e=>{
      const items=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')),at=items.indexOf(document.activeElement as HTMLButtonElement);
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}
      if(e.key==='Escape'){e.preventDefault();setOpen(false);(e.currentTarget.parentElement?.querySelector('button') as HTMLButtonElement | null)?.focus();}
    }}>
      <button type="button" role="menuitem" onClick={()=>{setOpen(false);onOpen();}}>Page settings</button>
      {onReset&&<button type="button" role="menuitem" className="reset-page" onClick={()=>{setOpen(false);onReset();}}>Reset page</button>}
    </div>}
  </div>;
}

const titles: Record<EditorLocation, string> = {pages:'Pages', sections:'All sections', inspector:'Section', 'page-settings':'Page settings', library:'Media library', 'create-page':'Create page', 'add-section':'Add section'};

export function EditorShell({location,setLocation,view,setView,open,preview,pageName,sectionName,shared,saveLabel,saveError,onReset,pages,pageId,homeId,homeSite,onSelectPage,onPageMenu,sections,sectionId,onSelectSection,onToggleHidden,homeStages,query,setQuery,canAddSection,onAddSection,onPageSettings,onBusiness,onLibrary,sectionMenu,toolbar,canvas,children}:{
  location: EditorLocation; setLocation: (location: EditorLocation) => void; view: 'Content' | 'Appearance'; setView: (view: 'Content' | 'Appearance') => void; open: boolean; preview: boolean;
  pageName: string; sectionName: string; shared: boolean; saveLabel: string; saveError: boolean; onReset: () => void;
  pages: readonly ShellPage[]; pageId: string; homeId: string; homeSite: ShellHomeSite; onSelectPage: (id: string) => void; onPageMenu: (id: string) => void;
  sections: readonly ShellSection[]; sectionId: string; onSelectSection: (id: string) => void; onToggleHidden: (id: string) => void;
  homeStages: boolean; query: string; setQuery: (query: string) => void; canAddSection: boolean; onAddSection: () => void;
  onPageSettings: () => void; onBusiness: () => void; onLibrary: () => void; sectionMenu: ReactNode;
  toolbar: ReactNode; canvas: ReactNode; children: ReactNode;
}) {
  const title = location==='inspector' ? sectionName : titles[location];
  const sectionIndex = Math.max(0, sections.findIndex(section => section.id===sectionId));
  const visible = sections.filter(section => section.name.toLowerCase().includes(query.trim().toLowerCase()));
  const [pageQuery,setPageQuery]=useState('');
  const [servicesExpanded,setServicesExpanded]=useState(false);
  const groups=useMemo(()=>classifyPages([...pages],homeId,homeSite),[pages,homeId,homeSite]);
  return <div id="premium-studio" className={preview?'is-preview':''}>
    {toolbar}
    <div className={`premium-workspace${open?'':' is-collapsed'}`}>
      {!preview && <aside className="panel" aria-label="Website editor">
        <div className="paneltop">
          {(location==='sections'||location==='pages') && <>
            <div className="sidebar-switch" role="tablist" aria-label="Editor view">
              <button type="button" role="tab" className={`switch-tab${location==='pages'?' is-active':''}`} aria-selected={location==='pages'} onClick={()=>setLocation('pages')}>Pages</button>
              <button type="button" role="tab" className={`switch-tab${location==='sections'?' is-active':''}`} aria-selected={location==='sections'} onClick={()=>setLocation('sections')}>Sections</button>
            </div>
            <button type="button" className="sidebar-page-dropdown" onClick={()=>setLocation(location==='pages'?'sections':'pages')} aria-label={`Current page: ${pageName}. Switch page`}>
              <House size={16} strokeWidth={1.75} aria-hidden="true"/>
              <span className="page-dropdown-name">{pageName}</span>
              <ChevronDown size={14} aria-hidden="true"/>
            </button>
          </>}
          {location==='pages' && <div className="panel-heading">
            <h2>Pages</h2>
            <button type="button" className="quiet" aria-label="Create page" disabled={pages.length>=30} onClick={()=>setLocation('create-page')}><Plus size={16} strokeWidth={1.75} aria-hidden="true"/></button>
          </div>}
          {location==='inspector' && <>
            <button type="button" className="all-sections" onClick={()=>setLocation('sections')}><ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true"/>All sections</button>
            <p className="section-index">SECTION {String(sectionIndex+1).padStart(2,'0')}</p>
            <div className="paneltitle">
              <span className="section-title-icon" aria-hidden="true">{sections.find(section=>section.id===sectionId)?.icon}</span>
              <h2>{title}</h2>
              {shared && <span className="shared-badge">Shared</span>}
              <div className="grow"/>
              <button type="button" className="quiet inspector-action-btn" aria-label={`${sections.find(section=>section.id===sectionId)?.hidden?'Show':'Hide'} ${sectionName}`} onClick={()=>onToggleHidden(sectionId)}>{sections.find(section=>section.id===sectionId)?.hidden?<EyeOff size={16} strokeWidth={1.75} aria-hidden="true"/>:<Eye size={16} strokeWidth={1.75} aria-hidden="true"/>}</button>
              {sectionMenu}
            </div>
            {shared && <p className="hint shared-hint">Changes appear on every page.</p>}
            <div className="tabs" role="tablist" aria-label="Inspector view">
              <button type="button" role="tab" aria-selected={view==='Content'} aria-controls="editor-inspector" onClick={()=>setView('Content')}>Content</button>
              <button type="button" role="tab" aria-selected={view==='Appearance'} aria-controls="editor-inspector" onClick={()=>setView('Appearance')}>Style</button>
            </div>
          </>}
          {location==='page-settings' && <>
            <button type="button" className="all-sections" onClick={()=>setLocation('sections')}><ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true"/>All sections</button>
            <div className="paneltitle">
              <h2>{title}</h2>
              <div className="grow"/>
              <PageSettingsMenu onOpen={onPageSettings} onReset={onReset}/>
            </div>
          </>}
          {(location==='create-page'||location==='add-section'||location==='library') && <>
            <button type="button" className="all-sections" onClick={()=>setLocation('sections')}><ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true"/>All sections</button>
            <div className="paneltitle">
              <h2>{title}</h2>
            </div>
          </>}
        </div>
        <div className="panelbody" id="editor-inspector">
          {location==='pages' && <>
            <div className="search-field">
              <Search size={15} strokeWidth={1.75} className="search-icon" aria-hidden="true"/>
              <input className="section-search" aria-label="Find a page" placeholder="Find a page" value={pageQuery} onChange={e=>setPageQuery(e.target.value)}/>
            </div>
            {(['main','service','other'] as PageGroup[]).map(group=>
              <PageGroupList key={group} group={group} pages={groups[group]} homeId={homeId} pageId={pageId} query={pageQuery} expanded={servicesExpanded} onExpand={()=>setServicesExpanded(true)} onSelectPage={onSelectPage} onPageMenu={onPageMenu} onReset={onReset}/>
            )}
            {!Object.values(groups).flat().some(page=>page.name.toLowerCase().includes(pageQuery.trim().toLowerCase()))&&pageQuery.trim()&&<p className="hint">No matching pages.</p>}
            <button type="button" className="wide" disabled={pages.length>=30} onClick={()=>setLocation('create-page')}><Plus aria-hidden="true"/>Create page</button>
            <button type="button" className="quiet wide" onClick={onPageSettings}>Page settings</button>
          </>}
          {location==='sections' && <>
            <div className="search-field">
              <Search size={15} strokeWidth={1.75} className="search-icon" aria-hidden="true"/>
              <input className="section-search" aria-label="Find a section" placeholder="Find a section" value={query} onChange={e=>setQuery(e.target.value)}/>
            </div>
            {stages.map((stage,index)=>{
              const group=visible.filter(section=>section.stage===index);
              if(!homeStages && !group.length) return null;
              return <section key={stage} aria-label={stage}><h3 className="section-label">{stage}</h3>{!group.length&&!query.trim()&&<p className="hint">Nothing in this group on this page.</p>}{group.map(section=><div key={section.id} className={`navrow${section.id===sectionId?' selected':''}`} data-block-id={section.id} data-hidden={section.hidden||undefined}>
                <button type="button" className="choose" title={section.name} aria-pressed={section.id===sectionId} aria-label={`${section.name}${section.hidden?', hidden':''}${section.shared?', shared':''}`} onClick={()=>onSelectSection(section.id)} onKeyDown={event=>{
                  if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
                  event.preventDefault();
                  const rows=Array.from(event.currentTarget.closest('.panelbody')!.querySelectorAll<HTMLButtonElement>('.choose'));
                  const at=rows.indexOf(event.currentTarget);
                  rows[event.key==='Home'?0:event.key==='End'?rows.length-1:(at+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length]?.focus();
                }}>{section.icon}<span className="grow">{section.name}</span>{section.hidden&&<small>Hidden</small>}{section.shared&&<small>Shared</small>}</button>
                <button type="button" className="quiet" aria-label={`${section.hidden?'Show':'Hide'} ${section.name}`} onClick={()=>onToggleHidden(section.id)}>{section.hidden?<EyeOff size={16} strokeWidth={1.75} aria-hidden="true"/>:<Eye size={16} strokeWidth={1.75} aria-hidden="true"/>}</button>
                {section.menu}
              </div>)}</section>;
            })}
            {!visible.length&&<p className="hint">No matching sections.</p>}
            <button type="button" className="wide" disabled={!canAddSection} onClick={onAddSection}><Plus aria-hidden="true"/>Add section</button>
          </>}
          {location!=='pages'&&location!=='sections'&&children}
        </div>
        <footer className="panelbottom">
          <div className="panelbottom-status">
            <span className="save-status" role={saveError?'alert':'status'} data-error={saveError||undefined}><i aria-hidden="true"/>{saveLabel}</span>
          </div>
          <div className="panelbottom-actions">
            <button type="button" className="footer-btn" onClick={onLibrary}><FolderClosed size={16} strokeWidth={1.75} aria-hidden="true"/><span>Media</span></button>
            <button type="button" className="footer-btn" onClick={onBusiness}><Building2 size={16} strokeWidth={1.75} aria-hidden="true"/><span>Business</span></button>
          </div>
        </footer>
      </aside>}
      {canvas}
    </div>
    </div>;
}
