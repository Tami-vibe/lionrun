import type {MediaSettings} from '../media/model';
import {RangeControl} from './fields';

const RATIOS = ['16/9', '4/3', '1/1', '9/16', '21/9'] as const;

export function MediaFramingControls({media, onChange}:{media: MediaSettings; onChange:(patch: Partial<MediaSettings>)=>void}) {
  return <>
    <div className="stat-table">
      <span className="col">Shape</span><span className="col">Display</span>
      <select aria-label="Shape" value={media.ratio} onChange={event => onChange({ratio: event.target.value})}>{RATIOS.map(ratio => <option key={ratio}>{ratio}</option>)}</select>
      <select aria-label="Display" value={media.fit} onChange={event => onChange({fit: event.target.value as MediaSettings['fit']})}><option value="cover">Fill frame</option><option value="contain">Fit inside</option></select>
    </div>
    <RangeControl label="Zoom" min={0.25} max={4} step={0.05} value={media.zoom} text={`${Math.round(media.zoom * 100)}%`} onChange={zoom => onChange({zoom})}/>
    <RangeControl label="Horizontal position" min={0} max={100} step={1} value={media.x} text={`${media.x}%`} onChange={x => onChange({x})}/>
    <RangeControl label="Vertical position" min={0} max={100} step={1} value={media.y} text={`${media.y}%`} onChange={y => onChange({y})}/>
    <button type="button" onClick={() => onChange({zoom: 1, x: 50, y: 50})}>Reset framing</button>
  </>;
}

export function MediaVideoControls({media, posterLabel, onChange, onChoosePoster, showMuted=true, showMobileFallback=true, showMobilePosterHint=false}:{
  media: MediaSettings; posterLabel: string; onChange:(patch: Partial<MediaSettings>)=>void; onChoosePoster:()=>void;
  showMuted?: boolean; showMobileFallback?: boolean; showMobilePosterHint?: boolean;
}) {
  return <>
    {showMuted && <label className="switch-row"><span>Muted</span><input type="checkbox" role="switch" checked={media.muted} onChange={event => onChange({muted: event.target.checked})}/></label>}
    <label className="switch-row"><span>Loop</span><input type="checkbox" role="switch" checked={media.playback === 'loop'} onChange={event => onChange({playback: event.target.checked ? 'loop' : 'once'})}/></label>
    <label className="switch-row"><span>Autoplay</span><input type="checkbox" role="switch" checked={media.autoplay} onChange={event => onChange({autoplay: event.target.checked})}/></label>
    <p className="media-filename">{posterLabel}</p>
    <button type="button" onClick={onChoosePoster}>Choose poster</button>
    {showMobileFallback && <label className="field"><span>Mobile fallback</span><select aria-label="Mobile fallback" value={media.mobile} onChange={event => onChange({mobile: event.target.value as MediaSettings['mobile']})}><option value="same">Same media</option><option value="poster">Poster image</option><option value="hide">Hide media</option></select></label>}
    {showMobilePosterHint && media.mobile === 'poster' && !media.poster && <p className="helper-text" role="status">Choose a poster image for the mobile fallback.</p>}
  </>;
}
