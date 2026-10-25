import {useId, useState} from 'react';
import {ChevronDown, Grid2X2, MoveVertical, RotateCcw, SlidersHorizontal, Type} from 'lucide-react';
import type {Block, BlockContent} from '../site/blocks';
import {equalWidths, normalizeSettings, resizeWidth, type SectionSettings} from './settings';
import {SpacingField, TypographyControls} from './inspector';
import {Choice} from './fields';

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
  const base = useId();
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
    <div className="refined-inspector">
      {groups.map(({id, label, icon: Icon}) => (
        <section className="refined-group" key={id}>
          <h3>
            <button
              type="button"
              className="refined-toggle"
              id={`${base}-${id}-heading`}
              aria-expanded={open === id}
              aria-controls={`${base}-${id}`}
              onClick={event => {
                setOpen(open === id ? '' : id);
                event.currentTarget.scrollIntoView({block: 'nearest'});
              }}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
              <ChevronDown size={16} className="refined-chevron" aria-hidden="true" />
            </button>
          </h3>
          {open === id && (
            <div className="refined-body" id={`${base}-${id}`} role="region" aria-labelledby={`${base}-${id}-heading`}>
              {id === 'layout' && (
                <>
                  <fieldset className="layout-options">
                    <legend>Section layout</legend>
                    {[
                      {layout: 'Text and photo', name: 'Text + media', renderSketch: () => <SchematicTextMedia />},
                      {layout: 'Promise band', name: 'Promise band', renderSketch: () => <SchematicPromiseBand />},
                      {layout: 'Photo and reasons', name: 'Media + reasons', renderSketch: () => <SchematicMediaReasons />}
                    ].map(({layout, name, renderSketch}) => (
                      <label key={layout} className="layout-option" data-selected={block.layout === layout}>
                        <input
                          type="radio"
                          name={`${base}-layout`}
                          checked={block.layout === layout}
                          value={layout}
                          onChange={() => changeLayout(layout)}
                        />
                        {renderSketch()}
                        <span>{name}</span>
                      </label>
                    ))}
                  </fieldset>

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
                                onClick={() => {
                                  const nextWidths = firstIsMedia ? [38, 62] : [62, 38];
                                  changeSettings({...value, widths: nextWidths});
                                }}
                              >
                                <svg width="48" height="28" viewBox="0 0 48 28" fill="none" aria-hidden="true">
                                  <rect width="48" height="28" rx="4" fill="#f1f5f9" />
                                  <rect x="4" y="6" width="24" height="16" rx="2" fill="#cbd5e1" />
                                  <rect x="7" y="10" width="18" height="2" rx="1" fill="#94a3b8" />
                                  <rect x="7" y="14" width="14" height="2" rx="1" fill="#94a3b8" />
                                  <rect x="31" y="6" width="13" height="16" rx="2" fill="#cbd5e1" />
                                </svg>
                                <span>More text</span>
                              </button>

                              <button
                                type="button"
                                className={`balance-card ${isEqual ? 'is-selected' : ''}`}
                                aria-pressed={isEqual}
                                onClick={() => changeSettings({...value, widths: [50, 50]})}
                              >
                                <svg width="48" height="28" viewBox="0 0 48 28" fill="none" aria-hidden="true">
                                  <rect width="48" height="28" rx="4" fill="#f1f5f9" />
                                  <rect x="4" y="6" width="18" height="16" rx="2" fill="#cbd5e1" />
                                  <rect x="6" y="10" width="14" height="2" rx="1" fill="#94a3b8" />
                                  <rect x="6" y="14" width="10" height="2" rx="1" fill="#94a3b8" />
                                  <rect x="26" y="6" width="18" height="16" rx="2" fill="#cbd5e1" />
                                </svg>
                                <span>Equal</span>
                              </button>

                              <button
                                type="button"
                                className={`balance-card ${isMoreMedia ? 'is-selected' : ''}`}
                                aria-pressed={isMoreMedia}
                                onClick={() => {
                                  const nextWidths = firstIsMedia ? [62, 38] : [38, 62];
                                  changeSettings({...value, widths: nextWidths});
                                }}
                              >
                                <svg width="48" height="28" viewBox="0 0 48 28" fill="none" aria-hidden="true">
                                  <rect width="48" height="28" rx="4" fill="#f1f5f9" />
                                  <rect x="4" y="6" width="13" height="16" rx="2" fill="#cbd5e1" />
                                  <rect x="6" y="10" width="9" height="2" rx="1" fill="#94a3b8" />
                                  <rect x="6" y="14" width="7" height="2" rx="1" fill="#94a3b8" />
                                  <rect x="20" y="6" width="24" height="16" rx="2" fill="#cbd5e1" />
                                </svg>
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
                <>
                  {!single && (
                    <SpacingField
                      label="Between columns"
                      value={gapVal}
                      max={80}
                      change={gap => changeSettings({...value, gap})}
                    />
                  )}
                  <SpacingField
                    label="Top and bottom"
                    value={padVal}
                    max={160}
                    change={padding => changeSettings({...value, padding})}
                  />

                  <div className="spacing-diagram-wrapper" aria-hidden="true">
                    <svg width="100%" height="144" viewBox="0 0 260 144" fill="none" className="spacing-diagram-svg">
                      <rect x="0.5" y="0.5" width="259" height="143" rx="8" fill="#f0f5ff" stroke="#bfdbfe" strokeDasharray="3 3" />

                      {/* Top spacing guide */}
                      <line x1="130" y1="6" x2="130" y2="34" stroke="#2563eb" strokeWidth="1.25" />
                      <path d="M127.5 9.5 L130 6 L132.5 9.5" stroke="#2563eb" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M127.5 30.5 L130 34 L132.5 30.5" stroke="#2563eb" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      <text x="136" y="24" fill="#2563eb" fontSize="11" fontWeight="600" fontFamily="var(--editor-font)">
                        {padVal}px
                      </text>

                      {single ? (
                        <g>
                          <rect x="18" y="40" width="224" height="64" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                          <rect x="30" y="54" width="40" height="3.5" rx="1.75" fill="#94a3b8" />
                          <rect x="30" y="62" width="60" height="2.5" rx="1.25" fill="#cbd5e1" />
                          <rect x="100" y="54" width="40" height="3.5" rx="1.75" fill="#94a3b8" />
                          <rect x="100" y="62" width="60" height="2.5" rx="1.25" fill="#cbd5e1" />
                          <rect x="170" y="54" width="40" height="3.5" rx="1.75" fill="#94a3b8" />
                          <rect x="170" y="62" width="60" height="2.5" rx="1.25" fill="#cbd5e1" />
                        </g>
                      ) : (
                        <g>
                          {/* Left Card: Text */}
                          <rect x="18" y="40" width="88" height="64" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                          <rect x="28" y="54" width="48" height="4" rx="2" fill="#94a3b8" />
                          <rect x="28" y="63" width="68" height="3" rx="1.5" fill="#cbd5e1" />
                          <rect x="28" y="70" width="56" height="3" rx="1.5" fill="#cbd5e1" />
                          <rect x="28" y="77" width="40" height="3" rx="1.5" fill="#cbd5e1" />

                          {/* Horizontal gap guide */}
                          <line x1="108" y1="72" x2="152" y2="72" stroke="#2563eb" strokeWidth="1.25" />
                          <path d="M111.5 69.5 L108 72 L111.5 74.5" stroke="#2563eb" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M148.5 69.5 L152 72 L148.5 74.5" stroke="#2563eb" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                          <text x="130" y="66" textAnchor="middle" fill="#2563eb" fontSize="10.5" fontWeight="600" fontFamily="var(--editor-font)">
                            {gapVal}px
                          </text>

                          {/* Right Card: Media */}
                          <rect x="154" y="40" width="88" height="64" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                          <circle cx="178" cy="56" r="4.5" fill="#cbd5e1" />
                          <path d="M166 88 L182 68 L194 80 L206 64 L226 88 Z" fill="#cbd5e1" />
                        </g>
                      )}

                      {/* Bottom spacing guide */}
                      <line x1="130" y1="110" x2="130" y2="138" stroke="#2563eb" strokeWidth="1.25" />
                      <path d="M127.5 113.5 L130 110 L132.5 113.5" stroke="#2563eb" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M127.5 134.5 L130 138 L132.5 134.5" stroke="#2563eb" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      <text x="136" y="128" fill="#2563eb" fontSize="11" fontWeight="600" fontFamily="var(--editor-font)">
                        {padVal}px
                      </text>
                    </svg>
                  </div>

                  <p className="helper-text">Applies to this section.</p>
                  <button
                    type="button"
                    className="refined-reset"
                    onClick={() => changeSettings({...value, gap: undefined, padding: undefined})}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    Reset spacing
                  </button>
                </>
              )}

              {id === 'typography' && (
                <TypographyControls compact value={value} change={changeSettings} target={target} setTarget={setTarget} />
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function SchematicTextMedia() {
  return (
    <svg width="52" height="30" viewBox="0 0 52 30" fill="none" aria-hidden="true" className="layout-svg">
      <rect width="52" height="30" rx="4" fill="#f1f5f9" />
      <rect x="6" y="8" width="16" height="3" rx="1.5" fill="#94a3b8" />
      <rect x="6" y="14" width="13" height="2.5" rx="1.25" fill="#cbd5e1" />
      <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="#cbd5e1" />
      <rect x="26" y="6" width="20" height="18" rx="2" fill="#cbd5e1" />
      <path d="M29 20 L34 14 L37 17 L40 13 L44 20 Z" fill="#94a3b8" />
    </svg>
  );
}

function SchematicPromiseBand() {
  return (
    <svg width="52" height="30" viewBox="0 0 52 30" fill="none" aria-hidden="true" className="layout-svg">
      <rect width="52" height="30" rx="4" fill="#f1f5f9" />
      <rect x="5" y="7" width="12" height="16" rx="2" fill="#cbd5e1" />
      <rect x="7" y="11" width="8" height="2" rx="1" fill="#94a3b8" />
      <rect x="7" y="15" width="6" height="2" rx="1" fill="#94a3b8" />
      <rect x="20" y="7" width="12" height="16" rx="2" fill="#cbd5e1" />
      <rect x="22" y="11" width="8" height="2" rx="1" fill="#94a3b8" />
      <rect x="22" y="15" width="6" height="2" rx="1" fill="#94a3b8" />
      <rect x="35" y="7" width="12" height="16" rx="2" fill="#cbd5e1" />
      <rect x="37" y="11" width="8" height="2" rx="1" fill="#94a3b8" />
      <rect x="37" y="15" width="6" height="2" rx="1" fill="#94a3b8" />
    </svg>
  );
}

function SchematicMediaReasons() {
  return (
    <svg width="52" height="30" viewBox="0 0 52 30" fill="none" aria-hidden="true" className="layout-svg">
      <rect width="52" height="30" rx="4" fill="#f1f5f9" />
      <rect x="6" y="6" width="18" height="18" rx="2" fill="#cbd5e1" />
      <path d="M8 20 L13 14 L16 17 L18 15 L22 20 Z" fill="#94a3b8" />
      <circle cx="29" cy="9" r="1.5" fill="#3b82f6" />
      <rect x="33" y="8" width="13" height="2" rx="1" fill="#94a3b8" />
      <circle cx="29" cy="15" r="1.5" fill="#3b82f6" />
      <rect x="33" y="14" width="13" height="2" rx="1" fill="#94a3b8" />
      <circle cx="29" cy="21" r="1.5" fill="#3b82f6" />
      <rect x="33" y="20" width="10" height="2" rx="1" fill="#94a3b8" />
    </svg>
  );
}

