"use client";
import {createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {CheckCircle2,ChevronDown,ChevronRight,FileText,Image as ImageIcon,Link,Mail,Phone,Plus,Star,X} from 'lucide-react';
import {Block,BlockContent,BlockItem,ButtonData,Site,IconName,buttonIconSide,icons,servicePreviewCount} from '../site/blocks';
import {iconChoices, IconGlyph} from '../site/icons';
import {destinationBody, destinationGuidance, destinationKind, destinationWarning, sectionAnchorName, sectionTargets, storedDestination, withDestinationKind, withLinkMode, type DestinationKind, type LinkMode} from './destination';
import {ButtonPreview} from '../site/sections/elements';
import {catalog as sections} from '../site/catalog';
import {accentRamp, FooterColumn, linkedPage, pageSlug} from './settings';
import {MediaManager} from '../media/library';
import {mediaDefaults, mediaURL, type MediaSettings} from '../media/model';
import {countWarning, ratingSummary, scoreWarning} from './rating';
import {HeroMediaEditor} from './hero-media';
import {PageEntry} from './navigation';

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
type Change = (patch: Partial<BlockContent>) => void;
type Group = {id: string; label: string; hint: string};
const buttonsGroup: Group = {id:'buttons', label:'Buttons', hint:''};

export function Field({ label, value, onChange, multiline = false, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: "text" | "email" | "tel";
}) {
  const scope = useEditScope();
  return <label className="field"><span>{label}</span>{multiline ? <textarea rows={3} value={value} {...scope} onChange={e => onChange(e.target.value)}/> : <input type={type} value={value} {...scope} onChange={e => onChange(e.target.value)}/>}</label>;
}
export function Choice<T extends string>({ label, value, options, onChange }: {label: string; value: T; options: {value: T; label: string}[]; onChange: (v: T) => void}) {
  return <div className="field" role="group" aria-label={label}><span>{label}</span><div className="choice-group">{options.map(o => <button type="button" key={o.value} className={value === o.value ? "choice-active" : ""} aria-pressed={value===o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div></div>;
}
export function Toggle({label,checked,change}:{label:string;checked:boolean;change:(checked:boolean)=>void}) {
  return <label className="visibility-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={e=>change(e.target.checked)}/></label>;
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
function IconPicker({label, value, onChange, options, compact = false}:{label:string; value:IconName; onChange:(icon:IconName)=>void; options:readonly IconName[]; compact?: boolean}) {
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
function MediaSlot({label,value,used,onChange,onClear,hint}:{label:string;value:MediaSettings;used:string;onChange:(media:MediaSettings)=>void;onClear?:()=>void;hint?:string}) {
  return <><h3>{label}</h3>{hint&&<p className="helper-text">{hint}</p>}<MediaManager value={value} used={used} onChange={onChange}/>{value.src&&onClear&&<button type="button" onClick={onClear}>Remove media</button>}</>;
}
function MessageFields({content,change,intro=false}:{content:BlockContent;change:Change;intro?:boolean}) {
  return <><Field label={intro?'Small introduction':'Small label'} value={content.smallLabel} onChange={smallLabel=>change({smallLabel})}/><Field label="Headline" value={content.title} multiline onChange={title=>change({title})}/><Field label="Description" value={content.description} multiline onChange={description=>change({description})}/></>;
}
function ButtonText({button, onLabel, onIcon}:{button:ButtonData; onLabel:(label:string)=>void; onIcon:(icon:IconName)=>void}) {
  const scope = useEditScope();
  const labelId = useId();
  const side = buttonIconSide(button);
  const picker = <IconPicker compact label="Button icon" value={button.icon} onChange={onIcon} options={icons}/>;
  return <div className="field"><span id={labelId}>Button text</span><div className="button-wording" data-side={side}>{side==="left" && picker}<input className="button-wording-input" aria-labelledby={labelId} value={button.label} {...scope} onChange={event=>onLabel(event.target.value)}/>{side==="right" && picker}</div><p className="helper-text">Click the icon to change it.</p></div>;
}
function luminance(hex: string) {
  return [1, 3, 5].map(index => { const value = parseInt(hex.slice(index, index + 2), 16) / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrastRatio(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}
function mixHex(top: string, bottom: string, alpha: number) {
  const channel = (hex: string, index: number) => parseInt(hex.slice(index, index + 2), 16);
  return "#" + [1, 3, 5].map(index => Math.round(channel(top, index) * alpha + channel(bottom, index) * (1 - alpha)).toString(16).padStart(2, "0")).join("");
}
function darkerAccessible(color: string, against: string) {
  const darkened = (amount: number) => "#" + [1, 3, 5].map(index => Math.round(parseInt(color.slice(index, index + 2), 16) * (1 - amount)).toString(16).padStart(2, "0")).join("");
  if (contrastRatio(darkened(1), against) < 4.5) return "";
  let low = 0, high = 1, best = "";
  for (let step = 0; step < 12; step++) {
    const amount = (low + high) / 2, next = darkened(amount);
    if (contrastRatio(next, against) >= 4.5) { best = next; high = amount; } else low = amount;
  }
  return best;
}
function contrastAlternative(foreground: string, background: string) {
  if (!/^#[0-9a-f]{6}$/i.test(foreground) || !/^#[0-9a-f]{6}$/i.test(background) || contrastRatio(foreground, background) >= 4.5) return null;
  const lighterLabel = luminance(foreground) > luminance(background);
  const fill = lighterLabel ? darkerAccessible(background, foreground) : "";
  if (fill && contrastRatio(foreground, fill) >= 4.5) return {color: "", fill};
  const text = darkerAccessible(foreground, background);
  return text && contrastRatio(text, background) >= 4.5 ? {color: text, fill: ""} : null;
}
function previewImage(src: string) {
  const safe = mediaURL(src);
  return safe && !/["'()\\\s]/.test(safe) ? safe : "";
}
function buttonContext(block: Block, theme: "midnight" | "paper" | undefined, ramp: Record<number, string>) {
  const paper = theme !== "midnight", surface = paper ? "#fafafc" : "#1d242c", ink = paper ? "#252938" : "#f0f3fa";
  if (block.type === "promo") return {color: ramp[50], solid: ramp[900], style: {background: ramp[900], color: ramp[50]} as React.CSSProperties};
  if (block.type === "hero" && block.layout !== "split") {
    const image = previewImage(block.content.media?.src || "");
    const alpha = Math.min(1, Math.max(0, (block.content.darkness ?? 36) / 100));
    return {color: "#f2f5fa", solid: image ? "" : mixHex("#0b1420", surface, alpha), style: {color: "#f2f5fa", backgroundColor: "#0b1420", backgroundImage: image ? `linear-gradient(rgba(11,20,32,${alpha}),rgba(11,20,32,${alpha})),url("${image}")` : undefined, backgroundSize: "cover", backgroundPosition: "center"} as React.CSSProperties};
  }
  return {color: ink, solid: surface, style: {background: surface, color: ink} as React.CSSProperties};
}
function ButtonResult({button, primary, context, labelColor, fillColor, accentStyle, theme}:{button: ButtonData; primary: boolean; context: ReturnType<typeof buttonContext>; labelColor: string; fillColor: string; accentStyle: React.CSSProperties; theme?: "midnight" | "paper"}) {
  const [useAlternative, setUseAlternative] = useState(false);
  const alternative = contrastAlternative(primary ? labelColor : context.color, primary ? fillColor : context.solid);
  const style = {...accentStyle, ...(primary ? {} : context.style), ...(useAlternative && alternative?.fill ? {"--accent": alternative.fill} : {}), ...(useAlternative && alternative?.color ? {color: alternative.color, "--line": alternative.color} : {})} as React.CSSProperties;
  return <><div className={`site-preview button-result theme-${theme==="midnight"?"midnight":"paper"}`} data-context={primary ? undefined : "site"} style={style}><ButtonPreview button={button} primary={primary}/></div>{alternative && <p className="helper-text contrast-note" role="status"><span>Label contrast is too low. The website color is unchanged.</span><button type="button" aria-pressed={useAlternative} onClick={() => setUseAlternative(shown => !shown)}>{useAlternative ? "Show website colors" : "Preview darker alternative"}</button></p>}</>;
}
function IconPosition({value, onChange}:{value:"left"|"right"; onChange:(side:"left"|"right")=>void}) {
  const id = useId();
  const options = [{value:"left" as const, label:"Left"}, {value:"right" as const, label:"Right"}];
  return <div className="icon-position"><span id={id}>Icon position</span><div className="segmented" role="group" aria-labelledby={id}>{options.map(option => <button type="button" key={option.value} aria-pressed={value===option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div></div>;
}
function ButtonFields({block, change, sections: pageSections, accent, theme}:{block:Block; change:Change; sections:{id:string; type:string}[]; accent:string; theme?: "midnight" | "paper"}) {
  const c=block.content,write=(index:number,patch:Partial<ButtonData>)=>change({buttons:c.buttons.map((button,i)=>i===index?{...button,...patch}:button)});
  const fill = /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#7963ff";
  const ramp = accentRamp(fill);
  const context = buttonContext(block, theme, ramp);
  const accentStyle = {"--accent": fill, ...Object.fromEntries(Object.entries(ramp).map(([step, color]) => [`--accent-${step}`, color]))} as React.CSSProperties;
  return <>{block.type==='hero'&&['short','center'].includes(block.layout)&&<Toggle label="Show secondary button" checked={c.showSecondary!==false} change={showSecondary=>change({showSecondary})}/>}{c.buttons.filter((_,i)=>i===0||c.showSecondary!==false).map((button,i)=><div className="action-editor" key={i}><h3>{i?'Secondary button':'Primary button'}</h3><ButtonResult button={button} primary={i===0} context={context} labelColor={ramp[50]} fillColor={fill} accentStyle={accentStyle} theme={theme}/><ButtonText button={button} onLabel={label=>write(i,{label})} onIcon={icon=>write(i,{icon})}/>{button.icon!=='none' && <IconPosition value={buttonIconSide(button)} onChange={iconPosition=>write(i,{iconPosition})}/>}<Destination label="When clicked" value={button.href} onChange={href=>write(i,{href})} sections={pageSections}/></div>)}</>;
}
function proofBuckets(items:BlockItem[]) {
  return {reasons:items.filter(item=>item.group!=='stat'&&item.group!=='avatar'&&item.group!=='more'),stats:items.filter(item=>item.group==='stat'),avatars:items.filter(item=>item.group==='avatar'),more:items.filter(item=>item.group==='more')};
}
function itemMedia(block:Block) {
  return (['logos','services','about','pains','trust','reviews'].includes(block.type)||block.type==='solutions'&&block.layout==='Numbered steps')&&!['Icon cards','Price list','One message','Big numbers','Signals'].includes(block.layout);
}
function named(items:BlockItem[],noun:string,hint:string):Group[] {
  return items.map((item,i)=>({id:`item:${i}`,label:item.title.trim()||`${noun} ${i+1}`,hint}));
}

const highlightIcons = icons.filter(icon => icon !== "none");
function HighlightRow({index, fact, icon, onText, onIcon, onRemove}:{index:number; fact:string; icon:IconName; onText:(value:string)=>void; onIcon:(icon:IconName)=>void; onRemove:()=>void}) {
  const scope = useEditScope();
  return <>
    <IconPicker compact label={`Highlight icon ${index + 1}`} value={icon} onChange={onIcon} options={highlightIcons}/>
    <input aria-label={`Highlight ${index + 1}`} value={fact} {...scope} onChange={event => onText(event.target.value)}/>
    <button type="button" className="highlight-remove" aria-label={`Remove ${fact.trim() || `highlight ${index + 1}`}`} onClick={onRemove}><X size={16} aria-hidden="true"/></button>
  </>;
}
function HighlightEditor({facts, factIcons, onText, onIcon, onAdd, onRemove}:{facts:string[]; factIcons?:IconName[]; onText:(index:number, value:string)=>void; onIcon:(index:number, icon:IconName)=>void; onAdd:()=>void; onRemove:(index:number)=>void}) {
  return <div className="list-editor">
    <p className="helper-text">Add up to three short reasons customers choose you.</p>
    {!!facts.length && <div className="highlight-table"><span className="col">Icon</span><span className="col">Highlight</span><span/>{facts.map((fact, index) => <HighlightRow key={index} index={index} fact={fact} icon={factIcons?.[index] || "check"} onText={value => onText(index, value)} onIcon={icon => onIcon(index, icon)} onRemove={() => onRemove(index)}/>)}</div>}
    <div className="list-actions"><button type="button" className="highlight-add" disabled={facts.length >= 3} onClick={onAdd}><Plus size={16} aria-hidden="true"/>Add highlight</button><span>{facts.length} of 3 highlights</span></div>
    <p className="helper-text">Click an icon to replace it.</p>
  </div>;
}
function StatRow({index, value, label, onValue, onLabel}:{index:number; value:string; label:string; onValue:(value:string)=>void; onLabel:(value:string)=>void}) {
  const valueScope = useEditScope();
  const labelScope = useEditScope();
  return <>
    <input aria-label={`Value ${index + 1}`} value={value} {...valueScope} onChange={event => onValue(event.target.value)}/>
    <input aria-label={`Description ${index + 1}`} value={label} {...labelScope} onChange={event => onLabel(event.target.value)}/>
  </>;
}
function StatEditor({items, onChange}:{items:BlockItem[]; onChange:(index:number, patch:Partial<BlockItem>)=>void}) {
  return <div className="list-editor">
    <p className="helper-text">Show real figures that build confidence.</p>
    <div className="stat-table"><span className="col">Value</span><span className="col">Description</span>{[0, 1, 2].map(index => { const item = items[index]; return <StatRow key={index} index={index} value={item?.value || ""} label={item?.title || ""} onValue={value => onChange(index, {value})} onLabel={title => onChange(index, {title})}/>; })}</div>
    <p className="helper-text">Only include figures you can verify.</p>
  </div>;
}
function RatingRow({score, count, onScore, onCount}:{score:string; count:string; onScore:(value:string)=>void; onCount:(value:string)=>void}) {
  const scoreScope = useEditScope();
  const countScope = useEditScope();
  return <>
    <span className="col">Score</span><span className="col">Review count</span>
    <input aria-label="Score" inputMode="decimal" value={score} {...scoreScope} onChange={event => onScore(event.target.value)}/>
    <input aria-label="Review count" inputMode="numeric" value={count} {...countScope} onChange={event => onCount(event.target.value)}/>
  </>;
}
export function contentGroups(block:Block,site:Site,footerDefaults:FooterColumn[]):Group[] {
  const {type,layout,content:c}=block;
  const message:Group={id:'message',label:'Message',hint:'Introduction, headline, and description'};
  const withButtons=(groups:Group[])=>c.buttons.length&&type!=='header'&&type!=='quote'&&!(type==='proof'&&layout==='Photo and reasons')?[...groups,buttonsGroup]:groups;
  if(type==='header')return [{id:'name',label:'Menu name',hint:'The business name in the header. It is shared by every page.'},{id:'links',label:'Links',hint:'Up to five links'},{id:'logo',label:'Logo',hint:'Optional mark beside the name'}];
  if(type==='footer'){const columns=site.footerColumns||footerDefaults;return [...(!site.footerColumns?[{id:'details',label:'Business details',hint:'Name, phone, email, and location'}]:[]),...columns.map((column,i)=>({id:`column:${i}`,label:column.title.trim()||`Column ${i+1}`,hint:'Heading, text, and links'})),{id:'copyright',label:'Copyright',hint:'The line under the columns'},{id:'image',label:'Image',hint:'Optional picture above the columns'}];}
  if(type==='hero'){const groups:Group[]=[message,buttonsGroup,{id:'trust',label:'Reasons to trust you',hint:''}];if(layout==='story')groups.push({id:'statistics',label:'Your business in numbers',hint:''});const mediaCount=[c.media,...(c.slides||[])].filter(item=>item?.src).length;groups.push({id:'media',label:'Hero media',hint:mediaCount?`${mediaCount} item${mediaCount===1?'':'s'}`:''});if(layout==='story')groups.push({id:'story',label:'Story video',hint:'Plays when someone uses the story button'});groups.push({id:'rating',label:'Customer rating',hint:''});return groups;}
  if(type==='services')return [{id:'intro',label:'Introduction',hint:layout==='Photo cards'?'Headline and the note beside it':'Headline and the card link'},...named(c.items,'Service',layout==='Photo cards'?'Title, description, price, page, icon, and photo':'Title, description, price, page, and icon')];
  if(type==='logos')return withButtons([message,...named(c.items,'Logo','Name and picture')]);
  if(type==='proof'){if(layout!=='Photo and reasons')return withButtons([{...message,hint:''},{id:'promises',label:'Promises',hint:''},{id:'photo',label:'Media',hint:''}]);const {reasons,avatars}=proofBuckets(c.items);return [message,{id:'stats',label:'Numbers',hint:'Two numbers on the photo'},...[0,1,2].map(i=>({id:`avatar:${i}`,label:avatars[i]?.title.trim()||`Person ${i+1}`,hint:'Name and optional photo'})),{id:'more',label:'More people',hint:'Extra count beside the names'},...reasons.map((item,i)=>({id:`reason:${i}`,label:item.title.trim()||`Reason ${i+1}`,hint:'Title, description, and icon'})),{id:'links',label:'Links',hint:'A button and a text link'},{id:'photo',label:'Media',hint:''}];}
  if(type==='about')return [...(layout==='Photos only'?[]:[message]),{id:'filter',label:'Photo groups',hint:'The label for showing every photo'},...named(c.items,'Photo',layout==='Photos only'?'Caption, group, and picture':'Title, description, caption, group, and picture')];
  if(type==='pains')return withButtons([message,{id:'promise',label:'Promise',hint:'The sentence with the concerns'},...named(c.items,'Concern',layout==='One message'?'Title, description, tag, and icon':'Title, description, tag, icon, and photo')]);
  if(type==='solutions')return withButtons(layout==='Before and after'?[message,{id:'labels',label:'Labels',hint:'Before and after captions'},{id:'facts',label:'Facts',hint:'Three short points'},{id:'before',label:'Before image',hint:'The first picture'},{id:'after',label:'After image',hint:'The second picture'}]:[message,...named(c.items,'Step','Title, description, icon, and photo')]);
  if(type==='trust')return withButtons([message,...c.items.map((item,i)=>({id:`item:${i}`,label:item.title.trim()||item.value?.trim()||`Signal ${i+1}`,hint:layout==='Big numbers'?'Label, value, and note':layout==='Signals'?'Label, value, note, and icon':'Label, value, note, icon, and photo'}))]);
  if(type==='reviews')return withButtons([message,...named(c.items,'Review','Quote, name, service, date, source, details, stars, and photo')]);
  if(type==='quote')return [{id:'wording',label:'Wording',hint:'Introduction, note, button, and consent'},...c.fields.map((field,i)=>({id:`field:${i}`,label:field.label.trim()||`Field ${i+1}`,hint:'Label, answer type, and whether it is required'})),{id:'image',label:'Image',hint:'Picture beside the form'}];
  if(type==='faq')return withButtons([message,...named(c.items,'Question','Question and answer')]);
  if(type==='promo')return withButtons([message,{id:'offer',label:'Offer',hint:'Price, previous price, date, badge, and details'},{id:'image',label:'Background',hint:'Picture behind the offer'}]);
  if(type==='contact')return withButtons([message,{id:'details',label:'Contact details',hint:'Address, phone, email, and hours'},{id:'image',label:'Map image',hint:'Picture beside the details'}]);
  if(type==='closing')return withButtons([message,{id:'image',label:'Image',hint:'Saved with this section'}]);
  return withButtons([message]);
}

export function ContentBrowser({block,site,pages,update,change,footerDefaults,used,group,onOpen,home}:{block:Block;site:Site;pages:PageEntry<Site>[];update:(patch:Partial<Site>)=>void;change:Change;footerDefaults:FooterColumn[];used:string;group:string|null;onOpen:(id:string|null)=>void;home:boolean}) {
  const accordionBase=useId().replace(/:/g,"");
  const groups=contentGroups(block,site,footerDefaults),open=groups.some(item=>item.id===group)?group:null;
  const c=block.content,type=block.type;
  const buckets=proofBuckets(c.items);
  const itemChange=(index:number,patch:Partial<BlockItem>)=>change({items:c.items.map((item,i)=>i===index?{...item,...patch}:item)});
  const columns=()=>site.footerColumns||footerDefaults;
  const writeColumns=(next:FooterColumn[])=>update({footerColumns:next});
  const noun=type==='quote'?'form field':type==='proof'&&block.layout==='Photo and reasons'?'reason':type==='logos'?'logo':type==='services'?'service':type==='about'?'photo':type==='pains'?'concern':type==='solutions'&&block.layout==='Numbered steps'?'step':type==='trust'?'signal':type==='reviews'?'review':type==='faq'?'question':'';
  const capped=type==='quote'?c.fields.length>=12:type==='proof'&&block.layout==='Photo and reasons'?buckets.reasons.length>=6:type==='solutions'&&block.layout==='Numbered steps'?c.items.length>=5:type==='trust'&&block.layout==='Signals'?c.items.length>=3:['logos','services','about','pains','solutions','trust','reviews','faq'].includes(type)?c.items.length>=60:true;
  const add=()=>{
    if(type==='quote'){change({fields:[...c.fields,{label:'',type:'text',required:false}]});onOpen(`field:${c.fields.length}`);return;}
    if(type==='proof'){change({items:[...buckets.reasons,{title:'',description:'',icon:'check'},...buckets.stats,...buckets.avatars,...buckets.more]});onOpen(`reason:${buckets.reasons.length}`);return;}
    change({items:[...c.items,{title:'',description:'',icon:type==='solutions'?'check':'none'}]});onOpen(`item:${c.items.length}`);
  };
  const previewCount=servicePreviewCount(block.settings?.columns);
  const panel=(current:string)=>{
  const removeItem=(index:number)=>{change({items:c.items.filter((_,i)=>i!==index)});onOpen(null);};
  if(current==='message')return <MessageFields content={c} change={change} intro={type==='hero'}/>;
  if(current==='buttons')return c.buttons.length?<ButtonFields block={block} change={change} sections={site.blocks} accent={site.accent} theme={site.theme}/>:<p className="helper-text">This section has no separate buttons.</p>;
  if(current==='name')return <><Field label="Menu name" value={site.brand} onChange={brand=>update({brand})}/><p className="helper-text">This changes the business name on every page.</p></>;
  if(current==='links'&&type==='header')return <>{site.nav.map((name,i)=><div className="service-editor" key={i}>{linkedPage(pages,site.navTargets?.[i]||'',site.navPageIds?.[i])?<p>Page link: {linkedPage(pages,site.navTargets?.[i]||'',site.navPageIds?.[i])!.name}. Rename it in Page settings.</p>:<Field label={`Menu link ${i+1}`} value={name} onChange={label=>update({nav:site.nav.map((v,j)=>i===j?label:v)})}/>}<label className="field"><span>Where this button goes</span><select value={site.navTargets?.[i]||["#services","#proof","#contact"][i]||"#contact"} onChange={e=>update({navTargets:site.nav.map((_,j)=>i===j?e.target.value:site.navTargets?.[j]||["#services","#proof","#contact"][j]||"#contact")})}>{pages.map(p=><option key={p.id} value={`/${p.slug||pageSlug(p.name)}`}>{p.name} page</option>)}{sections.filter(s=>!["header","footer"].includes(s.id)).map(s=><option key={s.id} value={s.id==="hero"?"#top":`#${s.id}`}>{s.label}{site.hidden.includes(s.id)?" (hidden)":""}</option>)}</select></label><button type="button" className="subtle-action" aria-label={`Remove menu link ${i+1}`} onClick={()=>update({nav:site.nav.filter((_,j)=>i!==j),navChildren:site.nav.map((_,j)=>site.navChildren?.[j]||[]).filter((_,j)=>i!==j),navTargets:site.nav.map((_,j)=>site.navTargets?.[j]||["#services","#proof","#contact"][j]||"#contact").filter((_,j)=>i!==j)})}>Remove link</button></div>)}<button type="button" className="wide" disabled={site.nav.length>=5} onClick={()=>update({nav:[...site.nav,"New link"],navChildren:[...site.nav.map((_,i)=>site.navChildren?.[i]||[]),[]],navTargets:[...site.nav.map((_,i)=>site.navTargets?.[i]||["#services","#proof","#contact"][i]||"#contact"),"#contact"]})}>Add menu link</button>{site.nav.length>=5&&<p className="hint">The top menu has five links. Remove one to add another.</p>}</>;
  if(current==='logo')return <MediaSlot label="Logo" value={c.media} used={used} onChange={media=>change({media})} onClear={()=>change({media:{...mediaDefaults}})}/>;
  if(current==='trust') {
    const writeFact=(index:number,value:string)=>change({facts:c.facts.map((fact,i)=>i===index?value:fact)});
    const factIcon=(index:number,icon:IconName)=>change({factIcons:Array.from({length:c.facts.length},(_,i)=>i===index?icon:(c.factIcons?.[i]||'check'))});
    const addFact=()=>c.facts.length<3&&change({facts:[...c.facts,''],...(c.factIcons?{factIcons:[...c.factIcons,'check' as const]}:{})});
    const removeFact=(index:number)=>change({facts:c.facts.filter((_,i)=>i!==index),...(c.factIcons?{factIcons:c.factIcons.filter((_,i)=>i!==index)}:{})});
    return <HighlightEditor facts={c.facts} factIcons={c.factIcons} onText={writeFact} onIcon={factIcon} onAdd={addFact} onRemove={removeFact}/>;
  }
  if(current==='statistics'){
    const write=(index:number,patch:Partial<BlockItem>)=>{const blank:BlockItem={title:'',description:'',icon:'none'};const items=Array.from({length:Math.max(3,c.items.length)},(_,i)=>c.items[i]||blank);items[index]={...items[index],...patch};change({items});};
    return <StatEditor items={c.items} onChange={write}/>;
  }
  if(current==='media'&&type==='hero')return <HeroMediaEditor content={c} layout={block.layout} blockId={block.id} onChange={change}/>;
  if(current==='story')return <><Field label="Story button" value={c.note} onChange={note=>change({note})}/><Field label="Story length" value={c.badge||''} onChange={badge=>change({badge})}/><MediaSlot label="Story video" value={c.story||mediaDefaults} used={used} onChange={story=>change({story})} hint="Plays when a visitor chooses the story button. Playback choices are saved; this player still uses its own play settings."/></>;
  if(current==='rating'&&type==='hero'){
    const rating=c.rating||{score:'',count:'',href:''};
    const summary=ratingSummary(rating.score,rating.count);
    const note=scoreWarning(rating.score)||countWarning(rating.count);
    return <div className="list-editor">
      <label className="switch-row"><span>Show rating</span><input type="checkbox" role="switch" checked={!!c.rating&&c.showRating!==false} onChange={event=>change(event.target.checked?{showRating:true,rating:c.rating||{score:'',count:'',href:''}}:{showRating:false})}/></label>
      {!!c.rating&&c.showRating!==false&&<>
        <div className="stat-table"><RatingRow score={rating.score} count={rating.count} onScore={score=>change({rating:{...rating,score}})} onCount={count=>change({rating:{...rating,count}})}/></div>
        <p className="helper-text">Score out of 5.</p>
        {note&&<p className="helper-text" role="status">{note}</p>}
        {summary&&<p className="rating-summary"><Star size={16} aria-hidden="true"/>{summary}</p>}
        <Destination linksOnly label="Review destination" value={rating.href} onChange={href=>change({rating:{...rating,href}})} sections={site.blocks}/>
        <p className="helper-text">Use your actual score and review count.</p>
      </>}
    </div>;
  }
  if(current==='intro')return <><MessageFields content={c} change={change}/>{block.layout!=='Photo cards'&&<Field label="Link text" value={c.actionLabel||''} onChange={actionLabel=>change({actionLabel})}/>}{block.layout==='Photo cards'&&<Field label="Side note" value={c.note} multiline onChange={note=>change({note})}/>}</>;
  if(current==='promises')return <div className="promise-editor"><p className="helper-text">Three reasons customers choose you.</p>{[0,1,2].map(i=><label className="promise-row" key={i}><span className="promise-num" aria-hidden="true">{i+1}</span><CheckCircle2 size={18} className="promise-check" aria-hidden="true"/><input aria-label={`Promise ${i+1}`} value={c.facts[i]||''} onChange={event=>change({facts:Array.from({length:3},(_,j)=>j===i?event.target.value:c.facts[j]||'')})}/></label>)}</div>;
  if(current==='photo'&&type==='proof')return block.layout==='Promise band'?<p className="helper-text">This layout shows your promises without media. Select Text + media or Media + reasons in Style to show your saved media.</p>:<HeroMediaEditor compact content={c} layout={block.layout} blockId={block.id} onChange={change}/>;
  if(current==='stats'){const {reasons,stats,avatars,more}=buckets;const writeStat=(index:number,patch:Partial<BlockItem>)=>{const blank:BlockItem={title:'',description:'',icon:'none',group:'stat',value:''};const next=[0,1].map(i=>({...blank,...stats[i],...(i===index?patch:{})}));change({items:[...reasons,...next.filter(item=>(item.value||'').trim()||item.title.trim()),...avatars,...more]});};return <>{[0,1].map(i=><div key={i}><Field label={`Photo number ${i+1}`} value={stats[i]?.value||''} onChange={value=>writeStat(i,{value})}/><Field label={`Photo label ${i+1}`} value={stats[i]?.title||''} onChange={title=>writeStat(i,{title})}/></div>)}<p className="helper-text">The numbers and names are samples. Replace them with your own.</p></>;}
  if(current.startsWith('avatar:')){const index=Number(current.slice(7));const {reasons,stats,avatars,more}=buckets;const writeAvatar=(title:string)=>{const blank:BlockItem={title:'',description:'',icon:'none',group:'avatar'};change({items:[...reasons,...stats,...[0,1,2].map(i=>({...blank,...avatars[i],group:'avatar',...(i===index?{title}:{})})),...more]});};const avatar=avatars[index];return <><Field label={`Avatar ${index+1}`} value={avatar?.title||''} onChange={writeAvatar}/><p className="helper-text">A photo replaces the letters in the circle.</p><MediaManager value={avatar?.media||mediaDefaults} used={used} onChange={media=>{const next=[0,1,2].map(i=>({...(avatars[i]||{title:'',description:'',icon:'none' as const}),group:'avatar' as const,...(i===index?{media}:{})}));change({items:[...reasons,...stats,...next,...more]});}}/>{avatar?.media?.src&&<button type="button" onClick={()=>{const next=[0,1,2].map(i=>({...(avatars[i]||{title:'',description:'',icon:'none' as const}),group:'avatar' as const,...(i===index?{media:undefined}:{})}));change({items:[...reasons,...stats,...next,...more]});}}>Remove photo</button>}</>;}
  if(current==='more'){const {reasons,stats,avatars}=buckets;return <Field label="More people" value={buckets.more[0]?.value||''} onChange={value=>change({items:[...reasons,...stats,...[0,1,2].map(i=>avatars[i]||{title:'',description:'',icon:'none' as const,group:'avatar'}),{title:'',description:'',icon:'none',group:'more',value:value.replace(/\D/g,'').slice(0,3)}]})}/>;}
  if(current.startsWith('reason:')){const index=Number(current.slice(7));const {reasons,stats,avatars,more}=buckets;const item=reasons[index];if(!item)return <p className="helper-text">This reason is no longer on the page.</p>;const write=(patch:Partial<BlockItem>)=>change({items:[...reasons.map((reason,i)=>i===index?{...reason,...patch}:reason),...stats,...avatars,...more]});return <><Field label="Title" value={item.title} onChange={title=>write({title})}/><Field label="Description" value={item.description} multiline onChange={description=>write({description})}/><IconPicker label={`Icon, reason ${index+1}`} value={item.icon} onChange={icon=>write({icon})} options={icons}/><button type="button" className="subtle-action" onClick={()=>{change({items:[...reasons.filter((_,i)=>i!==index),...stats,...avatars,...more]});onOpen(null);}}>Remove reason</button></>;}
  if(current==='links'){const write=(index:number,patch:Partial<ButtonData>)=>{const blank:ButtonData={label:'',href:'#contact',icon:'arrow'};change({buttons:[0,1].map(i=>({...blank,...c.buttons[i],...(i===index?patch:{})}))});};return <>{[0,1].map(i=><div key={i}><Field label={i?'Text link':'Button text'} value={c.buttons[i]?.label||''} onChange={label=>write(i,{label})}/><Destination label={i?'Text link destination':'Button link'} value={c.buttons[i]?.href||''} onChange={href=>write(i,{href})}/></div>)}</>;}
  if(current==='filter')return <Field label="All photos label" value={c.allPhotosLabel||'All photos'} onChange={allPhotosLabel=>change({allPhotosLabel})}/>;
  if(current==='promise')return <Field label="Our promise" value={c.promise||''} multiline onChange={promise=>change({promise})}/>;
  if(current==='labels')return <><Field label="Before label" value={c.beforeLabel||'Before'} onChange={beforeLabel=>change({beforeLabel})}/><Field label="After label" value={c.afterLabel||'After'} onChange={afterLabel=>change({afterLabel})}/></>;
  if(current==='facts')return <>{[0,1,2].map(i=><Field key={i} label={`Fact ${i+1}`} value={c.facts[i]||''} onChange={value=>change({facts:Array.from({length:3},(_,j)=>j===i?value:c.facts[j]||'')})}/>)}</>;
  if(current==='before'||current==='after')return <MediaSlot label={current==='before'?'Before image':'After image'} value={c[current]||mediaDefaults} used={used} onChange={media=>change({[current]:media})}/>;
  if(current==='wording')return <><MessageFields content={c} change={change}/><Field label="Note under the form" value={c.note} multiline onChange={note=>change({note})}/><Field label="Form button text" value={c.formButton} onChange={formButton=>change({formButton})}/><Field label="Consent sentence" value={c.consent} onChange={consent=>change({consent})}/><p className="helper-text">The form does not submit while you are editing.</p></>;
  if(current.startsWith('field:')){const index=Number(current.slice(6));const field=c.fields[index];if(!field)return <p className="helper-text">This field is no longer on the form.</p>;return <><Field label="Field label" value={field.label} onChange={label=>change({fields:c.fields.map((item,i)=>i===index?{...item,label}:item)})}/><label className="field"><span>Answer type</span><select aria-label={`Answer type, field ${index+1}`} value={field.type} onChange={e=>change({fields:c.fields.map((item,i)=>i===index?{...item,type:e.target.value as typeof field.type}:item)})}><option value="text">Text</option><option value="email">Email</option><option value="tel">Phone</option><option value="textarea">Long answer</option></select></label><Toggle label={`Required, field ${index+1}`} checked={field.required} change={required=>change({fields:c.fields.map((item,i)=>i===index?{...item,required}:item)})}/><button type="button" className="subtle-action" onClick={()=>{change({fields:c.fields.filter((_,i)=>i!==index)});onOpen(null);}}>Remove field</button></>;}
  if(current==='offer')return <><Field label="Price" value={c.price||''} onChange={price=>change({price})}/><Field label="Old price" value={c.oldPrice||''} onChange={oldPrice=>change({oldPrice})}/><Field label="End date" value={c.endDate||''} onChange={endDate=>change({endDate})}/><Field label="Badge" value={c.badge||''} onChange={badge=>change({badge})}/><Field label="Offer details" value={c.note} multiline onChange={note=>change({note})}/></>;
  if(current==='details'&&type==='contact')return <><p className="helper-text">Saving the business profile replaces the address, phone, email, and hours on every page’s Contact section.</p><Field label="Address" value={c.address||''} multiline onChange={address=>change({address})}/><Field label="Phone" value={c.phone||''} onChange={phone=>change({phone})}/><Field label="Email" value={c.email||''} onChange={email=>change({email})}/><Field label="Opening hours" value={c.hours||''} multiline onChange={hours=>change({hours})}/></>;
  if(current==='details'&&type==='footer')return <><Field label="Business name" value={site.brand} onChange={brand=>update({brand})}/><Field label="Phone" value={site.phone} onChange={phone=>update({phone})}/><Field label="Email" value={site.email} onChange={email=>update({email})}/><Field label="Location" value={site.address} onChange={address=>update({address})}/><p className="helper-text">These details are shared. Editing a column saves a custom footer instead.</p></>;
  if(current.startsWith('column:')){const index=Number(current.slice(7));const column=columns()[index];if(!column)return <p className="helper-text">This column is no longer in the footer.</p>;const write=(patch:Partial<FooterColumn>)=>writeColumns(columns().map((item,i)=>i===index?{...item,...patch}:item));return <><Field label="Column heading" value={column.title} onChange={title=>write({title})}/><Field label="Column text" multiline value={column.text} onChange={text=>write({text})}/>{column.links.map((link,j)=><div key={j}>{linkedPage(pages,link.href,link.pageId)?<p>Page link: {linkedPage(pages,link.href,link.pageId)!.name}. Rename it in Page settings.</p>:<Field label="Link label" value={link.label} onChange={label=>write({links:column.links.map((item,n)=>n===j?{...item,label}:item)})}/>}<Destination label="Link destination" value={link.href} onChange={href=>write({links:column.links.map((item,n)=>n===j?{...item,href}:item)})}/><button type="button" className="subtle-action" onClick={()=>write({links:column.links.filter((_,n)=>n!==j)})}>Remove link</button></div>)}<button type="button" className="wide" onClick={()=>write({links:[...column.links,{label:'New link',href:'#contact'}]})}>Add footer link</button></>;}
  if(current==='copyright')return <Field label="Copyright and legal line" value={c.note} onChange={note=>change({note})}/>;
  if(current==='image')return <MediaSlot label={type==='contact'?'Map image':type==='promo'?'Background image':'Image'} value={c.media} used={used} onChange={media=>change({media})} onClear={()=>change({media:{...mediaDefaults}})} hint={type==='closing'?'This picture is saved with the section. The current layout does not display it.':undefined}/>;
  if(current.startsWith('item:')){
    const index=Number(current.slice(5)),item=c.items[index];
    if(!item)return <p className="helper-text">This item is no longer on the page.</p>;
    const showCopy=!(type==='about'&&block.layout==='Photos only');
    const showIcon=!['logos','about','reviews','faq'].includes(type)&&!(type==='trust'&&block.layout==='Big numbers');
    return <>
      {showCopy&&<Field label={type==='logos'||type==='reviews'?'Name':type==='faq'?'Question':type==='trust'?'Label':'Title'} value={item.title} onChange={title=>itemChange(index,{title})}/>}
      {showCopy&&!['logos','trust'].includes(type)&&<Field label={type==='faq'?'Answer':type==='reviews'?'Quote':'Description'} value={item.description} multiline onChange={description=>itemChange(index,{description})}/>}
      {type==='services'&&<><Field label="Price" value={item.price||''} onChange={price=>itemChange(index,{price})}/><label className="field"><span>Opens which page?</span><select aria-label={`Opens which page? Service ${index+1}`} value={item.pageId||''} onChange={e=>itemChange(index,{pageId:e.target.value||undefined})}><option value="">No page selected</option>{pages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></>}
      {type==='about'&&<><Field label="Caption" value={item.caption||''} onChange={caption=>itemChange(index,{caption})}/><Field label="Group name" value={item.group||''} onChange={groupName=>itemChange(index,{group:groupName})}/></>}
      {type==='pains'&&<Field label="Short tag" value={item.tag||''} onChange={tag=>itemChange(index,{tag})}/>}
      {type==='trust'&&<><Field label="Value" value={item.value||''} onChange={value=>itemChange(index,{value})}/><Field label="Note" value={item.note||''} onChange={note=>itemChange(index,{note})}/></>}
      {type==='reviews'&&<><Field label="Service" value={item.tag||''} onChange={tag=>itemChange(index,{tag})}/><Field label="When" value={item.when||''} onChange={when=>itemChange(index,{when})}/><Field label="Source" value={item.source||''} onChange={source=>itemChange(index,{source})}/><Field label="Details" value={item.note||''} onChange={note=>itemChange(index,{note})}/><label className="field"><span>Stars</span><select aria-label={`Stars, review ${index+1}`} value={item.stars||''} onChange={e=>itemChange(index,{stars:Number(e.target.value)||undefined})}><option value="">No rating</option>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label><p className="helper-text">Leave details blank unless you have a real note from the customer. A photo replaces the initials.</p></>}
      {showIcon&&<IconPicker label={`Icon, item ${index+1}`} value={item.icon} onChange={icon=>itemChange(index,{icon})} options={icons}/>}
      {itemMedia(block)&&<><MediaSlot label="Photo" value={item.media||mediaDefaults} used={used} onChange={media=>itemChange(index,{media})} hint={type==='solutions'?'Put each step photo in public/media/ai-images, then set its address to /media/ai-images/your-file.jpg.':undefined}/>{item.media?.src&&<button type="button" onClick={()=>itemChange(index,{media:undefined})}>Remove item media</button>}</>}
      <button type="button" className="subtle-action" disabled={type==='solutions'&&block.layout==='Numbered steps'&&c.items.length<=3} onClick={()=>removeItem(index)}>Remove {type==='services'?'service':type==='solutions'?'step':'item'}</button>
    </>;
  }
  return <p className="helper-text">Choose a part of this section to edit.</p>;
  };
  return <div className={type==='proof'?"group-list refined-inspector":"group-list"}>{type==='services'&&home&&block.layout!=='Price list'&&c.items.length>previewCount&&<p className="hint">Home shows the first {previewCount} cards in this layout. Every card remains in this list.</p>}{type==='footer'&&site.footerColumns&&<button type="button" className="reset-style" onClick={()=>update({footerColumns:undefined})}>Use original footer content</button>}{groups.map(item=>{const expanded=open===item.id;const slug=item.id.replace(/[^A-Za-z0-9_-]/g,"-");const buttonId=`${accordionBase}-${slug}-heading`;const panelId=`${accordionBase}-${slug}-panel`;return <div className="accordion" key={item.id} data-expanded={expanded}><button type="button" className="accordion-toggle" id={buttonId} aria-expanded={expanded} aria-controls={panelId} onClick={event=>{onOpen(expanded?null:item.id);if(type==='proof')event.currentTarget.scrollIntoView({block:'nearest'});}}>{type==='proof'&&(item.id==='message'?<FileText size={16} aria-hidden="true"/>:item.id==='promises'?<CheckCircle2 size={16} aria-hidden="true"/>:item.id==='photo'?<ImageIcon size={16} aria-hidden="true"/>:null)}<span className="grow"><b>{item.label}</b>{item.hint&&<small>{item.hint}</small>}</span>{type==='proof'&&item.id==='promises'&&!expanded&&<span className="group-count">3</span>}{type==='proof'?<ChevronDown size={16} className="refined-chevron" aria-hidden="true"/>:<ChevronRight aria-hidden="true"/>}</button>{expanded&&<div className="accordion-panel" id={panelId} role="region" aria-labelledby={buttonId}>{panel(item.id)}</div>}</div>;})}{noun&&<button type="button" className="wide" disabled={capped||(type!=='quote'&&type!=='proof'&&!['logos','services','about','pains','solutions','trust','reviews','faq'].includes(type))} onClick={add}>Add {noun}</button>}{noun&&capped&&<p className="hint">This section has as many items as it can hold.</p>}</div>;
}
