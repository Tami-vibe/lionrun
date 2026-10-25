import {useState} from 'react';
import {fonts,normalizeSettings,resizeWidth,equalWidths,SectionSettings,TextStyle} from './settings';
import {useEditScope} from './fields';
export function LayoutControls({value,change,max=5,min=1,legend='Columns'}:{value:SectionSettings;change:(s:SectionSettings)=>void;max?:number;min?:number;legend?:string}) {
  const s=normalizeSettings(value),count=Math.max(min,Math.min(max,s.columns||min));
  return <><p className="settings-hint">{max>1?"Choose a layout, then adjust its widths. All items are kept when you change the column count.":"Adjust the space around this section. Its available layout choices appear below."}</p>
    {max>1&&<><fieldset className="column-presets"><legend>{legend}</legend>{Array.from({length:max-min+1},(_,i)=>min+i).map(n=><button key={n} aria-label={`${n} ${legend==='Steps'?'step':'column'}${n===1?'':'s'}`} aria-pressed={count===n} onClick={()=>change({...s,columns:n,widths:equalWidths(n)})}><span aria-hidden="true">{Array.from({length:n},(_,j)=><i key={j}/>)}</span>{n}</button>)}</fieldset>
      <div className="width-fields">{s.widths!.map((n,i)=><label key={i}>Column {i+1} %<input aria-label={`Column ${i+1} width percent`} type="number" min="10" max={100-10*(s.columns!-1)} step="1" value={Math.round(n*10)/10} disabled={s.columns===1} onChange={e=>change({...s,widths:resizeWidth(s.widths!,i,Number(e.target.value))})}/></label>)}</div>
      <p className="settings-hint">Columns become two on tablets and one on phones. You can also drag dividers on the desktop canvas.</p></>}
    {max>1&&<NumberField label="Space between columns (px)" value={s.gap!} min={0} max={80} change={gap=>change({...s,gap})}/>}
    <NumberField label="Top and bottom space (px)" value={s.padding??72} min={0} max={160} change={padding=>change({...s,padding})}/>
  </>;
}
function NumberField({label,value,min,max,step=1,change}:{label:string;value:number;min:number;max:number;step?:number;change:(n:number)=>void}) {
  const scope=useEditScope();
  return <label className="field"><span>{label}</span><input type="number" min={min} max={max} step={step} value={value} {...scope} onChange={e=>{if(e.target.value!=='')change(Math.max(min,Math.min(max,Number(e.target.value))));}}/></label>;
}
function ColorField({color,change}:{color?:string;change:(value:string|undefined)=>void}) {
  const [draft,setDraft]=useState(color||'');
  const scope=useEditScope();
  const valid=!draft||/^#[0-9a-f]{6}$/i.test(draft);
  return <div className="field"><span>Text color</span><div className="color-input"><input aria-label="Text color picker" type="color" value={color||'#f3f6fc'} {...scope} onInput={e=>change(e.currentTarget.value)} onChange={e=>change(e.target.value)}/><input aria-label="Text color hex" placeholder="Theme default" value={draft} maxLength={7} aria-invalid={!valid} {...scope} onChange={e=>{const next=e.target.value;setDraft(next);if(!next||/^#[0-9a-f]{6}$/i.test(next))change(next||undefined);}}/></div><small>{valid?(color||'Using theme color'):'Enter # and six color digits, such as #ccbb99.'}</small></div>;
}
export function TypographyControls({value,change,target,setTarget}:{value:SectionSettings;change:(s:SectionSettings)=>void;target:'heading'|'body';setTarget:(s:'heading'|'body')=>void}) {
  const s=normalizeSettings(value),t=s[target]!,update=(patch:TextStyle)=>change({...value,[target]:{...t,...patch}});
  return <><label className="field"><span>Text to style</span><select value={target} onChange={e=>setTarget(e.target.value as 'heading'|'body')}><option value="heading">Headings</option><option value="body">Body text</option></select></label>
    <p className="settings-hint">Use a clear heading and comfortable body text. Start with the theme defaults.</p>
    <label className="field"><span>Font family</span><select value={t.family||''} onChange={e=>update({family:e.target.value||undefined})}><option value="">Theme default</option>{Object.keys(fonts).map(f=><option key={f} value={f}>{({display:'Display',text:'Text'})[f as keyof typeof fonts]}</option>)}</select></label>
    <NumberField label="Font size (px)" value={t.size??(target==='heading'?40:16)} min={10} max={96} change={size=>update({size})}/>
    <label className="field"><span>Font weight</span><select value={t.weight||''} onChange={e=>update({weight:Number(e.target.value)||undefined})}><option value="">Theme default</option>{[300,400,500,600,700,800,900].map(n=><option key={n} value={n}>{n===400?'Regular':n===700?'Bold':n}</option>)}</select></label>
    <label className="field"><span>Text alignment</span><select value={t.align||''} onChange={e=>update({align:e.target.value||undefined})}><option value="">Theme default</option><option>left</option><option>center</option><option>right</option></select></label>
    <NumberField label="Line height" value={t.lineHeight??(target==='heading'?1.15:1.65)} min={1} max={2.5} step={0.05} change={lineHeight=>update({lineHeight})}/>
    <NumberField label="Letter spacing (px)" value={t.tracking??0} min={-3} max={10} step={0.1} change={tracking=>update({tracking})}/>
    <ColorField key={`${target}-${t.color||'theme'}`} color={t.color} change={color=>update({color})}/>
    <button className="reset-style" onClick={()=>change({...value,[target]:undefined})}>Reset {target==='heading'?'heading':'body'} style</button>
  </>;
}
