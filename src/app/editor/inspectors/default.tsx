"use client";
import {useState} from 'react';
import {ChevronDown, Grid2X2, MoveVertical, RotateCcw, Scaling, SlidersHorizontal, SquareStack, Type} from 'lucide-react';
import {layoutContract, blockLayouts} from '../../site/layout-contract';
import {reviewLayout, reviewLayoutName, type ReviewLayout} from '../../site/reviews';
import {menuButtons} from '../workspace';
import {Destination, useEditScope} from '../fields';
import {SidebarSelect as Choice, SidebarSlider as RangeControl} from '../components/fields';
import {TypographyControls, LayoutControls, RefinedSpacingGroup} from '../inspector';
import {FooterEditor} from '../footer-editor';
import {ButtonText, IconPosition} from '../content-browser';
import type {Block, ButtonData, Site} from '../../site/blocks';
import type {PageEntry} from '../navigation';
import type {SectionSettings, FooterColumn} from '../../site/settings';
import {equalWidths, normalizeSettings, resizeWidth, defaultColumns} from '../../site/settings';

export function DefaultSectionInspector({
  view,
  group,
  onGroup,
  site,
  pages,
  block,
  footerDefaults,
  home,
  update,
  onFocusItem,
  onOpenPage,
}: {
  view: 'Content' | 'Appearance';
  group: string | null;
  onGroup: (id: string | null) => void;
  site: Site;
  pages: PageEntry<Site>[];
  block: Block;
  footerDefaults: FooterColumn[];
  home: boolean;
  update: (patch: Partial<Site>) => void;
  onFocusItem?: (id: string | null) => void;
  onOpenPage?: (id: string) => void;
}) {
  const [textTarget, setTextTarget] = useState<'heading' | 'body'>('heading');
  const [activeHeaderButtonTab, setActiveHeaderButtonTab] = useState(0);
  const settings = block.settings || {columns: defaultColumns(block.type)};
  const change = (patch: Partial<Block['content']>) => update({blocks: site.blocks.map(item => item.id === block.id ? {...item, content: {...item.content, ...patch}} : item)});
  const changeSettings = (value: SectionSettings) => update({blocks: site.blocks.map(item => item.id === block.id ? {...item, settings: value} : item)});
  const changeBlock = (patch: Partial<Block>) => {
    if (patch.layout) {
      const next = layoutContract(block.type, patch.layout).grid ? {...block.content} : block.content;
      if (next !== block.content) patch.content = next;
      patch.settings = patch.layout ? {...settings, columns: layoutContract(block.type, patch.layout).grid ? layoutContract(block.type, patch.layout).grid!.defaultCols : settings.columns, widths: layoutContract(block.type, patch.layout).grid ? equalWidths(layoutContract(block.type, patch.layout).grid!.defaultCols) : settings.widths} : patch.settings;
    }
    update({blocks: site.blocks.map(item => item.id === block.id ? {...item, ...patch} : item)});
  };

  if (block.type === 'footer') {
    return <FooterEditor view={view} block={block} site={site} pages={pages} defaults={footerDefaults} update={update} />;
  }
  if (view === 'Content') {
    return null;
  }

  const contract = layoutContract(block.type, block.layout);
  const singleLayout = ['Price list', 'Promise band', 'One message', 'One large quote', 'Accordion', 'Scrolling row', 'Heading and slider', 'Signals', 'Sliding gallery'].includes(block.layout);
  const gridSection = !singleLayout && !['header', 'hero', 'promo'].includes(block.type);
  const media = block.content.media;
  const headerButtonCount = site.headerButtonCount ?? 1;
  const headerButtons = menuButtons(site);
  const activeHeaderIdx = Math.min(activeHeaderButtonTab, Math.max(0, headerButtonCount - 1));
  const currentHeaderButton = headerButtons[activeHeaderIdx];
  const updateHeaderButton = (patch: Partial<ButtonData>) => {
    const next = [...headerButtons];
    next[activeHeaderIdx] = {...next[activeHeaderIdx], ...patch};
    update({headerButtons: next});
  };

  return <>
    {block.type === 'header' && <>
      <Choice label="Menu look" value={site.headerStyle} onChange={headerStyle => update({headerStyle})} options={[{value: 'pill', label: 'Rounded menu'}, {value: 'rounded', label: 'Soft corners'}, {value: 'standard', label: 'Standard bar'}]} />
      <Choice label="Stays on screen" value={site.headerSticky ? 'yes' : 'no'} onChange={v => update({headerSticky: v === 'yes'})} options={[{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}]} />
      <Choice label="Photo behind the menu" value={site.headerOverlay ? 'yes' : 'no'} onChange={v => update({headerOverlay: v === 'yes'})} options={[{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}]} />
      <Choice label="Menu background" value={site.headerBackground !== false ? 'yes' : 'no'} onChange={v => update({headerBackground: v === 'yes'})} options={[{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}]} />
      <Choice label="Extra buttons" value={String(headerButtonCount)} onChange={v => update({headerButtonCount: Number(v) as 0 | 1 | 2})} options={[{value: '0', label: 'None'}, {value: '1', label: 'One'}, {value: '2', label: 'Two'}]} />
      {site.headerStyle !== 'standard' && <Choice label="Where those buttons sit" value={site.headerButtonPlace || 'inside'} onChange={headerButtonPlace => update({headerButtonPlace})} options={[{value: 'inside', label: 'Inside the menu'}, {value: 'beside', label: 'Beside the menu'}]} />}
      {headerButtonCount > 0 && <>
        {headerButtonCount > 1 && <div className="segmented button-selector" role="group" aria-label="Button selection">{[0, 1].map(i => <button key={i} type="button" aria-pressed={activeHeaderIdx === i} onClick={() => setActiveHeaderButtonTab(i)}>{i === 0 ? 'Primary' : 'Secondary'}</button>)}</div>}
        {currentHeaderButton && (
          <div className="action-editor" key={activeHeaderIdx}>
            <ButtonText button={currentHeaderButton} onLabel={label => updateHeaderButton({label})} onIcon={icon => updateHeaderButton({icon})} />
            {currentHeaderButton.icon !== 'none' && <IconPosition value={currentHeaderButton.iconPosition === 'left' ? 'left' : 'right'} onChange={iconPosition => updateHeaderButton({iconPosition})} />}
            <Destination label="When clicked" value={currentHeaderButton.href} onChange={href => updateHeaderButton({href})} sections={site.blocks} />
          </div>
        )}
      </>}
      <p className="helper-text">Photo behind the menu puts the menu over the hero. Turn off Menu background to let the photo show through.</p>
    </>}
    {block.type !== 'header' && <>
      <LayoutControls value={settings} change={value => changeBlock({settings: value})} max={gridSection ? (['proof', 'contact', 'quote'].includes(block.type) ? 2 : 5) : 1} min={block.type === 'solutions' && block.layout === 'Numbered steps' ? 3 : 1} legend={block.type === 'solutions' && block.layout === 'Numbered steps' ? 'Steps' : 'Columns'} />
      <button type="button" className="reset-style" onClick={() => changeSettings({columns: singleLayout ? 1 : ['proof', 'contact', 'quote', 'closing'].includes(block.type) ? 2 : defaultColumns(block.type)})}>Reset section layout</button>
      <div className="editor-divider" />
    </>}
    {['header', 'footer'].includes(block.type) && !home && <p className="helper-text">Menu colors come from Home. Page appearance is in Page settings and changes this page only.</p>}
    {block.type === 'reviews' && <>
      <Choice label="Layout" value={reviewLayout(block.layout)} onChange={(value: ReviewLayout) => changeBlock({layout: reviewLayoutName(value)})} options={[{value: 'featured', label: 'Featured'}, {value: 'grid', label: 'Grid'}, {value: 'carousel', label: 'Carousel'}]} />
      <Choice label="Review text" value={block.content.reviewText === 'full' ? 'full' : 'excerpt'} onChange={value => change({reviewText: value as 'full' | 'excerpt'})} options={[{value: 'excerpt', label: 'Excerpt'}, {value: 'full', label: 'Full'}]} />
      <Choice label="Avatars" value={block.content.avatar || 'circle'} onChange={value => change({avatar: value as 'off' | 'circle' | 'square'})} options={[{value: 'circle', label: 'Circles'}, {value: 'square', label: 'Squares'}, {value: 'off', label: 'Hidden'}]} />
      <Choice label="Names" value={block.content.namePrivacy ? 'initials' : 'full'} onChange={value => change({namePrivacy: value === 'initials'})} options={[{value: 'full', label: 'Full name'}, {value: 'initials', label: 'Initials'}]} />
      <Choice label="Card surface" value={block.content.cardFace === 'plain' ? 'plain' : 'filled'} onChange={value => change({cardFace: value as 'filled' | 'plain'})} options={[{value: 'filled', label: 'Filled'}, {value: 'plain', label: 'Plain'}]} />
      <Choice label="Card padding" value={block.content.cardPad === 'compact' ? 'compact' : 'comfortable'} onChange={value => change({cardPad: value as 'comfortable' | 'compact'})} options={[{value: 'comfortable', label: 'Comfortable'}, {value: 'compact', label: 'Compact'}]} />
      <label className="visibility-toggle"><span>Show stars</span><input type="checkbox" checked={block.content.showRating !== false} onChange={e => change({showRating: e.target.checked})} /></label>
      <label className="visibility-toggle"><span>Show date</span><input type="checkbox" checked={block.content.showDate !== false} onChange={e => change({showDate: e.target.checked})} /></label>
      <label className="visibility-toggle"><span>Show service</span><input type="checkbox" checked={block.content.showService !== false} onChange={e => change({showService: e.target.checked})} /></label>
      <label className="visibility-toggle"><span>Show source</span><input type="checkbox" checked={block.content.showSource !== false} onChange={e => change({showSource: e.target.checked})} /></label>
      <p className="helper-text">Column count and spacing are above. Text size and color are below. A wide layout steps down to two cards, then one, when the section gets narrow. Five columns scroll sideways instead of squeezing.</p>
    </>}
    {block.type !== 'header' && block.type !== 'hero' && block.type !== 'reviews' && <label className="field"><span>Section layout</span><select aria-label="Section layout" value={block.layout} onChange={e => changeBlock({layout: e.target.value})}>{blockLayouts[block.type].map(layout => <option key={layout}>{layout}</option>)}</select></label>}
    {block.type === 'trust' && block.layout === 'Signals' && <>
      <Choice label="Background" value={block.content.showMedia === false ? 'none' : (block.content.showMedia || media.src) ? 'photo' : 'none'} onChange={v => change({showMedia: v === 'photo'})} options={[{value: 'none', label: 'None'}, {value: 'photo', label: 'Photo'}]} />
      <Choice label="Photo side" value={block.content.photoSide === 'left' ? 'left' : 'right'} onChange={v => change({photoSide: v as 'left' | 'right'})} options={[{value: 'right', label: 'Right'}, {value: 'left', label: 'Left'}]} />
    </>}
    {block.type === 'trust' && block.layout === 'Signals' && block.content.showMedia !== false && (!!block.content.showMedia || !!media.src) && <>
      <Choice label="Fit" value={media.fit === 'contain' ? 'contain' : 'cover'} onChange={v => change({media: {...media, fit: v as 'cover' | 'contain'}})} options={[{value: 'cover', label: 'Cover'}, {value: 'contain', label: 'Contain'}]} />
      <RangeControl label="Image position, horizontal" min={0} max={100} value={media.x ?? 50} text={String(media.x ?? 50)} onChange={x => change({media: {...media, x}})} />
      <RangeControl label="Image position, vertical" min={0} max={100} value={media.y ?? 50} text={String(media.y ?? 50)} onChange={y => change({media: {...media, y}})} />
      <label className="field"><span>Section color</span><input aria-label="Section color" type="color" value={/^#[0-9a-f]{6}$/i.test(block.content.background || '') ? block.content.background! : '#141922'} onChange={e => change({background: e.target.value})} /></label>
      <Choice label="Fade" value={block.content.fade === false ? 'off' : 'on'} onChange={v => change({fade: v === 'on'})} options={[{value: 'on', label: 'On'}, {value: 'off', label: 'Off'}]} />
      <Choice label="Direction" value={block.content.fadeDirection === 'rtl' ? 'rtl' : 'ltr'} onChange={v => change({fadeDirection: v as 'ltr' | 'rtl'})} options={[{value: 'ltr', label: 'Left to right'}, {value: 'rtl', label: 'Right to left'}]} />
      <RangeControl label="Fade width" min={0} max={100} value={Math.round(block.content.fadeWidth ?? 35)} text={String(Math.round(block.content.fadeWidth ?? 35))} onChange={fadeWidth => change({fadeWidth})} />
      <RangeControl label="Fade strength" min={0} max={100} value={Math.round(block.content.fadeStrength ?? 100)} text={String(Math.round(block.content.fadeStrength ?? 100))} onChange={fadeStrength => change({fadeStrength})} />
      <RangeControl label="Gradient" min={0} max={80} value={block.content.darkness ?? 64} text={String(block.content.darkness ?? 64)} onChange={darkness => change({darkness})} />
    </>}
    <TypographyControls value={settings} change={changeSettings} target={textTarget} setTarget={setTextTarget} />
    {!['header', 'hero', 'footer'].includes(block.type) && <p className="helper-text">Use the type settings above for text. Keep one clear main action for visitors.</p>}
  </>;
}
