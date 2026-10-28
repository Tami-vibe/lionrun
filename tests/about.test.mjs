import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initial, validBlocks} from '../src/app/site/blocks.ts';
import {
  galleryDuration,
  galleryMotion,
  galleryPauseHover,
  galleryRows,
  galleryScale,
  gallerySpeed,
  galleryTrack,
  galleryWidth,
} from '../src/app/editor/about-model.ts';
import {restoreRemoved} from '../src/app/editor/hero-collection.ts';
register('./support/tsx.mjs', import.meta.url);
const {ContentBrowser} = await import('../src/app/editor/content-browser.tsx');
const {AboutStyle} = await import('../src/app/editor/about-style.tsx');
const {AboutSection} = await import('../src/app/site/sections/gallery.tsx');

const about = () => structuredClone(initial.blocks.find(block => block.type === 'about'));
const content = (block, group) => renderToStaticMarkup(createElement(ContentBrowser, {block, group, site: initial, pages: [], update() {}, change() {}, footerDefaults: [], usage: new Map(), onOpen() {}, home: true}));
const style = (block, start) => renderToStaticMarkup(createElement(AboutStyle, {block, start, changeLayout() {}, changeSettings() {}, change() {}}));
const section = block => renderToStaticMarkup(createElement(AboutSection, {block, editable: true, link: href => ({href}), site: initial, selected: false, change() {}, labelFor: label => label, pages: [], homeId: 'home', activeId: 'home', parentIndex: 0}));

test('about content uses shared MediaImporter and selected-item folds', () => {
  const block = about();
  block.content.items = Array.from({length: 6}, (_, index) => ({
    title: `Photo ${index + 1}`,
    description: 'Detail',
    icon: 'none',
    caption: `Caption ${index + 1}`,
    group: index % 2 ? 'Team' : 'Workshop',
    media: {...block.content.media, src: `/media/showcase/photo-${index + 1}.jpg`, kind: 'image', alt: `Alt ${index + 1}`}
  }));
  const html = content(block, 'gallery');
  assert.match(html, /6 items/);
  assert.match(html, /Add images/);
  assert.match(html, /Choose from library/);
  assert.match(html, /or drop a photo or video/);
  assert.equal((html.match(/class="hero-tile"/g) || []).length, 4);
  assert.match(html, /Show 2 more/);
  assert.match(html, /Details/);
  assert.match(html, /Accessibility/);
  assert.match(html, /Categories/);
  assert.match(html, /All photos label/);
  assert.doesNotMatch(html, /Add photo/);
  assert.match(content(block, 'message'), /Introduction, headline, and description|Small label|Headline/);
});

test('about style keeps stored layout ids and sliding width/scale controls', () => {
  const block = about();
  block.layout = 'Sliding gallery';
  block.content.galleryWidth = 'boxed';
  block.content.galleryScale = 1.2;
  block.content.galleryMotion = 'loop';
  block.content.gallerySpeed = 3;
  const html = style(block);
  assert.match(html, /Story &amp; gallery|Story & gallery/);
  assert.match(html, /Gallery grid/);
  assert.match(html, /Sliding gallery/);
  assert.match(html, /value="Story and photos"/);
  assert.match(html, /value="Photos only"/);
  assert.match(html, /value="Sliding gallery"/);
  assert.equal((html.match(/class="layout-choice"/g) || []).length, 3);
  assert.match(html, /Gallery width/);
  assert.match(html, />Boxed</);
  assert.match(html, />Full width</);
  assert.match(html, /Image scale/);
  assert.match(html, /aria-label="Image scale"/);
  assert.match(html, /1\.2×|1\.2x/i);
  assert.match(html, /Movement/);
  assert.match(html, />Still</);
  assert.match(html, />Loop</);
  assert.match(html, /Pause on hover/);
  assert.doesNotMatch(html, /Visible items/);
  assert.match(style(block, 'spacing'), /aria-label="Between items"/);
  assert.match(style(block, 'typography'), /aria-label="Align left"/);
});

