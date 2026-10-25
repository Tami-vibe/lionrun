import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {historyReducer} from '../src/app/editor/history.ts';
import {initial} from '../src/app/site/blocks.ts';
import {htmlEscape, menuRuntime, packageWebsite} from '../src/app/export/package.ts';
import {exportRuntime} from '../src/app/media/export.ts';
import {zipFiles} from '../src/app/export/zip.ts';
import {safeHref} from '../src/app/site/safe-href.ts';
import {activePage, autosavedPages, legacySite, loadableWorkspace, mergedPages, preRecoveryKey, schemaBackupKey, sharedMenu, storedPages, syncableWorkspace, upgradeSchema2, workspaceKey, writeWorkspace, validSite} from '../src/app/editor/workspace.ts';

const copies = [
  ['cursor browser', '.recovery/2026-10-24/cursor-browser/localStorage/business-builder-workspace-v2.json', '31c8a9659036f69650dbd4bf21f7af1235037703f0f090b8d66305efea8835ac', 13],
  ['Google Chrome', '.recovery/2026-10-24/chrome-default/localStorage/business-builder-workspace-v2.json', 'a6674cac72a8aecdeb6433b129461e7e720aab9a127058030b31dd181f10475d', 25],
];

function memory(entries = []) {
  const store = new Map(entries);
  return {store, storage:{
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, value),
  }};
}

test('undo and redo do nothing when that direction is empty', () => {
  const state = {past: [], present: {brand: 'now'}, future: []};
  assert.equal(historyReducer(state, {type: 'undo'}), state);
  assert.equal(historyReducer(state, {type: 'redo'}), state);
});

test('repeated text edits in one field share a single undo step', () => {
  let state = {past: [], present: 'a', future: [9]};
  state = historyReducer(state, {type: 'set', next: 'ab', group: 'title'});
  state = historyReducer(state, {type: 'set', next: 'abc', group: 'title'});
  assert.equal(state.past.length, 1);
  assert.equal(state.present, 'abc');
  assert.deepEqual(state.future, []);
  state = historyReducer(state, {type: 'set', next: 'z', group: 'note'});
  assert.equal(state.past.length, 2);
  assert.equal(state.past.at(-1), 'abc');
  state = historyReducer(state, {type: 'undo'});
  assert.equal(state.present, 'abc');
  state = historyReducer(state, {type: 'undo'});
  assert.equal(state.present, 'a');
});

test('history records a change, restores it, and caps the past', () => {
  let state = {past: [], present: 0, future: []};
  state = historyReducer(state, {type: 'set', next: 1});
  state = historyReducer(state, {type: 'undo'});
  assert.equal(state.present, 0);
  assert.deepEqual(state.future, [1]);
  state = historyReducer(state, {type: 'redo'});
  assert.equal(state.present, 1);
  assert.deepEqual(state.future, []);
  const loaded = historyReducer(state, {type: 'load', next: 9});
  assert.deepEqual(loaded, {past: [], present: 9, future: []});
  const synced = historyReducer(loaded, {type: 'sync', next: 4});
  assert.deepEqual(synced.past, []);
  assert.equal(synced.present, 4);
  state = {past: [], present: 0, future: []};
  for (let step = 1; step <= 41; step++) state = historyReducer(state, {type: 'set', next: step});
  assert.equal(state.past.length, 40);
  assert.equal(state.past[0], 1);
  assert.equal(state.present, 41);
});

test('saved workspaces still pass the load check and are not rewritten', () => {
  for (const [name, path, checksum, count] of copies) {
    const bytes = readFileSync(path);
    const saved = JSON.parse(bytes.toString('utf8'));
    assert.equal(loadableWorkspace(saved), true, name);
    assert.equal(saved.pages.length, count);
    const once = storedPages(saved.pages);
    assert.deepEqual(storedPages(once), once);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), checksum);
  }
});

test('unreadable workspace values are rejected', () => {
  assert.equal(loadableWorkspace(null), false);
  assert.equal(loadableWorkspace({schemaVersion: 3, pages: []}), false);
  assert.equal(loadableWorkspace({schemaVersion: 1, pages: [{id: 'home', name: 'Home', site: initial}]}), false);
  assert.equal(syncableWorkspace({schemaVersion: 3, pages: [{site: {brand: 1}}]}), false);
  assert.equal(validSite(initial), true);
  assert.equal(validSite({...initial, nav: ['1', '2', '3', '4', '5', '6']}), false);
  assert.equal(validSite({...initial, headerButtons: [{label: 'A', href: '#contact', icon: 'nope'}]}), false);
  assert.equal(validSite({...initial, headerButtons: [{label: 'A', href: '#contact', icon: 'arrow'}]}), true);
  assert.equal(validSite({...initial, headerButtons: [{label: 'A', href: '#contact', icon: 'arrow', iconPosition: 'left'}]}), true);
  assert.equal(validSite({...initial, headerButtons: [{label: 'A', href: '#contact', icon: 'arrow', iconPosition: 'up'}]}), false);
  const cleared = {...initial, blocks: initial.blocks.map(block => block.id === initial.blocks[0].id ? {...block, content: {...block.content, media: {...block.content.media, src: ''}}} : block)};
  assert.equal(validSite(cleared), true);
  assert.equal(legacySite({brand: 'Nope'}, initial), null);
  assert.throws(() => autosavedPages('{', []));
});

