import test from 'node:test';
import assert from 'node:assert/strict';
import {orderedMenuItems,moveMenuItem,duplicateMenu,syncMenusToSite} from '../src/app/site/menu-model.ts';
const fixture=()=>[
 {id:'services',text:'Services',linkTo:'section',destination:'#services',parentId:null},
 {id:'contact',text:'Contact',linkTo:'section',destination:'#contact',parentId:null},
 {id:'repair',text:'Repairs',linkTo:'page',destination:'/repairs',pageId:'repair-page',parentId:'services'},
 {id:'maintenance',text:'Maintenance',linkTo:'page',destination:'/maintenance',pageId:'maintenance-page',parentId:'services'}
];
const ids=items=>items.map(item=>item.id);
test('parents travel with children while destination identities survive',()=>{
 const items=fixture(),result=moveMenuItem(items,'services','contact','after');
 assert.deepEqual(ids(result.items),['contact','services','repair','maintenance']);
 assert.equal(result.items.find(i=>i.id==='repair').pageId,'repair-page');
 assert.deepEqual(items,fixture());
});
test('promotion, nesting, and sibling reorder use the saved parent relationship',()=>{
 const promoted=moveMenuItem(fixture(),'repair','services','after').items;
 assert.equal(promoted.find(i=>i.id==='repair').parentId,null);
 const nested=moveMenuItem(promoted,'repair','contact','inside').items;
 assert.equal(nested.find(i=>i.id==='repair').parentId,'contact');
 const reordered=moveMenuItem(fixture(),'maintenance','repair','before').items;
 assert.deepEqual(ids(orderedMenuItems(reordered)),['services','maintenance','repair','contact']);
});
test('invalid nesting and root overflow leave saved work untouched',()=>{
 const items=fixture();
 for(const [source,target,drop,limit,children] of [
  ['services','repair','inside',5,true],['services','contact','inside',5,true],
  ['contact','repair','inside',5,true],['repair','contact','inside',5,false],['repair','contact','after',2,true]
 ]){const result=moveMenuItem(items,source,target,drop,limit,children);assert.ok(result.error);assert.equal(result.items,items);}
 assert.equal(moveMenuItem(items,'services','services','after').items,items);
});
test('duplicate remaps child parents and does not copy placement',()=>{
 let serial=0;const source={id:'main',name:'Main menu',items:fixture()},copy=duplicateMenu(source,()=>`new-${++serial}`);
 const parent=copy.items.find(i=>i.text==='Services');
 assert.equal(copy.items.find(i=>i.text==='Repairs').parentId,parent.id);
 assert.notEqual(parent.id,'services');assert.equal(copy.items.find(i=>i.text==='Repairs').pageId,'repair-page');
 assert.equal(source.items[2].parentId,'services');
});
test('drop result updates the existing website navigation and footer projection',()=>{
 const items=moveMenuItem(fixture(),'repair','contact','inside').items;
 const patch=syncMenusToSite({footerColumns:[{title:'Explore',links:[]}]},[{id:'main',name:'Main',items},{id:'foot',name:'Foot',items:[fixture()[1]]}],{header:'main',footer:'foot'},[{id:'repair-page',slug:'repairs',name:'Repairs'}]);
 assert.deepEqual(patch.nav,['Services','Contact']);
 assert.equal(patch.navChildren[1][0].pageId,'repair-page');
 assert.equal(patch.footerColumns[0].links[0].href,'#contact');
});
test('page-linked menu labels and destinations survive page renaming and binding',async()=>{
 const {bindMenu}=await import('../src/app/site/settings.ts');
 const menu={id:'main',name:'Main',items:[{id:'root',text:'Explore repairs',linkTo:'page',destination:'/old-address',pageId:'repair-page',parentId:null},{id:'child',text:'Our specialists',linkTo:'page',destination:'/old-team',pageId:'team-page',parentId:'root'}]};
 const pages=[{id:'repair-page',slug:'new-address',name:'Vehicle repairs'},{id:'team-page',slug:'new-team',name:'Team'}];
 const projected=syncMenusToSite({},[menu],{header:'main'},pages);
 assert.equal(projected.navTargets[0],'/?page=repair-page');assert.equal(projected.navChildren[0][0].href,'/?page=team-page');
 const restored=bindMenu(projected,pages);
 assert.equal(restored.navChildren[0][0].label,'Our specialists');assert.equal(restored.navChildren[0][0].pageId,'team-page');
 assert.equal(restored.nav[0],'Explore repairs');
});
