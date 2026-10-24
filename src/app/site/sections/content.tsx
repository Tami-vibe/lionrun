import {useState,type CSSProperties} from 'react';
import {Columns} from '../../editor/columns';
import {MediaView,useMediaLibrary} from '../../media/library';
import {SectionHeading,SectionButtons,Icon,safeHref} from './elements';
export {ReviewsSection} from './reviews';
import type {SectionProps} from './index';
function nudgeLogos(button:HTMLButtonElement) {
 const band=button.closest('.logo-band'),nudge=band?.querySelector<HTMLElement>('.logo-nudge'),row=nudge?.querySelector<HTMLElement>('.logo-set'),item=row?.querySelector<HTMLElement>('.logo-item');
 if(!nudge||!row||!item)return;
 const next=(Number(nudge.dataset.nudge)||0)+Number(button.dataset.logoStep)*(item.offsetWidth+(parseFloat(getComputedStyle(row).columnGap)||0));
 nudge.dataset.nudge=String(next);nudge.style.transform=`translateX(${next}px)`;
}
export function LogosSection({block,editable,selected,change}:SectionProps) {
 const {resolve}=useMediaLibrary();
 const c=block.content,headed=block.layout==='Heading and slider',scrolling=block.layout!=='Still row',lines=c.title.split('\n');
 const marks=(copy:boolean)=>c.items.map((item,i)=>{const media=item.media,src=media?.src&&media.kind!=='video'&&media.kind!=='social'?resolve(media.src):'';return <div className="logo-item" key={i}>{src
  // This node is copied into static HTML and WordPress exports, where next/image cannot run.
  // eslint-disable-next-line @next/next/no-img-element
  ?<img className="logo-picture" src={src} alt={media?.alt||item.title||''} data-asset-src={media?.src}/>
  :media?.src?<MediaView value={media} editable={editable&&!copy} fill/>:<strong>{item.title}</strong>}</div>;});
 const track=<div className={`logo-window${headed?' logo-divided':''}`}><div className="logo-nudge"><div className="logo-row"><div className="logo-set">{marks(false)}</div><div className="logo-set" aria-hidden="true">{marks(true)}</div></div></div></div>;
 const head=headed?c.showHeading!==false&&<div className="logo-band-head"><div>{c.smallLabel&&<span className="proof-kicker">{c.smallLabel}</span>}<h2>{lines[0]}{lines.length>1&&<span className="proof-quiet">{lines.slice(1).join(' ')}</span>}</h2>{c.description&&<p>{c.description}</p>}</div><div className="logo-nav"><button type="button" className="logo-prev" data-logo-step="1" aria-label="Previous logos" onClick={e=>{e.stopPropagation();nudgeLogos(e.currentTarget);}}><Icon name="arrow" size={16}/></button><button type="button" className="logo-next" data-logo-step="-1" aria-label="Next logos" onClick={e=>{e.stopPropagation();nudgeLogos(e.currentTarget);}}><Icon name="arrow" size={16}/></button></div></div>:<SectionHeading content={c}/>;
 return headed?<div className="logo-band">{head}{track}</div>:<>{head}{scrolling?track:<div className="logo-still"><Columns className="block-grid logo-row" value={block.settings} editable={editable&&selected} onChange={change}>{marks(false)}</Columns></div>}</>;
}
export function ConcernsSection({block,editable,selected,change,link}:SectionProps) {
 const c=block.content;
 return <><SectionHeading content={c}/>{block.layout==='Photo cards'?<Columns className="block-grid concern-layout" value={block.settings} editable={editable&&selected} onChange={change}>{c.items.map((item,i)=><article className="concern-entry" key={i}>{item.media?.src&&<MediaView value={item.media} editable={editable}/>}<div>{item.tag&&<span className="section-kicker">{item.tag}</span>}<h3>{item.title}</h3><p>{item.description}</p><Icon name={item.icon}/></div></article>)}</Columns>:<div className="one-message">{c.items.map((item,i)=><article key={i}><Icon name={item.icon}/>{item.tag&&<span className="section-kicker">{item.tag}</span>}<h3>{item.title}</h3><p>{item.description}</p></article>)}</div>}{c.promise&&<p className="our-promise">{c.promise}</p>}<SectionButtons content={c} link={link}/></>;
}
export function ProcessSection({block,editable,selected,change}:SectionProps) {
 const c=block.content,count=Math.min(c.items.length,Math.min(5,Math.max(3,block.settings.columns||5))),visible=c.items.slice(0,count);
 const steps=<Columns className="block-grid process-steps" value={{...block.settings,columns:count}} editable={editable&&selected} onChange={change}>{visible.map((item,i)=><article key={i}><div className="step-head"><span className="step-number">{String(i+1).padStart(2,'0')}</span>{i<visible.length-1&&<span className="step-arrow"><Icon name="arrow" size={14}/></span>}</div><h3>{item.title}</h3>{item.description&&<p>{item.description}</p>}{item.media?.src&&<MediaView value={item.media} editable={editable}/>}</article>)}</Columns>;
 return <><SectionHeading content={c}/>{block.layout==='Before and after'?<><div className="comparison-grid">{(['before','after'] as const).map(key=><figure key={key}>{c[key]?.src&&<MediaView value={c[key]!} editable={editable}/>}<figcaption>{key==='before'?c.beforeLabel||'Before':c.afterLabel||'After'}</figcaption></figure>)}</div>{c.facts.some(Boolean)&&<ul className="process-facts">{c.facts.filter(Boolean).map((fact,i)=><li key={i}>{fact}</li>)}</ul>}</>:steps}</>;
}
export function TrustSection({block,editable,selected,change}:SectionProps) {
 const c=block.content;
 if(block.layout==='Signals'){
  const lines=c.title.split('\n'),photo=!!c.media.src&&c.showMedia!==false,fadeWidth=Math.max(0,Math.min(100,c.fadeWidth??35)),fadeStrength=Math.max(0,Math.min(100,c.fadeStrength??100))/100,fadeBg=/^#[0-9a-f]{6}$/i.test(c.background||'')?c.background:undefined;
  const row=<div className="trust-row">{c.items.slice(0,3).map((item,i)=><article key={i}><Icon name={item.icon} size={22}/><div><h3>{item.title}</h3><p>{item.note?.trim()||item.description}</p></div></article>)}</div>;
  const copy=<div className="trust-copy">{c.smallLabel&&<span className="proof-kicker">{c.smallLabel}</span>}<h2>{lines[0]}{lines.length>1&&<span className="proof-quiet">{lines.slice(1).join(' ')}</span>}</h2>{c.description&&<p>{c.description}</p>}{!photo&&row}</div>;
  return <div className={`trust-signals${photo?' has-photo':''}${photo&&c.photoSide==='left'?' photo-left':''}`} data-fade={c.fadeDirection==='rtl'?'rtl':'ltr'} style={photo?{'--trust-veil':(c.darkness??64)/80,'--fade-width':`${fadeWidth}%`,'--fade-strength':fadeStrength,...(fadeBg?{'--fade-bg':fadeBg}:{})} as CSSProperties:undefined}>{photo?<><div className="trust-stage"><MediaView value={c.media} fill editable={editable} className={c.fade===false?'':'image-fade'}/><div className="trust-shade" aria-hidden="true"/>{copy}</div>{row}</>:copy}</div>;
 }
 return <><SectionHeading content={c}/><Columns className="block-grid trust-numbers" value={block.settings} editable={editable&&selected} onChange={change}>{c.items.map((item,i)=><article key={i}>{item.value&&<strong className="trust-value">{item.value}</strong>}<h3>{item.title}</h3><p>{item.note??item.description}</p>{block.layout==='Numbers and certifications'&&<>{item.media?.src&&<MediaView value={item.media} editable={editable}/>}<Icon name={item.icon}/></>}</article>)}</Columns></>;
}
export function QuoteSection({block,editable,selected,change}:SectionProps) {
 const c=block.content,[submitted,setSubmitted]=useState(false);
 return <><SectionHeading content={c}/><Columns className="block-grid quote-layout" value={block.settings} editable={editable&&selected} onChange={change}><div className="quote-image">{c.media.src&&<MediaView value={c.media} editable={editable}/>}</div><div role="form" aria-label={c.title} className="quote-form">{c.fields.map((field,i)=><label key={i}>{field.label}{field.type==='textarea'?<textarea required={field.required} disabled={editable}/>:<input type={field.type} required={field.required} disabled={editable}/>}</label>)}{c.consent&&<label className="quote-consent"><input type="checkbox" required disabled={editable}/>{c.consent}</label>}<button type="button" data-demo-submit className="site-btn site-btn-primary" disabled={editable} onClick={e=>{const fields=e.currentTarget.closest('[role=form]')!.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea');if(Array.from(fields).every(field=>field.reportValidity()))setSubmitted(true);}}>{c.formButton}</button><output role={submitted?'status':undefined}>{c.note}</output></div></Columns></>;
}
export function FAQSection({block,editable,selected,change,link}:SectionProps) {
 const c=block.content;
 return <><SectionHeading content={c}/><Columns className={`block-grid faq-layout ${block.layout==='Two columns'?'faq-columns':'faq-accordion'}`} value={block.settings} editable={editable&&selected} onChange={change}>{c.items.map((item,i)=><details key={i}><summary>{item.title}<Icon name="arrow" size={16}/></summary><p>{item.description}</p></details>)}</Columns><SectionButtons content={c} link={link}/></>;
}
export function PromotionSection({block,editable,link}:SectionProps) {
 const c=block.content;
 return <div className="offer-band">{c.media.src&&<MediaView value={c.media} background editable={editable}/>}<div className="offer-copy">{c.badge&&<span className="offer-badge">{c.badge}</span>}<SectionHeading content={c}/><div className="offer-prices">{c.oldPrice&&<s>{c.oldPrice}</s>}{c.price&&<strong>{c.price}</strong>}</div>{c.endDate&&<time>{c.endDate}</time>}{c.note&&<p className="offer-note">{c.note}</p>}<SectionButtons content={c} link={link}/></div></div>;
}
export function ContactSection({block,editable,selected,change,link}:SectionProps) {
 const c=block.content;
 return <Columns className="block-grid contact-layout" value={block.settings} editable={editable&&selected} onChange={change}><div><SectionHeading content={c}/><div className="contact-details"><address>{c.address}</address>{c.phone&&<a href={safeHref(`tel:${c.phone.replaceAll(' ','')}`)}>{c.phone}</a>}{c.email&&<a href={safeHref(`mailto:${c.email}`)}>{c.email}</a>}{c.hours&&<p>{c.hours}</p>}</div><SectionButtons content={c} link={link}/></div>{c.media.src&&<div className="map-picture"><MediaView value={c.media} editable={editable}/></div>}</Columns>;
}
export function ClosingSection({block,editable,selected,change,link}:SectionProps) {
 return <Columns className="block-grid closing-layout" value={block.settings} editable={editable&&selected} onChange={change}><SectionHeading content={block.content}/><SectionButtons content={block.content} link={link}/></Columns>;
}
