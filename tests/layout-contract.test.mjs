import test from 'node:test';
import assert from 'node:assert/strict';
import {blockLayouts} from '../src/app/site/blocks.ts';
import {layoutContract, layoutContractCoverage} from '../src/app/site/layout-contract.ts';

test('every blockLayouts entry has an explicit layout contract', () => {
  const rows = layoutContractCoverage();
  assert.ok(rows.length > 0);
  for (const row of rows) {
    assert.equal(row.ok, true, `${row.type} / ${row.layout} missing contract`);
  }
  const expected = Object.values(blockLayouts).reduce((n, layouts) => n + layouts.length, 0);
  assert.equal(rows.length, expected);
});

test('Hero titles are h1; other titled sections are h2; chrome has none', () => {
  assert.equal(layoutContract('hero', 'split').headingTag, 'h1');
  assert.equal(layoutContract('services', 'Icon cards').headingTag, 'h2');
  assert.equal(layoutContract('logos', 'Still row').headingTag, 'h2');
  assert.equal(layoutContract('header', 'standard').headingTag, 'none');
  assert.equal(layoutContract('footer', 'columns').headingTag, 'none');
});

test('About Photos only hides message and exposes a bounded grid', () => {
  const photos = layoutContract('about', 'Photos only');
  assert.equal(photos.showsTitle, false);
  assert.equal(photos.showsSubtext, false);
  assert.equal(photos.allowsBody, false);
  assert.ok(photos.grid);
  assert.equal(photos.grid.defaultCols * photos.grid.defaultRows, 4);
  const story = layoutContract('about', 'Story and photos');
  assert.equal(story.showsTitle, true);
  assert.equal(story.storyFeatured, 2);
});

test('Buttons only where canvas CTAs are contracted', () => {
  assert.equal(layoutContract('proof', 'Text and photo').showsButtons, true);
  assert.equal(layoutContract('solutions', 'Numbered steps').showsButtons, false);
  assert.equal(layoutContract('trust', 'Signals').showsButtons, false);
  assert.equal(layoutContract('reviews', 'Review cards').showsButtons, false);
  assert.equal(layoutContract('logos', 'Scrolling row').showsButtons, false);
  assert.equal(layoutContract('contact', 'Details and map').showsButtons, true);
});

test('unknown layout falls back without throwing', () => {
  const fallback = layoutContract('faq', 'Not a real layout');
  assert.equal(fallback.headingTag, 'h2');
  assert.equal(fallback.showsTitle, true);
});
