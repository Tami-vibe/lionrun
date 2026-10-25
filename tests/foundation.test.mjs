import test from 'node:test';
import assert from 'node:assert/strict';
import {historyReducer} from '../src/app/editor/history.ts';
import {buttonIconSide, contentForLayout, initial, migrateSite, settingsForLayout, validBlocks} from '../src/app/site/blocks.ts';
import {loadableWorkspace, preRecoveryKey, schemaBackupKey, unreadableWorkspaceKey, workspaceKey, writeWorkspace} from '../src/app/editor/workspace.ts';
import {pageAddresses} from '../src/app/editor/settings.ts';
import {mediaURL} from '../src/app/media/model.ts';
import {validateSVG} from '../src/app/media/store.ts';
import {htmlEscape, packageWebsite} from '../src/app/export/package.ts';
import {safeHref} from '../src/app/site/safe-href.ts';

function memory(entries = []) {
  const store = new Map(entries);
  return {store, storage: {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, value),
  }};
}

test('a normal save leaves the schema backup and unreadable copy untouched', () => {
  const original = '{"schemaVersion":3,"pages":["original"]}';
  const {store, storage} = memory([
    [workspaceKey, original],
    [schemaBackupKey, 'schema-backup'],
    [unreadableWorkspaceKey, 'corrupt-copy'],
  ]);
  writeWorkspace(storage, 'home', [{id: 'home', name: 'Home', slug: 'home', site: initial}]);
  assert.equal(store.get(schemaBackupKey), 'schema-backup');
  assert.equal(store.get(unreadableWorkspaceKey), 'corrupt-copy');
  assert.equal(store.get(preRecoveryKey), original);
  const saved = JSON.parse(store.get(workspaceKey));
  assert.equal(saved.schemaVersion, 3);
  assert.equal(saved.activeId, 'home');
  assert.equal(saved.pages[0].site.headline, initial.headline);
});

test('workspaces outside schema 3 and the 30-page cap are rejected', () => {
  const page = (id) => ({id, name: id, site: initial});
  assert.equal(loadableWorkspace({schemaVersion: 3, pages: Array.from({length: 30}, (_, index) => page(`p${index}`))}), true);
  assert.equal(loadableWorkspace({schemaVersion: 3, pages: Array.from({length: 31}, (_, index) => page(`p${index}`))}), false);
  assert.equal(loadableWorkspace({schemaVersion: 4, pages: [page('home')]}), false);
  assert.equal(loadableWorkspace({schemaVersion: 3, pages: [{id: 'home', name: 'Home', site: null}]}), false);
});

test('custom logo names stay custom across repeated migration', () => {
  const logos = structuredClone(initial.blocks.find(block => block.type === 'logos'));
  logos.content.title = 'Our own partners';
  logos.content.description = 'Names we chose.';
  logos.content.items = [{title: 'Neighborhood garage', description: 'Kept', icon: 'none'}];
  const input = {...initial, blocks: initial.blocks.map(block => block.type === 'logos' ? logos : block)};
  const once = migrateSite(structuredClone(input));
  const twice = migrateSite(structuredClone(once));
  const saved = twice.blocks.find(block => block.type === 'logos').content;
  assert.equal(saved.title, 'Our own partners');
  assert.equal(saved.description, 'Names we chose.');
  assert.deepEqual(saved.items.map(item => item.title), ['Neighborhood garage']);
  assert.deepEqual(once.blocks.find(block => block.type === 'logos').content, saved);
});

test('a new edit discards the redo future and restores the previous layout', () => {
  const authored = initial.blocks.find(block => block.type === 'hero');
  const switched = {...authored, layout: 'split', content: contentForLayout(authored, 'split')};
  let state = {past: [], present: authored, future: []};
  state = historyReducer(state, {type: 'set', next: switched});
  state = historyReducer(state, {type: 'undo'});
  assert.equal(state.present, authored);
  assert.equal(state.present.content.title, authored.content.title);
  state = historyReducer(state, {type: 'set', next: {...authored, layout: 'center'}});
  assert.deepEqual(state.future, []);
  assert.equal(state.present.layout, 'center');
  assert.equal(state.past.at(-1).layout, authored.layout);
});

