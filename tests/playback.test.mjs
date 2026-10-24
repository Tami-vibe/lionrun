import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMedia, videoClick, videoPlan} from '../src/app/media/model.ts';
import {exportRuntime} from '../src/app/media/export.ts';
import {initial, validBlocks} from '../src/app/site/blocks.ts';
import {htmlEscape, packageWebsite} from '../src/app/export/package.ts';

const saved = {src: '/media/road.mp4', kind: 'video', alt: 'Road', title: 'Drive', autoplay: true, muted: true, loop: true, controls: false};

test('videos saved before playback settings keep their loop and stay muted', () => {
  const legacy = normalizeMedia(saved);
  assert.equal(legacy.playback, 'loop');
  assert.equal(legacy.loop, true);
  assert.equal(legacy.clickToPlay, false);
  assert.equal(legacy.muted, true);
  assert.equal(legacy.autoplay, true);
  assert.equal(legacy.controls, false);
  const once = normalizeMedia({...saved, loop: false});
  assert.equal(once.playback, 'once');
  assert.equal(once.loop, false);
  const untouched = normalizeMedia({src: '/media/photo.jpg', kind: 'image'});
  assert.equal(untouched.playback, 'loop');
  assert.equal(untouched.clickToPlay, false);
});

test('each video keeps its own mute, autoplay, playback, controls, and poster', () => {
  const first = normalizeMedia({...saved, poster: '/media/one.jpg', playback: 'restart', clickToPlay: true, controls: false});
  const second = normalizeMedia({...saved, src: '/media/shop.mp4', muted: false, autoplay: false, playback: 'once', controls: true, poster: 'https://cdn.example/poster.jpg'});
  assert.equal(first.playback, 'restart');
  assert.equal(first.loop, false);
  assert.equal(first.clickToPlay, true);
  assert.equal(first.poster, '/media/one.jpg');
  assert.equal(second.playback, 'once');
  assert.equal(second.muted, false);
  assert.equal(second.autoplay, false);
  assert.equal(second.controls, true);
  assert.equal(videoPlan(first).customClick, true);
  assert.equal(videoPlan(second).customClick, false);
  assert.deepEqual(
    [videoClick({paused: false, ended: false, currentTime: 2}, videoPlan(first)), videoClick({paused: true, ended: true, currentTime: 8}, videoPlan(first)), videoClick({paused: true, ended: true, currentTime: 8}, videoPlan(second))],
    ['pause', 'restart', 'ignore'],
  );
});

test('play once stays stopped, restart resets, and native controls own the click', () => {
  const once = videoPlan(normalizeMedia({...saved, playback: 'once', controls: false, clickToPlay: true}));
  const restart = videoPlan(normalizeMedia({...saved, playback: 'restart', controls: false, clickToPlay: false}));
  const native = videoPlan(normalizeMedia({...saved, playback: 'restart', controls: true, clickToPlay: true}));
  assert.equal(videoClick({paused: false, ended: true, currentTime: 4}, once), 'ignore');
  assert.equal(videoClick({paused: true, ended: false, currentTime: 1}, once), 'play');
  assert.equal(videoClick({paused: false, ended: false, currentTime: 1}, restart), 'ignore');
  assert.equal(videoClick({paused: true, ended: false, currentTime: 0}, restart), 'play');
  assert.equal(videoClick({paused: true, ended: true, currentTime: 9}, restart), 'restart');
  assert.equal(videoClick({paused: true, ended: true, currentTime: 9}, native), 'ignore');
});

test('autoplay rejection is caught and does not turn sound on', () => {
  assert.match(exportRuntime, /video\.play\(\)\.catch/);
  assert.match(exportRuntime, /prefers-reduced-motion/);
  assert.match(exportRuntime, /data-playback/);
  assert.match(exportRuntime, /data-video-toggle/);
  assert.equal(exportRuntime.includes('muted=false'), false);
  assert.equal(exportRuntime.includes('removeAttribute(\'muted\')'), false);
  const heard = normalizeMedia({...saved, muted: false, autoplay: true});
  assert.equal(heard.muted, false);
  assert.equal(heard.autoplay, true);
});

test('schema 3 blocks stay valid with and without the new video fields', () => {
  assert.equal(validBlocks(initial.blocks), true);
  const blocks = structuredClone(initial.blocks);
  const hero = blocks.find(block => block.type === 'hero');
  delete hero.content.media.playback;
  delete hero.content.media.clickToPlay;
  assert.equal(validBlocks(blocks), true);
  hero.content.media.playback = 'restart';
  hero.content.media.clickToPlay = false;
  assert.equal(validBlocks(blocks), true);
  hero.content.media.playback = 1;
  assert.equal(validBlocks(blocks), false);
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
  const node = {tag, attrs: {...attrs}, style: {}, children, parent: null, textContent: '', muted: tag === 'video' && Object.hasOwn(attrs, 'muted')};
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
    const walk = current => { for (const child of current.children) { if (typeof child === 'string') continue; if (matches(child, selector)) found.push(child); walk(child); } };
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

test('export paths and packaged markup keep unsafe slugs and media URLs escaped', async () => {
  const hostile = 'https://cdn.example/clip.mp4?x="><script>alert(1)</script>';
  const home = element('div', {'data-export-page': 'home'}, [element('div', {class: 'site-preview'}, [
    element('video', {src: hostile, 'data-playback': 'restart', 'data-autoplay': 'true', 'data-click-play': 'true'}),
    element('button', {'data-video-toggle': '', type: 'button'}, ['Play']),
  ])]);
  const root = element('#document', {}, [home]);
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
  const bytes = new Uint8Array(await (await packageWebsite([{id: 'home', name: 'Home', slug: "home');phpinfo();//", site: {seoTitle: 'Home', seoDescription: ''}}], 'wordpress')).arrayBuffer());
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
  const text = files.map(file => `${file.name}\n${file.text}`).join('\n');
  assert.equal(files.some(file => file.name.includes('phpinfo') || file.name.includes("'")), false);
  assert.equal(text.includes('phpinfo'), false);
  assert.match(text, /data-playback="restart"/);
  assert.match(text, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.equal(text.includes('<script>alert(1)</script>'), false);
  assert.match(files.find(file => file.name.endsWith('assets/media.js')).text, /data-video-toggle/);
});
