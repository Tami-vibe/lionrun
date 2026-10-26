"use client";
import {flushSync} from "react-dom";
import {ChevronDown,Download,Ellipsis,Eye,Monitor,Moon,Redo2,Settings,Smartphone,Sun,Tablet,Undo2} from "lucide-react";
import {ManageLibraryProvider, MediaProvider} from "./media/library";
import {MediaLibraryBoard} from "./media/library-board";
import {collectMediaUsage} from "./media/usage";
import {PageEntry,PagePlacement,PageSettings,CreatePageForm,AddSectionForm,SectionMenu,sectionIcons} from "./editor/navigation";
import {SettingsDialog, type BusinessDetails, type ProfileDetails, type SettingsPane} from "./editor/account";
import type {BrandSitePatch} from "./editor/brand-settings";
import {displayZoom,frameSize,previewZooms,regionForBlock,selectionForRegion,type EditorRegion} from "./editor/scope";
import {activePage,autosavedPages,legacySite,legacyWorkspaceKey,loadableWorkspace,mergedPages,pageSnapshot,retainFailedWorkspace,sharedMenu,storedPages,syncableWorkspace,upgradeSchema2,workspaceKey,writeWorkspace} from "./editor/workspace";
import {EditScope,EditScopeApi,EditScopeContext} from "./editor/fields";
import {contentGroups} from "./editor/content-browser";
import {HeroFocus,HeroFocusProvider} from "./editor/hero-focus";
import {EditorShell,EditorLocation} from "./editor/shell";
import {PreviewFrame} from "./editor/preview-frame";
import {SectionEditor} from "./editor/section-editor";
import {SectionSettings,FooterColumn,pageSlug,headerLook,bindMenu,linkedPage,pageLocation,placePage} from "./editor/settings";
import {Suspense,use,useEffect,useEffectEvent,useLayoutEffect,useReducer,useRef,useState} from "react";
import {catalog,SectionId} from "./site/catalog";
import {historyReducer} from "./editor/history";
import {SitePreview} from "./site/preview";
import {downloadFile,packageWebsite} from "./export/package";
import {Site,initial,makeBlock,duplicateBlock,fixedBlockOrder,starterBlocks,syncServicePages} from "./site/blocks";

