"use client";

import { useEffect, useReducer, useState } from "react";

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
  phone: string; email: string; address: string; accent: string; hidden: SectionId[]; extras: Record<string, Extra>; contactSecondary: ButtonData;
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
  phone: "+1 (312) 555-0184", email: "hello@example.com", address: "Chicago, Illinois", accent: "#5878f5", hidden: [], contactSecondary: { label: "Call the shop", href: "tel:+13125550184", icon: "phone" },
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
  try { const u = new URL(value); return u.protocol === "https:" ? u.href : ""; } catch { return ""; }
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
  const props = (id: SectionId) => ({ onClick: editable ? (e: React.MouseEvent) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); select(id); } : undefined,
    className: `${editable ? "editable-section" : ""} ${editable && selected === id ? "selected-section" : ""}` });
  return <div className="site-preview" style={{ "--accent": site.accent } as React.CSSProperties}>
    {active("header") && <header {...props("header")}><div className={`site-header ${site.headerStyle === "centered" ? "header-centered" : ""}`}>
      <a className="site-brand" href="#top" onClick={editable ? e => e.preventDefault() : undefined}><span className="brand-mark">✳</span>{site.brand}</a>
      <nav aria-label="Main navigation">{site.nav.map((item, i) => <a key={i} href={["#services", "#proof", "#contact"][i] ?? "#contact"}>{item}</a>)}</nav>
      <a className="header-contact" href="tel:+13125550184" onClick={editable ? e => e.preventDefault() : undefined}>Let&apos;s talk <Icon name="arrow" size={16}/></a>
    </div></header>}
    {active("hero") && <section id="top" {...props("hero")} className={`${props("hero").className} hero hero-${site.layout} text-${site.align}`}>
      <div className="hero-photo" style={{ backgroundImage: safeImage(site.image) ? `linear-gradient(90deg, rgba(8,13,19,${Math.min(site.overlay + 20, 90) / 100}),rgba(8,13,19,${site.overlay / 100})),url("${safeImage(site.image)}")` : undefined }}/>
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
    {active("contact") && <section id="contact" {...props("contact")} className={`${props("contact").className} contact-section`}><div><span className="section-kicker">YOUR NEXT STEP</span><h2>{site.contactTitle}</h2><p>{site.contactText}</p></div><div className="contact-actions"><a href={safeHref(site.primary.href)} onClick={editable ? e => e.preventDefault() : undefined} className="contact-main" style={{ background: site.accent }}>{site.primary.label}<Icon name={site.primary.icon}/></a><a className="contact-secondary" href={safeHref(site.contactSecondary.href)} onClick={editable ? e => e.preventDefault() : undefined}>{site.contactSecondary.label}<Icon name={site.contactSecondary.icon}/></a><a href={`mailto:${site.email}`} onClick={editable ? e => e.preventDefault() : undefined}>{site.email}</a></div></section>}
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
export default function Home() {
  const [history, dispatch] = useReducer(historyReducer, { past: [], present: initial, future: [] });
  const site = history.present;
  const [selected, setSelected] = useState<SectionId>("hero");
  const [tab, setTab] = useState<"content" | "design" | "actions">("content");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { try { const raw = localStorage.getItem("business-builder-demo-v1"); if (raw) { const parsed: unknown = JSON.parse(raw); if (validSite(parsed)) dispatch({ type: "load", next: { ...initial, ...parsed, extras: { ...initial.extras, ...parsed.extras }, contactSecondary: parsed.contactSecondary ?? initial.contactSecondary } }); } } catch {} setReady(true); }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (ready) try { localStorage.setItem("business-builder-demo-v1", JSON.stringify(site)); } catch {} }, [site, ready]);
  const update = (patch: Partial<Site>) => dispatch({ type: "set", next: { ...site, ...patch } });
  const extraUpdate = (id: SectionId, patch: Partial<Extra>) => update({ extras: { ...site.extras, [id]: { ...site.extras[id], ...patch } } });
  const buttonUpdate = (which: "primary" | "secondary", patch: Partial<ButtonData>) => update({ [which]: { ...site[which], ...patch } });
  const flash = (message: string) => { setNotice(message); };
  const exportConfig = () => { const blob = new Blob([JSON.stringify(site, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "business-website-config.json"; a.click(); URL.revokeObjectURL(url); flash("Configuration exported"); };
  const extra = site.extras[selected];
  const section = sections.find(s => s.id === selected)!;
  return <main className="builder-shell">
    <aside className="builder-rail"><div className="rail-logo">b<span>.</span></div><button className="rail-selected" aria-label="Website editor">▦</button><button aria-label="Pages coming later" title="Pages coming later" onClick={() => flash("Multi-page management is planned for a later milestone")}>▤</button><div className="rail-spacer"/><div className="rail-avatar">B</div></aside>
    <aside className="builder-sidebar"><div className="sidebar-heading"><div><span className="sidebar-overline">YOUR WORKSPACE</span><h2>Website builder</h2></div><span className="sidebar-dot"/></div>
      <div className="sidebar-project"><div className="project-icon">N</div><div><strong>{site.brand}</strong><span>Business website · Draft</span></div><span>⌄</span></div>
      <div className="sidebar-label">SITE STRUCTURE <span>{sections.length} sections</span></div><div className="section-list">{sections.map(s => <button key={s.id} onClick={() => { setSelected(s.id); setTab("content"); setPreview(false); }} className={selected === s.id ? "section-active" : ""}><span className="section-symbol">{s.id === "hero" ? "▧" : s.id === "header" ? "▤" : s.id === "footer" ? "▱" : "▦"}</span><span className="section-info"><strong>{s.label}</strong><small>{s.detail}</small></span><span className="section-indicator">{site.hidden.includes(s.id) ? "◌" : "›"}</span></button>)}</div>
      <div className="sidebar-bottom"><div className="sidebar-tip"><strong>Made for business.</strong><p>Click any section on the canvas to edit it instantly.</p></div><span>EDITOR V0.1 · LOCAL DEMO</span></div>
    </aside>
    <div className="workspace"><div className="workspace-toolbar"><div className="toolbar-left"><span className="breadcrumb">My website</span><span className="crumb-separator">/</span><strong>Homepage</strong><span className="draft-badge">Draft</span></div><div className="toolbar-middle" role="group" aria-label="Preview size"><button className={device === "desktop" ? "tool-active" : ""} onClick={() => setDevice("desktop")} title="Desktop" aria-label="Desktop preview"><DeviceIcon type="desktop"/></button><button className={device === "tablet" ? "tool-active" : ""} onClick={() => setDevice("tablet")} title="Tablet" aria-label="Tablet preview"><DeviceIcon type="tablet"/></button><button className={device === "mobile" ? "tool-active" : ""} onClick={() => setDevice("mobile")} title="Mobile" aria-label="Mobile preview"><DeviceIcon type="mobile"/></button><span className="device-label">{device === "desktop" ? "Desktop" : device === "tablet" ? "Tablet" : "Mobile"}</span></div><div className="toolbar-right"><button onClick={() => dispatch({ type: "undo" })} disabled={!history.past.length} title="Undo">↶</button><button onClick={() => dispatch({ type: "redo" })} disabled={!history.future.length} title="Redo">↷</button><button onClick={() => setPreview(!preview)} className="preview-toggle">{preview ? "Edit site" : "Preview"}</button><button className="publish-btn" onClick={exportConfig}>Export <Icon name="arrow" size={15}/></button></div></div>
      <div className={`canvas-area ${preview ? "canvas-preview" : ""}`}><div className={`canvas-frame frame-${device}`}><div className="canvas-top"><span className="canvas-live-dot"/> {preview ? "PREVIEW MODE" : "LIVE EDITOR"}<span className="canvas-url">northline.example</span></div><SitePreview site={site} selected={selected} select={setSelected} editable={!preview}/></div></div>
    </div>
    {!preview && <aside className="inspector"><div className="inspector-top"><div><span className="inspector-overline">SECTION EDITOR</span><h2>{section.label} <span>HUD</span></h2></div><span className="inspector-status">● Live</span></div><div className="inspector-tabs"><button className={tab === "content" ? "tab-active" : ""} onClick={() => setTab("content")}>Content</button><button className={tab === "design" ? "tab-active" : ""} onClick={() => setTab("design")}>Design</button><button className={tab === "actions" ? "tab-active" : ""} onClick={() => setTab("actions")}>Actions</button></div>
      <div className="inspector-body">
        <div className="editor-intro"><strong>{tab === "content" ? "Make it yours" : tab === "design" ? "Fine-tune the look" : "Connect your visitors"}</strong><p>{tab === "content" ? "Changes appear instantly on your website." : tab === "design" ? "Choose a style that feels right for your brand." : "Set where your buttons take people."}</p></div>
        <label className="visibility-toggle"><span>Show this section</span><input type="checkbox" checked={!site.hidden.includes(selected)} onChange={e => update({ hidden: e.target.checked ? site.hidden.filter(id => id !== selected) : [...site.hidden, selected] })}/></label>
        {tab === "content" && <>
          {selected === "header" && <><Field label="Business name" value={site.brand} onChange={brand => update({ brand })}/><Field label="Menu items (comma separated)" value={site.nav.join(", ")} onChange={v => update({ nav: v.split(",").map(x => x.trim()).filter(Boolean).slice(0, 5) })}/></>}
          {selected === "hero" && <><Field label="Eyebrow" value={site.eyebrow} onChange={eyebrow => update({ eyebrow })}/><Field label="Main headline" multiline value={site.headline} onChange={headline => update({ headline })}/><Field label="Description" multiline value={site.description} onChange={description => update({ description })}/><div className="editor-divider"/><div className="field"><span>Hero image (HTTPS URL)</span><div className="image-thumb" style={{ backgroundImage: safeImage(site.image) ? `url("${safeImage(site.image)}")` : undefined }}/><input aria-label="Hero image URL" value={site.image} onChange={e => update({ image: e.target.value })}/><small>Use an HTTPS image URL. Uploads arrive in a later milestone.</small></div></>}
          {selected === "services" && <><Field label="Section headline" value={site.servicesTitle} onChange={servicesTitle => update({ servicesTitle })}/>{site.services.map((service, i) => <div className="service-editor" key={i}><strong>Service {i + 1}</strong><Field label="Name" value={service.title} onChange={title => update({ services: site.services.map((s, j) => j === i ? { ...s, title } : s) })}/><Field label="Description" multiline value={service.description} onChange={description => update({ services: site.services.map((s, j) => j === i ? { ...s, description } : s) })}/><label className="field"><span>Icon</span><select value={service.icon} onChange={e => update({ services: site.services.map((s, j) => j === i ? { ...s, icon: e.target.value as IconName } : s) })}>{icons.map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></label><button className="subtle-action" onClick={() => update({ services: site.services.filter((_, j) => j !== i) })}>Remove service</button></div>)}<button className="add-service" onClick={() => update({ services: [...site.services, { title: "New service", description: "Describe your service.", icon: "check" }] })}>+ Add service</button></>}
          {selected === "proof" && <><Field label="Headline" value={site.proofTitle} onChange={proofTitle => update({ proofTitle })}/><Field label="Description" multiline value={site.proofText} onChange={proofText => update({ proofText })}/></>}
          {selected === "contact" && <><Field label="Headline" value={site.contactTitle} onChange={contactTitle => update({ contactTitle })}/><Field label="Description" multiline value={site.contactText} onChange={contactText => update({ contactText })}/><Field label="Email" value={site.email} onChange={email => update({ email })}/></>}
          {extra && <><Field label="Section heading" value={extra.title} onChange={title => extraUpdate(selected, { title })}/><Field label="Supporting text" multiline value={extra.description} onChange={description => extraUpdate(selected, { description })}/>{extra.items.map((item, i) => <div className="service-editor" key={i}><strong>Item {i + 1}</strong><Field label="Title" value={item.title} onChange={title => extraUpdate(selected, { items: extra.items.map((x, j) => i === j ? { ...x, title } : x) })}/><Field label="Description" multiline value={item.description} onChange={description => extraUpdate(selected, { items: extra.items.map((x, j) => i === j ? { ...x, description } : x) })}/><label className="field"><span>Icon</span><select value={item.icon} onChange={e => extraUpdate(selected, { items: extra.items.map((x, j) => i === j ? { ...x, icon: e.target.value as IconName } : x) })}>{icons.map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></label><button className="subtle-action" onClick={() => extraUpdate(selected, { items: extra.items.filter((_, j) => i !== j) })}>Remove item</button></div>)}{selected !== "quote" && selected !== "closing" && <button className="add-service" onClick={() => extraUpdate(selected, { items: [...extra.items, { title: "New item", description: "Describe this item", icon: "check" }] })}>+ Add item</button>}</>}
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
