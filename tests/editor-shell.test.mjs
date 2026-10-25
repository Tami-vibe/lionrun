import test from 'node:test';
import assert from 'node:assert/strict';
import {destinationBody, destinationGuidance, destinationKind, destinationWarning, linkMode, sectionTargets, storedDestination, withDestinationKind, withLinkMode} from '../src/app/editor/destination.ts';
import {displayZoom, editorSticky, fitZoom, framePieces, frameSize, geometryKey, selectionForRegion} from '../src/app/editor/scope.ts';

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
  const {HERO_ADD_LIMIT, directMediaLink, heroSlides, moveItem, publishedStart, reorderStart, slideIndexAllowed} = await import('../src/app/editor/hero-collection.ts');
  assert.deepEqual(directMediaLink('https://cdn.example.com/road.jpg'), {ok: true, src: 'https://cdn.example.com/road.jpg', kind: 'image'});
  assert.equal(directMediaLink('https://example.com/about').ok, false);
  assert.match(directMediaLink('https://example.com/about').error, /web page/);
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
  assert.equal(slideIndexAllowed(2, 3), true);
  assert.equal(slideIndexAllowed(8, 3), false);
  assert.equal(slideIndexAllowed(4, 5), true);
  assert.equal(heroSlides({media: {src: 'a'}, slides: [{src: 'b'}, {src: 'c'}, {src: 'd'}, {src: 'e'}]}).length, 5);
});

test('removal undo puts the item back without replacing later collection edits', async () => {
  const {removalStart, restoreRemoved} = await import('../src/app/editor/hero-collection.ts');
  const removed = {item: 'b', index: 1, slideIndex: 2};
  const afterRemoval = ['a', 'c', 'd'];
  const afterLaterEdit = afterRemoval.map(item => item === 'c' ? 'c-edited' : item);
  assert.equal(removalStart(removed.index, removed.slideIndex, 4), 1);
  assert.deepEqual(restoreRemoved(afterLaterEdit, removed.item, removed.index), ['a', 'b', 'c-edited', 'd']);
  assert.equal(removalStart(0, 0, 3), 0);
  assert.equal(removalStart(2, 2, 3), 1);
});
