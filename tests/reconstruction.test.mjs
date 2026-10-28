import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initial, validBlocks} from '../src/app/site/blocks.ts';
import {catalog} from '../src/app/site/catalog.ts';
import {
  appearanceValue, blockLayouts, layoutContract, sectionLayouts, visibleAppearanceFields,
} from '../src/app/site/layout-contract.ts';
import {storedPages} from '../src/app/editor/workspace.ts';

register('./support/tsx.mjs', import.meta.url);
const {AppearanceFields} = await import('../src/app/editor/components/fields.tsx');
const {SectionEditor, UniversalSectionInspector} = await import('../src/app/editor/section-editor.tsx');

const blockFor = type => structuredClone(initial.blocks.find(block => block.type === type));
const fieldFor = (block, key) => visibleAppearanceFields(block).find(field => field.key === key);

function controlFor(block, field, change) {
  const [row] = AppearanceFields({fields: [field], content: block.content, change});
  return row.props.children.find(child => child && child.type !== 'p');
}

test('canonical layout descriptors cover all 16 types with unique persisted identities', () => {
  assert.equal(catalog.length, 16);
  for (const {id} of catalog) {
    assert.ok(sectionLayouts[id].length > 0);
    assert.deepEqual(blockLayouts[id], sectionLayouts[id].map(layout => layout.id));
    assert.equal(new Set(blockLayouts[id]).size, blockLayouts[id].length);
    for (const layout of sectionLayouts[id]) {
      assert.ok(layout.label.trim());
      const contract = layoutContract(id, layout.id);
      assert.equal(contract.headingTag, id === 'hero' ? 'h1'
        : id === 'header' || id === 'footer' || layout.id === 'Photos only' ? 'none' : 'h2');
    }
  }
});

test('every schema choice callback writes its original scalar type and remains loadable', () => {
  let exercised = 0;
  for (const type of ['about', 'proof', 'logos', 'hero', 'services']) {
    for (const layout of blockLayouts[type]) {
      const block = {...blockFor(type), layout};
      for (const field of visibleAppearanceFields(block).filter(field => field.kind === 'choice')) {
        for (const [value] of field.options) {
          let patch;
          const control = controlFor(block, field, next => { patch = next; });
          control.props.onChange(String(value));
          assert.deepEqual(patch, {[field.key]: value});
          const changed = {...block, content: {...block.content, ...patch}};
          assert.equal(validBlocks([changed]), true, `${type}/${layout}/${field.key}`);
          const site = {...initial, blocks: initial.blocks.map(item => item.id === block.id ? changed : item)};
          const loaded = storedPages([{id: 'home', name: 'Home', slug: 'home', site}]);
          assert.equal(loaded[0].site.blocks.find(item => item.id === block.id).content[field.key], value);
          exercised++;
        }
      }
    }
  }
  assert.ok(exercised >= 20, `Only exercised ${exercised} choices`);
});

test('schema slider callbacks bound and round values before persisting', () => {
  const block = {...blockFor('about'), layout: 'Sliding gallery'};
  for (const [key, cases] of [
    ['galleryScale', [[0, 1], [100, 2], [1.27, 1.3], [NaN, 1], [Infinity, 1]]],
    ['gallerySpeed', [[0, 1], [100, 5], [2.6, 3], [NaN, 3]]],
  ]) {
    const field = fieldFor(block, key);
    for (const [input, expected] of cases) {
      let patch;
      controlFor(block, field, next => { patch = next; }).props.onChange(input);
      assert.deepEqual(patch, {[key]: expected});
      assert.equal(validBlocks([{...block, content: {...block.content, ...patch}}]), true);
    }
  }
});

