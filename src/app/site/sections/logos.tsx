import {useState, type CSSProperties} from 'react';
import {useMediaLibrary} from '../../media/library';
import {mediaURL} from '../../media/model';
import type {BlockItem} from '../blocks';
import {SectionHeading, Icon} from './elements';
import type {SectionProps} from './index';
import {logoGap, logoScale} from '../logo-model';

function accessibleName(item: BlockItem) {
  return item.media?.alt?.trim() || item.title.trim() || 'Logo';
}

function LogoMark({item, linked, link}: {item: BlockItem; linked: boolean; link: SectionProps['link']}) {
  const {resolve} = useMediaLibrary();
  const media = item.media;
  const stored = media?.src && media.kind !== 'video' && media.kind !== 'social' ? media.src : '';
  const resolved = stored ? resolve(stored) || (mediaURL(stored) ? stored : '') : '';
  const [broken, setBroken] = useState('');
  const src = resolved && broken !== resolved ? resolved : '';
  const name = accessibleName(item);
  const href = item.href?.trim() || '';
  const slot = (
    <span className="logo-slot">
      {src ? (
        // This node is copied into static HTML, where next/image cannot run.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="logo-picture" src={src} alt={linked && href ? '' : name} data-asset-src={stored} onError={() => setBroken(src)} />
      ) : (
        <strong>{item.title.trim() || 'Logo'}</strong>
      )}
    </span>
  );
  if (linked && href) return <a className="logo-item" {...link(href)} aria-label={name}>{slot}</a>;
  return <div className="logo-item">{slot}</div>;
}

export function LogosSection({block, editable, link}: SectionProps) {
  const c = block.content;
  const headed = block.layout === 'Heading and slider';
  const scrolling = block.layout === 'Scrolling row';
  const looping = scrolling && c.logoMotion !== 'still';
  const pauseHover = c.logoPauseHover !== false;
  const scale = logoScale(c.logoScale);
  const gap = logoGap(block.settings);
  const style = {'--logo-scale': String(scale), '--logo-gap': `${gap}px`} as CSSProperties;
  const marks = (linked: boolean) => c.items.map((item, index) => <LogoMark key={`${item.title}-${index}`} item={item} linked={linked} link={link} />);
  const head = headed ? (
    c.showHeading !== false && (
      <div className="logo-band-head">
        <div>
          {c.smallLabel && <span className="section-kicker">{c.smallLabel}</span>}
          <h2>{c.title}</h2>
          {c.description && <p className="section-lede">{c.description}</p>}
          {c.showBody && c.body?.trim() && <p className="section-body">{c.body}</p>}
        </div>
        <div className="logo-nav">
          <button type="button" className="logo-prev" data-logo-step="-1" aria-label="Previous logos" onClick={event => slideLogos(event.currentTarget, -1)}><Icon name="arrow" size={16} /></button>
          <button type="button" className="logo-next" data-logo-step="1" aria-label="Next logos" onClick={event => slideLogos(event.currentTarget, 1)}><Icon name="arrow" size={16} /></button>
        </div>
      </div>
    )
  ) : (
    <SectionHeading content={c} />
  );
  const row = scrolling ? (
    <div
      className="logo-window"
      data-logo-marquee={looping ? '' : undefined}
      data-logo-pause-hover={looping && pauseHover ? 'true' : looping ? 'false' : undefined}
    >
      <div className={`logo-track${looping ? ' is-loop' : ''}`}>
        <div className="logo-set">{marks(true)}</div>
        {looping && <div className="logo-set" aria-hidden="true">{marks(false)}</div>}
      </div>
    </div>
  ) : headed ? (
    <div className="logo-slider" data-logo-slider tabIndex={0} aria-label="Partner logos" onKeyDown={event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      slideLogos(event.currentTarget, event.key === 'ArrowRight' ? 1 : -1);
    }}>
      <div className="logo-set">{marks(true)}</div>
    </div>
  ) : (
    <div className="logo-still">{marks(true)}</div>
  );
  return (
    <div className={`logo-section${c.monochrome ? ' is-monochrome' : ''}`} data-logo-layout={block.layout} data-logo-slider={headed ? '' : undefined} data-logo-gap={gap} data-logo-scale={scale} style={style}>
      {head}
      {c.items.length ? row : editable && <p className="logo-empty" data-editor-only>Add logos in Content.</p>}
    </div>
  );
}

function slideLogos(node: HTMLElement, direction: number) {
  const root = node.closest('[data-logo-slider],.logo-section')?.querySelector('.logo-slider,.logo-set') || node.closest('.logo-slider');
  const scroller = (root as HTMLElement | null)?.closest('.logo-slider') || (root as HTMLElement | null);
  if (!scroller || !('scrollBy' in scroller)) return;
  scroller.scrollBy({left: direction * Math.max(160, scroller.clientWidth * 0.6), behavior: 'smooth'});
}
