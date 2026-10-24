import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {migrateSite} from '../src/app/site/blocks.ts';
import {normalizeSettings} from '../src/app/editor/settings.ts';
import {mediaDefaults} from '../src/app/media/model.ts';

const unsplash = 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1800&q=85';
const copies = [
  ['cursor browser', '.recovery/2026-10-24/cursor-browser/localStorage/business-builder-workspace-v2.json', '31c8a9659036f69650dbd4bf21f7af1235037703f0f090b8d66305efea8835ac'],
  ['Google Chrome', '.recovery/2026-10-24/chrome-default/localStorage/business-builder-workspace-v2.json', 'a6674cac72a8aecdeb6433b129461e7e720aab9a127058030b31dd181f10475d'],
];

function media(src) { return {...mediaDefaults, src}; }
function block(type, content, extra = {}) {
  return {id:extra.id||type, type, layout:extra.layout||'Photo cards', hidden:false, settings:normalizeSettings(extra.settings||{columns:3, gap:16}), content:{
    smallLabel:'Label', title:'Custom title', description:'Custom description', items:[], media:media('media:kept'), buttons:[], facts:[], note:'', formButton:'', consent:'', fields:[], ...content,
  }};
}
function site(blocks) {
  return {brand:'Northline', hidden:[], headerStyle:'standard', footerStyle:'columns', address:'Chicago', phone:'555', email:'hello@example.com', footerColumns:[{title:'Keep', text:'Saved', links:[]}], blocks};
}
function diff(before, after, path = '$', out = []) {
  if (Object.is(before, after) || (typeof before === 'number' && typeof after === 'number' && Math.abs(before - after) < 1e-8)) return out;
  if (before && after && typeof before === 'object' && typeof after === 'object' && Array.isArray(before) === Array.isArray(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) diff(before[key], after[key], `${path}.${key}`, out);
    return out;
  }
  out.push({path, before, after});
  return out;
}
function kind(change) {
  const before = change.before, after = change.after, path = change.path;
  if (path.endsWith('.src') && (before === '' || before === undefined) && after) return 'forbidden';
  if (typeof before === 'string' && before.startsWith('media:') && before !== after) return 'forbidden';
  if (path.includes('.settings')) return 'forbidden';
  if (path.endsWith('.hours') && before === 'By appointment') return 'forbidden';
  if (before === unsplash && typeof after === 'string' && after.startsWith('/media/')) return 'expected';
  if (before === '/media/showcase/highway-suv.jpg' && after === '/media/ai-images/mountain-sports-car.mp4') return 'expected';
  if (before === 'Unclear timelines' && after === 'Moving deadlines') return 'expected';
  if (before === "Repairs shouldn't add more stress" && after === 'What gets in the way.') return 'expected';
  if (before === 'We understand what matters when your vehicle is off the road.' && String(after).includes('insurer red tape')) return 'expected';
  if (path.endsWith('.alt') && after === 'Moving deadlines') return 'expected';
  if (before === 'Know what happens next.' && String(after).startsWith('Parts delays')) return 'expected';
  if (before === 'The hassle' || after === 'The hassle') return 'expected';
  return 'unexpected';
}
function report(changes) {
  const groups = {expected:[], forbidden:[], unexpected:[]};
  for (const change of changes) groups[kind(change)].push(`${change.path}: ${JSON.stringify(change.before)} -> ${JSON.stringify(change.after)}`);
  return groups;
}
function migrated(value) {
  const once = migrateSite(structuredClone(value));
  assert.deepEqual(migrateSite(structuredClone(once)), once);
  return once;
}

test('a cleared image stays empty', () => {
  const input = site([block('hero', {title:'My headline', description:'My words', media:media('')}, {layout:'image'})]);
  const groups = report(diff(input, migrated(input)));
  assert.deepEqual(groups.forbidden, []);
  assert.deepEqual(groups.unexpected, []);
  assert.equal(migrated(input).blocks[0].content.media.src, '');
});

test('a custom pain description stays with its title', () => {
  const input = site([block('pains', {title:'What gets in the way.', description:'My own section copy.', items:[{title:'Unclear timelines', description:'I rewrote this concern.', icon:'calendar', tag:'The hassle', media:media('')}]})]);
  const item = migrated(input).blocks[0].content.items[0];
  assert.equal(item.title, 'Unclear timelines');
  assert.equal(item.description, 'I rewrote this concern.');
  assert.equal(item.media.src, '');
});

test('an exact legacy pain pair upgrades once', () => {
  const input = site([block('pains', {title:"Repairs shouldn't add more stress", description:'We understand what matters when your vehicle is off the road.', items:[{title:'Unclear timelines', description:'Know what happens next.', icon:'calendar', media:media(unsplash)}]})]);
  const once = migrated(input);
  const groups = report(diff(input, once));
  assert.deepEqual(groups.forbidden, [], groups.forbidden.join('\n'));
  assert.deepEqual(groups.unexpected, [], groups.unexpected.join('\n'));
  assert.ok(groups.expected.length > 0);
  const item = once.blocks[0].content.items[0];
  assert.equal(item.title, 'Moving deadlines');
  assert.match(item.description, /^Parts delays/);
  assert.equal(item.media.src, '/media/ai-images/rental-delay.jpg');
  assert.equal(once.blocks[0].content.title, 'What gets in the way.');
});

test('custom copy, uploaded media, hours, and settings survive', () => {
  const settings = normalizeSettings({columns:4, gap:12, padding:32, heading:{color:'#123456'}});
  const input = site([
    block('services', {title:'Our own services', description:'Written by the shop.', actionLabel:'Book a visit', items:[{title:'Collision repair', description:'Our panel process.', icon:'car', media:media('media:panel-photo')}]}, {settings}),
    block('contact', {title:'Visit', description:'Ask for Sam.', hours:'By appointment', media:media('media:shop-front')}, {id:'contact', layout:'Details and map', settings}),
  ]);
  const once = migrated(input);
  const groups = report(diff(input, once));
  assert.deepEqual(groups.forbidden, [], groups.forbidden.join('\n'));
  assert.deepEqual(groups.unexpected, [], groups.unexpected.join('\n'));
  assert.equal(once.blocks.find(b => b.type === 'services').content.actionLabel, 'Book a visit');
  assert.equal(once.blocks.find(b => b.type === 'services').content.items[0].media.src, 'media:panel-photo');
  assert.equal(once.blocks.find(b => b.id === 'contact').content.hours, 'By appointment');
  assert.deepEqual(once.blocks.find(b => b.id === 'contact').settings, settings);
});

for (const [name, file, sha] of copies) {
  test(`${name} workspace is unchanged by migration and the backup file is not rewritten`, () => {
    const raw = readFileSync(file, 'utf8');
    assert.equal(createHash('sha256').update(raw).digest('hex'), sha);
    const saved = JSON.parse(raw);
    assert.equal(saved.schemaVersion, 3);
    const changes = [];
    for (const page of saved.pages) {
      const once = migrateSite(structuredClone(page.site));
      assert.deepEqual(migrateSite(structuredClone(once)), once);
      for (const change of diff(page.site, once, page.id)) changes.push(change);
    }
    const groups = report(changes);
    assert.deepEqual(groups, {expected:[], forbidden:[], unexpected:[]}, JSON.stringify(groups, null, 2));
    assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), sha);
  });
}
