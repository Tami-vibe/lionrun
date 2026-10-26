"use client";
import {useEffect,useId,useRef,useState,type KeyboardEvent,type ReactNode} from 'react';
import {Building2,Globe,UserRound,CreditCard,Sparkles} from 'lucide-react';
import {Field} from './fields';
import {BrandSettings, type BrandSitePatch} from './brand-settings';
import {fontPairs, normalizeBrandKit, headerLook} from './settings';
import type {Site} from '../site/blocks';
import {normalizeEyebrowStyle} from '../site/blocks';

export type ProfileDetails = {ownerName: string};
export type BusinessDetails = {brand: string; email: string; address: string; phone: string; hours: string};
export type SettingsPane = 'business' | 'brand' | 'profile' | 'plan' | 'usage';

function brandPatchDirty(site: Site | undefined, draft: BrandSitePatch) {
  if (!site || !Object.keys(draft).length) return false;
  if (draft.theme !== undefined && draft.theme !== site.theme) return true;
  if (draft.accent !== undefined && draft.accent !== site.accent) return true;
  if (draft.eyebrowStyle !== undefined && draft.eyebrowStyle !== normalizeEyebrowStyle(site.eyebrowStyle)) return true;
  if (draft.headerStyle !== undefined && headerLook(draft.headerStyle) !== headerLook(site.headerStyle)) return true;
  if (draft.footerStyle !== undefined && draft.footerStyle !== site.footerStyle) return true;
  if (draft.brandKit) {
    const next = normalizeBrandKit({...normalizeBrandKit(site.brandKit), ...draft.brandKit});
    const cur = normalizeBrandKit(site.brandKit);
    if (next.fontPair !== cur.fontPair || next.radius !== cur.radius || next.lineWidth !== cur.lineWidth) return true;
  }
  return false;
}

const settingsGroups: {label: string; items: {id: SettingsPane; label: string; hint?: string; icon: ReactNode}[]}[] = [
  {label: 'Website', items: [
    {id: 'business', label: 'Business details', icon: <Building2 size={16} strokeWidth={1.75} aria-hidden="true"/>},
    {id: 'brand', label: 'Website brand', icon: <Globe size={16} strokeWidth={1.75} aria-hidden="true"/>},
  ]},
  {label: 'Personal', items: [
    {id: 'profile', label: 'Profile', icon: <UserRound size={16} strokeWidth={1.75} aria-hidden="true"/>},
  ]},
  {label: 'Account', items: [
    {id: 'plan', label: 'Plan & billing', hint: 'Not connected', icon: <CreditCard size={16} strokeWidth={1.75} aria-hidden="true"/>},
    {id: 'usage', label: 'AI usage', hint: 'Not connected', icon: <Sparkles size={16} strokeWidth={1.75} aria-hidden="true"/>},
  ]},
];

const editablePanes = new Set<SettingsPane>(['business', 'brand', 'profile']);

function BrandLivePreview({site, draft}:{site: Site; draft: BrandSitePatch}) {
  const merged = {...site, ...draft, brandKit: normalizeBrandKit({...normalizeBrandKit(site.brandKit), ...draft.brandKit})};
  const kit = normalizeBrandKit(merged.brandKit);
  const pair = fontPairs[kit.fontPair];
  const accent = /^#[0-9a-f]{6}$/i.test(merged.accent || '') ? merged.accent! : '#2563eb';
  const dark = merged.theme === 'midnight';
  const hero = site.blocks.find(b => b.type === 'hero');
  return <div className="brand-live-preview" aria-label="Live preview" data-theme={dark ? 'midnight' : 'paper'} style={{
    ['--brand-display' as string]: `var(${pair.displayVar})`,
    ['--brand-text' as string]: `var(${pair.textVar})`,
    ['--preview-accent' as string]: accent,
  }}>
    <p className="brand-live-label">Live preview</p>
    <div className="brand-phone">
      <div className="brand-phone-nav"><b style={{fontFamily: 'var(--brand-display), sans-serif'}}>{site.brand || 'Brand'}</b><i/><i/><i/></div>
      <div className="brand-phone-hero">
        <strong style={{fontFamily: 'var(--brand-display), sans-serif'}}>{hero?.content.title || site.headline}</strong>
        <span style={{fontFamily: 'var(--brand-text), sans-serif'}}>{hero?.content.description || site.description}</span>
        <em style={{background: accent}}>Get started</em>
      </div>
      <div className="brand-phone-body" style={{fontFamily: 'var(--brand-text), sans-serif'}}>
        <i/><i/><i/>
      </div>
    </div>
  </div>;
}

function focusables(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
}

