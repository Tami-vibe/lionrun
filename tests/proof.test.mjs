import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initial,validBlocks,contentForLayout} from '../src/app/site/blocks.ts';
import {sequenceItems} from '../src/app/media/sequence.ts';
import {mediaDefaults} from '../src/app/media/model.ts';
import {loadableWorkspace,storedPages} from '../src/app/editor/workspace.ts';
import {collectionPatch,removalStart} from '../src/app/editor/hero-collection.ts';
import {sequenceRuntime} from '../src/app/media/export.ts';
import vm from 'node:vm';
register('./support/tsx.mjs',import.meta.url);
const {ContentBrowser}=await import('../src/app/editor/content-browser.tsx');
const {ProofStyle}=await import('../src/app/editor/proof-style.tsx');
const {ProofSection}=await import('../src/app/site/sections/proof.tsx');
const proof=()=>structuredClone(initial.blocks.find(block=>block.type==='proof'));
const image={...mediaDefaults,src:'/media/one.jpg',alt:'Workshop'},video={...mediaDefaults,src:'/media/two.mp4',kind:'video'};
const contentMarkup=(block,group)=>renderToStaticMarkup(createElement(ContentBrowser,{block,group,site:initial,pages:[],update:()=>assert.fail('Render must not mutate'),change:()=>assert.fail('Render must not mutate'),footerDefaults:[],usage:new Map(),onOpen:()=>{},home:true}));

test('Why choose us Links renders section destinations, not shared menu fields',()=>{
  const block=proof();block.layout='Photo and reasons';block.content=contentForLayout(block,block.layout);
  const html=contentMarkup(block,'links');
  assert.match(html,/Button text/);assert.match(html,/Text link destination/);
  assert.doesNotMatch(html,/Menu link 1|Add menu link/);
});
test('Why choose us keeps three promises and moves its caption into Media',()=>{
  const block=proof(),promises=contentMarkup(block,'promises'),media=contentMarkup(block,'photo');
  assert.match(promises,/Promise 3/);assert.doesNotMatch(promises,/Photo caption/);
  assert.match(media,/Caption/);assert.match(media,/Media display/);assert.match(media,/Choose from library/);
  assert.doesNotMatch(media,/Media manager|Image darkness|Improve text readability/);
  assert.match(media,/class="hero-tile-select"[^>]*aria-pressed/);
});
test('Style exposes layout first and preserves underlying layout ids',()=>{
  const block=proof(),html=renderToStaticMarkup(createElement(ProofStyle,{block,changeLayout:()=>{},changeSettings:()=>{},change:()=>{}}));
  assert.match(html,/Text \+ media/);assert.match(html,/Media \+ reasons/);
  assert.match(html,/value="Text and photo"/);assert.match(html,/aria-expanded="true"/);
  assert.equal((html.match(/class="layout-choice"/g) || []).length, 3);
  assert.doesNotMatch(html,/Font size/);
});
test('media mode switches retain the saved collection and select the requested kind',()=>{
  const c={media:image,slides:[video,{...image,src:'/media/three.jpg'}],slideIndex:2};
  assert.deepEqual(sequenceItems({...c,mediaMode:'image'}).map(item=>item.src),['/media/three.jpg']);
  assert.deepEqual(sequenceItems({...c,mediaMode:'video'}).map(item=>item.src),['/media/two.mp4']);
  assert.equal(sequenceItems({...c,mediaMode:'slideshow'}).length,3);
  assert.equal(c.slides.length,2);
});
test('new optional media settings validate and survive workspace serialization',()=>{
  const site=structuredClone(initial),block=site.blocks.find(block=>block.type==='proof');
  block.content={...block.content,media:image,slides:[video],mediaMode:'slideshow',slideLoop:false,slideSeconds:3,slideAutoplay:true};
  assert.equal(validBlocks(site.blocks),true);
  const pages=storedPages([{id:'home',name:'Home',slug:'home',site}]),saved={schemaVersion:3,pages};
  assert.equal(loadableWorkspace(saved),true);
  assert.deepEqual(storedPages(pages)[0].site.blocks.find(block=>block.type==='proof').content,block.content);
  for(const patch of [{mediaMode:'unknown'},{slideLoop:'yes'},{slideSeconds:0}])assert.equal(validBlocks([{...block,content:{...block.content,...patch}}]),false);
  assert.equal(validBlocks(initial.blocks),true);
});
test('all proof layouts preserve the collection and only the band omits media',()=>{
  const original=proof();original.content={...original.content,media:image,slides:[video],mediaMode:'slideshow'};
  for(const layout of ['Text and photo','Photo and reasons','Promise band']){
    const block={...original,layout,content:contentForLayout(original,layout)};
    assert.deepEqual(block.content.slides,original.content.slides);
    const html=renderToStaticMarkup(createElement(ProofSection,{block,editable:false,selected:false,change:()=>{},link:href=>({href})}));
    assert.equal(html.includes('data-media-sequence'),layout!=='Promise band');
  }
});
test('removing any collection item normalizes the actual persisted starting index',()=>{
  const items=[image,video,{...image,src:'/media/three.jpg'}];
  for(let start=0;start<3;start++)for(let removed=0;removed<3;removed++){
    const block=proof();block.content={...block.content,...collectionPatch(items,start)};
    Object.assign(block.content,collectionPatch(items.filter((_,i)=>i!==removed),removalStart(removed,start,3)));
    assert.ok(block.content.slideIndex<2);assert.equal(validBlocks([block]),true);
  }
  assert.equal(collectionPatch([],2).slideIndex,0);
});