test('sliding gallery renders two marquee rows with scale and width', () => {
  const sliding = about();
  sliding.layout = 'Sliding gallery';
  sliding.content.galleryWidth = 'full';
  sliding.content.galleryScale = 1.5;
  sliding.content.galleryMotion = 'loop';
  sliding.content.gallerySpeed = 2;
  sliding.content.galleryPauseHover = true;
  sliding.content.items = Array.from({length: 6}, (_, index) => ({
    title: `Item ${index + 1}`,
    description: '',
    icon: 'none',
    caption: `Cap ${index + 1}`,
    group: index % 2 ? 'Team' : 'Workshop',
    media: {...sliding.content.media, src: `/media/${index}.jpg`, kind: 'image', alt: `Alt ${index + 1}`}
  }));
  const loop = section(sliding);
  assert.match(loop, /data-gallery-layout="Sliding gallery"/);
  assert.match(loop, /data-gallery-motion="loop"/);
  assert.match(loop, /data-gallery-width="full"/);
  assert.match(loop, /--gal-scale:1\.5/);
  assert.match(loop, /--gallery-duration:40s/);
  assert.match(loop, /gallery-row is-loop/);
  assert.match(loop, /gallery-row is-loop is-reverse/);
  assert.match(loop, /class="gal-frame"/);
  assert.doesNotMatch(loop, /gallery-playback|Looping continuously|data-gallery-pause(?!-hover)/);
  assert.match(loop, /data-gallery-pause-hover="true"/);
  assert.equal((loop.match(/aria-label="Gallery row 1"/g) || []).length, 1);
  assert.equal((loop.match(/aria-label="Gallery row 2"/g) || []).length, 1);

  const still = structuredClone(sliding);
  still.content.galleryMotion = 'still';
  still.content.galleryWidth = 'boxed';
  const stillHtml = section(still);
  assert.match(stillHtml, /data-gallery-motion="still"/);
  assert.match(stillHtml, /data-gallery-width="boxed"/);
  assert.match(stillHtml, /gallery-row/);
  assert.doesNotMatch(stillHtml, /is-loop|gallery-playback|Looping continuously/);

  const story = about();
  story.layout = 'Story and photos';
  const storyHtml = section(story);
  assert.match(storyHtml, /about-story/);
  assert.doesNotMatch(storyHtml, /photo-gallery|gallery-row|about-gallery-container/);

  const grid = about();
  grid.layout = 'Photos only';
  assert.match(section(grid), /photo-gallery/);
  assert.doesNotMatch(section(grid), /Meet the people|gallery-row|about-story/);
});

test('gallery helpers clamp values, split rows, and restore removed items', () => {
  assert.equal(galleryWidth('full'), 'full');
  assert.equal(galleryWidth('boxed'), 'boxed');
  assert.equal(galleryWidth('wide'), 'boxed');
  assert.equal(galleryScale(1.25), 1.3);
  assert.equal(galleryScale(0.5), 1);
  assert.equal(galleryScale(3), 2);
  assert.equal(galleryMotion('still'), 'still');
  assert.equal(galleryMotion('loop'), 'loop');
  assert.equal(gallerySpeed(0), 1);
  assert.equal(gallerySpeed(9), 5);
  assert.equal(galleryDuration(1), 48);
  assert.equal(galleryDuration(5), 16);
  assert.equal(galleryPauseHover(undefined), true);
  assert.equal(galleryPauseHover(false), false);
  assert.deepEqual(galleryRows([1, 2, 3, 4]), [[1, 2], [3, 4]]);
  assert.deepEqual(galleryRows([1, 2, 3]), [[1, 2], [3]]);
  assert.deepEqual(galleryRows([1]), [[1], [1]]);
  assert.deepEqual(galleryTrack([1, 2], 5), [1, 2, 1, 2, 1, 2]);
  assert.deepEqual(galleryTrack([1, 2, 3, 4, 5], 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(restoreRemoved(['b', 'c'], 'a', 0), ['a', 'b', 'c']);
  const block = about();
  assert.ok(block.content.items.length >= 8);
  assert.match(block.content.items[0].media.src, /\/media\/gallery\//);
  block.layout = 'Sliding gallery';
  block.content.galleryWidth = 'full';
  block.content.galleryScale = 1.4;
  block.content.galleryMotion = 'still';
  block.content.gallerySpeed = 4;
  block.content.galleryPauseHover = false;
  assert.equal(validBlocks([block]), true);
});
