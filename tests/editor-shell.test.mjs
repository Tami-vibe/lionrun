import test from 'node:test';
import assert from 'node:assert/strict';
import {destinationBody, destinationGuidance, destinationKind, destinationWarning, linkMode, sectionTargets, storedDestination, withDestinationKind, withLinkMode} from '../src/app/editor/destination.ts';
import {displayZoom, editorSticky, fitZoom, framePieces, frameSize, geometryKey, selectionForRegion} from '../src/app/site/scope.ts';

const blocks = [
  {id: 'header', type: 'header'},
  {id: 'hero', type: 'hero'},
  {id: 'logos', type: 'logos'},
  {id: 'footer', type: 'footer'},
  {id: 'spare', type: 'promo', hidden: true},
];

test('canvas, section list, and inspector share one selected id', () => {
  const selected = selectionForRegion('page', blocks, 'logos');
  const editable = framePieces(blocks, 'page').filter(piece => !piece.context).map(piece => piece.block.id);
  assert.equal(selected, 'logos');
  assert.ok(editable.includes(selected));
  assert.equal(selectionForRegion('header', blocks, 'logos'), 'header');
  assert.deepEqual(framePieces(blocks, 'header').filter(piece => !piece.context).map(piece => piece.block.id), ['header']);
  assert.equal(selectionForRegion('footer', blocks, 'hero'), 'footer');
});

test('page editing omits the header and footer without changing saved sticky behavior', () => {
  const saved = true;
  assert.deepEqual(framePieces(blocks, 'page').map(piece => piece.block.id), ['hero', 'logos']);
  assert.deepEqual(framePieces(blocks, 'live').map(piece => piece.block.id), ['header', 'hero', 'logos', 'footer']);
  assert.equal(framePieces(blocks, 'header').find(piece => piece.block.type === 'hero')?.context, true);
  assert.equal(editorSticky('header', saved), false);
  assert.equal(saved, true);
  assert.equal(editorSticky('live', saved), true);
  assert.equal(editorSticky('page', saved), true);
});

test('destination switching keeps the current value and clears an incompatible one', () => {
  assert.equal(destinationKind('#contact'), 'link');
  assert.equal(destinationKind('tel:+13125550184'), 'phone');
  assert.equal(destinationKind('mailto:hello@example.com'), 'email');
  assert.equal(withDestinationKind('#contact', 'link'), '#contact');
  assert.equal(withDestinationKind('#contact', 'phone'), 'tel:');
  assert.equal(withDestinationKind('#contact', 'email'), 'mailto:');
  assert.equal(withDestinationKind('tel:+13125550184', 'phone'), 'tel:+13125550184');
  assert.equal(withDestinationKind('tel:+13125550184', 'link'), '');
  assert.equal(withDestinationKind('mailto:hello@example.com', 'email'), 'mailto:hello@example.com');
  assert.equal(withDestinationKind('mailto:hello@example.com', 'phone'), 'tel:');
});

test('destination guidance uses the catalog section name', () => {
  assert.equal(destinationGuidance('#contact'), 'Opens Contact on this page.');
  assert.equal(destinationGuidance('#top'), 'Opens Hero on this page.');
  assert.equal(destinationGuidance('#services'), 'Opens Services on this page.');
  assert.equal(destinationGuidance('https://example.com/book'), 'Enter a website address.');
  assert.equal(destinationGuidance('tel:+13125550184'), "Opens the visitor's calling app.");
  assert.equal(destinationGuidance('mailto:hello@example.com'), "Opens the visitor's email app.");
  assert.equal(destinationGuidance('', 'section'), 'Choose a section on this page.');
  assert.equal(destinationWarning(''), '');
  assert.equal(destinationWarning('tel:'), 'Enter a phone number.');
  assert.equal(destinationWarning('tel:+13125550184'), '');
  assert.equal(destinationWarning('mailto:hello'), 'Enter an email address.');
  assert.equal(destinationWarning('mailto:hello@example.com'), '');
  assert.equal(destinationWarning('#contact'), '');
  assert.equal(destinationWarning('#missing'), 'Enter a website address.');
  assert.match(destinationWarning('mailto:#contact'), /email address/i);
  assert.notEqual(destinationWarning('mailto:#contact'), '');
});

test('phone and email editors hide their prefixes and keep a bad legacy value', () => {
  assert.equal(destinationBody('tel:+13125550184'), '+13125550184');
  assert.equal(destinationBody('mailto:hello@example.com'), 'hello@example.com');
  assert.equal(destinationBody('mailto:#contact'), '#contact');
  assert.equal(storedDestination('phone', '+13125550184'), 'tel:+13125550184');
  assert.equal(storedDestination('email', '#contact'), 'mailto:#contact');
  assert.equal(storedDestination('link', '#contact'), '#contact');
  assert.equal(withDestinationKind('mailto:#contact', 'email'), 'mailto:#contact');
  assert.equal(withDestinationKind('mailto:#contact', 'link'), '');
  assert.equal(linkMode('#contact'), 'section');
  assert.equal(linkMode('#top'), 'section');
  assert.equal(linkMode('https://example.com/book'), 'website');
  assert.equal(linkMode('mailto:#contact'), 'website');
  assert.equal(withLinkMode('#contact', 'section'), '#contact');
  assert.equal(withLinkMode('#contact', 'website'), '');
  assert.equal(withLinkMode('https://example.com/book', 'website'), 'https://example.com/book');
  assert.equal(withLinkMode('https://example.com/book', 'section'), '');
});

