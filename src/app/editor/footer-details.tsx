 'use client';
import type {ReactNode} from 'react';
import {ChevronRight, Trash2, Plus, Link2} from 'lucide-react';
import {SidebarSelect as Choice, Field} from './components/fields';
import {validOfficeDay, type FooterConfig, type FooterColumn} from '../site/footer-model';
type Shared = {config: FooterConfig; setNotice: (notice: string) => void};
export function FooterHours({config, write, setNotice}: Shared & {write: (patch: Partial<FooterConfig>) => void}) {
  return <>
          <Choice label="Business" value={config.online ? 'online' : 'physical'}
            onChange={v => write({online: v === 'online'})}
            options={[{value: 'physical', label: 'Physical location'},
              {value: 'online', label: 'Online business'}]}/>
          {config.online ? <p>Office hours are hidden. Your schedule stays saved.</p> : <>
            {!config.hoursReady && <p>Add your hours before they appear on your website.</p>}
            {config.hours.map((day, i) => <div className="footer-office-day" key={day.day}>
              <label><input type="checkbox" checked={!day.closed} onChange={event => write({
                hoursReady: true, hours: config.hours.map((d, j) => j === i
                  ? {...d, closed: !event.target.checked} : d),
              })}/>{day.day}</label>
              {(['open', 'close'] as const).map(key => <input type="time" key={key}
                aria-label={`${day.day} ${key === 'open' ? 'opens' : 'closes'}`}
                disabled={day.closed} value={day[key]} onChange={event => {
                  const next = {...day, [key]: event.target.value};
                  if (!validOfficeDay(next)) {setNotice('Closing time must follow opening time.');
                    return;}
                  setNotice(''); write({hoursReady: true,
                    hours: config.hours.map((d, j) => j === i ? next : d)});
                }}/>) }
            </div>)}
            <p className="helper-text">Unchecked days show Closed.</p>
          </>}
  </>;
}
export function FooterSocials({config, setSocialDraft, setNotice, remove, children}: Shared & {
  setSocialDraft: (draft: {id?: string; label: string; href: string}) => void;
  remove: (key: 'socials', id: string) => void;
  children: ReactNode;
}) {
  return <>
        <h3>Social media</h3>
        {config.socials.map(item => <div className="footer-link-row" key={item.id}>
          <button type="button" onClick={() => {setSocialDraft(item); setNotice('');}}>
            {item.label}<ChevronRight size={15}/></button>
          <button type="button" className="footer-danger" aria-label={`Remove ${item.label}`}
            onClick={() => remove('socials', item.id)}>
            <Trash2 size={16}/></button>
        </div>)}
        {!config.socials.length && <p className="helper-text">Add your first social account.</p>}
        <button type="button" className="subtle-action" disabled={config.socials.length >= 60}
          onClick={() => {setSocialDraft({label: '', href: ''}); setNotice('');}}>
          <Plus size={16}/>Add social link</button>
        {children}
  </>;
}

export function FooterSocialForm({draft, change, save, cancel}: {
  draft: {id?: string; label: string; href: string}; change: (draft: {id?: string; label: string; href: string}) => void; save: () => void; cancel: () => void;
}) {
  return <div className="footer-social-form">
    <Field label="Platform or name" value={draft.label} onChange={label => change({...draft, label})}/>
    <Field label="Account URL" value={draft.href} onChange={href => change({...draft, href})}/>
    <div className="footer-control-pair"><button type="button" onClick={save}>Save link</button><button type="button" onClick={cancel}>Cancel</button></div>
  </div>;
}
export function FooterColumnLinks({currentColumn, pages, change, editDestination}: {
  currentColumn: FooterColumn; pages: {id: string}[]; change: (patch: Partial<FooterColumn>) => void; editDestination: (item: FooterColumn['links'][number], index: number) => void;
}) {
  return <>
        {currentColumn.links.map((item, i) => <div className="footer-column-link" key={i}>
          <Field label="Display name" value={item.label} onChange={label => change( {
            links: currentColumn.links.map((l, j) => i === j
              ? {...l, label, customLabel: true} : l),
          })}/>
          <button type="button" onClick={() => editDestination(item, i)}><Link2 size={15}/>Change destination</button>
          {item.pageId && !pages.some(page => page.id === item.pageId) && <p role="alert">
            This page was removed. Choose another page.</p>}
          <button type="button" className="footer-danger" onClick={() => change( {
            links: currentColumn.links.filter((_, j) => i !== j),
          })}><Trash2 size={15}/>Remove link</button>
        </div>)}
  </>;
}

import type {Block, Site} from '../site/blocks';
import type {PageEntry} from './navigation';
export type FooterEditorProps = {
  block: Block;
  site: Site;
  pages: PageEntry<Site>[];
  defaults: FooterColumn[];
  view: 'Content' | 'Appearance';
  update: (patch: Partial<Site>) => void;
};
