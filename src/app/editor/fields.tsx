"use client";
import {createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {ChevronDown, Link, Mail, Phone} from 'lucide-react';
import {IconName} from '../site/blocks';
import {iconChoices, IconGlyph} from '../site/icons';
import {destinationBody, destinationGuidance, destinationKind, destinationWarning, sectionAnchorName, sectionTargets, storedDestination, withDestinationKind, withLinkMode, type DestinationKind, type LinkMode} from './destination';
import {catalog as sections} from '../site/catalog';

export type EditScope = {id?: string};
export type EditScopeApi = {claim:(id:string)=>void; release:(id:string)=>void};
export const EditScopeContext = createContext<EditScopeApi | null>(null);
export function useEditScope() {
  const scope = useContext(EditScopeContext);
  const id = useId();
  return {
    onFocus: () => scope?.claim(id),
    onBlur: () => scope?.release(id),
  };
}

export function Field({ label, value, onChange, multiline = false, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: "text" | "email" | "tel";
}) {
  const scope = useEditScope();
  return <label className="field"><span>{label}</span>{multiline ? <textarea rows={3} value={value} {...scope} onChange={e => onChange(e.target.value)}/> : <input type={type} value={value} {...scope} onChange={e => onChange(e.target.value)}/>}</label>;
}
export function Choice<T extends string>({ label, value, options, onChange }: {label: string; value: T; options: {value: T; label: string}[]; onChange: (v: T) => void}) {
  return <div className="field" role="group" aria-label={label}><span>{label}</span><div className="choice-group">{options.map(o => <button type="button" key={o.value} className={value === o.value ? "choice-active" : ""} aria-pressed={value===o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div></div>;
}
export function Toggle({label,checked,change,hint}:{label:string;checked:boolean;change:(checked:boolean)=>void;hint?:string}) {
  return <label className="visibility-toggle">
    <div className="toggle-info">
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </div>
    <input type="checkbox" role="switch" checked={checked} onChange={e=>change(e.target.checked)}/>
  </label>;
}
export function Fold({icon, label, note, disabled, open, children}:{icon?: ReactNode; label: string; note?: string; disabled?: boolean; open?: boolean; children?: ReactNode}) {
  return (
    <details className={disabled ? 'editor-fold is-disabled' : 'editor-fold'} open={open || undefined}>
      <summary aria-disabled={disabled || undefined} onClick={disabled ? event => event.preventDefault() : undefined}>
        {icon}<span>{label}</span>{note && <span className="fold-note">{note}</span>}<ChevronDown size={16} className="fold-chevron" aria-hidden="true" />
      </summary>
      {!disabled && children}
    </details>
  );
}
export function RangeControl({label, min, max, step = 1, value, text, onChange}:{label: string; min: number; max: number; step?: number; value: number; text: string; onChange: (value: number) => void}) {
  const scope = useEditScope();
  return <label className="field"><span>{label}: {text}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} {...scope} onChange={event => onChange(Number(event.target.value))} /></label>;
}
const destinationKinds: {id: DestinationKind; label: string; icon: typeof Link; tip: string}[] = [{id:"link", label:"Link", icon:Link, tip:"Website address or section link"},{id:"phone", label:"Call", icon:Phone, tip:"Opens the visitor's calling app."},{id:"email", label:"Email", icon:Mail, tip:"Opens the visitor's email app."}];
export function Destination({label = "Destination", value, onChange, sections: pageSections, linksOnly = false}:{label?: string; value: string; onChange: (value: string) => void; sections?: {id: string; type: string}[]; linksOnly?: boolean}) {
  const scope = useEditScope();
  const helpId = useId();
  const warningId = useId();
  const labelId = useId();
  const [checked, setChecked] = useState(() => destinationWarning(value) !== "");
  const kind = linksOnly ? "link" : destinationKind(value);
  const targets = sectionTargets(pageSections?.length ? pageSections : sections.map(section => ({id: section.id, type: section.id})));
  const recognized = sectionAnchorName(value);
  const inferred: LinkMode | null = kind !== "link" ? null : recognized ? "section" : value.trim() ? "website" : null;
  const [chosenMode, setChosenMode] = useState<LinkMode | null>(null);
  const linkChoice = inferred ?? chosenMode ?? "section";
  const guidance = destinationGuidance(value, kind === "link" ? linkChoice : undefined);
  const warning = destinationWarning(value);
  const showWarning = checked && warning !== "";
  const describedBy = showWarning ? `${helpId} ${warningId}` : helpId;
  const currentAnchor = value.trim();
  const known = targets.some(target => target.anchor.toLowerCase() === currentAnchor.toLowerCase());
  const options = recognized && !known ? [{anchor: currentAnchor, label: recognized}, ...targets] : targets;
  const selectedAnchor = targets.find(target => target.anchor.toLowerCase() === currentAnchor.toLowerCase())?.anchor ?? (recognized ? currentAnchor : "");
  const chooseKind = (nextKind: DestinationKind) => {
    setChecked(false);
    const next = withDestinationKind(value, nextKind);
    if (next !== value) onChange(next);
  };
  const chooseMode = (mode: LinkMode) => {
    setChecked(false);
    setChosenMode(mode);
    const next = withLinkMode(value, mode);
    if (linksOnly && destinationKind(value) !== "link") onChange("");
    else if (next !== value) onChange(next);
  };
  const inputLabel = linksOnly ? "Review website" : kind === "phone" ? "Phone number" : kind === "email" ? "Email address" : "Website address";
  const incompatible = linksOnly && destinationKind(value) !== "link";
  return <div className="field">
    <span id={labelId}>{label}</span>
    {!linksOnly && <div className="destination-kind" role="group" aria-labelledby={labelId}>{destinationKinds.map(item => { const Glyph = item.icon; return <button type="button" key={item.id} title={item.tip} aria-pressed={kind===item.id} onClick={() => chooseKind(item.id)}><Glyph size={16} strokeWidth={1.75} aria-hidden="true"/>{item.label}</button>; })}</div>}
    {kind === "link" && <div className="destination-mode" role="group" aria-label="Link type">{((linksOnly ? [["website", "Website"], ["section", "Page section"]] : [["section", "Section on this page"], ["website", "Website address"]]) as ["website" | "section", string][]).map(([mode, text]) => <button type="button" key={mode} aria-pressed={linkChoice===mode} onClick={() => chooseMode(mode)}>{text}</button>)}</div>}
    {kind === "link" && linkChoice === "section"
      ? <select aria-label="Section on this page" aria-describedby={describedBy} value={selectedAnchor} {...scope} onChange={event => { setChecked(false); onChange(event.target.value); }} onBlur={() => { scope.onBlur(); setChecked(true); }}><option value="">Choose a section</option>{options.map(option => <option key={option.anchor} value={option.anchor}>{option.label}</option>)}</select>
      : <input aria-label={inputLabel} aria-describedby={describedBy} inputMode={kind==="phone" ? "tel" : kind==="email" ? "email" : "url"} value={incompatible ? value : destinationBody(value)} {...scope} onChange={event => { setChecked(false); onChange(incompatible || linksOnly ? event.target.value : storedDestination(kind, event.target.value)); }} onBlur={() => { scope.onBlur(); setChecked(true); }}/>}
    <p id={helpId} className="helper-text">{incompatible ? "Review links open a page or a section on this page." : linksOnly && linkChoice === "website" && value.trim() ? "Opens your customer reviews." : guidance}</p>
    {showWarning && <p id={warningId} className="helper-text" role="status">{warning}</p>}
  </div>;
}
export function IconPicker({label, value, onChange, options, compact = false}:{label:string; value:IconName; onChange:(icon:IconName)=>void; options:readonly IconName[]; compact?: boolean}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const allowed = new Set(options);
  const choices = iconChoices.filter(choice => allowed.has(choice.id));
  const current = choices.find(choice => choice.id === value) || iconChoices.find(choice => choice.id === value) || iconChoices[0];
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const keys = (event: KeyboardEvent) => { if (event.key !== "Escape") return; event.preventDefault(); setOpen(false); trigger.current?.focus(); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", keys);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", keys); };
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const button = trigger.current;
      const panel = root.current?.querySelector(".icon-picker-panel");
      if (!button || !(panel instanceof HTMLElement)) return;
      const bounds = button.closest(".panelbody")?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
      const box = button.getBoundingClientRect();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const left = Math.max(bounds.left + 8, Math.min(box.left, bounds.right - width - 8));
      const below = bounds.bottom - box.bottom;
      const top = below >= height + 8 || box.top - bounds.top < height + 8 ? box.bottom + 8 : box.top - height - 8;
      panel.style.left = `${left}px`;
      panel.style.top = `${Math.max(bounds.top + 8, Math.min(top, bounds.bottom - height - 8))}px`;
    };
    place();
    const scroller = trigger.current?.closest(".panelbody");
    scroller?.addEventListener("scroll", place);
    window.addEventListener("resize", place);
    return () => { scroller?.removeEventListener("scroll", place); window.removeEventListener("resize", place); };
  }, [open]);
  const addIcon = compact && value === "none";
  return <div className={compact ? "icon-picker is-compact" : "field icon-picker"} ref={root}>{!compact && <span>{label}</span>}<button ref={trigger} type="button" className={addIcon ? "icon-picker-trigger is-add" : "icon-picker-trigger"} title={addIcon ? "Add icon" : current.label} aria-label={addIcon ? "Add icon" : `${label}, ${current.label}`} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(shown=>!shown)}>{addIcon ? "Add icon" : <IconGlyph name={current.id} size={compact ? 16 : 18}/>}</button>{open&&<IconGrid label={label} choices={choices} value={value} onChange={icon=>{onChange(icon); setOpen(false); trigger.current?.focus();}}/>}</div>;
}
function IconGrid({label, choices, value, onChange}:{label:string; choices:{id:IconName; label:string}[]; value:IconName; onChange:(icon:IconName)=>void}) {
  const selected = Math.max(0, choices.findIndex(choice => choice.id === value));
  const [cursor, setCursor] = useState(selected);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => { buttons.current[cursor]?.focus(); }, [cursor]);
  return <div className="icon-picker-panel" role="dialog" aria-label={label} onKeyDown={event => {
    const columns = 5;
    const step = {ArrowRight:1, ArrowLeft:-1, ArrowDown:columns, ArrowUp:-columns, Home:-cursor, End:choices.length - 1 - cursor}[event.key];
    if (step === undefined) return;
    event.preventDefault();
    setCursor(Math.max(0, Math.min(choices.length - 1, cursor + step)));
  }}>{choices.map((choice, index) => <button type="button" key={choice.id} ref={node => { buttons.current[index] = node; }} className="icon-picker-option" title={choice.label} aria-label={choice.label} aria-pressed={choice.id===value} tabIndex={index===cursor?0:-1} onClick={()=>onChange(choice.id)}><IconGlyph name={choice.id}/></button>)}</div>;
}