test('section choices use the page anchor and the catalog name', () => {
  const choices = sectionTargets([
    {id: 'header', type: 'header'},
    {id: 'hero', type: 'hero'},
    {id: 'contact', type: 'contact'},
    {id: 'contact-2', type: 'contact'},
    {id: 'footer', type: 'footer'},
  ]);
  assert.deepEqual(choices.map(choice => choice.anchor), ['#top', '#contact', '#contact-2']);
  assert.equal(choices[0].label, 'Hero');
  assert.equal(choices[1].label, 'Contact');
  assert.equal(choices[2].label, 'Contact');
});

test('fit uses the complete frame and a chosen zoom stays fixed when the workspace changes', () => {
  const desktop = frameSize('desktop', 1440);
  assert.equal(desktop.viewportHeight, 900);
  assert.equal(desktop.width, 1442);
  assert.equal(fitZoom(desktop.width, desktop.width), 1);
  assert.equal(displayZoom('fit', 800, desktop.width), 800 / desktop.width);
  assert.equal(displayZoom(1.1, 800, desktop.width), 1.1);
  assert.equal(frameSize('tablet', 768).viewportHeight, 1024);
  assert.equal(frameSize('mobile', 390).viewportHeight, 844);
  assert.equal(frameSize('mobile', 390).width, 416);
  assert.equal(geometryKey({top: 10.4, left: 2, width: 40.2, height: 8}), geometryKey({top: 10.2, left: 1.6, width: 39.8, height: 8.4}));
});

test('rating summary uses only a valid entered score and count', async () => {
  const {countWarning, ratingSummary, scoreWarning} = await import('../src/app/editor/rating.ts');
  assert.equal(scoreWarning('4.9'), '');
  assert.equal(scoreWarning('5'), '');
  assert.equal(scoreWarning('6'), 'Enter a score from 0 to 5.');
  assert.equal(countWarning('128'), '');
  assert.equal(countWarning('-1'), 'Enter a whole number of reviews.');
  assert.equal(countWarning('4.9'), 'Enter a whole number of reviews.');
  assert.equal(ratingSummary('4.9', '128'), '4.9 · 128 reviews');
  assert.equal(ratingSummary('', '128'), '');
  assert.equal(ratingSummary('6', '128'), '');
});