test('saving keeps other pages and writes the pre-recovery copy once', () => {
  const current = [{id: 'home', name: 'Home', slug: 'home', site: {...initial, headline: 'This page'}}];
  const kept = {id: 'kept', name: 'Kept', slug: 'kept', site: {...initial, headline: 'Leave this page'}};
  const raw = JSON.stringify({schemaVersion: 3, pages: [kept, {id: 'home', name: 'Old home', site: initial}]});
  const merged = mergedPages(raw, current);
  assert.equal(merged.find(page => page.id === 'home').name, 'Home');
  assert.equal(merged.find(page => page.id === 'kept').site.headline, 'Leave this page');
  const autosaved = autosavedPages(JSON.stringify({pages: [{id: 'old', name: 'Old', site: {marker: true}}]}), current);
  assert.equal(autosaved.find(page => page.id === 'old').site.marker, true);
  const {store, storage} = memory([[workspaceKey, raw]]);
  writeWorkspace(storage, 'home', current);
  assert.equal(store.get(preRecoveryKey), raw);
  assert.equal(JSON.parse(store.get(workspaceKey)).schemaVersion, 3);
  store.set(workspaceKey, '{"schemaVersion":3,"pages":["later"]}');
  writeWorkspace(storage, 'home', current);
  assert.equal(store.get(preRecoveryKey), raw);
});

test('a schema 2 workspace is backed up once before it becomes schema 3', () => {
  const raw = '{"schemaVersion":2,"activeId":"home","pages":[]}';
  const {store, storage} = memory([[workspaceKey, raw]]);
  upgradeSchema2(storage, raw, 'home', []);
  assert.equal(store.get(schemaBackupKey), raw);
  assert.equal(store.get(preRecoveryKey), raw);
  assert.equal(JSON.parse(store.get(workspaceKey)).schemaVersion, 3);
  store.set(workspaceKey, raw);
  upgradeSchema2(storage, '{"schemaVersion":2,"replaced":true}', 'home', []);
  assert.equal(store.get(schemaBackupKey), raw);
  assert.equal(store.get(preRecoveryKey), raw);
});

test('a page keeps its own copy when the shared menu is copied', () => {
  const page = {...initial, brand: 'CUSTOM', headline: 'Page headline', blocks: initial.blocks.map(block => block.type === 'services' ? {...block, content: {...block.content, title: 'My services'}} : block)};
  const shared = sharedMenu(page, initial);
  assert.equal(shared.brand, initial.brand);
  assert.equal(shared.headline, 'Page headline');
  assert.equal(shared.blocks.find(block => block.type === 'services').content.title, 'My services');
  assert.equal(activePage([{id: 'home'}, {id: 'about'}], 'missing').id, 'home');
});

test('zip entries round-trip and an empty archive is only the directory end', async () => {
  const blob = zipFiles([{name: 'index.html', data: new TextEncoder().encode('<ok>')}, {name: 'assets/style.css', data: new TextEncoder().encode('body{}')}]);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.deepEqual(Array.from(bytes.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04]);
  const nameLength = bytes[26] | (bytes[27] << 8);
  assert.equal(new TextDecoder().decode(bytes.slice(30, 30 + nameLength)), 'index.html');
  assert.equal(new TextDecoder().decode(bytes.slice(30 + nameLength, 30 + nameLength + 4)), '<ok>');
  const empty = new Uint8Array(await zipFiles([]).arrayBuffer());
  assert.equal(empty.length, 22);
  assert.deepEqual(Array.from(empty.slice(0, 4)), [0x50, 0x4b, 0x05, 0x06]);
});

test('export escaping and link checks reject active content', () => {
  assert.equal(htmlEscape(`a&b<c>"'`), 'a&amp;b&lt;c&gt;&quot;&#39;');
  assert.equal(safeHref('javascript:alert(1)'), '#contact');
  assert.equal(safeHref('//evil.example'), '#contact');
  assert.equal(safeHref('https://user:pass@example.com/path'), '#contact');
  assert.equal(safeHref('https://example.com/path'), 'https://example.com/path');
  assert.equal(safeHref('mailto:hello@example.com'), 'mailto:hello@example.com');
  assert.match(menuRuntime, /menu-dropdown/);
  assert.match(exportRuntime, /data-load-embed/);
  const source = packageWebsite.toString();
  for (const marker of ['data-editor-only', 'data-review-more', 'data-logo-step', 'data-slideshow', 'data-gallery', 'exportRuntime'])
    assert.match(source, new RegExp(marker));
});
