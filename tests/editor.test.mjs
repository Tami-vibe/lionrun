import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSettings,equalWidths,resizeWidth,moveDivider,sectionVariables,normalizeBrandKit,brandKitVariables,defaultBrandKit} from '../src/app/editor/settings.ts';
const valid=widths=>{assert.ok(widths.every(n=>Number.isFinite(n)&&n>=10-1e-8));assert.ok(Math.abs(widths.reduce((a,b)=>a+b,0)-100)<1e-8);};
test('old pages retain inherited text styling and layout defaults',()=>{
  assert.deepEqual(sectionVariables(),{});assert.equal(normalizeSettings().columns,3);
  assert.deepEqual(normalizeSettings({heading:{}}).heading,normalizeSettings().heading);
});
test('brand kit defaults and rejects unknown font pairs',()=>{
  assert.deepEqual(normalizeBrandKit(undefined),defaultBrandKit);
  assert.deepEqual(normalizeBrandKit({fontPair:'weird',radius:'soft',lineWidth:'2'}),{fontPair:'northline',radius:'soft',lineWidth:'2'});
  assert.match(brandKitVariables(normalizeBrandKit({fontPair:'editorial'}))['--font-display'],/editorial-display/);
});
import {sharedMenu} from '../src/app/editor/workspace.ts';
import {initial} from '../src/app/site/blocks.ts';
test('home brand kit syncs onto other pages',()=>{
  const home={...initial,accent:'#112233',theme:'midnight',eyebrowStyle:'line',brandKit:{fontPair:'editorial',radius:'sharp',lineWidth:'2'}};
  const page={...initial,accent:'#abcdef',theme:'paper',eyebrowStyle:'pill',brandKit:defaultBrandKit,blocks:initial.blocks.map(b=>({...structuredClone(b),id:b.type==='header'||b.type==='footer'?b.id:`${b.id}-page`}))};
  const synced=sharedMenu(page,home);
  assert.equal(synced.accent,'#112233');
  assert.equal(synced.theme,'midnight');
  assert.equal(synced.eyebrowStyle,'line');
  assert.deepEqual(synced.brandKit,{fontPair:'editorial',radius:'sharp',lineWidth:'2'});
});
test('column counts and invalid persisted values remain bounded',()=>{
  for(const columns of [-5,1,2,3,4,5,50,NaN])valid(normalizeSettings({columns,widths:[90,10,10,10,10]}).widths);
  valid(normalizeSettings({columns:3,widths:[NaN,Infinity,-99]}).widths);
});
test('width inputs redistribute remaining space without collapsing columns',()=>{
  for(let n=2;n<=5;n++)for(let i=0;i<n;i++)for(const v of [-100,10,40,100,NaN])valid(resizeWidth(equalWidths(n),i,v));
  assert.deepEqual(resizeWidth(equalWidths(3),0,40),[40,30,30]);
});
test('divider changes only its adjacent pair and respects minimum widths',()=>{
  assert.deepEqual(moveDivider([40,30,30],0,10),[50,20,30]);
  assert.deepEqual(moveDivider([40,30,30],0,-100),[10,60,30]);
  assert.deepEqual(moveDivider([40,30,30],1,100),[40,50,10]);
});
test('style output accepts only safe fonts, colors and bounded numbers',()=>{
  const s=normalizeSettings({heading:{family:'url(evil)',color:'red;display:none',size:999,lineHeight:0,tracking:-50}});
  assert.equal(s.heading.family,undefined);assert.equal(s.heading.color,undefined);
  assert.equal(s.heading.size,96);assert.equal(s.heading.lineHeight,1);assert.equal(s.heading.tracking,-3);
});
import {bindMenu,linkedPage,pageLocation,placePage} from '../src/app/editor/settings.ts';
const rentals={id:'rentals-id',name:'Rentals',slug:'rentals'},guide={id:'guide-id',name:'Guide',slug:'guide'};
const menu={nav:['Services','Copied name'],navTargets:['#services','/rentals'],navChildren:[[{label:'Guide',href:'/guide'}],[]],footerColumns:[{title:'Explore',text:'',links:[{label:'Old name',href:'/rentals'}]}]};
test('legacy addresses acquire stable identities and names follow renamed pages',()=>{
  const bound=bindMenu(menu,[rentals,guide]);assert.equal(bound.navPageIds[1],rentals.id);assert.equal(bound.navChildren[0][0].pageId,guide.id);
  const renamed={...rentals,name:'Car hire'};assert.equal(linkedPage([renamed],'/old-address',rentals.id).name,'Car hire');assert.equal(bindMenu(bound,[renamed,guide]).footerColumns[0].links[0].label,'Car hire');
});
test('selected-page placement moves links without duplicates or mutation',()=>{
  const bound=bindMenu(menu,[rentals,guide]);let moved=placePage(bound,rentals,'under',0);
  assert.deepEqual(pageLocation(moved,rentals),{where:'under',parent:0});assert.equal(moved.footerColumns[0].links.length,0);assert.equal(bound.nav.length,2);
  moved=placePage(moved,rentals,'bottom',0);assert.equal(pageLocation(moved,rentals).where,'bottom');assert.equal(moved.navChildren[0].some(l=>l.pageId===rentals.id),false);
  moved=placePage(moved,rentals,'none',0);assert.equal(pageLocation(moved,rentals).where,'none');assert.equal(pageLocation(moved,guide).where,'under');
  moved=placePage(moved,rentals,'top',0);assert.equal(pageLocation(moved,rentals).where,'top');assert.equal(moved.navPageIds.at(-1),rentals.id);
});
test('moving a parent preserves its children and the five-link limit',()=>{
  const parent={id:'parent',name:'Services',slug:'services'};const bound=bindMenu({...menu,navTargets:['/services','/rentals']},[parent,rentals,guide]);
  const moved=placePage(bound,parent,'none',0);assert.equal(pageLocation(moved,guide).where,'bottom');assert.equal(pageLocation(moved,rentals).where,'top');
  const full={nav:['1','2','3','4','5'],navTargets:['#a','#b','#c','#d','#e']};const added=placePage(full,rentals,'top',0);assert.equal(added.nav.length,5);assert.equal(pageLocation(added,rentals).where,'bottom');
  const empty=placePage({nav:[]},rentals,'under',0);assert.equal(pageLocation(empty,rentals).where,'top');
});
test('removed page identities disappear from all shared menus',()=>{
  const bound=bindMenu(menu,[rentals,guide]),removed=bindMenu(bound,[guide]);
  assert.equal(removed.nav.length,1);assert.equal(removed.footerColumns[0].links.length,0);assert.equal(pageLocation(removed,guide).where,'under');
});
