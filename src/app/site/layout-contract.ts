import {clip, still} from './section-media';
import type {SectionId} from './catalog';
import type {Block, BlockContent, BlockItem, SectionSettings} from './contracts';
import {defaultColumns, equalWidths} from './layout-utils';
export const blockLayouts:Record<SectionId,readonly string[]> = {
 header:['standard','pill','rounded'],hero:['split','center','image','short','story'],logos:['Scrolling row','Still row','Heading and slider'],services:['Icon cards','Photo cards','Price list'],proof:['Text and photo','Promise band','Photo and reasons'],about:['Story and photos','Photos only','Sliding gallery'],pains:['Photo cards','One message'],solutions:['Numbered steps','Before and after'],trust:['Big numbers','Numbers and certifications','Signals'],reviews:['Review cards','One large quote','Carousel'],quote:['Photo beside the form'],faq:['Accordion','Two columns'],promo:['Offer band'],contact:['Details and map'],closing:['Quiet','Full color'],footer:['columns','minimal'],
};


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

function sectionIsBlank(content: BlockContent): boolean {
  const text = (value?: string) => !value?.trim();
  return text(content.smallLabel) && text(content.title) && text(content.description) && !content.items?.length && !content.media?.src && !(content.slides || []).some(slide => slide.src) && !(content.buttons || []).some(button => button.label?.trim() || button.href?.trim()) && !(content.facts || []).some(fact => fact?.trim());
}

function storyHeroMedia(content: BlockContent): Pick<BlockContent, 'media' | 'slides'> {
  const road = '/media/ai-images/driving_in_winding_mountain_road.mp4';
  const known = content.media.src === '/media/showcase/highway-suv.jpg' || ['/media/ai-images/mountain-sports-car.mp4'].includes(content.media.src);
  const slides = (content.slides || []).filter(slide => slide.src);
  return {
    media: known ? clip(road, '/media/showcase/mountain-road.jpg', 'Driving a winding mountain road') : content.media,
    slides: slides.length ? content.slides : ['/media/ai-images/mountain-sports-car.mp4', '/media/ai-images/mirror-camera.mp4', '/media/ai-images/alfa-romeo-bumper.mp4'].map((src, i) => clip(src, ['/media/showcase/mountain-road.jpg', '/media/showcase/driver-cockpit.jpg', '/media/showcase/bodywork-door-repair.jpg'][i], ['Sports car on a mountain road', 'Mirror camera', 'Bumper repair'][i])),
  };
}

const reasonCopy: Record<string, string> = {
  'Transparent process': 'You see the estimate, the photos, and each update before any work starts.',
  'Quality craftsmanship': 'Panels, paint, and fit are checked before the car comes back to you.',
  'People-first service': 'One shop explains the repair in plain language and stays easy to reach.',
  'Written estimates': 'The price is written down, and extra work waits for your yes.',
  'Paint matched to your car': 'The colour is compared with your car before the panels go back on.',
  'A day to collect it': 'After the inspection you get a pickup day, and we call if parts change it.',
};
const starterReasons = ['Transparent process', 'Quality craftsmanship', 'People-first service'];
const moreReasons: BlockItem[] = [
  {title: 'Written estimates', description: '', icon: 'check'},
  {title: 'Paint matched to your car', description: '', icon: 'paint'},
  {title: 'A day to collect it', description: '', icon: 'calendar'},
];

