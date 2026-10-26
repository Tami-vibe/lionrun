import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
register('./support/tsx.mjs', import.meta.url);

const {ManageLibraryProvider, MediaLibraryFixture, MediaPicker} = await import('../src/app/media/library.tsx');
const {MediaLibraryBoard} = await import('../src/app/media/library-board.tsx');

const sample = {
  id: 'asset-tyres',
  name: 'tyres-upload-test.jpg',
  kind: 'image',
  mime: 'image/jpeg',
  size: 1200,
  created: '2026-01-01T00:00:00.000Z',
  blob: new Blob()
};

test('library picker rows show image and video thumbnails', () => {
  const image = renderToStaticMarkup(createElement(MediaLibraryFixture, {
    assets: [sample],
    urls: {'asset-tyres': 'blob:image-preview'},
  }, createElement(MediaPicker, {label: 'Choose from library', onSelect() {}, onClose() {}})));
  assert.match(image, /class="asset-thumb"/);
  assert.match(image, /<img[^>]+src="blob:image-preview"/);
  assert.match(image, /tyres-upload-test\.jpg/);
  assert.match(image, /class="upload-media"/);

  const video = renderToStaticMarkup(createElement(MediaLibraryFixture, {
    assets: [{...sample, id: 'asset-clip', name: 'bay.mp4', kind: 'video', mime: 'video/mp4'}],
    urls: {'asset-clip': 'blob:video-preview'},
  }, createElement(MediaPicker, {label: 'Choose from library', onSelect() {}, onClose() {}})));
  assert.match(video, /class="asset-thumb is-video"/);
  assert.match(video, /<video[^>]+src="blob:video-preview"/);
  assert.match(video, /bay\.mp4/);
});

test('library picker lists multiple assets as separate tiles', () => {
  const second = {...sample, id: 'asset-car', name: 'night-car.jpeg'};
  const html = renderToStaticMarkup(createElement(MediaLibraryFixture, {
    assets: [sample, second],
    urls: {'asset-tyres': 'blob:a', 'asset-car': 'blob:b'},
  }, createElement(MediaPicker, {label: 'Choose from library', onSelect() {}, onClose() {}})));
  assert.equal((html.match(/class="asset-thumb"/g) || []).length, 2);
  assert.match(html, /tyres-upload-test\.jpg/);
  assert.match(html, /night-car\.jpeg/);
  assert.match(html, /role="listbox"/);
});

test('picker offers Manage library when provider is set', () => {
  const html = renderToStaticMarkup(createElement(ManageLibraryProvider, {
    onOpen() {},
  }, createElement(MediaLibraryFixture, {
    assets: [sample],
    urls: {'asset-tyres': 'blob:a'},
  }, createElement(MediaPicker, {label: 'Choose from library', onSelect() {}, onClose() {}}))));
  assert.match(html, /Manage library/);
});

test('manage board shows quota filters and usage labels', () => {
  const usage = new Map([['asset-tyres', [{
    pageId: 'home', pageName: 'Home', blockId: 'hero', sectionType: 'hero', sectionLabel: 'Hero', field: 'image'
  }]]]);
  const html = renderToStaticMarkup(createElement(MediaLibraryFixture, {
    assets: [sample, {...sample, id: 'asset-spare', name: 'spare.jpg'}],
    urls: {'asset-tyres': 'blob:a', 'asset-spare': 'blob:b'},
  }, createElement(MediaLibraryBoard, {usage})));
  assert.match(html, /Media library/);
  assert.match(html, /All/);
  assert.match(html, /Used/);
  assert.match(html, /Unused/);
  assert.match(html, /Home → Hero \(image\)/);
  assert.match(html, /Not used on any page/);
  assert.match(html, /MB of 250 MB used/);
});
