"use client";
import {useId,useState,type ReactNode} from 'react';
import {ArrowLeft,Check,ChevronDown,ChevronRight,EllipsisVertical,Eye,EyeOff,RotateCcw,FileText,House,Plus} from 'lucide-react';
import {stages} from '../site/catalog';

export type EditorLocation = 'pages' | 'sections' | 'inspector' | 'page-settings' | 'business' | 'create-page' | 'add-section';
export type ShellPage = {id: string; name: string; placement: string};
export type ShellSection = {id: string; name: string; hidden: boolean; shared: boolean; stage: 0 | 1 | 2 | 3; icon: ReactNode; menu: ReactNode};
function PageSettingsMenu({onOpen}:{onOpen:()=>void}) {
  const [open,setOpen]=useState(false),menuId=useId();
  return <div className="section-actions heading-menu" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
    <button type="button" className="quiet" aria-label="Page settings" aria-haspopup="menu" aria-expanded={open} aria-controls={open?menuId:undefined} onClick={()=>setOpen(v=>!v)}><EllipsisVertical size={16} strokeWidth={1.75} aria-hidden="true"/></button>
    {open&&<div className="section-action-menu" id={menuId} role="menu" aria-label="Page settings" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();setOpen(false);(e.currentTarget.parentElement?.querySelector('button') as HTMLButtonElement | null)?.focus();}}}>
      <button type="button" role="menuitem" onClick={()=>{setOpen(false);onOpen();}}>Page settings</button>
    </div>}
  </div>;
}
const titles: Record<EditorLocation, string> = {pages:'Pages', sections:'All sections', inspector:'Section', 'page-settings':'Page settings', business:'Business profile', 'create-page':'Create page', 'add-section':'Add section'};

