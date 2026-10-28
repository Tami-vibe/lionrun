import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initial, servicePreviewCount, syncServicePages, validBlocks} from '../src/app/site/blocks.ts';
import {ensureServiceIds, serviceId, serviceMediaKind, servicePreviewCap} from '../src/app/site/service-model.ts';
import {restoreRemoved} from '../src/app/site/hero-collection.ts';
register('./support/tsx.mjs', import.meta.url);
const {ContentBrowser} = await import('../src/app/editor/content-browser.tsx');
const {UniversalSectionInspector: ServicesStyle} = await import('../src/app/editor/section-editor.tsx');
const {ServicesSection} = await import('../src/app/site/sections/services.tsx');

const services = () => structuredClone(initial.blocks.find(block => block.type === 'services'));
const pages = [{id: 'home', name: 'Home', slug: 'home'}, {id: 'detail', name: 'Detail', slug: 'detail'}];
const content = (block, group, home = true) => renderToStaticMarkup(createElement(ContentBrowser, {
  block, group, site: initial, pages, update() {}, change() {}, footerDefaults: [], usage: new Map(), onOpen() {}, home
}));
const style = (block, start, home = true) => renderToStaticMarkup(createElement(ServicesStyle, {
  block, start, home, changeLayout() {}, changeSettings() {}, change() {}
}));
const section = (block, focusItem = null, activeId = 'home') => renderToStaticMarkup(createElement(ServicesSection, {
  block, editable: true, link: (href, id) => ({href, 'data-link-page': id || undefined}), site: initial, selected: false,
  change() {}, labelFor: label => label, pages, homeId: 'home', activeId, parentIndex: 0, focusItem
}));

test('services content uses compact rows, Details/Media tabs, and a home preview note', () => {
  const block = services();
  block.content.items = Array.from({length: 7}, (_, index) => ({
    id: `svc-${index + 1}`,
    title: `Service ${index + 1}`,
    description: 'Detail',
    icon: index % 2 ? 'gear' : 'check',
    media: index === 1 ? {...block.content.media, src: '/media/showcase/photo.jpg', kind: 'image', alt: 'Studio'} : undefined
  }));
  const html = content(block, 'services');
  assert.match(html, /7 items/);
  assert.match(html, /Home shows the first 6 cards/);
  assert.equal((html.match(/class="service-row"/g) || []).length, 4);
  assert.match(html, /Show 3 more/);
  assert.match(html, /Add service/);
  assert.match(html, /role="tab"/);
  assert.match(html, />Details</);
  assert.match(html, />Media</);
  assert.doesNotMatch(html, /Opens which page\?/);
  assert.match(html, /Name the service to make its page|Opens:|Edit this page|Saving creates this page/);
  assert.match(html, /service-row-thumb/);
  assert.match(html, /Actions for Service 1/);
  assert.match(html, /role="tab"[^>]*>Media</);
  assert.match(html, /Every titled card also appears on All services/);
  const catalog = content(block, 'services', false);
  assert.match(catalog, /This list syncs from Home/);
  assert.doesNotMatch(catalog, /Add service/);
  assert.match(content(block, 'intro'), /Small label|Headline|Introduction/);
});

test('titled service with pageId shows Edit this page and hides section destination', () => {
  const block = services();
  block.content.items = [{
    id: 'svc-rental',
    title: 'Servicio 13',
    description: 'For rental cars',
    icon: 'car',
    pageId: 'detail'
  }];
  const html = content(block, 'services');
  assert.match(html, /Opens:\s*Detail|Opens: Detail/);
  assert.match(html, /Edit this page/);
  assert.doesNotMatch(html, /Opens which page\?/);
  assert.doesNotMatch(html, /Section on this page/);
  assert.match(html, /Other link/);
});

test('services style keeps stored layout ids with shared layout cards', () => {
  const block = services();
  const html = style(block);
  assert.match(html, /Icon cards/);
  assert.match(html, /Media cards/);
  assert.match(html, /Simple list/);
  assert.match(html, /value="Icon cards"/);
  assert.match(html, /value="Photo cards"/);
  assert.match(html, /value="Price list"/);
  assert.equal((html.match(/class="layout-choice"/g) || []).length, 3);
  assert.match(html, /Desktop columns/);
  assert.match(style(block, 'spacing'), /aria-label="Between cards"/);
  assert.match(style(block, 'typography'), /aria-label="Align left"/);
  assert.match(style({...block, layout: 'Photo cards'}, 'cards'), /Gradient|Arrow/);
  assert.match(style({...block, layout: 'Price list'}, 'cards'), /Simple list uses text hierarchy/);
  assert.match(style(block, 'layout', false), /Layout on this page is independent of Home/);
});

