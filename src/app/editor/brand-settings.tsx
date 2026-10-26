"use client";
import {headerLook, fontPairs, normalizeBrandKit, type BrandKit, type BrandLineWidth, type BrandRadius, type FontPairId} from "./settings";
import type {Site} from "../site/blocks";
import {normalizeEyebrowStyle, type EyebrowStyle} from "../site/blocks";

export type BrandSitePatch = Partial<Pick<Site, "theme" | "accent" | "eyebrowStyle" | "headerStyle" | "footerStyle" | "brandKit">>;

export function BrandSettings({site, change}:{site:Site; change:(patch:BrandSitePatch)=>void}) {
  const kit = normalizeBrandKit(site.brandKit);
  const eyebrow = normalizeEyebrowStyle(site.eyebrowStyle);
  const setKit = (patch: Partial<BrandKit>) => change({brandKit: normalizeBrandKit({...kit, ...patch})});
  return (
    <div className="brand-settings" aria-label="Website brand">
      <div className="field" role="group" aria-label="Font pair">
        <span>Font pair</span>
        <div className="brand-font-grid">
          {(Object.keys(fontPairs) as FontPairId[]).map(id => {
            const pair = fontPairs[id];
            return (
              <button
                type="button"
                key={id}
                className={kit.fontPair === id ? "choice-active" : ""}
                aria-pressed={kit.fontPair === id}
                onClick={() => setKit({fontPair: id})}
                style={{["--brand-display" as string]: `var(${pair.displayVar})`, ["--brand-text" as string]: `var(${pair.textVar})`}}
              >
                <strong style={{fontFamily: "var(--brand-display), sans-serif"}}>{pair.display}</strong>
                <span style={{fontFamily: "var(--brand-text), sans-serif"}}>{pair.text}</span>
                <em>{pair.label}</em>
              </button>
            );
          })}
        </div>
      </div>

      <div className="field" role="group" aria-label="Website appearance">
        <span>Light or dark</span>
        <div className="choice-group">
          <button type="button" className={site.theme === "paper" ? "choice-active" : ""} aria-pressed={site.theme === "paper"} onClick={() => change({theme: "paper"})}>Light</button>
          <button type="button" className={site.theme !== "paper" ? "choice-active" : ""} aria-pressed={site.theme !== "paper"} onClick={() => change({theme: "midnight"})}>Dark</button>
        </div>
      </div>

      <label className="field">
        <span>Accent color</span>
        <div className="color-input">
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(site.accent || "") ? site.accent! : "#5878f5"} onChange={e => change({accent: e.target.value})}/>
          <code>{site.accent}</code>
        </div>
      </label>

      <div className="field" role="group" aria-label="Section label style">
        <span>Section label style</span>
        <div className="choice-group">
          {(["pill", "line"] as EyebrowStyle[]).map(style => (
            <button type="button" key={style} className={eyebrow === style ? "choice-active" : ""} aria-pressed={eyebrow === style} onClick={() => change({eyebrowStyle: style})}>
              {style === "pill" ? "Pill" : "Line"}
            </button>
          ))}
        </div>
      </div>

      <div className="field" role="group" aria-label="Corners">
        <span>Corners</span>
        <div className="choice-group">
          {([["sharp", "Sharp"], ["soft", "Soft"], ["pill", "Pill"]] as [BrandRadius, string][]).map(([id, label]) => (
            <button type="button" key={id} className={kit.radius === id ? "choice-active" : ""} aria-pressed={kit.radius === id} onClick={() => setKit({radius: id})}>{label}</button>
          ))}
        </div>
      </div>

      <div className="field" role="group" aria-label="Line thickness">
        <span>Line thickness</span>
        <div className="choice-group">
          {([["1", "Thin"], ["1.5", "Medium"], ["2", "Bold"]] as [BrandLineWidth, string][]).map(([id, label]) => (
            <button type="button" key={id} className={kit.lineWidth === id ? "choice-active" : ""} aria-pressed={kit.lineWidth === id} onClick={() => setKit({lineWidth: id})}>{label}</button>
          ))}
        </div>
      </div>

      <div className="field" role="group" aria-label="Header look">
        <span>Header look</span>
        <div className="choice-group">
          {([["standard", "Standard"], ["pill", "Pill"], ["rounded", "Rounded"]] as const).map(([id, label]) => (
            <button type="button" key={id} className={headerLook(site.headerStyle) === id ? "choice-active" : ""} aria-pressed={headerLook(site.headerStyle) === id} onClick={() => change({headerStyle: id})}>{label}</button>
          ))}
        </div>
      </div>

      <div className="field" role="group" aria-label="Footer look">
        <span>Footer look</span>
        <div className="choice-group">
          <button type="button" className={site.footerStyle !== "minimal" ? "choice-active" : ""} aria-pressed={site.footerStyle !== "minimal"} onClick={() => change({footerStyle: "columns"})}>Columns</button>
          <button type="button" className={site.footerStyle === "minimal" ? "choice-active" : ""} aria-pressed={site.footerStyle === "minimal"} onClick={() => change({footerStyle: "minimal"})}>Minimal</button>
        </div>
      </div>
    </div>
  );
}
