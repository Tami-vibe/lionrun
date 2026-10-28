"use client";
import type {ReactNode} from 'react';
import {useEditScope} from "./edit-scope";

export function Field({ label, value, onChange, multiline = false, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: "text" | "email" | "tel";
}) {
  const scope = useEditScope();
  return <label className="field"><span>{label}</span>{multiline ? <textarea rows={3} value={value} {...scope} onChange={e => onChange(e.target.value)}/> : <input type={type} value={value} {...scope} onChange={e => onChange(e.target.value)}/>}</label>;
}
export function SidebarSelect<T extends string>({ label, value, options, onChange }: {label: string; value: T; options: {value: T; label: string}[]; onChange: (v: T) => void}) {
  return <div className="field" role="group" aria-label={label}><span>{label}</span><div className="choice-group">{options.map(o => <button type="button" key={o.value} className={value === o.value ? "choice-active" : ""} aria-pressed={value===o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div></div>;
}
export function SidebarSlider({label, min, max, step = 1, value, text = String(value), onChange}:{label: string; min: number; max: number; step?: number; value: number; text?: string; onChange: (value: number) => void}) {
  const scope = useEditScope();
  return <label className="field"><span>{label}: {text}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} {...scope} onChange={event => onChange(Number(event.target.value))} /></label>;
}
export function UnitField({label,value,min,max,step=1,change,clear,unit,placeholder='Theme default'}:{label:ReactNode;value?:number;min:number;max:number;step?:number;change:(n:number)=>void;clear?:()=>void;unit?:string;placeholder?:string}) {
  const scope=useEditScope();
  return <label className="field"><span>{label}</span><span className="unit-input"><input type="number" min={min} max={max} step={step} value={value??''} placeholder={placeholder} {...scope} onChange={e=>{if(e.target.value!=='')change(Math.max(min,Math.min(max,Number(e.target.value))));else clear?.();}}/>{unit&&<small>{unit}</small>}</span></label>;
}


export function ColorField({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) {
  const scope = useEditScope();
  return <label className="field"><span>{label}</span><input type="color" value={value} {...scope} onChange={event => onChange(event.target.value)}/></label>;
}