test('catalog sync keeps All services layout and includes newly titled services', () => {
  const homeSite = structuredClone(initial);
  const servicesBlock = homeSite.blocks.find(block => block.type === 'services');
  servicesBlock.layout = 'Photo cards';
  servicesBlock.content.items = Array.from({length: 7}, (_, index) => ({
    id: `svc-${index + 1}`,
    title: index === 6 ? 'Rental Car' : `Service ${index + 1}`,
    description: 'Detail',
    icon: 'check',
    media: index === 6 ? {...servicesBlock.content.media, src: '/media/rental.jpg', kind: 'image', alt: 'Rental'} : undefined
  }));
  const first = syncServicePages([{id: 'home', name: 'Home', slug: 'home', site: homeSite}], 'home');
  assert.ok(first);
  const catalogId = first.find(page => page.id === 'home').site.blocks.find(block => block.type === 'services').content.catalogPageId;
  assert.ok(catalogId);
  const catalog = first.find(page => page.id === catalogId);
  assert.ok(catalog);
  const grid = catalog.site.blocks.find(block => block.type === 'services');
  assert.equal(grid.layout, 'Icon cards');
  assert.ok(grid.content.items.some(item => item.title === 'Rental Car'));
  grid.layout = 'Price list';
  grid.settings = {...grid.settings, columns: 2};
  const homeAgain = first.find(page => page.id === 'home');
  homeAgain.site.blocks.find(block => block.type === 'services').content.items.push({
    id: 'svc-new',
    title: 'Mobile detail',
    description: 'At your door',
    icon: 'car'
  });
  const second = syncServicePages(first, 'home');
  assert.ok(second);
  const gridAgain = second.find(page => page.id === catalogId).site.blocks.find(block => block.type === 'services');
  assert.equal(gridAgain.layout, 'Price list');
  assert.ok(gridAgain.content.items.some(item => item.title === 'Mobile detail'));
  assert.ok(gridAgain.content.items.some(item => item.title === 'Rental Car'));
});

test('canvas highlights the focused service id and preserves home preview caps', () => {
  const block = services();
  block.content.items = Array.from({length: 8}, (_, index) => ({
    id: `focus-${index + 1}`,
    title: `Item ${index + 1}`,
    description: 'Copy',
    icon: 'check',
    pageId: index === 0 ? 'detail' : undefined,
    hidden: index === 7 || undefined
  }));
  const focused = section(block, 'focus-1');
  assert.match(focused, /data-service-id="focus-1"/);
  assert.match(focused, /is-service-focus/);
  assert.equal((focused.match(/data-service-id="/g) || []).length, servicePreviewCount(block.settings.columns));
  assert.match(focused, /See all services|Learn more/);
  assert.doesNotMatch(focused, /data-service-id="focus-8"/);
  const listed = section({...block, layout: 'Price list'}, 'focus-2');
  assert.equal((listed.match(/data-service-id="/g) || []).length, 7);
  assert.match(listed, /is-service-focus/);
  const photo = section({
    ...block,
    layout: 'Photo cards',
    content: {
      ...block.content,
      items: [{
        id: 'photo-1',
        title: 'Studio session',
        description: 'Booked time',
        icon: 'wrench',
        media: {...block.content.media, src: '/media/studio.jpg', kind: 'image', alt: 'Studio'}
      }]
    }
  }, 'photo-1');
  assert.match(photo, /data-service-id="photo-1"/);
  assert.match(photo, /is-service-focus/);
  assert.match(photo, /media-view|src="\/media\/studio.jpg"|Studio session/);
});

test('service ids stay stable for selection sync and undo restores position', () => {
  const assigned = ensureServiceIds([{title: 'A', description: '', icon: 'check'}, {id: 'keep', title: 'B', description: '', icon: 'gear'}]);
  assert.ok(assigned[0].id);
  assert.equal(assigned[1].id, 'keep');
  assert.equal(serviceId(assigned[1], 1), 'keep');
  assert.equal(serviceMediaKind(assigned[0]), 'icon');
  assert.equal(serviceMediaKind({...assigned[0], media: {src: '/x.jpg'}}), 'media');
  assert.equal(servicePreviewCap(6, false, 4), 4);
  assert.equal(servicePreviewCap(6, true, 4), 6);
  const restored = restoreRemoved([{title: 'A'}, {title: 'C'}], {title: 'B'}, 1);
  assert.deepEqual(restored.map(item => item.title), ['A', 'B', 'C']);
});

test('saved service ids and media remain valid', () => {
  const block = services();
  block.content.items = [{
    id: 'svc-persist',
    title: 'Consultation',
    description: 'Talk first',
    icon: 'message',
    price: 'From $90',
    href: '#contact',
    media: {...block.content.media, src: '/media/consult.jpg', kind: 'image', alt: 'Consult'}
  }];
  assert.equal(validBlocks([block]), true);
  block.content.items[0].hidden = true;
  assert.equal(validBlocks([block]), true);
  block.content.items[0].id = 'x'.repeat(101);
  assert.equal(validBlocks([block]), false);
});
