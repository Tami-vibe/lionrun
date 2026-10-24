import test from 'node:test';
import assert from 'node:assert/strict';
import {contentForLayout,migrateSite,settingsForLayout,trustSignalContent} from '../src/app/site/blocks.ts';
import {mediaDefaults} from '../src/app/media/model.ts';
import {safeHref} from '../src/app/site/safe-href.ts';
import {packageWebsite} from '../src/app/export/package.ts';

const authored = {
  smallLabel: '',
  title: 'Confidence comes from evidence',
  description: 'Show real credentials, warranty terms, and documented results.',
  items: [
    {title: 'Experienced team', description: 'Meet our specialists', icon: 'check', note: 'Meet our specialists'},
    {title: 'Clear estimates', description: 'I rewrote this.', icon: 'check', note: 'Keep my note'},
    {title: 'Quality checks', description: 'Every detail matters', icon: 'star', note: 'Every detail matters'},
  ],
  media: {src: '/media/showcase/workshop-bay.jpg', alt: 'Workshop'},
};

test('switching trust layouts does not rewrite authored copy or media', () => {
  assert.equal(trustSignalContent(authored), authored);
  assert.equal(trustSignalContent(trustSignalContent(authored)), authored);
  const custom = {
    ...authored,
    smallLabel: 'The shop',
    title: 'Our promise',
    description: 'Written by the shop.',
    items: [{title: 'Hours', description: 'By appointment', icon: 'calendar', note: 'By appointment'}],
    media: {src: 'media:upload-1', alt: 'Upload'},
  };
  assert.equal(trustSignalContent(custom), custom);
});

test('trust signal starter copy is added only when the section is empty', () => {
  const blank = {smallLabel: '  ', title: '', description: '', items: [], media: {src: ''}};
  const seeded = trustSignalContent(blank);
  assert.equal(seeded.smallLabel, 'Trust signals');
  assert.equal(seeded.title, 'Confidence comes\nfrom evidence.');
  assert.equal(seeded.items.length, 3);
  assert.equal(seeded.media.src, '');
  assert.equal(trustSignalContent(seeded), seeded);
  const kept = {...blank, title: 'Kept'};
  assert.equal(trustSignalContent(kept), kept);
});

test('web links reject embedded credentials and keep supported destinations', () => {
  assert.equal(safeHref('https://user:pass@example.com/private'), '#contact');
  assert.equal(safeHref('http://user@example.com'), '#contact');
  assert.equal(safeHref('HTTPS://User:secret@Example.com/a'), '#contact');
  assert.equal(safeHref('https://example.com/path?q=1#top'), 'https://example.com/path?q=1#top');
  assert.equal(safeHref('http://example.com'), 'http://example.com');
  assert.equal(safeHref('mailto:hello@example.com'), 'mailto:hello@example.com');
  assert.equal(safeHref('tel:+13125550184'), 'tel:+13125550184');
  assert.equal(safeHref('#contact'), '#contact');
  assert.equal(safeHref('/about'), '/about');
  assert.equal(safeHref('javascript:alert(1)'), '#contact');
  assert.equal(safeHref('//evil.example'), '#contact');
});

