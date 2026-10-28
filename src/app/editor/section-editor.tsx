"use client";
import type {Block, Site} from '../site/blocks';
import {contentForLayout, settingsForLayout} from '../site/layout-contract';
import {ContentBrowser} from './content-browser';
import {FooterEditor} from './footer-editor';
import {HeroInspector} from './inspectors/hero';
// Compatibility for existing editor consumers and regression tests.
export {SectionInspector as UniversalSectionInspector};
import {DefaultSectionInspector} from './inspectors/default';
import type {PageEntry} from './navigation';
import type {MediaUsageIndex} from '../media/usage';
import type {FooterColumn} from '../site/settings';

export function SectionEditor({view, group, onGroup, site, pages, block, usage, footerDefaults, home, update, onFocusItem, onOpenPage}: {
  view: 'Content' | 'Appearance'; group: string | null; onGroup: (id: string | null) => void; site: Site; pages: PageEntry<Site>[]; block: Block; usage: MediaUsageIndex; footerDefaults: FooterColumn[]; home: boolean; update: (patch: Partial<Site>) => void; onFocusItem?: (id: string | null) => void; onOpenPage?: (id: string) => void;
}) {
  const settings = block.settings;
  const change = (patch: Partial<Block['content']>) => update({blocks: site.blocks.map(item => item.id === block.id ? {...item, content: {...item.content, ...patch}} : item)});
  const changeSettings = (value: Block['settings']) => update({blocks: site.blocks.map(item => item.id === block.id ? {...item, settings: value} : item)});
  const changeBlock = (patch: Partial<Block>) => {
    if (patch.layout) {
      patch.content = contentForLayout(block, patch.layout);
      patch.settings = settingsForLayout(block.type, patch.layout, settings);
    }
    update({blocks: site.blocks.map(item => item.id === block.id ? {...item, ...patch} : item)});
  };

  if (block.type === 'footer') return <FooterEditor view={view} block={block} site={site} pages={pages} defaults={footerDefaults} update={update} />;
  if (view === 'Content') return <ContentBrowser block={block} site={site} pages={pages} update={update} change={change} footerDefaults={footerDefaults} usage={usage} group={group} onOpen={onGroup} home={home} onFocusItem={onFocusItem} onOpenPage={onOpenPage} />;
  if (block.type === 'hero') return <HeroInspector block={block} site={site} home={home} change={change} changeLayout={layout => changeBlock({layout})} />;
  if (['proof', 'logos', 'about', 'services'].includes(block.type)) return <SectionInspector block={block} home={home} changeLayout={layout => changeBlock({layout})} changeSettings={changeSettings} change={change} onResetLayout={() => changeBlock({layout: 'Text and photo', settings: {...settings, columns: 2, widths: [50, 50]}, content: {...block.content, buttonCount: undefined, headAlign: undefined, photoSide: undefined}})} />;
  return <DefaultSectionInspector view={view} group={group} onGroup={onGroup} site={site} pages={pages} block={block} footerDefaults={footerDefaults} home={home} update={update} onFocusItem={onFocusItem} onOpenPage={onOpenPage} />;
}

import {useState} from 'react';
import {Grid2X2, MoveVertical, RotateCcw, Scaling, SquareStack, Type} from 'lucide-react';
import {RefinedStyleShell} from './refined-style-shell';
import {layoutContract} from './../site/layout-contract';
import {logoGap, logoScale} from './../site/logo-model';
import {SidebarSelect as Choice, SidebarSlider as RangeControl, UnitField} from './components/fields';
import {RefinedSpacingGroup, TypographyControls} from './inspector';
import type {InspectorProps} from './inspectors/shared';
import {AboutInspector} from './inspectors/about';
import {ServicesInspector} from './inspectors/services';
import {ProofInspector} from './inspectors/proof';
import {LogosInspector} from './inspectors/logos';


const inspectorSchema = {
  about: {layout: AboutInspector, gapLabel: 'Between items'},
  services: {layout: ServicesInspector, gapLabel: 'Between cards'},
  proof: {layout: ProofInspector, gapLabel: 'Between columns'},
  logos: {layout: LogosInspector, gapLabel: 'Between logos'},
} as const;

