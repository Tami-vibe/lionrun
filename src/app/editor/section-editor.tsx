"use client";
import {useState} from 'react';
import {Block,Site,contentForLayout,settingsForLayout,blockLayouts} from '../site/blocks';
import {reviewLayout,reviewLayoutName,type ReviewLayout} from '../site/reviews';
import {menuButtons} from './workspace';
import {ContentBrowser,Choice,Destination,Field,useEditScope} from './fields';
import {LayoutControls,TypographyControls} from './inspector';
import {HeroLayouts,PageEntry} from './navigation';
import {FooterColumn,SectionSettings,defaultColumns,equalWidths} from './settings';

function RangeField({label,min,max,value,onChange}:{label:string;min:number;max:number;value:number;onChange:(value:number)=>void}) {
  const scope=useEditScope();
  return <label className="field"><span>{label}: {value}</span><input aria-label={label} type="range" min={min} max={max} value={value} {...scope} onChange={e=>onChange(Number(e.target.value))}/></label>;
}
export function SectionEditor({view,group,onGroup,site,pages,block,used,footerDefaults,home,update}:{
  view:'Content'|'Appearance'; group:string|null; onGroup:(id:string|null)=>void; site:Site; pages:PageEntry<Site>[]; block:Block; used:string; footerDefaults:FooterColumn[]; home:boolean; update:(patch:Partial<Site>)=>void;
}) {
  const [textTarget,setTextTarget]=useState<'heading'|'body'>('heading');
  const settings=block.settings||{columns:defaultColumns(block.type)};
  const change=(patch:Partial<import('../site/blocks').BlockContent>)=>update({blocks:site.blocks.map(item=>item.id===block.id?{...item,content:{...item.content,...patch}}:item)});
  const changeSettings=(value:SectionSettings)=>update({blocks:site.blocks.map(item=>item.id===block.id?{...item,settings:value}:item)});
  const changeBlock=(patch:Partial<Block>)=>{if(patch.layout){const next=contentForLayout(block,patch.layout);if(next!==block.content)patch.content=next;patch.settings=settingsForLayout(block.type,patch.layout,settings);}update({blocks:site.blocks.map(item=>item.id===block.id?{...item,...patch}:item)});};
  const changeLayout=(value:SectionSettings)=>{
    if(block.type==='footer'){const columns=site.footerColumns||footerDefaults;update({footerStyle:'columns',blocks:site.blocks.map(item=>item.id===block.id?{...item,settings:value}:item),footerColumns:Array.from({length:Math.max(columns.length,value.columns||3)},(_,i)=>columns[i]||{title:`Column ${i+1}`,text:'',links:[]})});return;}
    if(block.type==='solutions'&&block.layout==='Numbered steps'){const count=Math.min(5,Math.max(3,value.columns||5)),items=block.content.items,next=items.length>=count?items:[...items,...Array.from({length:count-items.length},()=>({title:'',description:'',icon:'check' as const}))];update({blocks:site.blocks.map(item=>item.id===block.id?{...item,settings:{...value,columns:count,widths:equalWidths(count)},content:{...item.content,items:next}}:item)});return;}
    changeSettings(value);
  };
  if(view==='Content')return <ContentBrowser block={block} site={site} pages={pages} update={update} change={change} footerDefaults={footerDefaults} used={used} group={group} onOpen={onGroup} home={home}/>;
  const singleLayout=['Price list','Promise band','One message','One large quote','Accordion','Scrolling row','Heading and slider','Signals'].includes(block.layout);
  const gridSection=!singleLayout&&!['header','hero','promo'].includes(block.type);
  const media=block.content.media;
  const heroLayout = block.layout as 'split' | 'center' | 'image' | 'short' | 'story';
  return <>
    {block.type==='header'&&<>
      <Choice label="Menu look" value={site.headerStyle} onChange={headerStyle=>update({headerStyle})} options={[{value:'pill',label:'Rounded menu'},{value:'rounded',label:'Soft corners'},{value:'standard',label:'Standard bar'}]}/>
      <Choice label="Stays on screen" value={site.headerSticky?'yes':'no'} onChange={v=>update({headerSticky:v==='yes'})} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}/>
      <Choice label="Photo behind the menu" value={site.headerOverlay?'yes':'no'} onChange={v=>update({headerOverlay:v==='yes'})} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}/>
      <Choice label="Menu background" value={site.headerBackground!==false?'yes':'no'} onChange={v=>update({headerBackground:v==='yes'})} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}/>
      <Choice label="Extra buttons" value={String(site.headerButtonCount??1)} onChange={v=>update({headerButtonCount:Number(v) as 0|1|2})} options={[{value:'0',label:'None'},{value:'1',label:'One'},{value:'2',label:'Two'}]}/>
      {site.headerStyle!=='standard'&&<Choice label="Where those buttons sit" value={site.headerButtonPlace||'inside'} onChange={headerButtonPlace=>update({headerButtonPlace})} options={[{value:'inside',label:'Inside the menu'},{value:'beside',label:'Beside the menu'}]}/>}
      <div className="card-stack">{menuButtons(site).slice(0,site.headerButtonCount??1).map((button,i)=><div className="action-editor" key={i}><h3>Extra button {i+1}</h3><Field label={`Button ${i+1} text`} value={button.label} onChange={label=>update({headerButtons:menuButtons(site).map((item,j)=>i===j?{...item,label}:item)})}/><Destination label={`Button ${i+1} destination`} value={button.href} onChange={href=>update({headerButtons:menuButtons(site).map((item,j)=>i===j?{...item,href}:item)})}/></div>)}</div>
      <p className="helper-text">Photo behind the menu puts the menu over the hero. Turn off Menu background to let the photo show through.</p>
    </>}
    {block.type!=='header'&&<><LayoutControls value={settings} change={changeLayout} max={gridSection?(['proof','contact','quote'].includes(block.type)?2:5):1} min={block.type==='solutions'&&block.layout==='Numbered steps'?3:1} legend={block.type==='solutions'&&block.layout==='Numbered steps'?'Steps':'Columns'}/><button type="button" className="reset-style" onClick={()=>changeSettings({columns:singleLayout?1:['proof','contact','quote','closing'].includes(block.type)?2:defaultColumns(block.type)})}>Reset section layout</button><div className="editor-divider"/></>}
    {['header','footer'].includes(block.type)&&!home&&<p className="helper-text">Menu colors come from Home. Page appearance is in Page settings and changes this page only.</p>}
    {block.type==='footer'&&<Choice label="Footer style" value={site.footerStyle} onChange={footerStyle=>update({footerStyle,blocks:site.blocks.map(item=>item.id===block.id?{...item,settings:{...settings,columns:footerStyle==='minimal'?1:3,widths:footerStyle==='minimal'?[100]:[100/3,100/3,100/3]}}:item)})} options={[{value:'columns',label:'Columns'},{value:'minimal',label:'Minimal'}]}/>}
    {block.type==='hero'&&<>
      <HeroLayouts site={{...site,layout:heroLayout}} change={layout=>changeBlock({layout})}/>
      <Choice label="Height" value={block.content.height||'standard'} onChange={height=>change({height})} options={[{value:'standard',label:'Standard'},{value:'full',label:'Full screen'}]}/>
      <Choice label="Text alignment" value={block.content.align||'left'} onChange={align=>change({align})} options={[{value:'left',label:'Left'},{value:'center',label:'Center'}]}/>
      {block.id==='hero'&&home&&<Choice label="Business details" value={block.content.showBusiness?'bottom':'off'} onChange={v=>change({showBusiness:v==='bottom'})} options={[{value:'off',label:'Off'},{value:'bottom',label:'Bottom'}]}/>}
      <RangeField label="Image darkness" min={0} max={80} value={block.content.darkness??36} onChange={darkness=>change({darkness})}/>
    </>}
    {block.type==='reviews'&&<><Choice label="Layout" value={reviewLayout(block.layout)} onChange={(value:ReviewLayout)=>changeBlock({layout:reviewLayoutName(value)})} options={[{value:'featured',label:'Featured'},{value:'grid',label:'Grid'},{value:'carousel',label:'Carousel'},{value:'auto',label:'Auto'}]}/><Choice label="Review text" value={block.content.reviewText==='full'?'full':'excerpt'} onChange={value=>change({reviewText:value as 'full'|'excerpt'})} options={[{value:'excerpt',label:'Excerpt'},{value:'full',label:'Full'}]}/><Choice label="Avatars" value={block.content.avatar||'circle'} onChange={value=>change({avatar:value as 'off'|'circle'|'square'})} options={[{value:'circle',label:'Circles'},{value:'square',label:'Squares'},{value:'off',label:'Hidden'}]}/><Choice label="Names" value={block.content.namePrivacy?'initials':'full'} onChange={value=>change({namePrivacy:value==='initials'})} options={[{value:'full',label:'Full name'},{value:'initials',label:'Initials'}]}/><Choice label="Card surface" value={block.content.cardFace==='plain'?'plain':'filled'} onChange={value=>change({cardFace:value as 'filled'|'plain'})} options={[{value:'filled',label:'Filled'},{value:'plain',label:'Plain'}]}/><Choice label="Card padding" value={block.content.cardPad==='compact'?'compact':'comfortable'} onChange={value=>change({cardPad:value as 'comfortable'|'compact'})} options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'}]}/><label className="visibility-toggle"><span>Show stars</span><input type="checkbox" checked={block.content.showRating!==false} onChange={e=>change({showRating:e.target.checked})}/></label><label className="visibility-toggle"><span>Show date</span><input type="checkbox" checked={block.content.showDate!==false} onChange={e=>change({showDate:e.target.checked})}/></label><label className="visibility-toggle"><span>Show service</span><input type="checkbox" checked={block.content.showService!==false} onChange={e=>change({showService:e.target.checked})}/></label><label className="visibility-toggle"><span>Show source</span><input type="checkbox" checked={block.content.showSource!==false} onChange={e=>change({showSource:e.target.checked})}/></label><p className="helper-text">Column count and spacing are above. Text size and color are below. A wide layout steps down to two cards, then one, when the section gets narrow. Five columns scroll sideways instead of squeezing.</p></>}
    {block.type!=='header'&&block.type!=='footer'&&block.type!=='hero'&&block.type!=='reviews'&&<label className="field"><span>Section layout</span><select aria-label="Section layout" value={block.layout} onChange={e=>changeBlock({layout:e.target.value})}>{blockLayouts[block.type].map(layout=><option key={layout}>{layout}</option>)}</select></label>}
    {block.type==='services'&&block.layout==='Photo cards'&&<><RangeField label="Gradient" min={0} max={80} value={block.content.darkness??64} onChange={darkness=>change({darkness})}/><Choice label="Arrow" value={block.content.arrowCircle===false?'plain':'circle'} onChange={v=>change({arrowCircle:v==='circle'})} options={[{value:'circle',label:'Circle'},{value:'plain',label:'Plain'}]}/></>}
    {block.type==='logos'&&block.layout==='Heading and slider'&&<Choice label="Heading" value={block.content.showHeading===false?'hide':'show'} onChange={v=>change({showHeading:v==='show'})} options={[{value:'show',label:'Show'},{value:'hide',label:'Hide'}]}/>}
    {block.type==='trust'&&block.layout==='Signals'&&<><Choice label="Background" value={block.content.showMedia===false?'none':(block.content.showMedia||media.src)?'photo':'none'} onChange={v=>change({showMedia:v==='photo'})} options={[{value:'none',label:'None'},{value:'photo',label:'Photo'}]}/><Choice label="Photo side" value={block.content.photoSide==='left'?'left':'right'} onChange={v=>change({photoSide:v as 'left'|'right'})} options={[{value:'right',label:'Right'},{value:'left',label:'Left'}]}/></>}
    {block.type==='trust'&&block.layout==='Signals'&&block.content.showMedia!==false&&(!!block.content.showMedia||!!media.src)&&<>
      <Choice label="Fit" value={media.fit==='contain'?'contain':'cover'} onChange={v=>change({media:{...media,fit:v as 'cover'|'contain'}})} options={[{value:'cover',label:'Cover'},{value:'contain',label:'Contain'}]}/>
      <RangeField label="Image position, horizontal" min={0} max={100} value={media.x??50} onChange={x=>change({media:{...media,x}})}/>
      <RangeField label="Image position, vertical" min={0} max={100} value={media.y??50} onChange={y=>change({media:{...media,y}})}/>
      <label className="field"><span>Section color</span><input aria-label="Section color" type="color" value={/^#[0-9a-f]{6}$/i.test(block.content.background||'')?block.content.background!:'#141922'} onChange={e=>change({background:e.target.value})}/></label>
      <Choice label="Fade" value={block.content.fade===false?'off':'on'} onChange={v=>change({fade:v==='on'})} options={[{value:'on',label:'On'},{value:'off',label:'Off'}]}/>
      <Choice label="Direction" value={block.content.fadeDirection==='rtl'?'rtl':'ltr'} onChange={v=>change({fadeDirection:v as 'ltr'|'rtl'})} options={[{value:'ltr',label:'Left to right'},{value:'rtl',label:'Right to left'}]}/>
      <RangeField label="Fade width" min={0} max={100} value={Math.round(block.content.fadeWidth??35)} onChange={fadeWidth=>change({fadeWidth})}/>
      <RangeField label="Fade strength" min={0} max={100} value={Math.round(block.content.fadeStrength??100)} onChange={fadeStrength=>change({fadeStrength})}/>
      <RangeField label="Gradient" min={0} max={80} value={block.content.darkness??64} onChange={darkness=>change({darkness})}/>
    </>}
    {block.type==='proof'&&block.layout==='Photo and reasons'&&<>
      <Choice label="Buttons" value={String(block.content.buttonCount??2)} onChange={v=>change({buttonCount:Number(v) as 0|1|2})} options={[{value:'2',label:'Both'},{value:'1',label:'One'},{value:'0',label:'None'}]}/>
      <Choice label="Intro alignment" value={block.content.headAlign||'center'} onChange={v=>change({headAlign:v as 'top'|'center'|'bottom'})} options={[{value:'top',label:'Top'},{value:'center',label:'Center'},{value:'bottom',label:'Bottom'}]}/>
      <Choice label="Photo side" value={block.content.photoSide||'left'} onChange={v=>change({photoSide:v as 'left'|'right'})} options={[{value:'left',label:'Left'},{value:'right',label:'Right'}]}/>
    </>}
    <TypographyControls value={settings} change={changeSettings} target={textTarget} setTarget={setTextTarget}/>
    {!['header','hero','footer'].includes(block.type)&&<p className="helper-text">Use the type settings above for text. Keep one clear main action for visitors.</p>}
  </>;
}