test('hero collection accepts a direct media file and rejects a web page', async () => {
  const {HERO_ADD_LIMIT, SECTION_STAGE_LIMIT, directMediaLink, heroSlides, moveItem, publishedStart, reorderStart, slideIndexAllowed} = await import('../src/app/site/hero-collection.ts');
  assert.deepEqual(directMediaLink('https://cdn.example.com/road.jpg'), {ok: true, src: 'https://cdn.example.com/road.jpg', kind: 'image'});
  assert.equal(directMediaLink('https://example.com/about').ok, false);
  assert.match(directMediaLink('https://example.com/about').error, /web page/);
  assert.match(directMediaLink('https://drive.google.com/drive/folders/abc').error, /Private folders/);
  assert.equal(directMediaLink('https://www.dropbox.com/s/abc/logo.svg').ok, true);
  assert.equal(directMediaLink('http://localhost/a.jpg').ok, false);
  const slides = heroSlides({media: {src: ''}, slides: [{src: '/media/showcase/mountain-road.jpg'}]});
  assert.equal(slides.length, 1);
  assert.deepEqual(moveItem(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);
  assert.equal(publishedStart(2, 5), 2);
  assert.equal(publishedStart(8, 3), 2);
  assert.equal(reorderStart(0, 2, 0, 3), 2);
  assert.equal(reorderStart(2, 0, 0, 3), 1);
  assert.equal(reorderStart(1, 2, 0, 3), 0);
  assert.equal(HERO_ADD_LIMIT, 3);
  assert.equal(SECTION_STAGE_LIMIT, 4);
  assert.equal(slideIndexAllowed(2, 3), true);
  assert.equal(slideIndexAllowed(8, 3), false);
  assert.equal(slideIndexAllowed(4, 5), true);
  assert.equal(heroSlides({media: {src: 'a'}, slides: [{src: 'b'}, {src: 'c'}, {src: 'd'}, {src: 'e'}]}).length, 5);
});

test('editor and exported slideshows use the same advance rules', async () => {
  const {slideAdvancePlan} = await import('../src/app/site/hero-collection.ts');
  const {slideshowRuntime} = await import('../src/app/media/export.ts');
  const cases = [
    {autoplay: true, count: 3, reducedMotion: false, advance: 'time', kind: 'image', seconds: 5, mode: 'timer'},
    {autoplay: true, count: 3, reducedMotion: false, advance: 'end', kind: 'video', seconds: 8, mode: 'end'},
    {autoplay: true, count: 3, reducedMotion: true, advance: 'time', kind: 'image', seconds: 5, mode: 'off'},
    {autoplay: false, count: 3, reducedMotion: false, advance: 'time', kind: 'image', seconds: 5, mode: 'off'},
    {autoplay: true, count: 1, reducedMotion: false, advance: 'end', kind: 'video', seconds: 5, mode: 'off'},
  ];
  for (const item of cases) assert.equal(slideAdvancePlan(item).mode, item.mode);
  assert.equal(slideAdvancePlan(cases[0]).seconds, 5);
  assert.equal(slideAdvancePlan({...cases[1], seconds: 0}).seconds, 5);

  const run = ({reduced, advance, seconds, start, withVideo}) => {
    const videos = [0, 1, 2].map(() => ({
      paused: false,
      listener: null,
      getAttribute(name) { return name === 'data-autoplay' ? 'true' : null; },
      pause() { this.paused = true; },
      play() { this.paused = false; return Promise.resolve(); },
      addEventListener(type, fn) { if (type === 'ended') this.listener = fn; },
      removeEventListener() { this.listener = null; },
    }));
    const slides = [0, 1, 2].map(i => ({
      hidden: i !== start,
      querySelector(sel) { return sel === 'video' && withVideo ? videos[i] : null; },
    }));
    const label = {textContent: ''};
    const timers = [];
    const box = {
      getAttribute(name) { return name === 'data-slide-advance' ? advance : name === 'data-slide-seconds' ? String(seconds) : null; },
      querySelectorAll(sel) { return sel === '[data-slide]' ? slides : []; },
      querySelector(sel) { return sel === '[aria-live]' ? label : null; },
      closest() { return {querySelectorAll() { return []; }}; },
    };
    const document = {querySelectorAll(sel) { return sel === '[data-slide-autoplay=true]' ? [box] : []; }};
    const window = {clearTimeout() {}, setTimeout(fn, ms) { timers.push({fn, ms}); return timers.length; }};
    new Function('document', 'window', 'matchMedia', slideshowRuntime)(document, window, () => ({matches: reduced}));
    return {slides, videos, timers, label};
  };

  const timed = run({reduced: false, advance: 'time', seconds: 5, start: 2, withVideo: false});
  assert.equal(timed.slides[2].hidden, false);
  assert.equal(timed.timers[0].ms, 5000);
  timed.timers[0].fn();
  assert.equal(timed.slides[0].hidden, false);
  assert.equal(timed.label.textContent, '1 / 3');

  const ended = run({reduced: false, advance: 'end', seconds: 8, start: 0, withVideo: true});
  assert.equal(ended.timers.length, 0);
  assert.equal(ended.videos[1].paused, true);
  ended.videos[0].listener();
  assert.equal(ended.slides[1].hidden, false);
  assert.equal(ended.videos[0].paused, true);

  const reduced = run({reduced: true, advance: 'time', seconds: 5, start: 1, withVideo: true});
  assert.equal(reduced.timers.length, 0);
  assert.equal(reduced.slides[1].hidden, false);
  assert.equal(reduced.videos[0].paused, true);
  assert.equal(reduced.videos[1].paused, false);
});

test('removal undo puts the item back without replacing later collection edits', async () => {
  const {removalStart, restoreRemoved, selectionAfterMove, selectionAfterRemove, selectionAfterRestore} = await import('../src/app/site/hero-collection.ts');
  const removed = {item: 'b', index: 1, slideIndex: 2};
  const afterRemoval = ['a', 'c', 'd'];
  const afterLaterEdit = afterRemoval.map(item => item === 'c' ? 'c-edited' : item);
  assert.equal(removalStart(removed.index, removed.slideIndex, 4), 1);
  assert.deepEqual(restoreRemoved(afterLaterEdit, removed.item, removed.index), ['a', 'b', 'c-edited', 'd']);
  assert.equal(selectionAfterRestore(removed.index, afterLaterEdit.length), 1);
  assert.equal(removalStart(0, 0, 3), 0);
  assert.equal(removalStart(2, 2, 3), 1);
  assert.equal(selectionAfterRemove(0, 2), 0);
  assert.equal(selectionAfterRemove(2, 2), 1);
  assert.equal(selectionAfterRemove(0, 0), -1);
  assert.equal(selectionAfterMove(2, 3), 2);
  assert.equal(selectionAfterMove(3, 3), -1);
});