function element(tag, attrs = {}, children = []) {
  const node = {tag, attrs: {...attrs}, style: {}, children, parent: null};
  for (const child of children) child.parent = node;
  node.classList = {remove(...names) {
    const current = new Set((node.attrs.class || '').split(/\s+/).filter(Boolean));
    for (const name of names) current.delete(name);
    if (current.size) node.attrs.class = [...current].join(' ');
    else delete node.attrs.class;
  }};
  node.setAttribute = (name, value) => { node.attrs[name] = String(value); };
  node.removeAttribute = name => { delete node.attrs[name]; };
  node.remove = () => { if (node.parent) node.parent.children = node.parent.children.filter(child => child !== node); };
  Object.defineProperty(node, 'dataset', {get() {
    return Object.fromEntries(Object.entries(node.attrs).flatMap(([key, value]) => key.startsWith('data-') ? [[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]] : []));
  }});
  Object.defineProperty(node, 'disabled', {set(value) { if (value) node.attrs.disabled = ''; else delete node.attrs.disabled; }});
  Object.defineProperty(node, 'attributes', {get() { return Object.entries(node.attrs).map(([name, value]) => ({name, value})); }});
  node.matches = selector => matches(node, selector);
  node.closest = selector => { let current = node; while (current && current.tag !== '#document') { if (matches(current, selector)) return current; current = current.parent; } return null; };
  node.querySelector = selector => node.querySelectorAll(selector)[0] || null;
  node.querySelectorAll = selector => {
    const found = [];
    const walk = current => { for (const child of current.children) { if (matches(child, selector)) found.push(child); walk(child); } };
    walk(node);
    return found;
  };
  node.cloneNode = () => element(node.tag, node.attrs, node.children.map(child => child.cloneNode()));
  Object.defineProperty(node, 'outerHTML', {get() { return serialize(node); }});
  return node;
}
function matchSimple(node, selector) {
  if (selector === '*') return true;
  const attributes = [...selector.matchAll(/\[([^\]=]+)(?:=(?:"([^"]*)"|([^\]]+)))?\]/g)];
  let rest = selector.replace(/\[[^\]]+\]/g, '');
  if (rest.startsWith('.')) {
    if (!(node.attrs.class || '').split(/\s+/).includes(rest.slice(1))) return false;
    rest = '';
  } else if (rest && rest !== node.tag) return false;
  return attributes.every(([, name, quoted, raw]) => {
    const actual = node.attrs[name];
    const expected = quoted ?? raw;
    return expected === undefined ? actual !== undefined : actual === expected;
  });
}
function matches(node, selector) {
  if (selector.includes(',')) return selector.split(',').some(part => matches(node, part.trim()));
  const steps = selector.trim().split(/\s+/);
  if (!matchSimple(node, steps.at(-1))) return false;
  if (steps.length === 1) return true;
  const earlier = steps.slice(0, -1).join(' ');
  let parent = node.parent;
  while (parent) { if (matches(parent, earlier)) return true; parent = parent.parent; }
  return false;
}
function serialize(node) {
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${value}"`).join('');
  const style = Object.entries(node.style).filter(([, value]) => value).map(([key, value]) => `${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${value}`).join(';');
  return `<${node.tag}${attrs}${style ? ` style="${style}"` : ''}>${node.children.map(child => child.outerHTML || serialize(child)).join('')}</${node.tag}>`;
}
function installExportDom() {
  const home = element('div', {'data-export-page': 'home'}, [element('div', {class: 'site-preview'}, [
    element('span', {'data-editor-only': 'true', class: 'section-badge editable-section'}, []),
    element('section', {'data-section': 'trust', class: 'editable-section selected-section'}, [
      element('a', {'data-site-href': 'https://user:pass@evil.example/secret', 'data-link-hash': ''}, []),
      element('div', {class: 'trust-signals has-photo', 'data-fade': 'ltr'}, [
        element('div', {class: 'media-view', 'data-media-source': 'https://example.com/photo.jpg'}, [
          element('div', {class: 'media-image image-fade'}, []),
        ]),
      ]),
    ]),
    element('details', {open: ''}, []),
  ])]);
  const about = element('div', {'data-export-page': 'about'}, [element('div', {class: 'site-preview'}, [
    element('a', {'data-site-href': '/home', 'data-link-page': 'home', 'data-link-hash': '#top'}, []),
  ])]);
  const root = element('#document', {}, [home, about]);
  globalThis.CSS = {escape: value => value};
  globalThis.getComputedStyle = () => ({getPropertyValue: () => 'Test Font'});
  globalThis.window = {location: {origin: 'http://localhost:3002'}};
  globalThis.document = root;
  Object.defineProperty(root, 'styleSheets', {value: [{cssRules: [{cssText: '.site-preview{color:#111}'}]}]});
  root.body = element('body');
  globalThis.indexedDB = {open() {
    const request = {};
    queueMicrotask(() => {
      const tx = {objectStore: () => ({getAll: () => {
        const result = {};
        queueMicrotask(() => { result.result = []; result.onsuccess?.(); tx.oncomplete?.(); });
        return result;
      }})};
      request.result = {transaction: () => tx, close() {}};
      request.onsuccess?.();
    });
    return request;
  }};
  return root;
}
function unzip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = [];
  let offset = 0;
  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const nameLength = view.getUint16(offset + 26, true);
    const size = view.getUint32(offset + 22, true);
    const start = offset + 30 + nameLength;
    files.push({name: new TextDecoder().decode(bytes.subarray(offset + 30, start)), text: new TextDecoder().decode(bytes.subarray(start, start + size))});
    offset = start + size;
  }
  const end = bytes.subarray(bytes.length - 22);
  const tail = new DataView(end.buffer, end.byteOffset, end.byteLength);
  return {files, count: tail.getUint16(8, true)};
}
const pages = [
  {id: 'home', name: 'Home', slug: 'home', site: {seoTitle: 'Home & <Northline>', seoDescription: 'A "shop"'}},
  {id: 'about', name: 'About', slug: 'about', site: {seoTitle: 'About', seoDescription: ''}},
];

