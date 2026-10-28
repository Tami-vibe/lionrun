import {useState, type CSSProperties, type ReactNode} from 'react';
import {Columns} from '../columns';
import {MediaView} from '../../media/library';
import type {BlockItem} from '../blocks';
import {
  galleryDuration,
  galleryFeaturedCount,
  galleryGridRows,
  galleryMotion,
  galleryPauseHover,
  galleryRows,
  galleryScale,
  galleryTrack,
  galleryWidth
} from '../about-model';
import {SectionHeading} from './elements';
import type {SectionProps} from './index';
import {layoutContract} from '../layout-contract';

function GalleryFrame({item, editable, dimmed, clone}: {item: BlockItem; editable: boolean; dimmed: boolean; clone?: boolean}) {
  const name = item.media?.alt?.trim() || item.caption?.trim() || item.title.trim() || 'Gallery photo';
  return (
    <figure
      className={dimmed ? 'gal-frame is-dimmed' : 'gal-frame'}
      data-gallery-group={item.group || ''}
      aria-hidden={clone || undefined}
    >
      {item.media?.src ? <MediaView value={item.media} editable={editable && !clone} /> : <span className="gal-empty">{name.slice(0, 1)}</span>}
    </figure>
  );
}

function MarqueeRow({items, reverse, looping, editable, activeGroup, label}: {
  items: BlockItem[];
  reverse?: boolean;
  looping: boolean;
  editable: boolean;
  activeGroup: string;
  label: string;
}) {
  if (!items.length) return null;
  const track = looping ? galleryTrack(items) : items;
  const frame = (item: BlockItem, index: number, clone: boolean) => (
    <GalleryFrame
      key={`${clone ? 'clone' : 'live'}-${item.media?.src || item.title}-${index}`}
      item={item}
      editable={editable}
      dimmed={!!activeGroup && item.group !== activeGroup}
      clone={clone}
    />
  );
  const className = ['gallery-row', looping ? 'is-loop' : '', reverse ? 'is-reverse' : ''].filter(Boolean).join(' ');
  return (
    <div className={className} aria-label={label}>
      {track.map((item, index) => frame(item, index, false))}
      {looping && track.map((item, index) => frame(item, index, true))}
    </div>
  );
}

export function AboutSection({block, editable, selected, change}: SectionProps) {
  const c = block.content;
  const contract = layoutContract('about', block.layout);
  const [group, setGroup] = useState('');
  const groups = Array.from(new Set(c.items.map(item => item.group).filter((name): name is string => !!name)));
  const activeGroup = groups.includes(group) ? group : '';
  const sliding = block.layout === 'Sliding gallery';
  const story = block.layout === 'Story and photos';
  const photosOnly = block.layout === 'Photos only';
  const motion = galleryMotion(c.galleryMotion);
  const looping = sliding && motion === 'loop';
  const width = galleryWidth(c.galleryWidth);
  const scale = galleryScale(c.galleryScale);
  const pauseHover = galleryPauseHover(c.galleryPauseHover);
  const duration = galleryDuration(c.gallerySpeed);
  const [rowOne, rowTwo] = galleryRows(c.items);
  const filtered = activeGroup ? c.items.filter(item => item.group === activeGroup) : c.items;
  const gridRows = galleryGridRows(c.galleryRows);
  const cols = Math.max(1, Math.min(4, block.settings.columns || contract.grid?.defaultCols || 2));
  const gridCap = cols * gridRows;
  const gridItems = photosOnly ? filtered.slice(0, gridCap) : filtered;
  const featuredCount = galleryFeaturedCount(c.storyFeatured ?? contract.storyFeatured);
  const featured = filtered.filter(item => item.media?.src).slice(0, featuredCount);
  const style = {
    '--gal-scale': String(scale),
    '--gallery-duration': `${duration}s`,
    ...(block.settings.gap !== undefined ? {'--gallery-gap': `${block.settings.gap}px`} : {})
  } as CSSProperties;

  let slidingBody: ReactNode = null;
  if (sliding) {
    slidingBody = (
      <div
        className="about-gallery-container"
        data-gallery-width={width}
        data-gallery-marquee={looping ? '' : undefined}
      >
        <MarqueeRow items={rowOne} looping={looping} editable={editable} activeGroup={activeGroup} label="Gallery row 1" />
        <MarqueeRow items={rowTwo} reverse looping={looping} editable={editable} activeGroup={activeGroup} label="Gallery row 2" />
      </div>
    );
  }

  const filters = groups.length > 0 && (
    <div className="gallery-filters" role="group" aria-label="Photo groups">
      {['', ...groups].map(name => (
        <button key={name || 'all'} type="button" aria-pressed={activeGroup === name} data-gallery-filter={name} onClick={event => { event.stopPropagation(); setGroup(name); }}>
          {name || c.allPhotosLabel || 'All photos'}
        </button>
      ))}
    </div>
  );

  return (
    <div
      data-gallery
      data-gallery-layout={block.layout}
      data-gallery-motion={sliding ? motion : undefined}
      data-gallery-pause-hover={sliding && pauseHover ? 'true' : sliding ? 'false' : undefined}
      style={sliding ? style : undefined}
    >
      {sliding && <SectionHeading content={c} />}
      {filters}
      {sliding ? slidingBody : story ? (
        <Columns className="block-grid about-story" value={{...block.settings, columns: 2, widths: block.settings.widths?.length === 2 ? block.settings.widths : [48, 52]}} editable={editable && selected} onChange={change}>
          <SectionHeading content={c} />
          <div className={`about-story-media count-${Math.max(1, featured.length || 1)}`}>
            {featured.length ? featured.map((item, i) => (
              <figure key={`${item.media?.src}-${i}`}>
                {item.media?.src && <MediaView value={item.media} editable={editable} />}
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            )) : editable && <p className="helper-text" data-editor-only>Add gallery photos in Content.</p>}
          </div>
        </Columns>
      ) : (
        <>
          <Columns className="block-grid photo-gallery" value={{...block.settings, columns: cols}} editable={editable && selected} onChange={change}>
            {gridItems.map((item, i) => (
              <figure key={i} data-gallery-group={item.group || ''}>
                {item.media?.src && <MediaView value={item.media} editable={editable} />}
                <figcaption>{item.caption}</figcaption>
              </figure>
            ))}
          </Columns>
          {photosOnly && editable && filtered.length > gridCap && (
            <p className="gallery-overflow hint" data-editor-only>{`Showing ${gridCap} of ${filtered.length} photos. Raise rows or columns in Style to show more.`}</p>
          )}
        </>
      )}
    </div>
  );
}
