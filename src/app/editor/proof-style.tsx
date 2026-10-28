import {useState} from 'react';
import {ChevronDown, Grid2X2, MoveVertical, RotateCcw, SlidersHorizontal, Type} from 'lucide-react';
import type {Block, BlockContent} from '../site/blocks';
import {equalWidths, normalizeSettings, resizeWidth, type SectionSettings} from './settings';
import {RefinedSpacingGroup, TypographyControls} from './inspector';
import {Choice} from './fields';
import {LayoutPicker, LayoutThumb} from './layout-picker';
import {RefinedStyleShell} from './refined-style-shell';

export function ProofStyle({
  block,
  changeLayout,
  changeSettings,
  change,
  onResetLayout
}: {
  onResetLayout: () => void;
  block: Block;
  changeLayout: (layout: string) => void;
  changeSettings: (settings: SectionSettings) => void;
  change: (patch: Partial<BlockContent>) => void;
}) {
  const [open, setOpen] = useState('layout');
  const [target, setTarget] = useState<'heading' | 'body'>('heading');
  const value = block.settings;
  const s = normalizeSettings(value);
  const single = block.layout === 'Promise band';
  const resetLayout = onResetLayout;
  const groups = [
    {id: 'layout', label: 'Layout', icon: Grid2X2},
    {id: 'spacing', label: 'Spacing', icon: MoveVertical},
    {id: 'typography', label: 'Typography', icon: Type}
  ];
  const padVal = value.padding ?? 72;
  const gapVal = s.gap ?? 24;
  const firstIsMedia = block.layout === 'Photo and reasons' && block.content.photoSide !== 'right';

  const textWidth = firstIsMedia ? s.widths![1] : s.widths![0];
  const mediaWidth = firstIsMedia ? s.widths![0] : s.widths![1];
  const isMoreText = textWidth >= 55;
  const isMoreMedia = mediaWidth >= 55;
  const isEqual = !isMoreText && !isMoreMedia;

  return (
    <RefinedStyleShell groups={groups} open={open} setOpen={setOpen}>
      {id => (
        <>
              {id === 'layout' && (
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

              {id === 'spacing' && (
                <RefinedSpacingGroup
                  gapLabel="Between columns"
                  gap={gapVal}
                  padding={padVal}
                  showGap={!single}
                  settings={value}
                  onChange={changeSettings}
                >
                  <button
                    type="button"
                    className="refined-reset"
                    onClick={() => changeSettings({...value, gap: undefined, padding: undefined})}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    Reset spacing
                  </button>
                </RefinedSpacingGroup>
              )}

              {id === 'typography' && (
                <TypographyControls compact value={value} change={changeSettings} target={target} setTarget={setTarget} />
              )}
        </>
      )}
    </RefinedStyleShell>
  );
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
