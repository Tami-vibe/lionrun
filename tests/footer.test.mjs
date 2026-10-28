import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
  footerDefaults, validFooter, validOfficeDay, safeSocialUrl,
  footerRadius, footerHoverText, contrastRatio,
} from '../src/app/site/footer-model.ts';
import {initial, migrateSite, validBlocks} from '../src/app/site/blocks.ts';
import {sharedMenu, validSite} from '../src/app/editor/workspace.ts';
import {collectMediaUsage, isAssetUnused} from '../src/app/media/usage.ts';
import {bindMenu} from '../src/app/site/settings.ts';
import {syncMenusToSite} from '../src/app/site/menu-model.ts';
import {mediaDefaults} from '../src/app/media/model.ts';
register('./support/tsx.mjs', import.meta.url);
const {FooterSection} = await import('../src/app/site/sections/menu.tsx');
const fixture = () => migrateSite(structuredClone(initial));
const setup = (layout = 'hours') => {
  const site = fixture();
  const block = site.blocks.find(item => item.type === 'footer');
  block.content.footer = {...footerDefaults('Care for your home.'), layout};
  return {site, block, config: block.content.footer};
};
const render = (site, block, pages = []) => renderToStaticMarkup(createElement(FooterSection, {
  site, block, pages, editable: false, selected: false, change() {},
  link: (href, pageId) => ({href: pageId ? `/?page=${pageId}` : href}),
  labelFor: label => label,
}));

test('legacy Footer content and separate wide image survive migration', () => {
  const site = fixture();
  const footer = site.blocks.find(item => item.type === 'footer');
  footer.content.note = 'My original footer text';
  footer.content.media.src = '/media/original-footer.jpg';
  const next = migrateSite(site).blocks.find(item => item.type === 'footer');
  assert.equal(next.content.note, 'My original footer text');
  assert.equal(next.content.media.src, '/media/original-footer.jpg');
  assert.equal(next.content.footer, undefined);
  assert.ok(validSite(site));
});
test('defaults do not publish guessed office hours or social accounts', () => {
  const config = footerDefaults();
  assert.ok(validFooter(config));
  assert.equal(config.hoursReady, false);
  assert.deepEqual(config.socials, []);
  assert.deepEqual(config.bottomLinks, []);
});
test('Footer validation rejects malformed nested data without throwing', () => {
  for (const value of [null, {}, {...footerDefaults(), hours: [null]},
    {...footerDefaults(), text: {motto: {size: Infinity}}},
    {...footerDefaults(), socials: [{id: 'x', label: 'X', href: 'javascript:alert(1)'}]}]) {
    assert.equal(validFooter(value), false);
  }
  const {site, block} = setup();
  block.content.footer.itemGap = NaN;
  assert.equal(validBlocks(site.blocks), false);
});
test('schedules validate real times and preserve explicit closed days', () => {
  const config = footerDefaults();
  assert.ok(config.hours.every(validOfficeDay));
  assert.equal(validOfficeDay({...config.hours[0], open: '25:00'}), false);
  assert.equal(validOfficeDay({...config.hours[0], closed: false,
    open: '18:00', close: '09:00'}), false);
});
test('any social platform works, while executable URLs are rejected', () => {
  assert.equal(safeSocialUrl('https://example.org/community'), 'https://example.org/community');
  assert.equal(safeSocialUrl('javascript:alert(1)'), null);
  const {site, block, config} = setup('stack');
  config.socials = [{id: 'custom', label: 'Our community', href: 'https://example.org/community'}];
  assert.match(render(site, block), /aria-label="Our community"/);
});
test('layout switching retains columns and hides hours without deleting the schedule', () => {
  const {site, block, config} = setup();
  config.hoursReady = true;
  config.hours[0].closed = false;
  assert.match(render(site, block), /09:00–17:00/);
  config.layout = 'bottom';
  assert.doesNotMatch(render(site, block), /09:00–17:00/);
  config.layout = 'hours';
  assert.match(render(site, block), /09:00–17:00/);
  config.online = true;
  assert.doesNotMatch(render(site, block), /09:00–17:00/);
  assert.equal(config.hours[0].open, '09:00');
});
test('all Footer data shares across pages and round trips through workspace validation', () => {
  const {site, config} = setup();
  config.bottomLinks = [{id: 'contact', label: 'Get help', href: '/?page=contact',
    pageId: 'contact', customLabel: true}];
  const shared = sharedMenu(fixture(), site);
  assert.deepEqual(shared.blocks.find(item => item.type === 'footer').content.footer, config);
  assert.ok(validSite(JSON.parse(JSON.stringify(shared))));
});
test('custom Footer page names survive binding and menu edits', () => {
  const {site} = setup();
  site.footerColumns = [{title: 'Explore', text: '', links: [
    {label: 'Get help', href: '/?page=contact', pageId: 'contact', customLabel: true},
    {label: 'Our community', href: 'https://example.org', customLabel: true},
  ]}];
  const pages = [{id: 'contact', name: 'Contact us', slug: 'contact'}];
  assert.equal(bindMenu(site, pages).footerColumns[0].links[0].label, 'Get help');
  const menus = [{id: 'footer', name: 'Footer', items: [
    {id: 'c', text: 'Contact us', linkTo: 'page', destination: '', pageId: 'contact'},
  ]}];
  const patch = syncMenusToSite(site, menus, {footer: 'footer'}, pages);
  assert.deepEqual(patch.footerColumns[0].links.map(link => link.label),
    ['Get help', 'Our community']);
});
test('missing custom page links remain editable but do not navigate elsewhere', () => {
  const {site, block, config} = setup();
  config.bottomLinks = [{id: 'gone', label: 'Get help', pageId: 'gone', href: '/?page=gone'}];
  const html = render(site, block);
  assert.match(html, /aria-disabled="true"/);
  assert.doesNotMatch(html, /href="\/\?page=gone"/);
});
test('custom Footer logo is protected as used media independently of the wide image', () => {
  const {site, config} = setup();
  config.logoMode = 'custom';
  config.logo = {...mediaDefaults, src: 'media:logo-file'};
  const usage = collectMediaUsage([{id: 'home', name: 'Home', site}]);
  assert.equal(isAssetUnused(usage, 'logo-file'), false);
  assert.equal(usage.get('logo-file')[0].field, 'logo');
});
test('hover shapes follow Header semantics and small-text contrast is maintained', () => {
  assert.equal(footerRadius('header', 'pill'), 999);
  assert.equal(footerRadius('header', 'rounded'), 6);
  assert.equal(footerRadius('header', 'standard'), 0);
  for (const [fg, bg] of [['#252938', '#fafafc'], ['#f0f3fa', '#1d242c'],
    ['#888888', '#ffffff'], ['#777777', '#777777']]) {
    assert.ok(contrastRatio(footerHoverText(fg, bg), bg) >= 4.5);
  }
});
