import type {FooterColumn, FooterConfig, MenuPage, MenuPlacementConfig, NamedMenu, SectionSettings, TextStyle, BrandKit, FontPairId, BrandRadius, BrandLineWidth, Site} from './contracts';
import {defaultColumns, equalWidths} from './layout-utils';
import {linkedPage} from './link-projection';

export {defaultColumns, equalWidths} from './layout-utils';
export {linkedPage} from './link-projection';
export type {FooterColumn, FooterConfig, MenuPage, MenuPlacementConfig, NamedMenu, SectionSettings, TextStyle, BrandKit, FontPairId, BrandRadius, BrandLineWidth, Site} from './contracts';
export const fonts = {display:'var(--font-display), sans-serif',text:'var(--font-text), sans-serif'};
export const fontPairs: Record<FontPairId,{label:string;display:string;text:string;displayVar:string;textVar:string}> = {
  northline:{label:'Northline',display:'Syne',text:'Manrope',displayVar:'--font-pair-northline-display',textVar:'--font-pair-northline-text'},
  editorial:{label:'Editorial',display:'Fraunces',text:'Source Sans 3',displayVar:'--font-pair-editorial-display',textVar:'--font-pair-editorial-text'},
  industrial:{label:'Industrial',display:'Space Grotesk',text:'IBM Plex Sans',displayVar:'--font-pair-industrial-display',textVar:'--font-pair-industrial-text'},
  friendly:{label:'Friendly',display:'Outfit',text:'DM Sans',displayVar:'--font-pair-friendly-display',textVar:'--font-pair-friendly-text'},
};
export const defaultBrandKit: BrandKit = {fontPair:'northline',radius:'pill',lineWidth:'1'};
export function normalizeBrandKit(value: unknown): BrandKit {
  const v = value && typeof value === 'object' ? value as Partial<BrandKit> : {};
  return {
    fontPair: v.fontPair && Object.hasOwn(fontPairs, v.fontPair) ? v.fontPair : defaultBrandKit.fontPair,
    radius: v.radius === 'sharp' || v.radius === 'soft' || v.radius === 'pill' ? v.radius : defaultBrandKit.radius,
    lineWidth: v.lineWidth === '1.5' || v.lineWidth === '2' || v.lineWidth === '1' ? v.lineWidth : defaultBrandKit.lineWidth,
  };
}
export function brandKitVariables(kit: BrandKit = defaultBrandKit): Record<string, string> {
  const pair = fontPairs[normalizeBrandKit(kit).fontPair];
  return {
    '--font-display': `var(${pair.displayVar})`,
    '--font-text': `var(${pair.textVar})`,
  };
}
function bounded(value:unknown,min:number,max:number,fallback:number) {
  return typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
}
export function normalizeSettings(value:SectionSettings = {}):SectionSettings {
  value=value&&typeof value==='object'?value:{};
  const columns=Math.round(bounded(value.columns,1,5,3));
  const raw=Array.isArray(value.widths)&&value.widths.length===columns?value.widths:equalWidths(columns);
  const weights=raw.map(n=>bounded(n,10,100,100/columns)-10),total=weights.reduce((a,b)=>a+b,0);
  const text=(input:TextStyle = {}):TextStyle=>{const v=input&&typeof input==='object'?input:{};return ({
    family:v.family&&Object.hasOwn(fonts,v.family)?v.family:['system','humanist','mono'].includes(v.family||'')?'text':v.family==='serif'?'display':undefined,
    size:v.size===undefined?undefined:bounded(v.size,10,96,32),
    weight:v.weight===undefined?undefined:Math.round(bounded(v.weight,300,900,400)/100)*100,
    align:['left','center','right'].includes(v.align||'')?v.align:undefined,
    lineHeight:v.lineHeight===undefined?undefined:bounded(v.lineHeight,1,2.5,1.4),
    tracking:v.tracking===undefined?undefined:bounded(v.tracking,-3,10,0),
    color:/^#[0-9a-f]{6}$/i.test(v.color||'')?v.color:undefined,
  });};
  return {columns,widths:weights.map(n=>10+(100-columns*10)*(total?n/total:1/columns)),gap:bounded(value.gap,0,80,24),padding:value.padding===undefined?undefined:bounded(value.padding,0,160,72),heading:text(value.heading),body:text(value.body)};
}
// Change one column while keeping the total at 100 and every column at least 10%.
export function resizeWidth(widths:number[],index:number,value:number) {
  if(widths.length<2)return [100];
  const next=widths.map(n=>Number.isFinite(n)?n:100/widths.length);
  const target=bounded(value,10,100-10*(next.length-1),next[index]);
  const rest=next.map((n,i)=>i===index?0:Math.max(0,n-10)),total=rest.reduce((a,b)=>a+b,0);
  const spare=100-target-10*(next.length-1);
  return next.map((_,i)=>i===index?target:10+spare*(total?rest[i]/total:1/(next.length-1)));
}
export function moveDivider(widths:number[],index:number,delta:number) {
  const next=[...widths],pair=next[index]+next[index+1];
  next[index]=bounded(next[index]+delta,10,pair-10,next[index]);
  next[index+1]=pair-next[index];return next;
}
export function sectionVariables(value:SectionSettings = {}) {
  const s=normalizeSettings(value),vars:Record<string,string|number>={};
  if(value.padding!==undefined)vars['--section-padding']=`${s.padding}px`;
  for(const target of ['heading','body'] as const){
    const t=s[target]!;
    for(const [key,v] of Object.entries(t))if(v!==undefined)vars[`--${target}-${key}`]=key==='family'?fonts[v as keyof typeof fonts]:key==='size'||key==='tracking'?`${v}px`:v;
  }
  return vars;
}