function footerContent(site:Site):FooterColumn[] {
  return site.footerColumns||[{title:site.brand,text:'Good work. Good people. A better way forward.',links:[]},{title:'Explore',text:'',links:sections.filter(s=>!site.hidden.includes(s.id)&&['services','proof','about','contact'].includes(s.id)).map(s=>({label:s.label,href:`#${s.id}`}))},{title:'Get in touch',text:[site.address,site.phone,site.email].join('\n'),links:[]}];
}
const sections = catalog;
type RequestQuery=Promise<{[key:string]:string|string[]|undefined}>;
export default function Home({searchParams}:{searchParams:RequestQuery}) { return <Suspense fallback={<div className="preview-loading"/>}><RequestedEditor searchParams={searchParams}/></Suspense>; }
function RequestedEditor({searchParams}:{searchParams:RequestQuery}) { const query=use(searchParams);return <MediaProvider><Editor initialPreview={query.preview==='1'} requestedPage={typeof query.page==='string'?query.page:undefined}/></MediaProvider>; }
function Editor({initialPreview,requestedPage}:{initialPreview:boolean;requestedPage?:string}) {
  const [history, dispatch] = useReducer(historyReducer, { past: [], present: initial, future: [] });
  const site = history.present;
  const [pages,setPages]=useState<PageEntry<Site>[]>([{id:"home",name:"Home",slug:"home",site:initial}]);
  const [activeId,setActiveId]=useState(requestedPage||"home");
  const [saveError,setSaveError]=useState("");
  const [dirty,setDirty]=useState(false);
  const homeId=pages.find(p=>p.id==="home")?.id||pages[0].id;
  const snapshot=()=>pageSnapshot(pages,activeId,site);
  const mediaUsage=collectMediaUsage(snapshot());
  const openLibrary=()=>{setLocation('library');setSidebarOpen(true);};
  const mergeWorkspace=()=>mergedPages(localStorage.getItem(workspaceKey),snapshot());
  const saveWorkspace=()=>{writeWorkspace(localStorage,activeId,mergeWorkspace());setDirty(false);};
  const [selected, setSelected] = useState<string>("hero");
  const [location,setLocation]=useState<EditorLocation>("sections");
  const [view,setView]=useState<"Content"|"Appearance">("Content");
  const [group,setGroup]=useState<string|null>(null);
  const [focusItem,setFocusItem]=useState<string|null>(null);
  const [sectionQuery,setSectionQuery]=useState("");
  const [addAnchor,setAddAnchor]=useState<string|null>(null);
  const scope=useRef<EditScope>({});
  const [editScope]=useState<EditScopeApi>(()=>({claim(id){scope.current.id=id;},release(id){if(scope.current.id===id)scope.current.id=undefined;}}));
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [availableWidth, setAvailableWidth] = useState(1000);
  const [canvasWidth, setCanvasWidth] = useState(1440);
  const [zoom, setZoom] = useState<"fit" | number>("fit");
  const [scrollTick, setScrollTick] = useState(0);
  const [region, setRegion] = useState<EditorRegion>("page");
  const [settingsPane, setSettingsPane] = useState<SettingsPane | null>(null);
  const [menu, setMenu] = useState<"" | "zoom" | "export" | "more">("");
  const [preview, setPreview] = useState(initialPreview);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportPages,setExportPages]=useState<PageEntry<Site>[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ready, setReady] = useState(false);
  const [pendingHash,setPendingHash]=useState<string|null>(null);
  const [navigation,setNavigation]=useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const scrolls = useRef<Record<EditorRegion, number>>({header: 0, page: 0, footer: 0});
  const scrollRequest = useRef<string | null>(null);
  const restoreScroll = useRef<number | null>(null);
  const requestScroll = (id: string) => { scrollRequest.current = id; setScrollTick(tick => tick + 1); };
  useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => setAvailableWidth(current => { const styles = getComputedStyle(root); const next = Math.max(160, Math.round(root.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight))); return Math.abs(current - next) < 1 ? current : next; }));
    observer.observe(root);
    return () => observer.disconnect();
  }, [ready,preview,sidebarOpen]);
  const [notice, setNotice] = useState("");
  const [heroFocus, setHeroFocus] = useState<HeroFocus>(null);
  useEffect(()=>{const timer=window.setTimeout(()=>{try{
    setSidebarOpen(true);
    const raw=localStorage.getItem(workspaceKey);
    if(raw){const workspace=JSON.parse(raw);if(loadableWorkspace(workspace)){const list=storedPages(workspace.pages);const page=activePage(list,requestedPage||workspace.activeId);if(workspace.schemaVersion===2)upgradeSchema2(localStorage,raw,page.id,list);setPages(list);setActiveId(page.id);setSelected(page.site.blocks.find(b=>b.type==="hero")?.id||page.site.blocks[0]?.id||"");dispatch({type:"load",next:bindMenu(sharedMenu({...initial,...page.site},(list.find(p=>p.id==="home")||list[0]).site),list)});setReady(true);return;}const failure=retainFailedWorkspace(localStorage);if(failure.error)setSaveError(failure.error);setActiveId("home");setReady(true);return;}
    setActiveId("home");setDirty(!initialPreview);
    const legacy=localStorage.getItem(legacyWorkspaceKey);if(legacy){const next=legacySite(JSON.parse(legacy),initial);if(next){setPages([{id:"home",name:"Home",slug:"home",site:sharedMenu(next,next)}]);dispatch({type:"load",next:sharedMenu(next,next)});}}
  }catch{try{const failure=retainFailedWorkspace(localStorage);if(failure.error)setSaveError(failure.error);else setDirty(!initialPreview);}catch{}setActiveId("home");}setReady(true);},0);return()=>window.clearTimeout(timer);},[requestedPage,initialPreview]);
  useEffect(()=>{if(!ready||saveError||!dirty)return;const timer=window.setTimeout(()=>{try{writeWorkspace(localStorage,activeId,autosavedPages(localStorage.getItem(workspaceKey),pageSnapshot(pages,activeId,site)));setDirty(false);}catch{setSaveError("Changes could not be saved. Export your project as a backup.");}},250);return()=>window.clearTimeout(timer);},[site,pages,activeId,homeId,ready,saveError,dirty]);
  useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key!==workspaceKey||!e.newValue)return;try{const saved=JSON.parse(e.newValue);if(syncableWorkspace(saved))setPages(old=>storedPages(saved.pages).map((p:PageEntry<Site>)=>p.id===activeId?old.find(v=>v.id===activeId)||p:p));}catch{}};window.addEventListener("storage",sync);return()=>window.removeEventListener("storage",sync);},[activeId]);
  useEffect(()=>{if(!ready||saveError)return;const next=syncServicePages(pageSnapshot(pages,activeId,site),homeId);if(!next)return;const home=next.find(p=>p.id===homeId)!;const linked=next.map(p=>p.id===homeId?p:{...p,site:sharedMenu(p.site,home.site)});const timer=window.setTimeout(()=>{setPages(linked);dispatch({type:'sync',next:(linked.find(p=>p.id===activeId)||home).site});setDirty(true);},0);return()=>window.clearTimeout(timer);},[ready,saveError,site,pages,activeId,homeId]);
  const switchPage=(id:string,hash='',push=true)=>{const list=mergeWorkspace(),page=list.find(p=>p.id===id);if(!page)return;
    if(preview){setNavigation(n=>n+1);setPendingHash(hash);if(push)window.history.pushState(null,'',`?preview=1&page=${encodeURIComponent(id)}${hash}`);}
    if(id===activeId)return;if(dirty)saveWorkspace();setDirty(!preview);setPages(list);setActiveId(id);dispatch({type:'load',next:bindMenu(sharedMenu(page.site,(list.find(p=>p.id===homeId)||list[0]).site),list)});setSelected(page.site.blocks.find(b=>b.type==='hero')?.id||page.site.blocks[0]?.id||'');setLocation('sections');setGroup(null);setView('Content');frameRef.current?.contentDocument?.scrollingElement?.scrollTo({top:0,behavior:'instant'});canvasRef.current?.scrollTo({top:0,behavior:'instant'});
  };
  const scrollPreview=useEffectEvent((hash:string)=>{const root=canvasRef.current;if(!root)return;const target=hash?root.querySelector<HTMLElement>(`[id="${CSS.escape(hash.slice(1))}"]`):null;root.scrollTo({top:target?target.getBoundingClientRect().top-root.getBoundingClientRect().top+root.scrollTop:0,behavior:'instant'});});
  useLayoutEffect(()=>{if(preview&&ready)scrollPreview(pendingHash??window.location.hash);},[activeId,pendingHash,preview,ready,navigation]);
  const restorePreview=useEffectEvent(()=>{const params=new URLSearchParams(window.location.search);switchPage(params.get('page')||homeId,window.location.hash,false);});
  useEffect(()=>{if(!preview||!ready)return;window.addEventListener('popstate',restorePreview);return()=>window.removeEventListener('popstate',restorePreview);},[preview,ready]);
  const addPage=(name:string,placement:PagePlacement)=>{
    if(pages.length>=30||saveError)return;
    const list=mergeWorkspace(),home=list.find(p=>p.id===homeId)!,id=crypto.randomUUID(),slug=pageSlug(name,list.map(p=>p.slug||pageSlug(p.name)));
    const shared=placePage({...home.site,footerColumns:footerContent(home.site)},{id,name,slug},placement.where,placement.parent);
    shared.hidden=shared.hidden.filter(section=>section!==(pageLocation(shared,{id,name,slug}).where==='bottom'?'footer':'header'));
    const next=sharedMenu({...site,blocks:starterBlocks(placement.kind||'service',name,shared),theme:site.theme,accent:site.accent,headline:name,seoTitle:placement.title.trim()||`${name} | ${shared.brand}`,seoDescription:placement.description.trim(),hidden:sections.map(s=>s.id).filter(section=>!['header','hero','about','contact','footer'].includes(section))},shared);
    setDirty(true);setPages([...list.map(p=>p.id===homeId?{...p,site:shared}:p),{id,name,slug,site:next}]);setActiveId(id);dispatch({type:'load',next});setSelected(next.blocks.find(b=>b.type==='hero')?.id||next.blocks[0]?.id||'');setLocation('sections');setGroup(null);setView('Content');frameRef.current?.contentDocument?.scrollingElement?.scrollTo({top:0});canvasRef.current?.scrollTo({top:0});
  };
  const placeCurrent=(where:'top'|'bottom'|'under'|'none',parent:number)=>{const page=pages.find(p=>p.id===activeId)!;const shared=placePage({...site,footerColumns:footerContent(site)},page,where,parent);shared.hidden=shared.hidden.filter(id=>id!==(where==='bottom'?'footer':'header'));update(shared);};
  const renamePage=(name:string)=>{const old=pages.find(p=>p.id===activeId)!;const seoTitle=site.seoTitle===`${old.name} | ${site.brand}`?`${name} | ${site.brand}`:site.seoTitle===old.name?name:site.seoTitle;const next={...site,seoTitle,blocks:site.blocks.map(b=>b.type==='hero'&&b.content.title===old.name?{...b,content:{...b.content,title:name}}:b)};setDirty(true);dispatch({type:'set',next});setPages(snapshot().map(p=>p.id===activeId?{...p,name,site:next}:p));};
  const update = (patch: Partial<Site>) => {if(patch.footerColumns)patch.footerColumns=patch.footerColumns.map(c=>({...c,links:c.links.map(l=>({...l,pageId:linkedPage(pages,l.href)?.id}))}));if(patch.navTargets)patch.navPageIds=patch.navTargets.map(href=>linkedPage(pages,href)?.id||null);setDirty(true);const next={ ...site, ...patch, blocks:fixedBlockOrder(patch.blocks||site.blocks).map(b=>b.type==='header'?{...b,layout:headerLook(patch.headerStyle||site.headerStyle)}:b.type==='footer'?{...b,layout:patch.footerStyle||site.footerStyle}:b) };const typing=document.activeElement instanceof HTMLInputElement||document.activeElement instanceof HTMLTextAreaElement;const groupId=typing?scope.current.id:undefined;dispatch(groupId?{type:"set",next,group:groupId}:{type:"set",next});};
  const saveProfile=(next:ProfileDetails)=>{const apply=(source:Site):Site=>({...source,ownerName:next.ownerName});setDirty(true);setPages(list=>list.map(p=>({...p,site:apply(p.id===activeId?site:p.site)})));dispatch({type:"set",next:apply(site)});};
  const saveBusiness=(next:BusinessDetails)=>{const apply=(source:Site):Site=>({...source,brand:next.brand,address:next.address,phone:next.phone,email:next.email,blocks:source.blocks.map(b=>b.type==='contact'?{...b,content:{...b.content,address:next.address,phone:next.phone,email:next.email,hours:next.hours}}:b)});setDirty(true);setPages(list=>list.map(p=>({...p,site:apply(p.id===activeId?site:p.site)})));dispatch({type:"set",next:apply(site)});};
  const applyBrand=(patch:BrandSitePatch)=>{const source=activeId===homeId?site:pages.find(p=>p.id===homeId)!.site;const next={...source,...patch,blocks:fixedBlockOrder(source.blocks).map(b=>b.type==='header'?{...b,layout:headerLook(patch.headerStyle||source.headerStyle)}:b.type==='footer'?{...b,layout:patch.footerStyle||source.footerStyle}:b)};setDirty(true);setPages(list=>list.map(p=>p.id===homeId?{...p,site:next}:p.id===activeId&&activeId!==homeId?{...p,site:sharedMenu(p.site,next)}:p));if(activeId===homeId)dispatch({type:"set",next});else dispatch({type:"set",next:sharedMenu(site,next)});};
  const openSettings=(pane:SettingsPane='business')=>setSettingsPane(pane);
  const setPageSlug=(slug:string)=>{const cleaned=slug.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,48);if(!cleaned||activeId===homeId)return;const used=pages.filter(p=>p.id!==activeId).map(p=>p.slug||pageSlug(p.name));const nextSlug=used.includes(cleaned)?pageSlug(cleaned,used):cleaned;setDirty(true);setPages(list=>list.map(p=>p.id===activeId?{...p,slug:nextSlug}:p));};
  const setBreadcrumbs=(show:boolean)=>{update({blocks:site.blocks.map(b=>b.type==='hero'?{...b,content:{...b.content,showBreadcrumbs:show}}:b)});};
  const flash = (message: string) => { setNotice(message); };
  const chooseSection = (id:string) => {
    const block=site.blocks.find(b=>b.id===id);
    const nextRegion=block?regionForBlock(block.type):region;
    if(nextRegion!==region){const scroller=frameRef.current?.contentDocument?.scrollingElement;if(scroller)scrolls.current[region]=scroller.scrollTop;setRegion(nextRegion);}
    setSelected(id);setLocation("inspector");setPreview(false);setSidebarOpen(true);
    if(id!==selected){setView("Content");setGroup(block?contentGroups(block,site,footerContent(site))[0]?.id??null:null);setFocusItem(null);}
    if(block?.type==="hero"||id!==selected)requestScroll(id);
  };
  const showRegion = (next:EditorRegion) => {
    if(next===region)return;
    const scroller=frameRef.current?.contentDocument?.scrollingElement;
    if(scroller)scrolls.current[region]=scroller.scrollTop;
    restoreScroll.current=scrolls.current[next];
    scrollRequest.current=null;
    const id=selectionForRegion(next,site.blocks,selected);
    const block=site.blocks.find(b=>b.id===id);
    setRegion(next);setSelected(id);setLocation("inspector");setPreview(false);
    if(id!==selected){setView("Content");setGroup(block?contentGroups(block,site,footerContent(site))[0]?.id??null:null);}
  };
  useEffect(()=>{
    const scroller=frameRef.current?.contentDocument?.scrollingElement;
    if(!scroller)return;
    if(restoreScroll.current!=null){const top=restoreScroll.current;restoreScroll.current=null;scrollRequest.current=null;scroller.scrollTo({top,behavior:"instant"});return;}
    const id=scrollRequest.current;
    if(!id)return;
    scrollRequest.current=null;
    const doc=frameRef.current?.contentDocument;
    const target=doc?.querySelector(`[data-section="${CSS.escape(id)}"]:not(.editor-context)`) as HTMLElement | null;
    if(!target)return;
    const hero=target.getAttribute("data-block-type")==="hero";
    const menu=hero||region==="header"?0:doc?.querySelector(".menu-frame")?.getBoundingClientRect().height||0;
    scroller.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+scroller.scrollTop-(hero?0:18+menu)),behavior:"instant"});
  },[region,scrollTick]);
  const openPreview = () => { if(saveError){flash(saveError);return;}try{saveWorkspace();window.open(`${window.location.origin}/?preview=1&page=${encodeURIComponent(activeId)}`,"_blank","noopener,noreferrer");}catch{flash("Preview could not be saved. Check browser storage permissions.");} };
  const exportConfig=()=>{const records=mergeWorkspace(),home=records.find(p=>p.id===homeId)!;downloadFile(new Blob([JSON.stringify({schemaVersion:3,activeId,pages:records.map(p=>({...p,site:sharedMenu(p.site,home.site)}))},null,2)],{type:'application/json'}),'business-website-config.json');flash('Configuration exported');};
  const exportPackage=async(format:'html'|'wordpress')=>{
    setMenu("");const records=mergeWorkspace(),home=records.find(p=>p.id===homeId)!;
    const prepared=records.map(p=>({...p,site:sharedMenu(p.site,home.site)}));
    try{flushSync(()=>{setExportBusy(true);setExportPages(prepared);});downloadFile(await packageWebsite(prepared,format),`business-${format==='html'?'website':'wordpress-theme'}.zip`);flash(`${format.toUpperCase()} website exported`);}
    catch(error){flash(`Export failed: ${String(error)}`);}
    finally{setExportBusy(false);setExportPages([]);}
  };
  const changeSectionSettings=(id:string,value:SectionSettings)=>update({blocks:site.blocks.map(b=>b.id===id?{...b,settings:value}:b)});
  const footerDefaults=footerContent({...site,hidden:activeId===homeId?site.hidden:pages.find(p=>p.id===homeId)!.site.hidden});
  const selectedBlock=site.blocks.find(b=>b.id===selected)||site.blocks[0];
  const editBlocks=(operation:'add'|'duplicate'|'delete'|'visibility',id:string,type?:SectionId)=>{const block=site.blocks.find(b=>b.id===id),index=site.blocks.findIndex(b=>b.id===id);if(!block&&operation!=='add')return;if(block&&['header','footer'].includes(block.type)&&operation==='delete'&&!window.confirm('Delete this shared section from every page?'))return;
    if(operation==='visibility'){update({blocks:site.blocks.map(b=>b.id===id?{...b,hidden:!b.hidden}:b)});return;}if(operation==='delete'){update({blocks:site.blocks.filter(b=>b.id!==id)});setSelected(site.blocks.find(b=>b.id!==id)?.id||'');setLocation('sections');setGroup(null);return;}
    if(site.blocks.length>=80)return;const added=operation==='duplicate'?duplicateBlock(block!):makeBlock(type!);if(['header','footer'].includes(added.type)&&site.blocks.some(b=>b.type===added.type))return;const next=[...site.blocks];next.splice(Math.max(0,index+1),0,added);update({blocks:next});setSelected(added.id);setLocation('inspector');setView('Content');setGroup(contentGroups(added,site,footerContent(site))[0]?.id??null);
  };
  const homeSite=activeId===homeId?site:pages.find(p=>p.id===homeId)?.site||site;
  const openAdd=(anchor:string)=>{setAddAnchor(anchor);setLocation('add-section');setSidebarOpen(true);};
  const previewWidth=device==="desktop"?canvasWidth:device==="tablet"?768:390;
  const previewFrame=frameSize(device,previewWidth);
  const frameScale=displayZoom(zoom,availableWidth,previewFrame.width);
  const zoomLabel=zoom==="fit"?`Fit ${Math.round(frameScale*100)}%`:`${Math.round(frameScale*100)}%`;
  if(preview&&!ready)return <div className="preview-loading"/>;
  const pageName=pages.find(p=>p.id===activeId)?.name||"Home";
  const profileValue:ProfileDetails={ownerName:homeSite.ownerName||""};
  const businessValue:BusinessDetails={email:homeSite.email,brand:homeSite.brand,address:homeSite.address,phone:homeSite.phone,hours:homeSite.blocks.find(b=>b.type==="contact")?.content.hours||""};
  const chooseZoom=(mode:"fit"|number)=>{setZoom(mode);setMenu("");};
  const darkTheme=site.theme==="midnight";
  const zoomChoices=<div className="export-options" role="menu">
    <button type="button" role="menuitem" onClick={()=>chooseZoom("fit")}>Fit</button>
    {previewZooms.map(value=><button type="button" role="menuitem" key={value} onClick={()=>chooseZoom(value)}>{Math.round(value*100)}%</button>)}
  </div>;
  const toolbar=<header className="topbar workspace-toolbar">
    <div className="toolbar-group toolbar-identity">
      <div className="project-brand">
        <span className="project-mark" aria-hidden="true">{(site.brand?.charAt(0)||"N").toUpperCase()}</span>
        <strong className="brand-title">{site.brand}</strong>
      </div>
    </div>
    <div className="toolbar-group toolbar-center">
      <div className="toolbar-middle devices" role="group" aria-label="Preview size">
        <button type="button" className={`icon-button${device==="desktop"?" tool-active":""}`} onClick={()=>setDevice("desktop")} aria-label="Desktop preview"><Monitor aria-hidden="true"/></button>
        <button type="button" className={`icon-button${device==="tablet"?" tool-active":""}`} onClick={()=>setDevice("tablet")} aria-label="Tablet preview"><Tablet aria-hidden="true"/></button>
        <button type="button" className={`icon-button${device==="mobile"?" tool-active":""}`} onClick={()=>setDevice("mobile")} aria-label="Mobile preview"><Smartphone aria-hidden="true"/></button>
      </div>
      <label className="canvas-width"><input aria-label="Preview width" type="number" min="320" max="1920" step="10" value={previewWidth} onChange={e=>{setCanvasWidth(Math.max(320,Math.min(1920,Number(e.target.value)||320)));setDevice("desktop");}}/> px</label>
      <div className="zoom-menu" onKeyDown={e=>{if(e.key==="Escape")setMenu("");}}>
        <button type="button" aria-haspopup="menu" aria-expanded={menu==="zoom"} onClick={()=>setMenu(current=>current==="zoom"?"":"zoom")}>{zoomLabel}<ChevronDown aria-hidden="true"/></button>
        {menu==="zoom"&&zoomChoices}
      </div>
    </div>
    <div className="toolbar-group toolbar-actions">
      <button type="button" className="icon-button" onClick={()=>{setDirty(true);dispatch({type:"undo"});}} disabled={!history.past.length} aria-label="Undo"><Undo2 aria-hidden="true"/></button>
      <button type="button" className="icon-button" onClick={()=>{setDirty(true);dispatch({type:"redo"});}} disabled={!history.future.length} aria-label="Redo"><Redo2 aria-hidden="true"/></button>
      <button type="button" className="icon-button theme-toggle is-secondary" aria-pressed={darkTheme} aria-label={darkTheme?"Switch to light website theme":"Switch to dark website theme"} onClick={()=>update({theme:darkTheme?"paper":"midnight"})}><Moon className="is-moon" size={18} strokeWidth={1.75} aria-hidden="true"/><Sun className="is-sun" size={18} strokeWidth={1.75} aria-hidden="true"/></button>
      <button type="button" onClick={openPreview} className="preview-toggle is-secondary"><Eye size={16} strokeWidth={1.75} aria-hidden="true"/><span>Live preview</span></button>
      <div className="export-menu" onKeyDown={e=>{if(e.key==="Escape")setMenu("");}}>
        <button type="button" aria-expanded={menu==="export"} aria-haspopup="menu" disabled={exportBusy} onClick={()=>setMenu(current=>current==="export"?"":"export")}><Download size={16} strokeWidth={1.75} aria-hidden="true"/><span>{exportBusy?"Preparing…":"Export"}</span><ChevronDown aria-hidden="true"/></button>
        {menu==="export"&&<div className="export-options" role="menu"><button type="button" role="menuitem" onClick={()=>void exportPackage("html")}>HTML website (.zip)</button><button type="button" role="menuitem" onClick={()=>void exportPackage("wordpress")}>WordPress website theme (.zip)</button><button type="button" role="menuitem" onClick={()=>{setMenu("");exportConfig();}}>All pages (.json)</button></div>}
      </div>
      <span className="toolbar-divider is-secondary" aria-hidden="true"/>
      <button type="button" className="icon-button is-secondary" aria-haspopup="dialog" aria-label="Settings" title="Settings" onClick={()=>openSettings('business')}><Settings aria-hidden="true"/></button>
    </div>
    <div className="toolbar-more" onKeyDown={e=>{if(e.key==="Escape")setMenu("");}}>
      <button type="button" className="icon-button" aria-haspopup="menu" aria-expanded={menu==="more"} aria-label="More" onClick={()=>setMenu(current=>current==="more"?"":"more")}><Ellipsis aria-hidden="true"/></button>
      {menu==="more"&&<div className="export-options" role="menu" aria-label="More actions">
        <button type="button" role="menuitem" onClick={()=>{update({theme:darkTheme?"paper":"midnight"});setMenu("");}}>{darkTheme?"Light website theme":"Dark website theme"}</button>
        <button type="button" role="menuitem" onClick={()=>{setMenu("");openPreview();}}>Live preview</button>
        <button type="button" className="more-export" role="menuitem" onClick={()=>{setMenu("");void exportPackage("html");}}>HTML website (.zip)</button>
        <button type="button" className="more-export" role="menuitem" onClick={()=>{setMenu("");void exportPackage("wordpress");}}>WordPress website theme (.zip)</button>
        <button type="button" className="more-export" role="menuitem" onClick={()=>{setMenu("");exportConfig();}}>All pages (.json)</button>
        <button type="button" role="menuitem" onClick={()=>{setMenu("");openSettings('business');}}>Settings</button>
      </div>}
    </div>
  </header>;
  const siteView=<SitePreview selectPage={switchPage} site={site} selected={selected} select={chooseSection} editable={!preview} changeSettings={changeSectionSettings} pages={pages} activeId={activeId} region={preview?"live":region} focusItem={focusItem}/>;
  const canvas=preview
    ? <div ref={canvasRef} className="canvas-area canvas-preview"><div className="canvas-frame" style={{width:"100%"}}>{siteView}</div></div>
    : <PreviewFrame areaRef={canvasRef} frameRef={frameRef} device={device} width={previewWidth} scale={frameScale} zoomLabel={zoomLabel} address={`/${pages.find(p=>p.id===activeId)?.slug||"home"}`} selectedId={selectedBlock?.id||""} sectionName={catalog.find(s=>s.id===selectedBlock?.type)?.label||"Section"} region={region} onRegion={showRegion}>{siteView}</PreviewFrame>;
  return <HeroFocusProvider value={{focus: heroFocus, setFocus: setHeroFocus}}><main className={`studio-editor${preview?" standalone-preview":""}`}>
    <EditScopeContext.Provider value={editScope}>
      <ManageLibraryProvider onOpen={openLibrary}>
      <EditorShell location={location} setLocation={setLocation} view={view} setView={setView} open={sidebarOpen} preview={preview} pageName={pageName} sectionName={catalog.find(s=>s.id===selectedBlock?.type)?.label||"Section"} shared={!!selectedBlock&&["header","footer"].includes(selectedBlock.type)} saveLabel={saveError||(dirty?"Saving…":"Saved in this browser")} saveError={!!saveError} onReset={()=>{if(window.confirm("Reset this page to its starter content? Other pages and uploaded media will remain."))update(sharedMenu({...initial,brand:site.brand,theme:site.theme},site));}} pages={pages.map(p=>({id:p.id,name:p.name,slug:p.slug}))} pageId={activeId} homeId={homeId} homeSite={homeSite} onSelectPage={id=>{switchPage(id);setLocation("sections");}} onPageMenu={id=>{switchPage(id);setLocation("page-settings");setSidebarOpen(true);}} sections={site.blocks.map((block,index)=>{const Icon=sectionIcons[block.type];const entry=catalog.find(s=>s.id===block.type)!;return {id:block.id,name:entry.label,hidden:!!block.hidden,shared:block.type==="header"||block.type==="footer",stage:entry.stage,icon:<Icon size={16} strokeWidth={1.75} aria-hidden="true"/>,menu:<SectionMenu block={block} index={index} blocks={site.blocks} editBlocks={editBlocks} onAdd={openAdd}/>};})} sectionId={selectedBlock?.id||""} onSelectSection={chooseSection} onToggleHidden={id=>editBlocks("visibility",id)} homeStages={activeId===homeId} query={sectionQuery} setQuery={setSectionQuery} canAddSection={site.blocks.length<80} onAddSection={()=>openAdd(selected)} onPageSettings={()=>{setLocation("page-settings");setSidebarOpen(true);}} onBusiness={()=>openSettings('business')} onLibrary={openLibrary} sectionMenu={selectedBlock?<SectionMenu block={selectedBlock} index={site.blocks.findIndex(b=>b.id===selectedBlock.id)} blocks={site.blocks} editBlocks={editBlocks} onAdd={openAdd}/>:null} toolbar={toolbar} canvas={canvas}>
        {location==="inspector"&&selectedBlock&&<SectionEditor view={view} group={group} onGroup={id=>{setGroup(id);if(id!=='services')setFocusItem(null);}} site={site} pages={pages} block={selectedBlock} usage={mediaUsage} footerDefaults={footerDefaults} home={activeId===homeId} update={update} onFocusItem={setFocusItem} onOpenPage={id=>{switchPage(id);setLocation('inspector');}}/>}
        {location==="library"&&<MediaLibraryBoard usage={mediaUsage} onJump={use=>{switchPage(use.pageId);setSelected(use.blockId);setLocation('inspector');setGroup(null);setView('Content');}}/>}
        {location==="page-settings"&&<PageSettings site={site} pages={pages} activeId={activeId} homeId={homeId} renamePage={renamePage} setSlug={setPageSlug} placeCurrent={placeCurrent} editSEO={update} setBreadcrumbs={setBreadcrumbs} home={activeId===homeId} onEditService={()=>{const services=homeSite.blocks.find(b=>b.type==='services');const item=services?.content.items.find(entry=>entry.pageId===activeId);switchPage(homeId);setSelected(services?.id||'');setLocation('inspector');setGroup('services');setFocusItem(item?.id||null);setSidebarOpen(true);}}/>}
        {location==="create-page"&&<CreatePageForm site={site} pages={pages} disabled={pages.length>=30||!!saveError} addPage={addPage}/>}
        {location==="add-section"&&<AddSectionForm blocks={site.blocks} onAdd={type=>editBlocks("add",addAnchor||selected,type)}/>}
      </EditorShell>
      </ManageLibraryProvider>
    </EditScopeContext.Provider>
    {exportPages.length>0&&<div className="export-stage" data-editor-only="true">{exportPages.map(page=><div key={page.id} data-export-page={page.id}><SitePreview site={page.site} pages={exportPages} activeId={page.id} editable={false} selected="" select={()=>{}}/></div>)}</div>}
    {settingsPane&&<SettingsDialog profile={profileValue} business={businessValue} pageCount={pages.length} initialPane={settingsPane} onClose={()=>setSettingsPane(null)} onSaveProfile={saveProfile} onSaveBusiness={saveBusiness} site={homeSite} onSaveBrand={applyBrand}/>}
    {notice&&<div className="toast" role="status">{notice}<button type="button" onClick={()=>setNotice("")} aria-label="Dismiss notification">×</button></div>}
  </main></HeroFocusProvider>;
}
