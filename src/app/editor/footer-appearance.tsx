'use client';
import {AlignCenter, AlignLeft, AlignRight, Bold, CaseSensitive, CaseUpper, MoveHorizontal, Rows3, Type} from 'lucide-react';
import type {ReactNode} from 'react';
import type {Block, Site} from '../site/blocks';
import {footerLayouts, type FooterConfig, type FooterTarget, type FooterText} from '../site/footer-model';
import {SidebarSelect as Choice, UnitField, ColorField} from './components/fields';
const targets: {value: FooterTarget; label: string}[] = [
  {value: 'heading', label: 'Titles'}, {value: 'body', label: 'Text & links'},
  {value: 'motto', label: 'Motto'}, {value: 'bottom', label: 'Bottom row'},
  {value: 'hours', label: 'Opening hours'},
];
const alignments = [
  {value: 'left', label: 'Left', icon: AlignLeft},
  {value: 'center', label: 'Center', icon: AlignCenter},
  {value: 'right', label: 'Right', icon: AlignRight},
] as const;
export function Alignment({value, change, label}: {
  value: string; label: string; change: (value: 'left' | 'center' | 'right') => void;
}) {
  return <div className="field" role="group" aria-label={label}>
    <span>{label}</span><div className="choice-group">
      {alignments.map(({value: next, label: text, icon: Glyph}) => (
        <button type="button" key={next} aria-pressed={value === next}
          onClick={() => change(next)}><Glyph size={16} aria-hidden="true"/>{text}</button>
      ))}
    </div>
  </div>;
}

const number = (label: ReactNode, value: number, change: (n: number) => void, min: number, max: number, step = 1) => <UnitField label={label} value={value} change={change} min={min} max={max} step={step}/>;
type Props = {block: Block; site: Site; config: FooterConfig; target: FooterTarget; setTarget: (target: FooterTarget) => void; text: FooterText; textWrite: (patch: Partial<FooterText>) => void; write: (patch: Partial<FooterConfig>) => void; settings: (patch: Partial<Block['settings']>) => void; selectLayout: (layout: FooterConfig['layout']) => void; setColumnCount: (count: number) => void; widths: number[]};
export function FooterAppearance({block, site, config, target, setTarget, text, textWrite, write, settings, selectLayout, setColumnCount, widths}: Props) {
  const title = targets.find(item => item.value === target)!.label;
  return <>
      <h3>Layout</h3><div className="footer-layout-options" aria-label="Footer layout">
        {footerLayouts.map(layout => <button type="button" key={layout.id}
          aria-pressed={config.layout === layout.id} onClick={() => selectLayout(layout.id)}>
          <span className={`footer-thumbnail is-${layout.id}`} aria-hidden="true">
            <span><i/><i/><i/><i/></span><b/>
          </span><span>{layout.label}</span><i className="footer-radio"/>
        </button>)}
      </div>
      {['standard', 'hours'].includes(config.layout) && <details className="footer-advanced">
        <summary>Columns & spacing</summary>
        {number('Visible columns', block.settings.columns || 3, setColumnCount, 1, 5)}
        <div className="footer-control-pair">
          {widths.map((width, i) =>
            <UnitField key={i} label={`Column ${i + 1} width`} min={10} max={100} value={Math.round(width)} change={value => settings({widths: widths.map((n, j) => i === j ? value : n)})}/>)}
        </div>
        <p className="helper-text">Widths are balanced to fill the row.</p>
        {number('Column gap (px)', block.settings.gap ?? 24, gap => settings({gap}), 0, 80)}
        {number('Vertical space (px)', block.settings.padding ?? 48,
          padding => settings({padding}), 0, 160)}
      </details>}
      <h3>Typography</h3><Choice label="Text to style" value={target}
        options={targets} onChange={setTarget}/>
      <h4>Editing: {title}</h4>
      <Choice label="Font" value={text.family || 'text'}
        options={[{value: 'text', label: 'Website text'},
          {value: 'display', label: 'Website heading'}, {value: 'system', label: 'System'}]}
        onChange={family => textWrite({family})}/>
      <div className="footer-control-pair">
        {number(`${title} size (px)`,
          text.size ?? (target === 'bottom' ? 12 : target === 'motto' ? 16 : 14),
          size => textWrite({size}), 10, 96)}
        {number('Line height', text.lineHeight ?? 1.5,
          lineHeight => textWrite({lineHeight}), 1, 2.5, .1)}
      </div>
      <label className="field"><span><Bold size={15}/>Font weight</span>
        <select value={text.weight || (target === 'heading' ? 600 : 400)}
          onChange={event => textWrite({weight: +event.target.value})}>
          {[['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold']]
            .map(([weight, label]) => <option value={weight} key={weight}>{label}</option>)}
        </select>
      </label>
      <div className="footer-control-pair">
        {number(<><MoveHorizontal size={15}/>Letter spacing (px)</>, text.tracking ?? 0,
          tracking => textWrite({tracking}), -3, 10, .1)}
        {['body', 'hours', 'bottom'].includes(target)
          ? number(<><Rows3 size={15}/>Row spacing (px)</>, text.rowGap ?? 0,
            rowGap => textWrite({rowGap}), 0, 24)
          : number(<><Rows3 size={15}/>Item spacing (px)</>, config.itemGap,
            itemGap => write({itemGap}), 0, 48)}
      </div>
      <Alignment label="Text alignment" value={text.align || 'left'}
        change={align => textWrite({align})}/>
      <div className="field" role="group" aria-label="Letter case"><span>Letter case</span>
        <div className="choice-group">
          {[{value: 'none', label: 'As typed', icon: Type},
            {value: 'uppercase', label: 'CAPS', icon: CaseUpper},
            {value: 'capitalize', label: 'Title', icon: CaseSensitive}].map(item => (
            <button type="button" key={item.value}
              aria-pressed={(text.transform || 'none') === item.value}
              onClick={() => textWrite({transform: item.value as FooterText['transform']})}>
              <item.icon size={16} aria-hidden="true"/>{item.label}
            </button>
          ))}
        </div>
      </div>
      <ColorField label="Text color" value={text.color || (site.theme === 'midnight' ? '#f0f3fa' : '#252938')} onChange={color => textWrite({color})}/>
      <button type="button" onClick={() => textWrite({color: undefined})}>Use theme color</button>
      <h3>Bottom link hover</h3><Choice label="Appearance" value={config.hover}
        onChange={hover => write({hover})}
        options={[{value: 'match', label: 'Match Header'}, {value: 'text', label: 'Text only'}]}/>
      <details className="footer-advanced"><summary>Advanced</summary>
        <Choice label="Hover corners" value={config.hoverShape}
          onChange={hoverShape => write({hoverShape})}
          options={[{value: 'header', label: 'Use Header'}, {value: 'square', label: 'Square'},
            {value: 'rounded', label: 'Rounded'}, {value: 'pill', label: 'Pill'}]}/>
        {number('Hover side padding (px)', config.hoverPadding,
          hoverPadding => write({hoverPadding}), 8, 24)}
      </details>

  </>;
}
