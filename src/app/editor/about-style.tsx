import {useState} from 'react';
import {Grid2X2, MoveVertical, Type} from 'lucide-react';
import type {Block, BlockContent} from '../site/blocks';
import {equalWidths, type SectionSettings} from './settings';
import {LayoutControls, RefinedSpacingGroup, TypographyControls} from './inspector';
import {Choice, useEditScope} from './fields';
import {LayoutPicker, LayoutThumb} from './layout-picker';
import {RefinedStyleShell} from './refined-style-shell';
import {galleryFeaturedCount, galleryGridRows, galleryMotion, galleryPauseHover, galleryScale, gallerySpeed, galleryWidth} from './about-model';

const layouts = [
  {id: 'Story and photos', label: 'Story & gallery'},
  {id: 'Photos only', label: 'Gallery grid'},
  {id: 'Sliding gallery', label: 'Sliding gallery'}
] as const;

function ScaleField({value, onChange}: {value: number; onChange: (value: number) => void}) {
  const scope = useEditScope();
  const label = `${value.toFixed(1)}×`;
  return (
    <label className="field gallery-scale-field">
      <span className="gallery-scale-head">
        <span>Image scale</span>
        <output aria-live="polite">{label}</output>
      </span>
      <input
        aria-label="Image scale"
        aria-valuemin={1}
        aria-valuemax={2}
        aria-valuenow={value}
        aria-valuetext={label}
        type="range"
        min={1}
        max={2}
        step={0.1}
        value={value}
        {...scope}
        onChange={event => onChange(galleryScale(Number(event.target.value)))}
      />
      <span className="speed-ends" aria-hidden="true"><span>1×</span><span>2×</span></span>
    </label>
  );
}

export function AboutStyle({block, changeLayout, changeSettings, change, start = 'layout'}: {
  block: Block;
  changeLayout: (layout: string) => void;
  changeSettings: (settings: SectionSettings) => void;
  change: (patch: Partial<BlockContent>) => void;
  start?: string;
}) {
  const [open, setOpen] = useState(start);
  const [target, setTarget] = useState<'heading' | 'body'>('heading');
  const sliding = block.layout === 'Sliding gallery';
  const photosOnly = block.layout === 'Photos only';
  const story = block.layout === 'Story and photos';
  const width = galleryWidth(block.content.galleryWidth);
  const scale = galleryScale(block.content.galleryScale);
  const motion = galleryMotion(block.content.galleryMotion);
  const speed = gallerySpeed(block.content.gallerySpeed);
  const pauseHover = galleryPauseHover(block.content.galleryPauseHover);
  const gridRows = galleryGridRows(block.content.galleryRows);
  const featured = galleryFeaturedCount(block.content.storyFeatured);
  const groups = [
    {id: 'layout', label: 'Layout', icon: Grid2X2},
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
                name="about-layout"
                value={block.layout}
                onChange={changeLayout}
                options={layouts.map(option => ({value: option.id, label: option.label, thumb: <LayoutSketch layout={option.id} />}))}
              />
              {story && (
                <Choice
                  label="Featured photos"
                  value={String(featured)}
                  onChange={value => change({storyFeatured: value === '1' ? 1 : 2})}
                  options={[{value: '1', label: 'One'}, {value: '2', label: 'Two'}]}
                />
              )}
              {photosOnly && (
                <>
                  <LayoutControls value={block.settings} change={next => changeSettings({...next, columns: Math.min(4, Math.max(1, next.columns || 2)), widths: equalWidths(Math.min(4, Math.max(1, next.columns || 2)))})} min={1} max={4} legend="Columns" />
                  <Choice
                    label="Rows"
                    value={String(gridRows)}
                    onChange={value => change({galleryRows: Number(value)})}
                    options={[1, 2, 3, 4].map(n => ({value: String(n), label: String(n)}))}
                  />
                  <p className="helper-text">Shows columns × rows photos. Extra photos stay in Content.</p>
                </>
              )}
              {sliding && (
                <>
                  <Choice
                    label="Gallery width"
                    value={width}
                    onChange={value => change({galleryWidth: value})}
                    options={[{value: 'boxed', label: 'Boxed'}, {value: 'full', label: 'Full width'}]}
                  />
                  <ScaleField value={scale} onChange={galleryScaleValue => change({galleryScale: galleryScaleValue})} />
                  <p className="helper-text">Scale sizes every frame. Artwork stays proportional inside the frame.</p>
                  <Choice
                    label="Movement"
                    value={motion}
                    onChange={value => change({galleryMotion: value})}
                    options={[{value: 'still', label: 'Still'}, {value: 'loop', label: 'Loop'}]}
                  />
                  {motion === 'loop' && (
                    <>
                      <label className="field">
                        <span>Speed: {speed === 1 ? 'Slow' : speed === 5 ? 'Fast' : speed}</span>
                        <input aria-label="Speed" type="range" min={1} max={5} step={1} value={speed} onChange={event => change({gallerySpeed: Number(event.target.value)})} />
                        <span className="speed-ends" aria-hidden="true"><span>Slow</span><span>Fast</span></span>
                      </label>
                      <label className="switch-row">
                        <span>Pause on hover</span>
                        <input type="checkbox" role="switch" checked={pauseHover} onChange={event => change({galleryPauseHover: event.target.checked})} />
                      </label>
                      <p className="helper-text">Rows pause on hover or focus. Reduced motion uses Still.</p>
                    </>
                  )}
                </>
              )}
            </>
          );
        }
        if (id === 'spacing') {
          return (
            <RefinedSpacingGroup
              gapLabel="Between items"
              gap={block.settings.gap}
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
  if (layout === 'Photos only') {
    return (
      <LayoutThumb>
        {[0, 1, 2].map(index => <rect key={`a${index}`} className="layout-shape" x={6 + index * 18} y="8" width="15" height="9" rx="2" />)}
        {[0, 1, 2].map(index => <rect key={`b${index}`} className="layout-shape" x={6 + index * 18} y="20" width="15" height="9" rx="2" />)}
      </LayoutThumb>
    );
  }
  if (layout === 'Sliding gallery') {
    return (
      <LayoutThumb>
        {[0, 1, 2, 3].map(index => <rect key={`t${index}`} className="layout-shape" x={4 + index * 14} y="8" width="12" height="8" rx="2" />)}
        {[0, 1, 2, 3].map(index => <rect key={`b${index}`} className="layout-shape" x={8 + index * 14} y="20" width="12" height="8" rx="2" />)}
      </LayoutThumb>
    );
  }
  return (
    <LayoutThumb>
      <rect className="layout-shape-strong" x="6" y="10" width="18" height="3" rx="1.5" />
      <rect className="layout-shape" x="6" y="16" width="14" height="2.5" rx="1.25" />
      <rect className="layout-shape" x="6" y="22" width="12" height="2.5" rx="1.25" />
      <rect className="layout-shape" x="32" y="8" width="26" height="20" rx="3" />
    </LayoutThumb>
  );
}
