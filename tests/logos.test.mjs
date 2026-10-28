import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initial, validBlocks} from '../src/app/site/blocks.ts';
import {deliverySize, logoGap, logoScale} from '../src/app/editor/logo-model.ts';
import {restoreRemoved} from '../src/app/editor/hero-collection.ts';
register('./support/tsx.mjs', import.meta.url);
const {ContentBrowser} = await import('../src/app/editor/content-browser.tsx');
const {LogosStyle} = await import('../src/app/editor/logos-style.tsx');
const {LogosSection} = await import('../src/app/site/sections/logos.tsx');

const logos = () => structuredClone(initial.blocks.find(block => block.type === 'logos'));
const link = href => ({href});
const content = (block, group) => renderToStaticMarkup(createElement(ContentBrowser, {block, group, site: initial, pages: [], update() {}, change() {}, footerDefaults: [], usage: new Map(), onOpen() {}, home: true}));
const style = (block, start) => renderToStaticMarkup(createElement(LogosStyle, {block, start, changeLayout() {}, changeSettings() {}, change() {}}));
const section = block => renderToStaticMarkup(createElement(LogosSection, {block, editable: true, link, site: initial, selected: false, change() {}, labelFor: label => label, pages: [], homeId: 'home', activeId: 'home', parentIndex: 0}));

test('partner logos content is Message and Logos, with four rows until the rest are shown', () => {
  const block = logos();
  block.content.items = Array.from({length: 6}, (_, index) => ({title: `Mark ${index + 1}`, description: '', icon: 'none'}));
  const html = content(block, 'logos');
  assert.match(html, /6 items/);
  assert.match(html, /Add images/);
  assert.match(html, /Choose from library/);
  assert.match(html, /or drop a photo or video/);
  assert.equal((html.match(/class="hero-tile"/g) || []).length, 6);
  assert.match(html, /Logo name/);
  assert.match(html, /Destination/);
  assert.doesNotMatch(html, /Add logo|Show 2 more/);
  assert.match(content(block, 'message'), /Small label/);
  assert.match(content(block, null), /refined-chevron/);
});

test('partner logos style keeps stored layout ids and shared controls', () => {
  const html = style(logos());
  assert.match(html, /Heading \+ slider/);
  assert.match(html, /value="Heading and slider"/);
  assert.equal((html.match(/class="layout-choice"/g) || []).length, 3);
  assert.match(html, /type="radio"/);
  assert.match(style(logos(), 'sizing'), />Logo height</);
  assert.match(style(logos(), 'sizing'), /data-editor-only/);
  assert.match(style(logos(), 'spacing'), /aria-label="Between logos"/);
  assert.match(style(logos(), 'typography'), /aria-label="Align left"/);
  assert.equal((html.match(/refined-chevron/g) || []).length, (html.match(/class="refined-toggle"/g) || []).length);
});

test('every logo layout renders settings.gap and the slot scale', () => {
  for (const layout of ['Still row', 'Scrolling row', 'Heading and slider']) {
    const block = logos();
    block.layout = layout;
    block.settings = {...block.settings, gap: layout === 'Still row' ? 0 : 36};
    block.content.logoScale = 40;
    const html = section(block);
    const gap = layout === 'Still row' ? '0' : '36';
    assert.match(html, new RegExp(`data-logo-layout="${layout}"`));
    assert.match(html, new RegExp(`--logo-gap:${gap}px`));
    assert.match(html, new RegExp(`data-logo-gap="${gap}"`));
    assert.match(html, /data-logo-scale="40"/);
    assert.match(html, /--logo-scale:40/);
  }
  const still = section({...logos(), layout: 'Still row'});
  const scrolling = section({...logos(), layout: 'Scrolling row'});
  const slider = section({...logos(), layout: 'Heading and slider', content: {...logos().content, showHeading: true}});
  assert.match(still, /class="logo-still"/);
  assert.doesNotMatch(still, /logo-track|data-logo-slider/);
  assert.match(scrolling, /class="logo-track(?: is-loop)?"/);
  assert.match(scrolling, /data-logo-marquee|is-loop/);
  assert.doesNotMatch(scrolling, /Pause logos|Play logos|class="logo-pause"|data-logo-pause(?!-hover)/);
  assert.doesNotMatch(scrolling, /class="logo-still"|data-logo-slider=""/);
  assert.match(slider, /data-logo-slider/);
  assert.match(slider, /class="logo-slider"/);
  assert.doesNotMatch(slider, /logo-track/);
});

test('a logo link keeps one accessible name and an empty destination is not an anchor', () => {
  const block = logos();
  block.content.items = [
    {title: 'Plain', description: '', icon: 'none'},
    {title: 'Linked', description: '', icon: 'none', href: 'https://example.com', media: {...block.content.media, src: '/media/logo.png', alt: 'Example wordmark'}}
  ];
  const html = section(block);
  assert.match(html, /<strong>Plain<\/strong>/);
  assert.match(html, /aria-label="Example wordmark"/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.equal((html.match(/<a /g) || []).length, 1);
});

test('logo removal undo restores only that item', () => {
  const restored = restoreRemoved([{title: 'Audi'}, {title: 'Volvo updated'}], {title: 'BMW'}, 1);
  assert.deepEqual(restored.map(item => item.title), ['Audi', 'BMW', 'Volvo updated']);
  assert.equal(logoScale(undefined), 70);
  assert.equal(logoScale(20), 40);
  assert.equal(logoScale(99), 90);
  assert.equal(logoGap({gap: 12}), 12);
  assert.equal(deliverySize(200, 80), null);
  const fitted = deliverySize(1280, 800);
  assert.ok(fitted && fitted.width <= 400 && fitted.height <= 120 && fitted.width * 800 === fitted.height * 1280);
});

test('saved logo scale and destination stay valid', () => {
  const block = logos();
  block.content.logoScale = 70;
  block.content.monochrome = false;
  block.content.items = [{title: 'Shop', description: '', icon: 'none', href: 'https://example.com'}];
  assert.equal(validBlocks([block]), true);
  block.content.logoScale = 10;
  assert.equal(validBlocks([block]), false);
});
