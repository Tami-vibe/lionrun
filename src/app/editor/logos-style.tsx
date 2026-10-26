import {useState} from 'react';
import {Grid2X2, MoveVertical, Scaling, Type} from 'lucide-react';
import type {Block, BlockContent} from '../site/blocks';
import type {SectionSettings} from './settings';
import {RefinedSpacingGroup, TypographyControls, UnitField} from './inspector';
import {Choice} from './fields';
import {LayoutPicker, LayoutThumb} from './layout-picker';
import {RefinedStyleShell} from './refined-style-shell';
import {logoGap, logoScale} from './logo-model';

const layouts = [
  {id: 'Still row', label: 'Still row'},
  {id: 'Scrolling row', label: 'Scrolling row'},
  {id: 'Heading and slider', label: 'Heading + slider'}
] as const;

export function LogosStyle({block, changeLayout, changeSettings, change, start = 'layout'}: {
  block: Block;
  changeLayout: (layout: string) => void;
  changeSettings: (settings: SectionSettings) => void;
  change: (patch: Partial<BlockContent>) => void;
  start?: string;
}) {
  const [open, setOpen] = useState(start);
  const [target, setTarget] = useState<'heading' | 'body'>('heading');
  const scale = logoScale(block.content.logoScale);
  const gap = logoGap(block.settings);
  const groups = [
    {id: 'layout', label: 'Layout', icon: Grid2X2},
    {id: 'sizing', label: 'Logo sizing', icon: Scaling},
    {id: 'spacing', label: 'Spacing', icon: MoveVertical},
    {id: 'typography', label: 'Typography', icon: Type}
  ];
  return (
    <RefinedStyleShell groups={groups} open={open} setOpen={setOpen}>
      {id => {
        if (id === 'layout') {
          return (
            <>
              <LayoutPicker
                legend="Section layout"
                name="logos-layout"
                value={block.layout}
                onChange={changeLayout}
                options={layouts.map(option => ({value: option.id, label: option.label, thumb: <LayoutSketch layout={option.id} />}))}
              />
              {block.layout === 'Heading and slider' && <Choice label="Heading" value={block.content.showHeading === false ? 'hide' : 'show'} onChange={value => change({showHeading: value === 'show'})} options={[{value: 'show', label: 'Show'}, {value: 'hide', label: 'Hide'}]} />}
              {block.layout === 'Scrolling row' && (
                <>
                  <Choice
                    label="Movement"
                    value={block.content.logoMotion === 'still' ? 'still' : 'loop'}
                    onChange={value => change({logoMotion: value as 'still' | 'loop'})}
                    options={[{value: 'still', label: 'Still'}, {value: 'loop', label: 'Loop'}]}
                  />
                  {block.content.logoMotion !== 'still' && (
                    <label className="switch-row">
                      <span>Pause on hover</span>
                      <input type="checkbox" role="switch" checked={block.content.logoPauseHover !== false} onChange={event => change({logoPauseHover: event.target.checked})} />
                    </label>
                  )}
                  <p className="helper-text">Motion is controlled here. The live page has no Pause button. Reduced motion uses Still.</p>
                </>
              )}
            </>
          );
        }
        if (id === 'sizing') {
          return (
            <>
              <UnitField label="Logo height" unit="%" value={block.content.logoScale ?? 70} min={40} max={90} change={logoScaleValue => change({logoScale: Math.max(40, Math.min(90, Math.round(logoScaleValue)))})} />
              <p className="helper-text">Percent of the maximum artwork. Desktop slot 90px, up to 200×60. Tablet slot 72px, up to 160×48. Mobile slot 60px, up to 140×40.</p>
              <div className="logo-size-diagram" data-editor-only aria-hidden="true">
                <span style={{height: `${scale}%`}} />
                <small>{scale}% of the slot</small>
              </div>
              <label className="switch-row"><span>Monochrome</span><input type="checkbox" checked={!!block.content.monochrome} onChange={event => change({monochrome: event.target.checked || undefined})} /></label>
              <p className="helper-text">The saved file stays in color. Monochrome only changes the row.</p>
            </>
          );
        }
        if (id === 'spacing') {
          return (
            <RefinedSpacingGroup
              gapLabel="Between logos"
              gap={gap}
              padding={block.settings.padding}
              settings={block.settings}
              onChange={changeSettings}
            />
          );
        }
        return <TypographyControls compact value={block.settings} change={changeSettings} target={target} setTarget={setTarget} />;
      }}
    </RefinedStyleShell>
  );
}

function LayoutSketch({layout}: {layout: string}) {
  if (layout === 'Scrolling row') {
    return (
      <LayoutThumb>
        <path className="layout-shape-strong" d="M9 13 L5 18 L9 23 L10.4 23 L6.4 18 L10.4 13 Z" />
        {[0, 1, 2].map(index => <rect key={index} className="layout-shape" x={14 + index * 12} y="14" width="10" height="8" rx="2" />)}
        <path className="layout-shape-strong" d="M55 13 L59 18 L55 23 L53.6 23 L57.6 18 L53.6 13 Z" />
      </LayoutThumb>
    );
  }
  if (layout === 'Heading and slider') {
    return (
      <LayoutThumb>
        <rect className="layout-shape-strong" x="6" y="8" width="16" height="3" rx="1.5" />
        <rect className="layout-shape" x="6" y="14" width="12" height="2.5" rx="1.25" />
        <rect className="layout-shape" x="24" y="20" width="10" height="7" rx="2" />
        <rect className="layout-shape" x="36" y="20" width="10" height="7" rx="2" />
        <path className="layout-shape-strong" d="M51 20.5 L47 24 L51 27.5 L52.2 27.5 L48.2 24 L52.2 20.5 Z" />
        <path className="layout-shape-strong" d="M56 20.5 L60 24 L56 27.5 L54.8 27.5 L58.8 24 L54.8 20.5 Z" />
      </LayoutThumb>
    );
  }
  return (
    <LayoutThumb>
      {[0, 1, 2].map(index => <rect key={index} className="layout-shape" x={8 + index * 16} y="8" width="13" height="7" rx="2" />)}
      {[0, 1].map(index => <rect key={index} className="layout-shape" x={16 + index * 16} y="20" width="13" height="7" rx="2" />)}
    </LayoutThumb>
  );
}
