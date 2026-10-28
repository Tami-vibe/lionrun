import {clip} from './section-media';
import type {SectionId} from './catalog';
import type {Block, BlockContent, BlockItem, SectionSettings} from './contracts';
import {defaultColumns, equalWidths} from './layout-utils';
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

type Layout = {id: string; label: string; contract?: Partial<LayoutContract>};
const layout = (id: string, label = id, contract?: Partial<LayoutContract>): Layout => ({id, label, contract});
const noHeading: LayoutContract = {
  showsEyebrow: false,
  showsTitle: false,
  showsSubtext: false,
  allowsBody: false,
  showsButtons: false,
  headingTag: 'none',
};
const cta = {showsButtons: true};
const hero = {...cta, headingTag: 'h1' as const};

/** Persisted IDs, public copy slots and inspector labels have one source. */
export const sectionLayouts: Record<SectionId, readonly Layout[]> = {
  header: ['standard', 'pill', 'rounded'].map(id => layout(id, id, noHeading)),
  hero: ['split', 'center', 'image', 'short', 'story'].map(id => layout(id, id, hero)),
  logos: [layout('Scrolling row'), layout('Still row'), layout('Heading and slider', 'Heading + slider')],
  services: [layout('Icon cards'), layout('Photo cards', 'Media cards'), layout('Price list', 'Simple list')],
  proof: [layout('Text and photo', 'Text + media', cta), layout('Promise band', 'Promise band', cta),
    layout('Photo and reasons', 'Media + reasons', cta)],
  about: [
    layout('Story and photos', 'Story & gallery', {storyFeatured: 2}),
    layout('Photos only', 'Gallery grid', {
      ...noHeading, grid: {maxCols: 4, maxRows: 4, defaultCols: 2, defaultRows: 2},
    }),
    layout('Sliding gallery'),
  ],
  pains: [layout('Photo cards', 'Photo cards', cta), layout('One message', 'One message', cta)],
  solutions: [layout('Numbered steps'), layout('Before and after')],
  trust: [layout('Big numbers'), layout('Numbers and certifications'), layout('Signals')],
  reviews: [layout('Review cards'), layout('One large quote'), layout('Carousel')],
  quote: [layout('Photo beside the form')],
  faq: [layout('Accordion', 'Accordion', cta), layout('Two columns', 'Two columns', cta)],
  promo: [layout('Offer band', 'Offer band', cta)],
  contact: [layout('Details and map', 'Details and map', cta)],
  closing: [layout('Quiet', 'Quiet', cta), layout('Full color', 'Full color', cta)],
  footer: ['columns', 'minimal'].map(id => layout(id, id, noHeading)),
};

export const blockLayouts = Object.fromEntries(
  Object.entries(sectionLayouts).map(([type, layouts]) => [type, layouts.map(item => item.id)]),
) as Record<SectionId, string[]>;

export function layoutContract(type: SectionId, name: string): LayoutContract {
  const layouts = sectionLayouts[type];
  if (!layouts) return noHeading;
  const found = layouts.find(item => item.id === name) || layouts[0];
  return {
    showsEyebrow: true, showsTitle: true, showsSubtext: true, allowsBody: true,
    showsButtons: false, headingTag: 'h2', ...found.contract,
  };
}

export function layoutContractCoverage(): {type: SectionId; layout: string; ok: boolean}[] {
  return (Object.keys(sectionLayouts) as SectionId[]).flatMap(type =>
    sectionLayouts[type].map(item => ({type, layout: item.id, ok: true})),
  );
}

