"use client";
import {ChevronDown, Grid2X2, MoveVertical, RotateCcw, Scaling, SlidersHorizontal, SquareStack, Type} from 'lucide-react';
import type {ReactNode} from 'react';
import type {BlockContent} from '../site/blocks';
import {layoutContract} from '../site/layout-contract';
import {LayoutPicker, LayoutThumb} from './layout-picker';
import {RefinedStyleShell} from './refined-style-shell';
import {galleryFeaturedCount, galleryGridRows, galleryMotion, galleryPauseHover, galleryScale, gallerySpeed, galleryWidth} from '../site/about-model';
import {logoGap, logoScale} from '../site/logo-model';
import {useState} from 'react';
import {Block,Site,contentForLayout,settingsForLayout,blockLayouts,buttonIconSide,ButtonData} from '../site/blocks';
import {reviewLayout,reviewLayoutName,type ReviewLayout} from '../site/reviews';
import {menuButtons} from './workspace';
import {Destination,useEditScope} from './fields';
import {SidebarSelect as Choice, SidebarSlider as RangeControl, UnitField} from './components/fields';
import {ContentBrowser,ButtonText,IconPosition} from './content-browser';
import {FooterEditor} from './footer-editor';
import {LayoutControls,TypographyControls,RefinedSpacingGroup} from './inspector';
import {HeroLayouts,PageEntry} from './navigation';
import {FooterColumn,SectionSettings,defaultColumns,equalWidths,normalizeSettings,resizeWidth} from '../site/settings';
export function SectionEditor({view,group,onGroup,site,pages,block,usage,footerDefaults,home,update,onFocusItem,onOpenPage}:{
  view:'Content'|'Appearance'; group:string|null; onGroup:(id:string|null)=>void; site:Site; pages:PageEntry<Site>[]; block:Block; usage:import('../media/usage').MediaUsageIndex; footerDefaults:FooterColumn[]; home:boolean; update:(patch:Partial<Site>)=>void; onFocusItem?:(id:string|null)=>void; onOpenPage?:(id:string)=>void;
}) {
  const [textTarget,setTextTarget]=useState<'heading'|'body'>('heading');
  const [activeHeaderButtonTab, setActiveHeaderButtonTab] = useState<number>(0);
  const settings=block.settings||{columns:defaultColumns(block.type)};
  const change=(patch:Partial<import('../site/blocks').BlockContent>)=>update({blocks:site.blocks.map(item=>item.id===block.id?{...item,content:{...item.content,...patch}}:item)});
  const changeSettings=(value:SectionSettings)=>update({blocks:site.blocks.map(item=>item.id===block.id?{...item,settings:value}:item)});
  const changeBlock=(patch:Partial<Block>)=>{if(patch.layout){const next=contentForLayout(block,patch.layout);if(next!==block.content)patch.content=next;patch.settings=settingsForLayout(block.type,patch.layout,settings);}update({blocks:site.blocks.map(item=>item.id===block.id?{...item,...patch}:item)});};
  const changeLayout=(value:SectionSettings)=>{
    if(block.type==='solutions'&&block.layout==='Numbered steps'){const count=Math.min(5,Math.max(3,value.columns||5)),items=block.content.items,next=items.length>=count?items:[...items,...Array.from({length:count-items.length},()=>({title:'',description:'',icon:'check' as const}))];update({blocks:site.blocks.map(item=>item.id===block.id?{...item,settings:{...value,columns:count,widths:equalWidths(count)},content:{...item.content,items:next}}:item)});return;}
    changeSettings(value);
  };
  if (block.type === 'footer') return <FooterEditor
    view={view} block={block} site={site} pages={pages}
    defaults={footerDefaults} update={update}/>;
  if(view==='Content')return <ContentBrowser block={block} site={site} pages={pages} update={update} change={change} footerDefaults={footerDefaults} usage={usage} group={group} onOpen={onGroup} home={home} onFocusItem={onFocusItem} onOpenPage={onOpenPage}/>;
  if (['proof', 'logos', 'about', 'services'].includes(block.type)) return <UniversalSectionInspector key={block.id} block={block} home={home} onResetLayout={()=>changeBlock({layout:'Text and photo',settings:{...settings,columns:2,widths:equalWidths(2)},content:{...block.content,buttonCount:undefined,headAlign:undefined,photoSide:undefined}})} changeLayout={layout=>changeBlock({layout})} changeSettings={changeSettings} change={change}/>;
  const singleLayout=['Price list','Promise band','One message','One large quote','Accordion','Scrolling row','Heading and slider','Signals','Sliding gallery'].includes(block.layout);
  const gridSection=!singleLayout&&!['header','hero','promo'].includes(block.type);
  const media=block.content.media;
  const heroLayout = block.layout as 'split' | 'center' | 'image' | 'short' | 'story';
  const headerButtonCount = site.headerButtonCount ?? 1;
  const headerButtons = menuButtons(site);
  const activeHeaderIdx = Math.min(activeHeaderButtonTab, Math.max(0, headerButtonCount - 1));
  const currentHeaderButton = headerButtons[activeHeaderIdx];
  const updateHeaderButton = (patch: Partial<ButtonData>) => {
    const next = [...headerButtons];
    next[activeHeaderIdx] = { ...next[activeHeaderIdx], ...patch };
    update({ headerButtons: next });
  };
  return <>
    {block.type==='header'&&<>
      <Choice label="Menu look" value={site.headerStyle} onChange={headerStyle=>update({headerStyle})} options={[{value:'pill',label:'Rounded menu'},{value:'rounded',label:'Soft corners'},{value:'standard',label:'Standard bar'}]}/>
      <Choice label="Stays on screen" value={site.headerSticky?'yes':'no'} onChange={v=>update({headerSticky:v==='yes'})} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}/>
      <Choice label="Photo behind the menu" value={site.headerOverlay?'yes':'no'} onChange={v=>update({headerOverlay:v==='yes'})} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}/>
      <Choice label="Menu background" value={site.headerBackground!==false?'yes':'no'} onChange={v=>update({headerBackground:v==='yes'})} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}/>
      <Choice label="Extra buttons" value={String(headerButtonCount)} onChange={v=>update({headerButtonCount:Number(v) as 0|1|2})} options={[{value:'0',label:'None'},{value:'1',label:'One'},{value:'2',label:'Two'}]}/>
      {site.headerStyle!=='standard'&&<Choice label="Where those buttons sit" value={site.headerButtonPlace||'inside'} onChange={headerButtonPlace=>update({headerButtonPlace})} options={[{value:'inside',label:'Inside the menu'},{value:'beside',label:'Beside the menu'}]}/>}
      {headerButtonCount > 0 && <>
        {headerButtonCount > 1 && (
          <div className="segmented button-selector" role="group" aria-label="Button selection">
            {[0, 1].map(i => <button key={i} type="button" aria-pressed={activeHeaderIdx === i} onClick={() => setActiveHeaderButtonTab(i)}>{i === 0 ? "Primary" : "Secondary"}</button>)}
          </div>
        )}
        {currentHeaderButton && (
          <div className="action-editor" key={activeHeaderIdx}>
            <ButtonText button={currentHeaderButton} onLabel={label => updateHeaderButton({ label })} onIcon={icon => updateHeaderButton({ icon })}/>
            {currentHeaderButton.icon !== 'none' && <IconPosition value={buttonIconSide(currentHeaderButton)} onChange={iconPosition => updateHeaderButton({ iconPosition })}/>}
            <Destination label="When clicked" value={currentHeaderButton.href} onChange={href => updateHeaderButton({ href })} sections={site.blocks}/>
          </div>
        )}
      </>}
      <p className="helper-text">Photo behind the menu puts the menu over the hero. Turn off Menu background to let the photo show through.</p>
    </>}
    {block.type!=='header'&&<><LayoutControls value={settings} change={changeLayout} max={gridSection?(['proof','contact','quote'].includes(block.type)?2:5):1} min={block.type==='solutions'&&block.layout==='Numbered steps'?3:1} legend={block.type==='solutions'&&block.layout==='Numbered steps'?'Steps':'Columns'}/><button type="button" className="reset-style" onClick={()=>changeSettings({columns:singleLayout?1:['proof','contact','quote','closing'].includes(block.type)?2:defaultColumns(block.type)})}>Reset section layout</button><div className="editor-divider"/></>}
    {['header','footer'].includes(block.type)&&!home&&<p className="helper-text">Menu colors come from Home. Page appearance is in Page settings and changes this page only.</p>}
    {block.type==='hero'&&<>
      <HeroLayouts site={{...site,layout:heroLayout}} change={layout=>changeBlock({layout})}/>
      <Choice label="Height" value={block.content.height||'standard'} onChange={height=>change({height})} options={[{value:'standard',label:'Standard'},{value:'full',label:'Full screen'}]}/>
      <Choice label="Text alignment" value={block.content.align||'left'} onChange={align=>change({align})} options={[{value:'left',label:'Left'},{value:'center',label:'Center'}]}/>
      {block.id==='hero'&&home&&<Choice label="Business details" value={block.content.showBusiness?'bottom':'off'} onChange={v=>change({showBusiness:v==='bottom'})} options={[{value:'off',label:'Off'},{value:'bottom',label:'Bottom'}]}/>}
      <RangeControl label="Image darkness" min={0} max={80} value={block.content.darkness??36} text={String(block.content.darkness??36)} onChange={darkness=>change({darkness})}/>
    </>}
    {block.type==='reviews'&&<><Choice label="Layout" value={reviewLayout(block.layout)} onChange={(value:ReviewLayout)=>changeBlock({layout:reviewLayoutName(value)})} options={[{value:'featured',label:'Featured'},{value:'grid',label:'Grid'},{value:'carousel',label:'Carousel'}]}/><Choice label="Review text" value={block.content.reviewText==='full'?'full':'excerpt'} onChange={value=>change({reviewText:value as 'full'|'excerpt'})} options={[{value:'excerpt',label:'Excerpt'},{value:'full',label:'Full'}]}/><Choice label="Avatars" value={block.content.avatar||'circle'} onChange={value=>change({avatar:value as 'off'|'circle'|'square'})} options={[{value:'circle',label:'Circles'},{value:'square',label:'Squares'},{value:'off',label:'Hidden'}]}/><Choice label="Names" value={block.content.namePrivacy?'initials':'full'} onChange={value=>change({namePrivacy:value==='initials'})} options={[{value:'full',label:'Full name'},{value:'initials',label:'Initials'}]}/><Choice label="Card surface" value={block.content.cardFace==='plain'?'plain':'filled'} onChange={value=>change({cardFace:value as 'filled'|'plain'})} options={[{value:'filled',label:'Filled'},{value:'plain',label:'Plain'}]}/><Choice label="Card padding" value={block.content.cardPad==='compact'?'compact':'comfortable'} onChange={value=>change({cardPad:value as 'comfortable'|'compact'})} options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'}]}/><label className="visibility-toggle"><span>Show stars</span><input type="checkbox" checked={block.content.showRating!==false} onChange={e=>change({showRating:e.target.checked})}/></label><label className="visibility-toggle"><span>Show date</span><input type="checkbox" checked={block.content.showDate!==false} onChange={e=>change({showDate:e.target.checked})}/></label><label className="visibility-toggle"><span>Show service</span><input type="checkbox" checked={block.content.showService!==false} onChange={e=>change({showService:e.target.checked})}/></label><label className="visibility-toggle"><span>Show source</span><input type="checkbox" checked={block.content.showSource!==false} onChange={e=>change({showSource:e.target.checked})}/></label><p className="helper-text">Column count and spacing are above. Text size and color are below. A wide layout steps down to two cards, then one, when the section gets narrow. Five columns scroll sideways instead of squeezing.</p></>}
    {block.type!=='header'&&block.type!=='hero'&&block.type!=='reviews'&&<label className="field"><span>Section layout</span><select aria-label="Section layout" value={block.layout} onChange={e=>changeBlock({layout:e.target.value})}>{blockLayouts[block.type].map(layout=><option key={layout}>{layout}</option>)}</select></label>}
    {block.type==='trust'&&block.layout==='Signals'&&<><Choice label="Background" value={block.content.showMedia===false?'none':(block.content.showMedia||media.src)?'photo':'none'} onChange={v=>change({showMedia:v==='photo'})} options={[{value:'none',label:'None'},{value:'photo',label:'Photo'}]}/><Choice label="Photo side" value={block.content.photoSide==='left'?'left':'right'} onChange={v=>change({photoSide:v as 'left'|'right'})} options={[{value:'right',label:'Right'},{value:'left',label:'Left'}]}/></>}
    {block.type==='trust'&&block.layout==='Signals'&&block.content.showMedia!==false&&(!!block.content.showMedia||!!media.src)&&<>
      <Choice label="Fit" value={media.fit==='contain'?'contain':'cover'} onChange={v=>change({media:{...media,fit:v as 'cover'|'contain'}})} options={[{value:'cover',label:'Cover'},{value:'contain',label:'Contain'}]}/>
      <RangeControl label="Image position, horizontal" min={0} max={100} value={media.x??50} text={String(media.x??50)} onChange={x=>change({media:{...media,x}})}/>
      <RangeControl label="Image position, vertical" min={0} max={100} value={media.y??50} text={String(media.y??50)} onChange={y=>change({media:{...media,y}})}/>
      <label className="field"><span>Section color</span><input aria-label="Section color" type="color" value={/^#[0-9a-f]{6}$/i.test(block.content.background||'')?block.content.background!:'#141922'} onChange={e=>change({background:e.target.value})}/></label>
      <Choice label="Fade" value={block.content.fade===false?'off':'on'} onChange={v=>change({fade:v==='on'})} options={[{value:'on',label:'On'},{value:'off',label:'Off'}]}/>
      <Choice label="Direction" value={block.content.fadeDirection==='rtl'?'rtl':'ltr'} onChange={v=>change({fadeDirection:v as 'ltr'|'rtl'})} options={[{value:'ltr',label:'Left to right'},{value:'rtl',label:'Right to left'}]}/>
      <RangeControl label="Fade width" min={0} max={100} value={Math.round(block.content.fadeWidth??35)} text={String(Math.round(block.content.fadeWidth??35))} onChange={fadeWidth=>change({fadeWidth})}/>
      <RangeControl label="Fade strength" min={0} max={100} value={Math.round(block.content.fadeStrength??100)} text={String(Math.round(block.content.fadeStrength??100))} onChange={fadeStrength=>change({fadeStrength})}/>
      <RangeControl label="Gradient" min={0} max={80} value={block.content.darkness??64} text={String(block.content.darkness??64)} onChange={darkness=>change({darkness})}/>
    </>}
    <TypographyControls value={settings} change={changeSettings} target={textTarget} setTarget={setTextTarget}/>
    {!['header','hero','footer'].includes(block.type)&&<p className="helper-text">Use the type settings above for text. Keep one clear main action for visitors.</p>}
  </>;
}


type InspectorProps = {
  block: Block;
  home?: boolean;
  changeLayout: (layout: string) => void;
  changeSettings: (settings: SectionSettings) => void;
  change: (patch: Partial<BlockContent>) => void;
  onResetLayout: () => void;
  start?: string;
};

const inspectorSchema: Record<string, {layout: (props: InspectorProps) => ReactNode; gapLabel: string}> = {
  about: {layout: AboutLayout, gapLabel: 'Between items'},
  services: {layout: ServicesLayout, gapLabel: 'Between cards'},
  proof: {layout: ProofLayout, gapLabel: 'Between columns'},
  logos: {layout: LogosLayout, gapLabel: 'Between logos'},
};

export function UniversalSectionInspector(props: InspectorProps) {
  const {block, changeSettings, change, home = true, start = 'layout'} = props;
  const [open, setOpen] = useState(start);
  const [target, setTarget] = useState<'heading' | 'body'>('heading');
  const schema = inspectorSchema[block.type];
  const contract = layoutContract(block.type, block.layout);
  if (!schema) return null;
  const groups = [
    {id: 'layout', label: 'Layout', icon: Grid2X2},
    ...(block.type === 'logos' ? [{id: 'sizing', label: 'Logo sizing', icon: Scaling}] : []),
    {id: 'spacing', label: 'Spacing', icon: MoveVertical},
    ...(contract.showsTitle || contract.allowsBody ? [{id: 'typography', label: 'Typography', icon: Type}] : []),
    ...(block.type === 'services' ? [{id: 'cards', label: 'Card appearance', icon: SquareStack}] : []),
  ];
  return <>
    {block.type === 'services' && !home && <p className="helper-text">Layout on this page is independent of Home. Home can use Media cards while All services uses Icon cards or a Simple list.</p>}
    <RefinedStyleShell groups={groups} open={groups.some(group => group.id === open) ? open : 'layout'} setOpen={setOpen}>{id => {
      if (id === 'layout') return schema.layout(props);
      if (id === 'typography') return <TypographyControls compact value={block.settings} change={changeSettings} target={target} setTarget={setTarget}/>;
      if (id === 'spacing') return <RefinedSpacingGroup gapLabel={schema.gapLabel} gap={block.type === 'logos' ? logoGap(block.settings) : block.type === 'proof' ? block.settings.gap ?? 24 : block.settings.gap} padding={block.type === 'proof' ? block.settings.padding ?? 72 : block.settings.padding} showGap={!['Price list', 'Promise band'].includes(block.layout)} settings={block.settings} onChange={changeSettings}>
        {block.type === 'proof' && <button type="button" className="refined-reset" onClick={()=>changeSettings({...block.settings,gap:undefined,padding:undefined})}><RotateCcw size={16} aria-hidden="true"/>Reset spacing</button>}
      </RefinedSpacingGroup>;
      if (id === 'sizing') return <>
        <UnitField label="Logo height" unit="%" value={block.content.logoScale ?? 70} min={40} max={90} change={value=>change({logoScale:Math.max(40,Math.min(90,Math.round(value)))})}/>
        <p className="helper-text">Percent of the maximum artwork. Desktop slot 90px, up to 200×60. Tablet slot 72px, up to 160×48. Mobile slot 60px, up to 140×40.</p>
        <div className="logo-size-diagram" data-editor-only aria-hidden="true"><span style={{height:`${logoScale(block.content.logoScale)}%`}}/><small>{logoScale(block.content.logoScale)}% of the slot</small></div>
        <label className="switch-row"><span>Monochrome</span><input type="checkbox" checked={!!block.content.monochrome} onChange={event=>change({monochrome:event.target.checked || undefined})}/></label>
        <p className="helper-text">The saved file stays in color. Monochrome only changes the row.</p>
      </>;
      return block.layout === 'Photo cards' ? <>
        <RangeControl label="Gradient" min={0} max={80} value={block.content.darkness ?? 64} onChange={darkness=>change({darkness})}/>
        <Choice label="Arrow" value={block.content.arrowCircle === false ? 'plain' : 'circle'} onChange={value=>change({arrowCircle:value === 'circle'})} options={[{value:'circle',label:'Circle'},{value:'plain',label:'Plain'}]}/>
      </> : <p className="helper-text">{block.layout === 'Price list' ? 'Simple list uses text hierarchy without card chrome.' : 'Icon cards use the service icon and text. Add media on Content when a photo layout needs it.'}</p>;
    }}</RefinedStyleShell>
  </>;
}
const aboutLayouts = [
  {id: 'Story and photos', label: 'Story & gallery'},
  {id: 'Photos only', label: 'Gallery grid'},
  {id: 'Sliding gallery', label: 'Sliding gallery'}
] as const;


function ScaleField({value, onChange}: {value: number; onChange: (value: number) => void}) {
  const scope = useEditScope();
  const label = `${value.toFixed(1)}×`;
  return (
    <label className="field gallery-scale-field">
      <span className="gallery-scale-head">
        <span>Image scale</span>
        <output aria-live="polite">{label}</output>
      </span>
      <input
        aria-label="Image scale"
        aria-valuemin={1}
        aria-valuemax={2}
        aria-valuenow={value}
        aria-valuetext={label}
        type="range"
        min={1}
        max={2}
        step={0.1}
        value={value}
        {...scope}
        onChange={event => onChange(galleryScale(Number(event.target.value)))}
      />
      <span className="speed-ends" aria-hidden="true"><span>1×</span><span>2×</span></span>
    </label>
  );
}


function AboutLayout({block, changeLayout, changeSettings, change}: InspectorProps) {
  const sliding = block.layout === 'Sliding gallery';
  const grid = layoutContract(block.type, block.layout).grid;
  const photosOnly = !!grid;
  const story = block.layout === 'Story and photos';
  const width = galleryWidth(block.content.galleryWidth);
  const scale = galleryScale(block.content.galleryScale);
  const motion = galleryMotion(block.content.galleryMotion);
  const speed = gallerySpeed(block.content.gallerySpeed);
  const pauseHover = galleryPauseHover(block.content.galleryPauseHover);
  const gridRows = galleryGridRows(block.content.galleryRows);
  const featured = galleryFeaturedCount(block.content.storyFeatured);
  return (
            <>
              <LayoutPicker
                legend="Section layout"
                name="about-layout"
                value={block.layout}
                onChange={changeLayout}
                options={aboutLayouts.map(option => ({value: option.id, label: option.label, thumb: <AboutSketch layout={option.id} />}))}
              />
              {story && (
                <Choice
                  label="Featured photos"
                  value={String(featured)}
                  onChange={value => change({storyFeatured: value === '1' ? 1 : 2})}
                  options={[{value: '1', label: 'One'}, {value: '2', label: 'Two'}]}
                />
              )}
              {photosOnly && (
                <>
                  <LayoutControls value={block.settings} change={next => changeSettings({...next, columns: Math.min(grid!.maxCols, Math.max(1, next.columns || grid!.defaultCols)), widths: equalWidths(Math.min(grid!.maxCols, Math.max(1, next.columns || grid!.defaultCols)))})} min={1} max={grid!.maxCols} legend="Columns" />
                  <Choice
                    label="Rows"
                    value={String(gridRows)}
                    onChange={value => change({galleryRows: Number(value)})}
                    options={Array.from({length: grid!.maxRows}, (_, index) => index + 1).map(n => ({value: String(n), label: String(n)}))}
                  />
                  <p className="helper-text">Shows columns × rows photos. Extra photos stay in Content.</p>
                </>
              )}
              {sliding && (
                <>
                  <Choice
                    label="Gallery width"
                    value={width}
                    onChange={value => change({galleryWidth: value})}
                    options={[{value: 'boxed', label: 'Boxed'}, {value: 'full', label: 'Full width'}]}
                  />
                  <ScaleField value={scale} onChange={galleryScaleValue => change({galleryScale: galleryScaleValue})} />
                  <p className="helper-text">Scale sizes every frame. Artwork stays proportional inside the frame.</p>
                  <Choice
                    label="Movement"
                    value={motion}
                    onChange={value => change({galleryMotion: value})}
                    options={[{value: 'still', label: 'Still'}, {value: 'loop', label: 'Loop'}]}
                  />
                  {motion === 'loop' && (
                    <>
                      <label className="field">
                        <span>Speed: {speed === 1 ? 'Slow' : speed === 5 ? 'Fast' : speed}</span>
                        <input aria-label="Speed" type="range" min={1} max={5} step={1} value={speed} onChange={event => change({gallerySpeed: Number(event.target.value)})} />
                        <span className="speed-ends" aria-hidden="true"><span>Slow</span><span>Fast</span></span>
                      </label>
                      <label className="switch-row">
                        <span>Pause on hover</span>
                        <input type="checkbox" role="switch" checked={pauseHover} onChange={event => change({galleryPauseHover: event.target.checked})} />
                      </label>
                      <p className="helper-text">Rows pause on hover or focus. Reduced motion uses Still.</p>
                    </>
                  )}
                </>
              )}
            </>
  );
}

function AboutSketch({layout}: {layout: string}) {
  if (layout === 'Photos only') {
    return (
      <LayoutThumb>
        {[0, 1, 2].map(index => <rect key={`a${index}`} className="layout-shape" x={6 + index * 18} y="8" width="15" height="9" rx="2" />)}
        {[0, 1, 2].map(index => <rect key={`b${index}`} className="layout-shape" x={6 + index * 18} y="20" width="15" height="9" rx="2" />)}
      </LayoutThumb>
    );
  }
  if (layout === 'Sliding gallery') {
    return (
      <LayoutThumb>
        {[0, 1, 2, 3].map(index => <rect key={`t${index}`} className="layout-shape" x={4 + index * 14} y="8" width="12" height="8" rx="2" />)}
        {[0, 1, 2, 3].map(index => <rect key={`b${index}`} className="layout-shape" x={8 + index * 14} y="20" width="12" height="8" rx="2" />)}
      </LayoutThumb>
    );
  }
  return (
    <LayoutThumb>
      <rect className="layout-shape-strong" x="6" y="10" width="18" height="3" rx="1.5" />
      <rect className="layout-shape" x="6" y="16" width="14" height="2.5" rx="1.25" />
      <rect className="layout-shape" x="6" y="22" width="12" height="2.5" rx="1.25" />
      <rect className="layout-shape" x="32" y="8" width="26" height="20" rx="3" />
    </LayoutThumb>
  );
}

const servicesLayouts = [
  {id: 'Icon cards', label: 'Icon cards'},
  {id: 'Photo cards', label: 'Media cards'},
  {id: 'Price list', label: 'Simple list'}
] as const;


function ServicesLayout({block, changeLayout, changeSettings}: InspectorProps) {
  const listed = block.layout === 'Price list';
  const columns = Math.min(4, Math.max(2, block.settings.columns || defaultColumns('services')));
  return (
              <>
                <LayoutPicker
                  legend="Section layout"
                  name="services-layout"
                  value={block.layout}
                  onChange={changeLayout}
                  options={servicesLayouts.map(option => ({value: option.id, label: option.label, thumb: <ServicesSketch layout={option.id} />}))}
                />
                {!listed && (
                  <Choice
                    label="Desktop columns"
                    value={String(columns) as '2' | '3' | '4'}
                    onChange={value => {
                      const count = Number(value) as 2 | 3 | 4;
                      changeSettings({...block.settings, columns: count, widths: equalWidths(count)});
                    }}
                    options={[{value: '2', label: '2'}, {value: '3', label: '3'}, {value: '4', label: '4'}]}
                  />
                )}
              </>
  );
}

function ServicesSketch({layout}: {layout: string}) {
  if (layout === 'Photo cards') {
    return (
      <LayoutThumb>
        {[0, 1, 2].map(index => (
          <g key={index}>
            <rect className="layout-shape" x={6 + index * 19} y="7" width="16" height="10" rx="2" />
            <rect className="layout-shape-strong" x={8 + index * 19} y="20" width="12" height="2" rx="1" />
            <rect className="layout-shape" x={8 + index * 19} y="24" width="10" height="2" rx="1" />
          </g>
        ))}
      </LayoutThumb>
    );
  }
  if (layout === 'Price list') {
    return (
      <LayoutThumb>
        {[0, 1, 2].map(index => (
          <g key={index}>
            <rect className="layout-shape-strong" x="8" y={8 + index * 8} width="28" height="2.5" rx="1.25" />
            <rect className="layout-shape" x="40" y={8 + index * 8} width="16" height="2.5" rx="1.25" />
          </g>
        ))}
      </LayoutThumb>
    );
  }
  return (
    <LayoutThumb>
      {[0, 1, 2].map(index => (
        <g key={index}>
          <circle className="layout-shape-strong" cx={14 + index * 19} cy="12" r="4" />
          <rect className="layout-shape-strong" x={8 + index * 19} y="20" width="12" height="2" rx="1" />
          <rect className="layout-shape" x={8 + index * 19} y="24" width="10" height="2" rx="1" />
        </g>
      ))}
    </LayoutThumb>
  );
}

function ProofLayout({block, changeLayout, changeSettings, change, onResetLayout}: InspectorProps) {
  const value = block.settings;
  const s = normalizeSettings(value);
  const single = block.layout === 'Promise band';
  const resetLayout = onResetLayout;
  const firstIsMedia = block.layout === 'Photo and reasons' && block.content.photoSide !== 'right';

  const textWidth = firstIsMedia ? s.widths![1] : s.widths![0];
  const mediaWidth = firstIsMedia ? s.widths![0] : s.widths![1];
  const isMoreText = textWidth >= 55;
  const isMoreMedia = mediaWidth >= 55;
  const isEqual = !isMoreText && !isMoreMedia;

  return <>
              {true && (
                <>
                  <LayoutPicker
                    legend="Section layout"
                    name="proof-layout"
                    value={block.layout}
                    onChange={changeLayout}
                    options={[
                      {value: 'Text and photo', label: 'Text + media', thumb: <TextMediaThumb />},
                      {value: 'Promise band', label: 'Promise band', thumb: <PromiseBandThumb />},
                      {value: 'Photo and reasons', label: 'Media + reasons', thumb: <MediaReasonsThumb />}
                    ]}
                  />

                  {!single && (
                    <>
                      <fieldset className="refined-field-group">
                        <legend>Arrangement</legend>
                        <div className="segmented-arrangement" role="group" aria-label="Arrangement">
                          <button
                            type="button"
                            className={s.columns === 1 ? 'is-active' : ''}
                            aria-pressed={s.columns === 1}
                            onClick={() => changeSettings({...value, columns: 1, widths: [100]})}
                          >
                            Stacked
                          </button>
                          <button
                            type="button"
                            className={s.columns === 2 ? 'is-active' : ''}
                            aria-pressed={s.columns === 2}
                            onClick={() =>
                              changeSettings({
                                ...value,
                                columns: 2,
                                widths: s.widths && s.widths.length === 2 ? s.widths : equalWidths(2)
                              })
                            }
                          >
                            Side by side
                          </button>
                        </div>
                      </fieldset>

                      {s.columns === 2 && (
                        <>
                          <fieldset className="refined-field-group">
                            <legend>Balance</legend>
                            <div className="balance-grid" role="group" aria-label="Balance">
                              <button
                                type="button"
                                className={`balance-card ${isMoreText ? 'is-selected' : ''}`}
                                aria-pressed={isMoreText}
                                onClick={() => changeSettings({...value, widths: firstIsMedia ? [38, 62] : [62, 38]})}
                              >
                                <BalanceThumb left={24} right={14} />
                                <span>More text</span>
                              </button>
                              <button
                                type="button"
                                className={`balance-card ${isEqual ? 'is-selected' : ''}`}
                                aria-pressed={isEqual}
                                onClick={() => changeSettings({...value, widths: [50, 50]})}
                              >
                                <BalanceThumb left={18} right={18} />
                                <span>Equal</span>
                              </button>
                              <button
                                type="button"
                                className={`balance-card ${isMoreMedia ? 'is-selected' : ''}`}
                                aria-pressed={isMoreMedia}
                                onClick={() => changeSettings({...value, widths: firstIsMedia ? [62, 38] : [38, 62]})}
                              >
                                <BalanceThumb left={14} right={24} />
                                <span>More media</span>
                              </button>
                            </div>
                            <p className="helper-text">Adjusts the space shared by text and media.</p>
                          </fieldset>

                          <details className="precise-width-disclosure">
                            <summary className="precise-width-toggle">
                              <span className="precise-width-title">
                                <SlidersHorizontal size={14} aria-hidden="true" />
                                <span>Precise width</span>
                              </span>
                              <ChevronDown size={16} className="fold-chevron" aria-hidden="true" />
                            </summary>
                            <div className="precise-width-body">
                              <div className="width-fields">
                                <label className="field">
                                  <span>{firstIsMedia ? 'Media %' : 'Text %'}</span>
                                  <span className="unit-input">
                                    <input
                                      aria-label="Column 1 width percent"
                                      type="number"
                                      min={10}
                                      max={90}
                                      step={1}
                                      value={Math.round(s.widths![0] * 10) / 10}
                                      onChange={event => {
                                        if (event.target.value !== '') {
                                          changeSettings({
                                            ...value,
                                            widths: resizeWidth(s.widths!, 0, Number(event.target.value))
                                          });
                                        }
                                      }}
                                    />
                                    <small>%</small>
                                  </span>
                                </label>
                                <label className="field">
                                  <span>{firstIsMedia ? 'Text %' : 'Media %'}</span>
                                  <span className="unit-input">
                                    <input
                                      aria-label="Column 2 width percent"
                                      type="number"
                                      min={10}
                                      max={90}
                                      step={1}
                                      value={Math.round(s.widths![1] * 10) / 10}
                                      onChange={event => {
                                        if (event.target.value !== '') {
                                          changeSettings({
                                            ...value,
                                            widths: resizeWidth(s.widths!, 1, Number(event.target.value))
                                          });
                                        }
                                      }}
                                    />
                                    <small>%</small>
                                  </span>
                                </label>
                              </div>
                              <p className="helper-text total-note">Total 100%</p>
                              <p className="helper-text">Columns stack on smaller screens.</p>
                            </div>
                          </details>
                        </>
                      )}
                    </>
                  )}

                  {block.layout === 'Photo and reasons' && (
                    <>
                      <Choice
                        label="Buttons"
                        value={String(block.content.buttonCount ?? 2)}
                        onChange={v => change({buttonCount: Number(v) as 0 | 1 | 2})}
                        options={[
                          {value: '2', label: 'Both'},
                          {value: '1', label: 'One'},
                          {value: '0', label: 'None'}
                        ]}
                      />
                      <Choice
                        label="Intro alignment"
                        value={block.content.headAlign || 'center'}
                        onChange={v => change({headAlign: v as 'top' | 'center' | 'bottom'})}
                        options={[
                          {value: 'top', label: 'Top'},
                          {value: 'center', label: 'Center'},
                          {value: 'bottom', label: 'Bottom'}
                        ]}
                      />
                      <Choice
                        label="Media side"
                        value={block.content.photoSide || 'left'}
                        onChange={v => change({photoSide: v as 'left' | 'right'})}
                        options={[
                          {value: 'left', label: 'Left'},
                          {value: 'right', label: 'Right'}
                        ]}
                      />
                    </>
                  )}
                  <button type="button" className="refined-reset" onClick={resetLayout}>
                    <RotateCcw size={16} aria-hidden="true" />
                    Reset layout
                  </button>
                </>
              )}

  </>;
}

function TextMediaThumb() {
  return <LayoutThumb><rect className="layout-shape-strong" x="7" y="11" width="18" height="3" rx="1.5"/><rect className="layout-shape" x="7" y="17" width="14" height="2.5" rx="1.25"/><rect className="layout-shape" x="7" y="22" width="11" height="2.5" rx="1.25"/><rect className="layout-shape" x="30" y="8" width="27" height="20" rx="3"/></LayoutThumb>;
}
function PromiseBandThumb() {
  return <LayoutThumb>{[0, 1, 2].map(c => <g key={c} transform={`translate(${6 + c * 19} 0)`}><rect className="layout-shape-strong" x="1" y="11" width="14" height="3" rx="1.5"/><rect className="layout-shape" x="0" y="17" width="16" height="2.5" rx="1.25"/><rect className="layout-shape" x="2" y="22" width="12" height="2.5" rx="1.25"/></g>)}</LayoutThumb>;
}
function MediaReasonsThumb() {
  return <LayoutThumb><rect className="layout-shape" x="6" y="7" width="22" height="22" rx="3"/>{[0, 1, 2].map(r => <g key={r}><circle className="layout-shape-strong" cx="34" cy={12 + r * 7} r="1.6"/><rect className="layout-shape" x="38" y={10.5 + r * 7} width={r === 2 ? 14 : 18} height="2.5" rx="1.25"/></g>)}</LayoutThumb>;
}

function BalanceThumb({left, right}: {left: number; right: number}) {
  return (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none" aria-hidden="true">
      <rect width="48" height="28" rx="4" fill="#f1f5f9" />
      <rect x="4" y="6" width={left} height="16" rx="2" fill="#cbd5e1" />
      <rect x={6 + left} y="6" width={right} height="16" rx="2" fill="#cbd5e1" />
    </svg>
  );
}

const logosLayouts = [
  {id: 'Still row', label: 'Still row'},
  {id: 'Scrolling row', label: 'Scrolling row'},
  {id: 'Heading and slider', label: 'Heading + slider'}
] as const;


function LogosLayout({block, changeLayout, change}: InspectorProps) {
  return (
            <>
              <LayoutPicker
                legend="Section layout"
                name="logos-layout"
                value={block.layout}
                onChange={changeLayout}
                options={logosLayouts.map(option => ({value: option.id, label: option.label, thumb: <LogosSketch layout={option.id} />}))}
              />
              {block.layout === 'Heading and slider' && <Choice label="Heading" value={block.content.showHeading === false ? 'hide' : 'show'} onChange={value => change({showHeading: value === 'show'})} options={[{value: 'show', label: 'Show'}, {value: 'hide', label: 'Hide'}]} />}
              {block.layout === 'Scrolling row' && (
                <>
                  <Choice
                    label="Movement"
                    value={block.content.logoMotion === 'still' ? 'still' : 'loop'}
                    onChange={value => change({logoMotion: value as 'still' | 'loop'})}
                    options={[{value: 'still', label: 'Still'}, {value: 'loop', label: 'Loop'}]}
                  />
                  {block.content.logoMotion !== 'still' && (
                    <label className="switch-row">
                      <span>Pause on hover</span>
                      <input type="checkbox" role="switch" checked={block.content.logoPauseHover !== false} onChange={event => change({logoPauseHover: event.target.checked})} />
                    </label>
                  )}
                  <p className="helper-text">Motion is controlled here. The live page has no Pause button. Reduced motion uses Still.</p>
                </>
              )}
            </>
  );
}

function LogosSketch({layout}: {layout: string}) {
  if (layout === 'Scrolling row') {
    return (
      <LayoutThumb>
        <path className="layout-shape-strong" d="M9 13 L5 18 L9 23 L10.4 23 L6.4 18 L10.4 13 Z" />
        {[0, 1, 2].map(index => <rect key={index} className="layout-shape" x={14 + index * 12} y="14" width="10" height="8" rx="2" />)}
        <path className="layout-shape-strong" d="M55 13 L59 18 L55 23 L53.6 23 L57.6 18 L53.6 13 Z" />
      </LayoutThumb>
    );
  }
  if (layout === 'Heading and slider') {
    return (
      <LayoutThumb>
        <rect className="layout-shape-strong" x="6" y="8" width="16" height="3" rx="1.5" />
        <rect className="layout-shape" x="6" y="14" width="12" height="2.5" rx="1.25" />
        <rect className="layout-shape" x="24" y="20" width="10" height="7" rx="2" />
        <rect className="layout-shape" x="36" y="20" width="10" height="7" rx="2" />
        <path className="layout-shape-strong" d="M51 20.5 L47 24 L51 27.5 L52.2 27.5 L48.2 24 L52.2 20.5 Z" />
        <path className="layout-shape-strong" d="M56 20.5 L60 24 L56 27.5 L54.8 27.5 L58.8 24 L54.8 20.5 Z" />
      </LayoutThumb>
    );
  }
  return (
    <LayoutThumb>
      {[0, 1, 2].map(index => <rect key={index} className="layout-shape" x={8 + index * 16} y="8" width="13" height="7" rx="2" />)}
      {[0, 1].map(index => <rect key={index} className="layout-shape" x={16 + index * 16} y="20" width="13" height="7" rx="2" />)}
    </LayoutThumb>
  );
}
