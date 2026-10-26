import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initial, validBlocks} from '../src/app/site/blocks.ts';
import {mediaDefaults} from '../src/app/media/model.ts';
import {SECTION_STAGE_LIMIT, HERO_ADD_LIMIT, collectionPatch, heroSlides} from '../src/app/editor/hero-collection.ts';
register('./support/tsx.mjs', import.meta.url);
const {ContentBrowser} = await import('../src/app/editor/content-browser.tsx');
const {PromotionSection, QuoteSection, ContactSection, TrustSection} = await import('../src/app/site/sections/content.tsx');

const image = {...mediaDefaults, src: '/media/one.jpg', alt: 'One'};
const video = {...mediaDefaults, src: '/media/two.mp4', kind: 'video', muted: true};
const contentMarkup = (block, group) => renderToStaticMarkup(createElement(ContentBrowser, {
  block, group, site: initial, pages: [], update: () => assert.fail('Render must not mutate'),
  change: () => assert.fail('Render must not mutate'), footerDefaults: [], usage: new Map(), onOpen: () => {}, home: true,
}));

test('section stage limit is 4 and hero stays at 3', () => {
  assert.equal(SECTION_STAGE_LIMIT, 4);
  assert.equal(HERO_ADD_LIMIT, 3);
});

test('Why choose us media stage shows Image Video Slideshow and mute for video', () => {
  const block = structuredClone(initial.blocks.find(b => b.type === 'proof'));
  const third = {...image, src: '/media/three.jpg'}, fourth = {...image, src: '/media/four.jpg'};
  block.content = {...block.content, ...collectionPatch([image, video, third, fourth], 1), mediaMode: 'video'};
  const html = contentMarkup(block, 'photo');
  assert.match(html, /class="media-modes"/);
  assert.match(html, />Image</);
  assert.match(html, />Video</);
  assert.match(html, />Slideshow</);
  assert.match(html, /aria-label="Muted"/);
  assert.match(html, /This section holds 4 items/);
  assert.match(html, /aria-disabled="true"|disabled/);
});

test('Contact map stage hides Slideshow and keeps Image Video', () => {
  const block = structuredClone(initial.blocks.find(b => b.type === 'contact'));
  const html = contentMarkup(block, 'image');
  assert.match(html, /class="media-modes"/);
  assert.match(html, />Image</);
  assert.match(html, />Video</);
  assert.doesNotMatch(html, />Slideshow</);
});

test('Promo Quote Closing and Trust Signals use the compact section stage', () => {
  for (const [type, group] of [['promo', 'image'], ['quote', 'image'], ['closing', 'image']]) {
    const block = structuredClone(initial.blocks.find(b => b.type === type));
    const html = contentMarkup(block, group);
    assert.match(html, /class="media-modes"/, type);
    assert.match(html, />Slideshow</, type);
  }
  const trust = structuredClone(initial.blocks.find(b => b.type === 'trust'));
  trust.layout = 'Signals';
  const html = contentMarkup(trust, 'photo');
  assert.match(html, /class="media-modes"/);
  assert.match(html, />Slideshow</);
});

test('unmuted video patch persists on the selected collection item', () => {
  const items = [image, {...video, muted: false}];
  const patch = collectionPatch(items, 1);
  assert.equal(heroSlides(patch)[1].muted, false);
  assert.equal(patch.media.src, image.src);
  assert.equal(patch.slides[0].muted, false);
});

test('promo quote contact and trust render MediaSequence for section stages', () => {
  const media = {...image, slides: [video], mediaMode: 'slideshow', slideAutoplay: true, slideSeconds: 4};
  const promo = structuredClone(initial.blocks.find(b => b.type === 'promo'));
  promo.content = {...promo.content, ...media};
  assert.match(renderToStaticMarkup(createElement(PromotionSection, {block: promo, editable: false, selected: false, change: () => {}, link: href => ({href})})), /data-media-sequence/);
  const quote = structuredClone(initial.blocks.find(b => b.type === 'quote'));
  quote.content = {...quote.content, ...media};
  assert.match(renderToStaticMarkup(createElement(QuoteSection, {block: quote, editable: false, selected: false, change: () => {}, link: href => ({href})})), /data-media-sequence/);
  const contact = structuredClone(initial.blocks.find(b => b.type === 'contact'));
  contact.content = {...contact.content, media: image, mediaMode: 'image'};
  assert.match(renderToStaticMarkup(createElement(ContactSection, {block: contact, editable: false, selected: false, change: () => {}, link: href => ({href})})), /data-media-sequence/);
  const trust = structuredClone(initial.blocks.find(b => b.type === 'trust'));
  trust.layout = 'Signals';
  trust.content = {...trust.content, media: image, showMedia: true};
  assert.equal(validBlocks([trust]), true);
  assert.match(renderToStaticMarkup(createElement(TrustSection, {block: trust, editable: false, selected: false, change: () => {}, link: href => ({href})})), /data-media-sequence/);
});
