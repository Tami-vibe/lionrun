import {useState} from 'react';
import {Grid2X2, MoveVertical, SquareStack, Type} from 'lucide-react';
import type {Block, BlockContent} from '../site/blocks';
import type {SectionSettings} from './settings';
import {defaultColumns, equalWidths} from './settings';
import {RefinedSpacingGroup, TypographyControls} from './inspector';
import {Choice} from './fields';
import {LayoutPicker, LayoutThumb} from './layout-picker';
import {RefinedStyleShell} from './refined-style-shell';

const layouts = [
  {id: 'Icon cards', label: 'Icon cards'},
  {id: 'Photo cards', label: 'Media cards'},
  {id: 'Price list', label: 'Simple list'}
] as const;

export function ServicesStyle({block, home = true, changeLayout, changeSettings, change, start = 'layout'}: {
  block: Block;
  home?: boolean;
  changeLayout: (layout: string) => void;
  changeSettings: (settings: SectionSettings) => void;
  change: (patch: Partial<BlockContent>) => void;
  start?: string;
}) {
  const [open, setOpen] = useState(start);
  const [target, setTarget] = useState<'heading' | 'body'>('heading');
  const photos = block.layout === 'Photo cards';
  const listed = block.layout === 'Price list';
  const columns = Math.min(4, Math.max(2, block.settings.columns || defaultColumns('services')));
  const groups = [
    {id: 'layout', label: 'Layout', icon: Grid2X2},
    {id: 'spacing', label: 'Spacing', icon: MoveVertical},
    {id: 'typography', label: 'Typography', icon: Type},
    {id: 'cards', label: 'Card appearance', icon: SquareStack}
  ];

  return (
    <>
      {!home && <p className="helper-text">Layout on this page is independent of Home. Home can use Media cards while All services uses Icon cards or a Simple list.</p>}
      <RefinedStyleShell groups={groups} open={open} setOpen={setOpen}>
        {id => {
          if (id === 'layout') {
            return (
              <>
                <LayoutPicker
                  legend="Section layout"
                  name="services-layout"
                  value={block.layout}
                  onChange={changeLayout}
                  options={layouts.map(option => ({value: option.id, label: option.label, thumb: <LayoutSketch layout={option.id} />}))}
                />
                {!listed && (
                  <Choice
                    label="Desktop columns"
                    value={String(columns) as '2' | '3' | '4'}
                    onChange={value => {
                      const count = Number(value) as 2 | 3 | 4;
                      changeSettings({...block.settings, columns: count, widths: equalWidths(count)});
                    }}
                    options={[{value: '2', label: '2'}, {value: '3', label: '3'}, {value: '4', label: '4'}]}
                  />
                )}
              </>
            );
          }
          if (id === 'spacing') {
            return (
              <RefinedSpacingGroup
                gapLabel="Between cards"
                gap={block.settings.gap}
                padding={block.settings.padding}
                showGap={!listed}
                settings={block.settings}
                onChange={changeSettings}
              />
            );
          }
          if (id === 'typography') {
            return <TypographyControls compact value={block.settings} change={changeSettings} target={target} setTarget={setTarget} />;
          }
          return (
            <>
              {photos ? (
                <>
                  <label className="field">
                    <span>Gradient: {block.content.darkness ?? 64}</span>
                    <input aria-label="Gradient" type="range" min={0} max={80} value={block.content.darkness ?? 64} onChange={event => change({darkness: Number(event.target.value)})} />
                  </label>
                  <Choice
                    label="Arrow"
                    value={block.content.arrowCircle === false ? 'plain' : 'circle'}
                    onChange={value => change({arrowCircle: value === 'circle'})}
                    options={[{value: 'circle', label: 'Circle'}, {value: 'plain', label: 'Plain'}]}
                  />
                </>
              ) : (
                <p className="helper-text">{listed ? 'Simple list uses text hierarchy without card chrome.' : 'Icon cards use the service icon and text. Add media on Content when a photo layout needs it.'}</p>
              )}
            </>
          );
        }}
      </RefinedStyleShell>
    </>
  );
}

function LayoutSketch({layout}: {layout: string}) {
  if (layout === 'Photo cards') {
    return (
      <LayoutThumb>
        {[0, 1, 2].map(index => (
          <g key={index}>
            <rect className="layout-shape" x={6 + index * 19} y="7" width="16" height="10" rx="2" />
            <rect className="layout-shape-strong" x={8 + index * 19} y="20" width="12" height="2" rx="1" />
            <rect className="layout-shape" x={8 + index * 19} y="24" width="10" height="2" rx="1" />
          </g>
        ))}
      </LayoutThumb>
    );
  }
  if (layout === 'Price list') {
    return (
      <LayoutThumb>
        {[0, 1, 2].map(index => (
          <g key={index}>
            <rect className="layout-shape-strong" x="8" y={8 + index * 8} width="28" height="2.5" rx="1.25" />
            <rect className="layout-shape" x="40" y={8 + index * 8} width="16" height="2.5" rx="1.25" />
          </g>
        ))}
      </LayoutThumb>
    );
  }
  return (
    <LayoutThumb>
      {[0, 1, 2].map(index => (
        <g key={index}>
          <circle className="layout-shape-strong" cx={14 + index * 19} cy="12" r="4" />
          <rect className="layout-shape-strong" x={8 + index * 19} y="20" width="12" height="2" rx="1" />
          <rect className="layout-shape" x={8 + index * 19} y="24" width="10" height="2" rx="1" />
        </g>
      ))}
    </LayoutThumb>
  );
}
