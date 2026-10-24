"use client";

import { useEffect, useReducer, useRef, useState } from "react";

type IconName = "none" | "arrow" | "phone" | "calendar" | "mail" | "check" | "message";
type ButtonData = { label: string; href: string; icon: IconName };
type SectionId = "header" | "hero" | "logos" | "services" | "proof" | "about" | "pains" | "solutions" | "trust" | "reviews" | "quote" | "faq" | "promo" | "contact" | "closing" | "footer";
type Item = { title: string; description: string; icon: IconName };
type Extra = { title: string; description: string; items: Item[] };
type Site = {
  brand: string; nav: string[]; headerStyle: "classic" | "centered"; footerStyle: "columns" | "minimal";
  eyebrow: string; headline: string; description: string; image: string; overlay: number;
  layout: "split" | "center" | "image"; align: "left" | "center"; primary: ButtonData; secondary: ButtonData;
  servicesTitle: string; services: { title: string; description: string; icon: IconName }[];
  proofTitle: string; proofText: string; contactTitle: string; contactText: string;
  phone: string; email: string; address: string; mediaAlt: string; mediaKind: "image" | "video"; seoTitle: string; seoDescription: string; accent: string; hidden: SectionId[]; extras: Record<string, Extra>; contactSecondary: ButtonData;
};
const initial: Site = {
  brand: "NORTHLINE", nav: ["Services", "Why us", "Contact"], headerStyle: "classic", footerStyle: "columns",
  eyebrow: "CHICAGO'S TRUSTED AUTO BODY SHOP", headline: "Your car deserves a better comeback.",
  description: "Collision repair, flawless paint, and honest answers. We make the entire process feel easy—from your first estimate to the final handoff.",
  image: "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1800&q=85", overlay: 36,
  layout: "split", align: "left", primary: { label: "Get a free estimate", href: "#contact", icon: "arrow" },
  secondary: { label: "Call the shop", href: "tel:+13125550184", icon: "phone" },
  servicesTitle: "Expert care. Every detail.", services: [
    { title: "Collision repair", description: "Precision structural and cosmetic repairs to get you safely back on the road.", icon: "check" },
    { title: "Paint & refinishing", description: "Color-matched finishes that look as good as the day you drove it home.", icon: "arrow" },
    { title: "Dent removal", description: "Thoughtful, efficient solutions for everyday dents and dings.", icon: "check" },
  ], proofTitle: "Built on trust, not shortcuts.", proofText: "Clear estimates. Experienced technicians. Careful work. You&apos;ll know what happens next at every step.",
  contactTitle: "Let's get your car back to its best.", contactText: "Tell us what happened. We'll help you find the right next step.",
  mediaAlt: "Vehicle at the body shop", mediaKind: "image", seoTitle: "Northline | Collision Repair", seoDescription: "Collision repair, paint and estimates from Northline.", phone: "+1 (312) 555-0184", email: "hello@example.com", address: "Chicago, Illinois", accent: "#5878f5", hidden: [], contactSecondary: { label: "Call the shop", href: "tel:+13125550184", icon: "phone" },
  extras: {
    logos: { title: "Trusted by our community", description: "Brands and partners we work with", items: ["Certified repair", "Insurance partners", "Local business"].map(title => ({ title, description: "", icon: "check" })) },
    about: { title: "Meet the people behind the work", description: "Real technicians, a real shop, and a commitment to doing things right.", items: [{ title: "Our team", description: "Experienced specialists who care about every detail.", icon: "check" }, { title: "Our workshop", description: "Modern equipment and a transparent process.", icon: "check" }] },
    pains: { title: "Repairs shouldn't add more stress", description: "We understand what matters when your vehicle is off the road.", items: [{ title: "Unclear timelines", description: "Know what happens next.", icon: "calendar" }, { title: "Surprise costs", description: "Understand your estimate.", icon: "check" }, { title: "Uncertain quality", description: "See our standards and workmanship.", icon: "check" }] },
    solutions: { title: "A clear path back to the road", description: "From your first call to the final inspection.", items: ["Tell us what happened", "Receive your estimate", "Approve the plan", "We complete the repair", "Drive away confidently"].map(title => ({ title, description: "", icon: "check" })) },
    trust: { title: "Confidence comes from evidence", description: "Show real credentials, warranty terms, and documented results.", items: [{ title: "Experienced team", description: "Meet our specialists", icon: "check" }, { title: "Clear estimates", description: "Know before we begin", icon: "check" }, { title: "Quality checks", description: "Every detail matters", icon: "check" }] },
    reviews: { title: "What customers say", description: "Replace these examples with authentic, attributed reviews before publishing.", items: [{ title: "Customer review", description: "Add a real customer's review and permission to display it.", icon: "message" }] },
    quote: { title: "Request your estimate", description: "Tell us about your vehicle and how to reach you.", items: [] },
    faq: { title: "Frequently asked questions", description: "Answers before you visit.", items: [{ title: "How do I get started?", description: "Contact us and describe the repair you need.", icon: "message" }, { title: "How long will repairs take?", description: "We will discuss a timeline after inspecting your vehicle.", icon: "calendar" }, { title: "Do you provide written estimates?", description: "Ask our team about the estimate process.", icon: "check" }] },
    promo: { title: "Seasonal service offer", description: "Add a real offer, price, expiry date, and terms before publishing.", items: [{ title: "Ask about current offers", description: "Contact us for availability and details.", icon: "arrow" }] },
    closing: { title: "Ready to get started?", description: "Get in touch today and take the next step.", items: [] },
  },
};
const sections: { id: SectionId; label: string; detail: string }[] = [
  { id: "header", label: "Header", detail: "Brand & navigation" }, { id: "hero", label: "Hero", detail: "First impression" },
  { id: "logos", label: "Partner logos", detail: "Recognizable proof" }, { id: "services", label: "Services", detail: "What you offer" },
  { id: "proof", label: "Why choose us", detail: "Proof of quality" }, { id: "about", label: "About & gallery", detail: "People and workshop" }, { id: "pains", label: "Customer concerns", detail: "What visitors worry about" },
  { id: "solutions", label: "Our process", detail: "Show the solution" }, { id: "trust", label: "Trust signals", detail: "Evidence and standards" },
  { id: "reviews", label: "Reviews", detail: "Customer voices" }, { id: "quote", label: "Quote request", detail: "Lead capture" },
  { id: "faq", label: "FAQ", detail: "Answer questions" }, { id: "promo", label: "Promotion", detail: "Current offer" },
  { id: "contact", label: "Contact", detail: "Get in touch" }, { id: "closing", label: "Final CTA", detail: "Invite action" },
  { id: "footer", label: "Footer", detail: "Useful links" },
];
const icons: IconName[] = ["none", "arrow", "phone", "calendar", "mail", "check", "message"];
function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  if (name === "none") return null;
  const paths: Record<Exclude<IconName, "none">, React.ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>, phone: <path d="M7 3h3l1.5 4-2 2a15 15 0 0 0 5.5 5.5l2-2L21 14v3a4 4 0 0 1-4 4C9 21 3 15 3 7a4 4 0 0 1 4-4Z"/>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    check: <path d="m4 12 5 5L20 6"/>, message: <path d="M20 11a8 8 0 0 1-8 8 9 9 0 0 1-4-.9L3 20l1.9-5A8 8 0 1 1 20 11Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
