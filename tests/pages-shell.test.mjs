import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initial} from '../src/app/site/blocks.ts';

register('./support/tsx.mjs', import.meta.url);
const {EditorShell} = await import('../src/app/editor/shell.tsx');
const {PageSettings} = await import('../src/app/editor/navigation.tsx');
const {HeroSection} = await import('../src/app/site/sections/hero.tsx');

const pages = [
  {id: 'home', name: 'Home', slug: 'home'},
  {id: 'all', name: 'All services', slug: 'services'},
  {id: 'paint', name: 'Paint & refinishing', slug: 'paint'},
  {id: 'story', name: 'Our story', slug: 'our-story'},
];

const homeSite = {
  ...initial,
  blocks: initial.blocks.map(block => block.type === 'services' ? {
    ...block,
    content: {
      ...block.content,
      catalogPageId: 'all',
      items: [{title: 'Paint', description: '', icon: 'check', pageId: 'paint'}],
    },
  } : block),
  navPageIds: [null, null, null],
};

const shell = (extra = {}) => renderToStaticMarkup(createElement(EditorShell, {
  location: 'pages',
  setLocation() {},
  view: 'Content',
  setView() {},
  open: true,
  preview: false,
  pageName: 'Home',
  sectionName: 'Hero',
  shared: false,
  saveLabel: 'Saved in this browser',
  saveError: false,
  onReset() {},
  pages,
  pageId: 'paint',
  homeId: 'home',
  homeSite,
  onSelectPage() {},
  onPageMenu() {},
  sections: [],
  sectionId: '',
  onSelectSection() {},
  onToggleHidden() {},
  homeStages: true,
  query: '',
  setQuery() {},
  canAddSection: true,
  onAddSection() {},
  onPageSettings() {},
  onBusiness() {},
  onLibrary() {},
  sectionMenu: null,
  toolbar: null,
  canvas: null,
  ...extra,
}, null));

test('pages list uses navrow groups without Not in a menu on every row', () => {
  const html = shell();
  assert.match(html, /Main pages/);
  assert.match(html, /Service pages/);
  assert.match(html, /Other pages/);
  assert.match(html, /Find a page/);
  assert.match(html, /Paint &amp; refinishing|Paint & refinishing/);
  assert.match(html, /class="navrow"/);
  assert.doesNotMatch(html, /Not in a menu/);
  assert.match(html, /Actions for Paint/);
  assert.match(html, /Page settings/);
});

test('page settings splits Page, Navigation, and SEO without Website brand shortcut', () => {
  const site = {
    ...homeSite,
    seoTitle: 'Paint | NORTHLINE',
    seoDescription: 'Body work',
    blocks: homeSite.blocks.map(block => block.type === 'hero' ? {...block, id: 'svc-hero', layout: 'short'} : block),
  };
  const html = renderToStaticMarkup(createElement(PageSettings, {
    site,
    pages: pages.map(page => ({...page, site})),
    activeId: 'paint',
    homeId: 'home',
    renamePage() {},
    setSlug() {},
    placeCurrent() {},
    editSEO() {},
    setBreadcrumbs() {},
    home: false,
  }));
  assert.match(html, />Page</);
  assert.match(html, />Navigation</);
  assert.match(html, />SEO</);
  assert.match(html, /Page name/);
  assert.match(html, /Page address/);
  assert.doesNotMatch(html, />Website brand</);
});

test('service page breadcrumbs link ancestors and keep current page as text', () => {
  const home = {id: 'home', name: 'Home', slug: 'home', site: homeSite};
  const catalog = {id: 'all', name: 'All services', slug: 'services', site: homeSite};
  const paint = {
    id: 'paint',
    name: 'Paint & refinishing',
    slug: 'paint',
    site: {
      ...homeSite,
      blocks: homeSite.blocks.map(block => block.type === 'hero' ? {
        ...block,
        id: 'paint-hero',
        layout: 'short',
        content: {...block.content, title: 'Paint & refinishing', showBreadcrumbs: true},
      } : block),
    },
  };
  const hero = paint.site.blocks.find(block => block.type === 'hero');
  const html = renderToStaticMarkup(createElement(HeroSection, {
    block: hero,
    site: paint.site,
    editable: false,
    selected: false,
    change() {},
    link: (href, id) => ({href, 'data-link-page': id || undefined}),
    labelFor: label => label,
    pages: [home, catalog, paint],
    homeId: 'home',
    activeId: 'paint',
    parentIndex: -1,
  }));
  assert.match(html, /aria-label="Breadcrumb"/);
  assert.match(html, /data-link-page="home"/);
  assert.match(html, /data-link-page="all"/);
  assert.match(html, /aria-current="page"[^>]*>Paint/);
  assert.doesNotMatch(html, /href="#services"/);
});
