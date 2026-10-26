import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

register('./support/tsx.mjs', import.meta.url);
const {initial} = await import('../src/app/site/blocks.ts');
const {catalog} = await import('../src/app/site/catalog.ts');
const {ContentBrowser, contentGroups} = await import('../src/app/editor/content-browser.tsx');

const renderContent = (block, group = null) => renderToStaticMarkup(createElement(ContentBrowser, {
  block,
  group,
  site: initial,
  pages: [{id: 'home', name: 'Home', slug: 'home'}],
  update() {},
  change() {},
  footerDefaults: [],
  usage: new Map(),
  onOpen() {},
  home: true
}));

test('header inspector uses Navigation links and Business name with data counts', () => {
  const headerBlock = initial.blocks.find(b => b.type === 'header');
  assert.ok(headerBlock);
  const groups = contentGroups(headerBlock, initial, []);
  assert.equal(groups[0].label, 'Navigation links');
  assert.equal(groups[1].label, 'Business name');

  const markup = renderContent(headerBlock, null);
  assert.match(markup, /Navigation links/);
  assert.match(markup, /Business name/);
  assert.match(markup, /class="group-count">3<\/span>/);
  assert.match(markup, /class="group-list"/);
  assert.match(markup, /class="accordion"/);
});

test('hero inspector uses Headline & text, Action buttons, and Additional text toggle', () => {
  const heroBlock = initial.blocks.find(b => b.type === 'hero');
  assert.ok(heroBlock);
  const groups = contentGroups(heroBlock, initial, []);
  assert.equal(groups[0].label, 'Headline & text');
  assert.equal(groups[1].label, 'Action buttons');

  const markup = renderContent(heroBlock, 'message');
  assert.match(markup, /Headline &amp; text/);
  assert.match(markup, /Action buttons/);
  assert.match(markup, /Additional text/);
  assert.match(markup, /class="switch-row"/);
  assert.match(markup, /role="switch"/);
});

test('all 16 section types render cleanly with shared accordion structure', () => {
  const allSectionTypes = catalog.map(c => c.id);
  assert.equal(allSectionTypes.length, 16);

  for (const block of initial.blocks) {
    const markup = renderContent(block, null);
    assert.match(markup, /class="group-list"/);
    assert.match(markup, /class="accordion"/);
    assert.match(markup, /class="accordion-toggle"/);
    assert.match(markup, /group-icon/);
    assert.match(markup, /group-chevron/);
  }
});