test('column counts follow the layout and keep custom widths at the same count', () => {
  const custom = {columns: 3, widths: [50, 30, 20], gap: 8, padding: 40};
  const signals = settingsForLayout('trust', 'Signals', custom);
  assert.equal(signals.columns, 1);
  assert.deepEqual(signals.widths, [100]);
  assert.equal(signals.gap, 8);
  assert.equal(signals.padding, 40);
  const paired = settingsForLayout('faq', 'Two columns', {columns: 1, widths: [100], gap: 4, padding: 10});
  assert.equal(paired.columns, 2);
  assert.equal(paired.widths.length, 2);
  const kept = settingsForLayout('proof', 'Text and photo', {columns: 2, widths: [40, 60], gap: 12, padding: 64});
  assert.equal(kept.columns, 2);
  assert.deepEqual(kept.widths, [40, 60]);
});

test('a missing button icon position stays on the right', () => {
  const blocks = structuredClone(initial.blocks);
  const hero = blocks.find(block => block.type === 'hero');
  assert.equal(hero.content.buttons[0].iconPosition, undefined);
  assert.equal(buttonIconSide(hero.content.buttons[0]), 'right');
  assert.equal(validBlocks(blocks), true);
  hero.content.buttons[0] = {...hero.content.buttons[0], iconPosition: 'left'};
  assert.equal(buttonIconSide(hero.content.buttons[0]), 'left');
  assert.equal(validBlocks(blocks), true);
  hero.content.buttons[0] = {...hero.content.buttons[0], iconPosition: 'right'};
  assert.equal(validBlocks(blocks), true);
  hero.content.buttons[0] = {...hero.content.buttons[0], iconPosition: 'center'};
  assert.equal(validBlocks(blocks), false);
});

test('review stars outside 1 to 5 are rejected', () => {
  const reviews = structuredClone(initial.blocks.find(block => block.type === 'reviews'));
  reviews.content.items[0].stars = 5;
  assert.equal(validBlocks(initial.blocks.map(block => block.type === 'reviews' ? reviews : block)), true);
  for (const stars of [0, 6, 1.5, -1]) {
    reviews.content.items[0].stars = stars;
    assert.equal(validBlocks([reviews]), false, String(stars));
  }
  delete reviews.content.items[0].stars;
  assert.equal(validBlocks([reviews]), true);
});

test('media addresses reject scripts, credentials, traversal, and SVG data URLs', () => {
  assert.equal(mediaURL('javascript:alert(1)'), '');
  assert.equal(mediaURL('https://user:pass@example.com/a.jpg'), '');
  assert.equal(mediaURL('/media/../secret.jpg'), '');
  assert.equal(mediaURL('data:image/svg+xml;base64,PHN2Zy8+'), '');
  assert.equal(mediaURL('media:upload-1'), 'media:upload-1');
  assert.equal(mediaURL('/media/showcase/workshop-bay.jpg'), '/media/showcase/workshop-bay.jpg');
  assert.equal(safeHref('data:text/html,<script>alert(1)</script>'), '#contact');
  assert.throws(() => validateSVG('<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"></svg>'), /entities|document types/i);
});

