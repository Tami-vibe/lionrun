import {Fragment, type CSSProperties} from 'react';
import {footerDefaults, footerTextStyle, footerRadius, footerHoverText,
  safeSocialUrl, socialMark, type FooterTarget} from '../footer-model';
import {buttonAppearance} from './elements';
import {MediaView} from '../../media/library';
import {Columns} from '../columns';
import {Icon} from './elements';
import {ButtonData} from '../blocks';
import type {SectionProps} from './index';
export function HeaderSection({block,site,link,labelFor,pages,homeId,parentIndex}:SectionProps) {
 const customLabels=site.menus?.some(menu=>menu.id===site.menuPlacement?.header);
 const buttons=<div className="header-actions">{(site.headerButtons||[{label:"Let's talk",href:`tel:${site.phone.replaceAll(' ','')}`,icon:'arrow'} as ButtonData]).slice(0,site.headerButtonCount??1).map((button,i)=><a key={i} className={`site-btn ${i?'site-btn-outline':'site-btn-primary'}`} style={buttonAppearance(button)} {...link(button.href)}>{button.label}<Icon name={button.icon}/></a>)}</div>;
 return <div className={`menu-frame menu-${site.headerStyle}`}><div className={`site-header header-${site.headerStyle}`}><a className="site-brand" {...link(`/${pages.find(p=>p.id===homeId)?.slug||'home'}`,homeId)}><span className="brand-mark">{block.content.media.src?<MediaView value={block.content.media} editable={false}/>:site.brand.trim().charAt(0).toUpperCase()||"N"}</span>{site.brand}</a><nav aria-label="Main navigation">{site.nav.map((name,i)=>{const href=site.navTargets?.[i]||['#services','#proof','#contact'][i]||'#contact',id=site.navPageIds?.[i],label=customLabels?name:labelFor(name,href,id),children=site.navChildren?.[i]||[];return children.length?<details className="menu-dropdown" key={i}><summary aria-current={parentIndex===i||link(href,id)['aria-current']?'page':undefined}>{label}<Icon name="arrow" size={10}/></summary><div><a {...link(href,id)}>{label} overview</a>{children.map((child,j)=><a key={j} {...link(child.href,child.pageId)}>{customLabels?child.label:labelFor(child.label,child.href,child.pageId)}</a>)}</div></details>:<a key={i} {...link(href,id)}>{label}</a>;})}</nav>{(site.headerStyle==='standard'||site.headerButtonPlace!=='beside')&&buttons}</div>{site.headerStyle!=='standard'&&site.headerButtonPlace==='beside'&&buttons}</div>;
}
export function FooterSection({block, site, editable, selected, change, link, pages}:SectionProps) {
  const config = block.content.footer;
  const legacy = footerDefaults(site.footerColumns?.[0]?.text || '');
  const footer = config || {...legacy, logoMode: 'none' as const};
  const columns = site.footerColumns || [];
  const headerLogo = site.blocks.find(item => item.type === 'header')?.content.media;
  const logo = footer.logoMode === 'header' ? headerLogo : footer.logo;
  const text = (target: FooterTarget, size = 14) => footerTextStyle(
    footer.text[target] || (target === 'heading' ? block.settings.heading :
      target === 'body' ? block.settings.body : undefined), size
  );
  const social = footer.showSocials && footer.socials.length > 0 && (
    <nav className="footer-socials" aria-label="Social media">
      {footer.socials.filter(item => safeSocialUrl(item.href)).map(item => (
        <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer"
          aria-label={item.label}>{socialMark(item.label)}</a>
      ))}
    </nav>
  );
  const brand = (
    <div className="footer-brand" data-align={footer.align} data-order={footer.order}
      style={{gap: footer.itemGap}}>
      {footer.logoMode !== 'none' && <div className="footer-brand-name">
        <span className="footer-logo">{logo?.src ? <MediaView value={logo}/> :
          site.brand.trim().charAt(0).toUpperCase()}</span>
        <strong style={text('heading')}>{columns[0]?.title || site.brand}</strong>
      </div>}
      {footer.showMotto && footer.motto && (
        <p className="footer-motto" style={text('motto', 16)}>{footer.motto}</p>
      )}
      {social}
    </div>
  );
  const schedule = footer.hoursReady && !footer.online && (
    <div className="footer-hours-grid" style={{
      ...text('hours'), rowGap: footer.text.hours?.rowGap || 0,
      marginLeft: ['center', 'right'].includes(footer.text.hours?.align || '')
        ? 'auto' : undefined,
      marginRight: footer.text.hours?.align === 'center' ? 'auto' : undefined,
    }}>
      {footer.hours.map(day => <Fragment key={day.day}>
        <span>{day.day}</span><span>{day.closed ? 'Closed' : `${day.open}–${day.close}`}</span>
      </Fragment>)}
    </div>
  );
  const visible = footer.layout === 'hours' ? Math.max(4, block.settings.columns || 4)
    : config ? block.settings.columns || 3 : columns.length;
  const shown = columns.slice(0, visible)
    .filter(column => column.kind !== 'hours' || !footer.online);
  const gridCount = footer.online ? Math.max(1, Math.min(visible, shown.length)) : visible;
  const background = site.theme === 'midnight' ? '#1d242c' : '#fafafc';
  const foreground = footer.text.bottom?.color
    || (site.theme === 'midnight' ? '#f0f3fa' : '#252938');
  const vars = {
    '--footer-hover-radius': `${footerRadius(footer.hoverShape, site.headerStyle)}px`,
    '--footer-hover-padding': `${footer.hoverPadding}px`,
    '--footer-hover-text': footerHoverText(foreground, background),
  } as CSSProperties;
  return <div className="footer-design" data-layout={footer.layout} style={vars}>
    {block.content.media.src && <MediaView value={block.content.media} editable={editable}/>}
    {['social', 'stack'].includes(footer.layout) ? brand : footer.layout !== 'bottom' && (
      <Columns value={{...block.settings, columns: gridCount}} className="footer-columns"
        editable={editable && selected} onChange={change}>
        {shown.map((column, i) => <div key={i} className="footer-column">
          {config && i === 0 ? brand : <>
            <strong style={text('heading')}>{column.title}</strong>
            {column.text && <p style={text('body')}>{column.text}</p>}
          </>}
          {column.kind === 'hours' && schedule}
          {column.links.length > 0 && <nav className="footer-column-links"
            aria-label={column.title || `Footer column ${i + 1}`}
            style={{gap: footer.text.body?.rowGap || 0, alignItems:
              footer.text.body?.align === 'center' ? 'center'
                : footer.text.body?.align === 'right' ? 'flex-end' : 'flex-start'}}>
            {column.links.map((item, j) => {
              const missing = item.pageId && !pages.some(page => page.id === item.pageId);
              return <a key={j} style={text('body')} aria-disabled={missing || undefined}
                {...(missing ? {} : link(item.href, item.pageId))}>{item.label}</a>;
            })}
          </nav>}
        </div>)}
        {footer.layout === 'hours' && !shown.some(c => c.kind === 'hours') && !footer.online && (
          <div className="footer-column">
            <strong style={text('heading')}>{footer.hoursTitle}</strong>{schedule}
          </div>
        )}
      </Columns>
    )}
    <div className="footer-bottom" data-align={footer.bottomAlign}>
      <p style={text('bottom', 12)}>{block.content.note}</p>
      <nav aria-label="Footer bottom links" data-hover={footer.hover}
        style={{gap: footer.text.bottom?.rowGap ?? 4}}>
        {footer.bottomLinks.map(item => {
          const missing = item.pageId && !pages.some(page => page.id === item.pageId);
          return <a key={item.id} style={text('bottom', 12)}
            aria-disabled={missing || undefined}
            {...(missing ? {} : link(item.href, item.pageId))}>{item.label}</a>;
        })}
      </nav>
    </div>
  </div>;
}
