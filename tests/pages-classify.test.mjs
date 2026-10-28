import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyPages} from '../src/app/site/settings.ts';

const homeSite = (items = [], catalogPageId, navPageIds = []) => ({
  blocks: [{type: 'services', content: {items, catalogPageId}}],
  navPageIds,
});

test('classifyPages puts home and catalog in main, linked services in service, rest in other', () => {
  const pages = [
    {id: 'home', name: 'Home', slug: 'home'},
    {id: 'all', name: 'All services', slug: 'services'},
    {id: 'paint', name: 'Paint', slug: 'paint'},
    {id: 'story', name: 'Our story', slug: 'our-story'},
    {id: 'orphan', name: 'Old draft', slug: 'old-draft'},
  ];
  const groups = classifyPages(pages, 'home', homeSite(
    [{title: 'Paint', pageId: 'paint'}],
    'all',
    ['home', null],
  ));
  assert.deepEqual(groups.main.map(p => p.id), ['home', 'all']);
  assert.deepEqual(groups.service.map(p => p.id), ['paint']);
  assert.deepEqual(groups.other.map(p => p.id).sort(), ['orphan', 'story']);
});

test('classifyPages keeps top-nav pages in main without renaming or dropping others', () => {
  const pages = [
    {id: 'home', name: 'Home', slug: 'home'},
    {id: 'contact', name: 'Contact', slug: 'contact'},
    {id: 'legal', name: 'Legal', slug: 'legal'},
  ];
  const groups = classifyPages(pages, 'home', homeSite([], undefined, ['contact']));
  assert.deepEqual(groups.main.map(p => p.id), ['home', 'contact']);
  assert.deepEqual(groups.service, []);
  assert.deepEqual(groups.other.map(p => p.id), ['legal']);
});

test('classifyPages never moves a page out of other when services sync adds no link', () => {
  const pages = [
    {id: 'home', name: 'Home', slug: 'home'},
    {id: 'manual-service', name: 'Towing', slug: 'towing'},
  ];
  const before = classifyPages(pages, 'home', homeSite([]));
  const after = classifyPages(pages, 'home', homeSite([{title: 'Other', pageId: 'missing'}]));
  assert.deepEqual(before.other.map(p => p.id), ['manual-service']);
  assert.deepEqual(after.other.map(p => p.id), ['manual-service']);
  assert.equal(before.other[0].name, 'Towing');
  assert.equal(after.other[0].name, 'Towing');
});
