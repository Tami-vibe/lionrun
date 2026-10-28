"use client";
import {useId, useState, type DragEvent} from 'react';
import {FolderOpen, CloudUpload, ChevronRight, Link2, X} from 'lucide-react';

/** Shared import surface. Owners retain their validation, limits and save behavior. */
export function MediaUpload({accept,onFiles,onLink,onLibrary,busy=false,blocked=false,multiple=true,status='',label='Upload from device',dropHint='or drop a photo or video'}:{
  accept:string;onFiles:(files:File[])=>void;onLink?:(value:string)=>boolean;onLibrary?:()=>void;
  dropHint?:string;busy?:boolean;blocked?:boolean;multiple?:boolean;status?:string;label?:string;
}) {
  const [over,setOver]=useState(false),[linking,setLinking]=useState(false),[link,setLink]=useState('');
  const id=useId(),disabled=busy||blocked;
  const uploadLabel=/^Add images(?: or videos)?$/.test(label)?'Upload from device':label;
  const take=(files:File[],text='')=>{if(disabled)return;if(files.length)onFiles(multiple?files:files.slice(0,1));else if(text.trim()&&onLink?.(text.trim())){setLink('');setLinking(false);}};
  const drop=(event:DragEvent)=>{event.preventDefault();setOver(false);take([...event.dataTransfer.files],event.dataTransfer.getData('text/uri-list')||event.dataTransfer.getData('text/plain'));};
  return <div className="media-upload" aria-busy={busy}>
    <div className={`media-upload-surface${over&&!disabled?' is-over':''}`} data-disabled={disabled||undefined}
      onDragOver={e=>{e.preventDefault();if(!disabled)setOver(true);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOver(false);}} onDrop={drop}
      onPaste={e=>{if((e.target as HTMLElement).closest('input,textarea'))return;const files=[...e.clipboardData.files];const text=e.clipboardData.getData('text/plain');if(files.length||text){e.preventDefault();take(files,text);}}}>
      <CloudUpload className="media-upload-symbol" size={24} aria-hidden="true"/>
      <label className="media-upload-primary" aria-disabled={disabled||undefined}>{busy?'Adding your file…':uploadLabel}
        <input aria-label={uploadLabel===label?label:`${uploadLabel}: ${label}`} type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={e=>{const files=[...(e.target.files||[])];e.target.value='';take(files);}}/>
      </label>
      <p>{over&&!disabled?'Release to add your files':dropHint}</p>
    </div>
    {(onLibrary||onLink)&&<div className="media-upload-secondary">
      {onLink&&<button type="button" disabled={disabled} aria-expanded={linking} onClick={()=>setLinking(v=>!v)}><Link2 size={17} aria-hidden="true"/><span>Use a link</span><ChevronRight size={15} aria-hidden="true"/></button>}
      {onLibrary&&<button type="button" disabled={disabled} onClick={onLibrary} aria-label="Your uploads · Choose from library"><FolderOpen size={17} aria-hidden="true"/><span>Your uploads</span><ChevronRight size={15} aria-hidden="true"/></button>}
    </div>}
    {busy&&<div className="media-upload-progress" role="status">Adding your file…</div>}
    {status&&<p className="media-upload-status" role="status">{status}</p>}
    {linking&&onLink&&<form className="media-upload-link" aria-labelledby={id} onSubmit={e=>{e.preventDefault();take([],link);}}>
      <div className="media-upload-link-heading"><strong id={id}>Add a file link</strong><button type="button" aria-label="Close file link" onClick={()=>setLinking(false)}><X size={16} aria-hidden="true"/></button></div>
      <label className="field"><span>Image or video link</span><input autoFocus aria-label="Image or video link" inputMode="url" value={link} placeholder="https://example.com/photo.jpg" onChange={e=>setLink(e.target.value)}/></label>
      <p className="helper-text">Paste a direct photo or video file link.</p>
      <button type="submit" disabled={disabled||!link.trim()}>Preview this file</button>
    </form>}
  </div>;
}
