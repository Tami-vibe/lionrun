"use client";
import type {ReactNode} from 'react';
import {useEditScope} from "./edit-scope";
import {appearanceValue, type AppearanceField} from '../../site/layout-contract';
import type {BlockContent} from '../../site/contracts';
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
  return <label className="field"><span>{label}: {text}</span><input aria-label={label} aria-valuetext={text} type="range" min={min} max={max} step={step} value={value} {...scope} onChange={event => onChange(Number(event.target.value))} /></label>;
}
export function UnitField({label,value,min,max,step=1,change,clear,unit,placeholder='Theme default'}:{label:ReactNode;value?:number;min:number;max:number;step?:number;change:(n:number)=>void;clear?:()=>void;unit?:string;placeholder?:string}) {
  const scope=useEditScope();
  return <label className="field"><span>{label}</span><span className="unit-input"><input type="number" min={min} max={max} step={step} value={value??''} placeholder={placeholder} {...scope} onChange={e=>{if(e.target.value!=='')change(Math.max(min,Math.min(max,Number(e.target.value))));else clear?.();}}/>{unit&&<small>{unit}</small>}</span></label>;
}


export function ColorField({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) {
  const scope = useEditScope();
  return <label className="field"><span>{label}</span><input type="color" value={value} {...scope} onChange={event => onChange(event.target.value)}/></label>;
}

export {SidebarSlider as RangeControl};


/** Values remain typed scalars; no form state or persisted copy lives in the renderer. */
export function AppearanceFields({fields, content, change}: {
  fields: readonly AppearanceField[];
  content: BlockContent;
  change: (patch: Partial<BlockContent>) => void;
}) {
  return fields.map(field => {
    const value = appearanceValue(field, content[field.key]);
    const write = (next: unknown) => change({[field.key]: appearanceValue(field, next)});
    return (
      <div key={field.key}>
        {field.kind === 'choice' && (
          <SidebarSelect
            label={field.label}
            value={String(value)}
            options={(field.options || []).map(([item, label]) => ({value: String(item), label}))}
            onChange={next => write(field.options?.find(([item]) => String(item) === next)?.[0])}
          />
        )}
        {field.kind === 'range' && (
          <SidebarSlider
            label={field.label}
            value={Number(value)}
            text={`${value}${field.unit || ''}`}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step}
            onChange={write}
          />
        )}
        {field.kind === 'number' && (
          <UnitField label={field.label} value={Number(value)} min={field.min ?? 0} max={field.max ?? 100}
            step={field.step} unit={field.unit} change={write} />
        )}
        {field.kind === 'toggle' && (
          <label className="switch-row">
            <span>{field.label}</span>
            <input type="checkbox" role="switch" checked={value === true}
              onChange={event => write(event.target.checked)} />
          </label>
        )}
        {field.hint && <p className="helper-text">{field.hint}</p>}
      </div>
    );
  });
}