function runtime({loop=true,reduced=false}={}) {
  const timers=new Map(),videos=[{pause(){this.paused=true;},dataset:{}},{pause(){this.paused=true;},dataset:{}}];
  const slides=videos.map((video,i)=>({hidden:i!==0,querySelectorAll:()=>[video]}));
  const motion=new EventTarget();motion.matches=reduced;
  const doc=new EventTarget();doc.hidden=false;
  const toggle={textContent:'Pause slideshow',hasAttribute:key=>key==='data-sequence-toggle',setAttribute(key,value){this[key]=value;}};
  const next={dataset:{sequenceStep:'1'},hasAttribute:()=>false};
  const count={textContent:''},root=new EventTarget();
  root.dataset={sequenceAutoplay:'true',sequenceLoop:String(loop),sequenceSeconds:'2'};
  root.querySelectorAll=selector=>selector==='[data-sequence-slide]'?slides:videos;
  root.querySelector=selector=>selector==='[data-sequence-toggle]'?toggle:count;
  root.closest=()=>root.clicked;root.contains=()=>false;
  const sandbox={document:doc,matchMedia:()=>motion,window:{setTimeout(callback){const id=timers.size+1;timers.set(id,callback);return id;},clearTimeout(id){timers.delete(id);}}};
  doc.querySelectorAll=()=>[root];
  vm.runInNewContext(sequenceRuntime,sandbox);
  return {root,slides,videos,timers,motion,doc,toggle,count,click(control){root.clicked=control;root.dispatchEvent(new Event('click'));},next,advance(){const [id,callback]=timers.entries().next().value||[];assert.ok(callback,'Timer must be scheduled');timers.delete(id);callback();}};
}
test('exported slideshow controller advances, stops without repeat, and supports pause',()=>{
  const run=runtime({loop:false});assert.equal(run.count.textContent,'1 / 2');
  run.click(run.toggle);assert.equal(run.timers.size,0);assert.equal(run.toggle['aria-pressed'],'true');
  run.click(run.toggle);run.advance();assert.equal(run.slides[0].hidden,true);assert.equal(run.slides[1].hidden,false);
  assert.equal(run.timers.size,0);assert.equal(run.videos[0].paused,true);
});
test('exported slideshow controller observes reduced motion, visibility, hover and focus',()=>{
  const quiet=runtime({reduced:true});assert.equal(quiet.timers.size,0);
  quiet.click(quiet.next);assert.equal(quiet.count.textContent,'2 / 2');
  const run=runtime();run.advance();run.advance();assert.equal(run.count.textContent,'1 / 2');
  run.root.dispatchEvent(new Event('pointerenter'));assert.equal(run.timers.size,0);
  run.root.dispatchEvent(new Event('pointerleave'));assert.equal(run.timers.size,1);
  run.root.dispatchEvent(new Event('focusin'));assert.equal(run.timers.size,0);
  run.root.dispatchEvent(new Event('focusout'));assert.equal(run.timers.size,1);
  run.doc.hidden=true;run.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(run.timers.size,0);
  run.doc.hidden=false;run.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(run.timers.size,1);
  run.motion.matches=true;run.motion.dispatchEvent(new Event('change'));assert.equal(run.timers.size,0);
});
