"use client";
import {useId, useState, type CSSProperties} from 'react';
import {ArrowLeft,Building2,CheckCircle2,ChevronDown,ChevronRight,FileText,HelpCircle,Image as ImageIcon,Layers,Menu as MenuIcon,MessageSquare,MousePointerClick,Plus,ShieldCheck,Star,X} from 'lucide-react';
import {Block,BlockContent,BlockItem,ButtonData,Site,IconName,buttonIconSide,icons,servicePreviewCount} from '../site/blocks';
import {accentRamp, FooterColumn} from './settings';
import {MediaManager} from '../media/library';
import {mediaDefaults, mediaURL, type MediaSettings} from '../media/model';
import {countWarning, ratingSummary, scoreWarning} from './rating';
import {PageEntry} from './navigation';
import type {MediaMode} from '../media/sequence';
import {layoutContract} from '../site/layout-contract';
import type {SectionId} from '../site/catalog';
import {Destination, Field, IconPicker, Toggle, useEditScope} from './fields';
import {HeroMediaEditor} from './hero-media';
import {MainImageJourney} from './main-image-journey';
import {LogosContent} from './logos-content';
import {AboutContent} from './about-content';
import {ServicesContent} from './services-content';
import {MenuEditor, MenuPlacement} from './menu-editor';
import {createDefaultMenus} from './menu-model';

type Change = (patch: Partial<BlockContent>) => void;
type Group = {id: string; label: string; hint: string};
const buttonsGroup: Group = {id:'buttons', label:'Action buttons', hint:''};
const CONTACT_STAGE_MODES = ['image', 'video'] as const satisfies readonly MediaMode[];

