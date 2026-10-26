import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initial, normalizeEyebrowStyle, validBlocks} from '../src/app/site/blocks.ts';
import {layoutContract, layoutContractCoverage} from '../src/app/site/layout-contract.ts';
register('./support/tsx.mjs', import.meta.url);
const {SectionHeading} = await import('../src/app/site/sections/elements.tsx');
const {AboutSection} = await import('../src/app/site/sections/gallery.tsx');
const {LogosSection} = await import('../src/app/site/sections/logos.tsx');
const {HeroSection} = await import('../src/app/site/sections/hero.tsx');

const link = href => ({href});
const sectionProps = {
  site: initial,
  editable: false,
  selected: false,
  change: () => {},
  link,
  labelFor: label => label,
  pages: [],
  homeId: 'home',
  activeId: 'home',
  parentIndex: -1
};

test('normalizeEyebrowStyle defaults to pill', () => {
  assert.equal(normalizeEyebrowStyle(undefined), 'pill');
  assert.equal(normalizeEyebrowStyle('line'), 'line');
  assert.equal(normalizeEyebrowStyle('weird'), 'pill');
});

test('layout contract covers every catalog layout', () => {
  const rows = layoutContractCoverage();
  assert.ok(rows.length >= 16);
  assert.equal(rows.every(row => row.ok), true);
  assert.equal(layoutContract('reviews', 'Auto').showsButtons, false);
  assert.equal(layoutContract('reviews', 'Review cards').showsButtons, false);
  assert.equal(layoutContract('about', 'Photos only').headingTag, 'none');
  assert.equal(layoutContract('about', 'Story and photos').storyFeatured, 2);
  assert.equal(layoutContract('hero', 'image').headingTag, 'h1');
});

test('optional body renders only when showBody is on', () => {
  const base = initial.blocks.find(b => b.type === 'services').content;
  const off = renderToStaticMarkup(createElement(SectionHeading, {content: {...base, body: 'Extra detail', showBody: false}}));
  assert.doesNotMatch(off, /Extra detail/);
  const on = renderToStaticMarkup(createElement(SectionHeading, {content: {...base, body: 'Extra detail', showBody: true}}));
  assert.match(on, /class="section-body"/);
  assert.match(on, /Extra detail/);
});

test('Hero uses h1; section heading uses h2', () => {
  const hero = structuredClone(initial.blocks.find(b => b.type === 'hero'));
  hero.layout = 'short';
  const heroHtml = renderToStaticMarkup(createElement(HeroSection, {...sectionProps, block: hero}));
  assert.match(heroHtml, /<h1>/);
  assert.doesNotMatch(heroHtml, /<h2>/);
  const heading = renderToStaticMarkup(createElement(SectionHeading, {content: initial.blocks.find(b => b.type === 'contact').content}));
  assert.match(heading, /<h2>/);
});

test('section introduction uses section-lede role', () => {
  const heading = renderToStaticMarkup(createElement(SectionHeading, {content: {...initial.blocks.find(b => b.type === 'services').content, description: 'Intro copy here'}}));
  assert.match(heading, /class="section-lede"/);
  assert.match(heading, /Intro copy here/);
  const hero = structuredClone(initial.blocks.find(b => b.type === 'hero'));
  hero.content.description = 'Hero intro';
  const heroHtml = renderToStaticMarkup(createElement(HeroSection, {...sectionProps, block: hero}));
  assert.match(heroHtml, /class="section-lede"/);
});

test('About Story is a split composition not a full photo wall', () => {
  const block = structuredClone(initial.blocks.find(b => b.type === 'about'));
  block.layout = 'Story and photos';
  const html = renderToStaticMarkup(createElement(AboutSection, {...sectionProps, block}));
  assert.match(html, /about-story/);
  assert.doesNotMatch(html, /photo-gallery/);
  const figures = (html.match(/<figure/g) || []).length;
  assert.ok(figures <= 2, `expected ≤2 featured figures, got ${figures}`);
});

test('About Photos only caps visible cells by columns × rows', () => {
  const block = structuredClone(initial.blocks.find(b => b.type === 'about'));
  block.layout = 'Photos only';
  block.settings = {...block.settings, columns: 2};
  block.content.galleryRows = 1;
  const html = renderToStaticMarkup(createElement(AboutSection, {...sectionProps, block, editable: true}));
  assert.match(html, /photo-gallery/);
  const figures = (html.match(/<figure/g) || []).length;
  assert.equal(figures, 2);
  assert.match(html, /Showing 2 of/);
});

test('Logos scrolling markup has no Pause control', () => {
  const block = structuredClone(initial.blocks.find(b => b.type === 'logos'));
  block.layout = 'Scrolling row';
  block.content.logoMotion = 'loop';
  const html = renderToStaticMarkup(createElement(LogosSection, {...sectionProps, block}));
  assert.doesNotMatch(html, /Pause logos|Play logos|class="logo-pause"|data-logo-pause(?!-hover)/);
  assert.match(html, /data-logo-marquee/);
});

test('body and showBody validate on blocks', () => {
  const block = structuredClone(initial.blocks.find(b => b.type === 'promo'));
  block.content.body = 'More copy';
  block.content.showBody = true;
  assert.equal(validBlocks([block]), true);
  block.content.showBody = 'yes';
  assert.equal(validBlocks([block]), false);
});

test('Reviews Auto migrates to Review cards', async () => {
  const {migrateSite} = await import('../src/app/site/blocks.ts');
  const site = migrateSite({
    ...initial,
    blocks: initial.blocks.map(block => block.type === 'reviews' ? {...block, layout: 'Auto'} : block)
  });
  const reviews = site.blocks.find(block => block.type === 'reviews');
  assert.equal(reviews?.layout, 'Review cards');
});
