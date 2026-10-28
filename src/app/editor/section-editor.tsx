"use client";
import type {Block, Site} from '../site/blocks';
import {ContentBrowser} from './content-browser';
import {FooterEditor} from './footer-editor';
import {HeroLayouts, type PageEntry} from './navigation';
import {DefaultSectionInspector} from './inspectors/default';
import type {MediaUsageIndex} from '../media/usage';
import type {FooterColumn} from '../site/settings';
import {useState} from 'react';
import {Grid2X2, MoveVertical, RotateCcw, Scaling, SquareStack, Type} from 'lucide-react';
import {RefinedStyleShell} from './refined-style-shell';
import {LayoutPicker, LayoutThumb} from './layout-picker';
import {contentForLayout, layoutContract, sectionLayouts, settingsForLayout, visibleAppearanceFields} from '../site/layout-contract';
import {logoGap, logoScale} from '../site/logo-model';
import {equalWidths, normalizeSettings, resizeWidth} from '../site/settings';
import {AppearanceFields, SidebarSelect as Choice, UnitField} from './components/fields';
import {LayoutControls, RefinedSpacingGroup, TypographyControls} from './inspector';
export function SectionEditor({view, group, onGroup, site, pages, block, usage, footerDefaults, home, update, onFocusItem, onOpenPage}: {
  view: 'Content' | 'Appearance'; group: string | null; onGroup: (id: string | null) => void; site: Site; pages: PageEntry<Site>[]; block: Block; usage: MediaUsageIndex; footerDefaults: FooterColumn[]; home: boolean; update: (patch: Partial<Site>) => void; onFocusItem?: (id: string | null) => void; onOpenPage?: (id: string) => void;
}) {
  const settings = block.settings;
  const change = (patch: Partial<Block['content']>) => update({blocks: site.blocks.map(item => item.id === block.id ? {...item, content: {...item.content, ...patch}} : item)});
  const changeSettings = (value: Block['settings']) => update({blocks: site.blocks.map(item => item.id === block.id ? {...item, settings: value} : item)});
  const changeBlock = (patch: Partial<Block>) => {
    const defaults = patch.layout ? {
      content: contentForLayout(block, patch.layout),
      settings: settingsForLayout(block.type, patch.layout, settings),
    } : {};
    update({blocks: site.blocks.map(item => item.id === block.id ? {...item, ...defaults, ...patch} : item)});
  };

  if (block.type === 'footer') return <FooterEditor view={view} block={block} site={site} pages={pages} defaults={footerDefaults} update={update} />;
  if (view === 'Content') return <ContentBrowser block={block} site={site} pages={pages} update={update} change={change} footerDefaults={footerDefaults} usage={usage} group={group} onOpen={onGroup} home={home} onFocusItem={onFocusItem} onOpenPage={onOpenPage} />;
  if (block.type === 'hero') return (
    <>
      <HeroLayouts site={{...site, layout: block.layout as 'split' | 'center' | 'image' | 'short' | 'story'}} change={layout => changeBlock({layout})} />
      <AppearanceFields fields={visibleAppearanceFields(block, 'layout', home)} content={block.content} change={change} />
    </>
  );
  if (['proof', 'logos', 'about', 'services'].includes(block.type)) return <UniversalSectionInspector block={block} home={home} changeLayout={layout => changeBlock({layout})} changeSettings={changeSettings} change={change} onResetLayout={() => changeBlock({layout: 'Text and photo', settings: {...settings, columns: 2, widths: [50, 50]}, content: {...block.content, buttonCount: undefined, headAlign: undefined, photoSide: undefined}})} />;
  return <DefaultSectionInspector view={view} group={group} onGroup={onGroup} site={site} pages={pages} block={block} footerDefaults={footerDefaults} home={home} update={update} onFocusItem={onFocusItem} onOpenPage={onOpenPage} />;
}


// Layout-specific work is limited to geometry. Scalar properties come from the canonical schema.
type InspectorProps = {
  block: Block;
  home?: boolean;
  changeLayout: (layout: string) => void;
  changeSettings: (settings: Block['settings']) => void;
  change: (patch: Partial<Block['content']>) => void;
  onResetLayout?: () => void;
  start?: string;
};
const gapLabels = {about: 'Between items', services: 'Between cards', proof: 'Between columns', logos: 'Between logos'};

