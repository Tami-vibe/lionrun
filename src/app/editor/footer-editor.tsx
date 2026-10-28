'use client';
import {FooterHours, FooterSocials, FooterSocialForm, FooterColumnLinks} from './footer-details';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {ArrowLeft, ChevronRight, Link2, Plus, Trash2} from 'lucide-react';
import type {Block, Site} from '../site/blocks';
import type {FooterEditorProps} from './footer-details';
import type {FooterColumn} from '../site/settings';
import {
  footerConfig, safeSocialUrl,
  type FooterConfig, type FooterLink, type FooterTarget, type FooterText,
} from '../site/footer-model';
import {SidebarSelect as Choice, Field, UnitField} from './components/fields';
import {FooterAppearance, Alignment} from './footer-appearance';
import {footerLayoutPatch, footerColumnCount, footerColumnWidths} from '../site/footer-model';
import {createDefaultMenus} from '../site/menu-model';
import {MediaPicker, MediaView, publishAsset, useMediaLibrary} from '../media/library';
import {mediaDefaults} from '../media/model';
import {MediaUpload} from './media-upload';
import {directMediaLink} from '../site/hero-collection';
import {HeroMediaEditor} from './hero-media';

export function FooterEditor({block, site, pages, defaults, view, update}: FooterEditorProps) {
  const columns = site.footerColumns || defaults;
  const config = footerConfig(block, site, columns);
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
    const result = footerLayoutPatch(site, block, columns, config, layout);
    if (result.notice) setNotice(result.notice);
    update(result.patch);
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
  const widths = footerColumnWidths(block.settings);
  const form = socialDraft && <FooterSocialForm draft={socialDraft} change={setSocialDraft} save={saveSocial} cancel={() => setSocialDraft(null)}/>;
  return <div className="footer-editor"
    data-detail={view === 'Content' && (screen !== 'home' || picker !== null)}>
    {view === 'Appearance' ? <>
      <FooterAppearance block={block} site={site} config={config} target={target} setTarget={setTarget} text={text} textWrite={textWrite} write={write} settings={settings} selectLayout={selectLayout} widths={widths} setColumnCount={count => update(footerColumnCount(site, block, columns, count))}/>
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
        <UnitField label="Space between items (px)" value={config.itemGap} change={itemGap => write({itemGap})} min={0} max={48}/>
        <label className="visibility-toggle"><span>Show motto</span><input type="checkbox"
          checked={config.showMotto} onChange={e => write({showMotto: e.target.checked})}/></label>
        <label className="visibility-toggle"><span>Show social links</span>
          <input type="checkbox"
          checked={config.showSocials}
          onChange={e => write({showSocials: e.target.checked})}/></label>
        <FooterSocials config={config} setSocialDraft={setSocialDraft} setNotice={setNotice} remove={remove}>{form}</FooterSocials>
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
          <FooterHours config={config} write={write} setNotice={setNotice}/>
        </> : <Field label="Column text" multiline
          value={activeColumn === 0 ? config.motto : currentColumn.text}
          onChange={text => column(activeColumn, {text})}/>}
        <FooterColumnLinks currentColumn={currentColumn} pages={pages} change={patch => column(activeColumn, patch)} editDestination={(item, i) => {
            const id = item.id || crypto.randomUUID();
            setEditingLinkId(id);
            column(activeColumn, {links: currentColumn.links.map((l, j) =>
              i === j ? {...l, id} : l)});
            setPicker(activeColumn); setDraft({...item, id});
            setSource(item.pageId ? 'pages' : item.href.startsWith('#') ? 'sections' : 'url');
        }}/>
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