test('page addresses reject a slug that would break the theme', () => {
  const pages = pageAddresses([{name: 'Home', slug: "home');phpinfo();//"}]);
  assert.equal(pages[0].slug, 'home');
  assert.equal(pages[0].slug.includes("'"), false);
});

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
function element(tag, attrs = {}, children = []) {
  const node = {tag, attrs: {...attrs}, style: {}, children, parent: null, textContent: ''};
  for (const child of children) if (typeof child !== 'string') child.parent = node;
  node.classList = {remove() {}};
  node.setAttribute = (name, value) => { node.attrs[name] = String(value); };
  node.removeAttribute = name => { delete node.attrs[name]; };
  node.remove = () => { if (node.parent) node.parent.children = node.parent.children.filter(child => child !== node); };
  Object.defineProperty(node, 'dataset', {get() {
    return Object.fromEntries(Object.entries(node.attrs).flatMap(([key, value]) => key.startsWith('data-') ? [[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]] : []));
  }});
  Object.defineProperty(node, 'attributes', {get() { return Object.entries(node.attrs).map(([name, value]) => ({name, value})); }});
  node.matches = selector => matches(node, selector);
  node.querySelector = selector => node.querySelectorAll(selector)[0] || null;
  node.querySelectorAll = selector => {
    const found = [];
    const walk = current => {
      for (const child of current.children) {
        if (typeof child === 'string') continue;
        if (matches(child, selector)) found.push(child);
        walk(child);
      }
    };
    walk(node);
    return found;
  };
  node.cloneNode = () => element(node.tag, node.attrs, node.children.map(child => typeof child === 'string' ? child : child.cloneNode()));
  Object.defineProperty(node, 'outerHTML', {get() {
    const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${htmlEscape(String(value))}"`).join('');
    const body = node.children.map(child => typeof child === 'string' ? htmlEscape(child) : child.outerHTML).join('');
    return `<${node.tag}${attrs}>${body}</${node.tag}>`;
  }});
  return node;
}

test('published archives keep sample warnings as text and drop editor chrome', async () => {
  const warning = 'Replace these examples with authentic, attributed reviews before publishing.';
  const sample = 'Add a real customer\'s review and permission to display it. Casey Nguyen <script>alert(1)</script>';
  const home = element('div', {'data-export-page': 'home'}, [element('div', {class: 'site-preview'}, [
    element('span', {'data-editor-only': 'true', class: 'section-badge'}, ['Editor']),
    element('section', {'data-section': 'reviews'}, [warning, sample]),
    element('details', {open: ''}, ['Hidden until opened']),
  ])]);
  const service = element('div', {'data-export-page': 'service'}, [element('div', {class: 'site-preview'}, [
    element('a', {'data-site-href': '/home', 'data-link-page': 'home', 'data-link-hash': '#services'}, ['Collision repair']),
  ])]);
  const root = element('#document', {}, [home, service]);
  globalThis.CSS = {escape: value => value};
  globalThis.getComputedStyle = () => ({getPropertyValue: () => ''});
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
  const pages = [
    {id: 'home', name: 'Home', slug: 'home', site: {seoTitle: 'Home <shop>', seoDescription: warning}},
    {id: 'service', name: 'Collision repair', slug: 'collision-repair', site: {seoTitle: 'Collision', seoDescription: ''}},
  ];
  const read = async (format) => {
    const bytes = new Uint8Array(await (await packageWebsite(pages, format)).arrayBuffer());
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
    return files;
  };
  const html = await read('html');
  const homeFile = html.find(file => file.name === 'index.html').text;
  const serviceFile = html.find(file => file.name === 'collision-repair/index.html').text;
  assert.match(homeFile, new RegExp(htmlEscape(warning)));
  assert.match(homeFile, /Casey Nguyen/);
  assert.match(homeFile, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.equal(homeFile.includes('<script>alert(1)</script>'), false);
  assert.equal(homeFile.includes('data-editor-only'), false);
  assert.equal(homeFile.includes('section-badge'), false);
  assert.equal(homeFile.includes('<details open'), false);
  assert.match(serviceFile, /href="\.\.\/index\.html#services"/);
  assert.match(html.find(file => file.name === 'README.txt').text, /Forms are demonstrations and do not submit or store data/);
  assert.match(html.find(file => file.name === 'assets/media.js').text, /prefers-reduced-motion/);
  const wordpress = await read('wordpress');
  const themeHome = wordpress.find(file => file.name === 'business-builder/pages/home.php').text;
  assert.match(themeHome, /Casey Nguyen/);
  assert.equal(themeHome.includes('data-editor-only'), false);
  assert.equal(themeHome.includes("phpinfo"), false);
  assert.match(wordpress.find(file => file.name === 'business-builder/README.txt').text, /Forms are demonstrations/);
});
