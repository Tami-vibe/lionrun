"use client";
import {useEffect,useRef,useState} from 'react';
import {Field} from './fields';
export type AccountDetails={ownerName:string;email:string;brand:string;address:string;phone:string;hours:string};
export function Account({value,onClose,onSave}:{value:AccountDetails;onClose:()=>void;onSave:(next:AccountDetails)=>void}) {
  const [draft,setDraft]=useState(value),panel=useRef<HTMLElement>(null);
  useEffect(()=>{panel.current?.querySelector('input')?.focus();const close=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[onClose]);
  const set=(key:keyof AccountDetails)=>(next:string)=>setDraft(d=>({...d,[key]:next}));
  return <aside ref={panel} className="builder-sidebar account-panel" aria-label="Account">
    <button type="button" className="subtle-action" onClick={onClose}>← Back to Editor</button>
    <h2>Profile</h2>
    <p className="account-note">Saved on this device. The business name, address, phone, email, and hours are the details used on the website.</p>
    <form onSubmit={e=>{e.preventDefault();onSave(draft);}}>
      <Field label="Your name" value={draft.ownerName} onChange={set('ownerName')}/>
      <Field label="Email address" value={draft.email} type="email" onChange={set('email')}/>
      <Field label="Business name" value={draft.brand} onChange={set('brand')}/>
      <Field label="Address" value={draft.address} multiline onChange={set('address')}/>
      <Field label="Phone" value={draft.phone} type="tel" onChange={set('phone')}/>
      <Field label="Opening hours" value={draft.hours} multiline onChange={set('hours')}/>
      <button className="publish-btn" type="submit">Save changes</button>
    </form>
  </aside>;
}
