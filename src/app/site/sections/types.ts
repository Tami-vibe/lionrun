import type {Block, Site} from '../blocks';
import type {SectionSettings} from '../settings';
import type {PageEntry} from '../page-types';

export type SectionProps = {
  block: Block;
  site: Site;
  editable: boolean;
  selected: boolean;
  change: (settings: SectionSettings) => void;
  link: (href: string, id?: string | null) => React.AnchorHTMLAttributes<HTMLAnchorElement>;
  labelFor: (label: string, href: string, id?: string | null) => string;
  pages: PageEntry<Site>[];
  homeId: string;
  activeId: string;
  parentIndex: number;
  focusItem?: string | null;
};