function SectionInspector(props: InspectorProps) {
  const {block, changeSettings, change, home = true, start = 'layout'} = props;
  const [open, setOpen] = useState(start);
  const [target, setTarget] = useState<'heading' | 'body'>('heading');
  const schema = inspectorSchema[block.type as keyof typeof inspectorSchema];
  const contract = layoutContract(block.type, block.layout);
  if (!schema) return null;
  const groups = [
    {id: 'layout', label: 'Layout', icon: Grid2X2},
    ...(block.type === 'logos' ? [{id: 'sizing', label: 'Logo sizing', icon: Scaling}] : []),
    {id: 'spacing', label: 'Spacing', icon: MoveVertical},
    ...(contract.showsTitle || contract.allowsBody ? [{id: 'typography', label: 'Typography', icon: Type}] : []),
    ...(block.type === 'services' ? [{id: 'cards', label: 'Card appearance', icon: SquareStack}] : []),
  ];
  return (
    <>
      {block.type === 'services' && !home && <p className="helper-text">Layout on this page is independent of Home. Home can use Media cards while All services uses Icon cards or a Simple list.</p>}
      <RefinedStyleShell groups={groups} open={groups.some(group => group.id === open) ? open : 'layout'} setOpen={setOpen}>
        {id => {
          if (id === 'layout') return schema.layout(props);
          if (id === 'typography') return <TypographyControls compact value={block.settings} change={changeSettings} target={target} setTarget={setTarget} />;
          if (id === 'spacing') return <RefinedSpacingGroup gapLabel={schema.gapLabel} gap={block.type === 'logos' ? logoGap(block.settings) : block.type === 'proof' ? block.settings.gap ?? 24 : block.settings.gap} padding={block.type === 'proof' ? block.settings.padding ?? 72 : block.settings.padding} showGap={!['Price list', 'Promise band'].includes(block.layout)} settings={block.settings} onChange={changeSettings}>
            {block.type === 'proof' && <button type="button" className="refined-reset" onClick={() => changeSettings({...block.settings, gap: undefined, padding: undefined})}><RotateCcw size={16} aria-hidden="true" />Reset spacing</button>}
          </RefinedSpacingGroup>;
          if (id === 'sizing') return <>
            <UnitField label="Logo height" unit="%" value={block.content.logoScale ?? 70} min={40} max={90} change={value => change({logoScale: Math.max(40, Math.min(90, Math.round(value)))})} />
            <p className="helper-text">Percent of the maximum artwork. Desktop slot 90px, up to 200×60. Tablet slot 72px, up to 160×48. Mobile slot 60px, up to 140×40.</p>
            <div className="logo-size-diagram" data-editor-only aria-hidden="true"><span style={{height: `${logoScale(block.content.logoScale)}%`}} /><small>{logoScale(block.content.logoScale)}% of the slot</small></div>
            <label className="switch-row"><span>Monochrome</span><input type="checkbox" checked={!!block.content.monochrome} onChange={event => change({monochrome: event.target.checked || undefined})} /></label>
            <p className="helper-text">The saved file stays in color. Monochrome only changes the row.</p>
          </>;
          return block.layout === 'Photo cards' ? <>
            <RangeControl label="Gradient" min={0} max={80} value={block.content.darkness ?? 64} onChange={darkness => change({darkness})} />
            <Choice label="Arrow" value={block.content.arrowCircle === false ? 'plain' : 'circle'} onChange={value => change({arrowCircle: value === 'circle'})} options={[{value: 'circle', label: 'Circle'}, {value: 'plain', label: 'Plain'}]} />
          </> : <p className="helper-text">{block.layout === 'Price list' ? 'Simple list uses text hierarchy without card chrome.' : 'Icon cards use the service icon and text. Add media on Content when a photo layout needs it.'}</p>;
        }}
      </RefinedStyleShell>
    </>
  );
}
