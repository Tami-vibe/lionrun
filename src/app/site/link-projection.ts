import type {MenuPage} from './contracts';

export function linkedPage(pages: MenuPage[], href: string, pageId?: string | null) {
  const id = pageId || (/^\/\?page=/.test(href) ? new URLSearchParams(href.slice(2)).get('page') : null);
  return pages.find(p => id ? p.id === id : `/${p.slug}` === href);
}

type ProjectedLink = {
  linkTo: 'page' | 'section' | 'url';
  destination: string;
  pageId?: string | null;
};

export function projectMenuLinkHref(link: ProjectedLink): string {
  return link.linkTo === 'page' && link.pageId ? `/?page=${link.pageId}` : link.destination;
}

export function projectMenuLinkPageId(link: ProjectedLink, pages: MenuPage[] = []): string | undefined {
  return link.pageId || (link.linkTo === 'page' ? linkedPage(pages, link.destination)?.id : undefined);
}
