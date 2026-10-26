import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const studio = readFileSync(new URL('../src/app/studio.css', import.meta.url), 'utf8');
const site = readFileSync(new URL('../src/app/site/site.css', import.meta.url), 'utf8');

test('editor heading styles are scoped to the panel, not the website preview', () => {
  assert.match(studio, /#premium-studio \.panel h2/);
  assert.doesNotMatch(studio, /#premium-studio h2\s*\{/);
  assert.match(studio, /#premium-studio \.panel \.eyebrow/);
  assert.doesNotMatch(studio, /#premium-studio \.eyebrow\s*\{\s*display:\s*none/);
});

test('website type roles use fluid tokens and section-lede', () => {
  assert.match(site, /--type-hero:/);
  assert.match(site, /--type-section:/);
  assert.match(site, /\.section-lede/);
  assert.match(site, /letter-spacing:\s*-\.03em/);
  assert.doesNotMatch(site, /letter-spacing:\s*-\.055em/);
});