type History = { past: Site[]; present: Site; future: Site[] };
type Action = { type: "set"; next: Site } | { type: "undo" } | { type: "redo" } | { type: "load"; next: Site };
function historyReducer(state: History, action: Action): History {
  if (action.type === "load") return { past: [], present: action.next, future: [] };
  if (action.type === "set") return { past: [...state.past.slice(-39), state.present], present: action.next, future: [] };
  if (action.type === "undo" && state.past.length) return { past: state.past.slice(0, -1), present: state.past.at(-1)!, future: [state.present, ...state.future] };
  if (action.type === "redo" && state.future.length) return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
  return state;
}
function safeHref(value: string) {
  const v = value.trim();
  return /^(https?:\/\/|mailto:|tel:|#|\/)(?!\/)/i.test(v) ? v : "#contact";
}
function safeImage(value: string) {
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  try { const u = new URL(value); return u.protocol === "https:" ? u.href : ""; } catch { return ""; }
}
function safeVideo(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return "";
    const host = u.hostname.toLowerCase();
    if (host === "youtu.be") { const id = u.pathname.slice(1); return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : ""; }
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
      const id = u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
      return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "vimeo.com" || host === "www.vimeo.com") {
      const id = u.pathname.split("/")[1]; return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : "";
    }
    return "";
  } catch { return ""; }
}
function validSite(value: unknown): value is Site {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Site>;
  return typeof v.brand === "string" && typeof v.headline === "string" && typeof v.description === "string" &&
    Array.isArray(v.services) && Array.isArray(v.hidden) && typeof v.primary?.label === "string" && typeof v.secondary?.href === "string" &&
    typeof v.contactTitle === "string" && typeof v.accent === "string";
}
function Btn({ data, primary = false, accent }: { data: ButtonData; primary?: boolean; accent: string }) {
  return <a className={`site-btn ${primary ? "site-btn-primary" : "site-btn-outline"}`} style={primary ? { background: accent } : undefined} href={safeHref(data.href)}><span>{data.label}</span><Icon name={data.icon}/></a>;
}
function ExtraSection({ id, data, accent, primary, editable }: { id: SectionId; data: Extra; accent: string; primary: ButtonData; editable: boolean }) {
  return <div className={`extra-inner extra-${id}`}><span className="section-kicker">{id === "faq" ? "GOOD TO KNOW" : id.toUpperCase().replaceAll("_", " ")}</span><h2>{data.title}</h2><p className="extra-description">{data.description}</p>
    {id === "quote" ? <form className="quote-form" onSubmit={e => { e.preventDefault(); if (!editable) window.alert("Demo only: no submission backend connected."); }}><label>Name<input required placeholder="Your name" disabled={editable}/></label><label>Phone or email<input required placeholder="How can we reach you?" disabled={editable}/></label><label>What do you need?<textarea placeholder="Tell us about your project" disabled={editable}/></label><label className="quote-consent"><input type="checkbox" required disabled={editable}/> I agree to be contacted about this request.</label><button type="submit" disabled={editable} style={{ background: accent }}>Request estimate</button><small>Demo form — submissions are not sent or stored.</small></form> : null}
    {data.items.length > 0 && <div className="extra-grid">{data.items.map((item, i) => id === "faq" ? <details key={i}><summary>{item.title}</summary><p>{item.description}</p></details> : <article key={i} className="extra-card"><span className="extra-card-icon"><Icon name={item.icon}/></span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>}
    {(id === "closing" || id === "promo") && <a className="site-btn site-btn-primary" href={safeHref(primary.href)} style={{ background: accent }} onClick={editable ? e => e.preventDefault() : undefined}>{primary.label}<Icon name={primary.icon}/></a>}
  </div>;
}
function SitePreview({ site, select, selected, editable }: { site: Site; select: (id: SectionId) => void; selected: SectionId; editable: boolean }) {
  const active = (id: SectionId) => !site.hidden.includes(id);
  const props = (id: SectionId) => ({ "data-section": id, onClick: editable ? (e: React.MouseEvent) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); select(id); } : undefined,
    className: `${editable ? "editable-section" : ""} ${editable && selected === id ? "selected-section" : ""}` });
  return <div className="site-preview" style={{ "--accent": site.accent } as React.CSSProperties}>
    {active("header") && <header {...props("header")}><div className={`site-header ${site.headerStyle === "centered" ? "header-centered" : ""}`}>
      <a className="site-brand" href="#top" onClick={editable ? e => e.preventDefault() : undefined}><span className="brand-mark">✳</span>{site.brand}</a>
      <nav aria-label="Main navigation">{site.nav.map((item, i) => <a key={i} href={["#services", "#proof", "#contact"][i] ?? "#contact"}>{item}</a>)}</nav>
      <a className="header-contact" href="tel:+13125550184" onClick={editable ? e => e.preventDefault() : undefined}>Let&apos;s talk <Icon name="arrow" size={16}/></a>
    </div></header>}
    {active("hero") && <section id="top" {...props("hero")} className={`${props("hero").className} hero hero-${site.layout} text-${site.align}`}>
      <div className="hero-photo" role="img" aria-label={site.mediaAlt} style={{ backgroundImage: safeImage(site.image) ? `linear-gradient(90deg, rgba(8,13,19,${Math.min(site.overlay + 20, 90) / 100}),rgba(8,13,19,${site.overlay / 100})),url("${safeImage(site.image)}")` : undefined }}/>
      {site.mediaKind === "video" && safeVideo(site.image) && <iframe className="hero-video" title="Hero video" src={safeVideo(site.image)} loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>}
      <div className="hero-inner"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/>{site.eyebrow}</div>
        <h1>{site.headline}</h1><p>{site.description}</p><div className="hero-buttons"><Btn data={site.primary} primary accent={site.accent}/><Btn data={site.secondary} accent={site.accent}/></div>
        <div className="hero-note"><Icon name="check" size={15}/> Clear estimates <span>·</span> Local experts <span>·</span> Quality first</div>
      </div></div><div className="hero-index">01 / BUILT WITH CARE</div></section>}
    {sections.filter(x => x.id === "logos").map(x => active(x.id) && <section key={x.id} id={x.id} {...props(x.id)} className={`${props(x.id).className} extra-section`}><ExtraSection id={x.id} data={site.extras[x.id]} accent={site.accent} primary={site.primary} editable={editable}/></section>)}
    {active("services") && <section id="services" {...props("services")} className={`${props("services").className} site-section services-section`}>
      <div className="section-topline">WHAT WE DO <span>01 / 03</span></div><div className="section-heading"><h2>{site.servicesTitle}</h2><p>Every vehicle has a story. We help you get back to yours.</p></div>
      <div className="service-grid">{site.services.map((s, i) => <article key={i} className="service-card"><div className="service-card-top"><span>0{i + 1}</span><Icon name={s.icon}/></div><h3>{s.title}</h3><p>{s.description}</p><span className="service-more">Explore service <Icon name="arrow" size={16}/></span></article>)}</div>
    </section>}
    {active("proof") && <section id="proof" {...props("proof")} className={`${props("proof").className} proof-section`}><div className="proof-inner"><span className="section-kicker">THE NORTHLINE DIFFERENCE</span><h2>{site.proofTitle}</h2><p>{site.proofText}</p><div className="proof-points"><span><Icon name="check"/> Transparent process</span><span><Icon name="check"/> Quality craftsmanship</span><span><Icon name="check"/> People-first service</span></div></div><div className="proof-visual"><span>CRAFT / CARE / CONFIDENCE</span></div></section>}
    {(["about", "pains", "solutions", "trust", "reviews", "quote", "faq", "promo"] as SectionId[]).map(id => active(id) && <section key={id} id={id} {...props(id)} className={`${props(id).className} extra-section`}><ExtraSection id={id} data={site.extras[id]} accent={site.accent} primary={site.primary} editable={editable}/></section>)}
    {active("contact") && <section id="contact" {...props("contact")} className={`${props("contact").className} contact-section`}><div><span className="section-kicker">YOUR NEXT STEP</span><h2>{site.contactTitle}</h2><p>{site.contactText}</p></div><div className="contact-actions"><a href={safeHref(site.primary.href)} onClick={editable ? e => e.preventDefault() : undefined} className="contact-main" style={{ background: site.accent }}><span>{site.primary.label}</span><Icon name={site.primary.icon}/></a><a className="contact-secondary" href={safeHref(site.contactSecondary.href)} onClick={editable ? e => e.preventDefault() : undefined}><span>{site.contactSecondary.label}</span><Icon name={site.contactSecondary.icon}/></a><a href={`mailto:${site.email}`} onClick={editable ? e => e.preventDefault() : undefined}>{site.email}</a></div></section>}
    {active("closing") && <section id="closing" {...props("closing")} className={`${props("closing").className} extra-section closing-section`}><ExtraSection id="closing" data={site.extras.closing} accent={site.accent} primary={site.primary} editable={editable}/></section>}
    {active("footer") && <footer {...props("footer")} className={`${props("footer").className} site-footer ${site.footerStyle === "minimal" ? "footer-minimal" : ""}`}><div><strong><span className="brand-mark">✳</span> {site.brand}</strong><p>Good work. Good people. A better way forward.</p></div><div><span>EXPLORE</span><a href="#services">Services</a><a href="#proof">Why us</a><a href="#contact">Contact</a></div><div><span>GET IN TOUCH</span><p>{site.address}</p><p>{site.phone}</p><p>{site.email}</p></div><div className="footer-bottom">© {2026} {site.brand}. All rights reserved. <span>Privacy · Terms</span></div></footer>}
  </div>;
}
function DeviceIcon({ type }: { type: "desktop" | "tablet" | "mobile" }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{type === "desktop" ? <><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 22h8M12 18v4"/></> : type === "tablet" ? <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 19h2"/></> : <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 19h2"/></>}</svg>;
}
function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return <label className="field"><span>{label}</span>{multiline ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)}/> : <input value={value} onChange={e => onChange(e.target.value)}/>}</label>;
}
function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return <div className="field"><span>{label}</span><div className="choice-group">{options.map(o => <button type="button" key={o.value} className={value === o.value ? "choice-active" : ""} onClick={() => onChange(o.value)}>{o.label}</button>)}</div></div>;
}

