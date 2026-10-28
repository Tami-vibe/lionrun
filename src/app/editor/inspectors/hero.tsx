"use client";
import {RangeControl, SidebarSelect as Choice} from '../components/fields';
import {HeroLayouts} from '../navigation';
import type {Block, Site} from '../../site/blocks';

export function HeroInspector({
  block,
  site,
  home = true,
  change,
  changeLayout,
}: {
  block: Block;
  site: Site;
  home?: boolean;
  change: (patch: Partial<Block['content']>) => void;
  changeLayout: (layout: string) => void;
}) {
  const heroLayout = block.layout as 'split' | 'center' | 'image' | 'short' | 'story';

  return (
    <>
      <HeroLayouts site={{...site, layout: heroLayout}} change={layout => changeLayout(layout)} />
      <Choice
        label="Height"
        value={block.content.height || 'standard'}
        onChange={height => change({height})}
        options={[
          {value: 'standard', label: 'Standard'},
          {value: 'full', label: 'Full screen'},
        ]}
      />
      <Choice
        label="Text alignment"
        value={block.content.align || 'left'}
        onChange={align => change({align})}
        options={[
          {value: 'left', label: 'Left'},
          {value: 'center', label: 'Center'},
        ]}
      />
      {block.id === 'hero' && home && (
        <Choice
          label="Business details"
          value={block.content.showBusiness ? 'bottom' : 'off'}
          onChange={value => change({showBusiness: value === 'bottom'})}
          options={[
            {value: 'off', label: 'Off'},
            {value: 'bottom', label: 'Bottom'},
          ]}
        />
      )}
      <RangeControl
        label="Image darkness"
        min={0}
        max={80}
        value={block.content.darkness ?? 36}
        text={String(block.content.darkness ?? 36)}
        onChange={darkness => change({darkness})}
      />
    </>
  );
}