export function SettingsDialog({profile, business, pageCount, initialPane = 'business', onClose, onSaveProfile, onSaveBusiness, site, onSaveBrand}:{
  profile: ProfileDetails; business: BusinessDetails; pageCount: number; initialPane?: SettingsPane;
  onClose: () => void; onSaveProfile: (next: ProfileDetails) => void; onSaveBusiness: (next: BusinessDetails) => void;
  site?: Site; onSaveBrand?: (patch: BrandSitePatch) => void;
}) {
  const [pane, setPane] = useState<SettingsPane>(initialPane);
  const [profileDraft, setProfileDraft] = useState(profile);
  const [businessDraft, setBusinessDraft] = useState(business);
  const [brandDraft, setBrandDraft] = useState<BrandSitePatch>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  const brandDirty = brandPatchDirty(site, brandDraft);
  const profileDirty = profileDraft.ownerName !== profile.ownerName;
  const businessDirty = (['brand', 'email', 'address', 'phone', 'hours'] as const).some(key => businessDraft[key] !== business[key]);
  const dirty = pane === 'profile' ? profileDirty : pane === 'business' ? businessDirty : pane === 'brand' ? brandDirty : false;
  const editable = editablePanes.has(pane);
  const heading = settingsGroups.flatMap(g => g.items).find(item => item.id === pane)?.label || 'Settings';

  useEffect(() => {
    opener.current = document.activeElement;
    const node = dialogRef.current;
    if (node && !node.open) node.showModal();
    const first = node ? focusables(node)[0] : null;
    first?.focus();
    return () => {(opener.current as HTMLElement | null)?.focus?.();};
  }, []);

  const discardPane = (next: SettingsPane) => {
    if (pane === 'profile') setProfileDraft(profile);
    if (pane === 'business') setBusinessDraft(business);
    if (pane === 'brand') setBrandDraft({});
    setPane(next);
  };

  const requestPane = (next: SettingsPane) => {
    if (next === pane) return;
    if (dirty && !window.confirm('Discard unsaved changes on this screen?')) return;
    discardPane(next);
  };

  const requestClose = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    onClose();
  };

  const save = () => {
    if (pane === 'profile') { onSaveProfile(profileDraft); setProfileDraft(profileDraft); }
    if (pane === 'business') { onSaveBusiness(businessDraft); setBusinessDraft(businessDraft); }
    if (pane === 'brand' && onSaveBrand) { onSaveBrand(brandDraft); setBrandDraft({}); }
  };

  const cancel = () => {
    if (pane === 'profile') setProfileDraft(profile);
    if (pane === 'business') setBusinessDraft(business);
    if (pane === 'brand') setBrandDraft({});
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); requestClose(); return; }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const items = focusables(dialogRef.current);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const patchBrand = (patch: BrandSitePatch) => setBrandDraft(current => {
    const brandKit = patch.brandKit ? normalizeBrandKit({...normalizeBrandKit(site?.brandKit), ...normalizeBrandKit(current.brandKit), ...patch.brandKit}) : current.brandKit;
    return {...current, ...patch, ...(brandKit ? {brandKit} : {})};
  });

  const draftSite = site ? {
    ...site,
    ...brandDraft,
    brandKit: normalizeBrandKit({...normalizeBrandKit(site.brandKit), ...brandDraft.brandKit}),
    eyebrowStyle: brandDraft.eyebrowStyle ?? normalizeEyebrowStyle(site.eyebrowStyle),
    headerStyle: brandDraft.headerStyle ?? headerLook(site.headerStyle),
    footerStyle: brandDraft.footerStyle ?? site.footerStyle,
  } : undefined;

  return <dialog ref={dialogRef} className="settings-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); requestClose(); }} onKeyDown={onKeyDown}>
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings">
        <h2 id={titleId}>Settings</h2>
        {settingsGroups.map(group => <div key={group.label} className="settings-nav-group">
          <p className="settings-nav-label">{group.label}</p>
          {group.items.map(item => <button type="button" key={item.id} aria-current={pane === item.id ? 'page' : undefined} onClick={() => requestPane(item.id)}>
            {item.icon}<span className="grow"><b>{item.label}</b>{item.hint && <small>{item.hint}</small>}</span>
          </button>)}
        </div>)}
      </nav>
      <div className="settings-main">
        <div className="settings-pane">
          <button type="button" className="subtle-action settings-close" onClick={requestClose}>Close</button>
          <h2 className="settings-heading">{heading}</h2>
          {pane === 'profile' && <div className="account-form" aria-label="Profile">
            <p className="account-note">Personal information for your account. This does not change public website contact details.</p>
            <Field label="Your name" value={profileDraft.ownerName} onChange={value => setProfileDraft(d => ({...d, ownerName: value}))}/>
          </div>}
          {pane === 'business' && <div className="account-form" aria-label="Business details">
            <p className="account-note settings-impact">Updates contact information across website pages. Saving writes the business name, address, phone, email, and hours onto Home chrome and the Contact section on all {pageCount} page{pageCount === 1 ? '' : 's'}.</p>
            <Field label="Business name" value={businessDraft.brand} onChange={value => setBusinessDraft(d => ({...d, brand: value}))}/>
            <Field label="Website email" value={businessDraft.email} type="email" onChange={value => setBusinessDraft(d => ({...d, email: value}))}/>
            <Field label="Phone" value={businessDraft.phone} type="tel" onChange={value => setBusinessDraft(d => ({...d, phone: value}))}/>
            <Field label="Address" value={businessDraft.address} multiline onChange={value => setBusinessDraft(d => ({...d, address: value}))}/>
            <Field label="Opening hours" value={businessDraft.hours} multiline onChange={value => setBusinessDraft(d => ({...d, hours: value}))}/>
          </div>}
          {pane === 'brand' && site && draftSite && onSaveBrand && <div className="brand-settings-layout">
            <BrandSettings site={draftSite} change={patchBrand}/>
            <BrandLivePreview site={site} draft={brandDraft}/>
          </div>}
          {pane === 'brand' && !(site && onSaveBrand) && <p>Open the editor to change website brand settings.</p>}
          {pane === 'plan' && <p className="settings-empty" role="status">Plan & billing isn’t connected yet.</p>}
          {pane === 'usage' && <p className="settings-empty" role="status">AI usage isn’t connected yet.</p>}
        </div>
        {editable && <footer className="settings-footer">
          <span className="settings-dirty" data-dirty={dirty || undefined}>{dirty ? <><i aria-hidden="true"/>Unsaved changes</> : null}</span>
          <div className="grow"/>
          <button type="button" className="quiet" onClick={cancel} disabled={!dirty}>Cancel</button>
          <button type="button" className="publish-btn" onClick={save} disabled={!dirty}>Save changes</button>
        </footer>}
      </div>
    </div>
  </dialog>;
}