export type PageGroup = 'main' | 'service' | 'other';
export type ClassifiablePage = {id:string;name:string;slug?:string};
type ServicesHome = {blocks:{type:string;content:{items:{pageId?:string}[];catalogPageId?:string}}[];navPageIds?:(string|null)[]};

/** Derive sidebar groups from Home service links — never persist a competing group field. */
export function classifyPages<T extends ClassifiablePage>(pages:T[],homeId:string,homeSite:ServicesHome):Record<PageGroup,T[]> {
  const services=homeSite.blocks.find(b=>b.type==='services');
  const serviceIds=new Set((services?.content.items||[]).map(item=>item.pageId).filter((id):id is string=>!!id));
  const catalogId=services?.content.catalogPageId;
  const mainIds=new Set<string>([homeId]);
  if(catalogId)mainIds.add(catalogId);
  for(const id of homeSite.navPageIds||[])if(id&&!serviceIds.has(id))mainIds.add(id);
  const main=pages.filter(p=>mainIds.has(p.id));
  const service=pages.filter(p=>serviceIds.has(p.id));
  const claimed=new Set([...main.map(p=>p.id),...service.map(p=>p.id)]);
  return {main,service,other:pages.filter(p=>!claimed.has(p.id))};
}

export function pageSlug(name:string,used:string[] = []) {
  const base=name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'page';
  let slug=base,index=2;while(used.includes(slug))slug=`${base}-${index++}`;return slug;
}
export function pageAddresses<T extends {name:string;slug?:string}>(records:T[]):T[] {
  const used:string[]=[];
  return records.map(page=>{
    const slug=page.slug&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)&&!used.includes(page.slug)?page.slug:pageSlug(page.name,used);
    used.push(slug);return {...page,slug};
  });
}

export function headerLook(value:unknown):'standard'|'pill'|'rounded' { return value==='pill'||value==='rounded'?value:'standard'; }
export function menuPlacement(where:'top'|'bottom'|'under',count:number):'top'|'bottom'|'under' {
  return where==='under'&&count===0?'top':where==='top'&&count>=5?'bottom':where;
}