test('schema visibility hides controls without deleting saved gallery and logo settings', () => {
  const block = {...blockFor('about'), layout: 'Sliding gallery'};
  block.content = {...block.content, galleryMotion: 'still', gallerySpeed: 5, galleryPauseHover: false};
  const before = structuredClone(block);
  assert.equal(fieldFor(block, 'gallerySpeed'), undefined);
  assert.equal(fieldFor(block, 'galleryPauseHover'), undefined);
  const html = renderToStaticMarkup(createElement(UniversalSectionInspector, {
    block, change() { assert.fail('Rendering mutated content'); }, changeSettings() {}, changeLayout() {},
  }));
  assert.doesNotMatch(html, /aria-label="Speed"|Pause on hover/);
  assert.deepEqual(block, before);
  block.layout = 'Photos only';
  assert.equal(fieldFor(block, 'galleryScale'), undefined);
  assert.equal(block.content.gallerySpeed, 5);
  const logo = {...blockFor('logos'), layout: 'Scrolling row'};
  logo.content.logoMotion = 'still';
  assert.equal(fieldFor(logo, 'logoPauseHover'), undefined);
});

test('schema toggles persist explicit false and choice defaults reject invalid values', () => {
  const block = {...blockFor('about'), layout: 'Sliding gallery'};
  const field = fieldFor(block, 'galleryPauseHover');
  let patch;
  const toggle = controlFor(block, field, next => { patch = next; });
  toggle.props.children.find(child => child.type === 'input').props.onChange({target: {checked: false}});
  assert.deepEqual(patch, {galleryPauseHover: false});
  assert.equal(appearanceValue(field, false), false);
  assert.equal(appearanceValue(fieldFor(block, 'galleryWidth'), 'unrecognized'), 'boxed');
});

const {sectionComponents} = await import('../src/app/site/sections/index.tsx');

test('all canonical layouts render through the public website and keep saved data unchanged', () => {
  let rendered = 0;
  for (const {id: type} of catalog) {
    for (const layout of blockLayouts[type]) {
      const block = {...blockFor(type), layout};
      const before = structuredClone(block);
      const site = {...initial, blocks: initial.blocks.map(item => item.type === type ? block : item)};
      const html = renderToStaticMarkup(createElement(sectionComponents[type], {
        block, site, editable: false, selected: false,
        change() { assert.fail('Public render must not mutate settings'); },
        link: href => ({href}), labelFor: label => label,
        pages: [{id: 'home', name: 'Home', slug: 'home', site}],
        homeId: 'home', activeId: 'home', parentIndex: -1,
      }));
      assert.ok(html.length > 0, `${type}/${layout} rendered empty`);
      assert.deepEqual(block, before);
      rendered++;
    }
  }
  assert.equal(rendered, Object.values(blockLayouts).flat().length);
});

test('layout switches retain authored data and explicit reset overrides survive the shared patch pipeline', () => {
  const block = blockFor('proof');
  block.content = {...block.content, buttonCount: 1, photoSide: 'right', headAlign: 'bottom'};
  block.settings = {...block.settings, columns: 1, widths: [100]};
  const site = {...initial, blocks: initial.blocks.map(item => item.type === 'proof' ? block : item)};
  let updated;
  const editor = SectionEditor({
    view: 'Appearance', group: null, onGroup() {}, site, pages: [], block,
    usage: new Map(), footerDefaults: [], home: true, update(patch) { updated = patch; },
  });
  editor.props.changeLayout('Photo and reasons');
  assert.deepEqual(updated.blocks.find(item => item.id === block.id).content, block.content);
  editor.props.onResetLayout();
  const reset = updated.blocks.find(item => item.id === block.id);
  assert.equal(reset.layout, 'Text and photo');
  assert.deepEqual(reset.settings.widths, [50, 50]);
  assert.equal(reset.settings.columns, 2);
  assert.equal(reset.content.buttonCount, undefined);
  assert.equal(reset.content.photoSide, undefined);
  assert.equal(reset.content.headAlign, undefined);
  assert.equal(block.content.buttonCount, 1);
  assert.equal(block.content.photoSide, 'right');
});