export function UniversalSectionInspector(props: InspectorProps) {
  const {block, changeSettings, change, home = true, start = 'layout'} = props;
  const [open, setOpen] = useState(start);
  const [target, setTarget] = useState<'heading' | 'body'>('heading');
  const gapLabel = gapLabels[block.type as keyof typeof gapLabels];
  const contract = layoutContract(block.type, block.layout);
  if (!gapLabel) return null;
  const groups = [
    {id: 'layout', label: 'Layout', icon: Grid2X2},
    ...(block.type === 'logos' ? [{id: 'sizing', label: 'Logo sizing', icon: Scaling}] : []),
    {id: 'spacing', label: 'Spacing', icon: MoveVertical},
    ...(contract.showsTitle || contract.allowsBody ? [{id: 'typography', label: 'Typography', icon: Type}] : []),
    ...(block.type === 'services' ? [{id: 'cards', label: 'Card appearance', icon: SquareStack}] : []),
  ];
  return (
    <>
      {block.type === 'services' && !home && (
        <p className="helper-text">
          Layout on this page is independent of Home. Home can use Media cards while All services uses Icon cards or a Simple list.
        </p>
      )}
      <RefinedStyleShell groups={groups} open={groups.some(group => group.id === open) ? open : 'layout'} setOpen={setOpen}>
        {id => {
          if (id === 'layout') return <SectionGeometry {...props} />;
          if (id === 'typography') return (
            <TypographyControls compact value={block.settings} change={changeSettings}
              target={target} setTarget={setTarget} />
          );
          if (id === 'spacing') return (
            <RefinedSpacingGroup
              gapLabel={gapLabel}
              gap={block.type === 'logos' ? logoGap(block.settings) : block.settings.gap ?? (block.type === 'proof' ? 24 : undefined)}
              padding={block.settings.padding ?? (block.type === 'proof' ? 72 : undefined)}
              showGap={!['Price list', 'Promise band'].includes(block.layout)}
              settings={block.settings}
              onChange={changeSettings}
            >
              {block.type === 'proof' && (
                <button type="button" className="refined-reset"
                  onClick={() => changeSettings({...block.settings, gap: undefined, padding: undefined})}>
                  <RotateCcw size={16} aria-hidden="true" />Reset spacing
                </button>
              )}
            </RefinedSpacingGroup>
          );
          if (id === 'sizing') return (
            <>
              <AppearanceFields fields={visibleAppearanceFields(block, 'sizing')} content={block.content} change={change} />
              <div className="logo-size-diagram" data-editor-only aria-hidden="true">
                <span style={{height: `${logoScale(block.content.logoScale)}%`}} />
                <small>{logoScale(block.content.logoScale)}% of the slot</small>
              </div>
            </>
          );
          const fields = visibleAppearanceFields(block, 'cards');
          return fields.length ? (
            <AppearanceFields fields={fields} content={block.content} change={change} />
          ) : (
            <p className="helper-text">{block.layout === 'Price list'
              ? 'Simple list uses text hierarchy without card chrome.'
              : 'Icon cards use the service icon and text. Add media on Content when a photo layout needs it.'}</p>
          );
        }}
      </RefinedStyleShell>
    </>
  );
}

function SectionGeometry(props: InspectorProps) {
  const {block, change, changeLayout, changeSettings, onResetLayout} = props;
  const grid = layoutContract(block.type, block.layout).grid;
  const columns = Math.min(4, Math.max(2, block.settings.columns || 3));
  return (
    <>
      <LayoutPicker legend="Section layout" name={`${block.id}-layout`} value={block.layout} onChange={changeLayout}
        options={sectionLayouts[block.type].map(option => ({
          value: option.id, label: option.label, thumb: <LayoutSketch type={block.type} layout={option.id} />,
        }))} />
      {block.type === 'proof' && block.layout !== 'Promise band' && <SplitGeometry {...props} />}
      {block.type === 'services' && block.layout !== 'Price list' && (
        <Choice label="Desktop columns" value={String(columns)}
          options={[2, 3, 4].map(value => ({value: String(value), label: String(value)}))}
          onChange={value => changeSettings({...block.settings, columns: Number(value), widths: equalWidths(Number(value))})} />
      )}
      {grid && (
        <LayoutControls value={block.settings} min={1} max={grid.maxCols} legend="Columns"
          change={next => {
            const count = Math.min(grid.maxCols, Math.max(1, next.columns || grid.defaultCols));
            changeSettings({...next, columns: count, widths: equalWidths(count)});
          }} />
      )}
      <AppearanceFields fields={visibleAppearanceFields(block)} content={block.content} change={change} />
      {block.type === 'proof' && (
        <button type="button" className="refined-reset" onClick={onResetLayout}>
          <RotateCcw size={16} aria-hidden="true" />Reset layout
        </button>
      )}
    </>
  );
}