function fields(content = {}) {
  return {smallLabel:'', title:'', description:'', items:[], media:{...mediaDefaults, src:''}, buttons:[], facts:[], note:'', formButton:'', consent:'', fields:[], slides:[], ...content};
}
function section(type, id, layout, content, settings = {columns:3, widths:[50, 25, 25], gap:8, padding:72}) {
  return {id, type, layout, hidden:false, settings, content:fields(content)};
}
const hero = section('hero', 'hero', 'split', {
  smallLabel:'Shop', title:'My headline', description:'My words',
  media:{...mediaDefaults, src:'/media/showcase/workshop-bay.jpg', alt:'My bay'},
  slides:[{...mediaDefaults, src:'/media/showcase/workshop-bay.jpg', alt:'My slide'}],
  buttons:[{label:'Call', href:'tel:+15551212', icon:'phone'}],
  facts:['Open late'], factIcons:['calendar'], showSecondary:false,
});
const proof = section('proof', 'proof', 'Text and photo', {
  smallLabel:'Promise', title:'Our promise', description:'Written by the shop.',
  items:[{title:'Hours', description:'By appointment', icon:'calendar'}],
  media:{...mediaDefaults, src:'media:proof-photo', alt:'Proof'},
  buttons:[{label:'Book', href:'#contact', icon:'arrow'}], buttonCount:1,
}, {columns:2, widths:[40, 60], gap:12, padding:64});
const logos = section('logos', 'logos', 'Scrolling row', {
  title:'Trusted by our community', description:'Brands and partners we work with',
  items:[{title:'Audi', description:'Kept', icon:'none', media:{...mediaDefaults, src:'media:audi', alt:'Audi'}}],
});

test('layout switches keep authored hero, proof, and logo content', () => {
  for (const layout of ['story', 'split', 'center', 'image', 'short', 'story']) {
    assert.equal(contentForLayout(hero, layout), hero.content);
    assert.equal(contentForLayout({...hero, layout}, layout), hero.content);
  }
  for (const layout of ['Text and photo', 'Promise band', 'Photo and reasons', 'Text and photo'])
    assert.equal(contentForLayout(proof, layout), proof.content);
  for (const layout of ['Scrolling row', 'Heading and slider', 'Still row', 'Heading and slider'])
    assert.equal(contentForLayout(logos, layout), logos.content);
  assert.equal(hero.content.showSecondary, false);
  assert.equal(hero.content.media.src, '/media/showcase/workshop-bay.jpg');
  assert.equal(hero.content.slides[0].alt, 'My slide');
  assert.equal(proof.content.items.length, 1);
  assert.equal(proof.content.buttonCount, 1);
  assert.equal(logos.content.title, 'Trusted by our community');
  assert.equal(logos.content.description, 'Brands and partners we work with');
  assert.equal(logos.content.smallLabel, '');
});

test('empty sections receive layout defaults once', () => {
  const blankHero = section('hero', 'hero', 'short', {});
  const story = contentForLayout(blankHero, 'story');
  assert.equal(story.showSecondary, true);
  assert.deepEqual(story.factIcons, ['shield', 'gear', 'star']);
  assert.equal(story.slides.length, 3);
  assert.equal(story.media.src, '');
  assert.equal(contentForLayout({...blankHero, content:story}, 'story'), story);
  const blankProof = section('proof', 'proof', 'Text and photo', {});
  const reasons = contentForLayout(blankProof, 'Photo and reasons');
  assert.ok(reasons.items.length > blankProof.content.items.length);
  assert.equal(contentForLayout({...blankProof, content:reasons}, 'Photo and reasons'), reasons);
  const blankLogos = section('logos', 'logos', 'Scrolling row', {});
  const headed = contentForLayout(blankLogos, 'Heading and slider');
  assert.equal(headed.smallLabel, 'Trust');
  assert.equal(headed.title, '');
  assert.equal(contentForLayout({...blankLogos, content:headed}, 'Heading and slider'), headed);
});

test('column settings stay when the layout uses the same count', () => {
  assert.equal(settingsForLayout('hero', 'story', hero.settings), hero.settings);
  assert.equal(settingsForLayout('services', 'Photo cards', hero.settings), hero.settings);
  const price = settingsForLayout('services', 'Price list', hero.settings);
  assert.equal(price.gap, 8);
  assert.equal(price.padding, 72);
  assert.deepEqual(price.widths, [100]);
  assert.equal(price.columns, 1);
  const restored = settingsForLayout('trust', 'Big numbers', price);
  assert.equal(restored.padding, 72);
  assert.equal(restored.columns, 3);
});

