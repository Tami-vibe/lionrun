'use client';
import {useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, ArrowLeft, Bold, CaseSensitive,
  CaseUpper, ChevronRight, Link2, MoveHorizontal,
  Plus, Rows3, Trash2, Type,
} from 'lucide-react';
import type {Block, Site} from '../site/blocks';
import type {PageEntry} from './navigation';
import type {FooterColumn} from './settings';
import {
  footerDefaults, footerLayouts, safeSocialUrl, validOfficeDay,
  type FooterConfig, type FooterLink, type FooterTarget, type FooterText,
} from '../site/footer-model';
import {Choice, Field} from './fields';
import {createDefaultMenus} from './menu-model';
import {MediaPicker, MediaView, publishAsset, useMediaLibrary} from '../media/library';
import {mediaDefaults} from '../media/model';
import {MediaUpload} from './media-upload';
import {directMediaLink} from './hero-collection';
import {HeroMediaEditor} from './hero-media';

type Props = {
  block: Block;
  site: Site;
  pages: PageEntry<Site>[];
  defaults: FooterColumn[];
  view: 'Content' | 'Appearance';
  update: (patch: Partial<Site>) => void;
};
const targets: {value: FooterTarget; label: string}[] = [
  {value: 'heading', label: 'Titles'}, {value: 'body', label: 'Text & links'},
  {value: 'motto', label: 'Motto'}, {value: 'bottom', label: 'Bottom row'},
  {value: 'hours', label: 'Opening hours'},
];
const alignments = [
  {value: 'left', label: 'Left', icon: AlignLeft},
  {value: 'center', label: 'Center', icon: AlignCenter},
  {value: 'right', label: 'Right', icon: AlignRight},
] as const;
function Alignment({value, change, label}: {
  value: string; label: string; change: (value: 'left' | 'center' | 'right') => void;
}) {
  return <div className="field" role="group" aria-label={label}>
    <span>{label}</span><div className="choice-group">
      {alignments.map(({value: next, label: text, icon: Glyph}) => (
        <button type="button" key={next} aria-pressed={value === next}
          onClick={() => change(next)}><Glyph size={16} aria-hidden="true"/>{text}</button>
      ))}
    </div>
  </div>;
}

