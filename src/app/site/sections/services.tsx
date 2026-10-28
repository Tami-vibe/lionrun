import {Columns} from '../columns';
import {MediaView} from '../../media/library';
import type {MediaSettings} from '../../media/model';
import {servicePreviewCount} from '../service-model';
import {serviceId} from '../service-model';
import {SectionHeading, Icon} from './elements';
import type {SectionProps} from './index';

export function ServicesSection({block, editable, selected, change, pages, link, activeId, homeId, focusItem}: SectionProps) {
  const c = block.content;
  const photos = block.layout === 'Photo cards';
  const cap = servicePreviewCount(block.settings.columns);
  const visible = c.items.filter(item => !item.hidden);
  const preview = activeId === homeId && block.layout !== 'Price list' && visible.length > cap;
  const shown = preview ? visible.slice(0, cap) : visible;
  const catalogPage = pages.find(p => p.id === c.catalogPageId);
  const still = (media?: MediaSettings) => media?.kind === 'video' ? media.poster ? {...media, kind: 'image' as const, src: media.poster} : undefined : media;
  const card = (item: typeof c.items[number], i: number) => {
    const id = serviceId(item, i);
    const page = pages.find(p => p.id === item.pageId);
    const photo = photos ? still(item.media) : undefined;
    const focused = !!focusItem && focusItem === id;
    const body = (
      <div className="service-entry-copy">
        {photos ? (
          <div>
            <div className="service-entry-label"><Icon name={item.icon} size={20} /></div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {item.price && <strong className="service-price">{item.price}</strong>}
          </div>
        ) : (
          <>
            <div className="service-entry-label"><Icon name={item.icon} size={32} /></div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {item.price && <strong className="service-price">{item.price}</strong>}
          </>
        )}
        {page && (photos ? <span className={`service-go${c.arrowCircle === false ? '' : ' service-go-circle'}`}><Icon name="arrow" size={16} /></span> : <span className="service-more">{c.actionLabel || 'Learn more'}<Icon name="arrow" size={16} /></span>)}
      </div>
    );
    const media = photo?.src ? <><MediaView value={photo} background editable={editable} /><span className="service-shade" style={{opacity: (c.darkness ?? 64) / 100}} /></> : null;
    const className = `service-entry${focused ? ' is-service-focus' : ''}`;
    return page
      ? <a key={id} className={className} data-service-id={id} {...link(`/${page.slug}`, page.id)}>{media}{body}</a>
      : <article key={id} className={className} data-service-id={id}>{media}{body}</article>;
  };
  const more = preview && catalogPage ? <a className={photos ? 'site-btn site-btn-outline' : 'service-more'} {...link(`/${catalogPage.slug}`, catalogPage.id)}>See all services<Icon name="arrow" size={16} /></a> : null;
  return (
    <>
      <div className={`service-intro${photos ? ' service-photo-intro' : ''}`}>
        <SectionHeading content={c} />
        {photos && (!!c.note.trim() || more) && <div className="service-aside">{c.note.trim() && <p>{c.note}</p>}{more}</div>}
      </div>
      <Columns className={`block-grid services-layout${photos ? ' service-photo' : ''}${block.layout === 'Price list' ? ' service-price-list' : ''}`} value={block.settings} editable={editable && selected} onChange={change}>
        {shown.map(card)}
      </Columns>
      {!photos && more && <div className="service-all">{more}</div>}
    </>
  );
}
