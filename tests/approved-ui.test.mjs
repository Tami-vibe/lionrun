import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {linkedPage} from '../src/app/site/settings.ts';
import {validButton,initial} from '../src/app/site/blocks.ts';
register('./support/tsx.mjs',import.meta.url);
const {SectionButtons}=await import('../src/app/site/sections/elements.tsx');
const {ConcernsSection}=await import('../src/app/site/sections/content.tsx');
const {MediaUpload}=await import('../src/app/editor/media-upload.tsx');
const {Destination,DestinationPagesContext}=await import('../src/app/editor/fields.tsx');
test('website page destinations survive renamed names and addresses',()=>{
 const href='/?page=service-42',pages=[{id:'service-42',name:'Dent removal',slug:'dent-removal'}];
 assert.equal(linkedPage(pages,href)?.id,'service-42');
 assert.equal(linkedPage([{...pages[0],name:'Body repair',slug:'body-repair'}],href)?.id,'service-42');
 assert.equal(linkedPage(pages,'/dent-removal')?.id,'service-42');
 const html=renderToStaticMarkup(createElement(DestinationPagesContext.Provider,{value:pages},createElement(Destination,{value:href,onChange(){}})));
 assert.match(html,/<option value="page" selected="">Page on my website/);
 assert.match(html,/<option value="service-42" selected="">Dent removal/);
});
test('button contrast overrides validate and render on the actual website button',()=>{
 const button={label:'Get an estimate',icon:'arrow',href:'#contact',textColor:'#ffffff',fillColor:'#252535'};
 assert.equal(validButton(button),true);assert.equal(validButton({...button,fillColor:'url(javascript:bad)'}),false);
 const html=renderToStaticMarkup(createElement(SectionButtons,{content:{...initial.blocks.find(b=>b.type==='hero').content,buttons:[button]},link:href=>({href})}));
 assert.match(html,/color:#ffffff;background-color:#252535;border-color:#252535/);
});
test('a concern badge includes its chosen icon and tag together',()=>{
 const block=structuredClone(initial.blocks.find(b=>b.type==='pains'));block.layout='Photo cards';block.content.items[0].tag='Clear answers';block.content.items[0].icon='shield';
 const html=renderToStaticMarkup(createElement(ConcernsSection,{block,site:initial,editable:false,selected:false,change(){},link:href=>({href})}));
 assert.match(html,/<span class="section-kicker"><svg[^]*?lucide-shield[^]*?<\/svg>Clear answers<\/span>/);
});
test('shared upload keeps image-only rules, replacement selection and blocked actions',()=>{
 const html=renderToStaticMarkup(createElement(MediaUpload,{accept:'image/png',multiple:false,blocked:true,onFiles(){},onLink(){return false;},onLibrary(){},label:'Add images'}));
 assert.match(html,/accept="image\/png"/);assert.doesNotMatch(html,/multiple=""/);assert.match(html,/disabled=""/);assert.match(html,/Choose from library/);assert.match(html,/Use a link/);
});
const {HeroSection}=await import('../src/app/site/sections/hero.tsx');
const {HeroFocusProvider}=await import('../src/app/site/hero-focus.tsx');
const {MainImageJourney}=await import('../src/app/editor/main-image-journey.tsx');
const {mediaDefaults}=await import('../src/app/media/model.ts');
function storyFixture(){
 const block=structuredClone(initial.blocks.find(b=>b.type==='hero'));block.layout='story';
 block.content.media={...mediaDefaults,src:'/media/first.jpg',alt:'First'};
 block.content.slides=[{...mediaDefaults,src:'/media/second.jpg',alt:'Second'}];
 block.content.story={...mediaDefaults,kind:'video',src:'/media/story.mp4',title:'Our workshop'};
 block.content.slideAutoplay=true;block.content.slideIndex=0;return block;
}
function heroMarkup(block,focus,editable=true){return renderToStaticMarkup(createElement(HeroFocusProvider,{value:{focus,setFocus(){}}},createElement(HeroSection,{block,site:initial,editable,pages:[],homeId:'home',activeId:'home',parentIndex:-1,link:href=>({href}),labelFor:v=>v})));}
test('editing holds the selected background and disables slide advancement',()=>{
 const block=storyFixture(),html=heroMarkup(block,{blockId:block.id,index:1,target:'background'});
 assert.match(html,/data-slide-autoplay="false"/);
 assert.match(html,/<div class="hero-slide" data-slide="true" hidden="">[^]*?data-media-source="\/media\/first.jpg"/);
 assert.match(html,/<div class="hero-slide" data-slide="true"><div[^]*?data-media-source="\/media\/second.jpg"/);
 assert.match(heroMarkup(block,null,false),/data-slide-autoplay="true"/);
 block.content.slideIndex=1;
 assert.match(heroMarkup(block,null),/<div class="hero-slide" data-slide="true"><div[^]*?data-media-source="\/media\/second.jpg"/);
});
test('Story video focus uses the separate clip and preserves background choices',()=>{
 const block=storyFixture(),focus={blockId:block.id,index:1,target:'story'},html=heroMarkup(block,focus);
 assert.match(html,/class="hero-media"[^]*?data-media-source="\/media\/story.mp4"/);
 assert.match(html,/data-media-source="\/media\/first.jpg"/);assert.match(html,/data-media-source="\/media\/second.jpg"/);
 const panel=renderToStaticMarkup(createElement(HeroFocusProvider,{value:{focus,setFocus(){}}},createElement(MainImageJourney,{content:block.content,layout:block.layout,blockId:block.id,usage:new Map(),onChange(){}})));
 assert.match(panel,/Your story video/);assert.match(panel,/data-media-source="\/media\/story.mp4"/);
 assert.doesNotMatch(panel,/data-media-source="\/media\/first.jpg"/);
});
test('media overview reflects saved selection and limits Story controls to Story layout',()=>{
 const block=storyFixture();block.content.slideIndex=1;
 const render=layout=>renderToStaticMarkup(createElement(MainImageJourney,{content:block.content,layout,blockId:block.id,usage:new Map(),onChange(){}}));
 assert.match(render('story'),/Story media/);
 const html=render('split');assert.doesNotMatch(html,/aria-label="Story media"/);
 assert.match(html,/aria-pressed="true" aria-label="Edit image 2"/);
 assert.match(html,/data-media-source="\/media\/second.jpg"/);
});
const {HeaderSection}=await import('../src/app/site/sections/menu.tsx');
const {MenuEditor}=await import('../src/app/editor/menu-editor.tsx');
test('named header links show edited labels rather than destination page names',()=>{
 const site={...initial,menus:[{id:'custom',name:'Main',items:[]}],menuPlacement:{header:'custom'},nav:['Explore repairs'],navTargets:['/?page=repair'],navPageIds:['repair'],navChildren:[[{label:'Our specialists',href:'/?page=team',pageId:'team'}]]};
 const html=renderToStaticMarkup(createElement(HeaderSection,{site,block:initial.blocks.find(b=>b.type==='header'),pages:[],homeId:'home',link:href=>({href}),labelFor:()=> 'Destination page name'}));
 assert.match(html,/Explore repairs/);assert.match(html,/Our specialists/);assert.doesNotMatch(html,/Destination page name/);
});
test('menu overview has no fake handles or duplicate placement controls',()=>{
 const html=renderToStaticMarkup(createElement(MenuEditor,{site:initial,pages:[],update(){}}));
 assert.match(html,/Your menus/);assert.match(html,/Add menu/);assert.doesNotMatch(html,/drag-handle|Menu placement|nesting-helper-card/);
});