test('custom layout content survives a save and reload', () => {
  const chosen = [
    {...hero, layout:'story', content:contentForLayout(hero, 'story'), settings:settingsForLayout('hero', 'story', hero.settings)},
    {...proof, layout:'Photo and reasons', content:contentForLayout(proof, 'Photo and reasons'), settings:settingsForLayout('proof', 'Photo and reasons', proof.settings)},
    {...logos, layout:'Heading and slider', content:contentForLayout(logos, 'Heading and slider'), settings:settingsForLayout('logos', 'Heading and slider', logos.settings)},
  ];
  const site = {brand:'Northline', hidden:[], headerStyle:'standard', footerStyle:'columns', address:'Chicago', phone:'555', email:'hello@example.com', footerColumns:[{title:'Keep', text:'Saved', links:[]}], blocks:chosen};
  const loaded = migrateSite(JSON.parse(JSON.stringify(site)));
  const again = migrateSite(structuredClone(loaded));
  for (const block of chosen) {
    const saved = loaded.blocks.find(item => item.id === block.id);
    assert.deepEqual(saved.content, block.content);
    assert.equal(saved.settings.columns, block.settings.columns);
    assert.deepEqual(saved.settings.widths, block.settings.widths);
    assert.equal(saved.settings.gap, block.settings.gap);
    assert.equal(saved.settings.padding, block.settings.padding);
    assert.equal(saved.layout, block.layout);
    assert.deepEqual(again.blocks.find(item => item.id === block.id).content, block.content);
  }
  assert.equal(loaded.blocks.find(item => item.id === 'proof').content.items.some(item => item.title === 'Casey Nguyen'), false);
});

test('html and wordpress archives keep public files and drop editor chrome', async () => {
  installExportDom();
  const htmlZip = unzip(new Uint8Array(await (await packageWebsite(pages, 'html')).arrayBuffer()));
  const htmlNames = htmlZip.files.map(file => file.name);
  assert.deepEqual(htmlNames, ['index.html', 'about/index.html', 'assets/style.css', 'assets/media.js', 'media-references.json', 'README.txt']);
  assert.equal(htmlZip.count, htmlNames.length);
  const home = htmlZip.files[0].text;
  const about = htmlZip.files[1].text;
  assert.match(home, /<title>Home &amp; &lt;Northline&gt;<\/title>/);
  assert.equal(home.includes('data-editor-only'), false);
  assert.equal(home.includes('section-badge'), false);
  assert.equal(home.includes('editable-section'), false);
  assert.equal(home.includes('user:pass'), false);
  assert.match(home, /class="media-image image-fade"/);
  assert.match(home, /data-fade="ltr"/);
  assert.match(home, /href="#contact"/);
  assert.equal(home.includes('<details open'), false);
  assert.match(home, /<details><\/details>/);
  assert.match(home, /href="assets\/style.css"/);
  assert.match(about, /href="\.\.\/index.html#top"/);
  assert.match(about, /src="\.\.\/assets\/media.js"/);
  assert.equal(about.includes('<details open'), false);
  const references = JSON.parse(htmlZip.files.find(file => file.name === 'media-references.json').text);
  assert.deepEqual(references, ['https://example.com/photo.jpg']);
  for (const marker of ['menu-dropdown', 'data-review-more', 'data-logo-step', 'data-slideshow', 'data-gallery', 'data-load-embed'])
    assert.match(htmlZip.files.find(file => file.name === 'assets/media.js').text, new RegExp(marker));

  installExportDom();
  const wordpress = unzip(new Uint8Array(await (await packageWebsite(pages, 'wordpress')).arrayBuffer()));
  const wordpressNames = wordpress.files.map(file => file.name);
  assert.deepEqual(wordpressNames, ['business-builder/pages/home.php', 'business-builder/pages/about.php', 'business-builder/style.css', 'business-builder/assets/media.js', 'business-builder/media-references.json', 'business-builder/index.php', 'business-builder/functions.php', 'business-builder/README.txt']);
  assert.equal(wordpress.count, wordpressNames.length);
  const themeHome = wordpress.files[0].text;
  const themeAbout = wordpress.files[1].text;
  assert.match(themeAbout, /esc_url\(home_url\('\/'\)\); \?>#top/);
  assert.match(themeHome, /esc_url\(get_stylesheet_uri\(\)\)/);
  assert.equal(themeHome.includes('data-editor-only'), false);
  assert.match(themeHome, /image-fade/);
  assert.match(wordpress.files.find(file => file.name.endsWith('style.css')).text, /Theme Name: Business Builder/);
  assert.match(wordpress.files.find(file => file.name.endsWith('index.php')).text, /pages\/' \. \$bb_slug \. '\.php'/);
});