// ZIP (stored entries, no external dependency). All file names are fixed by this exporter.
function zipFiles(files: {name:string;data:Uint8Array}[]): Blob {
  const chunks: Uint8Array[]=[]; const central:Uint8Array[]=[]; const encoder=new TextEncoder();let offset=0;
  const u16=(v:DataView,o:number,n:number)=>v.setUint16(o,n,true);
  const u32=(v:DataView,o:number,n:number)=>v.setUint32(o,n>>>0,true);
  const crc=(bytes:Uint8Array)=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
  for(const f of files){const name=encoder.encode(f.name),c=crc(f.data),n=f.data.length;
    const local=new Uint8Array(30+name.length);const v=new DataView(local.buffer);u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x800);u32(v,14,c);u32(v,18,n);u32(v,22,n);u16(v,26,name.length);local.set(name,30);chunks.push(local,f.data);
    const dir=new Uint8Array(46+name.length);const d=new DataView(dir.buffer);u32(d,0,0x02014b50);u16(d,4,20);u16(d,6,20);u16(d,8,0x800);u32(d,16,c);u32(d,20,n);u32(d,24,n);u16(d,28,name.length);u32(d,42,offset);dir.set(name,46);central.push(dir);offset+=local.length+n;
  }
  const centralSize=central.reduce((n,b)=>n+b.length,0);const end=new Uint8Array(22);const e=new DataView(end.buffer);u32(e,0,0x06054b50);u16(e,8,files.length);u16(e,10,files.length);u32(e,12,centralSize);u32(e,16,offset);
  return new Blob([...chunks,...central,end] as BlobPart[],{type:'application/zip'});
}
function downloadFile(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const htmlEscape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
async function packageWebsite(site:Site,format:'html'|'wordpress'){
  const source=document.querySelector('.site-preview');if(!source)throw Error('Website preview not found');
  const cloned=source.cloneNode(true) as HTMLElement;
  cloned.querySelectorAll('[data-section]').forEach(el=>el.classList.remove('editable-section','selected-section'));
  cloned.querySelectorAll('input,textarea').forEach(el=>{(el as HTMLInputElement).disabled=false;});
  // Remove remote media dependencies where feasible; unsupported hosts remain external.
  const assets:{name:string;data:Uint8Array}[]=[];let count=0;
  for(const el of Array.from(cloned.querySelectorAll('img'))){const url=el.getAttribute('src')||'';if(!url)continue;
    try{const response=await fetch(url);if(!response.ok)continue;const blob=await response.blob();if(blob.size>10_000_000)continue;
      const ext=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':blob.type==='image/gif'?'gif':'jpg';
      const name=`assets/media-${++count}.${ext}`;assets.push({name,data:new Uint8Array(await blob.arrayBuffer())});el.setAttribute('src',format==='wordpress'?`<?php echo esc_url(get_template_directory_uri()); ?>/${name}`:name);
    }catch{/* External image remains linked; report in README. */}
  }
  // Export only website styles, never editor chrome.
  let css='';for(const sheet of Array.from(document.styleSheets)){
    try{const rules=Array.from(sheet.cssRules).map(r=>r.cssText).join('\n');css+='\n'+rules;}catch{/* inaccessible cross-origin stylesheets */}
  }
  css+='\nbody{margin:0}.site-preview{width:100%;min-height:100vh}.editable-section,.selected-section{outline:none!important}';
  const title=htmlEscape(site.seoTitle||site.brand),description=htmlEscape(site.seoDescription||'');
  const content=cloned.outerHTML;
  const page=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="stylesheet" href="${format==='wordpress'?'<?php echo esc_url(get_stylesheet_uri()); ?>':'assets/style.css'}">${format==='wordpress'?'<?php wp_head(); ?>':''}</head><body>${content}${format==='wordpress'?'<?php wp_footer(); ?>':''}</body></html>`;
  const enc=new TextEncoder();const f=(name:string,value:string)=>({name,data:enc.encode(value)});
  if(format==='html')return zipFiles([f('index.html',page),f('assets/style.css',css),...assets,f('README.txt','Upload index.html and assets/ to the same web directory. Verify external media, links and forms before publishing. Quote form requires a secure backend; this export does not collect leads.\n')]);
  const themeCSS=`/*\nTheme Name: Automotive Builder\nAuthor: Business Builder\nVersion: 0.1.0\nRequires at least: 6.0\nText Domain: automotive-builder\n*/\n`+css;
  const php=page.replace('<!doctype html>','').replace('<html lang="en">','<html <?php language_attributes(); ?>>').replace('<meta charset="utf-8">',`<meta charset="<?php bloginfo('charset'); ?>">`);
  return zipFiles([f('automotive-builder/style.css',themeCSS),f('automotive-builder/index.php',php),f('automotive-builder/functions.php',`<?php\nif (!defined('ABSPATH')) exit;\nadd_action('after_setup_theme', function(){ add_theme_support('title-tag'); add_theme_support('post-thumbnails'); });\n`),...assets.map(a=>({...a,name:'automotive-builder/'+a.name})),f('automotive-builder/README.txt','Install via Appearance > Themes > Add New > Upload Theme. Static homepage theme, not a block theme. Test on WordPress staging. External media may remain linked. Forms require integration before publishing.\n')]);
}

export default function Home() {
  const [history, dispatch] = useReducer(historyReducer, { past: [], present: initial, future: [] });
  const site = history.present;
  const [selected, setSelected] = useState<SectionId>("hero");
  const [tab, setTab] = useState<"content" | "design" | "actions">("content");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [preview, setPreview] = useState(false);
  const [exportOpen,setExportOpen]=useState(false);
  const [exportBusy,setExportBusy]=useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [media, setMedia] = useState<{name:string;url:string}[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { if (new URLSearchParams(window.location.search).get("preview") === "1") setPreview(true); }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { const timer = window.setTimeout(() => { try { const raw = localStorage.getItem("business-builder-demo-v1"); if (raw) { const parsed: unknown = JSON.parse(raw); if (validSite(parsed)) dispatch({ type: "load", next: { ...initial, ...parsed, extras: { ...initial.extras, ...parsed.extras }, contactSecondary: parsed.contactSecondary ?? initial.contactSecondary } }); } } catch {} setReady(true); }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (ready) try { localStorage.setItem("business-builder-demo-v1", JSON.stringify(site)); } catch {} }, [site, ready]);
  const update = (patch: Partial<Site>) => dispatch({ type: "set", next: { ...site, ...patch } });
  const extraUpdate = (id: SectionId, patch: Partial<Extra>) => update({ extras: { ...site.extras, [id]: { ...site.extras[id], ...patch } } });
  const buttonUpdate = (which: "primary" | "secondary", patch: Partial<ButtonData>) => update({ [which]: { ...site[which], ...patch } });
  const flash = (message: string) => { setNotice(message); };
  const chooseSection = (id: SectionId) => {
    setSelected(id); setTab("content"); setPreview(false);
    requestAnimationFrame(() => {
      const root = canvasRef.current;
      const target = root?.querySelector<HTMLElement>(`[data-section="${id}"]`);
      if (root && target) root.scrollTo({ top: target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 18, behavior: "smooth" });
    });
  };
  const addMedia = (file: File) => {
    if (!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type) || file.size > 4_000_000) { flash("Use an image under 4 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { const url = String(reader.result); setMedia(list => [...list, {name:file.name,url}]); update({image:url,mediaKind:"image"}); };
    reader.readAsDataURL(file);
  };
  const openPreview = () => { window.open(`${window.location.origin}/?preview=1`, "_blank", "noopener,noreferrer"); };
  const exportConfig = () => { const blob = new Blob([JSON.stringify(site, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "business-website-config.json"; a.click(); URL.revokeObjectURL(url); flash("Configuration exported"); };
  const exportPackage=async(format:'html'|'wordpress')=>{setExportOpen(false);setExportBusy(true);try{const blob=await packageWebsite(site,format);downloadFile(blob,format==='html'?'automotive-website.zip':'automotive-wordpress-theme.zip');flash(`${format.toUpperCase()} package exported — verify before publishing`);}catch(error){flash(`Export failed: ${String(error)}`);}finally{setExportBusy(false);}};
  const extra = site.extras[selected];
  const section = sections.find(s => s.id === selected)!;
  return <main className={`builder-shell ${sidebarOpen ? "" : "sidebar-collapsed"} ${preview ? "standalone-preview" : ""}`}>
    <aside className="builder-rail"><div className="rail-logo">b<span>.</span></div><button title="Toggle section list" aria-label="Toggle section list" onClick={() => setSidebarOpen(v => !v)}>☰</button><button className="rail-selected" aria-label="Website editor">▦</button><button aria-label="Pages coming later" title="Pages coming later" onClick={() => flash("Multi-page management is planned for a later milestone")}>▤</button><div className="rail-spacer"/><div className="rail-avatar">B</div></aside>
    <aside className="builder-sidebar"><div className="sidebar-heading"><div><span className="sidebar-overline">YOUR WORKSPACE</span><h2>Website builder</h2></div><span className="sidebar-dot"/></div>
      <div className="sidebar-project"><div className="project-icon">N</div><div><strong>{site.brand}</strong><span>Business website · Draft</span></div><span>⌄</span></div>
      <div className="sidebar-label">SITE STRUCTURE <span>{sections.length} sections</span></div><div className="section-list">{sections.map(s => <button key={s.id} onClick={() => chooseSection(s.id)} className={selected === s.id ? "section-active" : ""}><span className="section-symbol">{s.id === "hero" ? "▧" : s.id === "header" ? "▤" : s.id === "footer" ? "▱" : "▦"}</span><span className="section-info"><strong>{s.label}</strong><small>{s.detail}</small></span><span className="section-indicator">{site.hidden.includes(s.id) ? "◌" : "›"}</span></button>)}</div>
      <div className="sidebar-bottom"><div className="sidebar-tip"><strong>Made for business.</strong><p>Click any section on the canvas to edit it instantly.</p></div><span>EDITOR V0.1 · LOCAL DEMO</span></div>
    </aside>
    <div className="workspace"><div className="workspace-toolbar"><div className="toolbar-left"><span className="breadcrumb">My website</span><span className="crumb-separator">/</span><strong>Homepage</strong><span className="draft-badge">Draft</span></div><div className="toolbar-middle" role="group" aria-label="Preview size"><button className={device === "desktop" ? "tool-active" : ""} onClick={() => setDevice("desktop")} title="Desktop" aria-label="Desktop preview"><DeviceIcon type="desktop"/></button><button className={device === "tablet" ? "tool-active" : ""} onClick={() => setDevice("tablet")} title="Tablet" aria-label="Tablet preview"><DeviceIcon type="tablet"/></button><button className={device === "mobile" ? "tool-active" : ""} onClick={() => setDevice("mobile")} title="Mobile" aria-label="Mobile preview"><DeviceIcon type="mobile"/></button></div><div className="toolbar-right"><button onClick={() => dispatch({ type: "undo" })} disabled={!history.past.length} title="Undo">↶</button><button onClick={() => dispatch({ type: "redo" })} disabled={!history.future.length} title="Redo">↷</button><button onClick={openPreview} className="preview-toggle">Live preview ↗</button><div className="export-menu"><button className="publish-btn" aria-expanded={exportOpen} aria-haspopup="menu" disabled={exportBusy} onClick={()=>setExportOpen(v=>!v)}>{exportBusy?'Preparing…':'Export ▾'}</button>{exportOpen&&<div className="export-options" role="menu"><button role="menuitem" onClick={()=>void exportPackage('html')}>↗ HTML website (.zip)</button><button role="menuitem" onClick={()=>void exportPackage('wordpress')}>▣ WordPress theme (.zip)</button><button role="menuitem" onClick={()=>{setExportOpen(false);exportConfig();}}>▤ Project JSON</button></div>}</div></div></div>
      <div ref={canvasRef} className={`canvas-area ${preview ? "canvas-preview" : ""}`}><div className={`canvas-frame frame-${device}`}><div className="canvas-top"><span className="canvas-live-dot"/> {preview ? "PREVIEW MODE" : "LIVE EDITOR"}<span className="canvas-url">northline.example</span></div><SitePreview site={site} selected={selected} select={chooseSection} editable={!preview}/></div></div>
    </div>
    {!preview && <aside className="inspector"><div className="inspector-top"><div><span className="inspector-overline">SECTION EDITOR</span><h2>{section.label} <span>HUD</span></h2></div><span className="inspector-status">● Live</span></div><div className="inspector-tabs"><button className={tab === "content" ? "tab-active" : ""} onClick={() => setTab("content")}>Content</button><button className={tab === "design" ? "tab-active" : ""} onClick={() => setTab("design")}>Design</button><button className={tab === "actions" ? "tab-active" : ""} onClick={() => setTab("actions")}>Actions</button></div>
      <div className="inspector-body">
        <div className="editor-intro"><strong>{tab === "content" ? "Make it yours" : tab === "design" ? "Fine-tune the look" : "Connect your visitors"}</strong><p>{tab === "content" ? "Changes appear instantly on your website." : tab === "design" ? "Choose a style that feels right for your brand." : "Set where your buttons take people."}</p></div>
        <label className="visibility-toggle"><span>Show this section</span><input type="checkbox" checked={!site.hidden.includes(selected)} onChange={e => update({ hidden: e.target.checked ? site.hidden.filter(id => id !== selected) : [...site.hidden, selected] })}/></label>
        {tab === "content" && <>
          {selected === "header" && <><Field label="Business name" value={site.brand} onChange={brand => update({ brand })}/><Field label="Menu items (comma separated)" value={site.nav.join(", ")} onChange={v => update({ nav: v.split(",").map(x => x.trim()).filter(Boolean).slice(0, 5) })}/></>}
          {selected === "hero" && <><Field label="Eyebrow" value={site.eyebrow} onChange={eyebrow => update({ eyebrow })}/><Field label="Main headline" multiline value={site.headline} onChange={headline => update({ headline })}/><Field label="Description" multiline value={site.description} onChange={description => update({ description })}/><div className="editor-divider"/><div className="field"><span>Hero media</span><Choice label="Media type" value={site.mediaKind ?? "image"} options={[{value:"image",label:"Image"},{value:"video",label:"YouTube / Vimeo"}]} onChange={mediaKind=>update({mediaKind})}/><Field label="Image alt text (SEO & accessibility)" value={site.mediaAlt ?? ""} onChange={mediaAlt=>update({mediaAlt})}/><label className="upload-media">Upload image<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)addMedia(f);}}/></label>{media.length>0&&<div className="media-library">{media.map((m,i)=><button key={i} onClick={()=>update({image:m.url,mediaKind:"image"})}>{m.name}</button>)}</div>}<div className="image-thumb" style={{ backgroundImage: safeImage(site.image) ? `url("${safeImage(site.image)}")` : undefined }}/><input aria-label="Hero image URL" value={site.image} onChange={e => update({ image: e.target.value })}/><small>Use a direct HTTPS image URL, or a YouTube/Vimeo share URL in Video mode. Uploaded images are session-only until a persistent media library is built.</small></div></>}
          {selected === "services" && <><Field label="Section headline" value={site.servicesTitle} onChange={servicesTitle => update({ servicesTitle })}/>{site.services.map((service, i) => <div className="service-editor" key={i}><strong>Service {i + 1}</strong><Field label="Name" value={service.title} onChange={title => update({ services: site.services.map((s, j) => j === i ? { ...s, title } : s) })}/><Field label="Description" multiline value={service.description} onChange={description => update({ services: site.services.map((s, j) => j === i ? { ...s, description } : s) })}/><label className="field"><span>Icon</span><select value={service.icon} onChange={e => update({ services: site.services.map((s, j) => j === i ? { ...s, icon: e.target.value as IconName } : s) })}>{icons.map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></label><button className="subtle-action" onClick={() => update({ services: site.services.filter((_, j) => j !== i) })}>Remove service</button></div>)}<button className="add-service" onClick={() => update({ services: [...site.services, { title: "New service", description: "Describe your service.", icon: "check" }] })}>+ Add service</button></>}
          {selected === "proof" && <><Field label="Headline" value={site.proofTitle} onChange={proofTitle => update({ proofTitle })}/><Field label="Description" multiline value={site.proofText} onChange={proofText => update({ proofText })}/></>}
          {selected === "contact" && <><Field label="Headline" value={site.contactTitle} onChange={contactTitle => update({ contactTitle })}/><Field label="Description" multiline value={site.contactText} onChange={contactText => update({ contactText })}/><Field label="Email" value={site.email} onChange={email => update({ email })}/></>}
          {extra && <><Field label="Section heading" value={extra.title} onChange={title => extraUpdate(selected, { title })}/><Field label="Supporting text" multiline value={extra.description} onChange={description => extraUpdate(selected, { description })}/>{extra.items.map((item, i) => <div className="service-editor" key={i}><strong>Item {i + 1}</strong><Field label="Title" value={item.title} onChange={title => extraUpdate(selected, { items: extra.items.map((x, j) => i === j ? { ...x, title } : x) })}/><Field label="Description" multiline value={item.description} onChange={description => extraUpdate(selected, { items: extra.items.map((x, j) => i === j ? { ...x, description } : x) })}/><label className="field"><span>Icon</span><select value={item.icon} onChange={e => extraUpdate(selected, { items: extra.items.map((x, j) => i === j ? { ...x, icon: e.target.value as IconName } : x) })}>{icons.map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></label><button className="subtle-action" onClick={() => extraUpdate(selected, { items: extra.items.filter((_, j) => i !== j) })}>Remove item</button></div>)}{selected !== "quote" && selected !== "closing" && <button className="add-service" onClick={() => extraUpdate(selected, { items: [...extra.items, { title: "New item", description: "Describe this item", icon: "check" }] })}>+ Add item</button>}</>}
          {selected === "header" && <><Field label="SEO page title" value={site.seoTitle ?? ""} onChange={seoTitle=>update({seoTitle})}/><Field label="SEO description" multiline value={site.seoDescription ?? ""} onChange={seoDescription=>update({seoDescription})}/></>}
          {selected === "footer" && <><Field label="Business name" value={site.brand} onChange={brand => update({ brand })}/><Field label="Phone" value={site.phone} onChange={phone => update({ phone })}/><Field label="Email" value={site.email} onChange={email => update({ email })}/><Field label="Location" value={site.address} onChange={address => update({ address })}/></>}
        </>}
        {tab === "design" && <><label className="field"><span>Brand accent</span><div className="color-input"><input type="color" value={/^#[0-9a-f]{6}$/i.test(site.accent) ? site.accent : "#5878f5"} onChange={e => update({ accent: e.target.value })}/><code>{site.accent}</code></div></label>
          {selected === "header" && <Choice label="Header style" value={site.headerStyle} onChange={headerStyle => update({ headerStyle })} options={[{ value: "classic", label: "Classic" }, { value: "centered", label: "Centered" }]}/>}
          {extra && <><Field label="Section heading" value={extra.title} onChange={title => extraUpdate(selected, { title })}/><Field label="Supporting text" multiline value={extra.description} onChange={description => extraUpdate(selected, { description })}/>{extra.items.map((item, i) => <div className="service-editor" key={i}><strong>Item {i + 1}</strong><Field label="Title" value={item.title} onChange={title => extraUpdate(selected, { items: extra.items.map((x, j) => i === j ? { ...x, title } : x) })}/><Field label="Description" multiline value={item.description} onChange={description => extraUpdate(selected, { items: extra.items.map((x, j) => i === j ? { ...x, description } : x) })}/><label className="field"><span>Icon</span><select value={item.icon} onChange={e => extraUpdate(selected, { items: extra.items.map((x, j) => i === j ? { ...x, icon: e.target.value as IconName } : x) })}>{icons.map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></label><button className="subtle-action" onClick={() => extraUpdate(selected, { items: extra.items.filter((_, j) => i !== j) })}>Remove item</button></div>)}{selected !== "quote" && selected !== "closing" && <button className="add-service" onClick={() => extraUpdate(selected, { items: [...extra.items, { title: "New item", description: "Describe this item", icon: "check" }] })}>+ Add item</button>}</>}
          {selected === "footer" && <Choice label="Footer style" value={site.footerStyle} onChange={footerStyle => update({ footerStyle })} options={[{ value: "columns", label: "Columns" }, { value: "minimal", label: "Minimal" }]}/>}
          {selected === "hero" && <><Choice label="Hero layout" value={site.layout} onChange={layout => update({ layout })} options={[{ value: "split", label: "Split" }, { value: "center", label: "Center" }, { value: "image", label: "Full image" }]}/><Choice label="Text alignment" value={site.align} onChange={align => update({ align })} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }]}/><label className="field"><span>Image darkness: {site.overlay}%</span><input type="range" min="0" max="80" value={site.overlay} onChange={e => update({ overlay: Number(e.target.value) })}/></label></>}
          {!["header", "hero", "footer"].includes(selected) && <p className="helper-text">This section inherits your brand colors and responsive typography automatically.</p>}
        </>}
        {tab === "actions" && <>{selected === "hero" || selected === "contact" || selected === "closing" || selected === "promo" ? (["primary", "secondary"] as const).map((which, i) => <div key={which} className="action-editor"><h3>{i === 0 ? "Primary button" : "Secondary button"}</h3><Field label="Button text" value={(selected === "contact" && which === "secondary" ? site.contactSecondary : site[which]).label} onChange={label => selected === "contact" && which === "secondary" ? update({ contactSecondary: { ...site.contactSecondary, label } }) : buttonUpdate(which, { label })}/><Field label="Link / phone / email" value={(selected === "contact" && which === "secondary" ? site.contactSecondary : site[which]).href} onChange={href => selected === "contact" && which === "secondary" ? update({ contactSecondary: { ...site.contactSecondary, href } }) : buttonUpdate(which, { href })}/><div className="field"><span>Optional button icon</span><div className="icon-grid">{icons.map(icon => <button key={icon} title={icon} aria-label={`${which} button: ${icon} icon`} className={(selected === "contact" && which === "secondary" ? site.contactSecondary : site[which]).icon === icon ? "icon-active" : ""} onClick={() => selected === "contact" && which === "secondary" ? update({ contactSecondary: { ...site.contactSecondary, icon } }) : buttonUpdate(which, { icon })}>{icon === "none" ? "×" : <Icon name={icon}/>}</button>)}</div></div></div>) : <p className="helper-text">This section has no individual button actions. Select Hero or Contact to configure your calls to action.</p>}</>}
      </div><div className="inspector-bottom"><span>● Auto-saved locally</span><button onClick={() => { if (window.confirm("Reset all demo content?")) dispatch({ type: "load", next: initial }); }}>Reset demo</button></div>
    </aside>}
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
  </main>;
}
