import {useState, type ReactNode} from 'react';
import {AlignCenter, AlignLeft, AlignRight, ChevronDown, RotateCcw} from 'lucide-react';
import {fonts,normalizeSettings,resizeWidth,equalWidths,SectionSettings,TextStyle} from './settings';
import {useEditScope} from './fields';

export function LayoutControls({value,change,max=5,min=1,legend='Columns'}:{value:SectionSettings;change:(s:SectionSettings)=>void;max?:number;min?:number;legend?:string}) {
  const s=normalizeSettings(value),count=Math.max(min,Math.min(max,s.columns||min));
  return <><p className="settings-hint">{max>1?"Choose a layout, then adjust its widths. All items are kept when you change the column count.":"Adjust the space around this section. Its available layout choices appear below."}</p>
    {max>1&&<><fieldset className="column-presets"><legend>{legend}</legend>{Array.from({length:max-min+1},(_,i)=>min+i).map(n=><button key={n} aria-label={`${n} ${legend==='Steps'?'step':'column'}${n===1?'':'s'}`} aria-pressed={count===n} onClick={()=>change({...s,columns:n,widths:equalWidths(n)})}><span aria-hidden="true">{Array.from({length:n},(_,j)=><i key={j}/>)}</span>{n}</button>)}</fieldset>
      <div className="width-fields">{s.widths!.map((n,i)=><label key={i}>Column {i+1} %<input aria-label={`Column ${i+1} width percent`} type="number" min="10" max={100-10*(s.columns!-1)} step="1" value={Math.round(n*10)/10} disabled={s.columns===1} onChange={e=>change({...s,widths:resizeWidth(s.widths!,i,Number(e.target.value))})}/></label>)}</div>
      <p className="settings-hint">Columns become two on tablets and one on phones. You can also drag dividers on the desktop canvas.</p></>}
    {max>1&&<UnitField label="Space between columns (px)" value={s.gap!} min={0} max={80} change={gap=>change({...s,gap})}/>}
    <UnitField label="Top and bottom space (px)" value={s.padding??72} min={0} max={160} change={padding=>change({...s,padding})}/>
  </>;
}

export function UnitField({label,value,min,max,step=1,change,clear,unit,placeholder='Theme default'}:{label:string;value?:number;min:number;max:number;step?:number;change:(n:number)=>void;clear?:()=>void;unit?:string;placeholder?:string}) {
  const scope=useEditScope();
  return <label className="field"><span>{label}</span><span className="unit-input"><input type="number" min={min} max={max} step={step} value={value??''} placeholder={placeholder} {...scope} onChange={e=>{if(e.target.value!=='')change(Math.max(min,Math.min(max,Number(e.target.value))));else clear?.();}}/>{unit&&<small>{unit}</small>}</span></label>;
}

