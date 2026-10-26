import type {SectionId} from './catalog';
import {blockLayouts} from './blocks';

export type LayoutContract = {
  showsEyebrow: boolean;
  showsTitle: boolean;
  showsSubtext: boolean;
  allowsBody: boolean;
  showsButtons: boolean;
  headingTag: 'h1' | 'h2' | 'none';
  grid?: {maxCols: number; maxRows: number; defaultCols: number; defaultRows: number};
  storyFeatured?: 1 | 2;
};

const heading = (partial: Partial<LayoutContract> = {}): LayoutContract => ({
  showsEyebrow: true,
  showsTitle: true,
  showsSubtext: true,
  allowsBody: true,
  showsButtons: false,
  headingTag: 'h2',
  ...partial,
});

const none: LayoutContract = {
  showsEyebrow: false,
  showsTitle: false,
  showsSubtext: false,
  allowsBody: false,
  showsButtons: false,
  headingTag: 'none',
};

/** Per section-type + layout: which copy/CTA slots the canvas paints. Inspector must match. */
const contracts: Record<SectionId, Record<string, LayoutContract>> = {
  header: {
    standard: none,
    pill: none,
    rounded: none,
  },
  hero: {
    split: heading({showsButtons: true, headingTag: 'h1'}),
    center: heading({showsButtons: true, headingTag: 'h1'}),
    image: heading({showsButtons: true, headingTag: 'h1'}),
    short: heading({showsButtons: true, headingTag: 'h1'}),
    story: heading({showsButtons: true, headingTag: 'h1'}),
  },
  logos: {
    'Scrolling row': heading({showsButtons: false}),
    'Still row': heading({showsButtons: false}),
    'Heading and slider': heading({showsButtons: false}),
  },
  services: {
    'Icon cards': heading({showsButtons: false}),
    'Photo cards': heading({showsButtons: false}),
    'Price list': heading({showsButtons: false}),
  },
  proof: {
    'Text and photo': heading({showsButtons: true}),
    'Promise band': heading({showsButtons: true}),
    'Photo and reasons': heading({showsButtons: true}),
  },
  about: {
    'Story and photos': heading({
      showsButtons: false,
      storyFeatured: 2,
    }),
    'Photos only': {
      showsEyebrow: false,
      showsTitle: false,
      showsSubtext: false,
      allowsBody: false,
      showsButtons: false,
      headingTag: 'none',
      grid: {maxCols: 4, maxRows: 4, defaultCols: 2, defaultRows: 2},
    },
    'Sliding gallery': heading({showsButtons: false}),
  },
  pains: {
    'Photo cards': heading({showsButtons: true}),
    'One message': heading({showsButtons: true}),
  },
  solutions: {
    'Numbered steps': heading({showsButtons: false}),
    'Before and after': heading({showsButtons: false}),
  },
  trust: {
    'Big numbers': heading({showsButtons: false}),
    'Numbers and certifications': heading({showsButtons: false}),
    Signals: heading({showsButtons: false}),
  },
  reviews: {
    'Review cards': heading({showsButtons: false}),
    'One large quote': heading({showsButtons: false}),
    Carousel: heading({showsButtons: false}),
  },
  quote: {
    'Photo beside the form': heading({showsButtons: false, allowsBody: true}),
  },
  faq: {
    Accordion: heading({showsButtons: true}),
    'Two columns': heading({showsButtons: true}),
  },
  promo: {
    'Offer band': heading({showsButtons: true}),
  },
  contact: {
    'Details and map': heading({showsButtons: true}),
  },
  closing: {
    Quiet: heading({showsButtons: true}),
    'Full color': heading({showsButtons: true}),
  },
  footer: {
    columns: none,
    minimal: none,
  },
};

export function layoutContract(type: SectionId, layout: string): LayoutContract {
  const byLayout = contracts[type];
  const exact = byLayout?.[layout];
  if (exact) return exact;
  const fallback = blockLayouts[type]?.[0];
  return (fallback && byLayout?.[fallback]) || none;
}

/** Every catalog layout must have an explicit contract row (scale gate). */
export function layoutContractCoverage(): {type: SectionId; layout: string; ok: boolean}[] {
  return (Object.keys(blockLayouts) as SectionId[]).flatMap(type =>
    blockLayouts[type].map(layout => ({
      type,
      layout,
      ok: !!contracts[type]?.[layout],
    })),
  );
}
