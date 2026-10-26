import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initial} from '../src/app/site/blocks.ts';

register('./support/tsx.mjs', import.meta.url);
const {SettingsDialog} = await import('../src/app/editor/account.tsx');
const studioCss = readFileSync(new URL('../src/app/studio.css', import.meta.url), 'utf8');

const profile = {ownerName: 'Alex'};
const business = {brand: 'NORTHLINE', email: 'hi@example.com', address: '1 Main', phone: '555', hours: 'Mon–Fri'};

const render = (pane = 'business', extra = {}) => renderToStaticMarkup(createElement(SettingsDialog, {
  profile,
  business,
  pageCount: 3,
  initialPane: pane,
  onClose() {},
  onSaveProfile() {},
  onSaveBusiness() {},
  site: initial,
  onSaveBrand() {},
  ...extra,
}));

test('settings shell groups Website, Personal, and Account with Not connected hints', () => {
  const html = render('business');
  assert.match(html, />Website</);
  assert.match(html, />Personal</);
  assert.match(html, />Account</);
  assert.match(html, /Business details/);
  assert.match(html, /Website brand/);
  assert.match(html, />Profile</);
  assert.match(html, /Plan &amp; billing|Plan & billing/);
  assert.match(html, /AI usage/);
  assert.equal((html.match(/Not connected/g) || []).length, 2);
});

test('business details names which pages will change before save', () => {
  const html = render('business');
  assert.match(html, /all 3 pages/i);
  assert.match(html, /Contact section/i);
  assert.match(html, /Unsaved changes|settings-footer|Save changes/);
  assert.match(html, /settings-footer/);
});

test('read-only AI usage has no save footer or unsaved indicator', () => {
  const html = render('usage');
  assert.match(html, /AI usage isn’t connected|AI usage isn't connected/);
  assert.doesNotMatch(html, /settings-footer/);
  assert.doesNotMatch(html, /Unsaved changes/);
  assert.doesNotMatch(html, />Save changes</);
  assert.doesNotMatch(html, />Cancel</);
});

test('website brand shows live preview mock without applying until save handler', () => {
  let saved = null;
  const html = renderToStaticMarkup(createElement(SettingsDialog, {
    profile,
    business,
    pageCount: 1,
    initialPane: 'brand',
    onClose() {},
    onSaveProfile() {},
    onSaveBusiness() {},
    site: initial,
    onSaveBrand(patch) { saved = patch; },
  }));
  assert.match(html, /Live preview/);
  assert.match(html, /brand-phone/);
  assert.match(html, /Font pair|Syne|Manrope/);
  assert.equal(saved, null);
});

test('profile pane keeps personal copy separate from business contact rewrite warning', () => {
  const html = render('profile');
  assert.match(html, /does not change public website contact/i);
  assert.doesNotMatch(html, /Contact section on all/);
});

test('settings dialog reuses stacked field contract outside #premium-studio', () => {
  assert.match(studioCss, /\.settings-dialog \.field\s*\{[^}]*display:\s*block/);
  assert.match(studioCss, /\.settings-dialog \.field\s*\{[^}]*min-width:\s*0/);
  assert.match(studioCss, /\.settings-dialog \.field>span\s*\{[^}]*display:\s*block/);
  assert.match(studioCss, /\.settings-dialog \.field input:not\(\[type=color\]\):not\(\[type=range\]\),\s*\.settings-dialog \.field textarea,\s*\.settings-dialog \.field select\s*\{[^}]*width:\s*100%/);
  assert.match(studioCss, /\.settings-dialog \.field input:not\(\[type=color\]\):not\(\[type=range\]\),\s*\.settings-dialog \.field textarea,\s*\.settings-dialog \.field select\s*\{[^}]*min-width:\s*0/);
});
