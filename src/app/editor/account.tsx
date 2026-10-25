"use client";
import {useEffect,useRef,useState} from 'react';
import {Field} from './fields';
export type AccountDetails={ownerName:string;email:string;brand:string;address:string;phone:string;hours:string};
export function Account({value,onClose,onSave,embedded=false}:{value:AccountDetails;onClose:()=>void;onSave:(next:AccountDetails)=>void;embedded?:boolean}) {
  const [draft,setDraft]=useState(value),panel=useRef<HTMLDivElement>(null);
  useEffect(()=>{panel.current?.querySelector('input')?.focus();const close=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[onClose]);
  const set=(key:keyof AccountDetails)=>(next:string)=>setDraft(d=>({...d,[key]:next}));
  return <div ref={panel} className="account-form" aria-label="Business profile">
    {!embedded&&<button type="button" className="subtle-action" onClick={onClose}>Back</button>}
    {!embedded&&<h2>Business profile</h2>}
    <p className="account-note">Saved on this device. Saving writes the business name, address, phone, email, and hours onto every page. Address, phone, email, and hours replace the Contact section on each page.</p>
    <form onSubmit={e=>{e.preventDefault();onSave(draft);}}>
      <Field label="Your name" value={draft.ownerName} onChange={set('ownerName')}/>
      <Field label="Email address" value={draft.email} type="email" onChange={set('email')}/>
      <Field label="Business name" value={draft.brand} onChange={set('brand')}/>
      <Field label="Address" value={draft.address} multiline onChange={set('address')}/>
      <Field label="Phone" value={draft.phone} type="tel" onChange={set('phone')}/>
      <Field label="Opening hours" value={draft.hours} multiline onChange={set('hours')}/>
      <button className="publish-btn" type="submit">Save changes</button>
    </form>
  </div>;
}

const settingsPanes = [["profile","Profile"],["subscription","Subscription"],["usage","AI usage"],["billing","Billing"],["preferences","Preferences"]] as const;
type SettingsPane = typeof settingsPanes[number][0];

export function SettingsDialog({value,onClose,onSave}:{value:AccountDetails;onClose:()=>void;onSave:(next:AccountDetails)=>void}) {
  const [pane,setPane]=useState<SettingsPane>("profile");
  const bind=(node:HTMLDialogElement|null)=>{if(node&&!node.open)node.showModal();};
  return <dialog ref={bind} className="settings-dialog" aria-labelledby="settings-title" onCancel={event=>{event.preventDefault();onClose();}}>
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Account">
        <h2 id="settings-title">Settings</h2>
        {settingsPanes.map(([id,label])=><button type="button" key={id} aria-current={pane===id?"page":undefined} onClick={()=>setPane(id)}>{label}</button>)}
      </nav>
      <div className="settings-pane">
        <button type="button" className="subtle-action settings-close" onClick={onClose}>Close</button>
        <h2 className="settings-heading">{settingsPanes.find(item=>item[0]===pane)?.[1]}</h2>
        {pane==="profile"&&<Account embedded value={value} onClose={onClose} onSave={onSave}/>}
        {pane==="subscription"&&<p>Subscription details are not connected to this editor.</p>}
        {pane==="usage"&&<p>Usage unavailable</p>}
        {pane==="billing"&&<p>Billing is not available in this editor.</p>}
        {pane==="preferences"&&<p>This editor keeps its own type and colors. Website theme is the Light and Dark control in the toolbar, and it changes the website.</p>}
      </div>
    </div>
  </dialog>;
}