type MenuLinks={menus?:NamedMenu[];nav:string[];navTargets?:string[];navPageIds?:(string|null)[];navChildren?:{label:string;href:string;pageId?:string}[][];footerColumns?:FooterColumn[]};
export function bindMenu<T extends MenuLinks>(site:T,pages:MenuPage[],prune=true):T {
  const bind=(link:{label:string;href:string;pageId?:string;customLabel?:boolean})=>{const p=linkedPage(pages,link.href,link.pageId);return p?{...link,pageId:p.id,label:link.customLabel||site.menus?.length?link.label:p.name}:link;};
  const next={...site,navPageIds:site.nav.map((_,i)=>linkedPage(pages,site.navTargets?.[i]||'',site.navPageIds?.[i])?.id||site.navPageIds?.[i]||null),navChildren:site.nav.map((_,i)=>(site.navChildren?.[i]||[]).map(bind)),footerColumns:site.footerColumns?.map(c=>({...c,links:c.links.map(bind)}))};
  if(!prune)return next;
  const exists=(id?:string|null)=>!id||pages.some(p=>p.id===id),keep=next.nav.map((_,i)=>i).filter(i=>exists(next.navPageIds[i]));
  const children=next.navChildren.map(rows=>rows.filter(l=>exists(l.pageId))),orphaned=children.flatMap((rows,i)=>keep.includes(i)?[]:rows);
  const columns=next.footerColumns?.map(c=>({...c,links:c.links.filter(l=>l.customLabel||exists(l.pageId))}))||[];if(orphaned.length){if(!columns.length)columns.push({title:'Explore',text:'',links:[]});columns[0].links.push(...orphaned);}
  return {...next,nav:keep.map(i=>next.nav[i]),navTargets:keep.map(i=>next.navTargets?.[i]||['#services','#proof','#contact'][i]||'#contact'),navPageIds:keep.map(i=>next.navPageIds[i]),navChildren:keep.map(i=>children[i]),footerColumns:next.footerColumns||orphaned.length?columns:undefined};
}
export function pageLocation(site:MenuLinks,page:MenuPage):{where:'top'|'bottom'|'under'|'none';parent:number} {
  const match=(href:string,id?:string|null)=>id?id===page.id:href===`/${page.slug}`;
  if(site.nav.some((_,i)=>match(site.navTargets?.[i]||'',site.navPageIds?.[i])))return {where:'top',parent:0};
  const parent=site.navChildren?.findIndex(rows=>rows.some(l=>match(l.href,l.pageId)))??-1;
  return parent>=0?{where:'under',parent}: {where:site.footerColumns?.some(c=>c.links.some(l=>match(l.href,l.pageId)))?'bottom':'none',parent:0};
}
export function placePage<T extends MenuLinks>(site:T,page:MenuPage,where:'top'|'bottom'|'under'|'none',parent:number):T {
  const bound=bindMenu(site,[page],false),keep=bound.nav.map((_,i)=>i).filter(i=>bound.navPageIds?.[i]!==page.id);
  const next={...bound,nav:keep.map(i=>bound.nav[i]),navTargets:keep.map(i=>bound.navTargets?.[i]||['#services','#proof','#contact'][i]||'#contact'),navPageIds:keep.map(i=>bound.navPageIds?.[i]||null),navChildren:keep.map(i=>(bound.navChildren?.[i]||[]).filter(l=>l.pageId!==page.id)),footerColumns:bound.footerColumns?.map(c=>({...c,links:c.links.filter(l=>l.pageId!==page.id)}))};
  const orphaned=bound.navChildren?.flatMap((rows,i)=>keep.includes(i)?[]:rows.filter(l=>l.pageId!==page.id))||[];
  if(orphaned.length){const columns=next.footerColumns||[];if(!columns.length)columns.push({title:'Explore',text:'',links:[]});columns[Math.max(0,columns.findIndex(c=>c.title.toLowerCase()==='explore'))].links.push(...orphaned);next.footerColumns=columns;}
  const link={label:page.name,href:`/${page.slug}`,pageId:page.id};
  if(where==='none')return next;
  const destination=menuPlacement(where,next.nav.length),index=keep.includes(parent)?keep.indexOf(parent):next.nav.length?0:-1;
  if(destination==='top'||destination==='under'&&index<0){if(next.nav.length<5){next.nav.push(page.name);next.navTargets.push(link.href);next.navPageIds.push(page.id);next.navChildren.push([]);return next;}}
  else if(destination==='under'){next.navChildren[index].push(link);return next;}
  const columns=next.footerColumns||[],explore=columns.find(c=>c.title.toLowerCase()==='explore');
  if(explore)explore.links.push(link);else if(columns.length<5)columns.push({title:'Explore',text:'',links:[link]});else columns[1].links.push(link);
  return {...next,footerColumns:columns};
}

export function accentRamp(hex:string):Record<number,string> {
  const value=/^#[0-9a-f]{6}$/i.test(hex)?hex:'#7963ff',rgb=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
  const weights:Record<number,number>={50:.94,100:.87,200:.72,300:.5,400:.24,500:0,600:-.14,700:-.3,800:-.48,900:-.66,950:-.8};
  return Object.fromEntries(Object.entries(weights).map(([step,mix])=>[step,'#'+rgb.map(channel=>Math.round(mix>=0?channel+(255-channel)*mix:channel*(1+mix)).toString(16).padStart(2,'0')).join('')]));
}