function ColorField({color,change,compact=false}:{color?:string;change:(value:string|undefined)=>void;compact?:boolean}) {
  const [draft,setDraft]=useState(color||'');
  const [seen,setSeen]=useState(color);
  if(seen!==color){setSeen(color);setDraft(color||'');}
  const scope=useEditScope();
  const valid=!draft||/^#[0-9a-f]{6}$/i.test(draft);
  if(compact) {
    return <div className="field">
      <span>Text color</span>
      <div className="compact-color-row">
        <label className="compact-color-picker-box" title="Choose color">
          <span className="color-swatch-circle" style={{backgroundColor:color||'#cbd5e1'}}/>
          <span className="color-value-label">{color||'Theme default'}</span>
          <ChevronDown size={14} className="color-picker-chevron" aria-hidden="true"/>
          <input aria-label="Text color picker" type="color" value={color||'#202532'} {...scope} onInput={e=>change(e.currentTarget.value)} onChange={e=>change(e.target.value)}/>
        </label>
        <button type="button" className="color-reset-action" aria-label="Reset color" title="Reset color" disabled={!color} onClick={()=>change(undefined)}>
          <RotateCcw size={14} aria-hidden="true"/>
        </button>
      </div>
    </div>;
  }
  return <div className="field"><span>Text color</span><div className="color-input"><input aria-label="Text color picker" type="color" value={color||'#f3f6fc'} {...scope} onInput={e=>change(e.currentTarget.value)} onChange={e=>change(e.target.value)}/><input aria-label="Text color hex" placeholder="Theme default" value={draft} maxLength={7} aria-invalid={!valid} {...scope} onChange={e=>{const next=e.target.value;setDraft(next);if(!next||/^#[0-9a-f]{6}$/i.test(next))change(next||undefined);}}/></div><small>{valid?(color||'Using theme color'):'Enter # and six color digits, such as #ccbb99.'}</small></div>;
}

export function TypographyControls({value,change,target,setTarget,compact=false}:{compact?:boolean;value:SectionSettings;change:(s:SectionSettings)=>void;target:'heading'|'body';setTarget:(s:'heading'|'body')=>void}) {
  const s=normalizeSettings(value),t=s[target]!,update=(patch:TextStyle)=>change({...value,[target]:{...t,...patch}});
  return <div className={compact?"refined-type":"typography-controls"}>
    {compact ? (
      <fieldset className="type-target"><legend>Text to style</legend><div className="segmented-target">{(['heading','body'] as const).map(item=><button key={item} type="button" className={target===item?'is-active':''} aria-pressed={target===item} onClick={()=>setTarget(item)}>{item==='heading'?'Headings':'Body'}</button>)}</div></fieldset>
    ) : (
      <label className="field"><span>Text to style</span><select aria-label="Text to style" value={target} onChange={e=>setTarget(e.target.value as 'heading'|'body')}><option value="heading">Headings</option><option value="body">Body text</option></select></label>
    )}
    <p className="settings-hint">{compact ? (t.family || t.size !== undefined || t.weight !== undefined || t.align || t.lineHeight !== undefined || t.tracking !== undefined || t.color ? 'Custom overrides apply to this section.' : 'Following theme.') : 'Use a clear heading and comfortable body text. Start with the theme defaults.'}</p>
    <label className="field"><span>Font family</span><select value={t.family||''} onChange={e=>update({family:e.target.value||undefined})}><option value="">Theme default</option>{Object.keys(fonts).map(f=><option key={f} value={f}>{({display:'Display',text:'Text'})[f as keyof typeof fonts]}</option>)}</select></label>
    <div className="type-dual-row">
      <UnitField label="Size" unit="px" placeholder={target==='heading'?'40':'18'} value={t.size} clear={()=>update({size:undefined})} min={10} max={96} change={size=>update({size})}/>
      <label className="field"><span>Weight</span><select value={t.weight||''} onChange={e=>update({weight:Number(e.target.value)||undefined})}><option value="">Theme default</option>{[300,400,500,600,700,800,900].map(n=><option key={n} value={n}>{n===400?'Regular':n===700?'Bold':n}</option>)}</select></label>
    </div>
    {compact ? (
      <fieldset className="type-align"><legend>Alignment</legend><div className="segmented-align">{[['','Auto',null],['left','Align left',AlignLeft],['center','Align center',AlignCenter],['right','Align right',AlignRight]].map(([align,label,Icon])=><button key={String(align)} type="button" title={String(label)} aria-label={String(label)} className={(!t.align && !align) || t.align === align ? 'is-active' : ''} aria-pressed={(!t.align && !align) || t.align === align} onClick={()=>update({align:String(align)||undefined})}>{Icon&&typeof Icon!=='string'?<Icon size={16} aria-hidden="true"/>:String(label)}</button>)}</div></fieldset>
    ) : (
      <label className="field"><span>Text alignment</span><select value={t.align||''} onChange={e=>update({align:e.target.value||undefined})}><option value="">Theme default</option><option>left</option><option>center</option><option>right</option></select></label>
    )}
    <div className="type-dual-row">
      <UnitField label="Line height" placeholder={target==='heading'?'1.15':'1.65'} value={t.lineHeight} clear={()=>update({lineHeight:undefined})} min={1} max={2.5} step={0.05} change={lineHeight=>update({lineHeight})}/>
      <UnitField label="Letter spacing" unit="px" placeholder="0" value={t.tracking} clear={()=>update({tracking:undefined})} min={-3} max={10} step={0.1} change={tracking=>update({tracking})}/>
    </div>
    <ColorField key={target} compact={compact} color={t.color} change={color=>update({color})}/>
    {compact && <p className="helper-text">Overrides apply only to this section.</p>}
    <button className={compact?"refined-reset":"reset-style"} onClick={()=>change({...value,[target]:undefined})}><RotateCcw size={16} aria-hidden="true"/>Reset {target==='heading'?'heading':'body'} style</button>
  </div>;
}

export function SpacingField({label,value,max,change}:{label:string;value?:number;max:number;change:(value:number|undefined)=>void}) {
  const scope=useEditScope();
  return <label className="spacing-field"><span>{label}</span><span className="unit-input"><input aria-label={label} type="number" min={0} max={max} value={value??''} placeholder="Theme" {...scope} onChange={event=>change(event.target.value===''?undefined:Math.max(0,Math.min(max,Number(event.target.value))))}/><small>px</small></span></label>;
}

/** Shared spacing pair used by refined style panels; section-specific extras pass as children. */
export function RefinedSpacingGroup({
  gapLabel,
  gap,
  padding,
  showGap = true,
  settings,
  onChange,
  children,
}: {
  gapLabel: string;
  gap?: number;
  padding?: number;
  showGap?: boolean;
  settings: SectionSettings;
  onChange: (settings: SectionSettings) => void;
  children?: ReactNode;
}) {
  return (
    <>
      {showGap && <SpacingField label={gapLabel} value={gap} max={80} change={next => onChange({...settings, gap: next})} />}
      <SpacingField label="Top and bottom" value={padding} max={160} change={next => onChange({...settings, padding: next})} />
      {children}
    </>
  );
}