export function FooterEditor({block, site, pages, defaults, view, update}: Props) {
  const columns = site.footerColumns || defaults;
  const initial = footerDefaults(columns[0]?.text || '');
  if (site.footerStyle === 'minimal') initial.layout = 'stack';
  const config = block.content.footer || initial;
  const [screen, setScreen] = useState('home');
  const [target, setTarget] = useState<FooterTarget>('motto');
  const [picker, setPicker] = useState<number | 'bottom' | null>(null);
  const [source, setSource] = useState('footer');
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FooterLink | null>(null);
  const [socialDraft, setSocialDraft] = useState<
    {id?: string; label: string; href: string} | null
  >(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState(false);
  const [removed, setRemoved] = useState<{
    key: 'socials' | 'bottomLinks';
    index: number;
    item: FooterLink | FooterConfig['socials'][number];
  } | null>(null);
  const {reload} = useMediaLibrary();
  const alive = useRef(true), uploading = useRef(false);
  const latest = useRef({site, block, config, update});
  useLayoutEffect(() => {latest.current = {site, block, config, update};});
  useEffect(() => {
    alive.current = true;
    return () => {alive.current = false;};
  }, []);
  const write = (patch: Partial<FooterConfig>, nextColumns = columns) => update({
    footerStyle: 'columns', footerColumns: nextColumns,
    blocks: site.blocks.map(item => item.id === block.id ? {
      ...item, layout: 'columns', content: {...item.content, footer: {...config, ...patch}},
    } : item),
  });
  const changeContent = (patch: Partial<Block['content']>) => update({
    blocks: site.blocks.map(item => item.id === block.id
      ? {...item, content: {...item.content, ...patch}} : item),
  });
  const settings = (patch: Partial<Block['settings']>) => update({
    blocks: site.blocks.map(item => item.id === block.id
      ? {...item, settings: {...item.settings, ...patch}} : item),
  });
  const column = (index: number, patch: Partial<FooterColumn>) =>
    write(index === 0 && patch.text !== undefined ? {motto: patch.text} : {},
      columns.map((item, i) => i === index ? {...item, ...patch} : item));
  const remove = (key: 'socials' | 'bottomLinks', id: string) => {
    const items = config[key];
    const index = items.findIndex(item => item.id === id);
    if (index < 0) return;
    setRemoved({key, index, item: items[index]});
    write({[key]: items.filter(item => item.id !== id)});
    setNotice('Removed.');
  };
  const selectLayout = (layout: FooterConfig['layout']) => {
    const next = [...columns];
    if (layout === 'hours' && !next.some(item => item.kind === 'hours')) {
      if (next.length < 5) next.push({title: 'Opening hours', text: '', links: [], kind: 'hours'});
      else setNotice('All five columns are in use. Choose Opening hours inside a column.');
    }
    const count = ['social', 'stack', 'bottom'].includes(layout) ? 1
      : layout === 'hours' ? Math.max(4, next.length) : 3;
    update({
      footerStyle: 'columns', footerColumns: next,
      blocks: site.blocks.map(item => item.id === block.id ? {
        ...item, layout: 'columns',
        settings: {...item.settings, columns: count, widths: Array(count).fill(100 / count)},
        content: {...item.content, footer: {
          ...config, layout, align: layout === 'stack' ? 'center' : config.align,
        }},
      } : item),
    });
  };
  const back = () => {
    setScreen('home'); setPicker(null); setDraft(null);
    setEditingLinkId(null); setNotice('');
  };
  const addLink = (destination: number | 'bottom') => {
    setPicker(destination); setDraft(null); setEditingLinkId(null);
    setSource('footer'); setNotice('');
  };
  const saveLink = () => {
    if (!draft || !draft.label.trim() || !draft.href.trim()) {
      setNotice('Choose a destination and enter a link name.'); return;
    }
    if (draft.pageId && !pages.some(page => page.id === draft.pageId)) {
      setNotice('This page was removed. Choose another page.'); return;
    }
    const next = {...draft, label: draft.label.trim(), customLabel: true};
    const existing = picker === 'bottom' ? config.bottomLinks : columns[picker!]?.links || [];
    const found = existing.some(item => 'id' in item && item.id === next.id);
    const links = found ? existing.map(item => 'id' in item && item.id === next.id ? next : item)
      : [...existing, next];
    if (picker === 'bottom') write({bottomLinks: links as FooterLink[]});
    else column(picker!, {links});
    setPicker(null); setDraft(null); setNotice('Link saved.');
  };
  const saveSocial = () => {
    const href = socialDraft && safeSocialUrl(socialDraft.href);
    if (!socialDraft?.label.trim() || !href) {
      setNotice('Enter a name and a complete http:// or https:// account URL.'); return;
    }
    const next = {...socialDraft, label: socialDraft.label.trim(), href,
      id: socialDraft.id || crypto.randomUUID()};
    write({socials: socialDraft.id ? config.socials.map(item => item.id === next.id ? next : item)
      : [...config.socials, next]});
    setSocialDraft(null); setNotice('Social link saved.');
  };
  const setLogo = (src: string) => {
    const current = latest.current;
    current.update({blocks: current.site.blocks.map(item => item.id === current.block.id ? {
      ...item, content: {...item.content, footer: {...current.config,
        logoMode: 'custom',
        logo: {...mediaDefaults, src, kind: 'image', fit: 'contain', ratio: '1/1'},
      }},
    } : item)});
  };
  const uploadLogo = async (files: File[]) => {
    const file = files[0];
    if (!file || uploading.current) return;
    if (!file.type.startsWith('image/')) {setNotice('Choose an image for your logo.'); return;}
    uploading.current = true; setBusy(true); setNotice('');
    try {
      const asset = await publishAsset(file, reload);
      if (alive.current && asset.kind === 'image') setLogo(`media:${asset.id}`);
    } catch (error) {
      if (alive.current) setNotice(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      uploading.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const text: FooterText = config.text[target] || (target === 'heading' ? block.settings.heading
    : target === 'body' ? block.settings.body : undefined) || {};
  const textWrite = (patch: Partial<FooterText>) =>
    write({text: {...config.text, [target]: {...text, ...patch}}});
  const row = (label: string, next: string, hint?: string) => (
    <button type="button" className="footer-content-row" onClick={() => setScreen(next)}>
      <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
      <ChevronRight size={16} aria-hidden="true"/>
    </button>
  );
  const number = (label: ReactNode, value: number, change: (n: number) => void,
    min: number, max: number, step = 1) => (
    <label className="field"><span>{label}</span><input type="number" value={value}
      min={min} max={max} step={step} onChange={event => {
        if (event.target.value !== '') change(Math.max(min, Math.min(max, +event.target.value)));
      }}/></label>
  );
  const menus = createDefaultMenus(site, pages);
  const choices = source === 'pages' ? pages.map(page => ({
    label: page.name, href: `/?page=${page.id}`, pageId: page.id,
  })) : source === 'sections' ? site.blocks.filter(item => !item.hidden).map(item => ({
    label: item.content.title || item.type, href: `#${item.id}`, pageId: undefined,
  })) : (menus.find(item => item.id === site.menuPlacement?.[
    source === 'header' ? 'header' : 'footer'
  ]) || menus[source === 'header' ? 0 : 1])?.items.map(item => ({
    label: item.text, href: item.pageId ? `/?page=${item.pageId}` : item.destination,
    pageId: item.pageId,
  })) || [];
  const activeColumn = screen.startsWith('column:') ? Number(screen.slice(7)) : -1;
  const currentColumn = columns[activeColumn];
  const columnCount = block.settings.columns || 3;
  const widths = block.settings.widths || Array(columnCount).fill(100 / columnCount);
  const title = targets.find(item => item.value === target)!.label;
  const form = socialDraft && <div className="footer-social-form">
    <Field label="Platform or name" value={socialDraft.label}
      onChange={label => setSocialDraft({...socialDraft, label})}/>
    <Field label="Account URL" value={socialDraft.href}
      onChange={href => setSocialDraft({...socialDraft, href})}/>
    <div className="footer-control-pair">
      <button type="button" onClick={saveSocial}>Save link</button>
      <button type="button" onClick={() => setSocialDraft(null)}>Cancel</button></div>
  </div>;
  return <div className="footer-editor"
    data-detail={view === 'Content' && (screen !== 'home' || picker !== null)}>
    {view === 'Appearance' ? <>
      <h3>Layout</h3><div className="footer-layout-options" aria-label="Footer layout">
        {footerLayouts.map(layout => <button type="button" key={layout.id}
          aria-pressed={config.layout === layout.id} onClick={() => selectLayout(layout.id)}>
          <span className={`footer-thumbnail is-${layout.id}`} aria-hidden="true">
            <span><i/><i/><i/><i/></span><b/>
          </span><span>{layout.label}</span><i className="footer-radio"/>
        </button>)}
      </div>
      {['standard', 'hours'].includes(config.layout) && <details className="footer-advanced">
        <summary>Columns & spacing</summary>
        {number('Visible columns', block.settings.columns || 3, count => {
          const next = Array.from({length: Math.max(columns.length, count)}, (_, i) =>
            columns[i] || {title: `Column ${i + 1}`, text: '', links: []});
          update({footerColumns: next, blocks: site.blocks.map(item => item.id === block.id ? {
            ...item, settings: {...item.settings, columns: count,
              widths: Array(count).fill(100 / count)},
          } : item)});
        }, 1, 5)}
        <div className="footer-control-pair">
          {widths.map((width, i) =>
            <label className="field" key={i}><span>Column {i + 1} width</span>
              <input type="number" min="10" max="100" value={Math.round(width)}
                onChange={event => settings({widths: widths
                  .map((n, j) => i === j
                    ? Math.max(10, Math.min(100, +event.target.value)) : n)})}/>
            </label>)}
        </div>
        <p className="helper-text">Widths are balanced to fill the row.</p>
        {number('Column gap (px)', block.settings.gap ?? 24, gap => settings({gap}), 0, 80)}
        {number('Vertical space (px)', block.settings.padding ?? 48,
          padding => settings({padding}), 0, 160)}
      </details>}
      <h3>Typography</h3><Choice label="Text to style" value={target}
        options={targets} onChange={setTarget}/>
      <h4>Editing: {title}</h4>
      <Choice label="Font" value={text.family || 'text'}
        options={[{value: 'text', label: 'Website text'},
          {value: 'display', label: 'Website heading'}, {value: 'system', label: 'System'}]}
        onChange={family => textWrite({family})}/>
      <div className="footer-control-pair">
        {number(`${title} size (px)`,
          text.size ?? (target === 'bottom' ? 12 : target === 'motto' ? 16 : 14),
          size => textWrite({size}), 10, 96)}
        {number('Line height', text.lineHeight ?? 1.5,
          lineHeight => textWrite({lineHeight}), 1, 2.5, .1)}
      </div>
      <label className="field"><span><Bold size={15}/>Font weight</span>
        <select value={text.weight || (target === 'heading' ? 600 : 400)}
          onChange={event => textWrite({weight: +event.target.value})}>
          {[['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold']]
            .map(([weight, label]) => <option value={weight} key={weight}>{label}</option>)}
        </select>
      </label>
      <div className="footer-control-pair">
        {number(<><MoveHorizontal size={15}/>Letter spacing (px)</>, text.tracking ?? 0,
          tracking => textWrite({tracking}), -3, 10, .1)}
        {['body', 'hours', 'bottom'].includes(target)
          ? number(<><Rows3 size={15}/>Row spacing (px)</>, text.rowGap ?? 0,
            rowGap => textWrite({rowGap}), 0, 24)
          : number(<><Rows3 size={15}/>Item spacing (px)</>, config.itemGap,
            itemGap => write({itemGap}), 0, 48)}
      </div>
      <Alignment label="Text alignment" value={text.align || 'left'}
        change={align => textWrite({align})}/>
      <div className="field" role="group" aria-label="Letter case"><span>Letter case</span>
        <div className="choice-group">
          {[{value: 'none', label: 'As typed', icon: Type},
            {value: 'uppercase', label: 'CAPS', icon: CaseUpper},
            {value: 'capitalize', label: 'Title', icon: CaseSensitive}].map(item => (
            <button type="button" key={item.value}
              aria-pressed={(text.transform || 'none') === item.value}
              onClick={() => textWrite({transform: item.value as FooterText['transform']})}>
              <item.icon size={16} aria-hidden="true"/>{item.label}
            </button>
          ))}
        </div>
      </div>
      <label className="field"><span>Text color</span><input type="color"
        value={text.color || (site.theme === 'midnight' ? '#f0f3fa' : '#252938')}
        onChange={event => textWrite({color: event.target.value})}/></label>
      <button type="button" onClick={() => textWrite({color: undefined})}>Use theme color</button>
      <h3>Bottom link hover</h3><Choice label="Appearance" value={config.hover}
        onChange={hover => write({hover})}
        options={[{value: 'match', label: 'Match Header'}, {value: 'text', label: 'Text only'}]}/>
      <details className="footer-advanced"><summary>Advanced</summary>
        <Choice label="Hover corners" value={config.hoverShape}
          onChange={hoverShape => write({hoverShape})}
          options={[{value: 'header', label: 'Use Header'}, {value: 'square', label: 'Square'},
            {value: 'rounded', label: 'Rounded'}, {value: 'pill', label: 'Pill'}]}/>
        {number('Hover side padding (px)', config.hoverPadding,
          hoverPadding => write({hoverPadding}), 8, 24)}
      </details>
    </> : <>
      {(screen !== 'home' || picker !== null) && <button type="button" className="footer-back"
        onClick={back}><ArrowLeft size={16}/>Footer</button>}
      {picker !== null ? <>
        <h3>{draft ? 'Link details' : 'Add link'}</h3>
        <Choice label="Choose from" value={source} onChange={value => {
          setSource(value); setDraft(null);
        }} options={[{value: 'footer', label: 'Footer menu'},
          {value: 'header', label: 'Header menu'},
          {value: 'pages', label: 'All pages'}, {value: 'sections', label: 'This page'},
          {value: 'url', label: 'Web address'}]}/>
        {source !== 'url' && !draft && <div className="footer-destination-list">
          {choices.map((choice, i) => <button type="button" key={i} onClick={() => setDraft({
            ...choice, id: editingLinkId || crypto.randomUUID(), customLabel: true,
          })}><Link2 size={15}/><span>{choice.label}</span><Plus size={15}/></button>)}
          {!choices.length && <p>No links here yet. Choose All pages or Web address.</p>}
        </div>}
        {source === 'url' && !draft && <button type="button"
          onClick={() => setDraft({id: editingLinkId || crypto.randomUUID(), label: '', href: ''})}>
          Enter web address</button>}
        {draft && <>
          {draft.pageId && !pages.some(page => page.id === draft.pageId) && (
            <p role="alert">This page was removed. Choose another page above.</p>
          )}
          <Field label="Display name" value={draft.label}
            onChange={label => setDraft({...draft, label})}/>
          {source === 'url' ? <Field label="Web address" value={draft.href}
            onChange={href => setDraft({...draft, href})}/>
            : <p>Opens: {pages.find(page => page.id === draft.pageId)?.name || draft.href}</p>}
          <div className="footer-control-pair"><button type="button" onClick={() => {
            if (source === 'url' && !safeSocialUrl(draft.href)) {
              setNotice('Enter a complete http:// or https:// web address.'); return;
            }
            saveLink();
          }}>Save link</button><button type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </>}
      </> : screen === 'home' ? <>
        {row('Brand & social links', 'brand', 'Logo, motto, any social account')}
        {columns.map((item, i) => <div key={i}>
          {row(item.title || `Column ${i + 1}`, `column:${i}`)}
        </div>)}
        <button type="button" className="subtle-action" disabled={columns.length >= 5}
          onClick={() => write({}, [...columns, {title: 'New column', text: '', links: []}])}>
          <Plus size={16}/>Add column</button>
        <h3>Bottom row</h3><Field label="Your text" multiline value={block.content.note}
          onChange={note => changeContent({note})}/>
        <Alignment label="Bottom row alignment" value={config.bottomAlign}
          change={bottomAlign => write({bottomAlign})}/>
        {config.bottomLinks.map(item => <div className="footer-link-row" key={item.id}>
          <button type="button" onClick={() => {
            setPicker('bottom'); setDraft(item); setEditingLinkId(item.id);
            setSource(item.pageId ? 'pages' : item.href.startsWith('#') ? 'sections' : 'url');
          }}>{item.label}<ChevronRight size={15}/></button>
          <button type="button" className="footer-danger" aria-label={`Remove ${item.label}`}
            onClick={() => remove('bottomLinks', item.id)}>
            <Trash2 size={16}/></button>
        </div>)}
        <button type="button" className="subtle-action" onClick={() => addLink('bottom')}>
          <Plus size={16}/>Add bottom link</button>
        {row('Footer image', 'image', 'Optional wide image')}
      </> : screen === 'brand' ? <>
        <h3>Brand & social links</h3>
        <Choice label="Footer logo" value={config.logoMode} onChange={logoMode => write({logoMode})}
          options={[{value: 'header', label: 'Use Header'},
            {value: 'custom', label: 'Choose media'},
            {value: 'none', label: 'None'}]}/>
        {config.logoMode === 'custom' && <>
          {config.logo?.src && <div className="footer-logo-preview">
            <MediaView value={config.logo}/>
          </div>}
          <MediaUpload accept="image/jpeg,image/png,image/webp,image/gif" multiple={false}
            busy={busy} onFiles={files => void uploadLogo(files)} dropHint="or drop a logo"
            onLibrary={() => setLibrary(true)} onLink={value => {
              const result = directMediaLink(value);
              if (!result.ok || result.kind !== 'image') {
                setNotice('Use a direct image link or choose a library image.'); return false;
              }
              setLogo(result.src); return true;
            }}/>
          {config.logo && <Field label="Logo description" value={config.logo.alt}
            onChange={alt => write({logo: {...config.logo!, alt}})}/>}
        </>}
        <Field label="Motto" multiline value={config.motto} onChange={motto => write({motto})}/>
        <Alignment label="Brand alignment" value={config.align} change={align => write({align})}/>
        <Choice label="Order" value={config.order} onChange={order => write({order})}
          options={[{value: 'motto', label: 'Logo → Motto → Socials'},
            {value: 'social', label: 'Logo → Socials → Motto'}]}/>
        {number('Space between items (px)', config.itemGap, itemGap => write({itemGap}), 0, 48)}
        <label className="visibility-toggle"><span>Show motto</span><input type="checkbox"
          checked={config.showMotto} onChange={e => write({showMotto: e.target.checked})}/></label>
        <label className="visibility-toggle"><span>Show social links</span>
          <input type="checkbox"
          checked={config.showSocials}
          onChange={e => write({showSocials: e.target.checked})}/></label>
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
        {form}
      </> : screen === 'image' ? <>
        <h3>Footer image</h3><HeroMediaEditor content={block.content} layout="footer"
          blockId={block.id} compact onChange={changeContent}/>
      </> : currentColumn && <>
        <Field label="Column title" value={currentColumn.title}
          onChange={title => column(activeColumn, {title})}/>
        <Choice label="Column content" value={currentColumn.kind || 'text'}
          onChange={kind => column(activeColumn, {kind})}
          options={[{value: 'text', label: 'Text & links'},
            {value: 'hours', label: 'Opening hours'}]}/>
        {currentColumn.kind === 'hours' ? <>
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
        </> : <Field label="Column text" multiline
          value={activeColumn === 0 ? config.motto : currentColumn.text}
          onChange={text => column(activeColumn, {text})}/>}
        {currentColumn.links.map((item, i) => <div className="footer-column-link" key={i}>
          <Field label="Display name" value={item.label} onChange={label => column(activeColumn, {
            links: currentColumn.links.map((l, j) => i === j
              ? {...l, label, customLabel: true} : l),
          })}/>
          <button type="button" onClick={() => {
            const id = item.id || crypto.randomUUID();
            setEditingLinkId(id);
            column(activeColumn, {links: currentColumn.links.map((l, j) =>
              i === j ? {...l, id} : l)});
            setPicker(activeColumn); setDraft({...item, id});
            setSource(item.pageId ? 'pages' : item.href.startsWith('#') ? 'sections' : 'url');
          }}><Link2 size={15}/>Change destination</button>
          {item.pageId && !pages.some(page => page.id === item.pageId) && <p role="alert">
            This page was removed. Choose another page.</p>}
          <button type="button" className="footer-danger" onClick={() => column(activeColumn, {
            links: currentColumn.links.filter((_, j) => i !== j),
          })}><Trash2 size={15}/>Remove link</button>
        </div>)}
        <button type="button" onClick={() => addLink(activeColumn)}>
          <Plus size={15}/>Add link</button>
      </>}
    </>}
    {notice && <p className="footer-notice" role="status">{notice}</p>}
    {removed && <button type="button" onClick={() => {
      const items = [...config[removed.key]];
      if (!items.some(item => item.id === removed.item.id)) {
        items.splice(Math.min(removed.index, items.length), 0, removed.item);
        write({[removed.key]: items});
      }
      setRemoved(null); setNotice('Restored.');
    }}>Undo removal</button>}
    {library && <MediaPicker label="Choose Footer logo" imagesOnly
      onClose={() => setLibrary(false)} onSelect={src => {setLogo(src); setLibrary(false);}}/>}
  </div>;
}