export type AppearanceField = {
  key: keyof BlockContent;
  label: string;
  kind: 'choice' | 'range' | 'number' | 'toggle';
  group?: 'layout' | 'sizing' | 'cards';
  homeOnly?: boolean;
  fallback: string | number | boolean;
  options?: readonly (readonly [string | number | boolean, string])[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  layouts?: readonly string[];
  visible?: (block: Block) => boolean;
  hint?: string;
};
const movement = [['still', 'Still'], ['loop', 'Loop']] as const;
const pause: AppearanceField = {
  key: 'galleryPauseHover', label: 'Pause on hover', kind: 'toggle', fallback: true,
};

/** Only scalar appearance properties use the shared form renderer. Collections stay explicit. */
const appearanceFields: Partial<Record<SectionId, readonly AppearanceField[]>> = {
  hero: [
    {key: 'height', label: 'Height', kind: 'choice', fallback: 'standard',
      options: [['standard', 'Standard'], ['full', 'Full screen']]},
    {key: 'align', label: 'Text alignment', kind: 'choice', fallback: 'left',
      options: [['left', 'Left'], ['center', 'Center']]},
    {key: 'showBusiness', label: 'Business details', kind: 'choice', fallback: false, homeOnly: true,
      options: [[false, 'Off'], [true, 'Bottom']], visible: block => block.id === 'hero'},
    {key: 'darkness', label: 'Image darkness', kind: 'range', fallback: 36, min: 0, max: 80},
  ],
  services: [
    {key: 'darkness', label: 'Gradient', kind: 'range', fallback: 64, min: 0, max: 80,
      group: 'cards', layouts: ['Photo cards']},
    {key: 'arrowCircle', label: 'Arrow', kind: 'choice', fallback: true,
      group: 'cards', layouts: ['Photo cards'], options: [[true, 'Circle'], [false, 'Plain']]},
  ],
  about: [
    {key: 'storyFeatured', label: 'Featured photos', kind: 'choice', fallback: 2,
      options: [[1, 'One'], [2, 'Two']], layouts: ['Story and photos']},
    {key: 'galleryRows', label: 'Rows', kind: 'choice', fallback: 2,
      options: [[1, '1'], [2, '2'], [3, '3'], [4, '4']], layouts: ['Photos only'],
      hint: 'Shows columns × rows photos. Extra photos stay in Content.'},
    {key: 'galleryWidth', label: 'Gallery width', kind: 'choice', fallback: 'boxed',
      options: [['boxed', 'Boxed'], ['full', 'Full width']], layouts: ['Sliding gallery']},
    {key: 'galleryScale', label: 'Image scale', kind: 'range', fallback: 1, min: 1, max: 2,
      step: 0.1, unit: '×', layouts: ['Sliding gallery'],
      hint: 'Scale sizes every frame. Artwork stays proportional inside the frame.'},
    {key: 'galleryMotion', label: 'Movement', kind: 'choice', fallback: 'loop',
      options: movement, layouts: ['Sliding gallery']},
    {key: 'gallerySpeed', label: 'Speed', kind: 'range', fallback: 3, min: 1, max: 5,
      layouts: ['Sliding gallery'], visible: block => block.content.galleryMotion !== 'still'},
    {...pause, layouts: ['Sliding gallery'], visible: block => block.content.galleryMotion !== 'still',
      hint: 'Rows pause on hover or focus. Reduced motion uses Still.'},
  ],
  logos: [
    {key: 'logoScale', label: 'Logo height', kind: 'number', fallback: 70, min: 40, max: 90,
      group: 'sizing', unit: '%',
      hint: 'Percent of the maximum artwork. Desktop slot 90px, up to 200×60. Tablet slot 72px, up to 160×48. Mobile slot 60px, up to 140×40.'},
    {key: 'monochrome', label: 'Monochrome', kind: 'toggle', fallback: false, group: 'sizing',
      hint: 'The saved file stays in color. Monochrome only changes the row.'},
    {key: 'showHeading', label: 'Heading', kind: 'choice', fallback: true,
      options: [[true, 'Show'], [false, 'Hide']], layouts: ['Heading and slider']},
    {key: 'logoMotion', label: 'Movement', kind: 'choice', fallback: 'loop',
      options: movement, layouts: ['Scrolling row']},
    {...pause, key: 'logoPauseHover', layouts: ['Scrolling row'],
      visible: block => block.content.logoMotion !== 'still',
      hint: 'Motion is controlled here. The live page has no Pause button. Reduced motion uses Still.'},
  ],
  proof: [
    {key: 'buttonCount', label: 'Buttons', kind: 'choice', fallback: 2,
      options: [[2, 'Both'], [1, 'One'], [0, 'None']], layouts: ['Photo and reasons']},
    {key: 'headAlign', label: 'Intro alignment', kind: 'choice', fallback: 'center',
      options: [['top', 'Top'], ['center', 'Center'], ['bottom', 'Bottom']], layouts: ['Photo and reasons']},
    {key: 'photoSide', label: 'Media side', kind: 'choice', fallback: 'left',
      options: [['left', 'Left'], ['right', 'Right']], layouts: ['Photo and reasons']},
  ],
};

export function visibleAppearanceFields(
  block: Block, group: 'layout' | 'sizing' | 'cards' = 'layout', home = true,
): readonly AppearanceField[] {
  return (appearanceFields[block.type] || []).filter(field =>
    (field.group || 'layout') === group && (!field.homeOnly || home)
      && (!field.layouts || field.layouts.includes(block.layout)) && (!field.visible || field.visible(block)),
  );
}

export function appearanceValue(field: AppearanceField, value: unknown): string | number | boolean {
  if (field.options) return field.options.find(([candidate]) => candidate === value)?.[0] ?? field.fallback;
  if (field.kind === 'toggle') return typeof value === 'boolean' ? value : field.fallback;
  if (typeof value !== 'number' || !Number.isFinite(value)) return field.fallback;
  const bounded = Math.max(field.min ?? value, Math.min(field.max ?? value, value));
  const step = field.step ?? 1;
  return Number((Math.round(bounded / step) * step).toFixed(6));
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


