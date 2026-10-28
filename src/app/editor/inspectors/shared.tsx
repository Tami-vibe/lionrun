"use client";
import type {Block, BlockContent} from '../../site/blocks';
import type {SectionSettings} from '../../site/settings';

export type InspectorProps = {
  block: Block;
  home?: boolean;
  changeLayout: (layout: string) => void;
  changeSettings: (settings: SectionSettings) => void;
  change: (patch: Partial<BlockContent>) => void;
  onResetLayout: () => void;
  start?: string;
};
