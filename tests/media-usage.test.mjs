import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaDefaults} from '../src/app/media/model.ts';
import {collectMediaUsage, mediaAssetId, usageLabels, isAssetUnused} from '../src/app/media/usage.ts';
import {initial} from '../src/app/site/blocks.ts';

const media = (id, extra = {}) => ({...mediaDefaults, src: `media:${id}`, ...extra});

test('mediaAssetId only accepts library media ids', () => {
  assert.equal(mediaAssetId('media:abc-123'), 'abc-123');
  assert.equal(mediaAssetId('/media/showcase/photo.jpg'), '');
  assert.equal(mediaAssetId('https://example.com/a.jpg'), '');
  assert.equal(mediaAssetId(''), '');
});

test('collectMediaUsage maps page and section for src poster captions and slides', () => {
  const site = structuredClone(initial);
  const hero = site.blocks.find(block => block.type === 'hero');
  hero.content.media = media('hero-main');
  hero.content.slides = [media('hero-slide'), {...mediaDefaults, src: '/media/ai-images/hero-2.jpg'}];
  hero.content.story = media('hero-story', {poster: 'media:hero-poster', captions: 'media:hero-captions'});
  const services = site.blocks.find(block => block.type === 'services');
  services.content.items = [{title: 'Paint', description: '', icon: 'paint', media: media('svc-paint')}];

  const index = collectMediaUsage([{id: 'home', name: 'Home', site}]);
  assert.deepEqual(usageLabels(index, 'hero-main'), ['Home → Hero (image)']);
  assert.deepEqual(usageLabels(index, 'hero-slide'), ['Home → Hero (slide)']);
  assert.deepEqual(usageLabels(index, 'hero-story'), ['Home → Hero (story)']);
  assert.deepEqual(usageLabels(index, 'hero-poster'), ['Home → Hero (poster)']);
  assert.deepEqual(usageLabels(index, 'hero-captions'), ['Home → Hero (captions)']);
  assert.deepEqual(usageLabels(index, 'svc-paint'), ['Home → Services (item)']);
  assert.equal(usageLabels(index, 'missing').length, 0);
  assert.equal(isAssetUnused(index, 'missing'), true);
  assert.equal(isAssetUnused(index, 'hero-main'), false);
});

test('public media paths never enter the usage index', () => {
  const site = structuredClone(initial);
  const proof = site.blocks.find(block => block.type === 'proof');
  proof.content.media = {...mediaDefaults, src: '/media/showcase/workshop-bay.jpg'};
  const index = collectMediaUsage([{id: 'home', name: 'Home', site}]);
  assert.equal([...index.keys()].length, 0);
});

test('same asset on two pages lists both uses', () => {
  const home = structuredClone(initial);
  const detail = structuredClone(initial);
  home.blocks.find(block => block.type === 'promo').content.media = media('shared-bg');
  detail.blocks.find(block => block.type === 'contact').content.media = media('shared-bg');
  const index = collectMediaUsage([
    {id: 'home', name: 'Home', site: home},
    {id: 'detail', name: 'Detail', site: detail}
  ]);
  const labels = usageLabels(index, 'shared-bg');
  assert.equal(labels.length, 2);
  assert.ok(labels.some(label => label.startsWith('Home →')));
  assert.ok(labels.some(label => label.startsWith('Detail →')));
});
