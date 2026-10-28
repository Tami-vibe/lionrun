"use client";
import {useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Menu as MenuIcon, Link as LinkIcon, EllipsisVertical, Plus, Pencil, Copy, Trash2, ArrowLeft, CornerDownRight} from 'lucide-react';
import type {Site} from '../site/blocks';
import {type MenuItem, type NamedMenu, type MenuPlacementConfig, type MenuDrop, createDefaultMenus, defaultPlacement, syncMenusToSite, orderedMenuItems, moveMenuItem, duplicateMenu} from './menu-model';
import {pageSlug, type MenuPage} from './settings';
import {catalog} from '../site/catalog';

type Props = {site: Site; pages: MenuPage[]; update: (patch: Partial<Site>) => void};
type DropTarget = {id: string; drop: MenuDrop};
export function MenuPlacement({site, pages, update}: Props) {
  const menus = site.menus?.length ? site.menus : createDefaultMenus(site, pages);
  const placement = site.menuPlacement || defaultPlacement(menus);
  return <div className="menu-placement-section"><h3 tabIndex={-1}>Menu placement</h3>{(['header','footer'] as const).map(place =>
    <label className="field" key={place}><span>{place === 'header' ? 'Header' : 'Footer'}</span>
      <select aria-label={`Menu assigned to ${place === 'header' ? 'Header' : 'Footer'}`} value={placement[place] || ''} onChange={e=>update(syncMenusToSite(site,menus,{...placement,[place]:e.target.value},pages))}>
        {menus.map(menu=><option key={menu.id} value={menu.id}>{menu.name || 'Untitled menu'}</option>)}
      </select></label>)}</div>;
}
export function MenuEditor({site, pages, update}: Props) {
  const menus = site.menus?.length ? site.menus : createDefaultMenus(site,pages), placement = site.menuPlacement || defaultPlacement(menus);
  const [activeId,setActiveId] = useState<string|null>(null), [editing,setEditing] = useState<{menuId:string;item:MenuItem;isNew?:boolean}|null>(null);
  const [creating,setCreating] = useState(false), [name,setName] = useState(''), [notice,setNotice] = useState('');
  const [popup,setPopup] = useState<{id:string;kind:'menu'|'item';left:number;top:number}|null>(null);
  const [drag,setDrag] = useState<string|null>(null), [over,setOver] = useState<DropTarget|null>(null);
  const trigger = useRef<HTMLButtonElement|null>(null), popover = useRef<HTMLDivElement|null>(null), root = useRef<HTMLDivElement|null>(null);
  const pointer = useRef<{id:string;x:number;y:number;started:boolean;target:DropTarget|null}|null>(null), suppressClick=useRef(false), nameFocus=useRef(false);
  const active=menus.find(menu=>menu.id===activeId), items=orderedMenuItems(active?.items||[]);
  const save=(next:NamedMenu[],where:MenuPlacementConfig=placement)=>update(syncMenusToSite(site,next,where,pages));
  const changeMenu=(id:string,fn:(menu:NamedMenu)=>NamedMenu)=>save(menus.map(menu=>menu.id===id?fn(menu):menu));
  const close=(focus=true)=>{setPopup(null);if(focus)trigger.current?.focus({preventScroll:true});};
  useEffect(()=>{
    if(!popup)return;
    popover.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({preventScroll:true});
    const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!popover.current?.contains(e.target)&&!trigger.current?.contains(e.target))setPopup(null);};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPopup(null);trigger.current?.focus({preventScroll:true});}};
    const dismiss=()=>setPopup(null);
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);window.addEventListener('resize',dismiss);window.addEventListener('scroll',dismiss,true);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('resize',dismiss);window.removeEventListener('scroll',dismiss,true);};
  },[popup]);
  useEffect(()=>{root.current?.querySelector<HTMLElement>('input, h3')?.focus({preventScroll:true});},[activeId,editing?.item.id,creating]);
  useEffect(()=>{if(nameFocus.current){root.current?.querySelector<HTMLInputElement>('[aria-label="Menu name"]')?.focus();nameFocus.current=false;}},[activeId]);
  function openActions(button:HTMLButtonElement,id:string,kind:'menu'|'item') {
    if(popup?.id===id&&popup.kind===kind){close();return;}
    trigger.current=button;const rect=button.getBoundingClientRect(),height=(window.matchMedia('(pointer:coarse)').matches?44:34)*(kind==='menu'?3:2)+16;
    setPopup({id,kind,left:Math.max(8,Math.min(rect.right-178,window.innerWidth-186)),top:rect.bottom+height+8>window.innerHeight?Math.max(8,rect.top-height-4):rect.bottom+4});
  }
  function move(id:string,target:DropTarget) {
    if(!active)return;
    const result=moveMenuItem(active.items,id,target.id,target.drop,placement.header===active.id?5:Infinity,placement.footer!==active.id);
    if(result.error){setNotice(result.error);return;}
    if(JSON.stringify(result.items)===JSON.stringify(active.items))return;
    changeMenu(active.id,menu=>({...menu,items:result.items}));setNotice('Menu updated. Undo is available in the top bar.');
  }
  function pointMove(e:ReactPointerEvent<HTMLDivElement>) {
    const pending=pointer.current;if(!pending)return;
    if(!pending.started){if(Math.hypot(e.clientX-pending.x,e.clientY-pending.y)<7)return;pending.started=true;suppressClick.current=true;setDrag(pending.id);setPopup(null);}
    const rows=[...(root.current?.querySelectorAll<HTMLElement>('[data-menu-item]')||[])];
    const row=rows.find(row=>{const rect=row.getBoundingClientRect();return e.clientY>=rect.top&&e.clientY<=rect.bottom;});
    if(!row){pending.target=null;setOver(null);return;}
    const id=row.dataset.menuItem!,rect=row.getBoundingClientRect(),item=items.find(item=>item.id===id)!;
    const horizontal=e.clientX-pending.x;
    const drop:MenuDrop=horizontal>24&&!item.parentId?'inside':e.clientY<rect.top+rect.height/2?'before':'after';
    pending.target=horizontal< -24&&item.parentId?{id:item.parentId,drop:'after'}:{id,drop};setOver(pending.target);
    const panel=root.current?.closest('.panelbody');if(panel){const bounds=panel.getBoundingClientRect();if(e.clientY<bounds.top+40)panel.scrollTop-=12;else if(e.clientY>bounds.bottom-40)panel.scrollTop+=12;}
  }
  function finishPointer(cancel=false) {
    const pending=pointer.current;if(!cancel&&pending?.started&&pending.target)move(pending.id,pending.target);
    pointer.current=null;setDrag(null);setOver(null);
    if(pending?.started)window.setTimeout(()=>{suppressClick.current=false;},0);
  }
  const destination=(item:MenuItem)=>item.linkTo==='page'?`Page · ${pages.find(page=>page.id===item.pageId||`/${page.slug}`===item.destination)?.name||(item.destination.startsWith('/')?item.destination:'Choose a page')}`:item.linkTo==='section'?`Section · ${catalog.find(section=>`#${section.id}`===item.destination)?.label||item.destination}`:item.destination;
  const back=(label:string,onClick:()=>void)=><button type="button" className="menu-back-btn" onClick={onClick}><ArrowLeft size={16} aria-hidden="true"/>{label}</button>;
  const more=(id:string,kind:'menu'|'item',label:string)=><button type="button" className="quiet section-more" aria-label={`Actions for ${label}`} aria-haspopup="menu" aria-expanded={popup?.id===id&&popup.kind===kind} onClick={e=>openActions(e.currentTarget,id,kind)}><EllipsisVertical size={16} aria-hidden="true"/></button>;
  const menu=menus.find(menu=>menu.id===popup?.id), item=active?.items.find(item=>item.id===popup?.id);
  const popupUI=popup&&createPortal(<div className="editor-menu-popover" ref={popover} role="menu" aria-label="Menu actions" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPopup(null);}} style={{left:popup.left,top:popup.top}} onKeyDown={e=>{
    if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();const buttons=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],index=buttons.indexOf(document.activeElement as HTMLButtonElement);
    buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
  }}>{popup.kind==='menu'&&menu?<>
    <button type="button" role="menuitem" onClick={()=>{nameFocus.current=true;setActiveId(menu.id);close(false);}}><Pencil/>Rename</button>
    <button type="button" role="menuitem" onClick={()=>{save([...menus,duplicateMenu(menu,()=>crypto.randomUUID())]);setNotice('Menu duplicated.');close();}}><Copy/>Duplicate</button>
    <button type="button" role="menuitem" className="section-delete" disabled={menus.length<=1} onClick={()=>{const next=menus.filter(value=>value.id!==menu.id);save(next,{header:placement.header===menu.id?next[0]?.id:placement.header,footer:placement.footer===menu.id?next[0]?.id:placement.footer});setNotice('Menu deleted. Undo is available in the top bar.');close();}}><Trash2/>Delete menu</button>
  </>:item&&active?<>
    <button type="button" role="menuitem" onClick={()=>{setEditing({menuId:active.id,item});close(false);}}><Pencil/>Edit link</button>
    <button type="button" role="menuitem" className="section-delete" onClick={()=>{changeMenu(active.id,menu=>({...menu,items:menu.items.filter(value=>value.id!==item.id&&value.parentId!==item.id)}));setNotice('Link and its sublinks deleted. Undo is available in the top bar.');close();}}><Trash2/>{active.items.some(value=>value.parentId===item.id)?'Delete link + sublinks':'Delete link'}</button>
  </>:null}</div>,document.body);
  const frame=(children:ReactNode)=><div className="menu-manager-root" ref={root}>{children}{notice&&<p className="menu-notice" role="status">{notice}</p>}{popupUI}</div>;
  if(editing){
    const owner=menus.find(menu=>menu.id===editing.menuId),current=owner?.items.find(item=>item.id===editing.item.id),value=current||editing.item;
    if(!owner)return frame(back('Your menus',()=>{setEditing(null);setActiveId(null);}));
    const write=(patch:Partial<MenuItem>)=>{const next={...value,...patch};if(editing.isNew)setEditing({...editing,item:next});else changeMenu(owner.id,menu=>({...menu,items:menu.items.map(item=>item.id===value.id?next:item)}));};
    const parents=owner.items.filter(item=>!item.parentId&&item.id!==value.id),siblings=orderedMenuItems(owner.items).filter(item=>(item.parentId||null)===(value.parentId||null)&&item.id!==value.id);
    return frame(<>{back(owner.name||'Your menu',()=>setEditing(null))}<h3 tabIndex={-1}>{editing.isNew?'Add link':'Edit link'}</h3>
      <label className="field"><span>Link text</span><input autoFocus value={value.text} maxLength={30} onChange={e=>write({text:e.target.value})}/></label>
      <label className="field"><span>Opens</span><select value={value.linkTo} onChange={e=>{const kind=e.target.value as MenuItem['linkTo'];write({linkTo:kind,destination:kind==='page'?`/${pages[0]?.slug||'home'}`:kind==='section'?'#services':'',pageId:kind==='page'?pages[0]?.id:undefined});}}><option value="page">Website page</option><option value="section">Section on this page</option><option value="url">Web address</option></select></label>
      {value.linkTo==='page'?<label className="field"><span>Page</span><select value={value.pageId||pages.find(page=>`/${page.slug}`===value.destination)?.id||''} onChange={e=>{const page=pages.find(page=>page.id===e.target.value);write({pageId:e.target.value,destination:`/${pageSlug(page?.slug||page?.name||'page')}`});}}><option value="" disabled>Choose a page</option>{pages.map(page=><option key={page.id} value={page.id}>{page.name}</option>)}</select></label>:value.linkTo==='section'?<label className="field"><span>Section</span><select value={value.destination} onChange={e=>write({destination:e.target.value})}>{site.blocks.filter(block=>!['header','footer'].includes(block.type)).map(block=><option key={block.id} value={`#${block.id}`}>{catalog.find(section=>section.id===block.type)?.label||(block.type==='hero'?'Main introduction':block.type)}</option>)}</select></label>:<label className="field"><span>Web address</span><input type="url" value={value.destination} placeholder="https://example.com" onChange={e=>write({destination:e.target.value})}/></label>}
      <label className="field"><span>Show under</span><select value={value.parentId||''} onChange={e=>{const parentId=e.target.value;if(editing.isNew)write({parentId:parentId||null});else{const target=parentId||parents.at(-1)?.id;if(target)move(value.id,{id:target,drop:parentId?'inside':'after'});}}}><option value="">Main level</option>{placement.footer!==owner.id&&!owner.items.some(item=>item.parentId===value.id)&&parents.map(parent=><option key={parent.id} value={parent.id}>{parent.text||'Untitled link'}</option>)}</select></label>
      {!editing.isNew&&siblings.length>0&&<label className="field"><span>Position</span><select value="" onChange={e=>{if(e.target.value)move(value.id,{id:e.target.value.slice(2),drop:e.target.value.startsWith('b:')?'before':'after'});}}><option value="">Choose position…</option>{siblings.map(sibling=><option key={sibling.id} value={`b:${sibling.id}`}>Before {sibling.text}</option>)}<option value={`a:${siblings.at(-1)!.id}`}>After {siblings.at(-1)!.text}</option></select></label>}
      {editing.isNew&&<button type="button" className="wide is-primary" disabled={!value.text.trim()||(value.linkTo==='url'&&!/^https?:\/\//i.test(value.destination))} onClick={()=>{if(!value.parentId&&placement.header===owner.id&&owner.items.filter(item=>!item.parentId).length>=5){setNotice('This header supports 5 main links. Choose a parent under Show under.');return;}changeMenu(owner.id,menu=>({...menu,items:[...menu.items,value]}));setEditing(null);}}>Add link</button>}
      <details className="menu-help"><summary>Reorder or nest links</summary><p>Drag a link up or down. Move it right to nest, or left to make it a main link. You can also use Show under and Position.</p></details>
    </>);
  }
  if(creating)return frame(<>{back('Your menus',()=>setCreating(false))}<h3 tabIndex={-1}>Add menu</h3><label className="field"><span>Menu name</span><input autoFocus value={name} maxLength={40} placeholder="e.g. Resources" onChange={e=>setName(e.target.value)}/></label><p className="helper-text">Only you see this name.</p><button type="button" className="wide is-primary" disabled={!name.trim()} onClick={()=>{const menu:NamedMenu={id:crypto.randomUUID(),name:name.trim(),items:[]};save([...menus,menu]);setActiveId(menu.id);setCreating(false);}}>Add menu</button></>);
  if(active)return frame(<>{back('Your menus',()=>{setActiveId(null);setNotice('');})}
    <label className="field"><span>Menu name</span><input aria-label="Menu name" value={active.name} maxLength={40} onChange={e=>changeMenu(active.id,menu=>({...menu,name:e.target.value}))}/></label>
    <p className="menu-context">{[placement.header===active.id?'Header':'',placement.footer===active.id?'Footer':''].filter(Boolean).join(' · ')||'Not used'} · {items.length} links</p>
    <div className="menu-items-list" role="list" aria-label={`${active.name} links`} onKeyDown={e=>{if(e.key==='Escape')finishPointer(true);}} onPointerMove={pointMove} onPointerUp={()=>finishPointer()} onPointerCancel={()=>finishPointer(true)}>
      {items.map(item=><div key={item.id} className={`menu-item-row${item.parentId?' is-submenu':''}`} role="listitem" data-menu-item={item.id} data-dragging={drag===item.id||undefined} data-drop={over?.id===item.id?over.drop:undefined}>
        <button type="button" className="menu-item-info-btn" aria-label={`Edit ${item.text||'Untitled link'}`} aria-describedby="menu-drag-help" onPointerDown={e=>{if(e.button!==0||e.pointerType==='touch')return;pointer.current={id:item.id,x:e.clientX,y:e.clientY,started:false,target:null};e.currentTarget.setPointerCapture(e.pointerId);}} onClick={()=>{if(!suppressClick.current)setEditing({menuId:active.id,item});}} onKeyDown={e=>{
          if(!e.altKey||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const index=items.findIndex(value=>value.id===item.id);
          if(e.key==='ArrowLeft'&&item.parentId)move(item.id,{id:item.parentId,drop:'after'});
          else if(e.key==='ArrowRight'){const previous=items.slice(0,index).filter(value=>!value.parentId).at(-1);if(previous)move(item.id,{id:previous.id,drop:'inside'});}
          else {const peers=items.filter(value=>(value.parentId||null)===(item.parentId||null)),at=peers.findIndex(value=>value.id===item.id),target=peers[at+(e.key==='ArrowUp'?-1:1)];if(target)move(item.id,{id:target.id,drop:e.key==='ArrowUp'?'before':'after'});}
        }}>{item.parentId?<CornerDownRight size={15} aria-hidden="true"/>:<LinkIcon size={15} aria-hidden="true"/>}<span><strong>{item.text||'Untitled link'}</strong><small>{destination(item)}</small></span></button>
        {more(item.id,'item',item.text||'Untitled link')}
      </div>)}
    </div>
    {!items.length&&<p className="helper-text">Add your first link.</p>}
    <button type="button" className="wide menu-add" onClick={()=>setEditing({menuId:active.id,isNew:true,item:{id:crypto.randomUUID(),text:'',linkTo:'page',destination:`/${pages[0]?.slug||'home'}`,pageId:pages[0]?.id,parentId:null,icon:'none'}})}><Plus size={16} aria-hidden="true"/>Add link</button>
    <small id="menu-drag-help" className="menu-drag-help">Drag to reorder or nest. <span className="sr-only">Keyboard: Alt with Up or Down reorders; Left promotes; Right nests. On touch, edit a link to use Show under and Position.</span></small>
    {drag&&over&&<p className="menu-drop-hint" role="status">{over.drop==='inside'?`Nest inside ${items.find(item=>item.id===over.id)?.text}`:`Move ${over.drop} ${items.find(item=>item.id===over.id)?.text}`}</p>}
  </>);
  return frame(<><h3 tabIndex={-1}>Your menus</h3><div className="menus-cards-list" role="list">{menus.map(menu=><div key={menu.id} className="menu-card" role="listitem">
    <span className="menu-card-icon" aria-hidden="true">{menu.id===placement.footer?<LinkIcon size={17}/>:<MenuIcon size={17}/>}</span>
    <button type="button" className="menu-card-select-btn" onClick={()=>{setActiveId(menu.id);setNotice('');}}><strong className="menu-card-name">{menu.name||'Untitled menu'}</strong><span className="menu-card-meta">{menu.items.length} items · {[placement.header===menu.id?'Header':'',placement.footer===menu.id?'Footer':''].filter(Boolean).join(' / ')||'Not used'}</span></button>
    {more(menu.id,'menu',menu.name||'Untitled menu')}
  </div>)}</div><button type="button" className="wide menu-add" onClick={()=>{setName('');setCreating(true);}}><Plus size={16} aria-hidden="true"/>Add menu</button></>);
}