function SplitGeometry({block, changeSettings}: InspectorProps) {
  const settings = normalizeSettings(block.settings);
  const firstIsMedia = block.layout === 'Photo and reasons' && block.content.photoSide !== 'right';
  const widths = settings.widths!;
  const textWidth = widths[firstIsMedia ? 1 : 0];
  const mediaWidth = widths[firstIsMedia ? 0 : 1];
  const selected = textWidth >= 55 ? 'More text' : mediaWidth >= 55 ? 'More media' : 'Equal';
  const balances = [
    {label: 'More text', widths: firstIsMedia ? [38, 62] : [62, 38]},
    {label: 'Equal', widths: [50, 50]},
    {label: 'More media', widths: firstIsMedia ? [62, 38] : [38, 62]},
  ];
  return (
    <>
      <Choice label="Arrangement" value={String(settings.columns)}
        options={[{value: '1', label: 'Stacked'}, {value: '2', label: 'Side by side'}]}
        onChange={value => changeSettings({...block.settings, columns: Number(value),
          widths: value === '1' ? [100] : widths.length === 2 ? widths : equalWidths(2)})} />
      {settings.columns === 2 && (
        <>
          <fieldset className="refined-field-group">
            <legend>Balance</legend>
            <div className="balance-grid" role="group" aria-label="Balance">
              {balances.map(balance => (
                <button type="button" key={balance.label}
                  className={`balance-card ${selected === balance.label ? 'is-selected' : ''}`}
                  aria-pressed={selected === balance.label}
                  onClick={() => changeSettings({...block.settings, widths: balance.widths})}>
                  <LayoutThumb>
                    <rect className="layout-shape" x="5" y="6" width={balance.widths[0] * 0.5} height="24" rx="2" />
                    <rect className="layout-shape" x={9 + balance.widths[0] * 0.5} y="6"
                      width={balance.widths[1] * 0.5} height="24" rx="2" />
                  </LayoutThumb>
                  <span>{balance.label}</span>
                </button>
              ))}
            </div>
            <p className="helper-text">Adjusts the space shared by text and media.</p>
          </fieldset>
          <details className="precise-width-disclosure">
            <summary className="precise-width-toggle">Precise width</summary>
            <div className="precise-width-body">
              <div className="width-fields">
                {widths.map((width, index) => (
                  <UnitField key={index} label={`${(index === 0) === firstIsMedia ? 'Media' : 'Text'} %`}
                    unit="%" min={10} max={90} value={Math.round(width * 10) / 10}
                    change={value => changeSettings({...block.settings, widths: resizeWidth(widths, index, value)})} />
                ))}
              </div>
              <p className="helper-text total-note">Total 100%</p>
              <p className="helper-text">Columns stack on smaller screens.</p>
            </div>
          </details>
        </>
      )}
    </>
  );
}

/** Rectangle data retains the distinct arrangement previews without per-layout components. */
type SketchRect = readonly [number, number, number, number, boolean?];
const repeatSketch = (columns: number, rows: number, width = 15, height = 9): SketchRect[] =>
  Array.from({length: columns * rows}, (_, index) =>
    [6 + index % columns * 18, 7 + Math.floor(index / columns) * 13, width, height]);
const splitSketch: SketchRect[] = [[6, 10, 18, 3, true], [6, 16, 14, 2], [6, 22, 12, 2], [32, 8, 26, 20]];
const layoutSketches: Record<string, SketchRect[]> = {
  'Story and photos': splitSketch,
  'Text and photo': splitSketch,
  'Photos only': repeatSketch(3, 2),
  'Sliding gallery': repeatSketch(4, 2, 12, 8),
  'Still row': [[8, 8, 13, 7], [24, 8, 13, 7], [40, 8, 13, 7], [16, 20, 13, 7], [32, 20, 13, 7]],
  'Scrolling row': [[6, 16, 3, 4, true], [14, 14, 10, 8], [26, 14, 10, 8], [38, 14, 10, 8], [55, 16, 3, 4, true]],
  'Heading and slider': [[6, 8, 16, 3, true], [6, 14, 12, 2], [24, 20, 10, 7], [36, 20, 10, 7],
    [50, 22, 3, 4, true], [57, 22, 3, 4, true]],
  'Photo and reasons': [[6, 7, 22, 22], [32, 11, 3, 3, true], [38, 11, 18, 2],
    [32, 18, 3, 3, true], [38, 18, 18, 2], [32, 25, 3, 3, true], [38, 25, 14, 2]],
  'Promise band': [0, 1, 2].flatMap(index => [
    [7 + index * 19, 11, 14, 3, true], [6 + index * 19, 17, 16, 2], [8 + index * 19, 22, 12, 2],
  ] as SketchRect[]),
  'Icon cards': [0, 1, 2].flatMap(index => [
    [11 + index * 19, 8, 7, 7, true], [8 + index * 19, 20, 12, 2, true], [8 + index * 19, 24, 10, 2],
  ] as SketchRect[]),
  'Price list': [0, 1, 2].flatMap(index => [
    [8, 8 + index * 8, 28, 3, true], [40, 8 + index * 8, 16, 3],
  ] as SketchRect[]),
};

function LayoutSketch({type, layout}: {type: Block['type']; layout: string}) {
  const cards = [0, 1, 2].flatMap(index => [
    [6 + index * 19, 7, 16, 10], [8 + index * 19, 20, 12, 2, true], [8 + index * 19, 24, 10, 2],
  ] as SketchRect[]);
  const rectangles = layoutSketches[layout] || (type === 'services' ? cards : splitSketch);
  return (
    <LayoutThumb>
      {rectangles.map(([x, y, width, height, strong], index) => (
        <rect key={index} className={strong ? 'layout-shape-strong' : 'layout-shape'}
          x={x} y={y} width={width} height={height} rx="1.5" />
      ))}
    </LayoutThumb>
  );
}
