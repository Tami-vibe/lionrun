"use client";
import type {Block, Site} from '../site/blocks';
import {contentForLayout, settingsForLayout} from '../site/layout-contract';
import {ContentBrowser} from './content-browser';
import {FooterEditor} from './footer-editor';
import {HeroInspector} from './inspectors/hero';
import {SectionInspector} from './inspectors/section-inspector';
// Compatibility for existing editor consumers and regression tests.
export {SectionInspector as UniversalSectionInspector} from './inspectors/section-inspector';
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