function MediaSlot({label,value,usage,onChange,onClear,hint}:{label:string;value:MediaSettings;usage:import('../media/usage').MediaUsageIndex;onChange:(media:MediaSettings)=>void;onClear?:()=>void;hint?:string}) {
  return <><h3>{label}</h3>{hint&&<p className="helper-text">{hint}</p>}<MediaManager value={value} usage={usage} onChange={onChange}/>{value.src&&onClear&&<button type="button" onClick={onClear}>Remove media</button>}</>;
}
function MessageFields({content,change,intro=false,allowBody=true}:{content:BlockContent;change:Change;intro?:boolean;allowBody?:boolean}) {
  return <>
    <Field label={intro?'Small introduction':'Small label'} value={content.smallLabel} onChange={smallLabel=>change({smallLabel})}/>
    <Field label="Headline" value={content.title} multiline onChange={title=>change({title})}/>
    <Field label="Subtext" value={content.description} multiline onChange={description=>change({description})}/>
    {allowBody&&<>
      <label className="switch-row"><div className="toggle-info"><span>Additional text</span></div><input type="checkbox" role="switch" aria-label="Additional text" checked={!!content.showBody} onChange={event=>change({showBody:event.target.checked})}/></label>
      {content.showBody&&<Field label="Body text" value={content.body||''} multiline onChange={body=>change({body})}/>}
    </>}
  </>;
}
export function ButtonText({button, onLabel, onIcon}:{button:ButtonData; onLabel:(label:string)=>void; onIcon:(icon:IconName)=>void}) {
  const scope = useEditScope();
  const labelId = useId();
  const side = buttonIconSide(button);
  const picker = <IconPicker compact label="Button icon" value={button.icon} onChange={onIcon} options={icons}/>;
  return <div className="field"><div className="field-label-row"><span id={labelId}>Button text</span><span className="field-tooltip-icon" title="Click the icon inside the field to change it" aria-label="Click the icon inside the field to change it"><HelpCircle size={14} aria-hidden="true"/></span></div><div className="button-wording" data-side={side}>{side==="left" && picker}<input id={`${labelId}-input`} className="button-wording-input" aria-labelledby={labelId} value={button.label} {...scope} onChange={event=>onLabel(event.target.value)}/>{side==="right" && picker}</div></div>;
}
function luminance(hex: string) {
  return [1, 3, 5].map(index => { const v = parseInt(hex.slice(index, index + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, ch, idx) => sum + ch * [0.2126, 0.7152, 0.0722][idx], 0);
}
function contrastRatio(f: string, b: string) {
  const [l, d] = [luminance(f), luminance(b)].sort((x, y) => y - x);
  return (l + 0.05) / (d + 0.05);
}
function mixHex(top: string, bottom: string, alpha: number) {
  const ch = (hex: string, idx: number) => parseInt(hex.slice(idx, idx + 2), 16);
  return "#" + [1, 3, 5].map(idx => Math.round(ch(top, idx) * alpha + ch(bottom, idx) * (1 - alpha)).toString(16).padStart(2, "0")).join("");
}
function darkerAccessible(color: string, against: string) {
  const dark = (amount: number) => "#" + [1, 3, 5].map(i => Math.round(parseInt(color.slice(i, i + 2), 16) * (1 - amount)).toString(16).padStart(2, "0")).join("");
  if (contrastRatio(dark(1), against) < 4.5) return "";
  let low = 0, high = 1, best = "";
  for (let s = 0; s < 12; s++) { const m = (low + high) / 2, n = dark(m); if (contrastRatio(n, against) >= 4.5) { best = n; high = m; } else low = m; }
  return best;
}
function contrastAlternative(foreground: string, background: string) {
  if (!/^#[0-9a-f]{6}$/i.test(foreground) || !/^#[0-9a-f]{6}$/i.test(background) || contrastRatio(foreground, background) >= 4.5) return null;
  const fill = luminance(foreground) > luminance(background) ? darkerAccessible(background, foreground) : "";
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
  if (block.type === "promo") return {color: ramp[50], solid: ramp[900], style: {background: ramp[900], color: ramp[50]} as CSSProperties};
  if (block.type === "hero" && block.layout !== "split") {
    const image = previewImage(block.content.media?.src || "");
    const alpha = Math.min(1, Math.max(0, (block.content.darkness ?? 36) / 100));
    return {color: "#f2f5fa", solid: image ? "" : mixHex("#0b1420", surface, alpha), style: {color: "#f2f5fa", backgroundColor: "#0b1420", backgroundImage: image ? `linear-gradient(rgba(11,20,32,${alpha}),rgba(11,20,32,${alpha})),url("${image}")` : undefined, backgroundSize: "cover", backgroundPosition: "center"} as CSSProperties};
  }
  return {color: ink, solid: surface, style: {background: surface, color: ink} as CSSProperties};
}
function ButtonContrastNote({primary,context,labelColor,fillColor,label,onApply}:{primary:boolean;context:ReturnType<typeof buttonContext>;labelColor:string;fillColor:string;label:string;onApply:(patch:Partial<ButtonData>)=>void}) {
  const [preview,setPreview]=useState(false);
  const alternative=contrastAlternative(primary?labelColor:context.color,primary?fillColor:context.solid);
  if(!alternative)return null;
  const current={color:primary?labelColor:context.color,backgroundColor:primary?fillColor:context.solid};
  const suggested={color:alternative.color||current.color,backgroundColor:alternative.fill||current.backgroundColor};
  return <div className="contrast-note" role="status"><p>This button text may be hard to read.</p>
    <button type="button" aria-expanded={preview} onClick={()=>setPreview(v=>!v)}>{preview?'Hide color comparison':'Preview darker alternative'}</button>
    {preview&&<><div className="contrast-comparison"><div><small>Current</small><span style={current}>{label||'Button'}</span></div><div><small>Suggested</small><span style={suggested}>{label||'Button'}</span></div></div>
      <p className="helper-text">The suggested colors improve text contrast. Apply them to this button only.</p>
      <button type="button" onClick={()=>onApply({textColor:suggested.color,fillColor:suggested.backgroundColor||undefined})}>Apply suggested colors</button>
      <button type="button" onClick={()=>setPreview(false)}>Keep current colors</button></>}
  </div>;
}
export function IconPosition({value, onChange}:{value:"left"|"right"; onChange:(side:"left"|"right")=>void}) {
  const id = useId();
  const options = [{value:"left" as const, label:"Left"}, {value:"right" as const, label:"Right"}];
  return <div className="aligned-field icon-position"><span id={id}>Icon position</span><div className="segmented" role="group" aria-labelledby={id}>{options.map(option => <button type="button" key={option.value} aria-pressed={value===option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div></div>;
}
function ButtonFields({block, change, sections: pageSections, accent, theme}:{block:Block; change:Change; sections:{id:string; type:string}[]; accent:string; theme?: "midnight" | "paper"}) {
  const c = block.content;
  const [activeTab, setActiveTab] = useState(0);
  const write = (index:number,patch:Partial<ButtonData>)=>change({buttons:c.buttons.map((button,i)=>i===index?{...button,...patch}:button)});
  const fill = /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#7963ff";
  const ramp = accentRamp(fill);
  const context = buttonContext(block, theme, ramp);
  const availableButtons = c.buttons.filter((_, i) => i === 0 || c.showSecondary !== false);
  const selectedIndex = Math.min(activeTab, Math.max(0, availableButtons.length - 1));
  const currentButton = availableButtons[selectedIndex] || c.buttons[0];
  const actualIndex = c.buttons.indexOf(currentButton);
  return <>
    {block.type==='hero'&&['short','center'].includes(block.layout)&&<Toggle label="Show secondary button" checked={c.showSecondary!==false} change={showSecondary=>change({showSecondary})}/>}
    {availableButtons.length > 1 && (
      <div className="segmented button-selector" role="group" aria-label="Button selection">
        {availableButtons.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={selectedIndex === i}
            onClick={() => setActiveTab(i)}
          >
            {i === 0 ? "Primary" : "Secondary"}
          </button>
        ))}
      </div>
    )}
    {currentButton && (
      <div className="action-editor" key={actualIndex}>
        <ButtonContrastNote primary={actualIndex === 0} context={{...context,color:currentButton.textColor||context.color,solid:currentButton.fillColor||context.solid}} labelColor={currentButton.textColor||ramp[50]} fillColor={currentButton.fillColor||fill} label={currentButton.label} onApply={patch=>write(actualIndex,patch)}/>
        {(currentButton.textColor||currentButton.fillColor)&&<button type="button" className="subtle-action" onClick={()=>write(actualIndex,{textColor:undefined,fillColor:undefined})}>Use website button colors</button>}
        <ButtonText button={currentButton} onLabel={label=>write(actualIndex,{label})} onIcon={icon=>write(actualIndex,{icon})}/>
        {currentButton.icon!=='none' && <IconPosition value={buttonIconSide(currentButton)} onChange={iconPosition=>write(actualIndex,{iconPosition})}/>}
        <Destination label="When clicked" value={currentButton.href} onChange={href=>write(actualIndex,{href})} sections={pageSections}/>
      </div>
    )}
  </>;
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
function getGroupIcon(id: string, type: string) {
  if (id === 'menus' || id === 'links') return <MenuIcon size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
  if (id === 'placement') return <Layers size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
  if (id === 'name' || id === 'details') return <Building2 size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
  if (id === 'buttons') return <MousePointerClick size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
  if (['media', 'photo', 'image', 'gallery', 'logos', 'logo', 'before', 'after'].includes(id)) return <ImageIcon size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
  if (id === 'trust' || id === 'promises') return <ShieldCheck size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
  if (id === 'rating') return <Star size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
  if (id === 'message' || id === 'intro' || id === 'wording' || id === 'promise') return <MessageSquare size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
  if (type === 'faq') return <HelpCircle size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
  return <FileText size={16} strokeWidth={1.75} className="group-icon" aria-hidden="true"/>;
}

function getGroupCount(id: string, block: Block, site: Site): number | null {
  const c = block.content;
  if ((id === 'menus' || id === 'links') && block.type === 'header') return (site.menus || createDefaultMenus(site)).length;
  if (id === 'placement' && block.type === 'header') return 2;
  if (id === 'buttons') return c.buttons?.length || null;
  if (id === 'media' && block.type === 'hero') {
    const mediaCount = [c.media, ...(c.slides || [])].filter(item => item?.src).length;
    return mediaCount || 1;
  }
  if (id === 'promises' && block.type === 'proof') return 3;
  if (id === 'trust' && block.type === 'hero') return c.facts?.filter(Boolean).length || null;
  if (id === 'services' && block.type === 'services') return c.items.length || null;
  if (id === 'logos' && block.type === 'logos') return c.items.length || null;
  if (id === 'gallery' && block.type === 'about') return c.items.length || null;
  return null;
}

export function contentGroups(block:Block,site:Site,footerDefaults:FooterColumn[]):Group[] {
  const {type,layout,content:c}=block;
  const message:Group={id:'message',label:type==='hero'?'Headline & text':'Message',hint:'Introduction, headline, and description'};
  const contract=layoutContract(type as SectionId,layout);
  const withButtons=(groups:Group[])=>{
    if(type==='proof'&&layout==='Photo and reasons')return groups;
    if(!contract.showsButtons)return groups;
    if(c.buttons.length||['hero','pains','faq','promo','contact','closing','proof'].includes(type))return [...groups,buttonsGroup];
    return groups;
  };
  const messageGroups=(groups:Group[])=>contract.showsTitle||contract.showsSubtext||contract.showsEyebrow||contract.allowsBody?groups:groups.filter(g=>g.id!=='message');
  if(type==='header')return [{id:'menus',label:'Menus',hint:''},{id:'placement',label:'Menu placement',hint:''},{id:'name',label:'Business name',hint:''},{id:'logo',label:'Logo',hint:''}];
  if(type==='footer'){const columns=site.footerColumns||footerDefaults;return [...(!site.footerColumns?[{id:'details',label:'Business details',hint:'Name, phone, email, and location'}]:[]),...columns.map((column,i)=>({id:`column:${i}`,label:column.title.trim()||`Column ${i+1}`,hint:'Heading, text, and links'})),{id:'copyright',label:'Copyright',hint:'The line under the columns'},{id:'image',label:'Image',hint:'Optional picture above the columns'}];}
  if(type==='hero'){const groups:Group[]=[message,buttonsGroup,{id:'trust',label:'Reasons to trust you',hint:''}];if(layout==='story')groups.push({id:'statistics',label:'Your business in numbers',hint:''});const mediaCount=[c.media,...(c.slides||[])].filter(item=>item?.src).length;groups.push({id:'media',label:'Main image & video',hint:mediaCount?`${mediaCount} item${mediaCount===1?'':'s'}`:''});if(layout==='story')groups.push({id:'story',label:'Story video',hint:'Plays when someone uses the story button'});groups.push({id:'rating',label:'Customer rating',hint:''});return groups;}
  if(type==='services')return [{id:'intro',label:'Introduction',hint:layout==='Photo cards'?'Headline and the note beside it':'Headline and the card link'},{id:'services',label:'Services',hint:`${c.items.length} ${c.items.length===1?'item':'items'}`}];
  if(type==='logos')return [{...message,hint:'Small label, headline, and description'},{id:'logos',label:'Logos',hint:`${c.items.length} ${c.items.length===1?'item':'items'}`}];
  if(type==='proof'){if(layout!=='Photo and reasons')return withButtons([{...message,hint:''},{id:'promises',label:'Promises',hint:''},{id:'photo',label:'Media',hint:''}]);const {reasons,avatars}=proofBuckets(c.items);return [message,{id:'stats',label:'Numbers',hint:'Two numbers on the photo'},...[0,1,2].map(i=>({id:`avatar:${i}`,label:avatars[i]?.title.trim()||`Person ${i+1}`,hint:'Name and optional photo'})),{id:'more',label:'More people',hint:'Extra count beside the names'},...reasons.map((item,i)=>({id:`reason:${i}`,label:item.title.trim()||`Reason ${i+1}`,hint:'Title, description, and icon'})),{id:'links',label:'Links',hint:'A button and a text link'},{id:'photo',label:'Media',hint:''}];}
  if(type==='about')return messageGroups([message,{id:'gallery',label:'Gallery',hint:`${c.items.length} ${c.items.length===1?'item':'items'}`}]);
  if(type==='pains')return withButtons([message,{id:'promise',label:'Promise',hint:'The sentence with the concerns'},...named(c.items,'Concern',layout==='One message'?'Title, description, tag, and icon':'Title, description, tag, icon, and photo')]);
  if(type==='solutions')return withButtons(layout==='Before and after'?[message,{id:'labels',label:'Labels',hint:'Before and after captions'},{id:'facts',label:'Facts',hint:'Three short points'},{id:'before',label:'Before image',hint:'The first picture'},{id:'after',label:'After image',hint:'The second picture'}]:[message,...named(c.items,'Step','Title, description, icon, and photo')]);
  if(type==='trust'){const groups=withButtons([message,...c.items.map((item,i)=>({id:`item:${i}`,label:item.title.trim()||item.value?.trim()||`Signal ${i+1}`,hint:layout==='Big numbers'?'Label, value, and note':layout==='Signals'?'Label, value, note, and icon':'Label, value, note, icon, and photo'}))]);return layout==='Signals'?[...groups,{id:'photo',label:'Media',hint:''}]:groups;}
  if(type==='reviews')return withButtons([message,...named(c.items,'Review','Quote, name, service, date, source, details, stars, and photo')]);
  if(type==='quote')return [{id:'wording',label:'Wording',hint:'Introduction, note, button, and consent'},...c.fields.map((field,i)=>({id:`field:${i}`,label:field.label.trim()||`Field ${i+1}`,hint:'Label, answer type, and whether it is required'})),{id:'image',label:'Image',hint:'Picture beside the form'}];
  if(type==='faq')return withButtons([message,...named(c.items,'Question','Question and answer')]);
  if(type==='promo')return withButtons([message,{id:'offer',label:'Offer',hint:'Price, previous price, date, badge, and details'},{id:'image',label:'Background',hint:'Picture behind the offer'}]);
  if(type==='contact')return withButtons([message,{id:'details',label:'Contact details',hint:'Address, phone, email, and hours'},{id:'image',label:'Map image',hint:'Picture beside the details'}]);
  if(type==='closing')return withButtons([message,{id:'image',label:'Image',hint:'Saved with this section'}]);
  return withButtons([message]);
}

export function ContentBrowser({block,site,pages,update,change,footerDefaults,usage,group,onOpen,home,onFocusItem,onOpenPage}:{block:Block;site:Site;pages:PageEntry<Site>[];update:(patch:Partial<Site>)=>void;change:Change;footerDefaults:FooterColumn[];usage:import('../media/usage').MediaUsageIndex;group:string|null;onOpen:(id:string|null)=>void;home:boolean;onFocusItem?:(id:string|null)=>void;onOpenPage?:(id:string)=>void}) {
  const accordionBase=useId().replace(/:/g,"");
  const groups=contentGroups(block,site,footerDefaults),open=groups.some(item=>item.id===group)?group:null;
  const c=block.content,type=block.type;
  const buckets=proofBuckets(c.items);
  const itemChange=(index:number,patch:Partial<BlockItem>)=>change({items:c.items.map((item,i)=>i===index?{...item,...patch}:item)});
  const noun=type==='quote'?'form field':type==='proof'&&block.layout==='Photo and reasons'?'reason':type==='logos'||type==='about'?'':type==='services'?'service':type==='pains'?'concern':type==='solutions'&&block.layout==='Numbered steps'?'step':type==='trust'?'signal':type==='reviews'?'review':type==='faq'?'question':'';
  const capped=type==='quote'?c.fields.length>=12:type==='proof'&&block.layout==='Photo and reasons'?buckets.reasons.length>=6:type==='solutions'&&block.layout==='Numbered steps'?c.items.length>=5:type==='trust'&&block.layout==='Signals'?c.items.length>=3:['logos','services','about','pains','solutions','trust','reviews','faq'].includes(type)?c.items.length>=60:true;
  const add=()=>{
    if(type==='quote'){change({fields:[...c.fields,{label:'',type:'text',required:false}]});onOpen(`field:${c.fields.length}`);return;}
    if(type==='proof'){change({items:[...buckets.reasons,{title:'',description:'',icon:'check'},...buckets.stats,...buckets.avatars,...buckets.more]});onOpen(`reason:${buckets.reasons.length}`);return;}
    change({items:[...c.items,{title:'',description:'',icon:type==='solutions'?'check':'none'}]});onOpen(`item:${c.items.length}`);
  };
  const previewCount=servicePreviewCount(block.settings?.columns);
  const panel=(current:string)=>{
  const removeItem=(index:number)=>{change({items:c.items.filter((_,i)=>i!==index)});onOpen(null);};
  if(current==='logos'&&type==='logos')return <LogosContent items={c.items} sections={site.blocks} change={items=>change({items})}/>;
  if(current==='gallery'&&type==='about')return <AboutContent content={c} change={change}/>;
  if(current==='services'&&type==='services'){
    const note=home
      ? (block.layout!=='Price list'&&c.items.length>previewCount?`Home shows the first ${previewCount} cards in this layout. Every titled card also appears on All services. Give each new service a title so it syncs.`:'Give each service a title so it appears on All services and gets its own page.')
      : 'This list syncs from Home. Add or edit services on Home. Use Style here to choose Icon cards, Media cards, or Simple list for this page.';
    return <ServicesContent items={c.items} pages={pages} homePreviewNote={note} listLocked={!home} change={items=>change({items})} onFocusItem={onFocusItem} onOpenPage={onOpenPage}/>;
  }
  if(current==='message')return <MessageFields content={c} change={change} intro={type==='hero'} allowBody={layoutContract(type as SectionId,block.layout).allowsBody}/>;
  if(current==='intro')return <><MessageFields content={c} change={change} allowBody={layoutContract('services',block.layout).allowsBody}/>{block.layout!=='Photo cards'&&<Field label="Link text" value={c.actionLabel||''} onChange={actionLabel=>change({actionLabel})}/>}{block.layout==='Photo cards'&&<Field label="Side note" value={c.note} multiline onChange={note=>change({note})}/>}</>;
  if(current==='buttons')return c.buttons.length?<ButtonFields block={block} change={change} sections={site.blocks} accent={site.accent} theme={site.theme}/>:<p className="helper-text">This section has no separate buttons.</p>;
  if(current==='name')return <><Field label="Business name" value={site.brand} onChange={brand=>update({brand})}/><p className="helper-text">This changes the business name on every page.</p></>;
  if((current==='menus'||current==='links')&&type==='header')return <MenuEditor site={site} pages={pages} update={update}/>;
  if(current==='placement'&&type==='header')return <MenuPlacement site={site} pages={pages} update={update}/>;
  if(current==='logo')return <MediaSlot label="Logo" value={c.media} usage={usage} onChange={media=>change({media})} onClear={()=>change({media:{...mediaDefaults}})}/>;
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
  if(current==='story')return <><Field label="Story button" value={c.note} onChange={note=>change({note})}/><Field label="Story length" value={c.badge||''} onChange={badge=>change({badge})}/><MediaSlot label="Story video" value={c.story||mediaDefaults} usage={usage} onChange={story=>change({story})} hint="Plays when a visitor chooses the story button. Playback choices are saved; this player still uses its own play settings."/></>;
  if(current==='rating'&&type==='hero'){
    const rating=c.rating||{score:'',count:'',href:''};
    const summary=ratingSummary(rating.score,rating.count);
    const note=scoreWarning(rating.score)||countWarning(rating.count);
    return <div className="list-editor">
      <label className="switch-row"><div className="toggle-info"><span>Show rating</span></div><input type="checkbox" role="switch" checked={!!c.rating&&c.showRating!==false} onChange={event=>change(event.target.checked?{showRating:true,rating:c.rating||{score:'',count:'',href:''}}:{showRating:false})}/></label>
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
  if(current==='promises')return <div className="promise-editor"><p className="helper-text">Three reasons customers choose you.</p>{[0,1,2].map(i=><label className="promise-row" key={i}><span className="promise-num" aria-hidden="true">{i+1}</span><CheckCircle2 size={18} className="promise-check" aria-hidden="true"/><input aria-label={`Promise ${i+1}`} value={c.facts[i]||''} onChange={event=>change({facts:Array.from({length:3},(_,j)=>j===i?event.target.value:c.facts[j]||'')})}/></label>)}</div>;
  if(current==='photo'&&type==='proof')return block.layout==='Promise band'?<p className="helper-text">This layout shows your promises without media. Select Text + media or Media + reasons in Style to show your saved media.</p>:<HeroMediaEditor compact content={c} layout={block.layout} blockId={block.id} onChange={change}/>;
  if(current==='photo'&&type==='trust')return <HeroMediaEditor compact content={c} layout={block.layout} blockId={block.id} onChange={change}/>;
  if(current==='stats'){const {reasons,stats,avatars,more}=buckets;const writeStat=(index:number,patch:Partial<BlockItem>)=>{const blank:BlockItem={title:'',description:'',icon:'none',group:'stat',value:''};const next=[0,1].map(i=>({...blank,...stats[i],...(i===index?patch:{})}));change({items:[...reasons,...next.filter(item=>(item.value||'').trim()||item.title.trim()),...avatars,...more]});};return <>{[0,1].map(i=><div key={i}><Field label={`Photo number ${i+1}`} value={stats[i]?.value||''} onChange={value=>writeStat(i,{value})}/><Field label={`Photo label ${i+1}`} value={stats[i]?.title||''} onChange={title=>writeStat(i,{title})}/></div>)}<p className="helper-text">The numbers and names are samples. Replace them with your own.</p></>;}
  if(current.startsWith('avatar:')){const index=Number(current.slice(7));const {reasons,stats,avatars,more}=buckets;const writeAvatar=(title:string)=>{const blank:BlockItem={title:'',description:'',icon:'none',group:'avatar'};change({items:[...reasons,...stats,...[0,1,2].map(i=>({...blank,...avatars[i],group:'avatar',...(i===index?{title}:{})})),...more]});};const avatar=avatars[index];return <><Field label={`Avatar ${index+1}`} value={avatar?.title||''} onChange={writeAvatar}/><p className="helper-text">A photo replaces the letters in the circle.</p><MediaManager value={avatar?.media||mediaDefaults} usage={usage} onChange={media=>{const next=[0,1,2].map(i=>({...(avatars[i]||{title:'',description:'',icon:'none' as const}),group:'avatar' as const,...(i===index?{media}:{})}));change({items:[...reasons,...stats,...next,...more]});}}/>{avatar?.media?.src&&<button type="button" onClick={()=>{const next=[0,1,2].map(i=>({...(avatars[i]||{title:'',description:'',icon:'none' as const}),group:'avatar' as const,...(i===index?{media:undefined}:{})}));change({items:[...reasons,...stats,...next,...more]});}}>Remove photo</button>}</>;}
  if(current==='more'){const {reasons,stats,avatars}=buckets;return <Field label="More people" value={buckets.more[0]?.value||''} onChange={value=>change({items:[...reasons,...stats,...[0,1,2].map(i=>avatars[i]||{title:'',description:'',icon:'none' as const,group:'avatar'}),{title:'',description:'',icon:'none',group:'more',value:value.replace(/\D/g,'').slice(0,3)}]})}/>;}
  if(current.startsWith('reason:')){const index=Number(current.slice(7));const {reasons,stats,avatars,more}=buckets;const item=reasons[index];if(!item)return <p className="helper-text">This reason is no longer on the page.</p>;const write=(patch:Partial<BlockItem>)=>change({items:[...reasons.map((reason,i)=>i===index?{...reason,...patch}:reason),...stats,...avatars,...more]});return <><Field label="Title" value={item.title} onChange={title=>write({title})}/><Field label="Description" value={item.description} multiline onChange={description=>write({description})}/><IconPicker label={`Icon, reason ${index+1}`} value={item.icon} onChange={icon=>write({icon})} options={icons}/><button type="button" className="subtle-action" onClick={()=>{change({items:[...reasons.filter((_,i)=>i!==index),...stats,...avatars,...more]});onOpen(null);}}>Remove reason</button></>;}
  if(current==='links'){const write=(index:number,patch:Partial<ButtonData>)=>{const blank:ButtonData={label:'',href:'#contact',icon:'arrow'};change({buttons:[0,1].map(i=>({...blank,...c.buttons[i],...(i===index?patch:{})}))});};return <>{[0,1].map(i=><div key={i}><Field label={i?'Text link':'Button text'} value={c.buttons[i]?.label||''} onChange={label=>write(i,{label})}/><Destination label={i?'Text link destination':'Button link'} value={c.buttons[i]?.href||''} onChange={href=>write(i,{href})}/></div>)}</>;}
  if(current==='promise')return <Field label="Our promise" value={c.promise||''} multiline onChange={promise=>change({promise})}/>;
  if(current==='labels')return <><Field label="Before label" value={c.beforeLabel||'Before'} onChange={beforeLabel=>change({beforeLabel})}/><Field label="After label" value={c.afterLabel||'After'} onChange={afterLabel=>change({afterLabel})}/></>;
if(current==='facts')return <>{[0,1,2].map(i=><Field key={i} label={`Fact ${i+1}`} value={c.facts[i]||''} onChange={value=>change({facts:Array.from({length:3},(_,j)=>j===i?value:c.facts[j]||'')})}/>)}</>;
  if(current==='before'||current==='after')return <MediaSlot label={current==='before'?'Before image':'After image'} value={c[current]||mediaDefaults} usage={usage} onChange={media=>change({[current]:media})}/>;
  if(current==='wording')return <><MessageFields content={c} change={change}/><Field label="Note under the form" value={c.note} multiline onChange={note=>change({note})}/><Field label="Form button text" value={c.formButton} onChange={formButton=>change({formButton})}/><Field label="Consent sentence" value={c.consent} onChange={consent=>change({consent})}/><p className="helper-text">The form does not submit while you are editing.</p></>;
  if(current.startsWith('field:')){const index=Number(current.slice(6));const field=c.fields[index];if(!field)return <p className="helper-text">This field is no longer on the form.</p>;return <><Field label="Field label" value={field.label} onChange={label=>change({fields:c.fields.map((item,i)=>i===index?{...item,label}:item)})}/><label className="field"><span>Answer type</span><select aria-label={`Answer type, field ${index+1}`} value={field.type} onChange={e=>change({fields:c.fields.map((item,i)=>i===index?{...item,type:e.target.value as typeof field.type}:item)})}><option value="text">Text</option><option value="email">Email</option><option value="tel">Phone</option><option value="textarea">Long answer</option></select></label><Toggle label={`Required, field ${index+1}`} checked={field.required} change={required=>change({fields:c.fields.map((item,i)=>i===index?{...item,required}:item)})}/><button type="button" className="subtle-action" onClick={()=>{change({fields:c.fields.filter((_,i)=>i!==index)});onOpen(null);}}>Remove field</button></>;}
  if(current==='offer')return <><Field label="Price" value={c.price||''} onChange={price=>change({price})}/><Field label="Old price" value={c.oldPrice||''} onChange={oldPrice=>change({oldPrice})}/><Field label="End date" value={c.endDate||''} onChange={endDate=>change({endDate})}/><Field label="Badge" value={c.badge||''} onChange={badge=>change({badge})}/><Field label="Offer details" value={c.note} multiline onChange={note=>change({note})}/></>;
  if(current==='details'&&type==='contact')return <><p className="helper-text">Settings → Business details updates these fields on every page.</p><Field label="Address" value={c.address||''} multiline onChange={address=>change({address})}/><Field label="Phone" value={c.phone||''} onChange={phone=>change({phone})}/><Field label="Email" value={c.email||''} onChange={email=>change({email})}/><Field label="Opening hours" value={c.hours||''} multiline onChange={hours=>change({hours})}/></>;
  if(current==='image'&&(type==='promo'||type==='quote'||type==='closing'||type==='contact'))return <>{type==='closing'&&<p className="helper-text">This picture shows above the closing message when set.</p>}<HeroMediaEditor compact content={c} layout={block.layout} blockId={block.id} onChange={change} modes={type==='contact'?CONTACT_STAGE_MODES:undefined}/></>;
  if(current==='image')return <MediaSlot label={type==='contact'?'Map image':type==='promo'?'Background image':'Image'} value={c.media} usage={usage} onChange={media=>change({media})} onClear={()=>change({media:{...mediaDefaults}})} hint={type==='closing'?'This picture shows above the closing message when set.':undefined}/>;
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
      {showIcon&&<IconPicker label={type==='pains'?'Badge icon':`Icon, item ${index+1}`} value={item.icon} onChange={icon=>itemChange(index,{icon})} options={icons}/>}
      {itemMedia(block)&&<><MediaSlot label="Photo" value={item.media||mediaDefaults} usage={usage} onChange={media=>itemChange(index,{media})} hint={type==='solutions'?'Put each step photo in public/media/ai-images, then set its address to /media/ai-images/your-file.jpg.':undefined}/>{item.media?.src&&<button type="button" onClick={()=>itemChange(index,{media:undefined})}>Remove item media</button>}</>}
      <button type="button" className="subtle-action" disabled={type==='solutions'&&block.layout==='Numbered steps'&&c.items.length<=3} onClick={()=>removeItem(index)}>Remove {type==='services'?'service':type==='solutions'?'step':'item'}</button>
    </>;
  }
  return <p className="helper-text">Choose a part of this section to edit.</p>;
  };
  if(type==='header'&&open)return <>{<button type="button" className="menu-back-btn" onClick={()=>onOpen(null)}><ArrowLeft size={16} aria-hidden="true"/>Header</button>}{panel(open)}</>;
  if(type==='hero'&&open==='media')return <><button type="button" className="image-journey-back" onClick={()=>onOpen(null)}><ArrowLeft size={16} aria-hidden="true"/>Introduction options</button><MainImageJourney usage={usage} content={c} layout={block.layout} blockId={block.id} onChange={change}/></>;
  return <div className="group-list">{type==='hero'&&<button type="button" className="image-journey-entry" onClick={()=>onOpen('media')}><ImageIcon size={20} aria-hidden="true"/><span><strong>Change my main image</strong><small>Choose, adjust, and describe your picture</small></span><ChevronRight size={18} aria-hidden="true"/></button>}{groups.map(item=>{const expanded=open===item.id;const slug=item.id.replace(/[^A-Za-z0-9_-]/g,"-");const buttonId=`${accordionBase}-${slug}-heading`;const panelId=`${accordionBase}-${slug}-panel`;const count=getGroupCount(item.id,block,site);return <div className="accordion" key={item.id} data-expanded={expanded}><button type="button" className="accordion-toggle" id={buttonId} aria-expanded={expanded} aria-controls={panelId} onClick={event=>{onOpen(expanded?null:item.id);event.currentTarget.scrollIntoView({block:'nearest'});}}>{getGroupIcon(item.id,type)}<span className="grow"><b>{item.label}</b>{item.hint&&<small>{item.hint}</small>}</span>{count!==null&&<span className="group-count">{count}</span>}{expanded?<ChevronDown size={16} className="group-chevron refined-chevron" aria-hidden="true"/>:<ChevronRight size={16} className="group-chevron refined-chevron" aria-hidden="true"/>}</button>{expanded&&<div className="accordion-panel" id={panelId} role="region" aria-labelledby={buttonId}>{panel(item.id)}</div>}</div>;})}{noun&&type!=='services'&&<button type="button" className="wide" disabled={capped||(type!=='quote'&&type!=='proof'&&!['logos','about','pains','solutions','trust','reviews','faq'].includes(type))} onClick={add}>Add {noun}</button>}{noun&&type!=='services'&&capped&&<p className="hint">This section has as many items as it can hold.</p>}</div>;
}