function proofReasonContent(content: BlockContent): BlockContent {
  const reasons = content.items.filter(item => item.group !== 'stat' && item.group !== 'avatar' && item.group !== 'more');
  const stats = content.items.filter(item => item.group === 'stat');
  const seeded = reasons.length ? reasons : content.facts.filter(Boolean).slice(0, 3).map((title, i) => ({title, description: '', icon: (['message', 'wrench', 'star'] as const)[i] || 'check'}));
  const withMore = seeded.length <= 3 && seeded.every(item => starterReasons.includes(item.title)) ? [...seeded, ...moreReasons.filter(item => !seeded.some(have => have.title === item.title))].slice(0, 6) : seeded;
  const mock = [{title: 'Vehicles restored', description: '', icon: 'none' as const, group: 'stat', value: '5,000+'}, {title: 'Customer rating', description: '', icon: 'none' as const, group: 'stat', value: '4.9/5'}];
  const savedFaces = content.items.filter(item => item.group === 'avatar');
  const savedMore = content.items.find(item => item.group === 'more');
  const faces = (savedFaces.length ? savedFaces : [{title: 'Casey Nguyen', description: '', icon: 'none' as const, group: 'avatar'}, {title: 'Luis Romero', description: '', icon: 'none' as const, group: 'avatar'}, {title: 'Elena Rossi', description: '', icon: 'none' as const, group: 'avatar'}]).slice(0, 3).map((item, i) => ({...item, media: item.media?.src ? item.media : (content.slides || [])[i]?.src ? (content.slides || [])[i] : item.media}));
  return {...content, items: [...withMore.map(item => item.description.trim() || !reasonCopy[item.title] ? item : {...item, description: reasonCopy[item.title]}), ...(stats.length ? stats : mock), ...faces, savedMore || {title: '', description: '', icon: 'none', group: 'more', value: '4'}], buttons: content.buttons.length ? content.buttons : [{label: 'See why clients choose us', href: '#reviews', icon: 'arrow'}, {label: 'Our process', href: '#solutions', icon: 'arrow'}], buttonCount: content.buttonCount ?? 2};
}

const signalStarter: BlockItem[] = [
  {title: 'Experienced team', description: 'A team that cares about every detail.', icon: 'wrench', note: 'A team that cares about every detail.'},
  {title: 'Clear estimates', description: 'Know what to expect before we begin.', icon: 'check', note: 'Know what to expect before we begin.'},
  {title: 'Quality checks', description: 'Every repair is inspected before the car goes back.', icon: 'shield', note: 'Every repair is inspected before the car goes back.'},
];

function trustSignalContent(content: BlockContent): BlockContent {
  if (content.smallLabel.trim() || content.title.trim() || content.description.trim() || content.items.length || content.media?.src) return content;
  return {...content, smallLabel: 'Trust signals', title: 'Confidence comes\nfrom evidence.', description: 'Real qualifications, transparent processes, and documented results. No guesswork, no surprises.', items: signalStarter.map(item => ({...item}))};
}

function logoBandContent(content: BlockContent): BlockContent {
  return {...content, smallLabel: content.smallLabel.trim() ? content.smallLabel : 'Trust', title: content.title === 'Trusted by our community' ? 'Trusted by\nour community' : content.title, description: content.description === 'Brands and partners we work with' ? "We're proud to work with individuals, families, and local businesses across Chicago and the surrounding areas." : content.description};
}

export function contentForLayout(block: Block, layout: string): BlockContent {
  const content = block.content;
  if (!sectionIsBlank(content)) return content;
  if (block.type === 'hero' && layout === 'story' && block.id === 'hero') return {...content, ...storyHeroMedia(content), showSecondary: true, factIcons: content.factIcons?.length ? content.factIcons : ['shield', 'gear', 'star']};
  if (block.type === 'hero' && !['short', 'center'].includes(layout)) return {...content, showSecondary: true};
  if (block.type === 'proof' && layout === 'Photo and reasons') return proofReasonContent(content);
  if (block.type === 'logos' && layout === 'Heading and slider') return logoBandContent(content);
  if (block.type === 'trust' && layout === 'Signals') return trustSignalContent(content);
  return content;
}

const singleColumnLayouts = ['Price list', 'Promise band', 'One message', 'One large quote', 'Accordion', 'Scrolling row', 'Heading and slider', 'Signals', 'Sliding gallery'];
export function settingsForLayout(type: string, layout: string, settings: SectionSettings): SectionSettings {
  const count = singleColumnLayouts.includes(layout) ? 1 : layout === 'Two columns' ? 2 : defaultColumns(type);
  if (settings.columns === count && settings.widths?.length === count) return settings;
  return {...settings, columns: count, widths: equalWidths(count)};
}