export function EditorShell({location,setLocation,view,setView,open,preview,pageName,sectionName,shared,saveLabel,saveError,onReset,pages,pageId,onSelectPage,sections,sectionId,onSelectSection,onToggleHidden,homeStages,query,setQuery,canAddSection,onAddSection,onPageSettings,onBusiness,sectionMenu,toolbar,canvas,children}:{
  location: EditorLocation; setLocation: (location: EditorLocation) => void; view: 'Content' | 'Appearance'; setView: (view: 'Content' | 'Appearance') => void; open: boolean; preview: boolean;
  pageName: string; sectionName: string; shared: boolean; saveLabel: string; saveError: boolean; onReset: () => void;
  pages: readonly ShellPage[]; pageId: string; onSelectPage: (id: string) => void;
  sections: readonly ShellSection[]; sectionId: string; onSelectSection: (id: string) => void; onToggleHidden: (id: string) => void;
  homeStages: boolean; query: string; setQuery: (query: string) => void; canAddSection: boolean; onAddSection: () => void;
  onPageSettings: () => void; onBusiness: () => void; sectionMenu: ReactNode;
  toolbar: ReactNode; canvas: ReactNode; children: ReactNode;
}) {
  const title = location==='inspector' ? sectionName : titles[location];
  const sectionIndex = Math.max(0, sections.findIndex(section => section.id===sectionId));
  const visible = sections.filter(section => section.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <div id="premium-studio" className={preview?'is-preview':''}>
    {toolbar}
    <div className={`premium-workspace${open?'':' is-collapsed'}`}>
      {!preview && <aside className="panel" aria-label="Website editor" data-refined={sectionName==='Why choose us'||undefined}>
        <div className="paneltop">
          {location==='sections' && <div className="panel-heading">
            <h2>All sections</h2>
            <PageSettingsMenu onOpen={onPageSettings}/>
            <button type="button" className="page-picker" onClick={()=>setLocation('pages')}><span>{pageName}</span><ChevronDown aria-hidden="true"/></button>
          </div>}
          {location!=='sections' && <button type="button" className="all-sections" onClick={()=>setLocation('sections')}><ArrowLeft aria-hidden="true"/>All sections</button>}
          {location==='inspector' && <p className="section-index">Section {String(sectionIndex+1).padStart(2,'0')}</p>}
          {location!=='sections' && <div className="paneltitle">
            <h2>{title}</h2>
            <div className="grow"/>
            {location==='inspector' && <>
              <button type="button" className="quiet" aria-label={`${sections.find(section=>section.id===sectionId)?.hidden?'Show':'Hide'} ${sectionName}`} onClick={()=>onToggleHidden(sectionId)}>{sections.find(section=>section.id===sectionId)?.hidden?<EyeOff aria-hidden="true"/>:<Eye aria-hidden="true"/>}</button>
              {sectionMenu}
            </>}
          </div>}
          {shared && location==='inspector' && <p className="hint">Shared across every page. Changes here show up everywhere.</p>}
          {location==='inspector' && <div className="tabs" role="tablist" aria-label="Inspector view">
            <button type="button" role="tab" aria-selected={view==='Content'} aria-controls="editor-inspector" onClick={()=>setView('Content')}>Content</button>
            <button type="button" role="tab" aria-selected={view==='Appearance'} aria-controls="editor-inspector" onClick={()=>setView('Appearance')}>Style</button>
          </div>}
        </div>
        <div className="panelbody" id="editor-inspector">
          {location==='pages' && <>
            {pages.map(page => <button type="button" className="pagenav" key={page.id} aria-current={page.id===pageId?'page':undefined} onClick={()=>onSelectPage(page.id)}>{page.id===pages[0]?.id?<House aria-hidden="true"/>:<FileText aria-hidden="true"/>}<span className="grow"><b>{page.name}</b><small>{page.placement}</small></span>{page.id===pageId?<Check aria-hidden="true"/>:<ChevronRight aria-hidden="true"/>}</button>)}
            <button type="button" className="wide" disabled={pages.length>=30} onClick={()=>setLocation('create-page')}><Plus aria-hidden="true"/>Create page</button>
            <button type="button" className="quiet wide" onClick={onPageSettings}>Page settings</button>
          </>}
          {location==='sections' && <>
            <input className="section-search" aria-label="Find a section" placeholder="Find a section" value={query} onChange={e=>setQuery(e.target.value)}/>
            {stages.map((stage,index)=>{
              const group=visible.filter(section=>section.stage===index);
              if(!homeStages && !group.length) return null;
              return <section key={stage} aria-label={stage}><h3 className="section-label">{stage}</h3>{!group.length&&!query.trim()&&<p className="hint">Nothing in this group on this page.</p>}{group.map(section=><div key={section.id} className="navrow" data-block-id={section.id} data-hidden={section.hidden||undefined}>
                <button type="button" className="choose" title={section.name} aria-pressed={section.id===sectionId} aria-label={`${section.name}${section.hidden?', hidden':''}${section.shared?', shared':''}`} onClick={()=>onSelectSection(section.id)} onKeyDown={event=>{
                  if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
                  event.preventDefault();
                  const rows=Array.from(event.currentTarget.closest('.panelbody')!.querySelectorAll<HTMLButtonElement>('.choose'));
                  const at=rows.indexOf(event.currentTarget);
                  rows[event.key==='Home'?0:event.key==='End'?rows.length-1:(at+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length]?.focus();
                }}>{section.icon}<span className="grow">{section.name}</span>{section.hidden&&<small>Hidden</small>}{section.shared&&<small>Shared</small>}</button>
                <button type="button" className="quiet" aria-label={`${section.hidden?'Show':'Hide'} ${section.name}`} onClick={()=>onToggleHidden(section.id)}>{section.hidden?<EyeOff aria-hidden="true"/>:<Eye aria-hidden="true"/>}</button>
                {section.menu}
              </div>)}</section>;
            })}
            {!visible.length&&<p className="hint">No matching sections.</p>}
            <button type="button" className="wide" disabled={!canAddSection} onClick={onAddSection}><Plus aria-hidden="true"/>Add section</button>
          </>}
          {location!=='pages'&&location!=='sections'&&children}
        </div>
        <footer className="panelbottom">
          <span className="save-status" role={saveError?'alert':'status'} data-error={saveError||undefined}><i aria-hidden="true"/>{sectionName==='Why choose us'&&saveLabel==='Saved in this browser'?'Saved':saveLabel}</span>
          <div className="grow"/>
          <button type="button" className="quiet" onClick={onBusiness}>Business</button>
          <button type="button" className="quiet reset-page" title="Reset page" aria-label="Reset page" onClick={onReset}>{sectionName==='Why choose us'?<RotateCcw aria-hidden="true"/>:'Reset page'}</button>
        </footer>
      </aside>}
      {canvas}
    </div>
    </div>;
}
